import express from "express";
import {
  registerFighter,
  getAllFighters,
  getFighterById,
  getMyFighterProfile,
} from "../controllers/fighterController";
import { protect } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/", getAllFighters);

router.get("/me", protect, getMyFighterProfile);

router.post(
  "/register",
  // protect,
  registerFighter
);

router.get("/:id", getFighterById);

export default router;
