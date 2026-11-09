// Geometría 3D hecha con código: el lirio, la Kusarigama y las partículas.
import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';


export const mat = {
  red: () => new THREE.MeshStandardMaterial({ color: '#b3141b', emissive: '#4a0306', roughness: 0.55, side: THREE.DoubleSide }),
  glow: (i = 1.4) => new THREE.MeshStandardMaterial({ color: '#e0303a', emissive: '#e0303a', emissiveIntensity: i, roughness: 0.4 }),
  gray: (c = '#8a8580', r = 0.9) => new THREE.MeshStandardMaterial({ color: c, roughness: r }),
  dark: () => new THREE.MeshStandardMaterial({ color: '#2a2524', roughness: 0.95 }),
  ink: () => new THREE.MeshBasicMaterial({ color: '#0a0808' }),
};

const rnd = (a, b) => a + Math.random() * (b - a);
export const seeded = (s) => () => ((s = Math.imul(48271, s) % 2147483647) & 0x7fffffff) / 2147483647;

// Un higanbana (Lycoris radiata) con forma botánica:
// umbela de 6 flores; cada flor con 6 tépalos estrechos, ondulados y enroscados hacia atrás,
// 6 estambres muy largos que se arquean hacia arriba, un pistilo y anteras oscuras.
function tepalGeometry(R, len = 0.42, W = 0.05) {
  const NU = 26, NV = 9;
  const pos = [], col = [], uv = [], idx = [];
  const ph = R() * 6, curlEnd = -1.75 - R() * 0.35, start = 0.62 + R() * 0.15;
  // línea central integrada: sale hacia afuera y arriba y se enrosca hacia atrás
  const cen = [[0, 0]]; let x = 0, y = 0;
  for (let i = 1; i <= NU; i++) { const u = i / NU, th = start + (curlEnd - start) * Math.pow(u, 1.5); x += Math.cos(th) * len / NU; y += Math.sin(th) * len / NU; cen.push([x, y]); }
  for (let i = 0; i <= NU; i++) {
    const u = i / NU;
    const a = cen[Math.max(0, i - 1)], b = cen[Math.min(NU, i + 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1]; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
    const nx = -ty, ny = tx; // normal en el plano (afuera, arriba)
    const w = W * Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.08 + 0.03)), 0.65) * (1 - 0.25 * u) + 0.002;
    for (let j = 0; j <= NV; j++) {
      const v = (j / NV) * 2 - 1;
      const cup = 0.35 * w * v * v;                                   // bordes levantados
      const wave = 0.22 * w * Math.sin(u * 30 + ph + v) * Math.pow(Math.abs(v), 3) * (0.3 + u); // margen rizado
      const off = cup + wave;
      pos.push(cen[i][0] + nx * off, cen[i][1] + ny * off, v * w);
      const k = 0.45 + 0.75 * Math.pow(u, 0.7) + 0.12 * Math.abs(v);
      col.push(Math.min(1.25, k), k * 0.82, k * 0.82);
      uv.push(u, (v + 1) / 2);
      if (i < NU && j < NV) { const q = i * (NV + 1) + j; idx.push(q, q + NV + 1, q + 1, q + 1, q + NV + 1, q + NV + 2); }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}
