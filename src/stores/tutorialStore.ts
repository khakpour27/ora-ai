import { create } from "zustand";
import { persist } from "zustand/middleware";
import { tourSteps } from "@/data/tutorialContent";

interface TutorialState {
  splashCompleted: boolean;
  tourCompleted: boolean;
  tourStep: number;
  tourActive: boolean;

  completeSplash: () => void;
  startTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  resetTutorial: () => void;
}

export const useTutorialStore = create<TutorialState>()(
  persist(
    (set) => ({
      splashCompleted: false,
      tourCompleted: false,
      tourStep: 0,
      tourActive: false,

      completeSplash: () => set({ splashCompleted: true }),

      startTour: () => set({ tourActive: true, tourStep: 0 }),

      nextStep: () =>
        set((state) => {
          const next = state.tourStep + 1;
          if (next >= tourSteps.length) {
            return { tourActive: false, tourCompleted: true, tourStep: 0 };
          }
          return { tourStep: next };
        }),

      prevStep: () =>
        set((state) => ({
          tourStep: Math.max(0, state.tourStep - 1),
        })),

      skipTour: () =>
        set({ tourActive: false, tourCompleted: true, tourStep: 0 }),

      resetTutorial: () =>
        set({
          splashCompleted: false,
          tourCompleted: false,
          tourStep: 0,
          tourActive: false,
        }),
    }),
    {
      name: "suns-tutorial",
      partialize: (state) => ({
        splashCompleted: state.splashCompleted,
        tourCompleted: state.tourCompleted,
      }),
    }
  )
);
