# Data Mapping Notes — Øra to App Data Model

How research data maps to the TypeScript interfaces in `src/types/` and mock data in `src/data/`.

---

## Company Mapping (src/data/companies.ts)

### Template (Sunndal) → Øra Replacement

| Sunndal Company | Øra Replacement | Rationale |
|----------------|-----------------|-----------|
| Hydro Sunndal AS (aluminum) | Kronos Titan AS | Largest energy consumer, dominant industrial producer |
| Sunndal Energi AS (district heating) | FREVAR KF | Central energy hub, waste-to-energy |
| Ottem Recycling AS (recycling) | Stene Stål / Metallco group | Metal recycling cluster |
| Storvik AS (workshop) | Denofa AS | Major industrial processor |
| Industrikraft AS (power) | SAREN Energi BIO-EL | Energy production |
| Sunndal Kommune (municipality) | Fredrikstad Fjernvarme | Distribution/public services |
| — (new) | Kemira Chemicals | Unique symbiosis partner |
| — (new) | Borg Havn IKS | Port logistics hub |
| — (new) | Batteriretur AS | Battery recycling |
| — (new) | Metallco Kabel AS | Cable recycling |
| — (new) | NG Metall AS | Metal trading/shredding |
| — (new) | Metallco Stene AS | Metal shredding |

### Scale Difference
- Sunndal: 6 companies, dominated by single aluminum smelter (6,827 GWh)
- Øra: 12+ companies, more distributed (largest is Kronos Titan at ~310-365 GWh)
- Øra total: 782 GWh (vs. Sunndal ~7,000+ GWh)
- Øra is more diverse in sector mix; Sunndal was aluminum-dominated

### Company Interface Fields — Data Availability

| Field | Coverage | Notes |
|-------|----------|-------|
| `id` | 12/12 | Generate from company name (e.g., `frevar-kf`) |
| `name` | 12/12 | Full company names verified |
| `shortName` | 12/12 | Derive from common usage (e.g., "FREVAR", "Kronos Titan") |
| `sector` | 12/12 | All sectors identified |
| `description` | 12/12 | Can write from research findings |
| `color` | 0/12 | Need to assign unique hex colors per company |
| `icon` | 0/12 | Need to assign Lucide React icon names |
| `coordinates` | 12/12 | All geocoded (10 verified, 2 estimated) |
| `annualEnergyGWh` | 5/12 | FREVAR, Kronos Titan, Denofa, SAREN, Fjernvarme have data |
| `annualWasteTonnes` | 4/12 | FREVAR, SAREN, Stene Stål, Metallco Kabel have data |
| `employeeCount` | 10/12 | Missing Batteriretur and NG Metall (site-specific) |

### Suggested Company Colors

| Company | Suggested Color | Hex | Rationale |
|---------|----------------|-----|-----------|
| FREVAR KF | Orange-red | #E84D2F | Fire/energy/waste incineration |
| Kronos Titan | Steel blue | #4A7CB5 | Titanium/industrial |
| Kemira Chemicals | Teal | #0EA5A0 | Water treatment |
| Denofa AS | Olive green | #6B8E23 | Soybean/agriculture |
| Batteriretur AS | Electric yellow | #FFD700 | Batteries/electricity |
| Metallco Stene | Iron gray | #6B6B6B | Metal/iron |
| SAREN Energi | Deep orange | #D97706 | Energy/flame |
| Metallco Kabel | Copper | #B87333 | Copper wire |
| Stene Stål Gjenvinning | Dark steel | #43464B | Steel recycling |
| NG Metall AS | Bright green | #22C55E | NG brand color (recycling) |
| Fredrikstad Fjernvarme | Warm red | #DC2626 | Heat/warmth |
| Borg Havn IKS | Navy blue | #1E3A5F | Maritime/port |

### Suggested Lucide Icons

| Company | Icon | Rationale |
|---------|------|-----------|
| FREVAR KF | `flame` | Waste-to-energy |
| Kronos Titan | `factory` | Industrial production |
| Kemira Chemicals | `droplets` | Water treatment |
| Denofa AS | `wheat` | Soybean/agriculture |
| Batteriretur AS | `battery-charging` | Battery recycling |
| Metallco Stene | `recycle` | Metal recycling |
| SAREN Energi | `zap` | Energy production |
| Metallco Kabel | `cable` | Cable recycling |
| Stene Stål Gjenvinning | `hammer` | Steel processing |
| NG Metall AS | `container` | Metal trading |
| Fredrikstad Fjernvarme | `thermometer` | District heating |
| Borg Havn IKS | `ship` | Port operations |

---

## Energy Flows Mapping (src/data/energyFlows.ts)

### Sankey Diagram Data
The Sunndal template has Sankey nodes and links. For Øra:

**Nodes** (energy sources and sinks):
- FREVAR Energigjenvinning (source)
- SAREN BIO-EL (source)
- Denofa Energi (intermediate hub)
- Kronos Titan (sink)
- Denofa AS (sink)
- Fredrikstad Fjernvarme (sink/distribution)
- FREVAR Biogass (sink)
- Kemira + Reichhold (sink)
- Adesso (sink)
- Grid electricity (source)
- Natural gas supply (source)
- Oil supply (source)

