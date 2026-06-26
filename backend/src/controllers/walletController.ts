import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { AppError, asyncHandler } from "../middleware/error.js";
import { validateBody } from "../middleware/validate.js";

// ── Date-window helpers (server-local time) ──────────────
function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function startOfWeek(): Date {
  const d = startOfToday();
  const day = d.getDay(); // 0=Sun … 6=Sat
  const diffToMonday = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diffToMonday);
  return d;
}
function startOfMonth(): Date {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), 1);
}

// Lazily flips any of the operator's sessions whose end time has passed from
// "active" to "expired" (no background worker needed).
async function expireOldSessions(operatorId: string): Promise<void> {
  await prisma.session.updateMany({
    where: { operatorId, status: "active", endTime: { lt: new Date() } },
    data: { status: "expired" },
  });
}

// ── GET /api/wallet/me  (operator) ───────────────────────
export const getWallet = asyncHandler(async (req: Request, res: Response) => {
  const operatorId = req.auth!.id;

  let wallet = await prisma.wallet.findUnique({
    where: { operatorId },
    select: { balance: true, totalEarned: true, totalWithdrawn: true },
  });
  // Safety net: provision a wallet if one is somehow missing.
  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: { operatorId },
      select: { balance: true, totalEarned: true, totalWithdrawn: true },
    });
  }

  res.json({ success: true, wallet });
});

// ── GET /api/wallet/analytics  (operator) ────────────────
export const getAnalytics = asyncHandler(
  async (req: Request, res: Response) => {
    const operatorId = req.auth!.id;
    await expireOldSessions(operatorId);

    const base = { operatorId, status: "success" as const };

    const earningsFor = (since?: Date) =>
      prisma.transaction.aggregate({
        where: since ? { ...base, createdAt: { gte: since } } : base,
        _sum: { operatorEarning: true, amount: true },
        _count: { _all: true },
      });

    const [today, week, month, total, byMethod, distinctCustomers, activeNow] =
      await Promise.all([
        earningsFor(startOfToday()),
        earningsFor(startOfWeek()),
        earningsFor(startOfMonth()),
        earningsFor(),
        prisma.transaction.groupBy({
          by: ["method"],
          where: base,
          _sum: { operatorEarning: true, amount: true },
          _count: { _all: true },
        }),
        prisma.transaction.findMany({
          where: { ...base, clientMac: { not: null } },
          distinct: ["clientMac"],
          select: { clientMac: true },
        }),
        prisma.session.count({ where: { operatorId, status: "active" } }),
      ]);

    const shape = (agg: Awaited<ReturnType<typeof earningsFor>>) => ({
      earnings: agg._sum.operatorEarning ?? 0,
      revenue: agg._sum.amount ?? 0,
      transactions: agg._count._all,
    });

    res.json({
      success: true,
      analytics: {
        earnings: {
          today: shape(today),
          week: shape(week),
          month: shape(month),
          total: shape(total),
        },
        customersServed: total._count._all,
        uniqueCustomers: distinctCustomers.length,
        activeSessions: activeNow,
        byMethod: byMethod.map((m) => ({
          method: m.method,
          earnings: m._sum.operatorEarning ?? 0,
          revenue: m._sum.amount ?? 0,
          count: m._count._all,
        })),
      },
    });
  },
);

// ── GET /api/wallet/sessions  (operator) ─────────────────
// Optional filter: ?status=active|expired   &   ?limit=
export const getSessions = asyncHandler(async (req: Request, res: Response) => {
  const operatorId = req.auth!.id;
  await expireOldSessions(operatorId);

  const { status } = req.query;
  const limit = Math.min(Number(req.query.limit) || 100, 500);

  const sessions = await prisma.session.findMany({
    where: {
      operatorId,
      ...(status === "active" || status === "expired"
        ? { status: status as never }
        : {}),
    },
    orderBy: { startTime: "desc" },
    take: limit,
  });

  res.json({ success: true, count: sessions.length, sessions });
});

// ── GET /api/wallet/transactions  (operator) ─────────────
// Optional filters: ?method=  ?status=  ?limit=
export const getTransactions = asyncHandler(
  async (req: Request, res: Response) => {
    const operatorId = req.auth!.id;
    const { method, status } = req.query;
    const limit = Math.min(Number(req.query.limit) || 100, 500);

    const transactions = await prisma.transaction.findMany({
      where: {
        operatorId,
        ...(typeof method === "string" ? { method: method as never } : {}),
        ...(typeof status === "string" ? { status: status as never } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    res.json({ success: true, count: transactions.length, transactions });
  },
);

// ── POST /api/wallet/withdraw  (operator) ────────────────
// Records a withdrawal: decrements balance, increments totalWithdrawn.
const withdrawSchema = z.object({
  amount: z.number().int().positive("Amount must be greater than zero"),
  payoutAccountId: z.string().uuid().optional(),
});

export const withdraw = asyncHandler(async (req: Request, res: Response) => {
  const operatorId = req.auth!.id;
  const { amount, payoutAccountId } = validateBody(withdrawSchema, req.body);

  // If a destination account is supplied, it must belong to this operator.
  if (payoutAccountId) {
    const account = await prisma.payoutAccount.findFirst({
      where: { id: payoutAccountId, operatorId },
      select: { id: true },
    });
    if (!account) throw new AppError(404, "Payout account not found");
  }

  const wallet = await prisma.wallet.findUnique({ where: { operatorId } });
  if (!wallet) throw new AppError(404, "Wallet not found");
  if (amount > wallet.balance) {
    throw new AppError(400, "Insufficient balance");
  }

  const updated = await prisma.wallet.update({
    where: { operatorId },
    data: {
      balance: { decrement: amount },
      totalWithdrawn: { increment: amount },
    },
    select: { balance: true, totalEarned: true, totalWithdrawn: true },
  });

  res.json({
    success: true,
    message: `Withdrawal of ${amount} TZS recorded`,
    wallet: updated,
  });
});
