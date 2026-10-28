// El valle de Yomigawa: maqueta en tinta compartida por los tres capítulos.
// Todo se controla con setTime(m) (minutos desde las 22:00) y unos pocos parámetros.
import * as THREE from 'three';
import { BARRIOS, CRIATURAS, nightAt, hhmm } from './story.js';
import { makeHouse, makeTubeTrail, label, mat, seeded, ramp, clamp, lerp, makeParticles } from './geo.js';

export const W = (x, y) => new THREE.Vector3((x - 50) * 0.3, 0, (y - 50) * 0.3); // tabla A -> mundo

const RIVER = [[13, -20], [8, -8], [6, -2.5], [5.6, 3], [4.6, 9.5], [3, 16], [2, 24]].map(([x, z]) => new THREE.Vector3(x, 0, z));

function heightAt(x, z) {
  // montañas al norte, colinas suaves alrededor, cauce del río
  const n = Math.sin(x * 0.35) * Math.cos(z * 0.3) * 0.6 + Math.sin(x * 0.9 + z * 0.7) * 0.25;
  const north = ramp(-z, 10, 22);
  let h = north * north * (7 + Math.sin(x * 0.45) * 3 + Math.cos(x * 1.3) * 1.2) + n * (0.3 + north);
  const edge = ramp(Math.abs(x), 14, 22);
  h += edge * edge * 4;
  return h;
}

