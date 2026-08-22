// Supabase browser configuration.
// This key is a publishable/anon key and is safe for browser use when Supabase RLS
// and database function permissions are configured correctly.
window.__SUPABASE_URL__ = 'https://afpeiuenhrvclmabadje.supabase.co';
window.__SUPABASE_PUBLISHABLE_KEY__ = 'sb_publishable_ay6SofsXxPxSjZZBb-XOXg_nRe4KaWZ';

// Opening-view layout: keep the campaign message, donation progress and key journey
// features visible together without changing the existing data flow.
(function setupOpeningView(){
  function init(){
    const hero = document.querySelector('.hero');
    const heroWrap = hero?.querySelector('.wrap');
    const bowl = document.querySelector('.dot-wrap');
    const bowlCaption = document.querySelector('.dot-caption');
    const stats = document.querySelector('.stats');
    const liveCard = document.querySelector('#live-drive .live-drive-card');
    const mentorsSection = document.querySelector('#mentors');
    if(!hero || !heroWrap || !bowl || !bowlCaption || !stats || !liveCard || !mentorsSection) return;

    const style = document.createElement('style');
    style.id = 'opening-view-layout';
    style.textContent = `
      .hero{padding:24px 0 24px;min-height:calc(100svh - 67px);display:flex;align-items:flex-start}
      .hero>.wrap{width:100%;max-width:1180px;display:grid;grid-template-columns:minmax(0,1.15fr) minmax(390px,.85fr);grid-template-rows:auto auto;column-gap:56px;row-gap:18px;align-items:center}
      .hero .eyebrow{grid-column:1;margin:4px 0 10px;justify-self:start}
      h1.headline{grid-column:1;font-size:clamp(40px,4.5vw,62px);line-height:1.02;max-width:760px;margin:0 0 10px;text-align:left}
      .hero .sub{grid-column:1;font-size:15.5px;line-height:1.48;max-width:650px;margin:0 0 12px;text-align:left}
      .hero-actions{grid-column:1;display:flex;justify-content:flex-start;margin:0;gap:10px}
      .hero-actions .btn-primary{padding:11px 20px;font-size:14px}
      .hero-actions .btn-ghost{padding:10px 19px;font-size:14px;text-decoration:none}

      .hero-stats-panel{grid-column:2;grid-row:1 / span 2;display:flex;flex-direction:column;align-items:stretch;justify-content:center;min-width:0}
      .hero-stats-panel .stats{margin:0;border-top:1px solid var(--line);border-bottom:1px solid var(--line);width:100%;grid-template-columns:repeat(3,1fr)}
      .hero-stats-panel .stat{padding:18px 8px}
      .hero-stats-panel .stat-num{font-size:23px}
      .hero-stats-panel .stat-label{font-size:10px}
      .hero-bowl-wrap{display:flex;align-items:center;justify-content:center;gap:20px;padding:16px 0 0}
      .hero-bowl{display:flex;flex-direction:column;align-items:center;justify-content:center}
      .hero-bowl .dot-wrap{width:170px;height:170px;margin:0}
      .hero-bowl .dot-pct{font-size:29px}
      .hero-bowl .dot-caption{font-size:10.5px;margin-top:8px;margin-bottom:0}

      .hero-feature-tiles{grid-column:1 / -1;display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:2px}
      .hero-live,.hero-mentors{min-width:0}
      .hero-live .live-drive-card,.hero-mentor-card{width:100%;height:100%;margin:0;min-height:156px;padding:20px 22px;border-radius:14px}
      .hero-live .live-drive-card{display:flex;align-items:center}
      .hero-live .live-drive-card h3,.hero-mentor-card h3{font-size:24px;line-height:1.08;margin:0 0 7px}
      .hero-live .live-drive-card p,.hero-mentor-card p{font-size:12.5px;line-height:1.45;margin:0 0 11px}
      .hero-live .live-drive-btn{padding:9px 15px;font-size:12.5px}
      .hero-live .live-drive-note{font-size:9.5px!important;margin-top:7px!important}
      .hero-mentor-card{background:var(--white);border:1px solid var(--line);color:var(--ink);position:relative;overflow:hidden}
      .hero-mentor-card::after{content:'✦';position:absolute;right:20px;top:14px;color:var(--gold);font-size:28px;opacity:.55}
      .hero-mentor-badge{display:inline-flex;align-items:center;gap:7px;font-size:10px;letter-spacing:.11em;text-transform:uppercase;font-weight:700;color:var(--gold);margin-bottom:10px}
      .hero-mentor-badge::before{content:'🤝';font-size:13px}
      .hero-mentor-card h3{font-family:'Fraunces',serif;color:var(--ink)}
      .hero-mentor-card p{color:var(--ink-soft);max-width:430px}
      .hero-mentor-btn{display:inline-flex;align-items:center;background:var(--ink);color:var(--paper);text-decoration:none;padding:9px 15px;border-radius:100px;font-weight:700;font-size:12.5px}

      /* Keep the full original sections intact below the opening view. */
      #live-drive{display:none}
      #mentors{display:block}
      .hero+.callout-wrap{margin-top:0}

      @media(max-width:800px){
        .hero{padding:18px 0 20px;min-height:calc(100svh - 60px)}
        .hero>.wrap{display:flex;flex-direction:column;gap:0;padding-left:18px;padding-right:18px;max-width:600px}
        .hero .eyebrow{align-self:center;margin:2px 0 10px;text-align:center}
        h1.headline{font-size:clamp(34px,8.8vw,46px);line-height:1.02;max-width:560px;text-align:center;margin-bottom:10px}
        .hero .sub{font-size:13.5px;line-height:1.46;max-width:520px;text-align:center;margin-bottom:11px}
        .hero-actions{display:flex;justify-content:center;margin:0 0 12px;gap:8px}
        .hero-actions .btn-primary,.hero-actions .btn-ghost{padding:9px 15px;font-size:12.5px}
        .hero-stats-panel{width:100%;display:flex;flex-direction:column}
        .hero-stats-panel .stats{width:100%;margin:0}
        .hero-stats-panel .stat{padding:12px 5px}
        .hero-stats-panel .stat-num{font-size:20px}
        .hero-stats-panel .stat-label{font-size:9px;margin-top:4px}
        .hero-bowl-wrap{padding:9px 0 11px}
        .hero-bowl .dot-wrap{width:112px;height:112px}
        .hero-bowl .dot-pct{font-size:23px}
        .hero-bowl .dot-caption{font-size:9px;margin-top:5px}
        .hero-feature-tiles{width:100%;grid-template-columns:1fr 1fr;gap:10px;margin-top:0}
        .hero-live .live-drive-card,.hero-mentor-card{min-height:132px;padding:14px 15px}
        .hero-live .live-drive-card h3,.hero-mentor-card h3{font-size:19px;margin-bottom:5px}
        .hero-live .live-drive-card p,.hero-mentor-card p{font-size:10.8px;line-height:1.38;margin-bottom:8px}
        .hero-live .live-drive-btn,.hero-mentor-btn{padding:7px 10px;font-size:10.5px}
        .hero-live .live-drive-note{display:none}
        .hero-mentor-badge{font-size:8.5px;margin-bottom:6px}
        .hero-mentor-badge::before{font-size:11px}
      }
      @media(max-width:430px){
        .hero{padding-top:14px}
        h1.headline{font-size:33px}
        .hero .sub{font-size:12.7px;margin-bottom:9px}
        .hero-actions{margin-bottom:9px}
        .hero-actions .btn-primary,.hero-actions .btn-ghost{padding:8px 12px;font-size:11.5px}
        .hero-stats-panel .stat{padding:10px 3px}
        .hero-stats-panel .stat-num{font-size:18px}
        .hero-stats-panel .stat-label{font-size:8px}
        .hero-bowl-wrap{padding:7px 0 8px}
        .hero-bowl .dot-wrap{width:98px;height:98px}
        .hero-bowl .dot-pct{font-size:20px}
        .hero-feature-tiles{gap:8px}
        .hero-live .live-drive-card,.hero-mentor-card{min-height:118px;padding:12px}
        .hero-live .live-drive-card h3,.hero-mentor-card h3{font-size:17px}
        .hero-live .live-drive-card p,.hero-mentor-card p{font-size:9.8px}
      }
    `;
    document.head.appendChild(style);

    // Preserve the existing stats and move them into the right-side opening panel.
    const statsPanel = document.createElement('div');
    statsPanel.className = 'hero-stats-panel';
    statsPanel.appendChild(stats);

    const bowlWrap = document.createElement('div');
    bowlWrap.className = 'hero-bowl-wrap';
    const bowlPanel = document.createElement('div');
    bowlPanel.className = 'hero-bowl';
    bowlPanel.appendChild(bowl);
    bowlPanel.appendChild(bowlCaption);
    bowlWrap.appendChild(bowlPanel);
    statsPanel.appendChild(bowlWrap);
    heroWrap.appendChild(statsPanel);

    // Restore the Read the cause CTA in the main campaign message.
    const actions = hero.querySelector('.hero-actions');
    if(actions && !actions.querySelector('a[href="#about"]')){
      const causeBtn = document.createElement('a');
      causeBtn.href = '#about';
      causeBtn.className = 'btn-ghost';
      causeBtn.textContent = 'Read the cause';
      actions.appendChild(causeBtn);
    }

    // Add compact live-drive + mentors feature tiles to the opening view.
    const tiles = document.createElement('div');
    tiles.className = 'hero-feature-tiles';

    const livePanel = document.createElement('div');
    livePanel.className = 'hero-live';
    livePanel.appendChild(liveCard.cloneNode(true));

    const mentorPanel = document.createElement('div');
    mentorPanel.className = 'hero-mentors';
    mentorPanel.innerHTML = `
      <div class="hero-mentor-card">
        <div class="hero-mentor-badge">Women Mentors Circle</div>
        <h3>Mentors beyond the scholarship.</h3>
        <p>Scholarships open the door. Mentors help students walk through it with guidance through their academic journey.</p>
        <a class="hero-mentor-btn" href="#mentors">Meet the mentors →</a>
      </div>`;

    tiles.append(livePanel,mentorPanel);
    heroWrap.appendChild(tiles);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
