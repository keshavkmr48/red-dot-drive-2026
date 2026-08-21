import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const UPI_ID = 'youthdreamersindia@kotak';
const PAYEE = 'Youth Dreamers Foundation';
const NOTE = 'Red Dot Drive 2026';
const GOAL = 500000;
const DEADLINE = new Date('2026-09-05T23:59:59+05:30');
const SNAPSHOT_BUCKET = 'donation-proofs';
const MAX_SNAPSHOT_SIZE = 5 * 1024 * 1024;

const supabase = createClient(window.__SUPABASE_URL__, window.__SUPABASE_PUBLISHABLE_KEY__);
const $ = (id) => document.getElementById(id);
let pendingDonationId = localStorage.getItem('reddot_pending_donation_id');
let pendingAmount = null;
let statusPoll;

const fmtINR = (n) => '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN');
function currentAmount() { const v = parseFloat($('amountInput')?.value); return v > 0 ? Math.round(v) : null; }
function buildUpiUriPlain(amt) { return `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(PAYEE)}&am=${amt}&cu=INR&tn=${encodeURIComponent(NOTE)}`; }
function showToast(msg) { const t=$('toast'); if(!t)return; t.textContent=msg; t.classList.add('show'); clearTimeout(window.__toastTimer); window.__toastTimer=setTimeout(()=>t.classList.remove('show'),3500); }

async function loadProgress(){
  const {data,error}=await supabase.rpc('get_campaign_progress'); if(error) throw error;
  const raised=Number(data?.raised||0), pct=Math.min(100,raised/GOAL*100);
  $('dotFill').style.height=pct+'%'; $('dotPct').textContent=pct.toFixed(2)+'%'; $('statRaised').textContent=fmtINR(raised); $('cardRaised').textContent=fmtINR(raised); $('barFill').style.width=pct+'%'; $('pctText').textContent=pct.toFixed(2)+'% funded'; $('remainingText').textContent=fmtINR(Math.max(0,GOAL-raised))+' to go';
  const diff=Math.max(0,DEADLINE-new Date()), days=Math.floor(diff/86400000), hours=Math.floor(diff%86400000/3600000); $('statDays').textContent=days; $('countdown').innerHTML=`<div class="cd-box"><div class="cd-num">${days}</div><div class="cd-label">Days</div></div><div class="cd-box"><div class="cd-num">${hours}</div><div class="cd-label">Hours</div></div><div class="cd-box"><div class="cd-num mono">5 Sep</div><div class="cd-label">Closes</div></div>`;
}

async function getDonationStatus(){ if(!pendingDonationId)return null; const {data,error}=await supabase.rpc('get_donation_status',{p_donation_id:pendingDonationId}); if(error)throw error; return data; }
async function renderDonationStatus(){
  if(!pendingDonationId)return; const d=await getDonationStatus(); if(!d)return;
  $('donationStatusCard').style.display='block';
  if(d.status==='confirmed'){ $('donationStatusTitle').textContent='Donation verified ✓'; $('donationStatusText').textContent=`${fmtINR(d.amount)} has been added to the public Red Dot Drive tracker.`; localStorage.removeItem('reddot_pending_donation_id'); pendingDonationId=null; pendingAmount=null; await loadProgress(); }
  else if(d.status==='rejected'){ $('donationStatusTitle').textContent='Donation could not be verified'; $('donationStatusText').textContent='Please contact Keshav on WhatsApp with your transaction details if you believe this is incorrect.'; }
  else { $('donationStatusTitle').textContent='Donation verification in progress'; $('donationStatusText').textContent=`We have your ${fmtINR(d.amount)} donation submission. It will be added to the public tracker after verification.`; }
}

