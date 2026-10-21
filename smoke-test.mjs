import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const files=walk('tools'),ffmpeg=files.find(f=>f.endsWith('ffmpeg.exe')),probe=files.find(f=>f.endsWith('ffprobe.exe'));
execFileSync(ffmpeg,['-y','-f','lavfi','-i','testsrc2=size=640x360:rate=30','-f','lavfi','-i','sine=frequency=440','-t','2','-c:v','libvpx','-c:a','libopus','recordings/test.webm'],{stdio:'ignore'});
const post=async(url,body,raw=false)=>{const r=await fetch('http://localhost:4783'+url,{method:'POST',headers:{Origin:'http://localhost:4783','Content-Type':raw?'application/octet-stream':'application/json'},body:raw?body:JSON.stringify(body)});const d=await r.json();assert.equal(r.status,200,JSON.stringify(d));return d;};
const {id}=await post('/api/recording',fs.readFileSync('recordings/test.webm'),true);
for(const regions of [[],[{x:.1,y:.1,w:.3,h:.2},{x:.6,y:.5,w:.2,h:.3}]]){
 const {url}=await post('/api/export',{id,regions});const info=JSON.parse(execFileSync(probe,['-v','quiet','-show_streams','-of','json','recordings/'+url.split('/').pop()],{encoding:'utf8'}));assert.equal(info.streams[0].codec_name,'h264');assert.equal(info.streams[1].codec_name,'aac');assert.equal(info.streams[0].width,640);console.log('PASS MP4 export with '+regions.length+' blur areas');
 const r=await fetch('http://localhost:4783'+url,{headers:{Range:'bytes=0-99'}});assert.equal(r.status,206);assert.equal((await r.arrayBuffer()).byteLength,100);
}
const denied=await fetch('http://localhost:4783/api/export',{method:'POST',headers:{Origin:'https://example.com'},body:'{}'});assert.equal(denied.status,403);console.log('PASS byte-range playback and cross-origin protection');
if(process.argv.includes('--captions')){const result=await post('/api/captions',{id});assert.equal(typeof result.srt,'string');console.log('PASS local caption pipeline (synthetic tone; speech accuracy requires spoken recording)');}
