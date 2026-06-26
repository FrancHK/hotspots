import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { AppError, asyncHandler } from "../middleware/error.js";
import { validateBody } from "../middleware/validate.js";
import { hashPassword } from "../utils/password.js";
import { generateOperatorId } from "../utils/operatorId.js";

const operatorPublicSelect = {
  id: true,
  operatorId: true,
  name: true,
  businessName: true,
  email: true,
  phone: true,
  mpesa: true,
  region: true,
  package: true,
  status: true,
  deviceType: true,
  commissionRate: true,
  voucherCommission: true,
  noSubscription: true,
  subscriptionEnd: true,
  onboardingComplete: true,
  createdAt: true,
} as const;

// ── GET /api/operators  (admin) ──────────────────────────
// Optional filters: ?status=pending|active|blocked  &  ?deviceType=omada|mikrotik
export const listOperators = asyncHandler(async (req: Request, res: Response) => {
  const { status, deviceType } = req.query;

  const operators = await prisma.operator.findMany({
    where: {
      ...(typeof status === "string" ? { status: status as never } : {}),
      ...(typeof deviceType === "string"
        ? { deviceType: deviceType as never }
        : {}),
    },
    select: {
      ...operatorPublicSelect,
      wallet: { select: { balance: true, totalEarned: true } },
      _count: { select: { sites: true, accessPoints: true, packages: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  res.json({ success: true, count: operators.length, operators });
});

// ── GET /api/operators/:id  (admin) ──────────────────────
export const getOperator = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };

  const operator = await prisma.operator.findUnique({
    where: { id },
    select: {
      ...operatorPublicSelect,
      wallet: {
        select: { balance: true, totalEarned: true, totalWithdrawn: true },
      },
      sites: { select: { id: true, name: true, city: true, siteId: true } },
      accessPoints: {
        select: {
          id: true,
          name: true,
          macAddress: true,
          status: true,
          deviceType: true,
        },
      },
      packages: {
        select: { id: true, name: true, price: true, status: true },
      },
      _count: {
        select: {
          sites: true,
          accessPoints: true,
          packages: true,
          vouchers: true,
          transactions: true,
        },
      },
    },
  });

  if (!operator) throw new AppError(404, "Operator not found");

  res.json({ success: true, operator });
});

// ── POST /api/operators  (admin creates an operator) ─────
const createSchema = z.object({
  name: z.string().trim().min(2),
  businessName: z.string().trim().min(2),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(6),
  phone: z.string().trim().min(7),
  mpesa: z.string().trim().optional(),
  region: z.string().trim().optional(),
  package: z.enum(["starter", "basic", "pro"]).default("starter"),
  deviceType: z.enum(["omada", "mikrotik"]).default("omada"),
  status: z.enum(["pending", "active", "blocked"]).default("active"),
  commissionRate: z.number().int().min(0).max(100).optional(),
  voucherCommission: z.number().int().min(0).max(100).optional(),
});

export const createOperator = asyncHandler(
  async (req: Request, res: Response) => {
    const data = validateBody(createSchema, req.body);

    const existing = await prisma.operator.findUnique({
      where: { email: data.email },
      select: { id: true },
    });
    if (existing) throw new AppError(409, "Email already registered");

    const isMikrotik = data.deviceType === "mikrotik";
    const operatorPublicId = await generateOperatorId();
    const passwordHash = await hashPassword(data.password);

    const operator = await prisma.operator.create({
      data: {
        name: data.name,
        businessName: data.businessName,
        email: data.email,
        password: passwordHash,
        phone: data.phone,
        mpesa: data.mpesa,
        region: data.region,
        deviceType: data.deviceType,
        package: isMikrotik ? "pro" : data.package,
        noSubscription: isMikrotik,
        status: data.status,
        operatorId: operatorPublicId,
        ...(data.commissionRate !== undefined
          ? { commissionRate: data.commissionRate }
          : {}),
        ...(data.voucherCommission !== undefined
          ? { voucherCommission: data.voucherCommission }
          : {}),
        wallet: { create: {} },
        portalSettings: { create: { businessName: data.businessName } },
      },
      select: operatorPublicSelect,
    });

    res.status(201).json({ success: true, operator });
  },
);

// ── PUT /api/operators/:id/status  (admin) ───────────────
// If a `status` is supplied, set it; otherwise auto-toggle:
//   pending -> active,  active -> blocked,  blocked -> active
const statusSchema = z.object({
  status: z.enum(["pending", "active", "blocked"]).optional(),
});

export const updateOperatorStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const { status } = validateBody(statusSchema, req.body ?? {});

    const operator = await prisma.operator.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
    if (!operator) throw new AppError(404, "Operator not found");

    let next: "pending" | "active" | "blocked";
    if (status) {
      next = status;
    } else {
      next = operator.status === "active" ? "blocked" : "active";
    }

    const updated = await prisma.operator.update({
      where: { id },
      data: { status: next },
      select: operatorPublicSelect,
    });

    res.json({
      success: true,
      message: `Operator status changed to ${next}`,
      operator: updated,
    });
  },
);

