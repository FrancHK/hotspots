"use client";

import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/cn";

// `light` renders a white/translucent style for use over a dark hero image.
export function ThemeToggle({ light }: { light?: boolean }) {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label="Badilisha mwangaza"
      title={theme === "dark" ? "Mwanga" : "Giza"}
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-2xl text-lg",
        light
          ? "border border-white/30 text-white hover:bg-white/10"
          : "neu-press",
      )}
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
