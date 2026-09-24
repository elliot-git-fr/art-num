import type {ParameterDefinition,ParamValues,RenderQuality} from '../types';
import type {LayerSurface} from './compositor';

export type EffectCategory='Blur'|'Color'|'Stylize'|'Distortion'|'Texture';
export type PerformanceCost='low'|'medium'|'high';
export interface EffectInstance{id:string;effectId:string;enabled:boolean;parameters:ParamValues;order:number;}
export interface EffectRenderContext{source:CanvasImageSource;target:LayerSurface;width:number;height:number;time:number;quality:RenderQuality;parameters:ParamValues;seed:number;}
export interface EffectDefinition{id:string;name:string;description:string;category:EffectCategory;parameters:ParameterDefinition[];performanceCost:PerformanceCost;apply(context:EffectRenderContext):void;}

export class EffectRegistry{readonly #definitions=new Map<string,EffectDefinition>();register(definition:EffectDefinition){if(this.#definitions.has(definition.id))throw new Error(`Duplicate effect: ${definition.id}`);this.#definitions.set(definition.id,definition);return this}get(id:string){return this.#definitions.get(id)}getAll(){return[...this.#definitions.values()]}has(id:string){return this.#definitions.has(id)}}
