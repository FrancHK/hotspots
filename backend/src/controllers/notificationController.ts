import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { AppError, asyncHandler } from "../middleware/error.js";
import { validateBody } from "../middleware/validate.js";

// ── POST /api/notifications  (admin) ─────────────────────
// operatorId null/omitted = broadcast to ALL operators.
const createSchema = z.object({
  title: z.string().trim().min(1),
  message: z.string().trim().min(1),
  type: z.enum(["info", "success", "warning", "error"]).default("info"),
  operatorId: z.string().uuid().nullable().optional(),
});

export const createNotification = asyncHandler(
  async (req: Request, res: Response) => {
    const data = validateBody(createSchema, req.body);

    if (data.operatorId) {
      const operator = await prisma.operator.findUnique({
        where: { id: data.operatorId },
        select: { id: true },
      });
      if (!operator) throw new AppError(404, "Operator not found");
    }

    const notification = await prisma.notification.create({
      data: {
        title: data.title,
        message: data.message,
        type: data.type,
        operatorId: data.operatorId ?? null,
      },
    });

    res.status(201).json({
      success: true,
      message: data.operatorId
        ? "Notification sent to operator"
        : "Broadcast sent to all operators",
      notification,
    });
  },
);

// ── GET /api/notifications  (admin) — all sent ───────────
export const listAllNotifications = asyncHandler(
  async (_req: Request, res: Response) => {
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        operator: { select: { operatorId: true, businessName: true } },
      },
    });

    res.json({
      success: true,
      count: notifications.length,
      notifications: notifications.map((n) => ({
        ...n,
        readCount: n.readBy.length,
        target: n.operatorId ? "operator" : "broadcast",
      })),
    });
  },
);

// ── GET /api/notifications/me  (operator) ────────────────
// Own notifications + broadcasts, with a per-operator `read` flag.
export const getMyNotifications = asyncHandler(
  async (req: Request, res: Response) => {
    const operatorId = req.auth!.id;

    const notifications = await prisma.notification.findMany({
      where: { OR: [{ operatorId }, { operatorId: null }] },
      orderBy: { createdAt: "desc" },
    });

    const items = notifications.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      broadcast: n.operatorId === null,
      read: n.readBy.includes(operatorId),
      createdAt: n.createdAt,
    }));

    res.json({
      success: true,
      count: items.length,
      unread: items.filter((i) => !i.read).length,
      notifications: items,
    });
  },
);

// ── PUT /api/notifications/:id/read  (operator) ──────────
export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const operatorId = req.auth!.id;
  const { id } = req.params as { id: string };

  const notification = await prisma.notification.findUnique({ where: { id } });
  // Operators may only mark notifications they can actually see.
  if (
    !notification ||
    (notification.operatorId !== null && notification.operatorId !== operatorId)
  ) {
    throw new AppError(404, "Notification not found");
  }

  if (!notification.readBy.includes(operatorId)) {
    await prisma.notification.update({
      where: { id },
      data: { readBy: { push: operatorId } },
    });
  }

  res.json({ success: true, message: "Marked as read" });
});
