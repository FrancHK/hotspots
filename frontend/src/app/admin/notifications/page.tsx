"use client";

import { useState } from "react";
import { api, apiError } from "@/lib/api";
import { useFetch } from "@/lib/useFetch";
import { useToast } from "@/components/ui/Toast";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardTitle } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { AdminNotification, AdminOperator } from "@/lib/types";

type NType = "info" | "success" | "warning" | "error";

const typeMeta: Record<NType, { icon: string; color: string; tone: "info" | "success" | "warning" | "danger" }> = {
  info: { icon: "info-circle", color: "text-sky-500", tone: "info" },
  success: { icon: "check-circle", color: "text-[var(--color-earn)]", tone: "success" },
  warning: { icon: "exclamation-triangle", color: "text-amber-500", tone: "warning" },
  error: { icon: "x-circle", color: "text-red-500", tone: "danger" },
};

export default function NotificationsPage() {
  const toast = useToast();
  const list = useFetch<{ notifications: AdminNotification[] }>("/notifications");
  const ops = useFetch<{ operators: AdminOperator[] }>("/operators");

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<NType>("info");
  const [target, setTarget] = useState<"broadcast" | "operator">("broadcast");
  const [operatorId, setOperatorId] = useState("");
  const [busy, setBusy] = useState(false);

  const operators = ops.data?.operators ?? [];
  const notifications = list.data?.notifications ?? [];

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim().length < 1 || message.trim().length < 1) {
      toast.error("Jaza kichwa na ujumbe");
      return;
    }
    if (target === "operator" && !operatorId) {
      toast.error("Chagua operator");
      return;
    }
    setBusy(true);
    try {
      await api.post("/notifications", {
        title: title.trim(),
        message: message.trim(),
        type,
        operatorId: target === "operator" ? operatorId : null,
      });
      toast.success(target === "operator" ? "Arifa imetumwa" : "Arifa imetangazwa kwa wote");
      setTitle("");
      setMessage("");
      setType("info");
      setTarget("broadcast");
      setOperatorId("");
      void list.refetch();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        icon="megaphone"
        title="Arifa"
        subtitle="Tuma taarifa kwa operators"
      />

      <div className="grid gap-5 lg:grid-cols-5">
        {/* Compose */}
        <Card className="lg:col-span-2">
          <CardTitle>Tunga arifa</CardTitle>
          <form onSubmit={send} className="mt-4 space-y-4">
            <Input label="Kichwa" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Mfumo utafanyiwa matengenezo" />
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-muted">Ujumbe</span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="Andika ujumbe hapa…"
                className="w-full rounded-2xl neu-inset px-4 py-3 text-content placeholder:text-muted/70 outline-none focus:ring-2 focus:ring-brand/50"
              />
            </label>
            <Select label="Aina" value={type} onChange={(e) => setType(e.target.value as NType)}>
              <option value="info">Taarifa (info)</option>
              <option value="success">Mafanikio (success)</option>
              <option value="warning">Tahadhari (warning)</option>
              <option value="error">Hitilafu (error)</option>
            </Select>
            <Select label="Lengo" value={target} onChange={(e) => setTarget(e.target.value as "broadcast" | "operator")}>
              <option value="broadcast">Wote (broadcast)</option>
              <option value="operator">Operator mmoja</option>
            </Select>
            {target === "operator" && (
              <Select label="Operator" value={operatorId} onChange={(e) => setOperatorId(e.target.value)}>
                <option value="">— Chagua operator —</option>
                {operators.map((o) => (
                  <option key={o.id} value={o.id}>{o.businessName} ({o.operatorId})</option>
                ))}
              </Select>
            )}
            <Button type="submit" loading={busy} className="w-full">
              <Icon name="send" /> Tuma Arifa
            </Button>
          </form>
        </Card>

        {/* Sent list */}
        <Card className="lg:col-span-3">
          <div className="flex items-center justify-between">
            <CardTitle>Arifa zilizotumwa</CardTitle>
            {notifications.length > 0 && <Badge tone="neutral">{notifications.length}</Badge>}
          </div>
          {list.loading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : notifications.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted">Hakuna arifa zilizotumwa bado.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {notifications.map((n) => {
                const meta = typeMeta[n.type];
                return (
                  <li key={n.id} className="neu-inset rounded-2xl px-4 py-3">
                    <div className="flex items-start gap-3">
                      <Icon name={meta.icon} className={cn("mt-0.5 text-lg", meta.color)} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-content">{n.title}</p>
                          <Badge tone={n.target === "broadcast" ? "brand" : "neutral"}>
                            {n.target === "broadcast" ? "Wote" : n.operator?.businessName ?? "Operator"}
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-sm text-muted">{n.message}</p>
                        <div className="mt-1.5 flex items-center gap-3 text-xs text-muted/80">
                          <span><Icon name="eye" /> {n.readCount} wamesoma</span>
                          <span>{formatDateTime(n.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
