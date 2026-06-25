import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { AppError, asyncHandler } from "../middleware/error.js";
import { validateBody } from "../middleware/validate.js";
import { generateUniqueVoucherCodes } from "../utils/voucherCode.js";

const MAX_BATCH = 500;

// ── POST /api/vouchers/create  (operator) ────────────────
// Generates a batch of unused vouchers that all share the same plan details.
const createSchema = z.object({
  quantity: z.number().int().min(1).max(MAX_BATCH).default(1),
  title: z.string().trim().min(1).optional(),
  duration: z.number().int().min(1),
  durationUnit: z.enum(["minutes", "hours", "days"]).default("hours"),
  speed: z.number().int().min(1), // Mbps
  price: z.number().int().min(0), // TZS
});

export const createVoucherBatch = asyncHandler(
  async (req: Request, res: Response) => {
    const operatorId = req.auth!.id;
    const data = validateBody(createSchema, req.body);

    const codes = await generateUniqueVoucherCodes(data.quantity);

    await prisma.voucher.createMany({
      data: codes.map((code) => ({
        code,
        title: data.title,
        duration: data.duration,
        durationUnit: data.durationUnit,
        speed: data.speed,
        price: data.price,
        operatorId,
      })),
    });

    res.status(201).json({
      success: true,
      message: `${codes.length} voucher(s) created`,
      created: codes.length,
      vouchers: codes.map((code) => ({
        code,
        title: data.title ?? null,
        duration: data.duration,
        durationUnit: data.durationUnit,
        speed: data.speed,
        price: data.price,
        status: "unused",
      })),
    });
  },
);

// ── GET /api/vouchers/my  (operator) ─────────────────────
// Filters: ?status=unused|used  &  ?title=<substring, case-insensitive>
export const getMyVouchers = asyncHandler(
  async (req: Request, res: Response) => {
    const operatorId = req.auth!.id;
    const { status, title } = req.query;

    const vouchers = await prisma.voucher.findMany({
      where: {
        operatorId,
        ...(typeof status === "string" ? { status: status as never } : {}),
        ...(typeof title === "string" && title.trim()
          ? { title: { contains: title.trim(), mode: "insensitive" } }
          : {}),
      },
      select: {
        id: true,
        code: true,
        title: true,
        duration: true,
        durationUnit: true,
        speed: true,
        price: true,
        status: true,
        usedBy: true,
        usedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, count: vouchers.length, vouchers });
  },
);

// ── DELETE /api/vouchers/:id  (operator) ─────────────────
// Only UNUSED vouchers can be deleted.
export const deleteVoucher = asyncHandler(
  async (req: Request, res: Response) => {
    const operatorId = req.auth!.id;
    const { id } = req.params as { id: string };

    const voucher = await prisma.voucher.findFirst({
      where: { id, operatorId },
      select: { id: true, code: true, status: true },
    });
    if (!voucher) throw new AppError(404, "Voucher not found");
    if (voucher.status === "used") {
      throw new AppError(400, "A used voucher cannot be deleted");
    }

    await prisma.voucher.delete({ where: { id } });
    res.json({ success: true, message: `Voucher ${voucher.code} deleted` });
  },
);
