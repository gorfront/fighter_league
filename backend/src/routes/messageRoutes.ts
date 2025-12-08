import { Router } from "express";
import { protect } from "../middleware/authMiddleware";
import {
  conversetions,
  getMessagesById,
  markAsRead,
} from "../controllers/messageController";

const router = Router();

router.patch("/mark-read", protect, markAsRead);

router.get("/conversations", protect, conversetions);

router.get("/:targetId", protect, getMessagesById);

export default router;
