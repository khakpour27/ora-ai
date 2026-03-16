# Sirkulaere Sunndal Hub — KI Visualization Platform

Interactive visualization and analysis platform for the **Sirkulaere Sunndal Hub** tender application. Demonstrates how KI-based (AI) tools support energy mapping, material flow analysis, industrial symbiosis identification, and scenario modeling across 6 industrial companies in Sunndal, Norway.

Built as a fully functional demo/mockup for the Skaparkraft 2026 tender evaluation.

## Features

### 9 Interactive Pages

| Page | Route | Description |
|------|-------|-------------|
| **Oversikt** | `/` | Dashboard with KPI cards, KI confidence gauges, work packages, and interactive map preview |
| **Energikartlegging** | `/energi` | Sankey energy flow diagram, seasonal heatmap, KI optimization suggestions |
| **Materialstrom** | `/materialstrom` | Network graph, material matching matrix, Chord diagram |
| **Symbiose** | `/symbiose` | KI-ranked symbiosis opportunities, Radar chart, risk assessment grid |
| **Forretningscase** | `/forretningscase` | ROI bar charts, Gantt timeline, funding matcher |
| **Kart** | `/kart` | Full-page SVG map with company markers, flow lines, zoom/pan, and live stats |
| **Prosjektdata** | `/prosjektdata` | File upload (PDF/TXT/CSV), URL fetching, manual paste with token budget tracking |
| **KI-ekspert** | `/ki-ekspert` | AI chat powered by Gemini 2.5 Flash with streaming, Perplexity-style citations, and source badges |
| **Scenario Lab** | `/scenarier` | Transparent scenario editor — view mutations, compare KPIs, create custom what-if scenarios |

### Scenario System

5 pre-defined scenarios aligned with the Skaparkraft tender narrative, each applying targeted mutations to the hub data:

- **Maksimal spillvarme** — Maximize waste heat recovery from Hydro's aluminum smelting
- **Sirkulaer aluminiumskrets** — Circular aluminum value chain with local recycling
- **Biokarbon-verdikjede** — Biocarbon supply chain replacing fossil reductants
- **KI-optimalisert energistyring** — AI-optimized energy management across the hub
- **Kun validerte tiltak** — Conservative baseline with only validated initiatives

The **Scenario Lab** makes these transparent: see every mutation with before/after values, compare KPI deltas, duplicate presets into custom scenarios, and build new ones from scratch.

### Tutorial System

First-visit experience with a 5-phase animated splash screen introducing the project context, COWI's recommendation, key metrics, and a guided tour across all pages. Persisted in localStorage with a reset button in the sidebar.

### KI Expert Chat

AI-powered chat using Gemini 2.5 Flash streaming (SSE) with:
- Perplexity-style inline citation badges with confidence indicators
- Horizontal source cards above each response
- Follow-up question suggestions
- Data shortcuts linking to relevant app pages
- Full project data context (static + user-uploaded documents)

## Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | React 19 + TypeScript (strict) |
| Build | Vite 8 |
| Styling | Tailwind CSS 3 + shadcn/ui (New York, dark theme) |
| Charts | Nivo 0.88 (Sankey, Chord, Network, HeatMap, Radar) + Recharts 2.15 |
| Animation | Motion 11 (`motion/react`) |
| Routing | React Router v7 |
| State | Zustand 5 (persisted to localStorage/IndexedDB) |
| Icons | Lucide React |
| Fonts | Inter (UI) + JetBrains Mono (data) |
| AI | Gemini 2.5 Flash via SSE streaming |
| Deploy | Docker (nginx) → Cloud Run via GitHub Actions |

## Companies in the Hub

| Company | Sector | Key Numbers |
|---------|--------|-------------|
| Hydro Sunndal AS | Aluminum smelting | ~6,827 GWh energy, 49,738t waste, 700 employees |
| Sunndal Energi AS | District heating | ~45 GWh fjernvarme |
| Ottem Recycling AS | Recycling & waste | ~5,200t waste |
| Storvik AS | Industrial workshop | ~1.6 GWh, 244t waste, 120 employees |
| Industrikraft AS | Industrial power trading | ~500 GWh |
| Sunndal kommune | Municipality | ~80 GWh, 3,000t waste |

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+

### Development

```bash
npm install
npm run dev          # Start dev server on port 5173
```

### Build

```bash
npm run build        # TypeScript check + Vite production build
npm run preview      # Preview production build
npm run lint         # ESLint check
```

### Environment Variables

For the KI-ekspert chat to work, provide a Gemini API key:

```bash
# Build-time (Vite)
VITE_GEMINI_API_KEY=your-key-here

# Runtime (Docker)
# Set in public/runtime-config.js or via GEMINI_API_KEY env var in Docker
```

## Project Structure

```
src/
├── components/
│   ├── ui/              # shadcn/ui primitives
│   ├── layout/          # AppShell, Sidebar, TopBar, PageContainer
│   ├── shared/          # KPICard, AnimatedNumber, ProvenanceBadge,
│   │                    # ScenarioPanel, ScenarioBanner, GlowCard, ...
│   ├── data-editor/     # Structured data editing components
│   ├── demo/            # AIProcessingOverlay, TypewriterText
│   └── tutorial/        # SplashScreen, TourOverlay, TourTooltip
├── pages/               # 9 page components
├── data/                # Mock data + scenario presets + tutorial content
├── stores/              # Zustand stores (app, analysis, tutorial, scenario, ...)
├── hooks/               # useAnimatedCounter, useHubData, useResolvedData, ...
├── lib/                 # theme, utils, animations, chatSystemPrompt,
│                        # kpiCalculator, sankeyValidator, api, ...
└── types/               # TypeScript interfaces + provenance types
```

## Deployment

### Docker

```bash
docker build -t suns-ai .
docker run -p 8080:80 -e GEMINI_API_KEY=your-key suns-ai
```

### CI/CD

Pushes to `main` trigger automatic deployment via GitHub Actions:
1. Build Docker image
2. Push to Google Artifact Registry
3. Deploy to Cloud Run

The workflow is defined in `.github/workflows/deploy.yml`.

## Design System

- **Theme**: Dark slate-900 navy background with glassmorphism cards
- **Primary accent**: Emerald `#10B981`
- **Energy accent**: Amber `#F59E0B`
- **AI accent**: Violet `#8B5CF6`
- **Risk accent**: Rose `#F43F5E`
- **Cards**: `backdrop-blur-md bg-slate-800/60 border border-slate-700/50`
- **Language**: Norwegian UI labels, English component internals. "KI" (Kunstig Intelligens) used instead of "AI" in all user-facing text.

## Work Packages (Arbeidspakker)

| ID | Name |
|----|------|
| AP1 | Kompetanseheving, studieturer og nettverkssamlinger |
| AP2 | Materialstroemsanalyser |
| AP3 | Energikartlegging |
| AP4 | Biokarbon-case (Ottem) |
| AP5 | Nye symbiosetiltak |
| AP6 | Kartlegging av markedstilgang |

## License

This project is proprietary software developed for the Sirkulaere Sunndal Hub tender application.
