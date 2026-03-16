import { motion } from "motion/react";
import { ResponsiveRadar } from "@nivo/radar";
import {
  Award,
  Users,
  Package,
  CheckCircle2,
  XCircle,
  Scale,
  FileText,
  Crown,
} from "lucide-react";
import {
  staggerContainer,
  staggerItem,
  chartReveal,
} from "@/lib/animations";
import { cn } from "@/lib/utils";
import { PageContainer } from "@/components/layout";
import { DonutGauge, SectionHeader } from "@/components/shared";
import { tenderBids, evaluationWeights } from "@/data/tenderBids";
import { theme } from "@/lib/theme";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const criterionLabels: Record<string, string> = {
  understanding: "Forstaelse",
  competence: "Kompetanse",
  methodology: "Metodikk",
  price: "Pris",
};

const bidColors = ["#3B82F6", "#F59E0B", "#10B981"];

// Sort bids by totalWeightedScore descending
const sortedBids = [...tenderBids].sort(
  (a, b) => b.totalWeightedScore - a.totalWeightedScore
);

const winningBidId = sortedBids[0].id;

// Rank medal colors
const rankColors = ["text-amber-400", "text-slate-300", "text-amber-700"];
const rankBgColors = [
  "bg-amber-400/10",
  "bg-slate-400/10",
  "bg-amber-700/10",
];

// ---------------------------------------------------------------------------
// Radar chart data
// ---------------------------------------------------------------------------
const radarData = Object.keys(criterionLabels).map((key) => {
  const entry: Record<string, string | number> = {
    criterion: criterionLabels[key],
  };
  tenderBids.forEach((bid) => {
    entry[bid.supplierName] = bid.scores[key as keyof typeof bid.scores];
  });
  return entry;
});

