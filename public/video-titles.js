let selectedVideo=null;
export const getSelectedVideo=()=>selectedVideo;
export function selectVideo(item){selectedVideo=item;window.dispatchEvent(new CustomEvent('root:selected-video',{detail:item}));}
export function downloadName(title,extension){return (title.replace(/[<>:"/\\|?*\x00-\x1f]/g,'-').replace(/[. ]+$/g,'')||'Video')+'.'+extension.toLowerCase();}
export async function saveVideoTitle(item,title,{fetcher=fetch,notify=detail=>window.dispatchEvent(new CustomEvent('root:title-changed',{detail}))}={}){
 const response=await fetcher('/api/library/rename',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:item.name,title:title.trim()})});
 const result=await response.json();if(!response.ok)throw Error(result.error||'Could not save the video name.');
 const canonical=title.trim()||item.defaultTitle||item.title;
 item.title=canonical;notify({name:item.name,title:canonical});return canonical;
}
