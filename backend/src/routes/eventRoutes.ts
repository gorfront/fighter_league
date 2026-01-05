import express from "express";
import {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  joinEvent,
  getApprovedFightersForEvent,
  endEvent,
  getEventFighters,
} from "../controllers/eventController";
import { protect } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/", getAllEvents);
router.get("/:id", getEventById);

router.post("/", protect, createEvent);
router.put("/:id", protect, updateEvent);
router.delete("/:id", protect, deleteEvent);

router.post("/:id/join", protect, joinEvent);

router.post("/:id/end", protect, endEvent);

router.get("/:id/fighters", protect, getApprovedFightersForEvent);

router.get("/:id/available-fighters", getEventFighters);

export default router;
