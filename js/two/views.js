// Escenas ilustradas en 2D (tinta clara sobre papel oscuro, al estilo de la infografía).
// Cada escena: capas pintadas una vez (con paralaje suave) + una capa dinámica ligera (sprites ya dibujados).
import { C, rng, paper, mountains, brush, line, wash, bamboo, lily, figure, figurePoint, house, callout, frame, creature, creatureSprite, spline, canvas, cached, stamp, chartCard, axisLabel, weaponAt, lilySprite } from './brush.js';
import { CRIATURAS, VIAJE, MARCA } from '../story.js';
import { drawIcon } from '../icons.js';

const art = (ctx, L, fn) => { ctx.save(); ctx.translate(L.ox, L.oy); ctx.scale(L.s, L.s); fn(ctx); ctx.restore(); };
const ramp = (x, a, b) => Math.max(0, Math.min(1, (x - a) / (b - a)));
const bg = (glow = [600, 380, 650, 'rgba(70,58,55,0.5)']) => ({ depth: 0.04, paint: (ctx, L) => paper(ctx, L.w, L.h, { glowAt: [L.X(glow[0]), L.Y(glow[1]), glow[2] * L.s, glow[3]] }) });
const band = (ctx, L, y, h, a = 0.1) => { const g = ctx.createLinearGradient(0, L.Y(y - h), 0, L.Y(y + h)); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, `rgba(160,152,145,${a})`); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(-80, L.Y(y - h), L.w + 160, L.Y(y + h) - L.Y(y - h)); };
const ground = (c, y, a = 0.1, seed = 1) => { const g = c.createLinearGradient(0, y - 30, 0, y + 120); g.addColorStop(0, 'rgba(195,191,185,0)'); g.addColorStop(0.25, `rgba(195,191,185,${a})`); g.addColorStop(1, `rgba(195,191,185,${a * 0.4})`); c.fillStyle = g; c.fillRect(-400, y - 30, 1800, 200); brush(c, [[-300, y], [300, y - 3], [700, y + 2], [1300, y - 1]], { w: 1.6, alpha: 0.35, dry: 0.8, profile: 'even', seed, n: 50 }); };
// niebla que se desplaza (barata: dos degradados)
const mist = (ctx, L, y, a, time, speed = 12) => { for (let k = 0; k < 2; k++) { const x = ((time * speed * (k ? 0.7 : 1) + k * 600) % (L.w + 800)) - 400; const g = ctx.createRadialGradient(x, L.Y(y), 0, x, L.Y(y), 380 * L.s); g.addColorStop(0, `rgba(170,162,155,${a})`); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(x - 400 * L.s, L.Y(y) - 200 * L.s, 800 * L.s, 400 * L.s); } };

