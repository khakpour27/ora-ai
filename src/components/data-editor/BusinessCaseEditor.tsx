import { useState, useCallback } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useHubData } from "@/hooks/useHubData";
import { useHubDataStore } from "@/stores/hubDataStore";
import type { BusinessCase } from "@/types";

export function BusinessCaseEditor() {
  const hub = useHubData();
  const setActiveHub = useHubDataStore((s) => s.setActiveHub);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const cases = hub.businessCases;
  const symbioses = hub.symbiosisOpportunities;

  const updateCase = useCallback(
    (idx: number, updates: Partial<BusinessCase>) => {
      const updated = [...cases];
      updated[idx] = { ...updated[idx], ...updates };
      setActiveHub({ ...hub, businessCases: updated });
    },
    [cases, hub, setActiveHub]
  );

  const deleteCase = useCallback(
    (idx: number) => {
      if (!window.confirm("Slett denne forretningscasen?")) return;
      const updated = cases.filter((_, i) => i !== idx);
      setActiveHub({ ...hub, businessCases: updated });
    },
    [cases, hub, setActiveHub]
  );

  const addCase = useCallback(() => {
    const newCase: BusinessCase = {
      symbiosisId: symbioses[0]?.id ?? "",
      title: "Ny forretningscase",
      npvMNOK: 0,
      irr: 0,
      paybackYears: 0,
      investmentMNOK: 0,
      annualRevenueMNOK: 0,
      annualCostSavingMNOK: 0,
      timeline: [],
      fundingOpportunities: [],
    };
    setActiveHub({ ...hub, businessCases: [...cases, newCase] });
    setExpandedId(`new-${cases.length}`);
  }, [cases, hub, symbioses, setActiveHub]);

  if (hub.id === "mock") {
    return (
      <div className="text-center py-8 text-slate-500 text-sm">
        <p>Demo-data kan ikke redigeres.</p>
        <p className="text-xs mt-1">Opprett eller last en hub fra API-et for å redigere.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">
          {cases.length} forretningscase{cases.length !== 1 ? "r" : ""}
        </p>
        <button
          onClick={addCase}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Legg til
        </button>
      </div>


      <AnimatePresence mode="popLayout">
        {cases.map((bc, idx) => {
          const key = bc.symbiosisId || `case-${idx}`;
          const isExpanded = expandedId === key;

          return (
            <motion.div
              key={key}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="rounded-lg border border-slate-700/40 bg-slate-800/30 overflow-hidden"
            >
              {/* Header */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : key)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700/20 transition-colors"
              >
                <div className="flex-1 text-left">
                  <p className="text-sm text-slate-200 font-medium">{bc.title}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                    <span>Investering: {bc.investmentMNOK} MNOK</span>
                    <span>IRR: {(bc.irr * 100).toFixed(0)}%</span>
                    <span>NPV: {bc.npvMNOK} MNOK</span>
                    <span>Tilbakebetaling: {bc.paybackYears} år</span>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-slate-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                )}
              </button>

              {/* Expanded form */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-slate-700/40"
                  >
                    <div className="p-4 space-y-4">
                      {/* Basic fields */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] text-slate-500 uppercase tracking-wider">Tittel</label>
                          <input
                            value={bc.title}
                            onChange={(e) => updateCase(idx, { title: e.target.value })}
                            className="w-full mt-1 px-3 py-1.5 rounded bg-slate-800/60 border border-slate-600/50 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-500 uppercase tracking-wider">Symbiose</label>
                          <select
                            value={bc.symbiosisId}
                            onChange={(e) => updateCase(idx, { symbiosisId: e.target.value })}
                            className="w-full mt-1 px-3 py-1.5 rounded bg-slate-800/60 border border-slate-600/50 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
                          >
                            <option value="">Velg symbiose...</option>
                            {symbioses.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.title}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Financial metrics */}
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { label: "Investering (MNOK)", key: "investmentMNOK" as const, val: bc.investmentMNOK },
                          { label: "NPV – netto nåverdi (MNOK)", key: "npvMNOK" as const, val: bc.npvMNOK },
                          { label: "IRR – internrente", key: "irr" as const, val: bc.irr, pct: true },
                          { label: "Tilbakebetaling (år)", key: "paybackYears" as const, val: bc.paybackYears },
                          { label: "Årlig inntekt (MNOK)", key: "annualRevenueMNOK" as const, val: bc.annualRevenueMNOK },
                          { label: "Årlig besparelse (MNOK)", key: "annualCostSavingMNOK" as const, val: bc.annualCostSavingMNOK },
                        ].map(({ label, key, val, pct }) => (
                          <div key={key}>
                            <label className="text-[11px] text-slate-500 uppercase tracking-wider">{label}</label>
                            <input
                              type="number"
                              step={pct ? "0.01" : "0.1"}
                              value={pct ? (val * 100).toFixed(1) : val}
                              onChange={(e) => {
                                const v = parseFloat(e.target.value) || 0;
                                updateCase(idx, { [key]: pct ? v / 100 : v });
                              }}
                              className="w-full mt-1 px-3 py-1.5 rounded bg-slate-800/60 border border-slate-600/50 text-sm text-slate-200 font-mono focus:outline-none focus:border-emerald-500/50"
                            />
                          </div>
                        ))}
                      </div>

                      {/* Delete button */}
                      <div className="flex justify-end pt-2 border-t border-slate-700/30">
                        <button
                          onClick={() => deleteCase(idx)}
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
            </motion.div>
          );
        })}
      </AnimatePresence>

      {cases.length === 0 && (
        <div className="text-center py-8 text-slate-500 text-sm">
          Ingen forretningscaser ennå. Klikk "Legg til" for å opprette en.
        </div>
      )}
    </div>
  );
}
