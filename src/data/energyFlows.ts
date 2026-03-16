import type { EnergyFlow, EnergySurplusDeficit, EnergyOptimization } from "@/types";

// Sankey diagram data — Øra industrial ecosystem energy flows
// Primary data source: NORSUS OR.17.24 (2021 baseline)
//
// Architecture: Two waste-to-energy producers (FREVAR + SAREN) generate steam
// that flows through intermediary nodes to industrial consumers and district heating.
// Acyclic by design: producers → intermediaries → consumers → terminal nodes.
export const sankeyNodes: { id: string; label: string; color: string }[] = [
  // Energy producers
  { id: "frevar-kf", label: "FREVAR KF", color: "#E84D2F" },
  { id: "saren-energi", label: "SAREN Energi", color: "#D97706" },
  // Intermediary energy nodes
  { id: "damp", label: "Damp (steam)", color: "#F97316" },
  { id: "fjernvarme", label: "Fjernvarme", color: "#EF4444" },
  { id: "biogass", label: "Biogass", color: "#22C55E" },
  // Industrial consumers
  { id: "kronos-titan", label: "Kronos Titan", color: "#4A7CB5" },
  { id: "denofa", label: "Denofa", color: "#6B8E23" },
  { id: "kemira-chemicals", label: "Kemira", color: "#0EA5A0" },
  // District heating
  { id: "fredrikstad-fjernvarme", label: "Fredrikstad Fjernvarme", color: "#DC2626" },
  { id: "by-oppvarming", label: "By og husholdninger", color: "#F472B6" },
];

export const energyFlows: EnergyFlow[] = [
  // ── Existing steam flows (NORSUS 2021 verified) ──

  // FREVAR produces ~210 GWh steam; delivers ~190 GWh.
  // Itemized deliveries to steam network: 89 + 62 + 5 + 2.9 = 158.9 GWh
  {
    source: "frevar-kf",
    target: "damp",
    value: 158.9,
    type: "heat",
    status: "existing",
    provenance: { source: "NORSUS OR.17.24 + frevar.no", confidence: "verified", date: "2021" },
  },
  // SAREN delivers ~23 GWh steam to Denofa Energi hub (2021, pre-expansion)
  {
    source: "saren-energi",
    target: "damp",
    value: 23,
    type: "heat",
    status: "existing",
    provenance: { source: "NORSUS OR.17.24", confidence: "verified", date: "2021" },
  },

  // Steam → industrial consumers
  {
    source: "damp",
    target: "kronos-titan",
    value: 89,
    type: "heat",
    status: "existing",
    provenance: { source: "NORSUS OR.17.24", confidence: "verified", date: "2021" },
  },
  {
    source: "damp",
    target: "denofa",
    value: 85,
    type: "heat",
    status: "existing",
    provenance: { source: "NORSUS OR.17.24 (62 GWh FREVAR + 23 GWh SAREN)", confidence: "verified", date: "2021" },
  },
  {
    source: "damp",
    target: "biogass",
    value: 5,
    type: "heat",
    status: "existing",
    provenance: { source: "NORSUS OR.17.24", confidence: "verified", date: "2021" },
  },
  {
    source: "damp",
    target: "kemira-chemicals",
    value: 2.9,
    type: "heat",
    status: "existing",
    provenance: { source: "NORSUS OR.17.24 (inkl. Reichhold)", confidence: "verified", date: "2021" },
  },

  // ── District heating (hot water) ──

  // FREVAR + SAREN → Fredrikstad Fjernvarme (~88 GWh combined)
  // Split estimated: FREVAR ~55 GWh, SAREN ~33 GWh
  {
    source: "frevar-kf",
    target: "fjernvarme",
    value: 55,
    type: "waste-heat",
    status: "existing",
    provenance: { source: "fredrikstad-fjernvarme.md (total 88 GWh, split estimated)", confidence: "estimated", date: "2021" },
  },
  {
    source: "saren-energi",
    target: "fjernvarme",
    value: 33,
    type: "waste-heat",
    status: "existing",
    provenance: { source: "fredrikstad-fjernvarme.md (total 88 GWh, split estimated)", confidence: "estimated", date: "2021" },
  },
  {
    source: "fjernvarme",
    target: "fredrikstad-fjernvarme",
    value: 88,
    type: "heat",
    status: "existing",
    provenance: { source: "fredrikstad-fjernvarme.md", confidence: "verified", date: "2024" },
  },
  {
    source: "fredrikstad-fjernvarme",
    target: "by-oppvarming",
    value: 88,
    type: "heat",
    status: "existing",
    provenance: { source: "fredrikstad-fjernvarme.md (~3 000 husstander)", confidence: "verified", date: "2024" },
  },

  // ── Potential / planned flows ──

  // SAREN post-expansion (Dec 2024): capacity nearly doubled to 37 MW / 105,000 t/yr
  // Additional steam available for industrial use
  {
    source: "saren-energi",
    target: "damp",
    value: 50,
    type: "heat",
    status: "potential",
    provenance: { source: "sarenenergy.com (kapasitet doblet des. 2024)", confidence: "projected", date: "2024" },
  },
  // Kronos Titan can absorb more steam, displacing LNG/oil (~150 GWh fossil)
  {
    source: "damp",
    target: "kronos-titan",
    value: 40,
    type: "heat",
    status: "potential",
    provenance: { source: "kronos-titan.md (erstatter ~150 GWh LNG/olje)", confidence: "projected" },
  },
  // Fjernvarme expansion: proposed 160 GWh production (from current 88)
  {
    source: "fjernvarme",
    target: "fredrikstad-fjernvarme",
    value: 72,
    type: "heat",
    status: "planned",
    provenance: { source: "fredrikstad-fjernvarme.md (NVE-konsesjon 160 GWh)", confidence: "projected", date: "2024" },
  },
  // Biogas expansion — regional potential 100 GWh
  {
    source: "biogass",
    target: "by-oppvarming",
    value: 10,
    type: "biogas",
    status: "potential",
    provenance: { source: "norsus-biogas-potential-nedre-glomma.md (100 GWh regionalt)", confidence: "projected" },
  },
];

