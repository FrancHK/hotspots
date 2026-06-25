import { cn } from "@/lib/cn";

// Thin wrapper over Bootstrap Icons. `name` is the icon id without the
// `bi-` prefix, e.g. <Icon name="house-door" />.
export function Icon({
  name,
  className,
  ...props
}: { name: string } & React.HTMLAttributes<HTMLElement>) {
  return <i className={cn(`bi bi-${name}`, className)} aria-hidden {...props} />;
}
