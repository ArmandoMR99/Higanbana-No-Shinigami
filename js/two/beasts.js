// Bestias a tinta, en detalle: dragón de hueso, oni, yokai y kappa.
// Cada una se dibuja una vez en su caja y luego se estampa (mapa, ensō, fichas, emakimono).

const INK = 'rgba(8,6,6,0.95)';
const rng = (s) => { let x = s >>> 0 || 1; return () => ((x = Math.imul(x ^ (x >>> 15), 2246822507) + 0x6d2b79f5 >>> 0) / 4294967296); };
const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
function smooth(g, pts, close = true) { const n = pts.length; if (close) { g.moveTo(...mid(pts[n - 1], pts[0])); for (let i = 0; i < n; i++) g.quadraticCurveTo(pts[i][0], pts[i][1], ...mid(pts[i], pts[(i + 1) % n])); g.closePath(); } else { g.moveTo(...pts[0]); for (let i = 1; i < n - 1; i++) g.quadraticCurveTo(pts[i][0], pts[i][1], ...mid(pts[i], pts[i + 1])); g.lineTo(...pts[n - 1]); } }
function taper(g, pts, w0, w1, color) { // trazo cónico relleno
  const L = [], R = [];
  pts.forEach((p, i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)]; let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l; const w = w0 + (w1 - w0) * (i / (pts.length - 1)); L.push([p[0] + nx * w / 2, p[1] + ny * w / 2]); R.push([p[0] - nx * w / 2, p[1] - ny * w / 2]); });
  g.fillStyle = color; g.beginPath(); g.moveTo(...L[0]); L.forEach((p) => g.lineTo(...p)); R.reverse().forEach((p) => g.lineTo(...p)); g.closePath(); g.fill();
}
function bez(n, p0, p1, p2, p3) { const out = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; out.push([u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]); } return out; }

