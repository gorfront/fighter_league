import express from "express";
import {
  getPendingFighters,
  approveFighter,
  rejectFighter,
  getVerifiedFighters,
  deleteDonor,
  deleteSponsor,
  getAllDonors,
  getAllSponsors,
} from "../controllers/adminController";
import { protect } from "../middleware/authMiddleware";

const router = express.Router();

router.use((req, res, next) => {
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );

  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }

  next();
});

router.get("/fighters/pending", protect, getPendingFighters);
router.patch("/fighters/:id/approve", protect, approveFighter);
router.delete("/fighters/:id", protect, rejectFighter);

router.get("/fighters/verified", protect, getVerifiedFighters);

router.get("/sponsors", protect, getAllSponsors);
router.delete("/sponsors/:id", protect, deleteSponsor);

router.get("/donors", protect, getAllDonors);
router.delete("/donors/:id", protect, deleteDonor);

export default router;
