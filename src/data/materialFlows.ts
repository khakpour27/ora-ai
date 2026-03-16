import type { MaterialFlow, WasteStream, MatchingMatrixCell } from "@/types";

export const materialFlows: MaterialFlow[] = [
  // ── Existing material exchanges (verified) ──

  // The founding symbiosis at Øra — Kronos Titan byproduct → Kemira feedstock (since 1980)
  {
    id: "mf-1",
    source: "kronos-titan",
    target: "kemira-chemicals",
    material: "Jernsulfat (FeSO₄) — biprodukt fra TiO₂-produksjon",
    volumeTonnesPerYear: 24000,
    status: "existing",
    matchScore: 0.95,
    provenance: { source: "kronos-kemira-symbiosis.md + NORSUS OR.17.24", confidence: "verified", date: "2021" },
  },
  // Kronos Titan thin acid neutralizes fly ash from waste incineration
  {
    id: "mf-2",
    source: "kronos-titan",
    target: "frevar-kf",
    material: "Tynnsyre (fortynnet svovelsyre) — nøytraliserer flygeaske",
    volumeTonnesPerYear: 5000,
    status: "existing",
    matchScore: 0.82,
    provenance: { source: "kronos-titan.md", confidence: "estimated", date: "2021" },
  },
  {
    id: "mf-3",
    source: "kronos-titan",
    target: "saren-energi",
    material: "Tynnsyre — nøytraliserer flygeaske fra forbrenning",
    volumeTonnesPerYear: 3000,
    status: "existing",
    matchScore: 0.82,
    provenance: { source: "kronos-titan.md", confidence: "estimated", date: "2021" },
  },
  // Stene Stål delivers ultra-pure iron scrap to Kronos Titan
  {
    id: "mf-4",
    source: "stene-stal",
    target: "kronos-titan",
    material: "Ultrapurt jernskrap",
    volumeTonnesPerYear: 5000,
    status: "existing",
    matchScore: 0.88,
    provenance: { source: "stene-stal.md", confidence: "estimated", date: "2023" },
  },
  // Kemira supplies coagulant back to FREVAR's wastewater treatment
  {
    id: "mf-5",
    source: "kemira-chemicals",
    target: "frevar-kf",
    material: "Jernklorsulfat (koagulant) for avløpsrensing",
    volumeTonnesPerYear: 2000,
    status: "existing",
    matchScore: 0.90,
    provenance: { source: "kemira-chemicals.md + kronos-kemira-symbiosis.md", confidence: "estimated", date: "2024" },
  },

  // ── Port logistics flows (Borg Havn as logistics hub) ──

  // Soybeans arrive by ship to Denofa's own quay
  {
    id: "mf-6",
    source: "borg-havn",
    target: "denofa",
    material: "Ikke-genmodifiserte soyabønner (sjøfrakt fra Brasil/Canada)",
    volumeTonnesPerYear: 450000,
    status: "existing",
    matchScore: 0.92,
    provenance: { source: "denofa.md + borg-havn.md", confidence: "verified", date: "2024" },
  },
  // UK waste imports arrive at Borg Havn for SAREN
  {
    id: "mf-7",
    source: "borg-havn",
    target: "saren-energi",
    material: "Restavfall importert fra Storbritannia (sjøfrakt)",
    volumeTonnesPerYear: 55000,
    status: "existing",
    matchScore: 0.85,
    provenance: { source: "saren-energi.md (>2/3 av 105 000 t/år)", confidence: "estimated", date: "2024" },
  },
  // Domestic residual waste to FREVAR via regional collection
  {
    id: "mf-8",
    source: "borg-havn",
    target: "frevar-kf",
    material: "Restavfall (regionalt innsamlet)",
    volumeTonnesPerYear: 30000,
    status: "existing",
    matchScore: 0.80,
    provenance: { source: "frevar-energy.md", confidence: "estimated", date: "2021" },
  },

  // ── Recycled metal export flows via Borg Havn ──
  {
    id: "mf-9",
    source: "ng-metall",
    target: "borg-havn",
    material: "Resirkulert stål og metaller (eksport til smelteverk)",
    volumeTonnesPerYear: 80000,
    status: "existing",
    matchScore: 0.84,
    provenance: { source: "ng-metall.md + borg-havn.md", confidence: "estimated", date: "2024" },
  },
  {
    id: "mf-10",
    source: "stene-stal",
    target: "borg-havn",
    material: "Jernskrap og sorterte metallfraksjoner (eksport)",
    volumeTonnesPerYear: 20000,
    status: "existing",
    matchScore: 0.78,
    provenance: { source: "stene-stal.md", confidence: "estimated", date: "2023" },
  },
  {
    id: "mf-11",
    source: "metallco-kabel",
    target: "borg-havn",
    material: "Gjenvunnet kobber og aluminium (eksport)",
    volumeTonnesPerYear: 8000,
    status: "existing",
    matchScore: 0.82,
    provenance: { source: "metallco-kabel.md + ncce-metallco-investment-ora.md", confidence: "estimated", date: "2022" },
  },
  {
    id: "mf-12",
    source: "metallco-stene",
    target: "borg-havn",
    material: "Fragmentert metall (jernholdig og ikke-jernholdig)",
    volumeTonnesPerYear: 15000,
    status: "existing",
    matchScore: 0.76,
    provenance: { source: "metallco.com + ncce.no", confidence: "estimated", date: "2024" },
  },

  // ── Biogas feedstock ──
  {
    id: "mf-13",
    source: "fredrikstad-fjernvarme",
    target: "frevar-kf",
    material: "Organisk avfall og matavfall (biogas-substrat)",
    volumeTonnesPerYear: 30000,
    status: "existing",
    matchScore: 0.75,
    provenance: { source: "frevar-biogas.md (kapasitet 30 000 t/år)", confidence: "estimated", date: "2024" },
  },

  // ── Potential / planned flows ──

  // Cable plastic from Metallco Kabel — exploring energy recovery or material reuse
  {
    id: "mf-14",
    source: "metallco-kabel",
    target: "saren-energi",
    material: "Kabelplast (potensiell energigjenvinning)",
    volumeTonnesPerYear: 6000,
    status: "potential",
    matchScore: 0.68,
    provenance: { source: "metallco-kabel.md (6 000–8 000 t/år kabelplast)", confidence: "projected" },
  },
  // SAREN testing ironworks slag to replace virgin sand
  {
    id: "mf-15",
    source: "metallco-stene",
    target: "saren-energi",
    material: "Jernverksslagg (erstatter jomfruelig sand)",
    volumeTonnesPerYear: 1000,
    status: "planned",
    matchScore: 0.65,
    provenance: { source: "saren-energi.md (redusere sand fra 1 600 til 600 t/år)", confidence: "projected", date: "2024" },
  },
  // Inter-recycler battery flow
  {
    id: "mf-16",
    source: "ng-metall",
    target: "batteriretur",
    material: "Brukte batterier fra fragmentering (sortert ut)",
    volumeTonnesPerYear: 3000,
    status: "existing",
    matchScore: 0.72,
    provenance: { source: "ng-metall.md + batteriretur.no", confidence: "estimated", date: "2024" },
  },
  // Water symbiosis potential (NORSUS 2015 study)
  {
    id: "mf-17",
    source: "denofa",
    target: "frevar-kf",
    material: "Kjølevann (industriell vannsymbiose)",
    volumeTonnesPerYear: 500000,
    status: "potential",
    matchScore: 0.60,
    provenance: { source: "NORSUS 2015 vannstudie (identifisert potensial)", confidence: "projected" },
  },
];

