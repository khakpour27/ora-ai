import type { CompanyId } from "./company";
import type { Provenance } from "./provenance";

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
  relatedCompanies: CompanyId[];
  priority: "high" | "medium" | "low";
  provenance?: Provenance;
}

export interface WorkPackageStatus {
  id: string;
  name: string;
  status: "not-started" | "in-progress" | "completed" | "on-hold";
  progress: number;
}
