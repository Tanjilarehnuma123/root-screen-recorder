export function isLibraryRefreshShortcut(event,libraryMode){
 return !!libraryMode&&event.ctrlKey&&event.shiftKey&&!event.altKey&&!event.metaKey&&String(event.key).toLowerCase()==='r';
}
