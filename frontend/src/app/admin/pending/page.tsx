"use client";

import { useState } from "react";
import { api, apiError } from "@/lib/api";
import { useFetch } from "@/lib/useFetch";
import { useToast } from "@/components/ui/Toast";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { formatDate } from "@/lib/format";
import { packageLabels, type AdminOperator } from "@/lib/types";

export default function PendingPage() {
  const toast = useToast();
  const { data, loading, setData } = useFetch<{ operators: AdminOperator[] }>(
    "/operators?status=pending",
  );
  const pending = data?.operators ?? [];
  const [busyId, setBusyId] = useState<string | null>(null);

  async function decide(op: AdminOperator, status: "active" | "blocked") {
    setBusyId(op.id);
    try {
      await api.put(`/operators/${op.id}/status`, { status });
      setData({ operators: pending.filter((o) => o.id !== op.id) });
      toast.success(
        status === "active"
          ? `${op.businessName} amekubaliwa`
          : `${op.businessName} amekataliwa`,
      );
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <PageHeader
        icon="hourglass-split"
        title="Wanaosubiri"
        subtitle="Operators wapya wanaosubiri idhini"
        actions={
          pending.length > 0 ? <Badge tone="warning">{pending.length} wanasubiri</Badge> : undefined
        }
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : pending.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="neu-sm flex h-16 w-16 items-center justify-center rounded-3xl text-3xl text-[var(--color-earn)]">
            <Icon name="check2-all" />
          </span>
          <p className="font-display text-lg font-bold text-content">Hakuna anayesubiri</p>
          <p className="text-sm text-muted">Maombi yote yameshughulikiwa.</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {pending.map((op) => (
            <Card key={op.id} className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="neu-sm flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg font-bold text-brand">
                  {op.businessName?.[0]?.toUpperCase() ?? "?"}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-display font-bold text-content">{op.businessName}</p>
                  <p className="truncate text-xs text-muted">{op.operatorId}</p>
                </div>
                <Badge tone="neutral" className="ml-auto">
                  {op.deviceType === "mikrotik" ? "MikroTik" : "Omada"}
                </Badge>
              </div>

              <div className="neu-inset space-y-1.5 rounded-2xl px-4 py-3 text-sm">
                <p className="flex items-center gap-2 text-content">
                  <Icon name="person" className="text-muted" /> {op.name}
                </p>
                <p className="flex items-center gap-2 text-content">
                  <Icon name="envelope" className="text-muted" /> {op.email}
                </p>
                <p className="flex items-center gap-2 text-content">
                  <Icon name="telephone" className="text-muted" /> {op.phone ?? "—"}
                </p>
                {op.region && (
                  <p className="flex items-center gap-2 text-content">
                    <Icon name="geo-alt" className="text-muted" /> {op.region}
                  </p>
                )}
                <p className="flex items-center gap-2 text-content">
                  <Icon name="box-seam" className="text-muted" /> Kifurushi: {packageLabels[op.package]}
                </p>
                <p className="flex items-center gap-2 text-muted">
                  <Icon name="calendar3" /> Aliomba {op.createdAt ? formatDate(op.createdAt) : "—"}
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  className="flex-1"
                  loading={busyId === op.id}
                  onClick={() => decide(op, "active")}
                >
                  <Icon name="check-circle" /> Kubali
                </Button>
                <Button
                  className="flex-1"
                  variant="danger"
                  disabled={busyId === op.id}
                  onClick={() => decide(op, "blocked")}
                >
                  <Icon name="x-circle" /> Kataa
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
