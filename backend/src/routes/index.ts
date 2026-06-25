import { Router } from "express";
import authRoutes from "./authRoutes.js";
import operatorRoutes from "./operatorRoutes.js";
import packageRoutes from "./packageRoutes.js";
import voucherRoutes from "./voucherRoutes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/operators", operatorRoutes);
router.use("/packages", packageRoutes);
router.use("/vouchers", voucherRoutes);

// Future route groups (hotspot, wallet, payments, notifications,
// portal-settings, onboarding) mount here.

export default router;
