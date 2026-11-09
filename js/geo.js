// Geometría hecha con código: lirio, Kenji, casas, bambú, arma, partículas.
import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

export const RED = new THREE.Color('#c21a1f');
export const GLOW = new THREE.Color('#e0303a');
export const ONI = new THREE.Color('#4a7bff');

export const mat = {
  red: () => new THREE.MeshStandardMaterial({ color: '#b3141b', emissive: '#4a0306', roughness: 0.55, side: THREE.DoubleSide }),
  glow: (i = 1.4) => new THREE.MeshStandardMaterial({ color: '#e0303a', emissive: '#e0303a', emissiveIntensity: i, roughness: 0.4 }),
  gray: (c = '#8a8580', r = 0.9) => new THREE.MeshStandardMaterial({ color: c, roughness: r }),
  dark: () => new THREE.MeshStandardMaterial({ color: '#2a2524', roughness: 0.95 }),
  ink: () => new THREE.MeshBasicMaterial({ color: '#0a0808' }),
};

const rnd = (a, b) => a + Math.random() * (b - a);
export const seeded = (s) => () => ((s = Math.imul(48271, s) % 2147483647) & 0x7fffffff) / 2147483647;

// Cinta a lo largo de una curva (pétalos). widthFn(t) -> ancho.
export function ribbon(curve, widthFn, segs = 24, twist = 0) {
  const pos = [], idx = [], uv = [];
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const p = curve.getPoint(t);
    const tan = curve.getTangent(t);
    let side = new THREE.Vector3().crossVectors(tan, up);
    if (side.lengthSq() < 1e-4) side.set(1, 0, 0);
    side.normalize().applyAxisAngle(tan, twist * t);
    const w = widthFn(t);
    pos.push(p.x - side.x * w, p.y - side.y * w, p.z - side.z * w, p.x + side.x * w, p.y + side.y * w, p.z + side.z * w);
    uv.push(0, t, 1, t);
    if (i < segs) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// Un higanbana (Lycoris radiata): umbela de 5-6 flores, pétalos rizados hacia atrás y estambres largos.
export function makeLily({ florets = 6, stem = 2.2, scale = 1, seed = 7 } = {}) {
  const R = seeded(seed);
  const root = new THREE.Group();
  const red = mat.red();
  const redV = new THREE.MeshPhysicalMaterial({ color: '#c0141c', emissive: '#4a0306', roughness: 0.45, sheen: 0.6, sheenColor: new THREE.Color('#ff6060'), side: THREE.DoubleSide, vertexColors: true });
  const stamenMat = new THREE.MeshStandardMaterial({ color: '#c9141c', emissive: '#5a0508', roughness: 0.5 });
  const stemMat = mat.gray('#3c3a36');

  const stemCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.05, stem * 0.5, 0.02), new THREE.Vector3(0, stem, 0)]);
  root.add(new THREE.Mesh(new THREE.TubeGeometry(stemCurve, 20, 0.028, 6), stemMat));

  const head = new THREE.Group();
  head.position.y = stem;
  root.add(head);
  root.userData.petals = [];

  for (let f = 0; f < florets; f++) {
    const fl = new THREE.Group();
    const az = (f / florets) * Math.PI * 2 + R() * 0.3;
    const tilt = 0.75 + R() * 0.25;
    // pedicelo
    const ped = new THREE.Vector3(Math.cos(az) * 0.22, 0.12, Math.sin(az) * 0.22);
    const pc = new THREE.CatmullRomCurve3([new THREE.Vector3(), ped.clone().multiplyScalar(0.5).add(new THREE.Vector3(0, 0.06, 0)), ped]);
    head.add(new THREE.Mesh(new THREE.TubeGeometry(pc, 6, 0.012, 5), stemMat));
    fl.position.copy(ped);
    fl.rotation.set(Math.sin(az) * tilt, 0, -Math.cos(az) * tilt, 'XZY');
    fl.lookAt(ped.clone().multiplyScalar(4).add(new THREE.Vector3(0, 0.6, 0)).add(head.position));
    fl.rotateX(Math.PI / 2);
    head.add(fl);

    // 6 tépalos estrechos, ondulados y curvados hacia atrás
    for (let p = 0; p < 6; p++) {
      const a = (p / 6) * Math.PI * 2;
      const dir = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
      const pts = [];
      for (let i = 0; i <= 6; i++) {
        const t = i / 6;
        const out = 0.05 + t * 0.34;
        const up = Math.sin(t * Math.PI * 0.55) * 0.22 - t * t * 0.32; // sube y se enrosca hacia atrás
        const wav = Math.sin(t * 9 + p) * 0.012;
        pts.push(dir.clone().multiplyScalar(out).add(new THREE.Vector3(0, up + 0.02, 0)).add(new THREE.Vector3(-dir.z * wav, 0, dir.x * wav)));
      }
      const g = ribbon(new THREE.CatmullRomCurve3(pts), (t) => 0.034 * Math.sin(Math.PI * Math.min(1, t * 1.15 + 0.06)) + 0.004, 18, 0.6);
      { const uv = g.attributes.uv, col = []; for (let q = 0; q < uv.count; q++) { const t = uv.getY(q), e = uv.getX(q); const k = 0.5 + t * 0.75 - Math.abs(e - 0.5) * 0.15; col.push(k, k * 0.9, k * 0.9); } g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); }
      const m = new THREE.Mesh(g, redV);
      fl.add(m);
      root.userData.petals.push(m);
    }
    // 6 estambres largos y arqueados
    for (let s = 0; s < 6; s++) {
      const a = (s / 6) * Math.PI * 2 + 0.3;
      const dir = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
      const pts = [new THREE.Vector3(0, 0.02, 0)];
      for (let i = 1; i <= 5; i++) {
        const t = i / 5;
        pts.push(dir.clone().multiplyScalar(t * 0.36).add(new THREE.Vector3(0, Math.sin(t * Math.PI * 0.8) * 0.42 + t * 0.06, 0)));
      }
      const c = new THREE.CatmullRomCurve3(pts);
      fl.add(new THREE.Mesh(new THREE.TubeGeometry(c, 14, 0.005, 4), stamenMat));
      const anther = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 4), mat.gray('#2b2321'));
      anther.position.copy(c.getPoint(1)); anther.scale.set(1.8, 0.8, 0.8);
      fl.add(anther);
    }
  }
  root.scale.setScalar(scale);
  root.userData.head = head;
  return root;
}

