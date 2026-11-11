// El valle de Yomigawa en 2D: mapa pintado a pincel, visto desde arriba.
// Vistas: 'valle' (la noche del ataque, Cap. I y II) y 'recuento' (columnas y farolillos, Cap. III).
import { C, rng, noise1, fbm, paper, mountains, brush, line, wash, house, callout, corners, frame, creature, spline, chartCard, axisLabel, cached } from './brush.js';
import { BARRIOS, CRIATURAS, nightAt, hhmm } from '../story.js';
import { drawIcon } from '../icons.js';
import { JAPAN, JAPAN_PATH } from './japan.js';

// tabla A (0..100) -> coordenadas del mapa (1000 x 720)
const P = (b) => [b.x * 8.6 + 70, b.y * 5.4 + 150];
const RIVER = [[905, 60], [800, 170], [712, 290], [690, 400], [668, 520], [640, 640], [612, 740]];
const LABEL = { akabana: [190, 205, 'right'], takegawa: [800, 300, 'left'], hikarizaka: [300, 420, 'right'], tsukimori: [80, 570, 'left'], kurokawa: [760, 640, 'left'] };

// --- modelo: casas, horas de incendio, criaturas (igual que la biblia) ---
function model() {
  const R = rng(11);
  const houses = [];
  for (const b of BARRIOS) {
    const [cx, cy] = P(b);
    const n = Math.round(b.hab / 6), list = [];
    for (let i = 0; i < n; i++) {
      let x, y, ok, tries = 0;
      do { const a = R() * Math.PI * 2, r = 8 + Math.sqrt(R()) * 46; x = cx + Math.cos(a) * r * 1.25; y = cy + Math.sin(a) * r * 0.8; ok = list.every((h) => Math.hypot(h.x - x, h.y - y) > 17); tries++; } while (!ok && tries < 40);
      list.push({ x, y, w: 15 + R() * 6, b });
    }
    list.sort(() => R() - 0.5);
    const doomed = Math.round(n * b.dmg / 100);
    list.forEach((h, i) => { h.doomed = i < doomed; h.burnAt = b.ignite + (i / Math.max(1, doomed)) * 9 + R() * 2; });
    list.sort((a, c) => a.y - c.y);
    houses.push(...list);
  }
  const order = [];
  for (const b of [...BARRIOS].sort((a, c) => a.ignite - c.ignite)) for (const t of ['dragon', 'oni', 'yokai', 'kappa']) for (let i = 0; i < b.cre[t]; i++) order.push({ b, t });
  const spawnAt = (k) => { for (let m = 0; m <= 60; m += 0.25) if (nightAt(m, 'creatures') >= k + 1 - 1e-6) return m; return 60; };
  const creatures = order.map((o, k) => {
    const [tx, ty] = P(o.b);
    const target = [tx + (R() - 0.5) * 70, ty + (R() - 0.5) * 40];
    const start = o.t === 'kappa' ? [625, 735] : [150 + R() * 700, 40 + R() * 50];
    const t0 = Math.max(0, spawnAt(k) - 2.5), t1 = Math.max(t0 + 4, o.b.ignite);
    const mid = o.t === 'kappa' ? [690, 520] : [(start[0] + target[0]) / 2 + (R() - 0.5) * 120, (start[1] + target[1]) / 2 - (o.t === 'dragon' ? 60 : 0)];
    return { ...o, start, target, mid, t0, t1, ph: R() * 6 };
  });
  return { houses, creatures };
}
const M = model();
const at = (c, f) => { const u = 1 - f; return [u * u * c.start[0] + 2 * u * f * c.mid[0] + f * f * c.target[0], u * u * c.start[1] + 2 * u * f * c.mid[1] + f * f * c.target[1]]; };

// --- capas estáticas ---
function paintPaper(ctx, L) { paper(ctx, L.w, L.h, { glowAt: [L.X(500), L.Y(380), 700 * L.s, 'rgba(70,58,55,0.55)'] }); }

