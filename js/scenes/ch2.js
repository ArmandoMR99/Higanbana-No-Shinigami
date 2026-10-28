// Capítulo II · 雨夜 · La noche que llovió sangre
import * as THREE from 'three';
import { makeWeapon, makeFigure, makeParticles, makeTubeTrail, label, mat, seeded, ramp, clamp, lerp } from '../geo.js';
import { makeCreature, W } from '../valley.js';
import { PIEZAS, CRIATURAS, nightAt } from '../story.js';
import { showBestia } from '../ui.js';

const ROOM = new THREE.Vector3(60, 0, 0);
const PULSE = new THREE.Vector3(95, 0, 0);
const RING = new THREE.Vector3(130, 0, 0);
const ROAD = new THREE.Vector3(165, 0, 0);
const v = (o, x, y, z) => [o.x + x, o.y + y, o.z + z];

export function buildCh2(app) {
  const { valley } = app;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#0d0b0b');
  scene.fog = new THREE.FogExp2('#0d0b0b', 0.06);
  const hemi = new THREE.HemisphereLight('#a8a29b', '#0c0a0a', 0.8); scene.add(hemi);
  const moon = new THREE.DirectionalLight('#ffffff', 1.2); moon.position.set(-6, 14, 8); scene.add(moon);
  const R = seeded(33);
  const clickables = [];

  // --- Almacén por dentro: Kenji en el suelo y la forja ---
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), mat.gray('#2e2a28')); floor.rotation.x = -Math.PI / 2; floor.position.copy(ROOM); scene.add(floor);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(10, 5), mat.gray('#3a3532')); back.position.set(ROOM.x, 2.5, ROOM.z - 3); scene.add(back);
  for (let i = 0; i < 9; i++) { const s = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 0.4, 3, 8), mat.gray('#6a645e')); s.rotation.z = Math.PI / 2; s.position.set(ROOM.x - 3.2 + (i % 3) * 0.75, 0.33 + Math.floor(i / 3) * 0.55, ROOM.z - 2.4); scene.add(s); }
  const kenji = makeFigure({ h: 1.6, mark: true }); kenji.position.set(ROOM.x - 0.4, 0.22, ROOM.z + 0.4); kenji.rotation.set(-Math.PI / 2, 0, 0.4); scene.add(kenji);
  const roomLight = new THREE.PointLight('#d8d2c8', 6, 9, 1.5); roomLight.position.set(ROOM.x + 1, 3.2, ROOM.z + 1.5); scene.add(roomLight);
  const armGlow = new THREE.PointLight('#ff2020', 0, 4, 2); armGlow.position.set(ROOM.x + 0.1, 0.5, ROOM.z + 0.4); scene.add(armGlow);
  const door = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.4), mat.gray('#241f1e')); door.position.set(ROOM.x + 2.6, 1.2, ROOM.z - 2.95); scene.add(door);
  const oniDoor = makeCreature('oni'); oniDoor.scale.setScalar(2.4); oniDoor.position.set(ROOM.x + 2.6, 0, ROOM.z - 3.6); oniDoor.visible = false; scene.add(oniDoor);
  const doorLight = new THREE.PointLight('#4a7bff', 0, 6, 2); doorLight.position.set(ROOM.x + 2.4, 2, ROOM.z - 2.4); scene.add(doorLight);

  // La kusarigama, en piezas
  const weapon = makeWeapon();
  weapon.position.set(ROOM.x + 0.3, 1.55, ROOM.z - 0.2); weapon.rotation.set(0, -0.25, -0.35); weapon.scale.setScalar(0.85);
  scene.add(weapon);
  const parts = weapon.userData.parts;
  const order = PIEZAS.map((p) => p.id);
  const scatter = {};
  order.forEach((id, k) => {
    const a = (k / 6) * Math.PI * 2 + 0.4;
    scatter[id] = new THREE.Vector3(Math.cos(a) * 1.9, Math.sin(a) * 1.25 - 0.2, 0.3 + Math.sin(a * 2) * 0.3);
    parts[id].traverse((o) => { if (o.isMesh) { o.userData.piece = id; clickables.push(o); o.material = o.material.clone(); } });
    const num = label(`<b>${k + 1}</b> · ${PIEZAS[k].name}`, 'lbl'); parts[id].add(num); parts[id].userData.num = num;
  });
  const forgeLight = new THREE.PointLight('#ff2a2a', 0, 6, 1.6); forgeLight.position.set(ROOM.x + 0.3, 1.6, ROOM.z + 1); scene.add(forgeLight);
  const forgeList = document.getElementById('forge-list');
  forgeList.innerHTML = PIEZAS.map((p, k) => `<div data-id="${p.id}">${k + 1}. ${p.name}</div>`).join('');
  let placed = 6, err = 0;
  const pieceT = Object.fromEntries(order.map((id) => [id, 1]));
  function setPlaced(n) { placed = n; order.forEach((id, k) => (pieceT[id] = k < n ? 1 : 0)); refreshList(); }
  function refreshList() {
    forgeList.querySelectorAll('div').forEach((d, k) => { d.className = k < placed ? 'done' : k === placed ? 'next' : ''; });
  }
  const blood = makeParticles({ count: 160, kind: 'ash', color: '#c0141c', size: 0.04, area: [3.5, 2.8, 1.5], center: [ROOM.x + 0.3, 1.5, ROOM.z] });
  blood.userData.speed = -0.3; scene.add(blood);

  // --- El latido: poder de Kenji de 22:30 a 23:00 ---
  const pground = new THREE.Mesh(new THREE.CircleGeometry(12, 40), mat.gray('#2a2725')); pground.rotation.x = -Math.PI / 2; pground.position.copy(PULSE); scene.add(pground);
  const fighter = makeFigure({ h: 1.7, mark: true }); fighter.position.set(PULSE.x, 0, PULSE.z + 1.2); fighter.rotation.y = Math.PI * 0.15; scene.add(fighter);
  const fw = makeWeapon(); fw.scale.setScalar(0.42); fw.position.set(0.35, 0.95, 0.15); fw.rotation.set(0, 0, -0.6); fighter.add(fw);
  const powerAt = (m) => (m < 30 ? 0 : m < 32 ? 15 + ((m - 30) / 2) * 85 : m < 45 ? 100 : 100 - ((m - 45) / 15) * 80);
  const beat = (m) => { const ph = (m % 1.1) / 1.1; return Math.exp(-Math.pow((ph - 0.2) / 0.025, 2)) * 1 - Math.exp(-Math.pow((ph - 0.27) / 0.03, 2)) * 0.35 + Math.exp(-Math.pow((ph - 0.55) / 0.08, 2)) * 0.15; };
  const PW = 11, PH = 3.2;
  const ppts = [];
  for (let m = 30; m <= 60; m += 0.04) ppts.push(new THREE.Vector3((m - 30) / 30 * PW - PW / 2, 0.6 + (powerAt(m) / 100) * PH * (0.25 + 0.75 * beat(m)), 0));
  const pline = makeTubeTrail(ppts, 0.03, mat.glow(1.8), 900);
  const pchart = new THREE.Group(); pchart.position.set(PULSE.x, 1.2, PULSE.z - 2.2); pchart.add(pline); scene.add(pchart);
  const pBase = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-PW / 2, 0.6, 0), new THREE.Vector3(PW / 2, 0.6, 0)]), new THREE.LineBasicMaterial({ color: '#4a4542' })); pchart.add(pBase);
  const pLabels = [[30, '22:30'], [32, '22:32 · nace el arma'], [45, '22:45'], [60, '23:00 · se desmaya']].map(([m, t]) => { const l = label(t, 'lbl axis'); l.position.set((m - 30) / 30 * PW - PW / 2, 0.25, 0); pchart.add(l); return l; });
  const pTitle = label('Poder de Kenji', 'lbl'); pTitle.position.set(-PW / 2 + 1, PH + 1.4, 0); pchart.add(pTitle);
  const pVal = label('', 'lbl val'); pchart.add(pVal);

  // --- El anillo de criaturas (la dona) ---
  const rground = new THREE.Mesh(new THREE.CircleGeometry(14, 48), mat.gray('#262321')); rground.rotation.x = -Math.PI / 2; rground.position.copy(RING); scene.add(rground);
  const center = makeFigure({ h: 1.7, mark: true }); center.position.copy(RING); scene.add(center);
  const cw = makeWeapon(); cw.scale.setScalar(0.42); cw.position.set(0.35, 0.95, 0.15); cw.rotation.set(0, 0, -0.6); center.add(cw);
  const ring = new THREE.Group(); ring.position.set(RING.x, 1.3, RING.z); scene.add(ring);
  const total = CRIATURAS.reduce((s, c) => s + c.count, 0);
  const arcs = {};
  let a0 = 0;
  const shades = { dragon: '#cfc9c1', oni: '#8f8a84', yokai: '#6a6560', kappa: '#4a4643' };
  for (const c of CRIATURAS) {
    const span = (c.count / total) * Math.PI * 2;
    const arc = new THREE.Mesh(new THREE.TorusGeometry(3.6, 0.13, 8, 80, span - 0.06), new THREE.MeshStandardMaterial({ color: shades[c.id], roughness: 0.8, emissive: '#000000' }));
    arc.rotation.x = Math.PI / 2; arc.rotation.z = a0 + 0.03;
    arc.userData.piece = 'arc:' + c.id; clickables.push(arc);
    ring.add(arc);
    const mid = a0 + span / 2;
    const lbl = label(`<span class="jp">${c.kanji}</span>${c.name} · ${(c.count / total * 100).toFixed(1).replace('.', ',')} %`, 'lbl', () => showBestia(c.id, highlight));
    lbl.position.set(Math.cos(mid) * 4.5, 0.6, -Math.sin(mid) * 4.5); ring.add(lbl);
    const members = [];
    for (let i = 0; i < c.count; i++) {
      const m = makeCreature(c.id, R);
      const a = a0 + ((i + 0.5) / c.count) * span;
      m.position.set(Math.cos(a) * 3.6, 0.35 + (c.id === 'dragon' ? 0.4 : 0), -Math.sin(a) * 3.6);
      m.rotation.y = a; m.scale.multiplyScalar(c.id === 'dragon' ? 0.8 : 1);
      m.traverse((o) => { if (o.isMesh) { o.userData.piece = 'arc:' + c.id; clickables.push(o); } });
      ring.add(m); members.push(m);
    }
    arcs[c.id] = { arc, members, lbl };
    a0 += span;
  }
  const ringTitle = label('30 criaturas atacaron el valle', 'lbl big'); ringTitle.position.set(0, 3.2, 0); ring.add(ringTitle);
  let hi = null;
  function highlight(id) {
    hi = id;
    for (const k in arcs) {
      const on = k === id;
      arcs[k].arc.material.color.set(on ? '#c0141c' : shades[k]);
      arcs[k].arc.material.emissive.set(on ? '#6a0a0e' : '#000000');
    }
  }

  // --- El camino de montaña ---
  const slope = new THREE.Mesh(new THREE.PlaneGeometry(30, 30, 30, 30), mat.gray('#4a4643'));
  slope.rotation.x = -Math.PI / 2 + 0.12; slope.position.set(ROAD.x, 0, ROAD.z - 6); scene.add(slope);
  const walker = makeFigure({ h: 1.7, mark: true }); walker.position.set(ROAD.x, 0.3, ROAD.z); walker.rotation.y = Math.PI; scene.add(walker);
  const sw = makeWeapon(); sw.scale.setScalar(0.42); sw.position.set(0.25, 1.35, -0.1); sw.rotation.set(0.2, 0, 2.4); walker.add(sw);
  const kneel = makeFigure({ h: 0.55, mark: true }); kneel.rotation.x = -1.2; scene.add(kneel);

  const rain = makeParticles({ count: 900, kind: 'rain', color: '#a8a29b', size: 0.15, area: [30, 12, 26], center: [0, 6, 0] });
  rain.userData.wind = 1; scene.add(rain);

  const frames = {
    menu: { pos: v(ROOM, 0.2, 1.6, 6.4), look: v(ROOM, 0.3, 1.3, -0.2) },
    despertar: { pos: v(ROOM, 1.6, 2.2, 2.6), look: v(ROOM, -0.2, 0.3, 0.3) },
    despertar2: { pos: v(ROOM, 1.2, 1.8, 2.4), look: v(ROOM, 0, 0.5, 0.2) },
    forja: { pos: v(ROOM, 0.3, 1.6, 4.4), look: v(ROOM, 0.3, 1.4, -0.2) },
    arma: { pos: v(ROOM, 0.6, 1.6, 2.9), look: v(ROOM, 0.3, 1.5, -0.2) },
    arma2: { pos: v(ROOM, 0.5, 1.6, 2.6), look: v(ROOM, 0.3, 1.5, -0.2) },
    latido: { cut: true, pos: v(PULSE, 1.5, 2.2, 8.2), look: v(PULSE, 0, 2.2, -2) },
    anillo: { cut: true, pos: v(RING, 0, 6.2, 9.4), look: v(RING, 0, 0.8, 0), to: { pos: v(RING, 4.5, 4.2, 7.6), look: v(RING, 0, 1, 0) } },
    amanecer: { cut: true, pos: [5, 17, 21], look: [0, 0, -2], to: { pos: [1, 11, 12], look: [-2, 0, -4] } },
    ruinas: { cut: true, pos: [0.5, 6.5, -1.5], look: [-6, 0, -9.5] },
    partida: { pos: [-0.5, 5.2, -3.5], look: [-6, 0.4, -9.5] },
    partida2: { pos: [-0.5, 5.2, -3.5], look: [-6, 0.4, -9.5] },
    camino: { cut: true, pos: v(ROAD, 0.6, 2.2, 4.2), look: v(ROAD, 0, 1.6, -6) },
  };

  let current = '', lastKey = '';
  const ak = W(30, 20);
  return {
    scene, frames, clickables,
    highlight,
    enter() {
      scene.add(valley.group);
      valley.show({ incense: true, chart: true, creatures: true, heat: true, blood: true, embers: true });
      valley.setLabels(false);
      setPlaced(6);
      for (const id of order) parts[id].userData.num.visible = false;
    },
    start() { setPlaced(0); },
    pick(mouse, hoverOnly) {
      const ray = new THREE.Raycaster(); ray.setFromCamera(mouse, app.camera);
      const hit = ray.intersectObjects(clickables, false).find((h) => h.object.visible && isVisibleUp(h.object));
      if (!hit) return false;
      const id = hit.object.userData.piece;
      if (current === 'forja' && order.includes(id)) {
        if (hoverOnly) return true;
        if (pieceT[id] === 1) return true;
        if (id === order[placed]) { placed++; refreshList(); }
        else { const d = forgeList.querySelector(`[data-id="${order[placed]}"]`); d && (d.classList.remove('err'), void d.offsetWidth, d.classList.add('err')); err = 0.6; }
        return true;
      }
      if (current === 'anillo' && id.startsWith('arc:')) { if (!hoverOnly) showBestia(id.slice(4), highlight); return true; }
      return false;
    },
    update({ key, t, sec }) {
      if (key !== lastKey) {
        if (lastKey === 'forja' && key !== 'forja' && key !== 'despertar2') setPlaced(6);
        lastKey = key;
      }
      current = key;
      forgeList.classList.toggle('on', key === 'forja');
      // despertar: la marca y el brazo arden
      const burn = key === 'despertar' ? t : ['despertar2', 'forja', 'arma', 'arma2'].includes(key) ? 1 : 0;
      armGlow.intensity = burn * (6 + Math.sin(performance.now() * 0.01) * 2);
      kenji.visible = ['despertar', 'despertar2', 'forja'].includes(key);
      // la forja
      const showW = ['forja', 'arma', 'arma2', 'despertar2', 'menu'].includes(key) || app.reader.sections.length === 0;
      weapon.visible = showW || key === 'despertar2';
      blood.visible = key === 'despertar2' || key === 'forja';
      for (const id of order) parts[id].userData.num.visible = key === 'forja' && order[placed] === id;
      oniDoor.visible = key === 'arma' && t > 0.45 || key === 'arma2';
      doorLight.intensity = oniDoor.visible ? 8 : 0;
      // latido
      const lt = key === 'latido' ? clamp(t * 1.25) : ['anillo'].includes(key) ? 1 : 0;
      pline.setProgress(lt);
      const m = 30 + lt * 30;
      pVal.position.set((m - 30) / 30 * PW - PW / 2, 0.6 + (powerAt(m) / 100) * PH + 0.7, 0);
      pVal.element.innerHTML = `${Math.round(powerAt(m))}<small>poder</small>`;
      pVal.visible = key === 'latido';
      // anillo
      if (key !== 'anillo' && hi) highlight(null);
      // valle: el incienso termina, aparece la mancha y el rastro de sangre, amanece
      if (key === 'amanecer') {
        const L = sec.len;
        const k = clamp(t * L / (L - 0.5));
        const mm = 20 + clamp(k / 0.75) * 40;
        valley.setDawn(ramp(k, 0.8, 1));
        valley.setTime(mm); valley.setHeat(ramp(mm, 35, 60)); valley.setTrail(ramp(mm, 32, 58));
      } else if (['ruinas', 'partida', 'partida2'].includes(key)) {
        valley.setDawn(1); valley.setTime(60); valley.setHeat(1); valley.setTrail(1);
      } else { valley.setDawn(0); valley.setTime(20); valley.setHeat(0); valley.setTrail(0); }
      const inValley = ['amanecer', 'ruinas', 'partida', 'partida2'].includes(key);
      const dawn = inValley ? valley.state.dawn : 0;
      kneel.visible = ['ruinas', 'partida', 'partida2'].includes(key);
      kneel.position.set(ak.x + 0.6, valley.heightAt(ak.x + 0.6, ak.z + 1) + 0.1, ak.z + 1);
      hemi.intensity = inValley ? 0.6 + dawn * 1.1 : key === 'camino' ? 1.4 : 0.8;
      scene.background.set(dawn > 0 || key === 'camino' ? '#2b2826' : '#0d0b0b');
      scene.fog.color.copy(scene.background);
      scene.fog.density = inValley ? 0.012 + dawn * 0.01 : key === 'camino' ? 0.05 : 0.06;
      rain.visible = (inValley && dawn < 0.5) || key === 'anillo' || key === 'latido';
      rain.position.set(inValley ? 0 : key === 'anillo' ? RING.x : PULSE.x, 0, 0);
      walker.position.z = ROAD.z - (key === 'camino' ? t * 3 : 0);
    },
    tick(dt, time, mode) {
      valley.update(dt, time);
      rain.update(dt, time); blood.update(dt, time);
      ring.rotation.y = time * 0.08;
      for (const k in arcs) for (const m of arcs[k].members) if (m.userData.wing) m.userData.wing.rotation.z = Math.sin(time * 5 + m.position.x) * 0.5;
      // piezas: flotan dispersas hasta que se colocan
      for (const id of order) {
        const target = pieceT[id] === 1 || (mode === 'menu') ? 1 : 0;
        const p = parts[id];
        p.userData.f = lerp(p.userData.f ?? target, target, 1 - Math.pow(0.02, dt));
        const f = p.userData.f;
        const s = scatter[id];
        p.position.set(lerp(s.x, p.userData.home.x, f), lerp(s.y + Math.sin(time * 1.5 + s.x) * 0.08, p.userData.home.y, f), lerp(s.z, p.userData.home.z, f));
        p.rotation.set(lerp(time * 0.4 + s.x, p.userData.homeRot.x, f), lerp(time * 0.3, p.userData.homeRot.y, f), lerp(s.y, p.userData.homeRot.z, f));
        const isNext = current === 'forja' && order[placed] === id;
        p.traverse((o) => { if (o.isMesh && o.material.emissive) o.material.emissiveIntensity = isNext ? 1.2 + Math.sin(time * 6) * 0.8 : (o.material.userData.base ??= o.material.emissiveIntensity); });
      }
      const done = placed >= 6;
      forgeLight.intensity = (done ? 8 + Math.sin(time * 2.2) * 3 : 2 + placed) * (weapon.visible ? 1 : 0);
      weapon.rotation.y = done && current !== 'forja' ? -0.25 + Math.sin(time * 0.5) * 0.4 : -0.25;
      if (err > 0) { err -= dt; weapon.position.x = ROOM.x + 0.3 + Math.sin(err * 60) * 0.02; }
    },
  };
}

function isVisibleUp(o) { while (o) { if (!o.visible) return false; o = o.parent; } return true; }
