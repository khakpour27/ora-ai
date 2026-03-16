/**
 * Builds a comprehensive system prompt for the AI Expert Chat.
 * Aggregates all project data into a structured context string
 * so the LLM can answer questions about Sirkulaere Sunndal Hub.
 */

import type { ProjectDocument } from "@/types";
import type { HubDataset } from "@/lib/api";

function fmtProv(p?: { source: string; page?: string; date?: string; confidence: string }): string {
  if (!p) return "";
  const parts = [`📎 ${p.source}`];
  if (p.page) parts.push(`s. ${p.page}`);
  if (p.date) parts.push(p.date);
  parts.push(`[${p.confidence}]`);
  return ` (${parts.join(", ")})`;
}

function buildCompanyContext(hub: HubDataset): string {
  return Object.values(hub.companies)
    .map(
      (c) =>
        `- ${c.name} (${c.id}): ${c.sector}. ${c.description} Energiforbruk: ${c.annualEnergyGWh} GWh/år, Avfall: ${c.annualWasteTonnes} tonn/år, Ansatte: ${c.employeeCount}.${fmtProv(c.provenance)}`
    )
    .join("\n");
}

function buildEnergyContext(hub: HubDataset): string {
  const nodes = hub.sankeyNodes.map((n) => n.label).join(", ");
  const flows = hub.energyFlows
    .map(
      (f) =>
        `  ${f.source} -> ${f.target}: ${f.value} GWh (${f.type}, ${f.status})${fmtProv(f.provenance)}`
    )
    .join("\n");
  const surplus = hub.surplusDeficitData
    .map(
      (s) =>
        `  ${s.companyId}: el=${s.electricity} GWh, varme=${s.heat} GWh, spillvarme=${s.wasteHeat} GWh (${s.season})`
    )
    .join("\n");
  const opts = hub.energyOptimizations
    .map(
      (o) =>
        `  ${o.title}: besparelse ${o.savingGWh} GWh, investering ${o.estimatedCostMNOK} MNOK, kompleksitet: ${o.complexity}. ${o.description}${fmtProv(o.provenance)}`
    )
    .join("\n");
  return `Energinoder: ${nodes}\n\nEnergistrømmer:\n${flows}\n\nOverskudd/underskudd per sesong:\n${surplus}\n\nEnergioptimeringsforslag:\n${opts}`;
}

function buildMaterialContext(hub: HubDataset): string {
  const flows = hub.materialFlows
    .map(
      (f) =>
        `  ${f.source} -> ${f.target}: ${f.material}, ${f.volumeTonnesPerYear} tonn/år (${f.status}, match=${f.matchScore})${fmtProv(f.provenance)}`
    )
    .join("\n");
  const waste = hub.wasteStreams
    .map(
      (w) =>
        `  ${w.companyId}: ${w.material} (${w.classification}), ${w.volumeTonnesPerYear} tonn/år, håndtering: ${w.currentHandling}${fmtProv(w.provenance)}`
    )
    .join("\n");
  return `Materialstrømmer:\n${flows}\n\nAvfallsstrømmer:\n${waste}`;
}

function buildSymbiosisContext(hub: HubDataset): string {
  return hub.symbiosisOpportunities
    .map(
      (s) =>
        `- ${s.title} (${s.id}, type: ${s.type}, status: ${s.status}): ${s.description} KI-tillit: ${(s.aiConfidence * 100).toFixed(0)}%, verdi: ${s.estimatedAnnualValueMNOK} MNOK/år, CO2-reduksjon: ${s.co2ReductionTonnes} tonn/år. Risiko: teknisk=${s.risks.technical}, regulatorisk=${s.risks.regulatory}, finansiell=${s.risks.financial}, operasjonell=${s.risks.operational}. Bedrifter: ${s.involvedCompanies.join(", ")}.${fmtProv(s.provenance)}`
    )
    .join("\n");
}

function buildKPIContext(hub: HubDataset): string {
  const kpis = hub.dashboardKPIs
    .map(
      (k) =>
        `- ${k.label}: ${k.value} ${k.unit} (trend: ${k.trend} ${k.trendValue}%)${fmtProv(k.provenance)}`
    )
    .join("\n");
  const wps = hub.workPackageStatuses
    .map((w) => `- ${w.id} ${w.name}: ${w.status}, ${w.progress}% ferdig`)
    .join("\n");
  return `KPIer:\n${kpis}\n\nArbeidspakker:\n${wps}`;
}

function buildInsightContext(hub: HubDataset): string {
  return hub.aiInsights
    .map(
      (i) =>
        `- ${i.title} (${i.category}, prioritet: ${i.priority}): ${i.body} Relaterte bedrifter: ${i.relatedCompanies.join(", ")}.${fmtProv(i.provenance)}`
    )
    .join("\n");
}

function buildBusinessCaseContext(hub: HubDataset): string {
  return hub.businessCases
    .map(
      (b) =>
        `- ${b.title} (${b.symbiosisId}): Investering: ${b.investmentMNOK} MNOK, IRR: ${(b.irr * 100).toFixed(0)}%, tilbakebetalingstid: ${b.paybackYears} år, NPV: ${b.npvMNOK} MNOK. Faser: ${b.timeline.map((p) => `${p.name} (start m${p.startMonth}, ${p.durationMonths} md)`).join(", ")}. Finansiering: ${b.fundingOpportunities.map((f) => `${f.name}: ${f.maxAmountMNOK} MNOK, relevans ${(f.relevanceScore * 100).toFixed(0)}%`).join(", ")}.${fmtProv(b.provenance)}`
    )
    .join("\n");
}

