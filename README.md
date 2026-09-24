# Generative Art Studio

A lightweight creative coding playground built with Vite, TypeScript and Canvas 2D.

## Run locally

```bash
npm install
npm run dev
```

Create a production build with `npm run build`.

## Quality gate

```bash
npm run test
npm run test:coverage
npm run test:e2e
npm run typecheck
npm run lint
npm run build
```

Run the complete gate with `npm run quality`.
Run unit tests, Playwright, coverage, typecheck, lint and build together with
`npm run check`.

The responsive E2E suite uses Playwright across mobile, tablet, desktop and
large-desktop viewports. Install its browser once with
`npx playwright install chromium`.

## Architecture

Each visual system in `src/generators/` implements the `Generator` contract from
`src/types.ts` and registers once in `src/generators/index.ts`. Its metadata and
parameter schema drive the navigation and inspector automatically. Rendering
backends are independently extensible through `src/core/renderer-registry.ts`.

The deterministic PRNG and procedural noise helpers live in `src/random.ts`.
User presets are stored in the browser's `localStorage`.

The current catalog contains 20 generators, including Voronoi, Mandelbrot,
Julia Set, Cellular Automata, Boids, Metaballs, Spirograph, Harmonograph,
Kaleidoscope and a seeded Gray–Scott reaction-diffusion simulation. Canvas backgrounds support
an automatic theme-aware mode and a custom mode that preserves the artist's
chosen color.

The preview engine monitors rolling FPS and frame time, classifies performance
with hysteresis, and can adapt element count, sampling, iterations and effective
DPR without changing saved artwork parameters. Export temporarily restores full
render quality. The optional technical panel exposes the active metrics.
