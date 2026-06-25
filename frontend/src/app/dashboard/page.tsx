"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Brand } from "@/components/Brand";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getRole, getStoredUser, clearSession, type StoredUser } from "@/lib/auth";

// Placeholder operator dashboard — replaced with the full sidebar app in 10d.
export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    if (getRole() !== "operator") {
      router.replace("/login");
      return;
    }
    setUser(getStoredUser());
  }, [router]);

  function logout() {
    clearSession();
    router.replace("/login");
  }

  if (!user) return null;

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <header className="flex items-center justify-between">
        <Brand size="md" />
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button variant="neutral" onClick={logout}>
            Toka
          </Button>
        </div>
      </header>

      <Card className="mt-10">
        <p className="text-sm text-muted">Karibu,</p>
        <h1 className="font-display text-2xl font-bold text-content">
          {user.businessName ?? user.name}
        </h1>
        <div className="mt-3 flex items-center gap-2">
          <Badge tone="brand">{user.operatorId}</Badge>
          <Badge tone={user.status === "active" ? "success" : "warning"}>
            {user.status}
          </Badge>
        </div>
        {user.status === "pending" && (
          <p className="mt-4 rounded-2xl bg-amber-500/10 px-4 py-3 text-sm text-amber-600 dark:text-amber-400">
            Akaunti yako inasubiri idhini ya admin.
          </p>
        )}
        <p className="mt-6 text-sm text-muted">
          🚧 Dashibodi kamili (Home, Sites, Vifurushi, Vocha, Pochi, Portal
          Editor…) inakuja katika hatua inayofuata.
        </p>
      </Card>
    </main>
  );
}
