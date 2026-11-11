// Personajes a tinta: un esqueleto por pose y la ropa construida sobre él
// (kimono, hakama, haori, mangas), cabeza de perfil con pelo propio de cada uno,
// sombreado interior, luz de borde y pliegues. Se dibujan una vez y se guardan como sprite.
// Caja: 200 de alto, pies en y = 200, mirando a la derecha.

const RIM = 'rgba(222,214,204,0.78)';
const T = { skin: '#2e2523', hair: '#070505', top: '#161110', top2: '#1b1513', hak: '#0e0b0b', sleeve: '#191312', obi: '#2a1d1b', haori: '#120e0d', robe: '#1a1311', cloak: '#141010', light: 'rgba(225,218,208,' };

// ---------- poses ----------
// H cabeza · N cuello · S hombros (B atrás, F delante) · E codos · W muñecas · P pelvis · K rodillas · F pies
const POSES = {
  stand: { H: [5, 24], N: [4, 44], SB: [-13, 53], SF: [19, 53], EB: [-17, 80], WB: [-14, 104], EF: [24, 80], WF: [27, 104], P: [3, 100], KB: [-5, 150], FB: [-8, 196], KF: [11, 150], FF: [15, 196], tilt: 0 },
  walk: { H: [12, 25], N: [9, 44], SB: [-6, 52], SF: [21, 53], EB: [-16, 77], WB: [-26, 96], EF: [30, 76], WF: [40, 92], P: [4, 101], KB: [-12, 148], FB: [-28, 195], KF: [22, 146], FF: [34, 196], tilt: 0.06 },
  fight: { H: [14, 27], N: [10, 46], SB: [-5, 54], SF: [22, 55], EB: [-18, 74], WB: [-28, 88], EF: [34, 66], WF: [46, 54], P: [2, 104], KB: [-16, 150], FB: [-34, 196], KF: [26, 148], FF: [40, 196], tilt: 0.1 },
  kneel: { H: [15, 62], N: [10, 82], SB: [-7, 90], SF: [22, 91], EB: [-8, 116], WB: [-2, 138], EF: [34, 114], WF: [48, 128], P: [0, 140], KB: [-6, 194], FB: [-40, 198], KF: [30, 138], FF: [32, 196], tilt: 0.14 },
};
POSES.stand.mother = true;

// ---------- utilidades geométricas ----------
const add = (a, b) => [a[0] + b[0], a[1] + b[1]], sub = (a, b) => [a[0] - b[0], a[1] - b[1]], mul = (a, k) => [a[0] * k, a[1] * k];
const mid = (a, b, t = 0.5) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const nrm = (a) => { const l = Math.hypot(a[0], a[1]) || 1; return [a[0] / l, a[1] / l]; };
const perp = (a) => [-a[1], a[0]];
function closed(g, pts) { // curva cerrada suave por los puntos medios
  const n = pts.length; g.moveTo(...mid(pts[n - 1], pts[0]));
  for (let i = 0; i < n; i++) g.quadraticCurveTo(pts[i][0], pts[i][1], ...mid(pts[i], pts[(i + 1) % n]));
  g.closePath();
}
function open(g, pts) { g.moveTo(...pts[0]); for (let i = 1; i < pts.length - 1; i++) g.quadraticCurveTo(pts[i][0], pts[i][1], ...mid(pts[i], pts[i + 1])); g.lineTo(...pts[pts.length - 1]); }
// banda alrededor de una polilínea, con ancho variable
function band(pts, ws) {
  const L = [], R = [];
  pts.forEach((p, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const n = perp(nrm(sub(b, a))), w = ws[i];
    L.push(add(p, mul(n, w))); R.push(sub(p, mul(n, w)));
  });
  return [...L, ...R.reverse()];
}
const R0 = (s) => { let x = s >>> 0 || 1; return () => ((x = Math.imul(x ^ (x >>> 15), 2246822507) + 0x6d2b79f5 >>> 0) / 4294967296); };

