import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { env } from "../config/env.js";
import { AppError, asyncHandler } from "../middleware/error.js";
import { validateBody } from "../middleware/validate.js";
import { paymentProvider } from "../services/payments/index.js";
import type { PaymentEvent } from "../services/payments/index.js";
import { settlePaidTransaction } from "../services/hotspot.js";
import { computeCommissionSplit } from "../services/commission.js";
import { toMinutes } from "../utils/duration.js";
import { detectMobileMethod, normalizeTzPhone } from "../utils/phone.js";

// In-memory de-duplication of webhook event ids. Idempotency is also enforced
// by the transaction status check, so a restart cannot cause double-crediting.
const processedEvents = new Set<string>();

async function findAccessPoint(apMac: string) {
  return prisma.accessPoint.findUnique({
    where: { macAddress: apMac },
    include: {
      operator: {
        select: {
          id: true,
          operatorId: true,
          deviceType: true,
          status: true,
          commissionRate: true,
          voucherCommission: true,
        },
      },
      site: { select: { id: true, siteId: true } },
    },
  });
}

// ── POST /api/payments/initiate  (PUBLIC, from portal) ───
const initiateSchema = z.object({
  clientMac: z.string().trim().min(1),
  apMac: z.string().trim().min(1),
  operatorId: z.string().trim().min(1),
  packageId: z.string().uuid(),
  phoneNumber: z.string().trim().min(7),
  firstname: z.string().trim().optional(),
  lastname: z.string().trim().optional(),
  email: z.string().trim().email().optional(),
});

export const initiatePayment = asyncHandler(
  async (req: Request, res: Response) => {
    const data = validateBody(initiateSchema, req.body);

    const ap = await findAccessPoint(data.apMac);
    if (!ap) throw new AppError(404, "Access point not recognised");
    if (ap.operator.status !== "active") {
      throw new AppError(403, "This hotspot is not active");
    }
    // The operatorId from the portal must match the AP's owner.
    if (
      data.operatorId !== ap.operator.id &&
      data.operatorId !== ap.operator.operatorId
    ) {
      throw new AppError(400, "Operator does not match this access point");
    }

    const pkg = await prisma.package.findFirst({
      where: { id: data.packageId, operatorId: ap.operator.id, status: "active" },
    });
    if (!pkg) throw new AppError(404, "Package not available");

    const phone = normalizeTzPhone(data.phoneNumber);
    const method = detectMobileMethod(phone);
    const durationMinutes = toMinutes(pkg.duration, pkg.durationUnit);
    const split = computeCommissionSplit(pkg.price, method, ap.operator);

    // Create the pending transaction first so its id seeds the idempotency key.
    const transaction = await prisma.transaction.create({
      data: {
        amount: pkg.price,
        method,
        adminCommission: split.adminCommission,
        operatorEarning: split.operatorEarning,
        clientMac: data.clientMac,
        apMac: data.apMac,
        siteId: ap.site.id,
        duration: durationMinutes,
        status: "pending",
        operatorId: ap.operator.id,
      },
    });

    const idempotencyKey = `txn_${transaction.id.replace(/-/g, "").slice(0, 26)}`;

    let payment;
    try {
      payment = await paymentProvider.createPayment({
        amount: pkg.price,
        currency: "TZS",
        phoneNumber: phone,
        customer: {
          firstname: data.firstname ?? "HotspotX",
          lastname: data.lastname ?? "Customer",
          email: data.email ?? "customer@hotspotx.tz",
        },
        webhookUrl: `${env.appBaseUrl}/api/payments/webhook`,
        idempotencyKey,
        metadata: {
          clientMac: data.clientMac,
          apMac: data.apMac,
          operatorId: ap.operator.id,
          packageId: pkg.id,
        },
      });
    } catch (err) {
      // Mark the transaction failed if the provider could not be reached.
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: "failed" },
      });
      throw new AppError(502, "Could not initiate payment");
    }

    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { reference: payment.reference },
    });

    res.status(201).json({
      success: true,
      reference: payment.reference,
      status: payment.status,
      transactionId: transaction.id,
      simulated: payment.simulated,
    });
  },
);

