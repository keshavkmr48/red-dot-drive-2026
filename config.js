// Supabase browser configuration.
// This key is a publishable/anon key and is safe for browser use when Supabase RLS
// and database function permissions are configured correctly.
window.__SUPABASE_URL__ = 'https://afpeiuenhrvclmabadje.supabase.co';
window.__SUPABASE_PUBLISHABLE_KEY__ = 'sb_publishable_ay6SofsXxPxSjZZBb-XOXg_nRe4KaWZ';

// Opening-view layout: keep the campaign message, donation progress and live drive
// visible together on both desktop and mobile without changing the existing data flow.
(function setupOpeningView(){
  function init(){
    const hero = document.querySelector('.hero');
    const heroWrap = hero?.querySelector('.wrap');
    const bowl = document.querySelector('.dot-wrap');
    const bowlCaption = document.querySelector('.dot-caption');
    const liveCard = document.querySelector('#live-drive .live-drive-card');
    if(!hero || !heroWrap || !bowl || !bowlCaption || !liveCard) return;

    const style = document.createElement('style');
    style.id = 'opening-view-layout';
    style.textContent = `
      /* Compact campaign-first opening viewport */
      .hero{padding:26px 0 28px;min-height:calc(100svh - 62px);display:flex;align-items:flex-start}
      .hero>.wrap{width:100%;max-width:1120px;display:flex;flex-direction:column;align-items:center}
      .hero .eyebrow{margin-bottom:12px}
      h1.headline{font-size:clamp(38px,5vw,62px);line-height:1.02;max-width:930px;margin-bottom:12px}
      .hero .sub{font-size:15.5px;line-height:1.45;max-width:650px;margin-bottom:22px}
      .hero-feature-row{width:100%;display:grid;grid-template-columns:minmax(180px,230px) minmax(0,1fr);gap:28px;align-items:stretch;max-width:900px}
      .hero-bowl{display:flex;flex-direction:column;align-items:center;justify-content:center}
      .hero-bowl .dot-wrap{width:210px;height:210px;margin:0}
      .hero-bowl .dot-pct{font-size:32px}
      .hero-bowl .dot-caption{margin-top:9px;margin-bottom:0}
      .hero-live{min-width:0;display:flex;align-items:stretch}
      .hero-live .live-drive-card{width:100%;margin:0;display:flex;align-items:center;min-height:210px;padding:24px 26px}
      .hero-live .live-drive-card h3{font-size:28px;margin-bottom:8px}
      .hero-live .live-drive-card p{font-size:13.5px;line-height:1.5;margin-bottom:15px}
      .hero-live .live-drive-btn{padding:11px 18px;font-size:13.5px}
      .hero-live .live-drive-note{margin-top:9px!important;font-size:10.5px!important}
      .hero-actions{display:none}
      .hero+.callout-wrap{margin-top:0}
      #live-drive{display:none}
      @media(max-width:700px){
        .hero{padding:20px 0 24px;min-height:calc(100svh - 60px)}
        .hero>.wrap{padding-left:18px;padding-right:18px}
        .hero .eyebrow{font-size:10.5px;letter-spacing:.12em;margin-bottom:11px}
        h1.headline{font-size:clamp(35px,9vw,46px);line-height:1.02;max-width:600px;margin-bottom:12px}
        .hero .sub{font-size:14px;line-height:1.48;max-width:520px;margin-bottom:17px}
        .hero-feature-row{grid-template-columns:1fr;gap:14px;max-width:430px}
        .hero-bowl .dot-wrap{width:132px;height:132px}
        .hero-bowl .dot-pct{font-size:25px}
        .hero-bowl .dot-caption{font-size:10px;margin-top:7px}
        .hero-live .live-drive-card{min-height:0;padding:17px 18px;border-radius:14px}
        .hero-live .live-drive-card h3{font-size:22px;margin-bottom:6px}
        .hero-live .live-drive-card p{font-size:12.5px;line-height:1.45;margin-bottom:11px}
        .hero-live .live-drive-actions{gap:8px}
        .hero-live .live-drive-btn{padding:9px 15px;font-size:12.5px}
        .hero-live .live-drive-note{font-size:9.5px!important;margin-top:7px!important}
      }
      @media(max-width:390px){
        .hero{padding-top:16px}
        h1.headline{font-size:34px}
        .hero .sub{font-size:13.2px;margin-bottom:13px}
        .hero-bowl .dot-wrap{width:116px;height:116px}
        .hero-bowl .dot-pct{font-size:22px}
        .hero-live .live-drive-card{padding:14px 16px}
        .hero-live .live-drive-card h3{font-size:20px}
        .hero-live .live-drive-card p{font-size:11.8px}
      }
    `;
    document.head.appendChild(style);

    // Build a compact feature row from the existing donation bowl and live-drive card.
    const row = document.createElement('div');
    row.className = 'hero-feature-row';

    const bowlPanel = document.createElement('div');
    bowlPanel.className = 'hero-bowl';
    bowlPanel.appendChild(bowl);
    bowlPanel.appendChild(bowlCaption);

    const livePanel = document.createElement('div');
    livePanel.className = 'hero-live';
    const compactLive = liveCard.cloneNode(true);
    livePanel.appendChild(compactLive);

    row.append(bowlPanel, livePanel);
    heroWrap.appendChild(row);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
