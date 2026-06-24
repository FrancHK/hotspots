import { Router } from "express";
import {
  commissionStats,
  createOperator,
  listOperators,
  updateOperatorStatus,
} from "../controllers/operatorController.js";
import { protectAdmin } from "../middleware/auth.js";

const router = Router();

// All operator-management routes are admin-only.
router.use(protectAdmin);

router.get("/admin/commission-stats", commissionStats);
router.get("/", listOperators);
router.post("/", createOperator);
router.put("/:id/status", updateOperatorStatus);

export default router;
