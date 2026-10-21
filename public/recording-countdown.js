export async function waitForCountdown({seconds=5,signal,tick,now=()=>performance.now(),sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms))}){
 const end=now()+seconds*1000;let previous;
 while(true){if(signal?.aborted)throw new DOMException('Recording start cancelled.','AbortError');const remaining=Math.max(0,Math.ceil((end-now())/1000));if(remaining===0)return;if(remaining!==previous){tick(remaining);previous=remaining;}await sleep(Math.min(100,end-now()));}
}
export async function recordingCountdown(stream){
 const controller=new AbortController(),track=stream.getVideoTracks()[0];
 if(!track||track.readyState!=='live')throw Error('Choose a screen to share before recording.');
 const drawer=document.getElementById('recordingDrawer');if(drawer?.open)document.getElementById('closeRecorder').click();
 const dialog=document.createElement('dialog');dialog.className='countdown-dialog';dialog.setAttribute('aria-labelledby','countdownTitle');
 dialog.innerHTML='<h2 id="countdownTitle">Get ready to record</h2><div class="countdown-number" aria-live="polite"></div><p>Switch to the window or screen you want to record.<br>Recording starts automatically after 5 seconds.</p><button type="button" class="secondary">Cancel</button>';
 const cancel=()=>controller.abort();dialog.querySelector('button').onclick=cancel;dialog.oncancel=event=>{event.preventDefault();cancel();};track.addEventListener('ended',cancel);document.body.append(dialog);dialog.showModal();
 try{await waitForCountdown({signal:controller.signal,tick:value=>{dialog.querySelector('.countdown-number').textContent=value;}});if(track.readyState!=='live')throw Error('Screen sharing stopped before recording started.');}
 finally{track.removeEventListener('ended',cancel);dialog.close();dialog.remove();}
}
