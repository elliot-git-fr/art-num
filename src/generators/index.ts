import type { Generator } from '../types';
import { GeneratorRegistry } from '../core/generator-registry';
import { particles } from './particles'; import { flowField } from './flow-field'; import { waves } from './waves'; import { lines } from './lines'; import { grid } from './grid'; import { circles } from './circles'; import { noiseArt } from './noise-art'; import { spiral } from './spiral'; import { lissajous } from './lissajous'; import { attractors } from './attractors';
import { voronoi } from './voronoi';
import { mandelbrot } from './mandelbrot';
import { reactionDiffusion } from './reaction-diffusion';
import { julia } from './julia';
import { cellularAutomata } from './cellular-automata';
import { boids } from './boids';
import { metaballs } from './metaballs';
import { spirograph } from './spirograph';
import { harmonograph } from './harmonograph';
import { kaleidoscope } from './kaleidoscope';

const modules: Generator[] = [particles, flowField, waves, lines, grid, circles, noiseArt, spiral, lissajous, attractors, voronoi, mandelbrot, reactionDiffusion, julia, cellularAutomata, boids, metaballs, spirograph, harmonograph, kaleidoscope];
export const generatorRegistry = new GeneratorRegistry();
modules.forEach(generator => generatorRegistry.register(generator));
export const generators = generatorRegistry.getAll();
