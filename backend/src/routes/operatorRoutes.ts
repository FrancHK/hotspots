import { Router } from "express";
import {
  commissionStats,
  createOperator,
  deleteOperator,
  getOperator,
  listOperators,
  updateOperatorStatus,
} from "../controllers/operatorController.js";
import { protectAdmin } from "../middleware/auth.js";

const router = Router();

// All operator-management routes are admin-only.
router.use(protectAdmin);

// Specific paths must precede the "/:id" param routes.
router.get("/admin/commission-stats", commissionStats);
router.get("/", listOperators);
router.post("/", createOperator);
router.get("/:id", getOperator);
router.put("/:id/status", updateOperatorStatus);
router.delete("/:id", deleteOperator);

export default router;
