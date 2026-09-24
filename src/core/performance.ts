import type { PreviewQuality,RenderQuality } from '../types';

export type PerformanceState = 'excellent' | 'stable' | 'degraded' | 'critical';

export interface PerformanceSnapshot {
  fps: number;
  averageFps: number;
  frameTime: number;
  state: PerformanceState;
  sampleCount: number;
}

export class PerformanceMonitor {
  readonly #samples: number[] = [];
  readonly #windowSize: number;
  readonly #transitionSamples: number;
  #state: PerformanceState = 'excellent';
  #candidate: PerformanceState = 'excellent';
  #candidateCount = 0;
  constructor(options: { windowSize?: number; transitionSamples?: number } = {}) { this.#windowSize = options.windowSize ?? 60; this.#transitionSamples = options.transitionSamples ?? 20; }
  record(frameTime: number): PerformanceSnapshot {
    const safeTime = Number.isFinite(frameTime) && frameTime > 0 ? Math.min(frameTime, 1000) : 16.67;
    this.#samples.push(safeTime); if (this.#samples.length > this.#windowSize) this.#samples.shift();
    const next = stateFromFps(this.#averageFps());
    if (next === this.#state) { this.#candidate = next; this.#candidateCount = 0; }
    else if (next === this.#candidate) { this.#candidateCount++; if (this.#candidateCount >= this.#transitionSamples) { this.#state = next; this.#candidateCount = 0; } }
    else { this.#candidate = next; this.#candidateCount = 1; }
    return this.snapshot();
  }
  snapshot(): PerformanceSnapshot { const frameTime = this.#samples.at(-1) ?? 16.67; return { fps: 1000 / frameTime, averageFps: this.#averageFps(), frameTime, state: this.#state, sampleCount: this.#samples.length }; }
  reset(): void { this.#samples.length = 0; this.#state = 'excellent'; this.#candidate = 'excellent'; this.#candidateCount = 0; }
  #averageFps(): number { if (!this.#samples.length) return 60; const averageTime = this.#samples.reduce((sum, value) => sum + value, 0) / this.#samples.length; return 1000 / averageTime; }
}

export function stateFromFps(fps: number): PerformanceState { if (fps >= 55) return 'excellent'; if (fps >= 40) return 'stable'; if (fps >= 25) return 'degraded'; return 'critical'; }

const PROFILES: Record<'low' | 'balanced' | 'high', RenderQuality> = {
  low: { mode: 'preview', level: 'low', resolutionScale: .5, elementScale: .25, iterationScale: .55, dprLimit: 1 },
  balanced: { mode: 'preview', level: 'balanced', resolutionScale: .75, elementScale: .65, iterationScale: .8, dprLimit: 1.5 },
  high: { mode: 'preview', level: 'high', resolutionScale: 1, elementScale: 1, iterationScale: 1, dprLimit: 2 }
};

export class AdaptiveQualityController {
  #level = 0;
  #recovery = 0;
  constructor(public enabled = true, public preview: PreviewQuality = 'auto') {}
  get quality(): RenderQuality { if (!this.enabled) return { ...PROFILES.high }; if (this.preview !== 'auto') return { ...PROFILES[this.preview] }; return { ...PROFILES[this.#level >= 2 ? 'low' : this.#level === 1 ? 'balanced' : 'high'] }; }
  update(state: PerformanceState): RenderQuality {
    if (!this.enabled || this.preview !== 'auto') return this.quality;
    if (state === 'critical') { this.#level = 3; this.#recovery = 0; }
    else if (state === 'degraded') { this.#level = Math.max(this.#level, 2); this.#recovery = 0; }
    else if (state === 'stable') { this.#level = Math.max(this.#level, 1); this.#recovery = 0; }
    else if (this.#level > 0 && ++this.#recovery >= 3) { this.#level--; this.#recovery = 0; }
    return this.quality;
  }
}

export function createExportQuality(): RenderQuality { return { ...PROFILES.high, mode: 'export' }; }

export function effectiveCount(requested: number, recommendedMax: number, quality: RenderQuality): number {
  const safe = Math.max(1, Math.floor(Number.isFinite(requested) ? requested : 1));
  if (quality.mode === 'export' || quality.elementScale >= 1) return safe;
  return Math.max(1, Math.min(safe, Math.floor(recommendedMax * quality.elementScale)));
}
