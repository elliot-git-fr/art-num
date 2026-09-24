import './style.css';
import './theme.css';
import './responsive.css';
import { generatorRegistry, generators } from './generators';
import { palettes } from './palettes';
import { hexToRgba, mulberry32 } from './random';
import type { Generator, Palette, ParamValues, Preset, RenderContext } from './types';
import { AnimationEngine } from './core/animation-engine';
import { defaultParameters, randomizeParameters, sanitizeParameters } from './core/parameters';
import { loadPresets, savePreset } from './core/presets';
import { applyTheme, initialTheme, oppositeTheme, syncCanvasBackground, type ArtworkBackgroundMode, type Theme } from './core/theme';
import { downloadCanvas } from './core/export';
import { destroyGenerator, initializeGenerator, resetGenerator } from './core/generator-lifecycle';
import { calculateCanvasSize, layoutMode } from './core/responsive';
import { PointerTracker } from './core/pointer';
import { AdaptiveQualityController, PerformanceMonitor, createExportQuality, type PerformanceSnapshot } from './core/performance';
import { VisibilityPauseController } from './core/visibility';

const defaults: Preset[] = [
  { name:'Nebula', generator:'particles', seed:48291, params:{count:430,size:1.2,speed:.5,direction:-8,randomness:.72,noiseScale:.006,noiseStrength:1.35,trail:.08,opacity:.65,connection:58,mouse:true}, palette:palettes[4] },
  { name:'Electric Field', generator:'flow', seed:9137, params:{density:46,scale:.017,length:22,weight:.65,speed:.3,twist:3.2}, palette:palettes[0] },
  { name:'Ocean', generator:'waves', seed:31102, params:{lines:35,amplitude:28,frequency:1.6,speed:.38,weight:.8,spread:10}, palette:palettes[2] },
  { name:'Solar', generator:'circles', seed:70241, params:{rings:58,spacing:7,distortion:28,lobes:7,speed:.22,weight:.75}, palette:palettes[1] },
];

const app = document.querySelector<HTMLDivElement>('#app')!;
let theme: Theme = initialTheme({ storage: localStorage, prefersDark: () => matchMedia('(prefers-color-scheme: dark)').matches });
applyTheme(theme, document.documentElement, localStorage);
app.innerHTML = `
  <div class="studio">
    <header class="topbar">
      <button class="brand" data-action="about" aria-label="About Generative Art Studio"><span class="brand-mark">G</span><span>Generative <b>Art Studio</b></span></button>
      <div class="transport">
        <button class="icon-button" data-action="restart" title="Restart">↺</button>
        <button class="play-button" data-action="play" title="Play / pause"><span class="play-icon">Ⅱ</span></button>
        <button class="icon-button" data-action="randomize" title="Randomize">⌁</button>
      </div>
      <div class="top-actions">
        <button class="icon-button" data-action="debug" title="Performance panel">▥</button>
        <button class="icon-button theme-button" data-action="theme" title="Switch theme">☼</button>
        <button class="text-button" data-action="export">Export</button>
        <button class="text-button" data-action="save">Save preset</button>
        <button class="icon-button" data-action="fullscreen" title="Fullscreen">↗</button>
      </div>
    </header>
    <aside class="sidebar left-panel">
      <div class="panel-heading"><span>GENERATORS</span><button class="mini-button" title="Collapse">−</button></div>
      <div class="generator-list"></div>
      <div class="sidebar-bottom">
        <div class="panel-heading"><span>PRESETS</span></div>
        <div class="preset-list"></div>
      </div>
    </aside>
    <main class="stage">
      <div class="canvas-wrap">
        <canvas id="art-canvas"></canvas>
        <div class="canvas-vignette"></div>
        <div class="canvas-label"><span class="live-dot"></span><span class="art-title">UNTITLED STUDY</span></div>
        <div class="stats"><span class="fps">60 FPS</span><i></i><span class="elements">0 ELEMENTS</span></div>
        <div class="performance-panel" hidden><b>PERFORMANCE</b><dl><dt>FPS AVG</dt><dd data-metric="fps">60</dd><dt>FRAME</dt><dd data-metric="frame">16.7 MS</dd><dt>STATE</dt><dd data-metric="state">EXCELLENT</dd><dt>GENERATOR</dt><dd data-metric="generator">PARTICLES</dd><dt>RENDERER</dt><dd data-metric="renderer">CANVAS2D</dd><dt>ELEMENTS</dt><dd data-metric="elements">0</dd><dt>DPR</dt><dd data-metric="dpr">1×</dd><dt>PREVIEW</dt><dd data-metric="quality">HIGH</dd></dl></div>
        <div class="hint">MOVE YOUR CURSOR TO INTERACT</div>
      </div>
    </main>
    <aside class="sidebar right-panel">
      <div class="inspector-head"><div><span class="eyebrow">ACTIVE SYSTEM</span><h1 class="active-name">Particles</h1></div><button class="mini-button" data-action="reset-params" title="Reset parameters">↺</button></div>
      <p class="description"></p>
      <div class="parameters"></div>
      <section class="palette-section">
        <div class="section-title"><span>COLOR SYSTEM</span><button data-action="random-palette">RANDOMIZE</button></div>
        <div class="palette-fields"></div>
        <div class="palette-presets"></div>
      </section>
      <section class="seed-section">
        <div class="section-title"><span>SEED</span></div>
        <div class="seed-control"><code class="seed-value"></code><button data-action="copy-seed" title="Copy seed">▢</button><button data-action="new-seed" title="New seed">↻</button></div>
      </section>
      <section class="performance-settings"><div class="section-title"><span>PERFORMANCE</span></div><button data-action="adaptive-quality">Adaptive quality <b>ON</b></button><button data-action="preview-quality">Preview quality <b>AUTO</b></button><button data-action="toggle-fps">FPS indicator <b>ON</b></button></section>
    </aside>
    <button class="drawer-backdrop" data-action="close-panel" aria-label="Close panel"></button>
    <nav class="mobile-nav" aria-label="Studio panels">
      <button data-panel="art" aria-label="Art" aria-expanded="false"><span>✦</span>Art</button>
      <button data-panel="parameters" aria-label="Parameters" aria-expanded="false"><span>⌁</span>Parameters</button>
      <button data-panel="colors" aria-label="Colors" aria-expanded="false"><span>◉</span>Colors</button>
      <button data-panel="presets" aria-label="Presets" aria-expanded="false"><span>▦</span>Presets</button>
    </nav>
    <div class="toast"></div>
  </div>`;

