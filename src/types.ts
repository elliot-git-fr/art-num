export type ParamValue = number | boolean | string;
export type ParamValues = Record<string, ParamValue>;
export type ControlType = 'slider' | 'number' | 'toggle' | 'select' | 'color';

export interface ParameterDefinition {
  key: string;
  label: string;
  type: ControlType;
  default: ParamValue;
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: string }[];
  random?: [number, number];
  group?: string;
}

export interface Palette {
  name: string;
  background: string;
  primary: string;
  secondary: string;
  accent: string;
}

export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  time: number;
  delta: number;
  frame: number;
  seed: number;
  mouse: { x: number; y: number; active: boolean };
  params: ParamValues;
  palette: Palette;
  random: () => number;
}

export interface Generator {
  id: string;
  name: string;
  icon: string;
  description: string;
  params: ParameterDefinition[];
  init?: (context: RenderContext) => unknown;
  render: (context: RenderContext, state: unknown) => void;
  elementCount?: (params: ParamValues) => number;
}

export interface Preset {
  name: string;
  generator: string;
  seed: number;
  params: ParamValues;
  palette: Palette;
}
