// El valle de Yomigawa en 2D: mapa pintado a pincel, visto desde arriba.
// Vistas: 'valle' (la noche del ataque, Cap. I y II) y 'recuento' (columnas y farolillos, Cap. III).
import { C, rng, noise1, paper, mountains, brush, line, wash, house, callout, corners, frame, creature, spline } from './brush.js';
import { BARRIOS, CRIATURAS, nightAt, hhmm } from '../story.js';

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
  // montañas del norte (tres planos, la del fondo más tenue)
  mountains(ctx, { x0: -20, x1: 1020, base: 120, amp: 70, color: 'rgba(195,191,185,0.10)', fade: 90, seed: 31, freq: 0.004, rim: 0.25 });
  mountains(ctx, { x0: -20, x1: 1020, base: 150, amp: 85, color: 'rgba(195,191,185,0.16)', fade: 110, seed: 32, freq: 0.006, rim: 0.4 });
  mountains(ctx, { x0: -20, x1: 1020, base: 185, amp: 60, color: 'rgba(195,191,185,0.13)', fade: 120, seed: 33, freq: 0.009, rim: 0.5 });
  // bosque de Tsukimori y arboledas: manchas de pincel
  const R = rng(8);
  const grove = (cx, cy, n, r) => { for (let i = 0; i < n; i++) { const x = cx + (R() - 0.5) * r * 2, y = cy + (R() - 0.5) * r; brush(ctx, [[x, y], [x + 1, y - 6 - R() * 6]], { w: 5 + R() * 4, alpha: 0.28 + R() * 0.2, dry: 0.5, profile: 'start', seed: i + cx | 0, n: 5 }); } };
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
  ctx.restore();
  // título y rosa de los vientos
  ctx.fillStyle = C.boneA(0.75); ctx.font = '700 22px "Shippori Mincho B1", serif'; ctx.textAlign = 'left';
  ctx.fillText('黄泉川', 26, 690); ctx.font = '12px "IBM Plex Sans", sans-serif'; ctx.fillStyle = C.boneA(0.5); ctx.fillText('VALLE DE YOMIGAWA', 100, 688);
  ctx.strokeStyle = C.boneA(0.4); ctx.beginPath(); ctx.moveTo(40, 600); ctx.lineTo(40, 640); ctx.stroke(); ctx.fillStyle = C.boneA(0.6); ctx.font = '600 13px "Shippori Mincho B1", serif'; ctx.textAlign = 'center'; ctx.fillText('北', 40, 592);
  ctx.fillText('山', 120, 36); ctx.font = '10px "IBM Plex Sans", sans-serif'; ctx.fillText('MONTAÑAS DEL NORTE', 120, 52);
  corners(ctx, 1000, 720, { size: 70, color: 'rgba(154,31,40,0.5)' });
  ctx.restore();
}

function paintHouses(ctx, L) {
  ctx.save(); ctx.translate(L.ox, L.oy); ctx.scale(L.s, L.s);
  for (const h of M.houses) house(ctx, h.x, h.y, h.w);
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
  ctx.fillStyle = 'rgba(12,9,9,0.82)'; ctx.fillRect(x, y, w, h);
  frame(ctx, x, y, w, h, { color: C.boneA(0.3) });
  ctx.fillStyle = C.boneA(0.85); ctx.font = '13px "Zen Old Mincho", serif'; ctx.textAlign = 'left'; ctx.fillText('Pueblo alcanzado por el ataque', x + 16, y + 24);
  ctx.font = '10px "IBM Plex Sans", sans-serif'; ctx.fillStyle = C.boneA(0.5);
  for (const m of [0, 15, 30, 45, 60]) { const px = x + 30 + (m / 60) * (w - 60); ctx.textAlign = 'center'; ctx.fillText(hhmm(m), px, y + h - 10); line(ctx, [[px, y + h - 24], [px, y + h - 28]], { alpha: 0.5 }); }
  line(ctx, [[x + 30, y + h - 26], [x + w - 30, y + h - 26]], { alpha: 0.35 });
  line(ctx, [[x + 30, y + 42], [x + w - 30, y + 42]], { alpha: 0.2, dash: [2, 4] });
  ctx.textAlign = 'right'; ctx.fillText('100 %', x + 26, y + 46);
  ctx.restore();
}

// --- capa dinámica ---
function chartPt(m) { const x = 600, y = 22, w = 370, h = 150; return [x + 30 + (m / 60) * (w - 60), y + h - 26 - (nightAt(m, 'reach') / 100) * (h - 68)]; }

