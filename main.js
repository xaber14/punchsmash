/* ═══════════════════════════════════════════
   PUNCH SMASH — Main Game Script
   ═══════════════════════════════════════════ */

/* ──────────────────────────────────────────
   RESPONSIVE FIT
   · Desktop  → keep fixed 390×844 design size,
                only shrink if window is smaller.
   · Mobile   → CSS fills the screen (100dvw × 100dvh),
                so we clear any transform here.
──────────────────────────────────────────── */
const DESIGN_W = 390;
const DESIGN_H = 844;
const shell = document.querySelector('.phone-shell');
const mqMobile = window.matchMedia('(max-width: 600px), (pointer: coarse)');

function fitToViewport() {
  if (mqMobile.matches) {
    // Mobile: CSS handles full-screen fill — no JS scaling.
    shell.style.transform = '';
    return;
  }
  // Desktop: scale to fit viewport height, capped so width never exceeds viewport.
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const scale = Math.min(vw / DESIGN_W, vh / DESIGN_H);
  shell.style.transform = `scale(${scale})`;
}

fitToViewport();
window.addEventListener('resize', fitToViewport);
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', fitToViewport);
}
if (mqMobile.addEventListener) {
  mqMobile.addEventListener('change', fitToViewport);
}

/* ──────────────────────────────────────────
   SPLASH: Loading Bar → Homepage Transition
──────────────────────────────────────────── */
const barFill     = document.getElementById('barFill');
const loadingText = document.getElementById('loadingText');
const fadeOverlay = document.getElementById('fadeOverlay');
const splashEl    = document.getElementById('splash');
const homeEl      = document.getElementById('home');

const dotStates = ['LOADING.','LOADING..','LOADING...'];
let dotIdx = 0;
const dotTimer = setInterval(() => {
  loadingText.textContent = dotStates[dotIdx++ % 3];
}, 500);

function easeInOut(t) { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }

function runLoadingBar() {
  const DURATION = 3200;
  const start = performance.now();
  function tick(now) {
    const t = Math.min((now - start) / DURATION, 1);
    barFill.style.width = (easeInOut(t) * 100).toFixed(2) + '%';
    if (t < 1) { requestAnimationFrame(tick); }
    else {
      barFill.style.width = '100%';
      clearInterval(dotTimer);
      setTimeout(transitionToHome, 600);
    }
  }
  barFill.style.width = '0%';
  requestAnimationFrame(tick);
}

function transitionToHome() {
  fadeOverlay.classList.add('on');
  setTimeout(() => {
    splashEl.classList.remove('active');
    homeEl.classList.add('active');
    setTimeout(() => fadeOverlay.classList.remove('on'), 80);
  }, 420);
}

setTimeout(runLoadingBar, 500);


/* ──────────────────────────────────────────
   SCREEN NAVIGATION (Home ⇄ Gameplay)
──────────────────────────────────────────── */
const gameEl = document.getElementById('game');

function switchScreen(fromEl, toEl, onMid) {
  fadeOverlay.classList.add('on');
  setTimeout(() => {
    fromEl.classList.remove('active');
    toEl.classList.add('active');
    if (onMid) onMid();
    setTimeout(() => fadeOverlay.classList.remove('on'), 80);
  }, 380);
}

window.goToGame = function () {
  switchScreen(homeEl, gameEl, () => {
    if (window.Gameplay) window.Gameplay.start();
  });
};

window.goToHome = function () {
  switchScreen(gameEl, homeEl);
};


/* ──────────────────────────────────────────
   HOMEPAGE STATE
──────────────────────────────────────────── */
let selectedSamsakColor = 'red';
let selectedGloveColor  = 'red';

const samsakImg     = document.getElementById('samsakImg');
const sheetOverlay  = document.getElementById('sheetOverlay');

/* ── Mulai Main button press effect ── */
const btnPlay = document.getElementById('btnPlay');
function addPressEffect(el) {
  el.addEventListener('pointerdown', () => el.classList.add('pressed'),    { passive: true });
  el.addEventListener('pointerup',   () => el.classList.remove('pressed'), { passive: true });
  el.addEventListener('pointerout',  () => el.classList.remove('pressed'), { passive: true });
  el.addEventListener('pointercancel', () => el.classList.remove('pressed'), { passive: true });
}
addPressEffect(btnPlay);
btnPlay.addEventListener('click', () => {
  window.goToGame();
});


/* ──────────────────────────────────────────
   SHEET HELPER
──────────────────────────────────────────── */
let activeSheet = null;

function openSheet(sheetEl) {
  closeSheet();
  sheetOverlay.classList.add('open');
  sheetEl.classList.add('open');
  activeSheet = sheetEl;
}

