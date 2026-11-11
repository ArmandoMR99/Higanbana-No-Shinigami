// Escenografía a tinta: casas minka, pinos, torii, faroles de piedra, tumbas, fardos de arroz,
// juncos, cordilleras con textura de pincel y niebla. Todo se pinta una vez en capas estáticas.
import { C, rng, noise1, fbm, brush, line, wash, mountains, spline } from './brush.js';

const L = (a) => `rgba(222,214,204,${a})`;

// ---------- cordillera con textura (trazos «cun» de la pintura sumi-e) ----------
export function range(ctx, o) {
  const pts = mountains(ctx, o);
  const R = rng(o.seed * 7 + 1), tex = o.texture ?? 0.5;
  if (tex > 0) {
    ctx.save();
    for (let i = 4; i < pts.length - 4; i += 3) {
      const [x, y] = pts[i], slope = pts[i + 2][1] - pts[i - 2][1];
      if (R() > 0.55) continue;
      const n = 2 + Math.floor(R() * 3);
      for (let k = 0; k < n; k++) {
        const d = 6 + R() * 40, len = 8 + R() * 22;
        const sx = x + (R() - 0.5) * 10, sy = y + d;
        brush(ctx, [[sx, sy], [sx - Math.sign(slope || 1) * len * 0.5, sy + len * 0.6]], { w: 1.2 + R() * 1.6, color: o.texColor || 'rgba(205,198,190,1)', alpha: tex * (0.12 + R() * 0.14) * (1 - d / 60), profile: 'taper', dry: 0.7, seed: i * 3 + k, n: 6 });
      }
    }
    ctx.restore();
  }
  return pts;
}

