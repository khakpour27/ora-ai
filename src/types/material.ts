import type { CompanyId } from "./company";
import type { Provenance } from "./provenance";

export interface MaterialFlow {
  id: string;
  source: CompanyId;
  target: CompanyId;
  material: string;
  volumeTonnesPerYear: number;
  status: "existing" | "potential" | "planned";
  matchScore: number;
  provenance?: Provenance;
}

export interface WasteStream {
  companyId: CompanyId;
  material: string;
  classification: string;
  volumeTonnesPerYear: number;
  currentHandling: "landfill" | "incineration" | "recycling" | "reuse";
  potentialReceivers: CompanyId[];
  provenance?: Provenance;
}

export interface MatchingMatrixCell {
  outputCompany: CompanyId;
  inputCompany: CompanyId;
  material: string;
  compatibilityScore: number;
  volumePotential: number;
}
