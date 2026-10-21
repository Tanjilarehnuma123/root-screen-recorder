import {isLibraryRefreshShortcut} from './workspace-shortcuts.js';
import {createVideoCardDetails} from './video-card-actions.js';
const $=id=>document.getElementById(id);
const icons={search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',video:'<rect x="3" y="5" width="13" height="14" rx="3"/><path d="m16 9 5-3v12l-5-3"/>',upload:'<path d="M12 16V3m-5 5 5-5 5 5M4 15v5h16v-5"/>',folder:'<path d="M3 7V5a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>',chevron:'<path d="m6 9 6 6 6-6"/>',close:'<path d="m6 6 12 12M18 6 6 18"/>',play:'<path d="m9 5 11 7-11 7Z"/>'};
const icon=name=>`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
document.body.classList.add('library-mode');
document.querySelector('.intro').remove();
document.querySelector('.workspace').textContent='LOCAL WORKSPACE';
const nav=document.querySelector('.nav');nav.innerHTML=icon('video')+'<span>Your videos</span>';
document.querySelector('main>header').innerHTML=`<label class="library-search">${icon('search')}<input id="librarySearch" type="search" placeholder="Search your videos" aria-label="Search your videos"><kbd>Ctrl K</kbd></label><span class="badge">● &nbsp; Private & local</span>`;
const library=document.createElement('section');library.className='library-view';
library.innerHTML=`<div class="library-heading"><div><div class="eyebrow">YOUR WORKSPACE</div><h1>Your videos<span>.</span></h1><p>Everything you’ve captured. Ready for what’s next.</p></div><div class="new-video-wrap"><button id="newVideo" class="primary" aria-expanded="false" aria-controls="newVideoMenu">${icon('video')} New video ${icon('chevron')}</button><div id="newVideoMenu" class="new-video-menu" hidden><button id="newRecording">${icon('video')}<span>Record a video<small>Capture your screen and voice</small></span></button><button id="importFromLibrary">${icon('upload')}<span>Import a video<small>Edit a video from your PC</small></span></button></div></div></div><div class="library-tabs"><span>All videos <b id="videoCount">0</b></span></div><div id="libraryFolder"></div><div class="library-toolbar"><div><h2>Your collection</h2><p id="collectionDescription">Loading your local videos…</p></div><div class="library-filters"><select id="videoFormat" aria-label="Filter by video format"><option value="all">All formats</option><option value="MP4">MP4</option><option value="WEBM">WebM</option></select><select id="videoSort" aria-label="Sort videos"><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="name">Name A–Z</option></select></div></div><div id="videoGrid" class="video-grid"></div><div id="libraryEmpty" class="library-empty" hidden>${icon('video')}<h3>A home for your ideas</h3><p>Record your screen or import a video to get started.</p><button id="emptyRecord" class="primary">Record your first video</button></div>`;
document.querySelector('main>header').after(library);
for(const id of ['videoFormat','videoSort']){const select=$(id),control=document.createElement('label');control.className='filter-dropdown';select.before(control);control.append(select);control.insertAdjacentHTML('beforeend',icon('chevron'));}
document.addEventListener('keydown',event=>{if(isLibraryRefreshShortcut(event,document.body.classList.contains('library-mode'))){event.preventDefault();if(!event.repeat)refresh();}});
const storage=document.querySelector('.storage-card');$('libraryFolder').append(storage);
storage.insertAdjacentHTML('afterbegin',`<div class="folder-symbol">${icon('folder')}</div>`);
storage.querySelector('b').textContent='Recording folder';storage.querySelector('small').textContent='New recordings and exports are saved here.';
const dialog=document.createElement('dialog');dialog.id='recordingDrawer';dialog.className='recording-drawer';
dialog.innerHTML=`<div class="drawer-top"><a class="brand" href="#">◉ <span>root<span class="dot">.</span></span></a><button id="closeRecorder" class="icon-button" aria-label="Close recording panel">${icon('close')}</button></div><div class="drawer-heading"><span class="eyebrow">LET’S MAKE SOMETHING</span><h2>A new recording</h2><p>A screen, a voice, a little you.</p></div><div id="drawerSourceSlot"></div><p id="drawerSourceLabel" class="hint">No screen selected</p><div id="drawerSettingsSlot"></div><div id="drawerTransportSlot"></div><div class="drawer-privacy"><span>● &nbsp; Saved only on your PC</span><p>No uploads. No watermarks. Just your ideas.</p></div>`;
document.body.append(dialog);
$('drawerSettingsSlot').append(document.querySelector('.settings'));
$('drawerSourceSlot').append($('choose'));$('choose').innerHTML=icon('video')+'<span>Choose screen, window or tab</span>';
const studio=document.querySelector('.studio'),transport=document.querySelector('.transport');
const sessionTop=document.createElement('div');sessionTop.className='session-heading';sessionTop.innerHTML='<button id="backToVideos" class="text-button">← Back to your videos</button><button id="recordingOptions" class="secondary">Recording controls</button>';
document.querySelector('.layout').before(sessionTop);
const sourceObserver=new MutationObserver(()=>{$('drawerSourceLabel').textContent=$('source').textContent;});sourceObserver.observe($('source'),{childList:true,characterData:true,subtree:true});
function showSession(){document.body.classList.remove('library-mode');document.body.classList.add('session-mode');}
function closeDrawer(){dialog.close();studio.append(transport);}
function openRecorder(){closeMenu();$('drawerTransportSlot').append(transport);dialog.showModal();}
$('closeRecorder').onclick=closeDrawer;dialog.addEventListener('cancel',()=>{studio.append(transport);});
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDrawer();}});
$('recordingOptions').onclick=openRecorder;
const editorNewButton=[...$('editor').querySelectorAll('button')].find(button=>button.textContent.includes('New recording'));if(editorNewButton)editorNewButton.onclick=openRecorder;
function showLibrary(){if(!$('stop').hidden){document.getElementById('message').textContent='Stop your recording before returning to the library.';return;}document.body.classList.add('library-mode');document.body.classList.remove('session-mode');refresh();}
$('backToVideos').onclick=showLibrary;nav.onclick=e=>{e.preventDefault();showLibrary();};
function closeMenu(){$('newVideoMenu').hidden=true;$('newVideo').setAttribute('aria-expanded','false');}
$('newVideo').onclick=()=>{const open=$('newVideoMenu').hidden;$('newVideoMenu').hidden=!open;$('newVideo').setAttribute('aria-expanded',String(open));};
document.addEventListener('click',e=>{if(!e.target.closest('.new-video-wrap'))closeMenu();});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();if(e.ctrlKey&&e.key.toLowerCase()==='k'){e.preventDefault();$('librarySearch').focus();}});
$('newRecording').onclick=$('emptyRecord').onclick=openRecorder;
$('importFromLibrary').onclick=()=>{closeMenu();$('importVideo').click();};
const statusObserver=new MutationObserver(()=>{const status=$('state').textContent;if(status==='● Recording'||status==='Paused'||status==='Ready to review'||status==='Ready to edit'){showSession();if(dialog.open)closeDrawer();}});statusObserver.observe($('state'),{childList:true,subtree:true,characterData:true});
let videos=[],observer;
const duration=seconds=>!Number.isFinite(seconds)?'':`${Math.floor(seconds/60)}:${Math.floor(seconds%60).toString().padStart(2,'0')}`;
function render(){
 observer?.disconnect();const query=$('librarySearch').value.trim().toLowerCase(),format=$('videoFormat').value;
 const visible=videos.filter(v=>(format==='all'||v.format===format)&&v.title.toLowerCase().includes(query));
 visible.sort((a,b)=>$('videoSort').value==='oldest'?a.created-b.created:$('videoSort').value==='name'?a.title.localeCompare(b.title):b.created-a.created);
 $('videoCount').textContent=videos.length;$('collectionDescription').textContent=`${visible.length} ${visible.length===1?'video':'videos'} · Stored on your PC`;$('videoGrid').replaceChildren();$('libraryEmpty').hidden=visible.length>0;
 $('libraryEmpty').querySelector('h3').textContent=videos.length?'No matching videos':'A home for your ideas';$('libraryEmpty').querySelector('p').textContent=videos.length?'Try a different search or format.':'Record your screen or import a video to get started.';
 for(const item of visible){
  const card=document.createElement('article');card.className='video-card';
  const open=document.createElement('button');open.className='video-thumbnail';open.setAttribute('aria-label','Edit '+item.title);
  open.innerHTML=`<img loading="lazy" alt="" src="/thumbnail/${item.name}"><span class="video-play">${icon('play')}</span><span class="video-format">${item.format}</span><span class="video-duration"></span>`;open.querySelector('img').onerror=e=>{e.target.hidden=true;};
  const details=createVideoCardDetails(item,{refresh,thumbnail:open});
  open.onclick=()=>window.dispatchEvent(new CustomEvent('root:open-video',{detail:item}));card.append(open,details);$('videoGrid').append(card);
 }
}
async function refresh(){try{const response=await fetch('/api/library');if(!response.ok)throw Error('Could not load your videos.');const data=await response.json();videos=data.videos;render();}catch(e){$('collectionDescription').textContent=e.message;}}
for(const id of ['librarySearch','videoFormat','videoSort'])$(id).addEventListener(id==='librarySearch'?'input':'change',render);
window.addEventListener('root:video-ready',()=>{showSession();refresh();});window.addEventListener('root:library-refresh',refresh);
const folderObserver=new MutationObserver(()=>refresh());folderObserver.observe($('saveFolder'),{childList:true,subtree:true,characterData:true});
window.addEventListener('root:title-changed',event=>{
 const {name,title}=event.detail,item=videos.find(video=>video.name===name);if(item)item.title=title;
 for(const input of document.querySelectorAll('.video-title-input'))if(input.dataset.videoName===name&&document.activeElement!==input){input.value=title;input.setAttribute('aria-label','Rename '+title);const card=input.closest('.video-card');card.querySelector('.video-thumbnail').setAttribute('aria-label','Edit '+title);card.querySelector('.video-options').setAttribute('aria-label','Options for '+title);}
});
refresh();
