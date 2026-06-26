"use client";

import { useMemo, useState } from "react";
import { useFetch } from "@/lib/useFetch";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { formatTZS, formatDateTime } from "@/lib/format";
import {
  methodLabels,
  methodColors,
  type AdminTransaction,
  type TxStatus,
} from "@/lib/types";

const statusTone: Record<TxStatus, "success" | "warning" | "danger"> = {
  success: "success",
  pending: "warning",
  failed: "danger",
};

const rangeDays: Record<string, number | null> = {
  all: null,
  today: 1,
  "7": 7,
  "30": 30,
};

export default function AdminTransactionsPage() {
  const { data, loading } = useFetch<{ transactions: AdminTransaction[] }>(
    "/operators/admin/transactions?limit=1000",
  );
  const all = useMemo(() => data?.transactions ?? [], [data]);

  const [method, setMethod] = useState("all");
  const [status, setStatus] = useState("all");
  const [range, setRange] = useState("all");
  const [operator, setOperator] = useState("all");

  // Operator options derived from the transaction set.
  const operatorOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of all) map.set(t.operatorId, t.operatorName);
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [all]);

  const rows = useMemo(() => {
    const days = rangeDays[range];
    let since: number | null = null;
    if (days) {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1));
      d.setHours(0, 0, 0, 0);
      since = d.getTime();
    }
    return all.filter((t) => {
      if (method !== "all" && t.method !== method) return false;
      if (status !== "all" && t.status !== status) return false;
      if (operator !== "all" && t.operatorId !== operator) return false;
      if (since && new Date(t.createdAt).getTime() < since) return false;
      return true;
    });
  }, [all, method, status, range, operator]);

  const summary = useMemo(() => {
    const acc = { total: rows.length, success: 0, pending: 0, failed: 0, commission: 0 };
    for (const t of rows) {
      acc[t.status] += 1;
      if (t.status === "success") acc.commission += t.adminCommission;
    }
    return acc;
  }, [rows]);

  return (
    <>
      <PageHeader
        icon="receipt-cutoff"
        title="Miamala"
        subtitle="Historia ya miamala yote ya mfumo"
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Jumla" value={String(summary.total)} icon="receipt" tone="brand" />
        <StatCard label="Imefanikiwa" value={String(summary.success)} icon="check-circle" tone="earn" />
        <StatCard label="Inasubiri" value={String(summary.pending)} icon="hourglass" tone="info" />
        <StatCard label="Imeshindwa" value={String(summary.failed)} icon="x-circle" tone="navy" />
      </div>

      <Card className="mt-5">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Select label="Operator" value={operator} onChange={(e) => setOperator(e.target.value)}>
            <option value="all">Wote</option>
            {operatorOptions.map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </Select>
          <Select label="Njia" value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="all">Zote</option>
            <option value="mpesa">M-Pesa</option>
            <option value="tigopesa">Tigo Pesa</option>
            <option value="airtel">Airtel Money</option>
            <option value="voucher">Vocha</option>
          </Select>
          <Select label="Hali" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">Zote</option>
            <option value="success">Imefanikiwa</option>
            <option value="pending">Inasubiri</option>
            <option value="failed">Imeshindwa</option>
          </Select>
          <Select label="Tarehe" value={range} onChange={(e) => setRange(e.target.value)}>
            <option value="all">Zote</option>
            <option value="today">Leo</option>
            <option value="7">Siku 7</option>
            <option value="30">Siku 30</option>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : rows.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted">Hakuna miamala inayolingana.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted">
                  <th className="py-2 pr-3">Operator</th>
                  <th className="py-2 pr-3">Njia</th>
                  <th className="py-2 pr-3">Kiasi</th>
                  <th className="hidden py-2 pr-3 sm:table-cell">Commission</th>
                  <th className="py-2 pr-3">Hali</th>
                  <th className="hidden py-2 pr-3 md:table-cell">Mteja (MAC)</th>
                  <th className="py-2 text-right">Tarehe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((t) => (
                  <tr key={t.id} className="text-content">
                    <td className="py-3 pr-3">
                      <p className="truncate font-medium">{t.operatorName}</p>
                      <p className="text-xs text-muted">{t.operatorPublicId}</p>
                    </td>
                    <td className="py-3 pr-3">
                      <span className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: methodColors[t.method] }} />
                        {methodLabels[t.method]}
                      </span>
                    </td>
                    <td className="tabular py-3 pr-3">{formatTZS(t.amount)}</td>
                    <td className="tabular hidden py-3 pr-3 font-semibold text-[var(--color-earn)] sm:table-cell">
                      +{formatTZS(t.adminCommission)}
                    </td>
                    <td className="py-3 pr-3"><Badge tone={statusTone[t.status]}>{t.status}</Badge></td>
                    <td className="hidden py-3 pr-3 font-mono text-xs text-muted md:table-cell">
                      {t.clientMac ?? "—"}
                    </td>
                    <td className="py-3 text-right text-muted">{formatDateTime(t.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
