import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { FileText } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import type { Provenance } from "@/types";

interface ProvenanceBadgeProps {
  provenance: Provenance;
  className?: string;
}

const confidenceConfig = {
  verified: { label: "Verifisert", color: "bg-emerald-500" },
  estimated: { label: "Estimert", color: "bg-amber-500" },
  projected: { label: "Projisert", color: "bg-violet-500" },
} as const;

const TOOLTIP_WIDTH = 256; // w-64
const TOOLTIP_GAP = 8; // mb-2 / mt-2

export function ProvenanceBadge({ provenance, className }: ProvenanceBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, above: true });
  const triggerRef = useRef<HTMLSpanElement>(null);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const above = rect.top > 200;

    // Horizontal: center on trigger, but clamp to viewport
    let left = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;
    const maxLeft = window.innerWidth - TOOLTIP_WIDTH - 8;
    if (left < 8) left = 8;
    if (left > maxLeft) left = maxLeft;

    const top = above
      ? rect.top - TOOLTIP_GAP
      : rect.bottom + TOOLTIP_GAP;

    setPos({ top, left, above });
  }, []);

  useEffect(() => {
    if (showTooltip) {
      updatePosition();
    }
  }, [showTooltip, updatePosition]);

  const conf = confidenceConfig[provenance.confidence];

  // Compute arrow horizontal offset relative to tooltip
  const arrowLeft = triggerRef.current
    ? triggerRef.current.getBoundingClientRect().left +
      triggerRef.current.getBoundingClientRect().width / 2 -
      pos.left
    : TOOLTIP_WIDTH / 2;

  return (
    <span className={cn("relative inline-flex items-center", className)}>
      <span
        ref={triggerRef}
        role="button"
        tabIndex={0}
        className="inline-flex items-center justify-center w-4 h-4 text-slate-500 hover:text-slate-300 transition-colors cursor-help"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        aria-label="Vis datakilde"
      >
        <FileText className="w-3.5 h-3.5" />
      </span>

      {createPortal(
        <AnimatePresence>
          {showTooltip && (
            <motion.div
              key="provenance-tooltip"
              initial={{ opacity: 0, y: pos.above ? 4 : -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: pos.above ? 4 : -4 }}
              transition={{ duration: 0.15 }}
              style={{
                position: "fixed",
                zIndex: 9999,
                width: TOOLTIP_WIDTH,
                left: pos.left,
                ...(pos.above
                  ? { bottom: window.innerHeight - pos.top }
                  : { top: pos.top }),
              }}
              className="p-3 rounded-lg bg-slate-800/95 backdrop-blur-xl border border-white/10 shadow-2xl text-left pointer-events-auto"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              <div className="space-y-1.5">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
                    Kilde
                  </span>
                  <p className="text-xs text-slate-200 leading-snug">
                    {provenance.source}
                  </p>
                </div>

                {provenance.page && (
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
                      Referanse
                    </span>
                    <p className="text-xs text-slate-300">{provenance.page}</p>
                  </div>
                )}

                {provenance.date && (
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
                      Dato
                    </span>
                    <p className="text-xs text-slate-300">{provenance.date}</p>
                  </div>
                )}

                <div className="flex items-center gap-1.5 pt-1 border-t border-white/5">
                  <span className={cn("w-1.5 h-1.5 rounded-full", conf.color)} />
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                    {conf.label}
                  </span>
                </div>
              </div>

              {/* Arrow */}
              <div
                className={cn(
                  "absolute w-2 h-2 rotate-45",
                  "bg-slate-800/95 border-white/10",
                  pos.above
                    ? "bottom-0 translate-y-1 border-r border-b"
                    : "top-0 -translate-y-1 border-l border-t"
                )}
                style={{ left: Math.max(8, Math.min(arrowLeft - 4, TOOLTIP_WIDTH - 16)) }}
              />
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </span>
  );
}
