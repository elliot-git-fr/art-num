import { describe, expect, it } from 'vitest';
import { GeneratorRegistry } from '../src/core/generator-registry';
import { generatorRegistry, generators } from '../src/generators';
import { validateParameterSchema } from '../src/core/parameters';
import { RendererRegistry } from '../src/core/renderer-registry';

describe('generator registry', () => {
  it('contains unique, complete and loadable generators', () => {
    expect(new Set(generators.map(generator => generator.id)).size).toBe(generators.length);
    for (const generator of generators) {
      expect(generatorRegistry.get(generator.id)).toBe(generator);
      expect(generator.name).toBeTruthy(); expect(generator.description).toBeTruthy();
      expect(generator.category).toBeTruthy(); expect(generator.tags.length).toBeGreaterThan(0);
      expect(generator.renderer).toBe('canvas2d'); expect(generator.defaultPreset).toBeTruthy();
      expect(validateParameterSchema(generator.params).valid).toBe(true);
    }
  });
  it('rejects duplicate ids', () => {
    const registry = new GeneratorRegistry().register(generators[0]);
    expect(() => registry.register(generators[0])).toThrow(/Duplicate/);
  });
  it('filters generators by category and renderer', () => {
    expect(generatorRegistry.byRenderer('canvas2d')).toHaveLength(generators.length);
    expect(generatorRegistry.byCategory('Mathematical').length).toBeGreaterThan(0);
  });
});

describe('renderer registry', () => {
  it('loads renderer backends independently from generators', () => {
    const backend = { type: 'canvas2d' as const, createContext: () => ({} as any), resize: () => undefined, destroy: () => undefined };
    const renderers = new RendererRegistry().register('canvas2d', () => backend);
    expect(renderers.supports('canvas2d')).toBe(true);
    expect(renderers.supports('webgl')).toBe(false);
    expect(renderers.create('canvas2d', {} as HTMLElement)).toBe(backend);
    expect(() => renderers.create('webgl', {} as HTMLElement)).toThrow(/not available/);
    expect(() => renderers.register('canvas2d', () => backend)).toThrow(/already registered/);
  });
});