// ---------- dragón de hueso (mira a la izquierda) ----------
function dragon(g, hi) {
  const bone = hi ? '#c8141e' : '#d9d1c4', boneD = hi ? '#7a0c12' : '#8d857a', dark = hi ? '#4a070b' : '#1c1715', R = rng(11);
  const spine = bez(80, [48, 62], [110, 10], [150, 118], [258, 66]);
  const W = (t) => 17 * Math.pow(1 - t, 0.85) + 1.5;
  const L = [], Rr = [], N = [];
  spine.forEach((p, i) => { const a = spine[Math.max(0, i - 1)], b = spine[Math.min(spine.length - 1, i + 1)]; let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const l = Math.hypot(nx, ny); nx /= l; ny /= l; if (ny > 0) { nx = -nx; ny = -ny; } const w = W(i / 80); N.push([nx, ny]); L.push([p[0] + nx * w, p[1] + ny * w]); Rr.push([p[0] - nx * w, p[1] - ny * w]); });
  // patas traseras (detrás del cuerpo)
  const leg = (i, side, back) => {
    const base = spine[i], dn = [-N[i][0], -N[i][1]], fw = back ? 1 : -1;
    const knee = [base[0] + dn[0] * 16 + fw * 8, base[1] + dn[1] * 16 + 6], foot = [knee[0] - 10 + side * 4, knee[1] + 14];
    const col = back ? boneD : bone;
    taper(g, bez(6, base, mid(base, knee), [knee[0] + 3, knee[1] - 4], knee), 16, 9, col); taper(g, [knee, foot], 9, 6, col);
    g.fillStyle = col; g.beginPath(); g.ellipse(foot[0] - 2, foot[1] + 1, 6, 3.4, 0, 0, 7); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.6)'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(knee[0] - 3, knee[1] - 2); g.lineTo(knee[0] + 3, knee[1] + 2); g.stroke();
    for (const a of [-0.7, -0.15, 0.4]) { const ang = Math.PI + a; const t1 = [foot[0] - 2 + Math.cos(ang) * 9, foot[1] + Math.sin(ang) * 4 + 3]; g.strokeStyle = dark; g.lineWidth = 2; g.lineCap = 'round'; g.beginPath(); g.moveTo(foot[0] - 2, foot[1] + 1); g.quadraticCurveTo(t1[0], t1[1] - 2, t1[0] - 2, t1[1] + 3); g.stroke(); }
  };
  leg(52, 1, true); leg(14, 1, true);
  // cuerpo
  const body = new Path2D(); body.moveTo(...L[0]); L.forEach((p) => body.lineTo(...p)); for (let i = Rr.length - 1; i >= 0; i--) body.lineTo(...Rr[i]); body.closePath();
  g.fillStyle = bone; g.fill(body);
  g.save(); g.clip(body);
  // vientre en placas y sombra inferior
  for (let i = 2; i < 78; i += 2) { const a = Rr[i], b = Rr[i + 2], w = W(i / 80); g.fillStyle = 'rgba(0,0,0,0.18)'; g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.lineTo(b[0] + N[i][0] * w * 0.7, b[1] + N[i][1] * w * 0.7); g.lineTo(a[0] + N[i][0] * w * 0.7, a[1] + N[i][1] * w * 0.7); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 0.5; g.beginPath(); g.moveTo(...a); g.lineTo(a[0] + N[i][0] * w * 0.7, a[1] + N[i][1] * w * 0.7); g.stroke(); }
  // escamas de hueso en filas
  g.strokeStyle = hi ? 'rgba(60,0,0,0.55)' : 'rgba(30,24,22,0.55)'; g.lineWidth = 0.6;
  for (let i = 1; i < 78; i += 1.6) { const k = Math.floor(i), w = W(k / 80); for (let r = 0; r < 3; r++) { const f = 0.15 + r * 0.28 + ((Math.floor(i / 1.6) % 2) * 0.14); const c = [spine[k][0] + N[k][0] * w * f, spine[k][1] + N[k][1] * w * f]; const s = w * 0.22; g.beginPath(); g.arc(c[0], c[1], s, Math.atan2(N[k][1], N[k][0]) - 1.2 + Math.PI, Math.atan2(N[k][1], N[k][0]) + 1.2 + Math.PI); g.stroke(); } }
  const sg = g.createLinearGradient(0, 20, 0, 120); sg.addColorStop(0, 'rgba(255,255,255,0.12)'); sg.addColorStop(1, 'rgba(0,0,0,0.35)'); g.fillStyle = sg; g.fill(body);
  g.restore();
  g.strokeStyle = INK; g.lineWidth = 1.2; g.stroke(body);
  // púas dorsales y aleta de pelo
  for (let i = 4; i < 74; i += 3) { const p = L[i], n = N[i], h = 4 + W(i / 80) * 0.45; const back = [n[1] * 3, -n[0] * 3]; g.fillStyle = dark; g.beginPath(); g.moveTo(p[0] - back[0] * 0.7, p[1] - back[1] * 0.7); g.quadraticCurveTo(p[0] + n[0] * h, p[1] + n[1] * h, p[0] + n[0] * h + back[0] * 1.6, p[1] + n[1] * h + back[1] * 1.6); g.lineTo(p[0] + back[0], p[1] + back[1]); g.fill(); }
  const tail = spine[80]; g.fillStyle = hi ? '#ff5050' : 'rgba(225,218,206,0.9)';
  for (let k = 0; k < 7; k++) { const a = -0.9 + k * 0.3; g.beginPath(); g.moveTo(tail[0] - 4, tail[1]); g.quadraticCurveTo(tail[0] + Math.cos(a) * 8, tail[1] + Math.sin(a) * 10, tail[0] + Math.cos(a) * 15 + 4, tail[1] + Math.sin(a) * 14); g.lineTo(tail[0], tail[1] + 1); g.fill(); }
  // patas delanteras
  leg(56, -1, false); leg(18, -1, false);
  // crin
  const hp = spine[0];
  for (let k = 0; k < 16; k++) { const s = L[Math.min(12, k)], t = R(); g.strokeStyle = k % 3 ? (hi ? '#ff6a6a' : 'rgba(235,228,216,0.95)') : dark; g.lineWidth = 0.9 + t * 0.8; g.beginPath(); g.moveTo(s[0] - 2, s[1]); g.bezierCurveTo(s[0] + 6, s[1] - 10 - t * 6, s[0] + 14, s[1] - 6, s[0] + 20 + t * 10, s[1] - 14 - t * 8); g.stroke(); }
  // cabeza: hocico largo, mandíbula abierta, cuernos
  g.save(); g.translate(hp[0], hp[1]);
  const skull = [[6, -12], [-6, -14], [-18, -11], [-32, -8], [-40, -4], [-38, 0], [-24, 1], [-10, 4], [4, 6], [12, 0]];
  const jaw = [[2, 4], [-12, 6], [-26, 9], [-36, 13], [-34, 16], [-20, 15], [-6, 12], [6, 8]];
  g.fillStyle = bone; g.beginPath(); smooth(g, jaw); g.fill(); g.strokeStyle = INK; g.lineWidth = 1; g.stroke();
  g.fillStyle = '#3a0608'; g.beginPath(); g.moveTo(-36, 3); g.lineTo(-6, 5); g.lineTo(-30, 11); g.closePath(); g.fill();
  g.fillStyle = '#f2ece2'; for (let k = 0; k < 6; k++) { const x = -34 + k * 5; g.beginPath(); g.moveTo(x, 1.5); g.lineTo(x + 1.6, 6); g.lineTo(x + 3, 1.5); g.fill(); g.beginPath(); g.moveTo(x + 1, 11 - k * 0.4); g.lineTo(x + 2.4, 7 - k * 0.3); g.lineTo(x + 3.6, 11 - k * 0.4); g.fill(); }
  const sk = new Path2D(); smooth(sk, skull); g.fillStyle = bone; g.fill(sk);
  g.save(); g.clip(sk); const hg = g.createLinearGradient(0, -14, 0, 4); hg.addColorStop(0, 'rgba(255,255,255,0.15)'); hg.addColorStop(1, 'rgba(0,0,0,0.3)'); g.fillStyle = hg; g.fillRect(-42, -16, 56, 22); g.strokeStyle = 'rgba(30,24,22,0.5)'; g.lineWidth = 0.6; for (let k = 0; k < 7; k++) { g.beginPath(); g.arc(-30 + k * 5, -6, 3, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); } g.restore();
  g.strokeStyle = INK; g.lineWidth = 1.1; g.stroke(sk);
  g.fillStyle = dark; g.beginPath(); g.moveTo(-14, -12); g.quadraticCurveTo(-6, -17, 2, -13); g.lineTo(-4, -10); g.closePath(); g.fill(); // ceja
  const eg = g.createRadialGradient(-10, -8, 0, -10, -8, 7); eg.addColorStop(0, hi ? '#fff' : '#ff5050'); eg.addColorStop(0.35, 'rgba(224,48,58,0.8)'); eg.addColorStop(1, 'rgba(224,48,58,0)'); g.fillStyle = eg; g.beginPath(); g.arc(-10, -8, 7, 0, 7); g.fill();
  g.fillStyle = '#ff3a3a'; g.beginPath(); g.ellipse(-10, -8, 2.2, 1.4, -0.2, 0, 7); g.fill();
  g.fillStyle = dark; g.beginPath(); g.arc(-37, -4, 1, 0, 7); g.fill(); // nariz
  // cuernos ramificados
  for (const [ox, sc] of [[0, 1], [5, 0.85]]) { taper(g, bez(12, [ox - 2, -12], [ox + 6, -26 * sc], [ox + 18, -30 * sc], [ox + 30, -28 * sc]), 4, 1, dark); taper(g, bez(6, [ox + 10, -24 * sc], [ox + 12, -32 * sc], [ox + 14, -36 * sc], [ox + 12, -40 * sc]), 2.4, 0.8, dark); }
  // bigotes
  g.strokeStyle = hi ? '#ff8a8a' : 'rgba(235,228,216,0.9)'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(-36, -2); g.bezierCurveTo(-50, 4, -44, 24, -60, 30); g.moveTo(-34, -6); g.bezierCurveTo(-48, -16, -40, -30, -58, -34); g.stroke();
  g.restore();
}

