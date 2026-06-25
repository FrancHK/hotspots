import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { AppError, asyncHandler } from "../middleware/error.js";
import { validateBody } from "../middleware/validate.js";
import { grantInternetAccess } from "../services/hotspot.js";
import { toMinutes } from "../utils/duration.js";

// Loads an AccessPoint by its MAC together with the owning operator and site.
async function findAccessPoint(apMac: string) {
  return prisma.accessPoint.findUnique({
    where: { macAddress: apMac },
    include: {
      operator: {
        select: {
          id: true,
          operatorId: true,
          businessName: true,
          deviceType: true,
          status: true,
          commissionRate: true,
          voucherCommission: true,
        },
      },
      site: { select: { id: true, name: true, siteId: true } },
    },
  });
}

// ── GET /api/hotspot/client-login?clientMac=X&apMac=Y  (PUBLIC) ──
// Identifies the AP's operator and returns that operator's branding plus
// ITS active packages only.
export const clientLogin = asyncHandler(async (req: Request, res: Response) => {
  const clientMac = String(req.query.clientMac ?? "").trim();
  const apMac = String(req.query.apMac ?? "").trim();
  if (!apMac) throw new AppError(400, "apMac is required");

  const ap = await findAccessPoint(apMac);
  if (!ap) throw new AppError(404, "Access point not recognised");
  if (ap.operator.status !== "active") {
    throw new AppError(403, "This hotspot is not active");
  }

  const packages = await prisma.package.findMany({
    where: { operatorId: ap.operator.id, status: "active" },
    select: {
      id: true,
      name: true,
      duration: true,
      durationUnit: true,
      speed: true,
      price: true,
    },
    orderBy: { price: "asc" },
  });

  res.json({
    success: true,
    clientMac: clientMac || null,
    apMac,
    operator: {
      operatorId: ap.operator.operatorId,
      businessName: ap.operator.businessName,
    },
    site: { id: ap.site.id, name: ap.site.name, siteId: ap.site.siteId },
    packages,
  });
});

// ── POST /api/hotspot/voucher-access  (PUBLIC) ───────────
// Redeems a voucher: validates it, opens internet via the unified authorize,
// marks it used, and records the transaction / wallet / session.
const voucherSchema = z.object({
  code: z.string().trim().min(1, "Voucher code is required"),
  clientMac: z.string().trim().min(1, "clientMac is required"),
  apMac: z.string().trim().min(1, "apMac is required"),
});

export const voucherAccess = asyncHandler(
  async (req: Request, res: Response) => {
    const { code, clientMac, apMac } = validateBody(voucherSchema, req.body);

    const ap = await findAccessPoint(apMac);
    if (!ap) throw new AppError(404, "Access point not recognised");
    if (ap.operator.status !== "active") {
      throw new AppError(403, "This hotspot is not active");
    }

    const voucher = await prisma.voucher.findUnique({
      where: { code: code.toUpperCase() },
    });
    if (!voucher) throw new AppError(404, "Invalid voucher code");
    if (voucher.status === "used") {
      throw new AppError(409, "This voucher has already been used");
    }
    // A voucher only works on the network of the operator that issued it.
    if (voucher.operatorId !== ap.operator.id) {
      throw new AppError(403, "This voucher is not valid on this hotspot");
    }

    const durationMinutes = toMinutes(voucher.duration, voucher.durationUnit);

    const { session, transaction, auth } = await grantInternetAccess({
      operator: ap.operator,
      accessPoint: {
        macAddress: ap.macAddress,
        omadaSiteId: ap.site.siteId,
        mikrotikIp: ap.mikrotikIp,
        mikrotikUser: ap.mikrotikUser,
        mikrotikPass: ap.mikrotikPass,
        mikrotikPort: ap.mikrotikPort,
      },
      siteId: ap.site.id,
      clientMac,
      method: "voucher",
      amount: voucher.price,
      durationMinutes,
      speedMbps: voucher.speed,
      voucherId: voucher.id,
    });

    res.json({
      success: true,
      message: "Internet access granted",
      access: {
        durationMinutes,
        speedMbps: voucher.speed,
        startTime: session.startTime,
        endTime: session.endTime,
        simulated: auth.simulated,
      },
      sessionId: session.id,
      transactionId: transaction.id,
    });
  },
);

// ── GET /api/hotspot/operator-info/:operatorId  (PUBLIC) ──
// For the captive-portal preview: operator branding + portal settings +
// active packages. Accepts the internal UUID or the public HSX id.
export const operatorInfo = asyncHandler(async (req: Request, res: Response) => {
  const { operatorId } = req.params as { operatorId: string };

  const operator = await prisma.operator.findFirst({
    where: { OR: [{ id: operatorId }, { operatorId }] },
    select: {
      id: true,
      operatorId: true,
      businessName: true,
      deviceType: true,
      status: true,
      portalSettings: true,
    },
  });
  if (!operator) throw new AppError(404, "Operator not found");

  const packages = await prisma.package.findMany({
    where: { operatorId: operator.id, status: "active" },
    select: {
      id: true,
      name: true,
      duration: true,
      durationUnit: true,
      speed: true,
      price: true,
    },
    orderBy: { price: "asc" },
  });

  res.json({
    success: true,
    operator: {
      operatorId: operator.operatorId,
      businessName: operator.businessName,
      deviceType: operator.deviceType,
      status: operator.status,
    },
    portalSettings: operator.portalSettings,
    packages,
  });
});
