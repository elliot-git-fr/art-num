import type { Generator, RenderContext } from '../types';
import { hexToRgba } from '../random';
import { num, slider } from './shared';

type ReactionState = { columns: number; rows: number; a: Float32Array; b: Float32Array; nextA: Float32Array; nextB: Float32Array };

export const reactionDiffusion: Generator = {
  id: 'reaction-diffusion', name: 'Reaction Diffusion', icon: '◍', description: 'Organic Gray–Scott chemistry evolving into spots, coral and labyrinths.',
  category: 'Organic', tags: ['simulation', 'gray-scott', 'organic'], renderer: 'canvas2d', defaultPreset: 'Living Coral',
  capabilities: { animated: true, interactive: false, deterministic: true, exportable: true },
  params: [
    slider('resolution', 'Simulation resolution', 82, 36, 140, 2, [55, 110]),
    slider('feed', 'Feed rate', .055, .02, .09, .001, [.032, .072], 'Chemistry'),
    slider('kill', 'Kill rate', .062, .04, .075, .001, [.052, .068], 'Chemistry'),
    slider('diffusionA', 'Diffusion A', 1, .2, 1.4, .05, [.7, 1.2], 'Chemistry'),
    slider('diffusionB', 'Diffusion B', .5, .1, 1, .05, [.3, .75], 'Chemistry'),
    slider('steps', 'Steps per frame', 2, 1, 6, 1, [1, 4], 'Motion'),
    slider('seeds', 'Initial colonies', 8, 1, 24, 1, [3, 16], 'Geometry')
  ],
  init: (context: RenderContext): ReactionState => {
    const columns = num(context.params.resolution); const rows = Math.max(24, Math.round(columns * context.height / Math.max(1, context.width))); const length = columns * rows;
    const state: ReactionState = { columns, rows, a: new Float32Array(length).fill(1), b: new Float32Array(length), nextA: new Float32Array(length), nextB: new Float32Array(length) };
    for (let seed = 0; seed < num(context.params.seeds); seed++) {
      const cx = Math.floor(context.random() * columns); const cy = Math.floor(context.random() * rows); const radius = 2 + Math.floor(context.random() * 4);
      for (let y = -radius; y <= radius; y++) for (let x = -radius; x <= radius; x++) if (x * x + y * y <= radius * radius) { const px = (cx + x + columns) % columns; const py = (cy + y + rows) % rows; state.b[py * columns + px] = 1; }
    }
    return state;
  },
  render: (context, rawState) => {
    const state = rawState as ReactionState; const { columns, rows } = state;
    for (let pass = 0; pass < num(context.params.steps); pass++) {
      for (let y = 0; y < rows; y++) for (let x = 0; x < columns; x++) {
        const index = y * columns + x; const left = y * columns + (x + columns - 1) % columns; const right = y * columns + (x + 1) % columns; const up = ((y + rows - 1) % rows) * columns + x; const down = ((y + 1) % rows) * columns + x;
        const a = state.a[index], b = state.b[index]; const reaction = a * b * b;
        const lapA = state.a[left] + state.a[right] + state.a[up] + state.a[down] - 4 * a; const lapB = state.b[left] + state.b[right] + state.b[up] + state.b[down] - 4 * b;
        state.nextA[index] = Math.max(0, Math.min(1, a + num(context.params.diffusionA) * lapA - reaction + num(context.params.feed) * (1 - a)));
        state.nextB[index] = Math.max(0, Math.min(1, b + num(context.params.diffusionB) * lapB + reaction - (num(context.params.kill) + num(context.params.feed)) * b));
      }
      [state.a, state.nextA] = [state.nextA, state.a]; [state.b, state.nextB] = [state.nextB, state.b];
    }
    const cellWidth = context.width / columns, cellHeight = context.height / rows;
    for (let y = 0; y < rows; y++) for (let x = 0; x < columns; x++) { const value = Math.max(0, Math.min(1, (state.a[y * columns + x] - state.b[y * columns + x]) * .75 + .25)); context.ctx.fillStyle = hexToRgba(value > .48 ? context.palette.primary : value > .22 ? context.palette.secondary : context.palette.accent, .3 + (1 - value) * .7); context.ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth + .6, cellHeight + .6); }
  },
  elementCount: params => num(params.resolution) ** 2
};
