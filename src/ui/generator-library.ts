import type {Generator,GeneratorCategory} from '../types';
export const FAVORITES_KEY='gas-generator-favorites';
export const RECENTS_KEY='gas-generator-recents';
type StorageLike=Pick<Storage,'getItem'|'setItem'>;
export function filterGenerators(items:Generator[],query='',category:'All'|GeneratorCategory='All',favorites:string[]=[]){const needle=query.trim().toLowerCase();return items.filter(item=>(category==='All'||item.category===category)&&(!needle||`${item.name} ${item.description} ${item.tags.join(' ')}`.toLowerCase().includes(needle))&&(!favorites.length||true));}
function read(storage:Pick<Storage,'getItem'>,key:string){try{const value=JSON.parse(storage.getItem(key)||'[]');return Array.isArray(value)?value.filter(item=>typeof item==='string'):[]}catch{return[]}}
export const loadFavorites=(storage:Pick<Storage,'getItem'>)=>read(storage,FAVORITES_KEY);
export function toggleFavorite(storage:StorageLike,id:string){const values=loadFavorites(storage),next=values.includes(id)?values.filter(item=>item!==id):[...values,id];storage.setItem(FAVORITES_KEY,JSON.stringify(next));return next;}
export const loadRecents=(storage:Pick<Storage,'getItem'>)=>read(storage,RECENTS_KEY);
export function rememberGenerator(storage:StorageLike,id:string,limit=5){const next=[id,...loadRecents(storage).filter(item=>item!==id)].slice(0,limit);storage.setItem(RECENTS_KEY,JSON.stringify(next));return next;}
