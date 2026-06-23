/* ═══════════════════════════════════════════
   PUNCH SMASH — Background Music Engine
   Web Audio API procedural music generator
   Genre: Upbeat arcade/boxing game BGM
   BPM: 128
   ═══════════════════════════════════════════ */

class PunchSmashMusic {
  constructor() {
    this.ctx        = null;
    this.master     = null;
    this.isPlaying  = false;
    this.timerID    = null;
    this.nextTime   = 0;
    this.bar        = 0;       // which bar in the loop (0-7)
    this.BPM        = 128;
    this.beat       = 60 / this.BPM;       // 1 quarter note
    this.eighth     = this.beat / 2;
    this.bar4       = this.beat * 4;       // 1 full bar
    this.LOOKAHEAD  = 0.15;                // seconds ahead to schedule
    this.SCHEDINT   = 80;                  // ms scheduling interval
  }

  /* ── init audio context on first user interaction ── */
  _init() {
    if (this.ctx) return;
    this.ctx    = new (window.AudioContext || window.webkitAudioContext)();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.55;
    this.master.connect(this.ctx.destination);
  }

  /* ─────────────────── SOUND PRIMITIVES ─────────────────── */

  _noise(duration) {
    const len  = Math.ceil(this.ctx.sampleRate * duration);
    const buf  = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    return src;
  }

