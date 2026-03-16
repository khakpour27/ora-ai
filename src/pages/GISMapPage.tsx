import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { PageContainer } from "@/components/layout";
import { AnimatedNumber } from "@/components/shared";
import { useResolvedData } from "@/hooks/useResolvedData";
import type { CompanyId, Company, MaterialFlow } from "@/types";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  Factory,
  Zap,
  Recycle,
  Building2,
  BatteryCharging,
  Landmark,
  MapPin,
  ArrowRightLeft,
  X,
  Map as MapIcon,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Icon map for companies
// ---------------------------------------------------------------------------
const companyIconMap: Record<string, LucideIcon> = {
  Factory,
  Zap,
  Recycle,
  Building2,
  BatteryCharging,
  Landmark,
};

// ---------------------------------------------------------------------------
// Color map for energy types
// ---------------------------------------------------------------------------
const energyTypeColors: Record<string, string> = {
  electricity: "#FBBF24",
  "waste-heat": "#F97316",
  heat: "#EF4444",
  biogas: "#22C55E",
  hydrogen: "#818CF8",
};

const energyTypeLabels: Record<string, string> = {
  electricity: "Strøm",
  "waste-heat": "Spillvarme",
  heat: "Varme",
  biogas: "Biogass",
  hydrogen: "Hydrogen",
};

// ---------------------------------------------------------------------------
// Map view defaults (Sunndal industrial area)
// ---------------------------------------------------------------------------
const MAP_CENTER: [number, number] = [8.56, 62.67];
const MAP_PITCH = 50;
const MAP_BEARING = 12;
// Bounding box from company coordinates for adaptive zoom
// SW corner (min lng, min lat) → NE corner (max lng, max lat)
const MAP_BOUNDS: [[number, number], [number, number]] = [
  [8.54, 62.66],
  [8.58, 62.68],
];

// ---------------------------------------------------------------------------
// MapLibre style specifications for 3 background modes
// ---------------------------------------------------------------------------
const DARK_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {},
  layers: [
    { id: "bg", type: "background", paint: { "background-color": "#0F172A" } },
  ],
};

const TERRAIN_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    carto: {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
        "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
        "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
      ],
      tileSize: 256,
    },
  },
  layers: [{ id: "carto", type: "raster", source: "carto" }],
};

const MAP_STYLES: Record<string, maplibregl.StyleSpecification> = {
  none: DARK_STYLE,
  subtle: TERRAIN_STYLE,
};

// ---------------------------------------------------------------------------
// Compute a curved path between two pixel points
// ---------------------------------------------------------------------------
function curvedPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  curvature = 0.3,
  offsetIndex = 0
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

// ---------------------------------------------------------------------------
// Unique key for a pair of company IDs (to offset parallel flows)
// ---------------------------------------------------------------------------
function pairKey(a: string, b: string): string {
  return [a, b].sort().join("--");
}

// ---------------------------------------------------------------------------
// Filter energy flows to only direct company-to-company flows
// ---------------------------------------------------------------------------
interface DirectFlow {
  source: CompanyId;
  target: CompanyId;
  value: number;
  type: string;
  status: string;
}

function getDirectEnergyFlows(
  companyIds: Set<string>,
  energyFlows: {
    source: string;
    target: string;
    value: number;
    type: string;
    status: string;
  }[]
): DirectFlow[] {
  const intermediaries = new Set([
    "strøm",
    "spillvarme",
    "fjernvarme",
    "biogass",
  ]);
  const intoIntermediary: Record<
    string,
    { source: string; value: number; type: string; status: string }[]
  > = {};
  const fromIntermediary: Record<
    string,
    { target: string; value: number; type: string; status: string }[]
  > = {};
  const directFlows: DirectFlow[] = [];

  for (const flow of energyFlows) {
    const srcIsCompany = companyIds.has(flow.source);
    const tgtIsCompany = companyIds.has(flow.target);
    const tgtIsInter = intermediaries.has(flow.target);
    const srcIsInter = intermediaries.has(flow.source);

    if (srcIsCompany && tgtIsCompany) {
      directFlows.push({
        source: flow.source as CompanyId,
        target: flow.target as CompanyId,
        value: flow.value,
        type: flow.type,
        status: flow.status,
      });
    } else if (srcIsCompany && tgtIsInter) {
      if (!intoIntermediary[flow.target]) intoIntermediary[flow.target] = [];
      intoIntermediary[flow.target].push({
        source: flow.source,
        value: flow.value,
        type: flow.type,
        status: flow.status,
      });
    } else if (srcIsInter && tgtIsCompany) {
      if (!fromIntermediary[flow.source]) fromIntermediary[flow.source] = [];
      fromIntermediary[flow.source].push({
        target: flow.target,
        value: flow.value,
        type: flow.type,
        status: flow.status,
      });
    }
  }

  for (const inter of intermediaries) {
    const sources = intoIntermediary[inter] || [];
    const targets = fromIntermediary[inter] || [];
    for (const src of sources) {
      for (const tgt of targets) {
        if (src.source !== tgt.target) {
          directFlows.push({
            source: src.source as CompanyId,
            target: tgt.target as CompanyId,
            value: tgt.value,
            type: tgt.type,
            status:
              tgt.status === "existing" && src.status === "existing"
                ? "existing"
                : tgt.status,
          });
        }
      }
    }
  }

  return directFlows;
}

