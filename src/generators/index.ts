import type { Generator } from '../types';
import { particles } from './particles'; import { flowField } from './flow-field'; import { waves } from './waves'; import { lines } from './lines'; import { grid } from './grid'; import { circles } from './circles'; import { noiseArt } from './noise-art'; import { spiral } from './spiral'; import { lissajous } from './lissajous'; import { attractors } from './attractors';
export const generators:Generator[]=[particles,flowField,waves,lines,grid,circles,noiseArt,spiral,lissajous,attractors];
