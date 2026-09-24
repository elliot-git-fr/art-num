import type { AnyGenerator, BaseRenderContext } from '../types';

export function initializeGenerator(generator: AnyGenerator, context: BaseRenderContext): unknown {
  return generator.init?.(context);
}

export function resetGenerator(generator: AnyGenerator, context: BaseRenderContext, state: unknown): unknown {
  if (generator.reset) return generator.reset(context, state);
  generator.destroy?.(state);
  return generator.init?.(context);
}

export function destroyGenerator(generator: AnyGenerator, state: unknown): void {
  generator.destroy?.(state);
}
