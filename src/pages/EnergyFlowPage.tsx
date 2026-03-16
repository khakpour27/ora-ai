import { useState, useMemo, useRef } from "react";
import { motion } from "motion/react";
import { ResponsiveSankey } from "@nivo/sankey";
import { ResponsiveHeatMap } from "@nivo/heatmap";
import { staggerContainer, staggerItem, chartReveal } from "@/lib/animations";
import { theme } from "@/lib/theme";
import { formatGWh, formatTonnes, formatMNOK } from "@/lib/utils";
import { PageContainer } from "@/components/layout";
import {
  GlowCard,
  AIConfidenceBadge,
  CompanyAvatar,
  SectionHeader,
  ProvenanceBadge,
  ChartExportMenu,
} from "@/components/shared";
import { useResolvedData } from "@/hooks/useResolvedData";
import {
  Workflow,
  BarChart3,
  Sparkles,
  ArrowDownUp,
  Gauge,
  Wrench,
} from "lucide-react";

type TabId = "sankey" | "heatmap" | "optimizations";

const tabs: { id: TabId; label: string; icon: typeof Workflow }[] = [
  { id: "sankey", label: "Energistrom", icon: Workflow },
  { id: "heatmap", label: "Overskudd/Underskudd", icon: ArrowDownUp },
  { id: "optimizations", label: "KI Optimalisering", icon: Sparkles },
];

const complexityConfig = {
  low: { label: "Lav", color: "text-emerald-400", bg: "bg-emerald-500/15" },
  medium: { label: "Medium", color: "text-amber-400", bg: "bg-amber-500/15" },
  high: { label: "Hoy", color: "text-rose-400", bg: "bg-rose-500/15" },
} as const;

export default function EnergyFlowPage() {
  const hub = useResolvedData();
  const { sankeyNodes, energyFlows, surplusDeficitData, companies } = hub;
  const [activeTab, setActiveTab] = useState<TabId>("sankey");

  // Transform energy flows data into Nivo Sankey format
  const sankeyData = useMemo(() => {
    const nodes = sankeyNodes.map((n) => ({ id: n.id, nodeColor: n.color }));
    const links = energyFlows.map((f) => ({
      source: f.source,
      target: f.target,
      value: f.value,
    }));
    return { nodes, links };
  }, [sankeyNodes, energyFlows]);

  // Transform surplus/deficit data into Nivo HeatMap format
  const heatmapData = useMemo(() => {
    const seasonLabels: Record<string, string> = {
      winter: "Vinter",
      spring: "Vår",
      summer: "Sommer",
      autumn: "Høst",
    };

    const companyIds = [...new Set(surplusDeficitData.map((d) => d.companyId))];

    return companyIds.map((cid) => {
      const companyName = companies[cid]?.shortName ?? cid;
      const data = (["winter", "spring", "summer", "autumn"] as const).map(
        (season) => {
          const entry = surplusDeficitData.find(
            (d) => d.companyId === cid && d.season === season
          );
          const net = entry
            ? entry.electricity + entry.heat + entry.wasteHeat
            : 0;
          return {
            x: seasonLabels[season],
            y: Math.round(net * 10) / 10,
          };
        }
      );
      return { id: companyName, data };
    });
  }, [surplusDeficitData, companies]);

  return (
    <PageContainer
      title="Energikartlegging"
      description="Tverrindustriell energianalyse for Øra"
    >
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="space-y-6"
      >
        {/* Tab Navigation */}
        <motion.div variants={staggerItem} className="flex gap-2 flex-wrap">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  isActive
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </motion.div>

        {/* Tab Content */}
        {activeTab === "sankey" && <SankeyTab data={sankeyData} />}
        {activeTab === "heatmap" && <HeatmapTab data={heatmapData} />}
        {activeTab === "optimizations" && <OptimizationsTab />}
      </motion.div>
    </PageContainer>
  );
}

// ---- Sankey Tab ----

interface SankeyNode {
  id: string;
  nodeColor: string;
}

interface SankeyLink {
  source: string;
  target: string;
  value: number;
}

