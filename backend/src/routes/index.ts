import { Router } from "express";
import authRoutes from "./authRoutes.js";
import operatorRoutes from "./operatorRoutes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/operators", operatorRoutes);

// Future route groups (packages, vouchers, hotspot, wallet, payments,
// notifications, portal-settings, onboarding) mount here.

export default router;
