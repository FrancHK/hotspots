import { Router } from "express";
import authRoutes from "./authRoutes.js";
import operatorRoutes from "./operatorRoutes.js";
import packageRoutes from "./packageRoutes.js";
import voucherRoutes from "./voucherRoutes.js";
import hotspotRoutes from "./hotspotRoutes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/operators", operatorRoutes);
router.use("/packages", packageRoutes);
router.use("/vouchers", voucherRoutes);
router.use("/hotspot", hotspotRoutes);

// Future route groups (wallet, payments, notifications, portal-settings,
// onboarding) mount here.

export default router;
