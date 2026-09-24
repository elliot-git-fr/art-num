import type { Generator } from '../types';
import { hexToRgba } from '../random';
import { num, slider } from './shared';

export const mandelbrot: Generator = {
  id: 'mandelbrot', name: 'Mandelbrot', icon: '◒', description: 'An infinite fractal boundary revealed through complex iteration.',
  category: 'Fractals', tags: ['mandelbrot', 'fractal', 'complex'], renderer: 'canvas2d', defaultPreset: 'Infinite Coast',
  capabilities: { animated: false, interactive: false, deterministic: true, exportable: true },
  params: [
    slider('iterations', 'Iterations', 72, 15, 220, 1, [35, 130]),
    slider('zoom', 'Zoom', 1, .45, 8, .01, [.7, 3.2]),
    slider('offsetX', 'Horizontal focus', -.55, -2, 1, .01, [-1.2, .2]),
    slider('offsetY', 'Vertical focus', 0, -1.5, 1.5, .01, [-.7, .7]),
    slider('resolution', 'Pixel size', 4, 2, 10, 1, [3, 7], 'Style'),
    slider('contrast', 'Color contrast', 1.4, .4, 3, .05, [.8, 2.2], 'Style')
  ],
  render: context => {
    const step = num(context.params.resolution); const max = num(context.params.iterations); const zoom = num(context.params.zoom); const aspect = context.width / Math.max(1, context.height);
    const colors = [context.palette.primary, context.palette.secondary, context.palette.accent];
    for (let py = 0; py < context.height; py += step) for (let px = 0; px < context.width; px += step) {
      const cx = (px / context.width - .5) * 3.2 * aspect / zoom + num(context.params.offsetX); const cy = (py / context.height - .5) * 3.2 / zoom + num(context.params.offsetY);
      let x = 0, y = 0, iteration = 0;
      while (x * x + y * y <= 4 && iteration < max) { const next = x * x - y * y + cx; y = 2 * x * y + cy; x = next; iteration++; }
      if (iteration === max) context.ctx.fillStyle = context.palette.background;
      else { const smooth = Math.min(1, Math.pow(iteration / max, 1 / num(context.params.contrast)) * 2.5); context.ctx.fillStyle = hexToRgba(colors[Math.min(2, Math.floor(smooth * 3))], .25 + smooth * .75); }
      context.ctx.fillRect(px, py, step + .5, step + .5);
    }
  },
  elementCount: params => num(params.iterations)
};
