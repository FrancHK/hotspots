"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/Badge";
import { useDashboard } from "./DashboardContext";
import { clearSession } from "@/lib/auth";

function initials(name?: string): string {
  if (!name) return "HS";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

export function ProfileMenu() {
  const router = useRouter();
  const { operator } = useDashboard();
  const [open, setOpen] = useState(false);

  function logout() {
    clearSession();
    router.replace("/login");
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Wasifu"
        className="neu-brand flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-bold text-white"
      >
        {initials(operator?.name)}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div className="neu absolute right-0 z-50 mt-2 w-64 rounded-3xl p-2">
            <div className="rounded-2xl px-3 py-3">
              <p className="truncate font-semibold text-content">{operator?.businessName ?? operator?.name ?? "—"}</p>
              <p className="truncate text-xs text-muted">{operator?.email}</p>
              <div className="mt-2 flex items-center gap-2">
                <Badge tone="brand">{operator?.operatorId ?? "—"}</Badge>
                {operator && (
                  <Badge tone={operator.status === "active" ? "success" : "warning"}>
                    {operator.status}
                  </Badge>
                )}
              </div>
            </div>
            <div className="my-1 border-t border-line" />
            <Link
              href="/dashboard/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-content hover:bg-muted/10"
            >
              <Icon name="person-circle" className="text-base" /> Wasifu wangu
            </Link>
            <button
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-500/10"
            >
              <Icon name="box-arrow-right" className="text-base" /> Toka
            </button>
          </div>
        </>
      )}
    </div>
  );
}
