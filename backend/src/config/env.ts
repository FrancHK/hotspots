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
    provider: process.env.PAYMENT_PROVIDER ?? "azampay",
    baseUrl: process.env.PAYMENT_BASE_URL ?? "",
    appName: process.env.PAYMENT_APP_NAME ?? "",
    clientId: process.env.PAYMENT_CLIENT_ID ?? "",
    clientSecret: process.env.PAYMENT_CLIENT_SECRET ?? "",
    webhookSecret: process.env.PAYMENT_WEBHOOK_SECRET ?? "",
  },

  sms: {
    provider: process.env.SMS_PROVIDER ?? "africastalking",
    apiKey: process.env.SMS_API_KEY ?? "",
    username: process.env.SMS_USERNAME ?? "",
    senderId: process.env.SMS_SENDER_ID ?? "HotspotX",
  },
} as const;

export const isProd = env.nodeEnv === "production";
