import type { EnergyFlow, EnergySurplusDeficit, EnergyOptimization } from "@/types";

// Sankey diagram data - nodes and links for energy flow visualization
// Restructured to reflect actual energy landscape: Sunndal Energi distributes fjernvarme (~45 GWh),
// NOT electricity generation. Hydro gets electricity from the national grid.
//
// NOTE: Electricity values are visualization-scaled to keep the Sankey proportionate.
// Hydro's actual electricity consumption is 6,143 GWh — using 1,800 GWh here so the
// waste heat, district heating and biogas flows remain visible. Real values are in
// company records (companies.ts) and text descriptions.
export const sankeyNodes: { id: string; label: string; color: string }[] = [
  // Companies
  { id: "hydro-sunndal", label: "Hydro Sunndal", color: "#3B82F6" },
  { id: "sunndal-energi", label: "Sunndal Energi", color: "#F59E0B" },
  { id: "ottem-recycling", label: "Ottem Recycling", color: "#10B981" },
  { id: "storvik", label: "Storvik", color: "#8B5CF6" },
  { id: "industrikraft", label: "Industrikraft", color: "#EF4444" },
  { id: "sunndal-kommune", label: "Sunndal kommune", color: "#06B6D4" },
  // Intermediary energy nodes
  { id: "strøm", label: "Strøm", color: "#FBBF24" },
  { id: "spillvarme", label: "Spillvarme", color: "#F97316" },
  { id: "fjernvarme", label: "Fjernvarme", color: "#EF4444" },
  { id: "biogass", label: "Biogass", color: "#22C55E" },
];

export const energyFlows: EnergyFlow[] = [
  // ── Existing electricity flows (vis-scaled; real Hydro = 6,143 GWh) ──
  {
    source: "industrikraft",
    target: "strøm",
    value: 500,
    type: "electricity",
    status: "existing",
    provenance: { source: "Konkurransegrunnlag Sirkulaere Sunndal Hub 2026", confidence: "estimated" },
  },
  {
    source: "strøm",
    target: "hydro-sunndal",
    value: 1800,
    type: "electricity",
    status: "existing",
    provenance: { source: "Mepex Materialstrømsanalyse – Hydro Sunndal", confidence: "verified", date: "2024" },
  },
  {
    source: "strøm",
    target: "sunndal-kommune",
    value: 80,
    type: "electricity",
    status: "existing",
    provenance: { source: "Konkurransegrunnlag Sirkulaere Sunndal Hub 2026", confidence: "estimated" },
  },
  {
    source: "strøm",
    target: "ottem-recycling",
    value: 5,
    type: "electricity",
    status: "existing",
    provenance: { source: "Mepex Materialstrømsanalyse – Ottem Recycling", confidence: "verified", date: "2024" },
  },
  {
    source: "strøm",
    target: "storvik",
    value: 1.6,
    type: "electricity",
    status: "existing",
    provenance: { source: "Mepex Materialstrømsanalyse – Storvik", confidence: "verified", date: "2024" },
  },

  // ── Existing waste heat and district heating ──
  {
    source: "hydro-sunndal",
    target: "spillvarme",
    value: 148.4,
    type: "waste-heat",
    status: "existing",
    provenance: { source: "Avslutningsrapport Sirkulaere Sunndal", page: "Spillvarmepotensial", confidence: "verified", date: "2024" },
  },
  {
    source: "spillvarme",
    target: "fjernvarme",
    value: 30.4,
    type: "waste-heat",
    status: "existing",
    provenance: { source: "Mepex Materialstrømsanalyse – Sunndal Energi", confidence: "verified", date: "2024" },
  },
  {
    source: "fjernvarme",
    target: "sunndal-energi",
    value: 30.4,
    type: "heat",
    status: "existing",
    provenance: { source: "Mepex Materialstrømsanalyse – Sunndal Energi", confidence: "verified", date: "2024" },
  },
  {
    source: "sunndal-energi",
    target: "sunndal-kommune",
    value: 25,
    type: "heat",
    status: "existing",
    provenance: { source: "Mepex Materialstrømsanalyse – Sunndal Energi", confidence: "estimated" },
  },

  // ── Potential / planned flows ──
  {
    source: "spillvarme",
    target: "fjernvarme",
    value: 118,
    type: "waste-heat",
    status: "potential",
    provenance: { source: "Avslutningsrapport Sirkulaere Sunndal", page: "Utvidet spillvarmeutnyttelse", confidence: "projected", date: "2024" },
  },
  {
    source: "fjernvarme",
    target: "storvik",
    value: 1,
    type: "heat",
    status: "potential",
    provenance: { source: "Helhetlige Industrielle Symbioser", confidence: "projected" },
  },
  {
    source: "fjernvarme",
    target: "ottem-recycling",
    value: 2,
    type: "heat",
    status: "potential",
    provenance: { source: "Helhetlige Industrielle Symbioser", confidence: "projected" },
  },
  {
    source: "sunndal-kommune",
    target: "biogass",
    value: 3.5,
    type: "biogas",
    status: "potential",
    provenance: { source: "Avslutningsrapport Sirkulaere Sunndal", page: "Biogass-case", confidence: "projected" },
  },
  {
    source: "ottem-recycling",
    target: "biogass",
    value: 2.0,
    type: "biogas",
    status: "potential",
    provenance: { source: "Avslutningsrapport Sirkulaere Sunndal", page: "Biogass-case", confidence: "projected" },
  },
  // biogass → storvik: terminal node (preserves Sankey acyclicity)
  {
    source: "biogass",
    target: "storvik",
    value: 1.5,
    type: "biogas",
    status: "planned",
    provenance: { source: "Helhetlige Industrielle Symbioser", confidence: "projected" },
  },
];