function taperTube(curve, r0, r1, segs = 24, radial = 6) {
  const g = new THREE.TubeGeometry(curve, segs, 1, radial, false);
  const p = g.attributes.position, n = g.attributes.normal;
  for (let i = 0; i <= segs; i++) {
    const t = i / segs, r = r0 + (r1 - r0) * t, c = curve.getPointAt(t);
    for (let j = 0; j <= radial; j++) { const q = i * (radial + 1) + j; p.setXYZ(q, c.x + n.getX(q) * r, c.y + n.getY(q) * r, c.z + n.getZ(q) * r); }
  }
  p.needsUpdate = true; g.computeVertexNormals();
  return g;
}
const LILY_MATS = {};
function lilyMats() {
  if (LILY_MATS.tepal) return LILY_MATS;
  LILY_MATS.tepal = new THREE.MeshPhysicalMaterial({ color: '#d0141e', vertexColors: true, roughness: 0.42, sheen: 1, sheenRoughness: 0.4, sheenColor: new THREE.Color('#ff7070'), clearcoat: 0.25, clearcoatRoughness: 0.5, emissive: '#3a0205', side: THREE.DoubleSide });
  LILY_MATS.stamen = new THREE.MeshPhysicalMaterial({ color: '#c4101a', roughness: 0.35, emissive: '#4a0306', clearcoat: 0.3 });
  LILY_MATS.anther = new THREE.MeshStandardMaterial({ color: '#3a2a20', roughness: 0.8 });
  LILY_MATS.stem = new THREE.MeshStandardMaterial({ color: '#3d4a36', roughness: 0.7 });
  return LILY_MATS;
}
export function makeLily({ florets = 6, stem = 2.2, scale = 1, seed = 7, merged = false } = {}) {
  const R = seeded(seed);
  const M = lilyMats();
  const root = new THREE.Group();
  root.userData.petals = [];
  const geo = { tepal: [], stamen: [], anther: [], stem: [] };
  const add = (kind, g, m4) => { if (merged) { g.applyMatrix4(m4); geo[kind].push(g); return null; } const mesh = new THREE.Mesh(g, M[kind]); mesh.applyMatrix4(m4); root.add(mesh); return mesh; };
  const I = new THREE.Matrix4();
  // tallo (escapo) liso y sin hojas
  const stemCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.04, stem * 0.45, 0.02), new THREE.Vector3(-0.01, stem * 0.85, 0), new THREE.Vector3(0, stem, 0)]);
  add('stem', taperTube(stemCurve, 0.03, 0.022, 30, 8), I);
  const top = new THREE.Vector3(0, stem, 0);
  for (let f = 0; f < florets; f++) {
    const az = (f / florets) * Math.PI * 2 + R() * 0.25;
    const tilt = 0.35 + R() * 0.35;                   // flores hacia afuera y algo arriba
    const dir = new THREE.Vector3(Math.cos(az) * Math.cos(tilt), Math.sin(tilt), Math.sin(az) * Math.cos(tilt)).normalize();
    // pedicelo
    const pedEnd = top.clone().addScaledVector(dir, 0.16).add(new THREE.Vector3(0, 0.02, 0));
    const pc = new THREE.CatmullRomCurve3([top.clone(), top.clone().addScaledVector(dir, 0.07).add(new THREE.Vector3(0, 0.04, 0)), pedEnd]);
    add('stem', taperTube(pc, 0.011, 0.008, 8, 5), I);
    // marco de la flor: eje Y local = dir
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    const base = new THREE.Matrix4().compose(pedEnd, q, new THREE.Vector3(1, 1, 1));
    const ov = new THREE.SphereGeometry(0.018, 10, 8); ov.scale(1, 1.4, 1);
    add('stem', ov, base);
    // tépalos
    for (let p = 0; p < 6; p++) {
      const a = (p / 6) * Math.PI * 2 + R() * 0.1;
      const tg = tepalGeometry(R, 0.36 + R() * 0.08, 0.042 + R() * 0.01);
      // la geometría está en el plano (x = afuera, y = eje de la flor); rotarla alrededor del eje
      const m = new THREE.Matrix4().makeRotationY(-a);
      const mesh = add('tepal', tg, base.clone().multiply(m));
      if (mesh) root.userData.petals.push(mesh);
    }
    // estambres y pistilo
    for (let k = 0; k < 7; k++) {
      const a = (k / 6) * Math.PI * 2 + 0.3 + R() * 0.2, isStyle = k === 6;
      const r = new THREE.Vector3(Math.cos(a), 0, Math.sin(a)), L = isStyle ? 1.1 : 0.95 + R() * 0.12;
      const pts = []; for (let i = 0; i <= 8; i++) { const u = i / 8; pts.push(new THREE.Vector3().addScaledVector(r, (0.04 * u + 0.36 * u * u) * L).add(new THREE.Vector3(0, (0.55 * u - 0.05 * u * u * u) * L, 0))); }
      const sc = new THREE.CatmullRomCurve3(pts);
      add('stamen', taperTube(sc, 0.005, 0.0028, 22, 5), base);
      const tipM = new THREE.Matrix4().makeTranslation(sc.getPoint(1));
      if (isStyle) add('stamen', new THREE.SphereGeometry(0.008, 6, 5), base.clone().multiply(tipM));
      else { const an = new THREE.CapsuleGeometry(0.0055, 0.022, 2, 6); an.rotateZ(Math.PI / 2); an.rotateY(-a); add('anther', an, base.clone().multiply(tipM)); }
    }
  }
  if (merged) {
    for (const k in geo) if (geo[k].length) { const g = mergeGeometries(geo[k].map((x) => (x.index ? x : x)), false); root.add(new THREE.Mesh(g, M[k])); }
  }
  root.scale.setScalar(scale);
  return root;
}

