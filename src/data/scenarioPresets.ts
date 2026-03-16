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
 * 5 pre-defined scenarios aligned with the Skaparkraft tender narrative.
 * Each produces visible changes across Energi, Materialstrom, Symbiose, Kart, Dashboard, and Forretningscase.
 */
export const SCENARIO_PRESETS: ScenarioPreset[] = [
  // ─── 1. Maksimal spillvarme ──────────────────────────────────────────
  {
    id: "preset-spillvarme",
    hubId: "demo",
    name: "Maksimal spillvarme",
    description:
      "Utvidet fjernvarmenett utnytter 85% av Hydros spillvarme (148 GWh). Sammenlignbart med Øra Industriparks varmesamarbeid, men i større skala.",
    color: "#F59E0B",
    icon: "Thermometer",
    createdAt: "2026-01-15T00:00:00Z",
    mutations: [
      // Expand potential spillvarme→fjernvarme (index 9, currently 118 GWh potential)
      mut("sv-1", "modify", "energyFlow", "Utvide spillvarme til fjernvarme: 118→100 GWh (realistisk)", "9", {
        value: 100,
        status: "planned",
      }),
      // Increase heat to Storvik (index 10, currently 1 GWh potential)
      mut("sv-2", "modify", "energyFlow", "Øke varme til Storvik: 1→3 GWh", "10", {
        value: 3,
        status: "planned",
      }),
      // Increase heat to Ottem (index 11, currently 2 GWh potential)
      mut("sv-3", "modify", "energyFlow", "Øke varme til Ottem Recycling: 2→4 GWh", "11", {
        value: 4,
        status: "planned",
      }),
      // New flow: fjernvarme → sunndal-kommune (district heating expansion)
      mut("sv-4", "add", "energyFlow", "Ny fjernvarme til Sunndal kommune: 40 GWh", undefined, {
        source: "fjernvarme",
        target: "sunndal-kommune",
        value: 40,
        type: "heat",
        status: "planned",
      }),
      // New material flow: Hydro sends thermal residues to Ottem for recycling
      mut("sv-5m", "add", "materialFlow", "Ny termisk restavfall: Hydro→Ottem 3000 t/år", undefined, {
        id: "mf-sc-sv-1",
        source: "hydro-sunndal",
        target: "ottem-recycling",
        material: "Termisk restavfall fra smelteverk",
        volumeTonnesPerYear: 3000,
        status: "planned",
        matchScore: 0.78,
      }),
      // Increase existing slagg flow (mf-3: slagg → building materials, 1800 t/yr)
      mut("sv-6m", "modify", "materialFlow", "Øke slagg til byggematerialer: 1800→3200 t/år", "mf-3", {
        volumeTonnesPerYear: 3200,
        status: "planned",
      }),
      // Symbiosis: increase value and CO2 reduction
      mut("sv-5", "modify", "symbiosisOpportunity", "Øke spillvarme-symbioseverdi", "sym-1", {
        estimatedAnnualValueMNOK: 28.0,
        co2ReductionTonnes: 18000,
      }),
      // Heat pump symbiosis: upgrade status
      mut("sv-6", "modify", "symbiosisOpportunity", "Prioritere varmepumpeløsning", "sym-11", {
        status: "prioritized",
      }),
      // Business case: improved NPV with expanded scope
      mut("sv-7", "modify", "businessCase", "Oppdatert spillvarme-forretningscase", "sym-1", {
        npvMNOK: 72.0,
        investmentMNOK: 55,
      }),
    ],
  },

  // ─── 2. Sirkulær aluminiumskrets ─────────────────────────────────────
  {
    id: "preset-aluminium",
    hubId: "demo",
    name: "Sirkulær aluminiumskrets",
    description:
      "Lukket kretsløp for aluminium: Ottem sorterer og resirkulerer lokalt skrap tilbake til Hydro. Inspirert av Haugalandets metallgjenvinningssamarbeid med Eramet og Hydro.",
    color: "#3B82F6",
    icon: "Recycle",
    createdAt: "2026-01-15T00:00:00Z",
    mutations: [
      // Increase recycled aluminum volume
      mut("al-1", "modify", "materialFlow", "Øke resirkulert aluminium: 1500→2500 t/år", "mf-8", {
        volumeTonnesPerYear: 2500,
        status: "planned",
      }),
      // Increase slag to building materials
      mut("al-2", "modify", "materialFlow", "Øke slagg til byggematerialer: 1800→2700 t/år", "mf-3", {
        volumeTonnesPerYear: 2700,
        status: "planned",
      }),
      // Upgrade circular aluminum symbiosis
      mut("al-3", "modify", "symbiosisOpportunity", "Øke sirkulær aluminium-verdi", "sym-9", {
        estimatedAnnualValueMNOK: 28.0,
        co2ReductionTonnes: 9500,
      }),
      // Prioritize slag-to-building symbiosis
      mut("al-4", "modify", "symbiosisOpportunity", "Prioritere slagg-symbiosemulighet", "sym-2", {
        status: "prioritized",
        aiConfidence: 0.90,
      }),
      // Better business case for circular aluminum
      mut("al-5", "modify", "businessCase", "Oppdatert sirkulær aluminium-case", "sym-9", {
        npvMNOK: 38.0,
        irr: 0.18,
      }),
    ],
  },

  // ─── 3. Biokarbon-verdikjede ─────────────────────────────────────────
  {
    id: "preset-biokarbon",
    hubId: "demo",
    name: "Biokarbon-verdikjede",
    description:
      "Ottem BioCarbon produserer biokarbon fra lokalt trevirke som erstatter fossilt karbonmateriale hos Hydro (AP4). Tilsvarende konsept som Den Magiske Fabrikkens biogassproduksjon, men for industri.",
    color: "#10B981",
    icon: "Flame",
    createdAt: "2026-01-15T00:00:00Z",
    mutations: [
      // Scale up biocarbon production
      mut("bio-1", "modify", "materialFlow", "Øke biokarbonproduksjon: 2185→3500 t/år", "mf-16", {
        volumeTonnesPerYear: 3500,
        status: "existing",
      }),
      // New feedstock flow: kommune → ottem (wood waste for pyrolysis)
      mut("bio-2", "add", "materialFlow", "Ny trevirke-leveranse til pyrolyse: 4500 t/år", undefined, {
        id: "mf-sc-bio-1",
        source: "sunndal-kommune",
        target: "ottem-recycling",
        material: "Trevirke til pyrolyse",
        volumeTonnesPerYear: 4500,
        status: "planned",
        matchScore: 0.82,
      }),
      // Increase biogas from Ottem (index 13)
      mut("bio-3", "modify", "energyFlow", "Øke biogass fra Ottem: 2.0→5.5 GWh", "13", {
        value: 5.5,
      }),
      // Increase biogas to Storvik (index 14)
      mut("bio-4", "modify", "energyFlow", "Øke biogass til Storvik: 1.5→4.0 GWh", "14", {
        value: 4.0,
      }),
      // Upgrade biocarbon symbiosis
      mut("bio-5", "modify", "symbiosisOpportunity", "Validere biokarbon-symbiose (AP4)", "sym-3", {
        aiConfidence: 0.88,
        status: "validated",
        estimatedAnnualValueMNOK: 32.0,
        co2ReductionTonnes: 18000,
      }),
      // Better business case
      mut("bio-6", "modify", "businessCase", "Forbedret biokarbon-forretningscase", "sym-3", {
        npvMNOK: 48.0,
        paybackYears: 3.8,
      }),
    ],
  },

  // ─── 4. KI-optimalisert energistyring ────────────────────────────────
  {
    id: "preset-ki-energi",
    hubId: "demo",
    name: "KI-optimalisert energistyring",
    description:
      "KI-styrt lastbalansering og felles dataplattform for sanntidsovervåking av alle strømmer. Raskest avkastning (25% IRR) og lavest risiko — grunnmuren for alle andre tiltak.",
    color: "#8B5CF6",
    icon: "Brain",
    createdAt: "2026-01-15T00:00:00Z",
    mutations: [
      // Upgrade AI energy optimization symbiosis
      mut("ki-1", "modify", "symbiosisOpportunity", "Øke KI-energioptimalisering", "sym-4", {
        estimatedAnnualValueMNOK: 18.0,
        co2ReductionTonnes: 5500,
      }),
      // Prioritize data platform
      mut("ki-2", "modify", "symbiosisOpportunity", "Prioritere dataplattform-symbiose", "sym-10", {
        status: "prioritized",
        estimatedAnnualValueMNOK: 9.0,
      }),
      // Enable biogas monitoring (index 12, kommune→biogass)
      mut("ki-3", "modify", "energyFlow", "Aktivere biogass-overvåking", "12", {
        status: "planned",
      }),
      // Better business case
      mut("ki-4", "modify", "businessCase", "Oppdatert KI-forretningscase", "sym-4", {
        npvMNOK: 18.0,
        irr: 0.28,
      }),
    ],
  },

  // ─── 5. Kun validerte tiltak ─────────────────────────────────────────
  {
    id: "preset-konservativ",
    hubId: "demo",
    name: "Kun validerte tiltak",
    description:
      "Viser kun eksisterende og validerte strømmer — fjerner alle potensielle og planlagte tiltak. Demonstrerer forskjellen mellom dagens situasjon og mulighetene.",
    color: "#64748B",
    icon: "ShieldCheck",
    createdAt: "2026-01-15T00:00:00Z",
    mutations: [
      // Delete energy flows — MUST be highest index first (splice shifts indices)
      mut("kv-e6", "delete", "energyFlow", "Fjern biogass→storvik (planlagt)", "14"),
      mut("kv-e5", "delete", "energyFlow", "Fjern ottem→biogass (potensielt)", "13"),
      mut("kv-e4", "delete", "energyFlow", "Fjern kommune→biogass (potensielt)", "12"),
      mut("kv-e3", "delete", "energyFlow", "Fjern fjernvarme→ottem (potensielt)", "11"),
      mut("kv-e2", "delete", "energyFlow", "Fjern fjernvarme→storvik (potensielt)", "10"),
      mut("kv-e1", "delete", "energyFlow", "Fjern spillvarme→fjernvarme utvidelse (potensielt)", "9"),
      // Delete potential material flows
      mut("kv-m1", "delete", "materialFlow", "Fjern slagg til byggematerialer (potensielt)", "mf-3"),
      mut("kv-m2", "delete", "materialFlow", "Fjern resirkulert plast (potensielt)", "mf-6"),
      mut("kv-m3", "delete", "materialFlow", "Fjern resirkulert aluminium (potensielt)", "mf-8"),
      mut("kv-m4", "delete", "materialFlow", "Fjern kompostert organisk (potensielt)", "mf-11"),
      mut("kv-m5", "delete", "materialFlow", "Fjern gjenvunnet metall (potensielt)", "mf-12"),
      mut("kv-m6", "delete", "materialFlow", "Fjern gjenvunnet kobber (potensielt)", "mf-15"),
      // Delete identified symbiosis opportunities
      mut("kv-s1", "delete", "symbiosisOpportunity", "Fjern resirkulert plast-symbiose", "sym-5"),
      mut("kv-s2", "delete", "symbiosisOpportunity", "Fjern biogass-symbiose", "sym-6"),
      mut("kv-s3", "delete", "symbiosisOpportunity", "Fjern hydrogen-symbiose", "sym-8"),
      mut("kv-s4", "delete", "symbiosisOpportunity", "Fjern CCS-symbiose", "sym-12"),
    ],
  },
];
