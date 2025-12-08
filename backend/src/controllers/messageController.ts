import { Router, Request, Response } from "express";
import { Op } from "sequelize";
import sequelize from "../config/sequelize";
import Message from "../models/Message";
import User from "../models/User";
import BlockedUser from "../models/BlockedUser";
import MutedUser from "../models/MutedUser";

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const myId = req.user!.id;
    const { senderId } = req.body;

    if (!senderId) {
      return res.status(400).json({ message: "senderId is required" });
    }

    await Message.update(
      { isRead: true },
      {
        where: {
          senderId: senderId,
          receiverId: myId,
          isRead: false,
        },
      }
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const conversetions = async (req: Request, res: Response) => {
  try {
    const myId = req.user!.id;

    const conversationPartners = await Message.findAll({
      attributes: [
        [
          sequelize.literal(
            `CASE WHEN "senderId" = ${myId} THEN "receiverId" ELSE "senderId" END`
          ),
          "partnerId",
        ],
      ],
      where: {
        [Op.or]: [
          { senderId: myId, deletedBySender: { [Op.not]: true } },
          { receiverId: myId, deletedByReceiver: { [Op.not]: true } },
        ],
      },
      group: ["partnerId"],
    });

    const partnerIds = conversationPartners.map((p: any) =>
      p.getDataValue("partnerId")
    );

    if (partnerIds.length === 0) {
      return res.json([]);
    }

    const users = await User.findAll({
      where: { id: { [Op.in]: partnerIds } },
      attributes: ["id", "name", "email", "user_type", "country", "avatar"],
    });

    const usersWithDetails = await Promise.all(
      users.map(async (user) => {
        const unreadCount = await Message.count({
          where: {
            senderId: user.id,
            receiverId: myId,
            isRead: false,
          },
        });

        const blockedByMeEntry = await BlockedUser.findOne({
          where: {
            blockerId: myId,
            blockedId: user.id,
          },
        });

        const blockedByThemEntry = await BlockedUser.findOne({
          where: {
            blockerId: user.id,
            blockedId: myId,
          },
        });

        const mutedEntry = await MutedUser.findOne({
          where: {
            userId: myId,
            mutedUserId: user.id,
          },
        });

        return {
          ...user.get({ plain: true }),
          unreadCount,
          isBlocked: !!blockedByMeEntry,
          amIBlocked: !!blockedByThemEntry,
          isMuted: !!mutedEntry,
        };
      })
    );

    res.json(usersWithDetails);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getMessagesById = async (req: Request, res: Response) => {
  try {
    const myId = req.user!.id;
    const targetId = parseInt(req.params.targetId);

    if (isNaN(targetId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          {
            senderId: myId,
            receiverId: targetId,
            deletedBySender: { [Op.not]: true },
          },
          {
            senderId: targetId,
            receiverId: myId,
            deletedByReceiver: { [Op.not]: true },
          },
        ],
      },
      order: [["createdAt", "ASC"]],
    });

    return res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
