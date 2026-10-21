import test from 'node:test';import assert from 'node:assert/strict';import {saveVideoTitle,downloadName} from './public/video-titles.js';
test('shared rename updates selected video and broadcasts the canonical name only after saving',async()=>{
 const item={name:'example.webm',title:'Old title',defaultTitle:'2026-10-21 10:15:30'};let request,event;
 const title=await saveVideoTitle(item,'  Team demo  ',{fetcher:async(url,options)=>{request={url,body:JSON.parse(options.body)};assert.equal(item.title,'Old title');return {ok:true,json:async()=>({renamed:true})};},notify:detail=>{event=detail;}});
 assert.equal(title,'Team demo');assert.equal(item.title,'Team demo');assert.deepEqual(event,{name:item.name,title:'Team demo'});assert.deepEqual(request.body,{name:item.name,title:'Team demo'});
});
test('clearing the details title uses the same date/time fallback as the card',async()=>{
 const item={name:'example.mp4',title:'Custom name',defaultTitle:'2026-10-21 10:15:30'};
 const title=await saveVideoTitle(item,'   ',{fetcher:async()=>({ok:true,json:async()=>({renamed:true})}),notify:()=>{}});
 assert.equal(title,item.defaultTitle);assert.equal(item.title,item.defaultTitle);assert.equal(downloadName(title,'MP4'),'2026-10-21 10-15-30.mp4');
});
test('failed saves leave both names unchanged and emit no synchronization event',async()=>{
 const item={name:'example.webm',title:'Original'};let notified=false;
 await assert.rejects(saveVideoTitle(item,'New',{fetcher:async()=>({ok:false,json:async()=>({error:'Disk full'})}),notify:()=>{notified=true;}}),/Disk full/);assert.equal(item.title,'Original');assert.equal(notified,false);
});
