import type { BaseRenderContext, RendererType } from '../types';

export interface RendererBackend<TContext extends BaseRenderContext = BaseRenderContext> {
  readonly type: RendererType;
  createContext(): TContext;
  resize(width: number, height: number, pixelRatio: number): void;
  destroy(): void;
}

export type RendererFactory = (host: HTMLElement) => RendererBackend;

export class RendererRegistry {
  readonly #factories = new Map<RendererType, RendererFactory>();
  register(type: RendererType, factory: RendererFactory): this {
    if (this.#factories.has(type)) throw new Error(`Renderer already registered: ${type}`);
    this.#factories.set(type, factory);
    return this;
  }
  supports(type: RendererType): boolean { return this.#factories.has(type); }
  create(type: RendererType, host: HTMLElement): RendererBackend {
    const factory = this.#factories.get(type);
    if (!factory) throw new Error(`Renderer is not available: ${type}`);
    return factory(host);
  }
}
