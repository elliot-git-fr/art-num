export class SnapshotHistory<T>{
  #past:T[]=[];#future:T[]=[];#current:T;#group:string|null=null;
  constructor(initial:T,private readonly limit=80){this.#current=structuredClone(initial)}
  get canUndo(){return this.#past.length>0}get canRedo(){return this.#future.length>0}
  commit(value:T,group:string|null=null){const next=structuredClone(value);if(JSON.stringify(next)===JSON.stringify(this.#current))return false;if(group&&group===this.#group)this.#current=next;else{this.#past.push(this.#current);if(this.#past.length>this.limit)this.#past.shift();this.#current=next;}this.#group=group;this.#future=[];return true}
  endGroup(){this.#group=null}
  undo(){const previous=this.#past.pop();if(!previous)return;this.#future.push(this.#current);this.#current=previous;this.#group=null;return structuredClone(this.#current)}
  redo(){const next=this.#future.pop();if(!next)return;this.#past.push(this.#current);this.#current=next;this.#group=null;return structuredClone(this.#current)}
  reset(value:T){this.#past=[];this.#future=[];this.#current=structuredClone(value);this.#group=null}
}
