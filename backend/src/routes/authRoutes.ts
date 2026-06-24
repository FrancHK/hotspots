import { Router } from "express";
import {
  adminLogin,
  adminMe,
  operatorLogin,
  operatorMe,
  operatorRegister,
} from "../controllers/authController.js";
import { protectAdmin, protectOperator } from "../middleware/auth.js";

const router = Router();

router.post("/admin/login", adminLogin);
router.post("/operator/login", operatorLogin);
router.post("/operator/register", operatorRegister);

router.get("/admin/me", protectAdmin, adminMe);
router.get("/operator/me", protectOperator, operatorMe);

export default router;
