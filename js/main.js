import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { InkShader } from './ink.js';
import { CHAPTERS } from './story.js';
import { Reader } from './reader.js';
import { hideCard, cardOpen, showBestia } from './ui.js';
import { makeValley } from './valley.js';
import { clamp, smooth, lerp } from './geo.js';
import { buildIntro } from './scenes/intro.js';
import { buildCh1 } from './scenes/ch1.js';
import { buildCh2 } from './scenes/ch2.js';
import { buildCh3 } from './scenes/ch3.js';

const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
renderer.setSize(innerWidth, innerHeight);
renderer.setClearColor('#0c0a0a');

const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.05, 260);
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(new THREE.Scene(), camera);
const outputPass = new OutputPass();
const ink = new ShaderPass(InkShader);
composer.addPass(renderPass); composer.addPass(outputPass); composer.addPass(ink);
const labels = new CSS2DRenderer({ element: document.getElementById('labels') });
labels.setSize(innerWidth, innerHeight);

const body = document.body;
const reader = new Reader(document.getElementById('reader'), { onEnd: (go) => (go === 'menu' ? toMenu() : openChapter(+go)) });

// ---------- Escenas ----------
const app = { THREE, camera, renderer, reader, valley: null, mouse: new THREE.Vector2(), labelsEl: document.getElementById('labels') };
app.valley = makeValley({ onBarrio: (b) => import('./ui.js').then((u) => u.showEma(b)) });
const intro = buildIntro(app);
const chapters = [buildCh1(app), buildCh2(app), buildCh3(app)];
let active = intro;           // escena que se renderiza
let mode = 'intro';           // intro | menu | reader
let chapter = null;           // índice de capítulo abierto
let hover = 0;                // panel del menú iluminado
const cam = { pos: new THREE.Vector3(0, 1.6, 6), look: new THREE.Vector3(0, 1.6, 0), shift: 0, shiftTarget: 0 };
let fly = null;               // vuelo de cámara entre menú y capítulo
let fadeT = 0;

function setActive(sc) {
  if (active === sc) return;
  if (active && active.exit) active.exit();
  active = sc;
  app.labelsEl.innerHTML = '';
  if (sc.enter) sc.enter();
  renderPass.scene = sc.scene;
}
renderPass.scene = intro.scene;

// ---------- Menú ----------
const menu = document.getElementById('menu');
menu.innerHTML = CHAPTERS.map((c, i) => `
  <button class="panel${i === 0 ? ' on' : ''}" data-i="${i}" aria-label="Capítulo ${c.roman}: ${c.name}">
    <span class="kanji" lang="ja">${c.kanji}</span>
    <span class="num">${c.roman}</span>
    <span class="sub">${c.roman} · ${c.sub}</span>
    <span class="name">${c.name}</span>
  </button>`).join('') + '<div class="menu-foot"><span><b>●</b>Clic · Entrar</span><span><b>esc</b>Volver</span></div>';
const panels = [...menu.querySelectorAll('.panel')];
panels.forEach((p, i) => {
  p.addEventListener('mouseenter', () => selectPanel(i));
  p.addEventListener('focus', () => selectPanel(i));
  p.addEventListener('click', () => openChapter(i + 1));
});
function selectPanel(i) {
  hover = i;
  panels.forEach((p, k) => p.classList.toggle('on', k === i));
  if (mode === 'menu') { setActive(chapters[i]); const f = chapters[i].frames.menu; cam.pos.set(...f.pos); cam.look.set(...f.look); }
}
function panelShift(i) {
  const r = panels[i].getBoundingClientRect();
  return (r.left + r.width / 2) - innerWidth / 2;
}

function toMenu() {
  hideCard();
  mode = 'menu';
  body.className = 'state-menu';
  fly = null;
  selectPanel(hover);
}

function enterSite() {
  if (mode !== 'intro') return;
  body.classList.add('leaving-intro');
  intro.burst();
  setTimeout(() => { body.classList.remove('leaving-intro'); toMenu(); }, 1500);
}
document.getElementById('intro').addEventListener('click', enterSite);

function openChapter(n) {
  const i = n - 1;
  hideCard();
  hover = i;
  panels.forEach((p, k) => p.classList.toggle('on', k === i));
  const sc = chapters[i];
  const go = () => {
    setActive(sc);
    chapter = i;
    reader.load(CHAPTERS[i], CHAPTERS);
    mode = 'reader';
    body.className = `state-reader ch-${n}`;
    const from = { pos: cam.pos.clone(), look: cam.look.clone() };
    fly = { from, t: 0 };
    if (sc.start) sc.start();
  };
  if (mode === 'menu') { body.classList.add('opening'); setTimeout(go, 850); }
  else { fadeT = 1; go(); }
}