// ---------- oni (de pie, de tres cuartos) ----------
function oni(g, hi, o = {}) {
  const skin = hi ? '#c8141e' : '#b9b1a5', skinD = hi ? '#7a0c12' : '#7d756b', dark = '#120d0c';
  const shade = (p, a = 0.35) => { g.save(); g.clip(p); const gr = g.createLinearGradient(90, 0, 30, 0); gr.addColorStop(0, 'rgba(255,255,255,0.12)'); gr.addColorStop(1, `rgba(0,0,0,${a})`); g.fillStyle = gr; g.fillRect(0, 0, 140, 160); g.restore(); };
  const fill = (pts, col, stroke = true) => { const p = new Path2D(); smooth(p, pts); g.fillStyle = col; g.fill(p); shade(p); if (stroke) { g.strokeStyle = INK; g.lineWidth = 1.1; g.stroke(p); } return p; };
  // garrote (kanabō) apoyado en el hombro, detrás
  if (!o.noClub) { g.save(); g.translate(98, 34); g.rotate(-0.55); const club = new Path2D(); club.moveTo(-3, 70); club.lineTo(3, 70); club.lineTo(7, -12); club.quadraticCurveTo(0, -18, -7, -12); club.closePath(); g.fillStyle = '#2a2220'; g.fill(club); g.strokeStyle = INK; g.lineWidth = 1; g.stroke(club);
  g.fillStyle = '#9a9288'; for (let y = -8; y < 40; y += 6) for (const x of [-3.5, 0, 3.5]) { g.beginPath(); g.arc(x * (1 - (y + 12) / 100), y + (x === 0 ? 3 : 0), 1, 0, 7); g.fill(); } g.restore(); }
  // piernas
  fill([[52, 108], [62, 108], [64, 130], [60, 148], [48, 150], [44, 146], [50, 130]], skinD);
  fill([[70, 108], [84, 106], [90, 128], [96, 148], [84, 150], [80, 146], [78, 130]], skin);
  g.fillStyle = dark; for (const [x, y] of [[44, 150], [82, 150]]) { g.beginPath(); g.ellipse(x + 6, y, 9, 3, 0, 0, 7); g.fill(); }
  // torso musculoso
  const torso = fill([[44, 54], [62, 44], [84, 44], [98, 56], [96, 82], [88, 104], [56, 106], [46, 84]], skin);
  g.save(); g.clip(torso); g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(72, 52); g.lineTo(72, 100); g.moveTo(54, 62); g.quadraticCurveTo(64, 72, 72, 66); g.quadraticCurveTo(82, 72, 92, 62); g.moveTo(60, 82); g.lineTo(84, 82); g.moveTo(62, 92); g.lineTo(82, 92); g.stroke(); g.restore();
  // taparrabos de piel de tigre
  const loin = fill([[50, 98], [92, 96], [94, 112], [84, 122], [72, 116], [58, 122], [48, 112]], hi ? '#e0303a' : '#d6cdbf');
  g.save(); g.clip(loin); g.fillStyle = dark; for (let k = 0; k < 7; k++) { const x = 52 + k * 6; g.beginPath(); g.moveTo(x, 96); g.quadraticCurveTo(x + 4, 104, x + 1, 120); g.lineTo(x + 3, 120); g.quadraticCurveTo(x + 6, 106, x + 3, 96); g.fill(); } g.restore();
  // brazo trasero con la antorcha de fuego azul
  fill([[48, 58], [40, 70], [32, 86], [30, 98], [37, 100], [42, 86], [52, 72]], skinD);
  g.fillStyle = '#3a2e28'; g.fillRect(27, 78, 4, 34);
  const fg = g.createRadialGradient(29, 72, 0, 29, 72, 22); fg.addColorStop(0, 'rgba(220,235,255,1)'); fg.addColorStop(0.25, 'rgba(110,150,255,0.95)'); fg.addColorStop(0.6, 'rgba(74,123,255,0.4)'); fg.addColorStop(1, 'rgba(74,123,255,0)'); g.fillStyle = fg; g.beginPath(); g.arc(29, 72, 22, 0, 7); g.fill();
  g.fillStyle = 'rgba(200,220,255,0.9)'; g.beginPath(); g.moveTo(24, 80); g.quadraticCurveTo(22, 66, 29, 54); g.quadraticCurveTo(30, 66, 35, 62); g.quadraticCurveTo(36, 74, 33, 80); g.closePath(); g.fill();
  // brazo delantero sujetando el garrote
  fill([[90, 52], [102, 58], [108, 72], [104, 86], [96, 84], [98, 72], [88, 64]], skin);
  g.fillStyle = skin; g.beginPath(); g.arc(102, 86, 5, 0, 7); g.fill(); g.strokeStyle = INK; g.stroke();
  // cabeza: melena, cuernos, colmillos
  g.fillStyle = dark; g.beginPath(); smooth(g, [[50, 18], [60, 6], [78, 4], [92, 14], [96, 30], [90, 44], [72, 50], [54, 44], [46, 30]]); g.fill();
  for (let k = 0; k < 14; k++) { const a = Math.PI * (0.9 + k * 0.09), r = 22; g.beginPath(); g.moveTo(72 + Math.cos(a) * 14, 26 + Math.sin(a) * 14); g.lineTo(72 + Math.cos(a + 0.06) * (r + 8 + (k % 3) * 4), 26 + Math.sin(a + 0.06) * (r + 8)); g.lineTo(72 + Math.cos(a + 0.14) * 14, 26 + Math.sin(a + 0.14) * 14); g.fill(); }
  const face = fill([[60, 18], [72, 14], [86, 18], [88, 32], [82, 44], [72, 46], [62, 42], [58, 30]], skin);
  for (const [x, s] of [[62, -1], [84, 1]]) { taper(g, bez(8, [x, 18], [x + s * 2, 8], [x + s * 6, 2], [x + s * 4, -6]), 5, 1, hi ? '#f2ece2' : '#e8e1d5'); }
  g.fillStyle = dark; g.beginPath(); g.moveTo(62, 24); g.lineTo(71, 27); g.lineTo(62, 28); g.fill(); g.beginPath(); g.moveTo(86, 24); g.lineTo(76, 27); g.lineTo(86, 28); g.fill();
  g.fillStyle = '#ffd34a'; g.beginPath(); g.arc(66, 28.5, 1.4, 0, 7); g.arc(81, 28.5, 1.4, 0, 7); g.fill();
  g.fillStyle = '#2a0606'; g.beginPath(); g.moveTo(64, 36); g.quadraticCurveTo(73, 42, 83, 36); g.quadraticCurveTo(73, 39, 64, 36); g.fill();
  g.fillStyle = '#f2ece2'; g.beginPath(); g.moveTo(65, 36); g.lineTo(66.5, 31); g.lineTo(68, 36.5); g.fill(); g.beginPath(); g.moveTo(78, 36.5); g.lineTo(79.5, 31); g.lineTo(81, 36); g.fill();
  g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(72, 28); g.lineTo(73, 33); g.lineTo(71, 34); g.stroke();
}