// ---------- La Kusarigama Radiata, en 6 piezas (orden del mini juego) ----------
// Mango vertical (y 0 → 1.55), hoja curva arriba, cadena que baja hasta el núcleo.
function glowSprite(color = 'rgba(255,40,40,1)', size = 1) {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, color); gr.addColorStop(0.25, color.replace(/[\d.]+\)$/, '0.45)')); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  sp.scale.setScalar(size); return sp;
}
// texturas pintadas con código: piel de sangre cristalizada con venas que brillan
function veinTextures(w = 1024, h = 512, seed = 3, density = 1) {
  const R = seeded(seed);
  const col = document.createElement('canvas'); col.width = w; col.height = h; const c = col.getContext('2d');
  const emi = document.createElement('canvas'); emi.width = w; emi.height = h; const e = emi.getContext('2d');
  const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#5a060c'); g.addColorStop(0.5, '#8e0d16'); g.addColorStop(1, '#3d0408');
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  for (let i = 0; i < 900 * density; i++) { const x = R() * w, y = R() * h, r = 2 + R() * 22; const gg = c.createRadialGradient(x, y, 0, x, y, r); const dark = R() < 0.5; gg.addColorStop(0, dark ? 'rgba(20,0,2,0.35)' : 'rgba(190,40,45,0.25)'); gg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gg; c.fillRect(x - r, y - r, r * 2, r * 2); }
  e.fillStyle = '#000'; e.fillRect(0, 0, w, h);
  const vein = (x, y, a, len, wd, d) => {
    c.beginPath(); e.beginPath(); c.moveTo(x, y); e.moveTo(x, y);
    for (let i = 0; i < len; i++) { a += (R() - 0.5) * 0.6; x += Math.cos(a) * 6; y += Math.sin(a) * 6; c.lineTo(x, y); e.lineTo(x, y); if (d < 3 && R() < 0.05) vein(x, y, a + (R() < 0.5 ? -0.9 : 0.9), len * 0.5, wd * 0.6, d + 1); }
    c.strokeStyle = 'rgba(25,0,3,0.7)'; c.lineWidth = wd * 2.2; c.stroke();
    e.strokeStyle = `rgba(255,${60 + R() * 40},${50 + R() * 30},${0.9 - d * 0.2})`; e.lineWidth = wd; e.stroke();
  };
  for (let k = 0; k < 14 * density; k++) vein(R() * w, R() * h, R() * Math.PI * 2, 40 + R() * 80, 2.4 + R() * 2, 0);
  const t1 = new THREE.CanvasTexture(col), t2 = new THREE.CanvasTexture(emi);
  t1.colorSpace = THREE.SRGBColorSpace; t2.colorSpace = THREE.SRGBColorSpace;
  for (const t of [t1, t2]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; }
  return { map: t1, emissiveMap: t2 };
}
function clothTexture() {
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 64; const c = cv.getContext('2d');
  c.fillStyle = '#8a7a6a'; c.fillRect(0, 0, 256, 64);
  for (let y = 0; y < 64; y += 4) { c.fillStyle = y % 8 ? 'rgba(60,48,40,0.35)' : 'rgba(200,190,175,0.18)'; c.fillRect(0, y, 256, 2); }
  for (let i = 0; i < 40; i++) { c.fillStyle = `rgba(90,10,14,${Math.random() * 0.35})`; c.beginPath(); c.arc(Math.random() * 256, Math.random() * 64, 3 + Math.random() * 10, 0, 7); c.fill(); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}

export function makeWeapon() {
  const root = new THREE.Group();
  const parts = {};
  const metal = new THREE.MeshPhysicalMaterial({ color: '#2b1c1d', roughness: 0.32, metalness: 0.75, clearcoat: 0.6, clearcoatRoughness: 0.3, emissive: '#1a0203' });
  const VT = veinTextures(1024, 512, 3, 1), VC = veinTextures(512, 256, 9, 0.6);
  const blood = new THREE.MeshPhysicalMaterial({ color: '#ffffff', map: VC.map, emissive: '#ff3a3a', emissiveMap: VC.emissiveMap, emissiveIntensity: 1.6, roughness: 0.25, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.1 });
  const bladeMat = new THREE.MeshPhysicalMaterial({ color: '#ffffff', map: VT.map, emissive: '#ff3030', emissiveMap: VT.emissiveMap, emissiveIntensity: 1.9, roughness: 0.2, metalness: 0.3, clearcoat: 1, clearcoatRoughness: 0.08 });
  for (const t of [VT.map, VT.emissiveMap]) { t.repeat.set(1 / 1.45, 1 / 0.7); t.offset.set(0.05 / 1.45, 0.26 / 0.7); }
  const bloodDark = new THREE.MeshPhysicalMaterial({ color: '#3a0508', roughness: 0.3, metalness: 0.4, clearcoat: 0.8, emissive: '#200203', emissiveIntensity: 0.6 });
  const clothT = clothTexture(); clothT.repeat.set(40, 1);
  const cloth = new THREE.MeshStandardMaterial({ color: '#ffffff', map: clothT, roughness: 0.95 });
  const glowM = (i = 1.6) => new THREE.MeshStandardMaterial({ color: '#ff3a3a', emissive: '#e0303a', emissiveIntensity: i, roughness: 0.4 });

  // 1. Núcleo Tóxico: esfera irregular con pinchos y corazón luminoso
  const nucleo = new THREE.Group();
  const coreG = new THREE.IcosahedronGeometry(0.2, 4); const cp = coreG.attributes.position;
  for (let i = 0; i < cp.count; i++) { const v = new THREE.Vector3().fromBufferAttribute(cp, i); const n = 1 + Math.sin(v.x * 30) * Math.sin(v.y * 27) * Math.sin(v.z * 33) * 0.06; v.multiplyScalar(n); cp.setXYZ(i, v.x, v.y, v.z); }
  coreG.computeVertexNormals();
  nucleo.add(new THREE.Mesh(coreG, blood));
  const veinBall = new THREE.Mesh(new THREE.IcosahedronGeometry(0.205, 1), new THREE.MeshBasicMaterial({ color: '#ff4a4a', wireframe: true, transparent: true, opacity: 0.35 }));
  nucleo.add(veinBall);
  const dirs = new THREE.IcosahedronGeometry(1, 1).attributes.position, seen = new Set();
  for (let i = 0; i < dirs.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(dirs, i).normalize(); const k = v.toArray().map((n) => n.toFixed(2)).join(); if (seen.has(k)) continue; seen.add(k);
    const len = 0.13 + (i % 3) * 0.04;
    const sp = new THREE.Mesh(new THREE.ConeGeometry(0.032, len, 6), metal);
    sp.position.copy(v.clone().multiplyScalar(0.2 + len / 2 - 0.01)); sp.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v); nucleo.add(sp);
  }
  const coreGlow = glowSprite('rgba(255,40,40,1)', 0.6); nucleo.add(coreGlow);
  nucleo.position.set(0.15, -1.9, 0);
  parts.nucleo = nucleo;

  // 2. Sistema Vascular: venas que laten en espiral sobre el mango
  const vascular = new THREE.Group();
  for (let k = 0; k < 3; k++) {
    const pts = []; for (let i = 0; i <= 50; i++) { const t = i / 50; const a = t * Math.PI * 5 + k * 2.1; const r = 0.078 + Math.sin(t * 40 + k) * 0.004; pts.push(new THREE.Vector3(Math.cos(a) * r, 0.08 + t * 1.38, Math.sin(a) * r)); }
    vascular.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 120, 0.011, 6), glowM(1.2)));
  }
  parts.vascular = vascular;

  // 3. Cadena Carmesí: eslabones alternos (90°) bien alineados con la curva
  const cadena = new THREE.Group();
  const chainCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, -0.02, 0), new THREE.Vector3(-0.22, -0.55, 0.1), new THREE.Vector3(0.04, -1.2, -0.06), new THREE.Vector3(0.15, -1.66, 0)]);
  const linkG = new THREE.TorusGeometry(0.045, 0.014, 8, 16); linkG.scale(1, 1.55, 1);
  const N = 22;
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const link = new THREE.Mesh(linkG, i % 2 ? blood : bloodDark);
    link.position.copy(chainCurve.getPointAt(t));
    const tan = chainCurve.getTangentAt(t);
    link.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tan);
    link.rotateY(i % 2 ? Math.PI / 2 : 0);
    cadena.add(link);
  }
  parts.cadena = cadena;

  // 4. Empuñadura: mango con vendas en espiral, virolas de metal y pomo
  const empunadura = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.062, 1.52, 16), metal); shaft.position.y = 0.76; empunadura.add(shaft);
  const wrapPts = []; for (let i = 0; i <= 260; i++) { const t = i / 260; const a = t * Math.PI * 34; wrapPts.push(new THREE.Vector3(Math.cos(a) * 0.066, 0.18 + t * 0.62, Math.sin(a) * 0.066)); }
  empunadura.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(wrapPts), 600, 0.016, 5), cloth));
  for (const y of [0.15, 0.83, 1.42]) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.068, 0.014, 8, 20), metal); r.rotation.x = Math.PI / 2; r.position.y = y; empunadura.add(r); }
  const pommel = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 12), metal); pommel.scale.y = 0.8; empunadura.add(pommel);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.012, 8, 16), metal); ring.position.y = -0.06; empunadura.add(ring);
  // cintas rituales que cuelgan
  for (const sx of [-1, 1]) { const pts = [new THREE.Vector3(0.06 * sx, 0.8, 0), new THREE.Vector3(0.12 * sx, 0.66, 0.04), new THREE.Vector3(0.1 * sx, 0.5, -0.02), new THREE.Vector3(0.16 * sx, 0.36, 0.03)]; empunadura.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, 0.01, 4), cloth)); }
  parts.empunadura = empunadura;

  // 5. Hoja Carmesí: cuchilla curva con lomo dentado, canal y filo luminoso
  const hoja = new THREE.Group();
  const sh = new THREE.Shape();
  sh.moveTo(0, -0.02); sh.bezierCurveTo(0.35, 0.36, 0.95, 0.34, 1.32, -0.08); sh.bezierCurveTo(1.0, 0.12, 0.5, 0.12, 0.04, -0.2); sh.lineTo(0, -0.02);
  const bg = new THREE.ExtrudeGeometry(sh, { depth: 0.022, bevelEnabled: true, bevelThickness: 0.016, bevelSize: 0.022, bevelSegments: 3, curveSegments: 48 });
  bg.translate(0, 0, -0.011);
  hoja.add(new THREE.Mesh(bg, bladeMat));
  const edgeCurve = new THREE.CubicBezierCurve3(new THREE.Vector3(0.04, -0.2, 0), new THREE.Vector3(0.5, 0.12, 0), new THREE.Vector3(1.0, 0.12, 0), new THREE.Vector3(1.32, -0.08, 0));
  hoja.add(new THREE.Mesh(new THREE.TubeGeometry(edgeCurve, 60, 0.007, 5), glowM(2.4)));
  const fuller = new THREE.CubicBezierCurve3(new THREE.Vector3(0.08, -0.04, 0.02), new THREE.Vector3(0.4, 0.2, 0.02), new THREE.Vector3(0.85, 0.2, 0.02), new THREE.Vector3(1.15, -0.02, 0.02));
  hoja.add(new THREE.Mesh(new THREE.TubeGeometry(fuller, 50, 0.006, 4), bloodDark));
  const back = new THREE.CubicBezierCurve3(new THREE.Vector3(0, -0.02, 0), new THREE.Vector3(0.35, 0.36, 0), new THREE.Vector3(0.95, 0.34, 0), new THREE.Vector3(1.32, -0.08, 0));
  for (let i = 1; i < 11; i++) {
    const t = i / 11, p = back.getPoint(t), tg = back.getTangent(t);
    const nrm = new THREE.Vector3(-tg.y, tg.x, 0).normalize();
    const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.075 + (i % 2) * 0.03, 5), metal);
    tooth.position.copy(p).addScaledVector(nrm, 0.03); tooth.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), nrm.clone().addScaledVector(tg, -0.4).normalize());
    hoja.add(tooth);
  }
  const bladeGlow = glowSprite('rgba(255,50,50,1)', 0.45); bladeGlow.position.set(0.8, 0.02, 0.05); hoja.add(bladeGlow);
  hoja.position.set(-0.02, 1.5, 0);
  parts.hoja = hoja;

  // 6. Relieve del lirio: medallón en la base de la hoja con seis pétalos que brillan
  const relieve = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.05, 32), metal); disc.rotation.x = Math.PI / 2; relieve.add(disc);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.012, 8, 32), bloodDark); relieve.add(rim);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const pts = [new THREE.Vector3(0, 0, 0.03), new THREE.Vector3(Math.cos(a) * 0.05, Math.sin(a) * 0.05, 0.04), new THREE.Vector3(Math.cos(a + 0.5) * 0.085, Math.sin(a + 0.5) * 0.085, 0.035)];
    relieve.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 12, 0.009, 5), glowM(2)));
  }
  const relGlow = glowSprite('rgba(255,60,60,1)', 0.25); relGlow.position.z = 0.05; relieve.add(relGlow);
  relieve.position.set(0, 1.52, 0.02);
  parts.relieve = relieve;

  for (const k in parts) { parts[k].userData.home = parts[k].position.clone(); parts[k].userData.homeRot = parts[k].rotation.clone(); parts[k].userData.id = k; root.add(parts[k]); }
  root.userData.parts = parts;
  root.userData.glows = [coreGlow, bladeGlow, relGlow];
  return root;
}

