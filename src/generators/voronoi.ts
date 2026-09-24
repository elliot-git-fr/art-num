import type { Generator, RenderContext } from '../types';
import { hexToRgba } from '../random';
import { num, slider } from './shared';

type Site = { x: number; y: number; phase: number; speed: number };

export const voronoi: Generator = {
  id: 'voronoi', name: 'Voronoi', icon: '⬡', description: 'Living cellular territories formed by nearest-point geometry.',
  category: 'Patterns', tags: ['voronoi', 'cells', 'geometry'], renderer: 'canvas2d', defaultPreset: 'Cellular',
  capabilities: { animated: true, interactive: false, deterministic: true, exportable: true },
  params: [
    slider('sites', 'Cell count', 24, 5, 150, 1, [10, 60], 'Geometry', 'high', 70),
    slider('resolution', 'Cell resolution', 7, 2, 16, 1, [4, 11], 'Style', 'high', 4),
    slider('speed', 'Drift', .18, 0, 1.2, .01, [.05, .5], 'Motion'),
    slider('range', 'Drift range', .08, 0, .25, .01, [.03, .15], 'Motion'),
    slider('edge', 'Edge strength', .2, 0, .8, .01, [.08, .45], 'Style')
  ],
  init: ({ params, random }: RenderContext) => Array.from({ length: num(params.sites) }, (): Site => ({ x: random(), y: random(), phase: random() * Math.PI * 2, speed: .6 + random() * .8 })),
  render: (context, state) => {
    const sites = state as Site[]; const step = Math.max(2,num(context.params.resolution)/context.quality.resolutionScale); const t = context.time * .00012 * num(context.params.speed); const drift = num(context.params.range);
    const colors = [context.palette.primary, context.palette.secondary, context.palette.accent];
    for (let y = 0; y < context.height; y += step) for (let x = 0; x < context.width; x += step) {
      let first = Infinity, second = Infinity, nearest = 0;
      for (let i = 0; i < sites.length; i++) {
        const site = sites[i]; const sx = (site.x + Math.cos(site.phase + t * site.speed) * drift) * context.width; const sy = (site.y + Math.sin(site.phase + t * site.speed) * drift) * context.height;
        const distance = (x - sx) ** 2 + (y - sy) ** 2;
        if (distance < first) { second = first; first = distance; nearest = i; } else if (distance < second) second = distance;
      }
      const edge = Math.min(1, Math.sqrt(Math.max(0, second - first)) / Math.max(1, step * 3));
      context.ctx.fillStyle = hexToRgba(colors[nearest % colors.length], .3 + edge * (1 - num(context.params.edge)) * .7);
      context.ctx.fillRect(x, y, step + .5, step + .5);
    }
  },
  elementCount: params => num(params.sites)
};
