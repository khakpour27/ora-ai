import { create } from "zustand";
import { persist } from "zustand/middleware";

type AnalysisKey = "energi" | "materialstrom" | "symbiose" | "forretningscase";

interface AnalysisState {
  /** Timestamps (ms) of when each analysis page was first "run" */
  completedAt: Partial<Record<AnalysisKey, number>>;

  /** Mark an analysis as completed (idempotent — first run wins) */
  completeAnalysis: (key: AnalysisKey) => void;

  /** Check if an analysis has been completed at least once */
  hasCompleted: (key: AnalysisKey) => boolean;

  /** Reset all analysis state (e.g. for demo resets) */
  resetAll: () => void;
}

export const useAnalysisStore = create<AnalysisState>()(
  persist(
    (set, get) => ({
      completedAt: {},

      completeAnalysis: (key) =>
        set((state) => {
          if (state.completedAt[key]) return state; // already recorded
          return { completedAt: { ...state.completedAt, [key]: Date.now() } };
        }),

      hasCompleted: (key) => !!get().completedAt[key],

      resetAll: () => set({ completedAt: {} }),
    }),
    {
      name: "suns-analysis",
      partialize: (state) => ({ completedAt: state.completedAt }),
    }
  )
);
