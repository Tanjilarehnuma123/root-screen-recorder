// A real file picker keeps selection under the user's control.
export function addImportButton(onFile){
 const input=document.createElement('input');input.type='file';input.accept='.mp4,.webm,.mov,.mkv,.avi,.m4v,video/*';input.hidden=true;
 const button=document.createElement('button');button.className='secondary';button.id='importVideo';button.textContent='↑ Import video';
 document.querySelector('.studio .card-title').append(button);document.body.append(input);
 button.onclick=()=>{input.value='';input.click();};
 input.onchange=()=>{if(input.files[0])onFile(input.files[0],button);};
 return button;
}
