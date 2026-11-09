import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { InkShader } from './ink.js';
import { CHAPTERS } from './story.js';
import { Reader } from './reader.js';
import { hideCard, cardOpen, showBestia, showEma } from './ui.js';
import { clamp, smooth, lerp } from './geo.js';
import { buildIntro } from './scenes/intro.js';
import { buildForge } from './scenes/forge.js';
import { Stage } from './two/stage.js';
import { FX } from './two/fx.js';
import { defineValley } from './two/valley2d.js';
import { defineViews, paintPanel } from './two/views.js';
import { canvas } from './two/brush.js';
import { Music } from './audio.js';

// ---------- Qué acompaña a cada pasaje ----------
// v: escena 2D · s: escena 3D (lily | forge) · fx: partículas · mood: música
const SPEC = {
  1: {
    bosque: { v: 'bosque', fx: { leaves: 1 }, mood: 'calm' }, bosque2: { v: 'bosque', fx: { leaves: 0.6 }, mood: 'calm' },
    flor: { v: 'flor', fx: { petals: 0.25 }, mood: 'calm' }, rio: { v: 'rio', mood: 'calm' },
    ronin: { v: 'ronin', fx: { leaves: 0.4 }, mood: 'calm' }, ronin2: { v: 'ronin', mood: 'dark' },
    valle: { v: 'valle', fx: { rain: 1, embers: 0.6 }, mood: 'storm' }, almacen: { v: 'almacen', fx: { rain: 0.35 }, mood: 'dark' },
  },
  2: {
    despertar: { v: 'despertar', fx: { embers: 0.4 }, mood: 'dark' }, despertar2: { s: 'forge', mood: 'forge' },
    forja: { s: 'forge', mood: 'forge' }, arma: { s: 'forge', mood: 'forge' }, arma2: { s: 'forge', mood: 'fight' },
    latido: { v: 'latido', fx: { rain: 0.8 }, mood: 'fight' }, anillo: { v: 'enso', fx: { rain: 0.5 }, mood: 'fight' },
    amanecer: { v: 'valle', fx: { rain: 0.6, embers: 0.4 }, mood: 'dawn' }, ruinas: { v: 'ruinas', fx: { ash: 1 }, mood: 'dawn' },
    partida: { v: 'ruinas', fx: { ash: 0.8 }, mood: 'dawn' }, partida2: { v: 'ruinas', fx: { ash: 0.6 }, mood: 'dark' }, camino: { v: 'camino', fx: { ash: 0.5 }, mood: 'calm' },
  },
  3: {
    recuento: { v: 'recuento', fx: { ash: 0.6 }, mood: 'dawn' }, viaje: { v: 'emaki', mood: 'calm' },
    pesadilla: { v: 'invierno', fx: { snow: 1 }, mood: 'snow' }, pregunta: { v: 'invierno', fx: { snow: 1 }, mood: 'snow' }, leyenda: { v: 'invierno', fx: { snow: 1 }, mood: 'snow' },
    invierno: { v: 'invierno', fx: { snow: 0.7, embers: 0.5 }, mood: 'fire' }, invierno2: { v: 'invierno', fx: { snow: 0.5, embers: 0.5 }, mood: 'fire' },
    eleccion: { v: 'invierno', fx: { snow: 0.8 }, mood: 'snow' }, eleccion2: { v: 'invierno', fx: { snow: 0.6 }, mood: 'redemption' },
    final: { s: 'lily', fx: { petals: 1 }, mood: 'redemption' },
  },
};

// ---------- 3D ----------
const glCanvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
renderer.setSize(innerWidth, innerHeight);
const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.05, 200);
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(new THREE.Scene(), camera);
const ink = new ShaderPass(InkShader);
ink.uniforms.edge.value = 0.7;
composer.addPass(renderPass); composer.addPass(new OutputPass()); composer.addPass(ink);
const labels = new CSS2DRenderer({ element: document.getElementById('labels') });
labels.setSize(innerWidth, innerHeight);