const canvas = document.querySelector<HTMLCanvasElement>('#art-canvas')!;
const ctx = canvas.getContext('2d', { alpha: false })!;
let active: Generator = generators[0];
let params: ParamValues = getDefaults(active);
let backgroundMode: ArtworkBackgroundMode = 'auto';
let palette: Palette = syncCanvasBackground({ ...palettes[0] }, backgroundMode, theme);
let seed = 48291;
let frame = 0;
let started = performance.now();
let generatorState: unknown;
let needsReset = true;
const pointerTracker = new PointerTracker();
let fps = 60;
let mobilePanel: string | null = null;
const performanceMonitor=new PerformanceMonitor();
const adaptiveQuality=new AdaptiveQualityController(true,'auto');
let renderQuality=adaptiveQuality.quality;
let performanceSnapshot:PerformanceSnapshot=performanceMonitor.snapshot();
let showFps=true;

function getDefaults(generator: Generator): ParamValues { return defaultParameters(generator); }
function query<T extends Element>(selector:string) { return document.querySelector<T>(selector)!; }

function resize() {
  const box = canvas.parentElement!.getBoundingClientRect();
  const size = calculateCanvasSize(box.width,box.height,devicePixelRatio,renderQuality.dprLimit);
  canvas.width=size.pixelWidth;canvas.height=size.pixelHeight;
  canvas.style.width=`${size.cssWidth}px`;canvas.style.height=`${size.cssHeight}px`;
  ctx.setTransform(size.pixelRatio,0,0,size.pixelRatio,0,0);needsReset=true;
  const mode=layoutMode(window.innerWidth,window.innerHeight);query<HTMLElement>('.studio').dataset.layout=mode;
  if(mode==='desktop'||mode==='large-desktop'||mode==='tablet-landscape')setMobilePanel(null);
}

function setMobilePanel(panel:string|null){mobilePanel=panel;const studio=query<HTMLElement>('.studio');if(panel)studio.dataset.panel=panel;else delete studio.dataset.panel;document.querySelectorAll<HTMLButtonElement>('.mobile-nav button').forEach(button=>button.setAttribute('aria-expanded',String(button.dataset.panel===panel)));if(panel==='colors')requestAnimationFrame(()=>query('.palette-section').scrollIntoView({block:'start'}));if(panel==='presets')requestAnimationFrame(()=>query('.sidebar-bottom').scrollIntoView({block:'start'}));}

