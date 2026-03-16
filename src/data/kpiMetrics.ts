import type { KPIMetric, WorkPackageStatus } from "@/types";

export const dashboardKPIs: KPIMetric[] = [
  {
    id: "symbiosis",
    label: "Symbiosemuligheter",
    value: 47,
    unit: "",
    trend: "up",
    trendValue: 12,
    icon: "Network",
    provenance: { source: "Helhetlige Industrielle Symbioser", confidence: "estimated" },
  },
  {
    id: "energy-saving",
    label: "Energibesparingspotensial",
    value: 148.4,
    unit: "GWh",
    trend: "up",
    trendValue: 8.3,
    icon: "Zap",
    provenance: { source: "Avslutningsrapport Sirkulaere Sunndal", page: "Spillvarmepotensial", confidence: "verified", date: "2024" },
  },
  {
    id: "co2",
    label: "CO\u2082-reduksjon",
    value: 28500,
    unit: "tonn/\u00e5r",
    trend: "up",
    trendValue: 15.2,
    icon: "Leaf",
    provenance: { source: "Avslutningsrapport Sirkulaere Sunndal", confidence: "estimated", date: "2024" },
  },
  {
    id: "material-reuse",
    label: "Materialutnyttelse",
    value: 73.2,
    unit: "%",
    trend: "up",
    trendValue: 5.1,
    icon: "Recycle",
    provenance: { source: "Mepex Materialstrømsanalyser (totalkart)", confidence: "estimated", date: "2024" },
  },
];

export const workPackageStatuses: WorkPackageStatus[] = [
  { id: "AP1", name: "Kompetanseheving", status: "in-progress", progress: 35 },
  { id: "AP2", name: "Materialstr\u00f8m", status: "in-progress", progress: 60 },
  { id: "AP3", name: "Energikartlegging", status: "in-progress", progress: 45 },
  { id: "AP4", name: "Biokarbon", status: "not-started", progress: 0 },
  { id: "AP5", name: "Nye symbioser", status: "not-started", progress: 0 },
  { id: "AP6", name: "Markedstilgang", status: "not-started", progress: 0 },
];
