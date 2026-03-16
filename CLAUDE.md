# Øra Ecosystem - KI Industriell Symbiose Visualiseringsverktøy

## Project Overview
Interactive visualization and analysis tool for the Øra industrial ecosystem in Fredrikstad, Norway.
Demonstrates how KI-based (AI) analysis tools can support industrial symbiosis optimization,
energy mapping, material flow analysis, and circular economy initiatives across the Øra industrial area.

Based on the **SymbioLink Øra** project (2025), led by NCCE (Norwegian Center for Circular Economy)
and NORSUS (Norwegian Institute for Sustainability Research).

**Status:** Scaffolded from suns-ai template — data adaptation in progress.

## Tech Stack
- React 19 + Vite 8 + TypeScript (strict mode)
- Tailwind CSS 3 + PostCSS (NOT Tailwind 4 - incompatible with Vite 8)
- shadcn/ui (New York style, dark theme with CSS variables)
- Nivo 0.99 (Sankey, Chord, Network, HeatMap, Radar) + Recharts 3 (bar/sparkline)
- Motion 12 (framer-motion) via `motion/react` import path
- React Router v7 (BrowserRouter)
- Zustand 5 for state management
- MapLibre GL 5 for interactive maps
- Lucide React for icons
- Fonts: Inter (UI text), JetBrains Mono (numbers/data)

## Architecture

```
src/
├── components/
│   ├── ui/              # shadcn/ui primitives
│   ├── layout/          # AppShell, Sidebar, TopBar, PageContainer
│   ├── shared/          # KPICard, AnimatedNumber, AIConfidenceBadge,
│   │                    # AIInsightPanel, CompanyAvatar, GlowCard,
│   │                    # SectionHeader, StatusIndicator, PulsingDot, DonutGauge,
│   │                    # ProvenanceBadge
│   ├── demo/            # AIProcessingOverlay, TypewriterText
│   └── tutorial/        # SplashScreen, TourOverlay, TourTooltip
├── pages/               # Page components
├── data/                # Mock data files + tutorialContent.ts
├── stores/              # Zustand stores
├── hooks/               # Custom hooks
├── lib/                 # Utilities, theme, animations, AI prompts
├── types/               # TypeScript type definitions
└── _archived/           # Archived/unused code
intel/                   # Research materials and source documents
├── reports/             # Downloaded PDFs
├── web-pages/           # Web content saved as markdown
├── data-extracts/       # Structured data extracted from sources
├── sources.md           # Master index of all sources
└── summary.md           # Synthesized research overview
```

## Pages & Routes
| Route | Page | Description |
|-------|------|-------------|
| `/` | Dashboard | KPI cards, work package progress, KI insights, interactive map preview |
| `/energi` | Energikartlegging | Sankey diagram, HeatMap, energy flow optimization |
| `/materialstrom` | Materialstrømsanalyse | Network graph, matching matrix, Chord diagram |
| `/symbiose` | KI Symbioseidentifisering | AI-ranked symbiosis opportunities, Radar chart |
| `/forretningscase` | Forretningscase | ROI calculations, timeline, funding matcher |
| `/kart` | Geografisk oversikt | MapLibre 3D map with company markers, flow overlays |
| `/prosjektdata` | Prosjektdata | File upload, URL fetching, document ingestion |
| `/ki-ekspert` | KI-ekspert Chat | Gemini streaming chat with citation system |

## Øra Industrial Ecosystem

### About Øra
Øra industrial area in Fredrikstad is Norway's leading circular economy hub, often called
"sirkulærhovedstaden" (the circular economy capital). With 200+ companies, 2,500+ employees,
and ~10 billion NOK annual revenue, it hosts one of Norway's most advanced industrial symbiosis networks.

### Key Companies (to be refined with research data)
| Company | Industry | Key Data |
|---------|----------|----------|
| FREVAR KF | Waste-to-energy | Steam provider to industrial companies |
| Kronos Titan AS | Titanium dioxide production | 24,000t iron sulfate byproduct → Kemira |
| Kemira Chemicals | Water treatment chemicals | Uses Kronos iron sulfate as feedstock |
| Denofa AS | Soybean processing | Vegetable oil, soy protein |
| Batteriretur AS | Battery recycling | Lead-acid and lithium battery processing |
| Metallco Stene AS | Metal recycling | Ferrous and non-ferrous metals |
| SAREN Energi AS | Energy services | Industrial energy supply |
| Metallco Kabel AS | Cable recycling | Copper and aluminum recovery |
| Stene Stål Gjenvinning | Steel recycling | Scrap metal processing |
| NG Metall AS | Metal trading | Metal waste streams |
| Fredrikstad Fjernvarme | District heating | Heat distribution from FREVAR |
| Borg Havn AS | Port operations | Logistics and transport |

