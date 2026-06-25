import type { DeviceType, PaymentMethod } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/error.js";
import { authorizeClient } from "./network/index.js";
import { computeCommissionSplit } from "./commission.js";
import { endTimeFrom } from "../utils/duration.js";

interface GrantInput {
  operator: {
    id: string;
    deviceType: DeviceType;
    commissionRate: number;
    voucherCommission: number;
  };
  accessPoint: {
    macAddress: string;
    omadaSiteId: string | null;
    mikrotikIp: string | null;
    mikrotikUser: string | null;
    mikrotikPass: string | null;
    mikrotikPort: number;
  };
  siteId: string | null; // internal Site id (for the Transaction record)
  clientMac: string;
  method: PaymentMethod;
  amount: number;
  durationMinutes: number;
  speedMbps: number;
  voucherId?: string; // when paying with a voucher
  packageId?: string; // when paying for a package
  reference?: string; // payment gateway reference (mobile money)
}

// Opens internet access on the hardware, then atomically records the money
// trail: marks the voucher used (if any), creates a Transaction, credits the
// operator's Wallet, and starts a Session. Used by both the voucher portal
// flow and (later) the mobile-money payment callback.
export async function grantInternetAccess(input: GrantInput) {
  const {
    operator,
    accessPoint,
    siteId,
    clientMac,
    method,
    amount,
    durationMinutes,
    speedMbps,
    voucherId,
    packageId,
    reference,
  } = input;

  // 1) Authorize on the network first — if this fails we record nothing.
  const auth = await authorizeClient(operator.deviceType, {
    clientMac,
    durationMinutes,
    speedMbps,
    omadaSiteId: accessPoint.omadaSiteId,
    mikrotik:
      operator.deviceType === "mikrotik"
        ? {
            ip: accessPoint.mikrotikIp ?? "",
            user: accessPoint.mikrotikUser ?? "",
            pass: accessPoint.mikrotikPass ?? "",
            port: accessPoint.mikrotikPort,
          }
        : null,
  });

  if (!auth.success) {
    throw new AppError(502, "Failed to authorize client on the network");
  }

  // 2) Money trail + session, atomically.
  const split = computeCommissionSplit(amount, method, operator);
  const startTime = new Date();
  const endTime = endTimeFrom(startTime, durationMinutes);

  const result = await prisma.$transaction(async (tx) => {
    if (voucherId) {
      await tx.voucher.update({
        where: { id: voucherId },
        data: { status: "used", usedBy: clientMac, usedAt: startTime },
      });
    }

    const transaction = await tx.transaction.create({
      data: {
        amount,
        method,
        adminCommission: split.adminCommission,
        operatorEarning: split.operatorEarning,
        clientMac,
        apMac: accessPoint.macAddress,
        siteId,
        duration: durationMinutes,
        status: "success",
        reference,
        operatorId: operator.id,
      },
    });

    await tx.wallet.update({
      where: { operatorId: operator.id },
      data: {
        balance: { increment: split.operatorEarning },
        totalEarned: { increment: split.operatorEarning },
      },
    });

    const session = await tx.session.create({
      data: {
        clientMac,
        apMac: accessPoint.macAddress,
        startTime,
        endTime,
        status: "active",
        packageId,
        amount,
        speed: speedMbps,
        operatorId: operator.id,
      },
    });

    return { transaction, session };
  });

  return {
    auth,
    transaction: result.transaction,
    session: result.session,
    split,
  };
}