export const wasteStreams: WasteStream[] = [
  {
    companyId: "frevar-kf",
    material: "Restavfall (energigjenvinning)",
    classification: "EWC 20 03 01 / 19 01",
    volumeTonnesPerYear: 73000,
    currentHandling: "incineration",
    potentialReceivers: ["saren-energi"],
    provenance: { source: "frevar-energy.md", confidence: "verified", date: "2021" },
  },
  {
    companyId: "kronos-titan",
    material: "Jernsulfat-biprodukt fra sulfatprosess",
    classification: "EWC 06 (uorganisk kjemisk avfall)",
    volumeTonnesPerYear: 100000,
    currentHandling: "reuse",
    potentialReceivers: ["kemira-chemicals"],
    provenance: { source: "kronos-kemira-symbiosis.md", confidence: "verified", date: "2021" },
  },
  {
    companyId: "kemira-chemicals",
    material: "Prosessrester fra jernklorsulfatproduksjon",
    classification: "EWC 06 (uorganisk)",
    volumeTonnesPerYear: 500,
    currentHandling: "recycling",
    potentialReceivers: ["frevar-kf"],
    provenance: { source: "kemira-chemicals.md", confidence: "estimated", date: "2024" },
  },
  {
    companyId: "denofa",
    material: "Soyaskall og prosessrester",
    classification: "EWC 02 03 (vegetabilsk avfall)",
    volumeTonnesPerYear: 2000,
    currentHandling: "reuse",
    potentialReceivers: ["frevar-kf"],
    provenance: { source: "denofa.md", confidence: "estimated", date: "2024" },
  },
  {
    companyId: "batteriretur",
    material: "Batterifraksjoner (bly, plast, syre, litium)",
    classification: "EWC 16 06 (batterier)",
    volumeTonnesPerYear: 15000,
    currentHandling: "recycling",
    potentialReceivers: ["ng-metall", "metallco-stene"],
    provenance: { source: "batteriretur.no", confidence: "estimated", date: "2024" },
  },
  {
    companyId: "metallco-stene",
    material: "Fragmentert metall (jernholdig/ikke-jernholdig)",
    classification: "EWC 19 10 (fragmenteringsavfall)",
    volumeTonnesPerYear: 25000,
    currentHandling: "recycling",
    potentialReceivers: ["stene-stal", "borg-havn"],
    provenance: { source: "metallco.com + ncce.no", confidence: "estimated", date: "2024" },
  },
  {
    companyId: "saren-energi",
    material: "Bunnaskeog slagg fra forbrenning",
    classification: "EWC 19 01 12",
    volumeTonnesPerYear: 25000,
    currentHandling: "landfill",
    potentialReceivers: ["metallco-stene", "stene-stal"],
    provenance: { source: "saren-energi.md", confidence: "estimated", date: "2024" },
  },
  {
    companyId: "metallco-kabel",
    material: "Kabelplast (PE/PVC-isolasjon)",
    classification: "EWC 19 12 04 (plast)",
    volumeTonnesPerYear: 7000,
    currentHandling: "incineration",
    potentialReceivers: ["saren-energi", "frevar-kf"],
    provenance: { source: "metallco-kabel.md", confidence: "verified", date: "2022" },
  },
  {
    companyId: "stene-stal",
    material: "Sortert jernskrap og metaller",
    classification: "EWC 19 10 01 (jern/stål)",
    volumeTonnesPerYear: 50000,
    currentHandling: "recycling",
    potentialReceivers: ["kronos-titan", "borg-havn"],
    provenance: { source: "stene-stal.md", confidence: "verified", date: "2023" },
  },
  {
    companyId: "ng-metall",
    material: "Fragmentert stål, metaller, e-avfall, batterier",
    classification: "EWC 19 10 / 16 02",
    volumeTonnesPerYear: 120000,
    currentHandling: "recycling",
    potentialReceivers: ["borg-havn", "batteriretur"],
    provenance: { source: "ng-metall.md + norskgjenvinning.no", confidence: "estimated", date: "2024" },
  },
  {
    companyId: "fredrikstad-fjernvarme",
    material: "Returvann fra fjernvarmenett",
    classification: "Ikke klassifisert (vann)",
    volumeTonnesPerYear: 0,
    currentHandling: "reuse",
    potentialReceivers: ["frevar-kf"],
    provenance: { source: "fredrikstad-fjernvarme.md", confidence: "estimated", date: "2024" },
  },
  {
    companyId: "borg-havn",
    material: "Havnedriftsavfall og emballasje",
    classification: "EWC 15 01 / 20 03",
    volumeTonnesPerYear: 500,
    currentHandling: "recycling",
    potentialReceivers: ["ng-metall", "frevar-kf"],
    provenance: { source: "borg-havn.md", confidence: "estimated", date: "2024" },
  },
];

