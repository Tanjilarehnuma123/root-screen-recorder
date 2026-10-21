const host=document.createElement('section');
host.className='card storage-card';
host.innerHTML='<div><b>Save recordings to</b><p id="saveFolder">Loading folder…</p><small>New recordings and MP4 exports save here. Existing files stay in their original folder.</small></div><button class="secondary" id="changeFolder">Choose folder</button>';
document.querySelector('.layout').after(host);
const label=document.getElementById('saveFolder'),button=document.getElementById('changeFolder');
fetch('/api/storage').then(r=>r.json()).then(d=>{label.textContent=d.directory||'Folder unavailable';}).catch(()=>label.textContent='Local service unavailable');
button.onclick=async()=>{
 const recording=document.getElementById('state').textContent;
 if(recording.includes('Recording')||recording==='Paused'){document.getElementById('message').textContent='Stop your recording before changing the save folder.';return;}
 button.disabled=true;button.textContent='Choose in Windows…';
 try{
  const r=await fetch('/api/storage/choose',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}),d=await r.json();
  if(!r.ok)throw Error(d.error);
  label.textContent=d.directory;
  document.getElementById('message').textContent=d.cancelled?'Folder unchanged.':'Save folder updated. Root will remember it next time you open the app.';
 }catch(e){document.getElementById('message').textContent='Could not change folder: '+e.message;}
 finally{button.disabled=false;button.textContent='Choose folder';}
};