function drawNight(ctx, L, S, time) {
  const { m, heat = 0, trail = 0, dawn = 0 } = S;
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
    creature(ctx, c.t, x, y, c.t === 'dragon' ? 1.1 : 0.9, { alpha: 1 - dawn, ang: c.t === 'dragon' ? Math.atan2(ahead[1] - y, ahead[0] - x) * (f < 1 ? 1 : 0) : 0 });
  }
  // rastro de sangre de Kenji (Cap. II)
  if (trail > 0) {
    const tp = spline([[P(BARRIOS[0])[0] - 10, P(BARRIOS[0])[1] + 10], [420, 260], [540, 300], [630, 320]], 60);
    const n = Math.max(2, Math.floor(tp.length * trail));
    ctx.save(); ctx.strokeStyle = 'rgba(200,24,34,0.9)'; ctx.lineWidth = 3.2; ctx.setLineDash([7, 5]); ctx.beginPath(); ctx.moveTo(tp[0][0], tp[0][1]); for (let i = 1; i < n; i++) ctx.lineTo(tp[i][0], tp[i][1]); ctx.stroke(); ctx.restore();
    const e = tp[n - 1];
    if (trail < 1) { ctx.fillStyle = C.glow; ctx.beginPath(); ctx.arc(e[0], e[1], 4, 0, 7); ctx.fill(); ctx.fillStyle = C.bone; ctx.font = '12px "Zen Old Mincho", serif'; ctx.textAlign = 'center'; ctx.fillText('Kenji', e[0], e[1] - 12); }
    else { // los dos dragones colosales caídos
      creature(ctx, 'dragon', 600, 350, 2.6, { alpha: 0.9, ang: 0.4, color: '#8a8580' }); creature(ctx, 'dragon', 640, 270, 2.4, { alpha: 0.9, ang: -0.6, color: '#8a8580' });
      callout(ctx, [610, 345], [470, 470], 'Dos dragones colosales', { align: 'right', size: 12, sub: 'cortados por la cadena' });
    }
  }
  // gráfica: el humo del incienso dibuja la línea
  const mm = Math.min(60, m);
  const lp = []; for (let k = 0; k <= mm + 0.001; k += 0.5) lp.push(chartPt(k));
  if (lp.length > 1) { line(ctx, lp, { w: 5, color: C.boneA(0.12) }); line(ctx, lp, { w: 2, color: C.boneA(0.9) }); }
  const hp = chartPt(mm);
  ctx.fillStyle = C.glow; ctx.beginPath(); ctx.arc(hp[0], hp[1], 4.5, 0, 7); ctx.fill();
  ctx.fillStyle = '#f1ebe2'; ctx.font = '600 16px "Shippori Mincho B1", serif'; ctx.textAlign = 'center'; ctx.fillText(`${Math.round(nightAt(mm, 'reach'))} %`, hp[0], hp[1] - 12);
  // el incienso (reloj de la noche)
  drawIncense(ctx, 928, 690, mm, time, dawn);
  // amanecer
  if (dawn > 0) { ctx.fillStyle = `rgba(160,150,140,${0.1 * dawn})`; ctx.fillRect(0, 0, 1000, 720); }
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
          brush(ctx, [[x, y], [x, y - H]], { w: 26, color: '#d9d3cb', alpha: 0.9, profile: 'even', dry: 0.35, seed: b.dmg, n: 20 });
          ctx.fillStyle = C.glow; ctx.fillRect(x - 14, y - H - 4, 28, 5);
          ctx.fillStyle = '#f1ebe2'; ctx.font = '700 22px "Shippori Mincho B1", serif'; ctx.textAlign = 'center'; ctx.fillText(`${b.dmg} %`, x, y - H - 16);
          ctx.font = '11px "IBM Plex Sans", sans-serif'; ctx.fillStyle = C.boneA(0.7); ctx.fillText(b.name.toUpperCase(), x, y + 22);
        }
        ctx.globalAlpha = 1;
      }
      if (solid > 0 && colA > 0) { ctx.globalAlpha = solid * colA; ctx.fillStyle = C.boneA(0.85); ctx.font = '15px "Zen Old Mincho", serif'; ctx.textAlign = 'left'; ctx.fillText('Estructuras destruidas en cada barrio', 30, 40); ctx.globalAlpha = 1; }
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
        ctx.fillText('312 farolillos, uno por cada habitante del valle', 30, 64);
        ctx.font = '12px "IBM Plex Sans", sans-serif';
        ctx.fillStyle = '#ff7a72'; ctx.fillText('● 60 siguen encendidos', 30, 92);
        ctx.fillStyle = '#b84a50'; ctx.fillText('● 68 parpadean · heridos', 210, 92);
        ctx.fillStyle = C.boneA(0.6); ctx.fillText(`○ ${dead} se apagaron`, 410, 92);
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    },
  });
}
