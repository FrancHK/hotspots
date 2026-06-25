import { type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  inset?: boolean;
}

export function Card({ inset, className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-3xl p-6",
        inset ? "neu-inset" : "neu",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("text-lg font-bold text-content", className)} {...props}>
      {children}
    </h3>
  );
}
