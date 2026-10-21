import test from 'node:test';import assert from 'node:assert/strict';
import {regionAtTime,setKeyframe} from './public/blur-keyframes.js';import {buildBlurFilters} from './blur-filters.mjs';
const a={x:.1,y:.1,w:.2,h:.2},b={x:.5,y:.4,w:.3,h:.3};
test('positions and sizes interpolate linearly and hold before and after endpoints',()=>{
 const region={...a,shape:'rectangle',keyframes:[{...a,time:1},{...b,time:3}]};
 assert.equal(regionAtTime(region,0).x,a.x);assert.equal(regionAtTime(region,4).x,b.x);
 const mid=regionAtTime(region,2);assert.ok(Math.abs(mid.x-.3)<1e-9);assert.equal(mid.w,.25);
});
test('upserting replaces the same time without destroying other keyframes',()=>{
 let r=setKeyframe(a,3,b);r=setKeyframe(r,1,a);r=setKeyframe(r,3,{...b,x:.6});
 assert.deepEqual(r.keyframes.map(f=>f.time),[1,3]);assert.equal(r.keyframes[1].x,.6);
});
test('export rejects unordered and malformed keyframes',()=>{
 assert.throws(()=>buildBlurFilters([{...a,keyframes:[{...a,time:2},{...b,time:1}]}]));
 assert.throws(()=>buildBlurFilters([{...a,keyframes:[{...a,time:NaN}]}]));
 assert.throws(()=>buildBlurFilters([{...a,keyframes:[{...a,w:-1,time:0}]}]));
 assert.match(buildBlurFilters([{...a,keyframes:[{...a,time:0},{...b,time:1}]}]).filters.join(';'),/T-0/);
});
