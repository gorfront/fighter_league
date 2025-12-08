import express from "express";
import {
  registerFighter,
  getAllFighters,
  getFighterById,
  getMyFighterProfile,
  updateFighterProfile,
} from "../controllers/fighterController";
import { protect } from "../middleware/authMiddleware";
import path from "path";
import multer from "multer";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Make sure this folder exists in your root
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

export default router;
