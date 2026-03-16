// Shared types mirroring frontend src/types/* but with string IDs for user-configurable data

export interface Provenance {
  source: string;
  page?: string;
  date?: string;
  confidence: "verified" | "estimated" | "projected";
}

export interface Company {
  id: string;
  name: string;
  shortName: string;
  sector: string;
  description: string;
  color: string;
  icon: string;
  coordinates: [number, number];
  annualEnergyGWh: number;
  annualWasteTonnes: number;
  employeeCount: number;
  provenance?: Provenance;
}

export type EnergyType = "electricity" | "heat" | "waste-heat" | "biogas" | "hydrogen";
export type FlowStatus = "existing" | "potential" | "planned";

export interface SankeyNode {
  id: string;
  label: string;
  color: string;
}

export interface EnergyFlow {
  source: string;
  target: string;
  value: number;
  type: EnergyType;
  status: FlowStatus;
  provenance?: Provenance;
}

export interface EnergySurplusDeficit {
  companyId: string;
  electricity: number;
  heat: number;
  wasteHeat: number;
  season: "winter" | "spring" | "summer" | "autumn";
}

export interface EnergyOptimization {
  id: string;
  title: string;
  description: string;
  involvedCompanies: string[];
  savingGWh: number;
  co2ReductionTonnes: number;
  confidence: number;
  complexity: "low" | "medium" | "high";
  estimatedCostMNOK: number;
  provenance?: Provenance;
}

export interface MaterialFlow {
  id: string;
  source: string;
  target: string;
  material: string;
  volumeTonnesPerYear: number;
  status: "existing" | "potential" | "planned";
  matchScore: number;
  provenance?: Provenance;
}

export interface WasteStream {
  companyId: string;
  material: string;
  classification: string;
  volumeTonnesPerYear: number;
  currentHandling: "landfill" | "incineration" | "recycling" | "reuse";
  potentialReceivers: string[];
  provenance?: Provenance;
}

export interface MatchingMatrixCell {
  outputCompany: string;
  inputCompany: string;
  material: string;
  compatibilityScore: number;
  volumePotential: number;
}

export interface SymbiosisOpportunity {
  id: string;
  title: string;
  description: string;
  type: "energy" | "material" | "infrastructure" | "service";
  involvedCompanies: string[];
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

export interface KPIMetric {
  id: string;
  label: string;
  value: number;
  unit: string;
  trend: "up" | "down" | "stable";
  trendValue: number;
  icon: string;
  provenance?: Provenance;
}

export interface AIInsight {
  id: string;
  category: "energy" | "material" | "symbiosis" | "risk" | "opportunity";
  title: string;
  body: string;
  confidence: number;
  relatedCompanies: string[];
  priority: "high" | "medium" | "low";
  provenance?: Provenance;
}

export interface WorkPackageStatus {
  id: string;
  name: string;
  status: "not-started" | "in-progress" | "completed" | "on-hold";
  progress: number;
}

// The full hub dataset stored as a single JSON file in GCS
export interface HubDataset {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  companies: Record<string, Company>;
  sankeyNodes: SankeyNode[];
  energyFlows: EnergyFlow[];
  surplusDeficitData: EnergySurplusDeficit[];
  energyOptimizations: EnergyOptimization[];
  materialFlows: MaterialFlow[];
  wasteStreams: WasteStream[];
  matchingMatrix: MatchingMatrixCell[];
  symbiosisOpportunities: SymbiosisOpportunity[];
  businessCases: BusinessCase[];
  dashboardKPIs: KPIMetric[];
  workPackageStatuses: WorkPackageStatus[];
  aiInsights: AIInsight[];
}

// Scenario types
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
