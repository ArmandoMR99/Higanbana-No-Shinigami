// 3D · La Kusarigama: la sangre forma el arma pieza por pieza (mini juego) y luego respira.
import * as THREE from 'three';
import { makeWeapon, makeParticles, label, clamp, lerp } from '../geo.js';
import { PIEZAS } from '../story.js';

export function buildForge(app, { onPiece } = {}) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#0b0909');
  scene.fog = new THREE.FogExp2('#0b0909', 0.07);
  scene.add(new THREE.HemisphereLight('#c8c2ba', '#0a0808', 0.9));
  const key = new THREE.DirectionalLight('#ffffff', 3.2); key.position.set(-3, 5, 4); scene.add(key);
  const rimL = new THREE.PointLight('#ff2a2a', 26, 10, 1.4); rimL.position.set(2.4, 2.2, -1.6); scene.add(rimL);
  const rimR = new THREE.PointLight('#ff3a3a', 14, 9, 1.4); rimR.position.set(-2.6, 2.2, -1.6); scene.add(rimR);
  const core = new THREE.PointLight('#ff2020', 0, 5, 1.6); core.position.set(0, 1.2, 1.2); scene.add(core);

  // suelo: charco oscuro que refleja
  const floor = new THREE.Mesh(new THREE.CircleGeometry(9, 64), new THREE.MeshStandardMaterial({ color: '#100c0c', roughness: 0.75, metalness: 0.15 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -0.9; scene.add(floor);
  const pool = new THREE.Mesh(new THREE.CircleGeometry(0.9, 48), new THREE.MeshStandardMaterial({ color: '#5a0a10', emissive: '#3a0306', roughness: 0.1, metalness: 0.3 }));
  pool.rotation.x = -Math.PI / 2; pool.position.set(0.3, -0.59, -0.4); pool.visible = false;

  // círculo del higanbana en el suelo: anillos, kanji y una flor de seis pétalos que se encienden con la forja
  const drawMon = () => {
    const c = document.createElement('canvas'); c.width = c.height = 1024; const g = c.getContext('2d'); g.translate(512, 512);
    g.strokeStyle = 'rgba(255,60,60,1)'; g.fillStyle = 'rgba(255,60,60,1)';
    for (const [r, w] of [[490, 6], [462, 2], [330, 3], [312, 1.5], [120, 3]]) { g.lineWidth = w; g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.stroke(); }
    g.font = '700 64px "Shippori Mincho B1", serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const txt = '彼岸花の死神・彼岸花の死神・';
    for (let i = 0; i < txt.length; i++) { const a = (i / txt.length) * Math.PI * 2; g.save(); g.rotate(a); g.fillText(txt[i], 0, -398); g.restore(); }
    for (let k = 0; k < 6; k++) { g.save(); g.rotate((k / 6) * Math.PI * 2); g.lineWidth = 5; g.beginPath(); g.moveTo(0, -120); g.bezierCurveTo(70, -180, 40, -280, 0, -312); g.bezierCurveTo(-40, -280, -70, -180, 0, -120); g.stroke(); g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, -60); g.quadraticCurveTo(60, -200, 120, -300); g.stroke(); g.restore(); }
    for (let k = 0; k < 24; k++) { g.save(); g.rotate((k / 24) * Math.PI * 2); g.fillRect(-1.5, -330, 3, 18); g.restore(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  };
  const monTex = drawMon();
  const mon = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 4.6), new THREE.MeshBasicMaterial({ map: monTex, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, color: '#ff3a3a' }));
  mon.rotation.x = -Math.PI / 2; mon.position.set(0.25, -0.88, 0); scene.add(mon);
  // gotas de sangre que caen del núcleo al círculo, con ondas
  const drips = [];
  for (let k = 0; k < 5; k++) {
    const d = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), new THREE.MeshBasicMaterial({ color: '#ff2a2a' })); d.scale.y = 1.8;
    const rip = new THREE.Mesh(new THREE.RingGeometry(0.05, 0.065, 40), new THREE.MeshBasicMaterial({ color: '#ff3a3a', transparent: true, opacity: 0, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
    rip.rotation.x = -Math.PI / 2; scene.add(d, rip); drips.push({ d, rip, ph: k / 5 });
  }
  const weapon = makeWeapon();
  weapon.position.set(0.1, 1.35, 0); weapon.rotation.set(0, -0.25, -0.35); weapon.scale.setScalar(1.12);
  // telón de fondo: resplandor rojo difuso que da profundidad
  { const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d'); const gr = g.createRadialGradient(256, 256, 0, 256, 256, 256); gr.addColorStop(0, 'rgba(120,14,20,0.9)'); gr.addColorStop(0.45, 'rgba(50,6,8,0.6)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 512, 512); const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; const back = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })); back.position.set(0.6, 1.3, -5); scene.add(back); }
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
    refresh() { const old = mon.material.map; mon.material.map = drawMon(); mon.material.needsUpdate = true; old.dispose(); },
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
      for (const id of order) parts[id].userData.num.visible = key === 'forja' && order[placed] === id;
      // en 'despertar2' solo hay sangre flotando: las piezas aún no existen
      weapon.visible = key !== 'despertar2' || t > 0.6;
      drops.visible = key === 'despertar2' || key === 'forja';
    },
    tick(dt, time, mode) {
      blood.update(dt, time); drops.update(dt, time); embers.update(dt, time);
      mon.rotation.z = time * 0.05;
      mon.material.opacity = (placed >= 6 || current !== 'forja' ? 0.42 : 0.12 + placed * 0.05) + Math.sin(time * 1.8) * 0.06;
      { const cp = new THREE.Vector3(); weapon.userData.parts.nucleo.getWorldPosition(cp);
        for (const q of drips) { const f = (time * 0.35 + q.ph) % 1; const fall = Math.min(1, f / 0.45); q.d.visible = f < 0.45 && weapon.visible; q.d.position.set(cp.x, cp.y - 0.2 - fall * fall * (cp.y + 0.68), cp.z); const rf = Math.max(0, (f - 0.45) / 0.55); q.rip.position.set(cp.x, -0.875, cp.z); q.rip.scale.setScalar(1 + rf * 9); q.rip.material.opacity = rf > 0 ? (1 - rf) * 0.6 : 0; } }
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
      core.intensity = done ? 10 + breathe * 8 : 2 + placed * 1.5;
      rimL.intensity = 20 + breathe * 10;
      weapon.rotation.y = done && current !== 'forja' ? -0.25 + Math.sin(time * 0.45) * 0.5 : -0.25;
      weapon.position.y = 1.3 + Math.sin(time * 1.2) * 0.04;
      if (err > 0) { err -= dt; weapon.position.x = 0.1 + Math.sin(err * 60) * 0.025; }
    },
  };
}
