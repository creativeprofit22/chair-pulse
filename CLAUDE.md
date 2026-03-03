# Chair Pulse

Free, open-source Electron desktop app that analyzes salon/barbershop booking CSV exports. Shows no-show rates, utilization heatmaps, revenue per chair-hour, service mix analysis, and peak/off-peak pricing models. Optional LLM integration (user's own API key) for plain-English recommendations.

**Phase:** Chair Pulse — Chunk 4/5 (DASHBOARD + VISUALIZATIONS COMPLETE)

## Stack
- **Runtime:** Bun (NOT npm, NOT node)
- **Desktop:** Electron 40
- **Renderer:** React 19 + Vite 7
- **Language:** TypeScript 5.9 strict
- **State:** Zustand 5
- **Charts:** Apache ECharts 6 (tree-shaken)
- **CSV:** PapaParse 5
- **Build:** esbuild (main/preload/worker), Vite (renderer)
- **Package:** electron-builder (NSIS + portable)
- **Test:** Vitest + Testing Library
- **Lint:** ESLint 9 + Prettier 3 + Husky + lint-staged

## Architecture
```
src/
  core/        ← Framework-agnostic pure TS (types, parsers, analyzers, AI)
  main/        ← Electron main process (IPC, workers, settings)
  preload/     ← Context bridge
  renderer/    ← React UI (views, components, stores, hooks)
```

`core/` has ZERO dependencies on Electron or React. It takes typed arrays in and returns results. It will be extracted into a shared package when building future lead magnet apps.

## Commands
- `bun run dev` — Start dev mode (Vite + esbuild watch + Electron)
- `bun run build` — Production build
- `bun run package` — Build + package (electron-builder)
- `bun run check` — typecheck + lint + format:check + test
- `bun run test` — Vitest

## Key Patterns
- **Bloat Hunter template:** `E:\Projects\bloat-hunter` — Electron architecture, AI providers, settings, build scripts
- **spa-ai-platform patterns:** `E:\Projects\spa-ai-platform` — CSV parser (PapaParse), ECharts, StatCard. DO NOT copy business logic — that's the paid product
- **Data privacy:** App never phones home. User's own API keys via safeStorage. First-launch disclaimer.
- **core/analyzers:** Pure functions. Input: `BookingRow[]`. Output: typed result objects. No side effects.
- **Worker threads:** Heavy analysis runs in worker thread, NOT main process

## Legal
- MIT license
- First-launch disclaimer: data stays on device, Douro never sees it
- LLM calls go directly from user's machine to provider with user's own key
- No telemetry, no analytics, no data collection

## Branding
- Author: Douro Digital <hello@wearedouro.agency>
- App ID: com.dourodigital.chair-pulse
- Subtle "Built by Douro Digital" in status bar
- CTA: "Want this automated? → wearedouro.agency"
