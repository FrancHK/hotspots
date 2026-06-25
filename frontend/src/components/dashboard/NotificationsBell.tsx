"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useFetch } from "@/lib/useFetch";
import { Icon } from "@/components/ui/Icon";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { NotificationItem } from "@/lib/types";

const typeIcon: Record<NotificationItem["type"], string> = {
  info: "info-circle",
  success: "check-circle",
  warning: "exclamation-triangle",
  error: "x-circle",
};

const typeColor: Record<NotificationItem["type"], string> = {
  info: "text-sky-500",
  success: "text-[var(--color-earn)]",
  warning: "text-amber-500",
  error: "text-red-500",
};

interface Resp {
  unread: number;
  notifications: NotificationItem[];
}

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const { data, setData, refetch } = useFetch<Resp>("/notifications/me");
  const unread = data?.unread ?? 0;
  const items = data?.notifications ?? [];

  async function markRead(n: NotificationItem) {
    if (n.read || !data) return;
    // Optimistic update.
    setData({
      ...data,
      unread: Math.max(0, data.unread - 1),
      notifications: data.notifications.map((x) =>
        x.id === n.id ? { ...x, read: true } : x,
      ),
    });
    try {
      await api.put(`/notifications/${n.id}/read`);
    } catch {
      void refetch();
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Arifa"
        className="neu-press relative flex h-10 w-10 items-center justify-center rounded-2xl text-content"
      >
        <Icon name="bell" className="text-lg" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div className="neu absolute right-0 z-50 mt-2 w-[min(88vw,22rem)] rounded-3xl p-3">
            <div className="flex items-center justify-between px-2 pb-2">
              <p className="font-display font-bold text-content">Arifa</p>
              {unread > 0 && <span className="text-xs text-muted">{unread} mpya</span>}
            </div>
            <div className="max-h-[60vh] space-y-1 overflow-y-auto">
              {items.length === 0 && (
                <p className="px-2 py-6 text-center text-sm text-muted">Hakuna arifa bado.</p>
              )}
              {items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => markRead(n)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-2xl px-3 py-2.5 text-left transition hover:bg-muted/10",
                    !n.read && "bg-brand/5",
                  )}
                >
                  <Icon name={typeIcon[n.type]} className={cn("mt-0.5 text-base", typeColor[n.type])} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className={cn("truncate text-sm", n.read ? "text-muted" : "font-semibold text-content")}>
                        {n.title}
                      </span>
                      {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-brand" />}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">{n.message}</span>
                    <span className="mt-1 block text-[11px] text-muted/70">{formatDateTime(n.createdAt)}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
