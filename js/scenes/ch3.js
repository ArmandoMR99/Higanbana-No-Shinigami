// Capítulo III · 冬 · Siete inviernos
import * as THREE from 'three';
import { makeFigure, makeParticles, makeTubeTrail, makeHouse, makeWeapon, label, mat, seeded, ramp, clamp, lerp } from '../geo.js';
import { makeAftermath } from '../valley.js';
import { VIAJE, MARCA } from '../story.js';

const MAP = new THREE.Vector3(60, 0, 0);
const SNOW = new THREE.Vector3(100, 0, 0);
const v = (o, x, y, z) => [o.x + x, o.y + y, o.z + z];

export function buildCh3(app) {
  const { valley } = app;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#1a1817');
  scene.fog = new THREE.FogExp2('#1a1817', 0.03);
  const hemi = new THREE.HemisphereLight('#c9c3bb', '#141212', 1.3); scene.add(hemi);
  const sun = new THREE.DirectionalLight('#ffffff', 1.6); sun.position.set(6, 12, 10); scene.add(sun);
  const R = seeded(44);
  const after = makeAftermath(valley);
  const kenjiTop = makeFigure({ h: 0.7, mark: true }); kenjiTop.position.set(-1.5, valley.heightAt(-1.5, -17.5) + 0.05, -17.5); kenjiTop.scale.setScalar(2.2); kenjiTop.rotation.y = 0.2; scene.add(kenjiTop);

  // --- Mapa del viaje: papel de arroz con el camino en tinta ---
  const paper = new THREE.Mesh(new THREE.PlaneGeometry(26, 15, 60, 30), new THREE.MeshStandardMaterial({ color: '#b5afa6', roughness: 1 }));
  paper.rotation.x = -Math.PI / 2; paper.position.copy(MAP); scene.add(paper);
  // costas y montañas dibujadas (relieve suave)
  const pa = paper.geometry.attributes.position;
  for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), y = pa.getY(i); pa.setZ(i, Math.max(0, Math.sin(x * 0.5) * Math.cos(y * 0.6)) * 0.25); }
  paper.geometry.computeVertexNormals();
  const valleyStart = new THREE.Vector3(MAP.x - 11, 0.1, MAP.z + 5.5);
  const stops = VIAJE.map((s) => new THREE.Vector3(MAP.x + s.x, 0.12, MAP.z + s.z));
  const pathPts = [valleyStart];
  stops.forEach((s, i) => { const prev = pathPts[pathPts.length - 1]; pathPts.push(prev.clone().lerp(s, 0.5).add(new THREE.Vector3(0, 0, (i % 2 ? 1.8 : -1.8)))); pathPts.push(s); });
  const road = makeTubeTrail(pathPts, 0.06, new THREE.MeshBasicMaterial({ color: '#0e0b0b' }), 300); scene.add(road);
  const footprints = makeTubeTrail(pathPts.map((p) => p.clone().add(new THREE.Vector3(0, 0.01, 0.12))), 0.025, mat.glow(1.2), 300); scene.add(footprints);
  const startLbl = label('<span class="jp">黄泉川</span>Valle de Yomigawa', 'lbl'); startLbl.position.copy(valleyStart).add(new THREE.Vector3(0, 0.8, 0)); scene.add(startLbl);
  const stations = VIAJE.map((s, i) => {
    const g = new THREE.Group(); g.position.copy(stops[i]); scene.add(g);
    if (i === 0) { // torii
      const pm = mat.gray('#2a2523');
      for (const x of [-0.45, 0.45]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 1.2, 8), pm); p.position.set(x, 0.6, 0); g.add(p); }
      const top = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.1, 0.12), pm); top.position.y = 1.22; g.add(top);
      const top2 = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.07, 0.1), pm); top2.position.y = 1.02; g.add(top2);
    } else if (i === 1) { // montaña nevada
      const mtn = new THREE.Mesh(new THREE.ConeGeometry(1.4, 2.2, 7), mat.gray('#5a5550')); mtn.position.y = 1.1; g.add(mtn);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.62, 0.95, 7), mat.gray('#e8e3dc')); cap.position.y = 1.75; g.add(cap);
    } else if (i === 2) { // río seco
      const rb = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.08, 4, 30, Math.PI), mat.gray('#5d5853')); rb.rotation.x = -Math.PI / 2; rb.position.y = 0.05; g.add(rb);
      for (let k = 0; k < 7; k++) { const st = new THREE.Mesh(new THREE.DodecahedronGeometry(0.1 + R() * 0.08), mat.gray('#7a756f')); st.position.set((R() - 0.5) * 1.6, 0.06, (R() - 0.5) * 0.8); g.add(st); }
    } else { // taberna en ruinas
      const h = makeHouse(1.1, 0.9, 0.75, R); h.userData.roof.rotation.z = 0.35; g.add(h);
    }
    const l = label(`<span class="jp">${s.kanji}</span>${s.who} · ${s.name}`, 'lbl'); l.position.set(0, 2.5, 0); g.add(l);
    g.userData.label = l;
    g.scale.setScalar(0.001);
    return g;
  });
  const traveler = makeFigure({ h: 0.6, mark: true }); scene.add(traveler);

  // --- Invierno: la marca crece, la memoria se borra (Tabla C) ---
  const snowGround = new THREE.Mesh(new THREE.CircleGeometry(30, 48), mat.gray('#d6d1ca')); snowGround.rotation.x = -Math.PI / 2; snowGround.position.copy(SNOW); scene.add(snowGround);
  for (let i = 0; i < 40; i++) {
    const t = new THREE.Mesh(new THREE.ConeGeometry(0.4 + R() * 0.3, 1.6 + R() * 1.4, 6), mat.gray('#3b3734'));
    const a = R() * Math.PI * 2, r = 9 + R() * 12; t.position.set(SNOW.x + Math.cos(a) * r, 0.8, SNOW.z - Math.abs(Math.sin(a) * r)); scene.add(t);
  }
  const wanderer = makeFigure({ h: 1.7, mark: true }); wanderer.position.set(SNOW.x - 1.2, 0, SNOW.z + 2); wanderer.rotation.y = 0.5; scene.add(wanderer);
  const ww = makeWeapon(); ww.scale.setScalar(0.42); ww.position.set(0.25, 1.35, -0.1); ww.rotation.set(0.2, 0, 2.4); wanderer.add(ww);
  // la marca que crece por el brazo
  const markGrow = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.5, 3, 6), mat.glow(1.4)); markGrow.position.set(0.27, 1.05, 0.01); markGrow.rotation.z = -0.15; wanderer.add(markGrow);
  // aldea que arde en la última noche (fuego azul de onis)
  const village = new THREE.Group(); village.position.set(SNOW.x + 6, 0, SNOW.z - 9); scene.add(village);
  for (let i = 0; i < 6; i++) { const h = makeHouse(1.4, 1.2, 1, R); h.position.set((i % 3) * 2.2 - 2, 0, Math.floor(i / 3) * 2.2); village.add(h); }
  const vfire = new THREE.PointLight('#ff2a1a', 0, 18, 1.4); vfire.position.set(0, 2, 1); village.add(vfire);
  const vblue = new THREE.PointLight('#4a7bff', 0, 10, 1.6); vblue.position.set(-2, 1.5, 3); village.add(vblue);
  const store = makeHouse(1.2, 1, 0.9, R); store.position.set(3.2, 0, 3.4); village.add(store);
  const storeGlow = new THREE.PointLight('#ff3030', 0, 5, 2); storeGlow.position.set(3.2, 1.2, 4.2); village.add(storeGlow);

  // gráfica doble en el cielo: edad 13 -> 22
  const chart = new THREE.Group(); chart.position.set(SNOW.x - 6.5, 2.6, SNOW.z - 5); scene.add(chart);
  const CW = 13, CH = 5;
  const X = (age) => ((age - 13) / (22.6 - 13)) * CW;
  const marcaPts = [], memPts = [];
  for (let i = 0; i < MARCA.length; i++) { marcaPts.push(new THREE.Vector3(X(MARCA[i].age), (MARCA[i].marca / 100) * CH, 0)); memPts.push(new THREE.Vector3(X(MARCA[i].age), (MARCA[i].memoria / 100) * CH, 0.02)); }
  const marcaLine = makeTubeTrail(marcaPts, 0.05, mat.glow(1.6), 300);
  const memLine = makeTubeTrail(memPts, 0.05, new THREE.MeshBasicMaterial({ color: '#f2eee8' }), 300);
  chart.add(marcaLine, memLine);
  const axis = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(CW, 0, 0)]), new THREE.LineBasicMaterial({ color: '#6a6560' })); chart.add(axis);
  for (const a of [13, 15, 18, 20, 22]) { const l = label(`${a} años`, 'lbl axis'); l.position.set(X(a), -0.35, 0); chart.add(l); }
  const lm = label('Marca (% de cuello y brazo)', 'lbl red'); chart.add(lm);
  const lr = label('Recuerdos de infancia (%)', 'lbl'); chart.add(lr);
  const moment = label('', 'lbl big'); chart.add(moment);
  const petals = makeParticles({ count: 380, kind: 'petal', color: '#c8161e', size: 0.1, area: [24, 10, 16], center: [SNOW.x, 5, SNOW.z - 2] });
  petals.visible = false; scene.add(petals);
  const snow = makeParticles({ count: 700, kind: 'ash', color: '#ffffff', size: 0.05, area: [40, 14, 30], center: [0, 6, 0] });
  snow.material.opacity = 0.85; scene.add(snow);

  // qué edad muestra cada pasaje
  const AGE = { pesadilla: [13, 16.5], pregunta: [16.5, 18.5], leyenda: [18.5, 20.5], invierno: [20.5, 22], invierno2: [22, 22], eleccion: [22, 22.6], eleccion2: [22.6, 22.6], final: [22.6, 22.6] };

  const frames = {
    menu: { pos: v(SNOW, 1.4, 1.6, 5.2), look: v(SNOW, -1.2, 1.3, 1) },
    recuento: { pos: [-2, 21, -27], look: [1, 0, 3], to: { pos: [4, 17, -20], look: [1, 1, 3] } },
    viaje: { cut: true, pos: v(MAP, -9, 7, 12), look: v(MAP, -6, 0, 2), to: { pos: v(MAP, 6, 7, 10), look: v(MAP, 6, 0, -1) } },
    pesadilla: { cut: true, pos: v(SNOW, 1.5, 3, 10), look: v(SNOW, 0, 3.2, -3) },
    pregunta: { pos: v(SNOW, 2.5, 3.4, 10.5), look: v(SNOW, 0.5, 3.4, -3) },
    leyenda: { pos: v(SNOW, 3.5, 3.6, 10.8), look: v(SNOW, 1, 3.4, -3) },
    invierno: { pos: v(SNOW, 4.5, 3.4, 9), look: v(SNOW, 4, 2.2, -5) },
    invierno2: { pos: v(SNOW, 4.8, 3.2, 8.4), look: v(SNOW, 5, 1.8, -5) },
    eleccion: { pos: v(SNOW, 3.5, 3.6, 10), look: v(SNOW, 2, 3, -4) },
    eleccion2: { pos: v(SNOW, 3, 3.6, 10), look: v(SNOW, 1.5, 3.2, -4) },
    final: { pos: v(SNOW, 2, 4.4, 12.5), look: v(SNOW, 0, 3.4, -4) },
  };

  let current = '';
  return {
    scene, frames,
    enter() {
      scene.add(valley.group); scene.add(after.group);
      valley.show({});
      valley.setLabels(false); valley.setDawn(1); valley.setTime(60); valley.setHeat(0);
    },
    update({ key, t, sec }) {
      current = key;
      const L = sec.len || 1;
      const tIn = L > 1 ? clamp(t * L / (L - 1)) : t;
      // recuento: humo que se vuelve columnas; farolillos que se apagan
      if (key === 'recuento') after.set(clamp(tIn * 1.6), clamp((tIn - 0.35) * 1.6));
      else after.set(1, 1);
      // viaje
      const vt = key === 'viaje' ? tIn : ['pesadilla', 'pregunta', 'leyenda', 'invierno', 'invierno2', 'eleccion', 'eleccion2', 'final'].includes(key) ? 1 : 0;
      road.setProgress(vt); footprints.setProgress(vt);
      const pos = road.userData.curve.getPoint(clamp(vt)); traveler.position.copy(pos);
      stations.forEach((g, i) => { const on = ramp(vt, (i * 2 + 1.6) / (pathPts.length - 1), (i * 2 + 2) / (pathPts.length - 1)); g.scale.setScalar(Math.max(0.001, on)); g.userData.label.visible = on > 0.9; });
      // gráfica marca / memoria
      const r = AGE[key];
      let age = 13;
      if (r) age = lerp(r[0], r[1], t);
      const f = clamp(X(age) / CW);
      marcaLine.setProgress(f); memLine.setProgress(f);
      chart.visible = !!r;
      const idx = MARCA.findIndex((m) => m.age >= age - 0.01);
      const cur = MARCA[Math.max(0, idx)];
      const mY = (interp(age, 'marca') / 100) * CH, rY = (interp(age, 'memoria') / 100) * CH;
      lm.position.set(X(age) + 0.3, mY + 0.45, 0); lr.position.set(X(age) + 0.3, rY + 0.45, 0);
      lm.element.innerHTML = `Marca ${Math.round(interp(age, 'marca'))} %`;
      lr.element.innerHTML = `Recuerdos ${Math.round(interp(age, 'memoria'))} %`;
      moment.position.set(X(age), CH + 1.3, 0);
      moment.element.innerHTML = cur ? `${Math.floor(age)} años · ${cur.label}` : '';
      markGrow.scale.y = 0.2 + interp(age, 'marca') / 65;
      // la última noche
      const night = ['invierno', 'invierno2'].includes(key);
      vfire.intensity = night ? 40 : 0; vblue.intensity = night ? 12 : 0;
      storeGlow.intensity = key === 'eleccion' ? 6 * (1 - t) : 0;
      petals.visible = key === 'final' || key === 'eleccion2';
      petals.userData.speed = key === 'final' ? 1.5 : 0.6;
      const dark = night ? 1 : 0;
      scene.background.set(dark ? '#0e0c0c' : '#1a1817'); scene.fog.color.copy(scene.background);
      hemi.intensity = key === 'recuento' ? 1.6 : night ? 0.5 : 1.3;
      scene.fog.density = key === 'recuento' ? 0.012 : key === 'viaje' ? 0.01 : 0.03;
      wanderer.position.x = SNOW.x - 1.2 + (age - 13) * 0.12;
      snow.position.set(key === 'recuento' ? 0 : key === 'viaje' ? MAP.x : SNOW.x, 0, 0);
    },
    tick(dt, time) {
      valley.update(dt, time); after.update(dt, time);
      snow.update(dt, time); petals.update(dt, time);
      if (vfire.intensity > 0) vfire.intensity = 34 + Math.sin(time * 9) * 8;
    },
  };
}

function interp(age, col) {
  for (let i = 1; i < MARCA.length; i++) {
    const a = MARCA[i - 1], b = MARCA[i];
    if (age <= b.age) return a[col] + (b[col] - a[col]) * ((age - a.age) / (b.age - a.age));
  }
  return MARCA[MARCA.length - 1][col];
}
