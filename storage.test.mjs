import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createStorage} from './storage.mjs';
test('folder choice persists and existing recordings keep their original location',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'root-storage-'));
 try{
  const a=path.join(root,'recordings'),b=path.join(root,'New videos ü');fs.mkdirSync(a);fs.mkdirSync(b);
  let store=createStorage(root);store.register('old.webm',a);store.select(b);store.register('new.webm',b);
  store=createStorage(root);assert.equal(store.directory,b);assert.equal(store.resolve('old.webm'),path.join(a,'old.webm'));assert.equal(store.resolve('new.webm'),path.join(b,'new.webm'));assert.equal(store.resolve('legacy.mp4'),path.join(a,'legacy.mp4'));
  assert.throws(()=>store.select('relative'));assert.throws(()=>store.select(path.join(root,'missing')));assert.equal(store.directory,b);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
