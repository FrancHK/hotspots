"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { Spinner } from "@/components/ui/Spinner";
import { api, apiError } from "@/lib/api";
import { formatTZS, formatDuration } from "@/lib/format";
import { cn } from "@/lib/cn";

interface PortalPackage {
  id: string;
  name: string;
  duration: number;
  durationUnit: "minutes" | "hours" | "days";
  speed: number;
  price: number;
}

interface Branding {
  businessName: string;
  logoEmoji: string;
  primaryColor: string;
  secondaryColor: string;
  subtitle: string | null;
  footer: string | null;
}

const DEFAULT_BRANDING: Branding = {
  businessName: "HotspotX",
  logoEmoji: "🐆",
  primaryColor: "#FF8C42",
  secondaryColor: "#1a1f2e",
  subtitle: null,
  footer: null,
};

const POLL_SECONDS = 90;

// Auto-format a voucher to XXXX-XXXX-XXXX as the user types.
function formatVoucher(raw: string): string {
  const clean = raw.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 12);
  return clean.replace(/(.{4})(?=.)/g, "$1-");
}

// Tanzanian mobile number: 0XXXXXXXXX, 255XXXXXXXXX, or bare 9 digits.
function isValidTzPhone(raw: string): boolean {
  const d = raw.replace(/\D/g, "");
  return (
    (d.length === 10 && d.startsWith("0")) ||
    (d.length === 12 && d.startsWith("255")) ||
    d.length === 9
  );
}

function humanizeMinutes(min: number): string {
  if (min > 0 && min % 1440 === 0) return formatDuration(min / 1440, "days");
  if (min > 0 && min % 60 === 0) return formatDuration(min / 60, "hours");
  return formatDuration(min, "minutes");
}

type Tab = "voucher" | "pay";
type Flow = "form" | "polling" | "success";

