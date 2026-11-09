// Escenas ilustradas en 2D (tinta clara sobre papel oscuro).
import { C, rng, noise1, paper, mountains, brush, line, wash, bamboo, lily, figure, house, callout, corners, frame, weapon2d, creature, spline, canvas } from './brush.js';
import { CRIATURAS, VIAJE, MARCA } from '../story.js';

const art = (ctx, L, fn) => { ctx.save(); ctx.translate(L.ox, L.oy); ctx.scale(L.s, L.s); fn(ctx); ctx.restore(); };
const ramp = (x, a, b) => Math.max(0, Math.min(1, (x - a) / (b - a)));
const bg = (glow = [600, 380, 650, 'rgba(70,58,55,0.5)']) => ({ depth: 0.04, paint: (ctx, L) => paper(ctx, L.w, L.h, { glowAt: [L.X(glow[0]), L.Y(glow[1]), glow[2] * L.s, glow[3]] }) });
const band = (ctx, L, y, h, a = 0.1, seed = 1) => { const g = ctx.createLinearGradient(0, L.Y(y - h), 0, L.Y(y + h)); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, `rgba(160,152,145,${a})`); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(-80, L.Y(y - h), L.w + 160, L.Y(y + h) - L.Y(y - h)); };

export function defineViews(stage, { onBestia }) {
  // ---------------- Capítulo I ----------------
  stage.define('bosque', {
    layers: [
      bg([620, 300, 700, 'rgba(80,70,66,0.55)']),
      { depth: 0.12, paint: (ctx, L) => { const R = rng(2); for (let i = 0; i < 46; i++) { const x = -60 + R() * (L.w + 120); bamboo(ctx, x, -40, L.h + 40, 4 + R() * 3, { alpha: 0.07, seed: i + 1, leaves: R() < 0.5 }); } band(ctx, L, 520, 160, 0.16); } },
      { depth: 0.3, paint: (ctx, L) => { const R = rng(3); for (let i = 0; i < 13; i++) { const x = L.ax - 120 + R() * (L.w - L.ax + 200); bamboo(ctx, x, -60, L.h + 60, 8 + R() * 5, { alpha: 0.2, seed: 40 + i, leaves: R() < 0.6 }); } band(ctx, L, 640, 120, 0.18); art(ctx, L, (c) => { wash(c, 520, 690, 600, 60, 'rgba(195,191,185,0.08)', { seed: 4 }); figure(c, 470, 650, 92, { dir: 1, rim: C.boneA(0.4) }); }); } },
      { depth: 0.75, paint: (ctx, L) => { const R = rng(4); for (const x of [L.ax - 40, L.ax + 60, L.w - 90, L.w - 10]) bamboo(ctx, x + (R() - 0.5) * 40, -80, L.h + 80, 20 + R() * 8, { color: '#060505', alpha: 0.95, seed: x | 0, leaves: true }); } },
    ],
    dyn(ctx, L, st) { art(ctx, L, (c) => { const a = 0.5 + 0.5 * Math.sin(st.time * 2.2); const g = c.createRadialGradient(780, 560, 0, 780, 560, 14); g.addColorStop(0, C.glowA(0.9 * a)); g.addColorStop(1, C.glowA(0)); c.fillStyle = g; c.beginPath(); c.arc(780, 560, 14, 0, 7); c.fill(); }); },
  });

  stage.define('flor', {
    layers: [
      bg([560, 420, 560, 'rgba(90,70,66,0.55)']),
      { depth: 0.12, paint: (ctx, L) => { const R = rng(7); for (let i = 0; i < 30; i++) bamboo(ctx, -60 + R() * (L.w + 120), -40, L.h + 40, 5 + R() * 3, { alpha: 0.1, seed: 70 + i }); band(ctx, L, 600, 180, 0.14); } },
      { depth: 0.35, paint: (ctx, L) => art(ctx, L, (c) => { const R = rng(9); wash(c, 520, 640, 520, 90, 'rgba(195,191,185,0.09)', { seed: 9 }); for (let i = 0; i < 160; i++) { const x = 120 + R() * 820, y = 600 + R() * 110; brush(c, [[x, y], [x + (R() - 0.5) * 12, y - 14 - R() * 26]], { w: 1.6, alpha: 0.25 + R() * 0.3, profile: 'start', dry: 0.4, seed: i, n: 6 }); } figure(c, 300, 690, 150, { dir: 1, kneel: true, rim: C.boneA(0.45) }); }) },
      { depth: 0.45, paint: (ctx, L) => art(ctx, L, (c) => lily(c, 560, 450, 2.1, { stem: 110 })) },
    ],
    update(v, st) { const t = st.key === 'flor' ? st.t : 0; v.layers[3].c.style.opacity = 1 - ramp(t, 0.72, 0.95); },
    dyn(ctx, L, st) {
      const t = st.key === 'flor' ? st.t : 0; if (t < 0.38) return;
      art(ctx, L, (c) => { for (let k = 0; k < 4; k++) { const f = ((st.time * 0.5 + k / 4) % 1); const r = 20 + f * 260 * ramp(t, 0.38, 0.6); c.strokeStyle = C.glowA(0.5 * (1 - f)); c.lineWidth = 2; c.beginPath(); c.ellipse(560, 470, r, r * 0.5, 0, 0, 7); c.stroke(); }
        const g = c.createRadialGradient(560, 450, 0, 560, 450, 160); g.addColorStop(0, C.glowA(0.35 * ramp(t, 0.4, 0.6) * (1 - ramp(t, 0.85, 1)))); g.addColorStop(1, C.glowA(0)); c.fillStyle = g; c.fillRect(380, 280, 360, 360); });
    },
  });

  // reflejo: se pinta una vez y se dibuja en franjas onduladas
  let reflection = null;
  stage.define('rio', {
    layers: [
      bg([600, 260, 700, 'rgba(110,100,94,0.55)']),
      { depth: 0.2, paint: (ctx, L) => { art(ctx, L, (c) => { mountains(c, { x0: -300, x1: 1300, base: 170, amp: 50, color: 'rgba(195,191,185,0.1)', fade: 60, seed: 61, rim: 0.3 }); }); const y = L.Y(250); ctx.fillStyle = '#060505'; ctx.fillRect(-80, y, L.w + 160, L.h); const R = rng(12); for (let i = 0; i < 140; i++) { const x = R() * L.w, yy = y + 10 + Math.pow(R(), 1.6) * (L.h - y); line(ctx, [[x, yy], [x + 10 + R() * 40, yy]], { w: 0.8, alpha: 0.12 + R() * 0.15 }); } } },
      { depth: 0.4, paint: (ctx, L) => art(ctx, L, (c) => { wash(c, 560, 250, 520, 40, 'rgba(195,191,185,0.12)', { seed: 13 }); brush(c, [[-100, 252], [300, 246], [700, 254], [1100, 248]], { w: 3, alpha: 0.5, dry: 0.7, profile: 'even', seed: 14, n: 40 }); figure(c, 560, 250, 150, { dir: -1, kneel: true, lean: 0.25, mark: true, rim: C.boneA(0.4) }); }) },
    ],
    enter(v) { const L = v.L; reflection = canvas(420 * L.s, 300 * L.s); const c = reflection.ctx; c.scale(L.s, L.s); c.translate(210, 0); c.scale(1, -1); figure(c, 0, 0, 150, { dir: -1, kneel: true, lean: 0.25, color: 'rgba(120,112,106,0.5)', rim: null, mark: false }); },
    dyn(ctx, L, st) {
      if (!reflection) return;
      const t = st.key === 'rio' ? st.t : 1, x0 = L.X(560) - 210 * L.s, y0 = L.Y(256);
      const H = reflection.h, Wd = reflection.w;
      for (let y = 0; y < H; y += 3) { const off = Math.sin(y * 0.06 + st.time * 2.4) * (2 + y * 0.02); ctx.drawImage(reflection, 0, y * (reflection.width / Wd), reflection.width, 3 * (reflection.width / Wd), x0 + off, y0 + y, Wd, 3); }
      art(ctx, L, (c) => {
        const mx = 560 - 8 + Math.sin(st.time * 2) * 2, my = 256 + 128 * 0.95 - 4;
        const a = ramp(t, 0.05, 0.4);
        const g = c.createRadialGradient(mx + 10, my - 20, 0, mx + 10, my - 20, 40); g.addColorStop(0, C.glowA(0.9 * a)); g.addColorStop(0.3, C.red(0.6 * a)); g.addColorStop(1, C.red(0)); c.fillStyle = g; c.beginPath(); c.arc(mx + 10, my - 20, 40, 0, 7); c.fill();
        if (a > 0.2) { c.save(); c.globalAlpha = a; lily(c, mx + 10, my - 24, 0.32, { stem: 0, seed: 4 }); c.restore(); }
        for (let k = 0; k < 4; k++) { const f = (st.time * 0.3 + k / 4) % 1; c.strokeStyle = C.boneA(0.3 * (1 - f)); c.lineWidth = 1; c.beginPath(); c.ellipse(560, 330, 30 + f * 220, (30 + f * 220) * 0.25, 0, 0, 7); c.stroke(); }
      });
    },
  });

  stage.define('ronin', {
    layers: [
      bg([560, 470, 760, 'rgba(120,108,100,0.6)']),
      { depth: 0.15, paint: (ctx, L) => art(ctx, L, (c) => { mountains(c, { x0: -300, x1: 1300, base: 260, amp: 90, color: 'rgba(195,191,185,0.12)', fade: 80, seed: 71, rim: 0.35 }); const R = rng(72); for (let i = 0; i < 9; i++) house(c, -120 + i * 150 + R() * 30, 470 + R() * 20, 110 + R() * 30, { color: C.boneA(0.35), fill: 'rgba(16,12,12,0.9)' }); band(ctx, L, 470, 60, 0.12); }) },
      { depth: 0.35, paint: (ctx, L) => art(ctx, L, (c) => { wash(c, 560, 650, 600, 60, 'rgba(195,191,185,0.1)', { seed: 73 }); brush(c, [[-200, 650], [500, 645], [1200, 652]], { w: 2, alpha: 0.4, dry: 0.8, profile: 'even', seed: 74, n: 40 }); figure(c, 440, 650, 150, { dir: 1, mark: false, rim: C.boneA(0.45) }); figure(c, 640, 650, 185, { dir: -1, hat: true, staff: true, hair: false, rim: C.boneA(0.45) });
        // venda sobre los ojos del ronin
        c.strokeStyle = C.boneA(0.7); c.lineWidth = 3; c.beginPath(); c.moveTo(626, 470); c.lineTo(650, 474); c.stroke();
        c.fillStyle = C.boneA(0.8); c.fillRect(446, 512, 16, 6);
        callout(c, [455, 515], [300, 420], 'La marca, vendada', { align: 'right', size: 13 }); callout(c, [640, 472], [800, 400], 'El ronin ciego', { align: 'left', size: 13, sub: 'la huele sin verla' }); }) },
    ],
    dyn(ctx, L, st) {
      const t = st.key === 'ronin' ? st.t : st.key === 'ronin2' ? 1 : 0;
      const f = ramp(t, 0.15, 0.5);
      art(ctx, L, (c) => {
        const x = 590 + f * 10, y = 560 + f * f * 88;
        if (f < 1) { c.save(); c.translate(x, y); c.rotate(f * 3); c.fillStyle = '#8a8580'; c.beginPath(); c.moveTo(-12, -5); c.lineTo(12, -5); c.lineTo(8, 6); c.lineTo(-8, 6); c.closePath(); c.fill(); c.restore(); if (f > 0) { c.strokeStyle = C.boneA(0.6); c.beginPath(); c.moveTo(x, y + 6); c.lineTo(x - 2, y + 14); c.stroke(); } }
        else { const R = rng(5); c.fillStyle = '#8a8580'; for (let k = 0; k < 6; k++) { const a = R() * Math.PI, d = 10 + R() * 26; c.beginPath(); c.moveTo(600 + Math.cos(a) * d, 648 - Math.sin(a) * 3); c.lineTo(606 + Math.cos(a) * d, 646); c.lineTo(603 + Math.cos(a) * d, 651); c.fill(); } wash(c, 600, 652, 50, 6, 'rgba(160,165,170,0.25)', { seed: 6, blobs: 3 }); }
      });
    },
  });

  stage.define('almacen', {
    layers: [{ depth: 0, paint: (ctx, L) => { ctx.fillStyle = '#000'; ctx.fillRect(-80, -80, L.w + 160, L.h + 160); } }],
    dynDepth: 0.1,
    dyn(ctx, L, st) {
      const t = st.key === 'almacen' ? st.t : 0, time = st.time;
      const W = L.w, H = L.h;
      // lo que se ve detrás: fuego, el oni y la sangre
      const fl = 0.7 + 0.3 * Math.sin(time * 9) * Math.sin(time * 5.3);
      const g = ctx.createRadialGradient(W * 0.7, H * 0.6, 0, W * 0.7, H * 0.6, W * 0.6); g.addColorStop(0, `rgba(210,40,30,${0.85 * fl})`); g.addColorStop(0.5, `rgba(120,15,15,${0.55 * fl})`); g.addColorStop(1, 'rgba(20,4,4,1)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      art(ctx, L, (c) => {
        const raise = ramp(t, 0.1, 0.35), hit = ramp(t, 0.35, 0.45);
        figure(c, 560, 760, 420, { dir: 1, hat: false, hair: false, color: 'rgba(10,8,8,0.97)', rim: null });
        c.fillStyle = 'rgba(10,8,8,0.97)'; c.beginPath(); c.moveTo(520, 380); c.lineTo(500, 330); c.lineTo(540, 372); c.moveTo(600, 380); c.lineTo(620, 330); c.lineTo(580, 372); c.fill();
        c.save(); c.translate(620, 470); c.rotate(-0.4 - raise * 1.6 + hit * 2.4); c.fillRect(-10, -190, 22, 200); c.restore();
        const bg2 = c.createRadialGradient(470, 450, 0, 470, 450, 40); bg2.addColorStop(0, 'rgba(170,200,255,1)'); bg2.addColorStop(0.3, C.oni(0.8)); bg2.addColorStop(1, C.oni(0)); c.fillStyle = bg2; c.beginPath(); c.arc(470, 450, 40, 0, 7); c.fill();
        const fall = ramp(t, 0.42, 0.6);
        c.save(); c.translate(760, 760); c.rotate(fall * 1.3); figure(c, 0, 0, 260, { dir: -1, color: 'rgba(12,9,9,0.95)', rim: null }); c.restore();
        const sp = ramp(t, 0.5, 0.62);
        if (sp > 0) { c.save(); c.globalAlpha = sp; const R = rng(9); c.fillStyle = '#9e0f18'; for (let k = 0; k < 26; k++) { const a = R() * 6.28, d = R() * 120 * sp; c.beginPath(); c.arc(820 + Math.cos(a) * d * 1.4, 330 + Math.sin(a) * d * 0.6, 3 + R() * 12, 0, 7); c.fill(); } c.restore(); }
      });
      // las tablas del almacén, con rendijas
      const pw = Math.max(80, W / 8), gap = 12 + ramp(t, 0, 0.2) * 8;
      ctx.fillStyle = '#050404';
      for (let x = -pw / 2; x < W + pw; x += pw) ctx.fillRect(x, 0, pw - gap, H);
      ctx.strokeStyle = 'rgba(195,191,185,0.05)'; ctx.lineWidth = 1;
      for (let x = -pw / 2; x < W + pw; x += pw) for (let k = 1; k < 5; k++) { ctx.beginPath(); ctx.moveTo(x + k * pw / 5, 0); ctx.bezierCurveTo(x + k * pw / 5 + 6, H * 0.3, x + k * pw / 5 - 6, H * 0.6, x + k * pw / 5 + 3, H); ctx.stroke(); }
      const sh = ctx.createLinearGradient(0, 0, W, 0); sh.addColorStop(0, 'rgba(0,0,0,0.85)'); sh.addColorStop(0.45, 'rgba(0,0,0,0.2)'); sh.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = sh; ctx.fillRect(0, 0, W, H);
    },
  });

  // ---------------- Capítulo II ----------------
  const veins = (() => { const R = rng(21), out = []; const grow = (x, y, a, len, d, t0) => { const pts = [[x, y]]; let cx = x, cy = y; for (let i = 0; i < len; i++) { a += (R() - 0.5) * 0.5; cx += Math.cos(a) * 9; cy += Math.sin(a) * 9; pts.push([cx, cy]); if (d < 3 && R() < 0.08) grow(cx, cy, a + (R() < 0.5 ? -0.7 : 0.7), len * 0.45 | 0, d + 1, t0 + i / len * 0.4); } out.push({ pts, t0, d }); }; grow(250, 170, 0.62, 70, 0, 0); grow(250, 170, 0.75, 60, 1, 0.05); return out; })();
  stage.define('despertar', {
    layers: [
      bg([600, 400, 600, 'rgba(70,40,40,0.5)']),
      { depth: 0.3, paint: (ctx, L) => art(ctx, L, (c) => {
        // cuello, hombro y brazo derecho en primer plano (contorno de pincel)
        brush(c, [[150, -40], [200, 140], [330, 230], [560, 360], [820, 520], [1060, 640]], { w: 4, alpha: 0.7, dry: 0.5, profile: 'even', seed: 30, n: 80 });
        brush(c, [[60, 120], [180, 300], [420, 440], [700, 600], [980, 780]], { w: 4, alpha: 0.6, dry: 0.55, profile: 'even', seed: 31, n: 80 });
        wash(c, 520, 420, 420, 160, 'rgba(195,191,185,0.07)', { seed: 32 });
        const R = rng(33); for (let i = 0; i < 40; i++) { const x = 300 + R() * 600, y = 260 + (x - 300) * 0.55 + R() * 120; line(c, [[x, y], [x + 18, y + 9]], { w: 0.8, alpha: 0.12 }); }
        callout(c, [250, 172], [120, 70], 'La marca despierta', { align: 'left', size: 13 }); }) },
    ],
    dyn(ctx, L, st) {
      const t = st.key === 'despertar' ? st.t : 1, time = st.time;
      art(ctx, L, (c) => {
        const mk = c.createRadialGradient(250, 170, 0, 250, 170, 70); mk.addColorStop(0, C.glowA(0.95)); mk.addColorStop(0.25, C.red(0.6)); mk.addColorStop(1, C.red(0)); c.fillStyle = mk; c.beginPath(); c.arc(250, 170, 70 * (0.8 + 0.2 * Math.sin(time * 6)), 0, 7); c.fill();
        lily(c, 250, 176, 0.42, { stem: 0, seed: 6 });
        for (const v of veins) { const p = ramp(t * 1.15, v.t0, v.t0 + 0.6); if (p <= 0) continue; line(c, v.pts, { w: 4 - v.d, color: C.glowA(0.25), upTo: p }); line(c, v.pts, { w: 2.2 - v.d * 0.5, color: '#e0303a', upTo: p }); }
        const cut = ramp(t, 0.75, 0.95);
        if (cut > 0) { line(c, spline([[470, 400], [620, 470], [800, 560]], 30), { w: 5, color: '#ff4a4a', upTo: cut }); const g = c.createRadialGradient(640, 480, 0, 640, 480, 140); g.addColorStop(0, C.glowA(0.5 * cut)); g.addColorStop(1, C.glowA(0)); c.fillStyle = g; c.fillRect(480, 340, 320, 280); }
      });
    },
  });

  // latido: poder de Kenji, de 22:30 a 23:00
  const powerAt = (m) => (m < 30 ? 0 : m < 32 ? 15 + ((m - 30) / 2) * 85 : m < 45 ? 100 : 100 - ((m - 45) / 15) * 80);
  const beat = (m) => { const ph = (m % 1.1) / 1.1; return Math.exp(-Math.pow((ph - 0.2) / 0.025, 2)) - Math.exp(-Math.pow((ph - 0.27) / 0.03, 2)) * 0.35 + Math.exp(-Math.pow((ph - 0.55) / 0.08, 2)) * 0.15; };
  const PX = (m) => 120 + ((m - 30) / 30) * 820, PY = (v) => 470 - v * 3.1;
  const ecg = []; for (let m = 30; m <= 60; m += 0.03) ecg.push([PX(m), PY(powerAt(m) * (0.25 + 0.75 * beat(m)))]);
  stage.define('latido', {
    layers: [
      bg([560, 360, 640, 'rgba(70,50,50,0.5)']),
      { depth: 0.25, paint: (ctx, L) => art(ctx, L, (c) => {
        figure(c, 520, 720, 230, { dir: 1, mark: true, rim: C.boneA(0.3), color: 'rgba(10,8,8,0.9)' });
        c.save(); c.globalAlpha = 0.85; c.translate(568, 580); c.rotate(-0.5); weapon2d(c, 0, 0, 0.42); c.restore();
        frame(c, 100, 120, 860, 400, { color: C.boneA(0.18) });
        line(c, [[PX(30), PY(0)], [PX(60), PY(0)]], { alpha: 0.35 }); line(c, [[PX(30), PY(100)], [PX(60), PY(100)]], { alpha: 0.15, dash: [2, 5] });
        c.fillStyle = C.boneA(0.85); c.font = '15px "Zen Old Mincho", serif'; c.textAlign = 'left'; c.fillText('Poder de Kenji', 124, 150);
        c.font = '10px "IBM Plex Sans", sans-serif'; c.fillStyle = C.boneA(0.55);
        for (const [m, tx] of [[30, '22:30'], [45, '22:45'], [60, '23:00']]) { c.textAlign = 'center'; c.fillText(tx, PX(m), PY(0) + 18); }
        c.textAlign = 'right'; c.fillText('100', PX(30) - 8, PY(100) + 3); c.fillText('0', PX(30) - 8, PY(0) + 3);
      }) },
    ],
    dyn(ctx, L, st) {
      const t = st.key === 'latido' ? Math.min(1, st.t * 1.25) : 1;
      art(ctx, L, (c) => {
        line(c, ecg, { w: 7, color: C.glowA(0.18), upTo: t }); line(c, ecg, { w: 2.4, color: '#e0303a', upTo: t });
        const m = 30 + t * 30, v = powerAt(m);
        const p = ecg[Math.min(ecg.length - 1, Math.floor(t * (ecg.length - 1)))];
        c.fillStyle = '#ff6a6a'; c.beginPath(); c.arc(p[0], p[1], 5, 0, 7); c.fill();
        c.fillStyle = '#f1ebe2'; c.font = '700 22px "Shippori Mincho B1", serif'; c.textAlign = 'left'; c.fillText(`${Math.round(v)}`, p[0] + 10, p[1] - 10);
        if (t > 0.08) callout(c, [PX(32), PY(100)], [PX(32) + 60, 200], '22:32 · nace el arma', { size: 12 });
        if (t > 0.97) callout(c, [PX(60), PY(20)], [PX(60) - 80, 330], '23:00 · se desmaya', { align: 'right', size: 12 });
      });
    },
  });

  // ensō de las bestias (la dona): un círculo zen partido en 4 arcos
  const total = CRIATURAS.reduce((s, c) => s + c.count, 0);
  const arcs = []; { let a0 = -Math.PI / 2; for (const c of CRIATURAS) { const span = (c.count / total) * Math.PI * 2; arcs.push({ c, a0: a0 + 0.05, a1: a0 + span - 0.05 }); a0 += span; } }
  const EC = [560, 380], ER = 230;
  const arcPts = (a0, a1, r = ER) => { const pts = []; for (let k = 0; k <= 30; k++) { const a = a0 + (a1 - a0) * (k / 30); pts.push([EC[0] + Math.cos(a) * r, EC[1] + Math.sin(a) * r]); } return pts; };
  let hi = null;
  stage.define('enso', {
    layers: [
      bg([560, 380, 600, 'rgba(70,60,58,0.55)']),
      { depth: 0.25, paint: (ctx, L) => art(ctx, L, (c) => {
        arcs.forEach((A, i) => brush(c, arcPts(A.a0, A.a1), { w: 34 - i * 4, alpha: 0.85, dry: 0.65, profile: i === 0 ? 'start' : 'taper', seed: 80 + i, n: 60 }));
        figure(c, EC[0], EC[1] + 90, 170, { dir: 1, mark: true, rim: C.boneA(0.35) });
        c.fillStyle = '#f1ebe2'; c.font = '700 20px "Shippori Mincho B1", serif'; c.textAlign = 'center'; c.fillText('30 criaturas', EC[0], EC[1] - 120); c.font = '11px "IBM Plex Sans", sans-serif'; c.fillStyle = C.boneA(0.6); c.fillText('ATACARON EL VALLE', EC[0], EC[1] - 100);
        arcs.forEach((A) => { for (let k = 0; k < A.c.count; k++) { const a = A.a0 + (A.a1 - A.a0) * ((k + 0.5) / A.c.count); creature(c, A.c.id, EC[0] + Math.cos(a) * (ER + 46), EC[1] + Math.sin(a) * (ER + 46), 0.8); } });
      }) },
    ],
    mount(el, L) {
      arcs.forEach((A) => {
        const mid = (A.a0 + A.a1) / 2, r = ER + 110;
        const x = L.X(EC[0] + Math.cos(mid) * r), y = L.Y(EC[1] + Math.sin(mid) * r);
        const b = document.createElement('button'); b.className = 'tag-btn';
        b.innerHTML = `<span lang="ja">${A.c.kanji}</span>${A.c.name}<small>${(A.c.count / total * 100).toFixed(1).replace('.', ',')} %</small>`;
        b.style.left = x + 'px'; b.style.top = y + 'px';
        b.addEventListener('click', () => onBestia(A.c.id, (id) => (hi = id)));
        el.appendChild(b);
      });
    },
    dyn(ctx, L, st) { if (!hi) return; const A = arcs.find((a) => a.c.id === hi); art(ctx, L, (c) => { brush(c, arcPts(A.a0, A.a1), { w: 22, color: '#c8141e', alpha: 0.75 + 0.2 * Math.sin(st.time * 4), dry: 0.3, profile: 'taper', seed: 99, n: 50 }); }); },
    leave() { hi = null; },
  });
  stage.views && (stage._setHi = (id) => (hi = id));

  stage.define('ruinas', {
    layers: [
      bg([640, 260, 700, 'rgba(120,110,104,0.45)']),
      { depth: 0.15, paint: (ctx, L) => art(ctx, L, (c) => { mountains(c, { x0: -300, x1: 1300, base: 300, amp: 80, color: 'rgba(195,191,185,0.13)', fade: 100, seed: 91, rim: 0.3 }); band(ctx, L, 380, 90, 0.18); }) },
      { depth: 0.35, paint: (ctx, L) => art(ctx, L, (c) => {
        const R = rng(92);
        for (let i = 0; i < 7; i++) { const x = 80 + i * 140 + R() * 40, y = 520 + R() * 30, w = 90 + R() * 50; c.strokeStyle = C.boneA(0.4); c.lineWidth = 3; c.beginPath(); c.moveTo(x - w / 2, y); c.lineTo(x - w / 2, y - w * 0.5); c.lineTo(x - w * 0.1, y - w * 0.75 + R() * 20); c.moveTo(x + w / 2, y); c.lineTo(x + w / 2, y - w * 0.35); c.moveTo(x - w / 2, y - w * 0.3); c.lineTo(x + w * 0.3, y - w * 0.2); c.stroke(); c.fillStyle = 'rgba(8,6,6,0.85)'; c.fillRect(x - w / 2, y - 8, w, 10); }
        wash(c, 560, 680, 640, 70, 'rgba(195,191,185,0.08)', { seed: 93 });
        figure(c, 420, 690, 140, { dir: 1, kneel: true, mark: true, rim: C.boneA(0.4) });
        c.save(); c.translate(640, 700); c.rotate(0.35); weapon2d(c, 0, -60, 0.5); c.restore();
        callout(c, [650, 560], [800, 470], 'La kusarigama, clavada en el barro', { size: 13, sub: 'unida a la herida de su brazo' });
        line(c, spline([[455, 600], [540, 640], [620, 610]], 20), { w: 2, color: '#c0141c', alpha: 0.8 });
      }) },
    ],
    dyn(ctx, L, st) { art(ctx, L, (c) => { for (let k = 0; k < 7; k++) { const x = 100 + k * 140, base = 500; c.strokeStyle = C.boneA(0.12); c.lineWidth = 6; c.beginPath(); for (let i = 0; i < 30; i++) { const y = base - i * 9, xx = x + Math.sin(i * 0.25 - st.time * 0.8 + k) * (i * 0.6); i ? c.lineTo(xx, y) : c.moveTo(xx, y); } c.stroke(); } }); },
  });

  stage.define('camino', {
    layers: [
      bg([620, 260, 700, 'rgba(120,110,104,0.45)']),
      { depth: 0.1, paint: (ctx, L) => art(ctx, L, (c) => { mountains(c, { x0: -300, x1: 1300, base: 260, amp: 120, color: 'rgba(195,191,185,0.1)', fade: 80, seed: 101, rim: 0.25 }); }) },
      { depth: 0.25, paint: (ctx, L) => art(ctx, L, (c) => { mountains(c, { x0: -300, x1: 1300, base: 380, amp: 110, color: 'rgba(195,191,185,0.16)', fade: 120, seed: 102, rim: 0.4 }); band(ctx, L, 420, 80, 0.2); }) },
      { depth: 0.5, paint: (ctx, L) => art(ctx, L, (c) => { const rd = new Path2D(); rd.moveTo(180, 760); rd.bezierCurveTo(420, 640, 560, 560, 630, 440); rd.lineTo(650, 440); rd.bezierCurveTo(620, 560, 600, 660, 520, 760); rd.closePath(); const rg = c.createLinearGradient(0, 760, 0, 440); rg.addColorStop(0, 'rgba(195,191,185,0.22)'); rg.addColorStop(1, 'rgba(195,191,185,0)'); c.fillStyle = rg; c.fill(rd); const R = rng(104); for (let i = 0; i < 40; i++) { const y = 460 + R() * 300, x = 640 - (y - 440) * (0.6 + R() * 0.8); line(c, [[x, y], [x + 8, y - 1]], { w: 0.8, alpha: 0.25 }); } figure(c, 560, 600, 110, { dir: -1, mark: true, rim: C.boneA(0.45) }); c.save(); c.translate(552, 512); c.rotate(2.4); weapon2d(c, 0, 0, 0.18); c.restore(); }) },
    ],
  });

  // ---------------- Capítulo III ----------------
  // emakimono: rollo que se desenrolla con el viaje
  let roll = null; const RW = 3000;
  const stops = VIAJE.map((s, i) => ({ ...s, x: 620 + i * 600, y: 380 + (i % 2 ? -40 : 40) }));
  const roadPts = spline([[150, 470], [400, 430], ...stops.flatMap((s, i) => [[s.x - 220, s.y + (i % 2 ? 90 : -60)], [s.x, s.y + 70]]), [RW - 150, 420]], 200);
  stage.define('emaki', {
    layers: [bg([600, 380, 600, 'rgba(70,60,58,0.45)'])],
    dynDepth: 0.15,
    enter(v) {
      const s = v.L.s; roll = canvas(RW * s, 720 * s); const c = roll.ctx; c.scale(s, s);
      c.fillStyle = '#1b1615'; c.fillRect(0, 60, RW, 600);
      wash(c, RW / 2, 360, RW / 2, 260, 'rgba(195,191,185,0.05)', { seed: 5, blobs: 14 });
      c.strokeStyle = C.boneA(0.25); c.lineWidth = 1; c.strokeRect(10, 70, RW - 20, 580); c.strokeStyle = 'rgba(154,31,40,0.45)'; c.strokeRect(18, 78, RW - 36, 564);
      mountains(c, { x0: 0, x1: RW, base: 300, amp: 90, color: 'rgba(195,191,185,0.08)', fade: 120, seed: 111, rim: 0.2, freq: 0.003 });
      // el valle al inicio
      const R = rng(112); for (let i = 0; i < 12; i++) house(c, 120 + R() * 220, 520 + R() * 60, 26, { color: C.boneA(0.5) });
      c.fillStyle = C.boneA(0.8); c.font = '700 22px "Shippori Mincho B1", serif'; c.textAlign = 'left'; c.fillText('黄泉川', 140, 150); c.font = '11px "IBM Plex Sans", sans-serif'; c.fillStyle = C.boneA(0.55); c.fillText('EL VALLE · INICIO DEL VIAJE', 140, 170);
      line(c, roadPts, { w: 3, color: C.boneA(0.35), dash: [6, 7] });
      stops.forEach((s, i) => {
        if (i === 0) { const pm = '#0a0808'; c.fillStyle = pm; c.fillRect(s.x - 70, s.y - 120, 12, 150); c.fillRect(s.x + 58, s.y - 120, 12, 150); c.fillRect(s.x - 100, s.y - 132, 200, 16); c.fillRect(s.x - 80, s.y - 100, 160, 10); c.strokeStyle = C.boneA(0.5); c.strokeRect(s.x - 100, s.y - 132, 200, 16); creature(c, 'yokai', s.x, s.y - 20, 2, { color: C.bone }); }
        if (i === 1) { const pk = new Path2D(); pk.moveTo(s.x - 260, s.y + 60); pk.quadraticCurveTo(s.x - 80, s.y - 60, s.x, s.y - 190); pk.quadraticCurveTo(s.x + 90, s.y - 50, s.x + 270, s.y + 60); pk.closePath(); const mg = c.createLinearGradient(0, s.y - 190, 0, s.y + 60); mg.addColorStop(0, 'rgba(195,191,185,0.32)'); mg.addColorStop(1, 'rgba(195,191,185,0.04)'); c.fillStyle = mg; c.fill(pk); c.strokeStyle = C.boneA(0.55); c.lineWidth = 2; c.stroke(pk); c.fillStyle = 'rgba(240,236,230,0.85)'; c.beginPath(); c.moveTo(s.x - 52, s.y - 118); c.quadraticCurveTo(s.x - 20, s.y - 160, s.x, s.y - 190); c.quadraticCurveTo(s.x + 24, s.y - 150, s.x + 60, s.y - 112); c.lineTo(s.x + 30, s.y - 124); c.lineTo(s.x + 6, s.y - 108); c.lineTo(s.x - 22, s.y - 126); c.closePath(); c.fill(); figure(c, s.x + 70, s.y + 30, 70, { dir: -1, hat: false, color: 'rgba(8,6,6,0.9)', rim: C.boneA(0.4) }); c.fillStyle = '#b3121b'; c.beginPath(); c.moveTo(s.x + 76, s.y - 34); c.lineTo(s.x + 92, s.y - 30); c.lineTo(s.x + 76, s.y - 28); c.fill(); }
        if (i === 2) { brush(c, [[s.x - 220, s.y + 20], [s.x - 60, s.y - 10], [s.x + 80, s.y + 30], [s.x + 230, s.y]], { w: 40, color: 'rgba(8,6,6,0.9)', dry: 0.7, profile: 'taper', seed: 121, n: 50 }); for (let k = 0; k < 14; k++) { c.fillStyle = C.boneA(0.3 + R() * 0.3); c.beginPath(); c.ellipse(s.x - 200 + R() * 400, s.y + R() * 30, 6 + R() * 8, 4 + R() * 4, 0, 0, 7); c.fill(); } creature(c, 'kappa', s.x + 20, s.y - 20, 2.4); }
        if (i === 3) { house(c, s.x, s.y + 40, 160, { color: C.boneA(0.55) }); c.strokeStyle = C.boneA(0.4); c.lineWidth = 3; c.beginPath(); c.moveTo(s.x - 60, s.y - 50); c.lineTo(s.x + 30, s.y - 20); c.stroke(); c.fillStyle = 'rgba(10,8,8,0.95)'; c.beginPath(); c.ellipse(s.x + 110, s.y + 30, 18, 12, 0, 0, 7); c.fill(); c.beginPath(); c.moveTo(s.x + 98, s.y + 22); c.lineTo(s.x + 100, s.y + 8); c.lineTo(s.x + 108, s.y + 20); c.moveTo(s.x + 114, s.y + 20); c.lineTo(s.x + 122, s.y + 8); c.lineTo(s.x + 124, s.y + 22); c.fill(); c.fillStyle = '#e0303a'; c.fillRect(s.x + 103, s.y + 26, 3, 2); c.fillRect(s.x + 115, s.y + 26, 3, 2); }
        callout(c, [s.x, s.y - 150], [s.x + 40, 130], `${s.kanji}  ${s.who}`, { size: 18, sub: s.name });
      });
      c.fillStyle = C.boneA(0.6); c.font = '12px "IBM Plex Sans", sans-serif'; c.textAlign = 'right'; c.fillText('…Y EL VIAJE SIGUE', RW - 60, 620);
    },
    dyn(ctx, L, st) {
      if (!roll) return;
      const t = st.key === 'viaje' ? st.t : 1;
      const s = L.s, viewW = L.aw + 80, x0 = L.ax - 40;
      const off = Math.max(0, Math.min(RW * s - viewW, (t * (RW - 900) * s)));
      ctx.drawImage(roll, off * (roll.width / roll.w), 0, viewW * (roll.width / roll.w), roll.height, x0, L.oy, viewW, roll.h);
      // rodillos del rollo
      for (const rx of [x0 - 8, x0 + viewW - 8]) { const g = ctx.createLinearGradient(rx, 0, rx + 16, 0); g.addColorStop(0, '#2a1f1c'); g.addColorStop(0.5, '#6a5146'); g.addColorStop(1, '#2a1f1c'); ctx.fillStyle = g; ctx.fillRect(rx, L.oy + 40 * s, 16, 640 * s); }
      // pasos de Kenji en rojo y él caminando
      const n = Math.max(2, Math.floor(roadPts.length * t));
      ctx.save(); ctx.beginPath(); ctx.rect(x0, L.oy, viewW, 720 * s); ctx.clip();
      ctx.translate(x0 - off, L.oy); ctx.scale(s, s);
      for (let i = 0; i < n; i += 3) { const p = roadPts[i]; ctx.fillStyle = C.glowA(0.85); ctx.beginPath(); ctx.ellipse(p[0] + (i % 6 ? 4 : -4), p[1], 3, 2, 0, 0, 7); ctx.fill(); }
      const p = roadPts[n - 1]; figure(ctx, p[0], p[1] - 4, 80, { dir: 1, mark: true, rim: C.boneA(0.6) });
      ctx.restore();
    },
  });

  // invierno: la marca crece, los recuerdos se borran
  const AGE = { pesadilla: [13, 16.5], pregunta: [16.5, 18.5], leyenda: [18.5, 20.5], invierno: [20.5, 22], invierno2: [22, 22], eleccion: [22, 22.6], eleccion2: [22.6, 22.6] };
  const CX = (age) => 520 + ((age - 13) / 9.6) * 420, CY = (v) => 300 - v * 2.1;
  const interp = (age, col) => { for (let i = 1; i < MARCA.length; i++) { const a = MARCA[i - 1], b = MARCA[i]; if (age <= b.age) return a[col] + (b[col] - a[col]) * ((age - a.age) / (b.age - a.age)); } return MARCA[MARCA.length - 1][col]; };
  const curve = (col, upTo) => { const pts = []; for (let a = 13; a <= upTo + 0.001; a += 0.05) pts.push([CX(a), CY(interp(a, col))]); return pts; };
  stage.define('invierno', {
    layers: [
      bg([600, 200, 700, 'rgba(70,66,64,0.5)']),
      { depth: 0.1, paint: (ctx, L) => art(ctx, L, (c) => { mountains(c, { x0: -300, x1: 1300, base: 430, amp: 110, color: 'rgba(230,226,220,0.12)', fade: 60, seed: 131, rim: 0.4 }); }) },
      { depth: 0.25, paint: (ctx, L) => { ctx.fillStyle = 'rgba(205,200,193,0.13)'; ctx.fillRect(-80, L.Y(500), L.w + 160, L.h); art(ctx, L, (c) => { const R = rng(132); for (let i = 0; i < 30; i++) { const x = -200 + R() * 1400, y = 470 + R() * 60, h = 50 + R() * 70; c.fillStyle = 'rgba(8,6,6,0.85)'; c.beginPath(); c.moveTo(x, y - h); c.lineTo(x - h * 0.28, y); c.lineTo(x + h * 0.28, y); c.closePath(); c.fill(); c.fillStyle = 'rgba(230,226,220,0.5)'; c.beginPath(); c.moveTo(x, y - h); c.lineTo(x - h * 0.1, y - h * 0.65); c.lineTo(x + h * 0.1, y - h * 0.65); c.fill(); }
        for (let i = 0; i < 5; i++) house(c, 800 + i * 50, 520 + (i % 2) * 10, 44, { color: C.boneA(0.45) }); }); } },
      { depth: 0.5, paint: (ctx, L) => art(ctx, L, (c) => { frame(c, 470, 70, 510, 280, { color: C.boneA(0.18) }); c.fillStyle = C.boneA(0.55); c.font = '10px "IBM Plex Sans", sans-serif'; c.textAlign = 'center'; for (const a of [13, 15, 18, 20, 22]) c.fillText(`${a} AÑOS`, CX(a), CY(0) + 18); line(c, [[CX(13), CY(0)], [CX(22.6), CY(0)]], { alpha: 0.35 }); c.textAlign = 'left'; c.fillStyle = C.boneA(0.85); c.font = '14px "Zen Old Mincho", serif'; c.fillText('La marca contra los recuerdos', 490, 96); }) },
    ],
    dyn(ctx, L, st) {
      const r = AGE[st.key] || [22.6, 22.6]; const age = r[0] + (r[1] - r[0]) * st.t;
      const night = st.key === 'invierno' || st.key === 'invierno2';
      art(ctx, L, (c) => {
        if (night) for (let i = 0; i < 5; i++) { const x = 800 + i * 50, y = 510; const g = c.createRadialGradient(x, y, 0, x, y, 60); g.addColorStop(0, `rgba(230,60,40,${0.6 + 0.3 * Math.sin(st.time * 8 + i)})`); g.addColorStop(1, C.red(0)); c.fillStyle = g; c.beginPath(); c.arc(x, y, 60, 0, 7); c.fill(); if (i === 1) { const b = c.createRadialGradient(x - 30, y + 10, 0, x - 30, y + 10, 24); b.addColorStop(0, C.oni(0.9)); b.addColorStop(1, C.oni(0)); c.fillStyle = b; c.beginPath(); c.arc(x - 30, y + 10, 24, 0, 7); c.fill(); } }
        // Kenji caminando: la marca sube por el brazo
        const kx = 240 + (age - 13) * 14;
        figure(c, kx, 640, 200, { dir: 1, mark: true, rim: C.boneA(0.5) });
        c.save(); c.translate(kx + 36, 520); c.rotate(2.5); weapon2d(c, 0, 0, 0.22); c.restore();
        const mg = interp(age, 'marca');
        line(c, [[kx + 12, 528], [kx + 22, 540 + mg * 0.9]], { w: 6, color: C.glowA(0.85) });
        // la gráfica doble
        const m = curve('marca', age), me = curve('memoria', age);
        if (m.length > 1) { line(c, m, { w: 6, color: C.glowA(0.18) }); line(c, m, { w: 2.6, color: '#e0303a' }); line(c, me, { w: 2.4, color: '#efe9e1' }); }
        const pm = [CX(age), CY(interp(age, 'marca'))], pr = [CX(age), CY(interp(age, 'memoria'))];
        c.fillStyle = '#ff6a6a'; c.beginPath(); c.arc(pm[0], pm[1], 4, 0, 7); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(pr[0], pr[1], 4, 0, 7); c.fill();
        c.font = '12px "IBM Plex Sans", sans-serif'; c.textAlign = 'left';
        c.fillStyle = '#ff8a8a'; c.fillText(`Marca ${Math.round(interp(age, 'marca'))} %`, pm[0] + 8, pm[1] - 6);
        c.fillStyle = '#efe9e1'; c.fillText(`Recuerdos ${Math.round(interp(age, 'memoria'))} %`, pr[0] + 8, pr[1] + 14);
        const cur = MARCA.filter((x) => x.age <= age + 0.01).pop();
        c.fillStyle = '#f1ebe2'; c.font = '600 16px "Shippori Mincho B1", serif'; c.textAlign = 'right'; c.fillText(`${Math.floor(age)} años · ${cur ? cur.label : ''}`, 960, 96);
      });
    },
  });
}

