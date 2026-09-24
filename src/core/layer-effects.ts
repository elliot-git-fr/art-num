import type {EffectRegistry} from './effect';
import type {Layer} from './artwork';
import {createId,createMask} from './artwork';
import type {MaskInstance,MaskType} from './mask';
import {defaultParameterValues,sanitizeParameterValues} from './parameters';

export class LayerEffects{
  constructor(private readonly registry:EffectRegistry,private readonly emit:()=>void=()=>{}){}
  add(layer:Layer,effectId:string,idFactory:()=>string=createId){if(layer.locked)return;const definition=this.registry.get(effectId);if(!definition)return;const effect={id:idFactory(),effectId,enabled:true,parameters:defaultParameterValues(definition.parameters),order:layer.effects.length};layer.effects.push(effect);this.emit();return effect}
  remove(layer:Layer,id:string){if(layer.locked)return false;const index=layer.effects.findIndex(effect=>effect.id===id);if(index<0)return false;layer.effects.splice(index,1);this.#normalize(layer);this.emit();return true}
  duplicate(layer:Layer,id:string,idFactory:()=>string=createId){if(layer.locked)return;const source=layer.effects.find(effect=>effect.id===id);if(!source)return;const copy={...structuredClone(source),id:idFactory(),order:source.order+1};layer.effects.splice(source.order+1,0,copy);this.#normalize(layer);this.emit();return copy}
  move(layer:Layer,id:string,delta:number){if(layer.locked)return false;const from=layer.effects.findIndex(effect=>effect.id===id),to=Math.max(0,Math.min(layer.effects.length-1,from+delta));if(from<0||from===to)return false;const[effect]=layer.effects.splice(from,1);layer.effects.splice(to,0,effect);this.#normalize(layer);this.emit();return true}
  setEnabled(layer:Layer,id:string,enabled:boolean){const effect=layer.effects.find(item=>item.id===id);if(layer.locked||!effect)return false;effect.enabled=enabled;this.emit();return true}
  update(layer:Layer,id:string,parameters:Record<string,number|boolean|string>){const effect=layer.effects.find(item=>item.id===id),definition=effect&&this.registry.get(effect.effectId);if(layer.locked||!effect||!definition)return false;effect.parameters=sanitizeParameterValues(definition.parameters,{...effect.parameters,...parameters});this.emit();return true}
  reset(layer:Layer,id:string){const effect=layer.effects.find(item=>item.id===id),definition=effect&&this.registry.get(effect.effectId);if(layer.locked||!effect||!definition)return false;effect.parameters=defaultParameterValues(definition.parameters);this.emit();return true}
  setMask(layer:Layer,type:MaskType|null,idFactory:()=>string=createId){if(layer.locked)return false;layer.mask=type?createMask(type,idFactory):null;this.emit();return true}
  updateMask(layer:Layer,patch:Partial<Omit<MaskInstance,'id'|'type'>>){if(layer.locked||!layer.mask)return false;Object.assign(layer.mask,structuredClone(patch));layer.mask.strength=Math.max(0,Math.min(1,layer.mask.strength));this.emit();return true}
  #normalize(layer:Layer){layer.effects.forEach((effect,order)=>effect.order=order)}
}
