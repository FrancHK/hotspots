import { Router } from "express";
import {
  createPackage,
  deletePackage,
  getMyPackages,
  getOperatorPackages,
  updatePackage,
} from "../controllers/packageController.js";
import { protectOperator } from "../middleware/auth.js";

const router = Router();

// PUBLIC — captive portal reads an operator's active packages (no auth).
router.get("/operator/:operatorId", getOperatorPackages);

// Operator-protected management routes.
router.post("/", protectOperator, createPackage);
router.get("/my", protectOperator, getMyPackages);
router.put("/:id", protectOperator, updatePackage);
router.delete("/:id", protectOperator, deletePackage);

export default router;