export function makeValley({ onBarrio } = {}) {
  const R = seeded(11);
  const group = new THREE.Group();

  // --- Terreno ---
  const tg = new THREE.PlaneGeometry(52, 56, 130, 140);
  tg.rotateX(-Math.PI / 2);
  const pa = tg.attributes.position;
  const curve = new THREE.CatmullRomCurve3(RIVER);
  const rpts = curve.getSpacedPoints(120);
  for (let i = 0; i < pa.count; i++) {
    const x = pa.getX(i), z = pa.getZ(i);
    let h = heightAt(x, z);
    let dmin = 99; for (const p of rpts) { const d = Math.hypot(p.x - x, p.z - z); if (d < dmin) dmin = d; }
    h -= (1 - ramp(dmin, 0.3, 1.4)) * 0.35;
    pa.setY(i, h);
  }
  tg.computeVertexNormals();
  const terrain = new THREE.Mesh(tg, new THREE.MeshStandardMaterial({ color: '#77716b', roughness: 1, flatShading: false }));
  group.add(terrain);

  // río: cinta oscura
  const rg = new THREE.TubeGeometry(curve, 120, 0.42, 4);
  rg.scale(1, 0.05, 1);
  const river = new THREE.Mesh(rg, new THREE.MeshStandardMaterial({ color: '#16181a', roughness: 0.2, metalness: 0.4 }));
  river.position.y = -0.12; group.add(river);

  // árboles de tinta (conos) en el borde de Tsukimori y laderas
  const treeM = mat.gray('#3b3734');
  for (let i = 0; i < 160; i++) {
    const x = -15 + R() * 30, z = -8 + R() * 26;
    const near = BARRIOS.some((b) => W(b.x, b.y).distanceTo(new THREE.Vector3(x, 0, z)) < 2.3) || Math.abs(x - 5) < 1.3;
    const forest = x < -6 && z > 4;
    if (near || (!forest && R() > 0.35)) continue;
    const t = new THREE.Mesh(new THREE.ConeGeometry(0.28 + R() * 0.2, 1 + R() * 0.9, 6), treeM);
    t.position.set(x, heightAt(x, z) + 0.45, z); group.add(t);
  }

  // --- Barrios ---
  const barrios = {};
  const fireLightGroup = new THREE.Group(); group.add(fireLightGroup);
  for (const b of BARRIOS) {
    const c = W(b.x, b.y);
    const bg = new THREE.Group(); bg.position.copy(c); group.add(bg);
    const n = Math.round(b.hab / 6);
    const houses = [];
    for (let i = 0; i < n; i++) {
      const a = R() * Math.PI * 2, r = 0.3 + Math.sqrt(R()) * 1.6;
      const h = makeHouse(0.42 + R() * 0.3, 0.34 + R() * 0.2, 0.26 + R() * 0.12, R);
      h.position.set(Math.cos(a) * r, heightAt(c.x + Math.cos(a) * r, c.z + Math.sin(a) * r), Math.sin(a) * r);
      bg.add(h); houses.push(h);
    }
    // casas destruidas = % de daño; arden escalonadas desde la hora de ignición
    houses.sort(() => R() - 0.5);
    const doomed = Math.round(houses.length * b.dmg / 100);
    houses.forEach((h, i) => {
      h.userData.doomed = i < doomed;
      h.userData.burnAt = b.ignite + (i / Math.max(1, doomed)) * 9 + R() * 2;
      h.userData.wall.material = h.userData.wall.material.clone();
      h.userData.roof.material = h.userData.roof.material.clone();
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.6, 6), new THREE.MeshBasicMaterial({ color: '#ff2a1a', transparent: true, opacity: 0.9 }));
      flame.position.y = 0.6; flame.visible = false; h.add(flame); h.userData.flame = flame;
    });
    const light = new THREE.PointLight('#ff3020', 0, 9, 1.6);
    light.position.set(c.x, 1.6, c.z); fireLightGroup.add(light);
    // etiqueta / botón de la ema
    const lb = label(`<span class="jp">${b.kanji}</span>${b.name}`, 'lbl', onBarrio ? () => onBarrio(b) : null);
    lb.position.set(0, 1.9, 0); bg.add(lb);
    barrios[b.id] = { b, group: bg, houses, light, label: lb, center: c };
  }

  // brasas que suben del fuego
  const embers = makeParticles({ count: 260, kind: 'ember', color: '#ff3a26', size: 0.05, area: [26, 6, 26], center: [0, 3, 2] });
  embers.material.opacity = 0; group.add(embers);

  // --- Mancha de calor (concentración de criaturas) ---
  const heat = new THREE.Group(); group.add(heat);
  for (const b of BARRIOS) {
    const total = Object.values(b.cre).reduce((s, v) => s + v, 0);
    const m = new THREE.Mesh(new THREE.CircleGeometry(0.5 + total * 0.38, 40), new THREE.MeshBasicMaterial({ color: '#c0121a', transparent: true, opacity: 0, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; const c = W(b.x, b.y); m.position.set(c.x, heightAt(c.x, c.z) + 0.04, c.z);
    m.userData.w = total / 8; heat.add(m);
  }

  // --- Criaturas ---
  const creatures = [];
  const cgroup = new THREE.Group(); group.add(cgroup);
  const order = [];
  for (const b of [...BARRIOS].sort((a, c) => a.ignite - c.ignite)) for (const t of ['dragon', 'oni', 'yokai', 'kappa']) for (let i = 0; i < b.cre[t]; i++) order.push({ b, t });
  // tiempo de aparición según la tabla B (acumuladas)
  const spawnAt = (k) => { for (let m = 0; m <= 60; m += 0.25) if (nightAt(m, 'creatures') >= k + 1 - 1e-6) return m; return 60; };
  order.forEach((o, k) => {
    const mesh = makeCreature(o.t, R);
    const target = W(o.b.x, o.b.y).add(new THREE.Vector3((R() - 0.5) * 2.4, 0, (R() - 0.5) * 2.4));
    target.y = heightAt(target.x, target.z);
    let start;
    if (o.t === 'kappa') start = new THREE.Vector3(2.4, -0.1, 22);
    else start = new THREE.Vector3(-10 + R() * 20, 0, -19 - R() * 3);
    start.y = o.t === 'dragon' ? 9 + R() * 3 : heightAt(start.x, start.z) + (o.t === 'yokai' ? 0.6 : 0);
    const t0 = Math.max(0, spawnAt(k) - 2.5);
    const t1 = Math.max(t0 + 4, o.b.ignite);
    // trazo del recorrido
    const pts = [];
    for (let i = 0; i <= 30; i++) { const f = i / 30; pts.push(pathPoint(o.t, start, target, f)); }
    const trail = makeTubeTrail(pts, o.t === 'dragon' ? 0.02 : 0.015, new THREE.MeshBasicMaterial({ color: o.t === 'oni' ? '#4a7bff' : '#d8d2c8', transparent: true, opacity: 0.35 }), 60);
    cgroup.add(trail, mesh);
    creatures.push({ ...o, mesh, start, target, t0, t1, trail, ph: R() * 6 });
  });

  // --- Incienso (reloj de la noche) ---
  const incense = new THREE.Group();
  incense.position.set(10.8, 0, 7.5);
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.6, 0.6, 24, 1, true), mat.gray('#4a4542'));
  bowl.position.y = heightAt(10.8, 7.5) + 0.3; incense.add(bowl);
  const ash = new THREE.Mesh(new THREE.CircleGeometry(0.88, 24), mat.gray('#9c968f')); ash.rotation.x = -Math.PI / 2; ash.position.y = bowl.position.y + 0.18; incense.add(ash);
  const STICK = 6;
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1, 8), mat.gray('#2a2523'));
  stick.position.y = ash.position.y; incense.add(stick);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), mat.glow(3)); incense.add(tip);
  const tipLight = new THREE.PointLight('#ff2a1a', 2.5, 4, 2); incense.add(tipLight);
  const clock = label('', 'lbl time'); incense.add(clock);
  group.add(incense);
  const smoke = makeParticles({ count: 70, kind: 'ash', color: '#cfc9c1', size: 0.08, area: [0.6, 7, 0.6], center: [0, 0, 0] });
  smoke.userData.speed = -2; smoke.material.opacity = 0.35; incense.add(smoke);

  // --- Línea de humo: % del pueblo alcanzado (tabla B) dibujada en el cielo ---
  const chart = new THREE.Group();
  chart.position.set(-7, 3.2, -13);
  const CW = 18, CH = 6.5;
  const linePts = [];
  for (let m = 0; m <= 60; m += 1) linePts.push(new THREE.Vector3((m / 60) * CW, (nightAt(m, 'reach') / 100) * CH, 0));
  const smokeLine = makeTubeTrail(linePts, 0.06, new THREE.MeshBasicMaterial({ color: '#d9d3cb', transparent: true, opacity: 0.85 }), 240);
  chart.add(smokeLine);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), mat.glow(2.5)); chart.add(head);
  const headLbl = label('', 'lbl val'); chart.add(headLbl);
  const axis = new THREE.Group(); chart.add(axis);
  const axisM = new THREE.LineBasicMaterial({ color: '#4a4542', transparent: true, opacity: 0.6 });
  axis.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(CW, 0, 0)]), axisM));
  axis.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, CH, 0), new THREE.Vector3(CW, CH, 0)]), new THREE.LineDashedMaterial({ color: '#4a4542', dashSize: 0.2, gapSize: 0.2 })));
  for (const m of [0, 15, 30, 45, 60]) { const l = label(hhmm(m), 'lbl axis'); l.position.set((m / 60) * CW, -0.35, 0); axis.add(l); }
  const t100 = label('100 %', 'lbl axis'); t100.position.set(-0.7, CH + 0.2, 0); axis.add(t100);
  const ttl = label('Pueblo alcanzado por el ataque', 'lbl axis'); ttl.position.set(CW / 2, CH + 1.2, 0); axis.add(ttl);
  group.add(chart);

  // --- Rastro de sangre de Kenji (Cap. II) ---
  const ak = W(30, 20), tk = W(68, 35);
  const trailPts = [ak.clone().add(new THREE.Vector3(-0.6, 0, 0.4)), ak.clone().add(new THREE.Vector3(0.8, 0, 0.9)), W(45, 27), W(55, 31), tk.clone().add(new THREE.Vector3(-1.6, 0, -0.4))];
  trailPts.forEach((p) => (p.y = heightAt(p.x, p.z) + 0.08));
  const blood = makeTubeTrail(trailPts, 0.07, mat.glow(1.2), 120);
  group.add(blood);
  const kenjiDot = label('Kenji', 'lbl red'); kenjiDot.visible = false; group.add(kenjiDot);
  // dragones colosales caídos (al amanecer)
  const fallen = new THREE.Group();
  for (let i = 0; i < 2; i++) {
    const d = makeCreature('dragon', R); d.scale.setScalar(2.6); d.rotation.set(0, i * 2.2 + 0.4, Math.PI / 2 * 0.15);
    const p = tk.clone().add(new THREE.Vector3(-2.4 + i * 1.4, 0, -1.6 + i * 2)); d.position.set(p.x, heightAt(p.x, p.z) + 0.2, p.z);
    fallen.add(d);
  }
  fallen.visible = false; group.add(fallen);

  const state = { m: 0, heat: 0, dawn: 0, labels: true };

  function setTime(m) {
    state.m = m;
    const reach = nightAt(m, 'reach');
    // incienso
    const left = 1 - clamp(m / 60) * 0.92;
    stick.scale.y = STICK * left; stick.position.y = ash.position.y + (STICK * left) / 2;
    tip.position.y = ash.position.y + STICK * left; tipLight.position.copy(tip.position);
    tip.visible = m < 60.5; tipLight.intensity = m < 60.5 ? 2.5 : 0;
    clock.position.set(0, tip.position.y + 0.9, 0);
    clock.element.innerHTML = `${hhmm(Math.min(60, m))}<small>${Math.round(nightAt(Math.min(60, m), 'creatures'))} criaturas</small>`;
    smoke.position.y = tip.position.y + 3.5; smoke.visible = m < 60.5;
    // línea de humo
    smokeLine.setProgress(clamp(m / 60));
    head.position.set((clamp(m / 60)) * CW, (reach / 100) * CH, 0);
    headLbl.position.copy(head.position).add(new THREE.Vector3(0, 0.75, 0));
    headLbl.element.innerHTML = `${Math.round(reach)} %`;
    // barrios
    let fire = 0;
    for (const id in barrios) {
      const B = barrios[id];
      let burning = 0;
      for (const h of B.houses) {
        const d = h.userData;
        if (!d.doomed) continue;
        const f = ramp(m, d.burnAt, d.burnAt + 3);
        const out = state.dawn;
        burning += f;
        d.wall.material.color.set('#6d6862').lerp(new THREE.Color('#1c1716'), f);
        d.wall.material.emissive.set('#d01a10').multiplyScalar(f * (1 - out) * (0.6 + 0.4 * Math.sin(performance.now() * 0.008 + d.burnAt)));
        d.roof.material.color.set('#2e2a28').lerp(new THREE.Color('#0f0c0c'), f);
        d.flame.visible = f > 0.05 && out < 0.9;
        d.flame.scale.setScalar(f * (1 - out) * (0.8 + 0.3 * Math.sin(performance.now() * 0.012 + d.burnAt * 3)));
        d.roof.rotation.z = f * out * 0.5; d.roof.position.y = d.wall.position.y * 2 + 0.12 - f * out * 0.25;
      }
      B.light.intensity = (burning / Math.max(1, B.houses.length)) * 18 * (1 - state.dawn);
      fire += burning;
    }
    embers.material.opacity = clamp(fire / 20) * 0.9 * (1 - state.dawn);
    // criaturas
    for (const c of creatures) {
      const f = ramp(m, c.t0, c.t1);
      c.mesh.visible = m >= c.t0 && state.dawn < 0.5;
      c.trail.setProgress(f);
      c.trail.visible = m >= c.t0;
      c.trail.material.opacity = 0.35 * (1 - state.dawn);
      const p = pathPoint(c.t, c.start, c.target, f);
      c.mesh.position.copy(p);
      c.f = f;
    }
  }

  function update(dt, time) {
    if (state.m > 0) setTime(state.m); // anima el parpadeo del fuego
    embers.update(dt, time); smoke.update(dt, time);
    for (const c of creatures) {
      if (!c.mesh.visible) continue;
      if (c.f >= 1) {
        // al llegar, rondan su barrio
        const a = time * (c.t === 'dragon' ? 0.5 : 0.8) + c.ph;
        const r = c.t === 'dragon' ? 1.6 : 0.5;
        c.mesh.position.x = c.target.x + Math.cos(a) * r; c.mesh.position.z = c.target.z + Math.sin(a) * r;
        c.mesh.position.y = c.t === 'dragon' ? c.target.y + 2.6 + Math.sin(time + c.ph) * 0.3 : c.target.y + (c.t === 'yokai' ? 0.6 + Math.sin(time * 2 + c.ph) * 0.15 : 0);
        c.mesh.rotation.y = -a;
      } else {
        const ahead = pathPoint(c.t, c.start, c.target, Math.min(1, c.f + 0.02));
        c.mesh.lookAt(ahead.x, c.mesh.position.y, ahead.z);
      }
      if (c.mesh.userData.wing) c.mesh.userData.wing.rotation.z = Math.sin(time * 6 + c.ph) * 0.5;
    }
  }

  function setHeat(f) { heat.children.forEach((h) => (h.material.opacity = f * (0.12 + 0.38 * h.userData.w))); state.heat = f; }
  function setTrail(f) {
    blood.setProgress(f);
    kenjiDot.visible = f > 0.01 && f < 0.999;
    const p = blood.userData.curve.getPoint(clamp(f)); kenjiDot.position.set(p.x, p.y + 0.9, p.z);
  }
  function setDawn(f) { state.dawn = f; fallen.visible = f > 0.3; }
  function setLabels(on) { for (const id in barrios) barrios[id].label.visible = on; }
  function show(parts) {
    const all = { incense, chart, creatures: cgroup, heat, blood, embers };
    for (const k in all) all[k].visible = !!parts[k];
    kenjiDot.visible = !!parts.blood && kenjiDot.visible;
  }

  setTime(0); setHeat(0); setTrail(0);
  return { group, setTime, setHeat, setTrail, setDawn, setLabels, show, update, barrios, heightAt, incense, chart, state };
}

