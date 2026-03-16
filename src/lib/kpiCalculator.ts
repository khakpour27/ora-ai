import type { HubDataset } from "@/lib/api";
import type { KPIMetric } from "@/types";

/**
 * Compute KPIs dynamically from hub dataset.
 * Replaces hardcoded dashboardKPIs when user data is loaded.
 */

export function totalEnergySavingGWh(hub: HubDataset): number {
  return hub.energyOptimizations.reduce((sum, o) => sum + o.savingGWh, 0);
}

export function totalCO2Reduction(hub: HubDataset): number {
  // From optimizations + symbiosis opportunities
  const fromOpt = hub.energyOptimizations.reduce((sum, o) => sum + o.co2ReductionTonnes, 0);
  const fromSym = hub.symbiosisOpportunities.reduce((sum, s) => sum + s.co2ReductionTonnes, 0);
  // Avoid double-counting: use the larger of the two
  return Math.max(fromOpt, fromSym);
}

export function materialReusePercent(hub: HubDataset): number {
  const existing = hub.materialFlows.filter((f) => f.status === "existing");
  const total = hub.materialFlows.length;
  if (total === 0) return 0;
  return (existing.length / total) * 100;
}

export function symbiosisCount(hub: HubDataset): number {
  return hub.symbiosisOpportunities.length;
}

export function totalInvestmentMNOK(hub: HubDataset): number {
  return hub.businessCases.reduce((sum, b) => sum + b.investmentMNOK, 0);
}

export function totalNPV(hub: HubDataset): number {
  return hub.businessCases.reduce((sum, b) => sum + b.npvMNOK, 0);
}

export function totalAnnualRevenue(hub: HubDataset): number {
  return hub.businessCases.reduce((sum, b) => sum + b.annualRevenueMNOK, 0);
}

/**
 * Generate dashboard KPI metrics from computed values.
 * Used when hub has no pre-defined dashboardKPIs or for scenario comparison.
 */
export function computeDashboardKPIs(hub: HubDataset): KPIMetric[] {
  return [
    {
      id: "symbiosis",
      label: "Symbiosemuligheter",
      value: symbiosisCount(hub),
      unit: "",
      trend: "up",
      trendValue: 0,
      icon: "Network",
      provenance: { source: "Beregnet fra data", confidence: "estimated" },
    },
    {
      id: "energy-saving",
      label: "Energibesparingspotensial",
      value: Math.round(totalEnergySavingGWh(hub) * 10) / 10,
      unit: "GWh",
      trend: "up",
      trendValue: 0,
      icon: "Zap",
      provenance: { source: "Beregnet fra data", confidence: "estimated" },
    },
    {
      id: "co2",
      label: "CO\u2082-reduksjon",
      value: Math.round(totalCO2Reduction(hub)),
      unit: "tonn/\u00e5r",
      trend: "up",
      trendValue: 0,
      icon: "Leaf",
      provenance: { source: "Beregnet fra data", confidence: "estimated" },
    },
    {
      id: "material-reuse",
      label: "Materialutnyttelse",
      value: Math.round(materialReusePercent(hub) * 10) / 10,
      unit: "%",
      trend: "up",
      trendValue: 0,
      icon: "Recycle",
      provenance: { source: "Beregnet fra data", confidence: "estimated" },
    },
  ];
}

/**
 * Compare two datasets and compute delta KPIs.
 * Used for scenario comparison display.
 */
export function computeKPIDeltas(
  base: HubDataset,
  scenario: HubDataset
): { id: string; label: string; baseValue: number; scenarioValue: number; delta: number; unit: string }[] {
  const baseKPIs = computeDashboardKPIs(base);
  const scenarioKPIs = computeDashboardKPIs(scenario);

  return baseKPIs.map((bk, i) => ({
    id: bk.id,
    label: bk.label,
    baseValue: bk.value,
    scenarioValue: scenarioKPIs[i]?.value ?? bk.value,
    delta: (scenarioKPIs[i]?.value ?? bk.value) - bk.value,
    unit: bk.unit,
  }));
}