function paintMap(ctx, L) {
  const s = L.s;
  ctx.save(); ctx.translate(L.ox, L.oy); ctx.scale(s, s);
  // marco del mapa
  frame(ctx, 0, 0, 1000, 720, { color: C.boneA(0.22) });
  ctx.save(); ctx.beginPath(); ctx.rect(6, 6, 988, 708); ctx.clip();
  // suelo: aguadas suaves y curvas de nivel
  wash(ctx, 480, 420, 520, 300, 'rgba(195,191,185,0.06)', { seed: 3, blobs: 9 });
  const N = noise1(4);
  for (let k = 0; k < 9; k++) {
    const pts = []; const y0 = 230 + k * 55;
    for (let x = -20; x <= 1020; x += 40) pts.push([x, y0 + Math.sin(x * 0.006 + k) * 22 + (N(x * 0.01 + k * 3) - 0.5) * 30]);
    brush(ctx, pts, { w: 1.2, alpha: 0.12, dry: 0.9, profile: 'even', seed: 20 + k, n: 60 });
  }
  // relieve sombreado (luz desde el noroeste)
  ctx.drawImage(relief(), 0, 0, 1000, 720);
  // arrozales inundados entre los barrios
  for (const [px, py, rot, n, m] of [[300, 330, 0.25, 5, 4], [560, 250, 0.1, 4, 3], [540, 470, -0.15, 5, 4], [350, 560, 0.3, 4, 3], [780, 560, -0.2, 4, 4], [850, 420, 0.15, 3, 4], [190, 280, -0.1, 3, 3]]) paddies(ctx, px, py, rot, n, m);
  // montañas del norte (tres planos, la del fondo más tenue)
  mountains(ctx, { x0: -20, x1: 1020, base: 120, amp: 70, color: 'rgba(195,191,185,0.10)', fade: 90, seed: 31, freq: 0.004, rim: 0.25 });
  mountains(ctx, { x0: -20, x1: 1020, base: 150, amp: 85, color: 'rgba(195,191,185,0.16)', fade: 110, seed: 32, freq: 0.006, rim: 0.4 });
  mountains(ctx, { x0: -20, x1: 1020, base: 185, amp: 60, color: 'rgba(195,191,185,0.13)', fade: 120, seed: 33, freq: 0.009, rim: 0.5 });
  // bosque de Tsukimori y arboledas: manchas de pincel
  const R = rng(8);
  const grove = (cx, cy, n, r) => { const T = []; for (let i = 0; i < n; i++) T.push([cx + (R() - 0.5) * r * 2, cy + (R() - 0.5) * r, 4 + R() * 3.5]); T.sort((a, b) => a[1] - b[1]); for (const [x, y, k] of T) tree(ctx, x, y, k, R()); };
  grove(110, 640, 80, 90); grove(60, 430, 40, 50); grove(520, 300, 26, 40); grove(880, 500, 30, 60); grove(380, 620, 26, 50); grove(860, 680, 20, 60);
  // río: trazo largo de tinta oscura con orillas claras
  const rv = spline(RIVER, 80);
  brush(ctx, RIVER, { w: 34, color: '#050404', alpha: 0.95, profile: 'even', dry: 0.1, seed: 50, n: 120 });
  brush(ctx, RIVER.map(([x, y]) => [x - 19, y]), { w: 1.8, alpha: 0.35, dry: 0.7, profile: 'taper', seed: 51, n: 120 });
  brush(ctx, RIVER.map(([x, y]) => [x + 19, y]), { w: 1.8, alpha: 0.35, dry: 0.7, profile: 'taper', seed: 52, n: 120 });
  for (let i = 0; i < 24; i++) { const p = rv[Math.floor(R() * rv.length)]; line(ctx, [[p[0] - 6, p[1]], [p[0] + 5, p[1] - 2]], { w: 0.8, alpha: 0.25 }); }
  // caminos entre barrios
  const road = [[320, 70], [P(BARRIOS[0])[0], P(BARRIOS[0])[1]], [P(BARRIOS[2])[0], P(BARRIOS[2])[1]], [P(BARRIOS[3])[0], P(BARRIOS[3])[1]]];
  line(ctx, spline(road, 60), { w: 1, alpha: 0.35, dash: [3, 5] });
  line(ctx, spline([P(BARRIOS[2]), [560, 360], P(BARRIOS[1])], 40), { w: 1, alpha: 0.35, dash: [3, 5] });
  line(ctx, spline([P(BARRIOS[2]), [520, 520], P(BARRIOS[4])], 40), { w: 1, alpha: 0.35, dash: [3, 5] });
  // puentes donde los caminos cruzan el río
  for (const [bx, by, a] of [[700, 352, 0.15], [655, 585, -0.1]]) { ctx.save(); ctx.translate(bx, by); ctx.rotate(a); ctx.fillStyle = '#2a221f'; ctx.fillRect(-26, -4, 52, 8); ctx.strokeStyle = C.boneA(0.7); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-26, -4); ctx.quadraticCurveTo(0, -9, 26, -4); ctx.moveTo(-26, 4); ctx.quadraticCurveTo(0, -1, 26, 4); ctx.stroke(); for (let k = -20; k <= 20; k += 8) { ctx.beginPath(); ctx.moveTo(k, -5); ctx.lineTo(k, 3); ctx.stroke(); } ctx.restore(); }
  // el templo de Hikarizaka, en lo alto de la cuesta
  { const [tx, ty] = [470, 372]; ctx.save(); ctx.fillStyle = '#1d1715'; ctx.fillRect(tx - 14, ty - 8, 28, 10); ctx.beginPath(); ctx.moveTo(tx - 22, ty - 6); ctx.quadraticCurveTo(tx - 10, ty - 10, tx - 8, ty - 20); ctx.lineTo(tx + 8, ty - 20); ctx.quadraticCurveTo(tx + 10, ty - 10, tx + 22, ty - 6); ctx.closePath(); ctx.fill(); ctx.strokeStyle = C.boneA(0.75); ctx.lineWidth = 0.9; ctx.stroke(); ctx.strokeStyle = '#b3121b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(tx - 34, ty + 14); ctx.lineTo(tx - 34, ty); ctx.moveTo(tx - 24, ty + 14); ctx.lineTo(tx - 24, ty); ctx.moveTo(tx - 38, ty); ctx.lineTo(tx - 20, ty); ctx.moveTo(tx - 37, ty + 4); ctx.lineTo(tx - 21, ty + 4); ctx.stroke(); ctx.restore(); }
  ctx.restore();
  // título y rosa de los vientos
  ctx.fillStyle = C.boneA(0.75); ctx.font = '700 22px "Shippori Mincho B1", serif'; ctx.textAlign = 'left';
  ctx.save(); ctx.fillStyle = 'rgba(11,8,8,0.84)'; ctx.fillRect(14, 594, 207, 118); ctx.strokeStyle = C.boneA(0.2); ctx.lineWidth = 1; ctx.strokeRect(14.5, 594.5, 206, 117); ctx.restore();
  ctx.fillStyle = C.boneA(0.75); ctx.font = '700 22px "Shippori Mincho B1", serif'; ctx.textAlign = 'left';
  ctx.fillText('黄泉川', 26, 694); ctx.font = '11px "IBM Plex Sans", sans-serif'; ctx.fillStyle = C.boneA(0.6); ctx.fillText('VALLE DE YOMIGAWA', 98, 692);
  ctx.fillStyle = 'rgba(224,80,80,0.85)'; ctx.font = '600 10px "IBM Plex Sans", sans-serif'; ctx.fillText('MAPA DE UBICACIÓN', 26, 664);
  // escala gráfica
  ctx.strokeStyle = C.boneA(0.6); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(26, 640); ctx.lineTo(126, 640); ctx.moveTo(26, 635); ctx.lineTo(26, 645); ctx.moveTo(76, 637); ctx.lineTo(76, 643); ctx.moveTo(126, 635); ctx.lineTo(126, 645); ctx.stroke();
  ctx.fillStyle = C.boneA(0.65); ctx.font = '10px "IBM Plex Sans", sans-serif'; ctx.textAlign = 'center'; ctx.fillText('0', 26, 630); ctx.fillText('300 m', 126, 630);
  // norte
  ctx.strokeStyle = C.boneA(0.5); ctx.beginPath(); ctx.moveTo(170, 646); ctx.lineTo(170, 612); ctx.moveTo(164, 620); ctx.lineTo(170, 610); ctx.lineTo(176, 620); ctx.stroke(); ctx.fillStyle = C.boneA(0.7); ctx.font = '600 13px "Shippori Mincho B1", serif'; ctx.fillText('北', 170, 602);
  ctx.font = '600 13px "Shippori Mincho B1", serif'; ctx.fillText('山', 330, 36); ctx.font = '10px "IBM Plex Sans", sans-serif'; ctx.fillText('MONTAÑAS DEL NORTE', 330, 52);
  paintInset(ctx); paintLegend(ctx);
  corners(ctx, 1000, 720, { size: 70, color: 'rgba(154,31,40,0.5)' });
  ctx.restore();
}