// Seasonal energy surplus/deficit per company (estimated — no seasonal data in sources).
// Positive = surplus/production, Negative = deficit/consumption.
// Based on process characteristics: industrial processes ~constant, district heating seasonal.
export const surplusDeficitData: EnergySurplusDeficit[] = [
  // ── Winter (high heating demand) ──
  { companyId: "frevar-kf", electricity: -8, heat: 55, wasteHeat: 0, season: "winter" },
  { companyId: "kronos-titan", electricity: -8, heat: -85, wasteHeat: 0, season: "winter" },
  { companyId: "kemira-chemicals", electricity: -1, heat: -1, wasteHeat: 0, season: "winter" },
  { companyId: "denofa", electricity: -5, heat: -28, wasteHeat: 0, season: "winter" },
  { companyId: "batteriretur", electricity: -2, heat: -0.5, wasteHeat: 0, season: "winter" },
  { companyId: "metallco-stene", electricity: -0.8, heat: -0.2, wasteHeat: 0, season: "winter" },
  { companyId: "saren-energi", electricity: -1, heat: 80, wasteHeat: 0, season: "winter" },
  { companyId: "metallco-kabel", electricity: -1, heat: -0.3, wasteHeat: 0, season: "winter" },
  { companyId: "stene-stal", electricity: -1.2, heat: -0.3, wasteHeat: 0, season: "winter" },
  { companyId: "ng-metall", electricity: -4, heat: -0.5, wasteHeat: 0, season: "winter" },
  { companyId: "fredrikstad-fjernvarme", electricity: -0.2, heat: 30, wasteHeat: 0, season: "winter" },
  { companyId: "borg-havn", electricity: -0.8, heat: -0.1, wasteHeat: 0, season: "winter" },

  // ── Spring (moderate heating demand) ──
  { companyId: "frevar-kf", electricity: -8, heat: 52, wasteHeat: 0, season: "spring" },
  { companyId: "kronos-titan", electricity: -7.5, heat: -80, wasteHeat: 0, season: "spring" },
  { companyId: "kemira-chemicals", electricity: -1, heat: -0.8, wasteHeat: 0, season: "spring" },
  { companyId: "denofa", electricity: -5, heat: -25, wasteHeat: 0, season: "spring" },
  { companyId: "batteriretur", electricity: -2, heat: -0.3, wasteHeat: 0, season: "spring" },
  { companyId: "metallco-stene", electricity: -0.8, heat: -0.1, wasteHeat: 0, season: "spring" },
  { companyId: "saren-energi", electricity: -1, heat: 75, wasteHeat: 0, season: "spring" },
  { companyId: "metallco-kabel", electricity: -1, heat: -0.2, wasteHeat: 0, season: "spring" },
  { companyId: "stene-stal", electricity: -1.2, heat: -0.2, wasteHeat: 0, season: "spring" },
  { companyId: "ng-metall", electricity: -3.8, heat: -0.3, wasteHeat: 0, season: "spring" },
  { companyId: "fredrikstad-fjernvarme", electricity: -0.2, heat: 22, wasteHeat: 0, season: "spring" },
  { companyId: "borg-havn", electricity: -0.8, heat: 0, wasteHeat: 0, season: "spring" },

  // ── Summer (low heating demand, cooling needed) ──
  { companyId: "frevar-kf", electricity: -8, heat: 48, wasteHeat: 0, season: "summer" },
  { companyId: "kronos-titan", electricity: -7, heat: -78, wasteHeat: 0, season: "summer" },
  { companyId: "kemira-chemicals", electricity: -1, heat: -0.5, wasteHeat: 0, season: "summer" },
  { companyId: "denofa", electricity: -5, heat: -22, wasteHeat: 0, season: "summer" },
  { companyId: "batteriretur", electricity: -2, heat: 0, wasteHeat: 0, season: "summer" },
  { companyId: "metallco-stene", electricity: -0.7, heat: 0, wasteHeat: 0, season: "summer" },
  { companyId: "saren-energi", electricity: -1, heat: 70, wasteHeat: 0, season: "summer" },
  { companyId: "metallco-kabel", electricity: -1, heat: 0, wasteHeat: 0, season: "summer" },
  { companyId: "stene-stal", electricity: -1.2, heat: 0, wasteHeat: 0, season: "summer" },
  { companyId: "ng-metall", electricity: -3.5, heat: 0, wasteHeat: 0, season: "summer" },
  { companyId: "fredrikstad-fjernvarme", electricity: -0.2, heat: 10, wasteHeat: 0, season: "summer" },
  { companyId: "borg-havn", electricity: -0.7, heat: 0, wasteHeat: 0, season: "summer" },

  // ── Autumn (increasing heating demand) ──
  { companyId: "frevar-kf", electricity: -8, heat: 53, wasteHeat: 0, season: "autumn" },
  { companyId: "kronos-titan", electricity: -7.5, heat: -82, wasteHeat: 0, season: "autumn" },
  { companyId: "kemira-chemicals", electricity: -1, heat: -0.7, wasteHeat: 0, season: "autumn" },
  { companyId: "denofa", electricity: -5, heat: -26, wasteHeat: 0, season: "autumn" },
  { companyId: "batteriretur", electricity: -2, heat: -0.3, wasteHeat: 0, season: "autumn" },
  { companyId: "metallco-stene", electricity: -0.8, heat: -0.1, wasteHeat: 0, season: "autumn" },
  { companyId: "saren-energi", electricity: -1, heat: 76, wasteHeat: 0, season: "autumn" },
  { companyId: "metallco-kabel", electricity: -1, heat: -0.2, wasteHeat: 0, season: "autumn" },
  { companyId: "stene-stal", electricity: -1.2, heat: -0.2, wasteHeat: 0, season: "autumn" },
  { companyId: "ng-metall", electricity: -3.8, heat: -0.3, wasteHeat: 0, season: "autumn" },
  { companyId: "fredrikstad-fjernvarme", electricity: -0.2, heat: 25, wasteHeat: 0, season: "autumn" },
  { companyId: "borg-havn", electricity: -0.8, heat: -0.1, wasteHeat: 0, season: "autumn" },
];

