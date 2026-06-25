import axios from "axios";
import crypto from "node:crypto";
import { env } from "./env.js";
import type {
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentEvent,
  PaymentProvider,
} from "../services/payments/types.js";

// Snippe payment provider — https://docs.snippe.sh/docs/2026-01-25/payments
//
// Webhook signature scheme: HMAC-SHA256 over "{timestamp}.{rawBody}" using the
// webhook secret, hex-encoded, sent in the X-Webhook-Signature header. The
// timestamp arrives in X-Webhook-Timestamp (unix seconds).

const REPLAY_WINDOW_SECONDS = 5 * 60;

function randomReference(): string {
  return `SIM-${crypto.randomBytes(8).toString("hex").toUpperCase()}`;
}

export const snippeProvider: PaymentProvider = {
  name: "snippe",

  async createPayment(
    input: CreatePaymentInput,
  ): Promise<CreatePaymentResult> {
    if (env.payment.simulate) {
      return { reference: randomReference(), status: "pending", simulated: true };
    }

    const res = await axios.post(
      `${env.payment.snippe.baseUrl}/v1/payments`,
      {
        payment_type: "mobile",
        details: { amount: input.amount, currency: input.currency },
        phone_number: input.phoneNumber,
        customer: input.customer,
        webhook_url: input.webhookUrl,
        metadata: input.metadata,
      },
      {
        timeout: 15_000,
        headers: {
          Authorization: `Bearer ${env.payment.snippe.apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": input.idempotencyKey.slice(0, 30),
        },
      },
    );

    const data = res.data?.data ?? {};
    if (!data.reference) {
      throw new Error("Snippe did not return a payment reference");
    }
    return {
      reference: data.reference,
      status: data.status ?? "pending",
      expiresAt: data.expires_at,
      simulated: false,
    };
  },

  verifyWebhook(
    rawBody: string,
    signatureHeader: string,
    timestampHeader: string,
  ): boolean {
    if (!signatureHeader || !timestampHeader) return false;

    const signed = `${timestampHeader}.${rawBody}`;
    const expected = crypto
      .createHmac("sha256", env.payment.snippe.webhookSecret)
      .update(signed)
      .digest("hex");

    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(signatureHeader, "utf8");
    // Constant-time compare; lengths must match for timingSafeEqual.
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  },

  isTimestampFresh(timestampHeader: string): boolean {
    const ts = Number(timestampHeader);
    if (!Number.isFinite(ts)) return false;
    const ageSeconds = Math.abs(Date.now() / 1000 - ts);
    return ageSeconds <= REPLAY_WINDOW_SECONDS;
  },

  parseEvent(rawBody: string): PaymentEvent {
    const body = JSON.parse(rawBody);
    const data = body.data ?? {};
    return {
      id: body.id ?? data.id ?? "",
      type: body.type ?? "",
      reference: data.reference ?? body.reference ?? "",
      metadata: data.metadata ?? body.metadata ?? {},
    };
  },
};
