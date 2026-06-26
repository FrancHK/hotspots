"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useFetch } from "@/lib/useFetch";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { RevenueChart, type ChartPoint } from "@/components/dashboard/RevenueChart";
import { BarChart, type BarPoint } from "@/components/admin/BarChart";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useAdmin } from "@/components/admin/AdminContext";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import {
  formatTZS,
  formatCompactTZS,
  formatDayLabel,
  formatDateTime,
} from "@/lib/format";
import {
  methodLabels,
  type AdminOperator,
  type AdminTransaction,
  type CommissionStats,
} from "@/lib/types";

const DAY = 86_400_000;

export default function AdminHomePage() {
  const { admin } = useAdmin();
  const ops = useFetch<{ operators: AdminOperator[] }>("/operators");
  const stats = useFetch<{ stats: CommissionStats }>(
    "/operators/admin/commission-stats",
  );
  const tx = useFetch<{ transactions: AdminTransaction[] }>(
    "/operators/admin/transactions?limit=1000",
  );

  const operators = useMemo(() => ops.data?.operators ?? [], [ops.data]);
  const s = stats.data?.stats;
  const transactions = useMemo(() => tx.data?.transactions ?? [], [tx.data]);

  const byStatus = s?.operatorsByStatus ?? {};

  // System revenue over the last 30 days (successful transactions).
  const { revenueSeries, newOperatorSeries, today, week, month } = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);

    const dayKey = (d: Date) => {
      const x = new Date(d);
      x.setHours(0, 0, 0, 0);
      return x.getTime();
    };

    // 30-day buckets keyed by midnight timestamp.
    const days: number[] = [];
    for (let i = 29; i >= 0; i--) days.push(start.getTime() - i * DAY);

    const revByDay = new Map<number, number>(days.map((d) => [d, 0]));
    const opsByDay = new Map<number, number>(days.map((d) => [d, 0]));

    let t = 0;
    let w = 0;
    let m = 0;
    const weekAgo = start.getTime() - 6 * DAY;
    const monthAgo = start.getTime() - 29 * DAY;

    for (const x of transactions) {
      if (x.status !== "success") continue;
      const k = dayKey(new Date(x.createdAt));
      if (revByDay.has(k)) revByDay.set(k, revByDay.get(k)! + x.amount);
      if (k === start.getTime()) t += x.amount;
      if (k >= weekAgo) w += x.amount;
      if (k >= monthAgo) m += x.amount;
    }

    for (const op of operators) {
      if (!op.createdAt) continue;
      const k = dayKey(new Date(op.createdAt));
      if (opsByDay.has(k)) opsByDay.set(k, opsByDay.get(k)! + 1);
    }

    // Down-sample the 30 daily points to ~10 chart points for readability.
    const revPoints: ChartPoint[] = days
      .filter((_, i) => i % 3 === 0)
      .map((d) => ({ label: formatDayLabel(new Date(d)), value: revByDay.get(d) ?? 0 }));

    const opPoints: BarPoint[] = days
      .filter((_, i) => i % 3 === 0)
      .map((d) => ({ label: formatDayLabel(new Date(d)), value: opsByDay.get(d) ?? 0 }));

    return {
      revenueSeries: revPoints,
      newOperatorSeries: opPoints,
      today: t,
      week: w,
      month: m,
    };
  }, [transactions, operators]);

  const topOperators = (s?.byOperator ?? []).slice(0, 5);

  // Recent activity = newest operators + largest transactions, interleaved.
  const recentOps = [...operators]
    .sort((a, b) => +new Date(b.createdAt ?? 0) - +new Date(a.createdAt ?? 0))
    .slice(0, 4);
  const bigTx = [...transactions]
    .filter((t) => t.status === "success")
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 4);

  const loading = ops.loading || stats.loading || tx.loading;

  return (
    <>
      <PageHeader
        icon="speedometer2"
        title={`Karibu, ${admin?.name ?? "Admin"}`}
        subtitle="Muhtasari wa mfumo mzima"
        actions={
          <Link href="/admin/add-operator">
            <Button size="sm">
              <Icon name="person-plus" /> Ongeza Operator
            </Button>
          </Link>
        }
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="space-y-5">
          {/* Operator status cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Operators Jumla" value={String(operators.length)} icon="people" tone="brand" />
            <StatCard label="Active" value={String(byStatus.active ?? 0)} icon="check-circle" tone="earn" />
            <StatCard label="Wanaosubiri" value={String(byStatus.pending ?? 0)} icon="hourglass-split" tone="info" />
            <StatCard label="Imezuiwa" value={String(byStatus.blocked ?? 0)} icon="lock" tone="navy" />
          </div>

          {/* Big commission card + system revenue */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="relative overflow-hidden bg-gradient-to-br from-brand to-brand-dark text-white lg:col-span-1">
              <div className="flex items-center gap-2 text-white/80">
                <Icon name="cash-stack" className="text-lg" />
                <span className="text-sm font-medium">Commission Jumla (mapato yako)</span>
              </div>
              <p className="tabular mt-3 text-3xl font-extrabold">
                {formatTZS(s?.totals.totalAdminCommission ?? 0)}
              </p>
              <p className="mt-2 text-xs text-white/70">
                Kutoka miamala {s?.totals.transactionCount ?? 0} iliyofanikiwa
              </p>
              <Icon name="cash-stack" className="pointer-events-none absolute -bottom-4 -right-2 text-[7rem] text-white/10" />
            </Card>

            <div className="grid grid-cols-2 gap-4 lg:col-span-2 lg:grid-cols-2">
              <StatCard label="Transactions Jumla" value={String(s?.totals.transactionCount ?? 0)} icon="receipt-cutoff" tone="brand" />
              <StatCard label="Mapato Leo" value={formatCompactTZS(today)} icon="calendar-day" tone="earn" />
              <StatCard label="Mapato Wiki" value={formatCompactTZS(week)} icon="calendar-week" tone="info" />
              <StatCard label="Mapato Mwezi" value={formatCompactTZS(month)} icon="calendar-month" tone="navy" />
            </div>
          </div>

          {/* Charts */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardTitle>Mapato ya mfumo (siku 30)</CardTitle>
              <div className="mt-4 h-60">
                <RevenueChart data={revenueSeries} />
              </div>
            </Card>
            <Card>
              <CardTitle>Operators wapya (siku 30)</CardTitle>
              <div className="mt-4 h-60">
                <BarChart data={newOperatorSeries} unit="operators" />
              </div>
            </Card>
          </div>

          {/* Top operators + recent activity */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <div className="flex items-center justify-between">
                <CardTitle>Top Operators (commission)</CardTitle>
                <Link href="/admin/commission" className="text-xs font-semibold text-brand-dark dark:text-brand">
                  Zaidi
                </Link>
              </div>
              {topOperators.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted">Hakuna data bado.</p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {topOperators.map((op, i) => (
                    <li key={op.operatorId} className="neu-inset flex items-center gap-3 rounded-2xl px-4 py-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/15 text-xs font-bold text-brand-dark dark:text-brand">
                        {i + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-content">
                          {op.businessName ?? "—"}
                        </span>
                        <span className="block text-xs text-muted">{op.count} miamala</span>
                      </span>
                      <span className="tabular text-sm font-bold text-[var(--color-earn)]">
                        {formatTZS(op.adminCommission)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card>
              <CardTitle>Shughuli za hivi karibuni</CardTitle>
              <ul className="mt-4 space-y-2">
                {recentOps.map((op) => (
                  <li key={`op-${op.id}`} className="flex items-center gap-3 rounded-2xl px-1 py-1.5">
                    <span className="neu-sm flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-brand">
                      <Icon name="person-plus" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-content">
                        Operator mpya: <b>{op.businessName}</b>
                      </span>
                      <span className="block text-xs text-muted">
                        {op.createdAt ? formatDateTime(op.createdAt) : "—"}
                      </span>
                    </span>
                    <StatusBadge status={op.status} />
                  </li>
                ))}
                {bigTx.map((t) => (
                  <li key={`tx-${t.id}`} className="flex items-center gap-3 rounded-2xl px-1 py-1.5">
                    <span className="neu-sm flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[var(--color-earn)]">
                      <Icon name="cash-coin" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-content">
                        Muamala {formatTZS(t.amount)} — {t.operatorName}
                      </span>
                      <span className="block text-xs text-muted">{formatDateTime(t.createdAt)}</span>
                    </span>
                    <Badge tone="info">{methodLabels[t.method]}</Badge>
                  </li>
                ))}
                {recentOps.length === 0 && bigTx.length === 0 && (
                  <p className="py-8 text-center text-sm text-muted">Hakuna shughuli bado.</p>
                )}
              </ul>
            </Card>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Link href="/admin/add-operator">
              <Card className="flex items-center gap-3 transition hover:-translate-y-0.5">
                <span className="neu-sm flex h-11 w-11 items-center justify-center rounded-2xl text-xl text-brand">
                  <Icon name="person-plus" />
                </span>
                <span className="font-semibold text-content">Ongeza Operator</span>
              </Card>
            </Link>
            <Link href="/admin/notifications">
              <Card className="flex items-center gap-3 transition hover:-translate-y-0.5">
                <span className="neu-sm flex h-11 w-11 items-center justify-center rounded-2xl text-xl text-brand">
                  <Icon name="megaphone" />
                </span>
                <span className="font-semibold text-content">Tuma Arifa</span>
              </Card>
            </Link>
            <Link href="/admin/pending">
              <Card className="flex items-center gap-3 transition hover:-translate-y-0.5">
                <span className="neu-sm flex h-11 w-11 items-center justify-center rounded-2xl text-xl text-brand">
                  <Icon name="hourglass-split" />
                </span>
                <span className="font-semibold text-content">
                  Ona Pending
                  {(byStatus.pending ?? 0) > 0 && (
                    <Badge tone="warning" className="ml-2">{byStatus.pending}</Badge>
                  )}
                </span>
              </Card>
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
