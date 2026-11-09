// Música generada con código (Web Audio). Nada de archivos: todo se sintetiza en el navegador.
// Capas: bordón grave, viento, lluvia, koto pentatónico, taiko y latido. Cambia según el capítulo y el pasaje.

const HIRAJOSHI = [0, 2, 3, 7, 8]; // escala japonesa
const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

export class Music {
  constructor() { this.on = false; this.ready = false; this.mood = 'intro'; this.nextNote = 0; this.nextDrum = 0; this.nextBeat = 0; this.kotoRate = 1; }

  init() {
    if (this.ready) return;
    const A = (this.ctx = new (window.AudioContext || window.webkitAudioContext)());
    this.master = A.createGain(); this.master.gain.value = 0; this.master.connect(A.destination);
    // reverberación sencilla: impulso de ruido que decae
    this.rev = A.createConvolver(); this.rev.buffer = this.impulse(3.2); const rg = A.createGain(); rg.gain.value = 0.55; this.rev.connect(rg).connect(this.master);
    this.dry = A.createGain(); this.dry.gain.value = 0.8; this.dry.connect(this.master);
    const noise = A.createBuffer(1, A.sampleRate * 2, A.sampleRate); const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    this.noiseBuf = noise;
    // bordón: dos osciladores graves ligeramente desafinados
    this.drone = A.createGain(); this.drone.gain.value = 0;
    const lp = A.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420;
    for (const [f, type] of [[midi(33), 'sawtooth'], [midi(33) * 1.004, 'triangle'], [midi(40), 'sine']]) { const o = A.createOscillator(); o.type = type; o.frequency.value = f; const g = A.createGain(); g.gain.value = type === 'sawtooth' ? 0.12 : 0.3; o.connect(g).connect(lp); o.start(); }
    const lfo = A.createOscillator(); lfo.frequency.value = 0.07; const lg = A.createGain(); lg.gain.value = 160; lfo.connect(lg).connect(lp.frequency); lfo.start();
    lp.connect(this.drone); this.drone.connect(this.dry); this.drone.connect(this.rev);
    // viento y lluvia: ruido filtrado
    this.wind = this.noiseLayer('bandpass', 500, 0.6, 0.12);
    this.rain = this.noiseLayer('highpass', 2500, 0.3, 0);
    this.ready = true;
  }
  impulse(sec) { const A = this.ctx, b = A.createBuffer(2, A.sampleRate * sec, A.sampleRate); for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2.6); } return b; }
  noiseLayer(type, freq, q, lfoAmt) {
    const A = this.ctx, src = A.createBufferSource(); src.buffer = this.noiseBuf; src.loop = true;
    const f = A.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = A.createGain(); g.gain.value = 0;
    src.connect(f).connect(g); g.connect(this.dry); g.connect(this.rev); src.start();
    if (lfoAmt) { const l = A.createOscillator(); l.frequency.value = 0.11; const lg = A.createGain(); lg.gain.value = freq * lfoAmt * 3; l.connect(lg).connect(f.frequency); l.start(); }
    return g;
  }

  toggle() { this.init(); this.on = !this.on; this.ctx.resume(); this.master.gain.setTargetAtTime(this.on ? 0.7 : 0, this.ctx.currentTime, 0.6); return this.on; }
  start() { this.init(); if (!this.on) this.toggle(); }

  // ánimo según capítulo / pasaje
  setMood(m) {
    if (!this.ready || m === this.mood) return; this.mood = m;
    const T = this.ctx.currentTime;
    const set = (g, v) => g.gain.setTargetAtTime(v, T, 1.8);
    const M = {
      intro: [0.5, 0.12, 0, 0.7], menu: [0.45, 0.1, 0, 0.6],
      calm: [0.45, 0.16, 0, 1], storm: [0.6, 0.12, 0.35, 0.6], forge: [0.7, 0.04, 0.12, 0.35], fight: [0.65, 0.06, 0.3, 0.5],
      dawn: [0.4, 0.14, 0, 0.5], snow: [0.35, 0.2, 0, 0.55], fire: [0.6, 0.1, 0, 0.4], redemption: [0.5, 0.08, 0, 1.4], dark: [0.3, 0.04, 0.05, 0.15],
    }[m] || [0.4, 0.1, 0, 0.6];
    set(this.drone, M[0] * 0.5); set(this.wind, M[1]); set(this.rain, M[2] * 0.25); this.kotoRate = M[3];
  }

  pluck(note, vel = 0.3, when = 0) {
    const A = this.ctx, t = A.currentTime + when, f = midi(note);
    const o = A.createOscillator(), o2 = A.createOscillator(), g = A.createGain(), lp = A.createBiquadFilter();
    o.type = 'triangle'; o2.type = 'sawtooth'; o.frequency.value = f; o2.frequency.value = f * 2.001;
    lp.type = 'lowpass'; lp.frequency.setValueAtTime(f * 8, t); lp.frequency.exponentialRampToValueAtTime(f * 1.5, t + 0.6);
    const g2 = A.createGain(); g2.gain.value = 0.15;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vel, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
    o.connect(lp); o2.connect(g2).connect(lp); lp.connect(g); g.connect(this.dry); g.connect(this.rev);
    o.start(t); o2.start(t); o.stop(t + 2.6); o2.stop(t + 2.6);
  }
  drum(vel = 0.6, when = 0, pitch = 70) {
    const A = this.ctx, t = A.currentTime + when, o = A.createOscillator(), g = A.createGain();
    o.frequency.setValueAtTime(pitch, t); o.frequency.exponentialRampToValueAtTime(pitch * 0.45, t + 0.4);
    g.gain.setValueAtTime(vel, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
    o.connect(g); g.connect(this.dry); g.connect(this.rev); o.start(t); o.stop(t + 1);
  }
  bell(when = 0, vel = 0.2) { // cuenco: parciales inarmónicos
    const A = this.ctx, t = A.currentTime + when;
    for (const [r, a] of [[1, 1], [2.76, 0.5], [5.4, 0.3], [8.9, 0.15]]) { const o = A.createOscillator(), g = A.createGain(); o.frequency.value = 520 * r; g.gain.setValueAtTime(vel * a, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 3 / r + 0.3); o.connect(g); g.connect(this.dry); g.connect(this.rev); o.start(t); o.stop(t + 4); }
  }
  clink() { const A = this.ctx, t = A.currentTime; for (let k = 0; k < 3; k++) { const o = A.createOscillator(), g = A.createGain(); o.type = 'square'; o.frequency.value = 2400 + Math.random() * 1600; g.gain.setValueAtTime(0.05, t + k * 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + k * 0.05 + 0.12); o.connect(g); g.connect(this.rev); o.start(t + k * 0.05); o.stop(t + k * 0.05 + 0.15); } }

  sfx(name) {
    if (!this.on) return;
    if (name === 'piece') { this.pluck(69 + HIRAJOSHI[Math.floor(Math.random() * 5)], 0.35); this.clink(); }
    if (name === 'wrong') this.drum(0.4, 0, 50);
    if (name === 'done') { [57, 64, 69, 72, 76].forEach((n, i) => this.pluck(n, 0.3, i * 0.09)); this.drum(0.7, 0.4, 60); }
    if (name === 'bowl') this.bell(0, 0.25);
    if (name === 'open') this.pluck(81, 0.18);
    if (name === 'enter') { this.bell(0, 0.15); this.pluck(57, 0.3, 0.2); }
  }

  // se llama cada cuadro: decide cuándo sonar la siguiente nota
  tick() {
    if (!this.on || !this.ready) return;
    const t = this.ctx.currentTime;
    if (t > this.nextNote && this.kotoRate > 0.05) {
      const base = this.mood === 'snow' || this.mood === 'redemption' ? 69 : 62;
      const deg = HIRAJOSHI[Math.floor(Math.random() * 5)] + 12 * Math.floor(Math.random() * 2);
      this.pluck(base + deg - 12 * (Math.random() < 0.2 ? 1 : 0), 0.08 + Math.random() * 0.14);
      if (Math.random() < 0.3) this.pluck(base + HIRAJOSHI[Math.floor(Math.random() * 5)], 0.06, 0.18);
      this.nextNote = t + (1.4 + Math.random() * 3.5) / this.kotoRate;
    }
    if ((this.mood === 'storm' || this.mood === 'fight') && t > this.nextDrum) { this.drum(0.5, 0, 62); this.drum(0.3, 0.28, 66); this.nextDrum = t + (this.mood === 'fight' ? 1.8 : 3.6) + Math.random(); }
    if ((this.mood === 'forge' || this.mood === 'fight') && t > this.nextBeat) { this.drum(0.45, 0, 48); this.drum(0.3, 0.22, 46); this.nextBeat = t + (this.mood === 'fight' ? 0.75 : 1.1); }
  }
}
