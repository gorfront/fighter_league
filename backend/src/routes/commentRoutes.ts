import express from "express";
import { protect } from "../middleware/authMiddleware";
import { createComment, getComments } from "../controllers/CommentController";

const router = express.Router();

router.post("/", protect, createComment);
router.get("/:fightId", getComments);

export default router;
