import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface TourTooltipProps {
  title: string;
  description: string;
  stepNumber: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export function TourTooltip({
  title,
  description,
  stepNumber,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
  isFirst,
  isLast,
}: TourTooltipProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-[60]",
        "w-[90vw] max-w-md",
        "rounded-xl border border-white/10",
        "bg-slate-800/95 backdrop-blur-xl",
        "shadow-2xl shadow-black/40",
        "p-5"
      )}
    >
      {/* Title */}
      <h3 className="text-base font-semibold text-white mb-1.5">{title}</h3>

      {/* Description */}
      <p className="text-sm text-slate-300 leading-relaxed mb-4">
        {description}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        {/* Skip */}
        <button
          onClick={onSkip}
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          Hopp over
        </button>

        {/* Step dots */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === stepNumber
                  ? "w-4 bg-emerald-400"
                  : i < stepNumber
                    ? "w-1.5 bg-emerald-400/40"
                    : "w-1.5 bg-slate-600"
              )}
            />
          ))}
        </div>

        {/* Nav buttons */}
        <div className="flex items-center gap-2">
          {!isFirst && (
            <button
              onClick={onPrev}
              className={cn(
                "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs",
                "text-slate-300 hover:text-white hover:bg-white/5",
                "transition-colors"
              )}
            >
              <ArrowLeft className="w-3 h-3" />
              Forrige
            </button>
          )}

          <button
            onClick={onNext}
            className={cn(
              "flex items-center gap-1 px-4 py-1.5 rounded-lg text-xs font-medium",
              "bg-emerald-600 hover:bg-emerald-500 text-white",
              "transition-colors"
            )}
          >
            {isLast ? (
              <>
                Fullf\u00f8r
                <Check className="w-3 h-3" />
              </>
            ) : (
              <>
                Neste
                <ArrowRight className="w-3 h-3" />
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
