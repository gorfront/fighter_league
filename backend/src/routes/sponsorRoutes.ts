import { Router } from "express";
import {
  registerSponsor,
  getMySponsorProfile,
  getAllSponsors,
} from "../controllers/sponsorController";
import { protect } from "../middleware/authMiddleware";

const router = Router();

router.get(
  "/",
  // protect,
  getAllSponsors
);

router.get("/me", protect, getMySponsorProfile);

router.post(
  "/register",
  //  protect,
  registerSponsor
);

export default router;
