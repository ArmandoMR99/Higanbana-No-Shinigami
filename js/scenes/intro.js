// Portada: un higanbana solitario gira en la niebla y reacciona al cursor.
import * as THREE from 'three';
import { makeLily, makeParticles, clamp } from '../geo.js';

export function buildIntro(app) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#0d0b0b');
  scene.fog = new THREE.FogExp2('#0d0b0b', 0.12);
  scene.add(new THREE.HemisphereLight('#9a948e', '#0a0808', 0.9));
  const key = new THREE.DirectionalLight('#ffffff', 2.2); key.position.set(-2, 4, 3); scene.add(key);
  const rim = new THREE.PointLight('#ff3030', 6, 6, 2); rim.position.set(0.6, 2.4, -1.2); scene.add(rim);

  const ground = new THREE.Mesh(new THREE.CircleGeometry(14, 48), new THREE.MeshStandardMaterial({ color: '#2a2725', roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; scene.add(ground);
  // hierba seca en tinta
  const grassM = new THREE.MeshStandardMaterial({ color: '#4a4643', roughness: 1, side: THREE.DoubleSide });
  for (let i = 0; i < 220; i++) {
    const a = Math.random() * Math.PI * 2, r = 0.6 + Math.random() * 7;
    const b = new THREE.Mesh(new THREE.PlaneGeometry(0.02, 0.25 + Math.random() * 0.4), grassM);
    b.position.set(Math.cos(a) * r, 0.15, Math.sin(a) * r); b.rotation.set((Math.random() - 0.5) * 0.4, Math.random() * 3, (Math.random() - 0.5) * 0.5);
    scene.add(b);
  }

  const lily = makeLily({ florets: 6, stem: 1.7, scale: 1, seed: 3 });
  scene.add(lily);

  const petals = makeParticles({ count: 140, kind: 'petal', color: '#c8161e', size: 0.045, area: [9, 6, 7], center: [0, 3, -1] });
  scene.add(petals);

  let burst = 0;
  const flying = [];
  const frames = { menu: { pos: [0, 1.75, 3.1], look: [0, 1.55, 0] } };

  return {
    scene, frames, parallax: 0.18,
    burst() {
      burst = 0.0001;
      // los pétalos de la flor se desprenden y vuelan
      for (const p of lily.userData.petals) {
        const w = new THREE.Vector3(); p.getWorldPosition(w);
        flying.push({ m: p, v: new THREE.Vector3((Math.random() - 0.3) * 3, Math.random() * 2.5 + 0.5, (Math.random() + 0.4) * 2.2), r: new THREE.Vector3(Math.random() * 6, Math.random() * 6, Math.random() * 6) });
      }
      petals.userData.speed = 5; petals.userData.wind = 3;
    },
    tick(dt, time) {
      // la flor sigue al cursor, como si mirara
      const m = app.mouse;
      lily.rotation.y += dt * 0.15;
      lily.rotation.x += ((-m.y * 0.25) - lily.rotation.x) * 0.04;
      lily.rotation.z += ((-m.x * 0.25) - lily.rotation.z) * 0.04;
      rim.intensity = 5 + Math.sin(time * 1.3) * 1.5;
      petals.update(dt, time);
      if (burst) {
        burst += dt;
        for (const f of flying) {
          f.m.position.addScaledVector(f.v, dt * 0.6);
          f.m.rotation.x += f.r.x * dt; f.m.rotation.y += f.r.y * dt;
          f.v.y -= dt * 0.8;
        }
        petals.userData.speed = Math.max(1, 5 - burst * 2);
      }
    },
  };
}
