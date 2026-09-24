# Generative Art Studio

A lightweight creative coding playground built with Vite, TypeScript and Canvas 2D.

## Run locally

```bash
npm install
npm run dev
```

Create a production build with `npm run build`.

## Architecture

Each visual system in `src/generators/` implements the `Generator` contract from
`src/types.ts`. Its parameter definition drives the inspector automatically, so a
new generator only needs metadata, parameter ranges, and a render function.

The deterministic PRNG and procedural noise helpers live in `src/random.ts`.
User presets are stored in the browser's `localStorage`.
