import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { AppError, asyncHandler } from "../middleware/error.js";
import { validateBody } from "../middleware/validate.js";
import { comparePassword, hashPassword } from "../utils/password.js";
import { signToken } from "../utils/jwt.js";
import { generateOperatorId } from "../utils/operatorId.js";

// ── Schemas ──────────────────────────────────────────────
const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  name: z.string().trim().min(2, "Name is too short"),
  businessName: z.string().trim().min(2, "Business name is too short"),
  email: z.string().trim().toLowerCase().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().trim().min(7, "Invalid phone number"),
  mpesa: z.string().trim().optional(),
  region: z.string().trim().optional(),
  package: z.enum(["starter", "basic", "pro"]).default("starter"),
  deviceType: z.enum(["omada", "mikrotik"]).default("omada"),
});

// ── POST /api/auth/admin/login ───────────────────────────
export const adminLogin = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = validateBody(loginSchema, req.body);

  const admin = await prisma.admin.findUnique({ where: { email } });
  if (!admin || !(await comparePassword(password, admin.password))) {
    throw new AppError(401, "Invalid email or password");
  }

  const token = signToken({ sub: admin.id, role: "admin" });
  res.json({
    success: true,
    token,
    admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
  });
});

// ── POST /api/auth/operator/login ────────────────────────
export const operatorLogin = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = validateBody(loginSchema, req.body);

  const operator = await prisma.operator.findUnique({ where: { email } });
  if (!operator || !(await comparePassword(password, operator.password))) {
    throw new AppError(401, "Invalid email or password");
  }
  if (operator.status === "blocked") {
    throw new AppError(403, "Your account has been blocked. Contact support.");
  }

  const token = signToken({ sub: operator.id, role: "operator" });
  res.json({
    success: true,
    token,
    operator: {
      id: operator.id,
      operatorId: operator.operatorId,
      name: operator.name,
      businessName: operator.businessName,
      email: operator.email,
      status: operator.status,
      deviceType: operator.deviceType,
      package: operator.package,
      onboardingComplete: operator.onboardingComplete,
    },
  });
});

// ── POST /api/auth/operator/register ─────────────────────
// Creates a PENDING operator (admin must approve), generates the public
// HSX-YYYY-XXXX id, and provisions a wallet + default portal settings.
// MikroTik operators have no subscription and are always treated as `pro`.
export const operatorRegister = asyncHandler(
  async (req: Request, res: Response) => {
    const data = validateBody(registerSchema, req.body);

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
        status: "pending",
        operatorId: operatorPublicId,
        wallet: { create: {} },
        portalSettings: {
          create: { businessName: data.businessName },
        },
      },
      select: {
        id: true,
        operatorId: true,
        name: true,
        businessName: true,
        email: true,
        status: true,
        deviceType: true,
        package: true,
        noSubscription: true,
      },
    });

    res.status(201).json({
      success: true,
      message:
        "Registration successful. Your account is pending admin approval.",
      operator,
    });
  },
);

// ── GET /api/auth/admin/me (protectAdmin) ────────────────
export const adminMe = asyncHandler(async (req: Request, res: Response) => {
  const admin = await prisma.admin.findUnique({
    where: { id: req.auth!.id },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  res.json({ success: true, admin });
});

// ── GET /api/auth/operator/me (protectOperator) ──────────
export const operatorMe = asyncHandler(async (req: Request, res: Response) => {
  const operator = await prisma.operator.findUnique({
    where: { id: req.auth!.id },
    select: {
      id: true,
      operatorId: true,
      name: true,
      businessName: true,
      email: true,
      phone: true,
      mpesa: true,
      region: true,
      status: true,
      deviceType: true,
      package: true,
      noSubscription: true,
      onboardingComplete: true,
      subscriptionEnd: true,
      createdAt: true,
    },
  });
  res.json({ success: true, operator });
});
