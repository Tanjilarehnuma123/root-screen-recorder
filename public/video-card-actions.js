import {saveVideoTitle} from './video-titles.js';
let activeMenu=null;
const closeMenu=()=>{if(!activeMenu)return;activeMenu.menu.hidden=true;activeMenu.button.setAttribute('aria-expanded','false');activeMenu=null;};
document.addEventListener('click',event=>{if(!event.target.closest('.video-actions'))closeMenu();});
document.addEventListener('focusin',event=>{if(activeMenu&&!event.target.closest('.video-actions'))closeMenu();});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&activeMenu){const button=activeMenu.button;closeMenu();button.focus();}});
const safeName=title=>title.replace(/[<>:"/\\|?*\x00-\x1f]/g,'-').replace(/[. ]+$/g,'')||'Video';
async function post(action,body){const response=await fetch('/api/library/'+action,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await response.json();if(!response.ok)throw Error(data.error||'Could not update video.');return data;}
function notice(text,undo){
 let element=document.getElementById('libraryNotice');
 if(!element){element=document.createElement('div');element.id='libraryNotice';element.setAttribute('role','status');document.querySelector('.library-toolbar').after(element);}
 element.replaceChildren();const label=document.createElement('span');label.textContent=text;element.append(label);
 if(undo){const button=document.createElement('button');button.className='text-button';button.textContent='Undo';button.onclick=async()=>{button.disabled=true;try{await undo();notice('Video restored.');}catch(error){notice(error.message);}};element.append(button);}
}
export function createVideoCardDetails(item,{refresh,thumbnail}){
 const details=document.createElement('div');details.className='video-details';
 const row=document.createElement('div');row.className='video-title-row';
 const input=document.createElement('input');input.className='video-name video-title-input';input.type='text';input.maxLength=180;input.value=item.title;input.placeholder=item.defaultTitle||'Date and time';input.title='Click to rename';input.setAttribute('aria-label','Rename '+item.title);input.autocomplete='off';input.spellcheck=false;
 let saved=item.title,saving=false,cancelled=false;
 input.onfocus=()=>{cancelled=false;};
 input.onkeydown=event=>{if(event.key==='Enter'){event.preventDefault();input.blur();}if(event.key==='Escape'){event.preventDefault();event.stopPropagation();cancelled=true;input.value=saved;input.blur();}};
 input.onblur=async()=>{
  if(cancelled||saving||input.value===saved)return;
  saving=true;input.disabled=true;
  try{saved=await saveVideoTitle(item,input.value);input.value=saved;input.setAttribute('aria-label','Rename '+saved);thumbnail.setAttribute('aria-label','Edit '+saved);button.setAttribute('aria-label','Options for '+saved);notice('Video name saved.');}
  catch(error){input.value=saved;notice(error.message);}
  finally{saving=false;input.disabled=false;}
 };
 const actions=document.createElement('div');actions.className='video-actions';
 const button=document.createElement('button');button.type='button';button.className='video-options';button.textContent='⋯';button.setAttribute('aria-label','Options for '+item.title);button.setAttribute('aria-haspopup','menu');button.setAttribute('aria-expanded','false');
 const menu=document.createElement('div');menu.className='video-options-menu';menu.hidden=true;menu.setAttribute('role','menu');
 const rename=document.createElement('button');rename.textContent='Rename';rename.setAttribute('role','menuitem');rename.onclick=()=>{closeMenu();input.focus();input.select();};
 const download=document.createElement('button');download.textContent='Download';download.setAttribute('role','menuitem');download.onclick=()=>{closeMenu();const link=document.createElement('a');link.href=item.url;link.download=safeName(item.title)+'.'+item.format.toLowerCase();link.click();};
 const remove=document.createElement('button');remove.textContent='Delete';remove.className='delete-video';remove.setAttribute('role','menuitem');remove.onclick=async()=>{closeMenu();button.disabled=true;try{const data=await post('delete',{name:item.name});await refresh();notice('Video deleted.',async()=>{await post('restore',{token:data.token});await refresh();});}catch(error){notice(error.message);button.disabled=false;}};
 menu.append(rename,download,remove);actions.append(button,menu);
 button.onclick=()=>{if(activeMenu?.button===button){closeMenu();return;}closeMenu();menu.hidden=false;button.setAttribute('aria-expanded','true');activeMenu={button,menu};};
 button.onkeydown=event=>{if(event.key==='ArrowDown'){event.preventDefault();if(menu.hidden)button.click();rename.focus();}};
 menu.onkeydown=event=>{const items=[rename,download,remove],index=items.indexOf(document.activeElement);if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();items[(index+(event.key==='ArrowDown'?1:2))%3].focus();}};
 input.dataset.videoName=item.name;row.append(input,actions);
 const meta=document.createElement('p');meta.textContent=new Date(item.created).toLocaleDateString(undefined,{month:'short',day:'numeric'})+' · '+(item.size/1024/1024).toFixed(1)+' MB';details.append(row,meta);
 return details;
}