export const surplusDeficitData: EnergySurplusDeficit[] = [
  // Winter
  { companyId: "hydro-sunndal", electricity: -450, heat: -30, wasteHeat: 130, season: "winter" },
  { companyId: "sunndal-energi", electricity: 0, heat: 12, wasteHeat: 0, season: "winter" },
  { companyId: "ottem-recycling", electricity: -1, heat: -2, wasteHeat: 0, season: "winter" },
  { companyId: "storvik", electricity: -0.5, heat: -0.4, wasteHeat: 0, season: "winter" },
  { companyId: "industrikraft", electricity: 80, heat: 0, wasteHeat: 0, season: "winter" },
  { companyId: "sunndal-kommune", electricity: -25, heat: -35, wasteHeat: 0, season: "winter" },

  // Spring
  { companyId: "hydro-sunndal", electricity: -300, heat: -10, wasteHeat: 140, season: "spring" },
  { companyId: "sunndal-energi", electricity: 0, heat: 8, wasteHeat: 0, season: "spring" },
  { companyId: "ottem-recycling", electricity: -0.5, heat: -0.5, wasteHeat: 0, season: "spring" },
  { companyId: "storvik", electricity: -0.4, heat: -0.2, wasteHeat: 0, season: "spring" },
  { companyId: "industrikraft", electricity: 150, heat: 0, wasteHeat: 0, season: "spring" },
  { companyId: "sunndal-kommune", electricity: -15, heat: -12, wasteHeat: 0, season: "spring" },

  // Summer
  { companyId: "hydro-sunndal", electricity: -200, heat: 5, wasteHeat: 155, season: "summer" },
  { companyId: "sunndal-energi", electricity: 0, heat: 5, wasteHeat: 0, season: "summer" },
  { companyId: "ottem-recycling", electricity: 0.5, heat: 1, wasteHeat: 0, season: "summer" },
  { companyId: "storvik", electricity: -0.3, heat: 0.1, wasteHeat: 0, season: "summer" },
  { companyId: "industrikraft", electricity: 200, heat: 0, wasteHeat: 0, season: "summer" },
  { companyId: "sunndal-kommune", electricity: -8, heat: 5, wasteHeat: 0, season: "summer" },

  // Autumn
  { companyId: "hydro-sunndal", electricity: -380, heat: -18, wasteHeat: 135, season: "autumn" },
  { companyId: "sunndal-energi", electricity: 0, heat: 10, wasteHeat: 0, season: "autumn" },
  { companyId: "ottem-recycling", electricity: -0.8, heat: -1, wasteHeat: 0, season: "autumn" },
  { companyId: "storvik", electricity: -0.4, heat: -0.3, wasteHeat: 0, season: "autumn" },
  { companyId: "industrikraft", electricity: 120, heat: 0, wasteHeat: 0, season: "autumn" },
  { companyId: "sunndal-kommune", electricity: -20, heat: -22, wasteHeat: 0, season: "autumn" },
];