// ── GET /api/payments/status/:reference  (PUBLIC, portal polls) ──
export const paymentStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { reference } = req.params as { reference: string };

    const transaction = await prisma.transaction.findFirst({
      where: { reference },
      select: { id: true, reference: true, status: true, amount: true, method: true },
    });
    if (!transaction) throw new AppError(404, "Payment not found");

    res.json({ success: true, payment: transaction });
  },
);

// ── POST /api/payments/webhook  (PUBLIC, Snippe calls) ───
// Mounted with express.raw() so req.body is the raw Buffer required for HMAC.
export const paymentWebhook = asyncHandler(
  async (req: Request, res: Response) => {
    const rawBody = Buffer.isBuffer(req.body)
      ? req.body.toString("utf8")
      : typeof req.body === "string"
        ? req.body
        : JSON.stringify(req.body);

    const signature = String(req.header("X-Webhook-Signature") ?? "");
    const timestamp = String(req.header("X-Webhook-Timestamp") ?? "");

    // 1) Authenticity (constant-time HMAC over "{timestamp}.{rawBody}").
    if (!paymentProvider.verifyWebhook(rawBody, signature, timestamp)) {
      throw new AppError(401, "Invalid webhook signature");
    }
    // 2) Replay protection.
    if (!paymentProvider.isTimestampFresh(timestamp)) {
      throw new AppError(400, "Webhook timestamp outside allowed window");
    }

    let event: PaymentEvent;
    try {
      event = paymentProvider.parseEvent(rawBody);
    } catch {
      throw new AppError(400, "Malformed webhook body");
    }

    // 3) De-duplicate by event id.
    if (event.id && processedEvents.has(event.id)) {
      return res.status(200).json({ received: true, duplicate: true });
    }
    if (event.id) processedEvents.add(event.id);

    // 4) Acknowledge fast, then process asynchronously.
    res.status(200).json({ received: true });
    setImmediate(() => {
      processPaymentEvent(event).catch((err) =>
        console.error("[payments] webhook processing failed", err),
      );
    });
  },
);

// Async settlement — never throws to the HTTP layer.
async function processPaymentEvent(event: PaymentEvent): Promise<void> {
  if (!event.reference) return;

  const transaction = await prisma.transaction.findFirst({
    where: { reference: event.reference },
  });
  if (!transaction) {
    console.warn(`[payments] no transaction for reference ${event.reference}`);
    return;
  }
  if (transaction.status !== "pending") return; // already settled — idempotent

  if (event.type === "payment.failed") {
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: "failed" },
    });
    return;
  }

  if (event.type !== "payment.completed") return; // ignore other event types

  // Rebuild the network context. speed comes from the package referenced in
  // the event metadata (verified against the transaction's operator).
  const ap = transaction.apMac
    ? await findAccessPoint(transaction.apMac)
    : null;
  if (!ap) {
    console.error(`[payments] AP ${transaction.apMac} missing; cannot settle`);
    return;
  }

  const packageId = String(event.metadata.packageId ?? "");
  const pkg = packageId
    ? await prisma.package.findFirst({
        where: { id: packageId, operatorId: transaction.operatorId },
        select: { speed: true },
      })
    : null;
  if (!pkg) {
    console.error(`[payments] package ${packageId} missing; cannot settle`);
    return;
  }

  await settlePaidTransaction({
    transactionId: transaction.id,
    operator: { id: ap.operator.id, deviceType: ap.operator.deviceType },
    accessPoint: {
      macAddress: ap.macAddress,
      omadaSiteId: ap.site.siteId,
      mikrotikIp: ap.mikrotikIp,
      mikrotikUser: ap.mikrotikUser,
      mikrotikPass: ap.mikrotikPass,
      mikrotikPort: ap.mikrotikPort,
    },
    clientMac: transaction.clientMac ?? "",
    amount: transaction.amount,
    operatorEarning: transaction.operatorEarning,
    durationMinutes: transaction.duration ?? 0,
    speedMbps: pkg.speed,
    packageId,
  });
}
