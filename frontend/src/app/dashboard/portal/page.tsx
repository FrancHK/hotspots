"use client";

import { useState } from "react";
import { api, apiError } from "@/lib/api";
import { useFetch } from "@/lib/useFetch";
import { useToast } from "@/components/ui/Toast";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Icon } from "@/components/ui/Icon";
import { Spinner } from "@/components/ui/Spinner";
import type { PortalSettings } from "@/lib/types";

const demoPackages = [
  { name: "Saa 1", price: "500" },
  { name: "Saa 3", price: "1,000" },
  { name: "Siku 1", price: "2,000" },
];

const defaults: PortalSettings = {
  primaryColor: "#FF8C42",
  secondaryColor: "#1a1f2e",
  logoEmoji: "🐆",
  businessName: "",
  subtitle: "",
  footer: "",
  template: 1,
};

function PortalPreview({ s }: { s: PortalSettings }) {
  const radius = s.template === 3 ? "9999px" : s.template === 2 ? "14px" : "10px";
  return (
    <div
      className="mx-auto w-[280px] overflow-hidden rounded-[2rem] p-5 shadow-2xl ring-1 ring-black/10"
      style={{ background: s.secondaryColor }}
    >
      <div className="flex flex-col items-center text-center">
        <span
          className="flex h-14 w-14 items-center justify-center rounded-2xl text-3xl"
          style={{ background: s.primaryColor }}
        >
          {s.logoEmoji || "🐆"}
        </span>
        <p className="mt-2 text-base font-bold text-white">{s.businessName || "Biashara yako"}</p>
        {s.subtitle && <p className="text-[11px] text-white/60">{s.subtitle}</p>}
      </div>

      <div className={s.template === 2 ? "mt-4 grid grid-cols-3 gap-2" : "mt-4 space-y-2"}>
        {demoPackages.map((p, i) => (
          <div
            key={p.name}
            className={
              s.template === 2
                ? "flex flex-col items-center p-2 text-center text-white"
                : "flex items-center justify-between px-3 py-2 text-sm text-white"
            }
            style={{
              borderRadius: radius,
              background: i === 1 && s.template !== 2 ? s.primaryColor : "rgba(255,255,255,0.08)",
            }}
          >
            <span className="font-semibold">{p.name}</span>
            <span className="text-xs font-bold">{p.price}</span>
          </div>
        ))}
      </div>

      <div
        className="mt-3 py-2 text-center text-sm font-bold text-white"
        style={{ background: s.primaryColor, borderRadius: radius }}
      >
        Lipa kwa M-Pesa
      </div>
      <p className="mt-3 text-center text-[10px] text-white/50">{s.footer || "Powered by HotspotX"}</p>
    </div>
  );
}

export default function PortalPage() {
  const { data, loading } = useFetch<{ settings: PortalSettings }>("/portal-settings/my");

  if (loading || !data) {
    return (
      <>
        <PageHeader icon="palette" title="Hariri Portal" subtitle="Muonekano wa ukurasa wa wateja" />
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      </>
    );
  }
  return <PortalEditor settings={data.settings} />;
}

function PortalEditor({ settings }: { settings: PortalSettings }) {
  const toast = useToast();
  const { operator } = useDashboard();
  const [s, setS] = useState<PortalSettings>({
    primaryColor: settings.primaryColor ?? defaults.primaryColor,
    secondaryColor: settings.secondaryColor ?? defaults.secondaryColor,
    logoEmoji: settings.logoEmoji ?? defaults.logoEmoji,
    businessName: settings.businessName ?? "",
    subtitle: settings.subtitle ?? "",
    footer: settings.footer ?? "",
    template: settings.template ?? 1,
  });
  const [busy, setBusy] = useState(false);

  const portalLink =
    typeof window !== "undefined" && operator
      ? `${window.location.origin}/portal/${operator.operatorId}`
      : "";

  async function save() {
    setBusy(true);
    try {
      await api.put("/portal-settings/my", {
        primaryColor: s.primaryColor,
        secondaryColor: s.secondaryColor,
        logoEmoji: s.logoEmoji,
        businessName: s.businessName || undefined,
        subtitle: s.subtitle || undefined,
        footer: s.footer || undefined,
        template: s.template,
      });
      toast.success("Mipangilio imehifadhiwa");
    } catch (err) {
      toast.error(apiError(err, "Imeshindikana kuhifadhi"));
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(portalLink);
      toast.success("Kiungo kimenakiliwa");
    } catch {
      toast.error("Imeshindikana kunakili");
    }
  }

  return (
    <>
      <PageHeader
        icon="palette"
        title="Hariri Portal"
        subtitle="Muonekano wa ukurasa wa wateja"
        actions={
          <>
            <Button variant="neutral" onClick={copyLink}>
              <Icon name="link-45deg" /> Nakili Kiungo
            </Button>
            <Button onClick={save} loading={busy}>
              <Icon name="check-lg" /> Hifadhi
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Settings */}
        <Card className="space-y-4">
          <Input
            label="Jina la biashara"
            value={s.businessName ?? ""}
            onChange={(e) => setS({ ...s, businessName: e.target.value })}
          />
          <Input
            label="Maelezo mafupi (subtitle)"
            value={s.subtitle ?? ""}
            onChange={(e) => setS({ ...s, subtitle: e.target.value })}
          />
          <Input
            label="Maandishi ya chini (footer)"
            value={s.footer ?? ""}
            onChange={(e) => setS({ ...s, footer: e.target.value })}
          />
          <Input
            label="Logo emoji"
            value={s.logoEmoji}
            maxLength={8}
            onChange={(e) => setS({ ...s, logoEmoji: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-muted">Rangi kuu</span>
              <div className="neu-inset flex items-center gap-2 rounded-2xl px-3 py-2">
                <input
                  type="color"
                  value={s.primaryColor}
                  onChange={(e) => setS({ ...s, primaryColor: e.target.value })}
                  className="h-8 w-10 cursor-pointer rounded-md border-0 bg-transparent"
                />
                <span className="tabular text-sm text-content">{s.primaryColor}</span>
              </div>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-muted">Rangi ya pili</span>
              <div className="neu-inset flex items-center gap-2 rounded-2xl px-3 py-2">
                <input
                  type="color"
                  value={s.secondaryColor}
                  onChange={(e) => setS({ ...s, secondaryColor: e.target.value })}
                  className="h-8 w-10 cursor-pointer rounded-md border-0 bg-transparent"
                />
                <span className="tabular text-sm text-content">{s.secondaryColor}</span>
              </div>
            </label>
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-medium text-muted">Muundo (template)</span>
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((t) => (
                <button
                  key={t}
                  onClick={() => setS({ ...s, template: t })}
                  className={
                    "rounded-2xl px-3 py-3 text-sm font-semibold transition " +
                    (s.template === t ? "neu-inset text-brand" : "neu-press text-muted")
                  }
                >
                  Muundo {t}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Live preview */}
        <div className="lg:sticky lg:top-20">
          <Card inset className="flex flex-col items-center gap-4 py-8">
            <span className="flex items-center gap-2 text-xs font-medium text-muted">
              <Icon name="eye" /> Mwonekano wa moja kwa moja
            </span>
            <PortalPreview s={s} />
          </Card>
        </div>
      </div>
    </>
  );
}
