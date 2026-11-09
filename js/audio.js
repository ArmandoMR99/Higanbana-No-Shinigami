// Banda sonora compuesta y sintetizada en el navegador (Web Audio), sin archivos.
// Inspirada en el lenguaje de las bandas sonoras de anime de época: instrumentos japoneses
// (shamisen, shakuhachi, koto, taiko, hyoshigi) sobre cuerdas, metales graves y coro.
// Escala miyako-bushi en Re (Re · Mi♭ · Sol · La · Si♭). Melodías originales.

const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
const SCALE = [38, 39, 43, 45, 46, 50, 51, 55, 57, 58, 62, 63, 67, 69, 70, 74, 75, 79, 81, 82, 86];
const D = (i) => SCALE[Math.max(0, Math.min(SCALE.length - 1, i))];
// raíces de la progresión (4 compases): Re · Si♭ · Do · La  (con quintas abiertas)
const PROG = [38, 46, 48, 45];
// frases de shakuhachi: [grado, semicorcheas] (−1 = silencio)
const PHRASES = [
  [[15, 6], [14, 2], [13, 4], [12, 4], [13, 12], [-1, 4]],
  [[12, 4], [13, 4], [15, 8], [16, 4], [15, 2], [14, 2], [13, 8]],
  [[16, 8], [15, 4], [13, 4], [12, 6], [10, 2], [12, 8]],
  [[13, 2], [14, 2], [15, 4], [17, 8], [16, 4], [15, 4], [13, 8]],
  [[10, 4], [12, 4], [13, 4], [12, 4], [10, 12], [-1, 4]],
];
// riffs de shamisen (16 semicorcheas, grados; −1 silencio)
const RIFFS = [
  [10, -1, 10, 13, 12, -1, 10, 9, 10, -1, 12, 13, 15, 13, 12, 10],
  [10, 10, 15, 10, 14, 10, 13, 12, 10, 10, 13, 10, 12, 10, 9, 7],
  [12, -1, 13, 12, 10, -1, 9, 10, 12, 13, 15, -1, 13, 12, 10, -1],
];
const TAIKO = { // o-daiko (grave) y shime (agudo)
  storm: { o: [1, 0, 0, 0, 0, 0, 0, 0, 0.8, 0, 0, 0, 0, 0, 0.6, 0], s: [0, 0, 0.5, 0, 0.7, 0, 0.5, 0, 0, 0, 0.5, 0, 0.7, 0.4, 0.5, 0.4] },
  fight: { o: [1, 0, 0, 0.6, 0, 0, 0.9, 0, 1, 0, 0, 0.6, 0, 0.7, 0, 0], s: [0.6, 0.3, 0.7, 0.3, 0.8, 0.3, 0.7, 0.3, 0.6, 0.3, 0.7, 0.3, 0.8, 0.5, 0.9, 0.6] },
  heart: { o: [1, 0, 0, 0.6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], s: null },
  fire: { o: [1, 0, 0, 0, 0.7, 0, 0, 0, 1, 0, 0, 0, 0.7, 0, 0.5, 0], s: [0, 0, 0.6, 0, 0, 0, 0.6, 0, 0, 0, 0.6, 0, 0, 0, 0.6, 0.4] },
  soft: { o: [0.6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], s: null },
};
// arreglos: tempo y volumen de cada sección
const ARR = {
  intro:      { bpm: 70, strings: 0.5, choir: 0.35, flute: 0.5, koto: 0.3, kmode: 'sparse', sham: 0, brass: 0, taiko: 0, wind: 0.035 },
  menu:       { bpm: 72, strings: 0.5, choir: 0.3, flute: 0.55, koto: 0.45, kmode: 'arp', sham: 0, brass: 0, taiko: 0, wind: 0.03 },
  calm:       { bpm: 72, strings: 0.45, choir: 0.15, flute: 0.55, koto: 0.55, kmode: 'arp', sham: 0, brass: 0, taiko: 0, wind: 0.035 },
  storm:      { bpm: 132, strings: 0.42, trem: 1, choir: 0.22, flute: 0.35, koto: 0, sham: 0.38, brass: 0.26, taiko: 0.42, tpat: 'storm', clap: 1, wind: 0.03 },
  dark:       { bpm: 66, strings: 0.4, choir: 0.4, flute: 0, koto: 0.35, kmode: 'sparse', sham: 0, brass: 0.2, taiko: 0.45, tpat: 'heart', wind: 0.02 },
  forge:      { bpm: 92, strings: 0.48, trem: 1, choir: 0.45, flute: 0, koto: 0, sham: 0.3, shamSparse: 1, brass: 0.28, taiko: 0.5, tpat: 'heart', wind: 0 },
  fight:      { bpm: 144, strings: 0.42, trem: 1, choir: 0.25, flute: 0.38, koto: 0, sham: 0.4, brass: 0.28, taiko: 0.45, tpat: 'fight', clap: 1, wind: 0 },
  dawn:       { bpm: 68, strings: 0.45, choir: 0.25, flute: 0.5, koto: 0.3, kmode: 'sparse', sham: 0, brass: 0, taiko: 0, wind: 0.035 },
  snow:       { bpm: 66, strings: 0.35, choir: 0.3, flute: 0.5, koto: 0.45, kmode: 'high', sham: 0, brass: 0, taiko: 0, wind: 0.045 },
  fire:       { bpm: 120, strings: 0.42, trem: 1, choir: 0.3, flute: 0, koto: 0, sham: 0.38, brass: 0.26, taiko: 0.45, tpat: 'fire', clap: 1, wind: 0.02 },
  redemption: { bpm: 76, strings: 0.65, choir: 0.5, flute: 0.65, koto: 0.5, kmode: 'arp', sham: 0, brass: 0.25, taiko: 0.35, tpat: 'soft', wind: 0 },
};
const BUSES = ['strings', 'choir', 'flute', 'koto', 'sham', 'brass', 'taiko', 'wind', 'sfx'];

