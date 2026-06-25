// Swappable payment-provider contract. Snippe is the first implementation;
// future aggregators (Azampay, ClickPesa, Selcom) implement the same interface
// so business logic never changes.

export interface CreatePaymentInput {
  amount: number; // integer TZS
  currency: string; // "TZS"
  phoneNumber: string; // normalised, e.g. 255XXXXXXXXX
  customer: { firstname: string; lastname: string; email: string };
  webhookUrl: string;
  idempotencyKey: string; // max 30 chars
  metadata: Record<string, unknown>;
}

export interface CreatePaymentResult {
  reference: string;
  status: string; // "pending"
  expiresAt?: string;
  simulated: boolean;
}

// Normalised webhook event shared across providers.
export interface PaymentEvent {
  id: string; // event id, used for de-duplication
  type: string; // "payment.completed" | "payment.failed" | …
  reference: string; // the payment reference
  metadata: Record<string, unknown>;
}

export interface PaymentProvider {
  readonly name: string;

  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;

  // Verifies a webhook's authenticity from the RAW (unparsed) body.
  verifyWebhook(
    rawBody: string,
    signatureHeader: string,
    timestampHeader: string,
  ): boolean;

  // Rejects events whose signed timestamp is older than the allowed window.
  isTimestampFresh(timestampHeader: string): boolean;

  // Parses the raw body into a normalised event.
  parseEvent(rawBody: string): PaymentEvent;
}
