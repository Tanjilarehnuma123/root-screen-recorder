import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {buildBlurFilters} from './blur-filters.mjs';
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const exe=walk('tools').find(p=>p.endsWith('ffmpeg.exe'));
const source="nullsrc=s=640x360,geq=lum='mod(X*17+Y*31,256)':cb=128:cr=128";
const frame=regions=>{const {filters,last}=buildBlurFilters(regions);let args=['-v','error','-f','lavfi','-i',source];if(filters.length)args.push('-filter_complex',filters.join(';'),'-map',`[${last}]`);args.push('-frames:v','1','-pix_fmt','rgb24','-f','rawvideo','pipe:1');return execFileSync(exe,args,{maxBuffer:2000000});};
const original=frame([]),circle=frame([{shape:'circle',x:.2,y:.2,w:.3,h:.3*640/360}]);
function difference(a,b,x,y){let sum=0;for(let dy=0;dy<8;dy++)for(let dx=0;dx<8;dx++)for(let c=0;c<3;c++){const i=((y+dy)*640+x+dx)*3+c;sum+=Math.abs(a[i]-b[i]);}return sum/(8*8*3);}
const corner=difference(original,circle,130,74),center=difference(original,circle,220,160);assert.ok(corner<2,`Circle corner changed: ${corner}`);assert.ok(center>15,`Circle center was not blurred: ${center}`);
frame([{shape:'rectangle',x:.1,y:.1,w:.2,h:.2},{shape:'circle',x:.4,y:.2,w:.2,h:.2*640/360}]);console.log(`PASS circular export: corner difference ${corner.toFixed(2)}, center blur difference ${center.toFixed(2)}; mixed shapes also render`);
