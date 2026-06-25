import { Router } from "express";
import {
  createNotification,
  getMyNotifications,
  listAllNotifications,
  markAsRead,
} from "../controllers/notificationController.js";
import { protectAdmin, protectOperator } from "../middleware/auth.js";

const router = Router();

// Operator routes (mounted before the generic admin "/" handlers).
router.get("/me", protectOperator, getMyNotifications);
router.put("/:id/read", protectOperator, markAsRead);

// Admin routes.
router.post("/", protectAdmin, createNotification);
router.get("/", protectAdmin, listAllNotifications);

export default router;
