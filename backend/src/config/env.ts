import dotenv from "dotenv";

dotenv.config();

function required(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 5000),
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:3000",
  // Public base URL of THIS backend (used to build the Snippe webhook URL).
  appBaseUrl: process.env.APP_BASE_URL ?? "http://localhost:5000",

  databaseUrl: required("DATABASE_URL"),

  jwt: {
    secret: required("JWT_SECRET", "dev-insecure-secret-change-me"),
    expiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  },

  omada: {
    baseUrl: process.env.OMADA_BASE_URL ?? "",
    controllerId: process.env.OMADA_CONTROLLER_ID ?? "",
    user: process.env.OMADA_OPERATOR_USER ?? "",
    pass: process.env.OMADA_OPERATOR_PASS ?? "",
    verifySsl: process.env.OMADA_VERIFY_SSL === "true",
  },

  payment: {
    // Swappable provider selector: snippe | (future: azampay, clickpesa…)
    provider: process.env.PAYMENT_PROVIDER ?? "snippe",
    // When true, the outbound "create payment" call is faked (no real Snippe
    // request) so the flow is testable locally. Webhook verification stays real.
    simulate:
      process.env.PAYMENT_SIMULATE !== undefined
        ? process.env.PAYMENT_SIMULATE === "true"
        : process.env.NODE_ENV !== "production",
    snippe: {
      baseUrl: process.env.SNIPPE_BASE_URL ?? "https://api.snippe.sh",
      apiKey: process.env.SNIPPE_API_KEY ?? "",
      webhookSecret: process.env.SNIPPE_WEBHOOK_SECRET ?? "",
    },
  },

  sms: {
    provider: process.env.SMS_PROVIDER ?? "africastalking",
    apiKey: process.env.SMS_API_KEY ?? "",
    username: process.env.SMS_USERNAME ?? "",
    senderId: process.env.SMS_SENDER_ID ?? "HotspotX",
  },

  network: {
    // When true, network adapters short-circuit and report success without
    // contacting any real Omada controller / MikroTik router. Defaults on
    // outside production so the captive-portal flow is testable locally.
    simulate:
      process.env.NETWORK_SIMULATE !== undefined
        ? process.env.NETWORK_SIMULATE === "true"
        : process.env.NODE_ENV !== "production",
  },
} as const;

export const isProd = env.nodeEnv === "production";
