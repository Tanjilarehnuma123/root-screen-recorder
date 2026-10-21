const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
export function moveRegion(r,dx,dy){return {...r,x:clamp(r.x+dx,0,1-r.w),y:clamp(r.y+dy,0,1-r.h)};}
export function drawRegion(a,b,shape,aspect){
 let w=Math.abs(b.x-a.x),h=Math.abs(b.y-a.y);
 if(shape==='circle'){const diameter=Math.min(w*aspect,h);w=diameter/aspect;h=diameter;}
 return {shape,x:b.x<a.x?a.x-w:a.x,y:b.y<a.y?a.y-h:a.y,w,h};
}
export function resizeRegion(r,handle,dx,dy,aspect){
 let left=r.x,top=r.y,right=r.x+r.w,bottom=r.y+r.h;
 if(handle.includes('w'))left=clamp(left+dx,0,right-.015);
 if(handle.includes('e'))right=clamp(right+dx,left+.015,1);
 if(handle.includes('n'))top=clamp(top+dy,0,bottom-.015);
 if(handle.includes('s'))bottom=clamp(bottom+dy,top+.015,1);
 if(r.shape==='circle'){
  let diameter=handle==='n'||handle==='s'?(bottom-top):(right-left)*aspect;
  if(handle.length===2)diameter=Math.max((right-left)*aspect,bottom-top);
  const anchorX=handle.includes('w')?r.x+r.w:r.x,anchorY=handle.includes('n')?r.y+r.h:r.y;
  diameter=Math.min(diameter,(handle.includes('w')?anchorX:1-anchorX)*aspect,handle.includes('n')?anchorY:1-anchorY);
  const w=diameter/aspect,h=diameter;
  left=handle.includes('w')?anchorX-w:anchorX;top=handle.includes('n')?anchorY-h:anchorY;right=left+w;bottom=top+h;
 }
 return {...r,x:left,y:top,w:right-left,h:bottom-top};
}
