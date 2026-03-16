import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  FlaskConical,
  X,
  Check,
  Thermometer,
  Recycle,
  Flame,
  Brain,
  ShieldCheck,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useScenarioStore } from "@/stores/scenarioStore";
import { SCENARIO_PRESETS, type ScenarioPreset } from "@/data/scenarioPresets";
import { useHubData } from "@/hooks/useHubData";
import { useResolvedData } from "@/hooks/useResolvedData";
import { computeKPIDeltas } from "@/lib/kpiCalculator";

// Map icon names to Lucide components
const ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Thermometer,
  Recycle,
  Flame,
  Brain,
  ShieldCheck,
};

const fmt = new Intl.NumberFormat("nb-NO", { maximumFractionDigits: 1 });

export function ScenarioPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const activeScenarioId = useScenarioStore((s) => s.activeScenarioId);
  const setActiveScenario = useScenarioStore((s) => s.setActiveScenario);

  const activePreset = SCENARIO_PRESETS.find((s) => s.id === activeScenarioId);

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all duration-200",
          "bg-emerald-600 hover:bg-emerald-500 text-white",
          isOpen && "ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-900"
        )}
        aria-label="Åpne scenariopanel"
      >
        <FlaskConical className="h-5 w-5" />
        {activePreset && (
          <span
            className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-slate-900"
            style={{ backgroundColor: activePreset.color }}
          />
        )}
      </button>

      {/* Slide-in panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            key="scenario-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className={cn(
              "fixed right-0 top-0 z-40 flex h-full w-96 flex-col",
              "bg-slate-900/95 backdrop-blur-xl border-l border-slate-700/50",
              "shadow-2xl"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-700/50 px-5 py-4">
              <div className="flex items-center gap-2 text-slate-100">
                <FlaskConical className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-semibold tracking-wide">Scenarier</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors"
                aria-label="Lukk panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable preset cards */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {SCENARIO_PRESETS.map((preset) => (
                <PresetCard
                  key={preset.id}
                  preset={preset}
                  isActive={preset.id === activeScenarioId}
                  onToggle={() =>
                    setActiveScenario(preset.id === activeScenarioId ? null : preset.id)
                  }
                />
              ))}
            </div>

            {/* KPI comparison + Reset */}
            {activePreset && (
              <div className="border-t border-slate-700/50 px-5 py-4 space-y-3">
                <KPIComparison />
                <button
                  onClick={() => setActiveScenario(null)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 py-2 text-sm text-slate-400 hover:border-slate-600 hover:text-slate-200 transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Nullstill
                </button>
              </div>
            )}

            {/* Lab link */}
            <div className="border-t border-slate-700/50 px-5 py-3">
              <Link
                to="/scenarier"
                className="flex items-center justify-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <FlaskConical className="h-3.5 w-3.5" />
                Utforsk i Scenario Lab
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Backdrop (mobile) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="scenario-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[1px] sm:hidden"
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ---------------------------------------------------------------------------
// Preset Card
// ---------------------------------------------------------------------------
function PresetCard({
  preset,
  isActive,
  onToggle,
}: {
  preset: ScenarioPreset;
  isActive: boolean;
  onToggle: () => void;
}) {
  const Icon = ICON_MAP[preset.icon] ?? FlaskConical;

  return (
    <button
      onClick={onToggle}
      className={cn(
        "relative w-full text-left rounded-xl border px-4 py-3.5 transition-all duration-200",
        "hover:shadow-md",
        isActive
          ? "bg-slate-800/80 shadow-lg"
          : "bg-slate-800/40 border-slate-700/40 hover:border-slate-600/60 hover:bg-slate-800/60"
      )}
      style={
        isActive
          ? { borderColor: `${preset.color}60`, boxShadow: `0 0 20px ${preset.color}15` }
          : undefined
      }
    >
      {/* Left color accent bar */}
      <span
        className="absolute left-0 top-3 bottom-3 w-1 rounded-full"
        style={{ backgroundColor: preset.color }}
      />

      <div className="flex items-start gap-3 pl-2">
        {/* Icon */}
        <div
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${preset.color}15` }}
        >
          <Icon className="h-[18px] w-[18px]" style={{ color: preset.color }} />
        </div>

        {/* Text */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-100">{preset.name}</span>
            {isActive && (
              <span
                className="flex h-[18px] w-[18px] items-center justify-center rounded-full"
                style={{ backgroundColor: preset.color }}
              >
                <Check className="h-3 w-3 text-white" />
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {preset.description}
          </p>
          <span className="mt-1.5 inline-flex items-center rounded-full bg-slate-700/50 px-2 py-0.5 text-xs text-slate-300">
            {preset.mutations.length} endringer
          </span>
        </div>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// KPI Comparison (shown when a scenario is active)
// ---------------------------------------------------------------------------
function KPIComparison() {
  const base = useHubData();
  const resolved = useResolvedData();

  const deltas = useMemo(
    () => computeKPIDeltas(base, resolved).filter((d) => d.delta !== 0),
    [base, resolved]
  );

  if (deltas.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
        KPI-endringer
      </p>
      <div className="flex flex-wrap gap-1.5">
        {deltas.map((d) => {
          const isPositive = d.delta > 0;
          const isGood = isPositive;
          return (
            <span
              key={d.id}
              className={cn(
                "inline-flex items-center gap-0.5 rounded-full px-2.5 py-1 text-xs font-medium",
                isGood
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-rose-500/15 text-rose-400"
              )}
            >
              {isPositive ? (
                <ArrowUp className="w-3 h-3" />
              ) : (
                <ArrowDown className="w-3 h-3" />
              )}
              {isPositive ? "+" : ""}
              {fmt.format(d.delta)}
              {d.unit ? ` ${d.unit}` : ""}
            </span>
          );
        })}
      </div>
    </div>
  );
}
