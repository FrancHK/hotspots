"use client";

import Link from "next/link";
import { useFetch } from "@/lib/useFetch";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { RevenueChart, type ChartPoint } from "@/components/dashboard/RevenueChart";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { Spinner } from "@/components/ui/Spinner";
import { formatTZS, formatNumber, formatDateTime } from "@/lib/format";
import { methodLabels, type Analytics, type Transaction } from "@/lib/types";

const DAYS_SW = ["Jpil", "Jtt", "Jnn", "Jtn", "Alh", "Ijm", "Jms"]; // Sun..Sat

// Buckets the last 7 days of operator earnings from the transaction list.
function buildSeries(txns: Transaction[]): ChartPoint[] {
  const out: ChartPoint[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(d.getDate() + 1);
    const sum = txns
      .filter((t) => {
        const c = new Date(t.createdAt);
        return t.status === "success" && c >= d && c < next;
      })
      .reduce((s, t) => s + t.operatorEarning, 0);
    out.push({ label: DAYS_SW[d.getDay()], value: sum });
  }
  return out;
}

const statusTone = { success: "success", pending: "warning", failed: "danger" } as const;

export default function HomePage() {
  const { operator } = useDashboard();
  const analytics = useFetch<{ analytics: Analytics }>("/wallet/analytics");
  const txns = useFetch<{ transactions: Transaction[] }>("/wallet/transactions?limit=500");
  const unused = useFetch<{ count: number }>("/vouchers/my?status=unused");

  const a = analytics.data?.analytics;
  const allTxns = txns.data?.transactions ?? [];
  const series = buildSeries(allTxns);
  const recent = allTxns.slice(0, 6);

  // Honest trend: today vs the average earning per day across the week.
  const weekAvg = a ? a.earnings.week.earnings / 7 : 0;
  const todayTrend =
    a && weekAvg > 0 ? ((a.earnings.today.earnings - weekAvg) / weekAvg) * 100 : null;

  return (
    <>
      <PageHeader
        icon="house-door"
        title={`Karibu, ${operator?.businessName ?? operator?.name ?? ""}`}
        subtitle="Muhtasari wa biashara yako"
      />

      {analytics.loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {/* Revenue cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label="Mapato leo"
              value={formatTZS(a?.earnings.today.earnings ?? 0)}
              icon="cash-stack"
              tone="earn"
              trend={todayTrend}
            />
            <StatCard
              label="Wiki hii"
              value={formatTZS(a?.earnings.week.earnings ?? 0)}
              icon="calendar-week"
              tone="brand"
              hint={`Miamala ${a?.earnings.week.transactions ?? 0}`}
            />
            <StatCard
              label="Mwezi huu"
              value={formatTZS(a?.earnings.month.earnings ?? 0)}
              icon="calendar-month"
              tone="info"
              hint={`Miamala ${a?.earnings.month.transactions ?? 0}`}
            />
            <StatCard
              label="Jumla"
              value={formatTZS(a?.earnings.total.earnings ?? 0)}
              icon="bank"
              tone="navy"
              hint={`Miamala ${a?.earnings.total.transactions ?? 0}`}
            />
          </div>

          {/* Secondary stats */}
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              label="Sessions hai sasa"
              value={formatNumber(a?.activeSessions ?? 0)}
              icon="wifi"
              tone="earn"
            />
            <StatCard
              label="Wateja waliohudumiwa"
              value={formatNumber(a?.customersServed ?? 0)}
              icon="people"
              tone="info"
            />
            <StatCard
              label="Vocha zilizobaki"
              value={formatNumber(unused.data?.count ?? 0)}
              icon="ticket-perforated"
              tone="brand"
            />
          </div>

          {/* Chart + quick actions */}
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
            <Card>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="font-display font-bold text-content">Mapato siku 7</h2>
                <Badge tone="brand">
                  {formatTZS(series.reduce((s, p) => s + p.value, 0))}
                </Badge>
              </div>
              <div className="h-56">
                <RevenueChart data={series} />
              </div>
            </Card>

            <Card className="flex flex-col justify-center gap-3">
              <h2 className="font-display font-bold text-content">Vitendo vya haraka</h2>
              <Link href="/dashboard/vouchers">
                <Button className="w-full justify-start">
                  <Icon name="ticket-perforated" /> Tengeneza Vocha
                </Button>
              </Link>
              <Link href="/dashboard/wallet">
                <Button variant="neutral" className="w-full justify-start">
                  <Icon name="cash-coin" /> Toa Pesa
                </Button>
              </Link>
              <Link href="/dashboard/packages">
                <Button variant="neutral" className="w-full justify-start">
                  <Icon name="box-seam" /> Ongeza Kifurushi
                </Button>
              </Link>
            </Card>
          </div>

          {/* Recent transactions */}
          <Card className="mt-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display font-bold text-content">Miamala ya hivi karibuni</h2>
              <Link href="/dashboard/transactions" className="text-sm font-semibold text-brand">
                Ona yote
              </Link>
            </div>
            {recent.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted">Hakuna miamala bado.</p>
            ) : (
              <div className="divide-y divide-line">
                {recent.map((t) => (
                  <div key={t.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="flex items-center gap-3">
                      <span className="neu-sm flex h-9 w-9 items-center justify-center rounded-xl text-brand">
                        <Icon name="arrow-down-left" />
                      </span>
                      <div>
                        <p className="text-sm font-medium text-content">{methodLabels[t.method]}</p>
                        <p className="text-xs text-muted">{formatDateTime(t.createdAt)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="tabular text-sm font-semibold text-[var(--color-earn)]">
                        +{formatTZS(t.operatorEarning)}
                      </p>
                      <Badge tone={statusTone[t.status]}>{t.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </>
  );
}
