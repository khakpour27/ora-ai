import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { staggerItem } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { AIConfidenceBadge } from "./AIConfidenceBadge";
import { CompanyAvatar } from "./CompanyAvatar";
import { ProvenanceBadge } from "./ProvenanceBadge";
import {
  Lightbulb,
  AlertTriangle,
  Zap,
  Layers,
  Target,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import type { AIInsight } from "@/types";

const categoryIcons: Record<string, LucideIcon> = {
  energy: Zap,
  material: Layers,
  symbiosis: Target,
  risk: AlertTriangle,
  opportunity: Lightbulb,
};

const categoryColors: Record<string, string> = {
  energy: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  material: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  symbiosis: "text-violet-400 bg-violet-500/10 border-violet-500/20",
  risk: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  opportunity: "text-sky-400 bg-sky-500/10 border-sky-500/20",
};

const categoryLabels: Record<string, string> = {
  energy: "Energi",
  material: "Materiale",
  symbiosis: "Symbiose",
  risk: "Risiko",
  opportunity: "Mulighet",
};

const priorityConfig = {
  high: { color: "bg-rose-500", label: "Hoy" },
  medium: { color: "bg-amber-500", label: "Medium" },
  low: { color: "bg-slate-500", label: "Lav" },
} as const;

interface AIInsightPanelProps {
  insight: AIInsight;
  typewriter?: boolean;
}

export function AIInsightPanel({
  insight,
  typewriter = false,
}: AIInsightPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const Icon = categoryIcons[insight.category] ?? Lightbulb;
  const colorClasses =
    categoryColors[insight.category] ?? "text-slate-400 bg-slate-500/10 border-slate-500/20";
  const categoryLabel = categoryLabels[insight.category] ?? insight.category;
  const priority = priorityConfig[insight.priority];

  return (
    <motion.div
      variants={staggerItem}
      className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 relative hover:z-10"
    >
      <button
        type="button"
        className="w-full text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className={cn(
                "mt-0.5 shrink-0 rounded-lg p-1.5 border",
                colorClasses
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider border",
                    colorClasses
                  )}
                >
                  {categoryLabel}
                </span>
                <span className="flex items-center gap-1 text-[10px] text-slate-500">
                  <span
                    className={cn("h-1.5 w-1.5 rounded-full", priority.color)}
                  />
                  {priority.label} prioritet
                </span>
              </div>
              <h3 className="text-sm font-semibold text-slate-100 leading-snug">
                {insight.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <AIConfidenceBadge confidence={insight.confidence} size="sm" />
            {insight.provenance && <ProvenanceBadge provenance={insight.provenance} />}
            <motion.div
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-4 w-4 text-slate-500" />
            </motion.div>
          </div>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="pt-3 mt-3 border-t border-white/5">
              {typewriter ? (
                <TypewriterBody text={insight.body} />
              ) : (
                <p className="text-xs text-slate-400 leading-relaxed">
                  {insight.body}
                </p>
              )}

              {insight.relatedCompanies.length > 0 && (
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                    Relaterte:
                  </span>
                  {insight.relatedCompanies.map((cid) => (
                    <CompanyAvatar
                      key={cid}
                      companyId={cid}
                      size="sm"
                      showName
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function TypewriterBody({ text }: { text: string }) {
  const [displayedText, setDisplayedText] = useState("");
  const [done, setDone] = useState(false);

  useState(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        setDone(true);
        clearInterval(interval);
      }
    }, 15);
    return () => clearInterval(interval);
  });

  return (
    <p className="text-xs text-slate-400 leading-relaxed">
      {displayedText}
      {!done && (
        <span className="inline-block w-0.5 h-3 bg-emerald-400 animate-pulse ml-0.5 align-middle" />
      )}
    </p>
  );
}
