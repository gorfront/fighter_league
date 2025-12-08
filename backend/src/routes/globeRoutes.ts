import express from "express";
import { getGlobeData } from "../controllers/globeController";

const router = express.Router();

router.get("/nation/:countryCode", getGlobeData);

export default router;