export const matchingMatrix: MatchingMatrixCell[] = [
  // Kronos Titan outputs
  { outputCompany: "kronos-titan", inputCompany: "kemira-chemicals", material: "Jernsulfat", compatibilityScore: 0.95, volumePotential: 24000 },
  { outputCompany: "kronos-titan", inputCompany: "frevar-kf", material: "Tynnsyre (flygeaske)", compatibilityScore: 0.82, volumePotential: 5000 },
  { outputCompany: "kronos-titan", inputCompany: "saren-energi", material: "Tynnsyre (flygeaske)", compatibilityScore: 0.82, volumePotential: 3000 },

  // Stene Stål outputs
  { outputCompany: "stene-stal", inputCompany: "kronos-titan", material: "Ultrapurt jernskrap", compatibilityScore: 0.88, volumePotential: 5000 },
  { outputCompany: "stene-stal", inputCompany: "borg-havn", material: "Jernskrap (eksport)", compatibilityScore: 0.78, volumePotential: 20000 },

  // Kemira outputs
  { outputCompany: "kemira-chemicals", inputCompany: "frevar-kf", material: "Jernklorsulfat (koagulant)", compatibilityScore: 0.90, volumePotential: 2000 },

  // NG Metall outputs
  { outputCompany: "ng-metall", inputCompany: "borg-havn", material: "Resirkulert metall", compatibilityScore: 0.84, volumePotential: 80000 },
  { outputCompany: "ng-metall", inputCompany: "batteriretur", material: "Brukte batterier", compatibilityScore: 0.72, volumePotential: 3000 },

  // Metallco Kabel outputs
  { outputCompany: "metallco-kabel", inputCompany: "borg-havn", material: "Kobber/aluminium", compatibilityScore: 0.82, volumePotential: 8000 },
  { outputCompany: "metallco-kabel", inputCompany: "saren-energi", material: "Kabelplast (brensel)", compatibilityScore: 0.68, volumePotential: 6000 },

  // Metallco Stene outputs
  { outputCompany: "metallco-stene", inputCompany: "borg-havn", material: "Fragmentert metall", compatibilityScore: 0.76, volumePotential: 15000 },
  { outputCompany: "metallco-stene", inputCompany: "saren-energi", material: "Slagg (sand-erstatning)", compatibilityScore: 0.65, volumePotential: 1000 },

  // Borg Havn logistics
  { outputCompany: "borg-havn", inputCompany: "denofa", material: "Soyabønner (sjøfrakt)", compatibilityScore: 0.92, volumePotential: 450000 },
  { outputCompany: "borg-havn", inputCompany: "saren-energi", material: "UK-restavfall", compatibilityScore: 0.85, volumePotential: 55000 },
  { outputCompany: "borg-havn", inputCompany: "frevar-kf", material: "Regionalt restavfall", compatibilityScore: 0.80, volumePotential: 30000 },

  // Denofa outputs
  { outputCompany: "denofa", inputCompany: "frevar-kf", material: "Kjølevann (vannsymbiose)", compatibilityScore: 0.60, volumePotential: 500000 },

  // FREVAR biogas
  { outputCompany: "frevar-kf", inputCompany: "fredrikstad-fjernvarme", material: "Biorest (gjødsel)", compatibilityScore: 0.55, volumePotential: 15000 },

  // Batteriretur outputs
  { outputCompany: "batteriretur", inputCompany: "metallco-stene", material: "Blyfraksjoner", compatibilityScore: 0.70, volumePotential: 5000 },
];
