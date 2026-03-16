import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Scenario, ScenarioMutation } from "@/lib/api";

interface ScenarioState {
  activeScenarioId: string | null;
  customScenarios: Scenario[];

  setActiveScenario: (id: string | null) => void;
  addCustomScenario: (scenario: Scenario) => void;
  updateCustomScenario: (id: string, data: Partial<Scenario>) => void;
  removeCustomScenario: (id: string) => void;
  addCustomMutation: (scenarioId: string, mutation: ScenarioMutation) => void;
  removeCustomMutation: (scenarioId: string, mutationId: string) => void;
  updateCustomMutation: (scenarioId: string, mutationId: string, data: Partial<ScenarioMutation>) => void;
}

export const useScenarioStore = create<ScenarioState>()(
  persist(
    (set) => ({
      activeScenarioId: null,
      customScenarios: [],

      setActiveScenario: (id) => set({ activeScenarioId: id }),

      addCustomScenario: (scenario) =>
        set((s) => ({ customScenarios: [...s.customScenarios, scenario] })),

      updateCustomScenario: (id, data) =>
        set((s) => ({
          customScenarios: s.customScenarios.map((sc) =>
            sc.id === id ? { ...sc, ...data, id } : sc
          ),
        })),

      removeCustomScenario: (id) =>
        set((s) => ({
          customScenarios: s.customScenarios.filter((sc) => sc.id !== id),
          activeScenarioId: s.activeScenarioId === id ? null : s.activeScenarioId,
        })),

      addCustomMutation: (scenarioId, mutation) =>
        set((s) => ({
          customScenarios: s.customScenarios.map((sc) =>
            sc.id === scenarioId
              ? { ...sc, mutations: [...sc.mutations, mutation] }
              : sc
          ),
        })),

      removeCustomMutation: (scenarioId, mutationId) =>
        set((s) => ({
          customScenarios: s.customScenarios.map((sc) =>
            sc.id === scenarioId
              ? { ...sc, mutations: sc.mutations.filter((m) => m.id !== mutationId) }
              : sc
          ),
        })),

      updateCustomMutation: (scenarioId, mutationId, data) =>
        set((s) => ({
          customScenarios: s.customScenarios.map((sc) =>
            sc.id === scenarioId
              ? {
                  ...sc,
                  mutations: sc.mutations.map((m) =>
                    m.id === mutationId ? { ...m, ...data } : m
                  ),
                }
              : sc
          ),
        })),
    }),
    {
      name: "suns-scenarios",
      version: 2,
      migrate: (persisted, version) => {
        const state = persisted as Record<string, unknown>;
        if (version < 2) {
          return {
            activeScenarioId: (state.activeScenarioId as string | null) ?? null,
            customScenarios: [],
          };
        }
        return state;
      },
    }
  )
);
