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
      const m = new THREE.Mesh(g, red);
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
export function makeWeapon() {
  const root = new THREE.Group();
  const parts = {};
  const metal = new THREE.MeshStandardMaterial({ color: '#2a1a1b', roughness: 0.35, metalness: 0.6, emissive: '#2a0204' });
  const red = new THREE.MeshStandardMaterial({ color: '#a01018', emissive: '#7a0a10', emissiveIntensity: 0.8, roughness: 0.35, metalness: 0.3 });
  const wrap = new THREE.MeshStandardMaterial({ color: '#8b7d70', roughness: 1 });

  // 1. Núcleo Tóxico: esfera con pinchos al final de la cadena
  const nucleo = new THREE.Group();
  nucleo.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 2), red));
  const ico = new THREE.IcosahedronGeometry(0.2, 1).attributes.position;
  const seen = new Set();
  for (let i = 0; i < ico.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(ico, i).normalize();
    const k = v.toArray().map((n) => n.toFixed(2)).join();
    if (seen.has(k)) continue; seen.add(k);
    const sp = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.16, 5), metal);
    sp.position.copy(v.clone().multiplyScalar(0.24)); sp.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v);
    nucleo.add(sp);
  }
  nucleo.position.set(0.15, -1.9, 0);
  parts.nucleo = nucleo;

  // 2. Sistema Vascular: venas rojas en espiral sobre el mango
  const vascular = new THREE.Group();
  for (let k = 0; k < 3; k++) {
    const pts = [];
    for (let i = 0; i <= 40; i++) { const t = i / 40; const a = t * Math.PI * 6 + k * 2.1; pts.push(new THREE.Vector3(Math.cos(a) * 0.075, t * 1.5, Math.sin(a) * 0.075)); }
    vascular.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, 0.012, 5), mat.glow(0.9)));
  }
  parts.vascular = vascular;

  // 3. Cadena Carmesí: eslabones del mango al núcleo
  const cadena = new THREE.Group();
  const chainCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(-0.25, -0.6, 0.1), new THREE.Vector3(0.05, -1.25, -0.05), new THREE.Vector3(0.15, -1.68, 0)]);
  const N = 16;
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const link = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.016, 5, 10), i % 2 ? red : metal);
    link.position.copy(chainCurve.getPoint(t));
    link.lookAt(chainCurve.getPoint(Math.min(1, t + 0.02)).add(new THREE.Vector3(0, 0, 0.0001)));
    link.rotateY(Math.PI / 2); if (i % 2) link.rotateX(Math.PI / 2);
    link.scale.set(1, 1.5, 1);
    cadena.add(link);
  }
  parts.cadena = cadena;

  // 4. Empuñadura: mango envuelto en vendas
  const empunadura = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.06, 1.5, 10), metal);
  shaft.position.y = 0.75; empunadura.add(shaft);
  for (let i = 0; i < 12; i++) {
    const r = new THREE.Mesh(new THREE.TorusGeometry(0.066, 0.02, 4, 12), wrap);
    r.rotation.x = Math.PI / 2 + (i % 2 ? 0.25 : -0.25); r.position.y = 0.1 + i * 0.055; empunadura.add(r);
  }
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), metal); cap.position.y = 0; empunadura.add(cap);
  parts.empunadura = empunadura;

  // 5. Hoja Carmesí: cuchilla curva
  const hoja = new THREE.Group();
  const s = new THREE.Shape();
  s.moveTo(0, 0); s.quadraticCurveTo(0.55, 0.32, 1.25, -0.05); s.quadraticCurveTo(0.6, 0.12, 0.02, -0.16); s.lineTo(0, 0);
  const bg = new THREE.ExtrudeGeometry(s, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 1, curveSegments: 24 });
  bg.translate(0, 0, -0.015);
  const blade = new THREE.Mesh(bg, red);
  hoja.add(blade);
  // filo más brillante
  const edge = new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(new THREE.Vector3(0.02, -0.16, 0), new THREE.Vector3(0.6, 0.12, 0), new THREE.Vector3(1.25, -0.05, 0)), 30, 0.008, 4), mat.glow(2));
  hoja.add(edge);
  // dientes del lomo
  for (let i = 1; i < 8; i++) {
    const t = i / 8; const x = t * 1.2, y = 0.32 * 4 * t * (1 - t) * 0.62;
    const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.09, 4), metal);
    tooth.position.set(x, y + 0.03, 0); tooth.rotation.z = -0.5; hoja.add(tooth);
  }
  hoja.position.set(-0.02, 1.5, 0);
  parts.hoja = hoja;

  // 6. Relieve del lirio: sello circular en la base de la hoja
  const relieve = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.04, 20), metal);
  disc.rotation.x = Math.PI / 2; relieve.add(disc);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const pet = new THREE.Mesh(new THREE.CapsuleGeometry(0.012, 0.07, 2, 4), mat.glow(1.6));
    pet.position.set(Math.cos(a) * 0.05, Math.sin(a) * 0.05, 0.03); pet.rotation.z = a - Math.PI / 2; relieve.add(pet);
  }
  relieve.position.set(0, 1.52, 0);
  parts.relieve = relieve;

  for (const k in parts) { parts[k].userData.home = parts[k].position.clone(); parts[k].userData.homeRot = parts[k].rotation.clone(); parts[k].userData.id = k; root.add(parts[k]); }
  root.userData.parts = parts;
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