export function PortalClient({ operatorIdParam }: { operatorIdParam?: string }) {
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [branding, setBranding] = useState<Branding>(DEFAULT_BRANDING);
  const [packages, setPackages] = useState<PortalPackage[]>([]);
  const [operatorId, setOperatorId] = useState<string>("");
  const [apMac, setApMac] = useState<string | null>(null);
  const [clientMac, setClientMac] = useState<string | null>(null);
  const [isPreview, setIsPreview] = useState(false);

  const [tab, setTab] = useState<Tab>("pay");
  const [flow, setFlow] = useState<Flow>("form");

  const [voucherCode, setVoucherCode] = useState("");
  const [selectedPkg, setSelectedPkg] = useState<string>("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [reference, setReference] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(POLL_SECONDS);
  const [success, setSuccess] = useState<{ duration: string; speed: number } | null>(null);
  const [paidPkg, setPaidPkg] = useState<PortalPackage | null>(null);

  const live = !!apMac; // can transact only when an AP MAC is present

  // ── Load operator branding + packages ──────────────────
  useEffect(() => {
    let active = true;
    void (async () => {
      setLoading(true);
      setLoadError(null);
      const ap = searchParams.get("apMac");
      const client = searchParams.get("clientMac");
      const preview = searchParams.get("preview") === "true";
      const opQuery = operatorIdParam || searchParams.get("operatorId");

      try {
        if (ap) {
          const cl = await api.get("/hotspot/client-login", {
            params: { clientMac: client ?? "", apMac: ap },
          });
          const opId: string = cl.data.operator.operatorId;
          let settings = DEFAULT_BRANDING;
          try {
            const ps = await api.get(`/portal-settings/operator/${opId}`);
            settings = { ...DEFAULT_BRANDING, ...ps.data.settings };
          } catch {
            /* fall back to defaults */
          }
          if (!active) return;
          setBranding({
            ...settings,
            businessName: settings.businessName || cl.data.operator.businessName,
          });
          const pkgs: PortalPackage[] = cl.data.packages ?? [];
          setPackages(pkgs);
          setSelectedPkg(pkgs[0]?.id ?? "");
          setOperatorId(opId);
          setApMac(ap);
          setClientMac(client);
          setIsPreview(false);
        } else if (opQuery) {
          const info = await api.get(`/hotspot/operator-info/${opQuery}`);
          const ps = info.data.portalSettings ?? {};
          if (!active) return;
          setBranding({
            ...DEFAULT_BRANDING,
            ...ps,
            businessName: ps.businessName || info.data.operator.businessName,
          });
          const pkgs: PortalPackage[] = info.data.packages ?? [];
          setPackages(pkgs);
          setSelectedPkg(pkgs[0]?.id ?? "");
          setOperatorId(info.data.operator.operatorId);
          setApMac(null);
          setClientMac(null);
          setIsPreview(true);
          void preview; // explicit preview flag and bare links behave the same
        } else {
          setLoadError(
            "Hakuna taarifa za hotspot. Hakikisha umeunganika kupitia WiFi.",
          );
        }
      } catch (e) {
        if (active) setLoadError(apiError(e, "Hotspot haipatikani"));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [searchParams, operatorIdParam]);

  // ── Payment polling ────────────────────────────────────
  useEffect(() => {
    if (flow !== "polling" || !reference) return;
    let secs = POLL_SECONDS;

    const tick = setInterval(() => {
      secs -= 1;
      setCountdown(secs);
      if (secs <= 0) {
        cleanup();
        setError("Muda umeisha bila uthibitisho. Jaribu tena.");
        setFlow("form");
      }
    }, 1000);

    const poll = setInterval(async () => {
      try {
        const res = await api.get(`/payments/status/${reference}`);
        const st = res.data.payment?.status;
        if (st === "success") {
          cleanup();
          setSuccess({
            duration: paidPkg
              ? formatDuration(paidPkg.duration, paidPkg.durationUnit)
              : "—",
            speed: paidPkg?.speed ?? 0,
          });
          setFlow("success");
        } else if (st === "failed") {
          cleanup();
          setError("Malipo yameshindwa. Jaribu tena.");
          setFlow("form");
        }
      } catch {
        /* keep polling */
      }
    }, 3000);

    function cleanup() {
      clearInterval(tick);
      clearInterval(poll);
    }
    return cleanup;
  }, [flow, reference, paidPkg]);

  const accent = branding.primaryColor;
  const selected = useMemo(
    () => packages.find((p) => p.id === selectedPkg) ?? null,
    [packages, selectedPkg],
  );

  const previewGuard = useCallback(() => {
    setError("Hii ni hakikisho la portal — unganisha kupitia WiFi ili kununua.");
  }, []);

  async function redeemVoucher() {
    setError(null);
    if (!live) return previewGuard();
    if (voucherCode.replace(/-/g, "").length < 4) {
      setError("Andika namba kamili ya voucher.");
      return;
    }
    setBusy(true);
    try {
      const res = await api.post("/hotspot/voucher-access", {
        code: voucherCode,
        clientMac: clientMac ?? "",
        apMac,
      });
      const a = res.data.access;
      setSuccess({ duration: humanizeMinutes(a.durationMinutes), speed: a.speedMbps });
      setFlow("success");
    } catch (e) {
      setError(apiError(e, "Voucher batili"));
    } finally {
      setBusy(false);
    }
  }

  async function payNow() {
    setError(null);
    if (!live) return previewGuard();
    if (!selected) {
      setError("Chagua kifurushi.");
      return;
    }
    if (!isValidTzPhone(phone)) {
      setError("Namba ya simu si sahihi (mfano 0712 345 678).");
      return;
    }
    setBusy(true);
    try {
      const res = await api.post("/payments/initiate", {
        clientMac: clientMac ?? "",
        apMac,
        operatorId,
        packageId: selected.id,
        phoneNumber: phone,
      });
      setPaidPkg(selected);
      setReference(res.data.reference);
      setCountdown(POLL_SECONDS);
      setFlow("polling");
    } catch (e) {
      setError(apiError(e, "Imeshindikana kuanzisha malipo"));
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setFlow("form");
    setError(null);
    setSuccess(null);
    setReference(null);
    setVoucherCode("");
    setPhone("");
  }

  // ── Render ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (loadError) {
    return (
      <Shell branding={branding}>
        <div className="neu rounded-3xl p-6 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-3xl text-red-500">
            <Icon name="wifi-off" />
          </span>
          <h2 className="mt-4 font-display text-lg font-bold text-content">Hotspot haipatikani</h2>
          <p className="mt-1 text-sm text-muted">{loadError}</p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell branding={branding} preview={isPreview}>
      {flow === "success" ? (
        <div className="neu rounded-3xl p-7 text-center">
          <span
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-full text-5xl text-[var(--color-earn)]"
            style={{ background: "color-mix(in srgb, var(--color-earn) 15%, transparent)" }}
          >
            <Icon name="check-circle" />
          </span>
          <h2 className="mt-5 font-display text-2xl font-bold text-content">Internet Imefunguliwa!</h2>
          <p className="mt-1 text-sm text-muted">Karibu mtandaoni. Furahia muda wako.</p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="neu-inset rounded-2xl px-3 py-4">
              <Icon name="clock-history" className="text-xl" style={{ color: accent }} />
              <p className="mt-1 text-base font-bold text-content">{success?.duration}</p>
              <p className="text-xs text-muted">Muda</p>
            </div>
            <div className="neu-inset rounded-2xl px-3 py-4">
              <Icon name="speedometer2" className="text-xl" style={{ color: accent }} />
              <p className="mt-1 text-base font-bold text-content">{success?.speed} Mbps</p>
              <p className="text-xs text-muted">Kasi</p>
            </div>
          </div>
        </div>
      ) : flow === "polling" ? (
        <div className="neu rounded-3xl p-7 text-center">
          <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full neu-inset">
            <Spinner size="lg" />
          </span>
          <h2 className="mt-5 font-display text-lg font-bold text-content">Angalia simu yako</h2>
          <p className="mt-1 text-sm text-muted">
            Thibitisha malipo kwa kuingiza PIN yako kwenye dirisha lililojitokeza simuni.
          </p>
          <p className="tabular mt-4 text-3xl font-bold" style={{ color: accent }}>
            {countdown}s
          </p>
          <p className="mt-1 text-xs text-muted">Inasubiri uthibitisho wa malipo…</p>
          <button
            onClick={reset}
            className="neu-press mt-5 rounded-2xl px-5 py-2.5 text-sm font-medium text-muted"
          >
            Ghairi
          </button>
        </div>
      ) : (
        <div className="neu rounded-3xl p-4 sm:p-5">
          {/* Tabs */}
          <div className="neu-inset mb-4 grid grid-cols-2 gap-1 rounded-2xl p-1">
            <TabButton active={tab === "pay"} accent={accent} onClick={() => { setTab("pay"); setError(null); }} icon="phone">
              Lipa
            </TabButton>
            <TabButton active={tab === "voucher"} accent={accent} onClick={() => { setTab("voucher"); setError(null); }} icon="ticket-perforated">
              Voucher
            </TabButton>
          </div>

          {tab === "pay" ? (
            <div className="space-y-3">
              {packages.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted">Hakuna vifurushi kwa sasa.</p>
              ) : (
                <div className="space-y-2.5">
                  {packages.map((p) => {
                    const on = p.id === selectedPkg;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setSelectedPkg(p.id)}
                        className={cn(
                          "flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition",
                          on ? "neu-inset" : "neu-press",
                        )}
                        style={on ? { boxShadow: `inset 0 0 0 2px ${accent}` } : undefined}
                      >
                        <span className="flex items-center gap-3">
                          <span
                            className="flex h-9 w-9 items-center justify-center rounded-xl text-sm"
                            style={{ background: on ? accent : "transparent", color: on ? "#fff" : accent }}
                          >
                            <Icon name={on ? "check-lg" : "wifi"} />
                          </span>
                          <span>
                            <span className="block font-semibold text-content">{p.name}</span>
                            <span className="block text-xs text-muted">
                              {formatDuration(p.duration, p.durationUnit)} · {p.speed} Mbps
                            </span>
                          </span>
                        </span>
                        <span className="tabular font-bold" style={{ color: accent }}>
                          {formatTZS(p.price)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-muted">Namba ya simu</label>
                <input
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0712 345 678"
                  className="w-full rounded-2xl neu-inset px-4 py-3 text-content placeholder:text-muted/70 outline-none focus:ring-2"
                  style={{ "--tw-ring-color": accent } as React.CSSProperties}
                />
              </div>

              <PrimaryButton accent={accent} loading={busy} disabled={!packages.length} onClick={payNow}>
                <Icon name="phone" /> Lipa Sasa {selected ? `· ${formatTZS(selected.price)}` : ""}
              </PrimaryButton>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-muted">Namba ya voucher</label>
                <input
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(formatVoucher(e.target.value))}
                  placeholder="XXXX-XXXX-XXXX"
                  className="tabular w-full rounded-2xl neu-inset px-4 py-3 text-center text-lg font-bold tracking-widest text-content placeholder:text-muted/50 outline-none focus:ring-2"
                  style={{ "--tw-ring-color": accent } as React.CSSProperties}
                />
              </div>
              <PrimaryButton accent={accent} loading={busy} onClick={redeemVoucher}>
                <Icon name="unlock" /> Thibitisha Voucher
              </PrimaryButton>
              <p className="text-center text-xs text-muted">
                Ingiza namba ya voucher uliyonunua ili kufungua intaneti.
              </p>
            </div>
          )}

          {error && (
            <p className="mt-3 flex items-start gap-2 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-500">
              <Icon name="exclamation-circle" className="mt-0.5" /> {error}
            </p>
          )}
        </div>
      )}
    </Shell>
  );
}

// ── Sub-components ───────────────────────────────────────

function Shell({
  branding,
  preview,
  children,
}: {
  branding: Branding;
  preview?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center bg-app px-4 py-8">
      <div className="w-full max-w-md">
        {preview && (
          <div className="mb-4 flex items-center justify-center gap-2 rounded-full bg-amber-500/15 px-4 py-2 text-xs font-semibold text-amber-600 dark:text-amber-400">
            <Icon name="eye" /> Hakikisho la portal
          </div>
        )}

        {/* Brand header */}
        <div className="mb-5 text-center">
          <span
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl text-4xl shadow-lg"
            style={{
              background: `linear-gradient(145deg, ${branding.primaryColor}, ${branding.secondaryColor})`,
            }}
          >
            {branding.logoEmoji}
          </span>
          <h1 className="mt-3 font-display text-2xl font-bold text-content">{branding.businessName}</h1>
          <p className="mt-1 text-sm text-muted">
            {branding.subtitle || "Karibu! Pata intaneti ya haraka."}
          </p>
        </div>

        {children}

        <p className="mt-6 text-center text-xs text-muted">
          {branding.footer && <span className="block">{branding.footer}</span>}
          <span className="mt-1 inline-flex items-center gap-1">
            Inaendeshwa na <span className="font-semibold text-content">HotspotX</span>
          </span>
        </p>
      </div>
    </div>
  );
}

function TabButton({
  active,
  accent,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  accent: string;
  onClick: () => void;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
        active ? "neu-sm bg-app text-content" : "text-muted",
      )}
      style={active ? { color: accent } : undefined}
    >
      <Icon name={icon} /> {children}
    </button>
  );
}

function PrimaryButton({
  accent,
  loading,
  disabled,
  onClick,
  children,
}: {
  accent: string;
  loading?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className="flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-bold text-white shadow-md transition active:scale-[0.99] disabled:opacity-60"
      style={{ background: `linear-gradient(145deg, ${accent}, color-mix(in srgb, ${accent} 75%, #000))` }}
    >
      {loading ? <Spinner size="sm" light /> : children}
    </button>
  );
}