export function buildSystemPrompt(hub: HubDataset, scenarioContext?: string): string {
  const scenarioSection = scenarioContext
    ? `\n\nAKTIVT SCENARIO:\n${scenarioContext}\nNår brukeren spør om effekten av scenariet, sammenlign med basisdata ovenfor.`
    : "";

  return `Du er en KI-ekspert for Sirkulære Sunndal Hub-prosjektet. Du har tilgang til all prosjektdata og kan svare på spørsmål om energikartlegging, materialstrømmer, industriell symbiose, forretningscaser og mer.

PROSJEKTKONTEKST:
Sirkulære Sunndal Hub er et innovasjonsprosjekt i Sunndal kommune, Norge, som har som mål å fremme sirkulærøkonomi og industriell symbiose mellom ${Object.keys(hub.companies).length} bedrifter i regionen. Prosjektet er finansiert gjennom Skaparkraft-programmet og ledes av et konsortium.

BEDRIFTER I HUBBEN:
${buildCompanyContext(hub)}

ENERGIKARTLEGGING:
${buildEnergyContext(hub)}

MATERIALSTRØMMER OG AVFALL:
${buildMaterialContext(hub)}

SYMBIOSEMULIGHETER (${hub.symbiosisOpportunities.length} identifisert):
${buildSymbiosisContext(hub)}

NØKKELTALL OG ARBEIDSPAKKER:
${buildKPIContext(hub)}

KI-INNSIKTER:
${buildInsightContext(hub)}

FORRETNINGSCASER:
${buildBusinessCaseContext(hub)}
${scenarioSection}

PROSJEKTDOKUMENTER (ikke tilgjengelig i sanntid, men brukt som grunnlag):
- Avslutningsrapport Sirkulære Sunndal (2024)
- Mepex Materialstrømsanalyser for Hydro Sunndal, Ottem Recycling, Storvik, Sunndal Energi (2024)
- Konkurransegrunnlag Sirkulære Sunndal Hub 2026
- Søknad Skaparkraft Industrielle Løft (2023)
- Helhetlige Industrielle Symbioser (rapport)
- SUNS nettsted (sunndal.sfrn.no)

REGLER:
1. Svar alltid på norsk (bokmål), med mindre brukeren skriver på engelsk.
2. Vær presis og referer til konkrete tall fra dataene.
3. KILDEHENVISNING: Når du nevner datapunkter, OPPGI ALLTID kilden i parentes etter tallet. Dataene ovenfor har kildemerking i formatet (📎 Kilde, side, dato, [pålitelighet]). Bruk dette i svarene dine slik:
   - Skriv kildehenvisningen i parentes etter det relevante tallet eller påstanden
   - Eksempel: "Hydro Sunndal forbruker 6 143 GWh elektrisitet (📎 Mepex Materialstrømsanalyse – Hydro Sunndal, 2024 [verified])"
   - Eksempel: "Spillvarmepotensial er estimert til 148 GWh (📎 Avslutningsrapport – Sirkulære Sunndal [verified])"
   - Hvis et datapunkt ikke har kildemerking, skriv "(estimert)" etter tallet
   - Bruk alltid det nøyaktige kildenavnet fra dataene — ikke forkorte eller endre det
4. Du kan analysere, sammenligne og gi anbefalinger basert på dataene.
5. Hvis du ikke har informasjon om noe, si det ærlig.
6. Bruk fagspråk innen sirkulærøkonomi, industriell symbiose og energieffektivisering.
7. Du kan referere til spesifikke bedrifter, symbiosemuligheter og forretningscaser ved navn og ID.
8. PÅLITELIGHETSMERKING: Når du bruker data, marker påliteligheten slik:
   - [verified] = Verifisert fra offisielle dokumenter — kan siteres direkte
   - [estimated] = Estimert/beregnet — marker som "estimert" i svaret
   - [projected] = Framskrevet/antatt — marker som "anslått" i svaret
9. Avslutt ALLTID svaret med nøyaktig 3 oppfølgingsspørsmål som brukeren kan stille. Formater dem slik:

---FOLLOWUP---
1. [spørsmål 1]
2. [spørsmål 2]
3. [spørsmål 3]`;
}

/**
 * Builds a context string from user-uploaded documents.
 * Appended to the system prompt at chat-time so the LLM can reference
 * uploaded PDFs, web pages, and pasted text.
 */
const MAX_CHARS_PER_DOC_CONTEXT = 200_000;

export function buildUserDataContext(
  documents: ProjectDocument[],
  texts: Map<string, string>
): string {
  const readyDocs = documents.filter((d) => d.status === "ready");
  if (readyDocs.length === 0) return "";

  const sections = readyDocs
    .map((doc) => {
      let text = texts.get(doc.id) ?? "";
      if (text.length > MAX_CHARS_PER_DOC_CONTEXT) {
        text = text.slice(0, MAX_CHARS_PER_DOC_CONTEXT) + "\n[... avkortet]";
      }
      const typeLabel =
        doc.type === "file"
          ? "Fil"
          : doc.type === "url"
            ? "URL"
            : "Manuell tekst";
      return `### ${doc.name} (${typeLabel}: ${doc.source})\n${text}`;
    })
    .join("\n\n---\n\n");

  return `\n\nBRUKEROPPLASTEDE DOKUMENTER:
Brukeren har lastet opp ${readyDocs.length} dokument${readyDocs.length !== 1 ? "er" : ""} som tilleggskontekst.
Når du refererer til informasjon fra disse dokumentene, marker kilden slik: (📎 Brukeropplastet: [dokumentnavn])

${sections}`;
}
