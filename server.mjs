import {buildBlurFilters} from './blur-filters.mjs';
import {createFloatingControls} from './floating-controls.mjs';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {createStorage} from './storage.mjs';
import {listVideos} from './library.mjs';
import {renameVideo,trashVideo,restoreVideo} from './video-actions.mjs';
import {pipeline} from 'node:stream/promises';
import {Transform} from 'node:stream';
const root=path.dirname(fileURLToPath(import.meta.url)), storage=createStorage(root);
const floating=createFloatingControls(root);
fs.mkdirSync(path.join(root,'recordings'),{recursive:true});
let choosingFolder=false;
let thumbnailQueue=Promise.resolve();
const thumbnailJobs=new Map();
const chooseFolder=()=>new Promise((resolve,reject)=>{
 const child=spawn('powershell.exe',['-NoProfile','-STA','-ExecutionPolicy','Bypass','-File',path.join(root,'desktop','ChooseFolder.ps1')],{windowsHide:true,env:{...process.env,ROOT_SAVE_FOLDER:storage.directory}});
 let output='',error='';child.stdout.on('data',d=>output+=d);child.stderr.on('data',d=>error+=d);child.on('error',reject);child.on('close',code=>code===0?resolve(output.trim()):reject(Error(error||'Could not open the folder chooser.')));
});
const find=(name)=>{const walk=d=>fs.existsSync(d)?fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):e.name===name?[path.join(d,e.name)]:[]):[];return walk(path.join(root,'tools'))[0];};
const run=(exe,args,cwd=storage.directory)=>new Promise((resolve,reject)=>{if(!exe)return reject(Error('Tools are missing. Run Setup.cmd first.'));const p=spawn(exe,args,{cwd,windowsHide:true});let log='';p.stderr.on('data',d=>log=(log+d).slice(-6000));p.on('error',reject);p.on('close',c=>c===0?resolve():reject(Error(log||'Processing failed')));});
const body=async(req,limit=1024*1024*1024)=>{let n=0,parts=[];for await(const p of req){n+=p.length;if(n>limit)throw Error('Recording exceeds the 1 GB upload limit.');parts.push(p);}return Buffer.concat(parts);};
const json=(res,data,status=200)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(data));};
const valid=id=>typeof id==='string'&&/^[a-f0-9-]{36}$/.test(id);
http.createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://localhost:4783');
 const dir=storage.directory;
 if(req.headers.host!=='localhost:4783'&&req.headers.host!=='127.0.0.1:4783')return json(res,{error:'Invalid host'},403);
 if(req.method==='POST'&&req.headers.origin!=='http://localhost:4783'&&req.headers.origin!=='http://127.0.0.1:4783')return json(res,{error:'Invalid origin'},403);
 if(url.pathname==='/api/status')return json(res,{ffmpeg:!!find('ffmpeg.exe'),captions:!!find('whisper-cli.exe')&&!!find('ggml-base.en.bin')});
 if(req.method==='POST'&&url.pathname.startsWith('/api/floating/')){
  const data=JSON.parse((await body(req,2048)).toString());
  if(url.pathname==='/api/floating/start')return json(res,await floating.start());
  if(url.pathname==='/api/floating/sync')return json(res,floating.sync(data));
  if(url.pathname==='/api/floating/end')return json(res,floating.end(data.token));
  return json(res,{error:'Not found'},404);
 }
 if(req.method==='GET'&&url.pathname==='/api/storage')return json(res,{directory:storage.directory});
 if(req.method==='GET'&&url.pathname==='/api/library')return json(res,{videos:listVideos(storage,root),directory:storage.directory});
 if(req.method==='POST'&&['/api/library/rename','/api/library/delete','/api/library/restore'].includes(url.pathname)){
  const data=JSON.parse((await body(req,4096)).toString());
  if(url.pathname==='/api/library/rename'){renameVideo(storage,data.name,data.title);return json(res,{renamed:true});}
  if(url.pathname==='/api/library/delete')return json(res,trashVideo(storage,data.name));
  return json(res,{name:restoreVideo(storage,data.token)});
 }
 if(req.method==='GET'&&url.pathname.startsWith('/thumbnail/')){
  const name=url.pathname.slice(11);if(!/^[a-f0-9-]{36}\.(mp4|webm)$/.test(name))throw Error('Invalid video');
  const input=storage.resolve(name),info=await fs.promises.stat(input),cache=path.join(root,'.thumbnails');await fs.promises.mkdir(cache,{recursive:true});
  const output=path.join(cache,name+'-'+Math.round(info.mtimeMs)+'.jpg');
  if(!fs.existsSync(output)){
   if(!thumbnailJobs.has(output)){
    const job=thumbnailQueue.then(()=>run(find('ffmpeg.exe'),['-y','-ss','0','-i',input,'-frames:v','1','-vf','scale=480:-2','-q:v','4',output],root));thumbnailQueue=job.catch(()=>{});thumbnailJobs.set(output,job);job.finally(()=>thumbnailJobs.delete(output)).catch(()=>{});
   }
   await thumbnailJobs.get(output);
  }
  res.writeHead(200,{'Content-Type':'image/jpeg','Cache-Control':'private, max-age=86400'});fs.createReadStream(output).pipe(res);return;
 }
 if(req.method==='POST'&&url.pathname==='/api/camera/settings'){
  const {kind}=JSON.parse((await body(req,1024)).toString());
  if(!['browser','windows'].includes(kind))throw Error('Invalid camera settings action.');
  await run('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',path.join(root,'desktop','OpenCameraSettings.ps1'),'-Kind',kind],root);
  return json(res,{opened:true});
 }
 if(req.method==='POST'&&url.pathname==='/api/storage/choose'){
  if(choosingFolder)throw Error('A folder chooser is already open.');
  choosingFolder=true;try{const selected=await chooseFolder();if(selected)storage.select(selected);return json(res,{directory:storage.directory,cancelled:!selected});}finally{choosingFolder=false;}
 }
 if(req.method==='POST'&&url.pathname==='/api/recording'){const id=randomUUID();await fs.promises.writeFile(path.join(dir,id+'.webm'),await body(req));storage.register(id+'.webm',dir);return json(res,{id,directory:dir});}
 if(req.method==='POST'&&url.pathname==='/api/import'){
  const id=randomUUID(),temp=path.join(dir,id+'.upload'),output=path.join(dir,id+'.mp4');let size=0;
  try{
   await pipeline(req,new Transform({transform(chunk,encoding,done){size+=chunk.length;done(size>1024*1024*1024?Error('Choose a video smaller than 1 GB.'):null,chunk);}}),fs.createWriteStream(temp,{flags:'wx'}));
   if(!size)throw Error('The selected file is empty.');
   await run(find('ffmpeg.exe'),['-y','-i',temp,'-map','0:v:0','-map','0:a:0?','-vf',"scale=w='min(1920,iw)':h='min(1080,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2,setsar=1",'-c:v','libx264','-preset','veryfast','-crf','20','-pix_fmt','yuv420p','-c:a','aac','-movflags','+faststart',output],dir);
   let title='';try{title=decodeURIComponent(req.headers['x-root-name']||title);}catch{}
   storage.register(id+'.mp4',dir,title);return json(res,{id,url:'/media/'+id+'.mp4',directory:dir});
  }catch(e){await fs.promises.unlink(output).catch(()=>{});throw Error('Could not import video. Choose a playable MP4, WebM, MOV, MKV, or AVI file. '+e.message);}
  finally{await fs.promises.unlink(temp).catch(()=>{});}
 }
 if(req.method==='POST'&&['/api/captions','/api/export'].includes(url.pathname)){
 const data=JSON.parse((await body(req,1024*1024)).toString());if(!valid(data.id))throw Error('Invalid recording');let input=storage.resolve(data.id+'.webm');if(!fs.existsSync(input))input=storage.resolve(data.id+'.mp4');if(!fs.existsSync(input))throw Error('Recording not found');
 if(url.pathname==='/api/captions'){const working=path.dirname(input);await run(find('ffmpeg.exe'),['-y','-i',input,'-vn','-ar','16000','-ac','1','-c:a','pcm_s16le',data.id+'.wav'],working);await run(find('whisper-cli.exe'),['-m',find('ggml-base.en.bin'),'-f',data.id+'.wav','-l','en','-osrt','-of',data.id],working);return json(res,{srt:await fs.promises.readFile(path.join(working,data.id+'.srt'),'utf8')});}
 let {filters,last}=buildBlurFilters(data.regions||[]);
 const preset=data.preset||'full';if(!['full','compact'].includes(preset))throw Error('Invalid export preset');
 const size=preset==='compact'?[1280,720]:[1920,1080];
 const scale=`scale=w='min(${size[0]},iw)':h='min(${size[1]},ih)':force_original_aspect_ratio=decrease:force_divisible_by=2,setsar=1`;
 filters.push(`[${last}]${scale}[exportSize]`);last='exportSize';
 const output=randomUUID()+'.mp4',args=['-y','-i',input],filterFile=path.join(dir,randomUUID()+'.filter');
 try{
  if(filters.length){await fs.promises.writeFile(filterFile,filters.join(';'));args.push('-/filter_complex',filterFile,'-map',`[${last}]`);}else args.push('-map','0:v:0');
  args.push('-map','0:a?','-c:v','libx264','-preset','veryfast','-crf',preset==='compact'?'26':'20','-pix_fmt','yuv420p','-c:a','aac','-movflags','+faststart',output);
  await run(find('ffmpeg.exe'),args,dir);storage.register(output,dir);return json(res,{url:'/media/'+output,directory:dir});
 }finally{await fs.promises.unlink(filterFile).catch(()=>{});}
 }
 if(req.method!=='GET')return json(res,{error:'Not found'},404);
 let file;if(url.pathname.startsWith('/media/')){const name=url.pathname.slice(7);if(!/^[a-f0-9-]{36}\.(mp4|webm|srt)$/.test(name))throw Error('Invalid file');file=storage.resolve(name);}else{const name=url.pathname==='/'?'index.html':url.pathname.slice(1);file=path.resolve(root,'public',name);if(!file.startsWith(path.join(root,'public')+path.sep))throw Error('Invalid path');}
 const stat=await fs.promises.stat(file),type={'.html':'text/html','.js':'text/javascript','.css':'text/css','.mp4':'video/mp4','.webm':'video/webm','.ttf':'font/ttf','.srt':'text/plain'}[path.extname(file)]||'application/octet-stream';
 const range=req.headers.range;if(range){const m=/^bytes=(\d+)-(\d*)$/.exec(range);if(!m){res.writeHead(416);return res.end();}const start=Number(m[1]),end=m[2]?Math.min(Number(m[2]),stat.size-1):stat.size-1;if(start>end){res.writeHead(416);return res.end();}res.writeHead(206,{'Content-Type':type,'Content-Range':`bytes ${start}-${end}/${stat.size}`,'Content-Length':end-start+1,'Accept-Ranges':'bytes'});fs.createReadStream(file,{start,end}).pipe(res);}else{res.writeHead(200,{'Content-Type':type,'Content-Length':stat.size,'Accept-Ranges':'bytes','X-Content-Type-Options':'nosniff'});fs.createReadStream(file).pipe(res);}
 }catch(e){json(res,{error:e.message},400);}}).listen(4783,'127.0.0.1',()=>console.log('Root is ready: http://localhost:4783'));
