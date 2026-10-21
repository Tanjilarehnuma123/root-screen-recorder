export function shouldDeleteBlur(event,{editing,ready,selected,gesturing=false}){
 if(!editing||!ready||selected<0||gesturing||event.repeat||event.isComposing||event.ctrlKey||event.altKey||event.metaKey||event.shiftKey)return false;
 if(!['Backspace','Delete'].includes(event.key))return false;
 const target=event.target;
 return !target?.isContentEditable&&!target?.closest?.('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"],dialog,[role="dialog"]');
}
