import { cn } from "@/lib/utils";

interface PulsingDotProps {
  color?: string;
  size?: number;
  className?: string;
}

export function PulsingDot({
  color = "bg-emerald-400",
  size = 8,
  className,
}: PulsingDotProps) {
  return (
    <span
      className={cn("relative inline-flex", className)}
      style={{ width: size, height: size }}
    >
      <span
        className={cn(
          "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
          color
        )}
      />
      <span
        className={cn(
          "relative inline-flex h-full w-full rounded-full",
          color
        )}
      />
    </span>
  );
}
