import type { Company } from "@/types";

export const companies: Record<string, Company> = {
  "hydro-sunndal": {
    id: "hydro-sunndal",
    name: "Hydro Sunndal AS",
    shortName: "Hydro",
    sector: "Aluminiumsproduksjon",
    description:
      "Norges største aluminiumsverk med en årlig produksjonskapasitet på over 400 000 tonn primær aluminium. Anvender fornybar vannkraft og er en hjørnesteinsbedrift i Sunndal.",
    color: "#3B82F6",
    icon: "Factory",
    coordinates: [8.56, 62.67],
    annualEnergyGWh: 6827,
    annualWasteTonnes: 49738,
    employeeCount: 700,
    provenance: { source: "Mepex Materialstrømsanalyse – Hydro Sunndal", confidence: "verified", date: "2024" },
  },
  "sunndal-energi": {
    id: "sunndal-energi",
    name: "Sunndal Energi AS",
    shortName: "Energi",
    sector: "Energiforsyning og fjernvarme",
    description:
      "Regional energileverandor som distribuerer fjernvarme i Sunndal-regionen. Opererer fjernvarmenettet og formidler spillvarme fra industrien til kommunale og naeringsbygg.",
    color: "#F59E0B",
    icon: "Zap",
    coordinates: [8.55, 62.68],
    annualEnergyGWh: 45,
    annualWasteTonnes: 20,
    employeeCount: 45,
    provenance: { source: "Mepex Materialstrømsanalyse – Sunndal Energi", confidence: "verified", date: "2024" },
  },
  "ottem-recycling": {
    id: "ottem-recycling",
    name: "Ottem Recycling AS",
    shortName: "Ottem",
    sector: "Gjenvinning og avfallshandtering",
    description:
      "Spesialisert gjenvinningsbedrift som handterer industrielt og kommunalt avfall. Prosesserer metaller, plast og organisk avfall for gjenbruk og materialgjenvinning.",
    color: "#10B981",
    icon: "Recycle",
    coordinates: [8.57, 62.66],
    annualEnergyGWh: 5,
    annualWasteTonnes: 5200,
    employeeCount: 25,
    provenance: { source: "Mepex Materialstrømsanalyse – Ottem Recycling", confidence: "verified", date: "2024" },
  },
  storvik: {
    id: "storvik",
    name: "Storvik AS",
    shortName: "Storvik",
    sector: "Verkstedsindustri og vedlikehold",
    description:
      "Verkstedsbedrift med spesialkompetanse innen vedlikehold og service for prosessindustri. Leverer mekanisk vedlikehold, sveisearbeid og modifikasjoner til industrien i Sunndal.",
    color: "#8B5CF6",
    icon: "Wrench",
    coordinates: [8.54, 62.67],
    annualEnergyGWh: 1.6,
    annualWasteTonnes: 244,
    employeeCount: 120,
    provenance: { source: "Mepex Materialstrømsanalyse – Storvik", confidence: "verified", date: "2024" },
  },
  industrikraft: {
    id: "industrikraft",
    name: "Industrikraft AS",
    shortName: "Industrikraft",
    sector: "Industriell krafthandel",
    description:
      "Spesialisert krafthandelsselskap som sikrer konkurransedyktige stromavtaler for energiintensiv industri. Handterer kraftkjop, -salg og portefoljestyring.",
    color: "#EF4444",
    icon: "BatteryCharging",
    coordinates: [8.58, 62.68],
    annualEnergyGWh: 500,
    annualWasteTonnes: 10,
    employeeCount: 20,
    provenance: { source: "Konkurransegrunnlag Sirkulaere Sunndal Hub 2026", confidence: "estimated" },
  },
  "sunndal-kommune": {
    id: "sunndal-kommune",
    name: "Sunndal kommune",
    shortName: "Kommune",
    sector: "Offentlig forvaltning",
    description:
      "Sunndal kommune med ansvar for kommunal infrastruktur, avfallshandtering, skoler og offentlige bygg. Arbeider aktivt med grønn omstilling og sirkulaerokonomi.",
    color: "#06B6D4",
    icon: "Landmark",
    coordinates: [8.56, 62.66],
    annualEnergyGWh: 80,
    annualWasteTonnes: 3000,
    employeeCount: 800,
    provenance: { source: "Konkurransegrunnlag Sirkulaere Sunndal Hub 2026", confidence: "estimated" },
  },
};

export const companyList: Company[] = Object.values(companies);
export const companyIds: string[] = Object.keys(companies);
