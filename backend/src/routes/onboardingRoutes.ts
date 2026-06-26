import { Router } from "express";
import { createSite, getStatus } from "../controllers/onboardingController.js";
import { protectOperator } from "../middleware/auth.js";

const router = Router();

// All onboarding routes are operator-only.
router.use(protectOperator);

router.get("/status", getStatus);
router.post("/create-site", createSite);

export default router;