const body = document.body;
const music = new Music();
const app = { camera, mouse: new THREE.Vector2() };
const lily = buildIntro(app);
const forge = buildForge(app, { onPiece: (k) => music.sfx(k) });
const scenes3d = { lily, forge };

// ---------- 2D ----------
const stage = new Stage(document.getElementById('stage'));
const fx = new FX(document.getElementById('fx'));
defineValley(stage, { onBarrio: (b) => { showEma(b); music.sfx('open'); } });
defineViews(stage, { onBestia: (id, cb) => { showBestia(id, cb); music.sfx('open'); } });

const reader = new Reader(document.getElementById('reader'), { onEnd: (go) => (go === 'menu' ? toMenu() : openChapter(+go)) });

let mode = 'intro', chapter = 0, hover = 0;
const cam = { pos: new THREE.Vector3(...lily.frames.menu.pos), look: new THREE.Vector3(...lily.frames.menu.look), shift: 0 };
let active3d = lily;
let fly = null;
const arrive = { i: -1, ch: 0, time: 0 };

function set3d(sc) {
  if (active3d === sc) return;
  active3d = sc; renderPass.scene = sc.scene; document.getElementById('labels').innerHTML = '';
}
renderPass.scene = lily.scene;

// ---------- Menú ----------
const menu = document.getElementById('menu');
menu.innerHTML = CHAPTERS.map((c, i) => `
  <button class="panel${i === 0 ? ' on' : ''}" data-i="${i}" aria-label="Capítulo ${c.roman}: ${c.name}">
    <span class="art"></span>
    <span class="kanji" lang="ja">${c.kanji}</span>
    <span class="num">${c.roman}</span>
    <span class="sub">${c.roman} · ${c.sub}</span>
    <span class="name">${c.name}</span>
  </button>`).join('') + '<div class="menu-foot"><span><b>●</b>Clic · Entrar</span><span><b>esc</b>Volver</span></div>';
const panels = [...menu.querySelectorAll('.panel')];
function paintPanels() {
  panels.forEach((p, i) => { const box = p.querySelector('.art'); box.innerHTML = ''; const r = p.getBoundingClientRect(); if (r.width < 10) return; const cv = canvas(r.width, r.height); paintPanel(i, cv); box.appendChild(cv); });
}
panels.forEach((p, i) => {
  p.addEventListener('mouseenter', () => selectPanel(i));
  p.addEventListener('focus', () => selectPanel(i));
  p.addEventListener('click', () => openChapter(i + 1));
});
function selectPanel(i) { if (hover !== i) music.sfx('open'); hover = i; panels.forEach((p, k) => p.classList.toggle('on', k === i)); }

function toMenu() {
  hideCard();
  mode = 'menu';
  body.className = 'state-menu';
  set3d(lily); lily.reset();
  document.getElementById('forge-list').classList.remove('on');
  const f = lily.frames.menu; cam.pos.set(...f.pos); cam.look.set(...f.look);
  music.setMood('menu');
  requestAnimationFrame(paintPanels);
}

function enterSite() {
  if (mode !== 'intro') return;
  music.start(); music.sfx('enter'); soundBtn.classList.remove('off'); soundBtn.title = 'Silenciar';
  body.classList.add('leaving-intro');
  lily.burst();
  setTimeout(() => { body.classList.remove('leaving-intro'); toMenu(); }, 1500);
}
document.getElementById('intro').addEventListener('click', enterSite);

function openChapter(n) {
  hideCard();
  const i = n - 1; hover = i;
  panels.forEach((p, k) => p.classList.toggle('on', k === i));
  const go = () => {
    chapter = n;
    reader.load(CHAPTERS[i], CHAPTERS);
    if (n === 2) forge.setPlaced(0);
    mode = 'reader';
    body.className = `state-reader ch-${n}`;
    fly = { t: 0 };
  };
  if (mode === 'menu') { body.classList.add('opening'); setTimeout(go, 850); } else go();
}

