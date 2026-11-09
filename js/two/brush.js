// Pincel 2D: tinta clara sobre papel oscuro, al estilo de la infografía Kusarigama Radiata.
// Todo se dibuja en <canvas> con trazos de pincel seco, aguadas y siluetas.

export const C = {
  paper: '#100d0d', paper2: '#171211', bone: '#c3bfb9', boneA: (a) => `rgba(195,191,185,${a})`,
  ash: '#715955', blood: '#621a1f', crimson: '#9a1f28', glow: '#e0303a', red: (a) => `rgba(170,22,30,${a})`,
  glowA: (a) => `rgba(224,48,58,${a})`, ink: (a) => `rgba(8,6,6,${a})`, oni: (a) => `rgba(74,123,255,${a})`,
};

// ---------- azar con semilla y ruido ----------
export function rng(seed = 1) { let s = seed >>> 0 || 1; return () => ((s = Math.imul(s ^ (s >>> 15), 2246822507) + 0x6d2b79f5 >>> 0), (s >>> 0) / 4294967296); }
export function noise1(seed = 1) {
  const R = rng(seed), v = Array.from({ length: 256 }, R);
  return (x) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return v[i & 255] * (1 - u) + v[(i + 1) & 255] * u; };
}
export const fbm = (n, x, o = 4) => { let a = 0, s = 0.5, f = 1; for (let i = 0; i < o; i++) { a += n(x * f) * s; s *= 0.5; f *= 2; } return a; };

export function canvas(w, h, dpr = Math.min(devicePixelRatio || 1, 2)) {
  const c = document.createElement('canvas');
  c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
  c.style.width = w + 'px'; c.style.height = h + 'px';
  const ctx = c.getContext('2d'); ctx.scale(dpr, dpr);
  c.w = w; c.h = h; c.ctx = ctx;
  return c;
}

// ---------- papel ----------
let grainTile = null;
function grain() {
  if (grainTile) return grainTile;
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d'), d = g.createImageData(256, 256), R = rng(9);
  for (let i = 0; i < d.data.length; i += 4) { const v = R() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 18; }
  g.putImageData(d, 0, 0);
  // fibras
  g.strokeStyle = 'rgba(255,255,255,0.035)'; g.lineWidth = 0.6;
  for (let i = 0; i < 220; i++) { const x = R() * 256, y = R() * 256, a = R() * Math.PI; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * (6 + R() * 18), y + Math.sin(a) * (2 + R() * 6)); g.stroke(); }
  return (grainTile = c);
}
export function paper(ctx, w, h, { tone = C.paper, glowAt = null, vignette = 0.75 } = {}) {
  ctx.fillStyle = tone; ctx.fillRect(0, 0, w, h);
  if (glowAt) { const g = ctx.createRadialGradient(glowAt[0], glowAt[1], 0, glowAt[0], glowAt[1], glowAt[2]); g.addColorStop(0, glowAt[3] || 'rgba(60,50,48,0.55)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); }
  ctx.fillStyle = ctx.createPattern(grain(), 'repeat'); ctx.fillRect(0, 0, w, h);
  const v = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.75);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, `rgba(0,0,0,${vignette})`);
  ctx.fillStyle = v; ctx.fillRect(0, 0, w, h);
}

// ---------- curvas ----------
export function spline(pts, n = 40) {
  if (pts.length < 3) { const out = []; for (let i = 0; i <= n; i++) { const t = i / n; out.push([pts[0][0] + (pts[1][0] - pts[0][0]) * t, pts[0][1] + (pts[1][1] - pts[0][1]) * t]); } return out; }
  const out = [], P = [pts[0], ...pts, pts[pts.length - 1]];
  const seg = pts.length - 1, per = Math.max(2, Math.ceil(n / seg));
  for (let i = 1; i < P.length - 2; i++) {
    const [p0, p1, p2, p3] = [P[i - 1], P[i], P[i + 1], P[i + 2]];
    for (let k = 0; k < per; k++) {
      const t = k / per, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map((j) => 0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

// ---------- trazo de pincel ----------
// pts: puntos de control; w: ancho; profile: 'taper' | 'start' | 'end' | 'even'; dry: textura de pincel seco (0..1)
export function brush(ctx, pts, { w = 6, color = C.bone, alpha = 0.9, profile = 'taper', dry = 0.5, seed = 1, n = 60, upTo = 1 } = {}) {
  let P = spline(pts, n);
  if (upTo < 1) P = P.slice(0, Math.max(2, Math.ceil(P.length * upTo)));
  if (P.length < 2) return;
  const N = noise1(seed), R = rng(seed + 7);
  const L = [], Rr = [], W = [];
  const total = P.length - 1;
  for (let i = 0; i < P.length; i++) {
    const t = i / total * upTo;
    const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)];
    let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
    let prof = profile === 'taper' ? Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.02 + 0.02)), 0.55)
      : profile === 'start' ? Math.pow(1 - t, 0.7) * Math.min(1, t * 12 + 0.3)
      : profile === 'end' ? Math.pow(t, 0.6) * Math.min(1, (1 - t) * 10 + 0.2) : 1;
    const ww = w * prof * (0.8 + 0.4 * N(i * 0.15));
    W.push(ww);
    L.push([P[i][0] + nx * ww / 2, P[i][1] + ny * ww / 2]); Rr.push([P[i][0] - nx * ww / 2, P[i][1] - ny * ww / 2, nx, ny]);
  }
  ctx.save();
  ctx.globalAlpha = alpha * (1 - dry * 0.45);
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(L[0][0], L[0][1]);
  for (const p of L) ctx.lineTo(p[0], p[1]);
  for (let i = Rr.length - 1; i >= 0; i--) ctx.lineTo(Rr[i][0], Rr[i][1]);
  ctx.closePath(); ctx.fill();
  // cerdas del pincel seco
  if (dry > 0) {
    ctx.strokeStyle = color; ctx.lineCap = 'round';
    const bristles = Math.ceil(4 + w * 0.9);
    for (let k = 0; k < bristles; k++) {
      const o = (R() * 2 - 1) * 0.5, gap = 0.55 + R() * 0.35, ph = R() * 50;
      ctx.lineWidth = Math.max(0.4, w * (0.05 + R() * 0.1));
      ctx.globalAlpha = alpha * (0.3 + R() * 0.6);
      ctx.beginPath(); let down = false;
      for (let i = 0; i < P.length; i++) {
        const t = i / total;
        const on = N(ph + i * 0.22) < gap + (1 - dry) * 0.4 - t * dry * 0.35;
        const p = [P[i][0] + Rr[i][2] * W[i] * o, P[i][1] + Rr[i][3] * W[i] * o];
        if (on) { if (!down) { ctx.moveTo(p[0], p[1]); down = true; } else ctx.lineTo(p[0], p[1]); } else down = false;
      }
      ctx.stroke();
    }
  }
  ctx.restore();
}

