import express from "express";
import { protect } from "../middleware/authMiddleware";
import {
  getDonorProfile,
  registerDonor,
  updateDonorProfile,
} from "../controllers/donorController";

const router = express.Router();

router.post("/register", protect, registerDonor);
router.get("/me", protect, getDonorProfile);
router.put("/me", protect, updateDonorProfile);

export default router;