// ── PUT /api/operators/:id  (admin) — edit operator ──────
// Partial update of profile/package/commission fields.
const updateSchema = z.object({
  name: z.string().trim().min(2).optional(),
  businessName: z.string().trim().min(2).optional(),
  phone: z.string().trim().min(7).optional(),
  mpesa: z.string().trim().optional(),
  region: z.string().trim().optional(),
  package: z.enum(["starter", "basic", "pro"]).optional(),
  commissionRate: z.number().int().min(0).max(100).optional(),
  voucherCommission: z.number().int().min(0).max(100).optional(),
});

export const updateOperator = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const data = validateBody(updateSchema, req.body ?? {});

    const existing = await prisma.operator.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) throw new AppError(404, "Operator not found");

    const updated = await prisma.operator.update({
      where: { id },
      data,
      select: operatorPublicSelect,
    });

    res.json({ success: true, message: "Operator updated", operator: updated });
  },
);

// ── DELETE /api/operators/:id  (admin) ───────────────────
// Removes the operator and all related records (sites, APs, packages,
// vouchers, transactions, wallet, sessions, portal settings) via the
// onDelete: Cascade rules in the schema.
export const deleteOperator = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };

    const operator = await prisma.operator.findUnique({
      where: { id },
      select: { id: true, businessName: true, operatorId: true },
    });
    if (!operator) throw new AppError(404, "Operator not found");

    await prisma.operator.delete({ where: { id } });

    res.json({
      success: true,
      message: `Operator ${operator.businessName} (${operator.operatorId}) deleted`,
    });
  },
);