export function defineViews(stage, { onBestia }) {
  // ================= Capítulo I =================
  stage.define('bosque', {
    layers: [
      bg([640, 320, 720, 'rgba(84,74,70,0.55)']),
      { depth: 0.12, paint: (ctx, L) => { const R = rng(2); for (let i = 0; i < 44; i++) bamboo(ctx, -60 + R() * (L.w + 120), -40, L.h + 40, 4 + R() * 3, { alpha: 0.07, seed: i + 1, leaves: R() < 0.5 }); band(ctx, L, 520, 170, 0.15); } },
      { depth: 0.3, paint: (ctx, L) => { const R = rng(3); for (let i = 0; i < 12; i++) bamboo(ctx, L.ax - 100 + R() * (L.w - L.ax + 180), -60, L.h + 60, 8 + R() * 5, { alpha: 0.2, seed: 40 + i, leaves: R() < 0.7 });
        art(ctx, L, (c) => { ground(c, 660, 0.09, 5); const p = [[250, 760], [420, 690], [560, 668], [760, 640], [1100, 628]]; brush(c, p, { w: 40, color: 'rgba(195,191,185,0.08)', profile: 'start', dry: 0.7, seed: 6, n: 40 }); figure(c, 470, 676, 104, { pose: 'walk', rim: C.boneA(0.45) }); }); } },
      { depth: 0.75, paint: (ctx, L) => { const R = rng(4); for (const x of [L.ax - 40, L.ax + 70, L.w - 100, L.w - 20]) bamboo(ctx, x + (R() - 0.5) * 40, -80, L.h + 80, 20 + R() * 8, { color: '#060505', alpha: 0.95, seed: x | 0, leaves: true }); } },
    ],
    dyn(ctx, L, st) {
      mist(ctx, L, 560, 0.07, st.time);
      art(ctx, L, (c) => { const a = 0.55 + 0.45 * Math.sin(st.time * 2.2); const g = c.createRadialGradient(800, 600, 0, 800, 600, 34); g.addColorStop(0, C.glowA(0.55 * a)); g.addColorStop(1, C.glowA(0)); c.fillStyle = g; c.beginPath(); c.arc(800, 600, 34, 0, 7); c.fill(); brush(c, [[800, 640], [801, 612]], { w: 1.6, color: '#3a3533', profile: 'even', dry: 0, seed: 2, n: 6 }); c.globalAlpha = 0.75 + 0.25 * a; stamp(c, lilySprite(0.25), 800, 606, 1); c.globalAlpha = 1; if (st.key === 'bosque' && st.tp > 0.25) callout(c, [800, 596], [880, 510], 'Algo rojo, entre los bambúes', { size: 12 }); });
    },
  });

  stage.define('flor', {
    layers: [
      bg([560, 430, 600, 'rgba(96,74,70,0.55)']),
      { depth: 0.12, paint: (ctx, L) => { const R = rng(7); for (let i = 0; i < 28; i++) bamboo(ctx, -60 + R() * (L.w + 120), -40, L.h + 40, 5 + R() * 3, { alpha: 0.08, seed: 70 + i }); band(ctx, L, 600, 180, 0.14); } },
      { depth: 0.35, paint: (ctx, L) => art(ctx, L, (c) => { const R = rng(9); ground(c, 640, 0.1, 9); for (let i = 0; i < 170; i++) { const x = 100 + R() * 860, y = 620 + R() * 100; brush(c, [[x, y], [x + (R() - 0.5) * 12, y - 12 - R() * 26]], { w: 1.5, alpha: 0.22 + R() * 0.3, profile: 'start', dry: 0.4, seed: i, n: 6 }); }
        figure(c, 300, 700, 190, { pose: 'kneel', rim: C.boneA(0.5) });
        const h = figurePoint(300, 700, 190, { pose: 'kneel' }, 'hand');
        brush(c, [h, [h[0] + 60, h[1] - 20], [h[0] + 150, h[1] - 50]], { w: 9, color: C.ink(0.95), profile: 'start', dry: 0, seed: 3, n: 14 });
        brush(c, [h, [h[0] + 60, h[1] - 20], [h[0] + 150, h[1] - 50]], { w: 1.2, color: C.boneA(0.4), profile: 'even', dry: 0.5, seed: 4, n: 14 }); }) },
      { depth: 0.45, paint: (ctx, L) => art(ctx, L, (c) => lily(c, 580, 470, 2.1, { stem: 110 })) },
    ],
    // línea de tiempo lenta: primero la ficha botánica (imagen explicativa), luego el roce y la flor que desaparece
    // paso 1: la ficha botánica se arma etiqueta por etiqueta · paso 2: el roce, el pinchazo y la flor que desaparece
    update(v, st) { const u = st.key === 'flor' && st.si === 1 ? st.ts : 0; v.layers[3].c.style.opacity = (1 - ramp(u, 0.72, 0.98)).toFixed(3); },
    dyn(ctx, L, st) {
      const fl = st.key === 'flor', si = fl ? st.si : 0, e = fl ? st.ts : 0;
      const t = si === 0 ? e * 0.44 : 0.5 + e * 0.5; // misma escala de antes: 0–0,44 ficha · 0,5–1 roce
      art(ctx, L, (c) => {
        const an = si === 0 ? ramp(e, 0, 0.12) : 1 - ramp(e, 0, 0.12);
        if (an > 0) {
          c.save(); c.globalAlpha = an;
          const vg = c.createRadialGradient(580, 430, 150, 580, 430, 560); vg.addColorStop(0, 'rgba(8,6,6,0)'); vg.addColorStop(0.25, 'rgba(8,6,6,0.6)'); vg.addColorStop(1, 'rgba(8,6,6,0.8)'); c.fillStyle = vg; c.fillRect(-200, -100, 1400, 920);
          c.fillStyle = '#efe9e1'; c.font = '700 22px "Shippori Mincho B1", serif'; c.textAlign = 'left'; c.fillText('彼岸花  Higanbana', 700, 86);
          c.fillStyle = C.boneA(0.75); c.font = 'italic 14px "Zen Old Mincho", serif'; c.fillText('Lycoris radiata · lirio de araña', 700, 110);
          c.font = '500 9.5px "IBM Plex Sans", sans-serif'; c.fillText('FICHA BOTÁNICA', 700, 62); drawIcon(c, 'higanbana', 680, 92, 24);
          const parts = [
            [[560, 452], [770, 404], 'Tépalos', 'seis por flor, enroscados hacia atrás'],
            [[668, 352], [790, 300], 'Estambres', 'largos y curvos, como patas de araña'],
            [[582, 478], [380, 420], 'Umbela', 'cinco a siete flores en un mismo tallo', 'right'],
            [[584, 610], [720, 600], 'Tallo sin hojas', '30 a 70 cm · las hojas salen tras la flor'],
            [[436, 380], [300, 300], 'Florece en el equinoccio', 'de otoño, junto a los caminos y tumbas', 'right'],
          ];
          parts.forEach(([a, b, tt, sub, al], i) => { const k = si === 0 ? ramp(e, 0.08 + i * 0.13, 0.2 + i * 0.13) : 1; if (k <= 0) return; c.globalAlpha = an * k; callout(c, a, b, tt, { size: 17, sub, align: al || 'left', color: '#f1ebe2' }); });
          // escala: la flor mide un palmo
          c.globalAlpha = an * (si === 0 ? ramp(e, 0.75, 0.9) : 1); c.strokeStyle = C.boneA(0.55); c.lineWidth = 1; c.beginPath(); c.moveTo(880, 330); c.lineTo(880, 700); c.moveTo(874, 330); c.lineTo(886, 330); c.moveTo(874, 700); c.lineTo(886, 700); c.stroke();
          c.fillStyle = C.boneA(0.8); c.font = '13px "IBM Plex Sans", sans-serif'; c.textAlign = 'left'; c.fillText('≈ 50 cm', 890, 520);
          c.restore();
        }
        if (t < 0.5) return;
        for (let k = 0; k < 4; k++) { const f = (st.time * 0.5 + k / 4) % 1; const r = 20 + f * 280 * ramp(t, 0.5, 0.66); c.strokeStyle = C.glowA(0.5 * (1 - f)); c.lineWidth = 2; c.beginPath(); c.ellipse(580, 490, r, r * 0.45, 0, 0, 7); c.stroke(); }
        const g = c.createRadialGradient(580, 470, 0, 580, 470, 170); g.addColorStop(0, C.glowA(0.35 * ramp(t, 0.52, 0.66) * (1 - ramp(t, 0.9, 1)))); g.addColorStop(1, C.glowA(0)); c.fillStyle = g; c.fillRect(400, 290, 360, 360);
        if (t > 0.58) callout(c, [520, 452], [380, 330], 'Un pinchazo helado en la garganta', { align: 'right', size: 16, color: '#f1ebe2' });
      });
    },
  });

  let reflection = null;
  const RV = { x: 560, y: 250, h: 160 };
  stage.define('rio', {
    layers: [
      bg([600, 240, 700, 'rgba(110,100,94,0.55)']),
      { depth: 0.2, paint: (ctx, L) => { art(ctx, L, (c) => { mountains(c, { x0: -300, x1: 1300, base: 170, amp: 50, color: 'rgba(195,191,185,0.1)', fade: 60, seed: 61, rim: 0.3 }); }); const y = L.Y(252); const g = ctx.createLinearGradient(0, y, 0, L.h); g.addColorStop(0, '#0c0b0b'); g.addColorStop(1, '#040303'); ctx.fillStyle = g; ctx.fillRect(-80, y, L.w + 160, L.h); const R = rng(12); for (let i = 0; i < 150; i++) { const x = R() * L.w, yy = y + 10 + Math.pow(R(), 1.6) * (L.h - y); line(ctx, [[x, yy], [x + 10 + R() * 40, yy]], { w: 0.8, alpha: 0.1 + R() * 0.15 }); } } },
      { depth: 0.4, paint: (ctx, L) => art(ctx, L, (c) => { wash(c, 560, 248, 520, 36, 'rgba(195,191,185,0.12)', { seed: 13 }); brush(c, [[-100, 252], [300, 246], [700, 254], [1100, 248]], { w: 3, alpha: 0.55, dry: 0.7, profile: 'even', seed: 14, n: 40 }); for (let i = 0; i < 12; i++) { const x = 200 + i * 60; brush(c, [[x, 250], [x + 3, 230 - (i % 3) * 8]], { w: 2, alpha: 0.4, profile: 'start', dry: 0.4, seed: i, n: 5 }); } figure(c, RV.x, RV.y, RV.h, { dir: -1, pose: 'kneel', mark: true, rim: C.boneA(0.45) }); }) },
    ],
    prepare(v) { const L = v.L; reflection = canvas(140 * L.s, RV.h * 0.75 * L.s); const c = reflection.ctx; c.scale(L.s, L.s); c.translate(70, 0); c.scale(1, -1); figure(c, 0, 0, RV.h, { dir: -1, pose: 'kneel', color: 'rgba(130,122,116,0.55)', rim: null }); },
    dyn(ctx, L, st) {
      if (!reflection) return;
      const t = st.key === 'rio' ? st.tp : 1, x0 = L.X(RV.x) - 70 * L.s, y0 = L.Y(RV.y + 4);
      const H = reflection.h, Wd = reflection.w, k = reflection.width / Wd;
      for (let y = 0; y < H; y += 3) { const off = Math.sin(y * 0.07 + st.time * 2.4) * (1.5 + y * 0.03); ctx.globalAlpha = 1 - y / H * 0.6; ctx.drawImage(reflection, 0, y * k, reflection.width, 3 * k, x0 + off, y0 + y, Wd, 3); }
      ctx.globalAlpha = 1;
      art(ctx, L, (c) => {
        const m = figurePoint(RV.x, RV.y, RV.h, { dir: -1, pose: 'kneel' }, 'mark');
        const mx = m[0] + Math.sin(st.time * 2) * 2, my = RV.y + (RV.y - m[1]) + 6;
        const a = ramp(t, 0.05, 0.4);
        const g = c.createRadialGradient(mx, my, 0, mx, my, 46); g.addColorStop(0, C.glowA(0.85 * a)); g.addColorStop(0.3, C.red(0.5 * a)); g.addColorStop(1, C.red(0)); c.fillStyle = g; c.beginPath(); c.arc(mx, my, 46, 0, 7); c.fill();
        if (a > 0.15) stamp(c, lilySprite(0.4), mx, my - 6, 1, Math.PI, 0.5, 0.55);
        for (let q = 0; q < 4; q++) { const f = (st.time * 0.3 + q / 4) % 1; c.strokeStyle = C.boneA(0.28 * (1 - f)); c.lineWidth = 1; c.beginPath(); c.ellipse(RV.x, 320, 30 + f * 240, (30 + f * 240) * 0.22, 0, 0, 7); c.stroke(); }
        // lupa: la marca ampliada (imagen explicativa)
        const z = ramp(t, 0.45, 0.7);
        if (z > 0) {
          const nk = figurePoint(RV.x, RV.y, RV.h, { dir: -1, pose: 'kneel' }, 'mark'), lx = 830, ly = 470, lr = 88 * (0.6 + 0.4 * z);
          c.save(); c.globalAlpha = z;
          c.strokeStyle = C.boneA(0.45); c.lineWidth = 1; c.setLineDash([3, 4]); c.beginPath(); c.moveTo(nk[0], nk[1] - 5); c.lineTo(lx - lr * 0.5, ly - lr * 0.87); c.moveTo(nk[0], nk[1] + 5); c.lineTo(lx - lr * 0.95, ly + lr * 0.3); c.stroke(); c.setLineDash([]);
          c.strokeStyle = C.glowA(0.9); c.lineWidth = 1.4; c.beginPath(); c.arc(nk[0], nk[1], 9, 0, 7); c.stroke();
          const lg = c.createRadialGradient(lx, ly, 0, lx, ly, lr); lg.addColorStop(0, '#2a1514'); lg.addColorStop(1, '#0b0808'); c.fillStyle = lg; c.beginPath(); c.arc(lx, ly, lr, 0, 7); c.fill();
          const gg = c.createRadialGradient(lx, ly, 0, lx, ly, lr * 0.9); gg.addColorStop(0, C.glowA(0.35 + 0.15 * Math.sin(st.time * 2.4))); gg.addColorStop(1, C.glowA(0)); c.fillStyle = gg; c.beginPath(); c.arc(lx, ly, lr, 0, 7); c.fill();
          stamp(c, lilySprite(0.4), lx, ly - 4, 1.6 * (0.6 + 0.4 * z));
          c.strokeStyle = C.boneA(0.7); c.lineWidth = 2; c.beginPath(); c.arc(lx, ly, lr, 0, 7); c.stroke(); c.strokeStyle = C.boneA(0.2); c.lineWidth = 1; c.beginPath(); c.arc(lx, ly, lr + 6, 0, 7); c.stroke();
          c.fillStyle = C.boneA(0.6); c.font = '500 9.5px "IBM Plex Sans", sans-serif'; c.textAlign = 'center'; c.fillText('AMPLIACIÓN × 6', lx, ly + lr + 22);
          c.restore();
          if (z > 0.8) { callout(c, [lx + lr * 0.6, ly - lr * 0.75], [900, 330], 'La marca del higanbana', { size: 13, sub: 'roja, fresca y detallada', align: 'right' }); callout(c, [nk[0] - 6, nk[1]], [380, 160], 'Lado derecho del cuello', { size: 12, sub: 'arde como un hierro al rojo', align: 'right' }); }
        }
      });
    },
  });

  const RN = { kx: 430, rx: 650, y: 660 };
  stage.define('ronin', {
    layers: [
      bg([560, 470, 780, 'rgba(120,108,100,0.6)']),
      { depth: 0.15, paint: (ctx, L) => art(ctx, L, (c) => { mountains(c, { x0: -300, x1: 1300, base: 270, amp: 90, color: 'rgba(195,191,185,0.12)', fade: 80, seed: 71, rim: 0.35 }); const R = rng(72); for (let i = 0; i < 9; i++) house(c, -120 + i * 150 + R() * 30, 480 + R() * 20, 110 + R() * 30, { color: C.boneA(0.32), fill: 'rgba(16,12,12,0.92)' }); band(ctx, L, 480, 60, 0.12); }) },
      { depth: 0.35, paint: (ctx, L) => art(ctx, L, (c) => {
        ground(c, RN.y, 0.11, 74);
        figure(c, RN.kx, RN.y, 170, { pose: 'stand', rim: C.boneA(0.5) });
        const m = figurePoint(RN.kx, RN.y, 170, {}, 'mark'); c.fillStyle = C.boneA(0.85); c.fillRect(m[0] - 9, m[1] - 3, 15, 7);
        figure(c, RN.rx, RN.y, 215, { who: 'ronin', dir: -1, rim: C.boneA(0.5) });
        callout(c, [m[0] - 2, m[1]], [270, 440], 'La marca, vendada', { align: 'right', size: 13 });
        callout(c, [RN.rx - 10, RN.y - 215 * 0.8], [820, 380], 'El ronin ciego', { size: 13, sub: 'la huele sin verla' });
      }) },
    ],
    dyn(ctx, L, st) {
      const t = st.key === 'ronin' ? st.tp : st.key === 'ronin2' ? 1 : 0;
      const f = ramp(t, 0.15, 0.5);
      art(ctx, L, (c) => {
        const s = 215 / 200, hx = RN.rx - 40 * s, hy = RN.y + (104 - 200) * s;
        const x = hx - f * 6, y = hy + f * f * (RN.y - hy - 4);
        if (f < 1) { c.save(); c.translate(x, y); c.rotate(f * 3.2); c.fillStyle = '#9a948e'; c.beginPath(); c.moveTo(-12, -5); c.lineTo(12, -5); c.lineTo(8, 6); c.lineTo(-8, 6); c.closePath(); c.fill(); c.restore(); if (f > 0.05) { c.strokeStyle = C.boneA(0.5); c.beginPath(); c.moveTo(x - 4, y + 6); c.lineTo(x - 7, y + 16); c.stroke(); } }
        else { const R = rng(5); c.fillStyle = '#8a8580'; for (let k = 0; k < 7; k++) { const a = R() * Math.PI, d = 10 + R() * 28; c.beginPath(); c.moveTo(hx + Math.cos(a) * d, RN.y - 2 - Math.sin(a) * 2); c.lineTo(hx + 6 + Math.cos(a) * d, RN.y - 4); c.lineTo(hx + 3 + Math.cos(a) * d, RN.y + 1); c.fill(); } wash(c, hx, RN.y, 54, 6, 'rgba(160,165,170,0.25)', { seed: 6, blobs: 3 }); }
      });
    },
  });

  stage.define('almacen', {
    layers: [{ depth: 0, paint: (ctx, L) => { ctx.fillStyle = '#000'; ctx.fillRect(-80, -80, L.w + 160, L.h + 160); } }],
    dynDepth: 0.1,
    dyn(ctx, L, st) {
      const t = st.key === 'almacen' ? st.tp : 0, time = st.time, W = L.w, H = L.h;
      const fl = 0.75 + 0.25 * Math.sin(time * 9) * Math.sin(time * 5.3);
      const g = ctx.createRadialGradient(W * 0.72, H * 0.62, 0, W * 0.72, H * 0.62, W * 0.62); g.addColorStop(0, `rgba(220,46,30,${0.9 * fl})`); g.addColorStop(0.5, `rgba(120,15,15,${0.6 * fl})`); g.addColorStop(1, 'rgba(18,4,4,1)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      art(ctx, L, (c) => {
        // la pared del fondo y la sangre
        const sp = ramp(t, 0.5, 0.62);
        if (sp > 0) { c.save(); c.globalAlpha = sp; const R = rng(9); c.fillStyle = '#8e0d16'; for (let k = 0; k < 30; k++) { const a = R() * 6.28, d = R() * 130 * sp; c.beginPath(); c.ellipse(840 + Math.cos(a) * d * 1.4, 300 + Math.sin(a) * d * 0.6, 3 + R() * 12, 2 + R() * 7, a, 0, 7); c.fill(); } c.restore(); }
        const raise = ramp(t, 0.1, 0.35), hit = ramp(t, 0.35, 0.45);
        c.save(); c.translate(640, 400); c.rotate(-0.3 - raise * 1.7 + hit * 2.5); c.fillStyle = 'rgba(8,6,6,0.98)'; c.fillRect(-12, -210, 26, 220); c.beginPath(); c.arc(1, -210, 22, 0, 7); c.fill(); c.restore();
        figure(c, 540, 780, 480, { who: 'oni', color: 'rgba(8,6,6,0.98)', rim: null });
        const bg2 = c.createRadialGradient(440, 470, 0, 440, 470, 46); bg2.addColorStop(0, 'rgba(190,215,255,1)'); bg2.addColorStop(0.3, C.oni(0.85)); bg2.addColorStop(1, C.oni(0)); c.fillStyle = bg2; c.beginPath(); c.arc(440, 470, 46, 0, 7); c.fill();
        const fall = ramp(t, 0.42, 0.6);
        c.save(); c.translate(790, 770); c.rotate(fall * 1.35); figure(c, 0, 0, 280, { who: 'father', dir: -1, color: 'rgba(10,8,8,0.96)', rim: null }); c.restore();
      });
      // las tablas del almacén, con rendijas
      const pw = Math.max(110, W / 7), gap = pw * (0.2 + ramp(t, 0, 0.25) * 0.08);
      ctx.fillStyle = 'rgba(5,4,4,0.97)';
      for (let x = -pw / 2; x < W + pw; x += pw) ctx.fillRect(x, 0, pw - gap, H);
      ctx.strokeStyle = 'rgba(195,191,185,0.05)'; ctx.lineWidth = 1;
      for (let x = -pw / 2; x < W + pw; x += pw) for (let k = 1; k < 5; k++) { ctx.beginPath(); ctx.moveTo(x + k * pw / 5, 0); ctx.bezierCurveTo(x + k * pw / 5 + 6, H * 0.3, x + k * pw / 5 - 6, H * 0.6, x + k * pw / 5 + 3, H); ctx.stroke(); }
      const sh = ctx.createLinearGradient(0, 0, W, 0); sh.addColorStop(0, 'rgba(0,0,0,0.9)'); sh.addColorStop(0.42, 'rgba(0,0,0,0.25)'); sh.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = sh; ctx.fillRect(0, 0, W, H);
    },
  });

  // ================= Capítulo II =================
  const DK = { x: 470, y: 770, h: 560 };
  const dpose = { pose: 'kneel' };
  const veins = (() => {
    const m = figurePoint(DK.x, DK.y, DK.h, dpose, 'mark'), hd = figurePoint(DK.x, DK.y, DK.h, dpose, 'hand');
    const R = rng(21), out = [];
    const grow = (x, y, tx, ty, d, t0, n) => { const pts = [[x, y]]; let cx = x, cy = y; for (let i = 1; i <= n; i++) { const f = i / n; cx = x + (tx - x) * f + Math.sin(f * 9 + d) * 14 * (1 - f) + (R() - 0.5) * 8; cy = y + (ty - y) * f + (R() - 0.5) * 8; pts.push([cx, cy]); if (d < 2 && R() < 0.12) grow(cx, cy, cx + (R() - 0.3) * 120, cy + 40 + R() * 80, d + 1, t0 + f * 0.5, 10); } out.push({ pts, t0, d }); };
    grow(m[0], m[1], hd[0], hd[1], 0, 0, 40); grow(m[0], m[1], hd[0] - 30, hd[1] + 10, 1, 0.08, 34);
    return { out, m, hd };
  })();
  stage.define('despertar', {
    layers: [
      bg([560, 420, 640, 'rgba(80,40,40,0.55)']),
      { depth: 0.3, paint: (ctx, L) => art(ctx, L, (c) => { ground(c, DK.y - 4, 0.08, 30); figure(c, DK.x, DK.y, DK.h, { pose: 'kneel', lean: -0.08, rim: C.boneA(0.4) }); callout(c, [veins.m[0] + 6, veins.m[1] - 6], [760, 150], 'La marca despierta', { size: 13, sub: 'el fuego baja por el brazo derecho' }); }) },
    ],
    dyn(ctx, L, st) {
      const t = st.key === 'despertar' ? st.tp : 1, time = st.time;
      art(ctx, L, (c) => {
        c.save(); c.translate(DK.x, DK.y); c.rotate(-0.08); c.translate(-DK.x, -DK.y);
        const { m, hd } = veins;
        const mk = c.createRadialGradient(m[0], m[1], 0, m[0], m[1], 90); mk.addColorStop(0, C.glowA(0.95)); mk.addColorStop(0.25, C.red(0.55)); mk.addColorStop(1, C.red(0)); c.fillStyle = mk; c.beginPath(); c.arc(m[0], m[1], 90 * (0.85 + 0.15 * Math.sin(time * 6)), 0, 7); c.fill();
        stamp(c, lilySprite(0.4), m[0], m[1] - 4, 0.9);
        for (const v of veins.out) { const p = ramp(t, v.t0 * 0.6, v.t0 * 0.6 + 0.55); if (p <= 0) continue; line(c, v.pts, { w: 12 - v.d * 3, color: C.glowA(0.22), upTo: p }); line(c, v.pts, { w: 4 - v.d, color: '#ff4040', upTo: p }); }
        const cut = ramp(t, 0.72, 0.95);
        if (cut > 0) { const g = c.createRadialGradient(hd[0] - 20, hd[1] - 10, 0, hd[0] - 20, hd[1] - 10, 150); g.addColorStop(0, C.glowA(0.6 * cut)); g.addColorStop(1, C.glowA(0)); c.fillStyle = g; c.fillRect(hd[0] - 180, hd[1] - 160, 320, 300); line(c, spline([[hd[0] - 110, hd[1] - 60], [hd[0] - 60, hd[1] - 30], [hd[0], hd[1] - 4]], 20), { w: 4, color: '#ff6060', upTo: cut }); }
        c.restore();
      });
    },
  });

  // latido: poder de Kenji, de 22:30 a 23:00
  const powerAt = (m) => (m < 30 ? 0 : m < 32 ? 15 + ((m - 30) / 2) * 85 : m < 45 ? 100 : 100 - ((m - 45) / 15) * 80);
  const beat = (m) => { const ph = (m % 1.1) / 1.1; return Math.exp(-Math.pow((ph - 0.2) / 0.025, 2)) - Math.exp(-Math.pow((ph - 0.27) / 0.03, 2)) * 0.35 + Math.exp(-Math.pow((ph - 0.55) / 0.08, 2)) * 0.15; };
  const PX = (m) => 150 + ((m - 30) / 30) * 780, PY = (v) => 440 - v * 2.6;
  const ecg = []; for (let m = 30; m <= 60; m += 0.03) ecg.push([PX(m), PY(powerAt(m) * (0.25 + 0.75 * beat(m)))]);
  stage.define('latido', {
    layers: [
      bg([560, 380, 660, 'rgba(76,52,52,0.5)']),
      { depth: 0.2, paint: (ctx, L) => art(ctx, L, (c) => {
        chartCard(c, 110, 90, 860, 420, 'El poder de Kenji', 'Gráfico de líneas · intensidad de 0 a 100 · 22:30 a 23:00');
        line(c, [[PX(30), PY(0)], [PX(60), PY(0)]], { alpha: 0.35 }); line(c, [[PX(30), PY(100)], [PX(60), PY(100)]], { alpha: 0.14, dash: [2, 5] }); line(c, [[PX(30), PY(50)], [PX(60), PY(50)]], { alpha: 0.08, dash: [2, 5] });
        for (const [m, tx] of [[30, '22:30'], [37.5, '22:37'], [45, '22:45'], [52.5, '22:52'], [60, '23:00']]) axisLabel(c, tx, PX(m), PY(0) + 20);
        axisLabel(c, '100', PX(30) - 10, PY(100) + 3, 'right'); axisLabel(c, '50', PX(30) - 10, PY(50) + 3, 'right'); axisLabel(c, '0', PX(30) - 10, PY(0) + 3, 'right');
      }) },
      { depth: 0.4, paint: (ctx, L) => art(ctx, L, (c) => { ground(c, 712, 0.08, 40); figure(c, 500, 720, 220, { pose: 'walk', mark: true, rim: C.boneA(0.4) }); }) },
    ],
    dyn(ctx, L, st) {
      const t = st.key === 'latido' ? st.tp : 1;
      art(ctx, L, (c) => {
        const hand = figurePoint(500, 720, 220, { pose: 'walk' }, 'hand');
        weaponAt(c, hand[0], hand[1], 0.42, -0.5 + Math.sin(st.time * 2) * 0.05);
        line(c, ecg, { w: 8, color: C.glowA(0.16), upTo: t }); line(c, ecg, { w: 2.4, color: '#e0303a', upTo: t });
        const m = 30 + t * 30, v = powerAt(m), p = ecg[Math.min(ecg.length - 1, Math.floor(t * (ecg.length - 1)))];
        c.fillStyle = '#ff6a6a'; c.beginPath(); c.arc(p[0], p[1], 5, 0, 7); c.fill();
        c.fillStyle = '#f1ebe2'; c.font = '700 22px "Shippori Mincho B1", serif'; c.textAlign = 'left'; c.fillText(`${Math.round(v)}`, p[0] + 10, p[1] - 10);
        if (t > 0.08) callout(c, [PX(32), PY(100)], [PX(32) + 70, 170], '22:32 · nace el arma', { size: 12 });
        if (t > 0.97) callout(c, [PX(60) - 4, PY(20)], [PX(60) - 90, 320], '23:00 · se desmaya', { align: 'right', size: 12 });
      });
    },
  });

  // ensō de las bestias (la dona): un círculo zen partido en cuatro arcos
  const total = CRIATURAS.reduce((s, c) => s + c.count, 0);
  const arcs = []; { let a0 = -Math.PI / 2; for (const c of CRIATURAS) { const span = (c.count / total) * Math.PI * 2; arcs.push({ c, a0: a0 + 0.05, a1: a0 + span - 0.05 }); a0 += span; } }
  const EC = [560, 360], ER = 220;
  const arcPts = (a0, a1, r = ER) => { const pts = []; for (let k = 0; k <= 30; k++) { const a = a0 + (a1 - a0) * (k / 30); pts.push([EC[0] + Math.cos(a) * r, EC[1] + Math.sin(a) * r]); } return pts; };
  let hi = null;
  stage.define('enso', {
    layers: [
      bg([560, 360, 620, 'rgba(76,64,62,0.55)']),
      { depth: 0.25, paint: (ctx, L) => art(ctx, L, (c) => {
        arcs.forEach((A, i) => brush(c, arcPts(A.a0, A.a1), { w: 34 - i * 4, alpha: 0.88, dry: 0.6, profile: i === 0 ? 'start' : 'taper', seed: 80 + i, n: 60 }));
        ground(c, EC[1] + 120, 0.05, 84);
        figure(c, EC[0], EC[1] + 120, 190, { mark: true, rim: C.boneA(0.4) });
        weaponAt(c, ...figurePoint(EC[0], EC[1] + 120, 190, {}, 'hand'), 0.36, -0.4);
        arcs.forEach((A) => { for (let k = 0; k < A.c.count; k++) { const a = A.a0 + (A.a1 - A.a0) * ((k + 0.5) / A.c.count); creature(c, A.c.id, EC[0] + Math.cos(a) * (ER + 52), EC[1] + Math.sin(a) * (ER + 52), A.c.id === 'dragon' ? 1.05 : 1.55); } });
        c.fillStyle = '#f1ebe2'; c.font = '700 22px "Shippori Mincho B1", serif'; c.textAlign = 'center'; c.fillText('30 criaturas', EC[0], EC[1] - 112); axisLabel(c, 'ATACARON EL VALLE · TOCA UN NOMBRE', EC[0], EC[1] - 92);
        c.textAlign = 'left'; c.fillStyle = '#efe9e1'; c.font = '600 17px "Shippori Mincho B1", serif'; c.fillText('Las bestias de la noche', 30, 44);
        c.fillStyle = C.boneA(0.55); c.font = '500 9.5px "IBM Plex Sans", sans-serif'; c.fillText('GRÁFICO DE DONA (ENSŌ) · PROPORCIÓN POR TIPO', 30, 62);
      }) },
    ],
    mount(el, L) {
      arcs.forEach((A) => {
        const mid = (A.a0 + A.a1) / 2, r = ER + 118;
        const b = document.createElement('button'); b.className = 'tag-btn';
        b.innerHTML = `<span lang="ja">${A.c.kanji}</span>${A.c.name}<small>${A.c.count} · ${(A.c.count / total * 100).toFixed(1).replace('.', ',')} %</small>`;
        b.style.left = L.X(EC[0] + Math.cos(mid) * r) + 'px'; b.style.top = L.Y(EC[1] + Math.sin(mid) * r) + 'px';
        b.addEventListener('click', () => onBestia(A.c.id, (id) => (hi = id)));
        el.appendChild(b);
      });
    },
    dyn(ctx, L, st) {
      if (!hi) return; const A = arcs.find((a) => a.c.id === hi); if (!A) return;
      const spr = cached('enso-hi-' + hi, 1000, 720, (g) => brush(g, arcPts(A.a0, A.a1), { w: 22, color: '#c8141e', alpha: 0.95, dry: 0.3, profile: 'taper', seed: 99, n: 50 }), 1);
      art(ctx, L, (c) => { c.globalAlpha = 0.75 + 0.25 * Math.sin(st.time * 4); c.drawImage(spr, 0, 0, 1000, 720); c.globalAlpha = 1; });
    },
    leave() { hi = null; },
  });

  stage.define('ruinas', {
    layers: [
      bg([640, 250, 720, 'rgba(126,114,106,0.5)']),
      { depth: 0.15, paint: (ctx, L) => art(ctx, L, (c) => { mountains(c, { x0: -300, x1: 1300, base: 300, amp: 80, color: 'rgba(195,191,185,0.13)', fade: 100, seed: 91, rim: 0.3 }); band(ctx, L, 380, 90, 0.18); }) },
      { depth: 0.3, paint: (ctx, L) => art(ctx, L, (c) => {
        const R = rng(92);
        for (let i = 0; i < 6; i++) {
          const x = 90 + i * 170 + R() * 40, y = 540 + R() * 20, w = 110 + R() * 50, h = 90 + R() * 40;
          const post = (x0, h0, lean) => { brush(c, [[x0, y], [x0 + lean, y - h0]], { w: 9, color: '#0b0909', profile: 'even', dry: 0.15, seed: x0 | 0, n: 8 }); brush(c, [[x0 + 3, y], [x0 + lean + 3, y - h0]], { w: 1.2, color: C.boneA(0.3), profile: 'even', dry: 0.6, seed: (x0 | 0) + 1, n: 8 }); };
          post(x - w / 2, h * (0.6 + R() * 0.4), -4); post(x + w / 2, h * (0.4 + R() * 0.5), 6); if (R() < 0.6) post(x, h * 0.9, 2);
          brush(c, [[x - w / 2 - 10, y - h * 0.7], [x + w * 0.2, y - h * 0.95 + R() * 30], [x + w / 2 + 20, y - h * 0.3]], { w: 7, color: '#0b0909', profile: 'taper', dry: 0.2, seed: i + 7, n: 12 });
          c.fillStyle = 'rgba(8,6,6,0.9)'; c.beginPath(); c.ellipse(x, y, w * 0.6, 9, 0, 0, 7); c.fill();
          for (let k = 0; k < 5; k++) { c.fillStyle = C.glowA(0.6 + R() * 0.4); c.beginPath(); c.arc(x - w / 2 + R() * w, y - 2 - R() * 6, 1.4 + R() * 1.4, 0, 7); c.fill(); }
        }
        ground(c, 690, 0.08, 93);
        figure(c, 400, 700, 170, { pose: 'kneel', mark: true, rim: C.boneA(0.45) });
        weaponAt(c, 650, 700, 0.5, 2.7);
        line(c, spline([figurePoint(400, 700, 170, { pose: 'kneel' }, 'hand'), [520, 700], [620, 690]], 20), { w: 2.4, color: '#c0141c', alpha: 0.85, dash: [5, 4] });
        callout(c, [640, 640], [800, 470], 'La kusarigama, clavada en el barro', { size: 13, sub: 'unida a la herida de su brazo' });
      }) },
    ],
    dyn(ctx, L, st) { art(ctx, L, (c) => { for (let k = 0; k < 6; k++) { const x = 100 + k * 170, base = 470; c.strokeStyle = C.boneA(0.1); c.lineWidth = 7; c.beginPath(); for (let i = 0; i < 28; i++) { const y = base - i * 10, xx = x + Math.sin(i * 0.25 - st.time * 0.8 + k) * (i * 0.7); i ? c.lineTo(xx, y) : c.moveTo(xx, y); } c.stroke(); } }); },
  });

  stage.define('camino', {
    layers: [
      bg([620, 240, 720, 'rgba(126,114,106,0.5)']),
      { depth: 0.1, paint: (ctx, L) => art(ctx, L, (c) => { mountains(c, { x0: -300, x1: 1300, base: 260, amp: 120, color: 'rgba(195,191,185,0.1)', fade: 80, seed: 101, rim: 0.25 }); }) },
      { depth: 0.25, paint: (ctx, L) => art(ctx, L, (c) => { mountains(c, { x0: -300, x1: 1300, base: 390, amp: 110, color: 'rgba(195,191,185,0.16)', fade: 120, seed: 102, rim: 0.4 }); band(ctx, L, 430, 80, 0.2); }) },
      { depth: 0.5, paint: (ctx, L) => art(ctx, L, (c) => {
        const rd = new Path2D(); rd.moveTo(160, 760); rd.bezierCurveTo(420, 650, 560, 560, 640, 440); rd.lineTo(662, 440); rd.bezierCurveTo(630, 560, 610, 660, 540, 760); rd.closePath();
        const rg = c.createLinearGradient(0, 760, 0, 440); rg.addColorStop(0, 'rgba(195,191,185,0.24)'); rg.addColorStop(1, 'rgba(195,191,185,0)'); c.fillStyle = rg; c.fill(rd);
        const R = rng(104); for (let i = 0; i < 46; i++) { const y = 460 + R() * 300, f = (y - 440) / 320, x = 650 - f * (230 + R() * 260); line(c, [[x, y], [x + 8, y - 1]], { w: 0.8, alpha: 0.25 }); }
        figure(c, 545, 610, 120, { pose: 'walk', dir: 1, mark: true, rim: C.boneA(0.5) });
        weaponAt(c, ...figurePoint(545, 610, 120, { pose: 'walk' }, 'mark'), 0.2, 2.3);
      }) },
    ],
    dyn(ctx, L, st) { mist(ctx, L, 470, 0.08, st.time, 8); },
  });

  // ================= Capítulo III =================
  // emakimono: rollo pintado que se desenrolla con el viaje
  let roll = null; const RW = 3000;
  const stops = VIAJE.map((s, i) => ({ ...s, x: 620 + i * 600, y: 380 + (i % 2 ? -40 : 40) }));
  const roadPts = spline([[150, 470], [400, 430], ...stops.flatMap((s, i) => [[s.x - 220, s.y + (i % 2 ? 90 : -60)], [s.x, s.y + 70]]), [RW - 150, 420]], 220);
  stage.define('emaki', {
    layers: [bg([600, 380, 600, 'rgba(70,60,58,0.45)'])],
    dynDepth: 0.15,
    prepare(v) {
      const s = v.L.s; roll = canvas(RW * s, 720 * s); const c = roll.ctx; c.scale(s, s);
      const pg = c.createLinearGradient(0, 60, 0, 660); pg.addColorStop(0, '#1d1716'); pg.addColorStop(0.5, '#241d1b'); pg.addColorStop(1, '#1a1414'); c.fillStyle = pg; c.fillRect(0, 60, RW, 600);
      wash(c, RW / 2, 360, RW / 2, 260, 'rgba(195,191,185,0.05)', { seed: 5, blobs: 14 });
      c.strokeStyle = C.boneA(0.25); c.lineWidth = 1; c.strokeRect(10, 70, RW - 20, 580); c.strokeStyle = 'rgba(154,31,40,0.45)'; c.strokeRect(18, 78, RW - 36, 564);
      mountains(c, { x0: 0, x1: RW, base: 300, amp: 90, color: 'rgba(195,191,185,0.08)', fade: 120, seed: 111, rim: 0.2, freq: 0.003 });
      const R = rng(112); for (let i = 0; i < 12; i++) house(c, 120 + R() * 220, 520 + R() * 60, 26, { color: C.boneA(0.5) });
      c.fillStyle = C.boneA(0.85); c.font = '700 24px "Shippori Mincho B1", serif'; c.textAlign = 'left'; c.fillText('黄泉川', 140, 150); c.font = '500 10px "IBM Plex Sans", sans-serif'; c.fillStyle = C.boneA(0.55); c.fillText('EL VALLE · INICIO DEL VIAJE', 140, 170);
      line(c, roadPts, { w: 3, color: C.boneA(0.3), dash: [6, 7] });
      stops.forEach((s, i) => {
        if (i === 0) { const pm = '#0a0808'; c.fillStyle = pm; c.fillRect(s.x - 70, s.y - 120, 12, 150); c.fillRect(s.x + 58, s.y - 120, 12, 150); c.beginPath(); c.moveTo(s.x - 110, s.y - 136); c.quadraticCurveTo(s.x, s.y - 128, s.x + 110, s.y - 136); c.lineTo(s.x + 104, s.y - 120); c.lineTo(s.x - 104, s.y - 120); c.fill(); c.fillRect(s.x - 82, s.y - 102, 164, 10); c.strokeStyle = 'rgba(200,24,34,0.7)'; c.lineWidth = 1.5; c.strokeRect(s.x - 70, s.y - 120, 12, 150); c.strokeRect(s.x + 58, s.y - 120, 12, 150); stamp(c, creatureSprite('yokai'), s.x, s.y - 10, 1.4); }
        if (i === 1) { const pk = new Path2D(); pk.moveTo(s.x - 260, s.y + 60); pk.quadraticCurveTo(s.x - 80, s.y - 60, s.x, s.y - 190); pk.quadraticCurveTo(s.x + 90, s.y - 50, s.x + 270, s.y + 60); pk.closePath(); const mg = c.createLinearGradient(0, s.y - 190, 0, s.y + 60); mg.addColorStop(0, 'rgba(195,191,185,0.32)'); mg.addColorStop(1, 'rgba(195,191,185,0.04)'); c.fillStyle = mg; c.fill(pk); c.strokeStyle = C.boneA(0.55); c.lineWidth = 2; c.stroke(pk); c.fillStyle = 'rgba(240,236,230,0.88)'; c.beginPath(); c.moveTo(s.x - 52, s.y - 118); c.quadraticCurveTo(s.x - 20, s.y - 160, s.x, s.y - 190); c.quadraticCurveTo(s.x + 24, s.y - 150, s.x + 60, s.y - 112); c.lineTo(s.x + 30, s.y - 124); c.lineTo(s.x + 6, s.y - 108); c.lineTo(s.x - 22, s.y - 126); c.closePath(); c.fill(); figure(c, s.x + 80, s.y + 40, 80, { who: 'father', dir: -1, color: 'rgba(8,6,6,0.92)', rim: C.boneA(0.45) }); c.fillStyle = '#b3121b'; c.beginPath(); c.moveTo(s.x + 88, s.y - 26); c.lineTo(s.x + 104, s.y - 22); c.lineTo(s.x + 88, s.y - 19); c.fill(); }
        if (i === 2) { brush(c, [[s.x - 220, s.y + 20], [s.x - 60, s.y - 10], [s.x + 80, s.y + 30], [s.x + 230, s.y]], { w: 40, color: 'rgba(8,6,6,0.9)', dry: 0.7, profile: 'taper', seed: 121, n: 50 }); for (let k = 0; k < 14; k++) { c.fillStyle = C.boneA(0.3 + R() * 0.3); c.beginPath(); c.ellipse(s.x - 200 + R() * 400, s.y + R() * 30, 6 + R() * 8, 4 + R() * 4, 0, 0, 7); c.fill(); } stamp(c, creatureSprite('kappa'), s.x + 20, s.y - 26, 1.6); }
        if (i === 3) { house(c, s.x, s.y + 40, 170, { color: C.boneA(0.55) }); c.strokeStyle = C.boneA(0.4); c.lineWidth = 3; c.beginPath(); c.moveTo(s.x - 60, s.y - 52); c.lineTo(s.x + 30, s.y - 20); c.stroke(); c.fillStyle = 'rgba(10,8,8,0.95)'; c.beginPath(); c.ellipse(s.x + 116, s.y + 30, 20, 13, 0, 0, 7); c.fill(); c.beginPath(); c.moveTo(s.x + 102, s.y + 22); c.lineTo(s.x + 104, s.y + 6); c.lineTo(s.x + 112, s.y + 20); c.moveTo(s.x + 120, s.y + 20); c.lineTo(s.x + 128, s.y + 6); c.lineTo(s.x + 130, s.y + 22); c.fill(); brush(c, [[s.x + 134, s.y + 34], [s.x + 150, s.y + 20], [s.x + 146, s.y + 4]], { w: 4, color: 'rgba(10,8,8,0.95)', profile: 'start', dry: 0, seed: 3, n: 8 }); c.fillStyle = '#e0303a'; c.fillRect(s.x + 108, s.y + 26, 3, 2); c.fillRect(s.x + 120, s.y + 26, 3, 2); }
        callout(c, [s.x, s.y - 150], [s.x + 40, 128], `${s.kanji}  ${s.who}`, { size: 18, sub: s.name });
      });
      c.fillStyle = C.boneA(0.6); c.font = '500 11px "IBM Plex Sans", sans-serif'; c.textAlign = 'right'; c.fillText('…Y EL VIAJE SIGUE', RW - 60, 620);
    },
    dyn(ctx, L, st) {
      if (!roll) return;
      const s = L.s, viewW = L.aw + 80, x0 = L.ax - 40, maxOff = RW * s - viewW;
      // cada paso del pasaje centra una parada del viaje; el rollo se desenrolla de una a la siguiente
      const offFor = (i) => (i < 0 ? 0 : Math.max(0, Math.min(maxOff, stops[i].x * s - viewW * 0.5)));
      const off = st.key === 'viaje' ? offFor(st.si - 1) + (offFor(st.si) - offFor(st.si - 1)) * (st.ts ?? 1) : maxOff;
      const k = roll.width / roll.w;
      ctx.drawImage(roll, off * k, 0, viewW * k, roll.height, x0, L.oy, viewW, roll.h);
      for (const rx of [x0 - 8, x0 + viewW - 8]) { const g = ctx.createLinearGradient(rx, 0, rx + 16, 0); g.addColorStop(0, '#2a1f1c'); g.addColorStop(0.5, '#6a5146'); g.addColorStop(1, '#2a1f1c'); ctx.fillStyle = g; ctx.fillRect(rx, L.oy + 40 * s, 16, 640 * s); }
      const n = Math.max(2, Math.floor(roadPts.length * Math.min(1, (off + viewW * 0.55) / (RW * s))));
      ctx.save(); ctx.beginPath(); ctx.rect(x0, L.oy, viewW, 720 * s); ctx.clip();
      ctx.translate(x0 - off, L.oy); ctx.scale(s, s);
      for (let i = 0; i < n; i += 3) { const p = roadPts[i]; ctx.fillStyle = C.glowA(0.85); ctx.beginPath(); ctx.ellipse(p[0] + (i % 6 ? 4 : -4), p[1], 3, 2, 0, 0, 7); ctx.fill(); }
      const p = roadPts[n - 1]; figure(ctx, p[0], p[1] - 2, 86, { pose: 'walk', mark: true, rim: C.boneA(0.6) });
      ctx.restore();
      // título del mapa de ruta y parada actual
      const stop = st.key === 'viaje' ? st.si : VIAJE.length - 1;
      ctx.save(); ctx.textAlign = 'left'; ctx.fillStyle = '#efe9e1'; ctx.font = `600 ${Math.max(12, 17 * s)}px "Shippori Mincho B1", serif`; ctx.fillText('Mapa de ruta · siete inviernos de viaje', x0 + 14, L.oy + 30 * s);
      ctx.fillStyle = C.boneA(0.6); ctx.font = `500 ${Math.max(9, 10.5 * s)}px "IBM Plex Sans", sans-serif`; ctx.fillText(`PARADA ${stop + 1} DE ${VIAJE.length} · ${VIAJE[stop].name.toUpperCase()} · ${VIAJE[stop].who.toUpperCase()}`, x0 + 14, L.oy + 50 * s);
      ctx.restore();
    },
  });

  // invierno: la marca crece y los recuerdos se borran (Tabla C)
  const AGE = { pesadilla: [13, 16.5], leyenda: [16.5, 20.5], invierno: [20.5, 22], invierno2: [22, 22], eleccion: [22, 22.6], eleccion2: [22.6, 22.6] };
  const CX = (age) => 530 + ((age - 13) / 9.6) * 400, CY = (v) => 330 - v * 2.2;
  const interp = (age, col) => { for (let i = 1; i < MARCA.length; i++) { const a = MARCA[i - 1], b = MARCA[i]; if (age <= b.age) return a[col] + (b[col] - a[col]) * ((age - a.age) / (b.age - a.age)); } return MARCA[MARCA.length - 1][col]; };
  const curve = (col, upTo) => { const pts = []; for (let a = 13; a <= upTo + 0.001; a += 0.05) pts.push([CX(a), CY(interp(a, col))]); return pts; };
  stage.define('invierno', {
    layers: [
      bg([600, 200, 720, 'rgba(74,70,68,0.5)']),
      { depth: 0.1, paint: (ctx, L) => art(ctx, L, (c) => { mountains(c, { x0: -300, x1: 1300, base: 440, amp: 110, color: 'rgba(230,226,220,0.12)', fade: 60, seed: 131, rim: 0.4 }); }) },
      { depth: 0.25, paint: (ctx, L) => { ctx.fillStyle = 'rgba(205,200,193,0.12)'; ctx.fillRect(-80, L.Y(510), L.w + 160, L.h); art(ctx, L, (c) => { const R = rng(132); for (let i = 0; i < 30; i++) { const x = -200 + R() * 1400, y = 480 + R() * 60, h = 50 + R() * 70; c.fillStyle = 'rgba(8,6,6,0.88)'; c.beginPath(); c.moveTo(x, y - h); c.lineTo(x - h * 0.28, y); c.lineTo(x + h * 0.28, y); c.closePath(); c.fill(); c.fillStyle = 'rgba(230,226,220,0.55)'; c.beginPath(); c.moveTo(x, y - h); c.lineTo(x - h * 0.1, y - h * 0.65); c.lineTo(x + h * 0.1, y - h * 0.65); c.fill(); }
        for (let i = 0; i < 5; i++) house(c, 810 + i * 48, 530 + (i % 2) * 10, 44, { color: C.boneA(0.45) }); }); } },
      { depth: 0.5, paint: (ctx, L) => art(ctx, L, (c) => { chartCard(c, 470, 60, 510, 330, 'La marca contra los recuerdos', 'Gráfico de líneas · % según la edad de Kenji'); for (const a of [13, 15, 18, 20, 22]) axisLabel(c, `${a} años`, CX(a), CY(0) + 20); line(c, [[CX(13), CY(0)], [CX(22.6), CY(0)]], { alpha: 0.35 }); line(c, [[CX(13), CY(100)], [CX(22.6), CY(100)]], { alpha: 0.12, dash: [2, 5] }); axisLabel(c, '100', CX(13) - 10, CY(100) + 3, 'right'); axisLabel(c, '0', CX(13) - 10, CY(0) + 3, 'right'); }) },
    ],
    dyn(ctx, L, st) {
      const r = AGE[st.key] || [22.6, 22.6]; const age = r[0] + (r[1] - r[0]) * (st.tp ?? 0);
      const night = st.key === 'invierno' || st.key === 'invierno2';
      art(ctx, L, (c) => {
        if (night) for (let i = 0; i < 5; i++) { const x = 810 + i * 48, y = 520; const g = c.createRadialGradient(x, y, 0, x, y, 64); g.addColorStop(0, `rgba(230,60,40,${0.6 + 0.3 * Math.sin(st.time * 8 + i)})`); g.addColorStop(1, C.red(0)); c.fillStyle = g; c.beginPath(); c.arc(x, y, 64, 0, 7); c.fill(); if (i === 1) { const b = c.createRadialGradient(x - 30, y + 10, 0, x - 30, y + 10, 26); b.addColorStop(0, C.oni(0.9)); b.addColorStop(1, C.oni(0)); c.fillStyle = b; c.beginPath(); c.arc(x - 30, y + 10, 26, 0, 7); c.fill(); } }
        const kx = 230 + (age - 13) * 14, ky = 650, kh = 210;
        figure(c, kx, ky, kh, { pose: 'walk', mark: true, rim: C.boneA(0.5) });
        weaponAt(c, ...figurePoint(kx, ky, kh, { pose: 'walk' }, 'mark'), 0.24, 2.4);
        // la marca baja por el brazo delantero
        const mk = figurePoint(kx, ky, kh, { pose: 'walk' }, 'mark'), hd = figurePoint(kx, ky, kh, { pose: 'walk' }, 'hand');
        const g = interp(age, 'marca') / 65;
        line(c, [mk, [mk[0] + (hd[0] - mk[0]) * 0.5, mk[1] + (hd[1] - mk[1]) * 0.35], [mk[0] + (hd[0] - mk[0]) * g, mk[1] + (hd[1] - mk[1]) * g]], { w: 5, color: C.glowA(0.9) });
        const m = curve('marca', age), me = curve('memoria', age);
        if (m.length > 1) { line(c, m, { w: 7, color: C.glowA(0.16) }); line(c, m, { w: 2.6, color: '#e0303a' }); line(c, me, { w: 2.4, color: '#efe9e1' }); }
        const pm = [CX(age), CY(interp(age, 'marca'))], pr = [CX(age), CY(interp(age, 'memoria'))];
        c.fillStyle = '#ff6a6a'; c.beginPath(); c.arc(pm[0], pm[1], 4.5, 0, 7); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(pr[0], pr[1], 4.5, 0, 7); c.fill();
        c.font = '500 12px "IBM Plex Sans", sans-serif'; c.textAlign = pm[0] > 860 ? 'right' : 'left'; const dx = pm[0] > 860 ? -10 : 10;
        c.fillStyle = '#ff8a8a'; c.fillText(`Marca ${Math.round(interp(age, 'marca'))} %`, pm[0] + dx, pm[1] - 8);
        c.fillStyle = '#efe9e1'; c.fillText(`Recuerdos ${Math.round(interp(age, 'memoria'))} %`, pr[0] + dx, pr[1] + 16);
        const cur = MARCA.filter((x) => x.age <= age + 0.01).pop();
        c.fillStyle = '#f1ebe2'; c.font = '600 15px "Shippori Mincho B1", serif'; c.textAlign = 'right'; c.fillText(`${Math.floor(age)} años · ${cur ? cur.label : ''}`, 960, 88);
      });
    },
  });
}

