import fs from 'node:fs';import assert from 'node:assert/strict';import path from 'node:path';
const source='recordings/test.webm';
const send=async(endpoint,body,raw=false)=>{const r=await fetch('http://127.0.0.1:4783'+endpoint,{method:'POST',headers:{Origin:'http://localhost:4783','Content-Type':raw?'application/octet-stream':'application/json'},body:raw?body:JSON.stringify(body)});const data=await r.json();assert.equal(r.status,200,JSON.stringify(data));return data;};
const input=await send('/api/recording',fs.readFileSync(source),true);let output;
try{
 output=await send('/api/export',{id:input.id,regions:[{shape:'circle',x:.1,y:.1,w:.15,h:.26666667,keyframes:[{time:0,x:.1,y:.1,w:.15,h:.26666667},{time:1,x:.6,y:.4,w:.2,h:.35555556}]}]});
 const r=await fetch('http://127.0.0.1:4783'+output.url,{headers:{Range:'bytes=0-99'}});assert.equal(r.status,206);console.log('PASS HTTP export of animated circle using filter script and MP4 playback');
}finally{
 // These exact UUID filenames were created by this test, never user filenames.
 for(const [directory,name] of [[input.directory,input.id+'.webm'],...(output?[[output.directory,output.url.split('/').pop()]]:[])]){
  const file=path.resolve(directory,name);assert.equal(path.dirname(file),path.resolve(directory));fs.unlinkSync(file);
 }
}
