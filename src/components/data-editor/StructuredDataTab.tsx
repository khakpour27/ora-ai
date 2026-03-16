import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { GlowCard, SectionHeader } from "@/components/shared";
import { useHubDataStore } from "@/stores/hubDataStore";
import {
  Building2,
  Zap,
  Recycle,
  Handshake,
  BarChart3,
  Plus,
  ChevronDown,
} from "lucide-react";

import { CompanyEditor } from "./CompanyEditor";
import { EnergyFlowEditor } from "./EnergyFlowEditor";
import { MaterialFlowEditor } from "./MaterialFlowEditor";
import { SymbiosisEditor } from "./SymbiosisEditor";
import { BusinessCaseEditor } from "./BusinessCaseEditor";

// ---------------------------------------------------------------------------
// Sub-tab definitions
// ---------------------------------------------------------------------------

type SubTabId =
  | "aktorer"
  | "energistromme"
  | "materialstromme"
  | "symbiosemuligheter"
  | "forretningscaser";

const subTabs: {
  id: SubTabId;
  label: string;
  icon: typeof Building2;
}[] = [
  { id: "aktorer", label: "Aktører", icon: Building2 },
  { id: "energistromme", label: "Energistrømmer", icon: Zap },
  { id: "materialstromme", label: "Materialstrømmer", icon: Recycle },
  { id: "symbiosemuligheter", label: "Symbiosemuligheter", icon: Handshake },
  { id: "forretningscaser", label: "Forretningscaser", icon: BarChart3 },
];

// ---------------------------------------------------------------------------
// Hub Selector
// ---------------------------------------------------------------------------

function HubSelector() {
  const hubList = useHubDataStore((s) => s.hubList);
  const activeHub = useHubDataStore((s) => s.activeHub);
  const loading = useHubDataStore((s) => s.loading);
  const fetchHubList = useHubDataStore((s) => s.fetchHubList);
  const createHub = useHubDataStore((s) => s.createHub);

  const [open, setOpen] = useState(false);
  const [creatingNew, setCreatingNew] = useState(false);
  const [newHubName, setNewHubName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const newHubInputRef = useRef<HTMLInputElement>(null);

  // Fetch hub list on mount
  useEffect(() => {
    fetchHubList();
  }, [fetchHubList]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Focus input when creating new
  useEffect(() => {
    if (creatingNew) {
      newHubInputRef.current?.focus();
    }
  }, [creatingNew]);

  const handleSelectHub = (hubId: string) => {
    useHubDataStore.getState().loadHub(hubId);
    setOpen(false);
  };

  const handleCreateHub = async () => {
    const name = newHubName.trim();
    if (!name) return;
    setCreating(true);
    setCreateError(null);
    try {
      await createHub(name);
      setNewHubName("");
      setCreatingNew(false);
      setOpen(false);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Feil ved oppretting");
    } finally {
      setCreating(false);
    }
  };

  const activeLabel = activeHub?.name ?? "Velg hub…";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
          "bg-slate-800/60 border border-slate-700/50 text-slate-200",
          "hover:border-emerald-500/40 hover:bg-slate-800/80",
          open && "border-emerald-500/50 bg-slate-800/80"
        )}
      >
        <Building2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        <span className="max-w-[200px] truncate">{activeLabel}</span>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-slate-400 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute left-0 top-full mt-2 z-50 min-w-[240px]",
              "rounded-xl border border-slate-700/60 bg-slate-900/95 backdrop-blur-xl shadow-2xl overflow-hidden"
            )}
          >
            {/* Existing hubs */}
            {hubList.length === 0 && !loading && (
              <div className="px-4 py-3 text-xs text-slate-500">
                Ingen huber tilgjengelig
              </div>
            )}
            {loading && (
              <div className="px-4 py-3 text-xs text-slate-500">
                Laster huber…
              </div>
            )}
            {hubList.map((hub) => (
              <button
                key={hub.id}
                onClick={() => handleSelectHub(hub.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors duration-150",
                  activeHub?.id === hub.id
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "text-slate-300 hover:bg-slate-700/50 hover:text-slate-100"
                )}
              >
                <Building2 className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
                <span className="flex-1 truncate">{hub.name}</span>
                {activeHub?.id === hub.id && (
                  <span className="text-[10px] text-emerald-500/80 font-medium uppercase tracking-wide">
                    Aktiv
                  </span>
                )}
              </button>
            ))}

            {/* Divider */}
            <div className="border-t border-slate-700/50 my-1" />

            {/* Create new hub */}
            {!creatingNew ? (
              <button
                onClick={() => setCreatingNew(true)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors duration-150"
              >
                <Plus className="w-3.5 h-3.5 flex-shrink-0" />
                Opprett ny hub
              </button>
            ) : (
              <div className="px-3 py-2.5 space-y-2">
                <input
                  ref={newHubInputRef}
                  type="text"
                  value={newHubName}
                  onChange={(e) => setNewHubName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateHub();
                    if (e.key === "Escape") {
                      setCreatingNew(false);
                      setNewHubName("");
                      setCreateError(null);
                    }
                  }}
                  placeholder="Navn på ny hub…"
                  className={cn(
                    "w-full px-3 py-2 rounded-lg text-sm bg-slate-800/80 border border-slate-600/60",
                    "text-slate-200 placeholder-slate-500",
                    "focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/20"
                  )}
                />
                {createError && (
                  <p className="text-xs text-rose-400">{createError}</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateHub}
                    disabled={!newHubName.trim() || creating}
                    className={cn(
                      "flex-1 py-1.5 rounded-lg text-xs font-medium transition-all duration-150",
                      newHubName.trim() && !creating
                        ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                        : "bg-slate-700/30 text-slate-600 cursor-not-allowed"
                    )}
                  >
                    {creating ? "Oppretter…" : "Opprett"}
                  </button>
                  <button
                    onClick={() => {
                      setCreatingNew(false);
                      setNewHubName("");
                      setCreateError(null);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-700/40 transition-colors"
                  >
                    Avbryt
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center mb-5">
        <Building2 className="w-8 h-8 text-slate-600" />
      </div>
      <h3 className="text-base font-semibold text-slate-300 mb-2">
        Ingen hub lastet
      </h3>
      <p className="text-sm text-slate-500 max-w-sm">
        Velg en eksisterende hub fra nedtrekksmenyen ovenfor, eller opprett en
        ny for å begynne å redigere strukturerte data.
      </p>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function StructuredDataTab() {
  const [activeSubTab, setActiveSubTab] = useState<SubTabId>("aktorer");
  const activeHub = useHubDataStore((s) => s.activeHub);

  return (
    <div className="space-y-6">
      {/* Header row: title + hub selector */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <SectionHeader
          title="Strukturerte data"
          description="Rediger hubens aktører, strømmer og analyser direkte"
        />
        <HubSelector />
      </div>

      {/* Sub-tab navigation */}
      <div className="flex items-center gap-2 flex-wrap">
        {subTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              disabled={!activeHub}
              className={cn(
                "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5",
                !activeHub && "opacity-40 cursor-not-allowed pointer-events-none"
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content area */}
      {!activeHub ? (
        <GlowCard className="p-6">
          <EmptyState />
        </GlowCard>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSubTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {activeSubTab === "aktorer" && <CompanyEditor />}
            {activeSubTab === "energistromme" && <EnergyFlowEditor />}
            {activeSubTab === "materialstromme" && (
              <MaterialFlowEditor />
            )}
            {activeSubTab === "symbiosemuligheter" && (
              <SymbiosisEditor />
            )}
            {activeSubTab === "forretningscaser" && (
              <BusinessCaseEditor />
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
