import { Router } from "express";
import { subscribeToNewsletter } from "../controllers/newsletterController";

const router = Router();

// POST /api/v1/newsletter/subscribe
router.post("/subscribe", subscribeToNewsletter);

export default router;
