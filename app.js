import {decide,binding,execute} from '/core.mjs';
const $=x=>document.getElementById(x), names=['Normal supplier','Changed destination','Contract changed','Blocked receiver','Missing history'];let history;try{history=JSON.parse(localStorage.getItem('cadrotsentry-history')||'[]');if(!Array.isArray(history))history=[]}catch{history=[]}let idx=0,p,e,decision=null,approval=null,previous=null,used=[],serial=0,proposal=null,replayed=false,incidentSaved=false,approvalTimer;
const reasons={POLICY_CHECKS_PASSED:'Receiver and current evidence match the owner’s policy.',RECEIVER_CHANGED:'Payment destination differs from the owner-approved supplier.',CONTRACT_CODE_CHANGED:'Receiver contract code changed since the baseline approval.',REVIEWED_DENY_ENTRY:'Receiver is on the reviewed demonstration deny list.',INCOMPLETE_EVIDENCE:'Required activity evidence is unavailable or stale.',FIRST_INTERACTION:'No confirmed prior interaction is available.',BUDGET_EXCEEDED:'Payment exceeds the owner’s hard limit.',INVALID_AMOUNT:'The payment amount must be greater than zero.',HUMAN_REJECTED:'The reviewer rejected this payment.',RECEIVER_NOT_FOUND:'The receiver account was not found on NEAR testnet.',RPC_UNAVAILABLE:'The testnet provider did not return account data.',RPC_QUERY_UNRESOLVED:'The testnet provider could not resolve this query.',HISTORY_NOT_CONNECTED:'Account activity history is unavailable.',RELATIONSHIP_NOT_VERIFIED:'Prior payments to this receiver could not be verified.',REPORT_REGISTRY_NOT_CONNECTED:'Threat reports are unavailable.'};
function esc(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}function toast(s){$('toast').textContent=s;$('toast').classList.remove('hidden');setTimeout(()=>$('toast').classList.add('hidden'),4500)}
function event(type,outcome,receiver=p.receiver,receipt){history.unshift({time:new Date().toISOString(),receiver,type,outcome,...(receipt&&{receipt})});history=history.slice(0,200);try{localStorage.setItem('cadrotsentry-history',JSON.stringify(history))}catch{}renderHistory();$('log').textContent=history.slice(0,12).reverse().map(h=>h.time.slice(11,19)+'  '+h.type+'  '+h.outcome).join('\n')}
function renderHistory(){const rows=history.map(h=>'<tr><td>'+esc(new Date(h.time).toLocaleTimeString())+'</td><td>'+esc(h.receiver)+'</td><td>'+esc(({SECURITY_REVIEW:'Security review',INCIDENT_REPLAY:'Incident replay',CHECK:'Payment check',PAYMENT_GUARD:'Payment guard',DEMO_HUMAN_REVIEW:'Reviewer decision',PROPOSAL_CHANGED:'Proposal changed',POLICY_AUTHORIZATION:'Policy authorization',EXECUTION:'Demo payment'})[h.type]||h.type)+'</td><td>'+esc(h.receipt?receiptOutcome(h).join(' · '):h.outcome)+'</td></tr>').join('');$('historyrows').innerHTML=rows||'<tr><td colspan="4">No decisions yet. Run your first security check.</td></tr>';$('attempts').textContent=history.filter(h=>h.type==='CHECK').length;$('blocked').textContent=history.filter(h=>h.outcome==='SIGNING_REFUSED').length;$('paid').textContent=history.filter(h=>h.outcome==='SIMULATED_EXECUTION_CONFIRMED').length;$('pending').textContent=decision?.verdict==='warn'&&(!approval||approval.expires<=Date.now())?1:0}
function select(i){idx=i;serial++;p={service:'API access · monthly developer plan',receiver:i===1?'supplier-new.testnet':i===3?'bad-demo.testnet':'supplier-a.testnet',amount:'2000000000000000000000000'};e={expected:'supplier-a.testnet',limit:'5000000000000000000000000',code:i===2?'code-v2-9d4a':'code-v1-7c21',baselineCode:'code-v1-7c21',revision:serial,known:i!==1&&i!==3,fresh:i!==4,denied:i===3};decision=null;approval=null;render()}
function resultCard(tone, title, bullets=[], next=''){
  const icon={allow:'✓',warn:'!',block:'×',neutral:'·'}[tone];
  return '<div class="result '+tone+'"><div class="result-title"><span class="status-icon" aria-hidden="true">'+icon+'</span><strong>'+esc(title)+'</strong></div>'+
    (bullets.length?'<ul>'+bullets.map(reason=>'<li>'+esc(reason)+'</li>').join('')+'</ul>':'')+
    (next?'<p class="next">'+esc(next)+'</p>':'')+'</div>';
}
function formatNear(amount){
  const digits=amount.padStart(25,'0');
  const whole=digits.slice(0,-24);
  const fraction=digits.slice(-24).replace(/0+$/,'');
  return fraction?whole+'.'+fraction:whole;
}
function render(){ $('scenarios').innerHTML=names.map((n,i)=>'<button class="'+(i===idx?'chosen':'')+'" aria-pressed="'+(i===idx)+'" data-i="'+i+'">'+n+'</button>').join('');$('receiver').textContent=p.receiver;$('service').textContent=p.service;$('amount').textContent=formatNear(p.amount)+' NEAR / '+formatNear(e.limit)+' NEAR';$('request').textContent='demo-'+String(serial).padStart(3,'0');const changed=p.receiver!==e.expected||e.code!==e.baselineCode;$('change').innerHTML=changed?'<div class="change"><b>What changed?</b><br>'+ (p.receiver!==e.expected?'Destination: supplier-a.testnet → '+esc(p.receiver):'Contract code: '+esc(e.baselineCode)+' → '+esc(e.code))+'<br>Prior trust does not cover these conditions.</div>':'';
const facts=[['Account history','Established demo account · 127 days','Fixture, not verified account age'],['Recent activity',e.fresh?'18 successful demo interactions':'History unavailable',e.fresh?'Seeded 30-day activity window':'Coverage unknown; review required'],['Contract code',e.code,e.code===e.baselineCode?'Matches baseline snapshot':'Changed from '+e.baselineCode],['Agent relationship',e.known?'3 prior confirmed demo payments':'No previous demo payments','Successful history is context, not proof of safety'],['Shared threat reports',e.denied?'Reviewed deny entry active':'No active reviewed deny entry',e.denied?'Evidence: seeded malicious-redirection report':'Fixture registry · no production threat feed']];$('evidence').innerHTML=facts.map(([a,b,c])=>'<div class="evidence"><header><b>'+a+'</b><span class="'+(b.includes('Changed')||b.includes('unavailable')?'amber':e.denied&&a==='Shared threat reports'?'red':'ok')+'">'+esc(b)+'</span></header><p>'+esc(c)+'</p></div>').join('');const authorized=!!approval&&approval.expires>Date.now()&&!used.includes(approval.id);
const status={
  allow:['Allowed by demo policy',authorized?'Select Simulate payment to continue.':'Run the check again for a fresh authorization.'],
  warn:['Needs your review',authorized?'Approved for this exact payment. Select Simulate payment.':'Confirm the details independently, then approve or reject this payment.'],
  block:['Payment blocked','Signing is refused. Review the reason before creating a new request.']
};
$('verdict').innerHTML=decision
  ?resultCard(decision.verdict,status[decision.verdict][0],decision.reasons.map(r=>reasons[r]||r),status[decision.verdict][1])
  :resultCard('neutral','Not checked yet',[],'Select Check payment to see the outcome.');
$('approve').disabled=decision?.verdict!=='warn'||authorized;
$('reject').disabled=decision?.verdict!=='warn';
$('execute').disabled=!authorized||decision?.verdict==='block';
$('old').disabled=!decision||!previous||previous===approval;
$('mutate').disabled=!authorized;
$('approvalstate').textContent=authorized?'Authorized for this receiver and amount.':approval&&used.includes(approval.id)?'Demo payment recorded. This authorization has been used.':approval?'Authorization expired.':'No payment authorized.';
renderHistory();renderReceipt()}
function authorize(){
  approval={id:crypto.randomUUID(),binding:binding(p,e),expires:Date.now()+60000};
  previous=approval;
  clearTimeout(approvalTimer);
  approvalTimer=setTimeout(render,60001);
}
$('scenarios').onclick=x=>{const b=x.target.closest('[data-i]');if(b)select(Number(b.dataset.i))};
$('check').onclick=()=>{
  decision=decide(p,e);
  approval=null;
  event('CHECK',decision.verdict.toUpperCase()+': '+decision.reasons.map(r=>reasons[r]||r).join(' '));
  if(decision.verdict==='allow'){authorize();event('POLICY_AUTHORIZATION','ISSUED_FOR_EXACT_PAYMENT')}
  if(decision.verdict==='block')recordPayment('PAYMENT_GUARD','SIGNING_REFUSED',decision.reasons.map(r=>reasons[r]||r).join(' '));
  render();
};
$('approve').onclick=()=>{
  if(decision?.verdict!=='warn')return;
  authorize();
  event('DEMO_HUMAN_REVIEW','APPROVED_EXACT_PAYMENT');
  render();
};
$('reject').onclick=()=>{
  approval=null;
  decision={verdict:'block',reasons:['HUMAN_REJECTED']};
  recordPayment('DEMO_HUMAN_REVIEW','REJECTED',reasons.HUMAN_REJECTED);
  render();
};
function recordPayment(type,outcome,reason){
  event(type,outcome,p.receiver,{service:p.service,expected:e.expected,requested:p.amount,
    spent:outcome==='SIMULATED_EXECUTION_CONFIRMED'?p.amount:'0',reason});
}
function receiptOutcome(entry){
  const titles={
    SIMULATED_EXECUTION_CONFIRMED:'Simulated payment completed',
    FRESH_APPROVAL_REQUIRED:'Payment stopped · fresh approval needed',
    SIGNING_REFUSED:'Signing refused',
    REPLAY_REJECTED:'Payment stopped · approval already used',
    REJECTED:'Payment rejected by reviewer'
  };
  return [titles[entry.outcome]||'Payment stopped',formatNear(entry.receipt.spent)+' NEAR simulated spend'];
}
function renderReceipt(){
  const entry=history.find(item=>item.receipt);
  if(!entry){
    $('receipt').innerHTML='<h3>Latest payment receipt</h3><p>A receipt appears when a payment is simulated, stopped, or rejected.</p>';
    return;
  }
  const {service,expected,requested,reason}=entry.receipt;
  const [title]=receiptOutcome(entry);
  const tone=entry.outcome==='SIMULATED_EXECUTION_CONFIRMED'?'allow':entry.outcome==='FRESH_APPROVAL_REQUIRED'?'warn':'block';
  const rows=[['Purchase',service],['Proposed receiver',entry.receiver],['Requested amount',formatNear(requested)+' NEAR'],['Simulated spend',formatNear(entry.receipt.spent)+' NEAR']];
  if(expected!==entry.receiver)rows.splice(1,0,['Originally approved receiver',expected]);
  $('receipt').innerHTML='<h3>Latest payment receipt</h3><p>'+esc(new Date(entry.time).toLocaleString())+'</p>'+
    resultCard(tone,title,[reason])+
    rows.map(([label,value])=>'<div class="row"><span>'+esc(label)+'</span><b>'+esc(value)+'</b></div>').join('')+
    '<p class="note">Simulation only. No real NEAR moved.</p>';
}
function run(authorization){
  if(!decision)return;
  const rejected=decision.reasons.includes('HUMAN_REJECTED');
  const result=rejected?{ok:false,reason:'SIGNING_REFUSED'}:execute(p,e,authorization,used,Date.now());
  if(result.ok)used.push(authorization.id);
  const explanations={
    SIMULATED_EXECUTION_CONFIRMED:'The authorization matched this payment.',
    FRESH_APPROVAL_REQUIRED:'The approval is missing, expired, or no longer matches this payment.',
    REPLAY_REJECTED:'This approval has already been used.',
    SIGNING_REFUSED:decision.reasons.map(reason=>reasons[reason]||reason).join(' ')
  };
  recordPayment('EXECUTION',result.reason,explanations[result.reason]);
  render();
}
$('execute').onclick=()=>run(approval);$('old').onclick=()=>run(previous);$('mutate').onclick=()=>{p={...p,receiver:p.receiver==='supplier-a.testnet'?'supplier-new.testnet':'supplier-a.testnet'};e={...e,revision:e.revision+1,known:p.receiver===e.expected,denied:p.receiver===incidentReceiver};approval=null;decision=decide(p,e);event('PROPOSAL_CHANGED','PRIOR_APPROVAL_INVALIDATED');render()};$('export').onclick=()=>{const b=new Blob([JSON.stringify({mode:'simulation',history},null,2)],{type:'application/json'}),url=URL.createObjectURL(b),a=document.createElement('a');a.href=url;a.download='cadrotsentry-demo-log.json';a.click();URL.revokeObjectURL(url)};
const pages={
  overview:['Review an agent payment','Pick a sample payment and see why it can proceed, needs your review, or is blocked.'],
  live:['Check a receiver','Look up account evidence before deciding whether to trust a proposed receiver.'],
  history:['Decision history','Review payment checks, authorizations, and saved demo incidents.'],
  replay:['Incident replay','See why a redirected payment was refused and save it for security review.'],
  integration:['AI purchase demo','Start with a supplier offer and follow it through to a payment check.']
};
function openPage(page){
  document.querySelectorAll('main>section').forEach(section=>section.classList.toggle('hidden',section.id!==page));
  document.querySelectorAll('nav button').forEach(button=>{
    const current=button.dataset.page===page;
    button.classList.toggle('active',current);
    if(current)button.setAttribute('aria-current','page');
    else button.removeAttribute('aria-current');
  });
  const [title,subtitle]=pages[page];
  $('title').textContent=title;
  $('crumb').textContent=title;
  $('subtitle').textContent=subtitle;
  window.scrollTo(0,0);
}
document.querySelectorAll('nav button').forEach(button=>button.onclick=()=>openPage(button.dataset.page));
$('reset').onclick=()=>{
  history=[];used=[];previous=null;replayed=false;incidentSaved=false;
  localStorage.removeItem('cadrotsentry-history');
  $('log').textContent='Demo reset. Ready.';
  $('attackResult').textContent='';
  $('attacklog').textContent='Run the replay to see its event log.';
  $('incident').disabled=true;
  $('incidentState').textContent='Run the replay to create a review item in Decision history. Alerts are local to this demo.';
  select(0);
  showProposal(null);
  $('liveReceiver').value='';
  $('liveResult').textContent='Your result will appear here.';
  openPage('overview');
  toast('Demo reset.');
};
const incidentReceiver='bad-demo.testnet';
$('attack').onclick=()=>{
  const payment={receiver:incidentReceiver,amount:'2000000000000000000000000'};
  const evidence={expected:'supplier-a.testnet',limit:'5000000000000000000000000',denied:true,fresh:true,known:false};
  const check=decide(payment,evidence);
  const outcome=execute(payment,evidence,null,[],Date.now());
  const refused=outcome.reason==='SIGNING_REFUSED';
  replayed=refused;
  $('incident').disabled=!refused||incidentSaved;
  event('INCIDENT_REPLAY',outcome.reason,incidentReceiver);
  $('attackResult').innerHTML=resultCard(refused?'block':'warn',refused?'Redirected payment blocked':'Unexpected replay outcome',[
    'Expected receiver: '+evidence.expected+'.',
    'Recorded proposal: '+payment.receiver+' for 2 NEAR.',
    ...check.reasons.map(reason=>reasons[reason]||reason)
  ],refused?'Signing was refused. No transaction was submitted.':'Review the technical log.');
  $('attacklog').textContent=[
    '[recorded proposal] receiver='+payment.receiver,
    '[policy] '+check.verdict.toUpperCase()+' / '+check.reasons.join(', '),
    '[execution] '+outcome.reason,
    '[mode] simulated; no transaction submitted'
  ].join('\n');
};
$('incident').onclick=()=>{
  if(!replayed||incidentSaved)return;
  incidentSaved=true;
  $('incident').disabled=true;
  event('SECURITY_REVIEW','Open for investigation · redirected payment to a blocked receiver · signing refused',incidentReceiver);
  $('incidentState').textContent='Saved in Decision history for review in this browser.';
};
function showProposal(value,source=''){
  proposal=value;
  $('reviewProposal').classList.toggle('hidden',!value);
  $('aioutput').innerHTML=value?'<div class="result neutral"><b>'+esc(source)+'</b>'+
    [['Service',value.service],['Proposed receiver',value.receiver],['Amount',value.amountNear+' NEAR']].map(([label,detail])=>
      '<div class="row"><span>'+esc(label)+'</span><b>'+esc(detail)+'</b></div>').join('')+
    (value.injectionConcern?'<p class="next">The model flagged a possible attempt to influence the payment. Review the offer.</p>':'')+
    '<p class="next">Proposal only. Open the payment workspace to check it.</p></div>':'';
}
async function post(path,data){
  const response=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
  const body=await response.json();
  if(!response.ok||body.error)throw Error(body.error||'Request failed.');
  return body;
}
fetch('/api/config').then(r=>r.json()).then(config=>{
  $('aistatus').textContent=config.aiConfigured?'Model configured':'Model not configured';
  $('ask').disabled=!config.aiConfigured;
}).catch(()=>$('aistatus').textContent='Model connection unavailable');
$('sampleProposal').onclick=()=>showProposal({receiver:'supplier-a.testnet',amountNear:'2',service:'Developer API plan'},'Sample proposal');
$('offer').oninput=()=>showProposal(null);
$('ask').onclick=async()=>{
  const offer=$('offer').value.trim();
  if(!offer){showProposal(null);$('aioutput').textContent='Enter a supplier offer first.';return}
  $('ask').disabled=true;
  $('offer').disabled=true;
  $('sampleProposal').disabled=true;
  showProposal(null);
  $('aioutput').textContent='Reading the offer…';
  try{
    const result=await post('/api/propose',{offer});
    showProposal(result.proposal,'Proposal extracted by NEAR AI');
  }catch(error){
    $('aioutput').textContent=error.message+' You can load the sample proposal to continue.';
  }finally{
    $('ask').disabled=false;
    $('offer').disabled=false;
    $('sampleProposal').disabled=false;
  }
};
$('reviewProposal').onclick=()=>{
  if(!proposal)return;
  select(0);
  idx=-1;
  const [whole,fraction='']=proposal.amountNear.split('.');
  p={receiver:proposal.receiver,amount:BigInt(whole+fraction.padEnd(24,'0')).toString(),service:proposal.service};
  e={...e,known:p.receiver===e.expected,fresh:p.receiver===e.expected,denied:p.receiver===incidentReceiver};
  render();
  openPage('overview');
};
$('liveExample').onclick=()=>{$('liveReceiver').value='testnet';$('liveReceiver').focus()};
$('liveForm').onsubmit=async event=>{
  event.preventDefault();
  $('inspectLive').disabled=true;
  $('liveReceiver').disabled=true;
  $('liveExample').disabled=true;
  $('liveResult').textContent='Checking finalized testnet account data…';
  try{
    const result=await post('/api/inspect',{receiver:$('liveReceiver').value.trim()});
    const account=result.evidence.find(item=>item.signal==='account'&&item.status==='observed');
    const contract=result.evidence.find(item=>item.signal==='contract');
    const title=result.verdict==='block'?'Receiver not found':account?'Account found · more evidence needed':'Receiver could not be verified';
    $('liveResult').innerHTML=resultCard(result.verdict,title,[
      'Receiver: '+result.receiver,
      ...(account?['Observed at finalized block '+account.blockHeight+'.',contract?.localCodePresent||contract?.globalContract?'Contract metadata is present.':'No deployed contract code was reported.']:[]),
      ...result.reasons.map(reason=>reasons[reason]||reason)
    ],result.verdict==='block'?'Double-check the account ID before continuing.':'Verify the supplier independently before making a payment.')+
    '<details class="details"><summary>View source and account data</summary><pre class="log">'+esc(JSON.stringify(result,null,2))+'</pre></details>';
  }catch(error){
    $('liveResult').innerHTML=resultCard('warn','Check unavailable',[error.message],'Check the account ID and try again.');
  }finally{
    $('inspectLive').disabled=false;
    $('liveReceiver').disabled=false;
    $('liveExample').disabled=false;
  }
};
select(0);
openPage('overview');
