import type {PerformanceState} from './performance';
import type {RenderQuality} from '../types';

interface BudgetLayer{id:string;visible:boolean}
const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value));

export function allocateLayerQualities(base:RenderQuality,layers:BudgetLayer[],costs:ReadonlyMap<string,number>,selectedId:string|null,state:PerformanceState):Map<string,RenderQuality>{
  const visible=layers.filter(layer=>layer.visible),result=new Map<string,RenderQuality>();
  if(base.mode==='export'){for(const layer of visible)result.set(layer.id,{...base});return result;}
  const pressure=state==='critical'?.55:state==='degraded'?.35:state==='stable'?.15:0;
  const maxCost=Math.max(1,...visible.map(layer=>costs.get(layer.id)??0));
  for(const layer of visible){const costRatio=(costs.get(layer.id)??0)/maxCost;const priority=layer.id===selectedId?.14:0;const reduction=Math.max(0,pressure*(.45+.55*costRatio)-priority);result.set(layer.id,{...base,resolutionScale:clamp(base.resolutionScale-reduction*.45,.35,1),elementScale:clamp(base.elementScale-reduction,.2,1),iterationScale:clamp(base.iterationScale-reduction*.7,.35,1),dprLimit:clamp(base.dprLimit-reduction,.75,2),level:reduction>.4?'low':reduction>.15?'balanced':base.level});}
  return result;
}
