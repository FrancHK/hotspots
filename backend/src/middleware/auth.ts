import type { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { AppError, asyncHandler } from "./error.js";
import { verifyToken } from "../utils/jwt.js";

function extractToken(req: Request): string {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    throw new AppError(401, "Authentication required");
  }
  return header.slice("Bearer ".length).trim();
}

// Allows only authenticated admins.
export const protectAdmin = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const token = extractToken(req);

    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      throw new AppError(401, "Invalid or expired token");
    }

    if (payload.role !== "admin") {
      throw new AppError(403, "Admin access only");
    }

    const admin = await prisma.admin.findUnique({
      where: { id: payload.sub },
      select: { id: true },
    });
    if (!admin) throw new AppError(401, "Admin account not found");

    req.auth = { id: admin.id, role: "admin" };
    next();
  },
);

// Allows only authenticated, active operators. Loads the public operatorId
// so downstream handlers can scope queries to the operator's own data.
export const protectOperator = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const token = extractToken(req);

    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      throw new AppError(401, "Invalid or expired token");
    }

    if (payload.role !== "operator") {
      throw new AppError(403, "Operator access only");
    }

    const operator = await prisma.operator.findUnique({
      where: { id: payload.sub },
      select: { id: true, operatorId: true, status: true },
    });
    if (!operator) throw new AppError(401, "Operator account not found");
    if (operator.status === "blocked") {
      throw new AppError(403, "Your account has been blocked");
    }
    if (operator.status === "pending") {
      throw new AppError(403, "Your account is pending approval");
    }

    req.auth = {
      id: operator.id,
      role: "operator",
      operatorId: operator.operatorId,
    };
    next();
  },
);