// ================= Esquema de relaciones (Cap. III, «pregunta») =================
// Contenedores (personajes y artefactos) y conectores con verbo: quién crea, encierra, arrastra o advierte a quién.
export const SCHEMA = {
  nodes: [
    { id: 'dioses', x: 500, y: 92, icon: 'dioses', name: 'Los dioses', role: 'quieren a las bestias muertas' },
    { id: 'marca', x: 500, y: 236, icon: 'marca', name: 'La marca', role: 'una prisión, no un honor', hot: true },
    { id: 'espiritu', x: 180, y: 236, icon: 'espiritu', name: 'Espíritu rebelde', role: 'desafió el trono divino' },
    { id: 'kusarigama', x: 820, y: 236, icon: 'kusarigama', name: 'Kusarigama', role: 'su voz: ¿el espíritu?' },
    { id: 'kenji', x: 500, y: 420, icon: 'kenji', name: 'Kenji', role: '13 → 15 → 22 años', big: true },
    { id: 'ronin', x: 160, y: 420, icon: 'ronin', name: 'Ronin ciego', role: 'huele la flor' },
    { id: 'criaturas', x: 840, y: 420, icon: 'oni', name: '30 criaturas', role: 'dragones, onis, yokais, kappas' },
    { id: 'padres', x: 250, y: 596, icon: 'padres', name: 'Sus padres', role: 'mueren en el ataque' },
    { id: 'viaje', x: 750, y: 596, icon: 'ruta', name: 'Encuentros', role: 'kitsune · tengu · kappa · bakeneko', group: ['kitsune', 'tengu', 'kappa', 'bakeneko'] },
  ],
  edges: [
    ['dioses', 'marca', 'la crean'], ['marca', 'espiritu', 'encierra'], ['espiritu', 'dioses', 'desafió', 'rebel'],
    ['marca', 'kusarigama', 'despierta y forja'], ['marca', 'kenji', 'se graba en su cuello'], ['kusarigama', 'kenji', 'lo arrastra y le habla'],
    ['kenji', 'criaturas', 'caza · 14 caen'], ['ronin', 'kenji', 'le advierte'], ['padres', 'kenji', 'lo esconden'], ['viaje', 'kenji', 'le revelan la verdad'],
  ],
};
const NW = (n) => (n.big ? 240 : 210), NH = (n) => (n.group ? 76 : n.big ? 70 : 62);
function edgePts(a, b) {
  // de borde a borde de los contenedores
  const dx = b.x - a.x, dy = b.y - a.y;
  const cut = (n, sx, sy) => { const hw = NW(n) / 2 + 6, hh = NH(n) / 2 + 6; const k = Math.min(Math.abs(sx) > 1e-6 ? hw / Math.abs(sx) : 1e9, Math.abs(sy) > 1e-6 ? hh / Math.abs(sy) : 1e9); return [n.x + sx * k, n.y + sy * k]; };
  const len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
  return [cut(a, ux, uy), cut(b, -ux, -uy)];
}
function drawNode(c, n, a, time) {
  const w = NW(n), h = NH(n), x = n.x - w / 2, y = n.y - h / 2;
  c.save(); c.globalAlpha = a;
  if (n.hot) { const g = c.createRadialGradient(n.x, n.y, 0, n.x, n.y, 170); g.addColorStop(0, C.glowA(0.22 + 0.08 * Math.sin(time * 2))); g.addColorStop(1, C.glowA(0)); c.fillStyle = g; c.fillRect(n.x - 170, n.y - 120, 340, 240); }
  c.fillStyle = 'rgba(14,10,10,0.92)'; c.fillRect(x, y, w, h);
  c.strokeStyle = n.hot ? 'rgba(224,48,58,0.85)' : C.boneA(0.35); c.lineWidth = n.hot || n.big ? 1.6 : 1; c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  c.strokeStyle = C.boneA(0.1); c.lineWidth = 1; c.strokeRect(x + 4.5, y + 4.5, w - 9, h - 9);
  c.strokeStyle = 'rgba(200,24,34,0.8)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y + 10); c.lineTo(x, y); c.lineTo(x + 10, y); c.stroke();
  drawIcon(c, n.icon, x + 28, n.y - (n.group ? 10 : 0), n.big ? 30 : 26);
  c.textAlign = 'left'; c.textBaseline = 'middle';
  c.fillStyle = '#f1ebe2'; c.font = `700 ${n.big ? 18 : 15}px "Shippori Mincho B1", serif`; c.fillText(n.name, x + 52, n.y - (n.group ? 18 : 9));
  c.fillStyle = C.boneA(0.75); c.font = '12px "Zen Old Mincho", serif'; c.fillText(n.role, x + 52, n.y + (n.group ? -1 : 11));
  if (n.group) n.group.forEach((id, i) => drawIcon(c, id, x + 64 + i * 30, n.y + 22, 20));
  c.restore();
}
function drawEdge(c, a, b, label, kind, p, alpha) {
  const [s, e] = edgePts(a, b), x = s[0] + (e[0] - s[0]) * p, y = s[1] + (e[1] - s[1]) * p;
  c.save(); c.globalAlpha = alpha;
  c.strokeStyle = kind === 'rebel' ? 'rgba(224,48,58,0.9)' : C.boneA(0.7); c.lineWidth = kind === 'rebel' ? 1.6 : 1.4;
  if (kind === 'rebel') c.setLineDash([6, 5]);
  c.beginPath(); c.moveTo(s[0], s[1]); c.lineTo(x, y); c.stroke(); c.setLineDash([]);
  if (p > 0.98) { const ang = Math.atan2(e[1] - s[1], e[0] - s[0]); c.fillStyle = c.strokeStyle; c.beginPath(); c.moveTo(e[0], e[1]); c.lineTo(e[0] - Math.cos(ang - 0.4) * 10, e[1] - Math.sin(ang - 0.4) * 10); c.lineTo(e[0] - Math.cos(ang + 0.4) * 10, e[1] - Math.sin(ang + 0.4) * 10); c.closePath(); c.fill();
    const mx = (s[0] + e[0]) / 2, my = (s[1] + e[1]) / 2; c.font = 'italic 13px "Zen Old Mincho", serif'; const tw = c.measureText(label).width;
    c.fillStyle = 'rgba(16,12,12,0.94)'; c.fillRect(mx - tw / 2 - 6, my - 9, tw + 12, 18); c.fillStyle = kind === 'rebel' ? '#ff8a8a' : '#e9e2d8'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(label, mx, my + 1); }
  c.restore();
}