// banda de niebla horizontal
export function mistBand(ctx, x0, x1, y, h, a = 0.14, seed = 1) {
  const R = rng(seed);
  for (let i = 0; i < 9; i++) { const cx = x0 + R() * (x1 - x0), r = h * (1.2 + R() * 1.8); const g = ctx.createRadialGradient(cx, y, 0, cx, y, r); g.addColorStop(0, `rgba(180,172,165,${a})`); g.addColorStop(1, 'rgba(180,172,165,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx, y, r, h, 0, 0, 7); ctx.fill(); }
}

// ---------- pino japonés: tronco torcido y copas en almohadillas ----------
export function pine(ctx, x, y, h, { seed = 1, alpha = 1, snow = 0, tone = '#0b0909', rim = 0.45, lean = 0 } = {}) {
  const R = rng(seed);
  ctx.save(); ctx.globalAlpha *= alpha;
  const pts = [[x, y]]; let cx = x;
  for (let i = 1; i <= 5; i++) { cx += (R() - 0.5) * h * 0.12 + lean * h * 0.05; pts.push([cx, y - h * i / 5 * 0.82]); }
  brush(ctx, pts, { w: h * 0.07, color: tone, alpha: 1, profile: 'start', dry: 0.15, seed, n: 30 });
  brush(ctx, pts.map((p) => [p[0] + h * 0.018, p[1]]), { w: h * 0.012, color: L(1), alpha: rim * 0.5, profile: 'start', dry: 0.8, seed: seed + 1, n: 30 });
  // ramas y copas
  const pads = 4 + Math.floor(R() * 3);
  for (let k = 0; k < pads; k++) {
    const t = 0.35 + (k / pads) * 0.62, b = spline(pts, 30)[Math.floor(t * 30)] || pts[pts.length - 1];
    const dir = k % 2 ? 1 : -1, len = h * (0.22 + R() * 0.2) * (1.1 - t * 0.5);
    const end = [b[0] + dir * len, b[1] - len * 0.15 + (R() - 0.5) * 8];
    brush(ctx, [b, [b[0] + dir * len * 0.5, b[1] + 4], end], { w: h * 0.022, color: tone, profile: 'start', dry: 0.2, seed: seed + k * 5, n: 12 });
    pad(ctx, end[0], end[1] - 3, len * 0.75, len * 0.28, { seed: seed + k * 11, tone, rim, snow });
  }
  pad(ctx, pts[pts.length - 1][0], pts[pts.length - 1][1] - 4, h * 0.2, h * 0.08, { seed: seed + 99, tone, rim, snow });
  ctx.restore();
}
function pad(ctx, x, y, rx, ry, { seed, tone, rim, snow }) {
  // copa: racimo de mechones de agujas (no un disco)
  const R = rng(seed), n = Math.max(4, Math.round(rx / 5));
  const blobs = [];
  for (let i = 0; i < n; i++) { const t = i / (n - 1) - 0.5; blobs.push([x + t * rx * 1.7 + (R() - 0.5) * rx * 0.15, y + (R() - 0.3) * ry * 0.7 + Math.abs(t) * ry * 0.5, rx * (0.24 + R() * 0.12), ry * (0.55 + R() * 0.3)]); }
  ctx.fillStyle = tone;
  for (const [bx, by, br, bh] of blobs) { ctx.beginPath(); ctx.ellipse(bx, by, br, bh, 0, 0, 7); ctx.fill(); }
  ctx.strokeStyle = tone; ctx.lineCap = 'round';
  for (const [bx, by, br, bh] of blobs) for (let k = 0; k < br * 1.4; k++) { const a = Math.PI * (1.05 + R() * 0.9), px = bx + Math.cos(a) * br * 0.9, py = by + Math.sin(a) * bh * 0.9; ctx.lineWidth = Math.max(0.5, br * 0.05); ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + Math.cos(a) * br * 0.35, py + Math.sin(a) * bh * 0.5); ctx.stroke(); }
  ctx.strokeStyle = L(rim); ctx.lineWidth = Math.max(0.5, rx * 0.012);
  for (const [bx, by, br, bh] of blobs) { ctx.beginPath(); ctx.ellipse(bx, by - 0.5, br * 0.92, bh * 0.9, 0, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); }
  ctx.strokeStyle = L(rim * 0.35); ctx.lineWidth = 0.5;
  for (const [bx, by, br, bh] of blobs) for (let k = 0; k < 5; k++) { const px = bx + (R() - 0.5) * br * 1.2, py = by - bh * 0.4 + R() * bh * 0.4; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + 2 + R() * 3, py - 1 - R() * 2); ctx.stroke(); }
  if (snow) { ctx.fillStyle = `rgba(236,232,226,${0.85 * snow})`; for (const [bx, by, br, bh] of blobs) { ctx.beginPath(); ctx.ellipse(bx, by - bh * 0.35, br * 0.9, bh * 0.55, 0, Math.PI, 0); ctx.fill(); } }
}

