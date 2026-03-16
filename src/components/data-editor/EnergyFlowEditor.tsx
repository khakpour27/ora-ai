import { useState, useCallback } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { GlowCard } from "@/components/shared";
import { useHubData } from "@/hooks/useHubData";
import { useHubDataStore } from "@/stores/hubDataStore";
import { api } from "@/lib/api";
import { validateSankeyFlows } from "@/lib/sankeyValidator";
import type { EnergyFlow, EnergyType, FlowStatus } from "@/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ENERGY_TYPES: EnergyType[] = [
  "electricity",
  "heat",
  "waste-heat",
  "biogas",
  "hydrogen",
];

const ENERGY_TYPE_LABELS: Record<EnergyType, string> = {
  electricity: "Elektrisitet",
  heat: "Varme",
  "waste-heat": "Spillvarme",
  biogas: "Biogass",
  hydrogen: "Hydrogen",
};

const FLOW_STATUSES: FlowStatus[] = ["existing", "potential", "planned"];

const FLOW_STATUS_LABELS: Record<FlowStatus, string> = {
  existing: "Eksisterende",
  potential: "Potensiell",
  planned: "Planlagt",
};

const FLOW_STATUS_COLORS: Record<FlowStatus, string> = {
  existing: "text-emerald-400",
  potential: "text-amber-400",
  planned: "text-sky-400",
};

const EMPTY_FLOW: EnergyFlow = {
  source: "",
  target: "",
  value: 0,
  type: "electricity",
  status: "potential",
};

// ---------------------------------------------------------------------------
// Toast helper (minimal, no external dep)
// ---------------------------------------------------------------------------

function useToast() {
  const [message, setMessage] = useState<string | null>(null);

  const showError = useCallback((msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 5000);
  }, []);

  return { message, showError };
}

// ---------------------------------------------------------------------------
// Input primitives
// ---------------------------------------------------------------------------

