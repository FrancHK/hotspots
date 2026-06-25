"use client";

import { useMemo, useState } from "react";
import { useFetch } from "@/lib/useFetch";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { formatTZS, formatDateTime } from "@/lib/format";
import { methodLabels, methodColors, type Transaction, type TxStatus } from "@/lib/types";

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

export default function TransactionsPage() {
  const [method, setMethod] = useState("all");
  const [status, setStatus] = useState("all");
  const [range, setRange] = useState("all");

  const params = new URLSearchParams({ limit: "500" });
  if (method !== "all") params.set("method", method);
  if (status !== "all") params.set("status", status);
  const { data, loading } = useFetch<{ transactions: Transaction[] }>(
    `/wallet/transactions?${params.toString()}`,
  );

  const rows = useMemo(() => {
    const all = data?.transactions ?? [];
    const days = rangeDays[range];
    if (!days) return all;
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);
    return all.filter((t) => new Date(t.createdAt) >= since);
  }, [data, range]);

  const total = rows.reduce((s, t) => s + t.operatorEarning, 0);

  return (
    <>
      <PageHeader icon="receipt" title="Miamala" subtitle="Historia ya malipo yote" />

      <Card>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
          <div className="flex flex-col justify-end">
            <span className="mb-1.5 block text-sm font-medium text-muted">Jumla</span>
            <span className="tabular neu-inset rounded-2xl px-4 py-3 text-sm font-bold text-[var(--color-earn)]">
              {formatTZS(total)}
            </span>
          </div>
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
                  <th className="py-2 pr-3">Njia</th>
                  <th className="py-2 pr-3">Kiasi</th>
                  <th className="hidden py-2 pr-3 sm:table-cell">Mapato yako</th>
                  <th className="py-2 pr-3">Hali</th>
                  <th className="hidden py-2 pr-3 md:table-cell">Mteja</th>
                  <th className="py-2 text-right">Tarehe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((t) => (
                  <tr key={t.id} className="text-content">
                    <td className="py-3 pr-3">
                      <span className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ background: methodColors[t.method] }}
                        />
                        {methodLabels[t.method]}
                      </span>
                    </td>
                    <td className="tabular py-3 pr-3">{formatTZS(t.amount)}</td>
                    <td className="tabular hidden py-3 pr-3 font-semibold text-[var(--color-earn)] sm:table-cell">
                      +{formatTZS(t.operatorEarning)}
                    </td>
                    <td className="py-3 pr-3">
                      <Badge tone={statusTone[t.status]}>{t.status}</Badge>
                    </td>
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
