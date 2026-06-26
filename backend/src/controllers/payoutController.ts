import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { AppError, asyncHandler } from "../middleware/error.js";
import { validateBody } from "../middleware/validate.js";

const payoutSelect = {
  id: true,
  type: true,
  label: true,
  provider: true,
  phone: true,
  bankName: true,
  accountName: true,
  accountNumber: true,
  isDefault: true,
  createdAt: true,
} as const;

// Mobile-money accounts need a provider + phone; bank accounts need the bank
// name, account name and number. Enforced with a discriminated check.
const baseSchema = z.object({
  type: z.enum(["mobile", "bank"]),
  label: z.string().trim().max(60).optional(),
  provider: z.enum(["mpesa", "tigopesa", "airtel"]).optional(),
  phone: z.string().trim().min(7).max(20).optional(),
  bankName: z.string().trim().min(2).max(80).optional(),
  accountName: z.string().trim().min(2).max(80).optional(),
  accountNumber: z.string().trim().min(4).max(40).optional(),
  isDefault: z.boolean().optional(),
});

const createSchema = baseSchema.superRefine((d, ctx) => {
  if (d.type === "mobile") {
    if (!d.provider)
      ctx.addIssue({ code: "custom", path: ["provider"], message: "Provider is required" });
    if (!d.phone)
      ctx.addIssue({ code: "custom", path: ["phone"], message: "Phone is required" });
  } else {
    if (!d.bankName)
      ctx.addIssue({ code: "custom", path: ["bankName"], message: "Bank name is required" });
    if (!d.accountName)
      ctx.addIssue({ code: "custom", path: ["accountName"], message: "Account name is required" });
    if (!d.accountNumber)
      ctx.addIssue({ code: "custom", path: ["accountNumber"], message: "Account number is required" });
  }
});

// ── GET /api/payouts  (operator) ─────────────────────────
export const listPayouts = asyncHandler(async (req: Request, res: Response) => {
  const operatorId = req.auth!.id;
  const accounts = await prisma.payoutAccount.findMany({
    where: { operatorId },
    select: payoutSelect,
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
  res.json({ success: true, count: accounts.length, accounts });
});

// ── POST /api/payouts  (operator) ────────────────────────
export const createPayout = asyncHandler(async (req: Request, res: Response) => {
  const operatorId = req.auth!.id;
  const data = validateBody(createSchema, req.body);

  const count = await prisma.payoutAccount.count({ where: { operatorId } });
  // First account is default automatically; otherwise honour the flag.
  const makeDefault = data.isDefault || count === 0;

  if (makeDefault) {
    await prisma.payoutAccount.updateMany({
      where: { operatorId },
      data: { isDefault: false },
    });
  }

  const account = await prisma.payoutAccount.create({
    data: {
      operatorId,
      type: data.type,
      label: data.label,
      provider: data.type === "mobile" ? data.provider : null,
      phone: data.type === "mobile" ? data.phone : null,
      bankName: data.type === "bank" ? data.bankName : null,
      accountName: data.type === "bank" ? data.accountName : null,
      accountNumber: data.type === "bank" ? data.accountNumber : null,
      isDefault: makeDefault,
    },
    select: payoutSelect,
  });

  res.status(201).json({ success: true, account });
});

// ── PUT /api/payouts/:id/default  (operator) ─────────────
export const setDefaultPayout = asyncHandler(async (req: Request, res: Response) => {
  const operatorId = req.auth!.id;
  const { id } = req.params as { id: string };

  const owned = await prisma.payoutAccount.findFirst({
    where: { id, operatorId },
    select: { id: true },
  });
  if (!owned) throw new AppError(404, "Payout account not found");

  await prisma.$transaction([
    prisma.payoutAccount.updateMany({ where: { operatorId }, data: { isDefault: false } }),
    prisma.payoutAccount.update({ where: { id }, data: { isDefault: true } }),
  ]);

  res.json({ success: true, message: "Default payout account updated" });
});

// ── DELETE /api/payouts/:id  (operator) ──────────────────
export const deletePayout = asyncHandler(async (req: Request, res: Response) => {
  const operatorId = req.auth!.id;
  const { id } = req.params as { id: string };

  const owned = await prisma.payoutAccount.findFirst({
    where: { id, operatorId },
    select: { id: true, isDefault: true },
  });
  if (!owned) throw new AppError(404, "Payout account not found");

  await prisma.payoutAccount.delete({ where: { id } });

  // If we removed the default, promote the most recent remaining account.
  if (owned.isDefault) {
    const next = await prisma.payoutAccount.findFirst({
      where: { operatorId },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
    if (next) {
      await prisma.payoutAccount.update({
        where: { id: next.id },
        data: { isDefault: true },
      });
    }
  }

  res.json({ success: true, message: "Payout account deleted" });
});
