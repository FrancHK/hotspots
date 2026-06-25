import { Router } from "express";
import {
  clientLogin,
  operatorInfo,
  voucherAccess,
} from "../controllers/hotspotController.js";

const router = Router();

// All hotspot routes are PUBLIC — the captive portal has no auth token.
router.get("/client-login", clientLogin);
router.post("/voucher-access", voucherAccess);
router.get("/operator-info/:operatorId", operatorInfo);

export default router;
