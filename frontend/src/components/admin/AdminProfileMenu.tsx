"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/Badge";
import { useAdmin } from "./AdminContext";
import { clearSession } from "@/lib/auth";

function initials(name?: string): string {
  if (!name) return "SA";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

export function AdminProfileMenu() {
  const router = useRouter();
  const { admin } = useAdmin();
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
        {initials(admin?.name)}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div className="neu absolute right-0 z-50 mt-2 w-64 rounded-3xl p-2">
            <div className="rounded-2xl px-3 py-3">
              <p className="truncate font-semibold text-content">{admin?.name ?? "Super Admin"}</p>
              <p className="truncate text-xs text-muted">{admin?.email}</p>
              <div className="mt-2">
                <Badge tone="brand">Super Admin</Badge>
              </div>
            </div>
            <div className="my-1 border-t border-line" />
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
