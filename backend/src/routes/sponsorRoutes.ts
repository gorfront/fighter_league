import { Router } from "express";
import {
  registerSponsor,
  getMySponsorProfile,
  getAllSponsors,
  updateSponsorProfile,
} from "../controllers/sponsorController";
import { protect } from "../middleware/authMiddleware";

const router = Router();

router.get(
  "/",
  // protect,
  getAllSponsors
);

router.get("/me", protect, getMySponsorProfile);

router.post("/register", protect, registerSponsor);

router.put("/me", protect, updateSponsorProfile);

export default router;