// línea fina (para gráficas y etiquetas), dibujada hasta upTo
export function line(ctx, pts, { w = 1, color = C.bone, alpha = 1, dash = null, upTo = 1 } = {}) {
  const n = Math.max(2, Math.ceil(pts.length * upTo));
  ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < n; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.stroke(); ctx.restore();
}

// ---------- aguada (mancha de tinta difusa) ----------
export function wash(ctx, x, y, rx, ry, color = 'rgba(195,191,185,0.08)', { seed = 1, blobs = 7 } = {}) {
  const R = rng(seed);
  ctx.save();
  for (let i = 0; i < blobs; i++) {
    const cx = x + (R() - 0.5) * rx * 0.8, cy = y + (R() - 0.5) * ry * 0.6, r = (0.4 + R() * 0.6) * Math.max(rx, ry);
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(cx, cy, r, r * (ry / rx), 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

// ---------- cordillera con niebla ----------
export function mountains(ctx, { x0 = 0, x1, base, amp = 120, color = 'rgba(195,191,185,0.18)', fade = 160, seed = 1, freq = 0.006, peaks = 0.6, rim = 0.45 }) {
  const N = noise1(seed);
  const pts = [];
  for (let x = x0; x <= x1; x += 4) {
    const h = fbm(N, x * freq + seed, 5);
    pts.push([x, base - Math.pow(h, 1 + peaks) * amp * 1.8]);
  }
  ctx.save();
  const top = Math.min(...pts.map((p) => p[1]));
  const g = ctx.createLinearGradient(0, top, 0, base + fade);
  g.addColorStop(0, color); g.addColorStop(0.55, color.replace(/[\d.]+\)$/, (m) => `${parseFloat(m) * 0.55})`)); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(x0, base + fade);
  for (const p of pts) ctx.lineTo(p[0], p[1]);
  ctx.lineTo(x1, base + fade); ctx.closePath(); ctx.fill();
  ctx.restore();
  if (rim > 0) brush(ctx, pts.filter((_, i) => i % 3 === 0), { w: 2.2, alpha: rim, dry: 0.8, profile: 'even', seed, n: pts.length });
  return pts;
}

// ---------- bambú ----------
export function bamboo(ctx, x, top, bottom, w, { color = C.bone, alpha = 0.6, seed = 1, leaves = true } = {}) {
  const R = rng(seed);
  const lean = (R() - 0.5) * 30;
  let y = bottom;
  while (y > top) {
    const seg = 40 + R() * 50;
    const y2 = Math.max(top, y - seg);
    const xa = x + lean * (1 - (y - top) / (bottom - top)), xb = x + lean * (1 - (y2 - top) / (bottom - top));
    brush(ctx, [[xa, y - 3], [(xa + xb) / 2 + (R() - 0.5) * 2, (y + y2) / 2], [xb, y2 + 3]], { w, color, alpha, profile: 'even', dry: 0.55, seed: seed + y | 0, n: 14 });
    // nudo
    brush(ctx, [[xb - w * 0.7, y2 + 2], [xb + w * 0.7, y2]], { w: w * 0.35, color, alpha: alpha * 0.9, profile: 'taper', dry: 0.3, seed: seed + 3, n: 6 });
    if (leaves && R() < 0.3 && y2 < bottom - 120) {
      const dir = R() < 0.5 ? -1 : 1;
      for (let k = 0; k < 3; k++) {
        const len = 40 + R() * 50, a = dir * (0.3 + k * 0.35) + (R() - 0.5) * 0.3;
        brush(ctx, [[xb, y2], [xb + Math.cos(a) * len * 0.5 * dir, y2 + Math.sin(Math.abs(a)) * len * 0.4], [xb + Math.cos(a) * len * dir, y2 + len * 0.55]], { w: 5 + R() * 4, color, alpha: alpha * 0.85, profile: 'start', dry: 0.25, seed: seed + k * 17, n: 12 });
      }
    }
    y = y2 - 4;
  }
}

// ---------- higanbana 2D ----------
export function lily(ctx, x, y, s = 1, { color = '#b3121b', stem = 160, seed = 3, alpha = 1, stamen = '#d22a2e' } = {}) {
  const R = rng(seed);
  brush(ctx, [[x + 2, y + stem * s], [x - 3 * s, y + stem * s * 0.5], [x, y + 8 * s]], { w: 3.2 * s, color: '#3a3533', alpha, profile: 'even', dry: 0.2, seed, n: 20 });
  const florets = 6;
  for (let f = 0; f < florets; f++) {
    const a = -Math.PI / 2 + (f - (florets - 1) / 2) * 0.55 + (R() - 0.5) * 0.15;
    const cx = x + Math.cos(a) * 14 * s, cy = y + Math.sin(a) * 10 * s;
    // estambres largos y curvos
    for (let k = 0; k < 6; k++) {
      const sa = a + (k - 2.5) * 0.16;
      const L = (62 + R() * 18) * s;
      const ex = cx + Math.cos(sa) * L, ey = cy + Math.sin(sa) * L - 12 * s;
      const mid = [cx + Math.cos(sa) * L * 0.55, cy + Math.sin(sa) * L * 0.55 - 22 * s];
      ctx.save(); ctx.strokeStyle = stamen; ctx.globalAlpha = alpha * 0.9; ctx.lineWidth = 0.9 * s; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.quadraticCurveTo(mid[0], mid[1], ex, ey); ctx.stroke();
      ctx.fillStyle = '#2a1e1c'; ctx.beginPath(); ctx.ellipse(ex, ey, 2.4 * s, 1.1 * s, sa, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    // seis tépalos estrechos que se enroscan hacia atrás
    for (let p = 0; p < 6; p++) {
      const pa = a + (p - 2.5) * 0.42;
      const len = (26 + R() * 8) * s;
      const curl = (p < 3 ? -1 : 1) * 0.9;
      const p1 = [cx + Math.cos(pa) * len * 0.5, cy + Math.sin(pa) * len * 0.5 - 4 * s];
      const p2 = [cx + Math.cos(pa) * len, cy + Math.sin(pa) * len];
      const p3 = [p2[0] + Math.cos(pa + curl) * 9 * s, p2[1] + Math.sin(pa + curl) * 9 * s + 5 * s];
      brush(ctx, [[cx, cy], p1, p2, p3], { w: 5.5 * s, color, alpha, profile: 'taper', dry: 0.18, seed: seed + f * 13 + p, n: 18 });
      ctx.save(); ctx.globalAlpha = alpha * 0.5;
      brush(ctx, [[cx, cy], p1, p2], { w: 1.4 * s, color: '#ff5a5a', alpha: 0.35 * alpha, profile: 'taper', dry: 0.6, seed: seed + p, n: 12 });
      ctx.restore();
    }
  }
}

// ---------- siluetas ----------
// ---------- personajes: siluetas trazadas a mano (caja de 200 de alto, pies en y=200, mirando a la derecha) ----------
const PATHS = {
  head: 'M5 10 C-5 10 -10 18 -9 27 C-8 34 -3 39 3 40 L3 46 L12 46 L12 38 C16 35 19 31 20 28 L22 26 L19 23 C18 15 13 10 5 10 Z',
  hair: 'M-10 25 C-13 14 -7 5 4 4 C9 1 15 3 18 8 C21 11 21 16 20 20 L17 15 L14 18 L11 13 L7 17 L3 12 L-1 17 C-3 19 -5 23 -6 28 Z M-9 26 C-16 27 -20 32 -22 39 C-17 36 -13 35 -9 33 Z',
  topknot: 'M-9 24 C-11 14 -5 7 5 7 C12 7 18 11 19 18 C14 14 6 13 -2 16 Z M-2 8 C-4 2 2 -2 7 1 C9 3 9 6 7 8 Z',
  bun: 'M-9 25 C-12 14 -6 6 5 6 C13 6 19 12 19 19 C12 15 4 15 -3 18 Z M-12 18 C-20 16 -22 26 -16 30 C-12 31 -10 27 -11 23 Z',
  body: 'M-16 47 C-8 44 13 43 21 47 C23 62 22 78 21 92 C27 122 31 162 37 196 L12 198 L6 152 L1 198 L-27 196 C-25 160 -22 122 -19 92 C-20 78 -19 62 -16 47 Z',
  sleeves: 'M-15 48 C-24 58 -28 82 -26 106 C-20 110 -12 109 -8 104 L-10 60 Z M20 48 C30 57 34 80 33 102 C27 107 19 106 15 101 L16 62 Z M27 103 C31 103 33 107 31 111 C27 113 24 110 25 106 Z',
  feet: 'M-29 196 L-6 196 L-5 200 L-31 200 Z M11 196 L38 196 L40 200 L9 200 Z',
  folds: 'M-7 97 L-13 193 M4 99 L4 150 M13 97 L22 193 M-18 88 L21 88 M-18 95 L21 95 M-3 47 L5 66 L13 47 M-6 62 L-9 100 M24 62 L27 98',
  walkBody: 'M-16 47 C-8 44 13 43 21 47 C23 62 22 78 21 92 C32 120 42 158 50 194 L26 198 L8 146 L-12 198 L-36 193 C-28 158 -22 122 -19 92 C-20 78 -19 62 -16 47 Z',
  walkSleeves: 'M-15 48 C-28 56 -36 78 -38 98 C-31 104 -24 102 -20 97 L-12 62 Z M20 48 C34 54 42 74 44 94 C38 100 30 99 27 94 L17 62 Z',
  walkFeet: 'M-38 192 L-14 196 L-15 200 L-40 197 Z M26 196 L52 194 L54 199 L25 200 Z',
  walkFolds: 'M-6 97 L-21 191 M6 99 L8 144 M14 97 L37 191 M-18 88 L21 88 M-18 95 L21 95 M-3 47 L5 66 L13 47',
  kneelBody: 'M-15 119 C-7 116 13 115 21 119 C23 133 23 148 22 160 C32 166 44 180 46 196 L46 200 L-30 200 C-36 190 -32 175 -23 166 C-20 150 -18 133 -15 119 Z',
  kneelSleeves: 'M-15 120 C-24 130 -26 150 -22 168 C-16 171 -9 170 -6 166 L-8 132 Z M20 120 C27 130 33 147 42 162 C37 169 27 170 21 166 L17 134 Z M40 161 C45 161 48 165 46 169 C42 171 39 169 38 166 Z',
  kneelFolds: 'M-20 158 L23 158 M-20 164 L24 164 M-3 119 L5 136 L13 119 M2 176 L40 188 M-14 178 L-24 196',
  mother: 'M-15 47 C-7 44 12 43 19 47 C21 70 20 100 22 130 C24 160 26 180 28 198 L-22 198 C-20 180 -19 160 -18 130 C-17 100 -18 70 -15 47 Z',
  motherFolds: 'M-17 84 L20 84 M-17 94 L20 94 M2 100 L6 196 M-3 47 L5 66 L13 47',
  hat: 'M-36 30 C-22 20 -4 10 7 8 C20 10 36 20 50 30 C32 35 -18 35 -36 30 Z',
  roninHead: 'M1 30 C-5 32 -8 40 -6 47 C-4 52 1 54 6 54 L6 58 L15 58 L15 50 C19 47 21 41 21 37 L23 35 L20 32 Z',
  cloak: 'M-21 58 C-8 54 18 54 27 58 C35 92 41 140 45 196 L-31 196 C-29 140 -27 92 -21 58 Z',
  roninArm: 'M25 60 C35 68 42 84 43 98 L35 104 L28 76 Z M38 98 C43 98 45 102 43 106 C39 108 36 105 37 101 Z',
  katana: 'M-30 114 L30 101 L31 104 L-29 117 Z M31 101 L44 98 L45 101 L32 104 Z',
  roninFeet: 'M-30 196 L-8 196 L-8 200 L-31 200 Z M14 196 L40 196 L41 200 L13 200 Z',
  roninFolds: 'M-8 72 L-15 194 M9 72 L13 194 M24 72 L35 194 M-21 62 L27 62',
  oni: 'M2 6 C-8 6 -14 14 -14 24 L-24 8 L-20 28 C-22 34 -20 40 -16 44 C-36 50 -50 70 -50 104 L-40 110 C-38 94 -34 84 -30 80 C-30 112 -32 150 -36 196 L-8 196 L-2 150 L4 196 L32 196 C28 150 26 112 26 80 C30 84 36 94 38 110 L48 104 C48 70 34 50 16 44 C20 40 22 34 20 28 L26 8 L16 24 C16 14 12 6 2 6 Z',
};
const P2D = {};
const path = (k) => (P2D[k] ||= new Path2D(PATHS[k]));

// pose: 'stand' | 'walk' | 'kneel'  ·  who: 'kenji' | 'father' | 'mother' | 'ronin' | 'oni'
export function figure(ctx, x, y, h, o = {}) {
  let { color = C.ink(0.95), rim = C.boneA(0.4), dir = 1, pose = 'stand', who = 'kenji', mark = false, lean = 0 } = o;
  if (o.kneel) pose = 'kneel';
  if (o.hat || o.staff) who = 'ronin';
  const s = h / 200;
  ctx.save(); ctx.translate(x, y); ctx.scale(dir * s, s); ctx.rotate(lean); ctx.translate(0, -200);
  const parts = [], folds = [];
  let dy = 0;
  if (who === 'ronin') { parts.push('cloak', 'roninArm', 'roninFeet', 'roninHead', 'hat', 'katana'); folds.push('roninFolds'); }
  else if (who === 'oni') { parts.push('oni'); }
  else {
    if (pose === 'kneel') { dy = 72; parts.push('kneelBody', 'kneelSleeves'); folds.push('kneelFolds'); }
    else if (pose === 'walk') { parts.push('walkBody', 'walkSleeves', 'walkFeet'); folds.push('walkFolds'); }
    else if (who === 'mother') { parts.push('mother', 'sleeves'); folds.push('motherFolds'); }
    else { parts.push('body', 'sleeves', 'feet'); folds.push('folds'); }
  }
  ctx.fillStyle = color;
  for (const k of parts) ctx.fill(path(k));
  if (who !== 'ronin' && who !== 'oni') {
    ctx.save(); ctx.translate(0, dy); ctx.fill(path('head')); ctx.fill(path(who === 'father' ? 'topknot' : who === 'mother' ? 'bun' : 'hair')); ctx.restore();
  }
  if (who === 'ronin') { ctx.fillRect(43, 30, 3.4, 170); }
  if (rim) {
    ctx.strokeStyle = rim; ctx.lineWidth = 1.2 / s; ctx.lineJoin = 'round';
    for (const k of parts) ctx.stroke(path(k));
    if (who !== 'ronin' && who !== 'oni') { ctx.save(); ctx.translate(0, dy); ctx.stroke(path('head')); ctx.restore(); }
    ctx.globalAlpha = 0.45; ctx.lineWidth = 0.9 / s;
    for (const k of folds) ctx.stroke(path(k));
    if (who === 'ronin') { ctx.globalAlpha = 0.9; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(-5, 42); ctx.lineTo(22, 39); ctx.stroke(); }
    ctx.globalAlpha = 1;
  }
  if (mark) {
    const mx = 9, my = 40 + dy;
    const g = ctx.createRadialGradient(mx, my, 0, mx, my, 14);
    g.addColorStop(0, 'rgba(255,80,80,1)'); g.addColorStop(0.3, 'rgba(215,22,32,0.9)'); g.addColorStop(1, 'rgba(200,20,30,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(mx, my, 14, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}
// punto del cuello (la marca) y de la mano delantera, en coordenadas de la escena
export function figurePoint(x, y, h, { dir = 1, pose = 'stand' } = {}, which = 'mark') {
  const s = h / 200, dy = pose === 'kneel' ? 72 : 0;
  const p = which === 'mark' ? [9, 40 + dy] : pose === 'kneel' ? [44, 165] : pose === 'walk' ? [42, 96] : [29, 107];
  return [x + dir * p[0] * s, y + (p[1] - 200) * s];
}

// ---------- caché de sprites: lo costoso se dibuja una vez ----------
const SPR = {};
export function cached(key, w, h, draw, scale = 2) {
  if (SPR[key]) return SPR[key];
  const c = document.createElement('canvas'); c.width = Math.ceil(w * scale); c.height = Math.ceil(h * scale);
  const g = c.getContext('2d'); g.scale(scale, scale); draw(g, w, h);
  c.w = w; c.h = h;
  return (SPR[key] = c);
}
export function stamp(ctx, spr, x, y, s = 1, ang = 0, ax = 0.5, ay = 0.5) {
  ctx.save(); ctx.translate(x, y); if (ang) ctx.rotate(ang); ctx.drawImage(spr, -spr.w * s * ax, -spr.h * s * ay, spr.w * s, spr.h * s); ctx.restore();
}

// casa japonesa vista de frente/arriba (para mapas y aldeas)
export function house(ctx, x, y, w, { color = C.boneA(0.75), fill = 'rgba(30,24,23,0.95)', burn = 0, seed = 1 } = {}) {
  const h = w * 0.55;
  ctx.save();
  ctx.fillStyle = fill;
  ctx.beginPath(); ctx.moveTo(x - w * 0.42, y); ctx.lineTo(x - w * 0.42, y - h * 0.55); ctx.lineTo(x + w * 0.42, y - h * 0.55); ctx.lineTo(x + w * 0.42, y); ctx.closePath(); ctx.fill();
  // techo curvo
  ctx.beginPath(); ctx.moveTo(x - w * 0.62, y - h * 0.5); ctx.quadraticCurveTo(x - w * 0.3, y - h * 0.62, x - w * 0.18, y - h * 1.05); ctx.lineTo(x + w * 0.18, y - h * 1.05); ctx.quadraticCurveTo(x + w * 0.3, y - h * 0.62, x + w * 0.62, y - h * 0.5); ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = burn > 0 ? `rgba(${180 + 75 * burn | 0},${60 - 40 * burn | 0},${50 - 30 * burn | 0},${0.6 + burn * 0.4})` : color;
  ctx.lineWidth = Math.max(0.8, w * 0.045); ctx.stroke();
  ctx.restore();
}

// etiqueta con línea guía (estilo infografía): punto -> codo -> texto
export function callout(ctx, from, to, text, { align = 'left', color = C.bone, sub = null, size = 13, font = '"Zen Old Mincho", Georgia, serif' } = {}) {
  ctx.save();
  ctx.strokeStyle = C.boneA(0.6); ctx.lineWidth = 1; ctx.fillStyle = C.bone;
  ctx.beginPath(); ctx.arc(from[0], from[1], 2.4, 0, Math.PI * 2); ctx.fill();
  const elbow = [to[0] + (align === 'left' ? -18 : 18), to[1]];
  ctx.beginPath(); ctx.moveTo(from[0], from[1]); ctx.lineTo(elbow[0], elbow[1]); ctx.lineTo(to[0], to[1]); ctx.stroke();
  ctx.fillStyle = color; ctx.font = `${size}px ${font}`; ctx.textAlign = align; ctx.textBaseline = 'middle';
  ctx.fillText(text, to[0] + (align === 'left' ? 6 : -6), to[1] - (sub ? 7 : 0));
  if (sub) { ctx.fillStyle = C.boneA(0.6); ctx.font = `${size * 0.78}px "IBM Plex Sans", sans-serif`; ctx.fillText(sub, to[0] + (align === 'left' ? 6 : -6), to[1] + 9); }
  ctx.restore();
}

// adornos de esquina rojos (filigrana de la infografía)
export function corners(ctx, w, h, { color = 'rgba(154,31,40,0.55)', size = 90, seed = 2 } = {}) {
  const R = rng(seed);
  const one = (sx, sy, x, y) => {
    ctx.save(); ctx.translate(x, y); ctx.scale(sx, sy);
    for (let k = 0; k < 4; k++) {
      const a = 0.2 + k * 0.32, L = size * (0.5 + R() * 0.6);
      brush(ctx, [[6, 6], [L * 0.5 * Math.cos(a) + 10, L * 0.25 + 12], [L * Math.cos(a), L * Math.sin(a)]], { w: 2.4, color, alpha: 0.9, profile: 'taper', dry: 0.4, seed: seed + k, n: 16 });
    }
    ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(4, size * 1.2); ctx.lineTo(4, 4); ctx.lineTo(size * 1.2, 4); ctx.stroke();
    ctx.restore();
  };
  one(1, 1, 10, 10); one(-1, 1, w - 10, 10); one(1, -1, 10, h - 10); one(-1, -1, w - 10, h - 10);
}

// marco fino (como los recuadros de la infografía)
export function frame(ctx, x, y, w, h, { color = C.boneA(0.35) } = {}) {
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.strokeRect(x, y, w, h); ctx.strokeRect(x + 4, y + 4, w - 8, h - 8); ctx.restore();
}

// la kusarigama dibujada en 2D (para el menú)
export function weapon2d(ctx, x, y, s = 1, { alpha = 1 } = {}) {
  ctx.save(); ctx.globalAlpha = alpha;
  // cadena
  const chain = spline([[x + 10 * s, y + 60 * s], [x - 30 * s, y + 140 * s], [x + 20 * s, y + 210 * s], [x + 40 * s, y + 250 * s]], 40);
  chain.forEach((p, i) => { if (i % 2) return; ctx.strokeStyle = i % 4 ? '#7a1018' : '#3a2425'; ctx.lineWidth = 2.2 * s; ctx.beginPath(); ctx.ellipse(p[0], p[1], 4.5 * s, 7 * s, i * 0.6, 0, Math.PI * 2); ctx.stroke(); });
  // núcleo con pinchos
  const nx = x + 42 * s, ny = y + 268 * s;
  for (let k = 0; k < 14; k++) { const a = (k / 14) * Math.PI * 2; brush(ctx, [[nx, ny], [nx + Math.cos(a) * 26 * s, ny + Math.sin(a) * 26 * s]], { w: 4 * s, color: '#4a1a1c', profile: 'start', dry: 0, seed: k, n: 4 }); }
  const g = ctx.createRadialGradient(nx - 4 * s, ny - 4 * s, 0, nx, ny, 17 * s); g.addColorStop(0, '#e0303a'); g.addColorStop(0.6, '#8a1018'); g.addColorStop(1, '#3a0a0c');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(nx, ny, 16 * s, 0, Math.PI * 2); ctx.fill();
  // mango con vendas
  brush(ctx, [[x + 10 * s, y + 62 * s], [x + 4 * s, y - 40 * s], [x, y - 120 * s]], { w: 10 * s, color: '#2a1a1b', profile: 'even', dry: 0.1, seed: 4, n: 20 });
  for (let k = 0; k < 9; k++) { const yy = y + 50 * s - k * 12 * s; ctx.strokeStyle = 'rgba(139,125,112,0.85)'; ctx.lineWidth = 3 * s; ctx.beginPath(); ctx.moveTo(x + 2 * s + (50 - k * 12) * 0.05 * s, yy); ctx.lineTo(x + 14 * s, yy - 5 * s); ctx.stroke(); }
  // venas
  for (let k = 0; k < 2; k++) { const pts = []; for (let i = 0; i <= 20; i++) pts.push([x + 6 * s + Math.sin(i * 1.3 + k * 3) * 5 * s - i * 0.25 * s, y + 60 * s - i * 9 * s]); line(ctx, pts, { w: 1.4 * s, color: '#e0303a', alpha: 0.8 }); }
  // hoja curva
  const hx = x, hy = y - 122 * s;
  const hg = ctx.createLinearGradient(hx, hy - 60 * s, hx + 170 * s, hy + 40 * s); hg.addColorStop(0, '#5a0a10'); hg.addColorStop(0.5, '#b3121b'); hg.addColorStop(1, '#2a0608');
  ctx.fillStyle = hg;
  ctx.beginPath(); ctx.moveTo(hx - 6 * s, hy + 4 * s); ctx.quadraticCurveTo(hx + 70 * s, hy - 70 * s, hx + 180 * s, hy + 30 * s); ctx.quadraticCurveTo(hx + 80 * s, hy - 30 * s, hx + 4 * s, hy + 22 * s); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(255,90,90,0.8)'; ctx.lineWidth = 1.2 * s; ctx.beginPath(); ctx.moveTo(hx + 4 * s, hy + 22 * s); ctx.quadraticCurveTo(hx + 80 * s, hy - 30 * s, hx + 180 * s, hy + 30 * s); ctx.stroke();
  for (let k = 1; k < 8; k++) { const t = k / 8; const px = hx + t * 150 * s, py = hy - Math.sin(t * Math.PI) * 42 * s - 6 * s; brush(ctx, [[px, py + 6 * s], [px + 6 * s, py - 10 * s]], { w: 3 * s, color: '#3a1012', profile: 'start', dry: 0, seed: k, n: 4 }); }
  // sello del lirio
  ctx.fillStyle = '#2a1a1b'; ctx.beginPath(); ctx.arc(hx + 2 * s, hy + 10 * s, 11 * s, 0, Math.PI * 2); ctx.fill();
  for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; line(ctx, [[hx + 2 * s, hy + 10 * s], [hx + 2 * s + Math.cos(a) * 8 * s, hy + 10 * s + Math.sin(a) * 8 * s]], { w: 1.6 * s, color: '#e0303a' }); }
  ctx.restore();
}

// criaturas: dibujadas una vez con detalle y estampadas (rápido en cada cuadro)
function drawCreature(g, type, col, hi) {
  if (type === 'dragon') {
    // serpiente de hueso: cuerpo ondulado que se afina, cresta de púas, cabeza con cuernos
    const pts = []; for (let i = 0; i <= 40; i++) { const t = i / 40; pts.push([12 + t * 96, 32 + Math.sin(t * Math.PI * 2.2) * 10 * (0.4 + t * 0.6)]); }
    const W = (t) => 7.5 * (1 - t) ** 0.8 + 1;
    const L = [], R = [];
    pts.forEach((p, i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(40, i + 1)]; let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const l = Math.hypot(nx, ny); nx /= l; ny /= l; const w = W(i / 40); L.push([p[0] + nx * w, p[1] + ny * w, nx, ny]); R.push([p[0] - nx * w, p[1] - ny * w]); });
    g.fillStyle = hi ? '#c8141e' : '#d9d2c6';
    g.beginPath(); L.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); for (let i = R.length - 1; i >= 0; i--) g.lineTo(R[i][0], R[i][1]); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(10,8,8,0.9)'; g.lineWidth = 1.1; g.stroke();
    // escamas: anillos
    g.strokeStyle = 'rgba(10,8,8,0.45)'; g.lineWidth = 0.7; for (let i = 3; i < 38; i += 2) { g.beginPath(); g.moveTo(L[i][0], L[i][1]); g.lineTo(R[i][0], R[i][1]); g.stroke(); }
    // púas del lomo
    g.fillStyle = hi ? '#7a0c12' : '#2a2321';
    for (let i = 4; i < 36; i += 3) { const p = L[i]; g.beginPath(); g.moveTo(p[0] - 2, p[1]); g.lineTo(p[0] + p[2] * 6, p[1] + p[3] * 6); g.lineTo(p[0] + 2, p[1]); g.fill(); }
    // garras
    for (const i of [8, 22]) { const p = R[i]; g.strokeStyle = g.fillStyle; g.lineWidth = 1.6; g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(p[0] - 3, p[1] + 7); g.lineTo(p[0] + 1, p[1] + 9); g.stroke(); }
    // cabeza
    const h = pts[0];
    g.fillStyle = hi ? '#c8141e' : '#e6dfd3'; g.beginPath(); g.moveTo(h[0] + 4, h[1] - 7); g.quadraticCurveTo(h[0] - 10, h[1] - 6, h[0] - 12, h[1]); g.quadraticCurveTo(h[0] - 8, h[1] + 7, h[0] + 4, h[1] + 7); g.closePath(); g.fill(); g.strokeStyle = 'rgba(10,8,8,0.9)'; g.lineWidth = 1; g.stroke();
    g.strokeStyle = '#2a2321'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(h[0] + 2, h[1] - 6); g.quadraticCurveTo(h[0] + 8, h[1] - 14, h[0] + 14, h[1] - 13); g.moveTo(h[0], h[1] - 6); g.quadraticCurveTo(h[0] + 3, h[1] - 16, h[0] + 9, h[1] - 18); g.stroke();
    g.fillStyle = '#e0303a'; g.beginPath(); g.arc(h[0] - 4, h[1] - 2, 1.4, 0, 7); g.fill();
  } else if (type === 'oni') {
    g.save(); g.translate(30, 2); g.scale(0.26, 0.26); g.fillStyle = hi ? '#c8141e' : '#cfc8bd'; g.fill(path('oni')); g.strokeStyle = 'rgba(10,8,8,0.9)'; g.lineWidth = 4; g.stroke(path('oni')); g.restore();
    g.fillStyle = '#5a4a40'; g.save(); g.translate(44, 30); g.rotate(-0.5); g.fillRect(-2, -18, 4, 22); g.restore();
    const fg = g.createRadialGradient(18, 22, 0, 18, 22, 12); fg.addColorStop(0, 'rgba(190,215,255,1)'); fg.addColorStop(0.35, 'rgba(74,123,255,0.85)'); fg.addColorStop(1, 'rgba(74,123,255,0)');
    g.fillStyle = fg; g.beginPath(); g.arc(18, 22, 12, 0, 7); g.fill();
  } else if (type === 'yokai') {
    const gg = g.createRadialGradient(30, 22, 0, 30, 24, 22); gg.addColorStop(0, hi ? 'rgba(224,48,58,0.85)' : 'rgba(235,230,222,0.75)'); gg.addColorStop(0.6, hi ? 'rgba(160,20,30,0.4)' : 'rgba(210,205,198,0.3)'); gg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gg; g.beginPath(); g.moveTo(30, 6); g.bezierCurveTo(44, 6, 46, 24, 42, 34); g.quadraticCurveTo(38, 44, 32, 52); g.quadraticCurveTo(30, 40, 22, 44); g.quadraticCurveTo(26, 36, 18, 34); g.bezierCurveTo(14, 22, 18, 6, 30, 6); g.fill();
    g.strokeStyle = 'rgba(235,230,222,0.5)'; g.lineWidth = 0.8; g.stroke();
    g.fillStyle = '#e0303a'; g.beginPath(); g.ellipse(26, 20, 2, 1.4, 0.2, 0, 7); g.ellipse(34, 20, 2, 1.4, -0.2, 0, 7); g.fill();
  } else {
    // kappa visto desde arriba: caparazón con placas, cabeza con el plato de agua
    g.fillStyle = hi ? '#c8141e' : '#8d938c'; g.beginPath(); g.ellipse(30, 26, 15, 12, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(10,8,8,0.9)'; g.lineWidth = 1; g.stroke();
    g.strokeStyle = 'rgba(10,8,8,0.5)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(30, 15); g.lineTo(30, 37); g.moveTo(17, 26); g.lineTo(43, 26); g.ellipse(30, 26, 7, 6, 0, 0, 7); g.stroke();
    g.fillStyle = hi ? '#c8141e' : '#a7ada5'; g.beginPath(); g.arc(48, 24, 6, 0, 7); g.fill(); g.stroke();
    g.fillStyle = '#e6e0d6'; g.beginPath(); g.ellipse(48, 22, 3.6, 2.2, 0, 0, 7); g.fill();
    for (const [x, y] of [[18, 16], [18, 36], [40, 15], [40, 37]]) { g.fillStyle = hi ? '#7a0c12' : '#6c726b'; g.beginPath(); g.ellipse(x, y, 3.4, 2.2, 0.6, 0, 7); g.fill(); }
  }
}
const CBOX = { dragon: [120, 64], oni: [60, 56], yokai: [60, 56], kappa: [60, 52] };
export function creatureSprite(type, hi = false) { const [w, h] = CBOX[type]; return cached(`cr-${type}-${hi}`, w, h, (g) => drawCreature(g, type, null, hi), 3); }
export function creature(ctx, type, x, y, s = 1, { alpha = 1, hi = false, ang = 0 } = {}) {
  const spr = creatureSprite(type, hi);
  const k = type === 'dragon' ? 0.42 : 0.5;
  ctx.save(); ctx.globalAlpha *= alpha; stamp(ctx, spr, x, y, s * k, ang); ctx.restore();
}

// ---------- gráficas: un mismo estilo de tarjeta para todas ----------
export function chartCard(ctx, x, y, w, h, title, sub = '') {
  ctx.save();
  ctx.fillStyle = 'rgba(11,8,8,0.84)'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = C.boneA(0.22); ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.strokeStyle = C.boneA(0.1); ctx.strokeRect(x + 5.5, y + 5.5, w - 11, h - 11);
  ctx.strokeStyle = 'rgba(200,24,34,0.85)'; ctx.lineWidth = 2;
  const k = 12; ctx.beginPath(); ctx.moveTo(x, y + k); ctx.lineTo(x, y); ctx.lineTo(x + k, y); ctx.moveTo(x + w - k, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - k); ctx.stroke();
  ctx.fillStyle = '#efe9e1'; ctx.font = '600 15px "Shippori Mincho B1", serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillText(title, x + 18, y + 28);
  if (sub) { ctx.fillStyle = C.boneA(0.5); ctx.font = '500 9.5px "IBM Plex Sans", sans-serif'; if ('letterSpacing' in ctx) ctx.letterSpacing = '1.5px'; ctx.fillText(sub.toUpperCase(), x + 18, y + 44); if ('letterSpacing' in ctx) ctx.letterSpacing = '0px'; }
  ctx.restore();
}
export function axisLabel(ctx, text, x, y, align = 'center') {
  ctx.save(); ctx.fillStyle = C.boneA(0.55); ctx.font = '500 10px "IBM Plex Sans", sans-serif'; ctx.textAlign = align; ctx.fillText(text, x, y); ctx.restore();
}

// la kusarigama y el lirio como sprites (para dibujarlos en cada cuadro sin costo)
export const weaponSprite = () => cached('weapon2d', 240, 500, (g) => weapon2d(g, 40, 200, 1), 2);
export function weaponAt(ctx, x, y, s = 1, ang = 0, alpha = 1) { ctx.save(); ctx.globalAlpha *= alpha; stamp(ctx, weaponSprite(), x, y, s, ang, 40 / 240, 200 / 500); ctx.restore(); }
export const lilySprite = (sc = 0.4) => cached('lily-' + sc, 240 * sc, 200 * sc, (g) => lily(g, 120 * sc, 110 * sc, sc, { stem: 0, seed: 6 }), 3);
