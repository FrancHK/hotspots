"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Brand } from "@/components/Brand";
import { Icon } from "@/components/ui/Icon";
import { navItems } from "./DashboardContext";
import { cn } from "@/lib/cn";

export function Sidebar({
  mobileOpen,
  onClose,
}: {
  mobileOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-navy/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col gap-4 p-3 transition-[transform,width] duration-200 lg:static lg:translate-x-0",
          "bg-app",
          collapsed ? "lg:w-[88px]" : "lg:w-64",
          "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Logo row */}
        <div className="flex items-center justify-between px-1 py-2">
          {collapsed ? (
            <Link
              href="/dashboard"
              className="mx-auto flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl bg-white neu-sm"
            >
              <Image src="/logo.png" alt="HotspotX" width={40} height={40} className="object-contain p-1" />
            </Link>
          ) : (
            <Brand size="sm" href="/dashboard" />
          )}
          <button
            onClick={onClose}
            aria-label="Funga menyu"
            className="text-muted hover:text-content lg:hidden"
          >
            <Icon name="x-lg" />
          </button>
        </div>

        {/* Nav */}
        <nav className="neu flex flex-1 flex-col gap-1.5 rounded-3xl p-3">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "group flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium transition",
                  collapsed && "lg:justify-center lg:px-0",
                  active
                    ? "neu-inset text-brand-dark dark:text-brand"
                    : "text-muted hover:text-content",
                )}
              >
                <Icon name={item.icon} className={cn("text-lg", active && "text-brand")} />
                <span className={cn(collapsed && "lg:hidden")}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle (desktop only) */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="neu-press hidden items-center justify-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-medium text-muted lg:flex"
        >
          <Icon name={collapsed ? "chevron-double-right" : "chevron-double-left"} />
          <span className={cn(collapsed && "hidden")}>Kunja</span>
        </button>
      </aside>
    </>
  );
}
