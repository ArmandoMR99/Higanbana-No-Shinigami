// Música compuesta y sintetizada en el navegador (Web Audio). Sin archivos.
// Escala miyako-bushi en Re (Re · Mi♭ · Sol · La · Si♭), 68 pulsos por minuto.
// Instrumentos: koto (cuerda pulsada, Karplus-Strong), shakuhachi (flauta), cuerdas, bajo y taiko.
// La música no se interrumpe: cada pasaje cambia el arreglo (qué instrumentos tocan y con qué densidad).

const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
// notas de la escala, de grave a agudo
const SCALE = [50, 51, 55, 57, 58, 62, 63, 67, 69, 70, 74, 75, 79, 81, 82, 86];
const deg = (i) => SCALE[Math.max(0, Math.min(SCALE.length - 1, i))];
// progresión de 4 compases: raíz del bajo y quinta (acordes abiertos, sin terceras)
const PROG = [[38, 45], [46, 53], [43, 50], [45, 52]]; // Re · Si♭ · Sol · La
// frases de la melodía: [grado, duración en semicorcheas]
const PHRASES = [
  [[9, 4], [8, 2], [7, 2], [8, 8]],
  [[10, 4], [9, 2], [8, 2], [7, 4], [5, 4]],
  [[7, 2], [8, 2], [9, 4], [11, 4], [10, 4]],
  [[8, 6], [7, 2], [6, 4], [5, 4]],
  [[5, 2], [7, 2], [8, 4], [7, 2], [8, 2], [9, 4]],
  [[12, 6], [11, 2], [10, 4], [9, 4], [8, 8], [-1, 8]],
];
// arreglos por ánimo: volumen de cada instrumento (0 = no toca)
const ARR = {
  intro:      { pad: 0.55, koto: 0.35, kotoMode: 'sparse', flute: 0.0, bass: 0.0, taiko: 0, wind: 0.04, rain: 0 },
  menu:       { pad: 0.55, koto: 0.5, kotoMode: 'melody', flute: 0.35, bass: 0.25, taiko: 0, wind: 0.03, rain: 0 },
  calm:       { pad: 0.5, koto: 0.55, kotoMode: 'arp', flute: 0.4, bass: 0.3, taiko: 0, wind: 0.04, rain: 0 },
  storm:      { pad: 0.6, koto: 0.45, kotoMode: 'tremolo', flute: 0.0, bass: 0.5, taiko: 0.6, taikoPat: 'storm', wind: 0.05, rain: 0.05 },
  dark:       { pad: 0.45, koto: 0.3, kotoMode: 'sparse', flute: 0.0, bass: 0.35, taiko: 0.3, taikoPat: 'heart', wind: 0.02, rain: 0.02 },
  forge:      { pad: 0.6, koto: 0.45, kotoMode: 'ostinato', flute: 0.0, bass: 0.45, taiko: 0.55, taikoPat: 'heart', wind: 0, rain: 0 },
  fight:      { pad: 0.55, koto: 0.5, kotoMode: 'ostinato', flute: 0.0, bass: 0.55, taiko: 0.75, taikoPat: 'fight', wind: 0, rain: 0.04 },
  dawn:       { pad: 0.5, koto: 0.3, kotoMode: 'sparse', flute: 0.4, bass: 0.2, taiko: 0, wind: 0.04, rain: 0 },
  snow:       { pad: 0.45, koto: 0.45, kotoMode: 'high', flute: 0.4, bass: 0.2, taiko: 0, wind: 0.05, rain: 0 },
  fire:       { pad: 0.55, koto: 0.4, kotoMode: 'tremolo', flute: 0.0, bass: 0.45, taiko: 0.55, taikoPat: 'storm', wind: 0.03, rain: 0 },
  redemption: { pad: 0.65, koto: 0.55, kotoMode: 'arp', flute: 0.55, bass: 0.35, taiko: 0.25, taikoPat: 'soft', wind: 0, rain: 0 },
};
const TAIKO = {
  storm: [1, 0, 0, 0, 0, 0, 0.5, 0, 0.8, 0, 0, 0, 0, 0, 0.4, 0],
  heart: [1, 0, 0.6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  fight: [1, 0, 0.5, 0, 0, 0, 0.8, 0, 1, 0, 0.4, 0.5, 0, 0, 0.7, 0],
  soft: [0.6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
};

export class Music {
  constructor() { this.on = false; this.ready = false; this.mood = 'intro'; this.arr = ARR.intro; this.bpm = 68; this.step = 0; this.nextTime = 0; this.phrase = null; this.flutePhrase = null; this.kotoBuf = {}; }

  init(ctx) {
    if (this.ready) return;
    const A = (this.ctx = ctx || new (window.AudioContext || window.webkitAudioContext)());
    // cadena maestra: compresor suave y volumen bajo
    this.master = A.createGain(); this.master.gain.value = 0;
    const comp = A.createDynamicsCompressor(); comp.threshold.value = -20; comp.ratio.value = 3; comp.attack.value = 0.02; comp.release.value = 0.4;
    this.master.connect(comp).connect(A.destination);
    this.rev = A.createConvolver(); this.rev.buffer = this.impulse(3.6);
    const rg = A.createGain(); rg.gain.value = 0.45; this.rev.connect(rg).connect(this.master);
    this.bus = {};
    for (const k of ['pad', 'koto', 'flute', 'bass', 'taiko', 'wind', 'rain', 'sfx']) {
      const g = A.createGain(); g.gain.value = 0; g.connect(this.master);
      const send = A.createGain(); send.gain.value = { pad: 0.6, koto: 0.5, flute: 0.7, bass: 0.1, taiko: 0.35, wind: 0.3, rain: 0.2, sfx: 0.5 }[k];
      g.connect(send).connect(this.rev);
      this.bus[k] = g;
    }
    this.bus.sfx.gain.value = 0.5;
    const nb = A.createBuffer(1, A.sampleRate * 2, A.sampleRate), d = nb.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    this.noise = nb;
    this.noiseLoop('wind', 'bandpass', 420, 0.7);
    this.noiseLoop('rain', 'highpass', 3000, 0.3);
    this.applyArr(true);
    this.ready = true;
  }
  impulse(sec) { const A = this.ctx, b = A.createBuffer(2, A.sampleRate * sec, A.sampleRate); for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3); } return b; }
  noiseLoop(bus, type, f, q) {
    const A = this.ctx, s = A.createBufferSource(); s.buffer = this.noise; s.loop = true;
    const fl = A.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
    const l = A.createOscillator(); l.frequency.value = 0.07; const lg = A.createGain(); lg.gain.value = f * 0.4; l.connect(lg).connect(fl.frequency); l.start();
    s.connect(fl).connect(this.bus[bus]); s.start();
  }

  toggle() { this.init(); this.on = !this.on; this.ctx.resume(); this.master.gain.setTargetAtTime(this.on ? 0.32 : 0, this.ctx.currentTime, 1.2); if (this.on) this.nextTime = this.ctx.currentTime + 0.1; return this.on; }
  start() { this.init(); if (!this.on) this.toggle(); }

  setMood(m) { if (!m || m === this.mood) return; this.mood = m; this.arr = ARR[m] || ARR.calm; if (this.ready) this.applyArr(); }
  applyArr(now) {
    const T = this.ctx.currentTime, a = this.arr;
    for (const k of ['pad', 'koto', 'flute', 'bass', 'taiko', 'wind', 'rain']) this.bus[k].gain.setTargetAtTime(a[k] || 0, T, now ? 0.01 : 2.5);
  }

  // ---------- instrumentos ----------
  // koto: Karplus-Strong precalculado (cuerda pulsada real)
  kotoBuffer(n) {
    if (this.kotoBuf[n]) return this.kotoBuf[n];
    const A = this.ctx, sr = A.sampleRate, f = midi(n), N = Math.max(2, Math.round(sr / f));
    const len = Math.floor(sr * 2.6), b = A.createBuffer(1, len, sr), out = b.getChannelData(0);
    const ring = new Float32Array(N);
    let prev = 0; for (let i = 0; i < N; i++) { const r = Math.random() * 2 - 1; prev = prev * 0.45 + r * 0.55; ring[i] = prev; }
    const decay = 0.9965 - Math.max(0, (n - 60)) * 0.0004;
    for (let i = 0; i < len; i++) { const j = i % N, k = (i + 1) % N; const v = (ring[j] + ring[k]) * 0.5 * decay; out[i] = ring[j]; ring[j] = v; }
    // ataque más brillante: un clic suave de la uña
    for (let i = 0; i < 160; i++) out[i] += (Math.random() * 2 - 1) * (1 - i / 160) * 0.25;
    return (this.kotoBuf[n] = b);
  }
  koto(n, t, vel = 0.5, bus = 'koto') {
    const A = this.ctx, s = A.createBufferSource(); s.buffer = this.kotoBuffer(n);
    const g = A.createGain(); g.gain.value = vel * 0.55;
    const p = A.createStereoPanner(); p.pan.value = (n - 66) / 40;
    s.connect(g).connect(p).connect(this.bus[bus]); s.start(t);
  }
  flute(n, t, dur, vel = 0.4) {
    const A = this.ctx, f = midi(n);
    const o = A.createOscillator(), o2 = A.createOscillator(); o.type = 'sine'; o2.type = 'triangle'; o.frequency.value = f; o2.frequency.value = f;
    const vib = A.createOscillator(), vg = A.createGain(); vib.frequency.value = 5; vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(f * 0.006, t + Math.min(dur, 0.8));
    vib.connect(vg); vg.connect(o.frequency); vg.connect(o2.frequency);
    const m2 = A.createGain(); m2.gain.value = 0.18;
    const g = A.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vel * 0.32, t + 0.18); g.gain.setValueAtTime(vel * 0.32, t + Math.max(0.2, dur - 0.25)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.5);
    // soplo: ruido filtrado al comienzo de cada nota
    const br = A.createBufferSource(); br.buffer = this.noise; const bf = A.createBiquadFilter(); bf.type = 'bandpass'; bf.frequency.value = f * 2; bf.Q.value = 1.2;
    const bg = A.createGain(); bg.gain.setValueAtTime(vel * 0.12, t); bg.gain.exponentialRampToValueAtTime(vel * 0.025, t + 0.25); bg.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.3);
    br.connect(bf).connect(bg).connect(this.bus.flute);
    o.connect(g); o2.connect(m2).connect(g); g.connect(this.bus.flute);
    for (const x of [o, o2, vib]) { x.start(t); x.stop(t + dur + 0.6); } br.start(t, Math.random()); br.stop(t + dur + 0.4);
  }
  pad(notes, t, dur) {
    const A = this.ctx;
    const lp = A.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(500, t); lp.frequency.linearRampToValueAtTime(900, t + dur * 0.5); lp.frequency.linearRampToValueAtTime(500, t + dur); lp.Q.value = 0.4;
    const g = A.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.09, t + 1.8); g.gain.setValueAtTime(0.09, t + dur - 0.4); g.gain.linearRampToValueAtTime(0.0001, t + dur + 1.6);
    lp.connect(g).connect(this.bus.pad);
    for (const n of notes) for (const det of [-7, 0, 7]) { const o = A.createOscillator(); o.type = 'sawtooth'; o.frequency.value = midi(n); o.detune.value = det; o.connect(lp); o.start(t); o.stop(t + dur + 1.8); }
  }
  bass(n, t, dur) {
    const A = this.ctx, o = A.createOscillator(), g = A.createGain(); o.type = 'sine'; o.frequency.value = midi(n);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.35, t + 0.04); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.bus.bass); o.start(t); o.stop(t + dur + 0.1);
  }
  taiko(t, vel = 1) {
    const A = this.ctx, o = A.createOscillator(), g = A.createGain();
    o.frequency.setValueAtTime(72, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.35);
    g.gain.setValueAtTime(vel * 0.7, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
    o.connect(g).connect(this.bus.taiko); o.start(t); o.stop(t + 1);
    const n = A.createBufferSource(); n.buffer = this.noise; const f = A.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 420;
    const ng = A.createGain(); ng.gain.setValueAtTime(vel * 0.35, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    n.connect(f).connect(ng).connect(this.bus.taiko); n.start(t, Math.random()); n.stop(t + 0.15);
  }

  // ---------- secuenciador ----------
  tick() {
    if (!this.on || !this.ready) return;
    const A = this.ctx, s16 = 60 / this.bpm / 4;
    while (this.nextTime < A.currentTime + 0.15) { this.play(this.step, this.nextTime, s16); this.step++; this.nextTime += s16; }
  }
  play(step, t, s16) {
    const a = this.arr, bar = Math.floor(step / 16), pos = step % 16;
    const ch = PROG[bar % 4];
    // cuerdas: un acorde abierto por compás
    if (pos === 0 && a.pad) this.pad([ch[0] + 12, ch[1] + 12, ch[0] + 24], t, s16 * 16);
    // bajo
    if (a.bass && (pos === 0 || (pos === 10 && a.taiko))) this.bass(ch[0], t, s16 * (pos === 0 ? 10 : 6));
    // taiko
    if (a.taiko && a.taikoPat) { const v = TAIKO[a.taikoPat][pos]; if (v) this.taiko(t, v); }
    // koto
    if (a.koto) this.kotoPart(a.kotoMode, step, pos, bar, t, s16, ch);
    // shakuhachi: una frase cada dos compases, con silencios
    if (a.flute) {
      if (pos === 0 && bar % 2 === 0 && !this.flutePhrase && Math.random() < 0.8) this.flutePhrase = { notes: PHRASES[Math.floor(Math.random() * PHRASES.length)], i: 0, wait: 0 };
      const F = this.flutePhrase;
      if (F) { if (F.wait <= 0) { const [d, len] = F.notes[F.i]; if (d >= 0) this.flute(deg(d), t, len * 2 * s16, 0.5); F.wait = len * 2; F.i++; if (F.i >= F.notes.length) this.flutePhrase = null; } F.wait--; }
    }
  }
  kotoPart(mode, step, pos, bar, t, s16, ch) {
    const root = ch[0] + 24, fifth = ch[1] + 24;
    const chordTones = [root, fifth, root + 12, fifth + 12, root + 24].filter((n) => SCALE.includes(n) || n === root || n === fifth);
    if (mode === 'arp') {
      if (pos % 2 === 0) { const pat = [0, 1, 2, 3, 2, 1, 4, 2]; this.koto(chordTones[pat[(pos / 2) % pat.length] % chordTones.length], t, pos % 4 === 0 ? 0.6 : 0.4); }
      if (pos === 14 && bar % 4 === 3) [7, 8, 9, 10].forEach((d, i) => this.koto(deg(d), t + i * s16 * 0.4, 0.3));
    } else if (mode === 'melody') {
      if (!this.phrase && pos === 0 && Math.random() < 0.7) this.phrase = { notes: PHRASES[Math.floor(Math.random() * PHRASES.length)], i: 0, wait: 0 };
      const P = this.phrase;
      if (P) { if (P.wait <= 0) { const [d, len] = P.notes[P.i]; if (d >= 0) this.koto(deg(d), t, 0.55); P.wait = len; P.i++; if (P.i >= P.notes.length) this.phrase = null; } P.wait--; }
      if (pos === 0 || pos === 8) this.koto(root - 12, t, 0.3);
    } else if (mode === 'sparse') {
      if (pos === 0) this.koto(root, t, 0.45);
      if (pos === 6 && Math.random() < 0.5) this.koto(deg(7 + Math.floor(Math.random() * 4)), t, 0.3);
      if (pos === 12 && bar % 2 === 1) this.koto(fifth, t, 0.35);
    } else if (mode === 'high') {
      if (pos % 4 === 0 && Math.random() < 0.6) this.koto(deg(10 + Math.floor(Math.random() * 5)), t, 0.3);
      if (pos === 0) this.koto(root, t, 0.35);
    } else if (mode === 'tremolo') { // trémolo grave e inquieto
      if (pos % 2 === 0) this.koto(pos % 8 < 4 ? root - 12 : fifth - 12, t, 0.35 + (pos % 8 === 0 ? 0.2 : 0));
      if (pos === 12 && bar % 2 === 0) [5, 6, 5].forEach((d, i) => this.koto(deg(d), t + i * s16, 0.35));
    } else if (mode === 'ostinato') { // figura repetida, empuja hacia adelante
      const pat = [root - 12, root, fifth - 12, root, root - 12, fifth, root, fifth];
      if (pos % 2 === 0) this.koto(pat[(pos / 2) % 8], t, pos % 8 === 0 ? 0.55 : 0.38);
    }
  }

  // efectos discretos, siempre dentro de la escala (nada de pitidos)
  sfx(name) {
    if (!this.on || !this.ready) return;
    const t = this.ctx.currentTime + 0.01;
    if (name === 'piece') { this.koto(deg(7 + Math.floor(Math.random() * 3)), t, 0.6, 'sfx'); this.koto(deg(5), t + 0.06, 0.3, 'sfx'); }
    if (name === 'done') { [5, 7, 8, 9, 10, 12].forEach((d, i) => this.koto(deg(d), t + i * 0.07, 0.5, 'sfx')); this.taiko(t + 0.45, 0.6); }
    if (name === 'wrong') this.koto(deg(1), t, 0.45, 'sfx');
    if (name === 'open') this.koto(deg(12), t, 0.3, 'sfx');
    if (name === 'enter') { this.koto(deg(5), t, 0.5, 'sfx'); this.koto(deg(9), t + 0.25, 0.4, 'sfx'); }
  }
}
