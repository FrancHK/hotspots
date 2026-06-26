"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";
import { api, apiError } from "@/lib/api";
import { setSession } from "@/lib/auth";

type DeviceType = "omada" | "mikrotik";
type Tier = "starter" | "basic" | "pro";

interface FormData {
  name: string;
  businessName: string;
  email: string;
  phone: string;
  password: string;
  region: string;
  mpesa: string;
  deviceType: DeviceType;
  package: Tier;
}

const steps = ["Taarifa", "Kifaa & Kifurushi", "Thibitisha"];

const tiers: { id: Tier; name: string; price: string; aps: string }[] = [
  { id: "starter", name: "Starter", price: "Bure", aps: "AP 1" },
  { id: "basic", name: "Basic", price: "16,000 TZS/mwezi", aps: "AP 5" },
  { id: "pro", name: "Pro", price: "35,000 TZS/mwezi", aps: "AP 10" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<FormData>({
    name: "",
    businessName: "",
    email: "",
    phone: "",
    password: "",
    region: "",
    mpesa: "",
    deviceType: "omada",
    package: "starter",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (patch: Partial<FormData>) =>
    setData((d) => ({ ...d, ...patch }));

  const isMikrotik = data.deviceType === "mikrotik";

  function next() {
    setError(null);
    if (step === 0) {
      if (
        data.name.trim().length < 2 ||
        data.businessName.trim().length < 2 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) ||
        data.phone.trim().length < 7 ||
        data.password.length < 6
      ) {
        setError("Jaza taarifa zote kwa usahihi (nenosiri herufi 6+).");
        return;
      }
    }
    setStep((s) => Math.min(s + 1, steps.length - 1));
  }

  function back() {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/auth/operator/register", {
        name: data.name,
        businessName: data.businessName,
        email: data.email,
        password: data.password,
        phone: data.phone,
        region: data.region || undefined,
        mpesa: data.mpesa || undefined,
        deviceType: data.deviceType,
        package: isMikrotik ? "pro" : data.package,
      });
      // Registration logs the operator straight in — no admin approval —
      // then sends them to onboarding to set up their first site.
      setSession(res.data.token, "operator", res.data.operator);
      router.push("/onboarding");
    } catch (err) {
      setError(apiError(err, "Imeshindikana kujisajili"));
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Fungua akaunti" subtitle="Hatua 3 tu kuanza" wide>
      <Card>
        {/* Stepper */}
        <div className="mb-7 flex items-center">
          {steps.map((label, i) => (
            <div key={label} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <span
                  className={cn(
                    "tabular flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold",
                    i <= step ? "neu-brand" : "neu-inset text-muted",
                  )}
                >
                  {i + 1}
                </span>
                <span
                  className={cn(
                    "hidden text-xs font-medium sm:block",
                    i <= step ? "text-content" : "text-muted",
                  )}
                >
                  {label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "mx-2 h-0.5 flex-1 rounded-full",
                    i < step ? "bg-brand" : "bg-line",
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1 — info */}
        {step === 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Jina lako" value={data.name} onChange={(e) => set({ name: e.target.value })} placeholder="Asha Juma" />
            <Input label="Jina la biashara" value={data.businessName} onChange={(e) => set({ businessName: e.target.value })} placeholder="Cheetah Cafe" />
            <Input label="Barua pepe" type="email" value={data.email} onChange={(e) => set({ email: e.target.value })} placeholder="jina@biashara.tz" />
            <Input label="Namba ya simu" value={data.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="0744 123 123" />
            <Input label="Nenosiri" type="password" value={data.password} onChange={(e) => set({ password: e.target.value })} placeholder="herufi 6+" className="sm:col-span-2" />
          </div>
        )}

        {/* Step 2 — device + package */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <p className="mb-2 text-sm font-medium text-muted">Aina ya kifaa</p>
              <div className="grid grid-cols-2 gap-3">
                {(["omada", "mikrotik"] as DeviceType[]).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => set({ deviceType: d })}
                    className={cn(
                      "rounded-2xl p-4 text-left",
                      data.deviceType === d ? "neu-brand" : "neu-press text-content",
                    )}
                  >
                    <span className="block text-lg font-bold capitalize">{d}</span>
                    <span className={cn("text-xs", data.deviceType === d ? "text-white/80" : "text-muted")}>
                      {d === "mikrotik" ? "Hakuna ada ya mwezi" : "Omada Controller"}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-muted">Kifurushi</p>
              {isMikrotik ? (
                <div className="rounded-2xl neu-inset p-4 text-sm text-muted">
                  Vifaa vya MikroTik huwa <strong className="text-content">Pro</strong> bila ada ya kila mwezi — unalipa commission pekee.
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-3">
                  {tiers.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => set({ package: t.id })}
                      className={cn(
                        "rounded-2xl p-4 text-left",
                        data.package === t.id ? "neu-brand" : "neu-press text-content",
                      )}
                    >
                      <span className="block font-bold">{t.name}</span>
                      <span className={cn("tabular text-xs", data.package === t.id ? "text-white/90" : "text-brand")}>{t.price}</span>
                      <span className={cn("mt-1 block text-xs", data.package === t.id ? "text-white/80" : "text-muted")}>{t.aps}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Mkoa (hiari)" value={data.region} onChange={(e) => set({ region: e.target.value })} placeholder="Dar es Salaam" />
              <Input label="Namba ya M-Pesa ya malipo (hiari)" value={data.mpesa} onChange={(e) => set({ mpesa: e.target.value })} placeholder="0744 123 123" />
            </div>
          </div>
        )}

        {/* Step 3 — confirm */}
        {step === 2 && (
          <div className="space-y-3">
            {[
              ["Jina", data.name],
              ["Biashara", data.businessName],
              ["Barua pepe", data.email],
              ["Simu", data.phone],
              ["Mkoa", data.region || "—"],
              ["Kifaa", data.deviceType],
              ["Kifurushi", isMikrotik ? "pro (MikroTik)" : data.package],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between border-b border-line pb-2 text-sm">
                <span className="text-muted">{k}</span>
                <span className="font-semibold capitalize text-content">{v}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 pt-1">
              <Badge tone="success">Utaingia moja kwa moja baada ya kujisajili</Badge>
            </div>
          </div>
        )}

        {error && (
          <p className="mt-4 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-500">
            {error}
          </p>
        )}

        {/* Nav buttons */}
        <div className="mt-7 flex items-center justify-between gap-3">
          {step > 0 ? (
            <Button variant="neutral" onClick={back} type="button">
              ← Nyuma
            </Button>
          ) : (
            <span />
          )}
          {step < steps.length - 1 ? (
            <Button onClick={next} type="button">
              Endelea →
            </Button>
          ) : (
            <Button onClick={submit} loading={loading} type="button">
              Kamilisha usajili
            </Button>
          )}
        </div>
      </Card>

      <p className="mt-5 text-center text-sm text-muted">
        Una akaunti tayari?{" "}
        <Link href="/login" className="font-semibold text-brand">
          Ingia
        </Link>
      </p>
    </AuthShell>
  );
}
