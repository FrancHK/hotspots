"use client";

import { useMemo, useState, type FormEvent } from "react";
import { api, apiError } from "@/lib/api";
import { useFetch } from "@/lib/useFetch";
import { useToast } from "@/components/ui/Toast";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { formatTZS, formatDuration, formatDate } from "@/lib/format";
import type { Voucher, DurationUnit } from "@/lib/types";

const emptyForm = {
  quantity: 10,
  title: "",
  duration: 1,
  durationUnit: "hours" as DurationUnit,
  speed: 3,
  price: 500,
};

// Opens a printable window with the given vouchers and triggers the print dialog.
function printVouchers(vouchers: Voucher[]) {
  const w = window.open("", "_blank", "width=800,height=900");
  if (!w) return;
  const cards = vouchers
    .map(
      (v) => `
      <div class="v">
        <div class="brand">🐆 HotspotX</div>
        <div class="code">${v.code}</div>
        <div class="meta">${v.title ?? "Vocha"} · ${formatDuration(v.duration, v.durationUnit)} · ${v.speed} Mbps</div>
        <div class="price">${formatTZS(v.price)}</div>
      </div>`,
    )
    .join("");
  w.document.write(`<!doctype html><html><head><title>Vocha HotspotX</title>
    <style>
      *{font-family:system-ui,sans-serif;box-sizing:border-box}
      body{padding:16px;background:#fff}
      .grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
      .v{border:2px dashed #FF8C42;border-radius:14px;padding:16px;text-align:center}
      .brand{color:#FF8C42;font-weight:800;font-size:13px}
      .code{font-family:monospace;font-size:22px;font-weight:700;letter-spacing:2px;margin:8px 0;color:#1a1f2e}
      .meta{font-size:12px;color:#555}
      .price{margin-top:6px;font-weight:700;color:#1a1f2e}
    </style></head><body><div class="grid">${cards}</div>
    <script>window.onload=function(){window.print()}</script></body></html>`);
  w.document.close();
}

