/**
 * API client for the suns-ai backend.
 * All endpoints return typed data matching the frontend interfaces.
 */
import type {
  Company,
  EnergyFlow,
  MaterialFlow,
  SymbiosisOpportunity,
  BusinessCase,
} from "@/types";

// HubDataset type shared between frontend and backend
export interface HubDataset {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  companies: Record<string, Company>;
  sankeyNodes: { id: string; label: string; color: string }[];
  energyFlows: EnergyFlow[];
  surplusDeficitData: import("@/types").EnergySurplusDeficit[];
  energyOptimizations: import("@/types").EnergyOptimization[];
  materialFlows: MaterialFlow[];
  wasteStreams: import("@/types").WasteStream[];
  matchingMatrix: import("@/types").MatchingMatrixCell[];
  symbiosisOpportunities: SymbiosisOpportunity[];
  businessCases: BusinessCase[];
  dashboardKPIs: import("@/types").KPIMetric[];
  workPackageStatuses: import("@/types").WorkPackageStatus[];
  aiInsights: import("@/types").AIInsight[];
}

export interface ScenarioMutation {
  id: string;
  type: "add" | "modify" | "delete";
  entity: "energyFlow" | "materialFlow" | "company" | "businessCase" | "symbiosisOpportunity";
  entityId?: string;
  data?: Record<string, unknown>;
  description: string;
}

export interface Scenario {
  id: string;
  hubId: string;
  name: string;
  description: string;
  mutations: ScenarioMutation[];
  color: string;
  createdAt: string;
}

// API base URL — configurable via env or runtime config
function getBaseUrl(): string {
  // Runtime config (injected by docker-entrypoint.sh)
  const runtimeConfig = (window as unknown as { __RUNTIME_CONFIG__?: { API_URL?: string } }).__RUNTIME_CONFIG__;
  if (runtimeConfig?.API_URL) return runtimeConfig.API_URL;

  // Vite env
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;

  // Default: same origin /api or localhost in dev
  if (import.meta.env.DEV) return "http://localhost:8080";
  return "";
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const base = getBaseUrl();
  const url = `${base}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// ── Hub endpoints ──

export const api = {
  // Hubs
  listHubs(): Promise<{ id: string; name: string; updatedAt: string }[]> {
    return request("/api/hubs");
  },

  getHub(hubId: string): Promise<HubDataset> {
    return request(`/api/hubs/${hubId}`);
  },

  createHub(name: string): Promise<HubDataset> {
    return request("/api/hubs", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  },

  updateHub(hubId: string, data: Partial<HubDataset>): Promise<HubDataset> {
    return request(`/api/hubs/${hubId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  deleteHub(hubId: string): Promise<void> {
    return request(`/api/hubs/${hubId}`, { method: "DELETE" });
  },

  // Companies
  listCompanies(hubId: string): Promise<Company[]> {
    return request(`/api/hubs/${hubId}/companies`);
  },

  addCompany(hubId: string, company: Omit<Company, "id"> & { id?: string }): Promise<Company> {
    return request(`/api/hubs/${hubId}/companies`, {
      method: "POST",
      body: JSON.stringify(company),
    });
  },

  updateCompany(hubId: string, companyId: string, data: Partial<Company>): Promise<Company> {
    return request(`/api/hubs/${hubId}/companies/${companyId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  deleteCompany(hubId: string, companyId: string): Promise<void> {
    return request(`/api/hubs/${hubId}/companies/${companyId}`, { method: "DELETE" });
  },

  // Energy flows
  listEnergyFlows(hubId: string): Promise<EnergyFlow[]> {
    return request(`/api/hubs/${hubId}/energy-flows`);
  },

  addEnergyFlow(hubId: string, flow: EnergyFlow): Promise<EnergyFlow> {
    return request(`/api/hubs/${hubId}/energy-flows`, {
      method: "POST",
      body: JSON.stringify(flow),
    });
  },

  updateEnergyFlow(hubId: string, index: number, flow: Partial<EnergyFlow>): Promise<EnergyFlow> {
    return request(`/api/hubs/${hubId}/energy-flows/${index}`, {
      method: "PUT",
      body: JSON.stringify(flow),
    });
  },

  deleteEnergyFlow(hubId: string, index: number): Promise<void> {
    return request(`/api/hubs/${hubId}/energy-flows/${index}`, { method: "DELETE" });
  },

  // Material flows
  listMaterialFlows(hubId: string): Promise<MaterialFlow[]> {
    return request(`/api/hubs/${hubId}/material-flows`);
  },

  addMaterialFlow(hubId: string, flow: Omit<MaterialFlow, "id"> & { id?: string }): Promise<MaterialFlow> {
    return request(`/api/hubs/${hubId}/material-flows`, {
      method: "POST",
      body: JSON.stringify(flow),
    });
  },

  updateMaterialFlow(hubId: string, flowId: string, data: Partial<MaterialFlow>): Promise<MaterialFlow> {
    return request(`/api/hubs/${hubId}/material-flows/${flowId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  deleteMaterialFlow(hubId: string, flowId: string): Promise<void> {
    return request(`/api/hubs/${hubId}/material-flows/${flowId}`, { method: "DELETE" });
  },

  // Scenarios
  listScenarios(hubId: string): Promise<Scenario[]> {
    return request(`/api/hubs/${hubId}/scenarios`);
  },

  getScenario(hubId: string, scenarioId: string): Promise<Scenario> {
    return request(`/api/hubs/${hubId}/scenarios/${scenarioId}`);
  },

  createScenario(hubId: string, name: string, description?: string, color?: string): Promise<Scenario> {
    return request(`/api/hubs/${hubId}/scenarios`, {
      method: "POST",
      body: JSON.stringify({ name, description, color }),
    });
  },

  updateScenario(hubId: string, scenarioId: string, data: Partial<Scenario>): Promise<Scenario> {
    return request(`/api/hubs/${hubId}/scenarios/${scenarioId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  addMutation(hubId: string, scenarioId: string, mutation: Omit<ScenarioMutation, "id">): Promise<ScenarioMutation> {
    return request(`/api/hubs/${hubId}/scenarios/${scenarioId}/mutations`, {
      method: "POST",
      body: JSON.stringify(mutation),
    });
  },

  removeMutation(hubId: string, scenarioId: string, mutationId: string): Promise<void> {
    return request(`/api/hubs/${hubId}/scenarios/${scenarioId}/mutations/${mutationId}`, {
      method: "DELETE",
    });
  },

  deleteScenario(hubId: string, scenarioId: string): Promise<void> {
    return request(`/api/hubs/${hubId}/scenarios/${scenarioId}`, { method: "DELETE" });
  },

  // Export
  exportJson(hubId: string): Promise<HubDataset> {
    return request(`/api/hubs/${hubId}/export/json`);
  },

  async exportCsv(hubId: string): Promise<string> {
    const base = getBaseUrl();
    const res = await fetch(`${base}/api/hubs/${hubId}/export/csv`);
    return res.text();
  },

  exportKpis(hubId: string): Promise<Record<string, number | string>> {
    return request(`/api/hubs/${hubId}/export/kpis`);
  },
};