// ---------- yokai (espectro con melena) ----------
function yokai(g, hi) {
  const robe = hi ? 'rgba(224,48,58,0.9)' : 'rgba(232,227,219,0.92)';
  // aura
  const au = g.createRadialGradient(55, 60, 0, 55, 64, 60); au.addColorStop(0, hi ? 'rgba(224,48,58,0.35)' : 'rgba(225,220,212,0.22)'); au.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = au; g.fillRect(0, 0, 110, 140);
  // kimono blanco que se deshace en humo
  const body = new Path2D(); smooth(body, [[40, 34], [68, 32], [80, 56], [84, 84], [78, 104], [70, 118], [60, 136], [56, 116], [48, 128], [44, 108], [32, 116], [34, 90], [30, 60]]);
  const gr = g.createLinearGradient(0, 30, 0, 136); gr.addColorStop(0, robe); gr.addColorStop(0.65, hi ? 'rgba(160,20,30,0.6)' : 'rgba(210,205,198,0.55)'); gr.addColorStop(1, 'rgba(210,205,198,0)');
  g.fillStyle = gr; g.fill(body);
  g.save(); g.clip(body); g.strokeStyle = 'rgba(40,34,32,0.35)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(50, 36); g.lineTo(62, 70); g.lineTo(58, 110); g.moveTo(44, 60); g.quadraticCurveTo(46, 90, 40, 112); g.moveTo(72, 62); g.quadraticCurveTo(76, 88, 70, 112); g.stroke(); g.restore();
  // mangas y manos colgando hacia delante
  g.fillStyle = robe; g.beginPath(); smooth(g, [[64, 44], [86, 52], [96, 66], [90, 74], [78, 66], [66, 62]]); g.fill();
  g.fillStyle = hi ? '#ffb0b0' : '#d8d0c6'; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(90 + k * 1.6, 70); g.quadraticCurveTo(94 + k * 1.6, 76, 92 + k * 2, 82); g.lineTo(93 + k * 2, 82); g.quadraticCurveTo(96 + k * 1.6, 76, 92 + k * 1.6, 70); g.fill(); }
  // melena negra larga que tapa la cara
  g.fillStyle = '#060404'; g.beginPath(); smooth(g, [[44, 8], [60, 4], [72, 12], [76, 30], [74, 54], [70, 76], [62, 64], [58, 80], [52, 62], [46, 74], [42, 50], [38, 26]]); g.fill();
  g.strokeStyle = 'rgba(200,192,182,0.25)'; g.lineWidth = 0.5; for (let k = 0; k < 10; k++) { g.beginPath(); g.moveTo(46 + k * 2.6, 10); g.quadraticCurveTo(44 + k * 3, 40, 46 + k * 2.5, 66 + (k % 3) * 4); g.stroke(); }
  // ojo rojo entre el pelo
  const eg = g.createRadialGradient(62, 30, 0, 62, 30, 8); eg.addColorStop(0, '#ffdede'); eg.addColorStop(0.3, '#e0303a'); eg.addColorStop(1, 'rgba(224,48,58,0)'); g.fillStyle = eg; g.beginPath(); g.arc(62, 30, 8, 0, 7); g.fill();
  g.fillStyle = '#ff4040'; g.beginPath(); g.ellipse(62, 30, 2.2, 1.2, 0, 0, 7); g.fill();
  // fuegos fatuos
  for (const [x, y, r] of [[16, 46, 6], [96, 30, 5], [22, 96, 4.5]]) { const fg = g.createRadialGradient(x, y, 0, x, y, r * 2.4); fg.addColorStop(0, 'rgba(240,240,255,0.95)'); fg.addColorStop(0.35, 'rgba(150,180,255,0.6)'); fg.addColorStop(1, 'rgba(120,150,255,0)'); g.fillStyle = fg; g.beginPath(); g.arc(x, y, r * 2.4, 0, 7); g.fill(); g.fillStyle = 'rgba(230,236,255,0.9)'; g.beginPath(); g.moveTo(x - r * 0.6, y); g.quadraticCurveTo(x, y - r * 2.2, x + r * 0.3, y - r * 2.6); g.quadraticCurveTo(x + r * 0.8, y - r, x + r * 0.6, y); g.arc(x, y, r * 0.6, 0, Math.PI); g.fill(); }
}

