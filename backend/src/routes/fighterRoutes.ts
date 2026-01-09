import express from "express";
import {
  registerFighter,
  getAllFighters,
  getFighterById,
  getMyFighterProfile,
  updateFighterProfile,
  refreshAllRanks,
} from "../controllers/fighterController";
import { protect } from "../middleware/authMiddleware";
import path from "path";
import multer from "multer";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

const router = express.Router();

router.get("/", getAllFighters);

router.get("/me", protect, getMyFighterProfile);

router.post(
  "/register",
  // protect,
  registerFighter
);

router.get("/:id", getFighterById);

router.put("/me", protect, upload.single("image"), updateFighterProfile);

router.post("/refresh-ranks", protect, refreshAllRanks);

export default router;
