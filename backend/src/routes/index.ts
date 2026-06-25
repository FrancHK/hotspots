import { Router } from "express";
import authRoutes from "./authRoutes.js";
import operatorRoutes from "./operatorRoutes.js";
import packageRoutes from "./packageRoutes.js";
import voucherRoutes from "./voucherRoutes.js";
import hotspotRoutes from "./hotspotRoutes.js";
import walletRoutes from "./walletRoutes.js";
import paymentsRoutes from "./paymentsRoutes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/operators", operatorRoutes);
router.use("/packages", packageRoutes);
router.use("/vouchers", voucherRoutes);
router.use("/hotspot", hotspotRoutes);
router.use("/wallet", walletRoutes);
router.use("/payments", paymentsRoutes);

// Future route groups (notifications, portal-settings, onboarding) mount here.

export default router;