function closeSheet() {
  if (activeSheet) {
    activeSheet.classList.remove('open');
    activeSheet = null;
  }
  sheetOverlay.classList.remove('open');
}

sheetOverlay.addEventListener('click', closeSheet);


/* ──────────────────────────────────────────
   1. SAMSAK COLOR PICKER
──────────────────────────────────────────── */
const SAMSAK_COLORS = [
  { id: 'red',    label: 'Merah',  filter: 'none' },
  { id: 'blue',   label: 'Biru',   filter: 'hue-rotate(200deg) saturate(1.5)' },
  { id: 'yellow', label: 'Kuning', filter: 'hue-rotate(170deg) saturate(2.5) brightness(1.15)' },
  { id: 'green',  label: 'Hijau',  filter: 'hue-rotate(120deg) saturate(1.6)' },
];

function buildSamsakGrid() {
  const grid = document.getElementById('samsakColorGrid');
  grid.innerHTML = '';
  SAMSAK_COLORS.forEach(c => {
    const opt = document.createElement('div');
    opt.className = 'color-option' + (c.id === selectedSamsakColor ? ' selected' : '');
    opt.innerHTML = `
      <img class="color-thumb-samsak"
           src="assets/samsak.png"
           style="filter:${c.filter}"
           alt="${c.label}">
      <span class="color-label">${c.label}</span>
      <div class="checkmark">${c.id === selectedSamsakColor ? '✔' : ''}</div>
    `;
    opt.addEventListener('click', () => {
      selectedSamsakColor = c.id;
      // Apply filter to live samsak
      samsakImg.style.filter = c.filter === 'none' ? '' : c.filter;
      // Rebuild grid to update selected state
      buildSamsakGrid();
      // Close after short delay so user sees selection
      setTimeout(closeSheet, 280);
    });
    grid.appendChild(opt);
  });
}

document.getElementById('btnSamsak').addEventListener('click', () => {
  buildSamsakGrid();
  openSheet(document.getElementById('sheetSamsak'));
});


/* ──────────────────────────────────────────
   2. SARUNG TINJU COLOR PICKER
   Uses the same glove asset as Gameplay + color filters.
──────────────────────────────────────────── */
const GLOVE_COLORS = [
  { id: 'red',    label: 'Merah',  filter: 'none' },
  { id: 'blue',   label: 'Biru',   filter: 'hue-rotate(200deg) saturate(1.5)' },
  { id: 'yellow', label: 'Kuning', filter: 'hue-rotate(170deg) saturate(2.5) brightness(1.15)' },
  { id: 'green',  label: 'Hijau',  filter: 'hue-rotate(120deg) saturate(1.6)' },
];

// Shared so Gameplay can read the chosen glove color
window.selectedGloveFilter = 'none';

function buildSarungGrid() {
  const grid = document.getElementById('sarungColorGrid');
  grid.innerHTML = '';
  GLOVE_COLORS.forEach(c => {
    const opt = document.createElement('div');
    opt.className = 'color-option' + (c.id === selectedGloveColor ? ' selected' : '');
    const fcss = c.filter === 'none' ? '' : c.filter;
    opt.innerHTML = `
      <img class="color-thumb-glove" src="assets/glove-right.png"
           style="filter:${fcss}" alt="${c.label}">
      <span class="color-label">${c.label}</span>
      <div class="checkmark">${c.id === selectedGloveColor ? '✔' : ''}</div>
    `;
    opt.addEventListener('click', () => {
      selectedGloveColor = c.id;
      window.selectedGloveFilter = fcss;
      buildSarungGrid();
      setTimeout(closeSheet, 280);
    });
    grid.appendChild(opt);
  });
}

document.getElementById('btnSarung').addEventListener('click', () => {
  buildSarungGrid();
  openSheet(document.getElementById('sheetSarung'));
});


/* ──────────────────────────────────────────
   3. TAMBAH FOTO — Upload & Stick to Samsak
──────────────────────────────────────────── */
const photoInput    = document.getElementById('photoInput');
const samsakSticker = document.getElementById('samsakSticker');
const stickerImg    = document.getElementById('stickerImg');
const stickerRemove = document.getElementById('stickerRemove');

document.getElementById('btnTambahFoto').addEventListener('click', () => {
  photoInput.click();
});

photoInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (ev) => {
    stickerImg.src = ev.target.result;
    // Small delay so browser renders the image first
    setTimeout(() => {
      samsakSticker.classList.add('visible');
    }, 80);
  };
  reader.readAsDataURL(file);
  // Reset input so same file can be re-selected
  photoInput.value = '';
});

stickerRemove.addEventListener('click', (e) => {
  e.stopPropagation();
  samsakSticker.classList.remove('visible');
  setTimeout(() => { stickerImg.src = ''; }, 400);
});



