import { useState, useCallback } from "react";
import { Plus, Trash2, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { GlowCard } from "@/components/shared";
import { useHubData } from "@/hooks/useHubData";
import { useHubDataStore } from "@/stores/hubDataStore";
import type { SymbiosisOpportunity } from "@/types";

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

type SymbiosisType = SymbiosisOpportunity["type"];
type SymbiosisStatus = SymbiosisOpportunity["status"];
type RiskLevel = "low" | "medium" | "high";

const SYMBIOSIS_TYPES: SymbiosisType[] = [
  "energy",
  "material",
  "infrastructure",
  "service",
];

const TYPE_LABELS: Record<SymbiosisType, string> = {
  energy: "Energi",
  material: "Materiale",
  infrastructure: "Infrastruktur",
  service: "Tjeneste",
};

const TYPE_COLORS: Record<SymbiosisType, string> = {
  energy: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  material: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  infrastructure: "bg-sky-500/20 text-sky-400 border-sky-500/30",
  service: "bg-violet-500/20 text-violet-400 border-violet-500/30",
};

const SYMBIOSIS_STATUSES: SymbiosisStatus[] = [
  "identified",
  "validated",
  "prioritized",
];

const STATUS_LABELS: Record<SymbiosisStatus, string> = {
  identified: "Identifisert",
  validated: "Validert",
  prioritized: "Prioritert",
};

const STATUS_COLORS: Record<SymbiosisStatus, string> = {
  identified: "bg-slate-600/30 text-slate-400 border-slate-600/40",
  validated: "bg-sky-500/20 text-sky-400 border-sky-500/30",
  prioritized: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};

const RISK_LEVELS: RiskLevel[] = ["low", "medium", "high"];

const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  low: "Lav",
  medium: "Middels",
  high: "Høy",
};

const RISK_LEVEL_COLORS: Record<RiskLevel, string> = {
  low: "text-emerald-400",
  medium: "text-amber-400",
  high: "text-rose-400",
};

const DIMENSION_KEYS: (keyof SymbiosisOpportunity["dimensions"])[] = [
  "economicPotential",
  "environmentalImpact",
  "technicalFeasibility",
  "regulatoryReadiness",
  "marketDemand",
  "implementationSpeed",
];

const DIMENSION_LABELS: Record<keyof SymbiosisOpportunity["dimensions"], string> = {
  economicPotential: "Øk. potensial",
  environmentalImpact: "Miljøpåvirkning",
  technicalFeasibility: "Teknisk muligj.",
  regulatoryReadiness: "Regulatorisk",
  marketDemand: "Markedsetterspørsel",
  implementationSpeed: "Impl. hastighet",
};

const RISK_KEYS: (keyof SymbiosisOpportunity["risks"])[] = [
  "technical",
  "regulatory",
  "financial",
  "operational",
];

