"use client";

import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Icon } from "@/components/ui/Icon";
import { NotificationsBell } from "./NotificationsBell";
import { ProfileMenu } from "./ProfileMenu";

export function Topbar({ onMenu }: { onMenu: () => void }) {
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
        <NotificationsBell />
        <ProfileMenu />
      </div>
    </header>
  );
}