**Links** (verified GWh values from NORSUS 2021):
- FREVAR → Kronos Titan: 89 GWh (steam)
- FREVAR → Denofa Energi: 62 GWh (steam)
- SAREN → Denofa Energi: 23 GWh (steam)
- Denofa Energi → Denofa: 99 GWh (steam)
- Denofa Energi → Adesso: 20 GWh (steam)
- FREVAR → FREVAR Biogass: 5 GWh (steam)
- FREVAR → Kemira+Reichhold: 2.9 GWh (steam)
- FREVAR+SAREN → Fjernvarme: 88 GWh (hot water)

**CRITICAL:** Sankey must be acyclic. The current flow structure IS acyclic (sources → intermediaries → sinks). No circular references.

**CRITICAL:** Multiple flows between same pair must be aggregated. Check for duplicates.

### EnergySurplusDeficit
Seasonal data NOT available from research. Will need to estimate or mark as "data gap" in the app. FREVAR operates year-round but district heating demand is seasonal.

### EnergyType Mapping
| Research Type | App EnergyType |
|--------------|----------------|
| Waste-based steam | `heat` |
| Hot water (fjernvarme) | `heat` |
| Natural gas | N/A (external input) |
| Electricity | `electricity` |
| Biogas/biomethane | `biogas` |
| Oil | N/A (external input) |
| Waste heat | `waste-heat` |

---

## Material Flows Mapping (src/data/materialFlows.ts)

### MaterialFlow entries (verified)
| id | source | target | material | volumeTonnesPerYear | status | matchScore |
|----|--------|--------|----------|---------------------|--------|------------|
| mf-1 | kronos-titan | kemira | Iron sulfate (jernsulfat) | 24000 | existing | 1.0 |
| mf-2 | frevar | kronos-titan | Steam (waste-to-energy) | 230000 (steam tonnes) | existing | 1.0 |
| mf-3 | stene-stal | various-foundries | Iron scrap | 50000 | existing | 0.9 |
| mf-4 | metallco-kabel | smelters | Copper + aluminum | 14000 (cables in) | existing | 0.9 |
| mf-5 | gipsgjenvinning | gyproc | Recycled gypsum | 14000 | existing | 1.0 |

### WasteStream entries (for matching matrix)
Key waste streams identified but lacking EWC codes.

### Network Graph
For the network visualization, aggregate links between same company pairs. The metal recycling cluster (Stene Stål, Metallco Stene, Metallco Kabel, NG Metall) may need simplified representation to avoid excessive nodes.

---

## Symbiosis Opportunities (src/data/symbiosisOpportunities.ts)

7 existing + 7 potential symbioses identified. Each needs:
- `dimensions` scores (0-10): Must be estimated since no formal scoring exists in research
- `risks` levels: Can infer from research (e.g., CCS has high regulatory risk)
- `aiConfidence`: Set based on data quality (verified flows = 0.9+, potential = 0.5-0.7)

---

## Map Configuration (src/data/ + MapLibre)

### Ready-to-Use
- GeoJSON FeatureCollection in `intel/data-extracts/coordinates.md`
- Map center: [10.960, 59.187], zoom: 14.5
- Bounds: SW [10.950, 59.180] to NE [10.975, 59.195]
- 10/12 coordinates verified via OSM, 2 estimated

### Co-located Companies
FREVAR and SAREN share Habornveien 61 — offset markers needed.

---

## Key Differences from Sunndal Template

| Aspect | Sunndal | Øra |
|--------|---------|-----|
| Company count | 6 | 12+ |
| Dominant industry | Aluminum smelting | Diverse (waste-to-energy, chemicals, recycling, food) |
| Total energy | ~7,000+ GWh | ~782 GWh |
| Energy source | Hydropower dominant | Waste-to-energy + natural gas dominant |
| Material types | Aluminum slag, waste | Iron sulfate, soybeans, metals, cables, batteries |
| Symbiosis complexity | Simpler hub-spoke | Multi-layered network with intermediaries |
| Recycling emphasis | Low | Very high (multiple recyclers) |
| Port integration | No | Yes (Borg Havn central to logistics) |
| CCS potential | Not mentioned | 630,000 t CO₂/yr cluster |

---

## Implementation Priority

1. **Companies** — Replace all 6 Sunndal with 12 Øra companies (data ready)
2. **Energy Sankey** — Rich verified flow data from NORSUS 2021 (ready)
3. **Material flows** — Kronos→Kemira flagship + recycling flows (ready)
4. **Map** — Coordinates and GeoJSON ready, map center configured
5. **Symbiosis opportunities** — Structure ready, need scoring estimates
6. **Business cases** — Need ROI modeling (no research data available)
7. **KPI metrics** — Aggregate metrics from NORSUS 2021 ready
8. **AI insights** — Can generate from research findings
