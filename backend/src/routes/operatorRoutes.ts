import { Router } from "express";
import {
  commissionStats,
  createOperator,
  deleteOperator,
  getOperator,
  listAllAccessPoints,
  listAllTransactions,
  listOperators,
  updateOperator,
  updateOperatorStatus,
} from "../controllers/operatorController.js";
import { protectAdmin } from "../middleware/auth.js";

const router = Router();

// All operator-management routes are admin-only.
router.use(protectAdmin);

// Specific paths must precede the "/:id" param routes.
router.get("/admin/commission-stats", commissionStats);
router.get("/admin/transactions", listAllTransactions);
router.get("/admin/access-points", listAllAccessPoints);
router.get("/", listOperators);
router.post("/", createOperator);
router.get("/:id", getOperator);
router.put("/:id/status", updateOperatorStatus);
router.put("/:id", updateOperator);
router.delete("/:id", deleteOperator);

export default router;