function renderGenerators() {
  const categories = new Map<string, Generator[]>();
  generators.forEach(generator => categories.set(generator.category, [...(categories.get(generator.category) || []), generator]));
  query('.generator-list').innerHTML = [...categories].map(([category, items]) => `<div class="generator-category"><div class="category-label">${category}</div>${items.map(g => `<button class="generator-item ${g.id===active.id?'active':''}" data-generator="${g.id}"><span class="gen-icon">${g.icon}</span><span>${g.name}</span><small>${String(generators.indexOf(g)+1).padStart(2,'0')}</small></button>`).join('')}</div>`).join('');
}

function renderPresets() {
  const user = loadPresets(localStorage, generatorRegistry);
  query('.preset-list').innerHTML = [...defaults,...user].map((p,i)=>`<button class="preset-item" data-preset="${i}"><span class="preset-swatch" style="--p:${p.palette.primary};--s:${p.palette.secondary}"></span><span>${escapeHtml(p.name)}</span></button>`).join('');
}

function renderParameters() {
  query('.active-name').textContent = active.name;
  query('.description').textContent = active.description;
  const groups = new Map<string, typeof active.params>();
  for(const def of active.params){ const group=def.group||'Geometry'; groups.set(group,[...(groups.get(group)||[]),def]); }
  query('.parameters').innerHTML = [...groups].map(([group,defs])=>`<section class="param-group"><div class="group-title">${group.toUpperCase()}</div>${defs.map(def=>{
    const val=params[def.key];
    if(def.type==='button') return `<button class="parameter-command" data-action="generator-command" data-command="${def.key}">${def.label}</button>`;
    if(def.type==='toggle') return `<label class="control toggle-control"><span>${def.label}</span><input type="checkbox" data-param="${def.key}" ${val?'checked':''}><i></i></label>`;
    if(def.type==='select') return `<label class="control"><span>${def.label}</span><select data-param="${def.key}">${def.options?.map(o=>`<option value="${o.value}" ${o.value===val?'selected':''}>${o.label}</option>`)}</select></label>`;
    const warning=def.recommendedMax!==undefined&&Number(val)>def.recommendedMax;return `<label class="control range-control ${warning?'performance-warning':''}" title="${warning?`Recommended maximum: ${def.recommendedMax}`:''}"><span>${def.label}${def.performanceCost==='high'?'<i>HIGH COST</i>':''}</span><output>${formatValue(val)}</output><input type="range" data-param="${def.key}" min="${def.min}" max="${def.max}" step="${def.step}" value="${val}"></label>`;
  }).join('')}</section>`).join('');
}

function renderPalette() {
  const fields:[keyof Palette,string][]=[['background','Background'],['primary','Primary'],['secondary','Secondary'],['accent','Accent']];
  query('.palette-fields').innerHTML=fields.map(([key,label])=>`<label><span>${label}${key==='background'?` <button type="button" class="background-mode" data-action="background-mode">${backgroundMode.toUpperCase()}</button>`:''}</span><input type="color" data-color="${key}" value="${palette[key]}" ${key==='background'&&backgroundMode==='auto'?'disabled':''}><code>${palette[key].toUpperCase()}</code></label>`).join('');
  query('.palette-presets').innerHTML=palettes.map((p,i)=>`<button data-palette="${i}" title="${p.name}" style="--bg:${p.background};--p:${p.primary};--s:${p.secondary};--a:${p.accent}"></button>`).join('');
  query('.seed-value').textContent=String(seed).padStart(8,'0');
}

function reset() { frame=0; started=performance.now(); needsReset=true; animationEngine.reset(); }
function makeContext(now:number, delta:number):RenderContext { const cssWidth=Math.max(1,canvas.getBoundingClientRect().width);const ratio=canvas.width/cssWidth;return {renderer:'canvas2d',ctx,width:canvas.width/ratio,height:canvas.height/ratio,time:now-started,delta,frame,seed,pointer:pointerTracker.state,quality:renderQuality,params,palette,random:mulberry32(seed)}; }