// ---------- casa minka (alzado): zócalo de piedra, postes, shoji, techo de paja o teja ----------
export function minka(ctx, x, y, w, { h = w * 0.78, roof = 'thatch', lit = 0, burn = 0, snow = 0, seed = 1, tone = '#0e0b0b', rim = 0.5, glow = 'rgba(232,222,205,' } = {}) {
  const R = rng(seed), wallH = h * 0.42, x0 = x - w / 2, x1 = x + w / 2;
  ctx.save();
  // zócalo
  ctx.fillStyle = '#1c1716'; ctx.fillRect(x0 - 2, y - 5, w + 4, 5);
  for (let sx = x0; sx < x1; sx += 7 + R() * 5) { ctx.strokeStyle = L(0.15); ctx.lineWidth = 0.6; ctx.strokeRect(sx, y - 5, 6, 5); }
  // muro con postes y paneles
  ctx.fillStyle = tone; ctx.fillRect(x0, y - wallH - 5, w, wallH);
  const bays = Math.max(3, Math.round(w / 26));
  for (let b = 0; b < bays; b++) {
    const bx = x0 + (b / bays) * w, bw = w / bays, top = y - wallH - 5;
    const shoji = b % 3 !== 0;
    if (shoji) {
      if (lit > 0 && !burn) { const g = ctx.createLinearGradient(0, top, 0, y - 5); g.addColorStop(0, glow + 0.18 * lit + ')'); g.addColorStop(1, glow + 0.42 * lit + ')'); ctx.fillStyle = g; ctx.fillRect(bx + 2, top + 3, bw - 4, wallH - 6); }
      else { ctx.fillStyle = 'rgba(190,182,172,0.08)'; ctx.fillRect(bx + 2, top + 3, bw - 4, wallH - 6); }
      ctx.strokeStyle = lit > 0 && !burn ? 'rgba(20,14,12,0.7)' : L(0.14); ctx.lineWidth = 0.6;
      for (let gx = 1; gx < 3; gx++) { ctx.beginPath(); ctx.moveTo(bx + 2 + gx * (bw - 4) / 3, top + 3); ctx.lineTo(bx + 2 + gx * (bw - 4) / 3, y - 8); ctx.stroke(); }
      for (let gy = 1; gy < 5; gy++) { ctx.beginPath(); ctx.moveTo(bx + 2, top + 3 + gy * (wallH - 6) / 5); ctx.lineTo(bx + bw - 2, top + 3 + gy * (wallH - 6) / 5); ctx.stroke(); }
    } else { ctx.strokeStyle = L(0.08); ctx.lineWidth = 0.6; for (let k = 1; k < 5; k++) { ctx.beginPath(); ctx.moveTo(bx + 2, top + k * wallH / 5); ctx.lineTo(bx + bw - 2, top + k * wallH / 5); ctx.stroke(); } }
    ctx.fillStyle = '#060404'; ctx.fillRect(bx - 1.5, top, 3, wallH);
  }
  ctx.fillStyle = '#060404'; ctx.fillRect(x1 - 1.5, y - wallH - 5, 3, wallH); ctx.fillRect(x0 - 2, y - wallH - 8, w + 4, 4);
  // engawa (corredor)
  ctx.fillStyle = '#151110'; ctx.fillRect(x0 - 4, y - 9, w + 8, 3); ctx.strokeStyle = L(rim * 0.5); ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(x0 - 4, y - 9); ctx.lineTo(x1 + 4, y - 9); ctx.stroke();
  // techo
  const eaveY = y - wallH - 6, ridgeY = y - h, ov = w * (roof === 'thatch' ? 0.1 : 0.08);
  const roofP = new Path2D();
  if (roof === 'thatch') { roofP.moveTo(x0 - ov, eaveY + 2); roofP.lineTo(x0 - ov * 0.6, eaveY - 5); roofP.quadraticCurveTo(x - w * 0.36, ridgeY + h * 0.12, x - w * 0.24, ridgeY); roofP.lineTo(x + w * 0.24, ridgeY); roofP.quadraticCurveTo(x + w * 0.36, ridgeY + h * 0.12, x1 + ov * 0.6, eaveY - 5); roofP.lineTo(x1 + ov, eaveY + 2); roofP.closePath(); }
  else { roofP.moveTo(x0 - ov, eaveY - 2); roofP.quadraticCurveTo(x - w * 0.3, eaveY - 4, x - w * 0.18, ridgeY + 4); roofP.lineTo(x + w * 0.18, ridgeY + 4); roofP.quadraticCurveTo(x + w * 0.3, eaveY - 4, x1 + ov, eaveY - 2); roofP.lineTo(x1 + ov * 1.1, eaveY + 3); roofP.lineTo(x0 - ov * 1.1, eaveY + 3); roofP.closePath(); }
  ctx.fillStyle = roof === 'thatch' ? '#1a1412' : '#110d0d'; ctx.fill(roofP);
  ctx.save(); ctx.clip(roofP);
  if (roof === 'thatch') { ctx.strokeStyle = L(0.1); ctx.lineWidth = 0.7; for (let i = 0; i < w * 2.2; i++) { const px = x0 - ov + R() * (w + ov * 2), py = ridgeY + R() * (eaveY - ridgeY); ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + (px - x) * 0.04, py + 4 + R() * 6); ctx.stroke(); } ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0 - ov, eaveY - 1); ctx.lineTo(x1 + ov, eaveY - 1); ctx.stroke(); }
  else { ctx.strokeStyle = L(0.1); ctx.lineWidth = 0.6; for (let k = 1; k < 6; k++) { const yy = ridgeY + (eaveY - ridgeY) * k / 6; ctx.beginPath(); ctx.moveTo(x0 - ov, yy); ctx.quadraticCurveTo(x, yy + 2, x1 + ov, yy); ctx.stroke(); } for (let px = x0 - ov; px < x1 + ov; px += 5) { ctx.beginPath(); ctx.moveTo(px, ridgeY); ctx.lineTo(px + (px - x) * 0.12, eaveY); ctx.stroke(); } }
  const sh = ctx.createLinearGradient(x0, 0, x1, 0); sh.addColorStop(0, 'rgba(0,0,0,0.35)'); sh.addColorStop(0.6, 'rgba(0,0,0,0)'); sh.addColorStop(1, L(0.05)); ctx.fillStyle = sh; ctx.fillRect(x0 - ov, ridgeY, w + ov * 2, eaveY - ridgeY + 4);
  if (snow) { ctx.fillStyle = `rgba(232,228,222,${0.72 * snow})`; ctx.beginPath(); ctx.moveTo(x0 - ov, eaveY - 2); ctx.quadraticCurveTo(x - w * 0.36, ridgeY + h * 0.14, x - w * 0.24, ridgeY - 1); ctx.lineTo(x + w * 0.24, ridgeY - 1); ctx.quadraticCurveTo(x + w * 0.36, ridgeY + h * 0.14, x1 + ov, eaveY - 2); ctx.lineTo(x1 + ov, eaveY - 8); ctx.quadraticCurveTo(x, ridgeY + (eaveY - ridgeY) * 0.5, x0 - ov, eaveY - 8); ctx.closePath(); ctx.fill(); }
  ctx.restore();
  ctx.strokeStyle = L(rim); ctx.lineWidth = 0.9; ctx.stroke(roofP);
  // cumbrera
  ctx.fillStyle = '#060404'; ctx.fillRect(x - w * 0.26, ridgeY - 4, w * 0.52, 5); if (roof === 'thatch') { ctx.strokeStyle = '#060404'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - w * 0.27, ridgeY - 10); ctx.lineTo(x - w * 0.21, ridgeY); ctx.moveTo(x + w * 0.27, ridgeY - 10); ctx.lineTo(x + w * 0.21, ridgeY); ctx.stroke(); }
  ctx.strokeStyle = L(rim * 0.8); ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(x - w * 0.26, ridgeY - 4); ctx.lineTo(x + w * 0.26, ridgeY - 4); ctx.stroke();
  if (burn > 0) { ctx.fillStyle = `rgba(0,0,0,${0.62 * burn})`; ctx.fill(roofP); ctx.fillRect(x0, y - wallH - 8, w, wallH + 8); ctx.fillStyle = '#030202'; ctx.beginPath(); ctx.moveTo(x - w * 0.1, ridgeY); ctx.lineTo(x + w * 0.02, eaveY - 6); ctx.lineTo(x + w * 0.2, ridgeY + 6); ctx.lineTo(x + w * 0.12, ridgeY); ctx.fill(); burnt(ctx, x, y, w, h, burn, seed); }
  ctx.restore();
}
// casa quemada: postes negros, techo roto, brasas
function burnt(ctx, x, y, w, h, b, seed) {
  const R = rng(seed + 3);
  for (let k = 0; k < 10 * b; k++) { ctx.fillStyle = `rgba(235,${40 + R() * 40 | 0},45,${0.5 + R() * 0.5})`; ctx.beginPath(); ctx.arc(x - w / 2 + R() * w, y - 6 - R() * h * 0.5, 0.8 + R() * 1.4, 0, 7); ctx.fill(); }
}

