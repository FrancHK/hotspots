import { Router } from "express";
import {
  createVoucherBatch,
  deleteVoucher,
  getMyVouchers,
} from "../controllers/voucherController.js";
import { protectOperator } from "../middleware/auth.js";

const router = Router();

// All voucher routes are operator-only.
router.use(protectOperator);

router.post("/create", createVoucherBatch);
router.get("/my", getMyVouchers);
router.delete("/:id", deleteVoucher);

export default router;
