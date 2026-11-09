// 3D · La Kusarigama: la sangre forma el arma pieza por pieza (mini juego) y luego respira.
import * as THREE from 'three';
import { makeWeapon, makeParticles, label, clamp, lerp } from '../geo.js';
import { PIEZAS } from '../story.js';

export function buildForge(app, { onPiece } = {}) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#0b0909');
  scene.fog = new THREE.FogExp2('#0b0909', 0.07);
  scene.add(new THREE.HemisphereLight('#b8b2aa', '#0a0808', 0.55));
  const key = new THREE.DirectionalLight('#ffffff', 1.6); key.position.set(-3, 5, 4); scene.add(key);
  const rimL = new THREE.PointLight('#ff2a2a', 14, 9, 1.6); rimL.position.set(2.4, 2.2, -1.6); scene.add(rimL);
  const rimR = new THREE.PointLight('#ff3a3a', 8, 8, 1.6); rimR.position.set(-2.6, 2.2, -1.6); scene.add(rimR);
  const core = new THREE.PointLight('#ff2020', 0, 5, 1.6); core.position.set(0, 1.2, 1.2); scene.add(core);

  // suelo: charco oscuro que refleja
  const floor = new THREE.Mesh(new THREE.CircleGeometry(9, 64), new THREE.MeshStandardMaterial({ color: '#100c0c', roughness: 0.75, metalness: 0.15 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -0.9; scene.add(floor);
  const pool = new THREE.Mesh(new THREE.CircleGeometry(0.9, 48), new THREE.MeshStandardMaterial({ color: '#5a0a10', emissive: '#3a0306', roughness: 0.1, metalness: 0.3 }));
  pool.rotation.x = -Math.PI / 2; pool.position.set(0.3, -0.59, -0.4); pool.visible = false;

  const weapon = makeWeapon();
  weapon.position.set(0.1, 1.35, 0); weapon.rotation.set(0, -0.25, -0.35); weapon.scale.setScalar(0.9);
  scene.add(weapon);
  weapon.traverse((o) => { if (o.isMesh) o.material = o.material.clone(); });
  const parts = weapon.userData.parts;
  const order = PIEZAS.map((p) => p.id);
  const clickables = [];
  const scatter = {};
  order.forEach((id, k) => {
    const a = (k / 6) * Math.PI * 2 + 0.4;
    scatter[id] = new THREE.Vector3(Math.cos(a) * 1.55 - 0.15, Math.sin(a) * 1.1 + 0.05, 0.3 + Math.sin(a * 2) * 0.3);
    parts[id].traverse((o) => { if (o.isMesh) { o.userData.piece = id; clickables.push(o); } });
    const num = label(`<b>${k + 1}</b> · ${PIEZAS[k].name}`, 'lbl'); num.visible = false; parts[id].add(num); parts[id].userData.num = num;
    parts[id].userData.f = 1;
  });

  const blood = makeParticles({ count: 220, kind: 'ash', color: '#c0141c', size: 0.035, area: [4, 3.2, 2], center: [0.1, 1.3, 0] });
  blood.userData.speed = -0.35; scene.add(blood);
  const embers = makeParticles({ count: 120, kind: 'ember', color: '#ff4a2a', size: 0.03, area: [6, 4, 4], center: [0, 1, -0.5] });
  embers.userData.speed = 0.6; scene.add(embers);
  const drops = makeParticles({ count: 60, kind: 'ash', color: '#e0303a', size: 0.06, area: [0.8, 3, 0.8], center: [0.1, 1.2, 0] });
  drops.userData.speed = -2.2; scene.add(drops);

  const forgeList = document.getElementById('forge-list');
  forgeList.innerHTML = PIEZAS.map((p, k) => `<div data-id="${p.id}"><b>${k + 1}</b> ${p.name}<small>${p.desc}</small></div>`).join('');
  let placed = 6, err = 0, current = '';
  const refresh = () => forgeList.querySelectorAll('div').forEach((d, k) => (d.className = k < placed ? 'done' : k === placed ? 'next' : ''));
  const setPlaced = (n) => { placed = n; refresh(); };

  const frames = {
    menu: { pos: [0.2, 1.35, 7.4], look: [0.15, 1.2, 0] },
    despertar2: { pos: [0.5, 1.3, 6.4], look: [0.1, 1.2, 0] },
    forja: { pos: [0.2, 1.3, 6.6], look: [0.1, 1.15, 0] },
    arma: { pos: [0.7, 1.4, 6.0], look: [0.15, 1.3, 0] },
    arma2: { pos: [0.4, 1.45, 5.4], look: [0.15, 1.35, 0] },
  };

  return {
    scene, frames, parallax: 0.2,
    setPlaced, get placed() { return placed; },
    pick(mouse, hoverOnly) {
      if (current !== 'forja') return false;
      const ray = new THREE.Raycaster(); ray.setFromCamera(mouse, app.camera);
      const hit = ray.intersectObjects(clickables, false)[0];
      if (!hit) return false;
      const id = hit.object.userData.piece;
      if (hoverOnly) return parts[id].userData.f < 0.5;
      if (parts[id].userData.f > 0.5 || placed >= 6) return true;
      if (id === order[placed]) { placed++; refresh(); onPiece && onPiece(placed >= 6 ? 'done' : 'piece'); }
      else { const d = forgeList.querySelector(`[data-id="${order[placed]}"]`); if (d) { d.classList.remove('err'); void d.offsetWidth; d.classList.add('err'); } err = 0.5; onPiece && onPiece('wrong'); }
      return true;
    },
    update({ key, t }) {
      if (key !== current) { if (current === 'forja' && key !== 'forja' && key !== 'despertar2') setPlaced(6); current = key; }
      forgeList.classList.toggle('on', key === 'forja');
      for (const id of order) parts[id].userData.num.visible = key === 'forja' && order[placed] === id;
      // en 'despertar2' solo hay sangre flotando: las piezas aún no existen
      weapon.visible = key !== 'despertar2' || t > 0.6;
      drops.visible = key === 'despertar2' || key === 'forja';
    },
    tick(dt, time, mode) {
      blood.update(dt, time); drops.update(dt, time); embers.update(dt, time);
      weapon.userData.glows.forEach((g, i) => { g.material.opacity = 0.35 + 0.2 * Math.sin(time * 1.8 + i); });
      for (const id of order) {
        const target = mode === 'menu' || current !== 'forja' && current !== 'despertar2' ? 1 : order.indexOf(id) < placed ? 1 : 0;
        const p = parts[id];
        p.userData.f = lerp(p.userData.f, target, 1 - Math.pow(0.03, dt));
        const f = p.userData.f, s = scatter[id], h = p.userData.home, r = p.userData.homeRot;
        p.position.set(lerp(s.x, h.x, f), lerp(s.y + Math.sin(time * 1.5 + s.x) * 0.08, h.y, f), lerp(s.z, h.z, f));
        p.rotation.set(lerp(time * 0.4 + s.x, r.x, f), lerp(time * 0.3, r.y, f), lerp(s.y, r.z, f));
        const isNext = current === 'forja' && order[placed] === id;
        p.traverse((o) => { if (o.isMesh && o.material.emissive) { o.material.userData.base ??= o.material.emissiveIntensity; o.material.emissiveIntensity = isNext ? 1.4 + Math.sin(time * 6) * 0.9 : o.material.userData.base; } });
      }
      const done = placed >= 6 || current !== 'forja';
      const breathe = 0.5 + 0.5 * Math.sin(time * 1.8);
      core.intensity = done ? 6 + breathe * 6 : 1 + placed;
      rimL.intensity = 10 + breathe * 6;
      weapon.rotation.y = done && current !== 'forja' ? -0.25 + Math.sin(time * 0.45) * 0.5 : -0.25;
      weapon.position.y = 1.35 + Math.sin(time * 1.2) * 0.04;
      if (err > 0) { err -= dt; weapon.position.x = 0.1 + Math.sin(err * 60) * 0.025; }
    },
  };
}
