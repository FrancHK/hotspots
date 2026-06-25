import type { DeviceType, PaymentMethod } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/error.js";
import { authorizeClient } from "./network/index.js";
import type { AuthorizeResult } from "./network/index.js";
import { computeCommissionSplit } from "./commission.js";
import { endTimeFrom } from "../utils/duration.js";

// How to reach the hardware behind an AccessPoint, shared by both flows.
interface AccessPointConn {
  macAddress: string;
  omadaSiteId: string | null;
  mikrotikIp: string | null;
  mikrotikUser: string | null;
  mikrotikPass: string | null;
  mikrotikPort: number;
}

// Builds the unified authorize params from an operator + access point.
async function authorizeOnNetwork(
  deviceType: DeviceType,
  accessPoint: AccessPointConn,
  clientMac: string,
  durationMinutes: number,
  speedMbps: number,
): Promise<AuthorizeResult> {
  const auth = await authorizeClient(deviceType, {
    clientMac,
    durationMinutes,
    speedMbps,
    omadaSiteId: accessPoint.omadaSiteId,
    mikrotik:
      deviceType === "mikrotik"
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
  return auth;
}

interface GrantInput {
  operator: {
    id: string;
    deviceType: DeviceType;
    commissionRate: number;
    voucherCommission: number;
  };
  accessPoint: AccessPointConn;
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
  const auth = await authorizeOnNetwork(
    operator.deviceType,
    accessPoint,
    clientMac,
    durationMinutes,
    speedMbps,
  );

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

interface SettleInput {
  transactionId: string;
  operator: { id: string; deviceType: DeviceType };
  accessPoint: AccessPointConn;
  clientMac: string;
  amount: number;
  operatorEarning: number; // pre-computed at initiate time
  durationMinutes: number;
  speedMbps: number;
  packageId?: string;
}

// Settles an already-created PENDING transaction once a mobile-money payment
// has completed: authorizes the client on the network (same unified path as
// the voucher flow), flips the transaction to success, credits the wallet,
// and starts a session — all atomically. Called from the Snippe webhook.
export async function settlePaidTransaction(input: SettleInput) {
  const {
    transactionId,
    operator,
    accessPoint,
    clientMac,
    amount,
    operatorEarning,
    durationMinutes,
    speedMbps,
    packageId,
  } = input;

  const auth = await authorizeOnNetwork(
    operator.deviceType,
    accessPoint,
    clientMac,
    durationMinutes,
    speedMbps,
  );

  const startTime = new Date();
  const endTime = endTimeFrom(startTime, durationMinutes);

  const session = await prisma.$transaction(async (tx) => {
    await tx.transaction.update({
      where: { id: transactionId },
      data: { status: "success" },
    });

    await tx.wallet.update({
      where: { operatorId: operator.id },
      data: {
        balance: { increment: operatorEarning },
        totalEarned: { increment: operatorEarning },
      },
    });

    return tx.session.create({
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
  });

  return { auth, session };
}
