import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {buildBlurFilters} from './blur-filters.mjs';
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const exe=walk('tools').find(p=>p.endsWith('ffmpeg.exe'));
const source="nullsrc=s=320x180:r=2,geq=lum='mod(X*17+Y*31,256)':cb=128:cr=128";
const frameBytes=320*180*3;
function render(regions){const {filters,last}=buildBlurFilters(regions);const args=['-v','error','-f','lavfi','-i',source];if(filters.length)args.push('-filter_complex',filters.join(';'),'-map',`[${last}]`);args.push('-frames:v','3','-pix_fmt','rgb24','-f','rawvideo','pipe:1');return execFileSync(exe,args,{maxBuffer:3000000});}
function diff(a,b,frame,x,y){let sum=0;for(let dy=0;dy<6;dy++)for(let dx=0;dx<6;dx++)for(let c=0;c<3;c++){const i=frame*frameBytes+((y+dy)*320+x+dx)*3+c;sum+=Math.abs(a[i]-b[i]);}return sum/108;}
const original=render([]);
for(const shape of ['rectangle','circle']){
 const region={shape,x:.1,y:.2,w:.18,h:.32,keyframes:[{time:0,x:.1,y:.2,w:.18,h:.32},{time:1,x:.65,y:.2,w:.24,h:.4266666667}]};
 const animated=render([region]);
 for(const [frame,x,y] of [[0,55,60],[1,147,70],[2,243,70]])assert.ok(diff(original,animated,frame,x,y)>20,`${shape} missing at frame ${frame}`);
 assert.ok(diff(original,animated,0,243,70)<2,`${shape} blurs future position too early`);assert.ok(diff(original,animated,2,55,60)<2,`${shape} leaves blur behind`);
 if(shape==='circle')assert.ok(diff(original,animated,0,33,37)<2,'Circle bounding-box corner should stay clear');
 console.log('PASS '+shape+' animated position and size at start, midpoint, end; previous location stays clear');
}
