import { useState, useRef } from "react";
import { motion } from "motion/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  Briefcase,
  Clock,
  Landmark,
  Coins,
  Calendar,
  ChevronDown,
  CheckCircle2,
  Circle,
  AlertCircle,
} from "lucide-react";
import {
  staggerContainer,
  staggerItem,
  chartReveal,
} from "@/lib/animations";
import { cn, formatMNOK, formatNumber } from "@/lib/utils";
import { PageContainer } from "@/components/layout";
import { KPICard, SectionHeader, ChartExportMenu } from "@/components/shared";
import { useResolvedData } from "@/hooks/useResolvedData";
import type { BusinessCase, TimelinePhase } from "@/types";

// ---------------------------------------------------------------------------
// Custom Tooltip for the ROI chart
// ---------------------------------------------------------------------------
function RoiTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-slate-800 px-4 py-3 shadow-xl">
      <p className="mb-2 text-sm font-medium text-slate-200">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-xs">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-slate-400">{entry.name}:</span>
          <span className="font-semibold text-slate-100">
            {formatMNOK(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Timeline / Gantt Component
// ---------------------------------------------------------------------------
function ProjectTimeline({ phases }: { phases: TimelinePhase[] }) {
  const maxMonth = Math.max(
    ...phases.map((p) => p.startMonth + p.durationMonths)
  );

  const statusColor: Record<string, string> = {
    completed: "bg-emerald-500",
    "in-progress": "bg-amber-500",
    "not-started": "bg-slate-600",
  };

  const statusBorder: Record<string, string> = {
    completed: "border-emerald-500/30",
    "in-progress": "border-amber-500/30",
    "not-started": "border-slate-600/30",
  };

  const statusIcon: Record<string, React.ReactNode> = {
    completed: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />,
    "in-progress": <AlertCircle className="h-3.5 w-3.5 text-amber-400" />,
    "not-started": <Circle className="h-3.5 w-3.5 text-slate-500" />,
  };

  // Generate month labels
  const monthLabels: number[] = [];
  for (let i = 0; i <= maxMonth; i += Math.ceil(maxMonth / 8)) {
    monthLabels.push(i);
  }
  if (monthLabels[monthLabels.length - 1] !== maxMonth) {
    monthLabels.push(maxMonth);
  }

  return (
    <div className="space-y-3">
      {/* Month axis */}
      <div className="relative h-6 ml-[180px]">
        {monthLabels.map((m) => (
          <span
            key={m}
            className="absolute text-[10px] text-slate-500 -translate-x-1/2"
            style={{ left: `${(m / maxMonth) * 100}%` }}
          >
            Mnd {m}
          </span>
        ))}
      </div>

      {/* Phase rows */}
      {phases.map((phase, idx) => {
        const leftPct = (phase.startMonth / maxMonth) * 100;
        const widthPct = (phase.durationMonths / maxMonth) * 100;
        return (
          <motion.div
            key={phase.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1, duration: 0.4 }}
            className="flex items-center gap-3"
          >
            {/* Phase label */}
            <div className="w-[180px] shrink-0 flex items-center gap-1.5">
              {statusIcon[phase.status]}
              <span className="text-xs text-slate-300 truncate">
                {phase.name}
              </span>
            </div>

            {/* Bar track */}
            <div className="relative flex-1 h-8 rounded bg-slate-800/50">
              {/* Phase bar */}
              <motion.div
                className={cn(
                  "absolute top-1 h-6 rounded border",
                  statusColor[phase.status],
                  statusBorder[phase.status],
                  phase.status === "completed"
                    ? "bg-emerald-500/80"
                    : phase.status === "in-progress"
                      ? "bg-amber-500/70"
                      : "bg-slate-600/60"
                )}
                style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.2 + idx * 0.1, duration: 0.5 }}
              >
                {/* Milestone dots */}
                {phase.milestones.map((_, mIdx) => {
                  const pos =
                    ((mIdx + 1) / (phase.milestones.length + 1)) * 100;
                  return (
                    <div
                      key={mIdx}
                      className="absolute top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-white/80 ring-1 ring-white/30"
                      style={{ left: `${pos}%` }}
                      title={phase.milestones[mIdx]}
                    />
                  );
                })}
              </motion.div>
            </div>
          </motion.div>
        );
      })}

      {/* Legend */}
      <div className="flex items-center gap-5 mt-4 ml-[180px]">
        {(["completed", "in-progress", "not-started"] as const).map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <span className={cn("h-2.5 w-2.5 rounded-full", statusColor[s])} />
            <span className="text-[10px] text-slate-400">
              {s === "completed"
                ? "Fullfort"
                : s === "in-progress"
                  ? "Pagaende"
                  : "Ikke startet"}
            </span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-white/80 ring-1 ring-white/30" />
          <span className="text-[10px] text-slate-400">Milepael</span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Funding Type Badge
// ---------------------------------------------------------------------------
function FundingTypeBadge({ type }: { type: "grant" | "loan" | "tax-incentive" }) {
  const styles: Record<string, { bg: string; text: string; label: string }> = {
    grant: { bg: "bg-emerald-500/15", text: "text-emerald-400", label: "Tilskudd" },
    loan: { bg: "bg-sky-500/15", text: "text-sky-400", label: "Lan" },
    "tax-incentive": { bg: "bg-violet-500/15", text: "text-violet-400", label: "Skattefordel" },
  };
  const s = styles[type];
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium", s.bg, s.text)}>
      {s.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function BusinessCasePage() {
  const hub = useResolvedData();
  const { businessCases } = hub;

  const [selectedIdx, setSelectedIdx] = useState(0);
  const selectedCase: BusinessCase = businessCases[selectedIdx];
  const roiChartRef = useRef<HTMLDivElement>(null);

  const roiChartData = businessCases.map((bc) => ({
    name:
      bc.title.length > 30 ? bc.title.substring(0, 28) + "..." : bc.title,
    Investering: bc.investmentMNOK,
    "Arlig avkastning": bc.annualRevenueMNOK + bc.annualCostSavingMNOK,
  }));

  return (
    <PageContainer
      title="Forretningscase"
      description="Finansielle analyser og prosjektscenarier"
    >
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="space-y-6"
      >
        {/* ---- Case Selector ---- */}
        <motion.div variants={staggerItem}>
          <div className="relative w-full max-w-lg">
            <select
              value={selectedIdx}
              onChange={(e) => setSelectedIdx(Number(e.target.value))}
              className={cn(
                "w-full appearance-none rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl",
                "px-4 py-3 pr-10 text-sm text-slate-100",
                "focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40",
                "cursor-pointer"
              )}
            >
              {businessCases.map((bc, i) => (
                <option
                  key={bc.symbiosisId}
                  value={i}
                  className="bg-slate-800 text-slate-100"
                >
                  {bc.title}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          </div>
        </motion.div>

        {/* ---- Row 1: KPI Cards ---- */}
        <motion.div
          variants={staggerContainer}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <KPICard
            label="NPV (netto nåverdi)"
            value={selectedCase.npvMNOK}
            unit="MNOK"
            trend="up"
            trendValue={12}
            icon="DollarSign"
            decimals={1}
            provenance={selectedCase.provenance}
          />
          <KPICard
            label="IRR (internrente)"
            value={selectedCase.irr * 100}
            unit="%"
            trend="up"
            trendValue={3}
            icon="TrendingUp"
            decimals={1}
            provenance={selectedCase.provenance}
          />
          <KPICard
            label="Tilbakebetalingstid"
            value={selectedCase.paybackYears}
            unit="år"
            trend="down"
            trendValue={8}
            icon="Clock"
            decimals={1}
            provenance={selectedCase.provenance}
          />
        </motion.div>

        {/* ---- Row 2: Charts ---- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: ROI Bar Chart */}
          <motion.div variants={chartReveal} className="glass-card p-6 rounded-2xl">
            <SectionHeader
              title="ROI-sammenligning"
              description="Investering vs. årlig avkastning per prosjekt"
              icon={<Briefcase className="h-5 w-5 text-emerald-400" />}
              action={<ChartExportMenu targetRef={roiChartRef} filename="business-case" />}
            />
            <div ref={roiChartRef} className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={roiChartData}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#334155"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tick={{ fill: "#94A3B8", fontSize: 11 }}
                    axisLine={{ stroke: "#334155" }}
                    tickLine={false}
                    unit=" MNOK"
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fill: "#94A3B8", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={160}
                  />
                  <Tooltip content={<RoiTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                  <Legend
                    wrapperStyle={{ fontSize: 12, color: "#94A3B8" }}
                    iconType="circle"
                    iconSize={8}
                  />
                  <Bar
                    dataKey="Investering"
                    fill="#F59E0B"
                    radius={[0, 4, 4, 0]}
                    barSize={14}
                  />
                  <Bar
                    dataKey="Arlig avkastning"
                    fill="#10B981"
                    radius={[0, 4, 4, 0]}
                    barSize={14}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Right: Timeline / Gantt */}
          <motion.div variants={chartReveal} className="glass-card p-6 rounded-2xl">
            <SectionHeader
              title="Prosjekttidslinje"
              description="Faser, milepaler og fremdrift"
              icon={<Calendar className="h-5 w-5 text-emerald-400" />}
            />
            <ProjectTimeline phases={selectedCase.timeline} />
          </motion.div>
        </div>

        {/* ---- Row 3: Funding Opportunities ---- */}
        <div>
          <SectionHeader
            title="Finansieringsmuligheter"
            description="Relevante støtteordninger og finansieringskilder"
            icon={<Landmark className="h-5 w-5 text-emerald-400" />}
          />
          <motion.div
            variants={staggerContainer}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {selectedCase.fundingOpportunities.map((fund) => (
              <motion.div
                key={fund.name}
                variants={staggerItem}
                className="glass-card rounded-2xl p-5 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1 mr-2">
                    <h4 className="text-sm font-medium text-slate-100 leading-tight">
                      {fund.name}
                    </h4>
                    <FundingTypeBadge type={fund.type} />
                  </div>
                  <Coins className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                </div>

                <div>
                  <span className="text-xs text-slate-400">Maks belop</span>
                  <p className="text-lg font-semibold text-slate-100">
                    {formatMNOK(fund.maxAmountMNOK)}
                  </p>
                </div>

                {/* Relevance score bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Relevans</span>
                    <span className="text-slate-300 font-medium">
                      {formatNumber(fund.relevanceScore * 100, 0)}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-700/60 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-emerald-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${fund.relevanceScore * 100}%` }}
                      transition={{ duration: 0.8, delay: 0.3 }}
                    />
                  </div>
                </div>

                {fund.deadline && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Clock className="h-3 w-3" />
                    <span>
                      Frist:{" "}
                      {new Date(fund.deadline).toLocaleDateString("nb-NO", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </PageContainer>
  );
}
