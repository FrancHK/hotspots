import { Router } from "express";
import {
  initiatePayment,
  paymentStatus,
  paymentWebhook,
} from "../controllers/paymentsController.js";

const router = Router();

// All payment routes are PUBLIC (portal + Snippe). The webhook's raw-body
// middleware is wired in server.ts BEFORE express.json().
router.post("/initiate", initiatePayment);
router.get("/status/:reference", paymentStatus);
router.post("/webhook", paymentWebhook);

export default router;
