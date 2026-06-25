# HotspotX 🐆

**Haraka · Nguvu · Imara**

HotspotX is a multi-tenant WiFi hotspot management SaaS platform built for the
Tanzanian market. It lets businesses (hotels, cafés, hospitals) sell internet
access over their own WiFi through a captive portal — customers pay with mobile
money or a voucher, and the platform automatically opens their internet access,
splits the revenue, and tracks everything.

## Roles

| Role | Description |
|------|-------------|
| **Super Admin** | Owns the platform. Manages operators, sees all commission, sends notifications. |
| **Operator** | A business with its own WiFi. Manages packages, vouchers, branding, and sees its own earnings. |
| **Customer** | Connects to the WiFi and pays at the captive portal. No account needed. |

## Commission model

| Payment method | Admin commission | Operator earning |
|---|---|---|
| M-Pesa / Airtel / Tigo (Mixx) | 10% | 90% |
| Voucher | 3% | 97% |

**MikroTik operators** have `noSubscription = true` (always treated as the `pro`
tier, free) and only pay per-transaction commission.

---

## Tech stack

- **Backend:** Node.js + Express 5 + TypeScript
- **Database:** PostgreSQL 17 + Prisma 6 (ORM)
- **Auth:** JWT (jsonwebtoken) + bcryptjs
- **Network control:** Omada Controller v6 API + MikroTik RouterOS API (swappable adapters)
- **Payments:** [Snippe](https://docs.snippe.sh) mobile money (M-Pesa, Airtel, Mixx by Yas, Halotel) — swappable adapter
- **Frontend:** Next.js (App Router) + Tailwind CSS *(in progress)*

---

## Requirements

- **Node.js** ≥ 20 (tested on v24)
- **PostgreSQL** ≥ 14 (tested on 17)
- npm

---

## Setup (backend)

### 1. Clone the repository

```bash
git clone git@github.com:FrancHK/hotspots.git
cd hotspots/backend
```

### 2. Install dependencies

```bash
npm install
```

> If npm blocks install scripts, approve the Prisma/esbuild scripts:
> `npm approve-scripts prisma @prisma/engines @prisma/client esbuild && npm rebuild`

### 3. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

Then edit `.env` (see [Environment variables](#environment-variables) below).
At minimum set `DATABASE_URL` and `JWT_SECRET`.

### 4. Run the database migration

Creates the database (if needed) and all tables:

```bash
npx prisma migrate dev
```

### 5. Seed demo data

```bash
npm run seed
```

This creates one admin and two demo operators (Omada + MikroTik) with sites,
access points, packages, and vouchers. It is **idempotent** — safe to run
repeatedly; it resets the demo data each time. The demo login credentials are
printed at the end.

### 6. Start the server

```bash
npm run dev      # development (hot reload via tsx)
# or
npm run build && npm start   # production build
```

The API runs at **http://localhost:5000**. Health check: `GET /health`.

---

## Demo credentials

After seeding:

| Account | Email | Password | Notes |
|---|---|---|---|
| Admin | `admin@hotspotx.tz` | `admin123` | Super Admin |
| Operator 1 | `demo@hotspotx.tz` | `demo1234` | Omada · `HSX-2026-0001` · AP `AA-BB-CC-00-00-01` |
| Operator 2 | `mikrotik@hotspotx.tz` | `demo1234` | MikroTik · `HSX-2026-0002` · AP `AA-BB-CC-00-00-02` |

Sample vouchers: `OMDA-DEMO-0001`…`0005` (Omada) and `MKRT-DEMO-0001`…`0003` (MikroTik).

---

## API overview

Base URL: `http://localhost:5000/api`

### Auth
- `POST /auth/admin/login`
- `POST /auth/operator/login`
- `POST /auth/operator/register` — self-registration (creates a pending operator)
- `GET  /auth/admin/me` · `GET /auth/operator/me`

### Operators (admin)
- `GET /operators` · `GET /operators/:id` · `POST /operators`
- `PUT /operators/:id/status` · `DELETE /operators/:id`
- `GET /operators/admin/commission-stats`

### Packages
- `POST /packages` · `GET /packages/my` · `PUT /packages/:id` · `DELETE /packages/:id` (operator)
- `GET /packages/operator/:operatorId` — **public**, active packages only

### Vouchers (operator)
- `POST /vouchers/create` — batch generate
- `GET /vouchers/my` — filter by `title` / `status`
- `DELETE /vouchers/:id` — unused only

### Hotspot / captive portal (public)
- `GET  /hotspot/client-login?clientMac=X&apMac=Y`
- `POST /hotspot/voucher-access`
- `GET  /hotspot/operator-info/:operatorId`

### Wallet (operator)
- `GET /wallet/me` · `GET /wallet/analytics` · `GET /wallet/sessions` · `GET /wallet/transactions`
- `POST /wallet/withdraw`

### Payments (public)
- `POST /payments/initiate` · `GET /payments/status/:reference` · `POST /payments/webhook`

### Notifications
- `POST /notifications` · `GET /notifications` (admin)
- `GET /notifications/me` · `PUT /notifications/:id/read` (operator)

### Portal settings
- `GET /portal-settings/my` · `PUT /portal-settings/my` (operator)
- `GET /portal-settings/operator/:operatorId` — **public**

Protected routes require `Authorization: Bearer <token>`.

---

## Quick test (curl)

```bash
# 1. Admin login
curl -s -X POST http://localhost:5000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hotspotx.tz","password":"admin123"}'

# 2. Operator login (save the token)
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/operator/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@hotspotx.tz","password":"demo1234"}' \
  | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')

# 3. Operator wallet analytics
curl -s http://localhost:5000/api/wallet/analytics \
  -H "Authorization: Bearer $TOKEN"

# 4. Captive portal: what does this AP offer?
curl -s "http://localhost:5000/api/hotspot/client-login?clientMac=CC-CC-CC-CC-CC-CC&apMac=AA-BB-CC-00-00-01"

# 5. Redeem a voucher (opens internet in simulation mode)
curl -s -X POST http://localhost:5000/api/hotspot/voucher-access \
  -H "Content-Type: application/json" \
  -d '{"code":"OMDA-DEMO-0001","clientMac":"CC-CC-CC-CC-CC-CC","apMac":"AA-BB-CC-00-00-01"}'

# 6. Start a mobile-money payment (simulated)
curl -s -X POST http://localhost:5000/api/payments/initiate \
  -H "Content-Type: application/json" \
  -d '{"clientMac":"CC-CC","apMac":"AA-BB-CC-00-00-01","operatorId":"HSX-2026-0001","packageId":"<PACKAGE_UUID>","phoneNumber":"0744123123"}'
```

> **Simulation mode:** with `NETWORK_SIMULATE=true` and `PAYMENT_SIMULATE=true`
> (the defaults in development), access is granted and payments are faked
> without contacting real Omada/MikroTik hardware or Snippe — so you can test
> the full flow locally.

### Testing the Snippe webhook locally (ngrok)

Snippe must reach your machine to deliver the payment webhook:

```bash
ngrok http 5000
```

Set `APP_BASE_URL` to the printed HTTPS URL and `PAYMENT_SIMULATE=false` in
`.env`, restart the backend, then run a real `POST /payments/initiate`. Inspect
and replay incoming webhooks at http://127.0.0.1:4040.

---

## Environment variables

All configuration lives in `backend/.env` (never commit it — it is gitignored).
See `.env.example` for the full template.

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `PORT` | Backend port (default 5000) |
| `NODE_ENV` | `development` / `production` |
| `JWT_SECRET` | Secret used to sign JWTs (use a long random string) |
| `JWT_EXPIRES_IN` | Token lifetime (e.g. `7d`) |
| `FRONTEND_URL` | Allowed CORS origin |
| `APP_BASE_URL` | Public URL of this backend (used to build the Snippe webhook URL) |
| `NETWORK_SIMULATE` | `true` = grant access without real hardware |
| `OMADA_BASE_URL` | Omada controller URL |
| `OMADA_CONTROLLER_ID` | Omada controller id |
| `OMADA_OPERATOR_USER` / `OMADA_OPERATOR_PASS` | Omada API credentials |
| `OMADA_VERIFY_SSL` | Verify the controller's TLS cert |
| `MIKROTIK_DEFAULT_PORT` | RouterOS API port (default 8728) |
| `PAYMENT_PROVIDER` | `snippe` (swappable) |
| `PAYMENT_SIMULATE` | `true` = fake the outbound create-payment call |
| `SNIPPE_BASE_URL` | Snippe API base URL |
| `SNIPPE_API_KEY` | Snippe API key |
| `SNIPPE_WEBHOOK_SECRET` | Secret for verifying webhook signatures |
| `SMS_PROVIDER` / `SMS_API_KEY` / `SMS_USERNAME` / `SMS_SENDER_ID` | SMS (Africa's Talking, swappable) |

---

## Project structure

```
hotspotx/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma     # 11 models
│   │   └── seed.ts           # idempotent demo data
│   └── src/
│       ├── config/           # env, omada, mikrotik, snippe adapters
│       ├── controllers/      # request handlers
│       ├── routes/           # express routers
│       ├── middleware/        # auth (protectAdmin/protectOperator), errors, validation
│       ├── services/         # commission, network (unified authorize), payments, hotspot
│       ├── utils/            # jwt, password, phone, duration, voucher codes
│       └── server.ts
└── frontend/                 # Next.js (in progress)
```

---

## npm scripts (backend)

| Script | Purpose |
|---|---|
| `npm run dev` | Start with hot reload (tsx watch) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled server |
| `npm run seed` | Seed demo data (idempotent) |
| `npm run prisma:migrate` | Run Prisma migrations |
| `npm run prisma:studio` | Open Prisma Studio |

---

## Deploying to a VPS (later)

A typical production deployment:

1. **Provision** an Ubuntu VPS; install Node.js, PostgreSQL, and a process
   manager (e.g. `pm2`).
2. **Clone** the repo and `cd backend && npm ci`.
3. **Configure** a production `.env`:
   - real `DATABASE_URL`, a strong `JWT_SECRET`
   - `NODE_ENV=production`, `NETWORK_SIMULATE=false`, `PAYMENT_SIMULATE=false`
   - real Omada / MikroTik / Snippe credentials
   - `APP_BASE_URL=https://your-domain` (must be HTTPS and reachable by Snippe)
4. **Migrate & build:** `npx prisma migrate deploy && npm run build`.
5. **Run:** `pm2 start dist/server.js --name hotspotx-api`.
6. **Reverse proxy:** put Nginx in front, terminate TLS (Let's Encrypt), and
   proxy to the backend port.
7. **Webhook:** point Snippe's webhook at `https://your-domain/api/payments/webhook`.

---

## License

ISC
