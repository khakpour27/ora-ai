import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { motion } from "motion/react";
import {
  FlaskConical,
  Plus,
  Trash2,
  Copy,
  Lock,
  Thermometer,
  Recycle,
  Flame,
  Brain,
  ShieldCheck,
  Check,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  List,
  BarChart3,
  Settings2,
  Pencil,
  Sparkles,
  Wand2,
  AlertCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";
import { PageContainer } from "@/components/layout";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { useScenarioStore } from "@/stores/scenarioStore";
import { SCENARIO_PRESETS, type ScenarioPreset } from "@/data/scenarioPresets";
import { useHubData } from "@/hooks/useHubData";
import { useResolvedData } from "@/hooks/useResolvedData";
import { computeKPIDeltas } from "@/lib/kpiCalculator";
import { generateScenario, SUGGESTED_GOALS } from "@/lib/scenarioAI";
import type { Scenario, ScenarioMutation } from "@/lib/api";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Thermometer, Recycle, Flame, Brain, ShieldCheck,
};

const ENTITY_LABELS: Record<string, string> = {
  energyFlow: "Energiflyt",
  materialFlow: "Materialflyt",
  company: "Bedrift",
  businessCase: "Forretningscase",
  symbiosisOpportunity: "Symbiose",
};

const TYPE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  add: { bg: "bg-emerald-500/20", text: "text-emerald-400", label: "Legg til" },
  modify: { bg: "bg-amber-500/20", text: "text-amber-400", label: "Endre" },
  delete: { bg: "bg-rose-500/20", text: "text-rose-400", label: "Slett" },
};

const PRESET_COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#64748B"];

const fmt = new Intl.NumberFormat("nb-NO", { maximumFractionDigits: 1 });

