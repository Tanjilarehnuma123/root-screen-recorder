import test from 'node:test';
import assert from 'node:assert/strict';
import {shouldDeleteBlur} from './public/blur-shortcuts.js';
const state={editing:true,ready:true,selected:0};
test('Delete and Backspace remove only a selected blur during editing',()=>{
 for(const key of ['Delete','Backspace'])assert.equal(shouldDeleteBlur({key},state),true);
 for(const change of [{editing:false},{ready:false},{selected:-1},{gesturing:true}])assert.equal(shouldDeleteBlur({key:'Delete'},{...state,...change}),false);
 for(const change of [{repeat:true},{isComposing:true},{ctrlKey:true},{altKey:true},{metaKey:true},{shiftKey:true},{key:'a'}])assert.equal(shouldDeleteBlur({key:'Delete',...change},state),false);
});
test('typing and dialog controls preserve normal deletion',()=>{
 assert.equal(shouldDeleteBlur({key:'Backspace',target:{isContentEditable:true}},state),false);
 assert.equal(shouldDeleteBlur({key:'Delete',target:{closest:()=>({})}},state),false);
 assert.equal(shouldDeleteBlur({key:'Delete',target:{closest:()=>null}},state),true);
});
