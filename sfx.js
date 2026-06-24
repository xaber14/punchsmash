/* ═══════════════════════════════════════════
   PUNCH SMASH — SFX Engine
   Clash of Clans-style button click sound:
   · Sharp wood/pop transient (attack)
   · Bright "tock" body
   · Quick punchy decay
   ═══════════════════════════════════════════ */

const SFX = (() => {
  let ctx = null;

  function _init() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  }

  /* ── CoC click: layered wood knock + bright pop ── */
  function click() {
    _init();
    if (ctx.state === 'suspended') ctx.resume();

    const now = ctx.currentTime;

    // ── Layer 1: Wood "tock" body ──
    // Pitched noise burst filtered to mid-wood range
    const bufLen = Math.ceil(ctx.sampleRate * 0.12);
    const buf    = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data   = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;

    const noise  = ctx.createBufferSource();
    noise.buffer = buf;

    const bp = ctx.createBiquadFilter();
    bp.type            = 'bandpass';
    bp.frequency.value = 1100;   // wood knock center freq
    bp.Q.value         = 3.5;

    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0, now);
    ng.gain.linearRampToValueAtTime(0.55, now + 0.003);  // snap attack
    ng.gain.exponentialRampToValueAtTime(0.001, now + 0.10);

    noise.connect(bp);
    bp.connect(ng);
    ng.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.12);

    // ── Layer 2: Pitched tone "pop" ──
    // Short sine burst gives the wood warmth + pitch definition
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(260, now + 0.06);

    const og = ctx.createGain();
    og.gain.setValueAtTime(0, now);
    og.gain.linearRampToValueAtTime(0.40, now + 0.004);
    og.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(og);
    og.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.09);

    // ── Layer 3: Bright click transient ──
    // Very short high-freq burst for the crisp "snap" character
    const bufLen2 = Math.ceil(ctx.sampleRate * 0.018);
    const buf2    = ctx.createBuffer(1, bufLen2, ctx.sampleRate);
    const data2   = buf2.getChannelData(0);
    for (let i = 0; i < bufLen2; i++) data2[i] = Math.random() * 2 - 1;

    const snap  = ctx.createBufferSource();
    snap.buffer = buf2;

    const hp = ctx.createBiquadFilter();
    hp.type            = 'highpass';
    hp.frequency.value = 4500;

    const sg = ctx.createGain();
    sg.gain.setValueAtTime(0.35, now);
    sg.gain.exponentialRampToValueAtTime(0.001, now + 0.018);

    snap.connect(hp);
    hp.connect(sg);
    sg.connect(ctx.destination);
    snap.start(now);
    snap.stop(now + 0.02);
  }

  /* ── Attach to every clickable element ── */
  function attachToAll() {
    const selectors = [
      '.action-btn',
      '.btn-play',
      '.color-option',
      '.sheet-overlay',
      '.sticker-remove',
      '#btnPlay',
    ];

    // Global delegation on phone-shell — catches all current + future taps
    const shell = document.querySelector('.phone-shell');
    shell.addEventListener('pointerdown', (e) => {
      const target = e.target.closest(
        '.action-btn, .btn-play, .color-option, .sheet-overlay, .sticker-remove, #btnPlay, .btn-tambah-foto, .icon-btn, .music-btn'
      );
      if (target) click();
    }, { passive: true });
  }

  return { click, attachToAll };
})();

// Init after DOM ready
document.addEventListener('DOMContentLoaded', () => SFX.attachToAll());
