import type { PaymentMethod } from "@prisma/client";

// Mobile-money methods all share the operator's standard commissionRate.
export const MOBILE_MONEY_METHODS: PaymentMethod[] = [
  "mpesa",
  "tigopesa",
  "airtel",
];

export interface CommissionRates {
  commissionRate: number; // admin % on mobile money (default 10)
  voucherCommission: number; // admin % on vouchers (default 3)
}

export interface CommissionSplit {
  rate: number; // admin percentage applied
  adminCommission: number; // TZS to platform
  operatorEarning: number; // TZS to operator
}

// Splits a payment between admin commission and operator earning.
//   - Mobile money (M-Pesa / Tigo / Airtel) -> commissionRate (default 10%)
//   - Voucher                                -> voucherCommission (default 3%)
// Amounts are integer TZS; operatorEarning absorbs any rounding so the two
// parts always sum back to `amount` exactly.
export function computeCommissionSplit(
  amount: number,
  method: PaymentMethod,
  rates: CommissionRates,
): CommissionSplit {
  const rate =
    method === "voucher" ? rates.voucherCommission : rates.commissionRate;

  const adminCommission = Math.round((amount * rate) / 100);
  const operatorEarning = amount - adminCommission;

  return { rate, adminCommission, operatorEarning };
}