// ruina: armazón quemado de una casa
export function ruin(ctx, x, y, w, { seed = 1, embers = 1, rim = 0.35 } = {}) {
  const R = rng(seed), h = w * 0.7;
  ctx.save();
  ctx.fillStyle = 'rgba(6,4,4,0.92)'; ctx.beginPath(); ctx.ellipse(x, y, w * 0.62, 7, 0, 0, 7); ctx.fill();
  const posts = [-0.45, -0.15, 0.15, 0.45].map((f) => [x + f * w, h * (0.35 + R() * 0.65)]);
  for (const [px, ph] of posts) { brush(ctx, [[px, y], [px + (R() - 0.5) * 8, y - ph]], { w: 6 + R() * 3, color: '#090707', profile: 'even', dry: 0.25, seed: px | 0, n: 8 }); brush(ctx, [[px + 2.5, y], [px + 2, y - ph]], { w: 1, color: L(1), alpha: rim, profile: 'even', dry: 0.7, seed: (px | 0) + 2, n: 8 }); }
  brush(ctx, [[x - w * 0.55, y - h * 0.62], [x - w * 0.1, y - h * (0.8 + R() * 0.2)], [x + w * 0.3, y - h * 0.5]], { w: 5, color: '#090707', profile: 'taper', dry: 0.2, seed: seed + 7, n: 12 });
  brush(ctx, [[x + w * 0.1, y - h * 0.4], [x + w * 0.55, y - 4]], { w: 4, color: '#090707', profile: 'even', dry: 0.3, seed: seed + 9, n: 8 });
  for (let k = 0; k < 14; k++) { const bx = x - w * 0.5 + R() * w; brush(ctx, [[bx, y - 1], [bx + (R() - 0.5) * 20, y - 3 - R() * 6]], { w: 2 + R() * 2, color: '#0b0808', profile: 'even', dry: 0.3, seed: k + seed, n: 4 }); }
  for (let k = 0; k < 16 * embers; k++) { ctx.fillStyle = `rgba(235,${40 + R() * 40 | 0},45,${0.4 + R() * 0.6})`; ctx.beginPath(); ctx.arc(x - w / 2 + R() * w, y - 2 - R() * 8, 0.8 + R() * 1.6, 0, 7); ctx.fill(); }
  ctx.restore();
}