function pathPoint(type, a, b, f) {
  const p = new THREE.Vector3().lerpVectors(a, b, f);
  if (type === 'dragon') p.y = lerp(a.y, b.y + 2.6, f) + Math.sin(f * Math.PI) * 2;
  else if (type === 'kappa') { p.x = lerp(a.x, b.x, f * f); p.y = Math.max(-0.05, lerp(a.y, b.y, f)); }
  else p.y = lerp(a.y, b.y, f) + (type === 'yokai' ? 0.6 : 0) + Math.sin(f * Math.PI) * 0.3;
  return p;
}

export function makeCreature(type, R = Math.random) {
  const g = new THREE.Group();
  if (type === 'dragon') {
    const bone = mat.gray('#d8d2c8', 0.7);
    for (let i = 0; i < 7; i++) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.16 - i * 0.017, 8, 6), bone);
      s.position.set(0, Math.sin(i * 0.9) * 0.08, -i * 0.2); g.add(s);
    }
    const head = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.32, 6), bone); head.rotation.x = Math.PI / 2; head.position.z = 0.2; g.add(head);
    const wing = new THREE.Group();
    const wm = new THREE.MeshStandardMaterial({ color: '#3a3533', side: THREE.DoubleSide, roughness: 1 });
    const shape = new THREE.Shape(); shape.moveTo(0, 0); shape.lineTo(0.9, 0.25); shape.lineTo(0.75, -0.05); shape.lineTo(0.5, -0.15); shape.lineTo(0, -0.2);
    const wl = new THREE.Mesh(new THREE.ShapeGeometry(shape), wm); wl.rotation.x = -Math.PI / 2; wing.add(wl);
    const wr = wl.clone(); wr.scale.x = -1; wing.add(wr);
    wing.position.z = -0.2; g.add(wing); g.userData.wing = wing;
    g.scale.setScalar(1.15);
  } else if (type === 'oni') {
    const m = new THREE.MeshStandardMaterial({ color: '#5a5552', roughness: 1 });
    const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.38, 3, 8), m); b.position.y = 0.38; g.add(b);
    const h1 = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.14, 5), mat.gray('#d8d2c8')); h1.position.set(-0.07, 0.78, 0); h1.rotation.z = 0.3; g.add(h1);
    const h2 = h1.clone(); h2.position.x = 0.07; h2.rotation.z = -0.3; g.add(h2);
    const torch = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), new THREE.MeshBasicMaterial({ color: '#4a7bff' })); torch.position.set(0.24, 0.72, 0.06); torch.scale.y = 1.6; g.add(torch);
    const halo = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), new THREE.MeshBasicMaterial({ color: '#4a7bff', transparent: true, opacity: 0.25, depthWrite: false })); halo.position.copy(torch.position); g.add(halo);
    g.scale.setScalar(1.25);
  } else if (type === 'yokai') {
    const m = new THREE.MeshStandardMaterial({ color: '#e8e2da', transparent: true, opacity: 0.35, emissive: '#3a3633', depthWrite: false });
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), m); b.scale.set(1, 1.5, 1); g.add(b);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.5, 8, 1, true), m); tail.position.y = -0.4; tail.rotation.x = Math.PI; g.add(tail);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 4), mat.glow(2)); eye.position.set(0, 0.08, 0.2); g.add(eye);
  } else {
    const m = mat.gray('#4d5250');
    const shell = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), m); shell.scale.set(1, 0.6, 1.2); shell.position.y = 0.15; g.add(shell);
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.02, 12), mat.gray('#c9c3bb')); plate.position.set(0, 0.32, 0.12); g.add(plate);
  }
  g.userData.type = type;
  return g;
}

