"use client";

import { useDashboard } from "@/components/dashboard/DashboardContext";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { formatDate } from "@/lib/format";

function Row({ icon, label, value }: { icon: string; label: string; value?: string | null }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <span className="neu-sm flex h-9 w-9 items-center justify-center rounded-xl text-brand">
        <Icon name={icon} />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted">{label}</p>
        <p className="truncate font-medium text-content">{value || "—"}</p>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { operator, loading } = useDashboard();

  if (loading || !operator) {
    return (
      <>
        <PageHeader icon="person-circle" title="Wasifu" subtitle="Taarifa za akaunti yako" />
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      </>
    );
  }

  const pkgLabel = operator.noSubscription
    ? "Bila usajili (MikroTik)"
    : `Kifurushi: ${operator.package}`;

  return (
    <>
      <PageHeader icon="person-circle" title="Wasifu" subtitle="Taarifa za akaunti yako" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Operator info */}
        <Card>
          <div className="flex items-center gap-4">
            <span className="neu-brand flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold text-white">
              {operator.name?.[0]?.toUpperCase() ?? "H"}
            </span>
            <div className="min-w-0">
              <h2 className="truncate font-display text-xl font-bold text-content">
                {operator.businessName}
              </h2>
              <p className="truncate text-sm text-muted">{operator.name}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <Badge tone="brand">{operator.operatorId}</Badge>
                <Badge tone={operator.status === "active" ? "success" : "warning"}>
                  {operator.status}
                </Badge>
              </div>
            </div>
          </div>

          <div className="mt-2 divide-y divide-line">
            <Row icon="envelope" label="Barua pepe" value={operator.email} />
            <Row icon="telephone" label="Simu" value={operator.phone} />
            <Row icon="cash" label="Namba ya malipo (M-Pesa)" value={operator.mpesa} />
            <Row icon="geo-alt" label="Mkoa" value={operator.region} />
            <Row icon="router" label="Aina ya kifaa" value={operator.deviceType} />
            <Row icon="box-seam" label="Usajili" value={pkgLabel} />
            {operator.subscriptionEnd && (
              <Row icon="calendar-check" label="Usajili unaisha" value={formatDate(operator.subscriptionEnd)} />
            )}
            {operator.createdAt && (
              <Row icon="clock-history" label="Umejiunga" value={formatDate(operator.createdAt)} />
            )}
          </div>
        </Card>

        {/* Change password — endpoint pending */}
        <Card className="flex flex-col">
          <h2 className="font-display font-bold text-content">Badilisha nenosiri</h2>
          <p className="mt-1 text-sm text-muted">Hakikisha akaunti yako iko salama.</p>

          <div className="mt-4 space-y-4 opacity-60">
            <Input label="Nenosiri la sasa" type="password" placeholder="••••••••" disabled />
            <Input label="Nenosiri jipya" type="password" placeholder="••••••••" disabled />
            <Input label="Thibitisha nenosiri jipya" type="password" placeholder="••••••••" disabled />
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-amber-500/10 px-4 py-3 text-sm text-amber-600 dark:text-amber-400">
            <Icon name="info-circle" />
            Kipengele cha kubadilisha nenosiri kinakuja hivi karibuni.
          </div>

          <Button variant="neutral" className="mt-4 w-full" disabled>
            <Icon name="shield-lock" /> Badilisha nenosiri
          </Button>
        </Card>
      </div>
    </>
  );
}
