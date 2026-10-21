import fs from 'node:fs';
import path from 'node:path';
export function defaultVideoTitle(timestamp){
 const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Dhaka',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(new Date(timestamp));
 const value=type=>parts.find(p=>p.type===type).value;
 return `${value('year')}-${value('month')}-${value('day')} ${value('hour')}:${value('minute')}:${value('second')}`;
}
export function listVideos(storage,root){
 const directories=new Set([storage.directory,path.join(root,'recordings'),...storage.directories]);const videos=[];
 for(const directory of directories){
  let entries;try{entries=fs.readdirSync(directory,{withFileTypes:true});}catch{continue;}
  for(const entry of entries){
   if(!entry.isFile()||!/^([a-f0-9-]{36})\.(mp4|webm)$/.test(entry.name))continue;
   try{const file=path.join(directory,entry.name),stat=fs.statSync(file);if(!stat.size)continue;
    storage.discover(entry.name,directory);
    const id=entry.name.slice(0,36),label=storage.title(entry.name)||defaultVideoTitle(stat.mtimeMs);
    videos.push({id,name:entry.name,title:label,defaultTitle:defaultVideoTitle(stat.mtimeMs),url:'/media/'+entry.name,created:stat.mtimeMs,size:stat.size,format:path.extname(entry.name).slice(1).toUpperCase(),directory});
   }catch{continue;}
  }
 }
 storage.flush();return videos.sort((a,b)=>b.created-a.created);
}
