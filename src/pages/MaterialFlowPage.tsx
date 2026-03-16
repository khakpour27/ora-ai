import { useState, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ResponsiveNetwork } from "@nivo/network";
import { ResponsiveChord } from "@nivo/chord";
import { Network, Grid3x3, CircleDot, X, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { PageContainer } from "@/components/layout";
import { CompanyAvatar, SectionHeader, ProvenanceBadge, ChartExportMenu } from "@/components/shared";
import { useResolvedData } from "@/hooks/useResolvedData";
import type { Provenance } from "@/types/provenance";
import { theme } from "@/lib/theme";
import { cn, formatNumber } from "@/lib/utils";
import {
  staggerContainer,
  staggerItem,
  chartReveal,
} from "@/lib/animations";
import type { CompanyId } from "@/types";

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

type TabKey = "network" | "matrix" | "chord";

const tabs: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "network", label: "Nettverk", icon: Network },
  { key: "matrix", label: "Koblingsmatrise", icon: Grid3x3 },
  { key: "chord", label: "Chord", icon: CircleDot },
];

// ---------------------------------------------------------------------------
// Network helpers
// ---------------------------------------------------------------------------

interface AggregatedMaterial {
  name: string;
  volume: number;
  status: string;
  matchScore: number;
}

interface AggregatedLink {
  source: string;
  target: string;
  distance: number;
  thickness: number;
  materials: AggregatedMaterial[];
  totalVolume: number;
  color: string;
}

function buildNetworkData(
  companyIds: string[],
  companies: Record<string, { annualWasteTonnes: number; color: string; shortName: string; name: string; sector: string }>,
  materialFlows: { id: string; source: string; target: string; material: string; volumeTonnesPerYear: number; status: string; matchScore: number; provenance?: Provenance }[],
) {
  const nodeMap = new Map<
    string,
    { id: string; size: number; color: string }
  >();

  for (const id of companyIds) {
    const c = companies[id];
    nodeMap.set(id, {
      id,
      size: Math.max(16, Math.min(48, Math.sqrt(c.annualWasteTonnes) * 0.5)),
      color: c.color,
    });
  }

  // Aggregate flows by source-target pair but preserve individual materials
  const linkMap = new Map<string, AggregatedLink>();
  for (const mf of materialFlows) {
    const key = `${mf.source}--${mf.target}`;
    const existing = linkMap.get(key);
    if (existing) {
      existing.totalVolume += mf.volumeTonnesPerYear;
      existing.materials.push({
        name: mf.material,
        volume: mf.volumeTonnesPerYear,
        status: mf.status,
        matchScore: mf.matchScore,
      });
      existing.thickness = Math.max(1.5, Math.min(10, existing.totalVolume / 600));
    } else {
      linkMap.set(key, {
        source: mf.source,
        target: mf.target,
        distance: 200,
        thickness: Math.max(1.5, Math.min(10, mf.volumeTonnesPerYear / 600)),
        materials: [{
          name: mf.material,
          volume: mf.volumeTonnesPerYear,
          status: mf.status,
          matchScore: mf.matchScore,
        }],
        totalVolume: mf.volumeTonnesPerYear,
        color: "#10B981",
      });
    }
  }

  // Color links by status
  const links = Array.from(linkMap.values()).map((l) => ({
    ...l,
    color: l.materials.every((m) => m.status === "existing")
      ? "#10B981"   // emerald for all existing
      : l.materials.every((m) => m.status === "potential")
        ? "#F59E0B" // amber for all potential
        : "#8B5CF6", // violet for mixed
  }));

  return {
    nodes: Array.from(nodeMap.values()),
    links,
  };
}

// ---------------------------------------------------------------------------
// Chord helpers
// ---------------------------------------------------------------------------

function buildChordMatrix(
  companyIds: string[],
  companies: Record<string, { shortName: string }>,
  materialFlows: { source: string; target: string; volumeTonnesPerYear: number }[],
): { matrix: number[][]; keys: string[] } {
  const ids = [...companyIds];
  const size = ids.length;
  const matrix: number[][] = Array.from({ length: size }, () =>
    Array(size).fill(0)
  );

  for (const mf of materialFlows) {
    const si = ids.indexOf(mf.source as CompanyId);
    const ti = ids.indexOf(mf.target as CompanyId);
    if (si >= 0 && ti >= 0) {
      matrix[si][ti] += mf.volumeTonnesPerYear;
    }
  }

  const keys = ids.map((id) => companies[id].shortName);
  return { matrix, keys };
}

