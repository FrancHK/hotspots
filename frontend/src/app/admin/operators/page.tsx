"use client";

import { useMemo, useState } from "react";
import { api, apiError } from "@/lib/api";
import { useFetch } from "@/lib/useFetch";
import { useToast } from "@/components/ui/Toast";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { OperatorDetailModal } from "@/components/admin/OperatorDetailModal";
import { formatTZS } from "@/lib/format";
import { packageLabels, type AdminOperator } from "@/lib/types";

type Tier = "starter" | "basic" | "pro";

export default function OperatorsPage() {
  const toast = useToast();
  const { data, loading, refetch, setData } = useFetch<{ operators: AdminOperator[] }>(
    "/operators",
  );
  const operators = useMemo(() => data?.operators ?? [], [data]);

  const [status, setStatus] = useState("all");
  const [device, setDevice] = useState("all");
  const [query, setQuery] = useState("");

  const [detailId, setDetailId] = useState<string | null>(null);
  const [pkgOp, setPkgOp] = useState<AdminOperator | null>(null);
  const [pkgValue, setPkgValue] = useState<Tier>("starter");
  const [deleteOp, setDeleteOp] = useState<AdminOperator | null>(null);
  const [busy, setBusy] = useState(false);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return operators.filter((o) => {
      if (status !== "all" && o.status !== status) return false;
      if (device !== "all" && o.deviceType !== device) return false;
      if (q) {
        const hay = `${o.name} ${o.businessName} ${o.email} ${o.operatorId}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [operators, status, device, query]);

  async function toggleBlock(op: AdminOperator) {
    const next = op.status === "blocked" ? "active" : "blocked";
    setBusy(true);
    try {
      await api.put(`/operators/${op.id}/status`, { status: next });
      // Optimistic local update.
      setData({
        operators: operators.map((o) => (o.id === op.id ? { ...o, status: next } : o)),
      });
      toast.success(next === "blocked" ? "Operator amezuiwa" : "Operator amefunguliwa");
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setBusy(false);
    }
  }

  async function changePackage() {
    if (!pkgOp) return;
    setBusy(true);
    try {
      await api.put(`/operators/${pkgOp.id}`, { package: pkgValue });
      setData({
        operators: operators.map((o) =>
          o.id === pkgOp.id ? { ...o, package: pkgValue } : o,
        ),
      });
      toast.success("Kifurushi kimebadilishwa");
      setPkgOp(null);
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!deleteOp) return;
    setBusy(true);
    try {
      await api.delete(`/operators/${deleteOp.id}`);
      setData({ operators: operators.filter((o) => o.id !== deleteOp.id) });
      toast.success(`${deleteOp.businessName} amefutwa`);
      setDeleteOp(null);
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        icon="people"
        title="Operators"
        subtitle={`Jumla ${operators.length} • wanaoonyeshwa ${rows.length}`}
        actions={
          <Button size="sm" variant="neutral" onClick={() => refetch()}>
            <Icon name="arrow-clockwise" /> Onyesha upya
          </Button>
        }
      />

      <Card>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Input
            placeholder="Tafuta jina, biashara, email…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">Hali zote</option>
            <option value="active">Active</option>
            <option value="pending">Inasubiri</option>
            <option value="blocked">Imezuiwa</option>
          </Select>
          <Select value={device} onChange={(e) => setDevice(e.target.value)}>
            <option value="all">Vifaa vyote</option>
            <option value="omada">Omada</option>
            <option value="mikrotik">MikroTik</option>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : rows.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted">Hakuna operator anayelingana.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted">
                  <th className="py-2 pr-3">Operator</th>
                  <th className="hidden py-2 pr-3 md:table-cell">Mawasiliano</th>
                  <th className="hidden py-2 pr-3 lg:table-cell">Kifaa</th>
                  <th className="hidden py-2 pr-3 sm:table-cell">Kifurushi</th>
                  <th className="py-2 pr-3">Hali</th>
                  <th className="hidden py-2 pr-3 lg:table-cell">Commission</th>
                  <th className="py-2 text-right">Vitendo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((o) => (
                  <tr key={o.id} className="text-content">
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2.5">
                        <span className="neu-sm flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-brand">
                          {o.businessName?.[0]?.toUpperCase() ?? "?"}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{o.businessName}</p>
                          <p className="truncate text-xs text-muted">{o.operatorId} • {o.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden py-3 pr-3 md:table-cell">
                      <p className="truncate text-xs text-content">{o.email}</p>
                      <p className="truncate text-xs text-muted">{o.phone ?? "—"}</p>
                    </td>
                    <td className="hidden py-3 pr-3 lg:table-cell">
                      <Badge tone="neutral">{o.deviceType === "mikrotik" ? "MikroTik" : "Omada"}</Badge>
                    </td>
                    <td className="hidden py-3 pr-3 sm:table-cell">{packageLabels[o.package]}</td>
                    <td className="py-3 pr-3"><StatusBadge status={o.status} /></td>
                    <td className="tabular hidden py-3 pr-3 font-semibold text-[var(--color-earn)] lg:table-cell">
                      {formatTZS(o.wallet?.totalEarned ?? 0)}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setDetailId(o.id)}
                          title="Ona maelezo"
                          className="neu-press flex h-8 w-8 items-center justify-center rounded-xl text-content"
                        >
                          <Icon name="eye" />
                        </button>
                        <button
                          onClick={() => { setPkgOp(o); setPkgValue(o.package); }}
                          title="Badilisha kifurushi"
                          className="neu-press flex h-8 w-8 items-center justify-center rounded-xl text-content"
                        >
                          <Icon name="box-seam" />
                        </button>
                        <button
                          onClick={() => toggleBlock(o)}
                          disabled={busy}
                          title={o.status === "blocked" ? "Fungua" : "Zuia"}
                          className="neu-press flex h-8 w-8 items-center justify-center rounded-xl text-amber-500"
                        >
                          <Icon name={o.status === "blocked" ? "unlock" : "lock"} />
                        </button>
                        <button
                          onClick={() => setDeleteOp(o)}
                          title="Futa"
                          className="neu-press flex h-8 w-8 items-center justify-center rounded-xl text-red-500"
                        >
                          <Icon name="trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <OperatorDetailModal
        operatorId={detailId}
        open={detailId !== null}
        onClose={() => setDetailId(null)}
      />

      {/* Change package modal */}
      <Modal
        open={pkgOp !== null}
        onClose={() => setPkgOp(null)}
        title="Badilisha Kifurushi"
        footer={
          <>
            <Button variant="neutral" onClick={() => setPkgOp(null)}>Ghairi</Button>
            <Button loading={busy} onClick={changePackage}>Hifadhi</Button>
          </>
        }
      >
        <p className="text-sm text-muted">
          Badilisha kifurushi cha <b className="text-content">{pkgOp?.businessName}</b>.
        </p>
        <Select
          className="mt-4"
          label="Kifurushi"
          value={pkgValue}
          onChange={(e) => setPkgValue(e.target.value as Tier)}
        >
          <option value="starter">Starter</option>
          <option value="basic">Basic</option>
          <option value="pro">Pro</option>
        </Select>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        open={deleteOp !== null}
        onClose={() => setDeleteOp(null)}
        title="Futa Operator"
        footer={
          <>
            <Button variant="neutral" onClick={() => setDeleteOp(null)}>Ghairi</Button>
            <Button variant="danger" loading={busy} onClick={confirmDelete}>Futa kabisa</Button>
          </>
        }
      >
        <div className="flex items-start gap-3">
          <Icon name="exclamation-triangle" className="mt-0.5 text-xl text-red-500" />
          <p className="text-sm text-content">
            Una uhakika unataka kufuta <b>{deleteOp?.businessName}</b> ({deleteOp?.operatorId})?
            Hatua hii itafuta pia sites, access points, vocha, na miamala yote. Haiwezi kutenduliwa.
          </p>
        </div>
      </Modal>
    </>
  );
}
