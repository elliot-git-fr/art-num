export interface PausableEngine { readonly running:boolean; pause():void; resume():void; }

export class VisibilityPauseController {
  #pausedByVisibility=false;
  constructor(private readonly engine:PausableEngine,private readonly resetTiming:()=>void){}
  handle(hidden:boolean):void{
    if(hidden&&this.engine.running){this.#pausedByVisibility=true;this.engine.pause();}
    else if(!hidden&&this.#pausedByVisibility){this.#pausedByVisibility=false;this.resetTiming();this.engine.resume();}
  }
}
