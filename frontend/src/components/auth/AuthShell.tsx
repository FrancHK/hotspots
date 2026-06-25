import Link from "next/link";
import { type ReactNode } from "react";
import { Brand } from "@/components/Brand";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

// Centered shell for the login / register pages.
export function AuthShell({
  children,
  title,
  subtitle,
  wide,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
  wide?: boolean;
}) {
  return (
    <main className="relative flex min-h-screen flex-col px-5 py-6">
      {/* Soft brand glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-80 w-80 -translate-x-1/2 rounded-full bg-brand/15 blur-3xl" />

      <header className="flex items-center justify-between">
        <Brand withTagline size="md" />
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/"
            className="neu-press rounded-2xl px-4 py-2.5 text-sm font-semibold text-content"
          >
            ← Nyumbani
          </Link>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center py-10">
        <div className={wide ? "w-full max-w-2xl" : "w-full max-w-md"}>
          <div className="mb-6 text-center">
            <h1 className="font-display text-3xl font-bold text-content">
              {title}
            </h1>
            {subtitle && <p className="mt-2 text-sm text-muted">{subtitle}</p>}
          </div>
          {children}
        </div>
      </div>
    </main>
  );
}
