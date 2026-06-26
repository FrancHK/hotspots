"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getRole } from "@/lib/auth";
import { useMounted } from "@/lib/useMounted";
import { Spinner } from "@/components/ui/Spinner";
import { AdminProvider } from "@/components/admin/AdminContext";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const mounted = useMounted();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Admin-only protected area (client-side JWT guard).
  useEffect(() => {
    if (mounted && getRole() !== "admin") {
      router.replace("/login");
    }
  }, [mounted, router]);

  // Wait for client mount, then ensure the role is correct before rendering.
  if (!mounted || getRole() !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <AdminProvider>
      <div className="flex min-h-screen">
        <AdminSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <AdminTopbar onMenu={() => setMobileOpen(true)} />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-12 pt-2 sm:px-6">
            {children}
          </main>
        </div>
      </div>
    </AdminProvider>
  );
}
