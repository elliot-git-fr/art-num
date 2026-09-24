import { describe, expect, it } from 'vitest';
import { mulberry32, noise } from '../src/random';

describe('seeded randomness', () => {
  it('produces the same sequence for the same seed', () => {
    const first = mulberry32(42); const second = mulberry32(42);
    expect(Array.from({ length: 20 }, first)).toEqual(Array.from({ length: 20 }, second));
  });
  it('produces a different sequence and noise field for another seed', () => {
    const first = mulberry32(42); const second = mulberry32(43);
    expect(Array.from({ length: 10 }, first)).not.toEqual(Array.from({ length: 10 }, second));
    expect(noise(1.25, 8.5, 42)).not.toBe(noise(1.25, 8.5, 43));
  });
});
