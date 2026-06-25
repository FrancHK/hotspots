"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useMounted } from "@/lib/useMounted";
import { cn } from "@/lib/cn";

type Tone = "success" | "error" | "info" | "warning";

interface Toast {
  id: number;
  message: string;
  tone: Tone;
}

interface ToastContextValue {
  /** Show a toast; returns its id. Convenience helpers below. */
  show: (message: string, tone?: Tone) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const icons: Record<Tone, string> = {
  success: "✅",
  error: "⛔",
  info: "ℹ️",
  warning: "⚠️",
};

const accents: Record<Tone, string> = {
  success: "border-l-green-500",
  error: "border-l-red-500",
  info: "border-l-sky-500",
  warning: "border-l-amber-500",
};

const DURATION = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const mounted = useMounted();
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message: string, tone: Tone = "info") => {
      const id = nextId.current++;
      setToasts((list) => [...list, { id, message, tone }]);
      setTimeout(() => dismiss(id), DURATION);
    },
    [dismiss],
  );

  const value: ToastContextValue = {
    show,
    success: (m) => show(m, "success"),
    error: (m) => show(m, "error"),
    info: (m) => show(m, "info"),
    warning: (m) => show(m, "warning"),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {mounted &&
        createPortal(
          <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(92vw,22rem)] flex-col gap-3">
            {toasts.map((t) => (
              <div
                key={t.id}
                role="status"
                className={cn(
                  "neu pointer-events-auto flex items-start gap-3 rounded-2xl border-l-4 px-4 py-3",
                  accents[t.tone],
                )}
              >
                <span aria-hidden className="text-base leading-5">
                  {icons[t.tone]}
                </span>
                <p className="flex-1 text-sm text-content">{t.message}</p>
                <button
                  onClick={() => dismiss(t.id)}
                  aria-label="Funga"
                  className="text-muted hover:text-content"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast lazima itumike ndani ya <ToastProvider>");
  return ctx;
}