export default function VouchersPage() {
  const toast = useToast();
  const { data, loading, refetch } = useFetch<{ vouchers: Voucher[] }>("/vouchers/my");
  const vouchers = useMemo(() => data?.vouchers ?? [], [data]);

  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [creating, setCreating] = useState(false);

  const stats = useMemo(() => {
    const used = vouchers.filter((v) => v.status === "used").length;
    return { used, unused: vouchers.length - used, total: vouchers.length };
  }, [vouchers]);

  const filtered = useMemo(() => {
    const q = search.trim().toUpperCase();
    return vouchers.filter(
      (v) =>
        (statusFilter === "all" || v.status === statusFilter) &&
        (!q || v.code.toUpperCase().includes(q)),
    );
  }, [vouchers, statusFilter, search]);

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function toggleAll() {
    setSelected((s) =>
      s.size === filtered.length ? new Set() : new Set(filtered.map((v) => v.id)),
    );
  }

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(`Imenakiliwa: ${code}`);
    } catch {
      toast.error("Imeshindikana kunakili");
    }
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await api.post<{ created: number }>("/vouchers/create", {
        quantity: Number(form.quantity),
        title: form.title.trim() || undefined,
        duration: Number(form.duration),
        durationUnit: form.durationUnit,
        speed: Number(form.speed),
        price: Number(form.price),
      });
      toast.success(`Vocha ${res.data.created} zimetengenezwa`);
      setModalOpen(false);
      setForm(emptyForm);
      void refetch();
    } catch (err) {
      toast.error(apiError(err, "Imeshindikana kutengeneza vocha"));
    } finally {
      setCreating(false);
    }
  }

  async function remove(v: Voucher) {
    if (!confirm(`Futa vocha ${v.code}?`)) return;
    try {
      await api.delete(`/vouchers/${v.id}`);
      toast.success("Vocha imefutwa");
      setSelected((s) => {
        const n = new Set(s);
        n.delete(v.id);
        return n;
      });
      void refetch();
    } catch (err) {
      toast.error(apiError(err, "Imeshindikana kufuta"));
    }
  }

  async function removeSelected() {
    const ids = [...selected];
    const unusedSel = vouchers.filter((v) => ids.includes(v.id) && v.status === "unused");
    if (unusedSel.length === 0) {
      toast.info("Chagua vocha ambazo hazijatumika");
      return;
    }
    if (!confirm(`Futa vocha ${unusedSel.length} zilizochaguliwa?`)) return;
    await Promise.allSettled(unusedSel.map((v) => api.delete(`/vouchers/${v.id}`)));
    toast.success(`Vocha ${unusedSel.length} zimefutwa`);
    setSelected(new Set());
    void refetch();
  }

  const selectedVouchers = vouchers.filter((v) => selected.has(v.id));

  return (
    <>
      <PageHeader
        icon="ticket-perforated"
        title="Vocha"
        subtitle="Tengeneza na simamia vocha za WiFi"
        actions={
          <Button onClick={() => setModalOpen(true)}>
            <Icon name="plus-lg" /> Tengeneza Vocha
          </Button>
        }
      />

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Hazijatumika" value={String(stats.unused)} icon="ticket" tone="earn" />
        <StatCard label="Zimetumika" value={String(stats.used)} icon="ticket-detailed" tone="info" />
        <StatCard label="Jumla" value={String(stats.total)} icon="collection" tone="brand" />
      </div>

      <Card className="mt-4">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <Input
              placeholder="Tafuta kwa code…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="sm:w-48"
          >
            <option value="all">Hali zote</option>
            <option value="unused">Hazijatumika</option>
            <option value="used">Zimetumika</option>
          </Select>
        </div>

        {/* Bulk bar */}
        {selected.size > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl bg-brand/10 px-4 py-2.5 text-sm">
            <span className="font-medium text-content">{selected.size} zimechaguliwa</span>
            <div className="ml-auto flex gap-2">
              <Button size="sm" variant="neutral" onClick={() => printVouchers(selectedVouchers)}>
                <Icon name="printer" /> Chapisha
              </Button>
              <Button size="sm" variant="danger" onClick={removeSelected}>
                <Icon name="trash" /> Futa
              </Button>
            </div>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted">Hakuna vocha.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted">
                  <th className="py-2 pr-2">
                    <input
                      type="checkbox"
                      checked={selected.size === filtered.length && filtered.length > 0}
                      onChange={toggleAll}
                      className="h-4 w-4 accent-brand"
                    />
                  </th>
                  <th className="py-2 pr-3">Code</th>
                  <th className="py-2 pr-3">Bei</th>
                  <th className="hidden py-2 pr-3 sm:table-cell">Muda</th>
                  <th className="py-2 pr-3">Hali</th>
                  <th className="hidden py-2 pr-3 md:table-cell">Tarehe</th>
                  <th className="py-2 text-right">Vitendo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((v) => (
                  <tr key={v.id} className="text-content">
                    <td className="py-3 pr-2">
                      <input
                        type="checkbox"
                        checked={selected.has(v.id)}
                        onChange={() => toggle(v.id)}
                        className="h-4 w-4 accent-brand"
                      />
                    </td>
                    <td className="py-3 pr-3 font-mono font-semibold tracking-wide">{v.code}</td>
                    <td className="tabular py-3 pr-3">{formatTZS(v.price)}</td>
                    <td className="hidden py-3 pr-3 sm:table-cell">
                      {formatDuration(v.duration, v.durationUnit)} · {v.speed}Mbps
                    </td>
                    <td className="py-3 pr-3">
                      <Badge tone={v.status === "used" ? "neutral" : "success"}>
                        {v.status === "used" ? "Imetumika" : "Haijatumika"}
                      </Badge>
                    </td>
                    <td className="hidden py-3 pr-3 text-muted md:table-cell">{formatDate(v.createdAt)}</td>
                    <td className="py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => copyCode(v.code)}
                          title="Nakili"
                          className="neu-press flex h-8 w-8 items-center justify-center rounded-xl text-muted hover:text-content"
                        >
                          <Icon name="clipboard" />
                        </button>
                        <button
                          onClick={() => remove(v)}
                          disabled={v.status === "used"}
                          title="Futa"
                          className="neu-press flex h-8 w-8 items-center justify-center rounded-xl text-red-500 disabled:opacity-30"
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

      {/* Create modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Tengeneza Vocha"
        footer={
          <>
            <Button variant="neutral" onClick={() => setModalOpen(false)}>
              Ghairi
            </Button>
            <Button form="voucher-form" type="submit" loading={creating}>
              Tengeneza
            </Button>
          </>
        }
      >
        <form id="voucher-form" onSubmit={onCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Idadi"
              type="number"
              min={1}
              max={500}
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: +e.target.value })}
              required
            />
            <Input
              label="Kichwa (hiari)"
              placeholder="Saa 1"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Muda"
              type="number"
              min={1}
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: +e.target.value })}
              required
            />
            <Select
              label="Kipimo"
              value={form.durationUnit}
              onChange={(e) => setForm({ ...form, durationUnit: e.target.value as DurationUnit })}
            >
              <option value="minutes">Dakika</option>
              <option value="hours">Saa</option>
              <option value="days">Siku</option>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Kasi (Mbps)"
              type="number"
              min={1}
              value={form.speed}
              onChange={(e) => setForm({ ...form, speed: +e.target.value })}
              required
            />
            <Input
              label="Bei (TZS)"
              type="number"
              min={0}
              value={form.price}
              onChange={(e) => setForm({ ...form, price: +e.target.value })}
              required
            />
          </div>
        </form>
      </Modal>
    </>
  );
}