type TabId = "mutations" | "kpi" | "details";
const tabs: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "mutations", label: "Mutasjoner", icon: List },
  { id: "kpi", label: "KPI-sammenligning", icon: BarChart3 },
  { id: "details", label: "Detaljer", icon: Settings2 },
];

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function ScenarioLabPage() {
  const [selectedId, setSelectedId] = useState<string>(SCENARIO_PRESETS[0].id);
  const [activeTab, setActiveTab] = useState<TabId>("mutations");
  const [showAIGenerate, setShowAIGenerate] = useState(false);

  const customScenarios = useScenarioStore((s) => s.customScenarios);
  const addCustomScenario = useScenarioStore((s) => s.addCustomScenario);
  const updateCustomScenario = useScenarioStore((s) => s.updateCustomScenario);
  const removeCustomScenario = useScenarioStore((s) => s.removeCustomScenario);
  const activeScenarioId = useScenarioStore((s) => s.activeScenarioId);
  const setActiveScenario = useScenarioStore((s) => s.setActiveScenario);

  const allScenarios: (ScenarioPreset | (Scenario & { icon?: string }))[] = [
    ...SCENARIO_PRESETS,
    ...customScenarios,
  ];
  const selected = allScenarios.find((s) => s.id === selectedId) ?? SCENARIO_PRESETS[0];
  const isPreset = SCENARIO_PRESETS.some((p) => p.id === selected.id);
  const isActive = activeScenarioId === selected.id;

  function handleCreateNew() {
    const id = `custom-${Date.now()}`;
    addCustomScenario({
      id,
      hubId: "demo",
      name: "Nytt scenario",
      description: "",
      color: PRESET_COLORS[customScenarios.length % PRESET_COLORS.length],
      mutations: [],
      createdAt: new Date().toISOString(),
    });
    setSelectedId(id);
    setActiveTab("details");
  }

  function handleDuplicate() {
    const id = `custom-${Date.now()}`;
    addCustomScenario({
      ...selected,
      id,
      name: `${selected.name} (kopi)`,
      createdAt: new Date().toISOString(),
    });
    setSelectedId(id);
  }

  return (
    <PageContainer
      title="Scenario Lab"
      description="Utforsk, tilpass og opprett scenarier for hva-hvis-analyse"
    >
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="flex gap-6 min-h-[600px]"
      >
        {/* Left sidebar — scenario list */}
        <motion.div variants={staggerItem} className="w-72 flex-shrink-0 space-y-2">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider px-1 mb-3">
            Forhåndsdefinerte
          </p>
          {SCENARIO_PRESETS.map((p) => (
            <ScenarioCard
              key={p.id}
              scenario={p}
              isSelected={p.id === selectedId}
              isActive={activeScenarioId === p.id}
              onClick={() => setSelectedId(p.id)}
            />
          ))}

          {customScenarios.length > 0 && (
            <>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider px-1 mt-5 mb-3">
                Egendefinerte
              </p>
              {customScenarios.map((s) => (
                <ScenarioCard
                  key={s.id}
                  scenario={s}
                  isSelected={s.id === selectedId}
                  isActive={activeScenarioId === s.id}
                  onClick={() => setSelectedId(s.id)}
                />
              ))}
            </>
          )}

          <div className="flex gap-2 mt-4">
            <button
              onClick={handleCreateNew}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-dashed border-slate-700 py-2.5 text-sm text-slate-400 hover:border-emerald-600/50 hover:text-emerald-400 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Nytt
            </button>
            <button
              onClick={() => setShowAIGenerate(true)}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-dashed border-violet-700/50 py-2.5 text-sm text-violet-400 hover:border-violet-500/50 hover:text-violet-300 hover:bg-violet-500/5 transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              KI-generer
            </button>
          </div>
        </motion.div>

        {/* Main content */}
        <motion.div variants={staggerItem} className="flex-1 min-w-0 space-y-4">
          {showAIGenerate ? (
            <AIGeneratePanel
              onCreated={(id) => {
                setSelectedId(id);
                setActiveTab("mutations");
                setShowAIGenerate(false);
              }}
              onCancel={() => setShowAIGenerate(false)}
            />
          ) : (
            <>
              {/* Selected scenario header */}
              <div
                className="flex items-center gap-4 rounded-xl border px-5 py-4"
                style={{
                  backgroundColor: `${selected.color}08`,
                  borderColor: `${selected.color}30`,
                }}
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${selected.color}15` }}
                >
                  {(() => {
                    const Icon = ICON_MAP[(selected as ScenarioPreset).icon] ?? FlaskConical;
                    return <Icon className="h-5 w-5" style={{ color: selected.color }} />;
                  })()}
                </div>
                <div className="flex-1 min-w-0">
                  {isPreset ? (
                    <h2 className="text-lg font-semibold text-slate-100">{selected.name}</h2>
                  ) : (
                    <input
                      type="text"
                      value={selected.name}
                      onChange={(e) => updateCustomScenario(selected.id, { name: e.target.value })}
                      className="text-lg font-semibold text-slate-100 bg-transparent border-b border-transparent hover:border-slate-600 focus:border-emerald-500/50 focus:outline-none w-full transition-colors"
                    />
                  )}
                  <p className="text-sm text-slate-400 truncate">{selected.description || "Ingen beskrivelse"}</p>
                </div>
                <div className="flex items-center gap-2">
                  {isPreset && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-700/50 px-2.5 py-1 text-xs text-slate-300">
                      <Lock className="h-3 w-3" /> Forhåndsdefinert
                    </span>
                  )}
                  {!isPreset && (
                    <button
                      onClick={() => {
                        if (window.confirm(`Slette "${selected.name}"?`)) {
                          removeCustomScenario(selected.id);
                          setSelectedId(SCENARIO_PRESETS[0].id);
                        }
                      }}
                      className="rounded-lg p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Slett scenario"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setActiveScenario(isActive ? null : selected.id)}
                    className={cn(
                      "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-emerald-600 text-white hover:bg-emerald-500"
                        : "bg-slate-700 text-slate-200 hover:bg-slate-600"
                    )}
                  >
                    {isActive ? "Aktiv" : "Aktiver"}
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                      activeTab === tab.id
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                    )}
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              {activeTab === "mutations" && (
                <MutationsTab scenario={selected} isPreset={isPreset} />
              )}
              {activeTab === "kpi" && <KPIComparisonTab scenario={selected} />}
              {activeTab === "details" && (
                <DetailsTab
                  scenario={selected}
                  isPreset={isPreset}
                  onDuplicate={handleDuplicate}
                />
              )}
            </>
          )}
        </motion.div>
      </motion.div>
    </PageContainer>
  );
}

// ---------------------------------------------------------------------------
// Scenario Card (left sidebar)
// ---------------------------------------------------------------------------
function ScenarioCard({
  scenario,
  isSelected,
  isActive,
  onClick,
}: {
  scenario: Scenario & { icon?: string };
  isSelected: boolean;
  isActive: boolean;
  onClick: () => void;
}) {
  const Icon = ICON_MAP[(scenario as ScenarioPreset).icon] ?? FlaskConical;
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative w-full text-left rounded-lg border px-3 py-2.5 transition-all duration-150",
        isSelected
          ? "bg-slate-800/80"
          : "bg-slate-800/30 border-slate-700/40 hover:bg-slate-800/50"
      )}
      style={isSelected ? { borderColor: `${scenario.color}50` } : undefined}
    >
      <span
        className="absolute left-0 top-2.5 bottom-2.5 w-0.5 rounded-full"
        style={{ backgroundColor: scenario.color }}
      />
      <div className="flex items-center gap-2.5 pl-1.5">
        <Icon className="h-4 w-4 flex-shrink-0" style={{ color: scenario.color }} />
        <span className="text-sm font-medium text-slate-200 truncate flex-1">
          {scenario.name}
        </span>
        {isActive && (
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500">
            <Check className="h-2.5 w-2.5 text-white" />
          </span>
        )}
        <span className="text-xs text-slate-500">{scenario.mutations.length}</span>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// AI Generate Panel
// ---------------------------------------------------------------------------
const AI_LOADING_VERBS = [
  "Analyserer hubdata...",
  "Kartlegger energistrømmer...",
  "Beregner symbiosemuligheter...",
  "Evaluerer materialflyter...",
  "Optimaliserer forbindelser...",
  "Genererer mutasjoner...",
  "Vurderer CO\u2082-potensial...",
  "Bygger scenario...",
];

function AIGeneratePanel({
  onCreated,
  onCancel,
}: {
  onCreated: (id: string) => void;
  onCancel: () => void;
}) {
  const hub = useHubData();
  const addCustomScenario = useScenarioStore((s) => s.addCustomScenario);
  const customScenarios = useScenarioStore((s) => s.customScenarios);

  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verbIdx, setVerbIdx] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  // Rotate loading verbs
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setVerbIdx((i) => (i + 1) % AI_LOADING_VERBS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [loading]);

  async function handleGenerate() {
    if (!goal.trim()) return;
    setLoading(true);
    setError(null);
    setVerbIdx(0);

    try {
      abortRef.current = new AbortController();
      const result = await generateScenario(hub, goal.trim(), abortRef.current.signal);

      const id = `ai-${Date.now()}`;
      addCustomScenario({
        id,
        hubId: "demo",
        name: result.name,
        description: result.description,
        color: PRESET_COLORS[customScenarios.length % PRESET_COLORS.length],
        mutations: result.mutations,
        createdAt: new Date().toISOString(),
      });
      onCreated(id);
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      const msg = (err as Error).message;
      if (msg === "GEMINI_API_KEY_MISSING") {
        setError("KI-nøkkel mangler. Sett VITE_GEMINI_API_KEY i miljøvariabler.");
      } else {
        setError(msg || "Ukjent feil. Prøv igjen.");
      }
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "w-full px-4 py-3 rounded-lg bg-slate-900/70 border border-slate-600/40 text-sm text-slate-200 focus:outline-none focus:border-violet-500/50 transition-colors placeholder:text-slate-500";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 rounded-xl border border-violet-500/20 bg-violet-500/5 px-5 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/15">
          <Wand2 className="h-5 w-5 text-violet-400" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-slate-100">KI-generert scenario</h2>
          <p className="text-sm text-slate-400">Beskriv målet ditt, og KI-en bygger et scenario med mutasjoner</p>
        </div>
        <button
          onClick={onCancel}
          className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-600 transition-colors"
        >
          Avbryt
        </button>
      </div>

      {/* Suggested goals */}
      <div>
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
          Foreslåtte mål
        </p>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_GOALS.map((g) => (
            <button
              key={g}
              onClick={() => setGoal(g)}
              disabled={loading}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs transition-colors",
                goal === g
                  ? "border-violet-500/50 bg-violet-500/15 text-violet-300"
                  : "border-slate-700/50 bg-slate-800/40 text-slate-400 hover:border-violet-600/30 hover:text-slate-300"
              )}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Custom goal input */}
      <div>
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
          Eller skriv eget mål
        </p>
        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="F.eks. «Reduser energitap med 30% og øk materialresirkulering»"
          rows={2}
          disabled={loading}
          className={cn(inputCls, "resize-none")}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-rose-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-rose-300">{error}</p>
            <button
              onClick={handleGenerate}
              className="mt-2 text-xs text-rose-400 hover:text-rose-300 underline"
            >
              Prøv igjen
            </button>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center gap-3 rounded-xl border border-violet-500/20 bg-violet-500/5 py-8">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-600 border-t-violet-400" />
          <span className="text-sm text-violet-300 animate-pulse">
            {AI_LOADING_VERBS[verbIdx]}
          </span>
        </div>
      )}

      {/* Generate button */}
      {!loading && (
        <button
          onClick={handleGenerate}
          disabled={!goal.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 py-3 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Sparkles className="h-4 w-4" />
          Generer scenario med KI
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 1: Mutations Table
// ---------------------------------------------------------------------------
function MutationsTab({ scenario, isPreset }: { scenario: Scenario; isPreset: boolean }) {
  const base = useHubData();
  const removeCustomMutation = useScenarioStore((s) => s.removeCustomMutation);
  const updateCustomMutation = useScenarioStore((s) => s.updateCustomMutation);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 overflow-hidden">
      {/* Table header */}
      <div className="grid grid-cols-[40px_90px_100px_1fr_120px_120px_60px] gap-2 px-4 py-3 border-b border-slate-700/50 text-xs font-medium text-slate-400 uppercase tracking-wider">
        <span>#</span>
        <span>Handling</span>
        <span>Entitet</span>
        <span>Beskrivelse</span>
        <span>Nåverdi</span>
        <span>Ny verdi</span>
        <span />
      </div>

      {/* Mutation rows */}
      {scenario.mutations.length === 0 && (
        <div className="px-4 py-8 text-center text-sm text-slate-500">
          Ingen mutasjoner i dette scenariet.
        </div>
      )}
      {scenario.mutations.map((m, i) => {
        const style = TYPE_STYLES[m.type];
        const { currentVal, newVal } = resolveMutationValues(m, base);
        const isEditing = editingId === m.id && !isPreset;

        if (isEditing) {
          return (
            <InlineMutationEditor
              key={m.id}
              index={i}
              mutation={m}
              scenarioId={scenario.id}
              currentVal={currentVal}
              onDone={() => setEditingId(null)}
              updateCustomMutation={updateCustomMutation}
            />
          );
        }

        return (
          <div
            key={m.id}
            className="grid grid-cols-[40px_90px_100px_1fr_120px_120px_60px] gap-2 px-4 py-2.5 border-b border-slate-700/30 items-center text-sm hover:bg-slate-800/60 transition-colors"
          >
            <span className="text-xs text-slate-500">{i + 1}</span>
            <span className={cn("inline-flex rounded px-1.5 py-0.5 text-xs font-medium w-fit", style.bg, style.text)}>
              {style.label}
            </span>
            <span className="text-xs text-slate-400">
              {ENTITY_LABELS[m.entity] ?? m.entity}
            </span>
            <span className="text-slate-200 truncate" title={m.description}>
              {m.description}
            </span>
            <span className="text-slate-400 text-xs font-mono">{currentVal}</span>
            <span className="text-slate-200 text-xs font-mono font-medium">{newVal}</span>
            <span className="flex items-center gap-1">
              {isPreset ? (
                <Lock className="h-3 w-3 text-slate-600" />
              ) : (
                <>
                  <button
                    onClick={() => setEditingId(m.id)}
                    className="p-1 rounded text-slate-500 hover:text-emerald-400 hover:bg-slate-700/50 transition-colors"
                    title="Rediger"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => removeCustomMutation(scenario.id, m.id)}
                    className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-700/50 transition-colors"
                    title="Slett"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </>
              )}
            </span>
          </div>
        );
      })}

      {/* Add mutation (custom only) */}
      {!isPreset && (
        <div className="px-4 py-3">
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-emerald-400 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Legg til mutasjon
            </button>
          ) : (
            <AddMutationForm
              scenarioId={scenario.id}
              onDone={() => setShowAddForm(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline Mutation Editor (replaces a row when editing)
// ---------------------------------------------------------------------------
function InlineMutationEditor({
  index,
  mutation,
  scenarioId,
  currentVal,
  onDone,
  updateCustomMutation,
}: {
  index: number;
  mutation: ScenarioMutation;
  scenarioId: string;
  currentVal: string;
  onDone: () => void;
  updateCustomMutation: (scenarioId: string, mutationId: string, data: Partial<ScenarioMutation>) => void;
}) {
  const [desc, setDesc] = useState(mutation.description);
  const [fields, setFields] = useState<Record<string, string>>(() => {
    const result: Record<string, string> = {};
    if (mutation.data) {
      for (const [k, v] of Object.entries(mutation.data)) {
        result[k] = String(v ?? "");
      }
    }
    return result;
  });

  const fieldDefs = ENTITY_FIELD_DEFS[mutation.entity] ?? [];
  const needsData = mutation.type === "add" || mutation.type === "modify";
  const style = TYPE_STYLES[mutation.type];
  const inputCls = "w-full px-2 py-1 rounded bg-slate-900/70 border border-slate-600/40 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors";

  const handleSave = useCallback(() => {
    const data: Record<string, unknown> = {};
    if (needsData) {
      for (const [k, v] of Object.entries(fields)) {
        if (v !== "") data[k] = isNaN(Number(v)) ? v : parseFloat(v);
      }
    }
    updateCustomMutation(scenarioId, mutation.id, {
      description: desc,
      data: needsData ? data : mutation.data,
    });
    onDone();
  }, [desc, fields, needsData, scenarioId, mutation.id, mutation.data, updateCustomMutation, onDone]);

  return (
    <div className="border-b border-slate-700/30 bg-slate-800/80 px-4 py-3 space-y-2">
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-500 w-[40px]">{index + 1}</span>
        <span className={cn("inline-flex rounded px-1.5 py-0.5 text-xs font-medium", style.bg, style.text)}>
          {style.label}
        </span>
        <span className="text-xs text-slate-400">
          {ENTITY_LABELS[mutation.entity] ?? mutation.entity}
        </span>
        <span className="text-xs text-slate-500 font-mono ml-auto">{currentVal}</span>
      </div>

      {/* Description */}
      <div>
        <label className="text-[10px] text-slate-500 uppercase tracking-wider">Beskrivelse</label>
        <input type="text" value={desc} onChange={(e) => setDesc(e.target.value)} className={inputCls} />
      </div>

      {/* Data fields */}
      {needsData && fieldDefs.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {fieldDefs.map((fd) => (
            <div key={fd.key}>
              <label className="text-[10px] text-slate-500 uppercase tracking-wider">{fd.label}</label>
              <input
                type={fd.type === "number" ? "number" : "text"}
                step="any"
                value={fields[fd.key] ?? ""}
                onChange={(e) => setFields((p) => ({ ...p, [fd.key]: e.target.value }))}
                placeholder={fd.placeholder}
                className={inputCls}
              />
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button onClick={handleSave} className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 transition-colors">
          Lagre
        </button>
        <button onClick={onDone} className="rounded bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-600 transition-colors">
          Avbryt
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Add Mutation Form (inline, for custom scenarios)
// ---------------------------------------------------------------------------
type MutEntity = ScenarioMutation["entity"];
type MutType = ScenarioMutation["type"];

function AddMutationForm({ scenarioId, onDone }: { scenarioId: string; onDone: () => void }) {
  const addCustomMutation = useScenarioStore((s) => s.addCustomMutation);
  const base = useHubData();
  const [entity, setEntity] = useState<MutEntity>("energyFlow");
  const [mutType, setMutType] = useState<MutType>("modify");
  const [entityId, setEntityId] = useState("");
  const [desc, setDesc] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});

  const existingEntities = useMemo(() => {
    switch (entity) {
      case "energyFlow":
        return base.energyFlows.map((f, i) => ({ id: String(i), label: `${f.source} → ${f.target} (${f.value} GWh)` }));
      case "materialFlow":
        return base.materialFlows.map((f) => ({ id: f.id, label: `${f.source} → ${f.target} (${f.material})` }));
      case "symbiosisOpportunity":
        return base.symbiosisOpportunities.map((s) => ({ id: s.id, label: s.title }));
      case "businessCase":
        return base.businessCases.map((b) => ({ id: b.symbiosisId, label: b.title }));
      default:
        return [];
    }
  }, [entity, base]);

  const needsEntityId = mutType === "modify" || mutType === "delete";
  const needsData = mutType === "add" || mutType === "modify";

  function handleSubmit() {
    const data: Record<string, unknown> = {};
    if (needsData) {
      for (const [k, v] of Object.entries(fields)) {
        if (v !== "") data[k] = isNaN(Number(v)) ? v : parseFloat(v);
      }
    }
    const autoDesc = desc.trim() || `${TYPE_STYLES[mutType].label} ${ENTITY_LABELS[entity]}${entityId ? ` (${entityId})` : ""}`;
    addCustomMutation(scenarioId, {
      id: `mut-${Date.now()}`,
      type: mutType,
      entity,
      entityId: needsEntityId ? entityId : undefined,
      data: needsData ? data : undefined,
      description: autoDesc,
    });
    onDone();
  }

  const fieldDefs = ENTITY_FIELD_DEFS[entity] ?? [];
  const inputCls = "w-full px-2 py-1.5 rounded bg-slate-900/70 border border-slate-600/40 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors";

  return (
    <div className="space-y-3 rounded-lg border border-slate-700/50 bg-slate-800/60 p-4">
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-xs text-slate-400 mb-1 block">Entitet</label>
          <select value={entity} onChange={(e) => { setEntity(e.target.value as MutEntity); setEntityId(""); setFields({}); }} className={inputCls}>
            {Object.entries(ENTITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="text-xs text-slate-400 mb-1 block">Handling</label>
          <div className="flex gap-1">
            {(["add", "modify", "delete"] as MutType[]).map((t) => (
              <button
                key={t}
                onClick={() => { setMutType(t); setEntityId(""); }}
                className={cn(
                  "flex-1 rounded py-1.5 text-xs font-medium transition-colors",
                  mutType === t
                    ? cn(TYPE_STYLES[t].bg, TYPE_STYLES[t].text, "border", `border-current/30`)
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                )}
              >
                {TYPE_STYLES[t].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {needsEntityId && (
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Velg {ENTITY_LABELS[entity].toLowerCase()}</label>
          <select value={entityId} onChange={(e) => setEntityId(e.target.value)} className={inputCls}>
            <option value="">— Velg —</option>
            {existingEntities.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}
          </select>
        </div>
      )}

      {needsData && (
        <div className="grid grid-cols-2 gap-2">
          {fieldDefs.map((fd) => (
            <div key={fd.key}>
              <label className="text-xs text-slate-400 mb-1 block">{fd.label}</label>
              <input
                type={fd.type === "number" ? "number" : "text"}
                step="any"
                value={fields[fd.key] ?? ""}
                onChange={(e) => setFields((p) => ({ ...p, [fd.key]: e.target.value }))}
                placeholder={fd.placeholder}
                className={inputCls}
              />
            </div>
          ))}
        </div>
      )}

      <div>
        <label className="text-xs text-slate-400 mb-1 block">Beskrivelse (valgfri)</label>
        <input type="text" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Auto-generert..." className={inputCls} />
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={needsEntityId && !entityId}
          className="flex-1 rounded-md bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-40 transition-colors"
        >
          Legg til
        </button>
        <button onClick={onDone} className="flex-1 rounded-md bg-slate-700 py-2 text-sm font-medium text-slate-300 hover:bg-slate-600 transition-colors">
          Avbryt
        </button>
      </div>
    </div>
  );
}

const ENTITY_FIELD_DEFS: Record<string, { key: string; label: string; type: string; placeholder?: string }[]> = {
  energyFlow: [
    { key: "source", label: "Fra", type: "text", placeholder: "f.eks. fjernvarme" },
    { key: "target", label: "Til", type: "text", placeholder: "f.eks. storvik" },
    { key: "value", label: "Verdi (GWh)", type: "number" },
    { key: "status", label: "Status", type: "text", placeholder: "existing/potential/planned" },
  ],
  materialFlow: [
    { key: "source", label: "Fra", type: "text" },
    { key: "target", label: "Til", type: "text" },
    { key: "material", label: "Materiale", type: "text" },
    { key: "volumeTonnesPerYear", label: "Volum (t/år)", type: "number" },
  ],
  symbiosisOpportunity: [
    { key: "estimatedAnnualValueMNOK", label: "Verdi (MNOK/år)", type: "number" },
    { key: "co2ReductionTonnes", label: "CO₂ (tonn)", type: "number" },
    { key: "status", label: "Status", type: "text", placeholder: "identified/validated/prioritized" },
    { key: "aiConfidence", label: "KI-konfidens (0-1)", type: "number" },
  ],
  businessCase: [
    { key: "npvMNOK", label: "NPV – netto nåverdi (MNOK)", type: "number" },
    { key: "irr", label: "IRR – internrente (0-1)", type: "number" },
    { key: "investmentMNOK", label: "Investering (MNOK)", type: "number" },
    { key: "paybackYears", label: "Tilbakebetaling (år)", type: "number" },
  ],
  company: [
    { key: "name", label: "Navn", type: "text" },
    { key: "annualEnergyGWh", label: "Energi (GWh)", type: "number" },
    { key: "annualWasteTonnes", label: "Avfall (t)", type: "number" },
    { key: "employeeCount", label: "Ansatte", type: "number" },
  ],
};

// ---------------------------------------------------------------------------
// Tab 2: KPI Comparison
// ---------------------------------------------------------------------------
function KPIComparisonTab({ scenario }: { scenario: Scenario }) {
  const base = useHubData();
  const resolved = useResolvedData();
  const activeScenarioId = useScenarioStore((s) => s.activeScenarioId);

  // If this scenario is active, use resolved data; otherwise compute manually
  const isThisActive = activeScenarioId === scenario.id;

  const deltas = useMemo(() => {
    if (!isThisActive) return [];
    return computeKPIDeltas(base, resolved);
  }, [base, resolved, isThisActive]);

  const chartData = useMemo(() => {
    if (!isThisActive) return [];
    return deltas.map((d) => ({
      name: d.label.replace("Energibesparingspotensial", "Energi").replace("Symbiosemuligheter", "Symbioser").replace("Materialutnyttelse", "Material %"),
      Base: d.baseValue,
      Scenario: d.scenarioValue,
      delta: d.delta,
      unit: d.unit,
    }));
  }, [deltas, isThisActive]);

  if (!isThisActive) {
    return (
      <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-8 text-center space-y-3">
        <BarChart3 className="h-10 w-10 text-slate-600 mx-auto" />
        <p className="text-sm text-slate-400">
          Aktiver dette scenariet for å se KPI-sammenligning.
        </p>
        <p className="text-xs text-slate-500">
          Klikk &quot;Aktiver&quot;-knappen ovenfor.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* KPI delta cards */}
      <div className="grid grid-cols-4 gap-3">
        {deltas.map((d) => {
          const isPositive = d.delta > 0;
          const isGood = isPositive;
          return (
            <div
              key={d.id}
              className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-4 space-y-2"
            >
              <p className="text-xs text-slate-400">{d.label}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-slate-300 font-mono">
                  {fmt.format(d.baseValue)}
                </span>
                <ArrowRight className="h-3 w-3 text-slate-500 flex-shrink-0" />
                <span className="text-lg font-bold text-slate-100 font-mono">
                  {fmt.format(d.scenarioValue)}
                </span>
              </div>
              {d.delta !== 0 && (
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium",
                    isGood ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"
                  )}
                >
                  {isPositive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                  {isPositive ? "+" : ""}{fmt.format(d.delta)}{d.unit ? ` ${d.unit}` : ""}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Comparison bar chart */}
      {chartData.length > 0 && (
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-4">
            Base vs. Scenario
          </p>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barGap={4}>
                <XAxis dataKey="name" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1E293B", border: "1px solid #334155", borderRadius: "8px" }}
                  labelStyle={{ color: "#E2E8F0" }}
                  itemStyle={{ color: "#CBD5E1" }}
                />
                <Bar dataKey="Base" fill="#475569" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Scenario" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 3: Details
// ---------------------------------------------------------------------------
function DetailsTab({
  scenario,
  isPreset,
  onDuplicate,
}: {
  scenario: Scenario;
  isPreset: boolean;
  onDuplicate: () => void;
}) {
  const updateCustomScenario = useScenarioStore((s) => s.updateCustomScenario);
  const removeCustomScenario = useScenarioStore((s) => s.removeCustomScenario);

  const inputCls = "w-full px-3 py-2 rounded-lg bg-slate-900/70 border border-slate-600/40 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors";

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-6 space-y-5 max-w-xl">
      <div>
        <label className="text-xs text-slate-400 mb-1 block">Navn</label>
        {isPreset ? (
          <p className="text-sm text-slate-200">{scenario.name}</p>
        ) : (
          <input
            type="text"
            value={scenario.name}
            onChange={(e) => updateCustomScenario(scenario.id, { name: e.target.value })}
            className={inputCls}
          />
        )}
      </div>

      <div>
        <label className="text-xs text-slate-400 mb-1 block">Beskrivelse</label>
        {isPreset ? (
          <p className="text-sm text-slate-300">{scenario.description || "—"}</p>
        ) : (
          <textarea
            value={scenario.description}
            onChange={(e) => updateCustomScenario(scenario.id, { description: e.target.value })}
            rows={3}
            className={cn(inputCls, "resize-none")}
          />
        )}
      </div>

      <div>
        <label className="text-xs text-slate-400 mb-2 block">Farge</label>
        {isPreset ? (
          <div className="flex items-center gap-2">
            <span className="h-5 w-5 rounded-full" style={{ backgroundColor: scenario.color }} />
            <span className="text-xs text-slate-400 font-mono">{scenario.color}</span>
          </div>
        ) : (
          <div className="flex gap-2">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => updateCustomScenario(scenario.id, { color: c })}
                className={cn(
                  "h-7 w-7 rounded-full border-2 transition-transform hover:scale-110",
                  scenario.color === c ? "border-white scale-110" : "border-transparent"
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="text-xs text-slate-400 mb-1 block">Opprettet</label>
        <p className="text-sm text-slate-300">
          {new Date(scenario.createdAt).toLocaleDateString("nb-NO", { year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={onDuplicate}
          className="flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-600 transition-colors"
        >
          <Copy className="h-4 w-4" />
          Dupliser{isPreset ? " som egendefinert" : ""}
        </button>
        {!isPreset && (
          <button
            onClick={() => {
              if (window.confirm(`Slette "${scenario.name}"?`)) {
                removeCustomScenario(scenario.id);
              }
            }}
            className="flex items-center gap-2 rounded-lg bg-rose-500/10 px-4 py-2.5 text-sm font-medium text-rose-400 hover:bg-rose-500/20 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Slett
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Resolve current and new values for a mutation row. */
function resolveMutationValues(
  m: ScenarioMutation,
  base: ReturnType<typeof useHubData>
): { currentVal: string; newVal: string } {
  if (m.type === "add") {
    const primary = getPrimaryValue(m);
    return { currentVal: "—", newVal: primary };
  }

  if (m.type === "delete") {
    const label = resolveEntityLabel(m, base);
    return { currentVal: label, newVal: "—" };
  }

  // modify
  const current = resolveCurrentValue(m, base);
  const newV = getPrimaryValue(m);
  return { currentVal: current, newVal: newV };
}

function resolveCurrentValue(m: ScenarioMutation, base: ReturnType<typeof useHubData>): string {
  if (!m.entityId) return "—";

  switch (m.entity) {
    case "energyFlow": {
      const idx = parseInt(m.entityId, 10);
      const flow = base.energyFlows[idx];
      if (!flow) return `#${m.entityId}`;
      // Show the field that's being changed
      if (m.data?.value != null) return `${flow.value} GWh`;
      if (m.data?.status != null) return flow.status;
      return `${flow.source}→${flow.target}`;
    }
    case "materialFlow": {
      const flow = base.materialFlows.find((f) => f.id === m.entityId);
      if (!flow) return m.entityId;
      if (m.data?.volumeTonnesPerYear != null) return `${fmt.format(flow.volumeTonnesPerYear)} t/år`;
      if (m.data?.status != null) return flow.status;
      return `${flow.source}→${flow.target}`;
    }
    case "symbiosisOpportunity": {
      const sym = base.symbiosisOpportunities.find((s) => s.id === m.entityId);
      if (!sym) return m.entityId;
      if (m.data?.estimatedAnnualValueMNOK != null) return `${fmt.format(sym.estimatedAnnualValueMNOK)} MNOK`;
      if (m.data?.co2ReductionTonnes != null) return `${fmt.format(sym.co2ReductionTonnes)} t CO₂`;
      if (m.data?.status != null) return sym.status;
      if (m.data?.aiConfidence != null) return `${Math.round(sym.aiConfidence * 100)}%`;
      return sym.title;
    }
    case "businessCase": {
      const bc = base.businessCases.find((b) => b.symbiosisId === m.entityId);
      if (!bc) return m.entityId;
      if (m.data?.npvMNOK != null) return `${fmt.format(bc.npvMNOK)} MNOK`;
      if (m.data?.irr != null) return `${Math.round(bc.irr * 100)}% IRR`;
      if (m.data?.investmentMNOK != null) return `${fmt.format(bc.investmentMNOK)} MNOK`;
      return bc.title;
    }
    default:
      return "—";
  }
}

function getPrimaryValue(m: ScenarioMutation): string {
  if (!m.data) return "—";
  const d = m.data;
  if (d.value != null) return `${d.value} GWh`;
  if (d.volumeTonnesPerYear != null) return `${fmt.format(d.volumeTonnesPerYear as number)} t/år`;
  if (d.estimatedAnnualValueMNOK != null) return `${d.estimatedAnnualValueMNOK} MNOK`;
  if (d.co2ReductionTonnes != null) return `${fmt.format(d.co2ReductionTonnes as number)} t CO₂`;
  if (d.npvMNOK != null) return `${d.npvMNOK} MNOK`;
  if (d.irr != null) return `${Math.round((d.irr as number) * 100)}% IRR`;
  if (d.investmentMNOK != null) return `${d.investmentMNOK} MNOK`;
  if (d.status != null) return String(d.status);
  if (d.aiConfidence != null) return `${Math.round((d.aiConfidence as number) * 100)}%`;
  // For add flows, show source→target
  if (d.source && d.target) return `${d.source}→${d.target}`;
  return "—";
}

function resolveEntityLabel(m: ScenarioMutation, base: ReturnType<typeof useHubData>): string {
  if (!m.entityId) return "—";
  switch (m.entity) {
    case "energyFlow": {
      const idx = parseInt(m.entityId, 10);
      const flow = base.energyFlows[idx];
      return flow ? `${flow.source}→${flow.target} (${flow.value} GWh)` : `#${m.entityId}`;
    }
    case "materialFlow": {
      const f = base.materialFlows.find((f) => f.id === m.entityId);
      return f ? `${f.material} (${fmt.format(f.volumeTonnesPerYear)} t/år)` : m.entityId;
    }
    case "symbiosisOpportunity": {
      const s = base.symbiosisOpportunities.find((s) => s.id === m.entityId);
      return s ? s.title : m.entityId;
    }
    case "businessCase": {
      const b = base.businessCases.find((b) => b.symbiosisId === m.entityId);
      return b ? b.title : m.entityId;
    }
    default:
      return m.entityId;
  }
}
