"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brand } from "@/components/Brand";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/cn";

export interface NavItem {
  label: string;
  href: string;
  /** Emoji or any node used as the item icon. */
  icon?: ReactNode;
}

interface SidebarProps {
  items: NavItem[];
  /** Rendered at the bottom of the rail (e.g. user card + logout). */
  footer?: ReactNode;
}

export function Sidebar({ items, footer }: SidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const nav = (
    <nav className="flex flex-1 flex-col gap-1.5">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setOpen(false)}
          className={cn(
            "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
            isActive(item.href)
              ? "neu-inset text-brand-dark dark:text-brand"
              : "text-muted hover:text-content",
          )}
        >
          {item.icon && <span className="text-lg leading-none">{item.icon}</span>}
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );

  return (
    <>
      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 px-4 py-3 lg:hidden">
        <button
          onClick={() => setOpen(true)}
          aria-label="Fungua menyu"
          className="neu-press flex h-10 w-10 items-center justify-center rounded-2xl text-content"
        >
          ☰
        </button>
        <Brand size="sm" />
        <ThemeToggle />
      </header>

      {/* Mobile drawer backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-navy/50 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {/* Rail — fixed drawer on mobile, static column on desktop */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col gap-6 p-5 transition-transform lg:static lg:z-auto lg:translate-x-0",
          "bg-app lg:bg-transparent",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between">
          <Brand size="md" />
          <button
            onClick={() => setOpen(false)}
            aria-label="Funga menyu"
            className="text-muted hover:text-content lg:hidden"
          >
            ✕
          </button>
        </div>

        <div className="neu flex flex-1 flex-col gap-4 rounded-3xl p-4">
          {nav}
          <div className="border-t border-line pt-4">
            <div className="mb-3 hidden justify-end lg:flex">
              <ThemeToggle />
            </div>
            {footer}
          </div>
        </div>
      </aside>
    </>
  );
}
