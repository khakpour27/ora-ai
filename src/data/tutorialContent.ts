export interface TourStep {
  title: string;
  description: string;
  route: string;
  targetSelector?: string;
}

// ── Splash Screen Content ──────────────────────────────────────────

export const splashContent = {
  phase1: {
    company: "NCCE",
    subtitle: "Norsk senter for sirkul\u00e6r\u00f8konomi",
  },

  phase2: {
    title: "SymbioLink Øra",
    description:
      "Et samarbeidsprosjekt mellom 12 industrielle aktører på Øra i Fredrikstad for å optimalisere industriell symbiose. Prosjektet omfatter energikartlegging, materialstrømsanalyse, identifisering av nye symbiosemuligheter og utvikling av forretningscase for sirkulærøkonomiske løsninger.",
  },

  phase3: {
    heading: "NCCE & NORSUS anbefaler",
    description:
      "For å optimalisere analysearbeidet anbefaler NCCE og NORSUS bruk av et KI-basert beslutningsstøtte- og visualiseringsverktøy. Verktøyet dekker alle arbeidspakker i SymbioLink Øra-prosjektet, gir sanntids innsikt i industrielle synergier, og sporer alle datapunkter tilbake til kildedokumenter gjennom et innebygd provenienssystem.",
    capabilities: [
      { label: "Prosjektledelse", ap: "AP1" },
      { label: "Materialstrømsanalyse", ap: "AP2" },
      { label: "Energikartlegging", ap: "AP3" },
      { label: "Symbioseidentifisering", ap: "AP4" },
      { label: "Forretningscase-utvikling", ap: "AP5" },
      { label: "Kommunikasjon", ap: "AP6" },
    ],
  },

  phase4: {
    metrics: [
      { value: 16, label: "Symbiosemuligheter identifisert", decimals: 0 },
      { value: 95000, label: "tonn CO\u2082 energibesparelse/\u00e5r", decimals: 0 },
      { value: 390000, label: "tonn netto CO\u2082 unng\u00e5tt/\u00e5r", decimals: 0 },
      { value: 12, label: "Industrielle akt\u00f8rer", decimals: 0 },
    ],
  },

  phase5: {
    cta: "Utforsk verkt\u00f8yet",
    skip: "Hopp over",
  },
} as const;

// ── Tour Steps ─────────────────────────────────────────────────────

export const tourSteps: TourStep[] = [
  {
    title: "Oversikt",
    description:
      "Dashboardet gir en samlet oversikt med KI-genererte nøkkeltall, fremdrift for alle arbeidspakker, og automatisk identifiserte innsikter på tvers av prosjektet. Hold musepekeren over dokumentikonet ved nøkkeltallene for å se datakilde, referanse og pålitelighetsgrad.",
    route: "/",
    targetSelector: "[data-tour-id='dashboard-kpis']",
  },
  {
    title: "Industrielt kart",
    description:
      "Det interaktive kartet viser alle 12 bedrifter på Øra med geografisk plassering, energistrømmer og materialstrømmer — en visuell oversikt over hele det industrielle økosystemet.",
    route: "/",
    targetSelector: "[data-tour-id='dashboard-map']",
  },
  {
    title: "Energikartlegging (AP3)",
    description:
      "Sankey-diagrammer og varmekart visualiserer energistrømmer mellom bedriftene. KI-analyse identifiserer optimaliseringsmuligheter for energiutveksling og -gjenvinning.",
    route: "/energi",
  },
  {
    title: "Materialstrømsanalyse (AP2)",
    description:
      "Nettverksgrafer, koblingsmatriser og Chord-diagrammer avdekker materialstrømmer og sirkulære koblinger mellom aktørene på Øra.",
    route: "/materialstrom",
  },
  {
    title: "KI Symbioseidentifisering (AP5)",
    description:
      "KI-drevet analyse identifiserer og rangerer nye symbiosemuligheter basert på teknisk gjennomførbarhet, økonomisk lønnsomhet og miljøeffekt.",
    route: "/symbiose",
  },
  {
    title: "Forretningscase",
    description:
      "Detaljerte lønnsomhetsberegninger med NPV, IRR og tilbakebetalingstid, samt tidslinjer og kartlegging av relevante finansieringsmuligheter.",
    route: "/forretningscase",
  },
  {
    title: "Geografisk oversikt",
    description:
      "Interaktivt 3D-kart basert på MapLibre med alle bedrifter, energistrømmer og materialstrømmer plottet på reelt terrengkart over Øra industriområde i Fredrikstad. Filtrer på energityper og bytt bakgrunn.",
    route: "/kart",
  },
  {
    title: "Prosjektdata",
    description:
      "Last opp egne dokumenter (PDF, TXT, CSV) eller lim inn URL-er som blir kontekst for KI-eksperten. Alle opplastede data blir del av systemprompten for mer presise svar.",
    route: "/prosjektdata",
  },
  {
    title: "KI-ekspert Chat",
    description:
      "Still spørsmål om prosjektdata, energistrømmer, materialstrømmer og symbiosemuligheter. KI-eksperten bruker alle data i sanntid og viser kildehenvisninger inline.",
    route: "/ki-ekspert",
  },
  {
    title: "Scenarielaboratorium",
    description:
      "Bygg egne scenarier med mutasjoner av energistrømmer, materialstrømmer og symbioser — eller la KI generere et scenario basert på et mål. Sammenlign effekten på tvers av alle sider.",
    route: "/scenarier",
  },
];