// ---------- Entrada ----------
addEventListener('pointermove', (e) => {
  app.mouse.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
  const t = e.target;
  const hot = t.closest && (t.closest('button,.btn,.panel') || (mode === 'reader' && active.pick && active.pick(app.mouse, true)));
  cursor.classList.toggle('hot', !!hot);
});
const cursor = document.getElementById('cursor');
addEventListener('click', (e) => {
  if (mode !== 'reader' || !active.pick) return;
  if (e.target.closest('button,.btn,.scroll p,#card')) return;
  active.pick(app.mouse, false);
});
addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { if (cardOpen()) hideCard(); else if (mode === 'reader') toMenu(); return; }
  if (mode === 'intro' && (e.key === 'Enter' || e.key === ' ')) { enterSite(); e.preventDefault(); return; }
  if (mode === 'menu') {
    if (e.key === 'ArrowRight') selectPanel((hover + 1) % 3);
    if (e.key === 'ArrowLeft') selectPanel((hover + 2) % 3);
    if (e.key === 'Enter') openChapter(hover + 1);
    return;
  }
  if (mode === 'reader') {
    if (['ArrowDown', 'PageDown', ' '].includes(e.key)) { reader.next(); e.preventDefault(); }
    if (['ArrowUp', 'PageUp'].includes(e.key)) { reader.prev(); e.preventDefault(); }
  }
});
document.getElementById('btn-esc').addEventListener('click', toMenu);
document.getElementById('btn-bestias').addEventListener('click', () => showBestia('dragon', (id) => chapters[1].highlight && chapters[1].highlight(id)));

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight); labels.setSize(innerWidth, innerHeight);
  ink.uniforms.resolution.value.set(innerWidth * renderer.getPixelRatio(), innerHeight * renderer.getPixelRatio());
});
ink.uniforms.resolution.value.set(innerWidth * renderer.getPixelRatio(), innerHeight * renderer.getPixelRatio());

// ---------- Cámara a partir de los encuadres de cada pasaje ----------
const tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3();
function frameAt(sc, key, tIn) {
  const f = sc.frames[key] || sc.frames.menu;
  const p = new THREE.Vector3(...f.pos), l = new THREE.Vector3(...f.look);
  if (f.to && tIn > 0) { const e = smooth(clamp(tIn)); p.lerp(tmpA.set(...f.to.pos), e); l.lerp(tmpB.set(...f.to.look), e); }
  return { p, l, f };
}
function readerCamera() {
  const S = reader.sections; if (!S.length) return { fade: 0 };
  const i = reader.i, t = reader.t, A = S[i], B = S[i + 1] || A;
  const L = A.len || 1;
  const tIn = L > 1 ? clamp(t * L / (L - 1)) : 0;        // avance dentro del pasaje largo
  const k = L > 1 ? clamp(t * L - (L - 1)) : t;          // transición hacia el siguiente
  const a = frameAt(active, A.key, A.len > 1 ? tIn : 0);
  const b = frameAt(active, B.key, 0);
  let fade = 0;
  if (b.f.cut && B !== A) {
    const e = clamp(k);
    if (e < 0.5) { cam.pos.copy(a.p); cam.look.copy(a.l); } else { cam.pos.copy(b.p); cam.look.copy(b.l); }
    fade = 1 - Math.abs(e - 0.5) * 2; fade = smooth(clamp(fade * 1.6));
  } else {
    const e = smooth(clamp(k));
    cam.pos.lerpVectors(a.p, b.p, e); cam.look.lerpVectors(a.l, b.l, e);
  }
  const dimA = A.cine ? 1 - Math.pow(Math.abs(t - 0.5) * 2, 6) * 0 : 0, dimB = B.cine ? 1 : 0;
  const dim = lerp(dimA, dimB, smooth(clamp(k)));
  return { fade: Math.max(fade, dim * 0.72) };
}

// ---------- Bucle ----------
const clock = new THREE.Clock();
function loop() {
  const dt = Math.min(clock.getDelta(), 0.05), time = clock.elapsedTime;
  let fade = 0;
  if (mode === 'intro') {
    const f = intro.frames.menu; cam.pos.set(...f.pos); cam.look.set(...f.look);
    cam.shiftTarget = 0;
  } else if (mode === 'menu') {
    cam.shiftTarget = panelShift(hover);
  } else if (mode === 'reader') {
    const r = readerCamera();
    fade = r.fade;
    cam.shiftTarget = innerWidth > 760 ? Math.min(innerWidth * 0.17, 260) : 0;
    if (fly) {
      fly.t += dt / 1.6;
      const e = smooth(clamp(fly.t));
      cam.pos.lerpVectors(fly.from.pos, cam.pos, e); cam.look.lerpVectors(fly.from.look, cam.look, e);
      if (fly.t >= 1) fly = null;
    }
    const S = reader.sections[reader.i];
    if (S && active.update) active.update({ key: S.key, t: reader.t, i: reader.i, sec: S, sections: reader.sections, time, dt });
  }
  if (active.tick) active.tick(dt, time, mode);
  fadeT = Math.max(0, fadeT - dt * 1.5);

  // paralaje suave con el ratón
  cam.shift = lerp(cam.shift, cam.shiftTarget, 1 - Math.pow(0.002, dt));
  camera.position.copy(cam.pos);
  camera.lookAt(cam.look);
  const par = active.parallax ?? 0.25;
  camera.translateX(app.mouse.x * par); camera.translateY(app.mouse.y * par * 0.6);
  camera.lookAt(cam.look);
  camera.setViewOffset(innerWidth, innerHeight, -cam.shift, 0, innerWidth, innerHeight);
  if (active.fov && camera.fov !== active.fov) { camera.fov = active.fov; }
  camera.updateProjectionMatrix();

  ink.uniforms.time.value = time;
  ink.uniforms.fade.value = Math.max(fade, fadeT);
  composer.render();
  labels.render(active.scene, camera);
  requestAnimationFrame(loop);
}

body.className = 'state-intro';
loop();
window.__app = { app, toMenu, openChapter, reader, enterSite, get mode() { return mode; } };