// ---------------------------------------------------------------------------
// Format price to NOK
// ---------------------------------------------------------------------------
function formatNOK(value: number): string {
  return value.toLocaleString("nb-NO", {
    style: "currency",
    currency: "NOK",
    maximumFractionDigits: 0,
  });
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function TenderEvaluationPage() {
  return (
    <PageContainer
      title="Anbudsevaluering"
      description="AI-assistert evaluering av leverandortilbud"
    >
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="space-y-6"
      >
        {/* ---- Row 1: Evaluation Criteria Weights ---- */}
        <div>
          <SectionHeader
            title="Evalueringskriterier"
            description="Vekting av kvalifikasjonskrav"
            icon={<Scale className="h-5 w-5 text-emerald-400" />}
          />
          <motion.div
            variants={staggerContainer}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4"
          >
            {evaluationWeights.map((ew) => (
              <motion.div
                key={ew.criterion}
                variants={staggerItem}
                className="glass-card rounded-2xl p-4 flex flex-col items-center"
              >
                <DonutGauge
                  value={ew.weight * 100}
                  label={criterionLabels[ew.criterion] || ew.criterion}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* ---- Row 2: Scoring Table ---- */}
        <motion.div variants={chartReveal} className="glass-card p-6 rounded-2xl">
          <SectionHeader
            title="Scoringstabell"
            description="Samlet vurdering av alle tilbud"
            icon={<FileText className="h-5 w-5 text-emerald-400" />}
          />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">
                    Leverandor
                  </th>
                  <th className="text-center py-3 px-3 text-slate-400 font-medium">
                    Forstaelse (40%)
                  </th>
                  <th className="text-center py-3 px-3 text-slate-400 font-medium">
                    Kompetanse (25%)
                  </th>
                  <th className="text-center py-3 px-3 text-slate-400 font-medium">
                    Metodikk (20%)
                  </th>
                  <th className="text-center py-3 px-3 text-slate-400 font-medium">
                    Pris (20%)
                  </th>
                  <th className="text-center py-3 px-3 text-slate-400 font-medium">
                    Pris (eks. MVA)
                  </th>
                  <th className="text-center py-3 px-3 text-slate-400 font-medium">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedBids.map((bid, idx) => {
                  const isWinner = bid.id === winningBidId;
                  return (
                    <tr
                      key={bid.id}
                      className={cn(
                        "border-b border-white/5 transition-colors",
                        isWinner
                          ? "bg-emerald-500/5"
                          : "hover:bg-white/[0.02]"
                      )}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {idx === 0 && (
                            <Crown className="h-4 w-4 text-amber-400" />
                          )}
                          <span
                            className={cn(
                              "font-medium",
                              isWinner ? "text-emerald-300" : "text-slate-200"
                            )}
                          >
                            {bid.supplierName}
                          </span>
                        </div>
                      </td>
                      <td className="text-center py-3 px-3 text-slate-300">
                        {bid.scores.understanding.toFixed(1)}
                      </td>
                      <td className="text-center py-3 px-3 text-slate-300">
                        {bid.scores.competence.toFixed(1)}
                      </td>
                      <td className="text-center py-3 px-3 text-slate-300">
                        {bid.scores.methodology.toFixed(1)}
                      </td>
                      <td className="text-center py-3 px-3 text-slate-300">
                        {bid.scores.price.toFixed(1)}
                      </td>
                      <td className="text-center py-3 px-3 text-slate-300 font-mono text-xs">
                        {formatNOK(bid.priceExVatNOK)}
                      </td>
                      <td className="text-center py-3 px-3">
                        <span
                          className={cn(
                            "inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-bold",
                            rankBgColors[idx],
                            rankColors[idx]
                          )}
                        >
                          {bid.totalWeightedScore.toFixed(1)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* ---- Row 3: Radar + Comparison Cards ---- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Radar Chart */}
          <motion.div variants={chartReveal} className="glass-card p-6 rounded-2xl">
            <SectionHeader
              title="Radarsammenligning"
              description="Visuell sammenligning av alle tilbydere"
              icon={<Award className="h-5 w-5 text-emerald-400" />}
            />
            <div className="h-[400px]">
              <ResponsiveRadar
                data={radarData}
                keys={tenderBids.map((b) => b.supplierName)}
                indexBy="criterion"
                maxValue={10}
                margin={{ top: 40, right: 80, bottom: 40, left: 80 }}
                gridShape="circular"
                gridLevels={5}
                fillOpacity={0.15}
                borderWidth={2}
                borderColor={{ from: "color" }}
                colors={bidColors}
                dotSize={6}
                dotBorderWidth={2}
                dotBorderColor={{ from: "color" }}
                dotColor="transparent"
                enableDotLabel={false}
                animate={true}
                motionConfig="gentle"
                theme={theme.nivoTheme}
                legends={[
                  {
                    anchor: "top-left",
                    direction: "column",
                    translateX: -60,
                    translateY: -30,
                    itemWidth: 100,
                    itemHeight: 18,
                    itemTextColor: "#94A3B8",
                    symbolSize: 10,
                    symbolShape: "circle",
                  },
                ]}
              />
            </div>
          </motion.div>

          {/* Right: Bid Comparison Cards */}
          <motion.div variants={chartReveal} className="space-y-4">
            <SectionHeader
              title="Tilbudsdetaljer"
              description="Noekkeltall og samsvar per leverandor"
              icon={<Package className="h-5 w-5 text-emerald-400" />}
            />
            <div className="grid grid-cols-1 gap-4">
              {sortedBids.map((bid, idx) => {
                const isWinner = bid.id === winningBidId;
                return (
                  <motion.div
                    key={bid.id}
                    variants={staggerItem}
                    className={cn(
                      "glass-card rounded-2xl p-5 space-y-4",
                      isWinner &&
                        "ring-1 ring-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                    )}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isWinner && (
                          <Crown className="h-4 w-4 text-amber-400" />
                        )}
                        <h4
                          className={cn(
                            "font-semibold",
                            isWinner ? "text-emerald-300" : "text-slate-100"
                          )}
                        >
                          {bid.supplierName}
                        </h4>
                        {isWinner && (
                          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                            Anbefalt
                          </span>
                        )}
                      </div>
                      <span
                        className={cn(
                          "text-lg font-bold",
                          rankColors[idx]
                        )}
                      >
                        {bid.totalWeightedScore.toFixed(1)}
                      </span>
                    </div>

                    {/* Key details */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                          Pris
                        </span>
                        <p className="text-sm font-medium text-slate-200 font-mono">
                          {formatNOK(bid.priceExVatNOK)}
                        </p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                          Team
                        </span>
                        <p className="text-sm font-medium text-slate-200 flex items-center gap-1">
                          <Users className="h-3 w-3 text-slate-400" />
                          {bid.teamSize} personer
                        </p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                          Arbeidspakker
                        </span>
                        <p className="text-sm font-medium text-slate-200">
                          {bid.workPackages.join(", ")}
                        </p>
                      </div>
                    </div>

                    {/* Compliance flags */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                        Samsvarskontroll
                      </span>
                      <div className="grid grid-cols-1 gap-1">
                        {bid.complianceFlags.slice(0, 4).map((flag) => (
                          <div
                            key={flag.requirement}
                            className="flex items-start gap-1.5"
                          >
                            {flag.met ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            ) : (
                              <XCircle className="h-3.5 w-3.5 text-rose-400 shrink-0 mt-0.5" />
                            )}
                            <span
                              className={cn(
                                "text-xs leading-tight",
                                flag.met
                                  ? "text-slate-300"
                                  : "text-rose-300"
                              )}
                            >
                              {flag.requirement}
                            </span>
                          </div>
                        ))}
                        {bid.complianceFlags.length > 4 && (
                          <span className="text-[10px] text-slate-500 ml-5">
                            +{bid.complianceFlags.length - 4} flere krav oppfylt
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </PageContainer>
  );
}
