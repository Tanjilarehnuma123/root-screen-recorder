export function cameraErrorMessage(error){
 switch(error?.name){
 case 'NotAllowedError':case 'PermissionDeniedError':return 'Camera permission is blocked. Open browser camera settings, allow sites to ask, and remove localhost:4783 from the blocked list. Also check Windows camera privacy settings, then retry.';
 case 'NotFoundError':case 'DevicesNotFoundError':return 'No webcam was found. Connect or enable a webcam, check its privacy shutter, then retry.';
 case 'NotReadableError':case 'TrackStartError':return 'The webcam could not start. Close Camera, Teams, Zoom, or another app using it, check its shutter, then retry.';
 case 'SecurityError':return 'Camera access is disabled by a browser or administrator policy. Check your browser camera settings.';
 case 'AbortError':return 'The camera stopped while starting. Please retry.';
 default:return 'Camera could not start: '+(error?.message||'Unknown camera error. Please retry.');
 }
}
export async function requestCameraStream(devices){
 if(!devices?.getUserMedia)throw new Error('Open Root in Microsoft Edge or Google Chrome at http://localhost:4783 to use the webcam.');
 try{return await devices.getUserMedia({video:{width:{ideal:640},height:{ideal:480}},audio:false});}
 catch(error){if(error.name==='OverconstrainedError')return devices.getUserMedia({video:true,audio:false});throw error;}
}
