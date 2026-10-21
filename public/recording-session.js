export function createRecordingSession(recorder,now=()=>performance.now()){
 let elapsed=0,started=now(),paused=false,stopped=false;
 const duration=()=>elapsed+(paused||stopped?0:now()-started);
 return {
  duration,
  togglePause(){
   if(stopped||recorder.state==='inactive')return;
   if(paused){recorder.resume();started=now();}else{recorder.pause();elapsed+=now()-started;}
   paused=!paused;return paused?'Paused':'● Recording';
  },
  stop(){
   if(stopped||recorder.state==='inactive')return false;
   const total=duration();recorder.stop();elapsed=total;stopped=true;return true;
  }
 };
}
