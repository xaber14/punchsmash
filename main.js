/* ═══════════════════════════════════════════
   PUNCH SMASH — Main Game Script
   ═══════════════════════════════════════════ */

const barFill     = document.getElementById('barFill');
const loadingText = document.getElementById('loadingText');
const fadeOverlay = document.getElementById('fadeOverlay');
const splashEl    = document.getElementById('splash');
const homeEl      = document.getElementById('home');

/* ── Loading dot animation ── */
const dotStates = ['LOADING.', 'LOADING..', 'LOADING...'];
let dotIdx = 0;
const dotTimer = setInterval(() => {
  loadingText.textContent = dotStates[dotIdx++ % 3];
}, 500);

/* ── Ease in-out ── */
function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

/* ── Loading bar animation ──
   DURATION controls how long the bar takes to fill.
   In production, replace this with real asset-load progress. ── */
const LOADING_DURATION = 3200; // ms

function runLoadingBar() {
  const start = performance.now();

  function tick(now) {
    const t   = Math.min((now - start) / LOADING_DURATION, 1);
    const pct = easeInOut(t) * 100;
    barFill.style.width = pct.toFixed(2) + '%';

    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      barFill.style.width = '100%';
      clearInterval(dotTimer);
      setTimeout(transitionToHome, 600);
    }
  }

  barFill.style.width = '0%';
  requestAnimationFrame(tick);
}

/* ── Screen transition: Splash → Home ── */
function transitionToHome() {
  fadeOverlay.classList.add('on');
  setTimeout(() => {
    splashEl.classList.remove('active');
    homeEl.classList.add('active');
    setTimeout(() => fadeOverlay.classList.remove('on'), 80);
  }, 420);
}

/* ── Boot ── */
setTimeout(runLoadingBar, 500);