function validateDonorForm(){
  const name=$('donorName')?.value.trim();
  const phone=$('donorPhone')?.value.trim();
  const amount=currentAmount();
  const txid=$('transactionId')?.value.trim();
  const file=$('transactionSnapshot')?.files?.[0];
  if(!name) throw new Error('Please enter your name.');
  if(!phone || phone.replace(/\D/g,'').length < 10) throw new Error('Please enter a valid phone number.');
  if(!amount) throw new Error('Please select or enter a donation amount.');
  if(!txid && !file) throw new Error('Please provide either the transaction ID / UTR or a transaction snapshot.');
  if(file){
    if(!file.type.startsWith('image/')) throw new Error('Transaction snapshot must be an image.');
    if(file.size > MAX_SNAPSHOT_SIZE) throw new Error('Transaction snapshot must be 5 MB or smaller.');
  }
  return {name,phone,amount,txid,file};
}

async function uploadSnapshot(file){
  if(!file) return null;
  const ext=(file.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'');
  const path=`pending/${crypto.randomUUID()}.${ext || 'jpg'}`;
  const {error}=await supabase.storage.from(SNAPSHOT_BUCKET).upload(path,file,{contentType:file.type,upsert:false});
  if(error) throw error;
  return path;
}

async function createPendingDonation(){
  const f=validateDonorForm();
  const snapshotPath=await uploadSnapshot(f.file);
  const {data,error}=await supabase.rpc('create_pending_donation',{
    p_amount:f.amount,
    p_donor_name:f.name,
    p_phone:f.phone,
    p_transaction_id:f.txid||null,
    p_snapshot_path:snapshotPath,
    p_transaction_note:$('donorNote')?.value.trim()||null
  });
  if(error) throw error;
  pendingDonationId=data.id; pendingAmount=f.amount; localStorage.setItem('reddot_pending_donation_id',pendingDonationId); return data;
}

async function markTransactionShared(){ if(!pendingDonationId)return; const {error}=await supabase.rpc('mark_transaction_shared',{p_donation_id:pendingDonationId}); if(error)throw error; }

function renderQR(amt){ const el=$('qrcode'); if(!el||typeof QRCode==='undefined')return; el.innerHTML=''; new QRCode(el,{text:buildUpiUriPlain(amt||currentAmount()||1),width:168,height:168,colorDark:'#211C18',colorLight:'#fff',correctLevel:QRCode.CorrectLevel.M}); }
function downloadQR(){
  const amount=currentAmount()||pendingAmount||1, uri=buildUpiUriPlain(amount), canvas=document.createElement('canvas'), size=1200, qrSize=760; canvas.width=size; canvas.height=1050; const ctx=canvas.getContext('2d'); ctx.fillStyle='#fff'; ctx.fillRect(0,0,size,1050);
  const holder=document.createElement('div'); Object.assign(holder.style,{position:'fixed',left:'-10000px',top:'0',width:qrSize+'px',height:qrSize+'px',background:'#fff'}); document.body.appendChild(holder);
  new QRCode(holder,{text:uri,width:qrSize,height:qrSize,colorDark:'#000',colorLight:'#fff',correctLevel:QRCode.CorrectLevel.M});
  setTimeout(()=>{const q=holder.querySelector('canvas')||holder.querySelector('img'); if(q)ctx.drawImage(q,(size-qrSize)/2,45,qrSize,qrSize); ctx.textAlign='center'; ctx.fillStyle='#211C18'; ctx.font='600 34px Inter,Arial,sans-serif'; ctx.fillText('UPI ID',size/2,875); ctx.font='500 38px "IBM Plex Mono",monospace'; ctx.fillText(UPI_ID,size/2,925); ctx.fillStyle='#5B5148'; ctx.font='400 27px Inter,Arial,sans-serif'; ctx.fillText('Red Dot Drive 2026',size/2,985); const a=document.createElement('a'); a.href=canvas.toDataURL('image/png'); a.download=`red-dot-drive-2026-payment-${amount}.png`; a.click(); holder.remove();},200);
}

function donorFormReady(){
  const name=$('donorName')?.value.trim();
  const phone=$('donorPhone')?.value.trim();
  const amount=currentAmount();
  const txid=$('transactionId')?.value.trim();
  const file=$('transactionSnapshot')?.files?.[0];
  return Boolean(name && phone && phone.replace(/\D/g,'').length >= 10 && amount && (txid || file));
}

