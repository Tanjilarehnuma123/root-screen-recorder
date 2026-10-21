import {moveRegion,drawRegion,resizeRegion} from './blur-geometry.js';
import {regionAtTime,setKeyframe,geometry} from './blur-keyframes.js';
import {shouldDeleteBlur} from './blur-shortcuts.js';
export function createBlurEditor({stage,video,getRegions,isReady,getEditing,setEditing,message,getDuration=()=>video.duration}){
 const $=id=>document.getElementById(id),overlay=document.createElement('div');overlay.className='blur-overlay';stage.append(overlay);
 const tools=document.createElement('div');tools.className='blur-tools';
 tools.innerHTML='<label>Shape <select id="blurShape"><option value="rectangle">Rectangle</option><option value="circle">Circle</option></select></label><button type="button" id="deleteBlur" class="text-button">Delete selected</button>';
 $('blur').before(tools);
 const timeline=document.createElement('div');timeline.className='blur-timeline';
 timeline.innerHTML='<label>Video position <input id="blurSeek" aria-label="Video position" type="range" min="0" max="1" step="0.001" value="0"></label><label>Time (seconds) <input id="blurTime" type="number" min="0" step="0.001" value="0"></label><button id="saveBlurKey" class="secondary">Add / update keyframe</button><button id="removeBlurKey" class="text-button">Delete keyframe here</button><div id="blurKeys"></div><p class="hint">Move or resize at a new time to add a keyframe automatically. Motion is linear between keyframes; the first and last positions hold outside that range.</p>';
 tools.after(timeline);
 let selected=-1,gesture=null,signature='';
 const aspect=()=>video.videoWidth/video.videoHeight||16/9;
 const point=e=>{const b=stage.getBoundingClientRect();return {x:Math.max(0,Math.min(1,(e.clientX-b.left)/b.width)),y:Math.max(0,Math.min(1,(e.clientY-b.top)/b.height))};};
 function sync(){
  const regions=getRegions();if(selected>=regions.length)selected=-1;
  const time=video.currentTime||0,duration=Number.isFinite(getDuration())&&getDuration()>0?getDuration():Math.max(time,1);$('blurSeek').max=duration;$('blurTime').max=duration;
  if(document.activeElement!==$('blurSeek'))$('blurSeek').value=time;if(document.activeElement!==$('blurTime'))$('blurTime').value=time.toFixed(3);
  const current=regions[selected];$('saveBlurKey').disabled=!current;$('removeBlurKey').disabled=!current?.keyframes?.some(k=>Math.abs(k.time-time)<.001);
  const next=JSON.stringify([regions,getEditing(),selected,Math.round(time*1000)]);if(next===signature)return;signature=next;
  overlay.hidden=!getEditing();stage.classList.toggle('selecting',getEditing());$('blur').textContent=getEditing()?'Done editing blur':'＋ Add / edit blur';
  $('regions').textContent=regions.length?`${regions.length} blur area(s). Select an area, seek to a time, then move or resize to set a keyframe.`:'No blur areas added';
  $('deleteBlur').disabled=selected<0;
  $('blurKeys').replaceChildren();for(const frame of current?.keyframes||[]){const button=document.createElement('button');button.className='text-button';button.textContent=frame.time.toFixed(3)+'s';button.onclick=()=>{video.pause();video.currentTime=frame.time;sync();};$('blurKeys').append(button);}
  overlay.replaceChildren();regions.forEach((region,i)=>{const r=regionAtTime(region,time);
   const box=document.createElement('div');box.className='blur-region'+(i===selected?' selected':'');box.dataset.index=i;box.style.cssText=`left:${r.x*100}%;top:${r.y*100}%;width:${r.w*100}%;height:${r.h*100}%;border-radius:${r.shape==='circle'?'50%':'0'};`;
   box.setAttribute('aria-label',`${r.shape==='circle'?'Circle':'Rectangle'} blur ${i+1}`);
   if(i===selected)for(const position of ['nw','n','ne','e','se','s','sw','w']){const handle=document.createElement('span');handle.className='blur-handle '+position;handle.dataset.handle=position;box.append(handle);}
   overlay.append(box);
  });
 }
 $('blur').onclick=()=>{if(!isReady()){message('Record or import a video first.',true);return;}setEditing(!getEditing());if(getEditing()){video.pause();if(!stage.closest('.details-workspace'))stage.scrollIntoView({behavior:'smooth',block:'center'});message('Choose Rectangle or Circle, then drag empty space to add one. Drag an existing area or its handles to move or resize.');}gesture=null;sync();};
 $('clearBlur').onclick=()=>{getRegions().splice(0);selected=-1;gesture=null;sync();};
 function deleteSelected(){if(selected<0||!getRegions()[selected])return;getRegions().splice(selected,1);selected=-1;gesture=null;sync();}
 $('deleteBlur').onclick=deleteSelected;
 $('deleteBlur').title='Delete selected blur (Backspace or Delete)';
 $('deleteBlur').setAttribute('aria-keyshortcuts','Backspace Delete');
 const shortcutHint=document.createElement('p');shortcutHint.className='hint blur-shortcut-hint';shortcutHint.textContent='Select a blur area, then press Backspace or Delete to remove it.';tools.after(shortcutHint);
 document.addEventListener('keydown',event=>{if(shouldDeleteBlur(event,{editing:getEditing(),ready:isReady()&&!stage.closest('[hidden]')&&!document.body.classList.contains('library-mode'),selected,gesturing:!!gesture})){event.preventDefault();deleteSelected();message('Selected blur removed.');}});
 stage.tabIndex=0;
 for(const id of ['blurSeek','blurTime'])$(id).oninput=()=>{video.pause();video.currentTime=Math.max(0,Math.min(Number($(id).value)||0,Number.isFinite(getDuration())?getDuration():Infinity));sync();};
 $('saveBlurKey').onclick=()=>{if(selected<0)return;try{getRegions()[selected]=setKeyframe(getRegions()[selected],video.currentTime);sync();}catch(e){message(e.message,true);}};
 $('removeBlurKey').onclick=()=>{if(selected<0)return;const region=getRegions()[selected],position=regionAtTime(region,video.currentTime);region.keyframes=region.keyframes.filter(k=>Math.abs(k.time-video.currentTime)>=.001);if(!region.keyframes.length)Object.assign(region,geometry(position));sync();};
 $('blurShape').onchange=()=>{if(selected<0)return;const r=getRegions()[selected];if(!r)return;const shape=$('blurShape').value;const convert=p=>{const diameter=Math.min(p.w*aspect(),p.h);return {...p,w:diameter/aspect(),h:diameter};};getRegions()[selected]=shape==='circle'?{...convert(r),shape,keyframes:r.keyframes?.map(convert)}:{...r,shape};sync();};
 stage.onpointerdown=e=>{
  if(!getEditing()||!isReady()||e.button!==0)return;e.preventDefault();stage.focus({preventScroll:true});video.pause();
  const p=point(e),box=e.target.closest('.blur-region');
  if(box){selected=Number(box.dataset.index);$('blurShape').value=getRegions()[selected].shape||'rectangle';gesture={type:e.target.dataset.handle?'resize':'move',handle:e.target.dataset.handle,start:p,original:regionAtTime(getRegions()[selected],video.currentTime)};}
  else {if(getRegions().length>=12){message('You can add up to 12 blur areas.',true);return;}selected=getRegions().length;getRegions().push(drawRegion(p,p,$('blurShape').value,aspect()));gesture={type:'draw',start:p};}
  stage.setPointerCapture(e.pointerId);sync();
 };
 stage.onpointermove=e=>{if(!gesture)return;const p=point(e),dx=p.x-gesture.start.x,dy=p.y-gesture.start.y;
  const position=gesture.type==='draw'?drawRegion(gesture.start,p,$('blurShape').value,aspect()):gesture.type==='move'?moveRegion(gesture.original,dx,dy):resizeRegion(gesture.original,gesture.handle,dx,dy,aspect());
  try{getRegions()[selected]=setKeyframe({...getRegions()[selected],shape:position.shape},video.currentTime,position);}catch(error){message(error.message,true);gesture=null;}sync();
 };
 const end=()=>{if(!gesture)return;const r=getRegions()[selected];if(r&&(r.w<.015||r.h<.015)){getRegions().splice(selected,1);selected=-1;}gesture=null;sync();};
 stage.onpointerup=end;stage.onpointercancel=end;
 return {sync};
}