const RISK_LABELS: Record<keyof SymbiosisOpportunity["risks"], string> = {
  technical: "Teknisk",
  regulatory: "Regulatorisk",
  financial: "Finansiell",
  operational: "Operasjonell",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId() {
  return `sym-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const inputClass =
  "w-full px-2.5 py-1.5 rounded bg-slate-800/60 border border-slate-600/40 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-colors";

const labelClass = "block text-[11px] font-medium uppercase tracking-wider text-slate-500 mb-1";

// ---------------------------------------------------------------------------
// Company chips multi-select
// ---------------------------------------------------------------------------

interface CompanyChipsProps {
  selected: string[];
  options: { value: string; label: string }[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}

function CompanyChips({ selected, options, onChange, disabled }: CompanyChipsProps) {
  const [open, setOpen] = useState(false);

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const selectedLabels = selected
    .map((id) => options.find((o) => o.value === id)?.label ?? id)
    .filter(Boolean);

  return (
    <div className="relative">
      {/* Chip display */}
      <div
        onClick={() => !disabled && setOpen((v) => !v)}
        className={cn(
          "min-h-[34px] flex flex-wrap gap-1.5 px-2.5 py-1.5 rounded border cursor-pointer transition-colors",
          "bg-slate-800/60 border-slate-600/40",
          open && "border-emerald-500/50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        {selectedLabels.length === 0 ? (
          <span className="text-sm text-slate-500 self-center">Velg aktører…</span>
        ) : (
          selectedLabels.map((label, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
            >
              {label}
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(selected[i]);
                  }}
                  className="text-emerald-400/60 hover:text-emerald-300 leading-none"
                >
                  ×
                </button>
              )}
            </span>
          ))
        )}
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            className="absolute left-0 top-full mt-1 z-20 w-full max-h-48 overflow-y-auto rounded-lg border border-slate-700/60 bg-slate-900/95 backdrop-blur-xl shadow-xl"
            onMouseLeave={() => setOpen(false)}
          >
            {options.map((opt) => {
              const checked = selected.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggle(opt.value)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors",
                    checked
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "text-slate-300 hover:bg-slate-700/50 hover:text-slate-100"
                  )}
                >
                  <span
                    className={cn(
                      "w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0",
                      checked
                        ? "bg-emerald-500/40 border-emerald-500/60"
                        : "border-slate-600/60"
                    )}
                  >
                    {checked && (
                      <span className="block w-1.5 h-1.5 rounded-sm bg-emerald-400" />
                    )}
                  </span>
                  {opt.label}
                </button>
              );
            })}
            {options.length === 0 && (
              <div className="px-3 py-2.5 text-xs text-slate-500">Ingen aktører</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single symbiosis card
// ---------------------------------------------------------------------------

interface SymbiosisCardProps {
  opp: SymbiosisOpportunity;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (patch: Partial<SymbiosisOpportunity>) => void;
  onDelete: () => void;
  saving: boolean;
  companyOptions: { value: string; label: string }[];
}

function SymbiosisCard({
  opp,
  expanded,
  onToggle,
  onUpdate,
  onDelete,
  saving,
  companyOptions,
}: SymbiosisCardProps) {
  return (
    <div className="rounded-xl border border-slate-700/40 bg-slate-800/30 overflow-hidden">
      {/* Card header / summary row */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-700/20 transition-colors text-left"
      >
        {/* Type badge */}
        <span
          className={cn(
            "flex-shrink-0 px-2 py-0.5 rounded-full text-[11px] font-medium border",
            TYPE_COLORS[opp.type]
          )}
        >
          {TYPE_LABELS[opp.type]}
        </span>

        {/* Title */}
        <p className="flex-1 text-sm font-medium text-slate-200 truncate">{opp.title}</p>

        {/* Status badge */}
        <span
          className={cn(
            "flex-shrink-0 px-2 py-0.5 rounded-full text-[11px] font-medium border",
            STATUS_COLORS[opp.status]
          )}
        >
          {STATUS_LABELS[opp.status]}
        </span>

        {/* Value */}
        <span className="flex-shrink-0 text-xs text-slate-400 font-mono tabular-nums">
          {opp.estimatedAnnualValueMNOK.toFixed(1)} MNOK/år
        </span>

        {/* Expand icon */}
        {saving ? (
          <Loader2 className="w-4 h-4 text-emerald-400 animate-spin flex-shrink-0" />
        ) : expanded ? (
          <ChevronUp className="w-4 h-4 text-slate-500 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
        )}
      </button>

      {/* Expanded form */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-slate-700/40 overflow-hidden"
          >
            <div className="p-5 space-y-5">
              {/* Row 1: Title, type, status */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-3 sm:col-span-1">
                  <label className={labelClass}>Tittel</label>
                  <input
                    value={opp.title}
                    onChange={(e) => onUpdate({ title: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Type</label>
                  <select
                    value={opp.type}
                    onChange={(e) => onUpdate({ type: e.target.value as SymbiosisType })}
                    className={cn(inputClass, TYPE_COLORS[opp.type])}
                  >
                    {SYMBIOSIS_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {TYPE_LABELS[t]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Status</label>
                  <select
                    value={opp.status}
                    onChange={(e) =>
                      onUpdate({ status: e.target.value as SymbiosisStatus })
                    }
                    className={cn(inputClass, STATUS_COLORS[opp.status])}
                  >
                    {SYMBIOSIS_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className={labelClass}>Beskrivelse</label>
                <textarea
                  rows={3}
                  value={opp.description}
                  onChange={(e) => onUpdate({ description: e.target.value })}
                  className={cn(inputClass, "resize-none")}
                />
              </div>

              {/* Involved companies */}
              <div>
                <label className={labelClass}>Involverte aktører</label>
                <CompanyChips
                  selected={opp.involvedCompanies}
                  options={companyOptions}
                  onChange={(ids) => onUpdate({ involvedCompanies: ids })}
                />
              </div>

              {/* Financial metrics */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>Verdi (MNOK/år)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={opp.estimatedAnnualValueMNOK}
                    onChange={(e) =>
                      onUpdate({
                        estimatedAnnualValueMNOK: parseFloat(e.target.value) || 0,
                      })
                    }
                    className={cn(inputClass, "font-mono")}
                  />
                </div>
                <div>
                  <label className={labelClass}>CO₂-reduksjon (tonn)</label>
                  <input
                    type="number"
                    step="1"
                    value={opp.co2ReductionTonnes}
                    onChange={(e) =>
                      onUpdate({
                        co2ReductionTonnes: parseFloat(e.target.value) || 0,
                      })
                    }
                    className={cn(inputClass, "font-mono")}
                  />
                </div>
                <div>
                  <label className={labelClass}>AI-konfidans (0–1)</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    max={1}
                    value={opp.aiConfidence}
                    onChange={(e) =>
                      onUpdate({
                        aiConfidence: Math.min(1, Math.max(0, parseFloat(e.target.value) || 0)),
                      })
                    }
                    className={cn(inputClass, "font-mono")}
                  />
                </div>
              </div>

              {/* Dimensions — 6 inputs in a grid */}
              <div>
                <label className={labelClass}>Dimensjoner (0–1)</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {DIMENSION_KEYS.map((key) => (
                    <div key={key}>
                      <label className="text-[10px] text-slate-500 block mb-1">
                        {DIMENSION_LABELS[key]}
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.01"
                          min={0}
                          max={1}
                          value={opp.dimensions[key]}
                          onChange={(e) =>
                            onUpdate({
                              dimensions: {
                                ...opp.dimensions,
                                [key]: Math.min(
                                  1,
                                  Math.max(0, parseFloat(e.target.value) || 0)
                                ),
                              },
                            })
                          }
                          className={cn(inputClass, "font-mono w-20")}
                        />
                        <div className="flex-1 relative h-1.5 rounded-full bg-slate-700/60 overflow-hidden">
                          <div
                            className="absolute inset-y-0 left-0 rounded-full bg-emerald-500/70 transition-all duration-150"
                            style={{ width: `${opp.dimensions[key] * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risks — 4 dropdowns in a row */}
              <div>
                <label className={labelClass}>Risikovurderinger</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {RISK_KEYS.map((key) => (
                    <div key={key}>
                      <label className="text-[10px] text-slate-500 block mb-1">
                        {RISK_LABELS[key]}
                      </label>
                      <select
                        value={opp.risks[key]}
                        onChange={(e) =>
                          onUpdate({
                            risks: {
                              ...opp.risks,
                              [key]: e.target.value as RiskLevel,
                            },
                          })
                        }
                        className={cn(
                          inputClass,
                          RISK_LEVEL_COLORS[opp.risks[key]]
                        )}
                      >
                        {RISK_LEVELS.map((r) => (
                          <option key={r} value={r}>
                            {RISK_LEVEL_LABELS[r]}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delete */}
              <div className="flex justify-end pt-2 border-t border-slate-700/30">
                <button
                  onClick={onDelete}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Slett
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function SymbiosisEditor() {
  const hub = useHubData();
  const setActiveHub = useHubDataStore((s) => s.setActiveHub);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | "add" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const opps = hub.symbiosisOpportunities ?? [];

  const companyOptions = Object.values(hub.companies).map((c) => ({
    value: c.id,
    label: c.shortName ?? c.name,
  }));

  // ---------------------------------------------------------------------------
  // Mutation helpers
  // ---------------------------------------------------------------------------

  const updateOpp = useCallback(
    async (oppId: string, patch: Partial<SymbiosisOpportunity>) => {
      const updated = opps.map((o) =>
        o.id === oppId ? { ...o, ...patch } : o
      );
      setActiveHub({ ...hub, symbiosisOpportunities: updated });

      setSaving(oppId);
      setError(null);
      try {
        if (hub.id !== "mock") {
          // Persist full hub update (no dedicated symbiosis endpoint in api.ts)
          const { updateActiveHub } = useHubDataStore.getState();
          await updateActiveHub({ symbiosisOpportunities: updated });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Feil ved lagring");
        setActiveHub({ ...hub, symbiosisOpportunities: opps });
      } finally {
        setSaving(null);
      }
    },
    [opps, hub, setActiveHub]
  );

  const deleteOpp = useCallback(
    async (oppId: string) => {
      if (!window.confirm("Slett denne symbiosemuligheten?")) return;
      const updated = opps.filter((o) => o.id !== oppId);
      setActiveHub({ ...hub, symbiosisOpportunities: updated });
      if (expandedId === oppId) setExpandedId(null);

      setSaving(oppId);
      setError(null);
      try {
        if (hub.id !== "mock") {
          const { updateActiveHub } = useHubDataStore.getState();
          await updateActiveHub({ symbiosisOpportunities: updated });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Feil ved sletting");
        setActiveHub({ ...hub, symbiosisOpportunities: opps });
      } finally {
        setSaving(null);
      }
    },
    [opps, hub, setActiveHub, expandedId]
  );

  const addOpp = useCallback(async () => {
    const newOpp: SymbiosisOpportunity = {
      id: generateId(),
      title: "Ny symbiosemulighet",
      description: "",
      type: "energy",
      involvedCompanies: [],
      aiConfidence: 0.5,
      dimensions: {
        economicPotential: 0.5,
        environmentalImpact: 0.5,
        technicalFeasibility: 0.5,
        regulatoryReadiness: 0.5,
        marketDemand: 0.5,
        implementationSpeed: 0.5,
      },
      risks: {
        technical: "medium",
        regulatory: "medium",
        financial: "medium",
        operational: "medium",
      },
      estimatedAnnualValueMNOK: 0,
      co2ReductionTonnes: 0,
      status: "identified",
    };

    const updated = [...opps, newOpp];
    setActiveHub({ ...hub, symbiosisOpportunities: updated });
    setExpandedId(newOpp.id);

    setSaving("add");
    setError(null);
    try {
      if (hub.id !== "mock") {
        const { updateActiveHub } = useHubDataStore.getState();
        await updateActiveHub({ symbiosisOpportunities: updated });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Feil ved oppretting");
      setActiveHub({ ...hub, symbiosisOpportunities: opps });
    } finally {
      setSaving(null);
    }
  }, [opps, hub, setActiveHub]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <GlowCard className="p-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/40">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">
            Symbiosemuligheter
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {opps.length} mulighet{opps.length !== 1 ? "er" : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saving === "add" && (
            <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
          )}
          <button
            onClick={addOpp}
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

      {/* Cards list */}
      <div className="p-4 space-y-3">
        <AnimatePresence mode="popLayout">
          {opps.map((opp, idx) => (
            <motion.div
              key={opp.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <SymbiosisCard
                opp={opp}
                index={idx}
                expanded={expandedId === opp.id}
                onToggle={() =>
                  setExpandedId(expandedId === opp.id ? null : opp.id)
                }
                onUpdate={(patch) => updateOpp(opp.id, patch)}
                onDelete={() => deleteOpp(opp.id)}
                saving={saving === opp.id}
                companyOptions={companyOptions}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {opps.length === 0 && (
          <div className="py-12 text-center text-sm text-slate-500">
            Ingen symbiosemuligheter ennå. Klikk "Legg til" for å opprette en.
          </div>
        )}
      </div>
    </GlowCard>
  );
}