export const energyOptimizations: EnergyOptimization[] = [
  {
    id: "eo-1",
    title: "Kronos Titan full elektrifisering",
    description:
      "Erstatte ~150 GWh olje/LNG med elektrisitet i Kronos Titans TiO₂-produksjon. Krever betydelig oppgradering av regionalt strømnett. Blokkert av nettkapasitet — tidligst etter 2030.",
    involvedCompanies: ["kronos-titan"],
    savingGWh: 150,
    co2ReductionTonnes: 35000,
    confidence: 0.65,
    complexity: "high",
    estimatedCostMNOK: 200,
    provenance: { source: "kronos-titan.md + NORSUS OR.17.24", confidence: "projected" },
  },
  {
    id: "eo-2",
    title: "SAREN kapasitetsutvidelse — økt dampforsyning",
    description:
      "SAREN BIO-ELs tredje forbrenningslinje (des. 2024) dobler nesten kapasiteten til 37 MW / 105 000 tonn/år. Ekstra damp kan erstatte fossilt brennstoff hos Kronos Titan og utvide fjernvarmenettet.",
    involvedCompanies: ["saren-energi", "kronos-titan", "fredrikstad-fjernvarme"],
    savingGWh: 90,
    co2ReductionTonnes: 22000,
    confidence: 0.85,
    complexity: "medium",
    estimatedCostMNOK: 0,
    provenance: { source: "sarenenergy.com + ncce.no", confidence: "verified", date: "2024" },
  },
  {
    id: "eo-3",
    title: "Utvidet fjernvarmenett — 160 GWh",
    description:
      "Fredrikstad Fjernvarme har NVE-konsesjon for utvidelse til 160 GWh produksjon og 100 MW effekt. Vil dekke flere bydeler og erstatte fossile oppvarmingsløsninger i Fredrikstad.",
    involvedCompanies: ["fredrikstad-fjernvarme", "frevar-kf", "saren-energi"],
    savingGWh: 72,
    co2ReductionTonnes: 18000,
    confidence: 0.78,
    complexity: "medium",
    estimatedCostMNOK: 85,
    provenance: { source: "fredrikstad-fjernvarme.md (NVE-konsesjon)", confidence: "verified", date: "2024" },
  },
  {
    id: "eo-4",
    title: "Regional biogassutvidelse — 100 GWh",
    description:
      "FREVARs biogassanlegg har potensial for betydelig kapasitetsøkning. Regionalt potensial i Nedre Glomma er beregnet til 100 GWh, med 30 % av husdyrgjødsel gjennom biogassanlegg innen 2030.",
    involvedCompanies: ["frevar-kf"],
    savingGWh: 75,
    co2ReductionTonnes: 11400,
    confidence: 0.72,
    complexity: "high",
    estimatedCostMNOK: 120,
    provenance: { source: "norsus-biogas-potential-nedre-glomma.md", confidence: "projected" },
  },
  {
    id: "eo-5",
    title: "Borg CO₂ CCS-klynge",
    description:
      "Karbonfangst fra tre Øra-lokasjoner med potensial for ~630 000 tonn CO₂/år. CO₂ mellomlagres ved Fredrikstad havn og skippes til Øygarden for permanent lagring under havbunnen i Nordsjøen. 18 samarbeidspartnere.",
    involvedCompanies: ["frevar-kf", "saren-energi", "borg-havn"],
    savingGWh: 0,
    co2ReductionTonnes: 630000,
    confidence: 0.58,
    complexity: "high",
    estimatedCostMNOK: 800,
    provenance: { source: "ncce-borg-co2-ccs-ora.md + norsus-ccs-cluster-ora.md", confidence: "projected" },
  },
  {
    id: "eo-6",
    title: "Denofa elektrodekjel — full kapasitet",
    description:
      "Denofas elektrodekjel kan erstatte LNG-reservekjelen, men begrenses av utilstrekkelig regionalt strømnett. Full utnyttelse krever nettoppgradering — samme flaskehals som Kronos Titan-elektrifisering.",
    involvedCompanies: ["denofa"],
    savingGWh: 45,
    co2ReductionTonnes: 10500,
    confidence: 0.60,
    complexity: "medium",
    estimatedCostMNOK: 15,
    provenance: { source: "denofa.md", confidence: "estimated", date: "2024" },
  },
];
