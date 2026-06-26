"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { AuthShell } from "@/components/auth/AuthShell";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { api, apiError } from "@/lib/api";
import { setSession } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Combined login: try operator first, fall back to admin on "not found".
      try {
        const res = await api.post("/auth/operator/login", { email, password });
        setSession(res.data.token, "operator", res.data.operator);
        // Send operators who haven't set up their first site to onboarding.
        router.push(res.data.operator.onboardingComplete ? "/dashboard" : "/onboarding");
        return;
      } catch (opErr) {
        // 401 = no such operator → maybe it's an admin. Other errors (e.g. 403
        // blocked) are real and shown to the user.
        if (axios.isAxiosError(opErr) && opErr.response?.status === 401) {
          const res = await api.post("/auth/admin/login", { email, password });
          setSession(res.data.token, "admin", res.data.admin);
          router.push("/admin");
          return;
        }
        throw opErr;
      }
    } catch (err) {
      setError(apiError(err, "Barua pepe au nenosiri si sahihi"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Karibu tena" subtitle="Ingia kwenye akaunti yako">
      <Card>
        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label="Barua pepe"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="jina@biashara.tz"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Nenosiri"
            type="password"
            name="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <p className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-500">
              {error}
            </p>
          )}

          <Button type="submit" loading={loading} className="w-full">
            Ingia
          </Button>
        </form>
      </Card>

      <p className="mt-5 text-center text-sm text-muted">
        Huna akaunti?{" "}
        <Link href="/register" className="font-semibold text-brand">
          Jisajili bure
        </Link>
      </p>
    </AuthShell>
  );
}
