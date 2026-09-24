import { expect,it } from 'vitest';import { buildSpatialGrid } from '../src/generators/boids';
it('indexes each boid once in a bounded spatial grid',()=>{const x=new Float32Array([5,15,25,35,45]),y=new Float32Array([5,5,5,15,15]);const grid=buildSpatialGrid(x,y,20,60,40);expect(grid.buckets.flat()).toHaveLength(5);expect(grid.columns).toBe(3);expect(grid.rows).toBe(2);});
