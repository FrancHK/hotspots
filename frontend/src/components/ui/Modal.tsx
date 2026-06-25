"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
import { useMounted } from "@/lib/useMounted";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  /** Optional footer area (e.g. action buttons). */
  footer?: ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, footer, className }: ModalProps) {
  // Portals need a real DOM target — only render after client mount (SSR-safe).
  const mounted = useMounted();

  // Close on Escape and lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-navy/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      <div
        className={cn(
          "neu relative z-10 w-full max-w-md rounded-3xl p-6",
          "max-h-[90vh] overflow-y-auto",
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4">
          {title && (
            <h2 className="font-display text-lg font-bold text-content">{title}</h2>
          )}
          <button
            onClick={onClose}
            aria-label="Funga"
            className="neu-press ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-muted"
          >
            ✕
          </button>
        </div>

        <div className={cn(title ? "mt-4" : null)}>{children}</div>

        {footer && <div className="mt-6 flex justify-end gap-3">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
