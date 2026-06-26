"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

export default function SettingsPage() {
  const toast = useToast();

  // Omada controller connection (local draft — persistence lands with the
  // integration backend).
  const [omada, setOmada] = useState({ url: "", clientId: "", clientSecret: "", omadacId: "" });
  // Default commission split applied to new operators.
  const [rates, setRates] = useState({ mobile: 10, voucher: 3 });

  function notePersist() {
    toast.info("Mipangilio itahifadhiwa pindi backend ya usanidi itakapowashwa.");
  }

  return (
    <>
      <PageHeader icon="gear" title="Mipangilio" subtitle="Usanidi wa mfumo mzima" />

      <div className="space-y-5">
        {/* Commission rates */}
        <Card>
          <CardTitle>Viwango vya Commission (chaguo-msingi)</CardTitle>
          <p className="mt-1 text-sm text-muted">
            Hutumika kwa operators wapya. Unaweza kubadilisha kwa kila operator.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-muted">Mobile Money (%)</span>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={rates.mobile}
                  onChange={(e) => setRates((r) => ({ ...r, mobile: Number(e.target.value) }))}
                />
                <span className="text-lg font-bold text-brand">%</span>
              </div>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-muted">Vocha (%)</span>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={rates.voucher}
                  onChange={(e) => setRates((r) => ({ ...r, voucher: Number(e.target.value) }))}
                />
                <span className="text-lg font-bold text-brand">%</span>
              </div>
            </label>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={notePersist}><Icon name="save" /> Hifadhi viwango</Button>
          </div>
        </Card>

        {/* Omada API config */}
        <Card>
          <CardTitle>Usanidi wa Omada API</CardTitle>
          <p className="mt-1 text-sm text-muted">
            Muunganisho na TP-Link Omada Controller kwa usimamizi wa vifaa.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Input
              label="Controller URL"
              value={omada.url}
              onChange={(e) => setOmada((o) => ({ ...o, url: e.target.value }))}
              placeholder="https://omada.mfano.tz:8043"
            />
            <Input
              label="Omadac ID"
              value={omada.omadacId}
              onChange={(e) => setOmada((o) => ({ ...o, omadacId: e.target.value }))}
              placeholder="abc123…"
            />
            <Input
              label="Client ID"
              value={omada.clientId}
              onChange={(e) => setOmada((o) => ({ ...o, clientId: e.target.value }))}
              placeholder="client_id"
            />
            <Input
              label="Client Secret"
              type="password"
              value={omada.clientSecret}
              onChange={(e) => setOmada((o) => ({ ...o, clientSecret: e.target.value }))}
              placeholder="••••••••"
            />
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <Button variant="neutral" onClick={notePersist}><Icon name="plug" /> Jaribu muunganisho</Button>
            <Button onClick={notePersist}><Icon name="save" /> Hifadhi usanidi</Button>
          </div>
        </Card>

        {/* System info */}
        <Card>
          <CardTitle>Mfumo</CardTitle>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              { label: "Toleo", value: "HotspotX v1.0", icon: "box" },
              { label: "Mazingira", value: "Demo", icon: "hdd-network" },
              { label: "Sarafu", value: "TZS", icon: "cash" },
            ].map((it) => (
              <div key={it.label} className="neu-inset flex items-center gap-3 rounded-2xl px-4 py-3">
                <Icon name={it.icon} className="text-xl text-brand" />
                <div>
                  <p className="text-xs text-muted">{it.label}</p>
                  <p className="font-semibold text-content">{it.value}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
