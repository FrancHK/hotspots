"use client";

import { useFetch } from "@/lib/useFetch";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "./StatusBadge";
import { formatTZS, formatDate } from "@/lib/format";
import { packageLabels, type AdminOperatorDetail } from "@/lib/types";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-right text-sm font-medium text-content">{value}</span>
    </div>
  );
}

function MiniStat({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="neu-inset rounded-2xl px-3 py-3 text-center">
      <Icon name={icon} className="text-lg text-brand" />
      <p className="tabular mt-1 text-base font-bold text-content">{value}</p>
      <p className="text-[11px] text-muted">{label}</p>
    </div>
  );
}

export function OperatorDetailModal({
  operatorId,
  open,
  onClose,
}: {
  operatorId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const { data, loading } = useFetch<{ operator: AdminOperatorDetail }>(
    open && operatorId ? `/operators/${operatorId}` : null,
  );
  const op = data?.operator;

  return (
    <Modal open={open} onClose={onClose} title="Maelezo ya Operator" className="max-w-lg">
      {loading || !op ? (
        <div className="flex justify-center py-10">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="neu-brand flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-bold text-white">
              {op.businessName?.[0]?.toUpperCase() ?? "?"}
            </span>
            <div className="min-w-0">
              <p className="truncate font-display text-lg font-bold text-content">{op.businessName}</p>
              <div className="mt-0.5 flex flex-wrap items-center gap-2">
                <Badge tone="brand">{op.operatorId}</Badge>
                <StatusBadge status={op.status} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <MiniStat label="APs" value={String(op._count?.accessPoints ?? 0)} icon="router" />
            <MiniStat label="Vifurushi" value={String(op._count?.packages ?? 0)} icon="box-seam" />
            <MiniStat label="Vocha" value={String(op._count?.vouchers ?? 0)} icon="ticket-perforated" />
            <MiniStat label="Miamala" value={String(op._count?.transactions ?? 0)} icon="receipt" />
          </div>

          <div className="neu-inset rounded-2xl px-4 py-2">
            <Row label="Jina" value={op.name} />
            <Row label="Email" value={op.email} />
            <Row label="Simu" value={op.phone ?? "—"} />
            <Row label="M-Pesa" value={op.mpesa ?? "—"} />
            <Row label="Mkoa" value={op.region ?? "—"} />
            <Row label="Kifaa" value={op.deviceType === "mikrotik" ? "MikroTik" : "Omada"} />
            <Row label="Kifurushi" value={packageLabels[op.package]} />
            <Row label="Amejisajili" value={op.createdAt ? formatDate(op.createdAt) : "—"} />
          </div>

          <div className="neu-inset rounded-2xl px-4 py-2">
            <Row label="Salio la pochi" value={formatTZS(op.wallet?.balance ?? 0)} />
            <Row
              label="Jumla aliyopata"
              value={<span className="text-[var(--color-earn)]">{formatTZS(op.wallet?.totalEarned ?? 0)}</span>}
            />
            <Row label="Jumla aliyotoa" value={formatTZS(op.wallet?.totalWithdrawn ?? 0)} />
          </div>
        </div>
      )}
    </Modal>
  );
}
