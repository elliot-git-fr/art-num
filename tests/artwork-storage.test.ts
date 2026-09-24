import {beforeEach,describe,expect,it,vi} from 'vitest';
import {ArtworkAutosave,deleteArtwork,duplicateArtwork,loadArtworks,loadAutosave,migratePresetToArtwork,saveArtwork} from '../src/core/artwork-storage';
import {createArtwork,createLayer} from '../src/core/artwork';
import {generatorRegistry} from '../src/generators';
import {palettes} from '../src/palettes';

class MemoryStorage{data=new Map<string,string>();getItem(key:string){return this.data.get(key)??null}setItem(key:string,value:string){this.data.set(key,value)}removeItem(key:string){this.data.delete(key)}}
let storage:MemoryStorage;
beforeEach(()=>{storage=new MemoryStorage()});

describe('artwork storage',()=>{
  it('round-trips every composition property in layer order',()=>{const art=createArtwork('Saved',()=> 'art');const a=createLayer(generatorRegistry.get('flow')!,12,palettes[1],()=> 'a',0),b=createLayer(generatorRegistry.get('particles')!,34,palettes[2],()=> 'b',1);b.opacity=.42;b.blendMode='screen';b.visible=false;b.parameters={...b.parameters,count:120};art.layers=[a,b];saveArtwork(storage,generatorRegistry,art);expect(loadArtworks(storage,generatorRegistry)).toEqual([art]);});
  it('duplicates with fresh artwork and layer ids, then deletes',()=>{const art=createArtwork('Original',()=> 'art');art.layers=[createLayer(generatorRegistry.get('flow')!,1,palettes[0],()=> 'layer')];saveArtwork(storage,generatorRegistry,art);const copy=duplicateArtwork(storage,generatorRegistry,'art',()=>['copy','copy-layer'].shift()!);expect(copy?.name).toBe('Original Copy');expect(copy?.id).not.toBe(art.id);expect(copy?.layers[0].id).not.toBe(art.layers[0].id);expect(deleteArtwork(storage,generatorRegistry,'art')).toBe(true);expect(loadArtworks(storage,generatorRegistry)).toHaveLength(1);});
  it('migrates a legacy generator preset to a versioned one-layer artwork',()=>{const art=migratePresetToArtwork({name:'Legacy',generator:'flow',seed:77,params:{density:12},palette:palettes[0]},generatorRegistry,()=> 'fixed');expect(art?.version).toBe(1);expect(art?.layers).toHaveLength(1);expect(art?.layers[0]).toMatchObject({generatorId:'flow',seed:77,opacity:1,blendMode:'normal',visible:true});});
  it('debounces autosave and restores the latest work',()=>{vi.useFakeTimers();const art=createArtwork('Draft');const autosave=new ArtworkAutosave(storage,generatorRegistry,200);autosave.schedule(art);art.name='Latest';autosave.schedule(art);expect(loadAutosave(storage,generatorRegistry)).toBeUndefined();vi.advanceTimersByTime(200);expect(loadAutosave(storage,generatorRegistry)?.name).toBe('Latest');autosave.cancel();vi.useRealTimers();});
});