export class Music {
  constructor() { this.on = false; this.ready = false; this.mood = 'intro'; this.arr = ARR.intro; this.bpm = 70; this.step = 0; this.nextTime = 0; this.flute = null; this.ks = {}; }

  init(ctx) {
    if (this.ready) return;
    const A = (this.ctx = ctx || new (window.AudioContext || window.webkitAudioContext)());
    this.master = A.createGain(); this.master.gain.value = 0;
    const comp = A.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3.5; comp.attack.value = 0.01; comp.release.value = 0.3;
    this.master.connect(comp).connect(A.destination);
    this.rev = A.createConvolver(); this.rev.buffer = this.impulse(3.8);
    const rg = A.createGain(); rg.gain.value = 0.5; this.rev.connect(rg).connect(this.master);
    const sends = { strings: 0.55, choir: 0.7, flute: 0.65, koto: 0.45, sham: 0.25, brass: 0.4, taiko: 0.3, wind: 0.3, sfx: 0.5 };
    this.bus = {};
    for (const k of BUSES) { const g = A.createGain(); g.gain.value = 0; g.connect(this.master); const s = A.createGain(); s.gain.value = sends[k]; g.connect(s).connect(this.rev); this.bus[k] = g; }
    this.bus.sfx.gain.value = 0.55;
    const nb = A.createBuffer(1, A.sampleRate * 2, A.sampleRate), d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; this.noise = nb;
    // viento: ruido filtrado que respira
    { const s = A.createBufferSource(); s.buffer = nb; s.loop = true; const f = A.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 420; f.Q.value = 0.7; const l = A.createOscillator(); l.frequency.value = 0.06; const lg = A.createGain(); lg.gain.value = 180; l.connect(lg).connect(f.frequency); l.start(); s.connect(f).connect(this.bus.wind); s.start(); }
    // distorsión suave para el "sawari" (zumbido) del shamisen
    this.saw = A.createWaveShaper(); const cv = new Float32Array(1024); for (let i = 0; i < 1024; i++) { const x = i / 512 - 1; cv[i] = Math.tanh(x * 2.2); } this.saw.curve = cv; this.saw.connect(this.bus.sham);
    this.applyArr(true);
    this.ready = true;
  }
  impulse(sec) { const A = this.ctx, b = A.createBuffer(2, A.sampleRate * sec, A.sampleRate); for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3.2); } return b; }

  toggle() { this.init(); this.on = !this.on; this.ctx.resume(); this.master.gain.setTargetAtTime(this.on ? 0.34 : 0, this.ctx.currentTime, 1.2); if (this.on) this.nextTime = this.ctx.currentTime + 0.1; return this.on; }
  start() { this.init(); if (!this.on) this.toggle(); }
  setMood(m) { if (!m || m === this.mood) return; this.mood = m; this.arr = ARR[m] || ARR.calm; if (this.ready) this.applyArr(); }
  applyArr(now) {
    const T = this.ctx.currentTime, a = this.arr;
    for (const k of BUSES) if (k !== 'sfx') this.bus[k].gain.setTargetAtTime(a[k] || 0, T, now ? 0.01 : 1.8);
    this.pendingBpm = a.bpm;
  }

  // ---------- instrumentos ----------
  // cuerda pulsada (Karplus-Strong precalculado): koto (cálido) y shamisen (brillante, corto)
  pluckBuf(n, kind) {
    const key = kind + n; if (this.ks[key]) return this.ks[key];
    const A = this.ctx, sr = A.sampleRate, N = Math.max(2, Math.round(sr / midi(n)));
    const len = Math.floor(sr * (kind === 'sham' ? 1.1 : 2.6)), b = A.createBuffer(1, len, sr), out = b.getChannelData(0), ring = new Float32Array(N);
    let prev = 0; const bright = kind === 'sham' ? 0.9 : 0.55;
    for (let i = 0; i < N; i++) { const r = Math.random() * 2 - 1; prev = prev * (1 - bright) + r * bright; ring[i] = prev; }
    const decay = kind === 'sham' ? 0.991 : 0.9965 - Math.max(0, n - 60) * 0.0004;
    for (let i = 0; i < len; i++) { const j = i % N, k = (i + 1) % N; out[i] = ring[j]; ring[j] = (ring[j] + ring[k]) * 0.5 * decay; }
    const click = kind === 'sham' ? 320 : 150;
    for (let i = 0; i < click; i++) out[i] += (Math.random() * 2 - 1) * (1 - i / click) * (kind === 'sham' ? 0.6 : 0.25);
    return (this.ks[key] = b);
  }
  pluck(n, t, vel, kind = 'koto', bus = null) {
    const A = this.ctx, s = A.createBufferSource(); s.buffer = this.pluckBuf(n, kind);
    const g = A.createGain(); g.gain.value = vel * (kind === 'sham' ? 0.7 : 0.55);
    const p = A.createStereoPanner(); p.pan.value = Math.max(-0.8, Math.min(0.8, (n - 64) / 34 + (kind === 'sham' ? -0.25 : 0.2)));
    s.connect(g).connect(p);
    if (kind === 'sham' && !bus) p.connect(this.saw); else p.connect(this.bus[bus || kind]);
    s.start(t);
    // golpe del plectro (bachi) del shamisen
    if (kind === 'sham') { const nz = A.createBufferSource(); nz.buffer = this.noise; const f = A.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2400; f.Q.value = 2; const ng = A.createGain(); ng.gain.setValueAtTime(vel * 0.25, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.03); nz.connect(f).connect(ng).connect(this.bus.sham); nz.start(t, Math.random()); nz.stop(t + 0.05); }
  }
  // shakuhachi: entra desde abajo (meri → kari), vibrato que crece, soplo audible
  shaku(n, t, dur, vel = 0.5) {
    const A = this.ctx, f = midi(n);
    const o = A.createOscillator(), o2 = A.createOscillator(); o.type = 'sine'; o2.type = 'triangle';
    for (const x of [o, o2]) { x.frequency.setValueAtTime(f * 0.94, t); x.frequency.exponentialRampToValueAtTime(f, t + 0.14); }
    const vib = A.createOscillator(), vg = A.createGain(); vib.frequency.value = 5.2; vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(f * 0.012, t + Math.max(0.3, dur * 0.8));
    vib.connect(vg); vg.connect(o.frequency); vg.connect(o2.frequency);
    const m2 = A.createGain(); m2.gain.value = 0.22;
    const g = A.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vel * 0.3, t + 0.12); g.gain.linearRampToValueAtTime(vel * 0.24, t + dur * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.35);
    const br = A.createBufferSource(); br.buffer = this.noise; const bf = A.createBiquadFilter(); bf.type = 'bandpass'; bf.frequency.value = f * 1.5; bf.Q.value = 0.9;
    const bg = A.createGain(); bg.gain.setValueAtTime(vel * 0.22, t); bg.gain.exponentialRampToValueAtTime(vel * 0.05, t + 0.2); bg.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.3);
    br.connect(bf).connect(bg).connect(this.bus.flute);
    o.connect(g); o2.connect(m2).connect(g); g.connect(this.bus.flute);
    for (const x of [o, o2, vib]) { x.start(t); x.stop(t + dur + 0.5); } br.start(t, Math.random()); br.stop(t + dur + 0.4);
  }
  // cuerdas: acorde sostenido (o en trémolo para las escenas de tensión)
  strings(root, t, dur, trem) {
    const A = this.ctx, notes = [root + 12, root + 19, root + 24, root + 31];
    const lp = A.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(trem ? 1800 : 900, t); lp.Q.value = 0.5;
    const g = A.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.07, t + (trem ? 0.15 : 1.4)); g.gain.setValueAtTime(0.07, t + dur - 0.2); g.gain.linearRampToValueAtTime(0.0001, t + dur + (trem ? 0.3 : 1.4));
    let out = g;
    if (trem) { const tg = A.createGain(); tg.gain.value = 0.5; const l = A.createOscillator(); l.frequency.value = 13; const lg = A.createGain(); lg.gain.value = 0.5; l.connect(lg).connect(tg.gain); l.start(t); l.stop(t + dur + 0.4); g.connect(tg); out = tg; }
    lp.connect(g); out.connect(this.bus.strings);
    for (const n of notes) for (const det of [-9, 0, 8]) { const o = A.createOscillator(); o.type = 'sawtooth'; o.frequency.value = midi(n); o.detune.value = det; o.connect(lp); o.start(t); o.stop(t + dur + 1.6); }
  }
  // coro: "aah" con formantes
  choir(root, t, dur) {
    const A = this.ctx, mix = A.createGain(); mix.gain.value = 1;
    const g = A.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.05, t + 2); g.gain.setValueAtTime(0.05, t + dur - 0.5); g.gain.linearRampToValueAtTime(0.0001, t + dur + 2);
    for (const [f, q, a] of [[730, 8, 1], [1090, 10, 0.6], [2440, 12, 0.3]]) { const bp = A.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = q; const ga = A.createGain(); ga.gain.value = a * 3; mix.connect(bp).connect(ga).connect(g); }
    g.connect(this.bus.choir);
    for (const n of [root + 24, root + 31, root + 36]) for (const det of [-12, 0, 11]) { const o = A.createOscillator(); o.type = 'sawtooth'; o.frequency.value = midi(n); o.detune.value = det; const v = A.createOscillator(); v.frequency.value = 4.5 + Math.random(); const vg = A.createGain(); vg.gain.value = 2.5; v.connect(vg).connect(o.detune); o.connect(mix); o.start(t); v.start(t); o.stop(t + dur + 2.2); v.stop(t + dur + 2.2); }
  }
  // metales graves: crecida que se abre
  brass(root, t, dur) {
    const A = this.ctx, lp = A.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 2; lp.frequency.setValueAtTime(200, t); lp.frequency.exponentialRampToValueAtTime(1400, t + dur * 0.7); lp.frequency.exponentialRampToValueAtTime(300, t + dur);
    const g = A.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.12, t + dur * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.2);
    lp.connect(g).connect(this.bus.brass);
    for (const n of [root, root + 7, root + 12]) for (const det of [-6, 6]) { const o = A.createOscillator(); o.type = 'sawtooth'; o.frequency.value = midi(n); o.detune.value = det; o.connect(lp); o.start(t); o.stop(t + dur + 0.3); }
  }
  odaiko(t, vel) {
    const A = this.ctx, o = A.createOscillator(), g = A.createGain();
    o.frequency.setValueAtTime(68, t); o.frequency.exponentialRampToValueAtTime(38, t + 0.45);
    g.gain.setValueAtTime(vel * 0.9, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
    o.connect(g).connect(this.bus.taiko); o.start(t); o.stop(t + 1.2);
    const n = A.createBufferSource(); n.buffer = this.noise; const f = A.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 500; const ng = A.createGain(); ng.gain.setValueAtTime(vel * 0.5, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
    n.connect(f).connect(ng).connect(this.bus.taiko); n.start(t, Math.random()); n.stop(t + 0.2);
  }
  shime(t, vel) {
    const A = this.ctx, o = A.createOscillator(), g = A.createGain(); o.type = 'triangle';
    o.frequency.setValueAtTime(420, t); o.frequency.exponentialRampToValueAtTime(260, t + 0.06);
    g.gain.setValueAtTime(vel * 0.22, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    o.connect(g).connect(this.bus.taiko); o.start(t); o.stop(t + 0.15);
    const n = A.createBufferSource(); n.buffer = this.noise; const f = A.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 3000; const ng = A.createGain(); ng.gain.setValueAtTime(vel * 0.18, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    n.connect(f).connect(ng).connect(this.bus.taiko); n.start(t, Math.random()); n.stop(t + 0.06);
  }
  hyoshigi(t, vel = 0.5) { // tablillas de madera: el golpe seco del teatro japonés
    const A = this.ctx;
    for (const dt of [0, 0.045]) { const n = A.createBufferSource(); n.buffer = this.noise; const f = A.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2100; f.Q.value = 9; const g = A.createGain(); g.gain.setValueAtTime(vel * 1.6, t + dt); g.gain.exponentialRampToValueAtTime(0.0001, t + dt + 0.06); n.connect(f).connect(g).connect(this.bus.taiko); n.start(t + dt, Math.random()); n.stop(t + dt + 0.08); }
  }

  // ---------- secuenciador ----------
  tick() {
    if (!this.on || !this.ready) return;
    const A = this.ctx;
    while (this.nextTime < A.currentTime + 0.15) {
      if (this.step % 16 === 0 && this.pendingBpm) { this.bpm = this.pendingBpm; this.pendingBpm = 0; }
      const s16 = 60 / this.bpm / 4;
      this.play(this.step, this.nextTime, s16); this.step++; this.nextTime += s16;
    }
  }
  play(step, t, s16) {
    const a = this.arr, bar = Math.floor(step / 16), pos = step % 16, root = PROG[bar % 4];
    const barDur = s16 * 16;
    if (pos === 0) {
      if (a.strings) this.strings(root, t, barDur, a.trem);
      if (a.choir && bar % 2 === 0) this.choir(root, t, barDur * 2);
      if (a.brass && bar % 2 === 1) this.brass(root - 12, t, barDur);
      if (a.clap && bar % 4 === 0) this.hyoshigi(t, 0.5);
    }
    if (a.taiko && a.tpat) { const P = TAIKO[a.tpat]; if (P.o[pos]) this.odaiko(t, P.o[pos]); if (P.s && P.s[pos]) this.shime(t, P.s[pos]); }
    // shamisen: riff rápido y percusivo
    if (a.sham) {
      if (a.shamSparse) { if (pos === 0 || pos === 3 || pos === 10) this.pluck(D(pos === 0 ? 10 : 12), t, 0.7, 'sham'); }
      else { const r = RIFFS[Math.floor(bar / 2) % RIFFS.length], d = r[pos]; if (d >= 0) this.pluck(D(d) + (root === 46 ? -4 : root === 48 ? -2 : 0) * 0, t, pos % 4 === 0 ? 0.85 : 0.6, 'sham'); }
    }
    // koto
    if (a.koto) {
      const tones = [root + 24, root + 31, root + 36, root + 43];
      if (a.kmode === 'arp') { if (pos % 2 === 0) { const pat = [0, 1, 2, 1, 3, 2, 1, 2]; this.pluck(tones[pat[(pos / 2) % 8]], t, pos % 4 === 0 ? 0.55 : 0.38); } if (pos === 14 && bar % 4 === 3) [12, 13, 15, 16, 17].forEach((d, i) => this.pluck(D(d), t + i * s16 * 0.35, 0.3)); }
      else if (a.kmode === 'high') { if (pos % 4 === 0 && Math.random() < 0.65) this.pluck(D(14 + Math.floor(Math.random() * 5)), t, 0.32); if (pos === 0) this.pluck(root + 24, t, 0.35); }
      else { if (pos === 0) this.pluck(root + 24, t, 0.45); if (pos === 8 && Math.random() < 0.6) this.pluck(D(12 + Math.floor(Math.random() * 4)), t, 0.3); }
    }
    // shakuhachi: frases con respiración entre ellas
    if (a.flute) {
      const tense = a.bpm > 110;
      if (pos === 0 && !this.flute && Math.random() < (tense ? 0.5 : 0.85)) this.flute = { notes: PHRASES[Math.floor(Math.random() * PHRASES.length)], i: 0, wait: 0, k: tense ? 2 : 1 };
      const F = this.flute;
      if (F) { if (F.wait <= 0) { const [d, len] = F.notes[F.i]; if (d >= 0) this.shaku(D(d + (tense ? 2 : 0)), t, len * F.k * s16, tense ? 0.65 : 0.55); F.wait = len * F.k; F.i++; if (F.i >= F.notes.length) this.flute = null; } F.wait--; }
    }
  }

  sfx(name) {
    if (!this.on || !this.ready) return;
    const t = this.ctx.currentTime + 0.01;
    if (name === 'piece') { this.pluck(D(13 + Math.floor(Math.random() * 3)), t, 0.7, 'sham', 'sfx'); }
    if (name === 'done') { [10, 12, 13, 15, 17].forEach((d, i) => this.pluck(D(d), t + i * 0.06, 0.55, 'koto', 'sfx')); this.odaiko(t + 0.35, 0.9); this.hyoshigi(t + 0.35, 0.4); }
    if (name === 'wrong') this.pluck(D(6), t, 0.5, 'sham', 'sfx');
    if (name === 'open') this.pluck(D(15), t, 0.35, 'koto', 'sfx');
    if (name === 'enter') { this.hyoshigi(t, 0.5); this.pluck(D(10), t + 0.2, 0.5, 'koto', 'sfx'); this.pluck(D(13), t + 0.4, 0.45, 'koto', 'sfx'); }
    if (name === 'step') { const A = this.ctx, n = A.createBufferSource(); n.buffer = this.noise; const f = A.createBiquadFilter(); f.type = 'bandpass'; f.frequency.setValueAtTime(500, t); f.frequency.exponentialRampToValueAtTime(1600, t + 0.35); f.Q.value = 1.2; const g = A.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.05, t + 0.12); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5); n.connect(f).connect(g).connect(this.bus.sfx); n.start(t, Math.random()); n.stop(t + 0.55); }
  }
}
