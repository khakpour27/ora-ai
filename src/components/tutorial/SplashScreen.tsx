import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { TypewriterText } from "@/components/demo/TypewriterText";
import { useAnimatedCounter } from "@/hooks/useAnimatedCounter";
import { staggerContainer, staggerItem, glowPulse } from "@/lib/animations";
import { companyList } from "@/data/companies";
import { splashContent } from "@/data/tutorialContent";

interface SplashScreenProps {
  isVisible: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

type Phase = 1 | 2 | 3 | 4 | 5;

const PHASE_DURATIONS: Record<Phase, number> = {
  1: 3500,
  2: 5000,  // fallback — typewriter-driven
  3: 5000,  // fallback — typewriter-driven
  4: 5500,
  5: Infinity, // user-driven
};

// Pause after typewriter finishes (ms) — gives time to read completed text
const POST_TYPEWRITER_PAUSE = 3000;

function MetricCounter({
  value,
  label,
  decimals,
  started,
}: {
  value: number;
  label: string;
  decimals: number;
  started: boolean;
}) {
  const count = useAnimatedCounter(value, 2000, started);

  const formatted =
    decimals > 0
      ? count.toLocaleString("nb-NO", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })
      : Math.round(count).toLocaleString("nb-NO");

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-3xl md:text-4xl font-bold text-emerald-400 font-mono tabular-nums">
        {formatted}
      </span>
      <span className="text-xs md:text-sm text-slate-400 text-center max-w-[140px]">
        {label}
      </span>
    </div>
  );
}

// Simple COWI-style logo mark (geometric)
function CowiLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* C */}
      <path
        d="M8 8C8 4 12 0 20 0C26 0 30 3 30 3L27 8C27 8 24 6 20 6C15 6 14 9 14 12V28C14 31 15 34 20 34C24 34 27 32 27 32L30 37C30 37 26 40 20 40C12 40 8 36 8 32V8Z"
        fill="white"
      />
      {/* O */}
      <path
        d="M36 8C36 4 40 0 48 0C56 0 60 4 60 8V32C60 36 56 40 48 40C40 40 36 36 36 32V8ZM42 8V32C42 34 44 34 48 34C52 34 54 34 54 32V8C54 6 52 6 48 6C44 6 42 6 42 8Z"
        fill="white"
      />
      {/* W */}
      <path
        d="M64 0H70L76 28L82 0H88L94 28L100 0H106L96 40H90L84 14L78 40H72L64 0Z"
        fill="white"
      />
      {/* I */}
      <path d="M110 0H116V40H110V0Z" fill="white" />
    </svg>
  );
}