function animate(now:number, delta:number) {
  performanceSnapshot=performanceMonitor.record(delta);fps=performanceSnapshot.averageFps;
  const c=makeContext(now,delta);
  if(needsReset){ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle=palette.background;ctx.fillRect(0,0,canvas.width,canvas.height);const renderRatio=canvas.width/Math.max(1,c.width);ctx.setTransform(renderRatio,0,0,renderRatio,0,0);generatorState=generatorState===undefined?initializeGenerator(active,c):resetGenerator(active,c,generatorState);needsReset=false;}
  ctx.save();
  if(active.id==='particles'||active.id==='boids'){ctx.fillStyle=hexToRgba(palette.background,Math.max(.025,Number(params.trail)));ctx.fillRect(0,0,c.width,c.height)}else{ctx.fillStyle=palette.background;ctx.fillRect(0,0,c.width,c.height)}
  active.render(c,generatorState); ctx.restore(); frame++;
  if(frame%20===0){const previous=renderQuality;renderQuality=adaptiveQuality.update(performanceSnapshot.state);if(previous.level!==renderQuality.level){needsReset=true;resize();}updatePerformanceUi();}
}

function updatePerformanceUi(){const elements=Math.round(active.elementCount?.(params,renderQuality)||0);query('.fps').textContent=`${Math.round(Math.min(fps,99))} FPS`;query<HTMLElement>('.fps').style.display=showFps?'':'none';query('.elements').textContent=`${elements.toLocaleString()} ELEMENTS`;const values:Record<string,string>={fps:String(Math.round(performanceSnapshot.averageFps)),frame:`${performanceSnapshot.frameTime.toFixed(1)} MS`,state:performanceSnapshot.state.toUpperCase(),generator:active.name.toUpperCase(),renderer:active.renderer.toUpperCase(),elements:elements.toLocaleString(),dpr:`${Math.min(devicePixelRatio,renderQuality.dprLimit).toFixed(1)}×`,quality:renderQuality.level.toUpperCase()};for(const [key,value]of Object.entries(values))query(`[data-metric="${key}"]`).textContent=value;}

const animationEngine = new AnimationEngine(animate);
const visibilityPause=new VisibilityPauseController(animationEngine,()=>performanceMonitor.reset());

function selectGenerator(id:string){const found=generatorRegistry.get(id);if(!found)return;destroyGenerator(active,generatorState);generatorState=undefined;active=found;params=getDefaults(active);renderGenerators();renderParameters();reset();}
function randomize(){params=randomizeParameters(active,mulberry32(seed+frame+Date.now()));renderParameters();reset();toast('New variation generated');}
function applyPreset(preset:Preset){destroyGenerator(active,generatorState);generatorState=undefined;active=generatorRegistry.get(preset.generator)||generators[0];params=sanitizeParameters(active,preset.params);backgroundMode=preset.backgroundMode??'custom';palette=syncCanvasBackground({...preset.palette},backgroundMode,theme);seed=preset.seed;renderGenerators();renderParameters();renderPalette();reset();toast(`${preset.name} loaded`);}
function toast(message:string){const el=query('.toast');el.textContent=message;el.classList.add('show');window.setTimeout(()=>el.classList.remove('show'),1800)}
function formatValue(value:unknown){return typeof value==='number'&&!Number.isInteger(value)?value.toFixed(value<.1?3:2).replace(/0+$/,'').replace(/\.$/,''):String(value)}
function escapeHtml(s:string){const d=document.createElement('div');d.textContent=s;return d.innerHTML}

