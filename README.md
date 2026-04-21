AI ATTRIBUTION: AI was used to generate code for this project.

# 🎭 Choreo Light — Stage Lighting Choreography

<p align="center">
  <strong>CUE THE LIGHTS!</strong>
</p>

<p align="center">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-15-black?logo=next.js">
  <img alt="React" src="https://img.shields.io/badge/React-18-61DAFB?logo=react">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript">
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind-3-38B2AC?logo=tailwindcss">
</p>

**Choreo Light** is a _browser-based stage lighting visualizer_ and cue/keyframe choreography editor. Select lights on a virtual stage, dial in color and intensity, snapshot the look into a cue list, scrub a keyframe timeline, and export the whole cue sheet to Excel.

[Repo](https://github.com/josephdattilo03/choreo-light) · [Issues](https://github.com/josephdattilo03/choreo-light/issues) · [Pull Requests](https://github.com/josephdattilo03/choreo-light/pulls)

New here? Start with the Quick start below.

Preferred setup: clone the repo, `npm install`, `npm run dev`, then open http://localhost:3000 in your browser.

## Install (recommended)

Runtime: Node 18.18+ (see `engines` in `package.json`).

```bash
git clone https://github.com/josephdattilo03/choreo-light.git
cd choreo-light
npm install
```

Cloning pulls the full Next.js 15 app. `npm install` resolves Radix UI, Tailwind, `exceljs`, `motion`, `sonner`, `lucide-react`, and `next-themes` — everything the visualizer needs.

## Quick start (TL;DR)

Runtime: Node 18.18+.

```bash
npm install
npm run dev
# open http://localhost:3000
```

Edit `src/app/page.tsx` or any component under `src/components/lighting/` and the page hot-reloads.

## Data storage

Choreo Light runs entirely in the browser. Project state — the current lighting snapshot, cue list, timeline, and export metadata — is cached to `localStorage` through `src/lib/lighting-cache.ts`, so reloading the tab restores the last session. There is no backend and nothing leaves the browser.

## Highlights

- **[Stage visualization](src/components/lighting/StageVisualization.tsx)** — interactive stage canvas for selecting lights and previewing the current look.
- **[Color & intensity panel](src/components/lighting/ColorIntensityPanel.tsx)** — pick a preset or custom color, scrub intensity, apply to the selected lights.
- **[Lighting controls](src/components/lighting/LightingControls.tsx)** — fixture toggles and bulk actions for the selected rig.
- **[Cue list](src/components/lighting/CueList.tsx)** — snapshot the current state as a named cue, recall cues, reorder, and edit them.
- **[Keyframe timeline editor](src/components/lighting/TimelineEditor.tsx)** — place keyframes on a timeline, scrub the playhead, and play back interpolated looks.
- **[History (undo/redo)](src/components/lighting/HistoryControls.tsx)** — linear history stack for every state change.
- **[Export cue sheet](src/components/lighting/ExportCueSheetPanel.tsx)** — render the cue list to a formatted `.xlsx` workbook via `exceljs` (see `src/lib/export-lighting-sheet.ts`).

## Scripts

- `npm run dev` — start the Next.js dev server on port 3000.
- `npm run build` — production build.
- `npm run start` — serve the production build.
- `npm run lint` — run ESLint (`eslint-config-next`).

## Project structure

- `src/app/` — Next.js App Router entry (`page.tsx` mounts the visualizer, `layout.tsx` wires up fonts and theme).
- `src/components/lighting/` — the lighting editor: stage, controls, cue list, timeline, export panel, history.
- `src/components/ui/` — shared Radix-based UI primitives (buttons, dialogs, sliders, switches, scroll areas, toasts).
- `src/lib/` — domain logic: `lighting-types.ts`, `lighting-timeline.ts`, `lighting-cache.ts`, `export-lighting-sheet.ts`, and the export type/color helpers.

## From source (development)

```bash
git clone https://github.com/josephdattilo03/choreo-light.git
cd choreo-light
npm install
npm run dev
```

The dev server watches files under `src/` and hot-reloads. The entry point is `src/app/page.tsx`, which renders `<StageLightingVisualizer />` from `src/components/lighting/StageLightingVisualizer.tsx` — that component owns the full editor state (current lighting state, history, cues, timeline, playhead, export metadata).

## Configuration

Build and styling config live at the repo root:

- `next.config.ts` — Next.js configuration.
- `tailwind.config.ts` — Tailwind theme and content paths.
- `postcss.config.mjs` — PostCSS pipeline.
- `tsconfig.json` — TypeScript compiler options and path aliases (`@/*` → `src/*`).

To embed the editor in another Next.js page:

```tsx
import { StageLightingVisualizer } from "@/components/lighting/StageLightingVisualizer";

export default function Page() {
  return <StageLightingVisualizer />;
}
```

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=josephdattilo03/choreo-light&type=date&legend=top-left)](https://www.star-history.com/#josephdattilo03/choreo-light&type=date&legend=top-left)

## About

Choreo Light is built by [Joseph Dattilo](https://github.com/josephdattilo03) and [Andrew Wang](https://github.com/yongzhe-wang), with contributions from the commit history. AI assistance was used during development — see the attribution at the top of this file.

## Community

Contributions welcome via pull request. Open an [issue](https://github.com/josephdattilo03/choreo-light/issues) to report bugs or propose features, or send a [PR](https://github.com/josephdattilo03/choreo-light/pulls) directly.
