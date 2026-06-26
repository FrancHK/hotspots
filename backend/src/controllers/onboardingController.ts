import type { Request, Response } from "express";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { AppError, asyncHandler } from "../middleware/error.js";
import { validateBody } from "../middleware/validate.js";

// Random locally-administered MAC, e.g. "02:1a:2b:3c:4d:5e". Used as a
// placeholder identifier for a MikroTik router created during onboarding;
// the operator can correct it later from the dashboard.
function generatePlaceholderMac(): string {
  const bytes = randomBytes(6);
  bytes[0] = (bytes[0]! & 0xfe) | 0x02; // locally administered, unicast
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join(":");
}

// ── GET /api/onboarding/status  (operator) ───────────────
// Lets the wizard resume: reports whether the operator already has a site,
// a package, and whether onboarding is marked complete.
export const getStatus = asyncHandler(async (req: Request, res: Response) => {
  const operatorId = req.auth!.id;

  const operator = await prisma.operator.findUnique({
    where: { id: operatorId },
    select: {
      name: true,
      businessName: true,
      operatorId: true,
      deviceType: true,
      onboardingComplete: true,
    },
  });
  if (!operator) throw new AppError(404, "Operator not found");

  const [site, packageCount] = await Promise.all([
    prisma.site.findFirst({
      where: { operatorId },
      select: { id: true, name: true, city: true, siteId: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.package.count({ where: { operatorId } }),
  ]);

  res.json({
    success: true,
    status: {
      onboardingComplete: operator.onboardingComplete,
      operator: {
        name: operator.name,
        businessName: operator.businessName,
        operatorId: operator.operatorId,
        deviceType: operator.deviceType,
      },
      hasSite: !!site,
      hasPackage: packageCount > 0,
      site,
      portalPath: `/portal/${operator.operatorId}`,
    },
  });
});

// ── POST /api/onboarding/create-site  (operator) ─────────
// Provisions the operator's first site + first package in one step, wires up
// the MikroTik router record when applicable, and marks onboarding complete.
const createSiteSchema = z.object({
  siteName: z.string().trim().min(2),
  city: z.string().trim().optional(),
  // MikroTik connection details (ignored for Omada operators).
  mikrotikIp: z.string().trim().optional(),
  mikrotikUser: z.string().trim().optional(),
  mikrotikPass: z.string().trim().optional(),
  mikrotikPort: z.number().int().min(1).max(65535).optional(),
  // First package.
  packageName: z.string().trim().min(1),
  duration: z.number().int().min(1),
  durationUnit: z.enum(["minutes", "hours", "days"]).default("hours"),
  speed: z.number().int().min(1),
  price: z.number().int().min(0),
});

export const createSite = asyncHandler(async (req: Request, res: Response) => {
  const operatorId = req.auth!.id;
  const data = validateBody(createSiteSchema, req.body);

  const operator = await prisma.operator.findUnique({
    where: { id: operatorId },
    select: { id: true, operatorId: true, deviceType: true, onboardingComplete: true },
  });
  if (!operator) throw new AppError(404, "Operator not found");

  const isMikrotik = operator.deviceType === "mikrotik";

  const result = await prisma.$transaction(async (tx) => {
    const site = await tx.site.create({
      data: {
        name: data.siteName,
        city: data.city,
        operatorId,
        // Omada operators get an auto-generated site id (placeholder until a
        // real controller site is linked); MikroTik operators don't use one.
        siteId: isMikrotik ? null : `site_${randomBytes(4).toString("hex")}`,
      },
      select: { id: true, name: true, city: true, siteId: true },
    });

    let accessPoint = null;
    if (isMikrotik) {
      accessPoint = await tx.accessPoint.create({
        data: {
          name: `${data.siteName} Router`,
          macAddress: generatePlaceholderMac(),
          ipAddress: data.mikrotikIp ?? null,
          deviceType: "mikrotik",
          siteId: site.id,
          operatorId,
          mikrotikIp: data.mikrotikIp ?? null,
          mikrotikUser: data.mikrotikUser ?? null,
          mikrotikPass: data.mikrotikPass ?? null,
          mikrotikPort: data.mikrotikPort ?? 8728,
        },
        select: { id: true, name: true, macAddress: true, ipAddress: true },
      });
    }

    const pkg = await tx.package.create({
      data: {
        name: data.packageName,
        duration: data.duration,
        durationUnit: data.durationUnit,
        speed: data.speed,
        price: data.price,
        operatorId,
        siteId: site.id,
      },
      select: { id: true, name: true, price: true },
    });

    const updated = await tx.operator.update({
      where: { id: operatorId },
      data: { onboardingComplete: true },
      select: { operatorId: true },
    });

    return { site, accessPoint, package: pkg, operator: updated };
  });

  res.status(201).json({
    success: true,
    message: "Onboarding complete",
    site: result.site,
    accessPoint: result.accessPoint,
    package: result.package,
    portalPath: `/portal/${result.operator.operatorId}`,
  });
});