function updateSubmitVerificationButton(){
  const btn=$('submitVerificationBtn');
  if(!btn)return;
  const ready=donorFormReady();
  btn.classList.toggle('ready',ready);
  const note=$('submitVerificationNote');
  if(note)note.classList.toggle('ready',ready);
  btn.disabled=!ready;
}

function ensureSubmitVerificationButton(){
  const details=document.querySelector('.donation-details-panel');
  if(!details)return;
  let btn=$('submitVerificationBtn');
  if(!btn){
    btn=document.createElement('button');
    btn.id='submitVerificationBtn';
    btn.type='button';
    btn.textContent='Submit for verification';
    btn.addEventListener('click',startVerification);

    const style=document.createElement('style');
    style.id='verification-submit-style';
    style.textContent=`
      #submitVerificationBtn{width:100%;margin:18px 0 8px;padding:14px 18px;border:0;border-radius:10px;background:var(--red);color:#fff;font-size:15px;font-weight:700;cursor:pointer;display:block;box-shadow:0 8px 18px -10px rgba(194,30,58,.6)}
      #submitVerificationBtn.ready{opacity:1;cursor:pointer}
      #submitVerificationBtn:not(.ready){opacity:.48;cursor:not-allowed}
      #submitVerificationBtn.ready:hover{transform:translateY(-1px)}
      .submit-verification-note{font-size:11.5px;color:var(--ink-soft);line-height:1.5;text-align:center;margin:0 0 4px}
    `;
    document.head.appendChild(style);
  }
  details.appendChild(btn);
  let note=$('submitVerificationNote');
  if(!note){
    note=document.createElement('div');
    note.id='submitVerificationNote';
    note.className='submit-verification-note';
    note.textContent='Your details are complete. Submit them for verification.';
  }
  details.appendChild(note);
  updateSubmitVerificationButton();
}

function arrangeDonationModal(){
  const modal=document.querySelector('.modal');
  if(!modal) return;
  const title=modal.querySelector('.modal-title');
  if(title) title.textContent='Fill the details for transaction verification';
  if(modal.dataset.landscapeReady==='1') return;
  const qr=document.getElementById('qrBlock'), donorFields=modal.querySelector('.donor-fields'), amountChips=modal.querySelector('.amount-chips'), amountRow=modal.querySelector('.amount-input-row'), callout=modal.querySelector('.modal-callout');
  if(!qr || !donorFields) return;

  const layout=document.createElement('div'); layout.className='donation-landscape';
  const payment=document.createElement('div'); payment.className='donation-payment-panel';
  const details=document.createElement('div'); details.className='donation-details-panel';
  layout.append(payment,details);

  if(amountChips) payment.appendChild(amountChips);
  if(amountRow) payment.appendChild(amountRow);
  payment.appendChild(qr);
  if(callout) payment.appendChild(callout);

  details.appendChild(donorFields);
  ['transactionId','transactionSnapshot','donorNote'].forEach(id=>{
    const el=document.getElementById(id); if(!el)return;
    const wrapper=el.closest('.form-field') || el.parentElement;
    if(wrapper && wrapper!==donorFields && !wrapper.closest('.donation-details-panel')) details.appendChild(wrapper);
  });

  const sub=modal.querySelector('.modal-sub'); if(sub) sub.insertAdjacentElement('afterend',layout); else modal.insertBefore(layout,modal.firstChild);

  const style=document.createElement('style');
  style.textContent=`
    .modal{width:min(94vw,900px);max-width:900px;max-height:92vh;padding:28px 30px 32px}
    .modal-title{font-size:24px;line-height:1.15;max-width:760px}
    .modal-sub{margin-bottom:18px}
    .donation-landscape{display:grid;grid-template-columns:minmax(280px,.95fr) minmax(320px,1.05fr);gap:24px;align-items:start}
    .donation-payment-panel{background:var(--paper-2);border-radius:14px;padding:20px;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;min-height:100%}
    .donation-payment-panel .amount-chips{width:100%;justify-content:center;margin:0 0 12px}
    .donation-payment-panel .amount-input-row{width:100%;margin-bottom:14px}
    .donation-payment-panel #amountInput{background:#fff}
    .donation-payment-panel .qr-block{border-top:1px dashed var(--line);margin-top:4px;padding-top:16px;width:100%}
    .donation-payment-panel #qrcode{margin-top:4px}
    .donation-details-panel{background:var(--white);border:1px solid var(--line);border-radius:14px;padding:20px}
    .donation-details-panel .donor-fields{display:grid;gap:10px;margin-bottom:14px}
    .donation-details-panel input,.donation-details-panel select,.donation-details-panel textarea{width:100%}
    @media(max-width:700px){.modal{width:100%;max-width:100%;border-radius:20px 20px 0 0;padding:24px 18px 28px}.donation-landscape{grid-template-columns:1fr;gap:16px}.donation-payment-panel{min-height:0;padding:16px}.donation-details-panel{padding:16px}.modal-title{font-size:21px}}
  `;
  modal.appendChild(style); modal.dataset.landscapeReady='1';
}