document.addEventListener('click',async event=>{const target=(event.target as HTMLElement).closest<HTMLElement>('button');if(!target)return;
  if(target.dataset.panel){setMobilePanel(mobilePanel===target.dataset.panel?null:target.dataset.panel);return;}
  if(target.dataset.generator)selectGenerator(target.dataset.generator);
  if(target.dataset.palette){backgroundMode='custom';palette={...palettes[Number(target.dataset.palette)]};renderPalette();reset();}
  if(target.dataset.preset){const all=[...defaults,...loadPresets(localStorage,generatorRegistry)];applyPreset(all[Number(target.dataset.preset)]);}
  const action=target.dataset.action;if(!action)return;
  if(action==='play'){if(animationEngine.running)animationEngine.pause();else animationEngine.resume();target.querySelector('.play-icon')!.textContent=animationEngine.running?'Ⅱ':'▶';}
  if(action==='about')toast('Generative Art Studio · Canvas 2D');
  if(action==='debug'){const panel=query<HTMLElement>('.performance-panel');panel.hidden=!panel.hidden;updatePerformanceUi();}
  if(action==='generator-command'&&active.command){generatorState=active.command(target.dataset.command||'',makeContext(performance.now(),0),generatorState);}
  if(action==='adaptive-quality'){adaptiveQuality.enabled=!adaptiveQuality.enabled;renderQuality=adaptiveQuality.quality;target.querySelector('b')!.textContent=adaptiveQuality.enabled?'ON':'OFF';reset();resize();}
  if(action==='preview-quality'){const modes=['auto','low','balanced','high'] as const;adaptiveQuality.preview=modes[(modes.indexOf(adaptiveQuality.preview)+1)%modes.length];renderQuality=adaptiveQuality.quality;target.querySelector('b')!.textContent=adaptiveQuality.preview.toUpperCase();reset();resize();}
  if(action==='toggle-fps'){showFps=!showFps;target.querySelector('b')!.textContent=showFps?'ON':'OFF';updatePerformanceUi();}
  if(action==='close-panel')setMobilePanel(null);
  if(action==='theme'){theme=oppositeTheme(theme);applyTheme(theme,document.documentElement,localStorage);palette=syncCanvasBackground(palette,backgroundMode,theme);renderPalette();reset();target.textContent=theme==='dark'?'☼':'☾';toast(`${theme==='dark'?'Dark':'Light'} mode`);}
  if(action==='background-mode'){backgroundMode=backgroundMode==='auto'?'custom':'auto';palette=syncCanvasBackground(palette,backgroundMode,theme);renderPalette();reset();toast(`Background ${backgroundMode}`);}
  if(action==='export'){const preview=renderQuality;renderQuality=createExportQuality();resize();reset();requestAnimationFrame(()=>{downloadCanvas(canvas,`${active.id}-${seed}.png`);renderQuality=preview;resize();reset();toast('Artwork exported at full quality');});}
  if(action==='restart')reset(); if(action==='randomize')randomize(); if(action==='reset-params'){params=getDefaults(active);renderParameters();reset();}
  if(action==='new-seed'){seed=Math.floor(Math.random()*99999999);renderPalette();reset();toast('New seed created');}
  if(action==='copy-seed'){await navigator.clipboard.writeText(String(seed));toast('Seed copied');}
  if(action==='random-palette'){backgroundMode='custom';palette={...palettes[Math.floor(Math.random()*palettes.length)]};renderPalette();reset();}
  if(action==='fullscreen'){if(!document.fullscreenElement)await query('.canvas-wrap').requestFullscreen();else await document.exitFullscreen();}
  if(action==='save'){const name=window.prompt('Name this preset',`Untitled ${active.name}`)?.trim();if(name){savePreset(localStorage,generatorRegistry,{name,generator:active.id,seed,params:{...params},palette:{...palette},backgroundMode});renderPresets();toast('Preset saved locally');}}
});
document.addEventListener('input',event=>{const input=event.target as HTMLInputElement;if(input.dataset.param){const def=active.params.find(p=>p.key===input.dataset.param)!;params[def.key]=def.type==='toggle'?input.checked:def.type==='slider'?Number(input.value):input.value;const out=input.parentElement?.querySelector('output');if(out)out.textContent=formatValue(params[def.key]);const warning=def.recommendedMax!==undefined&&Number(params[def.key])>def.recommendedMax;input.parentElement?.classList.toggle('performance-warning',warning);needsReset=Boolean(active.init); }if(input.dataset.color){if(input.dataset.color==='background')backgroundMode='custom';palette={...palette,[input.dataset.color]:input.value};const code=input.parentElement?.querySelector('code');if(code)code.textContent=input.value.toUpperCase();reset();}});
const updatePointer=(event:PointerEvent)=>pointerTracker.update(event,canvas.getBoundingClientRect());
canvas.addEventListener('pointerdown',event=>{canvas.setPointerCapture?.(event.pointerId);updatePointer(event);});
canvas.addEventListener('pointermove',updatePointer);
canvas.addEventListener('pointerup',event=>pointerTracker.release(event,canvas.getBoundingClientRect()));
canvas.addEventListener('pointercancel',()=>pointerTracker.leave());canvas.addEventListener('pointerleave',()=>pointerTracker.leave());
const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(canvas.parentElement!);
window.addEventListener('resize',resize);
const onVisibilityChange=()=>visibilityPause.handle(document.hidden);document.addEventListener('visibilitychange',onVisibilityChange);
window.addEventListener('beforeunload',()=>{resizeObserver.disconnect();window.removeEventListener('resize',resize);document.removeEventListener('visibilitychange',onVisibilityChange);animationEngine.destroy();destroyGenerator(active,generatorState);});
query<HTMLButtonElement>('.theme-button').textContent=theme==='dark'?'☼':'☾';
renderGenerators();renderPresets();renderParameters();renderPalette();resize();animationEngine.start();
