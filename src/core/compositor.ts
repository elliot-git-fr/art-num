import type {BlendMode,Layer} from './artwork';import type {GeneratorRegistry} from './generator-registry';import type {PointerState,RenderQuality,RenderContext} from '../types';import {mulberry32} from '../random';import {destroyGenerator,initializeGenerator} from './generator-lifecycle';import {LayerPipeline} from './layer-pipeline';import {effectRegistry} from './effects';
export interface LayerSurface{canvas:CanvasImageSource;ctx:CanvasRenderingContext2D;resize(width:number,height:number):void;destroy():void;}
export type SurfaceFactory=()=>LayerSurface;
export interface CompositionFrame{width:number;height:number;pixelWidth:number;pixelHeight:number;dpr:number;time:number;delta:number;frame:number;pointer:PointerState;quality:RenderQuality;layerQualities?:ReadonlyMap<string,RenderQuality>;background:string;transparent?:boolean;maskPreviewLayerId?:string|null;}
export interface LayerMetric{layerId:string;milliseconds:number;effects:number;}
type Entry={surface:LayerSurface;state:unknown;initialized:boolean;width:number;height:number};
export const canvasBlendMode=(mode:BlendMode):GlobalCompositeOperation=>mode==='normal'?'source-over':mode;
export function browserSurfaceFactory():LayerSurface{const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d',{alpha:true})!;return{canvas,ctx,resize:(width,height)=>{if(canvas.width!==width)canvas.width=width;if(canvas.height!==height)canvas.height=height},destroy:()=>{canvas.width=1;canvas.height=1}}}
export class Compositor{
  readonly metrics=new Map<string,LayerMetric>();readonly #entries=new Map<string,Entry>();readonly #pipeline:LayerPipeline;
  constructor(private readonly registry:GeneratorRegistry,private readonly factory:SurfaceFactory=browserSurfaceFactory,private readonly clock:()=>number=()=>performance.now()){this.#pipeline=new LayerPipeline(effectRegistry,factory)}
  render(target:CanvasRenderingContext2D,layers:Layer[],soloId:string|null,frame:CompositionFrame){
    const persistentVisible=new Set(layers.filter(layer=>layer.visible).map(layer=>layer.id));
    for(const[id,entry]of this.#entries)if(!persistentVisible.has(id)){const layer=layers.find(item=>item.id===id),generator=layer&&this.registry.get(layer.generatorId);if(generator)destroyGenerator(generator,entry.state);entry.surface.destroy();this.#entries.delete(id);this.metrics.delete(id)}
    target.save();target.setTransform(1,0,0,1,0,0);target.globalCompositeOperation='source-over';target.globalAlpha=1;if(!frame.transparent||frame.maskPreviewLayerId){target.fillStyle=frame.maskPreviewLayerId?'#000':frame.background;target.fillRect(0,0,frame.pixelWidth,frame.pixelHeight)}else target.clearRect(0,0,frame.pixelWidth,frame.pixelHeight);
    const renderable=layers.filter(layer=>layer.visible&&(!soloId||layer.id===soloId)&&(!frame.maskPreviewLayerId||layer.id===frame.maskPreviewLayerId)).sort((a,b)=>a.order-b.order);
    for(const layer of renderable){
      const generator=this.registry.get(layer.generatorId);if(!generator||generator.renderer!=='canvas2d')continue;let entry=this.#entries.get(layer.id);if(!entry){entry={surface:this.factory(),state:undefined,initialized:false,width:0,height:0};this.#entries.set(layer.id,entry)}
      if(entry.width!==frame.pixelWidth||entry.height!==frame.pixelHeight){entry.surface.resize(frame.pixelWidth,frame.pixelHeight);entry.width=frame.pixelWidth;entry.height=frame.pixelHeight;entry.initialized=false}
      const layerCtx=entry.surface.ctx;layerCtx.save();layerCtx.setTransform(1,0,0,1,0,0);if((generator.id==='particles'||generator.id==='boids')&&entry.initialized){layerCtx.globalCompositeOperation='destination-out';layerCtx.fillStyle=`rgba(0,0,0,${Math.max(.025,Number(layer.parameters.trail))})`;layerCtx.fillRect(0,0,frame.pixelWidth,frame.pixelHeight);layerCtx.globalCompositeOperation='source-over'}else layerCtx.clearRect(0,0,frame.pixelWidth,frame.pixelHeight);layerCtx.setTransform(frame.dpr,0,0,frame.dpr,0,0);
      const quality=frame.layerQualities?.get(layer.id)??frame.quality,context:RenderContext={renderer:'canvas2d',ctx:layerCtx,width:frame.width,height:frame.height,time:frame.time,delta:frame.delta,frame:frame.frame,seed:layer.seed,pointer:frame.pointer,quality,params:layer.parameters,palette:layer.palette,random:mulberry32(layer.seed)};if(!entry.initialized){entry.state=initializeGenerator(generator,context);entry.initialized=true}
      const start=this.clock();generator.render(context,entry.state);layerCtx.restore();const preview=frame.maskPreviewLayerId===layer.id,processed=this.#pipeline.process(entry.surface,layer,{width:frame.pixelWidth,height:frame.pixelHeight,time:frame.time,quality,maskPreview:preview});target.globalAlpha=preview?1:layer.opacity;target.globalCompositeOperation=preview?'source-over':canvasBlendMode(layer.blendMode);target.drawImage(processed,0,0,frame.pixelWidth,frame.pixelHeight);this.metrics.set(layer.id,{layerId:layer.id,milliseconds:Math.max(0,this.clock()-start),effects:layer.effects.filter(effect=>effect.enabled).length});this.#pipeline.releaseFrame()
    }
    target.globalAlpha=1;target.globalCompositeOperation='source-over';target.restore();return target
  }
  command(layer:Layer,command:string,context:RenderContext){const entry=this.#entries.get(layer.id),generator=this.registry.get(layer.generatorId);if(entry?.initialized&&generator?.command)entry.state=generator.command(command,context,entry.state);return entry?.state}
  invalidate(layerId:string){const entry=this.#entries.get(layerId);if(entry)entry.initialized=false}
  destroy(){for(const entry of this.#entries.values())entry.surface.destroy();this.#entries.clear();this.metrics.clear();this.#pipeline.destroy()}
}