function addRecentDonationsSection(){
  if($('recentVerifiedDonations')) return;
  const footer=document.querySelector('footer');
  if(!footer) return;
  const section=document.createElement('section');
  section.id='recentVerifiedDonations';
  section.innerHTML=`
    <div class="wrap">
      <div class="section-tag">Verified donations</div>
      <h2 class="section-title">Recent contributions</h2>
      <div class="progress-card recent-donations-card">
        <div id="recentDonationsList"><div class="recent-empty">Loading verified donations…</div></div>
        <div class="tracker-note">Only donations verified by the campaign team are shown here. Transaction IDs are masked for privacy.</div>
      </div>
    </div>`;
  footer.parentNode.insertBefore(section,footer);
  const style=document.createElement('style');
  style.textContent=`
    .recent-donations-card{padding:20px 24px}
    .recent-table{width:100%;border-collapse:collapse}
    .recent-table th,.recent-table td{padding:12px 6px;border-bottom:1px solid var(--line);text-align:center;font-size:13px}
    .recent-table th{font-size:11px;text-transform:uppercase;letter-spacing:.07em;color:var(--ink-soft);font-weight:600}
    .recent-table td:first-child{font-weight:600;color:var(--red-deep);white-space:nowrap}
    .recent-table td:last-child{font-family:'IBM Plex Mono',monospace;font-size:12px}
    .recent-empty{text-align:center;font-size:14px;color:var(--ink-soft);padding:14px 0}
    @media(max-width:560px){.recent-table th,.recent-table td{padding:10px 4px;font-size:12px}}
  `;
  document.head.appendChild(style);
}

async function loadRecentDonations(){
  const list=$('recentDonationsList');
  if(!list)return;
  const {data,error}=await supabase.rpc('get_recent_verified_donations',{p_limit:20});
  if(error){ console.error('Recent donations:',error); list.innerHTML='<div class="recent-empty">Verified donation history will appear here.</div>'; return; }
  if(!data?.length){ list.innerHTML='<div class="recent-empty">No verified donations yet.</div>'; return; }
  list.innerHTML=`<table class="recent-table"><thead><tr><th>Amount</th><th>Verified</th><th>Transaction</th></tr></thead><tbody>${data.map(d=>{
    const dt=d.verified_at?new Date(d.verified_at).toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}):'—';
    return `<tr><td>${fmtINR(d.amount)}</td><td>${dt}</td><td>${d.transaction_id_masked||'Snapshot verified'}</td></tr>`;
  }).join('')}</tbody></table>`;
}