### Known Symbiosis Flows
- **FREVAR steam → multiple industrial companies** (waste-to-energy district heating)
- **Kronos Titan → Kemira**: ~24,000 tonnes/year iron sulfate (byproduct → feedstock)
- **Cross-company metal/material exchange**: Window glass, plastics, metals between recyclers
- **FREVAR → Fredrikstad Fjernvarme**: District heating network

### Project Context: SymbioLink Øra (2025)
- **Lead organizations**: NCCE + NORSUS
- **Duration**: January–December 2025
- **Background**: Follows 2019-2024 "Sustainable Innovation through Industrial Symbiosis" study
- **Goal**: Optimize resource utilization through expanded industrial symbiosis
- **Participants**: FREVAR, Borg Havn, Metallco Stene, SAREN Energi, Metallco Kabel, Stene Stål, Fredrikstad Fjernvarme, NG Metall, Visit Fredrikstad & Hvaler
- **Governance**: Coordinator within Fredrikstad Business Council, steering committee of industry reps + municipality + county council

## Commands
- `npm run dev` - Start development server (port 5173)
- `npm run build` - TypeScript check + Vite production build
- `npm run preview` - Preview production build
- `npm run lint` - ESLint check

## Conventions
- Mixed language: Norwegian for navigation/labels/headers, English for technical AI terms
- Component files use PascalCase: `EnergyFlowSankey.tsx`
- Hook files use camelCase with "use" prefix: `useAnimatedCounter.ts`
- Mock data files use camelCase: `energyFlows.ts`
- Every component must have explicit TypeScript props interface
- Use `cn()` utility from `@/lib/utils` for conditional class merging
- Colors must come from the theme defined in `src/lib/theme.ts`
- Norwegian number formatting via `nb-NO` locale (1 000,5 not 1,000.5)
- Charts must be responsive
- Import paths use `@/` alias for src directory

## Design Theme
- Dark theme: slate 900 navy background
- Glassmorphism cards: `backdrop-blur-md bg-slate-800/60 border border-slate-700/50`
- Primary accent: Emerald `#10B981`
- Energy accent: Amber `#F59E0B`
- AI accent: Violet `#8B5CF6`
- Risk: Rose `#F43F5E`
- Unique company colors for chart consistency (to be defined for Øra companies)

## Terminology
- All user-visible text uses **KI** (Kunstig Intelligens) instead of AI
- Component names/imports remain in English
- Only Norwegian-facing labels are translated

## Critical Gotchas (inherited from suns-ai)
- **Sankey data must be acyclic** - @nivo/sankey crashes on circular links
- **Network graph links must be aggregated** - Multiple flows between same pair must be merged
- **SectionHeader** uses `description` prop (not `subtitle`)
- **AIProcessingOverlay** uses `isVisible` prop (not `visible`)
- **Tailwind CSS 4** requires Vite <=7; this project uses Tailwind 3 with PostCSS
- **Motion** must be imported from `motion/react` (not `framer-motion`)
- **MapLibre** initialized imperatively in useEffect (not via react-map-gl wrapper)
- **ProvenanceBadge tooltip uses portal** — `createPortal(tooltip, document.body)`

## Deployment

### Repository
| Remote | URL | Purpose |
|--------|-----|---------|
| `origin` | `https://github.com/khakpour27/ora-ai.git` | GitHub (primary) |

### Cloud Run (GCP)
- Frontend: Cloud Run service `ora-ai` (port 80, nginx)
- API: Cloud Run service `ora-ai-api` (port 8080, Express)
- Artifact Registry: `us-west1-docker.pkg.dev/{PROJECT_ID}/ora-ai/`
- Auto-deploy via GitHub Actions on push to `main`

### Docker
- `Dockerfile` - Multi-stage build (node:20 build + nginx:alpine serve)
- `nginx.conf` - SPA config with try_files fallback, gzip, static caching
- `server/Dockerfile` - API server (node:20-alpine)

## Research & Intel
Research materials for this project are stored in the `intel/` folder:
- `intel/sources.md` - Master index of all discovered sources
- `intel/summary.md` - Synthesized research overview
- `intel/reports/` - Downloaded PDFs and documents
- `intel/web-pages/` - Web content saved as markdown
- `intel/data-extracts/` - Structured data (companies, flows, energy values)

### Key Research Sources
- NORSUS: norsus.no — sustainability research, Øra industrial symbiosis reports
- NCCE: ncce.no — SymbioLink Øra project, digital tour
- Sirkulærhovedstaden: sirkulaerhovedstaden.no — Øra ecosystem documentation
- Vekst i Fredrikstad: vekstifredrikstad.no — business development context
