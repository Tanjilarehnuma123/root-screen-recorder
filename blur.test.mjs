import test from 'node:test';
import assert from 'node:assert/strict';
import {drawRegion,moveRegion,resizeRegion} from './public/blur-geometry.js';
import {buildBlurFilters} from './blur-filters.mjs';
test('circles retain a circular pixel shape when drawn and resized on wide and portrait video',()=>{
 for(const aspect of [16/9,9/16]){
  const r=drawRegion({x:.2,y:.2},{x:.6,y:.7},'circle',aspect);assert.ok(Math.abs(r.w*aspect-r.h)<1e-9);
  for(const handle of ['nw','n','ne','e','se','s','sw','w']){
   const resized=resizeRegion(r,handle,.9,.9,aspect);assert.ok(Math.abs(resized.w*aspect-resized.h)<1e-9);assert.ok(resized.x>=0&&resized.y>=0&&resized.x+resized.w<=1.000001&&resized.y+resized.h<=1.000001);
  }
 }
});
test('moving and rectangular resizing stays inside video',()=>{
 const r={x:.2,y:.2,w:.3,h:.3};assert.deepEqual(moveRegion(r,2,-2),{...r,x:.7,y:0});
 const resized=resizeRegion(r,'nw',-2,-2,16/9);assert.equal(resized.x,0);assert.equal(resized.y,0);assert.equal(resized.w,.5);
});
test('export masks circles and rejects unknown shapes',()=>{
 const r={x:.1,y:.1,w:.2,h:.2};assert.match(buildBlurFilters([{...r,shape:'circle'}]).filters[0],/geq=/);assert.doesNotMatch(buildBlurFilters([r]).filters[0],/geq=/);assert.throws(()=>buildBlurFilters([{...r,shape:'bad'}]));
});
