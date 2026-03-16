import type { Scenario, ScenarioMutation } from "@/lib/api";

export interface ScenarioPreset extends Scenario {
  icon: string; // Lucide icon name
}

// Helper to build mutations concisely
function mut(
  id: string,
  type: ScenarioMutation["type"],
  entity: ScenarioMutation["entity"],
  description: string,
  entityId?: string,
  data?: Record<string, unknown>,
): ScenarioMutation {
  return { id, type, entity, description, ...(entityId != null ? { entityId } : {}), ...(data ? { data } : {}) };
}

/**
 * 5 pre-defined scenarios for the Øra industrial ecosystem.
 * Each produces visible changes across Energi, Materialstrøm, Symbiose, Kart, Dashboard, and Forretningscase.
 *
 * Energy flow indices (0-based) reference energyFlows array in energyFlows.ts:
 *   0-9: existing flows
 *   10: saren→damp potential (50 GWh)
 *   11: damp→kronos potential (40 GWh)
 *   12: fjernvarme→fredrikstad planned (72 GWh)
 *   13: biogass→by-oppvarming potential (10 GWh)
 */
export const SCENARIO_PRESETS: ScenarioPreset[] = [
  // ─── 1. Elektrifisering & SAREN-utvidelse ──────────────────────────────
  {
    id: "preset-elektrifisering",
    hubId: "demo",
    name: "Elektrifisering + SAREN-utvidelse",
    description:
      "SAREN BIO-ELs utvidede kapasitet kombinert med Kronos Titans elektrifisering. Erstatter ~150 GWh fossil energi med damp og elektrisitet. Forutsetter nettoppgradering etter 2030.",
    color: "#F59E0B",
    icon: "Zap",
    createdAt: "2026-01-15T00:00:00Z",
    mutations: [
      // Activate SAREN expanded steam delivery
      mut("el-1", "modify", "energyFlow", "Aktivere SAREN utvidet damplevering: 50 GWh", "10", {
        value: 50,
        status: "planned",
      }),
      // Activate additional steam to Kronos
      mut("el-2", "modify", "energyFlow", "Øke damp til Kronos Titan: 40 GWh ekstra", "11", {
        value: 40,
        status: "planned",
      }),
      // Upgrade Kronos electrification symbiosis
      mut("el-3", "modify", "symbiosisOpportunity", "Prioritere Kronos elektrifisering", "sym-14", {
        status: "prioritized",
        aiConfidence: 0.70,
      }),
      // Upgrade SAREN symbiosis value
      mut("el-4", "modify", "symbiosisOpportunity", "Øke SAREN-symbioseverdi", "sym-2", {
        estimatedAnnualValueMNOK: 45.0,
        co2ReductionTonnes: 55000,
      }),
    ],
  },

  // ─── 2. CCS-klynge ────────────────────────────────────────────────────
  {
    id: "preset-ccs",
    hubId: "demo",
    name: "Borg CO₂ CCS-klynge",
    description:
      "Full karbonfangst fra tre Øra-lokasjoner med 630 000 tonn CO₂/år. CO₂-terminal ved Borg Havn for skipning til permanent lagring under Nordsjøen. 18 samarbeidspartnere.",
    color: "#3B82F6",
    icon: "CloudOff",
    createdAt: "2026-01-15T00:00:00Z",
    mutations: [
      // Upgrade CCS symbiosis
      mut("ccs-1", "modify", "symbiosisOpportunity", "Validere CCS-klynge", "sym-11", {
        status: "validated",
        aiConfidence: 0.72,
        co2ReductionTonnes: 630000,
      }),
      // Upgrade CCS business case
      mut("ccs-2", "modify", "businessCase", "Forbedret CCS-forretningscase", "sym-11", {
        npvMNOK: 120.0,
        investmentMNOK: 750,
      }),
      // New material flow: CO₂ from FREVAR to Borg Havn terminal
      mut("ccs-3", "add", "materialFlow", "Ny CO₂-strøm: FREVAR→Borg Havn 250 000 t/år", undefined, {
        id: "mf-sc-ccs-1",
        source: "frevar-kf",
        target: "borg-havn",
        material: "Fanget CO₂ (karbonfangst)",
        volumeTonnesPerYear: 250000,
        status: "planned",
        matchScore: 0.70,
      }),
      // New material flow: CO₂ from SAREN to Borg Havn
      mut("ccs-4", "add", "materialFlow", "Ny CO₂-strøm: SAREN→Borg Havn 380 000 t/år", undefined, {
        id: "mf-sc-ccs-2",
        source: "saren-energi",
        target: "borg-havn",
        material: "Fanget CO₂ (karbonfangst, biogent)",
        volumeTonnesPerYear: 380000,
        status: "planned",
        matchScore: 0.70,
      }),
    ],
  },

  // ─── 3. Biogass-utvidelse ─────────────────────────────────────────────
  {
    id: "preset-biogass",
    hubId: "demo",
    name: "Regional biogassutvidelse",
    description:
      "Ekspandert biogassproduksjon fra dagens ~25 GWh til 100 GWh regionalt potensial. 30 % av husdyrgjødsel gjennom biogass innen 2030. Klimagevinst fra 8 400 til 11 400 tonn CO₂/år.",
    color: "#10B981",
    icon: "Leaf",
    createdAt: "2026-01-15T00:00:00Z",
    mutations: [
      // Increase biogas energy output
      mut("bio-1", "modify", "energyFlow", "Øke biogass til by: 10→25 GWh", "13", {
        value: 25,
        status: "planned",
      }),
      // Increase biogas steam input
      mut("bio-2", "modify", "energyFlow", "Øke damp til biogass: 5→12 GWh", "4", {
        value: 12,
      }),
      // Update FREVAR biogas symbiosis
      mut("bio-3", "modify", "symbiosisOpportunity", "Prioritere biogass-utvidelse", "sym-6", {
        estimatedAnnualValueMNOK: 25.0,
        co2ReductionTonnes: 11400,
        status: "prioritized",
      }),
      // Increase organic waste feedstock
      mut("bio-4", "modify", "materialFlow", "Øke biogas-substrat: 30 000→60 000 t/år", "mf-13", {
        volumeTonnesPerYear: 60000,
      }),
    ],
  },

  // ─── 4. Maksimal resirkulering ────────────────────────────────────────
  {
    id: "preset-resirkulering",
    hubId: "demo",
    name: "Maksimal resirkulering",
    description:
      "Øke materialutnyttelsen ved å aktivere alle potensielle materialstrømmer: kabelplast-valorisering, slagg som sand-erstatning, utvidet batteri-gjenvinning, og vannssymbiose mellom FREVAR-Denofa-Kronos.",
    color: "#8B5CF6",
    icon: "Recycle",
    createdAt: "2026-01-15T00:00:00Z",
    mutations: [
      // Activate cable plastic valorization
      mut("res-1", "modify", "materialFlow", "Aktivere kabelplast-valorisering: 6 000 t/år", "mf-14", {
        status: "planned",
      }),
      // Activate slag as sand replacement
      mut("res-2", "modify", "materialFlow", "Aktivere slagg som sand-erstatning: 1 000 t/år", "mf-15", {
        status: "planned",
      }),
      // Activate water symbiosis
      mut("res-3", "modify", "materialFlow", "Aktivere vannsymbiose: 500 000 t/år", "mf-17", {
        status: "planned",
      }),
      // Upgrade cable plastic symbiosis
      mut("res-4", "modify", "symbiosisOpportunity", "Validere kabelplast-symbiose", "sym-12", {
        status: "validated",
        aiConfidence: 0.78,
      }),
      // Upgrade water symbiosis
      mut("res-5", "modify", "symbiosisOpportunity", "Validere vannsymbiose", "sym-13", {
        status: "validated",
        aiConfidence: 0.72,
      }),
      // Increase battery recycling flow
      mut("res-6", "modify", "materialFlow", "Øke batteristrøm: 3 000→8 000 t/år", "mf-16", {
        volumeTonnesPerYear: 8000,
      }),
    ],
  },

  // ─── 5. Kun eksisterende (konservativ) ─────────────────────────────────
  {
    id: "preset-konservativ",
    hubId: "demo",
    name: "Kun eksisterende tiltak",
    description:
      "Viser kun eksisterende og validerte strømmer — fjerner alle potensielle og planlagte tiltak. Demonstrerer forskjellen mellom dagens situasjon og mulighetene.",
    color: "#64748B",
    icon: "ShieldCheck",
    createdAt: "2026-01-15T00:00:00Z",
    mutations: [
      // Delete potential/planned energy flows (highest index first)
      mut("kv-e4", "delete", "energyFlow", "Fjern biogass→by potensielt", "13"),
      mut("kv-e3", "delete", "energyFlow", "Fjern fjernvarme→fredrikstad planlagt", "12"),
      mut("kv-e2", "delete", "energyFlow", "Fjern damp→kronos potensielt", "11"),
      mut("kv-e1", "delete", "energyFlow", "Fjern saren→damp potensielt", "10"),
      // Delete potential material flows
      mut("kv-m1", "delete", "materialFlow", "Fjern kabelplast potensielt", "mf-14"),
      mut("kv-m2", "delete", "materialFlow", "Fjern slagg planlagt", "mf-15"),
      mut("kv-m3", "delete", "materialFlow", "Fjern vannsymbiose potensielt", "mf-17"),
      // Delete identified-only symbioses
      mut("kv-s1", "delete", "symbiosisOpportunity", "Fjern CCS-symbiose", "sym-11"),
      mut("kv-s2", "delete", "symbiosisOpportunity", "Fjern kabelplast-symbiose", "sym-12"),
      mut("kv-s3", "delete", "symbiosisOpportunity", "Fjern vannsymbiose", "sym-13"),
      mut("kv-s4", "delete", "symbiosisOpportunity", "Fjern elektrifisering-symbiose", "sym-14"),
    ],
  },
];
