import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
const validName=name=>typeof name==='string'&&/^[a-f0-9-]{36}\.(mp4|webm)$/.test(name);
export function renameVideo(storage,name,title){
 if(!validName(name))throw Error('Invalid video');
 if(!fs.statSync(storage.resolve(name)).isFile())throw Error('Video not found');
 storage.rename(name,title);
}
export function trashVideo(storage,name){
 if(!validName(name))throw Error('Invalid video');
 const source=storage.resolve(name);if(!fs.statSync(source).isFile())throw Error('Video not found');
 const token=randomUUID(),directory=path.dirname(source),destination=path.join(directory,'.root-trash',token,name);
 fs.mkdirSync(path.dirname(destination),{recursive:true});
 fs.renameSync(source,destination);
 try{storage.addTrash(token,{name,source,destination,title:storage.title(name)||'',deleted:Date.now()});}
 catch(error){fs.renameSync(destination,source);throw error;}
 return {token};
}
export function restoreVideo(storage,token){
 if(typeof token!=='string'||!/^[a-f0-9-]{36}$/.test(token))throw Error('Invalid restore token');
 const entry=storage.getTrash(token);if(!entry)throw Error('Deleted video not found');
 if(fs.existsSync(entry.source))throw Error('A video already exists at the original location.');
 fs.renameSync(entry.destination,entry.source);
 try{storage.removeTrash(token);}catch(error){fs.renameSync(entry.source,entry.destination);throw error;}
 return entry.name;
}
