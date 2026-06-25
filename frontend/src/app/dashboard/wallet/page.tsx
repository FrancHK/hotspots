"use client";

import { useState, type FormEvent } from "react";
import { api, apiError } from "@/lib/api";
import { useFetch } from "@/lib/useFetch";
import { useToast } from "@/components/ui/Toast";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { MethodDonut, type DonutSegment } from "@/components/dashboard/MethodDonut";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { formatTZS, formatDateTime } from "@/lib/format";
import {
  methodLabels,
  methodColors,
  type Wallet,
  type Analytics,
  type Transaction,
} from "@/lib/types";

export default function WalletPage() {
  const toast = useToast();
  const wallet = useFetch<{ wallet: Wallet }>("/wallet/me");
  const analytics = useFetch<{ analytics: Analytics }>("/wallet/analytics");
  const txns = useFetch<{ transactions: Transaction[] }>("/wallet/transactions?limit=50");

  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(0);
  const [busy, setBusy] = useState(false);

  const w = wallet.data?.wallet;
  const byMethod = analytics.data?.analytics.byMethod ?? [];
  const segments: DonutSegment[] = byMethod.map((m) => ({
    label: methodLabels[m.method],
    value: m.earnings,
    color: methodColors[m.method],
  }));
  const history = txns.data?.transactions ?? [];

  async function onWithdraw(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/wallet/withdraw", { amount: Number(amount) });
      toast.success(`Ombi la kutoa ${formatTZS(Number(amount))} limepokelewa`);
      setOpen(false);
      setAmount(0);
      void wallet.refetch();
    } catch (err) {
      toast.error(apiError(err, "Imeshindikana kutoa pesa"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        icon="wallet2"
        title="Pochi"
        subtitle="Salio na historia ya mapato"
        actions={
          <Button onClick={() => setOpen(true)} disabled={!w || w.balance <= 0}>
            <Icon name="cash-coin" /> Toa Pesa
          </Button>
        }
      />

      {wallet.loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Salio lililopo" value={formatTZS(w?.balance ?? 0)} icon="wallet2" tone="earn" />
            <StatCard label="Jumla ya mapato" value={formatTZS(w?.totalEarned ?? 0)} icon="graph-up-arrow" tone="brand" />
            <StatCard label="Imetolewa" value={formatTZS(w?.totalWithdrawn ?? 0)} icon="cash-stack" tone="info" />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <h2 className="mb-4 font-display font-bold text-content">Mgawanyo wa mapato kwa njia</h2>
              {segments.some((s) => s.value > 0) ? (
                <MethodDonut segments={segments} />
              ) : (
                <p className="py-10 text-center text-sm text-muted">Hakuna mapato bado.</p>
              )}
            </Card>

            <Card>
              <h2 className="mb-3 font-display font-bold text-content">Historia ya mapato</h2>
              {history.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted">Hakuna miamala bado.</p>
              ) : (
                <div className="max-h-80 divide-y divide-line overflow-y-auto">
                  {history.map((t) => (
                    <div key={t.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="flex items-center gap-3">
                        <span
                          className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
                          style={{ background: methodColors[t.method] }}
                        >
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
                        <Badge tone={t.status === "success" ? "success" : t.status === "pending" ? "warning" : "danger"}>
                          {t.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Toa Pesa"
        footer={
          <>
            <Button variant="neutral" onClick={() => setOpen(false)}>
              Ghairi
            </Button>
            <Button form="withdraw-form" type="submit" loading={busy}>
              Thibitisha
            </Button>
          </>
        }
      >
        <form id="withdraw-form" onSubmit={onWithdraw} className="space-y-3">
          <p className="text-sm text-muted">
            Salio lililopo:{" "}
            <span className="font-semibold text-content">{formatTZS(w?.balance ?? 0)}</span>
          </p>
          <Input
            label="Kiasi (TZS)"
            type="number"
            min={1}
            max={w?.balance ?? undefined}
            value={amount || ""}
            onChange={(e) => setAmount(+e.target.value)}
            placeholder="0"
            required
          />
        </form>
      </Modal>
    </>
  );
}
