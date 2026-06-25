"use client";

import { useDashboard } from "@/components/dashboard/DashboardContext";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";

export default function AccessPointsPage() {
  const { operator } = useDashboard();

  return (
    <>
      <PageHeader
        icon="router"
        title="Access Points"
        subtitle="Vifaa vya WiFi vya biashara yako"
        actions={
          <Button disabled>
            <Icon name="plus-lg" /> Ongeza Kifaa
          </Button>
        }
      />

      <Card className="flex flex-col items-center gap-4 py-16 text-center">
        <span className="neu-sm flex h-20 w-20 items-center justify-center rounded-3xl text-4xl text-brand">
          <Icon name="router" />
        </span>
        <div>
          <h2 className="font-display text-xl font-bold text-content">Usimamizi wa vifaa unakuja</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted">
            Hapa utaweza kuongeza na kusimamia access points zako
            {operator ? ` za ${operator.deviceType === "mikrotik" ? "MikroTik" : "Omada"}` : ""} —
            hali (online/offline), MAC address, SSID na mipangilio ya muunganisho.
            Kipengele hiki kitafunguliwa katika hatua inayofuata.
          </p>
        </div>

        {/* Illustrative preview of what the list will look like */}
        <div className="mt-2 w-full max-w-md space-y-2 opacity-50">
          {[
            { name: "Reception AP", on: true },
            { name: "Lobby Router", on: false },
          ].map((d) => (
            <div
              key={d.name}
              className="neu-inset flex items-center justify-between rounded-2xl px-4 py-3 text-sm"
            >
              <span className="flex items-center gap-2 text-content">
                <Icon
                  name="circle-fill"
                  className={d.on ? "text-[var(--color-earn)]" : "text-red-500"}
                />
                {d.name}
              </span>
              <Badge tone={d.on ? "success" : "danger"}>{d.on ? "online" : "offline"}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
