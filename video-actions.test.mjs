import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {createStorage} from './storage.mjs';import {renameVideo,trashVideo,restoreVideo} from './video-actions.mjs';import {listVideos,defaultVideoTitle} from './library.mjs';
test('renaming persists without changing source file and clearing title uses date and time',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'root-video-actions-'));
 try{const directory=path.join(root,'recordings');fs.mkdirSync(directory);const name='11111111-1111-4111-8111-111111111111.webm',file=path.join(directory,name);fs.writeFileSync(file,'video contents');const storage=createStorage(root);storage.register(name,directory);
  renameVideo(storage,name,'  Product walkthrough  ');assert.equal(createStorage(root).title(name),'Product walkthrough');assert.equal(fs.readFileSync(file,'utf8'),'video contents');
  renameVideo(storage,name,'   ');const video=listVideos(storage,root)[0];assert.equal(video.title,defaultVideoTitle(fs.statSync(file).mtimeMs));assert.match(video.title,/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  assert.throws(()=>renameVideo(storage,'../test.webm','Bad'));assert.throws(()=>renameVideo(storage,name,'bad\nname'));
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('deleting moves source to local trash and Undo restores exact contents',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'root-video-actions-'));
 try{const directory=path.join(root,'recordings');fs.mkdirSync(directory);const name='22222222-2222-4222-8222-222222222222.mp4',file=path.join(directory,name);fs.writeFileSync(file,'keep these original bytes');let storage=createStorage(root);storage.register(name,directory,'My video');
  const {token}=trashVideo(storage,name);assert.equal(fs.existsSync(file),false);assert.equal(listVideos(storage,root).length,0);storage=createStorage(root);assert.equal(fs.readFileSync(storage.getTrash(token).destination,'utf8'),'keep these original bytes');
  restoreVideo(storage,token);assert.equal(fs.readFileSync(file,'utf8'),'keep these original bytes');assert.equal(listVideos(storage,root)[0].title,'My video');assert.equal(storage.getTrash(token),undefined);assert.throws(()=>restoreVideo(storage,token));
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('default titles use Bangladesh date and time',()=>{assert.equal(defaultVideoTitle(Date.UTC(2026,9,20,20,35,10)),'2026-10-21 02:35:10');});
