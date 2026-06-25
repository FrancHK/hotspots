import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/utils/password.js";

const prisma = new PrismaClient();

// ── Demo credentials (printed after seeding) ─────────────
const ADMIN = { email: "admin@hotspotx.tz", password: "admin123" };
const OMADA_OP = { email: "demo@hotspotx.tz", password: "demo1234" };
const MIKROTIK_OP = { email: "mikrotik@hotspotx.tz", password: "demo1234" };

// Re-creates an operator's child records so the seed is fully idempotent.
async function resetChildren(operatorId: string) {
  await prisma.voucher.deleteMany({ where: { operatorId } });
  await prisma.package.deleteMany({ where: { operatorId } });
  await prisma.accessPoint.deleteMany({ where: { operatorId } });
  await prisma.site.deleteMany({ where: { operatorId } });
}

async function main() {
  console.log("🌱 Seeding HotspotX…\n");

  // ── Admin ──────────────────────────────────────────────
  const adminHash = await hashPassword(ADMIN.password);
  await prisma.admin.upsert({
    where: { email: ADMIN.email },
    update: { password: adminHash },
    create: { name: "Super Admin", email: ADMIN.email, password: adminHash },
  });

  // ── Demo operator 1 — Omada ────────────────────────────
  const omadaHash = await hashPassword(OMADA_OP.password);
  const omada = await prisma.operator.upsert({
    where: { email: OMADA_OP.email },
    update: { status: "active" },
    create: {
      name: "Demo Owner",
      businessName: "Cheetah Cafe",
      email: OMADA_OP.email,
      password: omadaHash,
      phone: "0744000001",
      mpesa: "0744000001",
      region: "Dar es Salaam",
      status: "active",
      deviceType: "omada",
      package: "basic",
      operatorId: "HSX-2026-0001",
      onboardingComplete: true,
    },
    select: { id: true, operatorId: true },
  });

  await prisma.wallet.upsert({
    where: { operatorId: omada.id },
    update: {},
    create: { operatorId: omada.id },
  });
  await prisma.portalSettings.upsert({
    where: { operatorId: omada.id },
    update: {},
    create: {
      operatorId: omada.id,
      businessName: "Cheetah Cafe",
      subtitle: "Haraka · Nguvu · Imara",
      footer: "Powered by HotspotX",
      primaryColor: "#FF8C42",
      secondaryColor: "#1a1f2e",
      logoEmoji: "🐆",
      template: 1,
    },
  });

  await resetChildren(omada.id);

  const omadaSite = await prisma.site.create({
    data: {
      name: "Main Branch",
      city: "Dar es Salaam",
      siteId: "OMADA-SITE-DEMO",
      omadaEmail: OMADA_OP.email,
      operatorId: omada.id,
    },
  });

  await prisma.accessPoint.create({
    data: {
      name: "Reception AP",
      macAddress: "AA-BB-CC-00-00-01",
      ipAddress: "192.168.1.10",
      ssid: "Cheetah Free WiFi",
      model: "EAP225",
      status: "online",
      deviceType: "omada",
      siteId: omadaSite.id,
      operatorId: omada.id,
    },
  });

  await prisma.package.createMany({
    data: [
      { name: "Saa 1", duration: 1, durationUnit: "hours", speed: 3, price: 500, operatorId: omada.id, siteId: omadaSite.id },
      { name: "Saa 3", duration: 3, durationUnit: "hours", speed: 5, price: 1000, operatorId: omada.id, siteId: omadaSite.id },
      { name: "Siku 1", duration: 1, durationUnit: "days", speed: 10, price: 2000, operatorId: omada.id, siteId: omadaSite.id },
    ],
  });

  await prisma.voucher.createMany({
    data: Array.from({ length: 5 }, (_, i) => ({
      code: `OMDA-DEMO-${String(i + 1).padStart(4, "0")}`,
      title: "Saa 1",
      duration: 1,
      durationUnit: "hours" as const,
      speed: 3,
      price: 500,
      operatorId: omada.id,
    })),
  });

  // ── Demo operator 2 — MikroTik (no subscription) ───────
  const mtHash = await hashPassword(MIKROTIK_OP.password);
  const mikrotik = await prisma.operator.upsert({
    where: { email: MIKROTIK_OP.email },
    update: { status: "active" },
    create: {
      name: "Mikro Owner",
      businessName: "MikroNet Lodge",
      email: MIKROTIK_OP.email,
      password: mtHash,
      phone: "0712000002",
      mpesa: "0712000002",
      region: "Arusha",
      status: "active",
      deviceType: "mikrotik",
      package: "pro",
      noSubscription: true,
      operatorId: "HSX-2026-0002",
      onboardingComplete: true,
    },
    select: { id: true, operatorId: true },
  });

  await prisma.wallet.upsert({
    where: { operatorId: mikrotik.id },
    update: {},
    create: { operatorId: mikrotik.id },
  });
  await prisma.portalSettings.upsert({
    where: { operatorId: mikrotik.id },
    update: {},
    create: {
      operatorId: mikrotik.id,
      businessName: "MikroNet Lodge",
      subtitle: "Haraka · Nguvu · Imara",
      logoEmoji: "🐆",
      template: 2,
    },
  });

  await resetChildren(mikrotik.id);

  const mtSite = await prisma.site.create({
    data: { name: "Lodge WiFi", city: "Arusha", operatorId: mikrotik.id },
  });

  await prisma.accessPoint.create({
    data: {
      name: "Lobby Router",
      macAddress: "AA-BB-CC-00-00-02",
      ssid: "MikroNet Guest",
      status: "online",
      deviceType: "mikrotik",
      siteId: mtSite.id,
      operatorId: mikrotik.id,
      mikrotikIp: "192.168.88.1",
      mikrotikUser: "admin",
      mikrotikPass: "changeme",
      mikrotikPort: 8728,
    },
  });

  await prisma.package.createMany({
    data: [
      { name: "Saa 1", duration: 1, durationUnit: "hours", speed: 4, price: 500, operatorId: mikrotik.id, siteId: mtSite.id },
      { name: "Siku 1", duration: 1, durationUnit: "days", speed: 10, price: 2000, operatorId: mikrotik.id, siteId: mtSite.id },
    ],
  });

  await prisma.voucher.createMany({
    data: Array.from({ length: 3 }, (_, i) => ({
      code: `MKRT-DEMO-${String(i + 1).padStart(4, "0")}`,
      title: "Saa 1",
      duration: 1,
      durationUnit: "hours" as const,
      speed: 4,
      price: 500,
      operatorId: mikrotik.id,
    })),
  });

  // ── Summary ────────────────────────────────────────────
  console.log("✅ Seed complete.\n");
  console.log("┌──────────────────────────────────────────────┐");
  console.log("│  DEMO LOGIN CREDENTIALS                        │");
  console.log("├──────────────────────────────────────────────┤");
  console.log(`│  Admin     : ${ADMIN.email}  /  ${ADMIN.password}`);
  console.log(`│  Operator 1: ${OMADA_OP.email}  /  ${OMADA_OP.password}   (Omada)`);
  console.log(`│  Operator 2: ${MIKROTIK_OP.email}  /  ${MIKROTIK_OP.password}   (MikroTik)`);
  console.log("└──────────────────────────────────────────────┘");
  console.log("\nDemo operator public ids:");
  console.log(`  Omada    → ${omada.operatorId}  (AP AA-BB-CC-00-00-01)`);
  console.log(`  MikroTik → ${mikrotik.operatorId}  (AP AA-BB-CC-00-00-02)`);
  console.log("\nSample vouchers: OMDA-DEMO-0001…0005  |  MKRT-DEMO-0001…0003\n");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error("❌ Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
