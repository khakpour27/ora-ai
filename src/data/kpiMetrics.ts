import type { KPIMetric, WorkPackageStatus } from "@/types";

export const dashboardKPIs: KPIMetric[] = [
  {
    id: "symbiosis",
    label: "Aktive symbioseforbindelser",
    value: 16,
    unit: "",
    trend: "up",
    trendValue: 9,
    icon: "Network",
    provenance: { source: "intel/data-extracts/symbioses.md", confidence: "verified", date: "2021" },
  },
  {
    id: "energy-saving",
    label: "CO₂ unngått (energi)",
    value: 95000,
    unit: "tonn/år",
    trend: "up",
    trendValue: 12.5,
    icon: "Zap",
    provenance: { source: "NORSUS OR.17.24", confidence: "verified", date: "2021" },
  },
  {
    id: "co2",
    label: "Netto CO₂-besparelse",
    value: 390000,
    unit: "tonn/år",
    trend: "up",
    trendValue: 8.0,
    icon: "Leaf",
    provenance: { source: "NORSUS OR.17.24 (inkl. materialsubstitusjon)", confidence: "verified", date: "2021" },
  },
  {
    id: "material-reuse",
    label: "Materialutnyttelse",
    value: 75,
    unit: "%",
    trend: "up",
    trendValue: 3.5,
    icon: "Recycle",
    provenance: { source: "NORSUS OR.17.24 (~390 000 av ~520 000 t)", confidence: "estimated", date: "2021" },
  },
];

// SymbioLink Øra 2025 arbeidspakker (APs)
// Based on NCCE project documentation
export const workPackageStatuses: WorkPackageStatus[] = [
  { id: "AP1", name: "Prosjektledelse og koordinering", status: "in-progress", progress: 40 },
  { id: "AP2", name: "Materialstrømsanalyse", status: "in-progress", progress: 55 },
  { id: "AP3", name: "Energikartlegging og optimalisering", status: "in-progress", progress: 45 },
  { id: "AP4", name: "Symbioseidentifisering (KI-støttet)", status: "in-progress", progress: 30 },
  { id: "AP5", name: "Forretningscase og implementering", status: "not-started", progress: 0 },
  { id: "AP6", name: "Kommunikasjon og formidling", status: "in-progress", progress: 20 },
];
