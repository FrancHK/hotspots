// Shared API response shapes for the operator dashboard.

export type DeviceType = "omada" | "mikrotik";
export type DurationUnit = "minutes" | "hours" | "days";
export type PaymentMethod = "mpesa" | "tigopesa" | "airtel" | "voucher";
export type TxStatus = "pending" | "success" | "failed";

export interface Operator {
  id: string;
  operatorId: string;
  name: string;
  businessName: string;
  email: string;
  phone?: string;
  mpesa?: string | null;
  region?: string | null;
  status: "pending" | "active" | "blocked";
  deviceType: DeviceType;
  package: "starter" | "basic" | "pro";
  noSubscription?: boolean;
  onboardingComplete?: boolean;
  subscriptionEnd?: string | null;
  createdAt?: string;
}

export interface Wallet {
  balance: number;
  totalEarned: number;
  totalWithdrawn: number;
}

export interface EarningBucket {
  earnings: number;
  revenue: number;
  transactions: number;
}

export interface Analytics {
  earnings: {
    today: EarningBucket;
    week: EarningBucket;
    month: EarningBucket;
    total: EarningBucket;
  };
  customersServed: number;
  uniqueCustomers: number;
  activeSessions: number;
  byMethod: Array<{
    method: PaymentMethod;
    earnings: number;
    revenue: number;
    count: number;
  }>;
}

export interface Voucher {
  id: string;
  code: string;
  title: string | null;
  duration: number;
  durationUnit: DurationUnit;
  speed: number;
  price: number;
  status: "unused" | "used";
  usedBy?: string | null;
  usedAt?: string | null;
  createdAt: string;
}

export interface Package {
  id: string;
  name: string;
  duration: number;
  durationUnit: DurationUnit;
  speed: number;
  price: number;
  status: "active" | "inactive";
  siteId?: string | null;
  createdAt: string;
}

export interface Transaction {
  id: string;
  amount: number;
  method: PaymentMethod;
  adminCommission: number;
  operatorEarning: number;
  clientMac?: string | null;
  duration?: number | null;
  status: TxStatus;
  reference?: string | null;
  createdAt: string;
}

export interface PortalSettings {
  primaryColor: string;
  secondaryColor: string;
  logoEmoji: string;
  businessName?: string | null;
  subtitle?: string | null;
  footer?: string | null;
  template: number;
}

export type PayoutType = "mobile" | "bank";
export type MobileProvider = "mpesa" | "tigopesa" | "airtel";

export interface PayoutAccount {
  id: string;
  type: PayoutType;
  label?: string | null;
  provider?: MobileProvider | null;
  phone?: string | null;
  bankName?: string | null;
  accountName?: string | null;
  accountNumber?: string | null;
  isDefault: boolean;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  broadcast: boolean;
  read: boolean;
  createdAt: string;
}

// ── Admin (super admin) shapes ───────────────────────────

// An operator row in the admin list — extends the base operator with
// the wallet snapshot and relation counts the admin endpoints attach.
export interface AdminOperator extends Operator {
  commissionRate?: number;
  voucherCommission?: number;
  wallet?: { balance: number; totalEarned: number } | null;
  _count?: {
    sites: number;
    accessPoints: number;
    packages: number;
    vouchers?: number;
    transactions?: number;
  };
}

// Full operator detail (GET /api/operators/:id) used in the detail modal.
export interface AdminOperatorDetail extends AdminOperator {
  wallet?: {
    balance: number;
    totalEarned: number;
    totalWithdrawn: number;
  } | null;
  sites?: Array<{ id: string; name: string; city: string | null; siteId: string }>;
  accessPoints?: Array<{
    id: string;
    name: string;
    macAddress: string;
    status: "online" | "offline";
    deviceType: DeviceType;
  }>;
  packages?: Array<{ id: string; name: string; price: number; status: string }>;
}

export interface CommissionStats {
  totals: {
    totalRevenue: number;
    totalAdminCommission: number;
    totalOperatorEarnings: number;
    transactionCount: number;
  };
  byMethod: Array<{
    method: PaymentMethod;
    revenue: number;
    adminCommission: number;
    operatorEarnings: number;
    count: number;
  }>;
  byOperator: Array<{
    operatorId: string;
    publicId: string | null;
    businessName: string | null;
    revenue: number;
    adminCommission: number;
    operatorEarnings: number;
    count: number;
  }>;
  operatorsByStatus: Partial<Record<"pending" | "active" | "blocked", number>>;
}

export interface AdminTransaction {
  id: string;
  amount: number;
  method: PaymentMethod;
  adminCommission: number;
  operatorEarning: number;
  clientMac?: string | null;
  apMac?: string | null;
  duration?: number | null;
  status: TxStatus;
  reference?: string | null;
  createdAt: string;
  operatorId: string;
  operatorPublicId: string;
  operatorName: string;
}

export interface AdminAccessPoint {
  id: string;
  name: string;
  macAddress: string;
  ipAddress?: string | null;
  ssid?: string | null;
  model?: string | null;
  status: "online" | "offline";
  deviceType: DeviceType;
  operatorPublicId: string;
  operatorName: string;
  siteName?: string | null;
  siteCity?: string | null;
  createdAt: string;
}

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  target: "operator" | "broadcast";
  readCount: number;
  operatorId: string | null;
  operator?: { operatorId: string; businessName: string } | null;
  createdAt: string;
}

// Swahili display labels for payment methods.
export const methodLabels: Record<PaymentMethod, string> = {
  mpesa: "M-Pesa",
  tigopesa: "Tigo Pesa",
  airtel: "Airtel Money",
  voucher: "Vocha",
};

// Swahili display labels for package tiers.
export const packageLabels: Record<"starter" | "basic" | "pro", string> = {
  starter: "Starter",
  basic: "Basic",
  pro: "Pro",
};

// Brand-aligned colours for the method donut.
export const methodColors: Record<PaymentMethod, string> = {
  mpesa: "#2fbf6f",
  tigopesa: "#2b6cff",
  airtel: "#ff3b3b",
  voucher: "#ff8c42",
};