// ---------- kappa (de pie, encorvado) ----------
function kappa(g, hi) {
  const skin = hi ? '#c8141e' : '#8e968c', skinD = hi ? '#7a0c12' : '#5d655c', shell = hi ? '#7a0c12' : '#3e3a33';
  const fill = (pts, col, a = 0.35) => { const p = new Path2D(); smooth(p, pts); g.fillStyle = col; g.fill(p); g.save(); g.clip(p); const gr = g.createLinearGradient(80, 0, 20, 0); gr.addColorStop(0, 'rgba(255,255,255,0.14)'); gr.addColorStop(1, `rgba(0,0,0,${a})`); g.fillStyle = gr; g.fillRect(0, 0, 110, 130); g.restore(); g.strokeStyle = INK; g.lineWidth = 1; g.stroke(p); return p; };
  // caparazón en la espalda (detrás)
  const sh = fill([[22, 44], [40, 34], [52, 44], [54, 74], [46, 96], [30, 100], [18, 84], [16, 60]], shell, 0.25);
  g.save(); g.clip(sh); g.strokeStyle = 'rgba(210,200,185,0.35)'; g.lineWidth = 0.8; for (const [x, y] of [[34, 50], [30, 66], [36, 82], [22, 72], [44, 66]]) { g.beginPath(); for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; g.lineTo(x + Math.cos(a) * 7, y + Math.sin(a) * 7); } g.closePath(); g.stroke(); } g.restore();
  // piernas
  fill([[42, 96], [52, 96], [54, 112], [50, 124], [42, 124], [44, 110]], skinD); fill([[58, 94], [68, 96], [72, 112], [70, 124], [62, 124], [62, 110]], skin);
  g.fillStyle = skinD; for (const [x, y] of [[40, 124], [60, 124]]) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + 16, y); g.lineTo(x + 18, y + 3); g.lineTo(x + 13, y + 2); g.lineTo(x + 10, y + 4); g.lineTo(x + 7, y + 2); g.lineTo(x, y + 3); g.fill(); }
  // cuerpo
  const body = fill([[40, 50], [62, 44], [76, 56], [76, 80], [70, 98], [48, 100], [40, 82]], skin);
  g.save(); g.clip(body); g.fillStyle = hi ? 'rgba(255,200,200,0.3)' : 'rgba(225,220,200,0.35)'; g.beginPath(); smooth(g, [[58, 54], [72, 60], [72, 86], [62, 96], [54, 84]]); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 0.6; for (let y = 62; y < 94; y += 6) { g.beginPath(); g.moveTo(56, y); g.lineTo(72, y + 1); g.stroke(); } g.fillStyle = 'rgba(0,0,0,0.25)'; const R = rng(4); for (let k = 0; k < 30; k++) { g.beginPath(); g.arc(40 + R() * 36, 48 + R() * 50, 0.7, 0, 7); g.fill(); } g.restore();
  // brazos con manos palmeadas
  fill([[70, 56], [82, 64], [88, 78], [84, 82], [76, 72], [68, 66]], skin);
  g.fillStyle = skin; g.beginPath(); g.moveTo(84, 78); g.lineTo(96, 80); g.lineTo(92, 84); g.lineTo(96, 88); g.lineTo(88, 88); g.lineTo(86, 92); g.lineTo(82, 84); g.closePath(); g.fill(); g.strokeStyle = INK; g.lineWidth = 0.8; g.stroke();
  // cabeza: pico, ojos, plato de agua y fleco
  const head = fill([[48, 20], [62, 12], [78, 16], [84, 28], [80, 40], [66, 46], [52, 42], [46, 32]], skin);
  g.fillStyle = hi ? '#ffcccc' : '#c9bf9c'; g.beginPath(); g.moveTo(80, 28); g.quadraticCurveTo(96, 30, 98, 36); g.quadraticCurveTo(90, 40, 80, 38); g.closePath(); g.fill(); g.strokeStyle = INK; g.lineWidth = 0.9; g.stroke(); g.beginPath(); g.moveTo(80, 33.5); g.lineTo(96, 35); g.stroke();
  g.fillStyle = '#f2ece2'; g.beginPath(); g.arc(72, 25, 3.4, 0, 7); g.fill(); g.fillStyle = '#100'; g.beginPath(); g.arc(73, 25, 1.6, 0, 7); g.fill(); g.fillStyle = '#e0303a'; g.beginPath(); g.arc(73.4, 24.6, 0.5, 0, 7); g.fill();
  g.fillStyle = '#060404'; for (let k = 0; k < 12; k++) { const x = 46 + k * 3; g.beginPath(); g.moveTo(x, 16 - Math.sin(k / 11 * Math.PI) * 6); g.lineTo(x + 1.4, 26 + (k % 3) * 2); g.lineTo(x + 3, 16 - Math.sin((k + 1) / 11 * Math.PI) * 6); g.fill(); }
  g.fillStyle = '#d8d2c6'; g.beginPath(); g.ellipse(62, 12, 12, 4, -0.15, 0, 7); g.fill(); g.strokeStyle = INK; g.lineWidth = 0.9; g.stroke();
  g.fillStyle = 'rgba(150,170,190,0.85)'; g.beginPath(); g.ellipse(62, 11.5, 8.5, 2.4, -0.15, 0, 7); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.7)'; g.beginPath(); g.ellipse(59, 11, 3, 0.8, -0.15, 0, 7); g.fill();
}

