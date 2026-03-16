import { motion } from "motion/react";
import {
  Network,
  Zap,
  Leaf,
  Recycle,
  Factory,
  TrendingUp,
  TrendingDown,
  Minus,
  Building2,
  BatteryCharging,
  Landmark,
  BarChart3,
  DollarSign,
  Thermometer,
  Droplets,
  Wind,
  Sun,
  Flame,
  type LucideIcon,
} from "lucide-react";
import { staggerItem } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { AnimatedNumber } from "./AnimatedNumber";
import { ProvenanceBadge } from "./ProvenanceBadge";
import type { Provenance } from "@/types";

const iconMap: Record<string, LucideIcon> = {
  Network,
  Zap,
  Leaf,
  Recycle,
  Factory,
  TrendingUp,
  TrendingDown,
  Minus,
  Building2,
  BatteryCharging,
  Landmark,
  BarChart3,
  DollarSign,
  Thermometer,
  Droplets,
  Wind,
  Sun,
  Flame,
};

interface KPICardProps {
  label: string;
  value: number;
  unit: string;
  trend: "up" | "down" | "stable";
  trendValue: number;
  icon: string;
  decimals?: number;
  className?: string;
  provenance?: Provenance;
}

export function KPICard({
  label,
  value,
  unit,
  trend,
  trendValue,
  icon,
  decimals = 0,
  className,
  provenance,
}: KPICardProps) {
  const IconComponent = iconMap[icon] ?? BarChart3;

  const trendConfig = {
    up: {
      icon: TrendingUp,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      prefix: "+",
    },
    down: {
      icon: TrendingDown,
      color: "text-red-400",
      bg: "bg-red-500/10",
      prefix: "-",
    },
    stable: {
      icon: Minus,
      color: "text-slate-400",
      bg: "bg-slate-500/10",
      prefix: "",
    },
  } as const;

  const trendStyle = trendConfig[trend];
  const TrendIcon = trendStyle.icon;

  return (
    <motion.div
      variants={staggerItem}
      className={cn(
        "relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl",
        "p-5 space-y-3 hover:z-10",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400 flex items-center gap-1">
          {label}
          {provenance && <ProvenanceBadge provenance={provenance} />}
        </span>
        <div className="rounded-lg bg-white/5 p-2">
          <IconComponent className="h-4 w-4 text-emerald-400" />
        </div>
      </div>

      <div className="flex items-baseline gap-2">
        <AnimatedNumber
          value={value}
          decimals={decimals}
          className="text-3xl font-bold text-slate-100"
        />
        <span className="text-sm text-slate-400">{unit}</span>
      </div>

      <div
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2 py-0.5",
          trendStyle.bg
        )}
      >
        <TrendIcon className={cn("h-3.5 w-3.5", trendStyle.color)} />
        <span className={cn("text-xs font-medium", trendStyle.color)}>
          {trendStyle.prefix}
          {Math.abs(trendValue)}%
        </span>
      </div>
    </motion.div>
  );
}
