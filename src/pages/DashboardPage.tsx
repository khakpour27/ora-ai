import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { PageContainer } from "@/components/layout";
import {
  KPICard,
  DonutGauge,
  StatusIndicator,
  AIInsightPanel,
  SectionHeader,
  ChartExportMenu,
} from "@/components/shared";
import { useResolvedData } from "@/hooks/useResolvedData";
import { useAnalysisStore } from "@/stores/analysisStore";
import type { WorkPackageStatus } from "@/types";
import {
  Briefcase,
  Brain,
  Sparkles,
  Map,
  Zap,
  Recycle,
  Factory,
  Building2,
  BatteryCharging,
  Landmark,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

function curvedPath(
  x1: number, y1: number, x2: number, y2: number,
  curvature = 0.3, offsetIndex = 0,
): string {
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const offset = curvature + offsetIndex * 0.12;
  const cx = midX - dy * offset;
  const cy = midY + dx * offset;
  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
}

function pairKey(a: string, b: string): string {
  return [a, b].sort().join("--");
}

const companyIconMap: Record<string, LucideIcon> = {
  Factory, Zap, Recycle, Building2, BatteryCharging, Landmark,
};

const energyTypeColors: Record<string, string> = {
  electricity: "#FBBF24",
  "waste-heat": "#F97316",
  heat: "#EF4444",
  biogas: "#22C55E",
  hydrogen: "#818CF8",
};

interface DirectFlow {
  source: string; target: string;
  value: number; type: string; status: string;
}

function getDirectEnergyFlows(
  energyFlows: { source: string; target: string; value: number; type: string; status: string }[],
  companyIdSet: Set<string>,
): DirectFlow[] {
  const intermediaries = new Set(["strøm", "spillvarme", "fjernvarme", "biogass"]);
  const into: Record<string, { source: string; value: number; type: string; status: string }[]> = {};
  const from: Record<string, { target: string; value: number; type: string; status: string }[]> = {};
  const direct: DirectFlow[] = [];

  for (const f of energyFlows) {
    const sC = companyIdSet.has(f.source), tC = companyIdSet.has(f.target);
    const sI = intermediaries.has(f.source), tI = intermediaries.has(f.target);
    if (sC && tC) direct.push({ source: f.source, target: f.target, value: f.value, type: f.type, status: f.status });
    else if (sC && tI) { (into[f.target] ??= []).push({ source: f.source, value: f.value, type: f.type, status: f.status }); }
    else if (sI && tC) { (from[f.source] ??= []).push({ target: f.target, value: f.value, type: f.type, status: f.status }); }
  }
  for (const inter of intermediaries) {
    for (const s of into[inter] || []) {
      for (const t of from[inter] || []) {
        if (s.source !== t.target) direct.push({ source: s.source, target: t.target, value: t.value, type: t.type, status: s.status === "existing" && t.status === "existing" ? "existing" : t.status });
      }
    }
  }
  return direct;
}

// ---------------------------------------------------------------------------
// MapLibre styles (same as GISMapPage)
// ---------------------------------------------------------------------------
const MINI_TERRAIN_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    carto: {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
        "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
      ],
      tileSize: 256,
    },
  },
  layers: [{ id: "carto", type: "raster", source: "carto" }],
};

const MINI_MAP_BOUNDS: [[number, number], [number, number]] = [
  [8.54, 62.66],
  [8.58, 62.68],
];

