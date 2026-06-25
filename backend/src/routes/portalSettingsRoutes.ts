import { Router } from "express";
import {
  getMySettings,
  getOperatorSettings,
  updateMySettings,
} from "../controllers/portalSettingsController.js";
import { protectOperator } from "../middleware/auth.js";

const router = Router();

// PUBLIC — captive portal branding (no auth).
router.get("/operator/:operatorId", getOperatorSettings);

// Operator-protected.
router.get("/my", protectOperator, getMySettings);
router.put("/my", protectOperator, updateMySettings);

export default router;
