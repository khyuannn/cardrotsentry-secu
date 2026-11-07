import assert from 'node:assert/strict';import {decide,binding,execute} from './core.mjs';
const p={receiver:'supplier.testnet',amount:'2000000000000000000000000'},e={expected:p.receiver,limit:'5000000000000000000000000',code:'v1',baselineCode:'v1',revision:1,known:true,fresh:true,denied:false};const a={id:'a',binding:binding(p,e),expires:100};
assert.equal(decide(p,e).verdict,'allow');assert.equal(execute(p,e,a,[],1).ok,true);
assert.equal(decide(p,{...e,denied:true}).verdict,'block');assert.equal(execute(p,{...e,denied:true},a,[],1).reason,'SIGNING_REFUSED');
assert.equal(decide(p,{...e,code:'v2'}).verdict,'warn');assert.equal(execute(p,{...e,code:'v2'},a,[],1).ok,false);
assert.equal(execute({...p,receiver:'other.testnet'},e,a,[],1).ok,false);assert.equal(execute({...p,amount:'100'},e,a,[],1).ok,false);
assert.equal(execute(p,e,a,['a'],1).reason,'REPLAY_REJECTED');assert.equal(execute(p,e,a,[],101).ok,false);assert.equal(execute(p,e,null,[],1).ok,false);
assert.equal(decide(p,{...e,fresh:false}).verdict,'warn');assert.equal(decide({...p,amount:'9999999999999999999999999'},e).verdict,'block');
console.log('11 checks passed: normal, denied, signing refusal, code change, destination/amount mutation, replay, expiry, bypass, missing evidence, budget.');
