import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { AppError, asyncHandler } from "../middleware/error.js";
import { validateBody } from "../middleware/validate.js";

const publicSelect = {
  primaryColor: true,
  secondaryColor: true,
  logoEmoji: true,
  businessName: true,
  subtitle: true,
  footer: true,
  template: true,
} as const;

// Returns the operator's settings, creating a default row if none exists yet.
async function ensureSettings(operatorId: string) {
  const existing = await prisma.portalSettings.findUnique({
    where: { operatorId },
  });
  if (existing) return existing;
  return prisma.portalSettings.create({ data: { operatorId } });
}

// ── GET /api/portal-settings/my  (operator) ──────────────
export const getMySettings = asyncHandler(
  async (req: Request, res: Response) => {
    const settings = await ensureSettings(req.auth!.id);
    res.json({ success: true, settings });
  },
);

// ── PUT /api/portal-settings/my  (operator) ──────────────
const hexColor = z
  .string()
  .trim()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Must be a hex colour");

const updateSchema = z
  .object({
    primaryColor: hexColor,
    secondaryColor: hexColor,
    logoEmoji: z.string().trim().min(1).max(8),
    businessName: z.string().trim().max(100),
    subtitle: z.string().trim().max(150),
    footer: z.string().trim().max(200),
    template: z.number().int().min(1).max(3),
  })
  .partial();

export const updateMySettings = asyncHandler(
  async (req: Request, res: Response) => {
    const operatorId = req.auth!.id;
    const data = validateBody(updateSchema, req.body);

    // Upsert so it works whether or not a row exists yet.
    const settings = await prisma.portalSettings.upsert({
      where: { operatorId },
      update: data,
      create: { operatorId, ...data },
    });

    res.json({ success: true, settings });
  },
);

// ── GET /api/portal-settings/operator/:operatorId  (PUBLIC) ──
// Branding for the captive portal. Accepts the internal UUID or public HSX id.
export const getOperatorSettings = asyncHandler(
  async (req: Request, res: Response) => {
    const { operatorId } = req.params as { operatorId: string };

    const operator = await prisma.operator.findFirst({
      where: { OR: [{ id: operatorId }, { operatorId }] },
      select: {
        operatorId: true,
        businessName: true,
        portalSettings: { select: publicSelect },
      },
    });
    if (!operator) throw new AppError(404, "Operator not found");

    // Fall back to sensible defaults if the operator never customised.
    const settings = operator.portalSettings ?? {
      primaryColor: "#FF8C42",
      secondaryColor: "#1a1f2e",
      logoEmoji: "🐆",
      businessName: operator.businessName,
      subtitle: null,
      footer: null,
      template: 1,
    };

    res.json({
      success: true,
      operatorId: operator.operatorId,
      settings,
    });
  },
);
