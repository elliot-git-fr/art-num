import type { Generator, RenderContext } from '../types';
import { effectiveCount } from '../core/performance';
import { hexToRgba } from '../random';
import { num, slider } from './shared';

type State = { x: Float32Array; y: Float32Array; vx: Float32Array; vy: Float32Array; r: Float32Array };

export const metaballs: Generator = {
  id: 'metaballs', name: 'Metaballs', icon: '●', description: 'Liquid fields merge and separate into luminous organic bodies.',
  category: 'Organic', tags: ['metaballs', 'implicit-surface', 'liquid'], renderer: 'canvas2d', defaultPreset: 'Liquid Light',
  capabilities: { animated: true, interactive: false, deterministic: true, exportable: true },
  params: [slider('count','Ball count',10,2,60,1,[5,24],'Geometry','high',30), slider('size','Ball size',58,12,140,1,[30,90]), slider('speed','Speed',.65,.05,2,.05,[.2,1.2],'Motion'), slider('threshold','Threshold',1.05,.3,3,.01,[.65,1.7]), slider('smoothness','Smoothness',.8,.1,2,.05,[.4,1.3],'Style'), slider('resolution','Pixel size',6,2,16,1,[4,10],'Style','high')],
  init: (c: RenderContext) => {
    const count=effectiveCount(num(c.params.count),30,c.quality); const s:State={x:new Float32Array(count),y:new Float32Array(count),vx:new Float32Array(count),vy:new Float32Array(count),r:new Float32Array(count)};
    for(let i=0;i<count;i++){s.x[i]=c.random()*c.width;s.y[i]=c.random()*c.height;s.vx[i]=(c.random()-.5)*2;s.vy[i]=(c.random()-.5)*2;s.r[i]=num(c.params.size)*(.55+c.random()*.9);} return s;
  },
  render: (c, raw) => {
    const s=raw as State,speed=num(c.params.speed);
    for(let i=0;i<s.x.length;i++){s.x[i]+=s.vx[i]*speed;s.y[i]+=s.vy[i]*speed;if(s.x[i]<0||s.x[i]>c.width)s.vx[i]*=-1;if(s.y[i]<0||s.y[i]>c.height)s.vy[i]*=-1;s.x[i]=Math.max(0,Math.min(c.width,s.x[i]));s.y[i]=Math.max(0,Math.min(c.height,s.y[i]));}
    const step=Math.max(2,num(c.params.resolution)/c.quality.resolutionScale),threshold=num(c.params.threshold),colors=[c.palette.secondary,c.palette.primary,c.palette.accent];
    for(let y=0;y<c.height;y+=step)for(let x=0;x<c.width;x+=step){let field=0;for(let i=0;i<s.x.length;i++){const dx=x-s.x[i],dy=y-s.y[i];field+=s.r[i]*s.r[i]/Math.max(20,dx*dx+dy*dy);}if(field>threshold){const intensity=Math.min(1,(field-threshold)*num(c.params.smoothness));c.ctx.fillStyle=hexToRgba(colors[Math.min(2,Math.floor(intensity*3))],.35+intensity*.65);c.ctx.fillRect(x,y,step+.5,step+.5);}}
  },
  elementCount:(p,q)=>q?effectiveCount(num(p.count),30,q):num(p.count)
};
