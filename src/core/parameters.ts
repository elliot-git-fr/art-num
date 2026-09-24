import type { Generator, ParameterDefinition, ParamValue, ParamValues } from '../types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function defaultParameters(generator: Generator): ParamValues {
  return Object.fromEntries(generator.params.map(parameter => [parameter.key, parameter.default]));
}

export function validateParameterSchema(parameters: ParameterDefinition[]): ValidationResult {
  const errors: string[] = [];
  const keys = new Set<string>();
  for (const parameter of parameters) {
    if (!parameter.key.trim()) errors.push('Parameter key is required');
    if (!parameter.label.trim()) errors.push(`${parameter.key}: label is required`);
    if (keys.has(parameter.key)) errors.push(`${parameter.key}: duplicate key`);
    keys.add(parameter.key);
    if (parameter.type === 'slider' || parameter.type === 'number') {
      if (parameter.min === undefined || parameter.max === undefined || parameter.min > parameter.max) errors.push(`${parameter.key}: invalid range`);
      if (typeof parameter.default !== 'number' || parameter.default < (parameter.min ?? -Infinity) || parameter.default > (parameter.max ?? Infinity)) errors.push(`${parameter.key}: default outside range`);
      if (parameter.random && (parameter.random[0] < (parameter.min ?? -Infinity) || parameter.random[1] > (parameter.max ?? Infinity) || parameter.random[0] > parameter.random[1])) errors.push(`${parameter.key}: invalid random range`);
    }
    if (parameter.type === 'toggle' && typeof parameter.default !== 'boolean') errors.push(`${parameter.key}: toggle default must be boolean`);
    if (parameter.type === 'select' && !parameter.options?.some(option => option.value === parameter.default)) errors.push(`${parameter.key}: default option is missing`);
  }
  return { valid: errors.length === 0, errors };
}

export function sanitizeParameters(generator: Generator, values: ParamValues): ParamValues {
  const result = defaultParameters(generator);
  for (const definition of generator.params) result[definition.key] = sanitizeValue(definition, values[definition.key]);
  return result;
}

function sanitizeValue(definition: ParameterDefinition, value: ParamValue | undefined): ParamValue {
  if (definition.type === 'toggle') return typeof value === 'boolean' ? value : definition.default;
  if (definition.type === 'select' || definition.type === 'color') {
    if (typeof value !== 'string') return definition.default;
    if (definition.type === 'select' && !definition.options?.some(option => option.value === value)) return definition.default;
    return value;
  }
  if (typeof value !== 'number' || !Number.isFinite(value)) return definition.default;
  const clamped = Math.min(definition.max ?? Infinity, Math.max(definition.min ?? -Infinity, value));
  const step = definition.step ?? 1;
  const base = definition.min ?? 0;
  return Number((base + Math.round((clamped - base) / step) * step).toFixed(10));
}

export function randomizeParameters(generator: Generator, random: () => number): ParamValues {
  const values = defaultParameters(generator);
  for (const definition of generator.params) {
    if ((definition.type === 'slider' || definition.type === 'number') && definition.random) {
      const [min, max] = definition.random;
      values[definition.key] = sanitizeValue(definition, min + random() * (max - min));
    } else if (definition.type === 'toggle') values[definition.key] = random() > 0.35;
  }
  return values;
}
