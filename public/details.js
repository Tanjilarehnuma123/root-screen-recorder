import {getSelectedVideo,saveVideoTitle} from './video-titles.js';
const $=id=>document.getElementById(id),studio=document.querySelector('.studio'),stage=$('stage'),editor=$('editor'),grid=editor.querySelector('.edit-grid');
const toolbar=document.createElement('div');toolbar.className='details-toolbar';
toolbar.innerHTML='<button id="detailsAudio" class="tool-pill">♩ &nbsp; Audio & camera</button><button id="detailsCaptions" class="tool-pill" aria-expanded="false">▤ &nbsp; Captions <span id="detailsCaptionState">Add</span></button><button id="detailsBlur" class="tool-pill" aria-expanded="false">◩ &nbsp; Blur <span id="detailsAreaState">0 areas</span></button><div id="detailsSaveSlot"></div><div class="details-export"><div id="detailsExportSlot"></div><button id="exportOptions" aria-label="Export options" aria-expanded="false">⌄</button><div id="exportMenu" hidden><div class="export-menu-label">EXPORT PRESETS</div><button id="presetFull"><span class="preset-dot">●</span><span>1080p Full HD<small>Up to 1080p · best quality</small></span><b>Default</b></button><button id="presetCompact"><span class="preset-dot">○</span><span>720p Compressed<small>Up to 720p · smaller file</small></span><b>Smaller</b></button><button id="exportSrt">↓ &nbsp; Export captions (.srt)</button></div></div><span class="badge details-private">● &nbsp; Private & local</span>';
studio.querySelector('.card-title').after(toolbar);
toolbar.querySelector('.details-private').remove();
const toolbarActions=document.createElement('div');toolbarActions.className='details-toolbar-actions';
toolbar.append(toolbarActions);toolbarActions.append($('detailsAudio'),$('detailsSaveSlot'),toolbar.querySelector('.details-export'));
toolbar.prepend(studio.querySelector('.card-title'));
const heading=document.createElement('div');heading.className='details-heading';heading.innerHTML='<div class="details-title-block"><h1><input id="detailsVideoTitle" type="text" maxlength="180" aria-label="Video title" placeholder="Video name" autocomplete="off" spellcheck="false" disabled></h1><p>Preview your recording before it leaves your device.</p><span id="detailsTitleStatus" role="status"></span></div><div id="detailsNewSlot"></div>';
toolbar.after(heading);
const stickyHeader=document.createElement('div');stickyHeader.className='details-topbar';document.querySelector('.layout').before(stickyHeader);stickyHeader.append(document.querySelector('.session-heading'),toolbar);
new ResizeObserver(()=>{document.documentElement.style.setProperty('--details-header-height',Math.ceil(stickyHeader.getBoundingClientRect().height)+'px');}).observe(stickyHeader);
const recordingTransportSlot=document.createElement('div');recordingTransportSlot.id='recordingTransportSlot';recordingTransportSlot.setAttribute('role','group');recordingTransportSlot.setAttribute('aria-label','Recording controls');stickyHeader.append(recordingTransportSlot);
const titleInput=$('detailsVideoTitle');let currentVideo=getSelectedVideo(),savedTitle='',savingTitle=false,cancelTitle=false,titleVersion=0;
function showSelectedTitle(item){currentVideo=item;titleVersion++;savedTitle=item?.title||'';titleInput.value=savedTitle;titleInput.placeholder=item?.defaultTitle||'Video name';titleInput.disabled=!item;$('detailsTitleStatus').textContent='';}
window.addEventListener('root:selected-video',event=>showSelectedTitle(event.detail));
window.addEventListener('root:title-changed',event=>{if(currentVideo?.name!==event.detail.name)return;currentVideo.title=event.detail.title;savedTitle=event.detail.title;if(document.activeElement!==titleInput||savingTitle)titleInput.value=savedTitle;});
titleInput.onfocus=()=>{cancelTitle=false;};
titleInput.onkeydown=event=>{if(event.key==='Enter'){event.preventDefault();titleInput.blur();}if(event.key==='Escape'){event.preventDefault();event.stopPropagation();cancelTitle=true;titleInput.value=savedTitle;titleInput.blur();}};
titleInput.onblur=async()=>{
 if(cancelTitle||savingTitle||!currentVideo||titleInput.value===savedTitle)return;
 const item=currentVideo,version=titleVersion,value=titleInput.value;savingTitle=true;titleInput.disabled=true;$('detailsTitleStatus').textContent='Saving name…';
 try{const title=await saveVideoTitle(item,value);if(version===titleVersion){savedTitle=title;titleInput.value=title;$('detailsTitleStatus').textContent='Name saved';}}
 catch(error){if(version===titleVersion){titleInput.value=savedTitle;$('detailsTitleStatus').textContent=error.message;}}
 finally{savingTitle=false;if(version===titleVersion)titleInput.disabled=false;}
};
showSelectedTitle(currentVideo);
const original=[...editor.querySelectorAll('button')].find(b=>b.textContent==='Save source video'),newRecording=[...editor.querySelectorAll('button')].find(b=>b.textContent.includes('New recording'));
if(original){original.textContent='Save video';original.className='tool-pill';$('detailsSaveSlot').append(original);}
if(newRecording)newRecording.hidden=true;
$('detailsExportSlot').append($('export'));$('export').textContent='↓ Export MP4';$('export').dataset.preset='full';
const panels=document.createElement('section');panels.className='details-panels';panels.hidden=true;panels.id='detailsPanels';studio.append(panels);panels.append(grid);
const captionPanel=grid.children[0],blurPanel=grid.children[1];captionPanel.id='detailsCaptionPanel';blurPanel.id='detailsBlurPanel';
captionPanel.hidden=blurPanel.hidden=true;
const panelTop=document.createElement('div');panelTop.className='details-panel-top';panelTop.innerHTML='<div id="detailsToolTabs" class="details-tool-tabs" role="tablist" aria-label="Video editing tools"></div>';panels.prepend(panelTop);
$('detailsToolTabs').append($('detailsCaptions'),$('detailsBlur'));
captionPanel.querySelector('h3').textContent='English captions';blurPanel.querySelector('h3').textContent='Blur areas';
for(const [tab,panel] of [['detailsCaptions',captionPanel],['detailsBlur',blurPanel]]){const button=$(tab);button.setAttribute('role','tab');button.removeAttribute('aria-expanded');button.setAttribute('aria-selected','false');button.tabIndex=-1;button.setAttribute('aria-controls',panel.id);panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',tab);}
stage.append($('captionPreview'));
const frame=document.createElement('div');frame.className='details-preview-frame';stage.before(frame);frame.append(stage);
function fitPreview(){const values=stage.style.aspectRatio.split('/').map(Number);const ratio=values.length===2?values[0]/values[1]:Number(values[0]);const value=String(Number.isFinite(ratio)&&ratio>0?ratio:16/9);if(stage.style.getPropertyValue('--video-aspect')!==value)stage.style.setProperty('--video-aspect',value);}
new MutationObserver(fitPreview).observe(stage,{attributes:true,attributeFilter:['style']});fitPreview();
const meta=document.createElement('span');meta.id='detailsTracked';meta.className='details-tracked';document.querySelector('.studio-footer').lastElementChild.replaceWith(meta);
const workspace=document.createElement('div');workspace.className='details-workspace';
const media=document.createElement('div');media.className='details-media';
frame.before(workspace);workspace.append(media,panels);media.append(frame,document.querySelector('.studio-footer'));
panels.setAttribute('aria-label','Video editing tools');

function openPanel(which){
 const target=which==='captions'?captionPanel:blurPanel;if(!panels.hidden&&!target.hidden)return;
 if(which==='captions'&&stage.classList.contains('selecting'))$('blur').click();
 panels.hidden=false;workspace.classList.add('tools-open');captionPanel.hidden=which!=='captions';blurPanel.hidden=which!=='blur';
 $('detailsCaptions').setAttribute('aria-selected',String(which==='captions'));$('detailsBlur').setAttribute('aria-selected',String(which==='blur'));$('detailsCaptions').tabIndex=which==='captions'?0:-1;$('detailsBlur').tabIndex=which==='blur'?0:-1;
 if(which==='blur'&&!stage.classList.contains('selecting'))$('blur').click();
}
$('detailsCaptions').onclick=()=>openPanel('captions');$('detailsBlur').onclick=()=>openPanel('blur');$('detailsToolTabs').onkeydown=event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const blur=event.key==='End'||(event.key!=='Home'&&document.activeElement===$('detailsCaptions'));const which=blur?'blur':'captions';openPanel(which);$(blur?'detailsBlur':'detailsCaptions').focus();};
$('detailsAudio').onclick=()=>$('recordingOptions').click();
function closeMenu(){$('exportMenu').hidden=true;$('exportOptions').setAttribute('aria-expanded','false');}
$('exportOptions').onclick=()=>{const opening=$('exportMenu').hidden;$('exportMenu').hidden=!opening;$('exportOptions').setAttribute('aria-expanded',String(opening));};
function preset(value){$('export').dataset.preset=value;$('presetFull').querySelector('.preset-dot').textContent=value==='full'?'●':'○';$('presetCompact').querySelector('.preset-dot').textContent=value==='compact'?'●':'○';$('export').textContent=value==='compact'?'↓ Export MP4 · 720p':'↓ Export MP4';closeMenu();}
$('presetFull').onclick=()=>preset('full');$('presetCompact').onclick=()=>preset('compact');$('exportSrt').onclick=()=>{$('srtDownload').click();closeMenu();};
document.addEventListener('click',e=>{if(!e.target.closest('.details-export'))closeMenu();});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});
function sync(){const count=Number(($('regions').textContent.match(/^(\d+)/)||[])[1]||0),ready=!!$('srt').value.trim();$('detailsAreaState').textContent=count+' '+(count===1?'area':'areas');$('detailsTracked').textContent=count?`● ${count} blur ${count===1?'area':'areas'} · keyframes supported`:'Your video · saved locally';$('detailsCaptionState').textContent=ready?'● Ready':'Add';$('detailsCaptionState').classList.toggle('ready',ready);$('exportSrt').disabled=!ready;$('exportOptions').disabled=$('export').disabled;}
new MutationObserver(sync).observe($('regions'),{childList:true,subtree:true,characterData:true});new MutationObserver(sync).observe($('export'),{attributes:true,attributeFilter:['disabled']});$('srt').addEventListener('input',sync);new MutationObserver(sync).observe($('srtDownload'),{attributes:true,attributeFilter:['disabled']});
new MutationObserver(()=>{const state=$('state').textContent;studio.classList.toggle('is-recording',state==='● Recording'||state==='Paused'||state==='Saving recording');stickyHeader.classList.toggle('is-recording',state==='● Recording'||state==='Paused'||state==='Saving recording');if(state==='● Recording')showSelectedTitle(null);if(state==='Ready to edit'||state==='Ready to review'){openPanel('captions');sync();}}).observe($('state'),{childList:true,subtree:true});
sync();
