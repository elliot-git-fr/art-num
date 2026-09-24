import type { PointerState } from '../types';

export interface PointerInput {
  clientX: number;
  clientY: number;
  pointerType: string;
  pressure: number;
  buttons: number;
}

export interface PointerBounds { left: number; top: number; }

export class PointerTracker {
  state: PointerState = { x: 0, y: 0, active: false, down: false, pressure: 0, type: 'mouse' };
  update(event: PointerInput, bounds: PointerBounds): PointerState {
    this.state = { x: event.clientX - bounds.left, y: event.clientY - bounds.top, active: true, down: event.buttons > 0, pressure: event.pressure, type: event.pointerType || 'mouse' };
    return this.state;
  }
  release(event: PointerInput, bounds: PointerBounds): PointerState {
    this.update(event, bounds); this.state = { ...this.state, down: false, pressure: 0 }; return this.state;
  }
  leave(): PointerState { this.state = { ...this.state, active: false, down: false, pressure: 0 }; return this.state; }
}
