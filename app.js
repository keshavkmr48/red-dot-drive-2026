import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const UPI_ID = 'youthdreamersindia@kotak';
const PAYEE = 'Youth Dreamers Foundation';
const NOTE = 'Red Dot Drive 2026';
const GOAL = 500000;
const DEADLINE = new Date('2026-09-05T23:59:59+05:30');

const supabase = createClient(window.__SUPABASE_URL__, window.__SUPABASE_PUBLISHABLE_KEY__);
const $ = (id) => document.getElementById(id);
let pendingDonationId = localStorage.getItem('reddot_pending_donation_id');
let pendingAmount = null;
let statusPoll;

const fmtINR = (n) => '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN');
function currentAmount() { const v = parseFloat($('amountInput')?.value); return v > 0 ? Math.round(v) : null; }
function buildUpiUriPlain(amt) { return `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(PAYEE)}&am=${amt}&cu=INR&tn=${encodeURIComponent(NOTE)}`; }
function showToast(msg) { const t=$('toast'); if(!t)return; t.textContent=msg; t.classList.add('show'); clearTimeout(window.__toastTimer); window.__toastTimer=setTimeout(()=>t.classList.remove('show'),3000); }

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
async function createPendingDonation(){
  const amount=currentAmount(); if(!amount) throw new Error('Please select or enter a donation amount.');
  const {data,error}=await supabase.rpc('create_pending_donation',{p_amount:amount,p_donor_name:$('donorName')?.value.trim()||null,p_transaction_note:$('donorNote')?.value.trim()||null}); if(error)throw error;
  pendingDonationId=data.id; pendingAmount=amount; localStorage.setItem('reddot_pending_donation_id',pendingDonationId); return data;
}
async function markTransactionShared(){ if(!pendingDonationId)return; const {error}=await supabase.rpc('mark_transaction_shared',{p_donation_id:pendingDonationId}); if(error)throw error; }
function renderQR(amt){ const el=$('qrcode'); if(!el||typeof QRCode==='undefined')return; el.innerHTML=''; new QRCode(el,{text:buildUpiUriPlain(amt||currentAmount()||1),width:168,height:168,colorDark:'#211C18',colorLight:'#fff',correctLevel:QRCode.CorrectLevel.M}); }
function downloadQR(){
  const amount=currentAmount()||pendingAmount||1, uri=buildUpiUriPlain(amount), canvas=document.createElement('canvas'), size=1200, qrSize=760; canvas.width=size; canvas.height=1050; const ctx=canvas.getContext('2d'); ctx.fillStyle='#fff'; ctx.fillRect(0,0,size,1050);
  const holder=document.createElement('div'); Object.assign(holder.style,{position:'fixed',left:'-10000px',top:'0',width:qrSize+'px',height:qrSize+'px',background:'#fff'}); document.body.appendChild(holder);
  new QRCode(holder,{text:uri,width:qrSize,height:qrSize,colorDark:'#000',colorLight:'#fff',correctLevel:QRCode.CorrectLevel.M});
  setTimeout(()=>{const q=holder.querySelector('canvas')||holder.querySelector('img'); if(q)ctx.drawImage(q,(size-qrSize)/2,45,qrSize,qrSize); ctx.textAlign='center'; ctx.fillStyle='#211C18'; ctx.font='600 34px Inter,Arial,sans-serif'; ctx.fillText('UPI ID',size/2,875); ctx.font='500 38px "IBM Plex Mono",monospace'; ctx.fillText(UPI_ID,size/2,925); ctx.fillStyle='#5B5148'; ctx.font='400 27px Inter,Arial,sans-serif'; ctx.fillText('Red Dot Drive 2026',size/2,985); const a=document.createElement('a'); a.href=canvas.toDataURL('image/png'); a.download=`red-dot-drive-2026-payment-${amount}.png`; a.click(); holder.remove();},200);
}
function openModal(){ $('overlay').classList.add('open'); document.body.style.overflow='hidden'; renderQR(); }
function closeModal(ask=true){ if(!$('overlay').classList.contains('open'))return; if(ask&&(pendingAmount||currentAmount())) return openVerification(); $('overlay').classList.remove('open'); document.body.style.overflow=''; }
function openVerification(){ const amount=pendingAmount||currentAmount(); if(!amount)return closeModal(false); $('verificationAmount').textContent=fmtINR(amount); $('verificationQuestion').style.display='block'; $('sharePrompt').classList.remove('open'); $('shareActions').style.display='none'; $('verificationOverlay').classList.add('open'); document.body.style.overflow='hidden'; }
function closeVerification(){ $('verificationOverlay').classList.remove('open'); $('overlay').classList.remove('open'); document.body.style.overflow=''; }
async function startVerification(){
  try{ await createPendingDonation(); await markTransactionShared(); const msg=`Red Dot Drive 2026 — transaction details\nDonation ID: ${pendingDonationId}\nAmount: ${fmtINR(pendingAmount)}\n\nI have completed this donation. Please verify the transaction.`; window.open(`https://wa.me/919582621307?text=${encodeURIComponent(msg)}`,'_blank','noopener'); $('verificationQuestion').style.display='none'; $('sharePrompt').classList.add('open'); $('shareActions').style.display='grid'; closeVerification(); await renderDonationStatus(); showToast('Donation verification in progress.'); }
  catch(e){ console.error(e); showToast(e.message||'Unable to submit donation.'); }
}
async function confirmSharedAndClose(){ try{ await markTransactionShared(); closeVerification(); $('overlay').classList.remove('open'); document.body.style.overflow=''; await renderDonationStatus(); showToast('Donation verification in progress.'); }catch(e){showToast(e.message||'Unable to update donation status.');} }
function selectAmount(amount){ document.querySelectorAll('.chip').forEach(c=>c.classList.remove('active')); const c=[...document.querySelectorAll('.chip')].find(x=>Number(x.dataset.amt)===Number(amount)); if(c)c.classList.add('active'); $('amountInput').value=amount; pendingAmount=Number(amount); renderQR(pendingAmount); }
async function copyUPI(){ try{await navigator.clipboard.writeText(UPI_ID); showToast('UPI ID copied');}catch{showToast(`UPI ID: ${UPI_ID}`);} }

document.addEventListener('DOMContentLoaded',async()=>{ document.querySelectorAll('.chip').forEach(c=>c.addEventListener('click',()=>selectAmount(Number(c.dataset.amt)))); $('amountInput')?.addEventListener('input',()=>{pendingAmount=currentAmount(); renderQR(pendingAmount||1);}); try{await loadProgress(); await renderDonationStatus(); statusPoll=setInterval(async()=>{try{await loadProgress();await renderDonationStatus();}catch{}} ,30000);}catch(e){console.error(e);showToast('Unable to connect to the donation database.');} });
window.openModal=openModal; window.closeModal=closeModal; window.closeVerification=closeVerification; window.downloadQR=downloadQR; window.copyUPI=copyUPI; window.toggleQR=()=>renderQR(); window.verifyPaidAndShared=startVerification; window.showSharePrompt=startVerification; window.confirmSharedAndClose=confirmSharedAndClose;
