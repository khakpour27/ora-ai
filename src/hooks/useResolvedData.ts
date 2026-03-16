import { useMemo } from "react";
import { useHubData } from "./useHubData";
import { useScenarioStore } from "@/stores/scenarioStore";
import { SCENARIO_PRESETS } from "@/data/scenarioPresets";
import type { HubDataset } from "@/stores/hubDataStore";
import type { ScenarioMutation } from "@/lib/api";

export interface ResolvedData extends HubDataset {
  isScenario: boolean;
  scenarioName?: string;
  scenarioColor?: string;
}

/**
 * Merges base hub data with active scenario mutations.
 * All visualization pages should use this instead of useHubData() directly.
 */
export function useResolvedData(): ResolvedData {
  const base = useHubData();
  const activeScenarioId = useScenarioStore((s) => s.activeScenarioId);
  const customScenarios = useScenarioStore((s) => s.customScenarios);

  return useMemo(() => {
    if (!activeScenarioId) {
      return { ...base, isScenario: false };
    }

    const scenario =
      SCENARIO_PRESETS.find((s) => s.id === activeScenarioId) ??
      customScenarios.find((s) => s.id === activeScenarioId);
    if (!scenario) {
      return { ...base, isScenario: false };
    }

    const resolved = applyMutations(base, scenario.mutations);
    return {
      ...resolved,
      isScenario: true,
      scenarioName: scenario.name,
      scenarioColor: scenario.color,
    };
  }, [base, activeScenarioId, customScenarios]);
}

/**
 * Apply scenario mutations to a base dataset.
 * Returns a new dataset with mutations applied.
 */
function applyMutations(base: HubDataset, mutations: ScenarioMutation[]): HubDataset {
  // Deep clone to avoid mutating the original
  const result: HubDataset = JSON.parse(JSON.stringify(base));

  for (const mutation of mutations) {
    switch (mutation.entity) {
      case "company":
        applyCompanyMutation(result, mutation);
        break;
      case "energyFlow":
        applyEnergyFlowMutation(result, mutation);
        break;
      case "materialFlow":
        applyMaterialFlowMutation(result, mutation);
        break;
      case "businessCase":
        applyBusinessCaseMutation(result, mutation);
        break;
      case "symbiosisOpportunity":
        applySymbiosisMutation(result, mutation);
        break;
    }
  }

  return result;
}

function applyCompanyMutation(hub: HubDataset, m: ScenarioMutation) {
  if (m.type === "add" && m.data) {
    const id = (m.data as { id?: string }).id ?? m.entityId ?? "";
    hub.companies[id] = { ...hub.companies[id], ...m.data } as HubDataset["companies"][string];
  } else if (m.type === "modify" && m.entityId && m.data) {
    if (hub.companies[m.entityId]) {
      hub.companies[m.entityId] = { ...hub.companies[m.entityId], ...m.data } as HubDataset["companies"][string];
    }
  } else if (m.type === "delete" && m.entityId) {
    delete hub.companies[m.entityId];
  }
}

function applyEnergyFlowMutation(hub: HubDataset, m: ScenarioMutation) {
  if (m.type === "add" && m.data) {
    hub.energyFlows.push(m.data as unknown as HubDataset["energyFlows"][number]);
  } else if (m.type === "modify" && m.entityId != null && m.data) {
    const idx = parseInt(m.entityId, 10);
    if (idx >= 0 && idx < hub.energyFlows.length) {
      hub.energyFlows[idx] = { ...hub.energyFlows[idx], ...m.data } as HubDataset["energyFlows"][number];
    }
  } else if (m.type === "delete" && m.entityId != null) {
    const idx = parseInt(m.entityId, 10);
    if (idx >= 0 && idx < hub.energyFlows.length) {
      hub.energyFlows.splice(idx, 1);
    }
  }
}

function applyMaterialFlowMutation(hub: HubDataset, m: ScenarioMutation) {
  if (m.type === "add" && m.data) {
    hub.materialFlows.push(m.data as unknown as HubDataset["materialFlows"][number]);
  } else if (m.type === "modify" && m.entityId && m.data) {
    const idx = hub.materialFlows.findIndex((f) => f.id === m.entityId);
    if (idx !== -1) {
      hub.materialFlows[idx] = { ...hub.materialFlows[idx], ...m.data } as HubDataset["materialFlows"][number];
    }
  } else if (m.type === "delete" && m.entityId) {
    hub.materialFlows = hub.materialFlows.filter((f) => f.id !== m.entityId);
  }
}

function applyBusinessCaseMutation(hub: HubDataset, m: ScenarioMutation) {
  if (m.type === "add" && m.data) {
    hub.businessCases.push(m.data as unknown as HubDataset["businessCases"][number]);
  } else if (m.type === "modify" && m.entityId && m.data) {
    const idx = hub.businessCases.findIndex((b) => b.symbiosisId === m.entityId);
    if (idx !== -1) {
      hub.businessCases[idx] = { ...hub.businessCases[idx], ...m.data } as HubDataset["businessCases"][number];
    }
  } else if (m.type === "delete" && m.entityId) {
    hub.businessCases = hub.businessCases.filter((b) => b.symbiosisId !== m.entityId);
  }
}

function applySymbiosisMutation(hub: HubDataset, m: ScenarioMutation) {
  if (m.type === "add" && m.data) {
    hub.symbiosisOpportunities.push(m.data as unknown as HubDataset["symbiosisOpportunities"][number]);
  } else if (m.type === "modify" && m.entityId && m.data) {
    const idx = hub.symbiosisOpportunities.findIndex((s) => s.id === m.entityId);
    if (idx !== -1) {
      hub.symbiosisOpportunities[idx] = { ...hub.symbiosisOpportunities[idx], ...m.data } as HubDataset["symbiosisOpportunities"][number];
    }
  } else if (m.type === "delete" && m.entityId) {
    hub.symbiosisOpportunities = hub.symbiosisOpportunities.filter((s) => s.id !== m.entityId);
  }
}