function SankeyTab({
  data,
}: {
  data: { nodes: SankeyNode[]; links: SankeyLink[] };
}) {
  const sankeyRef = useRef<HTMLDivElement>(null);
  return (
    <motion.div variants={chartReveal} initial="initial" animate="animate">
      <SectionHeader
        title="Energistrom"
        description="Energiflyt mellom bedrifter og energikilder på Øra"
        icon={<Workflow className="w-5 h-5 text-amber-400" />}
        action={<ChartExportMenu targetRef={sankeyRef} filename="energy-sankey" />}
      />
      <div ref={sankeyRef} className="glass-card rounded-lg p-4">
        <div className="h-[500px]">
          <ResponsiveSankey
            data={data}
            margin={{ top: 20, right: 160, bottom: 20, left: 160 }}
            align="justify"
            colors={(node: { nodeColor?: string }) =>
              node.nodeColor || "#64748B"
            }
            nodeThickness={18}
            nodeSpacing={24}
            nodeOpacity={1}
            nodeHoverOpacity={1}
            nodeBorderWidth={0}
            nodeBorderRadius={3}
            linkOpacity={0.35}
            linkHoverOpacity={0.7}
            linkContract={1}
            enableLinkGradient={true}
            labelPosition="outside"
            labelOrientation="horizontal"
            labelPadding={16}
            labelTextColor="#94A3B8"
            linkBlendMode="screen"
            animate={true}
            motionConfig="gentle"
            theme={theme.nivoTheme}
          />
        </div>
      </div>
    </motion.div>
  );
}

// ---- Heatmap Tab ----

function HeatmapTab({
  data,
}: {
  data: { id: string; data: { x: string; y: number }[] }[];
}) {
  return (
    <motion.div variants={chartReveal} initial="initial" animate="animate">
      <SectionHeader
        title="Overskudd / Underskudd"
        description="Netto energibalanse per bedrift og sesong (GWh)"
        icon={<BarChart3 className="w-5 h-5 text-sky-400" />}
      />
      <div className="glass-card rounded-lg p-4">
        <div className="h-[500px]">
          <ResponsiveHeatMap
            data={data}
            margin={{ top: 60, right: 40, bottom: 40, left: 120 }}
            valueFormat={(v: number) =>
              `${v > 0 ? "+" : ""}${v} GWh`
            }
            axisTop={{
              tickSize: 5,
              tickPadding: 5,
              legend: "",
              legendOffset: 36,
            }}
            axisLeft={{
              tickSize: 5,
              tickPadding: 5,
              legend: "",
              legendOffset: -100,
            }}
            colors={{
              type: "diverging",
              scheme: "red_yellow_green",
              divergeAt: 0.5,
              minValue: -200,
              maxValue: 700,
            }}
            emptyColor="#334155"
            borderColor="#1E293B"
            borderWidth={2}
            borderRadius={4}
            labelTextColor={{
              from: "color",
              modifiers: [["darker", 3]],
            }}
            animate={true}
            motionConfig="gentle"
            theme={theme.nivoTheme}
            hoverTarget="cell"
          />
        </div>
      </div>
    </motion.div>
  );
}

// ---- Optimizations Tab ----

function OptimizationsTab() {
  const hub = useResolvedData();
  const { energyOptimizations } = hub;
  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      <SectionHeader
        title="KI Optimaliseringsforslag"
        description="Maskinlaeringsbaserte forslag til energieffektivisering"
        icon={<Sparkles className="w-5 h-5 text-violet-400" />}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {energyOptimizations.map((opt) => {
          const complexity = complexityConfig[opt.complexity];
          return (
            <GlowCard key={opt.id}>
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="mt-0.5 shrink-0 rounded-lg bg-violet-500/10 border border-violet-500/20 p-1.5">
                      <Gauge className="h-4 w-4 text-violet-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-100 leading-snug">
                      {opt.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <AIConfidenceBadge confidence={opt.confidence} />
                    {opt.provenance && <ProvenanceBadge provenance={opt.provenance} />}
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-400 leading-relaxed">
                  {opt.description}
                </p>

                {/* Metrics row */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-white/5 p-2.5 text-center">
                    <p className="text-xs text-slate-500 mb-0.5">Besparelse</p>
                    <p className="text-sm font-semibold text-emerald-400">
                      {formatGWh(opt.savingGWh)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-white/5 p-2.5 text-center">
                    <p className="text-xs text-slate-500 mb-0.5">
                      CO2-reduksjon
                    </p>
                    <p className="text-sm font-semibold text-sky-400">
                      {formatTonnes(opt.co2ReductionTonnes)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-white/5 p-2.5 text-center">
                    <p className="text-xs text-slate-500 mb-0.5">Kostnad</p>
                    <p className="text-sm font-semibold text-amber-400">
                      {formatMNOK(opt.estimatedCostMNOK)}
                    </p>
                  </div>
                </div>

                {/* Footer: companies + complexity */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <div className="flex items-center gap-1.5">
                    {opt.involvedCompanies.map((cid) => (
                      <CompanyAvatar key={cid} companyId={cid} size="sm" />
                    ))}
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium ${complexity.color} ${complexity.bg}`}
                  >
                    <Wrench className="w-3 h-3" />
                    {complexity.label} kompleksitet
                  </span>
                </div>
              </div>
            </GlowCard>
          );
        })}
      </div>
    </motion.div>
  );
}
