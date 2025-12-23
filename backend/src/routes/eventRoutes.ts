import express from "express";
import {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
} from "../controllers/eventController";
import { protect } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/", getAllEvents);
router.get("/:id", getEventById);

router.post("/", protect, createEvent);
router.put("/:id", protect, updateEvent);
router.delete("/:id", protect, deleteEvent);

export default router;