// --- piezas del mapa ---
let reliefCv = null;
function relief() { // mapa de sombras del terreno, una vez
  if (reliefCv) return reliefCv;
  const W = 250, H = 180, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'); const d = g.createImageData(W, H);
  const N = noise1(77), N2 = noise1(78);
  const E = (x, y) => { const X = x * 4, Y = y * 4; const mtn = Math.pow(Math.max(0, (270 - Y) / 270), 1.4) * 1.4; const n = fbm(N, X * 0.006 + Y * 0.0037, 5) * 0.5 + fbm(N2, Y * 0.006 - X * 0.002, 4) * 0.35; let rv = 1e9; for (const [rx, ry] of RIVER) rv = Math.min(rv, Math.hypot(rx - X, ry - Y)); const val = -Math.max(0, 1 - rv / 120) * 0.25; return mtn + n * (0.4 + mtn) + val; };
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const dx = E(x + 1, y) - E(x - 1, y), dy = E(x, y + 1) - E(x, y - 1); const sh = (-dx * 0.7 - dy * 0.7) * 6;
    const i = (y * W + x) * 4; if (sh > 0) { d.data[i] = 225; d.data[i + 1] = 218; d.data[i + 2] = 208; d.data[i + 3] = Math.min(38, sh * 120); } else { d.data[i] = d.data[i + 1] = d.data[i + 2] = 0; d.data[i + 3] = Math.min(90, -sh * 200); }
  }
  g.putImageData(d, 0, 0);
  return (reliefCv = c);
}
function paddies(ctx, x, y, rot, n, m) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  const cw = 17, ch = 11, R = rng(x | 0);
  for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) { const px = (i - n / 2) * cw + (j % 2) * 3, py = (j - m / 2) * ch; ctx.fillStyle = `rgba(195,191,185,${0.03 + R() * 0.04})`; ctx.fillRect(px, py, cw - 2, ch - 2); ctx.strokeStyle = C.boneA(0.16); ctx.lineWidth = 0.6; ctx.strokeRect(px, py, cw - 2, ch - 2); if (R() < 0.4) { ctx.strokeStyle = C.boneA(0.1); ctx.beginPath(); ctx.moveTo(px + 3, py + 3 + R() * 4); ctx.lineTo(px + cw - 6, py + 3 + R() * 4); ctx.stroke(); } }
  ctx.restore();
}
function tree(ctx, x, y, k, r) { // árbol visto en vista de pájaro: copa con luz al noroeste y sombra
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(x + k * 0.5, y + k * 0.4, k, k * 0.6, 0, 0, 7); ctx.fill();
  ctx.fillStyle = r < 0.5 ? '#0d0b0a' : '#141110'; ctx.beginPath(); for (let a = 0; a < 7; a += 0.7) { const rr = k * (0.8 + 0.25 * Math.sin(a * 3 + r * 9)); ctx.lineTo(x + Math.cos(a) * rr, y - k * 0.4 + Math.sin(a) * rr * 0.85); } ctx.closePath(); ctx.fill();
  ctx.strokeStyle = C.boneA(0.4); ctx.lineWidth = 0.7; ctx.beginPath(); ctx.arc(x - k * 0.15, y - k * 0.55, k * 0.7, Math.PI * 1.05, Math.PI * 1.7); ctx.stroke();
}
function mapHouse(ctx, x, y, w, seed) { // casa en vista de tres cuartos para el mapa
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(x + w * 0.1, y + 1, w * 0.5, w * 0.12, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#16110f'; ctx.fillRect(x - w * 0.36, y - w * 0.28, w * 0.72, w * 0.28);
  ctx.fillStyle = 'rgba(200,192,180,0.14)'; ctx.fillRect(x - w * 0.3, y - w * 0.22, w * 0.18, w * 0.16); ctx.fillRect(x + w * 0.04, y - w * 0.22, w * 0.18, w * 0.16);
  const roof = new Path2D(); roof.moveTo(x - w * 0.48, y - w * 0.24); roof.lineTo(x - w * 0.22, y - w * 0.64); roof.lineTo(x + w * 0.22, y - w * 0.64); roof.lineTo(x + w * 0.48, y - w * 0.24); roof.closePath();
  ctx.fillStyle = '#6a5f58'; ctx.fill(roof);
  ctx.save(); ctx.clip(roof); ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(x + w * 0.02, y - w * 0.7, w * 0.6, w * 0.5); ctx.strokeStyle = 'rgba(20,14,12,0.35)'; ctx.lineWidth = 0.5; for (let k = -4; k <= 4; k++) { ctx.beginPath(); ctx.moveTo(x + k * w * 0.05, y - w * 0.64); ctx.lineTo(x + k * w * 0.11, y - w * 0.24); ctx.stroke(); } ctx.restore();
  ctx.strokeStyle = C.boneA(0.75); ctx.lineWidth = Math.max(0.7, w * 0.05); ctx.beginPath(); ctx.moveTo(x - w * 0.48, y - w * 0.24); ctx.lineTo(x - w * 0.22, y - w * 0.64); ctx.lineTo(x + w * 0.22, y - w * 0.64); ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.9)'; ctx.lineWidth = Math.max(1, w * 0.07); ctx.beginPath(); ctx.moveTo(x - w * 0.22, y - w * 0.65); ctx.lineTo(x + w * 0.22, y - w * 0.65); ctx.stroke();
  ctx.restore(); void seed;
}