const cellClass =
  "w-full px-2 py-1.5 rounded bg-slate-800/60 border border-slate-600/40 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-colors";

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function EnergyFlowEditor() {
  const hub = useHubData();
  const setActiveHub = useHubDataStore((s) => s.setActiveHub);
  const updateActiveHub = useHubDataStore((s) => s.updateActiveHub);

  const [saving, setSaving] = useState<number | "add" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { message: cycleError, showError: showCycleError } = useToast();

  const flows = hub.energyFlows ?? [];

  // Build node options: companies (by shortName) + sankeyNodes
  const companyOptions = Object.values(hub.companies).map((c) => ({
    value: c.id,
    label: c.shortName ?? c.name,
  }));
  const sankeyOptions = (hub.sankeyNodes ?? []).map((n) => ({
    value: n.id,
    label: n.label,
  }));
  const nodeOptions = [...companyOptions, ...sankeyOptions];

  // ---------------------------------------------------------------------------
  // Mutation helpers — optimistic local update + API persist
  // ---------------------------------------------------------------------------

  const persistFlows = useCallback(
    async (updated: EnergyFlow[]) => {
      // Validate DAG before persisting
      const cycleMsg = validateSankeyFlows(updated);
      if (cycleMsg) {
        showCycleError(cycleMsg);
        return false;
      }

      if (hub.id === "mock") {
        setActiveHub({ ...hub, energyFlows: updated });
        return true;
      }

      await updateActiveHub({ energyFlows: updated });
      return true;
    },
    [hub, setActiveHub, updateActiveHub, showCycleError]
  );

  const updateFlow = useCallback(
    async (index: number, patch: Partial<EnergyFlow>) => {
      const updated = flows.map((f, i) => (i === index ? { ...f, ...patch } : f));
      // Optimistic local update
      setActiveHub({ ...hub, energyFlows: updated });

      setSaving(index);
      setError(null);
      try {
        const ok = await persistFlows(updated);
        if (!ok) {
          // Revert on cycle error
          setActiveHub({ ...hub, energyFlows: flows });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Feil ved lagring");
        setActiveHub({ ...hub, energyFlows: flows });
      } finally {
        setSaving(null);
      }
    },
    [flows, hub, setActiveHub, persistFlows]
  );

  const deleteFlow = useCallback(
    async (index: number) => {
      if (!window.confirm("Slett denne energistrømmen?")) return;
      const updated = flows.filter((_, i) => i !== index);
      setActiveHub({ ...hub, energyFlows: updated });

      setSaving(index);
      setError(null);
      try {
        if (hub.id !== "mock") {
          await api.deleteEnergyFlow(hub.id, index);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Feil ved sletting");
        setActiveHub({ ...hub, energyFlows: flows });
      } finally {
        setSaving(null);
      }
    },
    [flows, hub, setActiveHub]
  );

  const addFlow = useCallback(async () => {
    const newFlow: EnergyFlow = { ...EMPTY_FLOW };
    const updated = [...flows, newFlow];
    setActiveHub({ ...hub, energyFlows: updated });

    setSaving("add");
    setError(null);
    try {
      if (hub.id !== "mock") {
        await api.addEnergyFlow(hub.id, newFlow);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Feil ved oppretting");
      setActiveHub({ ...hub, energyFlows: flows });
    } finally {
      setSaving(null);
    }
  }, [flows, hub, setActiveHub]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <GlowCard className="p-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/40">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">Energistrømmer</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {flows.length} strøm{flows.length !== 1 ? "mer" : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saving === "add" && (
            <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
          )}
          <button
            onClick={addFlow}
            disabled={saving !== null}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150",
              saving !== null
                ? "bg-slate-700/30 text-slate-600 cursor-not-allowed"
                : "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
            )}
          >
            <Plus className="w-3.5 h-3.5" />
            Legg til
          </button>
        </div>
      </div>

      {/* Cycle / error toasts */}
      <AnimatePresence>
        {(cycleError || error) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-5 py-2.5 bg-rose-500/10 border-b border-rose-500/20 text-xs text-rose-400"
          >
            {cycleError ?? error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700/40">
              {["Fra", "Til", "Verdi (GWh)", "Type", "Status", ""].map((h) => (
                <th
                  key={h}
                  className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-slate-500"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {flows.map((flow, idx) => {
                const isSaving = saving === idx;
                return (
                  <motion.tr
                    key={idx}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className={cn(
                      "border-b border-slate-700/20 transition-colors",
                      isSaving ? "bg-slate-800/60" : "hover:bg-slate-800/30"
                    )}
                  >
                    {/* Fra (source) */}
                    <td className="px-3 py-2">
                      <select
                        value={flow.source}
                        onChange={(e) => updateFlow(idx, { source: e.target.value })}
                        disabled={isSaving}
                        className={cellClass}
                      >
                        <option value="">Velg node…</option>
                        {nodeOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Til (target) */}
                    <td className="px-3 py-2">
                      <select
                        value={flow.target}
                        onChange={(e) => updateFlow(idx, { target: e.target.value })}
                        disabled={isSaving}
                        className={cellClass}
                      >
                        <option value="">Velg node…</option>
                        {nodeOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Verdi */}
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={flow.value}
                        onChange={(e) =>
                          updateFlow(idx, { value: parseFloat(e.target.value) || 0 })
                        }
                        disabled={isSaving}
                        className={cn(cellClass, "font-mono w-28")}
                      />
                    </td>

                    {/* Type */}
                    <td className="px-3 py-2">
                      <select
                        value={flow.type}
                        onChange={(e) =>
                          updateFlow(idx, { type: e.target.value as EnergyType })
                        }
                        disabled={isSaving}
                        className={cellClass}
                      >
                        {ENERGY_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {ENERGY_TYPE_LABELS[t]}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Status */}
                    <td className="px-3 py-2">
                      <select
                        value={flow.status}
                        onChange={(e) =>
                          updateFlow(idx, { status: e.target.value as FlowStatus })
                        }
                        disabled={isSaving}
                        className={cn(cellClass, FLOW_STATUS_COLORS[flow.status])}
                      >
                        {FLOW_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {FLOW_STATUS_LABELS[s]}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-2 w-10">
                      {isSaving ? (
                        <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                      ) : (
                        <button
                          onClick={() => deleteFlow(idx)}
                          className="p-1 rounded text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Slett"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>

        {flows.length === 0 && (
          <div className="py-12 text-center text-sm text-slate-500">
            Ingen energistrømmer ennå. Klikk "Legg til" for å opprette en.
          </div>
        )}
      </div>
    </GlowCard>
  );
}
