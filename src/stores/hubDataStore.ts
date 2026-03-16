import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "@/lib/api";
import type { HubDataset } from "@/lib/api";

// Re-export for convenience
export type { HubDataset };

interface HubDataState {
  // Currently loaded hub dataset
  activeHub: HubDataset | null;
  // List of available hubs (id + name)
  hubList: { id: string; name: string; updatedAt: string }[];
  // Loading/error state
  loading: boolean;
  error: string | null;
  // Whether we're using mock data (no backend available)
  usingMockData: boolean;

  // Actions
  fetchHubList: () => Promise<void>;
  loadHub: (hubId: string) => Promise<void>;
  loadMockData: () => void;
  createHub: (name: string) => Promise<string>;
  updateActiveHub: (data: Partial<HubDataset>) => Promise<void>;
  deleteHub: (hubId: string) => Promise<void>;
  setActiveHub: (hub: HubDataset | null) => void;
  clearError: () => void;
}

export const useHubDataStore = create<HubDataState>()(
  persist(
    (set, get) => ({
      activeHub: null,
      hubList: [],
      loading: false,
      error: null,
      usingMockData: false,

      fetchHubList: async () => {
        try {
          set({ loading: true, error: null });
          const hubs = await api.listHubs();
          set({ hubList: hubs, loading: false });
        } catch (err) {
          set({ error: String(err), loading: false });
        }
      },

      loadHub: async (hubId: string) => {
        try {
          set({ loading: true, error: null });
          const hub = await api.getHub(hubId);
          set({ activeHub: hub, loading: false, usingMockData: false });
        } catch (err) {
          set({ error: String(err), loading: false });
        }
      },

      loadMockData: () => {
        // Lazy import mock data modules
        import("@/data").then((data) => {
          const mockHub: HubDataset = {
            id: "mock",
            name: "SymbioLink Øra",
            createdAt: "2024-01-01T00:00:00.000Z",
            updatedAt: new Date().toISOString(),
            companies: data.companies,
            sankeyNodes: data.sankeyNodes,
            energyFlows: data.energyFlows,
            surplusDeficitData: data.surplusDeficitData,
            energyOptimizations: data.energyOptimizations,
            materialFlows: data.materialFlows,
            wasteStreams: data.wasteStreams,
            matchingMatrix: data.matchingMatrix,
            symbiosisOpportunities: data.symbiosisOpportunities,
            businessCases: data.businessCases,
            dashboardKPIs: data.dashboardKPIs,
            workPackageStatuses: data.workPackageStatuses,
            aiInsights: data.aiInsights,
          };
          set({ activeHub: mockHub, usingMockData: true, loading: false });
        });
      },

      createHub: async (name: string) => {
        set({ loading: true, error: null });
        try {
          const hub = await api.createHub(name);
          const { hubList } = get();
          set({
            hubList: [...hubList, { id: hub.id, name: hub.name, updatedAt: hub.updatedAt }],
            activeHub: hub,
            loading: false,
            usingMockData: false,
          });
          return hub.id;
        } catch (err) {
          set({ error: String(err), loading: false });
          throw err;
        }
      },

      updateActiveHub: async (data: Partial<HubDataset>) => {
        const { activeHub } = get();
        if (!activeHub) return;

        if (activeHub.id === "mock") {
          // For mock data, just update in-memory
          set({ activeHub: { ...activeHub, ...data } as HubDataset });
          return;
        }

        try {
          const updated = await api.updateHub(activeHub.id, data);
          set({ activeHub: updated });
        } catch (err) {
          set({ error: String(err) });
        }
      },

      deleteHub: async (hubId: string) => {
        try {
          await api.deleteHub(hubId);
          const { hubList, activeHub } = get();
          set({
            hubList: hubList.filter((h) => h.id !== hubId),
            activeHub: activeHub?.id === hubId ? null : activeHub,
          });
        } catch (err) {
          set({ error: String(err) });
        }
      },

      setActiveHub: (hub) => set({ activeHub: hub }),

      clearError: () => set({ error: null }),
    }),
    {
      name: "suns-hub-data",
      // Never persist the full dataset — only remember if we were using mock data
      partialize: (state) => ({
        activeHub: null,
        hubList: [],
        loading: false,
        error: null,
        usingMockData: state.usingMockData,
      }) as unknown as HubDataState,
    }
  )
);