// Silueta de Kenji (o de cualquier persona): cápsulas sencillas, tinta oscura.
export function makeFigure({ color = '#1d1918', mark = false, weapon = false, h = 1.7, staff = false } = {}) {
  const g = new THREE.Group();
  const m = new THREE.MeshStandardMaterial({ color, roughness: 1 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.62, 4, 10), m); body.position.y = 0.95; body.scale.z = 0.7;
  const robe = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.8, 10, 1, true), m); robe.position.y = 0.42;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 10), m); head.position.y = 1.52;
  const armL = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.55, 3, 6), m); armL.position.set(-0.27, 1.0, 0); armL.rotation.z = 0.15;
  const armR = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.55, 3, 6), m); armR.position.set(0.27, 1.0, 0); armR.rotation.z = -0.15;
  g.add(body, robe, head, armL, armR);
  g.userData = { head, armR, armL, body };
  if (mark) {
    const mk = new THREE.Mesh(new THREE.CircleGeometry(0.05, 12), mat.glow(1.2));
    mk.position.set(0.08, 1.36, 0.1); mk.lookAt(0.4, 1.36, 1);
    g.add(mk); g.userData.mark = mk;
  }
  if (staff) {
    const st = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.5, 6), mat.gray('#4a4642'));
    st.position.set(0.42, 0.75, 0.05); st.rotation.z = -0.08; g.add(st);
  }
  g.scale.setScalar(h / 1.7);
  return g;
}

// Casa japonesa simple: caja + techo a cuatro aguas.
export function makeHouse(w = 0.5, d = 0.4, h = 0.32, R = Math.random) {
  const g = new THREE.Group();
  const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat.gray('#6d6862'));
  wall.position.y = h / 2;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.82, h * 0.75, 4), mat.gray('#2e2a28'));
  roof.position.y = h + h * 0.36; roof.rotation.y = Math.PI / 4; roof.scale.set(w / Math.max(w, d) * 1.1, 1, d / Math.max(w, d) * 1.1);
  g.add(wall, roof);
  g.rotation.y = (R() - 0.5) * 0.5;
  g.userData = { wall, roof };
  return g;
}

export function makeBamboo(n, area, R = Math.random, color = '#5e5a55') {
  const g = new THREE.Group();
  const m = mat.gray(color);
  const ringM = mat.gray('#3a3633');
  for (let i = 0; i < n; i++) {
    const h = 5 + R() * 6, r = 0.05 + R() * 0.05;
    const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.1, h, 7), m);
    const x = (R() - 0.5) * area.w + area.x, z = (R() - 0.5) * area.d + area.z;
    c.position.set(x, h / 2, z); c.rotation.z = (R() - 0.5) * 0.08; c.rotation.x = (R() - 0.5) * 0.08;
    g.add(c);
    for (let k = 1; k < h / 0.9; k++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(r * 1.05, 0.012, 4, 10), ringM);
      ring.rotation.x = Math.PI / 2; ring.position.set(0, -h / 2 + k * 0.9, 0); c.add(ring);
    }
  }
  return g;
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
export function makeWeapon() {
  const root = new THREE.Group();
  const parts = {};
  const metal = new THREE.MeshPhysicalMaterial({ color: '#2b1c1d', roughness: 0.32, metalness: 0.75, clearcoat: 0.6, clearcoatRoughness: 0.3, emissive: '#1a0203' });
  const blood = new THREE.MeshPhysicalMaterial({ color: '#8f0d16', roughness: 0.22, metalness: 0.25, clearcoat: 1, clearcoatRoughness: 0.12, emissive: '#5a050a', emissiveIntensity: 0.7 });
  const bloodDark = new THREE.MeshPhysicalMaterial({ color: '#3a0508', roughness: 0.3, metalness: 0.4, clearcoat: 0.8, emissive: '#200203', emissiveIntensity: 0.6 });
  const cloth = new THREE.MeshStandardMaterial({ color: '#8b7b6c', roughness: 0.95 });
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
  hoja.add(new THREE.Mesh(bg, blood));
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

// Línea que se dibuja progresivamente (gráficas de línea en el espacio 3D)
export function makeTrail(points, color = '#e0303a', width = 1) {
  const g = new THREE.BufferGeometry().setFromPoints(points);
  const m = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.95, linewidth: width });
  const line = new THREE.Line(g, m);
  line.userData.n = points.length;
  line.setProgress = (f) => g.setDrawRange(0, Math.max(0, Math.floor(f * (points.length - 1)) + 1));
  line.frustumCulled = false;
  return line;
}

// Tubo (línea con grosor real) que crece con f
export function makeTubeTrail(points, radius = 0.03, material = mat.glow(1.5), segs = 200) {
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
  const g = new THREE.TubeGeometry(curve, segs, radius, 6);
  const mesh = new THREE.Mesh(g, material);
  const total = g.index.count;
  mesh.setProgress = (f) => g.setDrawRange(0, Math.floor((total / 6) * Math.max(0, Math.min(1, f))) * 6);
  mesh.setProgress(0);
  mesh.userData.curve = curve;
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
