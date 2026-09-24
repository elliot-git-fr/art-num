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
  it('registers Julia Set with bounded fractal parameters', () => {
    const generator=generatorRegistry.get('julia');expect(generator).toBeDefined();expect(generator?.category).toBe('Fractals');expect(generator?.params.find(parameter=>parameter.key==='iterations')?.recommendedMax).toBeDefined();
  });
  it('registers Cellular Automata with simulation commands',()=>{const generator=generatorRegistry.get('cellular-automata');expect(generator).toBeDefined();expect(generator?.category).toBe('Patterns');expect(generator?.command).toBeTypeOf('function');});
  it('registers Boids with a recommended population limit',()=>{const generator=generatorRegistry.get('boids');expect(generator).toBeDefined();expect(generator?.category).toBe('Physics');expect(generator?.params.find(parameter=>parameter.key==='count')?.recommendedMax).toBe(1500);});
  it('registers Metaballs with adaptive sampling metadata',()=>{const generator=generatorRegistry.get('metaballs');expect(generator).toBeDefined();expect(generator?.category).toBe('Organic');expect(generator?.params.find(parameter=>parameter.key==='resolution')?.performanceCost).toBe('high');});
  it('registers Spirograph with bounded iterations',()=>{const generator=generatorRegistry.get('spirograph');expect(generator).toBeDefined();expect(generator?.category).toBe('Mathematical');expect(generator?.params.find(parameter=>parameter.key==='iterations')?.recommendedMax).toBe(8000);});
  it('registers Harmonograph with damping controls',()=>{const generator=generatorRegistry.get('harmonograph');expect(generator).toBeDefined();expect(generator?.params.some(parameter=>parameter.key==='damping')).toBe(true);});
  it('registers Kaleidoscope as the twentieth generator',()=>{const generator=generatorRegistry.get('kaleidoscope');expect(generator).toBeDefined();expect(generator?.category).toBe('Experimental');expect(generatorRegistry.getAll()).toHaveLength(20);});
});
