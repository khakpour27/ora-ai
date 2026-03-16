import type { Provenance } from "./provenance";

export interface BusinessCase {
  symbiosisId: string;
  title: string;
  npvMNOK: number;
  irr: number;
  paybackYears: number;
  investmentMNOK: number;
  annualRevenueMNOK: number;
  annualCostSavingMNOK: number;
  timeline: TimelinePhase[];
  fundingOpportunities: FundingSource[];
  provenance?: Provenance;
}

export interface TimelinePhase {
  name: string;
  startMonth: number;
  durationMonths: number;
  milestones: string[];
  status: "not-started" | "in-progress" | "completed";
}

export interface FundingSource {
  name: string;
  type: "grant" | "loan" | "tax-incentive";
  maxAmountMNOK: number;
  relevanceScore: number;
  deadline?: string;
}
