"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Brand } from "@/components/Brand";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Card } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { api, apiError } from "@/lib/api";
import { getRole } from "@/lib/auth";
import { useMounted } from "@/lib/useMounted";
import { cn } from "@/lib/cn";

type DeviceType = "omada" | "mikrotik";
type Unit = "minutes" | "hours" | "days";

interface Form {
  siteName: string;
  city: string;
  mikrotikIp: string;
  mikrotikUser: string;
  mikrotikPass: string;
  mikrotikPort: string;
  packageName: string;
  duration: string;
  durationUnit: Unit;
  speed: string;
  price: string;
}

const initialForm: Form = {
  siteName: "",
  city: "",
  mikrotikIp: "",
  mikrotikUser: "admin",
  mikrotikPass: "",
  mikrotikPort: "8728",
  packageName: "",
  duration: "1",
  durationUnit: "hours",
  speed: "5",
  price: "1000",
};

const steps = [
  { label: "Karibu", icon: "emoji-smile" },
  { label: "Site", icon: "geo-alt" },
  { label: "Kifaa", icon: "router" },
  { label: "Kifurushi", icon: "box-seam" },
  { label: "Tayari", icon: "check-circle" },
] as const;

const STORAGE_KEY = "hotspotx-onboarding";

export default function OnboardingPage() {
  const router = useRouter();
  const toast = useToast();
  const mounted = useMounted();

  const [statusLoading, setStatusLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>(initialForm);
  const [deviceType, setDeviceType] = useState<DeviceType>("omada");
  const [operatorName, setOperatorName] = useState("");
  const [portalPath, setPortalPath] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }));
  const isMikrotik = deviceType === "mikrotik";

  // Client-side operator guard.
  useEffect(() => {
    if (mounted && getRole() !== "operator") router.replace("/login");
  }, [mounted, router]);

  // Load onboarding status; resume saved progress or skip to dashboard.
  useEffect(() => {
    if (!mounted || getRole() !== "operator") return;
    let active = true;
    void (async () => {
      try {
        const res = await api.get("/onboarding/status");
        const st = res.data.status;
        if (!active) return;
        if (st.onboardingComplete) {
          router.replace("/dashboard");
          return;
        }
        setOperatorName(st.operator.name);
        setDeviceType(st.operator.deviceType);
        setPortalPath(st.portalPath);

        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          try {
            const parsed = JSON.parse(saved) as { step: number; form: Form };
            setForm((f) => ({ ...f, ...parsed.form }));
            // Never resume onto the success screen.
            setStep(Math.min(Math.max(parsed.step, 0), 3));
          } catch {
            /* ignore malformed cache */
          }
        }
      } catch {
        router.replace("/login");
      } finally {
        if (active) setStatusLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [mounted, router]);

  // Persist progress so a reload resumes where the operator left off.
  useEffect(() => {
    if (statusLoading || step >= 4) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ step, form }));
  }, [step, form, statusLoading]);

  function validateSite(): boolean {
    if (form.siteName.trim().length < 2) {
      setError("Andika jina la site (herufi 2+).");
      return false;
    }
    return true;
  }

  function validateDevice(): boolean {
    if (isMikrotik) {
      if (
        form.mikrotikIp.trim().length < 7 ||
        form.mikrotikUser.trim().length < 1 ||
        form.mikrotikPass.trim().length < 1
      ) {
        setError("Jaza IP, mtumiaji na nenosiri vya MikroTik.");
        return false;
      }
    }
    return true;
  }

  function validatePackage(): boolean {
    const dur = Number(form.duration);
    const spd = Number(form.speed);
    const prc = Number(form.price);
    if (form.packageName.trim().length < 1) {
      setError("Andika jina la kifurushi.");
      return false;
    }
    if (!Number.isInteger(dur) || dur < 1) {
      setError("Muda lazima uwe namba 1 au zaidi.");
      return false;
    }
    if (!Number.isInteger(spd) || spd < 1) {
      setError("Kasi lazima iwe namba 1 au zaidi.");
      return false;
    }
    if (!Number.isInteger(prc) || prc < 0) {
      setError("Bei lazima iwe namba sahihi.");
      return false;
    }
    return true;
  }

  async function submit() {
    if (!validatePackage()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api.post("/onboarding/create-site", {
        siteName: form.siteName.trim(),
        city: form.city.trim() || undefined,
        ...(isMikrotik
          ? {
              mikrotikIp: form.mikrotikIp.trim(),
              mikrotikUser: form.mikrotikUser.trim(),
              mikrotikPass: form.mikrotikPass,
              mikrotikPort: Number(form.mikrotikPort) || 8728,
            }
          : {}),
        packageName: form.packageName.trim(),
        duration: Number(form.duration),
        durationUnit: form.durationUnit,
        speed: Number(form.speed),
        price: Number(form.price),
      });
      setPortalPath(res.data.portalPath ?? portalPath);
      localStorage.removeItem(STORAGE_KEY);
      setStep(4);
    } catch (err) {
      const msg = apiError(err, "Imeshindikana kukamilisha");
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  function handleNext() {
    setError(null);
    if (step === 1 && !validateSite()) return;
    if (step === 2 && !validateDevice()) return;
    if (step === 3) {
      void submit();
      return;
    }
    setStep((s) => Math.min(s + 1, steps.length - 1));
  }

  function back() {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  const portalLink =
    typeof window !== "undefined" && portalPath
      ? `${window.location.origin}${portalPath}`
      : portalPath;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(portalLink);
      toast.success("Kiungo kimenakiliwa");
    } catch {
      toast.error("Imeshindikana kunakili");
    }
  }

  if (!mounted || statusLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-4 sm:px-8">
        <Brand size="sm" href="/onboarding" />
        <ThemeToggle />
      </header>

      <main className="mx-auto w-full max-w-2xl px-4 pb-16 sm:px-6">
        {/* Progress */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-content">{steps[step].label}</p>
            <p className="tabular text-sm font-medium text-muted">Hatua {step + 1}/5</p>
          </div>
          <div className="h-2 overflow-hidden rounded-full neu-inset">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand to-brand-dark transition-[width] duration-500"
              style={{ width: `${((step + 1) / steps.length) * 100}%` }}
            />
          </div>

          {/* Stepper icons */}
          <div className="mt-5 flex items-center">
            {steps.map((s, i) => (
              <div key={s.label} className="flex flex-1 items-center last:flex-none">
                <span
                  title={s.label}
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-lg transition",
                    i < step
                      ? "neu-brand"
                      : i === step
                        ? "neu-inset text-brand"
                        : "neu-inset text-muted",
                  )}
                >
                  <Icon name={i < step ? "check-lg" : s.icon} />
                </span>
                {i < steps.length - 1 && (
                  <div
                    className={cn(
                      "mx-1.5 h-0.5 flex-1 rounded-full sm:mx-2",
                      i < step ? "bg-brand" : "bg-line",
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <Card key={step} className="step-in">
          {/* Step 1 — Welcome */}
          {step === 0 && (
            <div className="py-4 text-center">
              <span className="neu-brand mx-auto flex h-20 w-20 items-center justify-center rounded-3xl text-4xl">
                <Icon name="emoji-smile" />
              </span>
              <h1 className="mt-5 font-display text-2xl font-bold text-content">
                Karibu HotspotX, {operatorName || "rafiki"}!
              </h1>
              <p className="mx-auto mt-3 max-w-md text-sm text-muted">
                Tutakusaidia kuanzisha site yako ya kwanza kwa hatua chache tu.
                Tutaweka taarifa za site, tutaunganisha kifaa chako, na
                kutengeneza kifurushi cha kwanza cha mauzo.
              </p>
              <ul className="mx-auto mt-6 max-w-sm space-y-2 text-left">
                {[
                  { icon: "geo-alt", text: "Taarifa za site yako" },
                  { icon: "router", text: "Kuunganisha kifaa chako" },
                  { icon: "box-seam", text: "Kifurushi cha kwanza" },
                ].map((it) => (
                  <li key={it.text} className="neu-inset flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-content">
                    <Icon name={it.icon} className="text-lg text-brand" />
                    {it.text}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Step 2 — Site info */}
          {step === 1 && (
            <div className="space-y-4">
              <StepHead icon="geo-alt" title="Taarifa za Site" subtitle="Eneo lako la huduma" />
              <Input
                label="Jina la site"
                value={form.siteName}
                onChange={(e) => set({ siteName: e.target.value })}
                placeholder="Cheetah Cafe - Tawi la Mbeya"
              />
              <Input
                label="Mji / eneo"
                value={form.city}
                onChange={(e) => set({ city: e.target.value })}
                placeholder="Mbeya"
              />
            </div>
          )}

          {/* Step 3 — Device setup */}
          {step === 2 && (
            <div className="space-y-4">
              <StepHead icon="router" title="Usanidi wa Kifaa" subtitle={isMikrotik ? "MikroTik Router" : "Omada Controller"} />

              <div className="neu-inset flex items-center gap-3 rounded-2xl px-4 py-3">
                <Icon name={isMikrotik ? "hdd-network" : "broadcast"} className="text-2xl text-brand" />
                <div>
                  <p className="font-semibold text-content">
                    Kifaa chako: {isMikrotik ? "MikroTik" : "Omada"}
                  </p>
                  <p className="text-xs text-muted">
                    {isMikrotik ? "Hakuna ada ya mwezi" : "Itaundiwa site kiotomatiki"}
                  </p>
                </div>
              </div>

              {isMikrotik ? (
                <>
                  <p className="text-sm text-muted">
                    Weka taarifa za muunganisho za router yako ya MikroTik. Hakikisha
                    API imewashwa (<span className="font-mono text-content">/ip service enable api</span>)
                    na router inaonekana kwenye mtandao.
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      label="MikroTik IP"
                      value={form.mikrotikIp}
                      onChange={(e) => set({ mikrotikIp: e.target.value })}
                      placeholder="192.168.88.1"
                    />
                    <Input
                      label="Port"
                      type="number"
                      value={form.mikrotikPort}
                      onChange={(e) => set({ mikrotikPort: e.target.value })}
                      placeholder="8728"
                    />
                    <Input
                      label="Mtumiaji (user)"
                      value={form.mikrotikUser}
                      onChange={(e) => set({ mikrotikUser: e.target.value })}
                      placeholder="admin"
                    />
                    <Input
                      label="Nenosiri"
                      type="password"
                      value={form.mikrotikPass}
                      onChange={(e) => set({ mikrotikPass: e.target.value })}
                      placeholder="••••••••"
                    />
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted">
                    Tutaunda site yako kwenye mfumo kiotomatiki. Ili kuunganisha
                    access point zako, fuata hatua hizi kwenye Omada Controller:
                  </p>
                  <ol className="space-y-2">
                    {[
                      "Ingia kwenye Omada Controller yako.",
                      "Nenda Settings → Site, kisha hakikisha site imeundwa.",
                      "Adopt access points zako kwenye site husika.",
                      "Weka URL ya portal (utaipata hatua ya mwisho) kwenye Authentication → Portal.",
                    ].map((t, i) => (
                      <li key={i} className="neu-inset flex items-start gap-3 rounded-2xl px-4 py-3 text-sm text-content">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/15 text-xs font-bold text-brand-dark dark:text-brand">
                          {i + 1}
                        </span>
                        {t}
                      </li>
                    ))}
                  </ol>
                </>
              )}
            </div>
          )}

          {/* Step 4 — First package */}
          {step === 3 && (
            <div className="space-y-4">
              <StepHead icon="box-seam" title="Kifurushi cha Kwanza" subtitle="Kifurushi cha kuanzia cha kuuza" />
              <Input
                label="Jina la kifurushi"
                value={form.packageName}
                onChange={(e) => set({ packageName: e.target.value })}
                placeholder="Saa 1"
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Muda"
                  type="number"
                  value={form.duration}
                  onChange={(e) => set({ duration: e.target.value })}
                  placeholder="1"
                />
                <Select
                  label="Kipimo cha muda"
                  value={form.durationUnit}
                  onChange={(e) => set({ durationUnit: e.target.value as Unit })}
                >
                  <option value="minutes">Dakika</option>
                  <option value="hours">Saa</option>
                  <option value="days">Siku</option>
                </Select>
                <Input
                  label="Kasi (Mbps)"
                  type="number"
                  value={form.speed}
                  onChange={(e) => set({ speed: e.target.value })}
                  placeholder="5"
                />
                <Input
                  label="Bei (TZS)"
                  type="number"
                  value={form.price}
                  onChange={(e) => set({ price: e.target.value })}
                  placeholder="1000"
                />
              </div>
            </div>
          )}

          {/* Step 5 — Done */}
          {step === 4 && (
            <div className="py-4 text-center">
              <span className="neu-brand mx-auto flex h-20 w-20 items-center justify-center rounded-3xl text-4xl">
                <Icon name="check-circle" />
              </span>
              <h1 className="mt-5 font-display text-2xl font-bold text-content">
                Hongera! Site yako iko tayari
              </h1>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted">
                Kifurushi chako cha kwanza kimeundwa. Shiriki kiungo cha portal na
                wateja wako waanze kununua muda wa intaneti.
              </p>

              <div className="mt-6 text-left">
                <p className="mb-1.5 text-sm font-medium text-muted">Kiungo cha portal</p>
                <div className="neu-inset flex items-center gap-2 rounded-2xl px-4 py-3">
                  <Icon name="link-45deg" className="text-brand" />
                  <span className="min-w-0 flex-1 truncate font-mono text-sm text-content">{portalLink}</span>
                  <button
                    onClick={copyLink}
                    aria-label="Nakili kiungo"
                    className="neu-press flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-content"
                  >
                    <Icon name="clipboard" />
                  </button>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <Button variant="neutral" onClick={() => router.push("/dashboard/vouchers")}>
                  <Icon name="ticket-perforated" /> Tengeneza vouchers
                </Button>
                <Button onClick={() => router.push("/dashboard")}>
                  <Icon name="speedometer2" /> Nenda Dashboard
                </Button>
              </div>
            </div>
          )}

          {error && step < 4 && (
            <p className="mt-4 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-500">
              {error}
            </p>
          )}

          {/* Nav buttons (hidden on the success step) */}
          {step < 4 && (
            <div className="mt-7 flex items-center justify-between gap-3">
              {step > 0 ? (
                <Button variant="neutral" type="button" onClick={back}>
                  <Icon name="arrow-left" /> Nyuma
                </Button>
              ) : (
                <span />
              )}
              <Button type="button" onClick={handleNext} loading={busy}>
                {step === 0 ? "Anza" : step === 3 ? "Kamilisha" : "Endelea"}
                {!busy && <Icon name="arrow-right" />}
              </Button>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}

function StepHead({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="neu-sm flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl text-brand">
        <Icon name={icon} />
      </span>
      <div>
        <h2 className="font-display text-lg font-bold text-content">{title}</h2>
        <p className="text-sm text-muted">{subtitle}</p>
      </div>
    </div>
  );
}
