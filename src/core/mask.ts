import type {ParamValues} from '../types';
export type MaskType='linear-gradient'|'radial-gradient'|'noise';
export interface MaskInstance{id:string;type:MaskType;enabled:boolean;strength:number;invert:boolean;parameters:ParamValues;}
export const MASK_DEFAULTS:Record<MaskType,ParamValues>={
  'linear-gradient':{angle:0,position:.5,softness:.25},
  'radial-gradient':{centerX:.5,centerY:.5,radius:.4,softness:.2},
  noise:{scale:28,threshold:.5,softness:.15,seed:1},
};