// ---------------------------------------------------------------------------
// Matrix helpers
// ---------------------------------------------------------------------------

function getMatrixCellScore(
  output: CompanyId,
  input: CompanyId,
  matchingMatrix: { outputCompany: string; inputCompany: string; compatibilityScore: number; material: string; volumePotential: number }[],
): { score: number; material: string; volume: number } | null {
  if (output === input) return null;
  const cells = matchingMatrix.filter(
    (c) => c.outputCompany === output && c.inputCompany === input
  );
  if (cells.length === 0) return null;
  const best = cells.reduce((a, b) =>
    a.compatibilityScore >= b.compatibilityScore ? a : b
  );
  return {
    score: best.compatibilityScore,
    material: best.material,
    volume: best.volumePotential,
  };
}

function scoreBgClass(score: number): string {
  if (score >= 0.85) return "bg-emerald-500/40 border-emerald-500/50";
  if (score >= 0.7) return "bg-emerald-500/25 border-emerald-500/30";
  if (score >= 0.5) return "bg-amber-500/20 border-amber-500/30";
  return "bg-slate-700/40 border-slate-600/30";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MaterialFlowPage() {
  const hub = useResolvedData();
  const { materialFlows, matchingMatrix, companies } = hub;
  const companyIds = Object.keys(companies);
  const [activeTab, setActiveTab] = useState<TabKey>("network");

  const networkData = useMemo(() => buildNetworkData(companyIds, companies, materialFlows), [companyIds, companies, materialFlows]);
  const chordData = useMemo(() => buildChordMatrix(companyIds, companies, materialFlows), [companyIds, companies, materialFlows]);

  return (
    <PageContainer
      title="Materialstrømsanalyse"
      description="KI-identifiserte materialstrømmer mellom bedrifter"
    >
      {/* Pill Tabs */}
      <div className="flex gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all",
                isActive
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/10"
                  : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 hover:text-slate-200"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === "network" && <NetworkTab data={networkData} companies={companies} companyIds={companyIds} materialFlows={materialFlows} />}
      {activeTab === "matrix" && <MatrixTab companies={companies} companyIds={companyIds} matchingMatrix={matchingMatrix} />}
      {activeTab === "chord" && <ChordTab data={chordData} companyIds={companyIds} />}
    </PageContainer>
  );
}

// ---------------------------------------------------------------------------
// Node Detail Panel
// ---------------------------------------------------------------------------

function NodeDetailPanel({
  companyId,
  onClose,
  companies,
  materialFlows,
}: {
  companyId: CompanyId;
  onClose: () => void;
  companies: Record<string, { name: string; shortName: string; sector: string; color: string; annualWasteTonnes: number }>;
  materialFlows: { id: string; source: string; target: string; material: string; volumeTonnesPerYear: number; status: string; matchScore: number; provenance?: Provenance }[];
}) {
  const company = companies[companyId];
  const outbound = materialFlows.filter((f) => f.source === companyId);
  const inbound = materialFlows.filter((f) => f.target === companyId);
  const totalOut = outbound.reduce((s, f) => s + f.volumeTonnesPerYear, 0);
  const totalIn = inbound.reduce((s, f) => s + f.volumeTonnesPerYear, 0);

  return (
    <div className="backdrop-blur-xl bg-slate-900/90 border border-white/10 rounded-xl p-4 shadow-2xl max-h-[580px] overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: company.color }}
          />
          <h3 className="text-sm font-semibold text-white">{company.name}</h3>
        </div>
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="text-xs text-slate-400 mb-2">{company.sector}</p>
      <p className="text-xs text-slate-300 font-mono mb-3">
        Arlig avfall: {formatNumber(company.annualWasteTonnes)} tonn
      </p>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-emerald-500/10 rounded-lg px-3 py-2 text-center">
          <div className="text-lg font-bold text-emerald-400 font-mono">
            {formatNumber(totalOut)}
          </div>
          <div className="text-[10px] text-slate-400">tonn ut</div>
        </div>
        <div className="bg-violet-500/10 rounded-lg px-3 py-2 text-center">
          <div className="text-lg font-bold text-violet-400 font-mono">
            {formatNumber(totalIn)}
          </div>
          <div className="text-[10px] text-slate-400">tonn inn</div>
        </div>
      </div>

      {/* Outbound flows */}
      {outbound.length > 0 && (
        <div className="mb-3">
          <div className="text-[10px] font-semibold text-emerald-400/70 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <ArrowRight className="w-3 h-3" />
            Utgaende ({outbound.length})
          </div>
          <div className="space-y-1">
            {outbound.map((flow) => {
              const tgt = companies[flow.target as CompanyId];
              return (
                <div
                  key={flow.id}
                  className="flex items-center justify-between text-[11px] py-1.5 px-2 rounded-md bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
                >
                  <div className="flex-1 min-w-0 mr-2">
                    <div className="text-slate-200 truncate">{flow.material}</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: tgt?.color }}
                      />
                      <span className="text-[10px] text-slate-500">
                        {tgt?.shortName}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={cn(
                        "px-1.5 py-0.5 rounded text-[9px] font-medium",
                        flow.status === "existing"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-amber-500/20 text-amber-400"
                      )}
                    >
                      {flow.status === "existing" ? "Eks." : "Pot."}
                    </span>
                    <span className="font-mono text-slate-300 text-[10px] w-14 text-right">
                      {formatNumber(flow.volumeTonnesPerYear)} t
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Inbound flows */}
      {inbound.length > 0 && (
        <div>
          <div className="text-[10px] font-semibold text-violet-400/70 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <ArrowRight className="w-3 h-3 rotate-180" />
            Inngaende ({inbound.length})
          </div>
          <div className="space-y-1">
            {inbound.map((flow) => {
              const src = companies[flow.source as CompanyId];
              return (
                <div
                  key={flow.id}
                  className="flex items-center justify-between text-[11px] py-1.5 px-2 rounded-md bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
                >
                  <div className="flex-1 min-w-0 mr-2">
                    <div className="text-slate-200 truncate">{flow.material}</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: src?.color }}
                      />
                      <span className="text-[10px] text-slate-500">
                        {src?.shortName}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={cn(
                        "px-1.5 py-0.5 rounded text-[9px] font-medium",
                        flow.status === "existing"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-amber-500/20 text-amber-400"
                      )}
                    >
                      {flow.status === "existing" ? "Eks." : "Pot."}
                    </span>
                    <span className="font-mono text-slate-300 text-[10px] w-14 text-right">
                      {formatNumber(flow.volumeTonnesPerYear)} t
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Network Tab
// ---------------------------------------------------------------------------

function NetworkTab({
  data,
  companies,
  companyIds,
  materialFlows,
}: {
  data: ReturnType<typeof buildNetworkData>;
  companies: Record<string, { name: string; shortName: string; sector: string; color: string; annualWasteTonnes: number }>;
  companyIds: string[];
  materialFlows: { id: string; source: string; target: string; material: string; volumeTonnesPerYear: number; status: string; matchScore: number; provenance?: Provenance }[];
}) {
  const [selectedNode, setSelectedNode] = useState<CompanyId | null>(null);
  const [showTable, setShowTable] = useState(false);
  const networkRef = useRef<HTMLDivElement>(null);

  const handleNodeClick = useCallback(
    (node: { id: string }) => {
      setSelectedNode((prev) =>
        prev === node.id ? null : (node.id as CompanyId)
      );
    },
    []
  );

  return (
    <motion.div variants={chartReveal} initial="initial" animate="animate">
      <div className="flex items-center justify-between mb-2">
        <ChartExportMenu targetRef={networkRef} filename="material-network" />
      </div>
      <div ref={networkRef} className="glass-card rounded-lg p-4">
        {/* Legend row — clickable company avatars */}
        <div className="mb-3 flex flex-wrap items-center gap-4">
          {companyIds.map((id) => (
            <button
              key={id}
              onClick={() =>
                setSelectedNode((prev) => (prev === id ? null : id))
              }
              className={cn(
                "transition-all",
                selectedNode && selectedNode !== id
                  ? "opacity-40"
                  : "opacity-100"
              )}
            >
              <CompanyAvatar companyId={id} size="sm" />
            </button>
          ))}
        </div>

        {/* Size, thickness & status legend */}
        <div className="flex flex-wrap items-center gap-6 mb-4 pb-3 border-b border-slate-700/50">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 font-medium">
              Nodestorrelse:
            </span>
            <div className="flex items-center gap-1">
              <svg width="12" height="12">
                <circle cx="6" cy="6" r="4" fill="none" stroke="#64748B" strokeWidth="1" />
              </svg>
              <span className="text-[10px] text-slate-500">Lite avfall</span>
            </div>
            <div className="flex items-center gap-1 ml-1">
              <svg width="20" height="20">
                <circle cx="10" cy="10" r="8" fill="none" stroke="#64748B" strokeWidth="1" />
              </svg>
              <span className="text-[10px] text-slate-500">Mye avfall</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 font-medium">
              Linjetykkelse:
            </span>
            <div className="flex items-center gap-1">
              <svg width="20" height="6">
                <line x1="0" y1="3" x2="20" y2="3" stroke="#64748B" strokeWidth="1" />
              </svg>
              <span className="text-[10px] text-slate-500">Lavt volum</span>
            </div>
            <div className="flex items-center gap-1 ml-1">
              <svg width="20" height="10">
                <line x1="0" y1="5" x2="20" y2="5" stroke="#64748B" strokeWidth="5" />
              </svg>
              <span className="text-[10px] text-slate-500">Hoyt volum</span>
            </div>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <div className="flex items-center gap-1">
              <span className="w-3 h-1 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-slate-500">Eksisterende</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-1 rounded-full bg-amber-500" />
              <span className="text-[10px] text-slate-500">Potensiell</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-1 rounded-full bg-violet-500" />
              <span className="text-[10px] text-slate-500">Blandet</span>
            </div>
          </div>
        </div>

        {/* Network chart + detail panel */}
        <div className="relative">
          <div className="h-[650px] w-full">
            <ResponsiveNetwork
              data={data}
              repulsivity={150}
              centeringStrength={0.3}
              iterations={120}
              linkDistance={(l) =>
                (l as unknown as { distance: number }).distance
              }
              nodeSize={(n) => n.size}
              nodeColor={(n) => n.color}
              nodeBorderWidth={1.5}
              nodeBorderColor={{ from: "color", modifiers: [["darker", 0.3]] }}
              linkThickness={(l) =>
                (l as unknown as { thickness: number }).thickness
              }
              linkColor={(l) => {
                const d = l as unknown as AggregatedLink;
                return `${d.color}60`;
              }}
              linkBlendMode="screen"
              animate={true}
              motionConfig="wobbly"
              margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
              theme={theme.nivoTheme}
              nodeComponent={({ node }) => {
                const c = companies[node.id as CompanyId];
                if (!c) return null;
                const isSelected = selectedNode === node.id;
                const isDimmed =
                  selectedNode !== null && selectedNode !== node.id;
                return (
                  <g
                    transform={`translate(${node.x}, ${node.y})`}
                    style={{ cursor: "pointer" }}
                    onClick={() => handleNodeClick(node)}
                    opacity={isDimmed ? 0.3 : 1}
                  >
                    {/* Outer glow when selected */}
                    {isSelected && (
                      <circle
                        r={node.size / 2 + 6}
                        fill="none"
                        stroke={node.color}
                        strokeWidth={2}
                        opacity={0.4}
                      >
                        <animate
                          attributeName="r"
                          from={String(node.size / 2 + 4)}
                          to={String(node.size / 2 + 10)}
                          dur="1.5s"
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="opacity"
                          from="0.4"
                          to="0"
                          dur="1.5s"
                          repeatCount="indefinite"
                        />
                      </circle>
                    )}
                    {/* Main circle */}
                    <circle
                      r={node.size / 2}
                      fill={`${node.color}30`}
                      stroke={node.color}
                      strokeWidth={isSelected ? 2.5 : 1.5}
                    />
                    {/* Company initials */}
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill={node.color}
                      fontSize={Math.max(9, node.size / 4)}
                      fontWeight="700"
                      fontFamily="Inter, sans-serif"
                    >
                      {c.shortName.slice(0, 2).toUpperCase()}
                    </text>
                    {/* Company name label */}
                    <text
                      y={node.size / 2 + 14}
                      textAnchor="middle"
                      fill="white"
                      fontSize="11"
                      fontWeight="600"
                      fontFamily="Inter, sans-serif"
                      opacity={0.85}
                    >
                      {c.shortName}
                    </text>
                    <text
                      y={node.size / 2 + 26}
                      textAnchor="middle"
                      fill="#94a3b8"
                      fontSize="9"
                      fontFamily="Inter, sans-serif"
                      opacity={0.6}
                    >
                      {formatNumber(c.annualWasteTonnes)} t/år
                    </text>
                  </g>
                );
              }}
              nodeTooltip={({ node }) => {
                const c = companies[node.id as CompanyId];
                if (!c) return null;
                const nodeFlows = materialFlows.filter(
                  (f) => f.source === node.id || f.target === node.id
                );
                return (
                  <div className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 shadow-xl max-w-xs">
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: c.color }}
                      />
                      <p className="text-sm font-semibold text-slate-100">
                        {c.name}
                      </p>
                    </div>
                    <p className="text-xs text-slate-400 mb-1">{c.sector}</p>
                    <p className="text-xs text-slate-300 font-mono">
                      Avfall: {formatNumber(c.annualWasteTonnes)} tonn/år
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {nodeFlows.length} materialstrømmar
                    </p>
                    <p className="text-[10px] text-emerald-400 mt-1">
                      Klikk for detaljer
                    </p>
                  </div>
                );
              }}
              linkComponent={({ link }) => {
                const d = link.data as unknown as AggregatedLink;
                const srcCompany = companies[d.source as CompanyId];
                const tgtCompany = companies[d.target as CompanyId];

                // Dim links not connected to selected node
                const isDimmed =
                  selectedNode !== null &&
                  d.source !== selectedNode &&
                  d.target !== selectedNode;

                return (
                  <g opacity={isDimmed ? 0.1 : 1}>
                    {/* Visible link line */}
                    <line
                      x1={link.source.x}
                      y1={link.source.y}
                      x2={link.target.x}
                      y2={link.target.y}
                      stroke={d.color}
                      strokeWidth={d.thickness}
                      strokeLinecap="round"
                      opacity={0.5}
                      style={{ mixBlendMode: "screen" }}
                    />
                    {/* Wider invisible hit area for hover */}
                    <line
                      x1={link.source.x}
                      y1={link.source.y}
                      x2={link.target.x}
                      y2={link.target.y}
                      stroke="transparent"
                      strokeWidth={Math.max(14, d.thickness + 10)}
                      style={{ cursor: "pointer" }}
                    >
                      <title>
                        {srcCompany?.shortName} → {tgtCompany?.shortName}
                        {": "}
                        {d.materials.map((m) => `${m.name} (${formatNumber(m.volume)} t)`).join(", ")}
                      </title>
                    </line>
                  </g>
                );
              }}
            />
          </div>

          {/* Node detail panel overlay */}
          <AnimatePresence>
            {selectedNode && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="absolute top-2 right-2 z-10 w-80"
              >
                <NodeDetailPanel
                  companyId={selectedNode}
                  onClose={() => setSelectedNode(null)}
                  companies={companies}
                  materialFlows={materialFlows}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Flow Summary Table */}
      <div className="mt-4 glass-card rounded-lg p-4">
        <button
          onClick={() => setShowTable((prev) => !prev)}
          className="w-full"
        >
          <SectionHeader
            title="Alle materialstrømmar"
            description={`${materialFlows.length} identifiserte strømmar mellom ${companyIds.length} bedrifter`}
            action={
              <div className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors">
                {showTable ? "Skjul" : "Vis tabell"}
                {showTable ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </div>
            }
          />
        </button>

        <AnimatePresence>
          {showTable && (
            <motion.div
              initial={{ height: 0, opacity: 0, overflow: "hidden" }}
              animate={{ height: "auto", opacity: 1, overflow: "visible", transitionEnd: { overflow: "visible" } }}
              exit={{ height: 0, opacity: 0, overflow: "hidden" }}
              transition={{ duration: 0.3 }}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-700/50">
                      <th className="text-left py-2 px-2 text-slate-500 font-medium">Fra</th>
                      <th className="text-left py-2 px-2 text-slate-500 font-medium">Til</th>
                      <th className="text-left py-2 px-2 text-slate-500 font-medium">Materiale</th>
                      <th className="text-right py-2 px-2 text-slate-500 font-medium">Volum (t/år)</th>
                      <th className="text-center py-2 px-2 text-slate-500 font-medium">Status</th>
                      <th className="text-right py-2 px-2 text-slate-500 font-medium">Match</th>
                      <th className="text-center py-2 px-2 text-slate-500 font-medium">Kilde</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materialFlows
                      .slice()
                      .sort((a, b) => b.volumeTonnesPerYear - a.volumeTonnesPerYear)
                      .map((flow) => {
                        const src = companies[flow.source as CompanyId];
                        const tgt = companies[flow.target as CompanyId];
                        return (
                          <tr
                            key={flow.id}
                            className="border-b border-slate-800/50 hover:bg-white/[0.03] transition-colors"
                          >
                            <td className="py-2 px-2">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{ backgroundColor: src?.color }}
                                />
                                <span className="text-slate-300">{src?.shortName}</span>
                              </div>
                            </td>
                            <td className="py-2 px-2">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{ backgroundColor: tgt?.color }}
                                />
                                <span className="text-slate-300">{tgt?.shortName}</span>
                              </div>
                            </td>
                            <td className="py-2 px-2 text-slate-200">{flow.material}</td>
                            <td className="py-2 px-2 text-right font-mono text-slate-200">
                              {formatNumber(flow.volumeTonnesPerYear)}
                            </td>
                            <td className="py-2 px-2 text-center">
                              <span
                                className={cn(
                                  "px-1.5 py-0.5 rounded text-[10px] font-medium",
                                  flow.status === "existing"
                                    ? "bg-emerald-500/20 text-emerald-400"
                                    : "bg-amber-500/20 text-amber-400"
                                )}
                              >
                                {flow.status === "existing" ? "Eksisterende" : "Potensiell"}
                              </span>
                            </td>
                            <td className="py-2 px-2 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <div className="w-12 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full"
                                    style={{
                                      width: `${flow.matchScore * 100}%`,
                                      backgroundColor:
                                        flow.matchScore >= 0.85
                                          ? "#10B981"
                                          : flow.matchScore >= 0.7
                                            ? "#F59E0B"
                                            : "#EF4444",
                                    }}
                                  />
                                </div>
                                <span className="font-mono text-slate-300 w-8">
                                  {Math.round(flow.matchScore * 100)}%
                                </span>
                              </div>
                            </td>
                            <td className="py-2 px-2 text-center">
                              {flow.provenance && <ProvenanceBadge provenance={flow.provenance} />}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Matching Matrix Tab
// ---------------------------------------------------------------------------

function MatrixTab({
  companies,
  companyIds,
  matchingMatrix,
}: {
  companies: Record<string, { shortName: string; color?: string }>;
  companyIds: string[];
  matchingMatrix: { outputCompany: string; inputCompany: string; compatibilityScore: number; material: string; volumePotential: number }[];
}) {
  const ids = companyIds;

  return (
    <motion.div variants={chartReveal} initial="initial" animate="animate">
      <div className="glass-card rounded-lg p-4 overflow-x-auto">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="min-w-[640px]"
        >
          {/* Header row */}
          <div
            className="grid gap-1 mb-1"
            style={{
              gridTemplateColumns: `140px repeat(${ids.length}, 1fr)`,
            }}
          >
            {/* Empty corner */}
            <div className="flex items-end pb-2">
              <span className="text-[10px] text-slate-500 font-medium">
                Output &#8594; Input
              </span>
            </div>
            {ids.map((id) => (
              <div
                key={id}
                className="flex flex-col items-center justify-end pb-2"
              >
                <span
                  className="h-2 w-2 rounded-full mb-1"
                  style={{
                    backgroundColor: theme.colors.companies[id],
                  }}
                />
                <span className="text-[11px] text-slate-300 font-medium text-center leading-tight">
                  {companies[id].shortName}
                </span>
              </div>
            ))}
          </div>

          {/* Data rows */}
          {ids.map((outputId, rowIdx) => (
            <div
              key={outputId}
              className="grid gap-1 mb-1"
              style={{
                gridTemplateColumns: `140px repeat(${ids.length}, 1fr)`,
              }}
            >
              {/* Row header */}
              <div className="flex items-center gap-2 pr-2">
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{
                    backgroundColor: theme.colors.companies[outputId],
                  }}
                />
                <span className="text-[11px] text-slate-300 font-medium truncate">
                  {companies[outputId].shortName}
                </span>
              </div>

              {/* Cells */}
              {ids.map((inputId, colIdx) => {
                const isDiagonal = rowIdx === colIdx;
                const cell = isDiagonal
                  ? null
                  : getMatrixCellScore(outputId, inputId, matchingMatrix);

                return (
                  <motion.div
                    key={inputId}
                    variants={staggerItem}
                    className={cn(
                      "aspect-square rounded-md border flex flex-col items-center justify-center text-center cursor-default transition-all hover:scale-105",
                      isDiagonal
                        ? "bg-slate-800/40 border-slate-700/30"
                        : cell
                          ? scoreBgClass(cell.score)
                          : "bg-slate-800/20 border-slate-700/20"
                    )}
                    title={
                      cell
                        ? `${cell.material} - ${formatNumber(cell.volume)} tonn`
                        : isDiagonal
                          ? "Samme bedrift"
                          : "Ingen kobling"
                    }
                  >
                    {isDiagonal ? (
                      <span className="text-[10px] text-slate-600">&mdash;</span>
                    ) : cell ? (
                      <>
                        <span className="text-xs font-semibold text-slate-100">
                          {Math.round(cell.score * 100)}%
                        </span>
                        <span className="text-[9px] text-slate-400 leading-tight mt-0.5 px-1 truncate max-w-full">
                          {cell.material}
                        </span>
                      </>
                    ) : (
                      <span className="text-[10px] text-slate-600">0</span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Chord Tab
// ---------------------------------------------------------------------------

function ChordTab({
  data,
  companyIds,
}: {
  data: ReturnType<typeof buildChordMatrix>;
  companyIds: string[];
}) {
  const colors = companyIds.map((id) => theme.colors.companies[id]);

  return (
    <motion.div variants={chartReveal} initial="initial" animate="animate">
      <div className="glass-card rounded-lg p-4">
        {/* Legend */}
        <div className="mb-4 flex flex-wrap gap-4">
          {companyIds.map((id) => (
            <CompanyAvatar key={id} companyId={id} size="sm" />
          ))}
        </div>

        <div className="h-[500px] w-full">
          <ResponsiveChord
            data={data.matrix}
            keys={data.keys}
            margin={{ top: 40, right: 40, bottom: 40, left: 40 }}
            padAngle={0.04}
            innerRadiusRatio={0.9}
            ribbonOpacity={0.5}
            activeRibbonOpacity={0.75}
            inactiveRibbonOpacity={0.15}
            ribbonBorderWidth={0}
            arcBorderWidth={1}
            arcBorderColor={{ from: "color", modifiers: [["darker", 0.4]] }}
            arcOpacity={1}
            colors={colors}
            enableLabel={true}
            label="id"
            labelOffset={12}
            labelRotation={-90}
            labelTextColor={{ from: "color", modifiers: [["brighter", 1]] }}
            animate={true}
            motionConfig="gentle"
            theme={theme.nivoTheme}
            valueFormat={(v) => `${formatNumber(v)} tonn`}
          />
        </div>
      </div>
    </motion.div>
  );
}
