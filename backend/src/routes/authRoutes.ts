import express from "express";
import {
  connectWallet,
  verifySignature,
  getCurrentUser,
  registerUser,
  loginUser,
  logoutUser,
} from "../controllers/authController";
import { protect } from "../middleware/authMiddleware";
import rateLimit from "express-rate-limit";
import { validate } from "../middleware/validate";
import { loginSchema, registerSchema } from "../validators/authValidators";

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: "Too many login attempts from this IP, please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/register", validate(registerSchema), registerUser);
router.post("/login/email", loginLimiter, validate(loginSchema), loginUser);
router.post("/logout", logoutUser);

router.post("/nonce", connectWallet);
router.post("/login", verifySignature);
router.get("/me", protect, getCurrentUser);

export default router;
