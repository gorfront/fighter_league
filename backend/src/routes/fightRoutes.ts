// import { Router } from "express";
// import {
//   getFightsByEventId,
//   createFight,
//   updateFight,
//   deleteFight,
//   // getFightById,
// } from "../controllers/fightController";
// import { protect } from "../middleware/authMiddleware";

// const router = Router();

// router.get("/event/:eventId", getFightsByEventId);
// router.post("/", protect, createFight);
// router.put("/:id", protect, updateFight);
// router.delete("/:id", protect, deleteFight);
// // router.get("/:id", getFightById);

// export default router;

// backend/src/routes/fightRoutes.ts
import express from "express";
import {
  createFight,
  updateFight,
  deleteFight,
  getFightsByEventId,
  getFightById, // Import the new function
} from "../controllers/fightController";
import { protect } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/", protect, createFight);
router.put("/:id", protect, updateFight);
router.delete("/:id", protect, deleteFight);
router.get("/event/:eventId", getFightsByEventId);
router.get("/:id", getFightById); // <--- Add this line!

export default router;
