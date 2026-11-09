// Partículas 2D a pantalla completa: lluvia, nieve, pétalos rojos, hojas, brasas y ceniza.
import { canvas } from './brush.js';

const KINDS = {
  rain: { n: 420, color: 'rgba(195,191,185,0.32)' },
  snow: { n: 240, color: 'rgba(240,236,230,0.85)' },
  petals: { n: 90, color: 'rgba(200,22,30,0.9)' },
  leaves: { n: 50, color: 'rgba(160,152,145,0.55)' },
  embers: { n: 90, color: 'rgba(255,80,50,0.9)' },
  ash: { n: 110, color: 'rgba(170,165,158,0.5)' },
};

export class FX {
  constructor(el) {
    this.el = el; this.parts = {}; this.level = {};
    this.resize(); addEventListener('resize', () => this.resize());
  }
  resize() { this.el.innerHTML = ''; this.cv = canvas(innerWidth, innerHeight, 1); this.el.appendChild(this.cv); this.W = innerWidth; this.H = innerHeight; for (const k in this.parts) this.parts[k] = this.spawn(k); }
  spawn(k) { const a = []; for (let i = 0; i < KINDS[k].n; i++) a.push({ x: Math.random() * this.W, y: Math.random() * this.H, v: 0.5 + Math.random(), s: 0.5 + Math.random(), r: Math.random() * 6, ph: Math.random() * 9 }); return a; }
  // targets: {rain: 0..1, snow: ...}
  frame(targets, dt, time) {
    const ctx = this.cv.ctx; ctx.clearRect(0, 0, this.W, this.H);
    for (const k in KINDS) {
      const goal = targets[k] || 0;
      this.level[k] = (this.level[k] || 0) + (goal - (this.level[k] || 0)) * Math.min(1, dt * 2);
      const lv = this.level[k]; if (lv < 0.01) continue;
      if (!this.parts[k]) this.parts[k] = this.spawn(k);
      const P = this.parts[k], n = Math.floor(P.length * lv);
      ctx.fillStyle = ctx.strokeStyle = KINDS[k].color;
      for (let i = 0; i < n; i++) {
        const p = P[i];
        if (k === 'rain') { p.y += dt * 900 * p.v; p.x += dt * 120; ctx.globalAlpha = 0.6; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - 3, p.y - 18 * p.v); ctx.stroke(); }
        else if (k === 'snow') { p.y += dt * 40 * p.v; p.x += Math.sin(time * 0.8 + p.ph) * dt * 20; ctx.globalAlpha = 0.5 + 0.5 * p.s; ctx.beginPath(); ctx.arc(p.x, p.y, 1 + p.s * 1.6, 0, 7); ctx.fill(); }
        else if (k === 'embers') { p.y -= dt * 60 * p.v; p.x += Math.sin(time * 2 + p.ph) * dt * 30; ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(time * 4 + p.ph)); ctx.beginPath(); ctx.arc(p.x, p.y, 1.2 * p.s + 0.4, 0, 7); ctx.fill(); }
        else if (k === 'ash') { p.y += dt * 18 * p.v; p.x += Math.sin(time * 0.5 + p.ph) * dt * 14; ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.arc(p.x, p.y, 0.8 + p.s, 0, 7); ctx.fill(); }
        else { // pétalos y hojas: cintas que giran
          p.y += dt * 46 * p.v; p.x += (Math.sin(time * 0.7 + p.ph) * 30 + 14) * dt; p.r += dt * p.v * 1.6;
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.scale(1, Math.abs(Math.sin(p.r * 0.7)) * 0.8 + 0.2); ctx.globalAlpha = 0.85;
          const L = (k === 'petals' ? 9 : 11) * (0.6 + p.s * 0.6); ctx.beginPath(); ctx.moveTo(-L, 0); ctx.quadraticCurveTo(0, -L * 0.35, L, 0); ctx.quadraticCurveTo(0, L * 0.25, -L, 0); ctx.fill(); ctx.restore();
        }
        if (p.y > this.H + 20) { p.y = -20; p.x = Math.random() * this.W; } if (p.y < -30) { p.y = this.H + 20; p.x = Math.random() * this.W; } if (p.x > this.W + 30) p.x = -20;
      }
      ctx.globalAlpha = 1;
    }
  }
}
