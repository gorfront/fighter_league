import { Router, Request, Response } from "express";
import { protect } from "../middleware/authMiddleware";
import Message from "../models/Message";
import BlockedUser from "../models/BlockedUser";
import MutedUser from "../models/MutedUser";
import { Op } from "sequelize";
import { ServerSocket } from "../socket/index";

const router = Router();

router.delete(
  "/conversations/:targetId",
  protect,
  async (req: Request, res: Response) => {
    try {
      const myId = req.user!.id;
      const targetId = parseInt(req.params.targetId);

      if (isNaN(targetId)) {
        return res.status(400).json({ message: "Invalid target ID" });
      }
      await Message.update(
        { deletedByReceiver: true },
        {
          where: {
            senderId: targetId,
            receiverId: myId,
          },
        }
      );

      await Message.update(
        { deletedBySender: true },
        {
          where: {
            senderId: myId,
            receiverId: targetId,
          },
        }
      );

      res.json({ success: true, message: "Conversation hidden successfully" });
    } catch (error) {
      console.error("Error hiding conversation:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

router.post("/mute", protect, async (req: Request, res: Response) => {
  try {
    const myId = req.user!.id;
    const { targetId } = req.body;

    if (!targetId)
      return res.status(400).json({ message: "Target ID required" });

    const existingMute = await MutedUser.findOne({
      where: { userId: myId, mutedUserId: targetId },
    });

    if (existingMute) {
      return res.status(200).json({ message: "User already muted" });
    }

    await MutedUser.create({
      userId: myId,
      mutedUserId: targetId,
    });

    console.log(`User ${myId} muted user ${targetId}`);
    res.json({ success: true, message: `User ${targetId} muted` });
  } catch (error) {
    console.error("Error muting user:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/unmute", protect, async (req: Request, res: Response) => {
  try {
    const myId = req.user!.id;
    const { targetId } = req.body;

    const deletedCount = await MutedUser.destroy({
      where: {
        userId: myId,
        mutedUserId: targetId,
      },
    });

    if (deletedCount === 0) {
      return res.status(404).json({ message: "User was not muted" });
    }

    res.json({ success: true, message: `User ${targetId} unmuted` });
  } catch (error) {
    console.error("Error unmuting user:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/block", protect, async (req: Request, res: Response) => {
  try {
    const myId = req.user!.id;
    const { targetId } = req.body;

    if (!targetId)
      return res.status(400).json({ message: "Target ID required" });
    if (myId === targetId)
      return res.status(400).json({ message: "Cannot block yourself" });

    const existingBlock = await BlockedUser.findOne({
      where: { blockerId: myId, blockedId: targetId },
    });

    if (existingBlock) {
      return res.status(200).json({ message: "User already blocked" });
    }

    await BlockedUser.create({
      blockerId: myId,
      blockedId: targetId,
    });

    console.log(`User ${myId} blocked user ${targetId}`);
    res.json({ success: true, message: `User ${targetId} blocked` });
  } catch (error) {
    console.error("Error blocking user:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/unblock", protect, async (req: Request, res: Response) => {
  try {
    const myId = req.user!.id;
    const { targetId } = req.body;

    const deletedCount = await BlockedUser.destroy({
      where: {
        blockerId: myId,
        blockedId: targetId,
      },
    });

    if (deletedCount === 0) {
      return res.status(404).json({ message: "Block not found" });
    }

    try {
      const io = ServerSocket.instance.io;
      const targetSocketRoom = `user_${targetId}`;

      io.to(targetSocketRoom).emit("unblock_status_change", {
        unblockerId: myId,
      });

      console.log(`User ${targetId} unblocked by ${myId}. Socket signal sent.`);
    } catch (e) {
      console.warn(
        "Could not emit unblock signal: ServerSocket instance not ready."
      );
    }

    res.json({ success: true, message: `User ${targetId} unblocked` });
  } catch (error) {
    console.error("Error unblocking user:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
