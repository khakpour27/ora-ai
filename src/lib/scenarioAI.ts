/**
 * AI-assisted scenario generation using Gemini.
 * Sends hub data + user goal to Gemini and parses structured mutations.
 */

import type { HubDataset } from "@/lib/api";
import type { ScenarioMutation } from "@/lib/api";

// ---------------------------------------------------------------------------
// Suggested goals
// ---------------------------------------------------------------------------
export const SUGGESTED_GOALS = [
  "Maksimer CO\u2082-reduksjon p\u00e5 tvers av \u00d8ra",
  "Optimaliser damplevering fra FREVAR og SAREN",
  "\u00d8k materialresirkulering mellom bedriftene",
  "Reduser totalt energitap i industriparken",
  "Utvikle CCS-klynge med Borg Havn som terminal",
  "Maksimer \u00f8konomisk verdi av nye symbioser",
  "Elektrifiser Kronos Titan og Denofa",
  "Utvid fjernvarmenettverket til 160 GWh",
];

// ---------------------------------------------------------------------------
// API key (same pattern as AIChatPage)
// ---------------------------------------------------------------------------
function getGeminiApiKey(): string | undefined {
  const runtimeKey = (
    window as unknown as {
      __RUNTIME_CONFIG__?: { VITE_GEMINI_API_KEY?: string };
    }
  ).__RUNTIME_CONFIG__?.VITE_GEMINI_API_KEY;
  if (runtimeKey) return runtimeKey;
  const buildKey = import.meta.env.VITE_GEMINI_API_KEY;
  return buildKey || undefined;
}

// ---------------------------------------------------------------------------
// Response type
// ---------------------------------------------------------------------------
export interface GeneratedScenario {
  name: string;
  description: string;
  mutations: ScenarioMutation[];
}

// ---------------------------------------------------------------------------
// Build scenario-specific prompt with hub data reference
// ---------------------------------------------------------------------------
function buildScenarioPrompt(hub: HubDataset): string {
  // Build entity reference lists so AI knows valid IDs
  const companies = Object.values(hub.companies)
    .map((c) => `- ${c.id}: ${c.name} (${c.annualEnergyGWh} GWh, ${c.annualWasteTonnes}t avfall)`)
    .join("\n");

  const energyFlows = hub.energyFlows
    .map((f, i) => `- index ${i}: ${f.source} → ${f.target}, ${f.value} GWh, type=${f.type}, status=${f.status}`)
    .join("\n");

  const materialFlows = hub.materialFlows
    .map((f) => `- id="${f.id}": ${f.source} → ${f.target}, ${f.material}, ${f.volumeTonnesPerYear} t/år, status=${f.status}`)
    .join("\n");

  const symbioses = hub.symbiosisOpportunities
    .map((s) => `- id="${s.id}": ${s.title}, verdi=${s.estimatedAnnualValueMNOK} MNOK, CO₂=${s.co2ReductionTonnes}t, status=${s.status}, konfidens=${s.aiConfidence}`)
    .join("\n");

  const businessCases = hub.businessCases
    .map((b) => `- symbiosisId="${b.symbiosisId}": ${b.title}, NPV=${b.npvMNOK} MNOK, IRR=${(b.irr * 100).toFixed(0)}%, investering=${b.investmentMNOK} MNOK`)
    .join("\n");

  return `Du er en KI-ekspert for industriell symbiose p\u00e5 \u00d8ra industriomr\u00e5de i Fredrikstad.
Du skal generere et scenario med konkrete mutasjoner basert på brukerens mål.

BEDRIFTER:
${companies}

ENERGISTRØMMER (bruk array-index som entityId):
${energyFlows}

MATERIALSTRØMMER (bruk "id" som entityId):
${materialFlows}

SYMBIOSEMULIGHETER (bruk "id" som entityId):
${symbioses}

FORRETNINGSCASER (bruk "symbiosisId" som entityId):
${businessCases}

MUTASJONSFORMAT:
Hver mutasjon har:
- id: unik streng (bruk "ai-1", "ai-2", osv.)
- type: "add" | "modify" | "delete"
- entity: "energyFlow" | "materialFlow" | "symbiosisOpportunity" | "businessCase"
- entityId: for modify/delete — energyFlow bruker array-index som streng (f.eks. "9"), andre bruker ID
- data: objekt med felt som endres
- description: kort norsk beskrivelse

For energyFlow data: { value, status, type, source, target }
For materialFlow data: { volumeTonnesPerYear, status, material, source, target, id, matchScore }
For symbiosisOpportunity data: { estimatedAnnualValueMNOK, co2ReductionTonnes, status, aiConfidence }
For businessCase data: { npvMNOK, irr, investmentMNOK, paybackYears }

Ved "add" for materialFlow, inkluder også: id, source, target, material, matchScore

REGLER:
1. Generer 4-10 mutasjoner som adresserer brukerens mål
2. Bruk KUN gyldige entityId-er fra listene ovenfor
3. Vær realistisk — verdier skal være proporsjonale med eksisterende data
4. Gi scenariet et kort, beskrivende norsk navn
5. Svar BARE med gyldig JSON — ingen markdown, ingen forklaring

JSON-FORMAT (svar kun med dette):
{
  "name": "Scenario-navn",
  "description": "Kort beskrivelse av scenariet",
  "mutations": [
    {
      "id": "ai-1",
      "type": "modify",
      "entity": "energyFlow",
      "entityId": "9",
      "description": "Beskrivelse på norsk",
      "data": { "value": 150 }
    }
  ]
}`;
}

// ---------------------------------------------------------------------------
// Call Gemini (non-streaming)
// ---------------------------------------------------------------------------
export async function generateScenario(
  hub: HubDataset,
  goal: string,
  signal?: AbortSignal,
): Promise<GeneratedScenario> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY_MISSING");
  }

  const systemPrompt = buildScenarioPrompt(hub);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [
          {
            role: "user",
            parts: [{ text: `Generer et scenario for dette målet: ${goal}` }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
          topP: 0.95,
        },
      }),
    },
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      (error as { error?: { message?: string } })?.error?.message ||
        `API-feil: ${response.status}`,
    );
  }

  const result = await response.json() as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };

  const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Tomt svar fra KI");
  }

  // Parse JSON — strip markdown fences if present
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();

  let parsed: GeneratedScenario;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("Kunne ikke tolke KI-svaret som JSON. Prøv igjen.");
  }

  // Validate structure
  if (!parsed.name || !Array.isArray(parsed.mutations)) {
    throw new Error("KI-svaret mangler påkrevde felt (name, mutations).");
  }

  // Sanitize mutations
  parsed.mutations = parsed.mutations
    .filter((m) => m.type && m.entity && m.description)
    .map((m, i) => ({
      id: m.id || `ai-${i + 1}`,
      type: m.type,
      entity: m.entity,
      entityId: m.entityId,
      data: m.data,
      description: m.description,
    }));

  if (parsed.mutations.length === 0) {
    throw new Error("KI-en genererte ingen gyldige mutasjoner. Prøv et annet mål.");
  }

  return parsed;
}