// ---------- pintor de piezas: relleno, luz de borde, sombra y pliegues ----------
const LIGHT = nrm([0.75, -0.65]);
function piece(g, shape, fill, o = {}) {
  const { rim = RIM, rimW = 1.5, folds = null, dark = 0, pattern = null, soft = 0.07 } = o;
  const path = new Path2D(); if (o.sharp) { path.moveTo(...shape[0]); for (const q of shape.slice(1)) path.lineTo(...q); path.closePath(); } else closed(path, shape);
  g.save();
  g.fillStyle = fill; g.fill(path);
  if (o.flat) { g.restore(); return path; }
  g.clip(path);
  // luz de borde: media luna del lado iluminado
  if (rim) { g.fillStyle = rim; g.fill(path); g.save(); g.translate(-LIGHT[0] * rimW, -LIGHT[1] * rimW); g.fillStyle = fill; g.fill(path); g.restore(); }
  // volumen: degradado de luz a sombra
  const xs = shape.map((p) => p[0]), ys = shape.map((p) => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const gr = g.createLinearGradient(x1, y0, x0, y1); gr.addColorStop(0, T.light + soft + ')'); gr.addColorStop(0.45, T.light + '0)'); gr.addColorStop(1, `rgba(0,0,0,${0.22 + dark})`);
  g.fillStyle = gr; g.fillRect(x0 - 2, y0 - 2, x1 - x0 + 4, y1 - y0 + 4);
  if (pattern) pattern(g, x0, y0, x1, y1);
  { // textura de pincel seco
    const R = R0(Math.round(x0 * 7 + y0 * 13)); g.strokeStyle = T.light + '0.035)'; g.lineWidth = 0.5;
    for (let i = 0; i < (x1 - x0) * (y1 - y0) / 40; i++) { const x = x0 + R() * (x1 - x0), y = y0 + R() * (y1 - y0), l = 2 + R() * 6; g.beginPath(); g.moveTo(x, y); g.lineTo(x + l * 0.2, y + l); g.stroke(); }
  }
  if (folds) { g.lineCap = 'round'; for (const f of folds) { g.strokeStyle = f[2] || T.light + '0.16)'; g.lineWidth = f[1] || 0.8; g.beginPath(); open(g, f[0]); g.stroke(); } }
  g.restore();
  g.save(); g.strokeStyle = 'rgba(0,0,0,0.85)'; g.lineWidth = 0.7; g.stroke(path); g.restore();
  return path;
}

// patrones de tela (muy sutiles)
const kasuri = (g, x0, y0, x1, y1) => { g.strokeStyle = T.light + '0.07)'; g.lineWidth = 0.6; for (let y = y0; y < y1; y += 6) for (let x = x0 + ((y / 6) % 2) * 3; x < x1; x += 6) { g.beginPath(); g.moveTo(x - 1.2, y); g.lineTo(x + 1.2, y); g.moveTo(x, y - 1.2); g.lineTo(x, y + 1.2); g.stroke(); } };
const asanoha = (g, x0, y0, x1, y1) => { g.strokeStyle = T.light + '0.06)'; g.lineWidth = 0.5; const s = 7; for (let y = y0; y < y1 + s; y += s * 0.87) for (let x = x0 + ((Math.round(y / (s * 0.87)) % 2) * s / 2); x < x1 + s; x += s) { g.beginPath(); for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; g.moveTo(x, y); g.lineTo(x + Math.cos(a) * s * 0.5, y + Math.sin(a) * s * 0.5); } g.stroke(); } };
const blossoms = (g, x0, y0, x1, y1) => { const R = R0(7); for (let i = 0; i < 14; i++) { const x = x0 + R() * (x1 - x0), y = y0 + R() * (y1 - y0); g.fillStyle = T.light + '0.09)'; for (let k = 0; k < 5; k++) { const a = k * 1.2566; g.beginPath(); g.ellipse(x + Math.cos(a) * 1.6, y + Math.sin(a) * 1.6, 1.3, 0.8, a, 0, 7); g.fill(); } g.fillStyle = 'rgba(200,40,50,0.25)'; g.beginPath(); g.arc(x, y, 0.6, 0, 7); g.fill(); } };
const stripes = (g, x0, y0, x1, y1) => { g.strokeStyle = T.light + '0.05)'; g.lineWidth = 0.7; for (let x = x0; x < x1; x += 3.2) { g.beginPath(); g.moveTo(x, y0); g.lineTo(x + 2, y1); g.stroke(); } };