// ---------- torii ----------
export function torii(ctx, x, y, h, { color = '#8e1a22', rim = 0.5, alpha = 1 } = {}) {
  const w = h * 0.95;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.fillStyle = color;
  for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + s * w * 0.32 - h * 0.035, y); ctx.lineTo(x + s * w * 0.3 - h * 0.03, y - h * 0.86); ctx.lineTo(x + s * w * 0.3 + h * 0.03, y - h * 0.86); ctx.lineTo(x + s * w * 0.32 + h * 0.035, y); ctx.fill(); ctx.fillStyle = '#0b0808'; ctx.fillRect(x + s * w * 0.32 - h * 0.045, y - h * 0.08, h * 0.09, h * 0.08); ctx.fillStyle = color; }
  ctx.fillRect(x - w * 0.42, y - h * 0.72, w * 0.84, h * 0.055);
  ctx.fillStyle = '#0b0808'; ctx.beginPath(); ctx.moveTo(x - w * 0.56, y - h * 0.9); ctx.quadraticCurveTo(x, y - h * 0.86, x + w * 0.56, y - h * 0.9); ctx.lineTo(x + w * 0.6, y - h * 0.97); ctx.quadraticCurveTo(x, y - h * 0.92, x - w * 0.6, y - h * 0.97); ctx.closePath(); ctx.fill();
  ctx.fillStyle = color; ctx.fillRect(x - w * 0.5, y - h * 0.88, w, h * 0.05);
  ctx.fillRect(x - h * 0.025, y - h * 0.86, h * 0.05, h * 0.15);
  ctx.strokeStyle = L(rim); ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x - w * 0.6, y - h * 0.97); ctx.quadraticCurveTo(x, y - h * 0.92, x + w * 0.6, y - h * 0.97); ctx.stroke();
  ctx.restore();
}

