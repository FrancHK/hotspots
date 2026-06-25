import { Router } from "express";
import {
  getAnalytics,
  getSessions,
  getTransactions,
  getWallet,
  withdraw,
} from "../controllers/walletController.js";
import { protectOperator } from "../middleware/auth.js";

const router = Router();

// All wallet routes are operator-only; each operator sees only its own data.
router.use(protectOperator);

router.get("/me", getWallet);
router.get("/analytics", getAnalytics);
router.get("/sessions", getSessions);
router.get("/transactions", getTransactions);
router.post("/withdraw", withdraw);

export default router;
