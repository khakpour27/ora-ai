import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

interface AIProcessingOverlayProps {
  isVisible: boolean;
  onComplete?: () => void;
}

const textSequence = [
  "Analyserer data...",
  "Identifiserer monstre...",
  "Rangerer muligheter...",
  "Ferdig!",
];

const STEP_DURATION = 750;

export function AIProcessingOverlay({
  isVisible,
  onComplete,
}: AIProcessingOverlayProps) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setStepIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setStepIndex((prev) => {
        const next = prev + 1;
        if (next >= textSequence.length) {
          clearInterval(interval);
          setTimeout(() => {
            onComplete?.();
          }, 500);
          return prev;
        }
        return next;
      });
    }, STEP_DURATION);

    return () => clearInterval(interval);
  }, [isVisible, onComplete]);

  const size = 80;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="flex flex-col items-center gap-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-10"
          >
            <div className="relative" style={{ width: size, height: size }}>
              <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                className="-rotate-90"
              >
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke="rgba(148, 163, 184, 0.15)"
                  strokeWidth={strokeWidth}
                />
                <motion.circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke="#10B981"
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  animate={{
                    strokeDashoffset: [
                      circumference,
                      circumference * 0.25,
                      circumference,
                    ],
                    rotate: [0, 360],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  style={{ transformOrigin: "center" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="h-6 w-6 rounded-full border-2 border-emerald-400/30 border-t-emerald-400"
                />
              </div>
            </div>

            <div className="flex flex-col items-center gap-2">
              <AnimatePresence mode="wait">
                <motion.p
                  key={stepIndex}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    "text-sm font-medium",
                    stepIndex === textSequence.length - 1
                      ? "text-emerald-400"
                      : "text-slate-300"
                  )}
                >
                  {textSequence[stepIndex]}
                </motion.p>
              </AnimatePresence>

              <div className="flex items-center gap-1.5 mt-1">
                {textSequence.map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1 rounded-full transition-all duration-300",
                      i <= stepIndex
                        ? "w-4 bg-emerald-400"
                        : "w-2 bg-slate-600"
                    )}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
