import { FlaskConical, X, ArrowUp, ArrowDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useMemo } from "react";
import { useScenarioStore } from "@/stores/scenarioStore";
import { SCENARIO_PRESETS } from "@/data/scenarioPresets";
import { useHubData } from "@/hooks/useHubData";
import { useResolvedData } from "@/hooks/useResolvedData";
import { computeKPIDeltas } from "@/lib/kpiCalculator";

const fmt = new Intl.NumberFormat("nb-NO", { maximumFractionDigits: 1 });

/**
 * Thin banner shown at the top of visualization pages when a scenario is active.
 * Displays the scenario name + color, mutation count, and KPI delta badges.
 */
export function ScenarioBanner() {
  const activeScenarioId = useScenarioStore((s) => s.activeScenarioId);
  const setActiveScenario = useScenarioStore((s) => s.setActiveScenario);
  const base = useHubData();
  const resolved = useResolvedData();

  const scenario = SCENARIO_PRESETS.find((s) => s.id === activeScenarioId);

  const deltas = useMemo(() => {
    if (!scenario) return [];
    return computeKPIDeltas(base, resolved).filter((d) => d.delta !== 0);
  }, [base, resolved, scenario]);

  return (
    <AnimatePresence>
      {scenario && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-4"
        >
          <div
            className="flex items-center gap-3 px-4 py-2 rounded-lg border flex-wrap"
            style={{
              backgroundColor: `${scenario.color}10`,
              borderColor: `${scenario.color}30`,
            }}
          >
            <FlaskConical className="w-4 h-4" style={{ color: scenario.color }} />
            <span className="text-sm font-medium text-slate-200">
              Scenario:{" "}
              <span style={{ color: scenario.color }}>{scenario.name}</span>
            </span>
            <span className="text-xs text-slate-500">
              {scenario.mutations.length} endring{scenario.mutations.length !== 1 ? "er" : ""}
            </span>

            {/* KPI delta badges */}
            {deltas.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                {deltas.map((d) => {
                  const isPositive = d.delta > 0;
                  // For most KPIs, positive = good. Exception: none currently
                  const isGood = isPositive;
                  return (
                    <span
                      key={d.id}
                      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                        isGood
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-rose-500/15 text-rose-400"
                      }`}
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
            )}

            <div className="flex-1" />
            <button
              onClick={() => setActiveScenario(null)}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-700/40 transition-colors"
            >
              <X className="w-3 h-3" />
              Deaktiver
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
