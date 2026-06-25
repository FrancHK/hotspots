"use client";

import { useTheme } from "@/components/theme-provider";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label="Badilisha mwangaza"
      title={theme === "dark" ? "Mwanga" : "Giza"}
      className="neu-press flex h-10 w-10 items-center justify-center rounded-2xl text-lg"
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
