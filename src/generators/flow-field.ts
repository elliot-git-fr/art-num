import type { Generator } from '../types';
import { hexToRgba, noise } from '../random';
import { slider, num, line } from './shared';

export const flowField: Generator = {
  id: 'flow', name: 'Flow Field', icon: '≋', description: 'Lines guided by an evolving noise field.',
  params: [slider('density','Field density',38,12,78,1,[20,55]), slider('scale','Noise scale',.012,.002,.04,.001,[.005,.025]), slider('length','Stroke length',17,3,42,1,[8,30]), slider('weight','Line weight',.7,.2,3,.1,[.35,1.5],'Style'), slider('speed','Evolution',.22,0,1,.01,[.05,.55],'Motion'), slider('twist','Twist',2.1,.5,6,.1,[1,4],'Motion')],
  render: c => { const gap = Math.max(8, Math.min(c.width,c.height) / num(c.params.density)); c.ctx.lineWidth=num(c.params.weight); c.ctx.lineCap='round'; for(let y=gap/2;y<c.height;y+=gap) for(let x=gap/2;x<c.width;x+=gap){ const n=noise(x*num(c.params.scale),y*num(c.params.scale)+c.time*.00015*num(c.params.speed),c.seed); const a=n*Math.PI*num(c.params.twist); const l=num(c.params.length)*(0.45+n*.75); c.ctx.strokeStyle=hexToRgba(n>.58?c.palette.accent:c.palette.primary,.12+n*.62); line(c.ctx,x-Math.cos(a)*l/2,y-Math.sin(a)*l/2,x+Math.cos(a)*l/2,y+Math.sin(a)*l/2); } },
  elementCount: p => num(p.density) ** 2
};
