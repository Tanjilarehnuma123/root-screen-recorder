import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
export function createStorage(root){
 const configFile=path.join(root,'storage.json');
 let config={directory:path.join(root,'recordings'),files:{},titles:{},trash:{}};
 if(fs.existsSync(configFile))config={...config,...JSON.parse(fs.readFileSync(configFile,'utf8'))};
 const save=()=>{const temp=configFile+'.tmp';fs.writeFileSync(temp,JSON.stringify(config,null,2));fs.renameSync(temp,configFile);};
 return {
  get directory(){return config.directory;},
  get directories(){return [...new Set(Object.values(config.files))];},
  title(name){return config.titles[name];},
  rename(name,title){if(typeof title!=='string'||title.length>180||/[\x00-\x1f]/.test(title))throw Error('Use a title up to 180 characters without line breaks.');const value=title.trim();if(value)config.titles[name]=value;else delete config.titles[name];save();},
  addTrash(token,entry){config.trash[token]=entry;save();},
  getTrash(token){return config.trash[token];},
  removeTrash(token){delete config.trash[token];save();},
  discover(name,directory){if(!config.files[name])config.files[name]=directory;},
  flush(){save();},
  select(directory){
   if(!path.isAbsolute(directory))throw Error('Choose an absolute folder path.');
   if(!fs.statSync(directory).isDirectory())throw Error('Choose an existing folder.');
   const probe=path.join(directory,'.root-write-test-'+randomUUID());
   fs.writeFileSync(probe,'',{flag:'wx'});fs.unlinkSync(probe);
   const previous=config.directory;config.directory=path.resolve(directory);
   try{save();}catch(e){config.directory=previous;throw e;}
   return config.directory;
  },
  register(name,directory,title){config.files[name]=directory;if(title)config.titles[name]=String(title).slice(0,180);save();},
  resolve(name){return path.join(config.files[name]||path.join(root,'recordings'),name);}
 };
}
