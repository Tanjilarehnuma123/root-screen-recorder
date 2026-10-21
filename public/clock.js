// A worker keeps compositing frames while the recorder tab is in the background.
setInterval(()=>postMessage('frame'),1000/30);
