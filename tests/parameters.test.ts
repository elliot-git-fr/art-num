import { describe, expect, it } from 'vitest';
import { generators } from '../src/generators';
import { defaultParameters, randomizeParameters, sanitizeParameters, validateParameterSchema } from '../src/core/parameters';
import { mulberry32 } from '../src/random';

describe('parameter schemas', () => {
  const particles = generators.find(generator => generator.id === 'particles')!;
  it('creates defaults from the schema', () => expect(defaultParameters(particles).count).toBe(320));
  it('clamps ranges and restores invalid values', () => {
    const values = sanitizeParameters(particles, { count: 99999, size: Number.NaN, mouse: 'invalid' });
    expect(values.count).toBe(900); expect(values.size).toBe(1.4); expect(values.mouse).toBe(true);
  });
  it('randomizes deterministically inside curated ranges', () => {
    const a = randomizeParameters(particles, mulberry32(7));
    const b = randomizeParameters(particles, mulberry32(7));
    expect(a).toEqual(b); expect(a.count).toBeGreaterThanOrEqual(120); expect(a.count).toBeLessThanOrEqual(620);
  });
  it('rejects duplicate keys and invalid ranges', () => {
    const result = validateParameterSchema([
      { key: 'x', label: 'X', type: 'slider', default: 5, min: 10, max: 0 },
      { key: 'x', label: 'Again', type: 'toggle', default: false }
    ]);
    expect(result.valid).toBe(false); expect(result.errors.length).toBeGreaterThan(1);
  });
});