export function SplashScreen({ isVisible, onComplete, onSkip }: SplashScreenProps) {
  const [phase, setPhase] = useState<Phase>(1);
  const [typewriterDone2, setTypewriterDone2] = useState(false);
  const [typewriterDone3, setTypewriterDone3] = useState(false);

  // Auto-advance phases with timers
  useEffect(() => {
    if (!isVisible) {
      setPhase(1);
      setTypewriterDone2(false);
      setTypewriterDone3(false);
      return;
    }

    if (phase === 5) return; // user-driven
    if (phase === 2 && !typewriterDone2) return; // wait for typewriter
    if (phase === 3 && !typewriterDone3) return; // wait for typewriter

    const duration = PHASE_DURATIONS[phase];
    if (duration === Infinity) return;

    const delay = phase === 2 || phase === 3 ? POST_TYPEWRITER_PAUSE : duration;

    const timeout = setTimeout(() => {
      setPhase((p) => Math.min(p + 1, 5) as Phase);
    }, delay);

    return () => clearTimeout(timeout);
  }, [isVisible, phase, typewriterDone2, typewriterDone3]);

  const handleComplete = useCallback(() => {
    onComplete();
  }, [onComplete]);

  const handleSkipAll = useCallback(() => {
    onSkip();
  }, [onSkip]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 overflow-hidden"
        >
          {/* Subtle background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.05)_0%,transparent_70%)]" />

          {/* Content container */}
          <div className="relative z-10 flex flex-col items-center justify-center px-8 max-w-3xl w-full">
            <AnimatePresence mode="wait">
              {/* ── Phase 1: COWI Logo ── */}
              {phase === 1 && (
                <motion.div
                  key="phase1"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="flex flex-col items-center gap-4"
                >
                  <motion.div
                    variants={glowPulse}
                    animate="animate"
                    className="p-6 rounded-2xl"
                  >
                    <CowiLogo className="w-48 h-16" />
                  </motion.div>
                  <p className="text-slate-400 text-sm tracking-widest uppercase">
                    {splashContent.phase1.subtitle}
                  </p>
                </motion.div>
              )}

              {/* ── Phase 2: Project Context ── */}
              {phase === 2 && (
                <motion.div
                  key="phase2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.5 }}
                  className="flex flex-col items-center gap-6"
                >
                  <h1 className="text-3xl md:text-4xl font-bold text-white text-center">
                    {splashContent.phase2.title}
                  </h1>
                  <div className="max-w-xl w-full min-h-[120px]">
                    <TypewriterText
                      text={splashContent.phase2.description}
                      speed={30}
                      showCursor={false}
                      className="text-slate-300 text-base md:text-lg leading-relaxed block text-left"
                      onComplete={() => setTypewriterDone2(true)}
                    />
                  </div>

                  {/* Company dots */}
                  {typewriterDone2 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      className="flex flex-wrap justify-center gap-3 mt-2"
                    >
                      {companyList.map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center gap-1.5 text-xs text-slate-400"
                        >
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: c.color }}
                          />
                          {c.shortName}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* ── Phase 3: COWI Recommendation ── */}
              {phase === 3 && (
                <motion.div
                  key="phase3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.5 }}
                  className="flex flex-col items-center gap-6"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
                      <Sparkles className="w-5 h-5 text-violet-400" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-white">
                      {splashContent.phase3.heading}
                    </h2>
                  </div>

                  <div className="max-w-xl w-full min-h-[100px]">
                    <TypewriterText
                      text={splashContent.phase3.description}
                      speed={30}
                      showCursor={false}
                      className="text-slate-300 text-base md:text-lg leading-relaxed block text-left"
                      onComplete={() => setTypewriterDone3(true)}
                    />
                  </div>

                  {/* Capability bullets */}
                  {typewriterDone3 && (
                    <motion.div
                      variants={staggerContainer}
                      initial="initial"
                      animate="animate"
                      className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2"
                    >
                      {splashContent.phase3.capabilities.map((cap) => (
                        <motion.div
                          key={cap.label}
                          variants={staggerItem}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span className="text-sm text-slate-200">
                            {cap.label}
                          </span>
                          {cap.ap && (
                            <span className="text-[10px] text-slate-500 ml-auto">
                              {cap.ap}
                            </span>
                          )}
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* ── Phase 4: Key Metrics ── */}
              {phase === 4 && (
                <motion.div
                  key="phase4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.5 }}
                  className="flex flex-col items-center gap-8"
                >
                  <h2 className="text-xl md:text-2xl font-semibold text-white">
                    KI-analyse har identifisert
                  </h2>
                  <motion.div
                    variants={staggerContainer}
                    initial="initial"
                    animate="animate"
                    className="flex flex-wrap justify-center gap-8 md:gap-12"
                  >
                    {splashContent.phase4.metrics.map((m) => (
                      <motion.div key={m.label} variants={staggerItem}>
                        <MetricCounter
                          value={m.value}
                          label={m.label}
                          decimals={m.decimals}
                          started={phase === 4}
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                </motion.div>
              )}

              {/* ── Phase 5: CTA ── */}
              {phase === 5 && (
                <motion.div
                  key="phase5"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="flex flex-col items-center gap-6"
                >
                  <h2 className="text-xl md:text-2xl font-semibold text-white text-center">
                    Klar til å utforske?
                  </h2>
                  <p className="text-slate-400 text-sm text-center max-w-md">
                    Verktøyet gir en interaktiv demonstrasjon av hvordan
                    KI-basert analyse kan støtte alle arbeidspakker i Sirkulære
                    Sunndal Hub.
                  </p>

                  <motion.button
                    onClick={handleComplete}
                    className={cn(
                      "group flex items-center gap-2 px-8 py-3 rounded-xl",
                      "bg-emerald-600 hover:bg-emerald-500 text-white font-semibold",
                      "transition-all duration-200",
                      "shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40"
                    )}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {splashContent.phase5.cta}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                  </motion.button>

                  <button
                    onClick={handleSkipAll}
                    className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {splashContent.phase5.skip}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Phase indicator dots — flows below content */}
            <div className="flex items-center gap-2 mt-8">
              {[1, 2, 3, 4, 5].map((p) => (
                <div
                  key={p}
                  className={cn(
                    "h-1 rounded-full transition-all duration-500",
                    p === phase
                      ? "w-6 bg-emerald-400"
                      : p < phase
                        ? "w-2 bg-emerald-400/40"
                        : "w-2 bg-slate-700"
                  )}
                />
              ))}
            </div>

          {/* Skip button — visible on phases 1–4, below progress dots */}
          {phase < 5 && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              onClick={handleSkipAll}
              className="mt-4 text-sm text-slate-500 hover:text-slate-300 transition-colors"
            >
              Hopp over →
            </motion.button>
          )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
