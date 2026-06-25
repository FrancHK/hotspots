import { type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";

interface PageHeaderProps {
  icon: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function PageHeader({ icon, title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-5">
      <div className="flex items-center gap-3">
        <span className="neu-sm flex h-11 w-11 items-center justify-center rounded-2xl text-xl text-brand">
          <Icon name={icon} />
        </span>
        <div>
          <h1 className="font-display text-xl font-bold text-content sm:text-2xl">{title}</h1>
          {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