// arte de los paneles del menú
export function paintPanel(i, cv) {
  const c = cv.ctx, w = cv.w, h = cv.h;
  paper(c, w, h, { glowAt: [w / 2, h * 0.55, h * 0.6, 'rgba(80,66,62,0.6)'], vignette: 0.6 });
  if (i === 0) { const R = rng(3); for (let k = 0; k < 10; k++) bamboo(c, R() * w, -20, h + 20, 4 + R() * 4, { alpha: 0.18, seed: k + 3 }); lily(c, w / 2, h * 0.5, Math.min(w / 160, 1.6), { stem: h * 0.3 }); }
  if (i === 1) { c.save(); c.translate(w * 0.42, h * 0.52); c.rotate(-0.25); weapon2d(c, 0, 0, Math.min(w / 260, 1.1)); c.restore(); }
  if (i === 2) { c.fillStyle = 'rgba(205,200,193,0.12)'; c.fillRect(0, h * 0.72, w, h); mountains(c, { x0: 0, x1: w, base: h * 0.7, amp: h * 0.12, color: 'rgba(230,226,220,0.14)', fade: 40, seed: 5, rim: 0.4 }); figure(c, w * 0.55, h * 0.86, h * 0.26, { dir: -1, mark: true, rim: C.boneA(0.5) }); }
}
