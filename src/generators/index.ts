import type { Generator } from '../types';
import { GeneratorRegistry } from '../core/generator-registry';
import { particles } from './particles'; import { flowField } from './flow-field'; import { waves } from './waves'; import { lines } from './lines'; import { grid } from './grid'; import { circles } from './circles'; import { noiseArt } from './noise-art'; import { spiral } from './spiral'; import { lissajous } from './lissajous'; import { attractors } from './attractors';

const modules: Generator[] = [particles, flowField, waves, lines, grid, circles, noiseArt, spiral, lissajous, attractors];
export const generatorRegistry = new GeneratorRegistry();
modules.forEach(generator => generatorRegistry.register(generator));
export const generators = generatorRegistry.getAll();
