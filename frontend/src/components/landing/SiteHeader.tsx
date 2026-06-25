"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Brand } from "@/components/Brand";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/cn";

// Slim sticky nav: transparent (white text) over the dark hero, turns solid
// once the user scrolls past it.
export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
        scrolled
          ? "bg-app/85 backdrop-blur-md border-b border-line"
          : "bg-transparent",
      )}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-3.5">
        <Brand withTagline size="md" light={!scrolled} />
        <nav className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle light={!scrolled} />
          <Link
            href="/login"
            className={cn(
              "rounded-2xl px-4 py-2.5 text-sm font-semibold",
              scrolled
                ? "neu-press text-content"
                : "border border-white/30 text-white hover:bg-white/10",
            )}
          >
            Ingia
          </Link>
          <Link
            href="/register"
            className="neu-brand rounded-2xl px-4 py-2.5 text-sm font-semibold"
          >
            Anza Sasa
          </Link>
        </nav>
      </div>
    </header>
  );
}
