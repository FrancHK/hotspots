import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import apiRoutes from "./routes/index.js";
import { errorHandler, notFound } from "./middleware/error.js";

const app = express();

app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
  }),
);

// The Snippe webhook needs the RAW body for HMAC verification, so capture it
// as a Buffer BEFORE the JSON parser runs (body-parser skips already-read
// bodies, so express.json() below won't touch this route).
app.use("/api/payments/webhook", express.raw({ type: "*/*" }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "hotspotx-backend", time: new Date().toISOString() });
});

// API
app.use("/api", apiRoutes);

// 404 + error handling (must be last)
app.use(notFound);
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`🐆 HotspotX backend running on http://localhost:${env.port}`);
  console.log(`   Env: ${env.nodeEnv}`);
});

export default app;
