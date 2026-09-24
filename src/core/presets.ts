import type { GeneratorRegistry } from './generator-registry';
import type { Preset } from '../types';
import { sanitizeParameters } from './parameters';

export const PRESET_STORAGE_KEY = 'gas-presets';

export function loadPresets(storage: Pick<Storage, 'getItem'>, registry: GeneratorRegistry): Preset[] {
  try {
    const raw = JSON.parse(storage.getItem(PRESET_STORAGE_KEY) || '[]');
    if (!Array.isArray(raw)) return [];
    return raw.flatMap((item): Preset[] => {
      if (!item || typeof item.name !== 'string' || typeof item.generator !== 'string') return [];
      const generator = registry.get(item.generator);
      if (!generator || !item.palette || typeof item.seed !== 'number') return [];
      return [{ ...item, params: sanitizeParameters(generator, item.params || {}) } as Preset];
    });
  } catch { return []; }
}

export function savePreset(storage: Pick<Storage, 'getItem' | 'setItem'>, registry: GeneratorRegistry, preset: Preset): Preset[] {
  const generator = registry.get(preset.generator);
  if (!generator) throw new Error(`Unknown generator: ${preset.generator}`);
  const presets = loadPresets(storage, registry);
  presets.push({ ...preset, params: sanitizeParameters(generator, preset.params) });
  storage.setItem(PRESET_STORAGE_KEY, JSON.stringify(presets));
  return presets;
}
