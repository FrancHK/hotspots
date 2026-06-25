import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { AppError, asyncHandler } from "../middleware/error.js";
import { validateBody } from "../middleware/validate.js";

const durationUnit = z.enum(["minutes", "hours", "days"]);

const packageSelect = {
  id: true,
  name: true,
  duration: true,
  durationUnit: true,
  speed: true,
  price: true,
  status: true,
  siteId: true,
  createdAt: true,
} as const;

// ── POST /api/packages  (operator) ───────────────────────
const createSchema = z.object({
  name: z.string().trim().min(1),
  duration: z.number().int().min(1),
  durationUnit: durationUnit.default("hours"),
  speed: z.number().int().min(1), // Mbps
  price: z.number().int().min(0), // TZS
  status: z.enum(["active", "inactive"]).default("active"),
  siteId: z.string().uuid().optional(),
});

export const createPackage = asyncHandler(
  async (req: Request, res: Response) => {
    const operatorId = req.auth!.id;
    const data = validateBody(createSchema, req.body);

    // If a site is supplied, it must belong to this operator.
    if (data.siteId) {
      const site = await prisma.site.findFirst({
        where: { id: data.siteId, operatorId },
        select: { id: true },
      });
      if (!site) throw new AppError(404, "Site not found");
    }

    const pkg = await prisma.package.create({
      data: { ...data, operatorId },
      select: packageSelect,
    });

    res.status(201).json({ success: true, package: pkg });
  },
);

// ── GET /api/packages/my  (operator) ─────────────────────
// Optional filter: ?status=active|inactive
export const getMyPackages = asyncHandler(
  async (req: Request, res: Response) => {
    const operatorId = req.auth!.id;
    const { status } = req.query;

    const packages = await prisma.package.findMany({
      where: {
        operatorId,
        ...(typeof status === "string" ? { status: status as never } : {}),
      },
      select: packageSelect,
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, count: packages.length, packages });
  },
);

// ── GET /api/packages/operator/:operatorId  (PUBLIC) ─────
// Used by the captive portal. Returns ACTIVE packages only, and only for an
// ACTIVE operator. Accepts either the internal UUID or the public HSX id.
export const getOperatorPackages = asyncHandler(
  async (req: Request, res: Response) => {
    const { operatorId } = req.params as { operatorId: string };

    const operator = await prisma.operator.findFirst({
      where: { OR: [{ id: operatorId }, { operatorId }] },
      select: {
        id: true,
        operatorId: true,
        businessName: true,
        status: true,
      },
    });
    if (!operator || operator.status !== "active") {
      throw new AppError(404, "Operator not available");
    }

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
      },
      count: packages.length,
      packages,
    });
  },
);

// ── PUT /api/packages/:id  (operator) ────────────────────
const updateSchema = z
  .object({
    name: z.string().trim().min(1),
    duration: z.number().int().min(1),
    durationUnit: durationUnit,
    speed: z.number().int().min(1),
    price: z.number().int().min(0),
    status: z.enum(["active", "inactive"]),
  })
  .partial();

export const updatePackage = asyncHandler(
  async (req: Request, res: Response) => {
    const operatorId = req.auth!.id;
    const { id } = req.params as { id: string };
    const data = validateBody(updateSchema, req.body);

    const owned = await prisma.package.findFirst({
      where: { id, operatorId },
      select: { id: true },
    });
    if (!owned) throw new AppError(404, "Package not found");

    const pkg = await prisma.package.update({
      where: { id },
      data,
      select: packageSelect,
    });

    res.json({ success: true, package: pkg });
  },
);

// ── DELETE /api/packages/:id  (operator) ─────────────────
export const deletePackage = asyncHandler(
  async (req: Request, res: Response) => {
    const operatorId = req.auth!.id;
    const { id } = req.params as { id: string };

    const owned = await prisma.package.findFirst({
      where: { id, operatorId },
      select: { id: true, name: true },
    });
    if (!owned) throw new AppError(404, "Package not found");

    await prisma.package.delete({ where: { id } });
    res.json({ success: true, message: `Package "${owned.name}" deleted` });
  },
);
