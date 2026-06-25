"use client";

import { type InputHTMLAttributes, type SelectHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

const fieldBase =
  "w-full rounded-2xl neu-inset px-4 py-3 text-content placeholder:text-muted/70 outline-none focus:ring-2 focus:ring-brand/50";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <label className="block">
        {label && (
          <span className="mb-1.5 block text-sm font-medium text-muted">
            {label}
          </span>
        )}
        <input ref={ref} id={inputId} className={cn(fieldBase, className)} {...props} />
        {error && <span className="mt-1 block text-xs text-red-500">{error}</span>}
      </label>
    );
  },
);
Input.displayName = "Input";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, className, children, ...props }, ref) => {
    return (
      <label className="block">
        {label && (
          <span className="mb-1.5 block text-sm font-medium text-muted">
            {label}
          </span>
        )}
        <select ref={ref} className={cn(fieldBase, "appearance-none", className)} {...props}>
          {children}
        </select>
      </label>
    );
  },
);
Select.displayName = "Select";
