"use client";

import { useState, type FormEvent } from "react";
import { api, apiError } from "@/lib/api";
import { useFetch } from "@/lib/useFetch";
import { useToast } from "@/components/ui/Toast";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { formatTZS, formatDuration } from "@/lib/format";
import type { Package, DurationUnit } from "@/lib/types";

const emptyForm = {
  name: "",
  duration: 1,
  durationUnit: "hours" as DurationUnit,
  speed: 3,
  price: 500,
  status: "active" as "active" | "inactive",
};

export default function PackagesPage() {
  const toast = useToast();
  const { data, loading, refetch } = useFetch<{ packages: Package[] }>("/packages/my");
  const packages = data?.packages ?? [];

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Package | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }
  function openEdit(p: Package) {
    setEditing(p);
    setForm({
      name: p.name,
      duration: p.duration,
      durationUnit: p.durationUnit,
      speed: p.speed,
      price: p.price,
      status: p.status,
    });
    setOpen(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const body = {
      name: form.name.trim(),
      duration: Number(form.duration),
      durationUnit: form.durationUnit,
      speed: Number(form.speed),
      price: Number(form.price),
      status: form.status,
    };
    try {
      if (editing) {
        await api.put(`/packages/${editing.id}`, body);
        toast.success("Kifurushi kimesasishwa");
      } else {
        await api.post("/packages", body);
        toast.success("Kifurushi kimeongezwa");
      }
      setOpen(false);
      void refetch();
    } catch (err) {
      toast.error(apiError(err, "Imeshindikana kuhifadhi"));
    } finally {
      setBusy(false);
    }
  }

  async function toggleStatus(p: Package) {
    try {
      await api.put(`/packages/${p.id}`, {
        status: p.status === "active" ? "inactive" : "active",
      });
      void refetch();
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  async function remove(p: Package) {
    if (!confirm(`Futa kifurushi "${p.name}"?`)) return;
    try {
      await api.delete(`/packages/${p.id}`);
      toast.success("Kifurushi kimefutwa");
      void refetch();
    } catch (err) {
      toast.error(apiError(err, "Imeshindikana kufuta"));
    }
  }

  return (
    <>
      <PageHeader
        icon="box-seam"
        title="Vifurushi"
        subtitle="Bei na muda wa kuuza internet"
        actions={
          <Button onClick={openCreate}>
            <Icon name="plus-lg" /> Ongeza Kifurushi
          </Button>
        }
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : packages.length === 0 ? (
        <Card className="py-12 text-center text-sm text-muted">
          Hakuna vifurushi. Bonyeza “Ongeza Kifurushi”.
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((p) => (
            <Card key={p.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display text-lg font-bold text-content">{p.name}</h3>
                  <p className="text-sm text-muted">
                    {formatDuration(p.duration, p.durationUnit)} · {p.speed} Mbps
                  </p>
                </div>
                <Badge tone={p.status === "active" ? "success" : "neutral"}>
                  {p.status === "active" ? "Hai" : "Imezimwa"}
                </Badge>
              </div>
              <p className="tabular text-2xl font-bold text-brand">{formatTZS(p.price)}</p>
              <div className="mt-auto flex items-center gap-2 border-t border-line pt-3">
                <button
                  onClick={() => toggleStatus(p)}
                  title={p.status === "active" ? "Zima" : "Washa"}
                  className="neu-press flex h-9 w-9 items-center justify-center rounded-xl text-content"
                >
                  <Icon name={p.status === "active" ? "toggle-on" : "toggle-off"} className="text-lg" />
                </button>
                <button
                  onClick={() => openEdit(p)}
                  title="Hariri"
                  className="neu-press flex h-9 w-9 items-center justify-center rounded-xl text-content"
                >
                  <Icon name="pencil" />
                </button>
                <button
                  onClick={() => remove(p)}
                  title="Futa"
                  className="neu-press ml-auto flex h-9 w-9 items-center justify-center rounded-xl text-red-500"
                >
                  <Icon name="trash" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Hariri Kifurushi" : "Ongeza Kifurushi"}
        footer={
          <>
            <Button variant="neutral" onClick={() => setOpen(false)}>
              Ghairi
            </Button>
            <Button form="package-form" type="submit" loading={busy}>
              Hifadhi
            </Button>
          </>
        }
      >
        <form id="package-form" onSubmit={onSubmit} className="space-y-4">
          <Input
            label="Jina"
            placeholder="Saa 1"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
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
          <Select
            label="Hali"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as "active" | "inactive" })}
          >
            <option value="active">Hai</option>
            <option value="inactive">Imezimwa</option>
          </Select>
        </form>
      </Modal>
    </>
  );
}