// ---------- partes ----------
function legs(g, J, who, flat, color) {
  const back = [add(J.P, [-4, 2]), J.KB, J.FB], front = [add(J.P, [5, 2]), J.KF, J.FF];
  const ws = [8, 10, 14];
  const kneel = J === POSES.kneel;
  if (kneel) { // pierna de atrás con la rodilla en el suelo
    const P = J.P, K = J.KB, F = J.FB;
    piece(g, [add(P, [-9, -4]), add(P, [9, -2]), add(K, [9, -3]), add(K, [7, 3]), add(F, [2, 2]), add(F, [0, -5]), add(K, [-8, -9])], flat ? color : T.hak, { flat, dark: 0.3, soft: 0.04, folds: [[[add(P, [-2, 4]), add(K, [-1, -6])], 0.6]] });
  }
  for (const [L, dk] of (kneel ? [[front, 0]] : [[back, 0.3], [front, 0]])) {
    const sh = band(L, kneel ? [9, 10, 12] : ws);
    const kneeFold = [[mid(L[0], L[1], 0.3), mid(L[0], L[1], 0.95)], 0.7];
    const pleats = kneel ? [] : [-6, 0, 6].map((o) => [[add(mid(L[0], L[1], 0.15), [o, 0]), add(L[1], [o * 1.2, 0]), add(L[2], [o * 1.6, -2])], 0.6, T.light + '0.12)']);
    piece(g, sh, flat ? color : T.hak, { flat, dark: dk, soft: 0.04, folds: [kneeFold, ...pleats] });
  }
  // pieza de la cintura que une las dos piernas (el hakama es una falda partida)
  const wp = [add(J.P, [-14, -6]), add(J.P, [14, -6]), add(J.P, [12, 14]), add(J.P, [1, 20]), add(J.P, [-12, 14])];
  piece(g, wp, flat ? color : T.hak, { flat, folds: [-7, 0, 7].map((o) => [[add(J.P, [o, -4]), add(J.P, [o * 1.1, 22])], 0.6, T.light + '0.12)']) });
}
function feet(g, J, flat, color) {
  for (const [F, dk] of (J === POSES.kneel ? [[J.FF, 0]] : [[J.FB, 1], [J.FF, 0]])) {
    const sh = [add(F, [-5, -5]), add(F, [4, -6]), add(F, [9, -2]), add(F, [9, 2]), add(F, [-6, 2])];
    piece(g, sh, flat ? color : dk ? '#1c1716' : '#2a2321', { flat, rimW: 1.2 });
    if (!flat) { g.save(); g.strokeStyle = T.light + '0.35)'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(F[0] - 6, F[1] + 2.6); g.lineTo(F[0] + 9.5, F[1] + 2.6); g.stroke(); g.beginPath(); g.moveTo(F[0] + 1, F[1] - 5); g.lineTo(F[0] + 4, F[1] + 1); g.stroke(); g.restore(); }
  }
}
function torso(g, J, who, flat, color) {
  const sh = [add(J.N, [-7, -1]), add(J.SB, [-3, 1]), [J.SB[0] - 1, (J.SB[1] + J.P[1]) / 2], add(J.P, [-13, -3]), add(J.P, [13, -3]), [J.SF[0] + 3, J.SF[1] + 18], add(J.SF, [3, 1]), add(J.N, [7, -1])];
  const collar = [add(J.N, [5, -1]), mid(J.N, J.P, 0.45), add(J.P, [9, -6])];
  piece(g, sh, flat ? color : who === 'father' ? T.top2 : T.top, { flat, pattern: who === 'kenji' ? kasuri : stripes, folds: [[collar, 2.4, T.light + '0.32)'], [[add(J.SB, [4, 8]), mid(J.SB, J.P, 0.6), add(J.P, [-4, -4])], 0.7], [[add(J.SF, [-2, 10]), add(J.P, [4, -10])], 0.6]] });
  if (!flat) { // cuello blanco del juban
    g.save(); g.strokeStyle = 'rgba(210,202,192,0.55)'; g.lineWidth = 1.4; g.beginPath(); open(g, [add(J.N, [3, -2]), add(J.N, [7, 6]), add(J.N, [9, 12])]); g.stroke(); g.restore();
  }
}
function obi(g, J, who, flat, color) {
  const w = who === 'mother' ? 10 : 5, y = J.P[1] - (who === 'mother' ? 20 : 6);
  const sh = [[J.P[0] - 14, y], [J.P[0] + 14, y - 1], [J.P[0] + 14.5, y + w], [J.P[0] - 14, y + w + 1]];
  piece(g, sh, flat ? color : T.obi, { flat, sharp: true, rimW: 1.2, folds: [[[[J.P[0] - 13, y + w / 2], [J.P[0] + 13, y + w / 2 - 0.5]], 0.5, T.light + '0.2)']] });
  if (who === 'mother' && !flat) { // lazo del obi a la espalda
    const b = [J.P[0] - 14, y + w / 2];
    piece(g, [add(b, [0, -6]), add(b, [-12, -11]), add(b, [-15, -2]), add(b, [-11, 9]), add(b, [0, 6])], T.obi, { rimW: 1.4, folds: [[[add(b, [-2, 0]), add(b, [-12, -3])], 0.5]] });
  }
  if (who === 'kenji' || who === 'father') { // cordones del hakama
    if (!flat) { g.save(); g.strokeStyle = T.light + '0.3)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(J.P[0] + 8, y + w); g.quadraticCurveTo(J.P[0] + 10, y + w + 6, J.P[0] + 7, y + w + 10); g.stroke(); g.restore(); }
  }
}
function sleeve(g, S, E, W, dk, flat, color, who) {
  // manga de kimono: el brazo va por arriba y la bolsa de tela cuelga por gravedad hacia atrás
  const drop = who === 'mother' ? 34 : who === 'ronin' ? 30 : 26;
  const d = nrm(sub(W, E)); let u = perp(nrm(sub(W, S))); if (u[1] > 0) u = mul(u, -1);
  const cuff = add(W, mul(d, 2));
  const yb = Math.max(W[1] + 8, Math.min(E[1], W[1]) + drop);
  const xb = Math.min(E[0], W[0]) - (who === 'mother' ? 22 : 17);
  const sh = [add(S, [3, -5]), add(E, mul(u, 5)), add(cuff, mul(u, 4)), add(cuff, mul(d, 1)), [cuff[0] + d[0], yb - 3], [cuff[0] - 4, yb + 1], [xb + 4, yb + 1.5], [xb, yb - 4], [Math.min(S[0] - 6, xb + 2), S[1] + 18], add(S, [-6, 2])];
  const low = [xb + 6, yb];
  piece(g, sh, flat ? color : T.sleeve, { flat, dark: dk, pattern: who === 'mother' ? blossoms : who === 'kenji' ? kasuri : null, folds: [[[add(E, [-2, 5]), add(low, [6, -4])], 0.7], [[add(S, [-2, 10]), mid(S, E, 0.7), add(low, [-1, -8])], 0.6], [[add(cuff, mul(u, 3)), add(cuff, mul(d, 1)), [cuff[0] + d[0], cuff[1] + 6]], 1.3, T.light + '0.32)']] });
}
function hand(g, E, W, flat, color) {
  const d = nrm(sub(W, E)), n = perp(d);
  const c = add(W, mul(d, 3.5));
  const sh = [add(c, mul(n, 3)), add(c, add(mul(d, 4), mul(n, 2))), add(c, mul(d, 5)), add(c, add(mul(d, 3), mul(n, -3.2))), add(c, add(mul(d, -1), mul(n, -3)))];
  piece(g, sh, flat ? color : T.skin, { flat, rimW: 1.1, soft: 0.2 });
}
function robe(g, J, who, flat, color) { // kimono largo (madre) o capa (ronin)
  const ronin = who === 'ronin';
  const top = [add(J.N, [-6, -1]), add(J.SB, [-3, 0])], hemY = ronin ? 186 : 197;
  const sh = [...top, [J.SB[0] - 3, 110], [J.FB[0] - (ronin ? 12 : 6), hemY], [J.FF[0] + (ronin ? 14 : 10), hemY + 1], [J.SF[0] + 4, 112], add(J.SF, [2, 0]), add(J.N, [6, -1])];
  const folds = [[[add(J.N, [5, -1]), mid(J.N, J.P, 0.5), [J.P[0] + 10, 150], [J.FF[0] + 4, hemY - 2]], 2, T.light + '0.28)'], [[[J.P[0] - 6, 120], [J.FB[0] - 2, hemY - 4]], 0.7], [[[J.P[0] + 2, 130], [J.P[0] + 4, hemY - 3]], 0.6]];
  piece(g, sh, flat ? color : ronin ? T.cloak : T.robe, { flat, pattern: ronin ? null : asanoha, folds });
  if (ronin && !flat) { // borde deshilachado
    g.save(); g.fillStyle = T.cloak; const R = R0(5); g.beginPath(); for (let x = J.FB[0] - 12; x < J.FF[0] + 14; x += 3) { const l = 3 + R() * 7; g.moveTo(x, hemY - 1); g.lineTo(x + 1.6, hemY + l); g.lineTo(x + 3, hemY - 1); } g.fill(); g.restore();
  }
}
function haori(g, J, flat, color) {
  const sh = [add(J.N, [-7, 0]), add(J.SB, [-4, 0]), [J.SB[0] - 6, J.P[1] + 38], [J.SF[0] + 4, J.P[1] + 38], add(J.SF, [4, 1]), add(J.N, [7, 0])];
  piece(g, sh, flat ? color : T.haori, { flat, sharp: true, folds: [[[add(J.N, [6, 0]), [J.SF[0] - 1, J.P[1] + 36]], 2.2, T.light + '0.3)'], [[[J.SB[0], J.P[1]], [J.SB[0] - 3, J.P[1] + 34]], 0.7]] });
  if (!flat) { g.save(); g.strokeStyle = T.light + '0.4)'; g.lineWidth = 0.7; g.beginPath(); g.arc(J.SB[0] + 4, J.SB[1] + 10, 4, 0, 7); g.moveTo(J.SB[0] + 4, J.SB[1] + 6); g.lineTo(J.SB[0] + 4, J.SB[1] + 14); g.stroke(); g.restore(); } // kamon
}

const FACE = 'M-10 -6 C-11 -14 -3 -18 4 -17 C10 -16 13 -11 13 -6 L13.4 -3 C13 -1 14.5 1 15.6 3.2 L13 4.6 C13.2 6 13.6 7 12.6 8.2 C13 9.6 12 11.6 9 12.6 C5 13.6 1 13 -2 10 C-6 8 -10 3 -10 -6 Z';
let faceP = null;
function head(g, J, who, flat, color) {
  g.save(); g.translate(...J.H); g.rotate(J.tilt || 0); g.scale(1.12, 1.12);
  const ink = flat ? color : T.hair;
  // cuello
  g.fillStyle = flat ? color : T.skin; g.beginPath(); g.moveTo(-4, 6); g.lineTo(6, 8); g.lineTo(J.N[0] - J.H[0] + 5, J.N[1] - J.H[1] + 2); g.lineTo(J.N[0] - J.H[0] - 6, J.N[1] - J.H[1] + 2); g.closePath(); g.fill();
  const R = R0(who.length * 13 + 3);
  // pelo de atrás
  g.fillStyle = ink;
  if (who === 'kenji') {
    for (let k = 0; k < 11; k++) { const a = -2.9 + k * 0.24 + (R() - 0.5) * 0.1, r0 = 11, L = 7 + R() * 7; const b = [Math.cos(a) * r0 - 1, Math.sin(a) * r0 - 2]; const t = [Math.cos(a - 0.35) * (r0 + L) - 3, Math.sin(a - 0.35) * (r0 + L) - 1]; g.beginPath(); g.moveTo(b[0] + Math.cos(a + 1.6) * 3, b[1] + Math.sin(a + 1.6) * 3); g.quadraticCurveTo((b[0] + t[0]) / 2 + 1, (b[1] + t[1]) / 2 - 1, t[0], t[1]); g.lineTo(b[0] - Math.cos(a + 1.6) * 3, b[1] - Math.sin(a + 1.6) * 3); g.fill(); }
    g.beginPath(); g.moveTo(-10, -4); g.quadraticCurveTo(-20, -2, -24, 6); g.quadraticCurveTo(-18, 2, -11, 3); g.fill(); // coleta
  } else if (who === 'mother') {
    g.beginPath(); g.ellipse(-4, -15, 11, 8, -0.3, 0, 7); g.fill(); g.beginPath(); g.ellipse(-12, -6, 7, 9, 0.3, 0, 7); g.fill(); g.beginPath(); g.ellipse(-1, -22, 8, 5, 0.1, 0, 7); g.fill();
  } else if (who === 'father') {
    g.beginPath(); g.moveTo(-11, -4); g.quadraticCurveTo(-13, 6, -8, 9); g.lineTo(-4, 4); g.closePath(); g.fill();
  }
  // cara
  faceP ||= new Path2D(FACE);
  g.fillStyle = flat ? color : T.skin; g.fill(faceP);
  if (!flat) {
    g.save(); g.clip(faceP);
    g.fillStyle = RIM; g.fill(faceP); g.translate(-1.6, 1.2); g.fillStyle = T.skin; g.fill(faceP); g.translate(1.6, -1.2);
    const gr = g.createLinearGradient(14, -12, -10, 10); gr.addColorStop(0, T.light + '0.12)'); gr.addColorStop(0.5, T.light + '0)'); gr.addColorStop(1, 'rgba(0,0,0,0.45)'); g.fillStyle = gr; g.fillRect(-14, -20, 32, 36);
    g.restore();
    g.strokeStyle = 'rgba(0,0,0,0.9)'; g.lineWidth = 0.6; g.stroke(faceP);
    // oreja, ojo, ceja, boca
    g.strokeStyle = T.light + '0.18)'; g.lineWidth = 0.6; g.beginPath(); g.arc(-1, 1, 3, -1.2, 1.6); g.stroke();
    if (who !== 'ronin') { g.strokeStyle = '#000'; g.lineWidth = 1.1; g.beginPath(); g.moveTo(6.5, -2); g.quadraticCurveTo(8.6, -3, 10.6, -1.8); g.stroke(); g.fillStyle = T.light + '0.55)'; g.beginPath(); g.arc(9.6, -1.9, 0.55, 0, 7); g.fill(); }
    g.strokeStyle = '#000'; g.lineWidth = 1.3; g.beginPath(); g.moveTo(6, -5.6); g.quadraticCurveTo(9, -6.8, 12.2, -5.4); g.stroke();
    g.lineWidth = 0.7; g.beginPath(); g.moveTo(11.2, 6.4); g.lineTo(13, 6.2); g.stroke();
  }
  // pelo de delante y tocados
  g.fillStyle = ink;
  if (who === 'kenji') {
    g.beginPath(); g.moveTo(-10, -6); g.bezierCurveTo(-12, -16, -2, -21, 6, -18); g.bezierCurveTo(11, -17, 14, -13, 13.5, -8);
    const tips = [[12.5, -4], [10, -9], [9, -2.5], [6.5, -9], [4.5, -4], [2, -10], [-1, -6], [-4, -9], [-8, -2]];
    for (const p of tips) g.lineTo(p[0], p[1]); g.closePath(); g.fill();
    if (!flat) { g.strokeStyle = RIM; g.lineWidth = 0.7; g.beginPath(); g.moveTo(-6, -15); g.bezierCurveTo(-1, -20, 7, -19, 12, -12); g.stroke(); g.strokeStyle = T.light + '0.25)'; g.lineWidth = 0.4; for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(-6 + k * 3, -16 + k * 0.3); g.quadraticCurveTo(-3 + k * 3, -10, -1 + k * 3, -7); g.stroke(); } }
  } else if (who === 'father') {
    g.beginPath(); g.moveTo(-10, -5); g.bezierCurveTo(-11, -12, -8, -15, -4, -15); g.lineTo(-6, -4); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(-5, -15.5); g.quadraticCurveTo(3, -19.5, 9, -17); g.lineTo(9, -15); g.quadraticCurveTo(3, -16.5, -4, -13.5); g.closePath(); g.fill(); // chonmage
    if (!flat) { g.strokeStyle = RIM; g.lineWidth = 0.6; g.beginPath(); g.moveTo(-4, -15.6); g.quadraticCurveTo(3, -19.5, 9, -17); g.stroke(); g.strokeStyle = T.light + '0.12)'; g.beginPath(); g.moveTo(-3, -16); g.bezierCurveTo(3, -17, 9, -14, 12, -9); g.stroke(); }
  } else if (who === 'mother') {
    g.beginPath(); g.moveTo(-10, -5); g.bezierCurveTo(-12, -16, 0, -21, 7, -17); g.bezierCurveTo(12, -14, 13, -10, 12, -8); g.quadraticCurveTo(4, -11, -2, -6); g.lineTo(-6, 4); g.closePath(); g.fill();
    if (!flat) { g.strokeStyle = RIM; g.lineWidth = 0.6; g.beginPath(); g.moveTo(-8, -14); g.bezierCurveTo(-2, -21, 6, -19, 11, -13); g.stroke(); g.strokeStyle = 'rgba(200,190,175,0.8)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(-14, -24); g.lineTo(4, -14); g.moveTo(-10, -27); g.lineTo(6, -18); g.stroke(); g.fillStyle = '#c0202c'; g.beginPath(); g.arc(-14, -24, 1.6, 0, 7); g.arc(-10.5, -27, 1.3, 0, 7); g.fill(); }
  } else if (who === 'ronin') {
    // vendas sobre los ojos, barba y sombrero de paja
    if (!flat) { g.fillStyle = 'rgba(185,176,165,0.85)'; g.beginPath(); g.moveTo(-11, -6); g.lineTo(14, -5); g.lineTo(14, -1); g.lineTo(-11, -1.6); g.closePath(); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 0.4; g.stroke(); g.beginPath(); g.moveTo(-11, -3); g.quadraticCurveTo(-18, 0, -20, 6); g.strokeStyle = 'rgba(185,176,165,0.7)'; g.lineWidth = 1.4; g.stroke(); }
    g.fillStyle = ink; g.beginPath(); g.moveTo(-2, 9); g.quadraticCurveTo(6, 16, 12.6, 9); g.lineTo(12, 13); g.quadraticCurveTo(5, 19, -3, 12); g.closePath(); g.fill();
    const hat = [[-30, 0], [-6, -14], [6, -21], [18, -14], [40, 0], [5, -2]];
    g.fillStyle = flat ? color : '#1d1714'; g.beginPath(); g.moveTo(-31, 0); g.quadraticCurveTo(-4, -14, 6, -22); g.quadraticCurveTo(16, -14, 41, 0); g.quadraticCurveTo(5, 4, -31, 0); g.fill();
    if (!flat) { g.save(); g.clip(); g.strokeStyle = T.light + '0.16)'; g.lineWidth = 0.5; for (let k = -6; k <= 6; k++) { g.beginPath(); g.moveTo(6, -22); g.lineTo(5 + k * 6, 2); g.stroke(); } for (let k = 1; k < 4; k++) { g.beginPath(); g.ellipse(6, -22, k * 9, k * 4.6, 0, 0.1, Math.PI - 0.1); g.stroke(); } g.restore(); g.strokeStyle = RIM; g.lineWidth = 0.8; g.beginPath(); g.moveTo(-31, 0); g.quadraticCurveTo(-4, -14, 6, -22); g.quadraticCurveTo(16, -14, 41, 0); g.stroke(); void hat; }
  }
  g.restore();
}

// ---------- figura completa ----------
export function drawPerson(g, o = {}) {
  const { who = 'kenji', pose = 'stand', color = null, mark = false } = o;
  const flat = !!color;
  const J = POSES[pose] || POSES.stand;
  const lift = who === 'father' ? 0 : 0;
  g.save(); g.translate(0, lift);
  // detrás: manga trasera
  sleeve(g, J.SB, J.EB, J.WB, 0.35, flat, color, who); hand(g, J.EB, J.WB, flat, color);
  if (who === 'ronin') { g.fillStyle = flat ? color : '#2a221d'; g.save(); g.translate(J.WB[0] - 2, 0); g.rotate(-0.04); g.fillRect(-1.6, 28, 3.4, 172); if (!flat) { g.fillStyle = RIM; g.fillRect(0.8, 28, 0.8, 172); } g.restore(); }
  if (who === 'mother' || who === 'ronin') { if (who === 'ronin') legs(g, J, who, flat, color); robe(g, J, who, flat, color); feet(g, J, flat, color); }
  else { legs(g, J, who, flat, color); feet(g, J, flat, color); torso(g, J, who, flat, color); }
  if (who === 'father') haori(g, J, flat, color);
  obi(g, J, who, flat, color);
  if (who === 'ronin' && !flat) { // katana a la cintura
    g.save(); g.translate(J.P[0], J.P[1] - 8); g.rotate(-0.22); g.fillStyle = '#0a0808'; g.fillRect(-30, -1.6, 66, 3.6); g.fillStyle = 'rgba(200,190,175,0.7)'; for (let x = 22; x < 34; x += 2.4) g.fillRect(x, -1.6, 1, 3.6); g.fillStyle = '#3a2f28'; g.fillRect(19, -3, 2, 7.6); g.strokeStyle = RIM; g.lineWidth = 0.6; g.strokeRect(-30, -1.6, 66, 3.6); g.restore();
  }
  head(g, J, who, flat, color);
  sleeve(g, J.SF, J.EF, J.WF, 0, flat, color, who); hand(g, J.EF, J.WF, flat, color);
  if (mark) {
    const m = add(J.N, [4, -3]);
    const gr = g.createRadialGradient(m[0], m[1], 0, m[0], m[1], 13); gr.addColorStop(0, 'rgba(255,90,90,1)'); gr.addColorStop(0.3, 'rgba(215,22,32,0.9)'); gr.addColorStop(1, 'rgba(200,20,30,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(m[0], m[1], 13, 0, 7); g.fill();
    g.strokeStyle = '#ff4a4a'; g.lineWidth = 0.6; for (let k = 0; k < 6; k++) { const a = -Math.PI / 2 + (k - 2.5) * 0.45; g.beginPath(); g.moveTo(m[0], m[1] + 1); g.quadraticCurveTo(m[0] + Math.cos(a) * 2, m[1] + Math.sin(a) * 2 - 1, m[0] + Math.cos(a) * 4, m[1] + Math.sin(a) * 4); g.stroke(); }
  }
  g.restore();
}

export function personPoint(pose = 'stand', which = 'mark') {
  const J = POSES[pose] || POSES.stand;
  return which === 'mark' ? add(J.N, [4, -3]) : J.WF;
}
