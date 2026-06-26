"use client";

import { useMemo, useState } from "react";
import { useFetch } from "@/lib/useFetch";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardTitle } from "@/components/ui/Card";
import { Select } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { Icon } from "@/components/ui/Icon";
import { MethodDonut, type DonutSegment } from "@/components/dashboard/MethodDonut";
import { RevenueChart, type ChartPoint } from "@/components/dashboard/RevenueChart";
import { formatTZS, formatDayLabel } from "@/lib/format";
import {
  methodColors,
  type AdminTransaction,
  type CommissionStats,
} from "@/lib/types";

const DAY = 86_400_000;
const ranges: Record<string, number> = { "7": 7, "30": 30, "90": 90 };

export default function CommissionPage() {
  const stats = useFetch<{ stats: CommissionStats }>(
    "/operators/admin/commission-stats",
  );
  const tx = useFetch<{ transactions: AdminTransaction[] }>(
    "/operators/admin/transactions?limit=1000",
  );
  const [range, setRange] = useState("30");

  const s = stats.data?.stats;
  const transactions = useMemo(() => tx.data?.transactions ?? [], [tx.data]);

  // Voucher commission vs mobile-money commission.
  const segments: DonutSegment[] = useMemo(() => {
    const byMethod = s?.byMethod ?? [];
    const voucher = byMethod
      .filter((m) => m.method === "voucher")
      .reduce((a, m) => a + m.adminCommission, 0);
    const mobile = byMethod
      .filter((m) => m.method !== "voucher")
      .reduce((a, m) => a + m.adminCommission, 0);
    return [
      { label: "Mobile Money", value: mobile, color: methodColors.mpesa },
      { label: "Vocha", value: voucher, color: methodColors.voucher },
    ];
  }, [s]);

  // Commission over the selected window.
  const series: ChartPoint[] = useMemo(() => {
    const days = ranges[range] ?? 30;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const dayKey = (d: Date) => {
      const x = new Date(d);
      x.setHours(0, 0, 0, 0);
      return x.getTime();
    };
    const buckets: number[] = [];
    for (let i = days - 1; i >= 0; i--) buckets.push(start.getTime() - i * DAY);
    const map = new Map<number, number>(buckets.map((d) => [d, 0]));
    for (const t of transactions) {
      if (t.status !== "success") continue;
      const k = dayKey(new Date(t.createdAt));
      if (map.has(k)) map.set(k, map.get(k)! + t.adminCommission);
    }
    const step = Math.max(1, Math.floor(days / 10));
    return buckets
      .filter((_, i) => i % step === 0)
      .map((d) => ({ label: formatDayLabel(new Date(d)), value: map.get(d) ?? 0 }));
  }, [transactions, range]);

  const loading = stats.loading || tx.loading;
  const byOperator = s?.byOperator ?? [];

  return (
    <>
      <PageHeader
        icon="cash-stack"
        title="Commission"
        subtitle="Mapato yako kutoka operators wote"
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="relative overflow-hidden bg-gradient-to-br from-brand to-brand-dark text-white">
              <div className="flex items-center gap-2 text-white/80">
                <Icon name="cash-stack" className="text-lg" />
                <span className="text-sm font-medium">Jumla ya commission yako</span>
              </div>
              <p className="tabular mt-3 text-3xl font-extrabold">
                {formatTZS(s?.totals.totalAdminCommission ?? 0)}
              </p>
              <p className="mt-2 text-xs text-white/70">
                Kutoka mapato ya {formatTZS(s?.totals.totalRevenue ?? 0)}
              </p>
              <Icon name="cash-stack" className="pointer-events-none absolute -bottom-4 -right-2 text-[7rem] text-white/10" />
            </Card>

            <Card className="lg:col-span-2">
              <CardTitle>Mgawanyo wa commission</CardTitle>
              <div className="mt-4">
                <MethodDonut segments={segments} />
              </div>
            </Card>
          </div>

          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle>Commission kwa muda</CardTitle>
              <Select
                className="w-auto"
                value={range}
                onChange={(e) => setRange(e.target.value)}
              >
                <option value="7">Siku 7</option>
                <option value="30">Siku 30</option>
                <option value="90">Siku 90</option>
              </Select>
            </div>
            <div className="mt-4 h-60">
              <RevenueChart data={series} />
            </div>
          </Card>

          <Card>
            <CardTitle>Commission kwa kila operator</CardTitle>
            {byOperator.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted">Hakuna data bado.</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted">
                      <th className="py-2 pr-3">#</th>
                      <th className="py-2 pr-3">Operator</th>
                      <th className="hidden py-2 pr-3 sm:table-cell">Miamala</th>
                      <th className="hidden py-2 pr-3 md:table-cell">Mapato</th>
                      <th className="py-2 text-right">Commission yako</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {byOperator.map((o, i) => (
                      <tr key={o.operatorId} className="text-content">
                        <td className="py-3 pr-3 text-muted">{i + 1}</td>
                        <td className="py-3 pr-3">
                          <p className="font-semibold">{o.businessName ?? "—"}</p>
                          <p className="text-xs text-muted">{o.publicId ?? "—"}</p>
                        </td>
                        <td className="hidden py-3 pr-3 sm:table-cell">{o.count}</td>
                        <td className="tabular hidden py-3 pr-3 md:table-cell">{formatTZS(o.revenue)}</td>
                        <td className="tabular py-3 text-right font-bold text-[var(--color-earn)]">
                          {formatTZS(o.adminCommission)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
