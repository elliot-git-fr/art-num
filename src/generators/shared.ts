import type { ParameterDefinition } from '../types';

export const slider = (key: string, label: string, value: number, min: number, max: number, step = 1, random: [number, number] = [min, max], group = 'Geometry', performanceCost: 'low'|'medium'|'high' = 'low', recommendedMax?: number): ParameterDefinition => ({ key, label, type: 'slider', default: value, min, max, step, random, group, performanceCost, recommendedMax });
export const toggle = (key: string, label: string, value: boolean, group = 'Motion'): ParameterDefinition => ({ key, label, type: 'toggle', default: value, group });
export const select = (key: string, label: string, value: string, options: string[], group = 'Style'): ParameterDefinition => ({ key, label, type: 'select', default: value, options: options.map(item => ({ label: item, value: item.toLowerCase() })), group });
export const num = (value: unknown) => Number(value);

export function line(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
}