// ---------------------------------------------------------------------------
// SVG Overlay — renders flows & markers using map.project()
// ---------------------------------------------------------------------------
interface OverlayProps {
  map: maplibregl.Map | null;
  companyList: Company[];
  companies: Record<string, Company>;
  directEnergyFlows: DirectFlow[];
  materialFlows: MaterialFlow[];
  showEnergy: boolean;
  showMaterial: boolean;
  showCompanies: boolean;
  energyTypeFilter: Set<string>;
  hoveredCompany: CompanyId | null;
  selectedCompany: CompanyId | null;
  onHoverCompany: (id: CompanyId | null) => void;
  onClickCompany: (id: CompanyId) => void;
  onHoverFlow: (
    info: { type: "energy" | "material"; index: number; x: number; y: number } | null
  ) => void;
  tick: number;
}

function FlowOverlay({
  map,
  companyList,
  companies,
  directEnergyFlows,
  materialFlows,
  showEnergy,
  showMaterial,
  showCompanies,
  energyTypeFilter,
  hoveredCompany,
  selectedCompany,
  onHoverCompany,
  onClickCompany,
  onHoverFlow,
  tick,
}: OverlayProps) {
  // Project lng/lat to pixel coordinates
  const project = useCallback(
    (lng: number, lat: number): { x: number; y: number } => {
      if (!map) return { x: 0, y: 0 };
      const p = map.project([lng, lat]);
      return { x: p.x, y: p.y };
    },
    [map]
  );

  // Compute company positions from map projection
  const companyPositions = useMemo(() => {
    const positions: Record<CompanyId, { x: number; y: number }> = {} as Record<
      CompanyId,
      { x: number; y: number }
    >;
    for (const company of companyList) {
      const [lng, lat] = company.coordinates;
      positions[company.id] = project(lng, lat);
    }
    return positions;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyList, project, tick]);

  // Track offsets for parallel edges
  const pairCounters: Record<string, number> = {};
  function nextPairOffset(a: string, b: string): number {
    const key = pairKey(a, b);
    if (!pairCounters[key]) pairCounters[key] = 0;
    return pairCounters[key]++;
  }

  const isFlowHighlighted = (source: string, target: string) => {
    if (!hoveredCompany && !selectedCompany) return true;
    const active = selectedCompany || hoveredCompany;
    return source === active || target === active;
  };

  // Get dimensions from map container
  const container = map?.getContainer();
  const svgW = container?.clientWidth || 0;
  const svgH = container?.clientHeight || 0;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 1,
      }}
    >
      <svg
        width={svgW}
        height={svgH}
        viewBox={`0 0 ${svgW} ${svgH}`}
        style={{ overflow: "visible" }}
      >
        <defs>
          {/* Glow filters */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Energy type gradients */}
          {Object.entries(energyTypeColors).map(([type, color]) => (
            <linearGradient
              key={`grad-${type}`}
              id={`energyGrad-${type}`}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor={color} stopOpacity="0.2" />
              <stop offset="50%" stopColor={color} stopOpacity="0.8" />
              <stop offset="100%" stopColor={color} stopOpacity="0.2" />
            </linearGradient>
          ))}

          {/* Arrowhead markers */}
          {Object.entries(energyTypeColors).map(([type, color]) => (
            <marker
              key={`arrow-${type}`}
              id={`arrow-${type}`}
              markerWidth="8"
              markerHeight="6"
              refX="8"
              refY="3"
              orient="auto"
              markerUnits="userSpaceOnUse"
            >
              <path d="M0,0 L8,3 L0,6 Z" fill={color} opacity="0.7" />
            </marker>
          ))}
          <marker
            id="arrow-material"
            markerWidth="8"
            markerHeight="6"
            refX="8"
            refY="3"
            orient="auto"
            markerUnits="userSpaceOnUse"
          >
            <path d="M0,0 L8,3 L0,6 Z" fill="#10B981" opacity="0.7" />
          </marker>
        </defs>

        {/* Energy flow lines */}
        {showEnergy &&
          directEnergyFlows
            .filter((f) => energyTypeFilter.has(f.type))
            .map((flow, i) => {
              const srcPos = companyPositions[flow.source];
              const tgtPos = companyPositions[flow.target];
              if (!srcPos || !tgtPos) return null;
              const idx = nextPairOffset(flow.source, flow.target);
              const highlighted = isFlowHighlighted(flow.source, flow.target);
              const color = energyTypeColors[flow.type] || "#FBBF24";
              const thickness = Math.max(
                1.5,
                Math.min(5, Math.log10(flow.value + 1) * 1.5)
              );
              const path = curvedPath(
                srcPos.x,
                srcPos.y,
                tgtPos.x,
                tgtPos.y,
                0.2,
                idx
              );
              const dashStyle =
                flow.status === "existing"
                  ? "none"
                  : flow.status === "planned"
                    ? "8 4"
                    : "4 6";

              return (
                <g
                  key={`energy-${i}`}
                  opacity={highlighted ? 1 : 0.15}
                  style={{ transition: "opacity 0.4s" }}
                >
                  {/* Glow layer */}
                  <path
                    d={path}
                    fill="none"
                    stroke={color}
                    strokeWidth={thickness + 4}
                    opacity={0.08}
                    strokeLinecap="round"
                  />
                  {/* Main path */}
                  <path
                    d={path}
                    fill="none"
                    stroke={color}
                    strokeWidth={thickness}
                    opacity={flow.status === "existing" ? 0.7 : 0.4}
                    strokeLinecap="round"
                    strokeDasharray={dashStyle}
                    markerEnd={`url(#arrow-${flow.type})`}
                  >
                    {flow.status === "existing" && (
                      <animate
                        attributeName="stroke-dashoffset"
                        values="0;-24"
                        dur="2s"
                        repeatCount="indefinite"
                      />
                    )}
                  </path>
                  {/* Hit area */}
                  <path
                    d={path}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={Math.max(14, thickness + 10)}
                    style={{ cursor: "pointer", pointerEvents: "auto" }}
                    onMouseEnter={(e) =>
                      onHoverFlow({
                        type: "energy",
                        index: i,
                        x: e.clientX,
                        y: e.clientY,
                      })
                    }
                    onMouseMove={(e) =>
                      onHoverFlow({
                        type: "energy",
                        index: i,
                        x: e.clientX,
                        y: e.clientY,
                      })
                    }
                    onMouseLeave={() => onHoverFlow(null)}
                  />
                  {/* Animated particle */}
                  <circle r="3" fill={color} opacity="0.9">
                    <animateMotion
                      dur={`${3 + i * 0.3}s`}
                      repeatCount="indefinite"
                      path={path}
                    />
                  </circle>
                </g>
              );
            })}

        {/* Material flow lines */}
        {showMaterial &&
          materialFlows.map((flow, i) => {
            const srcPos = companyPositions[flow.source];
            const tgtPos = companyPositions[flow.target];
            if (!srcPos || !tgtPos) return null;
            const idx = nextPairOffset(flow.source, flow.target);
            const highlighted = isFlowHighlighted(flow.source, flow.target);
            const srcCompany = companies[flow.source];
            const color = srcCompany?.color || "#10B981";
            const thickness = Math.max(
              1,
              Math.min(4, Math.log10(flow.volumeTonnesPerYear + 1) * 0.8)
            );
            const path = curvedPath(
              srcPos.x,
              srcPos.y,
              tgtPos.x,
              tgtPos.y,
              -0.25,
              idx
            );

            return (
              <g
                key={`material-${flow.id}`}
                opacity={highlighted ? 1 : 0.12}
                style={{ transition: "opacity 0.4s" }}
              >
                <path
                  d={path}
                  fill="none"
                  stroke={color}
                  strokeWidth={thickness}
                  opacity={flow.status === "existing" ? 0.5 : 0.25}
                  strokeLinecap="round"
                  strokeDasharray="3 8"
                  markerEnd="url(#arrow-material)"
                />
                {/* Hit area */}
                <path
                  d={path}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={Math.max(14, thickness + 10)}
                  style={{ cursor: "pointer", pointerEvents: "auto" }}
                  onMouseEnter={(e) =>
                    onHoverFlow({
                      type: "material",
                      index: i,
                      x: e.clientX,
                      y: e.clientY,
                    })
                  }
                  onMouseMove={(e) =>
                    onHoverFlow({
                      type: "material",
                      index: i,
                      x: e.clientX,
                      y: e.clientY,
                    })
                  }
                  onMouseLeave={() => onHoverFlow(null)}
                />
                {/* Animated dot */}
                <circle r="2.5" fill={color} opacity="0.8">
                  <animateMotion
                    dur={`${4 + i * 0.4}s`}
                    repeatCount="indefinite"
                    path={path}
                  />
                </circle>
                {flow.volumeTonnesPerYear > 500 && (
                  <circle r="2" fill={color} opacity="0.5">
                    <animateMotion
                      dur={`${4 + i * 0.4}s`}
                      repeatCount="indefinite"
                      path={path}
                      begin={`${2 + i * 0.2}s`}
                    />
                  </circle>
                )}
              </g>
            );
          })}

        {/* Company nodes */}
        {showCompanies &&
          companyList.map((company, ci) => {
            const pos = companyPositions[company.id];
            const Icon = companyIconMap[company.icon] || Factory;
            const isHovered = hoveredCompany === company.id;
            const isSelected = selectedCompany === company.id;
            const isActive = isHovered || isSelected;

            return (
              <g
                key={company.id}
                style={{ pointerEvents: "auto", cursor: "pointer" }}
                onMouseEnter={() => onHoverCompany(company.id)}
                onMouseLeave={() => onHoverCompany(null)}
                onClick={() => onClickCompany(company.id)}
                opacity={ci < companyList.length ? 1 : 0}
              >
                {/* Pulse ring on active */}
                {isActive && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r="28"
                    fill="none"
                    stroke={company.color}
                    strokeWidth="1.5"
                    opacity="0.4"
                  >
                    <animate
                      attributeName="r"
                      values="22;36;22"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.4;0;0.4"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}

                {/* Outer glow */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={isActive ? 26 : 22}
                  fill={company.color}
                  opacity={isActive ? 0.15 : 0.08}
                  filter="url(#softGlow)"
                />

                {/* Main circle */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={isActive ? 22 : 18}
                  fill={`${company.color}20`}
                  stroke={company.color}
                  strokeWidth={isActive ? 2.5 : 1.5}
                  style={{
                    transition: "r 0.3s ease, stroke-width 0.3s ease",
                  }}
                />

                {/* Icon */}
                <foreignObject
                  x={pos.x - 10}
                  y={pos.y - 10}
                  width={20}
                  height={20}
                >
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ color: company.color }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                </foreignObject>

                {/* Name label */}
                <text
                  x={pos.x}
                  y={pos.y + 34}
                  textAnchor="middle"
                  fill="white"
                  fontSize="11"
                  fontWeight="600"
                  fontFamily="Inter, sans-serif"
                  opacity={isActive ? 1 : 0.7}
                  style={{ transition: "opacity 0.3s" }}
                >
                  {company.shortName}
                </text>
                <text
                  x={pos.x}
                  y={pos.y + 47}
                  textAnchor="middle"
                  fill="white"
                  fontSize="8"
                  fontFamily="Inter, sans-serif"
                  opacity={isActive ? 0.6 : 0.3}
                  style={{ transition: "opacity 0.3s" }}
                >
                  {company.sector}
                </text>
              </g>
            );
          })}
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function GISMapPage() {
  const hub = useResolvedData();
  const { companies, energyFlows, materialFlows } = hub;
  const companyList = Object.values(companies);

  const [showEnergy, setShowEnergy] = useState(true);
  const [showMaterial, setShowMaterial] = useState(true);
  const [showCompanies, setShowCompanies] = useState(true);
  const [hoveredCompany, setHoveredCompany] = useState<CompanyId | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<CompanyId | null>(null);
  const [mapBg, setMapBg] = useState<"none" | "subtle">("subtle");

  // Energy type filter
  const [energyTypeFilter, setEnergyTypeFilter] = useState<Set<string>>(
    () => new Set(Object.keys(energyTypeColors))
  );

  // Flow tooltip
  const [hoveredFlow, setHoveredFlow] = useState<{
    type: "energy" | "material";
    index: number;
    x: number;
    y: number;
  } | null>(null);

  const toggleEnergyType = useCallback((type: string) => {
    setEnergyTypeFilter((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }, []);

  // Direct energy flows between companies
  const companyIds = useMemo(
    () => new Set(Object.keys(companies)),
    [companies]
  );
  const directEnergyFlows = useMemo(
    () => getDirectEnergyFlows(companyIds, energyFlows),
    [companyIds, energyFlows]
  );

  // Summary stats
  const totalEnergyGWh = useMemo(
    () => directEnergyFlows.reduce((sum, f) => sum + f.value, 0),
    [directEnergyFlows]
  );
  const totalMaterialTonnes = useMemo(
    () => materialFlows.reduce((sum, f) => sum + f.volumeTonnesPerYear, 0),
    [materialFlows]
  );
  const activeConnections = useMemo(
    () => directEnergyFlows.length + materialFlows.length,
    [directEnergyFlows, materialFlows]
  );

  const handleCompanyClick = useCallback((id: CompanyId) => {
    setSelectedCompany((prev) => (prev === id ? null : id));
  }, []);

  // Imperative MapLibre GL map
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapTick, setMapTick] = useState(0);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLES[mapBg],
      center: MAP_CENTER,
      zoom: 12,
      pitch: MAP_PITCH,
      bearing: MAP_BEARING,
      attributionControl: false,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    // Adaptive zoom: fit all company markers with padding, respecting pitch/bearing
    map.on("load", () => {
      map.fitBounds(MAP_BOUNDS, {
        padding: { top: 20, bottom: 20, left: 20, right: 20 },
        pitch: MAP_PITCH,
        bearing: MAP_BEARING,
        duration: 0,
      });
      setMapReady(true);
    });
    map.on("move", () => setMapTick((n) => n + 1));
    mapInstanceRef.current = map;
    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update map style when background mode changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.setStyle(MAP_STYLES[mapBg]);
  }, [mapBg]);

  const mapInstance = mapInstanceRef.current;

  return (
    <PageContainer
      title="Industriell symbiose-kartlegging"
      description="Geografisk oversikt over energi- og materialstrømmer i Sunndal"
    >
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="space-y-6"
      >
        {/* Map Container */}
        <motion.div variants={staggerItem} className="relative">
          <div className="glass-card rounded-xl overflow-hidden relative">
            {/* Toggle Controls */}
            <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
              <ToggleButton
                label="Energistrom"
                active={showEnergy}
                color="#FBBF24"
                icon={<Zap className="w-3.5 h-3.5" />}
                onClick={() => setShowEnergy(!showEnergy)}
              />
              <ToggleButton
                label="Materialstrøm"
                active={showMaterial}
                color="#10B981"
                icon={<Recycle className="w-3.5 h-3.5" />}
                onClick={() => setShowMaterial(!showMaterial)}
              />
              <ToggleButton
                label="Bedrifter"
                active={showCompanies}
                color="#8B5CF6"
                icon={<MapPin className="w-3.5 h-3.5" />}
                onClick={() => setShowCompanies(!showCompanies)}
              />

              {/* Energy type filter */}
              {showEnergy && (
                <div className="backdrop-blur-md bg-black/40 border border-white/10 rounded-lg p-2 space-y-1 mt-1">
                  <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">
                    Energityper
                  </div>
                  {Object.entries(energyTypeLabels).map(([type, label]) => (
                    <label
                      key={type}
                      className="flex items-center gap-2 cursor-pointer text-[10px] text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={energyTypeFilter.has(type)}
                        onChange={() => toggleEnergyType(type)}
                        className="w-3 h-3 rounded border-slate-600 bg-transparent text-emerald-500 focus:ring-0 focus:ring-offset-0"
                      />
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: energyTypeColors[type] }}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              )}

              {/* Background map toggle */}
              <div className="backdrop-blur-md bg-black/40 border border-white/10 rounded-lg p-2 mt-1">
                <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1.5">
                  Bakgrunn
                </div>
                <div className="flex flex-col gap-1">
                  {(["none", "subtle"] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setMapBg(mode)}
                      className={cn(
                        "flex items-center gap-2 px-2 py-1 rounded text-[10px] transition-all",
                        mapBg === mode
                          ? "bg-white/10 text-white font-medium"
                          : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                      )}
                    >
                      <MapIcon className="w-3 h-3" />
                      {mode === "none" ? "Ingen" : "Terreng"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 z-20">
              <MapLegend />
            </div>

            {/* MapLibre GL Map */}
            <div className="relative w-full h-[calc(100vh-340px)] min-h-[400px]">
              <div ref={mapContainerRef} className="absolute inset-0" />

              {mapReady && mapInstance && (
                <FlowOverlay
                  map={mapInstance}
                  companyList={companyList}
                  companies={companies}
                  directEnergyFlows={directEnergyFlows}
                  materialFlows={materialFlows}
                  showEnergy={showEnergy}
                  showMaterial={showMaterial}
                  showCompanies={showCompanies}
                  energyTypeFilter={energyTypeFilter}
                  hoveredCompany={hoveredCompany}
                  selectedCompany={selectedCompany}
                  onHoverCompany={setHoveredCompany}
                  onClickCompany={handleCompanyClick}
                  onHoverFlow={setHoveredFlow}
                  tick={mapTick}
                />
              )}

              {/* Detail Popover */}
              <AnimatePresence>
                {selectedCompany && mapInstance && (
                  <CompanyPopover
                    companyId={selectedCompany}
                    onClose={() => setSelectedCompany(null)}
                    energyFlows={directEnergyFlows}
                    materialFlows={materialFlows}
                    companies={companies}
                    map={mapInstance}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Flow Tooltip — rendered via portal */}
            {hoveredFlow &&
              createPortal(
                (() => {
                  const filteredEnergy = directEnergyFlows.filter((f) =>
                    energyTypeFilter.has(f.type)
                  );
                  if (hoveredFlow.type === "energy") {
                    const flow = filteredEnergy[hoveredFlow.index];
                    if (!flow) return null;
                    const src = companies[flow.source];
                    const tgt = companies[flow.target];
                    const color = energyTypeColors[flow.type] || "#FBBF24";
                    return (
                      <div
                        className="fixed z-50 pointer-events-none"
                        style={{
                          left: hoveredFlow.x + 14,
                          top: hoveredFlow.y - 10,
                        }}
                      >
                        <div className="backdrop-blur-xl bg-slate-900/95 border border-white/15 rounded-lg px-3 py-2 shadow-2xl min-w-[180px]">
                          <div className="flex items-center gap-2 mb-1">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: color }}
                            />
                            <span className="text-xs font-semibold text-white">
                              {energyTypeLabels[flow.type] || flow.type}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 space-y-0.5">
                            <div>Fra: {src?.shortName}</div>
                            <div>Til: {tgt?.shortName}</div>
                            <div className="font-mono text-slate-200 text-xs mt-1">
                              {flow.value} GWh
                            </div>
                            <div className="mt-1">
                              <span
                                className={cn(
                                  "px-1.5 py-0.5 rounded text-[9px] font-medium",
                                  flow.status === "existing"
                                    ? "bg-emerald-500/20 text-emerald-400"
                                    : flow.status === "planned"
                                      ? "bg-violet-500/20 text-violet-400"
                                      : "bg-amber-500/20 text-amber-400"
                                )}
                              >
                                {flow.status === "existing"
                                  ? "Eksisterende"
                                  : flow.status === "planned"
                                    ? "Planlagt"
                                    : "Potensiell"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  } else {
                    const flow = materialFlows[hoveredFlow.index];
                    if (!flow) return null;
                    const src = companies[flow.source];
                    const tgt = companies[flow.target];
                    return (
                      <div
                        className="fixed z-50 pointer-events-none"
                        style={{
                          left: hoveredFlow.x + 14,
                          top: hoveredFlow.y - 10,
                        }}
                      >
                        <div className="backdrop-blur-xl bg-slate-900/95 border border-white/15 rounded-lg px-3 py-2 shadow-2xl min-w-[180px]">
                          <div className="flex items-center gap-2 mb-1">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{
                                backgroundColor: src?.color || "#10B981",
                              }}
                            />
                            <span className="text-xs font-semibold text-white">
                              {flow.material}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 space-y-0.5">
                            <div>Fra: {src?.shortName}</div>
                            <div>Til: {tgt?.shortName}</div>
                            <div className="font-mono text-slate-200 text-xs mt-1">
                              {flow.volumeTonnesPerYear.toLocaleString("nb-NO")}{" "}
                              tonn/år
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span
                                className={cn(
                                  "px-1.5 py-0.5 rounded text-[9px] font-medium",
                                  flow.status === "existing"
                                    ? "bg-emerald-500/20 text-emerald-400"
                                    : "bg-amber-500/20 text-amber-400"
                                )}
                              >
                                {flow.status === "existing"
                                  ? "Eksisterende"
                                  : "Potensiell"}
                              </span>
                              <span className="text-[9px] text-slate-500 font-mono">
                                Match: {Math.round(flow.matchScore * 100)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                })(),
                document.body
              )}
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          variants={staggerContainer}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <StatCard
            label="Totale energistrømmar"
            value={totalEnergyGWh}
            unit="GWh"
            icon={<Zap className="w-5 h-5 text-amber-400" />}
            color="amber"
          />
          <StatCard
            label="Totale materialstrømmar"
            value={totalMaterialTonnes}
            unit="tonn/år"
            icon={<Recycle className="w-5 h-5 text-emerald-400" />}
            color="emerald"
          />
          <StatCard
            label="Aktive koplingar"
            value={activeConnections}
            unit="strom"
            icon={<ArrowRightLeft className="w-5 h-5 text-violet-400" />}
            color="violet"
          />
        </motion.div>
      </motion.div>
    </PageContainer>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Toggle Button
// ---------------------------------------------------------------------------
interface ToggleButtonProps {
  label: string;
  active: boolean;
  color: string;
  icon: React.ReactNode;
  onClick: () => void;
}

function ToggleButton({
  label,
  active,
  color,
  icon,
  onClick,
}: ToggleButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium",
        "backdrop-blur-md border transition-all duration-200",
        active
          ? "border-white/20 bg-white/10 text-white"
          : "border-white/5 bg-white/5 text-slate-500"
      )}
    >
      <div
        className="w-2 h-2 rounded-full transition-colors"
        style={{
          backgroundColor: active ? color : "#475569",
          boxShadow: active ? `0 0 8px ${color}60` : "none",
        }}
      />
      {icon}
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Map Legend
// ---------------------------------------------------------------------------
function MapLegend() {
  return (
    <div className="backdrop-blur-md bg-black/40 border border-white/10 rounded-lg p-3 space-y-2 min-w-[160px]">
      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
        Tegnforklaring
      </div>

      {/* Energy types */}
      <div className="space-y-1">
        <div className="text-[10px] text-slate-500 font-medium">
          Energistrommar
        </div>
        {Object.entries(energyTypeColors).map(([type, color]) => (
          <div key={type} className="flex items-center gap-2">
            <div className="w-4 h-0.5" style={{ backgroundColor: color }} />
            <span className="text-[10px] text-slate-400">
              {energyTypeLabels[type] || type}
            </span>
          </div>
        ))}
      </div>

      {/* Flow status */}
      <div className="space-y-1 pt-1 border-t border-white/5">
        <div className="text-[10px] text-slate-500 font-medium">Status</div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-slate-400" />
          <span className="text-[10px] text-slate-400">Eksisterende</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-0.5"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, #94A3B8 0px, #94A3B8 3px, transparent 3px, transparent 6px)",
            }}
          />
          <span className="text-[10px] text-slate-400">Potensiell</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-0.5"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, #94A3B8 0px, #94A3B8 6px, transparent 6px, transparent 10px)",
            }}
          />
          <span className="text-[10px] text-slate-400">Planlagt</span>
        </div>
      </div>

      {/* Material */}
      <div className="space-y-1 pt-1 border-t border-white/5">
        <div className="text-[10px] text-slate-500 font-medium">
          Materialstrømmar
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-0.5"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, #10B981 0px, #10B981 2px, transparent 2px, transparent 6px)",
            }}
          />
          <span className="text-[10px] text-slate-400">Materialflyt</span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Company Detail Popover
// ---------------------------------------------------------------------------
interface CompanyPopoverProps {
  companyId: CompanyId;
  onClose: () => void;
  energyFlows: DirectFlow[];
  materialFlows: MaterialFlow[];
  companies: Record<string, Company>;
  map: maplibregl.Map | null;
}

function CompanyPopover({
  companyId,
  onClose,
  energyFlows: eFlows,
  materialFlows: mFlows,
  companies,
  map,
}: CompanyPopoverProps) {
  const company = companies[companyId];
  if (!company) return null;

  const Icon = companyIconMap[company.icon] || Factory;
  const relatedEnergy = eFlows.filter(
    (f) => f.source === companyId || f.target === companyId
  );
  const relatedMaterial = mFlows.filter(
    (f) => f.source === companyId || f.target === companyId
  );

  // Project company position to pixel coords
  const [lng, lat] = company.coordinates;
  const projected = map
    ? map.project([lng, lat])
    : { x: 0, y: 0 };

  // Get map container size
  const container = map?.getContainer();
  const containerW = container?.clientWidth || 800;
  const goLeft = projected.x > containerW * 0.55;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 10 }}
      transition={{ duration: 0.2 }}
      className="absolute z-30 w-72"
      style={{
        top: projected.y,
        left: goLeft ? undefined : projected.x + 30,
        right: goLeft ? containerW - projected.x + 30 : undefined,
        transform: "translateY(-50%)",
      }}
    >
      <div className="backdrop-blur-xl bg-slate-900/90 border border-white/10 rounded-xl p-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                backgroundColor: `${company.color}20`,
                border: `1px solid ${company.color}40`,
              }}
            >
              <Icon className="w-4 h-4" style={{ color: company.color }} />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">
                {company.name}
              </div>
              <div className="text-[10px] text-slate-400">
                {company.sector}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors p-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <MiniStat
            label="Energi"
            value={`${company.annualEnergyGWh}`}
            unit="GWh"
            icon={<Zap className="w-3 h-3 text-amber-400" />}
          />
          <MiniStat
            label="Avfall"
            value={`${(company.annualWasteTonnes / 1000).toFixed(1)}k`}
            unit="tonn"
            icon={<Recycle className="w-3 h-3 text-emerald-400" />}
          />
          <MiniStat
            label="Ansatte"
            value={`${company.employeeCount}`}
            unit=""
            icon={<Landmark className="w-3 h-3 text-cyan-400" />}
          />
        </div>

        {/* Connected flows */}
        {relatedEnergy.length > 0 && (
          <div className="mb-2">
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Energikoplingar ({relatedEnergy.length})
            </div>
            <div className="space-y-0.5 max-h-24 overflow-y-auto">
              {relatedEnergy.slice(0, 4).map((flow, i) => {
                const other =
                  flow.source === companyId ? flow.target : flow.source;
                const otherCompany = companies[other as CompanyId];
                const direction =
                  flow.source === companyId ? "\u2192" : "\u2190";
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between text-[10px]"
                  >
                    <span className="text-slate-400">
                      {direction} {otherCompany?.shortName || other}
                    </span>
                    <span className="text-slate-300 font-mono">
                      {flow.value} GWh
                    </span>
                  </div>
                );
              })}
              {relatedEnergy.length > 4 && (
                <div className="text-[10px] text-slate-600">
                  +{relatedEnergy.length - 4} til
                </div>
              )}
            </div>
          </div>
        )}

        {relatedMaterial.length > 0 && (
          <div>
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Materialkoplingar ({relatedMaterial.length})
            </div>
            <div className="space-y-0.5 max-h-24 overflow-y-auto">
              {relatedMaterial.slice(0, 4).map((flow) => {
                const other =
                  flow.source === companyId ? flow.target : flow.source;
                const otherCompany = companies[other as CompanyId];
                const direction =
                  flow.source === companyId ? "\u2192" : "\u2190";
                return (
                  <div
                    key={flow.id}
                    className="flex items-center justify-between text-[10px]"
                  >
                    <span className="text-slate-400 truncate mr-2">
                      {direction} {otherCompany?.shortName}: {flow.material}
                    </span>
                    <span className="text-slate-300 font-mono whitespace-nowrap">
                      {flow.volumeTonnesPerYear} t
                    </span>
                  </div>
                );
              })}
              {relatedMaterial.length > 4 && (
                <div className="text-[10px] text-slate-600">
                  +{relatedMaterial.length - 4} til
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Mini Stat (inside popover)
// ---------------------------------------------------------------------------
function MiniStat({
  label,
  value,
  unit,
  icon,
}: {
  label: string;
  value: string;
  unit: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white/5 rounded-lg p-2 text-center">
      <div className="flex justify-center mb-1">{icon}</div>
      <div className="text-xs font-bold text-white">
        {value}
        {unit && (
          <span className="text-[9px] text-slate-400 ml-0.5">{unit}</span>
        )}
      </div>
      <div className="text-[9px] text-slate-500">{label}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Summary Stat Card
// ---------------------------------------------------------------------------
const statColorMap: Record<string, { bar: string; bg: string }> = {
  amber: { bar: "bg-amber-500", bg: "bg-amber-500/10" },
  emerald: { bar: "bg-emerald-500", bg: "bg-emerald-500/10" },
  violet: { bar: "bg-violet-500", bg: "bg-violet-500/10" },
};

function StatCard({
  label,
  value,
  unit,
  icon,
  color,
}: {
  label: string;
  value: number;
  unit: string;
  icon: React.ReactNode;
  color: string;
}) {
  const colors = statColorMap[color] || statColorMap.emerald;

  return (
    <motion.div
      variants={staggerItem}
      className="glass-card p-5 rounded-xl space-y-2"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">{label}</span>
        <div className="rounded-lg bg-white/5 p-2">{icon}</div>
      </div>
      <div className="flex items-baseline gap-2">
        <AnimatedNumber
          value={value}
          decimals={0}
          className="text-3xl font-bold text-slate-100"
        />
        <span className="text-sm text-slate-400">{unit}</span>
      </div>
      <div
        className={cn(
          "w-full h-1 rounded-full overflow-hidden",
          colors.bg
        )}
      >
        <motion.div
          className={cn("h-full rounded-full", colors.bar)}
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
        />
      </div>
    </motion.div>
  );
}