// ---------- farol de piedra (tōrō) ----------
export function lantern(ctx, x, y, h, { lit = 0, rim = 0.45 } = {}) {
  const u = h / 100;
  ctx.save(); ctx.fillStyle = '#141010';
  const box = (cx, cy, w, hh) => { ctx.fillRect(cx - w / 2, cy - hh, w, hh); ctx.strokeStyle = L(rim * 0.6); ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(cx + w / 2, cy - hh); ctx.lineTo(cx + w / 2, cy); ctx.stroke(); };
  box(x, y, 34 * u, 8 * u); box(x, y - 8 * u, 10 * u, 34 * u); box(x, y - 42 * u, 28 * u, 7 * u); box(x, y - 49 * u, 22 * u, 20 * u);
  if (lit) { const g = ctx.createRadialGradient(x, y - 59 * u, 0, x, y - 59 * u, 30 * u); g.addColorStop(0, `rgba(240,200,150,${0.6 * lit})`); g.addColorStop(1, 'rgba(240,200,150,0)'); ctx.fillStyle = g; ctx.fillRect(x - 30 * u, y - 89 * u, 60 * u, 60 * u); ctx.fillStyle = `rgba(250,225,180,${0.85 * lit})`; ctx.fillRect(x - 6 * u, y - 66 * u, 12 * u, 12 * u); ctx.fillStyle = '#141010'; }
  else { ctx.fillStyle = '#050303'; ctx.fillRect(x - 6 * u, y - 66 * u, 12 * u, 12 * u); ctx.fillStyle = '#141010'; }
  ctx.beginPath(); ctx.moveTo(x - 26 * u, y - 69 * u); ctx.quadraticCurveTo(x - 10 * u, y - 72 * u, x, y - 84 * u); ctx.quadraticCurveTo(x + 10 * u, y - 72 * u, x + 26 * u, y - 69 * u); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = L(rim); ctx.lineWidth = 0.8; ctx.stroke();
  ctx.beginPath(); ctx.arc(x, y - 87 * u, 3.5 * u, 0, 7); ctx.fill();
  ctx.restore();
}

// ---------- tumbas (haka) ----------
export function grave(ctx, x, y, h, { seed = 1, rim = 0.4 } = {}) {
  const R = rng(seed), w = h * (0.28 + R() * 0.08), tilt = (R() - 0.5) * 0.08;
  ctx.save(); ctx.translate(x, y); ctx.rotate(tilt);
  ctx.fillStyle = '#121010'; ctx.fillRect(-w * 0.9, -h * 0.12, w * 1.8, h * 0.12); ctx.fillRect(-w * 0.7, -h * 0.22, w * 1.4, h * 0.1); ctx.fillRect(-w / 2, -h, w, h * 0.78);
  ctx.strokeStyle = L(rim); ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(w / 2, -h); ctx.lineTo(w / 2, -h * 0.22); ctx.moveTo(-w / 2, -h); ctx.lineTo(w / 2, -h); ctx.stroke();
  ctx.strokeStyle = L(rim * 0.45); ctx.lineWidth = 0.8; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(-1, -h * 0.9 + k * h * 0.14); ctx.lineTo(2, -h * 0.84 + k * h * 0.14); ctx.stroke(); }
  // sotoba (tablillas) detrás
  if (R() < 0.6) for (let k = 0; k < 2; k++) { ctx.fillStyle = '#1b1615'; ctx.fillRect(w * 0.6 + k * 5, -h * 1.25, 3, h * 1.1); }
  ctx.restore();
}

