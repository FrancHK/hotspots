"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, apiError } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

interface Form {
  name: string;
  businessName: string;
  email: string;
  password: string;
  phone: string;
  mpesa: string;
  region: string;
  deviceType: "omada" | "mikrotik";
  package: "starter" | "basic" | "pro";
}

const initial: Form = {
  name: "",
  businessName: "",
  email: "",
  password: "",
  phone: "",
  mpesa: "",
  region: "",
  deviceType: "omada",
  package: "starter",
};

export default function AddOperatorPage() {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState<Form>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [busy, setBusy] = useState(false);

  function set<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate(): boolean {
    const e: Partial<Record<keyof Form, string>> = {};
    if (form.name.trim().length < 2) e.name = "Jina ni fupi mno";
    if (form.businessName.trim().length < 2) e.businessName = "Jina la biashara ni fupi mno";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Email si sahihi";
    if (form.password.length < 6) e.password = "Nenosiri lazima liwe na herufi 6+";
    if (form.phone.trim().length < 7) e.phone = "Namba ya simu si sahihi";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setBusy(true);
    try {
      await api.post("/operators", {
        name: form.name.trim(),
        businessName: form.businessName.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        phone: form.phone.trim(),
        mpesa: form.mpesa.trim() || undefined,
        region: form.region.trim() || undefined,
        deviceType: form.deviceType,
        package: form.package,
        status: "active",
      });
      toast.success("Operator ameongezwa");
      router.push("/admin/operators");
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        icon="person-plus"
        title="Ongeza Operator"
        subtitle="Sajili operator mpya kwenye mfumo"
      />

      <Card className="mx-auto max-w-2xl">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Jina kamili"
              value={form.name}
              error={errors.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Juma Hassan"
            />
            <Input
              label="Jina la biashara"
              value={form.businessName}
              error={errors.businessName}
              onChange={(e) => set("businessName", e.target.value)}
              placeholder="Juma WiFi"
            />
            <Input
              label="Email"
              type="email"
              value={form.email}
              error={errors.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="juma@mfano.tz"
            />
            <Input
              label="Nenosiri"
              type="password"
              value={form.password}
              error={errors.password}
              onChange={(e) => set("password", e.target.value)}
              placeholder="••••••••"
            />
            <Input
              label="Namba ya simu"
              value={form.phone}
              error={errors.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="0712 345 678"
            />
            <Input
              label="Namba ya M-Pesa (hiari)"
              value={form.mpesa}
              onChange={(e) => set("mpesa", e.target.value)}
              placeholder="0712 345 678"
            />
            <Input
              label="Mkoa (hiari)"
              value={form.region}
              onChange={(e) => set("region", e.target.value)}
              placeholder="Dar es Salaam"
            />
            <Select
              label="Aina ya kifaa"
              value={form.deviceType}
              onChange={(e) => set("deviceType", e.target.value as Form["deviceType"])}
            >
              <option value="omada">Omada</option>
              <option value="mikrotik">MikroTik</option>
            </Select>
            <Select
              label="Kifurushi"
              value={form.package}
              onChange={(e) => set("package", e.target.value as Form["package"])}
            >
              <option value="starter">Starter</option>
              <option value="basic">Basic</option>
              <option value="pro">Pro</option>
            </Select>
          </div>

          {form.deviceType === "mikrotik" && (
            <p className="neu-inset rounded-2xl px-4 py-3 text-xs text-muted">
              <Icon name="info-circle" className="mr-1 text-brand" />
              Vifaa vya MikroTik huwekwa kwenye kifurushi cha Pro bila ada ya kila mwezi.
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="neutral" onClick={() => setForm(initial)}>
              Futa
            </Button>
            <Button type="submit" loading={busy}>
              <Icon name="check-lg" /> Sajili Operator
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}
