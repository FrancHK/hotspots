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

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  broadcast: boolean;
  read: boolean;
  createdAt: string;
}

// Swahili display labels for payment methods.
export const methodLabels: Record<PaymentMethod, string> = {
  mpesa: "M-Pesa",
  tigopesa: "Tigo Pesa",
  airtel: "Airtel Money",
  voucher: "Vocha",
};

// Brand-aligned colours for the method donut.
export const methodColors: Record<PaymentMethod, string> = {
  mpesa: "#2fbf6f",
  tigopesa: "#2b6cff",
  airtel: "#ff3b3b",
  voucher: "#ff8c42",
};
