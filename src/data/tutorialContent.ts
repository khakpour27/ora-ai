export interface TourStep {
  title: string;
  description: string;
  route: string;
  targetSelector?: string;
}

// ── Splash Screen Content ──────────────────────────────────────────

export const splashContent = {
  phase1: {
    company: "COWI",
    subtitle: "Engineering, Management & Sustainability",
  },

  phase2: {
    title: "Sirkulære Sunndal Hub",
    description:
      "Et samarbeidsprosjekt mellom 6 industrielle aktører i Sunndal for å etablere en sirkulær industrihub. Prosjektet omfatter energikartlegging, materialstrømsanalyse, identifisering av industrielle symbioser og utvikling av forretningscase for bærekraftige løsninger.",
  },

  phase3: {
    heading: "COWI anbefaler",
    description:
      "For å optimalisere analysearbeidet anbefaler COWI bruk av et KI-basert beslutningsstøtte- og visualiseringsverktøy. Verktøyet dekker alle arbeidspakker i prosjektet, gir sanntids innsikt i industrielle synergier, og sporer alle datapunkter tilbake til kildedokumenter gjennom et innebygd provenienssystem.",
    capabilities: [
      { label: "Energikartlegging", ap: "AP3" },
      { label: "Materialstrømsanalyse", ap: "AP2" },
      { label: "Symbioseidentifisering", ap: "AP5" },
      { label: "Forretningscase-utvikling", ap: "" },
      { label: "Kompetanseheving", ap: "AP1" },
      { label: "Markedstilgang", ap: "AP6" },
    ],
  },

  phase4: {
    metrics: [
      { value: 47, label: "Symbiosemuligheter identifisert", decimals: 0 },
      { value: 148.4, label: "GWh besparingspotensial", decimals: 1 },
      { value: 28500, label: "tonn CO\u2082-reduksjon/\u00e5r", decimals: 0 },
      { value: 6, label: "Industrielle akt\u00f8rer", decimals: 0 },
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
      "Det interaktive kartet viser alle 6 bedrifter med geografisk plassering, energistrømmer og materialstrømmer — en visuell oversikt over hele det industrielle økosystemet.",
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
      "Nettverksgrafer, koblingsmatriser og Chord-diagrammer avdekker materialstrømmer og sirkulære koblinger mellom aktørene i Sunndal.",
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
      "Interaktivt 3D-kart basert på MapLibre med alle bedrifter, energistrømmer og materialstrømmer plottet på reelt terrengkart over Sunndalsøra. Filtrer på energityper og bytt bakgrunn.",
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
