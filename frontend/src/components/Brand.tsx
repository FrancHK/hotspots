import Link from "next/link";
import { cn } from "@/lib/cn";

interface BrandProps {
  withTagline?: boolean;
  size?: "sm" | "md" | "lg";
  href?: string;
}

const logoSizes = { sm: "h-9 w-9 text-xl", md: "h-11 w-11 text-2xl", lg: "h-16 w-16 text-4xl" };
const nameSizes = { sm: "text-lg", md: "text-xl", lg: "text-3xl" };

export function Brand({ withTagline, size = "md", href = "/" }: BrandProps) {
  return (
    <Link href={href} className="inline-flex items-center gap-3">
      <span
        className={cn(
          "flex items-center justify-center rounded-2xl neu-brand",
          logoSizes[size],
        )}
      >
        🐆
      </span>
      <span className="flex flex-col leading-tight">
        <span className={cn("font-extrabold text-content", nameSizes[size])}>
          Hotspot<span className="text-brand">X</span>
        </span>
        {withTagline && (
          <span className="text-xs font-medium text-muted">
            Haraka · Nguvu · Imara
          </span>
        )}
      </span>
    </Link>
  );
}
