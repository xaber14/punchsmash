/* ═══════════════════════════════════════════
   PUNCH SMASH — Gameplay Engine
   · Unlimited session (ended only by Back)
   · FPS-style depth punch (scale in/out)
   · Samsak reacts with pendulum + depth squish
   · Hit-text feedback + combo counter
   ═══════════════════════════════════════════ */

const Gameplay = (() => {

  /* ── element refs ── */
  let elGame, elSamsakAnchor, elSamsakWrap, elGlove,
      elTapCatcher, elHitLayer, elCombo, elComboMult;

  /* ── state ── */
  let running     = false;
  let combo       = 0;
  let comboTimer  = null;
  let busy        = false;

  /* ── hit word pool ── */
  const WORDS = [
    { t: 'GOOD!',    c: '#7CFC3A' },
    { t: 'NICE!',    c: '#41d6ff' },
    { t: 'GREAT!',   c: '#ffd23a' },
    { t: 'PERFECT!', c: '#ff9bf0' },
    { t: 'WOW!',     c: '#ff7a3a' },
    { t: 'MANTAP!',  c: '#9cff5a' },
    { t: 'KEREN!',   c: '#ffc83a' },
    { t: 'BAGUS!',   c: '#ff6af0' },
  ];

  /* ── cache DOM ── */
  function _cache() {
    elGame         = document.getElementById('game');
    elSamsakAnchor = document.getElementById('gameSamsakAnchor');
    elSamsakWrap   = document.getElementById('gameSamsakWrap');
    elGlove        = document.getElementById('gloveArm');
    elTapCatcher   = document.getElementById('tapCatcher');
    elHitLayer     = document.getElementById('hitTextLayer');
    elCombo        = document.getElementById('comboDisplay');
    elComboMult    = document.getElementById('comboMult');
  }

  /* ── carry over customisation from Homepage ── */
  function _applyCustom() {
    // samsak color filter
    const src = document.getElementById('samsakImg');
    const dst = document.getElementById('gameSamsakImg');
    if (src && dst) dst.style.filter = src.style.filter || '';

    // photo sticker
    const homeSticker = document.getElementById('samsakSticker');
    const homeImg     = document.getElementById('stickerImg');
    const gameSticker = document.getElementById('gameSticker');
    const gameImg     = document.getElementById('gameStickerImg');
    if (homeSticker?.classList.contains('visible') && homeImg?.src) {
      gameImg.src = homeImg.src;
      gameSticker.style.display = 'block';
    } else {
      gameSticker.style.display = 'none';
    }
  }

  /* ── idle samsak sway ── */
  function _idleSway() {
    // Cancel any previous animation
    elSamsakAnchor.getAnimations().forEach(a => a.cancel());
    elSamsakAnchor.animate(
      [
        { transform: 'rotate(-2deg)' },
        { transform: 'rotate( 2deg)' },
        { transform: 'rotate(-2deg)' },
      ],
      { duration: 3600, iterations: Infinity, easing: 'cubic-bezier(0.37,0,0.63,1)' }
    );
  }

  /* ════════════════════════════════════════
     PUNCH — the core interaction
  ════════════════════════════════════════ */
  function punch(clientX) {
    if (!running || busy) return;
    busy = true;

    // Which side did the tap come from?
    const rect  = elGame.getBoundingClientRect();
    const relX  = clientX != null ? (clientX - rect.left) / rect.width : 0.5;
    const side  = relX < 0.5 ? -1 : 1;   // -1 = left tap, +1 = right tap
    const lean  = (relX - 0.5) * 30;     // slight horizontal drift

    /* ── SFX ── */
    SFX.punch(1);

    /* ── GLOVE: FPS depth thrust ──
       Scale 1→1.55 (rushes toward samsak / camera)
       Small translateY for natural arm extension arc
       Then pulls back to rest */
    const REST = `translateX(-50%) scale(1)`;
    const PUSH = `translateX(calc(-50% + ${lean * 0.3}px)) translateY(-90px) scale(1.55)`;
    const PEAK = `translateX(calc(-50% + ${lean * 0.3}px)) translateY(-100px) scale(1.60)`;

    elGlove.animate(
      [
        { transform: REST,  offset: 0,    easing: 'cubic-bezier(0.2, 0.8, 0.3, 1)' },
        { transform: PUSH,  offset: 0.28, easing: 'cubic-bezier(0.4, 0, 0.6, 1)'   },
        { transform: PEAK,  offset: 0.36 },
        { transform: REST,  offset: 1,    easing: 'cubic-bezier(0.4, 0, 0.2, 1)'   },
      ],
      { duration: 360, fill: 'forwards' }
    );

    /* ── SAMSAK: FPS reaction ──
       Swings AWAY (back) then returns like a pendulum.
       In screen space: slight scale-down (receding) + rotation away from hit */
    const swingDeg  = 14 * side;    // rotate toward the punch side
    const swingBack = -swingDeg * 0.5;

    elSamsakWrap.animate(
      [
        { transform: 'translateX(-50%) rotate(0deg)  scale(1)',    offset: 0    },
        { transform: `translateX(-50%) rotate(${swingDeg}deg) scale(0.94)`, offset: 0.20, easing: 'cubic-bezier(0.2,0.8,0.3,1)' },
        { transform: `translateX(-50%) rotate(${swingBack}deg) scale(0.97)`, offset: 0.48 },
        { transform: `translateX(-50%) rotate(${swingDeg*0.22}deg) scale(0.99)`, offset: 0.70 },
        { transform: `translateX(-50%) rotate(${swingBack*0.08}deg) scale(1)`,   offset: 0.88 },
        { transform: 'translateX(-50%) rotate(0deg)  scale(1)',    offset: 1    },
      ],
      { duration: 780, easing: 'ease-out' }
    );

    /* ── Register hit at impact frame ── */
    setTimeout(() => _registerHit(), 130);

    /* ── Release busy after glove retracts ── */
    setTimeout(() => { busy = false; }, 260);
  }

  /* ── Hit registration: combo + text + shake ── */
  function _registerHit() {
    combo++;
    _showCombo();
    _spawnHitText();
    _shake();
  }

  /* ── Combo display ── */
  function _showCombo() {
    if (combo < 2) {
      elCombo.classList.remove('show', 'bump');
      return;
    }
    elComboMult.textContent = 'x' + combo;
    if (!elCombo.classList.contains('show')) {
      elCombo.classList.remove('bump');
      elCombo.classList.add('show');
    } else {
      elCombo.classList.remove('bump');
      void elCombo.offsetWidth;          // force reflow to restart animation
      elCombo.classList.add('bump');
    }
    clearTimeout(comboTimer);
    comboTimer = setTimeout(() => {
      combo = 0;
      elCombo.classList.remove('show', 'bump');
    }, 1800);
  }

  /* ── Spawn hit text + starburst ── */
  function _spawnHitText() {
    const pick = WORDS[Math.floor(Math.random() * WORDS.length)];
    const sz   = Math.min(72, 48 + combo * 1.8);

    /* starburst */
    const burst = document.createElement('div');
    burst.className = 'hit-burst';
    burst.innerHTML = `
      <svg viewBox="0 0 220 220" fill="none" xmlns="http://www.w3.org/2000/svg">
        ${Array.from({length:14}).map((_,i) => {
          const a  = (i/14)*Math.PI*2;
          const a2 = a + Math.PI/14;
          const r1 = 38, r2 = 96;
          const x1 = 110+Math.cos(a)*r1,  y1 = 110+Math.sin(a)*r1;
          const x2 = 110+Math.cos(a2)*r2, y2 = 110+Math.sin(a2)*r2;
          const x3 = 110+Math.cos(a-Math.PI/14)*r2, y3 = 110+Math.sin(a-Math.PI/14)*r2;
          return `<polygon points="${x1},${y1} ${x2},${y2} ${x3},${y3}" fill="#ffd840"/>`;
        }).join('')}
        <circle cx="110" cy="110" r="36" fill="#ffe060" opacity="0.7"/>
      </svg>`;
    burst.style.animation = 'burstPop 0.52s ease-out forwards';
    elHitLayer.appendChild(burst);
    setTimeout(() => burst.remove(), 540);

    /* text */
    const txt = document.createElement('div');
    txt.className   = 'hit-text';
    txt.textContent = pick.t;
    txt.style.color     = pick.c;
    txt.style.fontSize  = sz + 'px';
    txt.style.animation = 'hitTextPop 0.88s ease-out forwards';
    elHitLayer.appendChild(txt);
    setTimeout(() => txt.remove(), 900);
  }

  /* ── Screen shake ── */
  function _shake() {
    elGame.animate(
      [
        { transform: 'translate(0,0)' },
        { transform: 'translate(5px,-3px)' },
        { transform: 'translate(-4px,3px)' },
        { transform: 'translate(3px,-2px)' },
        { transform: 'translate(0,0)' },
      ],
      { duration: 180, easing: 'ease-out' }
    );
  }

  /* ════════════════════════════════════════
     PUBLIC API
  ════════════════════════════════════════ */

  function start() {
    if (!elGame) _cache();

    running = true;
    busy    = false;
    combo   = 0;
    elCombo.classList.remove('show', 'bump');

    _applyCustom();
    _idleSway();

    /* Bind tap once */
    if (!elTapCatcher._gpBound) {
      elTapCatcher.addEventListener('pointerdown', e => punch(e.clientX), { passive: true });
      elTapCatcher._gpBound = true;
    }
  }

  function stop() {
    running = false;
    clearTimeout(comboTimer);
    combo = 0;
    // Cancel samsak sway so it resets for homepage
    if (elSamsakAnchor) elSamsakAnchor.getAnimations().forEach(a => a.cancel());
  }

  return { start, stop };

})();

window.Gameplay = Gameplay;

/* ── Back button ── */
document.addEventListener('DOMContentLoaded', () => {
  const backBtn = document.getElementById('backBtn');
  if (backBtn) {
    backBtn.addEventListener('pointerdown', () => backBtn.classList.add('pressed'),    { passive: true });
    backBtn.addEventListener('pointerup',   () => backBtn.classList.remove('pressed'), { passive: true });
    backBtn.addEventListener('click', () => {
      window.Gameplay.stop();
      window.goToHome?.();
    });
  }
});