export const energyOptimizations: EnergyOptimization[] = [
  {
    id: "eo-1",
    title: "Utvidet spillvarmeutnyttelse fra Hydro til fjernvarmenett",
    description:
      "Utvide eksisterende spillvarmeinfrastruktur fra Hydro Sunndal til fjernvarmenettet. I dag utnyttes 30,4 GWh, men potensialet er ytterligere 118 GWh som kan dekke mesteparten av kommunens og naeringsbyggenes varmebehov.",
    involvedCompanies: ["hydro-sunndal", "sunndal-kommune", "sunndal-energi"],
    savingGWh: 118,
    co2ReductionTonnes: 12000,
    confidence: 0.88,
    complexity: "medium",
    estimatedCostMNOK: 55,
    provenance: { source: "Avslutningsrapport Sirkulaere Sunndal", page: "Utvidet spillvarmeutnyttelse", confidence: "verified", date: "2024" },
  },
  {
    id: "eo-2",
    title: "Optimalisert lastbalansering mellom industri og nett",
    description:
      "Implementere KI-styrt lastbalansering som optimaliserer stromforbruket hos Hydro basert pa spotpriser og nettkapasitet. Reduserer topplast og gir fleksibilitetsinntekter.",
    involvedCompanies: ["hydro-sunndal", "industrikraft"],
    savingGWh: 32,
    co2ReductionTonnes: 4200,
    confidence: 0.82,
    complexity: "high",
    estimatedCostMNOK: 12,
    provenance: { source: "Helhetlige Industrielle Symbioser", confidence: "estimated" },
  },
  {
    id: "eo-3",
    title: "Biogassanlegg for organisk avfall",
    description:
      "Etablere lokalt biogassanlegg som konverterer organisk avfall fra kommunen og Ottem Recycling til biogass for oppvarming og transport.",
    involvedCompanies: ["sunndal-kommune", "ottem-recycling", "storvik"],
    savingGWh: 5.5,
    co2ReductionTonnes: 2800,
    confidence: 0.75,
    complexity: "high",
    estimatedCostMNOK: 45,
    provenance: { source: "Avslutningsrapport Sirkulaere Sunndal", page: "Biogass-case", confidence: "projected" },
  },
  {
    id: "eo-4",
    title: "Varmeforsyning til Storvik verksted",
    description:
      "Koble Storvik AS til fjernvarmenettet for a erstatte elektrisk oppvarming av verkstedbygg med spillvarme. Reduserer strømforbruk og utnytter overskuddsvarme fra Hydro.",
    involvedCompanies: ["storvik", "sunndal-energi"],
    savingGWh: 1.0,
    co2ReductionTonnes: 180,
    confidence: 0.91,
    complexity: "low",
    estimatedCostMNOK: 3,
    provenance: { source: "Mepex Materialstrømsanalyse – Storvik", confidence: "estimated", date: "2024" },
  },
  {
    id: "eo-5",
    title: "Solcelleanlegg pa industritak",
    description:
      "Utnytte store takflater pa industribygg og lagerhaller til solcelleanlegg. Kan supplere energiforsyningen i sommerhalvaret og redusere nettbelastning.",
    involvedCompanies: ["storvik", "ottem-recycling", "sunndal-kommune"],
    savingGWh: 8.2,
    co2ReductionTonnes: 1100,
    confidence: 0.85,
    complexity: "low",
    estimatedCostMNOK: 18,
    provenance: { source: "Helhetlige Industrielle Symbioser", confidence: "estimated" },
  },
  {
    id: "eo-6",
    title: "Hydrogenproduksjon med overskuddskraft",
    description:
      "Bruke periodevise kraftoverskudd til a produsere grønn hydrogen via elektrolyse. Hydrogenet kan brukes i Hydros produksjonsprosesser eller selges til transport.",
    involvedCompanies: ["industrikraft", "hydro-sunndal"],
    savingGWh: 48,
    co2ReductionTonnes: 11200,
    confidence: 0.62,
    complexity: "high",
    estimatedCostMNOK: 120,
    provenance: { source: "Avslutningsrapport Sirkulaere Sunndal", page: "Hydrogen-case", confidence: "projected" },
  },
];
