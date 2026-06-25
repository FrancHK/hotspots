"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Brand } from "@/components/Brand";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getRole, getStoredUser, clearSession, type StoredUser } from "@/lib/auth";

// Placeholder admin dashboard — replaced with the full sidebar app in 10e.
export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    if (getRole() !== "admin") {
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
        <div className="flex items-center gap-2">
          <Badge tone="brand">Admin</Badge>
        </div>
        <h1 className="mt-2 font-display text-2xl font-bold text-content">
          Karibu, {user.name}
        </h1>
        <p className="mt-1 text-sm text-muted">{user.email}</p>
        <p className="mt-6 text-sm text-muted">
          🚧 Dashibodi ya admin (operators, idhini, commission, notifications…)
          inakuja katika hatua inayofuata.
        </p>
      </Card>
    </main>
  );
}
