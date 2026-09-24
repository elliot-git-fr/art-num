export interface FrameScheduler {
  request(callback: FrameRequestCallback): number;
  cancel(id: number): void;
}

export interface BrowserFrameTarget {
  requestAnimationFrame(callback: FrameRequestCallback): number;
  cancelAnimationFrame(id: number): void;
}

export function createBrowserFrameScheduler(target: BrowserFrameTarget = window): FrameScheduler {
  return {
    request: callback => target.requestAnimationFrame(callback),
    cancel: id => target.cancelAnimationFrame(id)
  };
}

export class AnimationEngine {
  #running = false;
  #destroyed = false;
  #frameId: number | undefined;
  #last = 0;
  constructor(private readonly render: (time: number, delta: number) => void, private readonly scheduler: FrameScheduler = createBrowserFrameScheduler()) {}
  get running() { return this.#running; }
  get destroyed() { return this.#destroyed; }
  start(): void { if (this.#destroyed || this.#running) return; this.#running = true; this.#last = 0; this.#frameId = this.scheduler.request(this.#tick); }
  pause(): void { if (!this.#running) return; this.#running = false; if (this.#frameId !== undefined) this.scheduler.cancel(this.#frameId); this.#frameId = undefined; }
  resume(): void { this.start(); }
  reset(): void { this.#last = 0; }
  destroy(): void { this.pause(); this.#destroyed = true; }
  #tick = (time: number) => { if (!this.#running || this.#destroyed) return; const delta = this.#last ? Math.min(40, time - this.#last) : 16.67; this.#last = time; this.render(time, delta); this.#frameId = this.scheduler.request(this.#tick); };
}
