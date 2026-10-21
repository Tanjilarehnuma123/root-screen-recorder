export function floatingControls({getState,onCommand,onError}){
 let token,ended=false,pending=false;
 async function post(action,data){const response=await fetch('/api/floating/'+action,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const result=await response.json();if(!response.ok)throw Error(result.error);return result;}
 const ready=post('start',{}).then(async result=>{token=result.token;if(ended)await post('end',{token});}).catch(error=>{if(!ended)onError(error);});
 const timer=setInterval(async()=>{if(!token||ended||pending)return;pending=true;try{const result=await post('sync',{token,...getState()});for(const command of result.commands){if(ended)break;onCommand(command);}}catch(error){clearInterval(timer);if(!ended)onError(error);}finally{pending=false;}},500);
 return {end(){ended=true;clearInterval(timer);if(token)post('end',{token}).catch(()=>{});},ready};
}