  _kick(t) {
    const osc  = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain); gain.connect(this.master);
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.45);
    gain.gain.setValueAtTime(1.0, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc.start(t); osc.stop(t + 0.5);
  }

  _snare(t) {
    // Tone body
    const osc  = this.ctx.createOscillator();
    const og   = this.ctx.createGain();
    osc.frequency.value = 220;
    osc.connect(og); og.connect(this.master);
    og.gain.setValueAtTime(0.4, t);
    og.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    osc.start(t); osc.stop(t + 0.18);

    // Noise crackle
    const ns  = this._noise(0.18);
    const hp  = this.ctx.createBiquadFilter();
    const ng  = this.ctx.createGain();
    hp.type = 'highpass'; hp.frequency.value = 1800;
    ns.connect(hp); hp.connect(ng); ng.connect(this.master);
    ng.gain.setValueAtTime(0.65, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    ns.start(t); ns.stop(t + 0.18);
  }

  _hihat(t, open = false) {
    const dur = open ? 0.28 : 0.055;
    const ns  = this._noise(dur);
    const hp  = this.ctx.createBiquadFilter();
    const g   = this.ctx.createGain();
    hp.type = 'highpass'; hp.frequency.value = 8000;
    ns.connect(hp); hp.connect(g); g.connect(this.master);
    g.gain.setValueAtTime(open ? 0.20 : 0.15, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    ns.start(t); ns.stop(t + dur);
  }

  _bass(t, freq, dur) {
    const osc = this.ctx.createOscillator();
    const lp  = this.ctx.createBiquadFilter();
    const g   = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    lp.type = 'lowpass'; lp.frequency.value = 500; lp.Q.value = 6;
    osc.connect(lp); lp.connect(g); g.connect(this.master);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.55, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.85);
    osc.start(t); osc.stop(t + dur);
  }

  _lead(t, freq, dur, vol = 0.18) {
    const osc  = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const g    = this.ctx.createGain();
    osc.type  = 'square'; osc.frequency.value  = freq;
    osc2.type = 'square'; osc2.frequency.value = freq * 1.005; // slight detune
    const lp  = this.ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 2200;
    osc.connect(lp); osc2.connect(lp);
    lp.connect(g); g.connect(this.master);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.015);
    g.gain.setValueAtTime(vol, t + dur * 0.7);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.start(t); osc.stop(t + dur);
    osc2.start(t); osc2.stop(t + dur);
  }

  _pad(t, freq, dur, vol = 0.07) {
    const osc = this.ctx.createOscillator();
    const g   = this.ctx.createGain();
    osc.type = 'sine'; osc.frequency.value = freq;
    osc.connect(g); g.connect(this.master);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.12);
    g.gain.setValueAtTime(vol, t + dur - 0.12);
    g.gain.linearRampToValueAtTime(0, t + dur);
    osc.start(t); osc.stop(t + dur);
  }

  /* ─────────────────── PATTERNS ─────────────────── */

  // Bass line: A2 pattern with walk-up
  // Frequencies (Hz): A2=110, C3=130, D3=147, E3=165, F#3=185, G3=196
  _bassLine = [110,110,147,110,165,147,110,165,  // bar 0-1
               110,110,147,130,165,165,147,185,  // bar 2-3
               196,165,147,130,110,130,147,165,  // bar 4-5
               110,185,165,147,130,110,147,110]; // bar 6-7

  // Lead melody (A minor pentatonic: A C D E G — A3=220,C4=262,D4=294,E4=330,G4=392,A4=440)
  // null = rest
  _melody = [
    // bar 0
    [220,null,262,null,294,null,330,null],
    // bar 1
    [392,null,330,294,null,262,220,null],
    // bar 2
    [220,null,294,null,330,392,440,null],
    // bar 3
    [440,392,null,330,294,null,262,null],
    // bar 4
    [220,262,294,null,330,null,392,null],
    // bar 5
    [440,null,392,330,294,null,262,220],
    // bar 6
    [294,null,330,null,392,440,392,330],
    // bar 7
    [294,262,null,220,null,262,294,null],
  ];

  _scheduleBar(t, barIdx) {
    const e = this.eighth;
    const b = this.beat;
    const bar = barIdx % 8;
    const bassOffset = bar * 8;

    for (let i = 0; i < 8; i++) {
      const st = t + i * e;

      // ── Drums ──
      if (i === 0 || i === 4)                this._kick(st);
      if (i === 2 || i === 6)                this._snare(st);
      const open = (i === 3 || i === 7);
      this._hihat(st, open);

      // ── Bass ──
      const bassFreq = this._bassLine[bassOffset + i];
      this._bass(st, bassFreq, e * 0.88);

      // ── Melody ──
      const note = this._melody[bar][i];
      if (note !== null) {
        this._lead(st, note, e * 0.80);
      }
    }

    // ── Pad chord on beat 1 and 3 ──
    this._pad(t,          110 * 2, b * 1.9);  // root
    this._pad(t,          165 * 2, b * 1.9);  // fifth
    this._pad(t + b * 2,  147 * 2, b * 1.9);  // fourth
    this._pad(t + b * 2,  196 * 2, b * 1.9);  // minor seventh
  }

  /* ─────────────────── SCHEDULER LOOP ─────────────────── */

  _schedule() {
    if (!this.isPlaying) return;
    const now = this.ctx.currentTime;
    while (this.nextTime < now + this.LOOKAHEAD) {
      this._scheduleBar(this.nextTime, this.bar);
      this.nextTime += this.bar4;
      this.bar = (this.bar + 1) % 8;
    }
    this.timerID = setTimeout(() => this._schedule(), this.SCHEDINT);
  }

  /* ─────────────────── PUBLIC API ─────────────────── */

  start() {
    this._init();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.nextTime  = this.ctx.currentTime + 0.05;
    this.bar       = 0;
    // Fade in
    this.master.gain.setValueAtTime(0, this.ctx.currentTime);
    this.master.gain.linearRampToValueAtTime(0.55, this.ctx.currentTime + 1.0);
    this._schedule();
  }

  stop() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    clearTimeout(this.timerID);
    // Fade out
    const now = this.ctx.currentTime;
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(0, now + 0.6);
  }

  toggle() {
    if (this.isPlaying) this.stop();
    else this.start();
    return this.isPlaying;
  }

  get playing() { return this.isPlaying; }
}

window.gameMusic = new PunchSmashMusic();
