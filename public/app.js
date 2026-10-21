import {recordingCountdown} from './recording-countdown.js';
import {selectVideo,downloadName} from './video-titles.js';
import {regionAtTime} from './blur-keyframes.js';
import {createBlurEditor} from './blur-editor.js?v=delete-shortcut';
import {addImportButton} from './import-video.js';
import {cameraErrorMessage,requestCameraStream} from './camera-access.js';
const $=id=>document.getElementById(id), canvas=$('canvas'),ctx=canvas.getContext('2d'),video=$('playback');
let originalName='Root-original.webm';
let screen,mic,cam,audio,mixer,micGain,systemGain,recorder,chunks=[],id,objectURL,regions=[],selecting=false,startPoint,elapsed=0,startTime=0,paused=false,busy=false,raf;
const sourceVideo=document.createElement('video'),camVideo=document.createElement('video');sourceVideo.muted=camVideo.muted=true;sourceVideo.playsInline=camVideo.playsInline=true;
const originalButton=document.createElement('button');originalButton.className='text-button';originalButton.textContent='Save source video';originalButton.onclick=()=>{if(objectURL)download(objectURL,originalName);};$('editor').querySelector('.card-title').append(originalButton);
const newButton=document.createElement('button');newButton.className='text-button';newButton.textContent='＋ New recording';$('editor').querySelector('.card-title').append(newButton);newButton.onclick=()=>{if(busy||active())return;selecting=false;$('stage').classList.remove('selecting');$('blur').textContent='＋ Select blur area';$('choose').click();};
function message(text,error=false){$('message').textContent=text;$('message').classList.toggle('error',error);}
async function api(url,data){const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const d=await r.json();if(!r.ok)throw Error(d.error);return d;}
const active=()=>recorder&&recorder.state!=='inactive';
const frameClock=new Worker('/clock.js');frameClock.onmessage=()=>{if(screen)draw(false);};
function closeStream(stream){stream?.getTracks().forEach(t=>t.stop());}
async function microphone(){if(!$('mic').checked){if(micGain)micGain.gain.value=0;return;}if(!mic){mic=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true}});if(audio){micGain=audio.createGain();audio.createMediaStreamSource(mic).connect(micGain).connect(mixer);}}if(micGain)micGain.gain.value=1;}
let cameraRequest=null,cameraGeneration=0;
const cameraPanel=document.createElement('div');cameraPanel.className='camera-panel';
cameraPanel.innerHTML='<video id="cameraPreview" autoplay playsinline muted hidden aria-label="Webcam preview"></video><p id="cameraStatus" role="status">Webcam is off. Enable it to request camera access.</p><div><button type="button" id="retryCamera" class="secondary">Enable / retry camera</button><button type="button" id="cameraSettings" class="text-button">Browser camera settings</button><button type="button" id="windowsCameraSettings" class="text-button">Windows camera settings</button></div>';
$('camera').closest('label').after(cameraPanel);
async function camera(){
 if(!$('camera').checked){cameraGeneration++;closeStream(cam);cam=null;camVideo.srcObject=null;$('cameraPreview').srcObject=null;$('cameraPreview').hidden=true;$('cameraStatus').textContent='Webcam is off.';return;}
 if(cam?.getVideoTracks().some(t=>t.readyState==='live'))return;
 if(cameraRequest)return cameraRequest;
 const generation=++cameraGeneration;$('cameraStatus').textContent='Requesting access. Choose Allow in the camera permission popup. If none appears, open Browser camera settings below.';
 cameraRequest=(async()=>{
  let stream;
  try{
   stream=await requestCameraStream(navigator.mediaDevices);
   if(generation!==cameraGeneration||!$('camera').checked){closeStream(stream);return;}
   cam=stream;camVideo.srcObject=stream;await camVideo.play();
   if(generation!==cameraGeneration||!$('camera').checked){closeStream(stream);return;}
   $('cameraPreview').muted=true;$('cameraPreview').srcObject=stream;$('cameraPreview').hidden=false;$('cameraPreview').play().catch(()=>{});
   $('cameraStatus').textContent='Camera ready: '+(stream.getVideoTracks()[0].label||'Webcam')+'. This preview appears in your screen recording.';
   stream.getVideoTracks()[0].addEventListener('ended',()=>{if(cam===stream){$('camera').checked=false;camera();$('cameraStatus').textContent='Camera disconnected. Reconnect it and retry.';}});
   message('Webcam is ready. You can see its preview in the settings panel.');
  }catch(e){closeStream(stream);if(generation===cameraGeneration){cam=null;camVideo.srcObject=null;$('cameraPreview').hidden=true;$('camera').checked=false;const text=cameraErrorMessage(e);$('cameraStatus').textContent=text;message(text,true);}throw e;}
  finally{cameraRequest=null;}
 })();return cameraRequest;
}
$('retryCamera').onclick=()=>{if(cameraRequest)return;$('camera').checked=true;camera().catch(()=>{});};
for(const [button,kind] of [['cameraSettings','browser'],['windowsCameraSettings','windows']])$(button).onclick=async()=>{try{await api('/api/camera/settings',{kind});$('cameraStatus').textContent=kind==='browser'?'In browser Camera settings: enable sites to ask for permission, remove localhost:4783 from Blocked if listed, then return and retry.':'In Windows Camera settings: enable Camera access and Let desktop apps access your camera, then return and retry.';}catch(e){message(e.message,true);}};
function draw(schedule=true){if(screen&&sourceVideo.readyState>=2){ctx.fillStyle='#112e28';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(sourceVideo,0,0,canvas.width,canvas.height);if(cam&&camVideo.readyState>=2){const size=Math.round(canvas.height*.23),x=canvas.width-size-28,y=canvas.height-size-28;ctx.save();ctx.beginPath();ctx.arc(x+size/2,y+size/2,size/2,0,Math.PI*2);ctx.clip();const w=camVideo.videoWidth,h=camVideo.videoHeight,s=Math.min(w,h);ctx.drawImage(camVideo,(w-s)/2,(h-s)/2,s,s,x,y,size,size);ctx.restore();}}if(schedule)raf=requestAnimationFrame(()=>draw());}
$('choose').onclick=async()=>{try{screen=await navigator.mediaDevices.getDisplayMedia({video:{frameRate:30},audio:true,systemAudio:'include',surfaceSwitching:'exclude'});sourceVideo.srcObject=screen;await sourceVideo.play();video.hidden=true;$('blurPreview').hidden=true;const scale=Math.min(1,1920/sourceVideo.videoWidth,1080/sourceVideo.videoHeight);canvas.width=Math.floor(sourceVideo.videoWidth*scale/2)*2;canvas.height=Math.floor(sourceVideo.videoHeight*scale/2)*2;$('stage').style.aspectRatio=`${canvas.width}/${canvas.height}`;$('empty').hidden=true;$('stage').classList.add('live');$('record').disabled=false;$('source').textContent=screen.getVideoTracks()[0].label||'Screen selected';screen.getVideoTracks()[0].onended=()=>{if(active())stop();else resetCapture();};cancelAnimationFrame(raf);draw();message(screen.getAudioTracks().length?'Screen and computer audio are ready.':'Screen ready. No computer audio was shared. Choose “Share audio” in the picker if needed.');}catch(e){message(e.message,true);}};
function resetCapture(){cancelAnimationFrame(raf);closeStream(screen);screen=null;cameraGeneration++;closeStream(cam);cam=null;$('cameraPreview').srcObject=null;$('cameraPreview').hidden=true;$('cameraStatus').textContent='Webcam stopped. Enable or retry to preview it again.';closeStream(mic);mic=null;audio?.close();audio=null;micGain=systemGain=null;sourceVideo.srcObject=null;camVideo.srcObject=null;$('record').disabled=true;$('stage').classList.remove('live');}
$('mic').onchange=async()=>{try{await microphone();}catch(e){$('mic').checked=false;message('Microphone unavailable: '+e.message,true);}};
$('camera').onchange=()=>{camera().catch(()=>{});};
$('system').onchange=()=>{if(systemGain)systemGain.gain.value=$('system').checked?1:0;if($('system').checked&&screen&&!screen.getAudioTracks().length)message('No computer audio track is shared. Stop and choose a source with Share audio enabled.',true);};
$('record').onclick=async()=>{if(!screen||busy)return;busy=true;$('record').disabled=true;try{if(id){id=null;regions=[];$('editor').hidden=true;$('srt').value='';$('srtDownload').disabled=true;video.hidden=true;$('blurPreview').hidden=true;}audio=new AudioContext();await audio.resume();mixer=audio.createMediaStreamDestination();if(screen.getAudioTracks().length){systemGain=audio.createGain();systemGain.gain.value=$('system').checked?1:0;audio.createMediaStreamSource(screen).connect(systemGain).connect(mixer);}if(mic){closeStream(mic);mic=null;}await microphone();await camera();await recordingCountdown(screen);draw(false);const stream=canvas.captureStream(30);mixer.stream.getAudioTracks().forEach(t=>stream.addTrack(t));const mime=['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'].find(x=>MediaRecorder.isTypeSupported(x));recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:6000000});chunks=[];recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};recorder.onstop=()=>finish().catch(e=>message(e.message,true));recorder.start(1000);elapsed=0;startTime=performance.now();paused=false;$('pause').textContent='Pause';$('state').textContent='● Recording';$('record').hidden=true;$('pause').hidden=$('stop').hidden=false;message('Recording locally. You can switch microphone, computer audio, and webcam on or off.');}catch(e){audio?.close();audio=null;micGain=systemGain=null;$('record').disabled=!screen?.getVideoTracks().some(t=>t.readyState==='live');message(e.message,e.name!=='AbortError');}finally{busy=false;}};
$('pause').onclick=()=>{if(!active())return;if(!paused){recorder.pause();elapsed+=performance.now()-startTime;}else{recorder.resume();startTime=performance.now();}paused=!paused;$('pause').textContent=paused?'Resume':'Pause';$('state').textContent=paused?'Paused':'● Recording';};
function stop(){if(active()){if(!paused)elapsed+=performance.now()-startTime;recorder.stop();$('stop').disabled=true;}}$('stop').onclick=stop;
setInterval(()=>{if(active()){$('timer').textContent=new Date(elapsed+(paused?0:performance.now()-startTime)).toISOString().slice(14,19);}},250);
function finish(){busy=true;originalName='Root-original.webm';return finishRecording().finally(()=>busy=false);}
async function finishRecording(){message('Saving your recording locally…');const blob=new Blob(chunks,{type:recorder.mimeType});resetCapture();$('pause').hidden=$('stop').hidden=true;$('stop').disabled=false;$('record').hidden=false;$('state').textContent='Ready to review';if(objectURL)URL.revokeObjectURL(objectURL);objectURL=URL.createObjectURL(blob);video.src=objectURL;video.hidden=false;$('editor').hidden=false;$('source').textContent='Recording complete';$('empty').hidden=true;const response=await fetch('/api/recording',{method:'POST',headers:{'Content-Type':'application/octet-stream'},body:blob});const result=await response.json();if(!response.ok)throw Error(result.error);id=result.id;await selectSavedVideo(result.id+'.webm');window.dispatchEvent(new CustomEvent('root:video-ready'));message('Saved on this PC. Preview, add captions or blur, then export MP4.');}
const preview=$('blurPreview'),pc=preview.getContext('2d');
const blurEditor=createBlurEditor({stage:$('stage'),video,getDuration:()=>Number.isFinite(video.duration)?video.duration:elapsed/1000,getRegions:()=>regions,isReady:()=>!!id&&!video.hidden,getEditing:()=>selecting,setEditing:value=>{selecting=value;},message});
function previewBlur(){blurEditor.sync();if(video.readyState>=2&&regions.length&&!video.hidden){preview.width=video.videoWidth;preview.height=video.videoHeight;pc.clearRect(0,0,preview.width,preview.height);for(const region of regions){const r=regionAtTime(region,video.currentTime);const x=r.x*preview.width,y=r.y*preview.height,w=r.w*preview.width,h=r.h*preview.height;pc.save();pc.beginPath();if(r.shape==='circle')pc.ellipse(x+w/2,y+h/2,w/2,h/2,0,0,Math.PI*2);else pc.rect(x,y,w,h);pc.clip();pc.filter='blur(18px)';pc.drawImage(video,x-30,y-30,w+60,h+60,x-30,y-30,w+60,h+60);pc.restore();}preview.hidden=false;}else preview.hidden=true;const cue=parseSrt($('srt').value).find(c=>video.currentTime>=c.start&&video.currentTime<=c.end);$('captionPreview').textContent=cue?.text||'';requestAnimationFrame(previewBlur);}previewBlur();
$('captions').onclick=async()=>{if(!id)return;const b=$('captions');b.disabled=true;message('Transcribing English on your PC. This can take a few minutes…');try{const d=await api('/api/captions',{id});$('srt').value=d.srt;$('srtDownload').disabled=false;message('Captions are ready. Review and edit before downloading the SRT.');}catch(e){message(e.message,true);}finally{b.disabled=false;}};
function download(url,name){const a=document.createElement('a');a.href=url;a.download=name;a.click();}
$('srt').oninput=()=>{$('srtDownload').disabled=!$('srt').value.trim();};
$('srtDownload').onclick=()=>{const url=URL.createObjectURL(new Blob([$('srt').value],{type:'text/plain'}));download(url,'Root-recording.en.srt');setTimeout(()=>URL.revokeObjectURL(url),1000);};
$('export').onclick=async()=>{if(!id)return;$('export').disabled=true;message('Creating your MP4 with blur edits. Keep this page open…');try{const d=await api('/api/export',{id,regions,preset:$('export').dataset.preset||'full'});download(d.url,'Root-recording.mp4');window.dispatchEvent(new CustomEvent('root:library-refresh'));message('Your MP4 is ready and downloading. Save the SRT alongside it to keep captions.');}catch(e){message(e.message,true);}finally{$('export').disabled=false;}};
function parseSrt(text){return text.trim().split(/\r?\n\s*\r?\n/).flatMap(block=>{const lines=block.split(/\r?\n/),i=lines.findIndex(l=>l.includes('-->'));if(i<0)return [];const parts=lines[i].split('-->').map(t=>{const m=t.trim().match(/(\d+):(\d+):(\d+)[,.](\d+)/);return m?+m[1]*3600 + +m[2]*60 + +m[3]+ +m[4]/1000:NaN;});return [{start:parts[0],end:parts[1],text:lines.slice(i+1).join('\n')}];});}
window.addEventListener('beforeunload',e=>{if(active()){e.preventDefault();e.returnValue='Recording in progress';}});
fetch('/api/status').then(r=>r.json()).then(s=>{if(!s.ffmpeg||!s.captions)message('Run Setup.cmd to install the local MP4 and caption tools. You can record now.',true);}).catch(()=>message('Local server is unavailable.',true));
addImportButton(async(file,button)=>{
 if(active()||busy||$('export').disabled||$('captions').disabled){message('Finish the current recording or processing operation before importing a video.',true);return;}
 if(!file.size||file.size>1024*1024*1024){message('Choose a non-empty video smaller than 1 GB.',true);return;}
 busy=true;
 const controls=[button,$('record'),$('choose'),$('export'),$('captions'),newButton,$('changeFolder')].filter(Boolean);
 const previous=controls.map(control=>control.disabled);controls.forEach(control=>control.disabled=true);
 button.textContent='Importing…';message('Importing and preparing your video locally. Large files may take a few minutes…');
 let imported=false;
 try{
  const response=await fetch('/api/import',{method:'POST',headers:{'Content-Type':'application/octet-stream','X-Root-Name':encodeURIComponent(file.name)},body:file});
  const result=await response.json();if(!response.ok)throw Error(result.error);
  resetCapture();video.pause();if(objectURL?.startsWith('blob:'))URL.revokeObjectURL(objectURL);
  id=result.id;objectURL=result.url;originalName='Root-imported-source.mp4';regions=[];selecting=false;startPoint=null;
  $('stage').classList.remove('selecting');$('selection').style.display='none';$('blur').textContent='＋ Select blur area';$('regions').textContent='No blur areas added';
  $('srt').value='';$('srtDownload').disabled=true;$('captionPreview').textContent='';$('blurPreview').hidden=true;
  video.onloadedmetadata=()=>{$('stage').style.aspectRatio=`${video.videoWidth}/${video.videoHeight}`;};video.src=result.url;video.hidden=false;
  $('empty').hidden=true;$('editor').hidden=false;$('source').textContent=file.name;$('state').textContent='Ready to edit';$('timer').textContent='00:00';
  imported=true;await selectSavedVideo(result.id+'.mp4');window.dispatchEvent(new CustomEvent('root:video-ready'));message('Video imported. Add captions or blur, then export MP4. Your selected source file is unchanged.');
  $('stage').scrollIntoView({behavior:'smooth',block:'center'});
 }catch(e){message(e.message,true);}
 finally{busy=false;controls.forEach((control,i)=>control.disabled=previous[i]);if(imported)$('record').disabled=true;button.textContent='↑ Import video';}
});

