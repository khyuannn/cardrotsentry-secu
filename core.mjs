export function decide(p,e){
 const reasons=[];let verdict='allow';const warn=x=>{if(verdict!=='block')verdict='warn';reasons.push(x)};const block=x=>{verdict='block';reasons.push(x)};
 if(!/^\d+$/.test(p.amount)||BigInt(p.amount)<=0n)block('INVALID_AMOUNT');
 if(/^\d+$/.test(p.amount)&&BigInt(p.amount)>BigInt(e.limit))block('BUDGET_EXCEEDED');
 if(e.denied)block('REVIEWED_DENY_ENTRY');
 if(p.receiver!==e.expected)warn('RECEIVER_CHANGED');
 if(e.code!==e.baselineCode)warn('CONTRACT_CODE_CHANGED');
 if(!e.fresh)warn('INCOMPLETE_EVIDENCE');
 if(!e.known)warn('FIRST_INTERACTION');
 return {verdict,reasons:reasons.length?reasons:['POLICY_CHECKS_PASSED']};
}
export function binding(p,e){return JSON.stringify([p.receiver,p.amount,e.code,e.revision])}
export function execute(p,e,approval,used,now){
 const d=decide(p,e);
 if(d.verdict==='block')return {ok:false,reason:'SIGNING_REFUSED'};
 if(!approval||approval.binding!==binding(p,e)||approval.expires<now)return {ok:false,reason:'FRESH_APPROVAL_REQUIRED'};
 if(used.includes(approval.id))return {ok:false,reason:'REPLAY_REJECTED'};
 return {ok:true,reason:'SIMULATED_EXECUTION_CONFIRMED'};
}
