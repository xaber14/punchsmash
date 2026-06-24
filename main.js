/* ═══════════════════════════════════════════
   PUNCH SMASH — Main Game Script
   ═══════════════════════════════════════════ */

/* ──────────────────────────────────────────
   RESPONSIVE SCALE — fit game to any screen
   Design size: 390 × 844 px
──────────────────────────────────────────── */
const DESIGN_W = 390;
const DESIGN_H = 844;
const shell = document.querySelector('.phone-shell');

function fitToViewport() {
  // visualViewport gives the real visible area on mobile
  // (excludes browser chrome, keyboard, etc.)
  const vw = window.visualViewport
    ? window.visualViewport.width
    : window.innerWidth;
  const vh = window.visualViewport
    ? window.visualViewport.height
    : window.innerHeight;

  const scale = Math.min(vw / DESIGN_W, vh / DESIGN_H);
  shell.style.transform = `scale(${scale})`;
}

fitToViewport();
window.addEventListener('resize', fitToViewport);
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', fitToViewport);
  window.visualViewport.addEventListener('scroll', fitToViewport);
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
    setTimeout(() => {
      fadeOverlay.classList.remove('on');
      // Auto-start music when homepage appears
      window.gameMusic.start();
      updateMusicBtn(true);
    }, 80);
  }, 420);
}

setTimeout(runLoadingBar, 500);


/* ──────────────────────────────────────────
   HOMEPAGE STATE
──────────────────────────────────────────── */
let selectedSamsakColor = 'red';
let selectedGloveColor  = 'red';

const samsakImg     = document.getElementById('samsakImg');
const sheetOverlay  = document.getElementById('sheetOverlay');


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
  { id: 'yellow', label: 'Kuning', filter: 'hue-rotate(45deg) saturate(3) brightness(1.05)' },
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
──────────────────────────────────────────── */
const GLOVE_COLORS = [
  { id: 'red',    label: 'Merah',  color: '#dc2626', emoji: '🥊' },
  { id: 'blue',   label: 'Biru',   color: '#2563eb', emoji: '🥊' },
  { id: 'black',  label: 'Hitam',  color: '#2a2a2a', emoji: '🥊' },
  { id: 'yellow', label: 'Kuning', color: '#ca8a04', emoji: '🥊' },
];

function buildSarungGrid() {
  const grid = document.getElementById('sarungColorGrid');
  grid.innerHTML = '';
  GLOVE_COLORS.forEach(c => {
    const opt = document.createElement('div');
    opt.className = 'color-option' + (c.id === selectedGloveColor ? ' selected' : '');
    opt.innerHTML = `
      <div class="color-swatch-wrap">
        <span class="glove-icon" style="color:${c.color}">${c.emoji}</span>
        <div class="glove-swatch" style="background:${c.color}"></div>
      </div>
      <span class="color-label">${c.label}</span>
      <div class="checkmark">${c.id === selectedGloveColor ? '✔' : ''}</div>
    `;
    opt.addEventListener('click', () => {
      selectedGloveColor = c.id;
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


/* ──────────────────────────────────────────
   MUSIC TOGGLE
──────────────────────────────────────────── */
const musicBtn     = document.getElementById('musicBtn');
const musicIconOn  = document.getElementById('musicIcon');
const musicIconOff = document.getElementById('musicIconOff');

function updateMusicBtn(playing) {
  if (playing) {
    musicBtn.classList.add('playing');
    musicBtn.classList.remove('muted');
    musicIconOn.style.display  = 'flex';
    musicIconOff.style.display = 'none';
  } else {
    musicBtn.classList.remove('playing');
    musicBtn.classList.add('muted');
    musicIconOn.style.display  = 'none';
    musicIconOff.style.display = 'flex';
  }
}

musicBtn.addEventListener('click', () => {
  const nowPlaying = window.gameMusic.toggle();
  updateMusicBtn(nowPlaying);
});
