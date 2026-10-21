import test from 'node:test';import assert from 'node:assert/strict';
import {waitForCountdown} from './public/recording-countdown.js';
test('recording waits five full seconds and reports countdown in order',async()=>{let time=0;const ticks=[];await waitForCountdown({now:()=>time,sleep:async ms=>{time+=ms;},tick:value=>ticks.push(value)});assert.equal(time,5000);assert.deepEqual(ticks,[5,4,3,2,1]);});
test('cancellation stops a pending recording before countdown completes',async()=>{let time=0;const controller=new AbortController();await assert.rejects(waitForCountdown({signal:controller.signal,now:()=>time,sleep:async ms=>{time+=ms;controller.abort();},tick:()=>{}}),{name:'AbortError'});assert.ok(time<5000);});
