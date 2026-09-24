import {describe,expect,it} from 'vitest';
import {allocateLayerQualities} from '../src/core/layer-performance';
import type {RenderQuality} from '../src/types';

const high:RenderQuality={mode:'preview',level:'high',resolutionScale:1,elementScale:1,iterationScale:1,dprLimit:2};

describe('multi-layer performance budget',()=>{
  it('allocates only visible renderable layers',()=>{const result=allocateLayerQualities(high,[{id:'a',visible:true},{id:'b',visible:false}],new Map([['a',4],['b',30]]),null,'stable');expect([...result.keys()]).toEqual(['a']);});
  it('degrades expensive layers before inexpensive ones',()=>{const result=allocateLayerQualities(high,[{id:'cheap',visible:true},{id:'costly',visible:true}],new Map([['cheap',2],['costly',18]]),null,'degraded');expect(result.get('costly')!.elementScale).toBeLessThan(result.get('cheap')!.elementScale);});
  it('protects the selected layer while keeping export at full quality',()=>{const preview=allocateLayerQualities(high,[{id:'selected',visible:true},{id:'other',visible:true}],new Map([['selected',20],['other',20]]),'selected','critical');expect(preview.get('selected')!.elementScale).toBeGreaterThan(preview.get('other')!.elementScale);const exported=allocateLayerQualities({...high,mode:'export'},[{id:'selected',visible:true},{id:'other',visible:true}],new Map([['selected',20],['other',20]]),'selected','critical');expect(exported.get('selected')).toEqual({...high,mode:'export'});expect(exported.get('other')).toEqual({...high,mode:'export'});});
});
