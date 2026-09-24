import { describe, expect, it } from 'vitest';
import { AdaptiveQualityController, PerformanceMonitor, createExportQuality, effectiveCount } from '../src/core/performance';
import { VisibilityPauseController } from '../src/core/visibility';

describe('performance monitor', () => {
  it('calculates current and rolling average FPS without reacting to one frame', () => {
    const monitor = new PerformanceMonitor({ windowSize: 10, transitionSamples: 3 });
    for (let i = 0; i < 10; i++) monitor.record(16.67);
    expect(monitor.snapshot().averageFps).toBeCloseTo(60, 0); expect(monitor.snapshot().state).toBe('excellent');
    monitor.record(60); expect(monitor.snapshot().state).toBe('excellent');
  });
  it('uses sustained samples and hysteresis for state changes', () => {
    const monitor = new PerformanceMonitor({ windowSize: 4, transitionSamples: 2 });
    for (let i = 0; i < 6; i++) monitor.record(50);
    expect(monitor.snapshot().state).toBe('critical');
    monitor.record(16); expect(monitor.snapshot().state).toBe('critical');
    for (let i = 0; i < 8; i++) monitor.record(16);
    expect(['stable','excellent']).toContain(monitor.snapshot().state);
  });
});

describe('visibility pause', () => {
  it('pauses only for a hidden tab and resumes with timing reset', () => {
    const calls:string[]=[];let running=true;const engine={get running(){return running;},pause(){running=false;calls.push('pause');},resume(){running=true;calls.push('resume');}};
    const controller=new VisibilityPauseController(engine,()=>calls.push('reset'));
    controller.handle(true);controller.handle(true);expect(calls).toEqual(['pause']);
    controller.handle(false);expect(calls).toEqual(['pause','reset','resume']);
  });
});

describe('adaptive quality', () => {
  it('reduces technical preview quality but never mutates art parameters', () => {
    const art = Object.freeze({ count: 50000, iterations: 220 });
    const controller = new AdaptiveQualityController(true, 'auto');
    controller.update('critical'); const quality = controller.quality;
    expect(quality.elementScale).toBeLessThan(1); expect(quality.resolutionScale).toBeLessThan(1);
    expect(effectiveCount(art.count, 20000, quality)).toBeLessThan(art.count); expect(art).toEqual({ count: 50000, iterations: 220 });
  });
  it('does nothing when disabled and recovers progressively', () => {
    const off = new AdaptiveQualityController(false, 'auto'); off.update('critical'); expect(off.quality.elementScale).toBe(1);
    const adaptive = new AdaptiveQualityController(true, 'auto'); adaptive.update('critical'); const low = adaptive.quality.elementScale;
    for (let i = 0; i < 8; i++) adaptive.update('excellent');
    expect(adaptive.quality.elementScale).toBeGreaterThan(low);
  });
  it('keeps export quality independent from preview throttling', () => {
    const exportQuality = createExportQuality();
    expect(exportQuality.mode).toBe('export'); expect(exportQuality.elementScale).toBe(1); expect(exportQuality.resolutionScale).toBe(1);
  });
  it('bounds extreme counts to finite non-zero preview work', () => {
    const controller = new AdaptiveQualityController(true, 'low');
    expect(effectiveCount(100000, 20000, controller.quality)).toBeGreaterThan(0);
    expect(effectiveCount(100000, 20000, controller.quality)).toBeLessThanOrEqual(20000);
  });
});
