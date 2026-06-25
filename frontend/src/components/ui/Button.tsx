"use client";

import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

type Variant = "brand" | "neutral" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const sizes: Record<Size, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-5 py-3 text-sm",
  lg: "px-7 py-4 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "brand", size = "md", loading, className, children, disabled, ...props },
    ref,
  ) => {
    const base =
      "inline-flex items-center justify-center gap-2 rounded-2xl font-semibold select-none disabled:opacity-50 disabled:cursor-not-allowed";
    const look =
      variant === "brand"
        ? "neu-brand"
        : variant === "neutral"
          ? "neu-press text-content"
          : "text-muted hover:text-content";

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, sizes[size], look, className)}
        {...props}
      >
        {loading && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        )}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
