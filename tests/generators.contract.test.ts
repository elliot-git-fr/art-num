import { describe, expect, it } from 'vitest';
import { generators } from '../src/generators';
import { defaultParameters, validateParameterSchema } from '../src/core/parameters';
import { destroyGenerator, initializeGenerator, resetGenerator } from '../src/core/generator-lifecycle';
import { mulberry32 } from '../src/random';
import { palettes } from '../src/palettes';
import type { RenderContext } from '../src/types';

function fakeContext(seed = 42): RenderContext {
  const ctx = new Proxy({}, { get: () => () => undefined, set: () => true }) as CanvasRenderingContext2D;
  return { renderer: 'canvas2d', ctx, width: 320, height: 240, time: 1000, delta: 16, frame: 1, seed, mouse: { x: 0, y: 0, active: false }, params: {}, palette: palettes[0], random: mulberry32(seed) };
}

describe.each(generators)('$name generator contract', generator => {
  it('has complete metadata and a valid schema', () => {
    expect(generator.id).toBeTruthy(); expect(generator.name).toBeTruthy(); expect(generator.description).toBeTruthy();
    expect(generator.category).toBeTruthy(); expect(generator.renderer).toBeTruthy(); expect(generator.capabilities).toBeTruthy();
    expect(validateParameterSchema(generator.params).valid).toBe(true);
  });
  it('initializes, renders, resets and destroys with defaults', () => {
    const context = fakeContext(); context.params = defaultParameters(generator);
    expect(() => { const state = initializeGenerator(generator, context); generator.render(context, state); const next = resetGenerator(generator, context, state); destroyGenerator(generator, next); }).not.toThrow();
  });
  it('is deterministic for identical seeds when declared deterministic', () => {
    if (!generator.capabilities.deterministic || !generator.init) return;
    const first = fakeContext(12); first.params = defaultParameters(generator);
    const second = fakeContext(12); second.params = defaultParameters(generator);
    expect(generator.init(first)).toEqual(generator.init(second));
  });
});
