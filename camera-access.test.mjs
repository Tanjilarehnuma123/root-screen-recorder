import test from 'node:test';
import assert from 'node:assert/strict';
import {requestCameraStream,cameraErrorMessage} from './public/camera-access.js';
test('requests a camera without requesting microphone access',async()=>{
 const stream={};let options;
 assert.equal(await requestCameraStream({getUserMedia:async o=>{options=o;return stream;}}),stream);
 assert.equal(options.audio,false);assert.equal(options.video.width.ideal,640);
});
test('retries unsupported constraints using the default camera',async()=>{
 let calls=0;const stream={};
 assert.equal(await requestCameraStream({getUserMedia:async options=>{if(++calls===1)throw {name:'OverconstrainedError'};assert.equal(options.video,true);return stream;}}),stream);
 assert.equal(calls,2);
});
test('does not repeatedly prompt when access is blocked and explains recovery',async()=>{
 let calls=0;const error={name:'NotAllowedError'};
 await assert.rejects(requestCameraStream({getUserMedia:async()=>{calls++;throw error;}}),e=>e===error);
 assert.equal(calls,1);assert.match(cameraErrorMessage(error),/blocked list/);
 assert.match(cameraErrorMessage({name:'NotFoundError'}),/No webcam/);
 assert.match(cameraErrorMessage({name:'NotReadableError'}),/another app/);
});
