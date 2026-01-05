import express from "express";
import {
  createFight,
  updateFight,
  deleteFight,
  getFightsByEventId,
  getFightById,
} from "../controllers/fightController";
import { protect } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/", protect, createFight);
router.put("/:id", protect, updateFight);
router.delete("/:id", protect, deleteFight);
router.get("/event/:eventId", getFightsByEventId);
router.get("/:id", getFightById);

export default router;