// Partículas que caen / suben (pétalos, lluvia, ceniza, nieve)
export function makeParticles({ count = 400, area = [20, 12, 20], color = '#c21a1f', size = 0.06, kind = 'petal', center = [0, 6, 0] } = {}) {
  let geo;
  if (kind === 'petal') { geo = new THREE.PlaneGeometry(size * 2.4, size * 0.7); }
  else if (kind === 'rain') geo = new THREE.PlaneGeometry(0.008, size * 6);
  else geo = new THREE.PlaneGeometry(size, size);
  const m = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: kind === 'rain' ? 0.35 : 0.9, depthWrite: false });
  const mesh = new THREE.InstancedMesh(geo, m, count);
  const data = [];
  const d = new THREE.Object3D();
  for (let i = 0; i < count; i++) {
    data.push({ p: new THREE.Vector3(rnd(-area[0] / 2, area[0] / 2) + center[0], rnd(-area[1] / 2, area[1] / 2) + center[1], rnd(-area[2] / 2, area[2] / 2) + center[2]),
      r: new THREE.Euler(rnd(0, 6), rnd(0, 6), rnd(0, 6)), s: rnd(0.5, 1.3), v: rnd(0.4, 1), ph: rnd(0, 6) });
  }
  mesh.userData = { data, area, center, kind, speed: 1, wind: 0 };
  mesh.frustumCulled = false;
  mesh.update = (dt, time) => {
    const { speed, wind } = mesh.userData;
    for (let i = 0; i < count; i++) {
      const q = data[i];
      if (kind === 'rain') { q.p.y -= dt * 14 * q.v * speed; q.p.x += dt * wind; }
      else if (kind === 'ember') { q.p.y += dt * 0.8 * q.v * speed; q.p.x += Math.sin(time + q.ph) * dt * 0.3; }
      else { q.p.y -= dt * 0.35 * q.v * speed; q.p.x += (Math.sin(time * 0.7 + q.ph) * 0.25 + wind) * dt; q.r.x += dt * q.v; q.r.y += dt * 0.6; }
      const top = center[1] + area[1] / 2, bot = center[1] - area[1] / 2;
      if (q.p.y < bot) q.p.y = top; if (q.p.y > top) q.p.y = bot;
      if (q.p.x > center[0] + area[0] / 2) q.p.x -= area[0];
      d.position.copy(q.p);
      if (kind === 'rain') d.rotation.set(0, 0, wind * 0.03); else d.rotation.copy(q.r);
      d.scale.setScalar(q.s);
      d.updateMatrix(); mesh.setMatrixAt(i, d.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  };
  return mesh;
}

export function label(html, cls = 'lbl', onClick) {
  const el = document.createElement(onClick ? 'button' : 'div');
  el.className = cls + (onClick ? ' btn' : '');
  el.innerHTML = html;
  if (onClick) el.addEventListener('click', (e) => { e.stopPropagation(); onClick(e); });
  const o = new CSS2DObject(el);
  o.center.set(0.5, 1);
  return o;
}

export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const smooth = (t) => t * t * (3 - 2 * t);
export const ramp = (x, a, b) => clamp((x - a) / (b - a));
