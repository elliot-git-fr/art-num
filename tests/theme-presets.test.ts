import { describe, expect, it } from 'vitest';
import { applyTheme, initialTheme, oppositeTheme, THEME_STORAGE_KEY } from '../src/core/theme';
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
});

describe('presets', () => {
  it('saves, loads and restores compatible parameters', () => {
    const storage = memoryStorage();
    savePreset(storage, generatorRegistry, { name: 'Test', generator: 'particles', seed: 12, params: { count: 99999 }, palette: palettes[0] });
    const [preset] = loadPresets(storage, generatorRegistry);
    expect(preset.name).toBe('Test'); expect(preset.params.count).toBe(900); expect(preset.params.size).toBe(1.4);
  });
  it('ignores malformed and incompatible presets', () => {
    const storage = memoryStorage({ 'gas-presets': JSON.stringify([{ name: 'Old', generator: 'missing', seed: 1, params: {}, palette: palettes[0] }]) });
    expect(loadPresets(storage, generatorRegistry)).toEqual([]);
  });
});
