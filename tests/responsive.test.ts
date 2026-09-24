import { describe, expect, it } from 'vitest';
import { calculateCanvasSize, layoutMode } from '../src/core/responsive';
import { PointerTracker } from '../src/core/pointer';

describe('responsive layout rules', () => {
  it('selects large desktop, desktop, tablet orientations and mobile layouts', () => {
    expect(layoutMode(2560, 1440)).toBe('large-desktop');
    expect(layoutMode(1440, 900)).toBe('desktop');
    expect(layoutMode(1024, 768)).toBe('tablet-landscape');
    expect(layoutMode(768, 1024)).toBe('tablet-portrait');
    expect(layoutMode(390, 844)).toBe('mobile-portrait');
    expect(layoutMode(844, 390)).toBe('mobile-landscape');
  });
  it('creates finite HiDPI canvas dimensions and caps pixel ratio', () => {
    expect(calculateCanvasSize(500, 300, 3)).toEqual({ cssWidth: 500, cssHeight: 300, pixelWidth: 1000, pixelHeight: 600, pixelRatio: 2 });
    expect(calculateCanvasSize(Number.NaN, -20, Number.POSITIVE_INFINITY)).toEqual({ cssWidth: 1, cssHeight: 1, pixelWidth: 1, pixelHeight: 1, pixelRatio: 1 });
  });
  it('handles major orientation changes without invalid dimensions', () => {
    const portrait = calculateCanvasSize(390, 650, 2);
    const landscape = calculateCanvasSize(844, 280, 2);
    expect(portrait.pixelWidth).toBe(780); expect(landscape.pixelWidth).toBe(1688);
    expect(Object.values(landscape).every(Number.isFinite)).toBe(true);
  });
});

describe('pointer abstraction', () => {
  it('normalizes mouse, touch and stylus pointer events', () => {
    const tracker = new PointerTracker();
    tracker.update({ clientX: 35, clientY: 55, pointerType: 'touch', pressure: .7, buttons: 1 }, { left: 10, top: 20 });
    expect(tracker.state).toEqual({ x: 25, y: 35, active: true, down: true, pressure: .7, type: 'touch' });
    tracker.release({ clientX: 40, clientY: 60, pointerType: 'pen', pressure: 0, buttons: 0 }, { left: 10, top: 20 });
    expect(tracker.state.down).toBe(false); expect(tracker.state.type).toBe('pen');
    tracker.leave(); expect(tracker.state.active).toBe(false);
  });
});
