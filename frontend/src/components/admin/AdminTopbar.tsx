"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Icon } from "@/components/ui/Icon";
import { AdminProfileMenu } from "./AdminProfileMenu";
import { cn } from "@/lib/cn";

export function AdminTopbar({ onMenu }: { onMenu: () => void }) {
  const pathname = usePathname();
  const onNotifications = pathname.startsWith("/admin/notifications");

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 bg-app/80 px-4 py-3 backdrop-blur sm:px-6">
      <button
        onClick={onMenu}
        aria-label="Fungua menyu"
        className="neu-press flex h-10 w-10 items-center justify-center rounded-2xl text-content lg:hidden"
      >
        <Icon name="list" className="text-xl" />
      </button>

      <div className="ml-auto flex items-center gap-2.5">
        <ThemeToggle />
        <Link
          href="/admin/notifications"
          aria-label="Arifa"
          className={cn(
            "neu-press flex h-10 w-10 items-center justify-center rounded-2xl",
            onNotifications ? "text-brand" : "text-content",
          )}
        >
          <Icon name="bell" className="text-lg" />
        </Link>
        <AdminProfileMenu />
      </div>
    </header>
  );
}
