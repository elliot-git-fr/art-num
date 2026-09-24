import './style.css';
import './theme.css';
import './responsive.css';
import { generatorRegistry, generators } from './generators';
import { palettes } from './palettes';
import { mulberry32 } from './random';
import type { Generator, Palette, ParamValues, Preset, RenderContext } from './types';
import { AnimationEngine } from './core/animation-engine';
import { defaultParameters, randomizeParameters, sanitizeParameters } from './core/parameters';
import { loadPresets, savePreset } from './core/presets';
import { applyTheme, initialTheme, oppositeTheme, syncCanvasBackground, type ArtworkBackgroundMode, type Theme } from './core/theme';
import { downloadCanvas } from './core/export';
import { calculateCanvasSize, layoutMode } from './core/responsive';
import { PointerTracker } from './core/pointer';
import { AdaptiveQualityController, PerformanceMonitor, createExportQuality, type PerformanceSnapshot } from './core/performance';
import { VisibilityPauseController } from './core/visibility';
import { createArtwork,createLayer,type BlendMode } from './core/artwork';
import { LayerManager } from './core/layer-manager';
import { Compositor } from './core/compositor';
import { allocateLayerQualities } from './core/layer-performance';
import { ArtworkAutosave,deleteArtwork,duplicateArtwork,loadArtworks,loadAutosave,saveArtwork } from './core/artwork-storage';

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
      <section class="layers-panel"><div class="panel-heading"><span>LAYERS</span><button data-action="add-layer" class="mini-button" aria-label="Add Layer">+</button></div><div class="artwork-actions"><select class="artwork-select" aria-label="Saved artworks"><option value="">Saved artworks</option></select><button data-action="new-artwork" aria-label="New Artwork">New</button><button data-action="save-artwork" aria-label="Save Artwork">Save</button><button data-action="duplicate-artwork" aria-label="Duplicate Artwork">Copy</button><button data-action="delete-artwork" aria-label="Delete Artwork">Delete</button></div><div class="add-layer-row" hidden><select class="add-layer-select" aria-label="Layer generator"></select><button data-action="confirm-add-layer">Add</button></div><div class="layers-list"></div></section>
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
        <div class="performance-panel" hidden><b>PERFORMANCE</b><dl><dt>FPS AVG</dt><dd data-metric="fps">60</dd><dt>FRAME</dt><dd data-metric="frame">16.7 MS</dd><dt>STATE</dt><dd data-metric="state">EXCELLENT</dd><dt>GENERATOR</dt><dd data-metric="generator">PARTICLES</dd><dt>RENDERER</dt><dd data-metric="renderer">CANVAS2D</dd><dt>ELEMENTS</dt><dd data-metric="elements">0</dd><dt>DPR</dt><dd data-metric="dpr">1×</dd><dt>PREVIEW</dt><dd data-metric="quality">HIGH</dd></dl><div class="layer-metrics" aria-label="Layer render costs"></div></div>
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
      <button data-panel="layers" aria-label="Layers" aria-expanded="false"><span>▤</span>Layers</button>
      <button data-panel="parameters" aria-label="Parameters" aria-expanded="false"><span>⌁</span>Parameters</button>
      <button data-panel="colors" aria-label="Colors" aria-expanded="false"><span>◉</span>Colors</button>
      <button data-panel="presets" aria-label="Presets" aria-expanded="false"><span>▦</span>Presets</button>
    </nav>
    <div class="toast"></div>
  </div>`;

const canvas = document.querySelector<HTMLCanvasElement>('#art-canvas')!;
const ctx = canvas.getContext('2d', { alpha: false })!;
let artwork=loadAutosave(localStorage,generatorRegistry)??createArtwork();if(!artwork.layers.length){artwork.background={mode:'auto',color:syncCanvasBackground({background:palettes[0].background},'auto',theme).background};artwork.layers=[createLayer(generators[0],48291,palettes[0])];}
const layerManager=new LayerManager(artwork);
const compositor=new Compositor(generatorRegistry);
const autosave=new ArtworkAutosave(localStorage,generatorRegistry);
let active: Generator = generators[0];
let params: ParamValues = layerManager.selectedLayer!.parameters;
let backgroundMode: ArtworkBackgroundMode = artwork.background.mode;
let palette: Palette = layerManager.selectedLayer!.palette;
let seed = layerManager.selectedLayer!.seed;
let frame = 0;
let started = performance.now();
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
  ctx.setTransform(size.pixelRatio,0,0,size.pixelRatio,0,0);
  const mode=layoutMode(window.innerWidth,window.innerHeight);query<HTMLElement>('.studio').dataset.layout=mode;
  if(mode==='desktop'||mode==='large-desktop'||mode==='tablet-landscape')setMobilePanel(null);
}

function setMobilePanel(panel:string|null){mobilePanel=panel;const studio=query<HTMLElement>('.studio');if(panel)studio.dataset.panel=panel;else delete studio.dataset.panel;document.querySelectorAll<HTMLButtonElement>('.mobile-nav button').forEach(button=>button.setAttribute('aria-expanded',String(button.dataset.panel===panel)));if(panel==='colors')requestAnimationFrame(()=>query('.palette-section').scrollIntoView({block:'start'}));if(panel==='presets')requestAnimationFrame(()=>query('.sidebar-bottom').scrollIntoView({block:'start'}));}

function renderGenerators() {
  const categories = new Map<string, Generator[]>();
  generators.forEach(generator => categories.set(generator.category, [...(categories.get(generator.category) || []), generator]));
  query('.generator-list').innerHTML = [...categories].map(([category, items]) => `<div class="generator-category"><div class="category-label">${category}</div>${items.map(g => `<button class="generator-item ${g.id===active.id?'active':''}" data-generator="${g.id}"><span class="gen-icon">${g.icon}</span><span>${g.name}</span><small>${String(generators.indexOf(g)+1).padStart(2,'0')}</small></button>`).join('')}</div>`).join('');
}

const blendModes:BlendMode[]=['normal','multiply','screen','overlay','darken','lighten','color-dodge','color-burn','hard-light','soft-light','difference','exclusion'];
function syncSelectedLayer(){const layer=layerManager.selectedLayer;if(!layer)return;active=generatorRegistry.get(layer.generatorId)||generators[0];params=layer.parameters;palette=layer.palette;seed=layer.seed;renderGenerators();renderParameters();renderPalette();renderLayers();}
function renderLayers(){query<HTMLSelectElement>('.add-layer-select').innerHTML=generators.map(g=>`<option value="${g.id}">${g.name}</option>`).join('');query('.layers-list').innerHTML=[...layerManager.artwork.layers].reverse().map(layer=>`<article class="layer-item ${layer.id===layerManager.selectedLayerId?'active':''}" data-layer-id="${layer.id}"><button class="layer-select" data-layer-action="select"><b>${escapeHtml(layer.name)}</b><small>${generatorRegistry.get(layer.generatorId)?.name||layer.generatorId}</small></button><div class="layer-actions"><button data-layer-action="visible" aria-label="${layer.visible?'Hide':'Show'} ${escapeHtml(layer.name)}">${layer.visible?'◉':'○'}</button><button data-layer-action="lock" aria-label="${layer.locked?'Unlock':'Lock'} ${escapeHtml(layer.name)}">${layer.locked?'▣':'▢'}</button><button data-layer-action="solo" aria-label="Solo ${escapeHtml(layer.name)}" class="${layerManager.soloLayerId===layer.id?'active':''}">S</button><button data-layer-action="rename" aria-label="Rename ${escapeHtml(layer.name)}">✎</button><button data-layer-action="up" aria-label="Move up ${escapeHtml(layer.name)}">↑</button><button data-layer-action="down" aria-label="Move down ${escapeHtml(layer.name)}">↓</button><button data-layer-action="duplicate" aria-label="Duplicate ${escapeHtml(layer.name)}">⧉</button><button data-layer-action="delete" aria-label="Delete ${escapeHtml(layer.name)}">×</button></div><div class="layer-composite"><label>Opacity <input data-layer-opacity type="range" min="0" max="1" step=".01" value="${layer.opacity}" ${layer.locked?'disabled':''}></label><select data-layer-blend aria-label="Blend mode ${escapeHtml(layer.name)}" ${layer.locked?'disabled':''}>${blendModes.map(mode=>`<option value="${mode}" ${mode===layer.blendMode?'selected':''}>${mode}</option>`).join('')}</select></div></article>`).join('');}
function renderArtworkLibrary(){const select=query<HTMLSelectElement>('.artwork-select'),items=loadArtworks(localStorage,generatorRegistry);select.innerHTML=`<option value="">Saved artworks</option>${items.map(item=>`<option value="${item.id}" ${item.id===artwork.id?'selected':''}>${escapeHtml(item.name)}</option>`).join('')}`;}

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
  query('.palette-fields').innerHTML=fields.map(([key,label])=>{const value=key==='background'?artwork.background.color:palette[key];return `<label><span>${label}${key==='background'?` <button type="button" class="background-mode" data-action="background-mode">${backgroundMode.toUpperCase()}</button>`:''}</span><input type="color" data-color="${key}" value="${value}" ${key==='background'&&backgroundMode==='auto'?'disabled':''}><code>${value.toUpperCase()}</code></label>`}).join('');
  query('.palette-presets').innerHTML=palettes.map((p,i)=>`<button data-palette="${i}" title="${p.name}" style="--bg:${p.background};--p:${p.primary};--s:${p.secondary};--a:${p.accent}"></button>`).join('');
  query('.seed-value').textContent=String(seed).padStart(8,'0');
}

function reset() { frame=0; started=performance.now();if(layerManager.selectedLayerId)compositor.invalidate(layerManager.selectedLayerId);animationEngine.reset();autosave.schedule(artwork); }
function makeContext(now:number, delta:number):RenderContext { const cssWidth=Math.max(1,canvas.getBoundingClientRect().width);const ratio=canvas.width/cssWidth;return {renderer:'canvas2d',ctx,width:canvas.width/ratio,height:canvas.height/ratio,time:now-started,delta,frame,seed,pointer:pointerTracker.state,quality:renderQuality,params,palette,random:mulberry32(seed)}; }

function animate(now:number, delta:number) {
  performanceSnapshot=performanceMonitor.record(delta);fps=performanceSnapshot.averageFps;
  const c=makeContext(now,delta);const renderRatio=canvas.width/Math.max(1,c.width);
  const costs=new Map([...compositor.metrics].map(([id,metric])=>[id,metric.milliseconds]));const budgetLayers=layerManager.artwork.layers.map(layer=>({...layer,visible:layer.visible&&(!layerManager.soloLayerId||layer.id===layerManager.soloLayerId)}));const layerQualities=allocateLayerQualities(renderQuality,budgetLayers,costs,layerManager.selectedLayerId,performanceSnapshot.state);
  compositor.render(ctx,layerManager.artwork.layers,layerManager.soloLayerId,{width:c.width,height:c.height,pixelWidth:canvas.width,pixelHeight:canvas.height,dpr:renderRatio,time:c.time,delta,frame,pointer:pointerTracker.state,quality:renderQuality,layerQualities,background:artwork.background.color});frame++;
  if(frame%20===0){const previous=renderQuality;renderQuality=adaptiveQuality.update(performanceSnapshot.state);if(previous.level!==renderQuality.level)resize();updatePerformanceUi();}
}

function updatePerformanceUi(){const elements=Math.round(active.elementCount?.(params,renderQuality)||0);query('.fps').textContent=`${Math.round(Math.min(fps,99))} FPS`;query<HTMLElement>('.fps').style.display=showFps?'':'none';query('.elements').textContent=`${elements.toLocaleString()} ELEMENTS`;const values:Record<string,string>={fps:String(Math.round(performanceSnapshot.averageFps)),frame:`${performanceSnapshot.frameTime.toFixed(1)} MS`,state:performanceSnapshot.state.toUpperCase(),generator:active.name.toUpperCase(),renderer:active.renderer.toUpperCase(),elements:elements.toLocaleString(),dpr:`${Math.min(devicePixelRatio,renderQuality.dprLimit).toFixed(1)}×`,quality:renderQuality.level.toUpperCase()};for(const [key,value]of Object.entries(values))query(`[data-metric="${key}"]`).textContent=value;query('.layer-metrics').innerHTML=[...compositor.metrics.values()].map(metric=>{const layer=layerManager.artwork.layers.find(item=>item.id===metric.layerId);return layer?`<span>${escapeHtml(layer.name)} <b>${metric.milliseconds.toFixed(1)} ms</b></span>`:''}).join('');}

const animationEngine = new AnimationEngine(animate);
const visibilityPause=new VisibilityPauseController(animationEngine,()=>performanceMonitor.reset());

function selectGenerator(id:string){const found=generatorRegistry.get(id),layer=layerManager.selectedLayer;if(!found||!layer||layer.locked)return;layer.generatorId=found.id;layer.name=found.name;layer.parameters=getDefaults(found);active=found;params=layer.parameters;compositor.invalidate(layer.id);renderGenerators();renderParameters();renderLayers();reset();}
function randomize(){const layer=layerManager.selectedLayer;if(!layer||layer.locked)return;layer.parameters=randomizeParameters(active,mulberry32(seed+frame+Date.now()));params=layer.parameters;renderParameters();reset();toast('Layer randomized');}
function applyPreset(preset:Preset){const layer=layerManager.selectedLayer;if(!layer||layer.locked)return;active=generatorRegistry.get(preset.generator)||generators[0];layer.generatorId=active.id;layer.parameters=sanitizeParameters(active,preset.params);layer.palette={...preset.palette};layer.seed=preset.seed;params=layer.parameters;palette=layer.palette;seed=layer.seed;renderGenerators();renderParameters();renderPalette();renderLayers();reset();toast(`${preset.name} loaded`);}
function toast(message:string){const el=query('.toast');el.textContent=message;el.classList.add('show');window.setTimeout(()=>el.classList.remove('show'),1800)}
function formatValue(value:unknown){return typeof value==='number'&&!Number.isInteger(value)?value.toFixed(value<.1?3:2).replace(/0+$/,'').replace(/\.$/,''):String(value)}
function escapeHtml(s:string){const d=document.createElement('div');d.textContent=s;return d.innerHTML}

document.addEventListener('click',async event=>{const target=(event.target as HTMLElement).closest<HTMLElement>('button');if(!target)return;
  if(target.dataset.panel){setMobilePanel(mobilePanel===target.dataset.panel?null:target.dataset.panel);return;}
  const layerItem=target.closest<HTMLElement>('[data-layer-id]'),layerId=layerItem?.dataset.layerId,layerAction=target.dataset.layerAction;
  if(layerId&&layerAction){if(layerAction==='select')layerManager.selectLayer(layerId);if(layerAction==='visible'){const layer=layerManager.artwork.layers.find(l=>l.id===layerId)!;layerManager.setVisible(layerId,!layer.visible);}if(layerAction==='lock'){const layer=layerManager.artwork.layers.find(l=>l.id===layerId)!;layerManager.setLocked(layerId,!layer.locked);}if(layerAction==='solo')layerManager.setSolo(layerManager.soloLayerId===layerId?null:layerId);if(layerAction==='rename'){const layer=layerManager.artwork.layers.find(l=>l.id===layerId)!;const name=prompt('Layer name',layer.name);if(name)layerManager.renameLayer(layerId,name);}if(layerAction==='up')layerManager.moveLayer(layerId,1);if(layerAction==='down')layerManager.moveLayer(layerId,-1);if(layerAction==='duplicate')layerManager.duplicateLayer(layerId);if(layerAction==='delete')layerManager.removeLayer(layerId);syncSelectedLayer();reset();return;}
  if(target.dataset.generator)selectGenerator(target.dataset.generator);
  if(target.dataset.palette){const layer=layerManager.selectedLayer;if(!layer||layer.locked)return;layer.palette={...palettes[Number(target.dataset.palette)]};palette=layer.palette;renderPalette();reset();}
  if(target.dataset.preset){const all=[...defaults,...loadPresets(localStorage,generatorRegistry)];applyPreset(all[Number(target.dataset.preset)]);}
  const action=target.dataset.action;if(!action)return;
  if(action==='play'){if(animationEngine.running)animationEngine.pause();else animationEngine.resume();target.querySelector('.play-icon')!.textContent=animationEngine.running?'Ⅱ':'▶';}
  if(action==='about')toast('Generative Art Studio · Canvas 2D');
  if(action==='debug'){const panel=query<HTMLElement>('.performance-panel');panel.hidden=!panel.hidden;updatePerformanceUi();}
  if(action==='generator-command'&&layerManager.selectedLayer)compositor.command(layerManager.selectedLayer,target.dataset.command||'',makeContext(performance.now(),0));
  if(action==='add-layer')query<HTMLElement>('.add-layer-row').hidden=!query<HTMLElement>('.add-layer-row').hidden;
  if(action==='confirm-add-layer'){const generator=generatorRegistry.get(query<HTMLSelectElement>('.add-layer-select').value);if(generator){layerManager.addLayer(createLayer(generator,Math.floor(Math.random()*99999999),palettes[0]));syncSelectedLayer();reset();}}
  if(action==='new-artwork'){artwork=createArtwork();artwork.background={mode:'auto',color:syncCanvasBackground({background:palettes[0].background},'auto',theme).background};layerManager.replaceArtwork(artwork);renderArtworkLibrary();renderLayers();reset();toast('New artwork');}
  if(action==='save-artwork'){const name=prompt('Artwork name',artwork.name)?.trim();if(name){artwork.name=name;saveArtwork(localStorage,generatorRegistry,artwork);renderArtworkLibrary();toast('Artwork saved locally');}}
  if(action==='duplicate-artwork'){saveArtwork(localStorage,generatorRegistry,artwork);const copy=duplicateArtwork(localStorage,generatorRegistry,artwork.id);if(copy){artwork=copy;layerManager.replaceArtwork(artwork);syncSelectedLayer();renderArtworkLibrary();reset();toast('Artwork duplicated');}}
  if(action==='delete-artwork'){if(deleteArtwork(localStorage,generatorRegistry,artwork.id)){artwork=createArtwork();layerManager.replaceArtwork(artwork);renderArtworkLibrary();renderLayers();reset();toast('Artwork deleted');}}
  if(action==='adaptive-quality'){adaptiveQuality.enabled=!adaptiveQuality.enabled;renderQuality=adaptiveQuality.quality;target.querySelector('b')!.textContent=adaptiveQuality.enabled?'ON':'OFF';reset();resize();}
  if(action==='preview-quality'){const modes=['auto','low','balanced','high'] as const;adaptiveQuality.preview=modes[(modes.indexOf(adaptiveQuality.preview)+1)%modes.length];renderQuality=adaptiveQuality.quality;target.querySelector('b')!.textContent=adaptiveQuality.preview.toUpperCase();reset();resize();}
  if(action==='toggle-fps'){showFps=!showFps;target.querySelector('b')!.textContent=showFps?'ON':'OFF';updatePerformanceUi();}
  if(action==='close-panel')setMobilePanel(null);
  if(action==='theme'){theme=oppositeTheme(theme);applyTheme(theme,document.documentElement,localStorage);if(backgroundMode==='auto')artwork.background.color=syncCanvasBackground({background:artwork.background.color},'auto',theme).background;renderPalette();reset();target.textContent=theme==='dark'?'☼':'☾';toast(`${theme==='dark'?'Dark':'Light'} mode`);}
  if(action==='background-mode'){backgroundMode=backgroundMode==='auto'?'custom':'auto';artwork.background.mode=backgroundMode;if(backgroundMode==='auto')artwork.background.color=syncCanvasBackground({background:artwork.background.color},'auto',theme).background;renderPalette();reset();toast(`Background ${backgroundMode}`);}
  if(action==='export'){const preview=renderQuality;renderQuality=createExportQuality();resize();reset();requestAnimationFrame(()=>{downloadCanvas(canvas,`${active.id}-${seed}.png`);renderQuality=preview;resize();reset();toast('Artwork exported at full quality');});}
  if(action==='restart')reset(); if(action==='randomize')randomize(); if(action==='reset-params'){const layer=layerManager.selectedLayer;if(layer&&!layer.locked){layer.parameters=getDefaults(active);params=layer.parameters;renderParameters();reset();}}
  if(action==='new-seed'){const layer=layerManager.selectedLayer;if(layer&&!layer.locked){layer.seed=Math.floor(Math.random()*99999999);seed=layer.seed;renderPalette();reset();toast('New seed created');}}
  if(action==='copy-seed'){await navigator.clipboard.writeText(String(seed));toast('Seed copied');}
  if(action==='random-palette'){const layer=layerManager.selectedLayer;if(layer&&!layer.locked){layer.palette={...palettes[Math.floor(Math.random()*palettes.length)]};palette=layer.palette;renderPalette();reset();}}
  if(action==='fullscreen'){if(!document.fullscreenElement)await query('.canvas-wrap').requestFullscreen();else await document.exitFullscreen();}
  if(action==='save'){const name=window.prompt('Name this preset',`Untitled ${active.name}`)?.trim();if(name){savePreset(localStorage,generatorRegistry,{name,generator:active.id,seed,params:{...params},palette:{...palette},backgroundMode});renderPresets();toast('Preset saved locally');}}
});
document.addEventListener('input',event=>{const input=event.target as HTMLInputElement;if(input.dataset.layerOpacity!==undefined){const item=input.closest<HTMLElement>('[data-layer-id]');if(item)layerManager.updateLayer(item.dataset.layerId!,{opacity:Number(input.value)});return;}if(input.dataset.param){const layer=layerManager.selectedLayer;if(!layer||layer.locked)return;const def=active.params.find(p=>p.key===input.dataset.param)!;params[def.key]=def.type==='toggle'?input.checked:def.type==='slider'?Number(input.value):input.value;const out=input.parentElement?.querySelector('output');if(out)out.textContent=formatValue(params[def.key]);const warning=def.recommendedMax!==undefined&&Number(params[def.key])>def.recommendedMax;input.parentElement?.classList.toggle('performance-warning',warning);compositor.invalidate(layer.id); }if(input.dataset.color){if(input.dataset.color==='background'){backgroundMode='custom';artwork.background.mode='custom';artwork.background.color=input.value;}else{const layer=layerManager.selectedLayer;if(!layer||layer.locked)return;palette={...palette,[input.dataset.color]:input.value};layer.palette=palette;}const code=input.parentElement?.querySelector('code');if(code)code.textContent=input.value.toUpperCase();reset();}});
document.addEventListener('change',event=>{const select=event.target as HTMLSelectElement;if(select.classList.contains('artwork-select')&&select.value){const loaded=loadArtworks(localStorage,generatorRegistry).find(item=>item.id===select.value);if(loaded){artwork=loaded;layerManager.replaceArtwork(artwork);syncSelectedLayer();reset();toast('Artwork loaded');}}if(select.dataset.layerBlend!==undefined){const item=select.closest<HTMLElement>('[data-layer-id]');if(item)layerManager.updateLayer(item.dataset.layerId!,{blendMode:select.value as BlendMode});}});
const updatePointer=(event:PointerEvent)=>pointerTracker.update(event,canvas.getBoundingClientRect());
canvas.addEventListener('pointerdown',event=>{canvas.setPointerCapture?.(event.pointerId);updatePointer(event);});
canvas.addEventListener('pointermove',updatePointer);
canvas.addEventListener('pointerup',event=>pointerTracker.release(event,canvas.getBoundingClientRect()));
canvas.addEventListener('pointercancel',()=>pointerTracker.leave());canvas.addEventListener('pointerleave',()=>pointerTracker.leave());
const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(canvas.parentElement!);
window.addEventListener('resize',resize);
const onVisibilityChange=()=>visibilityPause.handle(document.hidden);document.addEventListener('visibilitychange',onVisibilityChange);
window.addEventListener('beforeunload',()=>{autosave.flush();resizeObserver.disconnect();window.removeEventListener('resize',resize);document.removeEventListener('visibilitychange',onVisibilityChange);animationEngine.destroy();compositor.destroy();});
query<HTMLButtonElement>('.theme-button').textContent=theme==='dark'?'☼':'☾';
layerManager.subscribe(()=>autosave.schedule(artwork));renderGenerators();renderLayers();renderArtworkLibrary();renderPresets();renderParameters();renderPalette();resize();animationEngine.start();
