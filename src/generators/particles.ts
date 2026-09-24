import type { Generator, RenderContext } from '../types';
import { hexToRgba, noise } from '../random';
import { slider, toggle, num } from './shared';

type Dot = { x: number; y: number; vx: number; vy: number; size: number };

export const particles: Generator = {
  id: 'particles', name: 'Particles', icon: '✦', description: 'A drifting constellation of connected particles.',
  params: [
    slider('count', 'Particle count', 320, 30, 900, 1, [120, 620]),
    slider('size', 'Particle size', 1.4, 0.4, 5, 0.1, [0.6, 2.8]),
    slider('speed', 'Speed', 0.55, 0.05, 2, 0.05, [0.2, 1.2], 'Motion'),
    slider('direction', 'Direction', 0, -180, 180, 1, [-90, 90], 'Motion'),
    slider('randomness', 'Randomness', 0.55, 0, 1, 0.01, [0.15, 0.9], 'Motion'),
    slider('noiseScale', 'Noise scale', 0.006, 0.001, 0.02, 0.001, [0.003, 0.012], 'Motion'),
    slider('noiseStrength', 'Noise strength', 0.8, 0, 2.5, 0.05, [0.3, 1.8], 'Motion'),
    slider('trail', 'Trail', 0.12, 0, 1, 0.01, [0.03, 0.3], 'Style'),
    slider('opacity', 'Opacity', 0.72, 0.05, 1, 0.01, [0.35, 0.95], 'Style'),
    slider('connection', 'Connection distance', 64, 0, 160, 1, [30, 110], 'Style'),
    toggle('mouse', 'Mouse attraction', true),
  ],
  init: ({ width, height, params, random }) => Array.from({ length: num(params.count) }, (): Dot => ({
    x: random() * width, y: random() * height,
    vx: (random() - .5) * .3, vy: (random() - .5) * .3,
    size: num(params.size) * (.5 + random())
  })),
  render: (c: RenderContext, state) => {
    const dots = state as Dot[];
    const p = c.params; const speed = num(p.speed); const direction = num(p.direction) * Math.PI / 180;
    c.ctx.fillStyle = hexToRgba(c.palette.primary, num(p.opacity));
    for (const d of dots) {
      const angle = noise(d.x * num(p.noiseScale), d.y * num(p.noiseScale) + c.time * .00008, c.seed) * Math.PI * 4;
      d.vx += (Math.cos(angle) * num(p.noiseStrength) + Math.cos(direction)) * .012 * speed;
      d.vy += (Math.sin(angle) * num(p.noiseStrength) + Math.sin(direction)) * .012 * speed;
      if (p.mouse && c.mouse.active) { const dx = c.mouse.x - d.x, dy = c.mouse.y - d.y; const dist = Math.hypot(dx, dy) || 1; if (dist < 240) { d.vx += dx / dist * .025; d.vy += dy / dist * .025; } }
      d.vx *= .985; d.vy *= .985; d.x += d.vx * speed; d.y += d.vy * speed;
      if (d.x < 0) d.x += c.width; if (d.x > c.width) d.x -= c.width; if (d.y < 0) d.y += c.height; if (d.y > c.height) d.y -= c.height;
      c.ctx.beginPath(); c.ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2); c.ctx.fill();
    }
    const connection = num(p.connection);
    if (connection > 0 && dots.length < 700) {
      c.ctx.lineWidth = .55;
      for (let i = 0; i < dots.length; i++) for (let j = i + 1; j < Math.min(dots.length, i + 30); j++) {
        const a = dots[i], b = dots[j], dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (dist < connection) { c.ctx.strokeStyle = hexToRgba(c.palette.secondary, (1 - dist / connection) * .22); c.ctx.beginPath(); c.ctx.moveTo(a.x, a.y); c.ctx.lineTo(b.x, b.y); c.ctx.stroke(); }
      }
    }
  },
  elementCount: p => num(p.count)
};
