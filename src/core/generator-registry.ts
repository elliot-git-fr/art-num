import type { AnyGenerator, GeneratorCategory, RendererType } from '../types';
import { validateParameterSchema } from './parameters';

export class GeneratorRegistry {
  readonly #generators = new Map<string, AnyGenerator>();

  register(generator: AnyGenerator): this {
    if (this.#generators.has(generator.id)) throw new Error(`Duplicate generator id: ${generator.id}`);
    if (!generator.id.trim() || !generator.name.trim() || !generator.description.trim()) throw new Error('Generator metadata is incomplete');
    const schema = validateParameterSchema(generator.params);
    if (!schema.valid) throw new Error(`Invalid parameters for ${generator.id}: ${schema.errors.join(', ')}`);
    this.#generators.set(generator.id, generator);
    return this;
  }

  get(id: string): AnyGenerator | undefined { return this.#generators.get(id); }
  getAll(): AnyGenerator[] { return [...this.#generators.values()]; }
  byCategory(category: GeneratorCategory): AnyGenerator[] { return this.getAll().filter(generator => generator.category === category); }
  byRenderer(renderer: RendererType): AnyGenerator[] { return this.getAll().filter(generator => generator.renderer === renderer); }
}
