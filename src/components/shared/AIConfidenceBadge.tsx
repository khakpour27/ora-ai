import { getConfidenceColor } from "@/lib/theme";
import { cn } from "@/lib/utils";

interface AIConfidenceBadgeProps {
  confidence: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "px-1.5 py-0.5 text-[10px] gap-1",
  md: "px-2.5 py-0.5 text-xs gap-1.5",
  lg: "px-3 py-1 text-sm gap-2",
} as const;

const dotSizeClasses = {
  sm: "w-1 h-1",
  md: "w-1.5 h-1.5",
  lg: "w-2 h-2",
} as const;

export function AIConfidenceBadge({
  confidence,
  size = "md",
  className,
}: AIConfidenceBadgeProps) {
  const color = getConfidenceColor(confidence);
  const pct = Math.round(confidence * 100);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium border",
        sizeClasses[size],
        className
      )}
      style={{
        color,
        borderColor: `${color}40`,
        backgroundColor: `${color}15`,
      }}
    >
      <span
        className={cn("rounded-full", dotSizeClasses[size])}
        style={{ backgroundColor: color }}
      />
      KI {pct}%
    </span>
  );
}
