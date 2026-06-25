import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/cn";

interface BrandProps {
  withTagline?: boolean;
  size?: "sm" | "md" | "lg";
  href?: string;
  light?: boolean; // force white text (e.g. over a dark hero image)
}

const logoSizes = { sm: "h-9 w-9", md: "h-11 w-11", lg: "h-16 w-16" };
const nameSizes = { sm: "text-lg", md: "text-xl", lg: "text-3xl" };

export function Brand({ withTagline, size = "md", href = "/", light }: BrandProps) {
  return (
    <Link href={href} className="inline-flex items-center gap-3">
      <span
        className={cn(
          "relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white neu-sm",
          logoSizes[size],
        )}
      >
        <Image
          src="/logo.png"
          alt="HotspotX"
          fill
          sizes="64px"
          priority
          className="object-contain p-1"
        />
      </span>
      <span className="flex flex-col leading-tight">
        <span
          className={cn(
            "font-display font-extrabold",
            light ? "text-white" : "text-content",
            nameSizes[size],
          )}
        >
          Hotspot<span className="text-brand">X</span>
        </span>
        {withTagline && (
          <span className={cn("text-xs font-medium", light ? "text-white/70" : "text-muted")}>
            Haraka · Nguvu · Imara
          </span>
        )}
      </span>
    </Link>
  );
}
