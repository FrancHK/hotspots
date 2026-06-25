import { env } from "../../config/env.js";
import { snippeProvider } from "../../config/snippe.js";
import type { PaymentProvider } from "./types.js";

// Provider registry — swap providers by changing PAYMENT_PROVIDER in .env.
const providers: Record<string, PaymentProvider> = {
  snippe: snippeProvider,
};

export const paymentProvider: PaymentProvider =
  providers[env.payment.provider] ?? snippeProvider;

export type {
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentEvent,
  PaymentProvider,
} from "./types.js";
