import { cn } from "@/lib/cn";

type Size = "sm" | "md" | "lg";

const sizes: Record<Size, string> = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-9 w-9 border-[3px]",
};

interface SpinnerProps {
  size?: Size;
  /** Render light (white) for use over the brand/dark surfaces. */
  light?: boolean;
  className?: string;
  /** Accessible label, announced to screen readers. */
  label?: string;
}

export function Spinner({ size = "md", light, className, label = "Inapakia…" }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        "inline-block animate-spin rounded-full",
        light
          ? "border-white/40 border-t-white"
          : "border-brand/25 border-t-brand",
        sizes[size],
        className,
      )}
    />
  );
}

/** Full-area centered spinner — handy for page/section loading states. */
export function LoadingArea({ label = "Inapakia…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted">
      <Spinner size="lg" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
