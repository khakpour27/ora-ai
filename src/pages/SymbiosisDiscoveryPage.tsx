import { useState, useEffect, useMemo, useRef } from "react";
import { motion } from "motion/react";
import { ResponsiveRadar } from "@nivo/radar";
import {
  Zap,
  Recycle,
  Building2,
  Wrench,
  Leaf,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  DollarSign,
  Settings,
} from "lucide-react";
import { PageContainer } from "@/components/layout";
import {
  AIConfidenceBadge,
  CompanyAvatar,
  GlowCard,
  ProvenanceBadge,
  ChartExportMenu,
} from "@/components/shared";
import { AIProcessingOverlay } from "@/components/demo";
import { TypewriterText } from "@/components/demo";
import { useResolvedData } from "@/hooks/useResolvedData";
import { useAnalysisStore } from "@/stores/analysisStore";
import { theme } from "@/lib/theme";
import { cn, formatNumber } from "@/lib/utils";
import {
  staggerContainer,
  staggerItem,
  chartReveal,
} from "@/lib/animations";
import type { SymbiosisOpportunity } from "@/types";

// ---------------------------------------------------------------------------
// Type badge helpers
// ---------------------------------------------------------------------------

const typeMeta: Record<
  SymbiosisOpportunity["type"],
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string }
> = {
  energy: {
    label: "Energi",
    icon: Zap,
    color: "text-amber-400",
    bg: "bg-amber-500/15 border-amber-500/30",
  },
  material: {
    label: "Material",
    icon: Recycle,
    color: "text-emerald-400",
    bg: "bg-emerald-500/15 border-emerald-500/30",
  },
  infrastructure: {
    label: "Infrastruktur",
    icon: Building2,
    color: "text-violet-400",
    bg: "bg-violet-500/15 border-violet-500/30",
  },
  service: {
    label: "Tjeneste",
    icon: Wrench,
    color: "text-sky-400",
    bg: "bg-sky-500/15 border-sky-500/30",
  },
};

