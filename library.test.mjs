import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {createStorage} from './storage.mjs';import {listVideos} from './library.mjs';
test('library finds existing and imported videos across save folders, ignores missing and empty files',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'root-library-'));
 try{
  const a=path.join(root,'recordings'),b=path.join(root,'new');fs.mkdirSync(a);fs.mkdirSync(b);
  const old='11111111-1111-4111-8111-111111111111.webm',imported='22222222-2222-4222-8222-222222222222.mp4',empty='33333333-3333-4333-8333-333333333333.mp4';
  fs.writeFileSync(path.join(a,old),'test');fs.writeFileSync(path.join(b,imported),'video');fs.writeFileSync(path.join(a,empty),'');fs.writeFileSync(path.join(a,'test.webm'),'fixture');
  const storage=createStorage(root);storage.select(b);storage.register(imported,b,'My imported video.mp4');storage.register('44444444-4444-4444-8444-444444444444.mp4',b);
  const list=listVideos(storage,root);assert.equal(list.length,2);assert.equal(list.find(v=>v.name===imported).title,'My imported video.mp4');assert.equal(storage.resolve(old),path.join(a,old));assert.equal(createStorage(root).resolve(old),path.join(a,old));
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
