import { useEffect } from "react";
import { useHubDataStore } from "@/stores/hubDataStore";
import type { HubDataset } from "@/stores/hubDataStore";

/**
 * Hook to get the active hub dataset.
 * Falls back to mock data if no hub is loaded.
 * Auto-loads mock data on first use if nothing is loaded.
 */
export function useHubData(): HubDataset {
  const activeHub = useHubDataStore((s) => s.activeHub);
  const loading = useHubDataStore((s) => s.loading);
  const loadMockData = useHubDataStore((s) => s.loadMockData);

  useEffect(() => {
    if (!activeHub && !loading) {
      loadMockData();
    }
  }, [activeHub, loading, loadMockData]);

  // Return a minimal empty hub while loading
  return activeHub ?? EMPTY_HUB;
}

const EMPTY_HUB: HubDataset = {
  id: "",
  name: "",
  createdAt: "",
  updatedAt: "",
  companies: {},
  sankeyNodes: [],
  energyFlows: [],
  surplusDeficitData: [],
  energyOptimizations: [],
  materialFlows: [],
  wasteStreams: [],
  matchingMatrix: [],
  symbiosisOpportunities: [],
  businessCases: [],
  dashboardKPIs: [],
  workPackageStatuses: [],
  aiInsights: [],
};

/**
 * Hook to get convenience derived values from hub data.
 */
/**
 * Returns true when hub data has been loaded and is ready to render.
 */
export function useIsHubReady(): boolean {
  const activeHub = useHubDataStore((s) => s.activeHub);
  return activeHub !== null;
}

export function useCompanyList() {
  const hub = useHubData();
  return Object.values(hub.companies);
}

export function useCompanyIds() {
  const hub = useHubData();
  return Object.keys(hub.companies);
}