// ---------- fardos de arroz (tawara) ----------
export function bale(ctx, x, y, r, { rim = 0.3, seed = 1 } = {}) {
  // fardo tumbado: cuerpo, tapa de un lado y cuerdas
  const R = rng(seed), L2 = r * 1.6;
  ctx.save();
  ctx.fillStyle = '#211a17'; ctx.beginPath(); ctx.moveTo(x - L2, y - r); ctx.lineTo(x + L2, y - r); ctx.ellipse(x + L2, y, r * 0.35, r, 0, -Math.PI / 2, Math.PI / 2); ctx.lineTo(x - L2, y + r); ctx.ellipse(x - L2, y, r * 0.35, r, 0, Math.PI / 2, Math.PI * 1.5); ctx.fill();
  ctx.save(); ctx.clip(); ctx.strokeStyle = L(0.1); ctx.lineWidth = 0.6; for (let i = 0; i < r * 8; i++) { const px = x - L2 + R() * L2 * 2, py = y - r + R() * r * 2; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + 5 + R() * 4, py + (R() - 0.5)); ctx.stroke(); }
  const gr = ctx.createLinearGradient(0, y - r, 0, y + r); gr.addColorStop(0, L(0.1)); gr.addColorStop(0.5, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.5)'); ctx.fillStyle = gr; ctx.fillRect(x - L2 - r, y - r, L2 * 2 + r * 2, r * 2); ctx.restore();
  ctx.fillStyle = '#2b2320'; ctx.beginPath(); ctx.ellipse(x + L2, y, r * 0.35, r, 0, 0, 7); ctx.fill(); ctx.strokeStyle = L(0.12); ctx.lineWidth = 0.5; for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.ellipse(x + L2, y, r * 0.35 * k / 4, r * k / 4, 0, 0, 7); ctx.stroke(); }
  ctx.strokeStyle = '#0a0706'; ctx.lineWidth = Math.max(1, r * 0.1);
  for (const f of [-0.55, 0, 0.55]) { ctx.beginPath(); ctx.ellipse(x + f * L2, y, r * 0.3, r, 0, -Math.PI / 2, Math.PI / 2); ctx.stroke(); }
  ctx.strokeStyle = L(rim); ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x - L2, y - r); ctx.lineTo(x + L2, y - r); ctx.stroke();
  ctx.restore();
}

// ---------- juncos y hierba ----------
export function reeds(ctx, x0, x1, y, h, { seed = 1, n = 60, alpha = 0.5, color = 'rgba(205,198,190,1)', dark = false } = {}) {
  const R = rng(seed);
  for (let i = 0; i < n; i++) {
    const x = x0 + R() * (x1 - x0), hh = h * (0.4 + R() * 0.7), bend = (R() - 0.3) * hh * 0.3;
    brush(ctx, [[x, y + R() * 6], [x + bend * 0.3, y - hh * 0.55], [x + bend, y - hh]], { w: 1.4 + R() * 1.6, color: dark ? '#080606' : color, alpha: dark ? 0.95 : alpha * (0.4 + R() * 0.6), profile: 'start', dry: 0.4, seed: i + seed * 31, n: 8 });
    if (R() < 0.25) { ctx.save(); ctx.fillStyle = dark ? '#080606' : `rgba(205,198,190,${alpha * 0.8})`; ctx.beginPath(); ctx.ellipse(x + bend, y - hh - 4, 1.6, 6, bend * 0.02, 0, 7); ctx.fill(); ctx.restore(); }
  }
}

// ---------- higanbanas lejanos (manchas rojas en el campo) ----------
export function lilyField(ctx, x0, x1, y0, y1, { seed = 1, n = 40, size = 6 } = {}) {
  const R = rng(seed);
  for (let i = 0; i < n; i++) {
    const t = R(), y = y0 + t * (y1 - y0), x = x0 + R() * (x1 - x0), s = size * (0.4 + t * 0.9);
    ctx.strokeStyle = 'rgba(30,24,22,0.9)'; ctx.lineWidth = Math.max(0.5, s * 0.12); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (R() - 0.5) * 2, y - s * 2.2); ctx.stroke();
    ctx.strokeStyle = `rgba(${170 + R() * 50 | 0},20,28,${0.7 + t * 0.3})`; ctx.lineWidth = Math.max(0.5, s * 0.14);
    for (let k = 0; k < 9; k++) { const a = -Math.PI / 2 + (k - 4) * 0.36; ctx.beginPath(); ctx.moveTo(x, y - s * 2.2); ctx.quadraticCurveTo(x + Math.cos(a) * s * 0.6, y - s * 2.2 + Math.sin(a) * s * 0.9 - s * 0.4, x + Math.cos(a) * s * 1.1, y - s * 2.2 + Math.sin(a) * s * 0.9); ctx.stroke(); }
  }
}

