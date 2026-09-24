import { describe, expect, it, vi } from 'vitest';
import { AnimationEngine, createBrowserFrameScheduler, type BrowserFrameTarget, type FrameScheduler } from '../src/core/animation-engine';
import { exportCanvas } from '../src/core/export';

describe('animation engine', () => {
  it('keeps browser frame methods bound to their owning window', () => {
    let requested = false; let cancelled = false;
    const target: BrowserFrameTarget = {
      requestAnimationFrame(this: BrowserFrameTarget) { expect(this).toBe(target); requested = true; return 7; },
      cancelAnimationFrame(this: BrowserFrameTarget, id: number) { expect(this).toBe(target); expect(id).toBe(7); cancelled = true; }
    };
    const scheduler = createBrowserFrameScheduler(target);
    const id = scheduler.request(() => undefined); scheduler.cancel(id);
    expect(requested).toBe(true); expect(cancelled).toBe(true);
  });

  it('starts, pauses, resumes, resets and destroys safely', () => {
    let callback: FrameRequestCallback | undefined;
    const scheduler: FrameScheduler = { request: vi.fn(next => { callback = next; return 1; }), cancel: vi.fn() };
    const render = vi.fn(); const engine = new AnimationEngine(render, scheduler);
    engine.start(); expect(engine.running).toBe(true); callback?.(100); expect(render).toHaveBeenCalled();
    engine.pause(); expect(engine.running).toBe(false); expect(scheduler.cancel).toHaveBeenCalled();
    engine.resume(); engine.reset(); expect(engine.running).toBe(true);
    engine.destroy(); expect(engine.destroyed).toBe(true); expect(engine.running).toBe(false);
    engine.start(); expect(engine.running).toBe(false);
  });
});

describe('canvas export', () => {
  it('exports after canvas resize without crashing', () => {
    const canvas = { width: 640, height: 480, toDataURL: vi.fn(() => 'data:image/png;base64,test') };
    expect(exportCanvas(canvas)).toContain('data:image/png');
    canvas.width = 1200; canvas.height = 800;
    expect(() => exportCanvas(canvas)).not.toThrow();
  });
  it('rejects an empty canvas', () => expect(() => exportCanvas({ width: 0, height: 0, toDataURL: () => '' })).toThrow(/positive size/));
});
