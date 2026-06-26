"use client";

import { useMemo, useState } from "react";
import { useFetch } from "@/lib/useFetch";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { Spinner } from "@/components/ui/Spinner";
import type { AdminAccessPoint } from "@/lib/types";

export default function AdminAccessPointsPage() {
  const { data, loading } = useFetch<{ accessPoints: AdminAccessPoint[] }>(
    "/operators/admin/access-points",
  );
  const all = useMemo(() => data?.accessPoints ?? [], [data]);

  const [query, setQuery] = useState("");
  const [statusF, setStatusF] = useState("all");
  const [device, setDevice] = useState("all");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((a) => {
      if (statusF !== "all" && a.status !== statusF) return false;
      if (device !== "all" && a.deviceType !== device) return false;
      if (q) {
        const hay = `${a.name} ${a.macAddress} ${a.operatorName} ${a.ssid ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [all, query, statusF, device]);

  const online = all.filter((a) => a.status === "online").length;

  return (
    <>
      <PageHeader
        icon="router"
        title="Access Points"
        subtitle="Vifaa vyote vya WiFi vya mfumo"
      />

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Jumla" value={String(all.length)} icon="router" tone="brand" />
        <StatCard label="Online" value={String(online)} icon="wifi" tone="earn" />
        <StatCard label="Offline" value={String(all.length - online)} icon="wifi-off" tone="navy" />
      </div>

      <Card className="mt-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Input placeholder="Tafuta jina, MAC, operator…" value={query} onChange={(e) => setQuery(e.target.value)} />
          <Select value={statusF} onChange={(e) => setStatusF(e.target.value)}>
            <option value="all">Hali zote</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
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
          <p className="py-12 text-center text-sm text-muted">Hakuna access point inayolingana.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted">
                  <th className="py-2 pr-3">Kifaa</th>
                  <th className="py-2 pr-3">Operator</th>
                  <th className="hidden py-2 pr-3 md:table-cell">MAC</th>
                  <th className="hidden py-2 pr-3 lg:table-cell">Aina</th>
                  <th className="py-2 text-right">Hali</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((a) => (
                  <tr key={a.id} className="text-content">
                    <td className="py-3 pr-3">
                      <p className="font-semibold">{a.name}</p>
                      <p className="text-xs text-muted">{a.siteName ?? "—"}{a.ssid ? ` • ${a.ssid}` : ""}</p>
                    </td>
                    <td className="py-3 pr-3">
                      <p className="truncate">{a.operatorName}</p>
                      <p className="text-xs text-muted">{a.operatorPublicId}</p>
                    </td>
                    <td className="hidden py-3 pr-3 font-mono text-xs text-muted md:table-cell">{a.macAddress}</td>
                    <td className="hidden py-3 pr-3 lg:table-cell">
                      <Badge tone="neutral">{a.deviceType === "mikrotik" ? "MikroTik" : "Omada"}</Badge>
                    </td>
                    <td className="py-3 text-right">
                      <span className="inline-flex items-center gap-1.5">
                        <Icon name="circle-fill" className={a.status === "online" ? "text-[var(--color-earn)] text-[8px]" : "text-red-500 text-[8px]"} />
                        <Badge tone={a.status === "online" ? "success" : "danger"}>{a.status}</Badge>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