// recuadro de ubicación: Japón y el valle
function paintInset(ctx) {
  const x = 18, y = 16, k = 0.74, w = JAPAN.w * k + 16, h = JAPAN.h * k + 40;
  ctx.save();
  ctx.fillStyle = 'rgba(11,8,8,0.86)'; ctx.fillRect(x, y, w, h); frame(ctx, x, y, w, h, { color: C.boneA(0.25) });
  ctx.translate(x + 8, y + 8); ctx.scale(k, k);
  const jp = new Path2D(JAPAN_PATH); ctx.fillStyle = 'rgba(195,191,185,0.2)'; ctx.fill(jp); ctx.strokeStyle = C.boneA(0.6); ctx.lineWidth = 1 / k; ctx.stroke(jp);
  const [vx, vy] = JAPAN.valley, [kx, ky] = JAPAN.kyoto, [tx, ty] = JAPAN.tokyo;
  ctx.fillStyle = C.boneA(0.7); for (const [a, b] of [[kx, ky], [tx, ty]]) { ctx.beginPath(); ctx.arc(a, b, 2 / k, 0, 7); ctx.fill(); }
  ctx.font = `${9 / k}px "IBM Plex Sans", sans-serif`; ctx.textAlign = 'right'; ctx.fillText('Kioto', kx - 4 / k, ky + 12 / k); ctx.textAlign = 'left'; ctx.fillText('Tokio', tx + 4 / k, ty + 10 / k);
  ctx.strokeStyle = C.glow; ctx.lineWidth = 1.4 / k; ctx.beginPath(); ctx.arc(vx, vy, 7 / k, 0, 7); ctx.stroke(); ctx.fillStyle = C.glow; ctx.beginPath(); ctx.arc(vx, vy, 2.6 / k, 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(224,48,58,0.7)'; ctx.lineWidth = 1 / k; ctx.beginPath(); ctx.moveTo(vx - 6 / k, vy - 5 / k); ctx.lineTo(28, 58); ctx.lineTo(4, 58); ctx.stroke();
  ctx.restore();
  ctx.save(); ctx.textAlign = 'left';
  ctx.fillStyle = '#efe9e1'; ctx.font = '600 11px "Shippori Mincho B1", serif'; ctx.fillText('Japón · era Taishō', x + 10, y + h - 18);
  ctx.fillStyle = C.boneA(0.6); ctx.font = '9px "IBM Plex Sans", sans-serif'; ctx.fillText('el valle, en los Alpes japoneses', x + 10, y + h - 6);
  ctx.restore();
}

// leyenda del mapa (mismo sistema de íconos que el resto del sitio)
function paintLegend(ctx) {
  const x = 226, y = 640, w = 372, h = 72;
  ctx.save();
  ctx.fillStyle = 'rgba(11,8,8,0.82)'; ctx.fillRect(x, y, w, h); ctx.strokeStyle = C.boneA(0.2); ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.font = '11px "IBM Plex Sans", sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  const item = (cx, cy, draw, text) => { draw(cx + 9, cy); ctx.fillStyle = C.boneA(0.85); ctx.fillText(text, cx + 22, cy + 1); };
  const r1 = y + 22, r2 = y + 52;
  item(x + 12, r1, (a, b) => drawIcon(ctx, 'barrio', a, b, 16), 'Barrio');
  item(x + 94, r1, (a, b) => drawIcon(ctx, 'rio', a, b, 16), 'Río');
  item(x + 160, r1, (a, b) => { ctx.strokeStyle = C.boneA(0.7); ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(a - 8, b); ctx.lineTo(a + 8, b); ctx.stroke(); ctx.setLineDash([]); }, 'Camino');
  item(x + 252, r1, (a, b) => drawIcon(ctx, 'montana', a, b, 16), 'Montañas');
  item(x + 12, r2, (a, b) => drawIcon(ctx, 'fuego', a, b, 16), 'Incendio');
  ['dragon', 'oni', 'yokai', 'kappa'].forEach((id, i) => drawIcon(ctx, id, x + 112 + i * 17, r2, 15));
  ctx.fillStyle = C.boneA(0.85); ctx.fillText('Criaturas', x + 182, r2 + 1);
  item(x + 252, r2, (a, b) => { ctx.strokeStyle = 'rgba(200,24,34,0.95)'; ctx.lineWidth = 2.4; ctx.setLineDash([5, 3]); ctx.beginPath(); ctx.moveTo(a - 9, b); ctx.lineTo(a + 9, b); ctx.stroke(); ctx.setLineDash([]); ctx.lineWidth = 1; }, 'Rastro de Kenji');
  ctx.restore();
}

function paintHouses(ctx, L) {
  ctx.save(); ctx.translate(L.ox, L.oy); ctx.scale(L.s, L.s);
  for (const h of M.houses) mapHouse(ctx, h.x, h.y, h.w, h.x * 7 + h.y | 0);
  // etiquetas con líneas guía
  for (const b of BARRIOS) {
    const [x, y] = P(b), [lx, ly, al] = LABEL[b.id];
    callout(ctx, [x, y - 10], [lx, ly], `${b.kanji}  ${b.name}`, { align: al, sub: b.meaning, size: 14 });
  }
  ctx.restore();
}

function paintChartFrame(ctx, L) {
  ctx.save(); ctx.translate(L.ox, L.oy); ctx.scale(L.s, L.s);
  const x = 600, y = 22, w = 370, h = 150;
  chartCard(ctx, x, y, w, h, 'Pueblo alcanzado por el ataque', 'Gráfico de líneas · % del valle');
  for (const m of [0, 15, 30, 45, 60]) { const px = x + 30 + (m / 60) * (w - 60); axisLabel(ctx, hhmm(m), px, y + h - 9); line(ctx, [[px, y + h - 24], [px, y + h - 28]], { alpha: 0.5 }); }
  line(ctx, [[x + 30, y + h - 26], [x + w - 30, y + h - 26]], { alpha: 0.35 });
  line(ctx, [[x + 30, y + 56], [x + w - 30, y + 56]], { alpha: 0.16, dash: [2, 4] });
  axisLabel(ctx, '100 %', x + w - 28, y + 52, 'right');
  ctx.restore();
}

// --- capa dinámica ---
function chartPt(m) { const x = 600, y = 22, w = 370, h = 150; return [x + 30 + (m / 60) * (w - 60), y + h - 26 - (nightAt(m, 'reach') / 100) * (h - 82)]; }

function drawNight(ctx, L, S, time) {
  const { m, heat = 0, trail = 0, dawn = 0, bars = 0 } = S;
  ctx.save(); ctx.translate(L.ox, L.oy); ctx.scale(L.s, L.s);
  // mancha de calor: concentración de criaturas
  if (heat > 0) for (const b of BARRIOS) {
    const [x, y] = P(b), n = Object.values(b.cre).reduce((a, c) => a + c, 0);
    const r = 40 + n * 14;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, C.red(0.18 + heat * n / 8 * 0.4)); g.addColorStop(1, C.red(0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, r * 1.25, r * 0.85, 0, 0, Math.PI * 2); ctx.fill();
  }
  // fuego en las casas
  for (const h of M.houses) {
    if (!h.doomed) continue;
    const f = Math.min(1, Math.max(0, (m - h.burnAt) / 3)); if (f <= 0) continue;
    const fl = (1 - dawn) * f * (0.75 + 0.25 * Math.sin(time * 9 + h.burnAt * 3));
    if (fl > 0.02) {
      const g = ctx.createRadialGradient(h.x, h.y - 6, 0, h.x, h.y - 6, 26 * fl + 6); g.addColorStop(0, `rgba(255,90,60,${0.9 * fl})`); g.addColorStop(0.35, C.red(0.55 * fl)); g.addColorStop(1, C.red(0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(h.x, h.y - 6, 26 * fl + 6, 0, Math.PI * 2); ctx.fill();
      // lengua de fuego
      ctx.fillStyle = `rgba(255,70,50,${0.85 * fl})`; ctx.beginPath(); const fh = 10 + 8 * fl + Math.sin(time * 13 + h.x) * 3;
      ctx.moveTo(h.x - 4, h.y - 8); ctx.quadraticCurveTo(h.x - 3, h.y - 8 - fh * 0.6, h.x + Math.sin(time * 7 + h.y) * 2, h.y - 8 - fh); ctx.quadraticCurveTo(h.x + 4, h.y - 8 - fh * 0.5, h.x + 4, h.y - 8); ctx.fill();
    }
    // casa quemada
    ctx.fillStyle = `rgba(0,0,0,${0.55 * f})`; ctx.fillRect(h.x - h.w * 0.45, h.y - h.w * 0.6, h.w * 0.9, h.w * 0.62);
    if (dawn > 0) { ctx.strokeStyle = `rgba(150,145,140,${0.25 * dawn})`; ctx.lineWidth = 2; ctx.beginPath(); for (let k = 0; k < 3; k++) { const yy = h.y - 12 - k * 10 - ((time * 8 + h.x) % 10); ctx.moveTo(h.x + Math.sin(yy * 0.2) * 3, yy); ctx.lineTo(h.x + Math.sin((yy - 6) * 0.2) * 3, yy - 6); } ctx.stroke(); }
  }
  // criaturas y su recorrido
  if (dawn < 0.6) for (const c of M.creatures) {
    if (m < c.t0) continue;
    const f = Math.min(1, (m - c.t0) / (c.t1 - c.t0));
    const pts = []; for (let i = 0; i <= 20; i++) pts.push(at(c, (i / 20) * f));
    line(ctx, pts, { w: 1, color: c.t === 'oni' ? 'rgba(74,123,255,0.55)' : C.boneA(0.3), dash: [2, 4] });
    let [x, y] = at(c, f);
    if (f >= 1) { const a = time * (c.t === 'dragon' ? 0.6 : 1) + c.ph, r = c.t === 'dragon' ? 26 : 8; x += Math.cos(a) * r; y += Math.sin(a) * r * 0.6; }
    const ahead = at(c, Math.min(1, f + 0.03));
    const ang = c.t === 'dragon' ? (f < 1 ? Math.atan2(ahead[1] - y, ahead[0] - x) : (time * 0.6 + c.ph) + Math.PI / 2) + Math.PI : 0;
    creature(ctx, c.t, x, y, c.t === 'dragon' ? 0.9 : 0.75, { alpha: 1 - dawn, ang });
  }
  // rastro de sangre de Kenji (Cap. II)
  if (trail > 0) {
    const tp = spline([[P(BARRIOS[0])[0] - 10, P(BARRIOS[0])[1] + 10], [420, 260], [540, 300], [630, 320]], 60);
    const n = Math.max(2, Math.floor(tp.length * trail));
    ctx.save(); ctx.strokeStyle = 'rgba(200,24,34,0.9)'; ctx.lineWidth = 3.2; ctx.setLineDash([7, 5]); ctx.beginPath(); ctx.moveTo(tp[0][0], tp[0][1]); for (let i = 1; i < n; i++) ctx.lineTo(tp[i][0], tp[i][1]); ctx.stroke(); ctx.restore();
    const e = tp[n - 1];
    if (trail < 1) { ctx.fillStyle = C.glow; ctx.beginPath(); ctx.arc(e[0], e[1], 4, 0, 7); ctx.fill(); ctx.fillStyle = C.bone; ctx.font = '12px "Zen Old Mincho", serif'; ctx.textAlign = 'center'; ctx.fillText('Kenji', e[0], e[1] - 12); }
    else { // los dos dragones colosales caídos
      creature(ctx, 'dragon', 600, 350, 2.1, { alpha: 0.75, ang: 0.4 }); creature(ctx, 'dragon', 640, 270, 1.9, { alpha: 0.75, ang: -2.6 });
      callout(ctx, [610, 345], [470, 470], 'Dos dragones colosales', { align: 'right', size: 12, sub: 'cortados por la cadena' });
    }
  }
  // gráfica: el humo del incienso dibuja la línea
  const mm = Math.min(60, m);
  if (bars < 1) {
    ctx.save(); ctx.globalAlpha = 1 - bars;
    const lp = []; for (let k = 0; k <= mm + 0.001; k += 0.5) lp.push(chartPt(k));
    if (lp.length > 1) { line(ctx, lp, { w: 5, color: C.boneA(0.12) }); line(ctx, lp, { w: 2, color: C.boneA(0.9) }); }
    const hp = chartPt(mm);
    ctx.fillStyle = C.glow; ctx.beginPath(); ctx.arc(hp[0], hp[1], 4.5, 0, 7); ctx.fill();
    ctx.fillStyle = '#f1ebe2'; ctx.font = '600 16px "Shippori Mincho B1", serif'; ctx.textAlign = 'center'; ctx.fillText(`${Math.round(nightAt(mm, 'reach'))} %`, hp[0], hp[1] - 12);
    ctx.restore();
  }
  // leyenda del mapa de calor
  if (heat > 0 && bars < 1) drawHeatLegend(ctx, heat * (1 - bars));
  // al amanecer: barras apiladas de criaturas derrotadas y huidas
  if (bars > 0) drawTally(ctx, bars);
  // el incienso (reloj de la noche)
  drawIncense(ctx, 928, 690, mm, time, dawn);
  // amanecer
  if (dawn > 0) { ctx.fillStyle = `rgba(160,150,140,${0.1 * dawn})`; ctx.fillRect(0, 0, 1000, 720); }
  ctx.restore();
}

function drawHeatLegend(ctx, a) {
  const x = 600, y = 180, w = 370, h = 50;
  ctx.save(); ctx.globalAlpha = a;
  ctx.fillStyle = 'rgba(11,8,8,0.84)'; ctx.fillRect(x, y, w, h); ctx.strokeStyle = C.boneA(0.2); ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = '#efe9e1'; ctx.font = '600 12px "Shippori Mincho B1", serif'; ctx.textAlign = 'left'; ctx.fillText('Mapa de calor', x + 14, y + 20);
  ctx.fillStyle = C.boneA(0.55); ctx.font = '9.5px "IBM Plex Sans", sans-serif'; ctx.fillText('CRIATURAS POR BARRIO', x + 14, y + 36);
  const gx = x + 170, gw = 150, g = ctx.createLinearGradient(gx, 0, gx + gw, 0); g.addColorStop(0, C.red(0.12)); g.addColorStop(1, C.red(0.85));
  ctx.fillStyle = g; ctx.fillRect(gx, y + 15, gw, 9);
  ctx.fillStyle = C.boneA(0.7); ctx.textAlign = 'center'; ctx.fillText('3', gx, y + 39); ctx.fillText('8', gx + gw, y + 39); ctx.textAlign = 'left'; ctx.fillText('criaturas', gx + gw + 10, y + 23);
  ctx.restore();
}

function drawTally(ctx, a) {
  const x = 600, y = 22, w = 370, h = 222, bx = x + 118, unit = 17.5;
  const e = a * a * (3 - 2 * a);
  ctx.save(); ctx.globalAlpha = Math.min(1, a * 2);
  chartCard(ctx, x, y, w, h, 'Al amanecer: las 30 criaturas', 'Gráfico de barras apiladas · por tipo');
  const red = cached('tally-red', 230, 22, (g) => brush(g, [[4, 11], [226, 11]], { w: 18, color: '#c8141e', alpha: 0.95, profile: 'even', dry: 0.35, seed: 7, n: 30 }), 2);
  CRIATURAS.forEach((c, i) => {
    const ry = y + 76 + i * 32;
    drawIcon(ctx, c.id, x + 28, ry, 18);
    ctx.fillStyle = C.boneA(0.9); ctx.font = '12px "Zen Old Mincho", serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(c.name, x + 44, ry + 1);
    const wd = c.defeated * unit * e, wf = (c.count - c.defeated) * unit * e;
    if (wd > 0) ctx.drawImage(red, 0, 0, Math.max(1, wd / 230 * 460), 44, bx, ry - 9, wd, 18);
    ctx.strokeStyle = C.boneA(0.6); ctx.lineWidth = 1; ctx.strokeRect(bx + wd + 1.5, ry - 7.5, Math.max(0, wf - 3), 15);
    ctx.fillStyle = '#f1ebe2'; ctx.font = '600 12px "IBM Plex Sans", sans-serif';
    if (e > 0.6) { ctx.textAlign = 'center'; ctx.fillText(String(c.defeated), bx + wd / 2, ry + 1); ctx.fillStyle = C.boneA(0.8); ctx.fillText(String(c.count - c.defeated), bx + wd + wf / 2, ry + 1); ctx.textAlign = 'left'; ctx.fillStyle = C.boneA(0.6); ctx.font = '11px "IBM Plex Sans", sans-serif'; ctx.fillText(`${c.count}`, bx + wd + wf + 8, ry + 1); }
  });
  const ly = y + h - 22; ctx.textBaseline = 'middle'; ctx.font = '11px "IBM Plex Sans", sans-serif';
  ctx.fillStyle = '#c8141e'; ctx.fillRect(x + 18, ly - 5, 14, 10); ctx.fillStyle = C.boneA(0.85); ctx.textAlign = 'left'; ctx.fillText('14 derrotadas por Kenji', x + 38, ly);
  ctx.strokeStyle = C.boneA(0.6); ctx.strokeRect(x + 196.5, ly - 4.5, 13, 9); ctx.fillText('16 huyeron', x + 216, ly);
  ctx.restore();
}

function drawIncense(ctx, x, y, m, time, dawn) {
  const left = 1 - Math.min(1, m / 60) * 0.92, H = 250 * left;
  // cuenco
  ctx.fillStyle = '#1c1716'; ctx.beginPath(); ctx.ellipse(x, y - 8, 34, 10, 0, 0, Math.PI); ctx.lineTo(x - 26, y + 10); ctx.quadraticCurveTo(x, y + 22, x + 26, y + 10); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = C.boneA(0.5); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(x, y - 8, 34, 10, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = 'rgba(160,152,145,0.7)'; ctx.beginPath(); ctx.ellipse(x, y - 8, 30, 7, 0, 0, Math.PI * 2); ctx.fill();
  // varilla
  ctx.fillStyle = '#3a2f2c'; ctx.fillRect(x - 2, y - 8 - H, 4, H);
  const tipY = y - 8 - H;
  if (m < 60.2) {
    const g = ctx.createRadialGradient(x, tipY, 0, x, tipY, 16); g.addColorStop(0, 'rgba(255,120,90,1)'); g.addColorStop(0.3, C.glowA(0.7)); g.addColorStop(1, C.glowA(0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, tipY, 16, 0, 7); ctx.fill();
    // humo
    ctx.strokeStyle = C.boneA(0.35); ctx.lineWidth = 1.6; ctx.beginPath();
    for (let i = 0; i < 60; i++) { const yy = tipY - i * 3, xx = x + Math.sin(i * 0.18 - time * 1.6) * (i * 0.35); i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
    ctx.stroke();
  }
  ctx.fillStyle = '#f1ebe2'; ctx.font = '600 26px "Shippori Mincho B1", serif'; ctx.textAlign = 'right';
  ctx.fillText(hhmm(m), x - 44, tipY + 8);
  ctx.font = '10px "IBM Plex Sans", sans-serif'; ctx.fillStyle = C.boneA(0.6);
  ctx.fillText(`${Math.round(nightAt(m, 'creatures'))} CRIATURAS EN EL VALLE`, x - 44, tipY + 26);
  ctx.fillText('INCIENSO', x - 44, tipY - 18);
}

// --- vistas ---
export function defineValley(stage, { onBarrio }) {
  stage.define('valle', {
    layers: [{ depth: 0.05, paint: paintPaper }, { depth: 0.3, paint: paintMap }, { depth: 0.3, paint: paintHouses }, { depth: 0.3, paint: paintChartFrame }],
    dynDepth: 0.3,
    mount(el, L) {
      for (const b of BARRIOS) {
        const [lx, ly, al] = LABEL[b.id];
        const btn = document.createElement('button');
        btn.className = 'map-hit'; btn.title = `Leer la ema de ${b.name}`;
        const w = 150 * L.s + 40;
        btn.style.left = (L.X(lx) - (al === 'right' ? w : 0)) + 'px'; btn.style.top = (L.Y(ly) - 18) + 'px'; btn.style.width = w + 'px';
        btn.addEventListener('click', () => onBarrio(b));
        el.appendChild(btn);
      }
    },
    update(v, st) { const b = (st.valley && st.valley.bars) || 0; if (v.layers[3]) v.layers[3].c.style.opacity = (1 - b).toFixed(3); },
    dyn(ctx, L, st) { drawNight(ctx, L, st.valley || { m: 0 }, st.time); },
  });

  // Recuento: columnas de humo que se vuelven barras + 312 farolillos
  const sprites = {};
  function sprite(kind) {
    if (sprites[kind]) return sprites[kind];
    const c = document.createElement('canvas'); c.width = c.height = 40; const g = c.getContext('2d');
    if (kind !== 'off') { const gr = g.createRadialGradient(20, 20, 0, 20, 20, 20); gr.addColorStop(0, kind === 'lit' ? 'rgba(255,80,70,0.95)' : 'rgba(170,40,45,0.7)'); gr.addColorStop(0.3, kind === 'lit' ? 'rgba(200,24,34,0.6)' : 'rgba(120,20,25,0.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 40, 40); }
    g.fillStyle = kind === 'lit' ? '#e8483f' : kind === 'dim' ? '#8a2328' : '#2a2424'; g.beginPath(); g.ellipse(20, 20, 5, 7, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = kind === 'off' ? 'rgba(195,191,185,0.35)' : 'rgba(40,10,10,0.6)'; g.lineWidth = 1; g.stroke();
    g.fillStyle = '#1a1414'; g.fillRect(17, 12, 6, 2); g.fillRect(17, 26, 6, 2);
    return (sprites[kind] = c);
  }
  const lanterns = []; { const R = rng(5); for (const b of BARRIOS) { const st = [...Array(b.dead).fill(0), ...Array(b.hurt).fill(1), ...Array(b.safe).fill(2)].sort(() => R() - 0.5); st.forEach((s, i) => lanterns.push({ b, s, i, ph: R() * 10, out: R() })); } }

  stage.define('recuento', {
    layers: [{ depth: 0.05, paint: paintPaper }, { depth: 0.3, paint: paintMap }, { depth: 0.3, paint: paintHouses }],
    dynDepth: 0.3,
    dyn(ctx, L, st) {
      const { cols = 0, lan = 0 } = st.recuento || {}, time = st.time;
      ctx.save(); ctx.translate(L.ox, L.oy); ctx.scale(L.s, L.s);
      // ruinas: casas quemadas
      for (const h of M.houses) if (h.doomed) { ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(h.x - h.w * 0.45, h.y - h.w * 0.6, h.w * 0.9, h.w * 0.62); }
      // velo que oscurece el mapa cuando aparecen los farolillos
      ctx.fillStyle = `rgba(12,9,9,${0.25 + 0.72 * Math.min(1, lan * 2)})`; ctx.fillRect(-80, -80, 1160, 880);
      // columnas: primero humo, luego barras
      const grow = Math.min(1, cols / 0.55), solid = Math.max(0, (cols - 0.55) / 0.45);
      const colA = 1 - Math.min(1, lan * 3);
      if (colA > 0) for (const b of BARRIOS) {
        const [x, y] = P(b); const H = (b.dmg / 100) * 300 * grow;
        ctx.globalAlpha = colA;
        for (let k = 0; k < 12; k++) {
          const yy = y - (k / 12) * H, r = 16 + k * 2.2 + Math.sin(time * 1.5 + k + x) * 3;
          const g = ctx.createRadialGradient(x + Math.sin(time + k) * 4, yy, 0, x, yy, r); g.addColorStop(0, `rgba(170,165,158,${0.16 * (1 - solid)})`); g.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, yy, r, 0, 7); ctx.fill();
        }
        if (solid > 0) {
          ctx.globalAlpha = solid * colA;
          const bar = cached('bar-' + b.id, 40, 310, (g) => brush(g, [[20, 305], [20, 5]], { w: 26, color: '#d9d3cb', alpha: 0.92, profile: 'even', dry: 0.35, seed: b.dmg, n: 24 }), 2); const fh = Math.max(1, H); ctx.drawImage(bar, 0, (310 - fh) * 2, 80, fh * 2, x - 20, y - fh, 40, fh);
          ctx.fillStyle = C.glow; ctx.fillRect(x - 14, y - H - 4, 28, 5);
          ctx.fillStyle = '#f1ebe2'; ctx.font = '700 22px "Shippori Mincho B1", serif'; ctx.textAlign = 'center'; ctx.fillText(`${b.dmg} %`, x, y - H - 16);
          ctx.font = '11px "IBM Plex Sans", sans-serif'; ctx.fillStyle = C.boneA(0.7); ctx.fillText(b.name.toUpperCase(), x, y + 22);
        }
        ctx.globalAlpha = 1;
      }
      if (solid > 0 && colA > 0) {
        ctx.globalAlpha = solid * colA; ctx.textAlign = 'right';
        ctx.fillStyle = 'rgba(11,8,8,0.86)'; ctx.fillRect(612, 658, 376, 54); ctx.strokeStyle = C.boneA(0.2); ctx.lineWidth = 1; ctx.strokeRect(612.5, 658.5, 375, 53);
        ctx.fillStyle = '#efe9e1'; ctx.font = '600 17px "Shippori Mincho B1", serif'; ctx.fillText('Estructuras destruidas en cada barrio', 974, 682);
        ctx.fillStyle = C.boneA(0.6); ctx.font = '500 10px "IBM Plex Sans", sans-serif'; ctx.fillText('MAPA DE SÍMBOLOS PROPORCIONALES · ALTURA = % DE CASAS', 974, 701);
        ctx.globalAlpha = 1;
      }
      // farolillos: uno por habitante, agrupados por barrio
      if (lan > 0) {
        ctx.globalAlpha = Math.min(1, lan * 2.5);
        const p = Math.max(0, (lan - 0.25) / 0.6);
        let dead = 0;
        BARRIOS.forEach((b, r) => {
          const y0 = 150 + r * 105;
          ctx.fillStyle = '#f1ebe2'; ctx.font = '600 16px "Shippori Mincho B1", serif'; ctx.textAlign = 'right'; ctx.fillText(`${b.kanji} ${b.name}`, 190, y0 + 18);
          ctx.font = '10px "IBM Plex Sans", sans-serif'; ctx.fillStyle = C.boneA(0.55); ctx.fillText(`${b.hab} habitantes`, 190, y0 + 34);
          lanterns.filter((q) => q.b === b).forEach((q, i) => {
            const x = 220 + (i % 45) * 16.5, y = y0 + Math.floor(i / 45) * 26;
            let k = 'lit';
            if (q.s === 0 && q.out < p) { k = 'off'; dead++; }
            else if (q.s === 1 && p > 0.3) k = Math.sin(time * 3 + q.ph) > -0.2 ? 'dim' : 'off';
            ctx.drawImage(sprite(k), x - 20, y - 6, 40, 40);
          });
        });
        ctx.textAlign = 'left'; ctx.fillStyle = C.boneA(0.9); ctx.font = '15px "Zen Old Mincho", serif';
        ctx.fillText('312 farolillos, uno por cada habitante del valle', 30, 56);
        ctx.fillStyle = C.boneA(0.55); ctx.font = '500 10px "IBM Plex Sans", sans-serif'; ctx.fillText('GRÁFICO DE UNIDADES · 1 FAROLILLO = 1 HABITANTE', 30, 76);
        ctx.font = '12px "IBM Plex Sans", sans-serif'; ctx.textBaseline = 'middle';
        drawIcon(ctx, 'ileso', 38, 100, 16); ctx.fillStyle = '#ff7a72'; ctx.fillText('60 siguen encendidos · ilesos', 52, 101);
        drawIcon(ctx, 'herido', 268, 100, 16); ctx.fillStyle = '#d0686e'; ctx.fillText('68 parpadean · heridos', 282, 101);
        drawIcon(ctx, 'muerto', 470, 100, 16); ctx.fillStyle = C.boneA(0.75); ctx.fillText(`${dead} de 184 se apagaron · muertos`, 484, 101); ctx.textBaseline = 'alphabetic';
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    },
  });
}
