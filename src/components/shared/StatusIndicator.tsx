import { cn } from "@/lib/utils";

type Status = "not-started" | "in-progress" | "completed" | "on-hold";

const statusConfig: Record<
  Status,
  { color: string; bgColor: string; dotColor: string; label: string }
> = {
  "not-started": {
    color: "text-slate-400",
    bgColor: "bg-slate-500/20",
    dotColor: "bg-slate-400",
    label: "Ikke startet",
  },
  "in-progress": {
    color: "text-amber-400",
    bgColor: "bg-amber-500/20",
    dotColor: "bg-amber-400 animate-pulse",
    label: "Pagaende",
  },
  completed: {
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/20",
    dotColor: "bg-emerald-400",
    label: "Fullfort",
  },
  "on-hold": {
    color: "text-rose-400",
    bgColor: "bg-rose-500/20",
    dotColor: "bg-rose-400",
    label: "Pa vent",
  },
};

const progressBarColors: Record<Status, string> = {
  "not-started": "bg-slate-500",
  "in-progress": "bg-amber-500",
  completed: "bg-emerald-500",
  "on-hold": "bg-rose-500",
};

interface StatusIndicatorProps {
  status: Status;
  label?: string;
  progress?: number;
  className?: string;
}

export function StatusIndicator({
  status,
  label,
  progress,
  className,
}: StatusIndicatorProps) {
  const config = statusConfig[status];
  const displayLabel = label ?? config.label;

  return (
    <div className={cn("space-y-1.5", className)}>
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium",
          config.color,
          config.bgColor
        )}
      >
        <span className={cn("w-1.5 h-1.5 rounded-full", config.dotColor)} />
        {displayLabel}
      </span>
      {progress !== undefined && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-700">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              progressBarColors[status]
            )}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}
    </div>
  );
}