const statusLabels: Record<SymbiosisOpportunity["status"], { label: string; color: string }> = {
  identified: { label: "Identifisert", color: "bg-slate-500/20 text-slate-300 border-slate-500/30" },
  validated: { label: "Validert", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  prioritized: { label: "Prioritert", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
};

const riskColors: Record<string, string> = {
  low: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  high: "bg-red-500/20 text-red-400 border-red-500/30",
};

const riskLabels: Record<string, string> = {
  low: "Lav",
  medium: "Middels",
  high: "Hoy",
};

// ---------------------------------------------------------------------------
// Radar chart data builder
// ---------------------------------------------------------------------------

const dimensionLabels: Record<string, string> = {
  economicPotential: "Okonomi",
  environmentalImpact: "Miljo",
  technicalFeasibility: "Teknisk",
  regulatoryReadiness: "Regulatorisk",
  marketDemand: "Marked",
  implementationSpeed: "Hastighet",
};

function buildRadarData(opp: SymbiosisOpportunity) {
  return Object.entries(dimensionLabels).map(([key, label]) => ({
    dimension: label,
    [opp.id]: opp.dimensions[key as keyof typeof opp.dimensions],
  }));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SymbiosisDiscoveryPage() {
  const hub = useResolvedData();
  const { symbiosisOpportunities } = hub;
  const alreadyRun = useAnalysisStore((s) => s.hasCompleted("symbiose"));
  const completeAnalysis = useAnalysisStore((s) => s.completeAnalysis);
  const [showOverlay, setShowOverlay] = useState(!alreadyRun);
  const [selectedId, setSelectedId] = useState<string>(
    symbiosisOpportunities[0]?.id ?? ""
  );

  // Sort opportunities by aiConfidence descending
  const sorted = useMemo(
    () =>
      [...symbiosisOpportunities].sort(
        (a, b) => b.aiConfidence - a.aiConfidence
      ),
    [symbiosisOpportunities]
  );

  const selected = useMemo(
    () => sorted.find((o) => o.id === selectedId) ?? sorted[0],
    [sorted, selectedId]
  );

  // Auto-hide overlay after 3 seconds (only on first visit)
  useEffect(() => {
    if (!showOverlay) return;
    const timer = setTimeout(() => {
      setShowOverlay(false);
      completeAnalysis("symbiose");
    }, 3000);
    return () => clearTimeout(timer);
  }, [showOverlay, completeAnalysis]);

  const radarData = useMemo(() => buildRadarData(selected), [selected]);
  const radarRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <AIProcessingOverlay
        isVisible={showOverlay}
        onComplete={() => { setShowOverlay(false); completeAnalysis("symbiose"); }}
      />

      <PageContainer
        title="KI Symbioseidentifisering"
        description="Maskinlaeringsbasert identifisering av industrielle symbioser"
      >
        {!showOverlay && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ---- Left column: opportunity cards ---- */}
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="lg:col-span-2"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {sorted.map((opp) => {
                  const meta = typeMeta[opp.type];
                  const Icon = meta.icon;
                  const isSelected = opp.id === selected.id;
                  const status = statusLabels[opp.status];

                  return (
                    <motion.div key={opp.id} variants={staggerItem}>
                      <GlowCard
                        glowing={opp.aiConfidence > 0.85}
                        className={cn(
                          "cursor-pointer transition-all hover:border-white/20",
                          isSelected && "ring-1 ring-emerald-500/40 border-emerald-500/30"
                        )}
                      >
                        <div
                          onClick={() => setSelectedId(opp.id)}
                          className="space-y-3"
                        >
                          {/* Title */}
                          <h3 className="text-sm font-bold text-slate-100 leading-snug">
                            {opp.title}
                          </h3>

                          {/* Badges row */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
                                meta.bg,
                                meta.color
                              )}
                            >
                              <Icon className="h-3 w-3" />
                              {meta.label}
                            </span>
                            <AIConfidenceBadge
                              confidence={opp.aiConfidence}
                              size="sm"
                            />
                            {opp.provenance && <ProvenanceBadge provenance={opp.provenance} />}
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
                                status.color
                              )}
                            >
                              {status.label}
                            </span>
                          </div>

                          {/* Description (truncated) */}
                          <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                            {opp.description.slice(0, 100)}
                            {opp.description.length > 100 ? "..." : ""}
                          </p>

                          {/* Companies */}
                          <div className="flex flex-wrap gap-3">
                            {opp.involvedCompanies.map((cId) => (
                              <CompanyAvatar
                                key={cId}
                                companyId={cId}
                                size="sm"
                              />
                            ))}
                          </div>

                          {/* Value & CO2 */}
                          <div className="flex items-center gap-4 pt-1">
                            <span className="inline-flex items-center gap-1 text-xs text-slate-300">
                              <TrendingUp className="h-3 w-3 text-emerald-400" />
                              {opp.estimatedAnnualValueMNOK} MNOK/år
                            </span>
                            <span className="inline-flex items-center gap-1 text-xs text-slate-300">
                              <Leaf className="h-3 w-3 text-emerald-400" />
                              -{formatNumber(opp.co2ReductionTonnes)} t CO&#8322;
                            </span>
                          </div>
                        </div>
                      </GlowCard>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* ---- Right column: detail panel ---- */}
            <motion.div
              variants={chartReveal}
              initial="initial"
              animate="animate"
              className="lg:col-span-1 lg:sticky lg:top-4 self-start space-y-4"
            >
              {/* Detail card */}
              <div className="glass-card rounded-lg p-5 space-y-4">
                <h2 className="text-base font-bold text-slate-100 flex items-center gap-1.5">
                  {selected.title}
                  {selected.provenance && <ProvenanceBadge provenance={selected.provenance} />}
                </h2>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {selected.description}
                </p>

                {/* Radar chart */}
                <div className="flex items-center justify-between">
                  <ChartExportMenu targetRef={radarRef} filename="symbiosis-discovery" />
                </div>
                <div ref={radarRef} className="h-[300px] w-full">
                  <ResponsiveRadar
                    data={radarData}
                    keys={[selected.id]}
                    indexBy="dimension"
                    maxValue={10}
                    gridShape="circular"
                    gridLevels={5}
                    dotSize={8}
                    dotColor={{ from: "color" }}
                    dotBorderWidth={2}
                    dotBorderColor={{ from: "color", modifiers: [["darker", 0.3]] }}
                    fillOpacity={0.2}
                    borderWidth={2}
                    borderColor={{ from: "color" }}
                    colors={[theme.colors.accent.emerald]}
                    blendMode="screen"
                    animate={true}
                    motionConfig="gentle"
                    margin={{ top: 40, right: 60, bottom: 40, left: 60 }}
                    theme={theme.nivoTheme}
                    gridLabelOffset={16}
                  />
                </div>

                {/* Risk assessment 2x2 grid */}
                <div>
                  <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Risikovurdering
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        { key: "technical", label: "Teknisk", icon: Settings },
                        { key: "regulatory", label: "Regulatorisk", icon: ShieldCheck },
                        { key: "financial", label: "Finansiell", icon: DollarSign },
                        { key: "operational", label: "Operasjonell", icon: AlertTriangle },
                      ] as const
                    ).map(({ key, label, icon: RiskIcon }) => {
                      const level = selected.risks[key];
                      return (
                        <div
                          key={key}
                          className={cn(
                            "rounded-md border p-2.5 flex flex-col gap-1",
                            riskColors[level]
                          )}
                        >
                          <div className="flex items-center gap-1.5">
                            <RiskIcon className="h-3 w-3" />
                            <span className="text-[10px] font-semibold uppercase tracking-wide">
                              {label}
                            </span>
                          </div>
                          <span className="text-xs font-medium">
                            {riskLabels[level]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* AI Insight with typewriter */}
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
                      KI Innsikt
                    </span>
                  </div>
                  <TypewriterText
                    key={selected.id}
                    text={selected.description}
                    speed={15}
                    className="text-xs text-slate-300 leading-relaxed"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </PageContainer>
    </>
  );
}
