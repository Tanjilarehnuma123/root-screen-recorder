function checkGeometry(r){
 for(const k of ['x','y','w','h'])if(!Number.isFinite(r[k])||r[k]<0||r[k]>1)throw Error('Invalid blur area');
 if(r.w<=0||r.h<=0||r.x+r.w>1.000001||r.y+r.h>1.000001)throw Error('Invalid blur bounds');
}
export function keyframeExpression(frames,key){
 let expression=String(frames.at(-1)[key]);
 for(let i=frames.length-2;i>=0;i--){const a=frames[i],b=frames[i+1];const linear=`(${a[key]}+(${b[key]}-${a[key]})*(T-${a.time})/${b.time-a.time})`;expression=`if(lt(T,${b.time}),${linear},${expression})`;}
 return `if(lt(T,${frames[0].time}),${frames[0][key]},${expression})`;
}
export function buildBlurFilters(regions){
 if(!Array.isArray(regions)||regions.length>12)throw Error('Maximum 12 blur areas');
 const filters=[];let last='0:v';
 if(regions.some(r=>r.keyframes?.length)){filters.push('[0:v]setpts=PTS-STARTPTS[blurClock]');last='blurClock';}
 regions.forEach((r,i)=>{
  checkGeometry(r);
  if(r.shape&&!['rectangle','circle'].includes(r.shape))throw Error('Invalid blur shape');
  if(r.keyframes!==undefined&&!Array.isArray(r.keyframes))throw Error('Invalid keyframes');
  if(r.keyframes?.length){
   if(r.keyframes.length>100)throw Error('Maximum 100 keyframes per blur area');
   r.keyframes.forEach((frame,index)=>{checkGeometry(frame);if(!Number.isFinite(frame.time)||frame.time<0||frame.time>86400||(index&&frame.time<=r.keyframes[index-1].time))throw Error('Invalid keyframe times');});
   const x=keyframeExpression(r.keyframes,'x'),y=keyframeExpression(r.keyframes,'y'),w=keyframeExpression(r.keyframes,'w'),h=keyframeExpression(r.keyframes,'h');
   const mask=r.shape==='circle'?`lte(pow((X/W-(${x})-(${w})/2)/((${w})/2),2)+pow((Y/H-(${y})-(${h})/2)/((${h})/2),2),1)`:`between(X/W,${x},(${x})+(${w}))*between(Y/H,${y},(${y})+(${h}))`;
   filters.push(`[${last}]split[base${i}][copy${i}];[copy${i}]boxblur=lr=min(18\\,min(h\\,w)/8):lp=3:cr=0,format=yuva444p,geq=lum='lum(X,Y)':cb='cb(X,Y)':cr='cr(X,Y)':a='255*(${mask})'[blur${i}];[base${i}][blur${i}]overlay=0:0[v${i}]`);last='v'+i;return;
  }
  let effect=`[copy${i}]crop=w=iw*${r.w}:h=ih*${r.h}:x=iw*${r.x}:y=ih*${r.y},boxblur=lr=min(h\\,w)/8:lp=3:cr=0`;
  if(r.shape==='circle')effect+=",format=yuva444p,geq=lum='lum(X,Y)':cb='cb(X,Y)':cr='cr(X,Y)':a='if(lte(pow((X-W/2)/(W/2),2)+pow((Y-H/2)/(H/2),2),1),255,0)'";
  filters.push(`[${last}]split[base${i}][copy${i}];${effect}[blur${i}];[base${i}][blur${i}]overlay=x=main_w*${r.x}:y=main_h*${r.y}[v${i}]`);last='v'+i;
 });return {filters,last};
}
