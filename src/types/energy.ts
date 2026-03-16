import type { CompanyId } from "./company";
import type { Provenance } from "./provenance";

export type EnergyType = "electricity" | "heat" | "waste-heat" | "biogas" | "hydrogen";
export type FlowStatus = "existing" | "potential" | "planned";

export interface EnergyFlow {
  source: CompanyId | string;
  target: CompanyId | string;
  value: number;
  type: EnergyType;
  status: FlowStatus;
  provenance?: Provenance;
}

export interface EnergySurplusDeficit {
  companyId: CompanyId;
  electricity: number;
  heat: number;
  wasteHeat: number;
  season: "winter" | "spring" | "summer" | "autumn";
}

export interface EnergyOptimization {
  id: string;
  title: string;
  description: string;
  involvedCompanies: CompanyId[];
  savingGWh: number;
  co2ReductionTonnes: number;
  confidence: number;
  complexity: "low" | "medium" | "high";
  estimatedCostMNOK: number;
  provenance?: Provenance;
}
