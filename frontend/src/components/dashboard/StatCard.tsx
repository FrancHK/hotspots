import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

type Tone = "brand" | "earn" | "navy" | "info";

const iconTones: Record<Tone, string> = {
  brand: "text-brand",
  earn: "text-[var(--color-earn)]",
  navy: "text-content",
  info: "text-sky-500",
};

interface StatCardProps {
  label: string;
  value: string;
  icon: string;
  tone?: Tone;
  /** Percentage trend vs. previous period; positive = up (green). */
  trend?: number | null;
  hint?: string;
}

export function StatCard({ label, value, icon, tone = "brand", trend, hint }: StatCardProps) {
  const showTrend = typeof trend === "number" && Number.isFinite(trend);
  const up = (trend ?? 0) >= 0;

  return (
    <Card className="flex items-start justify-between gap-3 p-5">
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted">{label}</p>
        <p className="tabular mt-1 truncate text-2xl font-bold text-content">{value}</p>
        {showTrend ? (
          <span
            className={cn(
              "mt-1 inline-flex items-center gap-1 text-xs font-semibold",
              up ? "text-[var(--color-earn)]" : "text-red-500",
            )}
          >
            <Icon name={up ? "arrow-up-right" : "arrow-down-right"} />
            {Math.abs(trend!).toFixed(0)}%
          </span>
        ) : hint ? (
          <span className="mt-1 block text-xs text-muted">{hint}</span>
        ) : null}
      </div>
      <span
        className={cn(
          "neu-sm flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xl",
          iconTones[tone],
        )}
      >
        <Icon name={icon} />
      </span>
    </Card>
  );
}
