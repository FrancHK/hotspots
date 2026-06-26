import { Router } from "express";
import {
  createPayout,
  deletePayout,
  listPayouts,
  setDefaultPayout,
} from "../controllers/payoutController.js";
import { protectOperator } from "../middleware/auth.js";

const router = Router();

// All payout-account routes are operator-only.
router.use(protectOperator);

router.get("/", listPayouts);
router.post("/", createPayout);
router.put("/:id/default", setDefaultPayout);
router.delete("/:id", deletePayout);

export default router;