export const BEAST_BOX = { dragon: [270, 140], oni: [130, 160], yokai: [110, 140], kappa: [110, 130] };
export function drawBeast(g, type, hi = false, o = {}) {
  g.save();
  if (type === 'dragon') dragon(g, hi); else if (type === 'oni') oni(g, hi, o); else if (type === 'yokai') yokai(g, hi); else kappa(g, hi);
  g.restore();
}

// silueta a contraluz con borde iluminado (para escenas: el oni tras las tablas, el dragón caído)
const SIL = {};
export function beastSilhouette(type, { scale = 2, color = 'rgba(8,6,6,0.98)', rim = 'rgba(225,215,205,0.55)', rimDx = -1.6, rimDy = -0.8, noClub = false } = {}) {
  const key = [type, scale, color, rim, noClub].join('|'); if (SIL[key]) return SIL[key];
  const [w, h] = BEAST_BOX[type], pad = 6;
  const mk = () => { const c = document.createElement('canvas'); c.width = Math.ceil((w + pad * 2) * scale); c.height = Math.ceil((h + pad * 2) * scale); const g = c.getContext('2d'); g.scale(scale, scale); g.translate(pad, pad); drawBeast(g, type, false, { noClub }); return c; };
  const base = mk(), out = document.createElement('canvas'); out.width = base.width; out.height = base.height;
  const tint = (col) => { const c = document.createElement('canvas'); c.width = base.width; c.height = base.height; const g = c.getContext('2d'); g.drawImage(base, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, c.width, c.height); return c; };
  const o = out.getContext('2d');
  if (rim) { o.drawImage(tint(rim), 0, 0); }
  o.drawImage(tint(color), rim ? -rimDx * scale : 0, rim ? -rimDy * scale : 0);
  out.w = w + pad * 2; out.h = h + pad * 2; out.pad = pad;
  return (SIL[key] = out);
}