// ---------- Entrada ----------
const cursor = document.getElementById('cursor');
addEventListener('pointermove', (e) => {
  app.mouse.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
  const hot = e.target.closest && (e.target.closest('button,.panel') || (mode === 'reader' && glCanvas.style.opacity > 0.5 && active3d.pick && active3d.pick(app.mouse, true)));
  cursor.classList.toggle('hot', !!hot);
});
addEventListener('click', (e) => {
  if (mode !== 'reader' || !active3d.pick || glCanvas.style.opacity < 0.5) return;
  if (e.target.closest('button,.scroll p,#card')) return;
  active3d.pick(app.mouse, false);
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
document.getElementById('btn-bestias').addEventListener('click', () => showBestia('dragon'));
const soundBtn = document.getElementById('btn-sound');
soundBtn.addEventListener('click', (e) => { e.stopPropagation(); const on = music.toggle(); soundBtn.classList.toggle('off', !on); soundBtn.title = on ? 'Silenciar' : 'Activar sonido'; });

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight); labels.setSize(innerWidth, innerHeight);
  ink.uniforms.resolution.value.set(innerWidth * renderer.getPixelRatio(), innerHeight * renderer.getPixelRatio());
  if (mode === 'menu') paintPanels();
});
ink.uniforms.resolution.value.set(innerWidth * renderer.getPixelRatio(), innerHeight * renderer.getPixelRatio());

// ---------- Estado de cada escena según el pasaje ----------
function viewParams(ch, key, t, L) {
  const tIn = L > 1 ? clamp(t * L / (L - 1)) : t;
  const P = { t };
  if (key === 'valle') P.valley = { m: clamp(t * L / (L - 0.6)) * 20 };
  else if (key === 'almacen' || key === 'despertar') P.valley = { m: 20 };
  if (key === 'amanecer') {
    const k = clamp(t * L / (L - 0.5)), m = 20 + clamp(k / 0.75) * 40;
    P.valley = { m, dawn: clamp((k - 0.8) / 0.2), heat: clamp((m - 35) / 25), trail: clamp((m - 32) / 26) };
  }
  if (key === 'recuento') P.recuento = { cols: clamp(tIn * 1.9), lan: clamp((tIn - 0.6) * 2.6) };
  return P;
}

const camFrame = (sc, key) => { const f = sc.frames[key] || sc.frames.menu; return { p: new THREE.Vector3(...f.pos), l: new THREE.Vector3(...f.look) }; };

