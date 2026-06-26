"use client";

import { useState, type FormEvent } from "react";
import { api, apiError } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { methodLabels, type PayoutAccount, type PayoutType, type MobileProvider } from "@/lib/types";

export function payoutLabel(a: PayoutAccount): string {
  if (a.type === "mobile") {
    return `${a.provider ? methodLabels[a.provider] : "Simu"} · ${a.phone}`;
  }
  return `${a.bankName} · ${a.accountNumber}`;
}

const emptyForm = {
  type: "mobile" as PayoutType,
  label: "",
  provider: "mpesa" as MobileProvider,
  phone: "",
  bankName: "",
  accountName: "",
  accountNumber: "",
  isDefault: false,
};

export function PayoutAccounts({
  accounts,
  onChanged,
}: {
  accounts: PayoutAccount[];
  onChanged: () => void;
}) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);

  async function add(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const body =
      form.type === "mobile"
        ? {
            type: "mobile",
            label: form.label.trim() || undefined,
            provider: form.provider,
            phone: form.phone.trim(),
            isDefault: form.isDefault,
          }
        : {
            type: "bank",
            label: form.label.trim() || undefined,
            bankName: form.bankName.trim(),
            accountName: form.accountName.trim(),
            accountNumber: form.accountNumber.trim(),
            isDefault: form.isDefault,
          };
    try {
      await api.post("/payouts", body);
      toast.success("Akaunti imeongezwa");
      setOpen(false);
      setForm(emptyForm);
      onChanged();
    } catch (err) {
      toast.error(apiError(err, "Imeshindikana kuongeza akaunti"));
    } finally {
      setBusy(false);
    }
  }

  async function setDefault(a: PayoutAccount) {
    if (a.isDefault) return;
    try {
      await api.put(`/payouts/${a.id}/default`);
      onChanged();
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  async function remove(a: PayoutAccount) {
    if (!confirm("Futa akaunti hii ya malipo?")) return;
    try {
      await api.delete(`/payouts/${a.id}`);
      toast.success("Akaunti imefutwa");
      onChanged();
    } catch (err) {
      toast.error(apiError(err, "Imeshindikana kufuta"));
    }
  }

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display font-bold text-content">Akaunti za malipo</h2>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Icon name="plus-lg" /> Ongeza
        </Button>
      </div>

      {accounts.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">
          Hakuna akaunti. Ongeza namba ya simu au benki ya kupokea pesa.
        </p>
      ) : (
        <div className="space-y-2">
          {accounts.map((a) => (
            <div
              key={a.id}
              className="neu-inset flex items-center gap-3 rounded-2xl px-4 py-3"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl text-brand">
                <Icon name={a.type === "mobile" ? "phone" : "bank"} className="text-lg" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 truncate text-sm font-medium text-content">
                  {a.label || (a.type === "mobile" ? "Simu" : "Benki")}
                  {a.isDefault && <Badge tone="brand">Default</Badge>}
                </p>
                <p className="truncate text-xs text-muted">{payoutLabel(a)}</p>
              </div>
              {!a.isDefault && (
                <button
                  onClick={() => setDefault(a)}
                  title="Weka kama default"
                  className="neu-press flex h-8 w-8 items-center justify-center rounded-xl text-muted hover:text-content"
                >
                  <Icon name="star" />
                </button>
              )}
              <button
                onClick={() => remove(a)}
                title="Futa"
                className="neu-press flex h-8 w-8 items-center justify-center rounded-xl text-red-500"
              >
                <Icon name="trash" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Ongeza akaunti ya malipo"
        footer={
          <>
            <Button variant="neutral" onClick={() => setOpen(false)}>
              Ghairi
            </Button>
            <Button form="payout-form" type="submit" loading={busy}>
              Hifadhi
            </Button>
          </>
        }
      >
        <form id="payout-form" onSubmit={add} className="space-y-4">
          {/* Type toggle */}
          <div className="grid grid-cols-2 gap-2">
            {(["mobile", "bank"] as PayoutType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setForm({ ...form, type: t })}
                className={
                  "flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold transition " +
                  (form.type === t ? "neu-inset text-brand" : "neu-press text-muted")
                }
              >
                <Icon name={t === "mobile" ? "phone" : "bank"} />
                {t === "mobile" ? "Namba ya simu" : "Benki"}
              </button>
            ))}
          </div>

          <Input
            label="Jina la akaunti (hiari)"
            placeholder="Akaunti kuu"
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
          />

          {form.type === "mobile" ? (
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Mtoa huduma"
                value={form.provider}
                onChange={(e) => setForm({ ...form, provider: e.target.value as MobileProvider })}
              >
                <option value="mpesa">M-Pesa</option>
                <option value="tigopesa">Tigo Pesa</option>
                <option value="airtel">Airtel Money</option>
              </Select>
              <Input
                label="Namba ya simu"
                placeholder="0744 000 000"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
              />
            </div>
          ) : (
            <>
              <Input
                label="Jina la benki"
                placeholder="CRDB"
                value={form.bankName}
                onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                required
              />
              <Input
                label="Jina la mwenye akaunti"
                value={form.accountName}
                onChange={(e) => setForm({ ...form, accountName: e.target.value })}
                required
              />
              <Input
                label="Namba ya akaunti"
                value={form.accountNumber}
                onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                required
              />
            </>
          )}

          <label className="flex items-center gap-2 text-sm text-content">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
              className="h-4 w-4 accent-brand"
            />
            Tumia kama akaunti ya msingi (default)
          </label>
        </form>
      </Modal>
    </Card>
  );
}
