// 3D · El lirio: portada (gira y sigue al cursor, se deshoja al entrar) y cierre del Capítulo III (se rearma).
import * as THREE from 'three';
import { makeLily, makeParticles, clamp, smooth } from '../geo.js';

export function buildIntro(app) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#0d0b0b');
  scene.fog = new THREE.FogExp2('#0d0b0b', 0.12);
  scene.add(new THREE.HemisphereLight('#9a948e', '#0a0808', 0.9));
  const key = new THREE.DirectionalLight('#ffffff', 2.2); key.position.set(-2, 4, 3); scene.add(key);
  const rim = new THREE.PointLight('#ff3030', 6, 6, 2); rim.position.set(0.6, 2.4, -1.2); scene.add(rim);
  const under = new THREE.PointLight('#ff2020', 2, 3, 2); under.position.set(0, 0.6, 0.8); scene.add(under);

  const ground = new THREE.Mesh(new THREE.CircleGeometry(14, 48), new THREE.MeshStandardMaterial({ color: '#2a2725', roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; scene.add(ground);
  const grassM = new THREE.MeshStandardMaterial({ color: '#4a4643', roughness: 1, side: THREE.DoubleSide });
  for (let i = 0; i < 260; i++) {
    const a = Math.random() * Math.PI * 2, r = 0.6 + Math.random() * 7;
    const b = new THREE.Mesh(new THREE.PlaneGeometry(0.02, 0.25 + Math.random() * 0.4), grassM);
    b.position.set(Math.cos(a) * r, 0.15, Math.sin(a) * r); b.rotation.set((Math.random() - 0.5) * 0.4, Math.random() * 3, (Math.random() - 0.5) * 0.5);
    scene.add(b);
  }
  // halo rojo detrás de la flor
  const haloTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(200,30,30,0.55)'); gr.addColorStop(1, 'rgba(200,30,30,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, transparent: true, depthWrite: false })); halo.scale.set(2.6, 2.6, 1); halo.position.set(0, 1.8, -0.6); scene.add(halo);

  const lily = makeLily({ florets: 6, stem: 1.7, scale: 1, seed: 3 });
  scene.add(lily);
  const homes = lily.userData.petals.map((p) => ({ p, pos: p.position.clone(), rot: p.rotation.clone(), off: new THREE.Vector3((Math.random() - 0.5) * 6, Math.random() * 4 + 1, (Math.random() - 0.2) * 5), spin: new THREE.Vector3(Math.random() * 8, Math.random() * 8, Math.random() * 8) }));

  const petals = makeParticles({ count: 140, kind: 'petal', color: '#c8161e', size: 0.045, area: [9, 6, 7], center: [0, 3, -1] });
  scene.add(petals);

  let burst = 0, reform = -1;
  const flying = [];
  const frames = { menu: { pos: [0, 1.75, 3.1], look: [0, 1.55, 0] }, final: { pos: [0, 1.85, 3.6], look: [0, 1.7, 0] } };

  const reset = () => { burst = 0; flying.length = 0; for (const h of homes) { h.p.position.copy(h.pos); h.p.rotation.copy(h.rot); } petals.userData.speed = 1; petals.userData.wind = 0; };
  return {
    scene, frames, parallax: 0.18, reset,
    burst() {
      burst = 0.0001;
      for (const h of homes) flying.push({ m: h.p, v: new THREE.Vector3((Math.random() - 0.3) * 3, Math.random() * 2.5 + 0.5, (Math.random() + 0.4) * 2.2), r: h.spin });
      petals.userData.speed = 5; petals.userData.wind = 3;
    },
    // cierre: los pétalos vuelven y el lirio se rearma con el scroll
    update({ key, t }) {
      if (key !== 'final') { reform = -1; return; }
      reform = smooth(clamp(t * 1.4));
      burst = 0; flying.length = 0;
      for (const h of homes) {
        const e = 1 - reform;
        h.p.position.copy(h.pos).addScaledVector(h.off, e);
        h.p.rotation.set(h.rot.x + h.spin.x * e, h.rot.y + h.spin.y * e, h.rot.z + h.spin.z * e);
      }
    },
    tick(dt, time, mode) {
      const m = app.mouse;
      lily.rotation.y += dt * 0.15;
      lily.rotation.x += ((-m.y * 0.25) - lily.rotation.x) * 0.04;
      lily.rotation.z += ((-m.x * 0.25) - lily.rotation.z) * 0.04;
      rim.intensity = 5 + Math.sin(time * 1.3) * 1.5 + (reform >= 0 ? reform * 6 : 0);
      halo.material.opacity = 0.7 + 0.3 * Math.sin(time * 1.3) + (reform >= 0 ? reform * 0.6 : 0);
      petals.update(dt, time);
      if (burst) {
        burst += dt;
        for (const f of flying) { f.m.position.addScaledVector(f.v, dt * 0.6); f.m.rotation.x += f.r.x * dt * 0.3; f.m.rotation.y += f.r.y * dt * 0.3; f.v.y -= dt * 0.8; }
        petals.userData.speed = Math.max(1, 5 - burst * 2);
      }
    },
  };
}
