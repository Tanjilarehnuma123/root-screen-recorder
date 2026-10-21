import test from 'node:test';import assert from 'node:assert/strict';import {isLibraryRefreshShortcut} from './public/workspace-shortcuts.js';
test('Ctrl+Shift+R refreshes the library without affecting editing pages or other shortcuts',()=>{
 const keys={ctrlKey:true,shiftKey:true,key:'R',altKey:false,metaKey:false};
 assert.equal(isLibraryRefreshShortcut(keys,true),true);assert.equal(isLibraryRefreshShortcut({...keys,key:'r'},true),true);
 assert.equal(isLibraryRefreshShortcut(keys,false),false);assert.equal(isLibraryRefreshShortcut({...keys,shiftKey:false},true),false);assert.equal(isLibraryRefreshShortcut({...keys,ctrlKey:false},true),false);assert.equal(isLibraryRefreshShortcut({...keys,key:'K'},true),false);assert.equal(isLibraryRefreshShortcut({...keys,altKey:true},true),false);
});
