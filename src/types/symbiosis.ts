import type { CompanyId } from "./company";
import type { Provenance } from "./provenance";

export interface SymbiosisOpportunity {
  id: string;
  title: string;
  description: string;
  type: "energy" | "material" | "infrastructure" | "service";
  involvedCompanies: CompanyId[];
  aiConfidence: number;
  dimensions: {
    economicPotential: number;
    environmentalImpact: number;
    technicalFeasibility: number;
    regulatoryReadiness: number;
    marketDemand: number;
    implementationSpeed: number;
  };
  risks: {
    technical: "low" | "medium" | "high";
    regulatory: "low" | "medium" | "high";
    financial: "low" | "medium" | "high";
    operational: "low" | "medium" | "high";
  };
  estimatedAnnualValueMNOK: number;
  co2ReductionTonnes: number;
  status: "identified" | "validated" | "prioritized";
  provenance?: Provenance;
}
