import { useState, useCallback } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { GlowCard } from "@/components/shared";
import { useHubData } from "@/hooks/useHubData";
import { useHubDataStore } from "@/stores/hubDataStore";
import { api } from "@/lib/api";
import type { MaterialFlow, FlowStatus } from "@/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId() {
  return `mf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const cellClass =
  "w-full px-2 py-1.5 rounded bg-slate-800/60 border border-slate-600/40 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-colors";

// ---------------------------------------------------------------------------
// Match score input — number input clamped 0–100, stored as 0–1
// ---------------------------------------------------------------------------

interface MatchScoreInputProps {
  value: number; // 0-1
  onChange: (v: number) => void;
  disabled?: boolean;
}

function MatchScoreInput({ value, onChange, disabled }: MatchScoreInputProps) {
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <input
        type="number"
        min={0}
        max={100}
        step={1}
        value={pct}
        disabled={disabled}
        onChange={(e) => {
          const raw = parseInt(e.target.value, 10);
          const clamped = Math.min(100, Math.max(0, isNaN(raw) ? 0 : raw));
          onChange(clamped / 100);
        }}
        className={cn(cellClass, "font-mono w-16 text-center")}
      />
      <div className="relative flex-1 h-1.5 rounded-full bg-slate-700/60 overflow-hidden min-w-[40px]">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-emerald-500/70 transition-all duration-150"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function MaterialFlowEditor() {
  const hub = useHubData();
  const setActiveHub = useHubDataStore((s) => s.setActiveHub);

  const [saving, setSaving] = useState<string | "add" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const flows = hub.materialFlows ?? [];

  const companyOptions = Object.values(hub.companies).map((c) => ({
    value: c.id,
    label: c.shortName ?? c.name,
  }));

  // ---------------------------------------------------------------------------
  // Mutation helpers
  // ---------------------------------------------------------------------------

  const updateFlow = useCallback(
    async (flowId: string, patch: Partial<MaterialFlow>) => {
      const updated = flows.map((f) => (f.id === flowId ? { ...f, ...patch } : f));
      setActiveHub({ ...hub, materialFlows: updated });

      setSaving(flowId);
      setError(null);
      try {
        if (hub.id !== "mock") {
          await api.updateMaterialFlow(hub.id, flowId, patch);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Feil ved lagring");
        setActiveHub({ ...hub, materialFlows: flows });
      } finally {
        setSaving(null);
      }
    },
    [flows, hub, setActiveHub]
  );

  const deleteFlow = useCallback(
    async (flowId: string) => {
      if (!window.confirm("Slett denne materialstrømmen?")) return;
      const updated = flows.filter((f) => f.id !== flowId);
      setActiveHub({ ...hub, materialFlows: updated });

      setSaving(flowId);
      setError(null);
      try {
        if (hub.id !== "mock") {
          await api.deleteMaterialFlow(hub.id, flowId);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Feil ved sletting");
        setActiveHub({ ...hub, materialFlows: flows });
      } finally {
        setSaving(null);
      }
    },
    [flows, hub, setActiveHub]
  );

  const addFlow = useCallback(async () => {
    const firstCompanyId = Object.keys(hub.companies)[0] ?? "";
    const newFlow: MaterialFlow = {
      id: generateId(),
      source: firstCompanyId,
      target: firstCompanyId,
      material: "",
      volumeTonnesPerYear: 0,
      status: "potential",
      matchScore: 0,
    };
    const updated = [...flows, newFlow];
    setActiveHub({ ...hub, materialFlows: updated });

    setSaving("add");
    setError(null);
    try {
      if (hub.id !== "mock") {
        const created = await api.addMaterialFlow(hub.id, newFlow);
        // Update the local id in case the API returns a different one
        const withApiId = updated.map((f) =>
          f.id === newFlow.id ? { ...f, id: created.id } : f
        );
        setActiveHub({ ...hub, materialFlows: withApiId });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Feil ved oppretting");
      setActiveHub({ ...hub, materialFlows: flows });
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
          <h3 className="text-sm font-semibold text-slate-200">Materialstrømmer</h3>
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

      {/* Error toast */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-5 py-2.5 bg-rose-500/10 border-b border-rose-500/20 text-xs text-rose-400"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700/40">
              {[
                "Fra",
                "Til",
                "Materiale",
                "Volum (tonn/år)",
                "Status",
                "Match (0–100)",
                "",
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-slate-500 whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {flows.map((flow) => {
                const isSaving = saving === flow.id;
                return (
                  <motion.tr
                    key={flow.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className={cn(
                      "border-b border-slate-700/20 transition-colors",
                      isSaving ? "bg-slate-800/60" : "hover:bg-slate-800/30"
                    )}
                  >
                    {/* Fra */}
                    <td className="px-3 py-2">
                      <select
                        value={flow.source}
                        onChange={(e) => updateFlow(flow.id, { source: e.target.value })}
                        disabled={isSaving}
                        className={cellClass}
                      >
                        <option value="">Velg aktør…</option>
                        {companyOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Til */}
                    <td className="px-3 py-2">
                      <select
                        value={flow.target}
                        onChange={(e) => updateFlow(flow.id, { target: e.target.value })}
                        disabled={isSaving}
                        className={cellClass}
                      >
                        <option value="">Velg aktør…</option>
                        {companyOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Materiale */}
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={flow.material}
                        onChange={(e) => updateFlow(flow.id, { material: e.target.value })}
                        disabled={isSaving}
                        placeholder="f.eks. aluminiumsslam"
                        className={cn(cellClass, "min-w-[140px]")}
                      />
                    </td>

                    {/* Volum */}
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={flow.volumeTonnesPerYear}
                        onChange={(e) =>
                          updateFlow(flow.id, {
                            volumeTonnesPerYear: parseFloat(e.target.value) || 0,
                          })
                        }
                        disabled={isSaving}
                        className={cn(cellClass, "font-mono w-28")}
                      />
                    </td>

                    {/* Status */}
                    <td className="px-3 py-2">
                      <select
                        value={flow.status}
                        onChange={(e) =>
                          updateFlow(flow.id, { status: e.target.value as FlowStatus })
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

                    {/* Match score */}
                    <td className="px-3 py-2">
                      <MatchScoreInput
                        value={flow.matchScore}
                        disabled={isSaving}
                        onChange={(v) => updateFlow(flow.id, { matchScore: v })}
                      />
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-2 w-10">
                      {isSaving ? (
                        <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                      ) : (
                        <button
                          onClick={() => deleteFlow(flow.id)}
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
            Ingen materialstrømmer ennå. Klikk "Legg til" for å opprette en.
          </div>
        )}
      </div>
    </GlowCard>
  );
}