// ---------------------------------------------------------------------------
// Mini Map Preview — MapLibre + SVG overlay (non-interactive)
// ---------------------------------------------------------------------------
function MiniMapPreview({
  companyList,
  companies,
  materialFlows,
  energyFlows,
}: {
  companyList: { id: string; coordinates: [number, number]; color: string; shortName: string; sector: string; icon: string }[];
  companies: Record<string, { color?: string }>;
  materialFlows: { id: string; source: string; target: string; volumeTonnesPerYear: number; status: string }[];
  energyFlows: { source: string; target: string; value: number; type: string; status: string }[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [tick, setTick] = useState(0);

  const companyIdSet = useMemo(() => new Set(companyList.map((c) => c.id)), [companyList]);
  const directFlows = useMemo(() => getDirectEnergyFlows(energyFlows, companyIdSet), [energyFlows, companyIdSet]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MINI_TERRAIN_STYLE,
      center: [8.56, 62.67],
      zoom: 12,
      pitch: 50,
      bearing: 12,
      attributionControl: false,
      interactive: false,
    });
    map.on("load", () => {
      map.fitBounds(MINI_MAP_BOUNDS, {
        padding: { top: 20, bottom: 20, left: 20, right: 20 },
        pitch: 50,
        bearing: 12,
        duration: 0,
      });
      setMapReady(true);
      setTick((n) => n + 1);
    });
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  const project = useCallback((lng: number, lat: number) => {
    const map = mapRef.current;
    if (!map) return { x: 0, y: 0 };
    const p = map.project([lng, lat]);
    return { x: p.x, y: p.y };
  }, []);

  const svgW = mapRef.current?.getContainer()?.clientWidth || 0;
  const svgH = mapRef.current?.getContainer()?.clientHeight || 0;

  // Parallel-edge offset counters
  const counters: Record<string, number> = {};
  function nextIdx(a: string, b: string) {
    const k = pairKey(a, b);
    return (counters[k] = (counters[k] ?? 0) + 1) - 1;
  }

  // suppress unused var warning
  void tick;

  return (
    <div ref={containerRef} className="w-full h-full relative">
      {mapReady && svgW > 0 && (
        <svg
          width={svgW}
          height={svgH}
          className="absolute inset-0 pointer-events-none"
          style={{ zIndex: 2 }}
        >
          <defs>
            {Object.entries(energyTypeColors).map(([type, color]) => (
              <marker key={`a-${type}`} id={`miniArrow-${type}`} markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto" markerUnits="userSpaceOnUse">
                <path d="M0,0 L8,3 L0,6 Z" fill={color} opacity="0.7" />
              </marker>
            ))}
            <marker id="miniArrow-material" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto" markerUnits="userSpaceOnUse">
              <path d="M0,0 L8,3 L0,6 Z" fill="#10B981" opacity="0.7" />
            </marker>
            <filter id="miniSoftGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Energy flow lines */}
          {directFlows.map((flow, i) => {
            const src = project(
              companyList.find((c) => c.id === flow.source)?.coordinates[0] ?? 0,
              companyList.find((c) => c.id === flow.source)?.coordinates[1] ?? 0,
            );
            const tgt = project(
              companyList.find((c) => c.id === flow.target)?.coordinates[0] ?? 0,
              companyList.find((c) => c.id === flow.target)?.coordinates[1] ?? 0,
            );
            if (!src || !tgt) return null;
            const idx = nextIdx(flow.source, flow.target);
            const color = energyTypeColors[flow.type] || "#FBBF24";
            const thickness = Math.max(1.5, Math.min(4, Math.log10(flow.value + 1) * 1.2));
            const path = curvedPath(src.x, src.y, tgt.x, tgt.y, 0.2, idx);
            const dashStyle = flow.status === "existing" ? "none" : flow.status === "planned" ? "8 4" : "4 6";
            return (
              <g key={`e-${i}`}>
                <path d={path} fill="none" stroke={color} strokeWidth={thickness + 3} opacity={0.06} strokeLinecap="round" />
                <path d={path} fill="none" stroke={color} strokeWidth={thickness} opacity={flow.status === "existing" ? 0.6 : 0.3} strokeLinecap="round" strokeDasharray={dashStyle} markerEnd={`url(#miniArrow-${flow.type})`} />
                <circle r="2" fill={color} opacity="0.8">
                  <animateMotion dur={`${3 + i * 0.3}s`} repeatCount="indefinite" path={path} />
                </circle>
              </g>
            );
          })}

          {/* Material flow lines */}
          {materialFlows.map((flow, i) => {
            const src = project(
              companyList.find((c) => c.id === flow.source)?.coordinates[0] ?? 0,
              companyList.find((c) => c.id === flow.source)?.coordinates[1] ?? 0,
            );
            const tgt = project(
              companyList.find((c) => c.id === flow.target)?.coordinates[0] ?? 0,
              companyList.find((c) => c.id === flow.target)?.coordinates[1] ?? 0,
            );
            if (!src || !tgt) return null;
            const idx = nextIdx(flow.source, flow.target);
            const srcC = companies[flow.source];
            const color = srcC?.color || "#10B981";
            const thickness = Math.max(1, Math.min(3, Math.log10(flow.volumeTonnesPerYear + 1) * 0.7));
            const path = curvedPath(src.x, src.y, tgt.x, tgt.y, -0.25, idx);
            return (
              <g key={`m-${flow.id}`}>
                <path d={path} fill="none" stroke={color} strokeWidth={thickness} opacity={flow.status === "existing" ? 0.4 : 0.2} strokeLinecap="round" strokeDasharray="3 8" markerEnd="url(#miniArrow-material)" />
                <circle r="2" fill={color} opacity="0.7">
                  <animateMotion dur={`${4 + i * 0.4}s`} repeatCount="indefinite" path={path} />
                </circle>
              </g>
            );
          })}

          {/* Company nodes */}
          {companyList.map((company, i) => {
            const pos = project(company.coordinates[0], company.coordinates[1]);
            const Icon = companyIconMap[company.icon] || Factory;
            return (
              <g key={company.id}>
                <circle cx={pos.x} cy={pos.y} r={18} fill={company.color} opacity={0.06} filter="url(#miniSoftGlow)" />
                <circle cx={pos.x} cy={pos.y} r={14} fill={`${company.color}20`} stroke={company.color} strokeWidth={1.5} />
                <circle cx={pos.x} cy={pos.y} r={18} fill="none" stroke={company.color} strokeWidth={1} opacity={0.15}>
                  <animate attributeName="r" values="14;22;14" dur={`${2 + i * 0.3}s`} repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.15;0;0.15" dur={`${2 + i * 0.3}s`} repeatCount="indefinite" />
                </circle>
                <foreignObject x={pos.x - 8} y={pos.y - 8} width={16} height={16}>
                  <div className="w-full h-full flex items-center justify-center" style={{ color: company.color }}>
                    <Icon className="w-3 h-3" />
                  </div>
                </foreignObject>
                <text x={pos.x} y={pos.y + 26} textAnchor="middle" fill="white" fontSize="9" fontWeight="600" fontFamily="Inter, sans-serif" opacity="0.7">{company.shortName}</text>
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dashboard Page
// ---------------------------------------------------------------------------
// Map analysis store keys → work package IDs they affect
const analysisToWP: Record<string, { id: string; progress: number }[]> = {
  energi:          [{ id: "AP3", progress: 85 }],
  materialstrom:   [{ id: "AP2", progress: 90 }],
  symbiose:        [{ id: "AP5", progress: 70 }],
  forretningscase: [{ id: "AP4", progress: 40 }],
};

export default function DashboardPage() {
  const hub = useResolvedData();
  const { dashboardKPIs, workPackageStatuses, aiInsights, materialFlows, companies, energyFlows } = hub;
  const companyList = Object.values(companies);
  const kpiRef = useRef<HTMLDivElement>(null);
  const completedAt = useAnalysisStore((s) => s.completedAt);
  const totalMaterialFlows = materialFlows.length;

  // Derive dynamic work package statuses from analysis store
  const dynamicWP: WorkPackageStatus[] = useMemo(() => {
    return workPackageStatuses.map((wp) => {
      // Check if any completed analysis upgrades this WP
      for (const [analysisKey, wps] of Object.entries(analysisToWP)) {
        const match = wps.find((w) => w.id === wp.id);
        if (match && completedAt[analysisKey as keyof typeof completedAt]) {
          return { ...wp, status: "in-progress" as const, progress: match.progress };
        }
      }
      return wp;
    });
  }, [completedAt]);

  return (
    <PageContainer
      title="Oversikt"
      description="KI-drevet analyse av Sirkulaere Sunndal Hub"
    >
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="space-y-6"
      >
        {/* ROW 1: KPI Cards */}
        <div className="flex items-center justify-between">
          <ChartExportMenu targetRef={kpiRef} filename="dashboard-kpi" />
        </div>
        <div ref={kpiRef}>
        <motion.div
          data-tour-id="dashboard-kpis"
          variants={staggerContainer}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {dashboardKPIs.map((kpi) => (
            <KPICard
              key={kpi.id}
              label={kpi.label}
              value={kpi.value}
              unit={kpi.unit}
              trend={kpi.trend}
              trendValue={kpi.trendValue}
              icon={kpi.icon}
              decimals={kpi.value % 1 !== 0 ? 1 : 0}
              provenance={kpi.provenance}
            />
          ))}
        </motion.div>
        </div>

        {/* ROW 1.5: Map Preview Card */}
        <motion.div variants={staggerItem} data-tour-id="dashboard-map">
          <Link to="/kart" className="block group">
            <div className="glass-card rounded-xl p-0 overflow-hidden relative hover:border-emerald-500/30 transition-all duration-300">
              {/* Full-width map */}
              <div className="w-full h-72 lg:h-96 relative overflow-hidden bg-[#0F172A]">
                <MiniMapPreview companyList={companyList} companies={companies} materialFlows={materialFlows} energyFlows={energyFlows} />
                {/* Gradient overlay at bottom */}
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-900/90 to-transparent" />
              </div>

              {/* Stats bar below map */}
              <div className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Map className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-semibold text-white">Industrielt kart</span>
                </div>
                <div className="flex items-center gap-5">
                  <div className="flex items-center gap-1.5">
                    <Factory className="w-3 h-3 text-slate-400" />
                    <span className="text-xs font-bold text-white font-mono">6</span>
                    <span className="text-[9px] text-slate-500">Bedrifter</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3 h-3 text-amber-400" />
                    <span className="text-xs font-bold text-white font-mono">18</span>
                    <span className="text-[9px] text-slate-500">Energistrom</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Recycle className="w-3 h-3 text-emerald-400" />
                    <span className="text-xs font-bold text-white font-mono">{totalMaterialFlows}</span>
                    <span className="text-[9px] text-slate-500">Materialstrøm</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium group-hover:gap-3 transition-all duration-200">
                  Se fullstendig kart
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* ROW 2: AI Confidence Gauges */}
        <div>
          <SectionHeader
            title="KI-konfidens"
            description="Pålitelighet per analyseomrade"
            icon={<Brain className="w-5 h-5 text-emerald-400" />}
          />
          <motion.div
            variants={staggerContainer}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            <DonutGauge value={88} label="Energianalyse" />
            <DonutGauge value={92} label="Materialstrøm" />
            <DonutGauge value={76} label="Symbioseidentifisering" />
          </motion.div>
        </div>

        {/* ROW 3: Work Package Status */}
        <div>
          <SectionHeader
            title="Arbeidspakker"
            description="Fremdrift i prosjektets arbeidspakker"
            icon={<Briefcase className="w-5 h-5 text-amber-400" />}
          />
          <motion.div
            variants={staggerContainer}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {dynamicWP.map((wp) => (
              <motion.div
                key={wp.id}
                variants={staggerItem}
                className="glass-card p-4 rounded-lg"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                      {wp.id}
                    </span>
                    <span className="text-sm font-medium text-slate-200">
                      {wp.name}
                    </span>
                  </div>
                  <StatusIndicator status={wp.status} />
                </div>
                {/* Progress bar */}
                <div className="w-full h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      backgroundColor:
                        wp.status === "completed"
                          ? "#10B981"
                          : wp.status === "in-progress"
                            ? "#F59E0B"
                            : "#475569",
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${wp.progress}%` }}
                    transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
                  />
                </div>
                <div className="flex justify-end mt-1.5">
                  <span className="text-[10px] text-slate-500">
                    {wp.progress}%
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* ROW 4: AI Insights */}
        <div>
          <SectionHeader
            title="KI-innsikt"
            description="Identifiserte muligheter og risikoer"
            icon={<Sparkles className="w-5 h-5 text-violet-400" />}
          />
          <motion.div
            variants={staggerContainer}
            className="grid grid-cols-1 lg:grid-cols-3 gap-4"
          >
            {aiInsights.slice(0, 3).map((insight) => (
              <AIInsightPanel key={insight.id} insight={insight} />
            ))}
          </motion.div>
        </div>

        {/* ROW: Export Reports */}
        <motion.div variants={staggerItem} className="flex flex-wrap gap-3">
          <button
            onClick={async () => {
              const { generatePDFReport } = await import("@/lib/reportGenerator");
              generatePDFReport(hub, hub.scenarioName);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/60 border border-slate-700/40 text-sm text-slate-300 hover:text-emerald-400 hover:border-emerald-500/30 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            Last ned PDF-rapport
          </button>
          <button
            onClick={async () => {
              const { generatePPTXReport } = await import("@/lib/reportGenerator");
              generatePPTXReport(hub, hub.scenarioName);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/60 border border-slate-700/40 text-sm text-slate-300 hover:text-emerald-400 hover:border-emerald-500/30 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            Last ned presentasjon
          </button>
          <button
            onClick={async () => {
              const { exportHubAsJSON } = await import("@/lib/reportGenerator");
              exportHubAsJSON(hub);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/60 border border-slate-700/40 text-sm text-slate-300 hover:text-emerald-400 hover:border-emerald-500/30 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            Eksporter data (JSON)
          </button>
        </motion.div>
      </motion.div>
    </PageContainer>
  );
}
