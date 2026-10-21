import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
const call=async(endpoint,body,raw=false)=>{const response=await fetch('http://127.0.0.1:4783'+endpoint,{method:'POST',headers:{Origin:'http://localhost:4783','Content-Type':raw?'application/octet-stream':'application/json'},body:raw?body:JSON.stringify(body)}),data=await response.json();assert.equal(response.status,200,JSON.stringify(data));return data;};
const source=fs.readFileSync('recordings/test.webm'),created=await call('/api/recording',source,true),name=created.id+'.webm',file=path.join(created.directory,name);
try{
 await call('/api/library/rename',{name,title:'Root card action test'});let list=await(await fetch('http://127.0.0.1:4783/api/library')).json();assert.equal(list.videos.find(v=>v.name===name).title,'Root card action test');
 await call('/api/library/rename',{name,title:''});list=await(await fetch('http://127.0.0.1:4783/api/library')).json();assert.match(list.videos.find(v=>v.name===name).title,/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
 const removed=await call('/api/library/delete',{name});assert.equal(fs.existsSync(file),false);
 await call('/api/library/restore',{token:removed.token});assert.deepEqual(fs.readFileSync(file),source);
 const video=await fetch('http://127.0.0.1:4783/media/'+name,{headers:{Range:'bytes=0-31'}});assert.equal(video.status,206);assert.equal((await video.arrayBuffer()).byteLength,32);
 console.log('PASS rename, blank date/time title, recoverable deletion, Undo, and downloadable video');
}finally{if(fs.existsSync(file))fs.unlinkSync(file);}
