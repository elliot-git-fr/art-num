import { describe, expect, it } from 'vitest';
import { generatorRegistry } from '../src/generators';

describe('expanded generator catalog', () => {
  it('registers Voronoi with a distinct mathematical rendering contract', () => {
    const generator = generatorRegistry.get('voronoi');
    expect(generator).toBeDefined(); expect(generator?.category).toBe('Patterns');
    expect(generator?.tags).toContain('voronoi'); expect(generator?.renderer).toBe('canvas2d');
  });
  it('registers Mandelbrot as an exportable fractal', () => {
    const generator = generatorRegistry.get('mandelbrot');
    expect(generator).toBeDefined(); expect(generator?.category).toBe('Fractals');
    expect(generator?.tags).toContain('mandelbrot'); expect(generator?.capabilities.exportable).toBe(true);
  });
  it('registers Reaction Diffusion as a seeded organic simulation', () => {
    const generator = generatorRegistry.get('reaction-diffusion');
    expect(generator).toBeDefined(); expect(generator?.category).toBe('Organic');
    expect(generator?.tags).toContain('simulation'); expect(generator?.capabilities.deterministic).toBe(true);
  });
});
