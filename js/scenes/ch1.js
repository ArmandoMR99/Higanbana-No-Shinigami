// Capítulo I · 秋分 · Cuando florecen los muertos
import * as THREE from 'three';
import { makeLily, makeBamboo, makeFigure, makeHouse, makeParticles, label, mat, seeded, ramp, clamp, lerp } from '../geo.js';
import { W } from '../valley.js';

// Lugares del capítulo (cada uno es un "set" separado dentro de la misma escena)
const FOREST = new THREE.Vector3(60, 0, 0);
const RIVER = new THREE.Vector3(95, 0, 0);
const STREET = new THREE.Vector3(130, 0, 0);
const STORE = new THREE.Vector3(165, 0, 0);
const v = (o, x, y, z) => [o.x + x, o.y + y, o.z + z];

export function buildCh1(app) {
  const { valley } = app;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#0e0c0c');
  scene.fog = new THREE.FogExp2('#0e0c0c', 0.05);
  const hemi = new THREE.HemisphereLight('#a8a29b', '#0c0a0a', 0.9); scene.add(hemi);
  const moon = new THREE.DirectionalLight('#ffffff', 1.4); moon.position.set(-6, 14, 8); scene.add(moon);
  const R = seeded(21);

  // --- Bosque de bambú + la flor ---
  const forest = makeBamboo(170, { x: FOREST.x, z: FOREST.z - 4, w: 26, d: 22 }, R, '#9a948d');
  forest.children = forest.children.filter((c) => Math.hypot(c.position.x - FOREST.x - 0.5, c.position.z - FOREST.z - 1) > 1.8 && !(Math.abs(c.position.x - FOREST.x) < 1.2 && c.position.z > FOREST.z + 1));
  scene.add(forest);
  const fground = new THREE.Mesh(new THREE.CircleGeometry(20, 40), mat.gray('#2d2a28')); fground.rotation.x = -Math.PI / 2; fground.position.copy(FOREST); scene.add(fground);
  const lily = makeLily({ stem: 0.75, scale: 0.9, seed: 9 }); lily.position.set(FOREST.x + 0.5, 0, FOREST.z + 1); scene.add(lily);
  const lilyLight = new THREE.PointLight('#ff2020', 0, 3, 2); lilyLight.position.set(FOREST.x + 0.5, 1, FOREST.z + 1.4); scene.add(lilyLight);
  const kid = makeFigure({ h: 1.35 }); kid.position.set(FOREST.x - 0.6, 0, FOREST.z + 2.2); kid.rotation.y = 2.2; scene.add(kid);
  const leaves = makeParticles({ count: 120, kind: 'petal', color: '#8a8580', size: 0.09, area: [12, 7, 10], center: [FOREST.x, 3.5, FOREST.z] });
  scene.add(leaves);

  // --- El río y el reflejo con la marca ---
  const water = new THREE.Mesh(new THREE.PlaneGeometry(14, 8), new THREE.MeshStandardMaterial({ color: '#141617', roughness: 0.08, metalness: 0.6 }));
  water.rotation.x = -Math.PI / 2; water.position.set(RIVER.x, 0.01, RIVER.z - 2); scene.add(water);
  const bank = new THREE.Mesh(new THREE.PlaneGeometry(14, 6), mat.gray('#3a3633')); bank.rotation.x = -Math.PI / 2; bank.position.set(RIVER.x, 0.02, RIVER.z + 4.5); scene.add(bank);
  const kneel = makeFigure({ h: 1.35, mark: true }); kneel.position.set(RIVER.x, 0, RIVER.z + 1.75); kneel.rotation.x = 0.55; kneel.rotation.y = Math.PI; scene.add(kneel);
  const refl = makeFigure({ h: 1.35, mark: true, color: '#3a3533' }); refl.position.set(RIVER.x, 0, RIVER.z + 1.75); refl.scale.y *= -1; refl.rotation.x = -0.55; refl.rotation.y = Math.PI;
  refl.traverse((o) => { if (o.material && o.material.color) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0.55; } });
  scene.add(refl);
  // la marca reflejada: un pequeño lirio plano y brillante en el agua
  const markLily = makeLily({ stem: 0.01, scale: 0.35, florets: 5, seed: 4 }); markLily.rotation.x = Math.PI / 2; markLily.position.set(RIVER.x + 0.02, 0.05, RIVER.z + 0.7); scene.add(markLily);
  const ripples = new THREE.Group(); scene.add(ripples);
  for (let i = 0; i < 4; i++) { const r = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.215, 48), new THREE.MeshBasicMaterial({ color: '#8a8580', transparent: true, opacity: 0.4 })); r.rotation.x = -Math.PI / 2; r.position.set(RIVER.x, 0.03, RIVER.z + 0.7); ripples.add(r); }

  // --- La calle y el ronin ciego ---
  const sground = new THREE.Mesh(new THREE.PlaneGeometry(20, 12), mat.gray('#3c3836')); sground.rotation.x = -Math.PI / 2; sground.position.copy(STREET); scene.add(sground);
  for (let i = 0; i < 7; i++) { const h = makeHouse(2.2, 1.8, 1.6, R); h.position.set(STREET.x - 7 + i * 2.6, 0, STREET.z - 3.2 - R() * 1.2); scene.add(h); }
  const boy = makeFigure({ h: 1.45, mark: true }); boy.position.set(STREET.x - 0.55, 0, STREET.z + 0.2); boy.rotation.y = 0.9; scene.add(boy);
  const ronin = makeFigure({ h: 1.8, staff: true, color: '#272221' }); ronin.position.set(STREET.x + 0.6, 0, STREET.z - 0.1); ronin.rotation.y = -1.9; scene.add(ronin);
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.06, 0.07, 14, 1, true), mat.gray('#9a948e')); bowl.material.side = THREE.DoubleSide; scene.add(bowl);
  const splash = new THREE.Mesh(new THREE.CircleGeometry(0.4, 20), new THREE.MeshBasicMaterial({ color: '#7d7872', transparent: true, opacity: 0 })); splash.rotation.x = -Math.PI / 2; splash.position.set(STREET.x + 0.2, 0.02, STREET.z + 0.2); scene.add(splash);

  // --- El almacén de arroz (vista por las rendijas) ---
  const planks = new THREE.Group(); planks.position.copy(STORE); scene.add(planks);
  for (let i = -10; i <= 10; i++) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.26, 4, 0.08), mat.gray('#2a2523')); p.position.set(i * 0.36, 1.8, 0); planks.add(p); }
  const outside = new THREE.Group(); outside.position.copy(STORE); scene.add(outside);
  const og = new THREE.Mesh(new THREE.PlaneGeometry(30, 20), mat.gray('#2c2826')); og.rotation.x = -Math.PI / 2; og.position.z = -6; outside.add(og);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(8, 4), mat.gray('#5a5550')); wall.position.set(0, 2, -7); outside.add(wall);
  const blood = new THREE.Mesh(new THREE.CircleGeometry(0.8, 9), new THREE.MeshBasicMaterial({ color: '#b0101a', transparent: true, opacity: 0 })); blood.position.set(0.8, 1.8, -6.98); blood.scale.set(1.4, 0.7, 1); outside.add(blood);
  const oniS = makeFigure({ h: 2.6, color: '#46413e' }); oniS.position.set(-0.6, 0, -4.2); outside.add(oniS);
  const club = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.16, 1.4, 6), mat.gray('#2a2523')); club.position.set(0.5, 2.4, 0); club.rotation.z = -0.6; oniS.add(club);
  const torch = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), new THREE.MeshBasicMaterial({ color: '#4a7bff' })); torch.position.set(-0.45, 1.6, 0.1); torch.scale.y = 1.8; oniS.add(torch);
  const father = makeFigure({ h: 1.7 }); father.position.set(0.9, 0, -4.6); outside.add(father);
  const fire = new THREE.PointLight('#ff2a1a', 60, 16, 1.3); fire.position.set(2, 2, -5); outside.add(fire);
  const blueL = new THREE.PointLight('#4a7bff', 6, 5, 2); blueL.position.set(-1, 1.8, -3.8); outside.add(blueL);
  const rain = makeParticles({ count: 600, kind: 'rain', color: '#a8a29b', size: 0.12, area: [14, 8, 8], center: [STORE.x, 4, STORE.z - 4] });
  scene.add(rain);

  // lluvia sobre el valle durante la noche
  const vrain = makeParticles({ count: 900, kind: 'rain', color: '#9a948e', size: 0.16, area: [34, 14, 30], center: [0, 7, 2] });
  vrain.userData.wind = 1.2; scene.add(vrain);

  // encuadres de cada pasaje
  const frames = {
    menu: { pos: v(FOREST, 1.7, 0.9, 3.0), look: v(FOREST, 0.4, 0.75, 1) },
    bosque: { pos: v(FOREST, 0, 1.6, 9), look: v(FOREST, 0, 2.6, 0), to: { pos: v(FOREST, 0.6, 1.3, 6), look: v(FOREST, 0.3, 1.6, 0) } },
    bosque2: { pos: v(FOREST, 0.8, 1.2, 5.2), look: v(FOREST, 0.4, 1, 1) },
    flor: { pos: v(FOREST, 1.4, 0.8, 2.6), look: v(FOREST, 0.45, 0.72, 1) },
    rio: { cut: true, pos: v(RIVER, 1.8, 2.9, 3.6), look: v(RIVER, 0, 0.1, 0.6) },
    ronin: { cut: true, pos: v(STREET, 0.4, 1.5, 4.2), look: v(STREET, 0, 1.2, 0) },
    ronin2: { pos: v(STREET, 0.2, 1.4, 3.2), look: v(STREET, 0.4, 1.4, 0) },
    valle: { cut: true, pos: [7, 15, 22], look: [0, 0, -1.5], to: { pos: [-1, 9.5, 13], look: [-4, 0.5, -5] } },
    almacen: { cut: true, pos: v(STORE, 0, 1.35, 1.1), look: v(STORE, 0, 1.4, -3) },
  };

  let current = '';
  return {
    scene, frames,
    enter() {
      scene.add(valley.group);
      valley.show({ incense: true, chart: true, creatures: true });
      valley.setDawn(0); valley.setHeat(0); valley.setTrail(0); valley.setTime(0); valley.setLabels(true);
    },
    start() {},
    update({ key, t, sec }) {
      current = key;
      // flor: brilla cuando Kenji la roza
      const flor = key === 'flor' ? t : key === 'bosque2' ? 0 : key === 'bosque' ? 0 : 1;
      lilyLight.intensity = key === 'flor' ? 2 + Math.sin(t * 20) * 2 * (1 - t) : 0.6;
      lily.visible = !(key === 'flor' && t > 0.75);
      kid.position.x = FOREST.x - 0.6 + clamp(flor * 2) * 0.6;
      kid.rotation.x = key === 'flor' ? ramp(t, 0.3, 0.6) * -1.3 : 0;
      // río: ondas
      // ronin: el cuenco cae
      const fall = key === 'ronin' ? ramp(t, 0.15, 0.55) : key === 'ronin2' ? 1 : 0;
      bowl.position.set(STREET.x + 0.25, lerp(1.0, 0.05, fall * fall), STREET.z + 0.15);
      bowl.rotation.set(fall * 2.4, 0, fall * 1.2);
      splash.material.opacity = fall > 0.98 ? 0.35 : 0;
      // valle: el incienso se consume de 22:00 a 22:20 con el scroll
      if (key === 'valle') {
        const L = sec.len;
        const m = clamp(t * L / (L - 0.6)) * 20;
        valley.setTime(m);
      } else if (key === 'almacen') valley.setTime(20);
      else valley.setTime(0);
      // almacén: el oni levanta el garrote, la sangre salpica
      const st = key === 'almacen' ? t : 0;
      oniS.rotation.z = -ramp(st, 0.1, 0.4) * 0.15;
      club.rotation.z = -0.6 - ramp(st, 0.1, 0.35) * 1.2 + ramp(st, 0.35, 0.45) * 2.2;
      father.rotation.x = ramp(st, 0.42, 0.6) * -1.4;
      blood.material.opacity = ramp(st, 0.5, 0.65) * 0.95;
      scene.fog.density = key === 'valle' ? 0.012 : key === 'almacen' ? 0.03 : 0.035;
      hemi.intensity = key === 'valle' ? 0.6 : 0.9;
    },
    tick(dt, time) {
      leaves.update(dt, time); rain.update(dt, time);
      if (current === 'valle' || current === 'almacen') { vrain.visible = true; vrain.update(dt, time); } else vrain.visible = false;
      valley.update(dt, time);
      ripples.children.forEach((r, i) => { const k = (time * 0.35 + i / 4) % 1; r.scale.setScalar(1 + k * 5); r.material.opacity = 0.4 * (1 - k); });
      markLily.children.forEach((c) => {});
      fire.intensity = 55 + Math.sin(time * 9) * 12 + Math.sin(time * 23) * 8;
      lily.rotation.y = Math.sin(time * 0.4) * 0.2;
    },
  };
}