export function defineSchema(stage) {
  const N = Object.fromEntries(SCHEMA.nodes.map((n) => [n.id, n]));
  // orden de aparición (dosificado): nodo, nodo, conector…
  const seq = ['dioses', 'marca', 'e0', 'espiritu', 'e1', 'e2', 'kusarigama', 'e3', 'kenji', 'e4', 'e5', 'criaturas', 'e6', 'ronin', 'e7', 'padres', 'e8', 'viaje', 'e9'];
  stage.define('esquema', {
    layers: [
      bg([500, 330, 700, 'rgba(70,62,62,0.5)']),
      { depth: 0.12, paint: (ctx, L) => art(ctx, L, (c) => { mountains(c, { x0: -300, x1: 1300, base: 700, amp: 90, color: 'rgba(230,226,220,0.06)', fade: 60, seed: 141, rim: 0.2 });
        c.fillStyle = '#efe9e1'; c.font = '700 20px "Shippori Mincho B1", serif'; c.textAlign = 'left'; c.fillText('Quién ata a quién', 24, 690);
        c.fillStyle = C.boneA(0.55); c.font = '500 9.5px "IBM Plex Sans", sans-serif'; c.fillText('ESQUEMA DE RELACIONES · CONTENEDORES Y CONECTORES', 24, 708);
        c.fillStyle = C.boneA(0.6); c.font = '11px "IBM Plex Sans", sans-serif'; c.textAlign = 'right'; c.fillText('— relación', 976, 690); c.fillStyle = '#ff8a8a'; c.fillText('- - - rebelión', 976, 708); }) },
    ],
    dynDepth: 0.2,
    dyn(ctx, L, st) {
      const t = st.key === 'pregunta' ? st.tpSlow : 1, step = 0.85 / seq.length;
      art(ctx, L, (c) => {
        // conectores debajo de los contenedores
        seq.forEach((id, k) => { if (id[0] !== 'e' || N[id]) return; const E = SCHEMA.edges[+id.slice(1)], p = ramp(t, k * step, k * step + step * 1.4); if (p > 0) drawEdge(c, N[E[0]], N[E[1]], E[2], E[3], p, 1); });
        seq.forEach((id, k) => { if (!N[id]) return; const a = ramp(t, k * step, k * step + step); if (a > 0) drawNode(c, N[id], a, st.time); });
      });
    },
  });
}

// arte de los paneles del menú
export function paintPanel(i, cv) {
  const c = cv.ctx, w = cv.w, h = cv.h;
  paper(c, w, h, { glowAt: [w / 2, h * 0.55, h * 0.6, 'rgba(84,68,64,0.6)'], vignette: 0.6 });
  if (i === 0) { const R = rng(3); for (let k = 0; k < 10; k++) bamboo(c, R() * w, -20, h + 20, 4 + R() * 4, { alpha: 0.16, seed: k + 3 }); lily(c, w / 2, h * 0.5, Math.min(w / 160, 1.6), { stem: h * 0.3 }); }
  if (i === 1) { weaponAt(c, w * 0.44, h * 0.5, Math.min(w / 260, 1.05), -0.25); }
  if (i === 2) { c.fillStyle = 'rgba(205,200,193,0.12)'; c.fillRect(0, h * 0.72, w, h); mountains(c, { x0: 0, x1: w, base: h * 0.7, amp: h * 0.12, color: 'rgba(230,226,220,0.14)', fade: 40, seed: 5, rim: 0.4 }); figure(c, w * 0.52, h * 0.86, h * 0.3, { pose: 'walk', dir: -1, mark: true, rim: C.boneA(0.55) }); }
}
