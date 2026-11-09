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
// Kenji / persona: silueta de tinta con kimono y hakama. dir = 1 mira a la derecha.
export function figure(ctx, x, y, h, { color = C.ink(0.95), rim = C.boneA(0.35), dir = 1, kneel = false, hat = false, staff = false, mark = false, hair = true, lean = 0 } = {}) {
  const s = h / 170;
  ctx.save(); ctx.translate(x, y); ctx.scale(dir * s, s); ctx.rotate(lean);
  ctx.fillStyle = color;
  const P = new Path2D();
  let top;
  if (kneel) {
    // seiza: piernas dobladas, base ancha
    top = -96;
    P.moveTo(-38, 0); P.quadraticCurveTo(-46, -14, -30, -24); P.bezierCurveTo(-26, -46, -22, -70, -18, top + 6);
    P.quadraticCurveTo(-14, top - 2, -6, top - 4); P.lineTo(8, top - 4); P.quadraticCurveTo(18, top - 2, 20, top + 6);
    P.bezierCurveTo(24, -70, 30, -50, 34, -30); P.quadraticCurveTo(54, -20, 52, 0); P.closePath();
  } else {
    top = -132;
    // hakama con la abertura entre las piernas
    P.moveTo(-30, 0); P.bezierCurveTo(-26, -24, -22, -52, -19, -74); P.lineTo(-17, top + 22);
    P.quadraticCurveTo(-18, top + 6, -10, top + 2); P.lineTo(10, top + 2); P.quadraticCurveTo(18, top + 6, 17, top + 22);
    P.lineTo(19, -74); P.bezierCurveTo(22, -52, 26, -24, 32, 0); P.lineTo(6, 0); P.lineTo(2, -38); P.lineTo(-2, 0); P.closePath();
  }
  ctx.fill(P);
  // mangas anchas
  const S = new Path2D();
  S.moveTo(12, top + 6); S.bezierCurveTo(30, top + 14, 34, top + 40, 30, top + 64); S.quadraticCurveTo(22, top + 70, 14, top + 62); S.lineTo(15, top + 24); S.closePath();
  S.moveTo(-12, top + 6); S.bezierCurveTo(-30, top + 16, -33, top + 42, -28, top + 66); S.quadraticCurveTo(-20, top + 71, -13, top + 62); S.lineTo(-15, top + 24); S.closePath();
  ctx.fill(S);
  // cuello, cabeza y pelo
  ctx.beginPath(); ctx.moveTo(-5, top + 3); ctx.lineTo(-4, top - 8); ctx.lineTo(5, top - 8); ctx.lineTo(6, top + 3); ctx.fill();
  ctx.beginPath(); ctx.ellipse(1, top - 20, 11.5, 13.5, 0.05, 0, Math.PI * 2); ctx.fill();
  if (hair) { ctx.beginPath(); ctx.moveTo(-12, top - 18); ctx.quadraticCurveTo(-16, top - 36, -2, top - 36); ctx.lineTo(4, top - 44); ctx.lineTo(7, top - 35); ctx.quadraticCurveTo(15, top - 33, 13, top - 20); ctx.lineTo(9, top - 27); ctx.lineTo(3, top - 24); ctx.lineTo(-4, top - 28); ctx.closePath(); ctx.fill(); }
  if (hat) { ctx.beginPath(); ctx.moveTo(-36, top - 18); ctx.quadraticCurveTo(1, top - 58, 38, top - 18); ctx.quadraticCurveTo(1, top - 26, -36, top - 18); ctx.fill(); }
  if (staff) { ctx.save(); ctx.translate(30, top + 40); ctx.rotate(-0.05); ctx.fillRect(-1.7, -60, 3.4, (kneel ? 60 : 92) + 60); ctx.restore(); }
  // obi (faja) y borde de luz
  if (rim) {
    ctx.strokeStyle = rim; ctx.lineWidth = 1.3 / s; ctx.stroke(P); ctx.stroke(S);
    ctx.beginPath(); ctx.ellipse(1, top - 20, 11.5, 13.5, 0.05, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.moveTo(-17, top + 40); ctx.lineTo(18, top + 40); ctx.moveTo(-17, top + 46); ctx.lineTo(18, top + 46); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-8, top + 4); ctx.lineTo(3, top + 26); ctx.lineTo(9, top + 4); ctx.stroke(); ctx.globalAlpha = 1;
  }
  if (mark) {
    const g = ctx.createRadialGradient(7, top - 4, 0, 7, top - 4, 13);
    g.addColorStop(0, 'rgba(255,70,70,1)'); g.addColorStop(0.35, 'rgba(210,20,30,0.85)'); g.addColorStop(1, 'rgba(200,20,30,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(7, top - 4, 13, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
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

// iconos de criaturas en tinta (para el mapa y el ensō)
export function creature(ctx, type, x, y, s = 1, { alpha = 1, color = C.bone, hi = false, ang = 0 } = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(s, s); ctx.globalAlpha = alpha;
  const col = hi ? '#e0303a' : color;
  if (type === 'dragon') {
    brush(ctx, [[-22, 4], [-10, -6], [2, 5], [14, -4], [24, 0]], { w: 6, color: col, profile: 'end', dry: 0.2, seed: 5, n: 24 });
    brush(ctx, [[0, 0], [-4, -14], [10, -18]], { w: 3, color: col, alpha: 0.7, profile: 'start', dry: 0.3, seed: 6, n: 8 });
    brush(ctx, [[0, 2], [-6, 14], [8, 18]], { w: 3, color: col, alpha: 0.7, profile: 'start', dry: 0.3, seed: 7, n: 8 });
  } else if (type === 'oni') {
    ctx.fillStyle = hi ? col : C.boneA(0.85); ctx.beginPath(); ctx.ellipse(0, 2, 6, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-4, -6); ctx.lineTo(-6, -13); ctx.lineTo(-1, -7); ctx.moveTo(4, -6); ctx.lineTo(6, -13); ctx.lineTo(1, -7); ctx.fill();
    const g = ctx.createRadialGradient(10, -6, 0, 10, -6, 9); g.addColorStop(0, 'rgba(150,185,255,1)'); g.addColorStop(0.4, 'rgba(74,123,255,0.8)'); g.addColorStop(1, 'rgba(74,123,255,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(10, -6, 9, 0, Math.PI * 2); ctx.fill();
  } else if (type === 'yokai') {
    const g = ctx.createRadialGradient(0, -2, 0, 0, 0, 13); g.addColorStop(0, hi ? 'rgba(224,48,58,0.8)' : 'rgba(225,220,212,0.6)'); g.addColorStop(1, 'rgba(225,220,212,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, 9, 13, 0, 0, Math.PI * 2); ctx.fill();
    brush(ctx, [[0, 6], [-4, 14], [3, 22]], { w: 4, color: col, alpha: 0.4, profile: 'start', dry: 0.5, seed: 8, n: 8 });
    ctx.fillStyle = '#e0303a'; ctx.beginPath(); ctx.arc(-2.5, -2, 1.3, 0, 7); ctx.arc(2.5, -2, 1.3, 0, 7); ctx.fill();
  } else {
    ctx.fillStyle = hi ? col : 'rgba(150,155,150,0.9)'; ctx.beginPath(); ctx.ellipse(0, 0, 8, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = C.boneA(0.8); ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(0, -5, 3.5, 1.6, 0, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
}
