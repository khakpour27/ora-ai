import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  description?: string;
  badge?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function SectionHeader({
  title,
  description,
  badge,
  icon,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between mb-4", className)}>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-xl font-semibold text-slate-100">{title}</h2>
          {badge}
        </div>
        {description && (
          <p className="text-sm text-slate-400">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