// ---------- luna con halo ----------
export function moon(ctx, x, y, r, { a = 0.8, red = false } = {}) {
  const g = ctx.createRadialGradient(x, y, r * 0.8, x, y, r * 5); g.addColorStop(0, red ? `rgba(180,40,40,${0.25 * a})` : `rgba(220,214,205,${0.18 * a})`); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(x - r * 5, y - r * 5, r * 10, r * 10);
  ctx.fillStyle = red ? `rgba(200,60,55,${a})` : `rgba(226,220,210,${a})`; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  const R = rng(4); ctx.fillStyle = 'rgba(0,0,0,0.08)'; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.arc(x + (R() - 0.5) * r, y + (R() - 0.5) * r, r * (0.1 + R() * 0.2), 0, 7); ctx.fill(); }
}

// ---------- suelo con piedras y textura ----------
export function groundTex(ctx, x0, x1, y, depth, { seed = 1, a = 0.12, stones = 20 } = {}) {
  const R = rng(seed);
  for (let i = 0; i < (x1 - x0) / 6; i++) { const x = x0 + R() * (x1 - x0), yy = y + Math.pow(R(), 1.5) * depth, l = 4 + R() * 18 * (1 + (yy - y) / depth); line(ctx, [[x, yy], [x + l, yy + (R() - 0.5)]], { w: 0.7, alpha: a * (0.4 + R()) }); }
  for (let i = 0; i < stones; i++) { const x = x0 + R() * (x1 - x0), yy = y + 4 + Math.pow(R(), 1.3) * depth, r = 1.5 + R() * 3.2 * (1 + (yy - y) / depth); ctx.fillStyle = 'rgba(22,18,17,0.75)'; ctx.beginPath(); ctx.ellipse(x, yy, r * 1.4, r * 0.7, 0, 0, 7); ctx.fill(); ctx.strokeStyle = L(0.22); ctx.lineWidth = 0.6; ctx.beginPath(); ctx.ellipse(x, yy, r * 1.4, r * 0.7, 0, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); }
}

// ---------- rayos de luz entre rendijas ----------
export function rays(ctx, x, y, n, len, spread, { a = 0.08, seed = 1, color = '220,210,195' } = {}) {
  const R = rng(seed);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) { const ang = Math.PI / 2 + (i / (n - 1) - 0.5) * spread + (R() - 0.5) * 0.05, w = 6 + R() * 14; const g = ctx.createLinearGradient(x, y, x + Math.cos(ang) * len, y + Math.sin(ang) * len); g.addColorStop(0, `rgba(${color},${a})`); g.addColorStop(1, `rgba(${color},0)`); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.lineTo(x + w / 2, y); ctx.lineTo(x + Math.cos(ang) * len + w * 2, y + Math.sin(ang) * len); ctx.lineTo(x + Math.cos(ang) * len - w * 2, y + Math.sin(ang) * len); ctx.fill(); }
  ctx.restore();
}

// ---------- columnas de humo estáticas ----------
export function smoke(ctx, x, y, h, { a = 0.12, seed = 1, w = 30 } = {}) {
  const R = rng(seed), N = noise1(seed);
  for (let i = 0; i < 26; i++) { const t = i / 26, yy = y - t * h, xx = x + (N(t * 4) - 0.5) * w * 2 * t + t * w * 0.8, r = w * (0.4 + t * 1.2); const g = ctx.createRadialGradient(xx, yy, 0, xx, yy, r); g.addColorStop(0, `rgba(150,144,138,${a * (1 - t * 0.7)})`); g.addColorStop(1, 'rgba(150,144,138,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(xx, yy, r, 0, 7); ctx.fill(); void R; }
}

export { wash, fbm };
