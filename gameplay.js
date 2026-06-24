/* ═══════════════════════════════════════════
   PUNCH SMASH — Gameplay Engine
   · Two FPS gloves, alternating left/right
   · Press "PUKUL" button to punch
   · Smooth depth animation (scale + translate)
   ═══════════════════════════════════════════ */

const Gameplay = (() => {

  /* ── refs ── */
  let elGame, elSamsakAnchor, elSamsakWrap,
      elGloveL, elGloveR, elBtnPukul,
      elHitLayer, elCombo, elComboMult;

  /* ── state ── */
  let running    = false;
  let nextHand   = 'left';   // alternates each punch
  let busy       = false;
  let combo      = 0;
  let comboTimer = null;

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
    elGloveL       = document.getElementById('gloveLeft');
    elGloveR       = document.getElementById('gloveRight');
    elBtnPukul     = document.getElementById('btnPukul');
    elHitLayer     = document.getElementById('hitTextLayer');
    elCombo        = document.getElementById('comboDisplay');
    elComboMult    = document.getElementById('comboMult');
  }

  /* ── carry over customisation ── */
  function _applyCustom() {
    const src = document.getElementById('samsakImg');
    const dst = document.getElementById('gameSamsakImg');
    if (src && dst) dst.style.filter = src.style.filter || '';

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
     PUNCH
  ════════════════════════════════════════ */
  function punch() {
    if (!running || busy) return;
    busy = true;

    const isLeft = nextHand === 'left';
    nextHand = isLeft ? 'right' : 'left';

    const glove = isLeft ? elGloveL : elGloveR;

    /* ── SFX ── */
    SFX.punch(1);

    /* ── Button press visual feedback ── */
    elBtnPukul.classList.add('pressed');
    setTimeout(() => elBtnPukul.classList.remove('pressed'), 140);

    /* ── GLOVE animation ──
       Left:  punches up-right toward samsak center (translateX positive, scale up)
       Right: punches up-left toward samsak center  (translateX negative, scale up)
       Scale increase = depth/forward rush (FPS illusion) */
    const xDrift = isLeft ? 55 : -55;
    const REST   = 'translateY(0px) translateX(0px) scale(1)';
    const RUSH   = `translateY(-195px) translateX(${xDrift}px) scale(1.45)`;
    const IMPACT = `translateY(-215px) translateX(${xDrift * 0.9}px) scale(1.50)`;
    const PULL   = `translateY(-80px)  translateX(${xDrift * 0.3}px) scale(1.18)`;

    glove.animate(
      [
        { transform: REST,   offset: 0,    easing: 'cubic-bezier(0.15, 0.8, 0.25, 1)' },
        { transform: RUSH,   offset: 0.26, easing: 'cubic-bezier(0.4,  0,   0.2,  1)' },
        { transform: IMPACT, offset: 0.34 },
        { transform: PULL,   offset: 0.55, easing: 'cubic-bezier(0.4,  0,   0.4,  1)' },
        { transform: REST,   offset: 1,    easing: 'cubic-bezier(0.4,  0,   0.2,  1)' },
      ],
      { duration: 420, fill: 'forwards' }
    );

    /* ── SAMSAK reaction ──
       Swings away from the punch side, then pendulum back.
       Scale dips slightly on impact (depth compression). */
    const swingDir = isLeft ? 1 : -1;   // left punch → swings right
    const swing    = 15 * swingDir;
    const bounce   = -swing * 0.48;
    const settle1  =  swing * 0.20;
    const settle2  = -swing * 0.07;

    elSamsakWrap.animate(
      [
        { transform: 'translateX(-50%) rotate(0deg)        scale(1)',    offset: 0    },
        { transform: `translateX(-50%) rotate(${swing}deg) scale(0.93)`, offset: 0.20, easing: 'cubic-bezier(0.2,0.8,0.3,1)' },
        { transform: `translateX(-50%) rotate(${swing * 1.05}deg) scale(0.92)`, offset: 0.28 },
        { transform: `translateX(-50%) rotate(${bounce}deg) scale(0.97)`, offset: 0.50 },
        { transform: `translateX(-50%) rotate(${settle1}deg) scale(0.99)`, offset: 0.70 },
        { transform: `translateX(-50%) rotate(${settle2}deg) scale(1)`,   offset: 0.86 },
        { transform: 'translateX(-50%) rotate(0deg)        scale(1)',    offset: 1    },
      ],
      { duration: 820, easing: 'ease-out' }
    );

    /* ── Register hit at impact frame ── */
    setTimeout(() => _onImpact(), 140);

    /* ── Release busy after glove retracts ── */
    setTimeout(() => { busy = false; }, 310);
  }

  /* ── On impact: feedback + combo ── */
  function _onImpact() {
    combo++;
    _showCombo();
    _spawnHitText();
    _screenShake();
  }

  /* ── Combo display — unlimited, resets after 3s idle ── */
  function _showCombo() {
    elComboMult.textContent = 'x' + combo;

    if (!elCombo.classList.contains('show')) {
      // First punch of a new combo — make visible + entrance pop
      elCombo.classList.add('show');
      elCombo.classList.remove('pop', 'bump');
      void elCombo.offsetWidth;
      elCombo.classList.add('pop');
    } else {
      // Consecutive punch — quick bump pulse (stays visible)
      elCombo.classList.remove('bump');
      void elCombo.offsetWidth;          // restart animation
      elCombo.classList.add('bump');
    }

    // Reset 3-second idle timer on every hit
    clearTimeout(comboTimer);
    comboTimer = setTimeout(() => {
      combo = 0;
      elCombo.classList.remove('show', 'pop', 'bump');
    }, 3000);
  }

  /* ── Hit text + burst ── */
  function _spawnHitText() {
    const pick = WORDS[Math.floor(Math.random() * WORDS.length)];
    const sz   = Math.min(74, 50 + combo * 1.6);

    /* starburst */
    const burst = document.createElement('div');
    burst.className = 'hit-burst';
    burst.innerHTML = `
      <svg viewBox="0 0 220 220" xmlns="http://www.w3.org/2000/svg">
        ${Array.from({length: 14}).map((_, i) => {
          const a  = (i / 14) * Math.PI * 2;
          const a2 = a + Math.PI / 14;
          const r1 = 38, r2 = 98;
          const x1 = 110 + Math.cos(a) * r1,  y1 = 110 + Math.sin(a) * r1;
          const x2 = 110 + Math.cos(a2) * r2, y2 = 110 + Math.sin(a2) * r2;
          const x3 = 110 + Math.cos(a - Math.PI/14) * r2,
                y3 = 110 + Math.sin(a - Math.PI/14) * r2;
          return `<polygon points="${x1},${y1} ${x2},${y2} ${x3},${y3}" fill="#ffd840"/>`;
        }).join('')}
        <circle cx="110" cy="110" r="34" fill="#ffe060" opacity="0.75"/>
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
    txt.style.animation = 'hitTextPop 0.90s ease-out forwards';
    elHitLayer.appendChild(txt);
    setTimeout(() => txt.remove(), 920);
  }

  /* ── Screen shake ── */
  function _screenShake() {
    elGame.animate(
      [
        { transform: 'translate(0,0)' },
        { transform: 'translate(5px,-3px)' },
        { transform: 'translate(-4px, 3px)' },
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

    running  = true;
    busy     = false;
    combo    = 0;
    nextHand = 'left';
    elCombo.classList.remove('show', 'pop', 'bump');

    _applyCustom();
    _idleSway();

    /* Bind Pukul button (once) */
    if (!elBtnPukul._bound) {
      elBtnPukul.addEventListener('pointerdown', () => punch(), { passive: true });
      elBtnPukul._bound = true;
    }
  }

  function stop() {
    running = false;
    clearTimeout(comboTimer);
    combo = 0;
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
