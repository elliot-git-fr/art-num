export type ParamValue = number | boolean | string;
export type ParamValues = Record<string, ParamValue>;
export type ControlType = 'slider' | 'number' | 'toggle' | 'select' | 'color';
export type RendererType = 'canvas2d' | 'webgl' | 'three' | 'shader';
export type GeneratorCategory = 'Particles' | 'Geometry' | 'Mathematical' | 'Organic' | 'Fields' | 'Patterns' | 'Fractals' | 'Physics' | 'Experimental';

export interface GeneratorCapabilities {
  animated: boolean;
  interactive: boolean;
  deterministic: boolean;
  exportable: boolean;
}

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

export interface BaseRenderContext {
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

export interface RenderContext extends BaseRenderContext {
  renderer: 'canvas2d';
  ctx: CanvasRenderingContext2D;
}

export interface Generator<TContext extends BaseRenderContext = RenderContext> {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: GeneratorCategory;
  tags: string[];
  renderer: RendererType;
  capabilities: GeneratorCapabilities;
  defaultPreset: string;
  params: ParameterDefinition[];
  init?: (context: TContext) => unknown;
  render: (context: TContext, state: unknown) => void;
  reset?: (context: TContext, state: unknown) => unknown;
  destroy?: (state: unknown) => void;
  elementCount?: (params: ParamValues) => number;
}

export type AnyGenerator = Generator<any>;

export interface Preset {
  name: string;
  generator: string;
  seed: number;
  params: ParamValues;
  palette: Palette;
}
