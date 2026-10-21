import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';import assert from 'node:assert/strict';
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]),tools=walk('tools'),ffmpeg=tools.find(p=>p.endsWith('ffmpeg.exe')),ffprobe=tools.find(p=>p.endsWith('ffprobe.exe'));
const source='recordings/details-preset-test.webm',copy='recordings/details-preset-check.mp4',created=[];
const send=async(endpoint,body,raw=false)=>{const response=await fetch('http://127.0.0.1:4783'+endpoint,{method:'POST',headers:{Origin:'http://localhost:4783','Content-Type':raw?'application/octet-stream':'application/json'},body:raw?body:JSON.stringify(body)}),data=await response.json();assert.equal(response.status,200,JSON.stringify(data));return data;};
try{
 execFileSync(ffmpeg,['-y','-v','error','-f','lavfi','-i','testsrc2=size=1600x900:rate=2','-t','1','-c:v','libvpx','-deadline','realtime',source]);
 const input=await send('/api/recording',fs.readFileSync(source),true);created.push(path.join(input.directory,input.id+'.webm'));
 for(const preset of ['full','compact']){
  const region={shape:'circle',x:.1,y:.1,w:.1,h:.17777778,keyframes:[{time:0,x:.1,y:.1,w:.1,h:.17777778},{time:.5,x:.5,y:.3,w:.2,h:.35555556}]};
  const output=await send('/api/export',{id:input.id,preset,regions:preset==='compact'?[region]:[]});created.push(path.join(output.directory,output.url.split('/').pop()));
  fs.writeFileSync(copy,Buffer.from(await(await fetch('http://127.0.0.1:4783'+output.url)).arrayBuffer()));
  const info=JSON.parse(execFileSync(ffprobe,['-v','quiet','-show_streams','-of','json',copy],{encoding:'utf8'}));assert.equal(info.streams[0].width,preset==='compact'?1280:1600);assert.equal(info.streams[0].height,preset==='compact'?720:900);assert.equal(info.streams[0].codec_name,'h264');console.log('PASS '+preset+' MP4 export dimensions; '+(preset==='compact'?'animated circular blur preserved':'no upscaling'));
 }
}finally{for(const file of [...created,source,copy])if(fs.existsSync(file))fs.unlinkSync(file);}