// ---------- Capítulo III: columnas de humo y farolillos ----------
export function makeAftermath(valley) {
  const group = new THREE.Group();
  const cols = [];
  for (const b of BARRIOS) {
    const c = valley.barrios[b.id].center;
    const H = (b.dmg / 100) * 7;
    const solid = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1, 1.1), new THREE.MeshStandardMaterial({ color: '#b8b2aa', roughness: 0.9, transparent: true, opacity: 0 }));
    solid.position.set(c.x, 0, c.z); group.add(solid);
    const smoke = makeParticles({ count: 90, kind: 'ash', color: '#a8a29b', size: 0.35, area: [1.4, H, 1.4], center: [c.x, valley.heightAt(c.x, c.z) + H / 2, c.z] });
    smoke.userData.speed = -1.4; smoke.material.opacity = 0; group.add(smoke);
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.14, 0.08, 1.14), mat.glow(1.5)); top.position.set(c.x, 0, c.z); group.add(top);
    const v = label(`${b.dmg} %<small>${b.name}</small>`, 'lbl val'); group.add(v);
    cols.push({ b, solid, smoke, top, v, H, base: valley.heightAt(c.x, c.z) + 0.1 });
  }
  // 312 farolillos: uno por habitante
  const N = BARRIOS.reduce((s, b) => s + b.hab, 0);
  const lan = new THREE.InstancedMesh(new THREE.SphereGeometry(0.07, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffffff' }), N);
  const info = [];
  const d = new THREE.Object3D();
  const R = seeded(5);
  for (const b of BARRIOS) {
    const c = valley.barrios[b.id].center;
    const states = [...Array(b.dead).fill(0), ...Array(b.hurt).fill(1), ...Array(b.safe).fill(2)].sort(() => R() - 0.5);
    states.forEach((s) => {
      const a = R() * Math.PI * 2, r = Math.sqrt(R()) * 1.9;
      d.position.set(c.x + Math.cos(a) * r, valley.heightAt(c.x, c.z) + 0.9 + R() * 0.8, c.z + Math.sin(a) * r);
      d.updateMatrix(); lan.setMatrixAt(info.length, d.matrix);
      info.push({ s, ph: R() * 10, out: R() });
    });
  }
  lan.instanceMatrix.needsUpdate = true;
  group.add(lan);
  const legend = label('', 'lbl'); legend.position.set(0, 9.5, 0); group.add(legend);
  const col = new THREE.Color();
  const lit = new THREE.Color('#ff3b3b'), dim = new THREE.Color('#7a1a1e'), off = new THREE.Color('#2a2626');

  let solidF = 0, lanF = 0;
  function set(fSolid, fLan) {
    solidF = fSolid; lanF = fLan;
    for (const c of cols) {
      const g = ramp(fSolid, 0, 0.5), s = ramp(fSolid, 0.5, 1);
      const h = Math.max(0.01, c.H * g);
      c.smoke.material.opacity = 0.5 * g * (1 - s);
      c.solid.scale.y = h; c.solid.position.y = c.base + h / 2;
      c.solid.material.opacity = s * 0.92;
      c.top.position.y = c.base + h; c.top.visible = s > 0.2;
      c.v.position.set(c.solid.position.x, c.base + h + 0.9, c.solid.position.z);
      c.v.visible = s > 0.6;
    }
    lan.visible = fLan > 0;
    const dead = Math.round(BARRIOS.reduce((t, b) => t + b.dead, 0) * ramp(fLan, 0.15, 0.85));
    legend.element.innerHTML = fLan > 0 ? `<span style="color:#ff6b6b">● ${60} encendidos</span> &nbsp; <span style="color:#b04a4f">● ${68} parpadean</span> &nbsp; <span style="color:#888">● ${dead} apagados</span> &nbsp;de 312 habitantes` : '';
    legend.visible = fLan > 0.1;
  }
  function update(dt, time) {
    for (const c of cols) c.smoke.update(dt, time);
    if (!lan.visible) return;
    const p = ramp(lanF, 0.15, 0.85);
    info.forEach((q, i) => {
      if (q.s === 2) col.copy(lit);
      else if (q.s === 1) col.copy(p > 0.3 ? dim : lit).multiplyScalar(p > 0.3 ? 0.6 + 0.6 * Math.abs(Math.sin(time * 3 + q.ph)) : 1);
      else col.copy(q.out < p ? off : lit);
      lan.setColorAt(i, col);
    });
    lan.instanceColor.needsUpdate = true;
  }
  set(0, 0);
  return { group, set, update };
}
