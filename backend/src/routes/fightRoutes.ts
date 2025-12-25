import { Router } from "express";
import {
  getFightsByEventId,
  createFight,
  updateFight,
  deleteFight,
} from "../controllers/fightController";
import { protect } from "../middleware/authMiddleware";

const router = Router();

router.get("/event/:eventId", getFightsByEventId);
router.post("/", protect, createFight);
router.put("/:id", protect, updateFight);
router.delete("/:id", protect, deleteFight);

export default router;
