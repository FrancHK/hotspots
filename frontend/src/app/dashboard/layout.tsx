"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getRole } from "@/lib/auth";
import { useMounted } from "@/lib/useMounted";
import { Spinner } from "@/components/ui/Spinner";
import { DashboardProvider } from "@/components/dashboard/DashboardContext";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const mounted = useMounted();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Operator-only protected area (client-side JWT guard).
  useEffect(() => {
    if (mounted && getRole() !== "operator") {
      router.replace("/login");
    }
  }, [mounted, router]);

  // Wait for client mount, then ensure the role is correct before rendering.
  if (!mounted || getRole() !== "operator") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <DashboardProvider>
      <div className="flex min-h-screen">
        <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar onMenu={() => setMobileOpen(true)} />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-12 pt-2 sm:px-6">
            {children}
          </main>
        </div>
      </div>
    </DashboardProvider>
  );
}