// ---------- Bucle ----------
const clock = new THREE.Clock();
const fade = document.getElementById('fade');
function loop() {
  const dt = Math.min(clock.getDelta(), 0.05), time = clock.elapsedTime;
  let w3 = 1, fxT = {}, dim = 0;
  const weights = {};

  if (mode === 'intro' || mode === 'menu') {
    set3d(lily);
    w3 = 1;
    if (mode === 'menu') fxT = { petals: 0.15 };
  } else {
    const S = reader.sections, i = reader.i, t = reader.t;
    if (arrive.i !== i || arrive.ch !== chapter) { arrive.i = i; arrive.ch = chapter; arrive.time = time; }
    const tp = clamp((time - arrive.time - 0.35) / 4.2); // animación que se reproduce sola al llegar al pasaje
    const A = S[i], B = S[i + 1] || A, L = A.len || 1;
    const k = L > 1 ? clamp(t * L - (L - 1)) : t;
    const e = smooth(clamp(k));
    const sa = SPEC[chapter][A.key] || {}, sb = SPEC[chapter][B.key] || sa;
    const same = (sa.v && sa.v === sb.v) || (sa.s && sa.s === sb.s);
    // transición: la escena que sale se funde a tinta y luego entra la siguiente (sin mezclar dos gráficas)
    const wa = same ? 1 : 1 - smooth(clamp((k - 0.18) / 0.36)), wb = same ? 0 : smooth(clamp((k - 0.46) / 0.36));
    const scales = {};
    const views = {};
    if (sa.v) { weights[sa.v] = (weights[sa.v] || 0) + wa; views[sa.v] = { key: A.key, tp, ...viewParams(chapter, A.key, t, L) }; }
    if (sb.v && wb > 0) { weights[sb.v] = (weights[sb.v] || 0) + wb; if (!views[sb.v]) views[sb.v] = { key: B.key, tp: 0, ...viewParams(chapter, B.key, 0, B.len || 1) }; }
    if (!same) { if (sa.v) scales[sa.v] = 1 + 0.025 * (1 - wa); if (sb.v) scales[sb.v] = 1.04 - 0.04 * wb; }
    w3 = (sa.s ? wa : 0) + (sb.s ? wb : 0);
    // 3D: escena y encuadre
    const s3 = sa.s || sb.s;
    if (s3) {
      const sc = scenes3d[s3]; set3d(sc);
      const fa = camFrame(sc, sa.s ? A.key : B.key), fb = camFrame(sc, sb.s ? B.key : A.key);
      const ce = sa.s && sb.s ? e : 0;
      cam.pos.lerpVectors(fa.p, fb.p, ce); cam.look.lerpVectors(fa.l, fb.l, ce);
      if (sc.update) sc.update({ key: sa.s ? A.key : B.key, t: sa.s ? Math.max(t, tp) : 0 });
    }
    for (const kk of ['rain', 'snow', 'petals', 'leaves', 'embers', 'ash']) fxT[kk] = (sa.fx?.[kk] || 0) * wa + (sb.fx?.[kk] || 0) * wb;
    dim = lerp(A.cine ? 1 : 0, B.cine ? 1 : 0, e) * 0.62;
    music.setMood(e < 0.5 ? sa.mood : sb.mood);
    stage.frame(weights, { key: A.key, t, time, dt, ch: chapter, views }, scales);
    if (fly) { fly.t += dt / 1.2; if (fly.t >= 1) fly = null; }
  }
  if (mode !== 'reader') stage.frame({}, { time, dt });
  fx.frame(fxT, dt, time);
  fade.style.opacity = Math.max(dim, fly ? 1 - smooth(clamp(fly.t)) : 0);
  music.tick();

  // 3D solo cuando se ve
  glCanvas.style.opacity = w3.toFixed(3);
  if (w3 > 0.003) {
    if (active3d.tick) active3d.tick(dt, time, mode);
    const shift = mode === 'reader' && innerWidth > 760 ? Math.min(innerWidth * 0.17, 260) : 0;
    cam.shift = lerp(cam.shift, shift, 1 - Math.pow(0.002, dt));
    camera.position.copy(cam.pos); camera.lookAt(cam.look);
    const par = active3d.parallax ?? 0.2;
    camera.translateX(app.mouse.x * par); camera.translateY(app.mouse.y * par * 0.6); camera.lookAt(cam.look);
    camera.setViewOffset(innerWidth, innerHeight, -cam.shift, 0, innerWidth, innerHeight);
    camera.updateProjectionMatrix();
    ink.uniforms.time.value = time;
    composer.render();
    labels.render(active3d.scene, camera);
  }
  requestAnimationFrame(loop);
}

// fuentes antes de pintar los lienzos (si no, el texto de las gráficas queda con letra de reemplazo)
const ALL_VIEWS = ['bosque', 'flor', 'rio', 'ronin', 'valle', 'almacen', 'despertar', 'latido', 'enso', 'ruinas', 'camino', 'recuento', 'emaki', 'invierno'];
Promise.race([
  Promise.all(['700 20px "Shippori Mincho B1"', '16px "Zen Old Mincho"', '12px "IBM Plex Sans"'].map((f) => document.fonts.load(f))),
  new Promise((r) => setTimeout(r, 3500)),
]).then(() => { stage.relayout(); stage.warm(ALL_VIEWS); if (mode === 'menu') paintPanels(); setTimeout(() => (fontsSettled = true), 1500); });
let fontsSettled = false;
document.fonts.addEventListener && document.fonts.addEventListener('loadingdone', () => { if (fontsSettled) return; stage.relayout(); if (mode === 'menu') paintPanels(); });

body.className = 'state-intro';
loop();
window.__app = { toMenu, openChapter, reader, enterSite, stage, get mode() { return mode; } };
