import {spawn} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
export function createFloatingControls(root,{launch=spawn,now=Date.now,prepare}={}){
 let session;
 function end(token){if(!session||session.token!==token)return;session.child.kill();session=null;}
 const watchdog=setInterval(()=>{if(session&&now()-session.updated>10000)end(session.token);},2000);watchdog.unref();
 return {
  async start(){
   if(session)throw Error('Floating controls are already in use by another recording.');
   const source=path.join(root,'desktop','RecordingControls.cs'),exe=path.join(root,'runtime','RootControls.exe');
   const input=prepare?null:await fs.stat(source),output=prepare?null:await fs.stat(exe).catch(()=>null);
   if(prepare)await prepare();
   else if(!output||output.mtimeMs<input.mtimeMs){await new Promise((resolve,reject)=>{const compiler=launch('C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe',['/nologo','/target:winexe','/reference:System.Windows.Forms.dll','/reference:System.Drawing.dll','/reference:System.Web.Extensions.dll','/out:'+exe,source],{windowsHide:true});compiler.on('error',reject);compiler.on('exit',code=>code===0?resolve():reject(Error('Could not build floating recording controls.')));});}
   if(session)throw Error('Floating controls are already in use by another recording.');
   const child=launch(exe,[],{windowsHide:true,stdio:['pipe','pipe','ignore']}),token=randomUUID();
   const current={token,child,updated:now(),commands:[],buffer:''};session=current;
   child.stdout.on('data',chunk=>{current.buffer+=chunk;const lines=current.buffer.split(/\r?\n/);current.buffer=lines.pop();for(const line of lines)if(['pause','stop'].includes(line)&&current.commands.length<10)current.commands.push(line);});
   child.stdin.on('error',()=>{});
   child.on('error',()=>{if(session===current)session=null;});child.on('exit',()=>{if(session===current)session=null;});
   return {token};
  },
  sync({token,state,elapsed}){
   if(!session||session.token!==token)throw Error('Floating recording controls disconnected.');
   if(!['recording','paused','saving'].includes(state)||!Number.isFinite(elapsed)||elapsed<0)throw Error('Invalid recording control state.');
   session.updated=now();session.child.stdin.write(JSON.stringify({state,elapsed})+'\n');
   return {commands:session.commands.splice(0)};
  },
  end(token){end(token);return {closed:true};}
 };
}
