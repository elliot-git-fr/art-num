import type {Preset} from '../types';
import type {GeneratorRegistry} from './generator-registry';
import {createArtwork,createId,createLayer,normalizeArtwork,type Artwork} from './artwork';

export const ARTWORK_STORAGE_KEY='gas-artworks-v1';
export const AUTOSAVE_STORAGE_KEY='gas-artwork-autosave-v1';
type ReadStorage=Pick<Storage,'getItem'>;
type WriteStorage=Pick<Storage,'getItem'|'setItem'>;

const clone=<T>(value:T):T=>structuredClone(value);
function parseArtwork(value:unknown,registry:GeneratorRegistry):Artwork|undefined{try{if(!value||typeof value!=='object'||!Array.isArray((value as Artwork).layers))return;return normalizeArtwork(value as Artwork,registry)}catch{return}}

export function loadArtworks(storage:ReadStorage,registry:GeneratorRegistry):Artwork[]{try{const raw=JSON.parse(storage.getItem(ARTWORK_STORAGE_KEY)||'[]');return Array.isArray(raw)?raw.flatMap(item=>{const art=parseArtwork(item,registry);return art?[art]:[]}):[]}catch{return[]}}
export function saveArtwork(storage:WriteStorage,registry:GeneratorRegistry,artwork:Artwork):Artwork[]{const normalized=normalizeArtwork(clone(artwork),registry),items=loadArtworks(storage,registry),index=items.findIndex(item=>item.id===normalized.id);if(index<0)items.push(normalized);else items[index]=normalized;storage.setItem(ARTWORK_STORAGE_KEY,JSON.stringify(items));return items;}
export function deleteArtwork(storage:WriteStorage,registry:GeneratorRegistry,id:string):boolean{const items=loadArtworks(storage,registry),next=items.filter(item=>item.id!==id);if(next.length===items.length)return false;storage.setItem(ARTWORK_STORAGE_KEY,JSON.stringify(next));return true;}
export function duplicateArtwork(storage:WriteStorage,registry:GeneratorRegistry,id:string,idFactory:()=>string=createId):Artwork|undefined{const source=loadArtworks(storage,registry).find(item=>item.id===id);if(!source)return;const copy=clone(source);copy.id=idFactory();copy.name=`${source.name} Copy`;copy.layers=copy.layers.map(layer=>({...layer,id:idFactory(),effects:layer.effects.map(effect=>({...effect,id:idFactory()})),mask:layer.mask?{...layer.mask,id:idFactory()}:null}));saveArtwork(storage,registry,copy);return copy;}
export function loadAutosave(storage:ReadStorage,registry:GeneratorRegistry):Artwork|undefined{try{return parseArtwork(JSON.parse(storage.getItem(AUTOSAVE_STORAGE_KEY)||'null'),registry)}catch{return}}
export function migratePresetToArtwork(preset:Preset,registry:GeneratorRegistry,idFactory:()=>string=createId):Artwork|undefined{const generator=registry.get(preset.generator);if(!generator)return;const artwork=createArtwork(preset.name,idFactory),layer=createLayer(generator,preset.seed,preset.palette,idFactory);layer.parameters={...layer.parameters,...preset.params};artwork.layers=[layer];if(preset.backgroundMode)artwork.background.mode=preset.backgroundMode;artwork.background.color=preset.palette.background;return normalizeArtwork(artwork,registry);}

export class ArtworkAutosave{#timer:ReturnType<typeof setTimeout>|undefined;#pending:Artwork|undefined;constructor(private readonly storage:Pick<Storage,'getItem'|'setItem'>,private readonly registry:GeneratorRegistry,private readonly delay=500){}schedule(artwork:Artwork){this.#pending=clone(artwork);if(this.#timer)clearTimeout(this.#timer);this.#timer=setTimeout(()=>this.flush(),this.delay);}flush(){if(!this.#pending)return;this.storage.setItem(AUTOSAVE_STORAGE_KEY,JSON.stringify(normalizeArtwork(this.#pending,this.registry)));this.#pending=undefined;this.#timer=undefined;}cancel(){if(this.#timer)clearTimeout(this.#timer);this.#timer=undefined;this.#pending=undefined;}}