function openModal(){ arrangeDonationModal(); ensureSubmitVerificationButton(); $('overlay').classList.add('open'); document.body.style.overflow='hidden'; renderQR(); updateSubmitVerificationButton(); }
function closeModal(ask=true){ if(!$('overlay').classList.contains('open'))return; if(ask&&(pendingAmount||currentAmount())) return openVerification(); $('overlay').classList.remove('open'); document.body.style.overflow=''; }
function openVerification(){ const amount=pendingAmount||currentAmount(); if(!amount)return closeModal(false); $('verificationAmount').textContent=fmtINR(amount); $('verificationQuestion').style.display='block'; $('sharePrompt').classList.remove('open'); $('shareActions').style.display='none'; $('verificationOverlay').classList.add('open'); document.body.style.overflow='hidden'; }
function closeVerification(){ $('verificationOverlay').classList.remove('open'); $('overlay').classList.remove('open'); document.body.style.overflow=''; }

async function startVerification(){
  try{
    validateDonorForm(); await createPendingDonation(); await markTransactionShared();
    const msg=`Red Dot Drive 2026 — transaction details\nDonation ID: ${pendingDonationId}\nName: ${$('donorName').value.trim()}\nPhone: ${$('donorPhone').value.trim()}\nAmount: ${fmtINR(pendingAmount)}\nTransaction ID/UTR: ${$('transactionId').value.trim()||'Transaction snapshot uploaded'}\n\nPlease verify the transaction.`;
    window.open(`https://wa.me/919582621307?text=${encodeURIComponent(msg)}`,'_blank','noopener');
    $('verificationQuestion').style.display='none'; $('sharePrompt').classList.add('open'); $('shareActions').style.display='grid'; closeVerification(); await renderDonationStatus(); showToast('Donation verification in progress.');
  } catch(e){ console.error(e); showToast(e.message||'Unable to submit donation.'); }
}
async function confirmSharedAndClose(){ try{ await markTransactionShared(); closeVerification(); $('overlay').classList.remove('open'); document.body.style.overflow=''; await renderDonationStatus(); showToast('Donation verification in progress.'); }catch(e){showToast(e.message||'Unable to update donation status.');} }
function selectAmount(amount){ document.querySelectorAll('.chip').forEach(c=>c.classList.remove('active')); const c=[...document.querySelectorAll('.chip')].find(x=>Number(x.dataset.amt)===Number(amount)); if(c)c.classList.add('active'); $('amountInput').value=amount; pendingAmount=Number(amount); renderQR(pendingAmount); updateSubmitVerificationButton(); }
async function copyUPI(){ try{await navigator.clipboard.writeText(UPI_ID); showToast('UPI ID copied');}catch{showToast(`UPI ID: ${UPI_ID}`);} }

document.addEventListener('DOMContentLoaded',async()=>{
  document.querySelectorAll('.chip').forEach(c=>c.addEventListener('click',()=>{selectAmount(Number(c.dataset.amt));updateSubmitVerificationButton();}));
  $('amountInput')?.addEventListener('input',()=>{pendingAmount=currentAmount(); renderQR(pendingAmount||1); updateSubmitVerificationButton();});
  ['donorName','donorPhone','donorNote'].forEach(id=>$(id)?.addEventListener('input',updateSubmitVerificationButton));
  $('transactionId')?.addEventListener('input',()=>{if($('transactionId').value.trim()) $('transactionSnapshot').value=''; updateSubmitVerificationButton();});
  $('transactionSnapshot')?.addEventListener('change',()=>{if($('transactionSnapshot').files.length) $('transactionId').value=''; updateSubmitVerificationButton();});
  try{
    addRecentDonationsSection();
    await loadProgress();
    await renderDonationStatus();
    await loadRecentDonations();
    statusPoll=setInterval(async()=>{try{await loadProgress();await renderDonationStatus();await loadRecentDonations();}catch{}} ,30000);
  }catch(e){console.error(e);showToast('Unable to connect to the donation database.');}
});
window.openModal=openModal; window.closeModal=closeModal; window.closeVerification=closeVerification; window.downloadQR=downloadQR; window.copyUPI=copyUPI; window.toggleQR=()=>renderQR(); window.verifyPaidAndShared=startVerification; window.showSharePrompt=startVerification; window.confirmSharedAndClose=confirmSharedAndClose;
