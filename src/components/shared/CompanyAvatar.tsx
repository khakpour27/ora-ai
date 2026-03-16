import { companies } from "@/data/companies";
import type { CompanyId } from "@/types";
import { cn } from "@/lib/utils";

interface CompanyAvatarProps {
  companyId: CompanyId | string;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "w-6 h-6 text-[10px]",
  md: "w-8 h-8 text-xs",
  lg: "w-10 h-10 text-sm",
};

export function CompanyAvatar({
  companyId,
  size = "md",
  showName = true,
  className,
}: CompanyAvatarProps) {
  const company = companies[companyId as CompanyId];
  if (!company) return null;

  const initials = company.shortName.slice(0, 2).toUpperCase();

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "rounded-full flex items-center justify-center font-semibold shrink-0",
          sizeClasses[size]
        )}
        style={{
          backgroundColor: `${company.color}20`,
          color: company.color,
          border: `1px solid ${company.color}40`,
        }}
        title={company.name}
      >
        {initials}
      </div>
      {showName && (
        <span className="text-sm text-slate-300">{company.shortName}</span>
      )}
    </div>
  );
}
