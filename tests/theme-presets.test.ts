import { describe, expect, it } from 'vitest';
import { applyTheme, automaticCanvasBackground, initialTheme, oppositeTheme, syncCanvasBackground, THEME_STORAGE_KEY } from '../src/core/theme';
import { mulberry32 } from '../src/random';
import { loadPresets, savePreset } from '../src/core/presets';
import { generatorRegistry } from '../src/generators';
import { palettes } from '../src/palettes';

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => data.set(key, value) };
}

describe('theme', () => {
  it('uses the system preference on first launch', () => {
    expect(initialTheme({ storage: memoryStorage(), prefersDark: () => true })).toBe('dark');
    expect(initialTheme({ storage: memoryStorage(), prefersDark: () => false })).toBe('light');
  });
  it('persists and restores explicit choices', () => {
    const storage = memoryStorage(); const root = { dataset: {} as DOMStringMap };
    applyTheme('light', root, storage);
    expect(root.dataset.theme).toBe('light');
    expect(initialTheme({ storage, prefersDark: () => true })).toBe('light');
    expect(oppositeTheme('light')).toBe('dark');
    expect(storage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });
  it('does not mutate artwork settings', () => {
    const artwork = { seed: 99, palette: { ...palettes[0] } }; const snapshot = structuredClone(artwork);
    applyTheme('light', { dataset: {} as DOMStringMap }, memoryStorage());
    expect(artwork).toEqual(snapshot);
  });
  it('uses a dark automatic canvas background in dark mode', () => {
    expect(automaticCanvasBackground('dark')).toMatch(/^#[0-3][0-9a-f]{5}$/i);
  });
  it('uses a light automatic canvas background in light mode', () => {
    expect(automaticCanvasBackground('light')).toMatch(/^#[c-f][0-9a-f]{5}$/i);
  });
  it('updates an automatic background in both theme directions', () => {
    const base = { ...palettes[0] };
    const light = syncCanvasBackground(base, 'auto', 'light');
    expect(light.background).toBe(automaticCanvasBackground('light'));
    const dark = syncCanvasBackground(light, 'auto', 'dark');
    expect(dark.background).toBe(automaticCanvasBackground('dark'));
  });
  it('preserves a custom artwork background', () => {
    const custom = { ...palettes[0], background: '#123456' };
    expect(syncCanvasBackground(custom, 'custom', 'light')).toEqual(custom);
  });
  it('keeps artistic parameters and deterministic randomness unchanged', () => {
    const artwork = { seed: 417, params: { count: 320, speed: 0.55 }, palette: { ...palettes[0] } };
    const sequence = () => Array.from({ length: 8 }, mulberry32(artwork.seed));
    const before = sequence();
    const themed = { ...artwork, palette: syncCanvasBackground(artwork.palette, 'auto', 'light') };
    expect(themed.params).toEqual(artwork.params); expect(themed.seed).toBe(artwork.seed); expect(sequence()).toEqual(before);
    expect(themed.palette.primary).toBe(artwork.palette.primary);
    expect(themed.palette.secondary).toBe(artwork.palette.secondary);
    expect(themed.palette.accent).toBe(artwork.palette.accent);
  });
});

describe('presets', () => {
  it('saves, loads and restores compatible parameters', () => {
    const storage = memoryStorage();
    savePreset(storage, generatorRegistry, { name: 'Test', generator: 'particles', seed: 12, params: { count: 99999 }, palette: palettes[0] });
    const [preset] = loadPresets(storage, generatorRegistry);
    expect(preset.name).toBe('Test'); expect(preset.params.count).toBe(50000); expect(preset.params.size).toBe(1.4);
  });
  it('ignores malformed and incompatible presets', () => {
    const storage = memoryStorage({ 'gas-presets': JSON.stringify([{ name: 'Old', generator: 'missing', seed: 1, params: {}, palette: palettes[0] }]) });
    expect(loadPresets(storage, generatorRegistry)).toEqual([]);
  });
});