window.addEventListener('root:open-video',event=>{
 if(active()||busy||$('export').disabled||$('captions').disabled){message('Finish the current recording or processing operation before opening another video.',true);return;}
 const item=event.detail;resetCapture();video.pause();if(objectURL?.startsWith('blob:'))URL.revokeObjectURL(objectURL);
 id=item.id;objectURL=item.url;originalName=item.title+'.'+item.format.toLowerCase();regions=[];selecting=false;startPoint=null;
 $('stage').classList.remove('selecting');$('selection').style.display='none';$('srt').value='';$('srtDownload').disabled=true;$('captionPreview').textContent='';$('blurPreview').hidden=true;
 video.onloadedmetadata=()=>{$('stage').style.aspectRatio=video.videoWidth+'/'+video.videoHeight;};video.src=item.url;video.hidden=false;
 $('empty').hidden=true;$('editor').hidden=false;$('source').textContent=item.title;$('state').textContent='Ready to edit';$('timer').textContent='00:00';selectVideo(item);message('Video ready. Add captions, blur, or keyframes, then export MP4.');
});

async function selectSavedVideo(name){
 const selectedId=id;
 try{const response=await fetch('/api/library');if(!response.ok)throw Error('Could not load video name');const result=await response.json();const item=result.videos.find(video=>video.name===name);if(item&&id===selectedId){selectVideo(item);$('source').textContent=item.title;originalName=downloadName(item.title,item.format);}}
 catch(error){message('Video saved. Reopen it from Your videos to edit its name.',true);}
}
window.addEventListener('root:title-changed',event=>{if(event.detail.name.slice(0,36)!==id)return;$('source').textContent=event.detail.title;originalName=downloadName(event.detail.title,event.detail.name.split('.').pop());});