// ── GET /api/operators/admin/transactions  (admin) ───────
// Platform-wide transaction history with operator info.
// Optional filters: ?status= &?method= &?operatorId= &?limit=
export const listAllTransactions = asyncHandler(
  async (req: Request, res: Response) => {
    const { status, method, operatorId } = req.query;
    const limit = Math.min(
      Number.parseInt(String(req.query.limit ?? "500"), 10) || 500,
      1000,
    );

    const transactions = await prisma.transaction.findMany({
      where: {
        ...(typeof status === "string" ? { status: status as never } : {}),
        ...(typeof method === "string" ? { method: method as never } : {}),
        ...(typeof operatorId === "string" ? { operatorId } : {}),
      },
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        operator: { select: { operatorId: true, businessName: true } },
      },
    });

    const counts = transactions.reduce(
      (acc, t) => {
        acc[t.status] = (acc[t.status] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    res.json({
      success: true,
      count: transactions.length,
      summary: {
        total: transactions.length,
        success: counts.success ?? 0,
        pending: counts.pending ?? 0,
        failed: counts.failed ?? 0,
      },
      transactions: transactions.map((t) => ({
        id: t.id,
        amount: t.amount,
        method: t.method,
        adminCommission: t.adminCommission,
        operatorEarning: t.operatorEarning,
        clientMac: t.clientMac,
        apMac: t.apMac,
        duration: t.duration,
        status: t.status,
        reference: t.reference,
        createdAt: t.createdAt,
        operatorId: t.operatorId,
        operatorPublicId: t.operator.operatorId,
        operatorName: t.operator.businessName,
      })),
    });
  },
);

// ── GET /api/operators/admin/access-points  (admin) ──────
// Every AP on the platform, with its owning operator + site.
export const listAllAccessPoints = asyncHandler(
  async (_req: Request, res: Response) => {
    const accessPoints = await prisma.accessPoint.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        operator: { select: { operatorId: true, businessName: true } },
        site: { select: { name: true, city: true } },
      },
    });

    const online = accessPoints.filter((a) => a.status === "online").length;

    res.json({
      success: true,
      count: accessPoints.length,
      summary: {
        total: accessPoints.length,
        online,
        offline: accessPoints.length - online,
      },
      accessPoints: accessPoints.map((a) => ({
        id: a.id,
        name: a.name,
        macAddress: a.macAddress,
        ipAddress: a.ipAddress,
        ssid: a.ssid,
        model: a.model,
        status: a.status,
        deviceType: a.deviceType,
        operatorPublicId: a.operator.operatorId,
        operatorName: a.operator.businessName,
        siteName: a.site?.name ?? null,
        siteCity: a.site?.city ?? null,
        createdAt: a.createdAt,
      })),
    });
  },
);

// ── GET /api/operators/admin/commission-stats  (admin) ───
// Platform-wide commission overview across all SUCCESSFUL transactions.
export const commissionStats = asyncHandler(
  async (_req: Request, res: Response) => {
    const where = { status: "success" as const };

    const [totals, byMethod, perOperator, operatorCounts] = await Promise.all([
      prisma.transaction.aggregate({
        where,
        _sum: { amount: true, adminCommission: true, operatorEarning: true },
        _count: { _all: true },
      }),
      prisma.transaction.groupBy({
        by: ["method"],
        where,
        _sum: { amount: true, adminCommission: true, operatorEarning: true },
        _count: { _all: true },
      }),
      prisma.transaction.groupBy({
        by: ["operatorId"],
        where,
        _sum: { amount: true, adminCommission: true, operatorEarning: true },
        _count: { _all: true },
      }),
      prisma.operator.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
    ]);

    // Attach operator names to the per-operator breakdown.
    const operatorIds = perOperator.map((p) => p.operatorId);
    const names = operatorIds.length
      ? await prisma.operator.findMany({
          where: { id: { in: operatorIds } },
          select: { id: true, operatorId: true, businessName: true },
        })
      : [];
    const nameMap = new Map(names.map((n) => [n.id, n]));

    res.json({
      success: true,
      stats: {
        totals: {
          totalRevenue: totals._sum.amount ?? 0,
          totalAdminCommission: totals._sum.adminCommission ?? 0,
          totalOperatorEarnings: totals._sum.operatorEarning ?? 0,
          transactionCount: totals._count._all,
        },
        byMethod: byMethod.map((m) => ({
          method: m.method,
          revenue: m._sum.amount ?? 0,
          adminCommission: m._sum.adminCommission ?? 0,
          operatorEarnings: m._sum.operatorEarning ?? 0,
          count: m._count._all,
        })),
        byOperator: perOperator
          .map((p) => ({
            operatorId: p.operatorId,
            publicId: nameMap.get(p.operatorId)?.operatorId ?? null,
            businessName: nameMap.get(p.operatorId)?.businessName ?? null,
            revenue: p._sum.amount ?? 0,
            adminCommission: p._sum.adminCommission ?? 0,
            operatorEarnings: p._sum.operatorEarning ?? 0,
            count: p._count._all,
          }))
          .sort((a, b) => b.adminCommission - a.adminCommission),
        operatorsByStatus: Object.fromEntries(
          operatorCounts.map((o) => [o.status, o._count._all]),
        ),
      },
    });
  },
);
