export const geometry=r=>({x:r.x,y:r.y,w:r.w,h:r.h});
export function regionAtTime(region,time){
 const frames=region.keyframes;
 if(!frames?.length)return region;
 if(time<=frames[0].time)return {...region,...geometry(frames[0])};
 for(let i=1;i<frames.length;i++)if(time<=frames[i].time){const a=frames[i-1],b=frames[i],fraction=(time-a.time)/(b.time-a.time),result={...region};for(const key of ['x','y','w','h'])result[key]=a[key]+(b[key]-a[key])*fraction;return result;}
 return {...region,...geometry(frames.at(-1))};
}
export function setKeyframe(region,time,position=regionAtTime(region,time)){
 const frames=(region.keyframes||[]).map(frame=>({...frame}));time=Math.round(time*1000)/1000;
 const index=frames.findIndex(frame=>Math.abs(frame.time-time)<.0005),frame={time,...geometry(position)};
 if(index>=0)frames[index]=frame;else {if(frames.length>=100)throw Error('Maximum 100 keyframes per blur area.');frames.push(frame);}
 frames.sort((a,b)=>a.time-b.time);return {...region,...geometry(position),keyframes:frames};
}
