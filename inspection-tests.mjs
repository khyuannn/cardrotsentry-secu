import assert from 'node:assert/strict';import {inspectReceiver} from './live-inspection.mjs';
const good={result:{code_hash:'11111111111111111111111111111111',block_height:123,block_hash:'demo-block',amount:'10',storage_usage:100}};
assert.equal((await inspectReceiver('https://evil.test')).status,400);
let call;const result=await inspectReceiver('supplier.testnet',{fetcher:async(url,opt)=>{call={url,body:JSON.parse(opt.body)};return {ok:true,json:async()=>good}}});
assert.equal(call.url,'https://rpc.testnet.near.org');assert.equal(call.body.params.finality,'final');assert.equal(result.verdict,'warn');assert.equal(result.authorizationIssued,false);assert.equal(result.evidence[0].blockHeight,123);assert.equal(result.evidence[1].localCodePresent,false);
const missing=await inspectReceiver('missing.testnet',{fetcher:async()=>({ok:true,json:async()=>({error:{cause:{name:'UNKNOWN_ACCOUNT'}}})})});assert.equal(missing.verdict,'block');
const outage=await inspectReceiver('supplier.testnet',{fetcher:async()=>{throw Error('timeout')}});assert.equal(outage.verdict,'warn');assert.equal(outage.reasons[0],'RPC_UNAVAILABLE');
console.log('Receiver inspection checks passed (mocked transport, not a live-provider test).');
