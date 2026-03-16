import type { TenderBid, EvaluationWeight } from "@/types";

export const evaluationWeights: EvaluationWeight[] = [
  {
    criterion: "understanding",
    weight: 0.40,
    description: "Forstaelse av oppdraget og lokale forhold i Sunndal",
  },
  {
    criterion: "competence",
    weight: 0.25,
    description: "Faglig kompetanse og relevant erfaring fra sirkulaerokonomi og industriell symbiose",
  },
  {
    criterion: "methodology",
    weight: 0.20,
    description: "Metodikk, gjennomforingsplan og verktoy for kartlegging og analyse",
  },
  {
    criterion: "price",
    weight: 0.20,
    description: "Pris eksklusive MVA vurdert mot omfang og kvalitet",
  },
];

export const tenderBids: TenderBid[] = [
  {
    id: "bid-1",
    supplierName: "Multiconsult AS",
    submittedDate: "2026-02-15",
    scores: {
      understanding: 8.0,
      competence: 7.5,
      methodology: 9.0,
      price: 8.5,
    },
    totalWeightedScore: 8.2,
    priceExVatNOK: 1850000,
    workPackages: ["AP1", "AP2", "AP3", "AP5"],
    teamSize: 6,
    complianceFlags: [
      {
        requirement: "Erfaring fra industriell symbioseprosjekt i Norge",
        met: true,
        aiNote: "Dokumentert erfaring fra Heroya Industripark og Mo Industripark. Referanser bekreftet.",
      },
      {
        requirement: "Kompetanse innen LCA og materialstromsanalyse",
        met: true,
        aiNote: "Teamet inkluderer to sertifiserte LCA-analytikere med relevant publiseringshistorikk.",
      },
      {
        requirement: "Lokal tilstedevaerelse eller kjennskap til Sunndal",
        met: true,
        aiNote: "Har kontor i Molde og tidligere oppdrag for Sunndal kommune. God lokal forankring.",
      },
      {
        requirement: "Kvalitetssikringssystem (ISO 9001)",
        met: true,
        aiNote: "ISO 9001:2015 sertifisert. Revisjon gjennomfort 2025.",
      },
      {
        requirement: "Kapasitet til a starte innen 4 uker",
        met: true,
        aiNote: "Bekreftet tilgjengelig kapasitet fra mars 2026.",
      },
      {
        requirement: "Minimum 5 ars erfaring med energikartlegging",
        met: true,
        aiNote: "Over 15 ars erfaring med energikartlegging i norsk industri.",
      },
      {
        requirement: "Databehandleravtale i henhold til GDPR",
        met: true,
        aiNote: "Standard databehandleravtale vedlagt tilbudet.",
      },
      {
        requirement: "Forsikringsbevis for profesjonsansvar",
        met: true,
        aiNote: "Forsikringsbevis pa 50 MNOK vedlagt. Gyldig til 2027.",
      },
    ],
  },
  {
    id: "bid-2",
    supplierName: "SINTEF Energi",
    submittedDate: "2026-02-18",
    scores: {
      understanding: 7.5,
      competence: 9.5,
      methodology: 7.0,
      price: 6.5,
    },
    totalWeightedScore: 7.8,
    priceExVatNOK: 2450000,
    workPackages: ["AP1", "AP2", "AP3", "AP4", "AP5", "AP6"],
    teamSize: 9,
    complianceFlags: [
      {
        requirement: "Erfaring fra industriell symbioseprosjekt i Norge",
        met: true,
        aiNote: "Ledende forskningsmiljo pa industriell symbiose. Deltatt i 20+ relevante prosjekter nasjonalt og internasjonalt.",
      },
      {
        requirement: "Kompetanse innen LCA og materialstromsanalyse",
        met: true,
        aiNote: "Verdensledende kompetanse pa LCA. Utviklet flere nasjonale standarder.",
      },
      {
        requirement: "Lokal tilstedevaerelse eller kjennskap til Sunndal",
        met: false,
        aiNote: "Hovedkontor i Trondheim. Begrenset lokal kjennskap til Sunndal, men sterk regional tilknytning til More og Romsdal.",
      },
      {
        requirement: "Kvalitetssikringssystem (ISO 9001)",
        met: true,
        aiNote: "ISO 9001:2015 sertifisert som del av SINTEF-konsernet.",
      },
      {
        requirement: "Kapasitet til a starte innen 4 uker",
        met: true,
        aiNote: "Kan starte medio mars 2026. Noe avhengig av avslutning av pagaende prosjekt.",
      },
      {
        requirement: "Minimum 5 ars erfaring med energikartlegging",
        met: true,
        aiNote: "Over 30 ars erfaring. Nasjonalt referanselaboratorium for energieffektivisering.",
      },
    ],
  },
  {
    id: "bid-3",
    supplierName: "Norconsult / cChange",
    submittedDate: "2026-02-20",
    scores: {
      understanding: 9.0,
      competence: 8.0,
      methodology: 8.5,
      price: 8.0,
    },
    totalWeightedScore: 8.5,
    priceExVatNOK: 1950000,
    workPackages: ["AP1", "AP2", "AP3", "AP5", "AP6"],
    teamSize: 7,
    complianceFlags: [
      {
        requirement: "Erfaring fra industriell symbioseprosjekt i Norge",
        met: true,
        aiNote: "cChange har spesialisert kompetanse pa sirkulaerokonomi. Norconsult har bred industrierfaring. Sterk kombinasjon.",
      },
      {
        requirement: "Kompetanse innen LCA og materialstromsanalyse",
        met: true,
        aiNote: "cChange har dedikert LCA-team. Norconsult bidrar med materialstromsmodellering fra infrastrukturprosjekter.",
      },
      {
        requirement: "Lokal tilstedevaerelse eller kjennskap til Sunndal",
        met: true,
        aiNote: "Norconsult har kontor i Kristiansund med god kjennskap til Nordmore-regionen. cChange har gjennomfort forprosjekt for Sunndal kommune i 2025.",
      },
      {
        requirement: "Kvalitetssikringssystem (ISO 9001)",
        met: true,
        aiNote: "Norconsult ISO 9001:2015 sertifisert. cChange har eget kvalitetssystem godkjent av DNV.",
      },
      {
        requirement: "Kapasitet til a starte innen 4 uker",
        met: true,
        aiNote: "Bekreftet umiddelbar tilgjengelighet. Prosjektleder dedikert fra oppstartsuke.",
      },
      {
        requirement: "Minimum 5 ars erfaring med energikartlegging",
        met: true,
        aiNote: "Norconsult har over 20 ars erfaring. cChange supplerer med innovativ analysemetodikk.",
      },
      {
        requirement: "Databehandleravtale i henhold til GDPR",
        met: true,
        aiNote: "Felles databehandleravtale for konsortiet vedlagt. GDPR-kompatibel.",
      },
      {
        requirement: "Forsikringsbevis for profesjonsansvar",
        met: true,
        aiNote: "Begge parter har profesjonsansvarsforsikring. Norconsult 100 MNOK, cChange 20 MNOK.",
      },
    ],
  },
];
