// Códice del valle: la guía de la infografía.
// Reúne la estructura narrativa (esquema), el sistema iconográfico, el índice de visualizaciones
// (cada una con un enlace a su pasaje) y la bitácora del proceso.
import { ICONS, ICON_GROUPS, svgIcon } from './icons.js';

const NIGHT_STEPS = [
  ['22:00', 'reloj', 'El cielo se tiñe de morado; se enciende el incienso'],
  ['22:05', 'fuego', 'Arde Akabana, el barrio de Kenji'],
  ['22:15', 'fuego', 'Arde Takegawa; los kappas suben por el río'],
  ['22:30', 'fuego', 'Arde Hikarizaka; en Akabana, un oni mata a los padres de Kenji'],
  ['22:32', 'kusarigama', 'La marca despierta y nace el arma'],
  ['22:40', 'fuego', 'Arde Tsukimori'],
  ['22:50', 'fuego', 'Arde Kurokawa, el barrio más lejano'],
  ['23:00', 'incienso', 'El incienso se consume; Kenji se desmaya'],
];

const ACTS = [
  { act: 'Inicio', ch: 'Capítulo I', kanji: '秋分', name: 'Cuando florecen los muertos', when: 'Equinoccio de otoño · 13 a 15 años', beats: [['higanbana', 'Roza un lirio de araña en el bosque'], ['marca', 'Aparece la marca en su cuello'], ['ronin', 'Un ronin ciego anuncia el cobro'], ['dragon', 'Tres noches después, el ataque'], ['padres', 'Sus padres lo encierran en el almacén']] },
  { act: 'Nudo', ch: 'Capítulo II', kanji: '雨夜', name: 'La noche que llovió sangre', when: 'Noche de lluvia · 22:00 a 23:00', beats: [['marca', 'La marca despierta'], ['kusarigama', 'Se forja la Kusarigama'], ['oni', 'Vence a 14 de las 30 criaturas'], ['muerto', 'Al amanecer: 184 muertos'], ['ruta', 'Parte hacia los caminos de montaña']] },
  { act: 'Desenlace', ch: 'Capítulo III', kanji: '冬', name: 'Siete inviernos', when: 'Siete inviernos · 15 a 22 años', beats: [['templo', 'Kitsune, tengu, kappa y bakeneko'], ['espiritu', 'La marca es una prisión divina'], ['farolillo', 'Nace la leyenda del Shinigami'], ['barrio', 'Elige proteger a un niño'], ['kusarigama', 'La voz del arma: «así empecé yo»']] },
];
const LINKS = ['dos años después', 'siete años después'];

// índice: tipo → [título, dónde, capítulo, pasaje, paso]
const VIS = [
  { type: 'Gráficos estadísticos', icon: 'reloj', items: [
    ['Líneas', 'Pueblo alcanzado por el ataque', 'El humo del incienso dibuja la línea', 1, 'valle', 3],
    ['Líneas', 'El poder de Kenji', 'Un electrocardiograma de 22:30 a 23:00', 2, 'latido', 0],
    ['Líneas', 'La marca contra los recuerdos', 'Dos líneas que se cruzan con los años', 3, 'pesadilla', 0],
    ['Dona', 'Las bestias de la noche', 'Un ensō partido en cuatro arcos', 2, 'anillo', 0],
    ['Barras apiladas', 'Al amanecer: las 30 criaturas', 'Derrotadas por Kenji y huidas, por tipo', 2, 'amanecer', 1],
    ['Barras', 'Estructuras destruidas', 'Columnas de humo que se vuelven barras', 3, 'recuento', 0],
    ['Unidades', '312 farolillos', 'Uno por habitante: ilesos, heridos y muertos', 3, 'recuento', 1],
  ] },
  { type: 'Mapas', icon: 'japon', items: [
    ['Ubicación', 'Japón y el valle de Yomigawa', 'Recuadro de Japón, escala, norte y leyenda', 1, 'valle', 0],
    ['Estadístico', 'Mapa de calor', 'Concentración de criaturas en cada barrio', 2, 'amanecer', 0],
    ['Estadístico', 'Símbolos proporcionales', 'Porcentaje de casas perdidas por barrio', 3, 'recuento', 0],
    ['Ruta', 'El viaje en emakimono', 'Cuatro paradas en un rollo que se desenrolla', 3, 'viaje', 0],
  ] },
  { type: 'Esquemas', icon: 'ruta', items: [
    ['Relaciones', 'Quién ata a quién', 'Dioses, marca, espíritu, arma y Kenji', 3, 'pregunta', 0],
    ['Secuencia', 'La forja por piezas', 'Seis piezas, en orden, para formar el arma', 2, 'forja', 0],
    ['Estructura', 'Inicio, nudo y desenlace', 'En este códice', 0, 'estructura', 0],
  ] },
  { type: 'Imágenes explicativas', icon: 'higanbana', items: [
    ['Ser vivo', 'Ficha botánica del higanbana', 'Tépalos, estambres, umbela, tallo y escala', 1, 'flor', 0],
    ['Artefacto', 'La marca ampliada', 'Lupa sobre el cuello de Kenji', 1, 'rio', 0],
    ['Artefacto', 'La Kusarigama en 3D', 'Seis piezas con nombre y función', 2, 'forja', 1],
    ['Seres vivos', 'Anatomía de las bestias', 'Fichas con rasgos numerados (botón 鬼)', 2, 'anillo', 0],
    ['Personajes', 'El ronin y la marca vendada', 'Etiquetas con líneas guía', 1, 'ronin', 0],
  ] },
];

const PROCESS = [
  { date: '7 ago 2026', stage: 'Historia · versión 1', text: 'Primer relato de Kenji (unas 1.500 palabras): la flor, la marca, el ronin, el ataque y la Kusarigama.', img: 'assets/proceso/historia-v1.jpg' },
  { date: '18 ago 2026', stage: 'Historia · versión 2', text: 'Versión más breve y directa (unas 800 palabras) para probar el ritmo de la narración. La versión final retoma lo mejor de ambas y supera las 2.000 palabras.', img: 'assets/proceso/historia-v2.jpg' },
  { date: 'sep 2026', stage: 'Infografía «Kusarigama Radiata»', text: 'Primera imagen explicativa del arma: piezas, materiales y funciones. De aquí sale el estilo de tinta y rojo.', img: 'assets/proceso/kusarigama-radiata.jpg' },
  { date: '20 sep 2026', stage: 'Prototipo interactivo (p5.js)', text: 'Experimento con seguimiento de manos: línea de tiempo con pinza, fichas de los cinco barrios, Modo Bestias y gráficas de destrucción.', img: 'assets/proceso/programa-p5.jpg', link: ['Ver el programa en p5.js', 'https://editor.p5js.org/ArmandoMR99/full/vwsmLIG8w'] },
  { date: '14 oct 2026', stage: 'Planeación del sitio', text: 'Arquitectura de información (menú y tres pantallas) y bocetos a mano de cada pantalla.', img: 'assets/proceso/planeacion.jpg' },
  { date: '28 oct 2026', stage: 'Boceto web', text: 'Portada, menú de capítulos al estilo de un videojuego, lectura por pasajes y primeras escenas 3D.', img: 'assets/proceso/boceto.jpg' },
  { date: '8 nov 2026', stage: 'Etapa 2 · 2D y 3D', text: 'Decisión clave: el 3D solo para el lirio y la Kusarigama; el resto, ilustración 2D al estilo de la infografía. Música generada con código.', img: 'assets/proceso/etapa2.jpg' },
  { date: '9 nov 2026', stage: 'Pulido', text: 'Navegación por pasos, lirio botánico, bloom, banda sonora japonesa, pantalla de carga y calidad adaptativa.', img: 'assets/screens/03-valle.jpg' },
  { date: '11 nov 2026', stage: 'Versión final', text: 'Sistema iconográfico, esquema de relaciones, mapas con leyenda y ubicación, barras apiladas, imágenes explicativas e instrumentos grabados.', img: 'assets/proceso/final.jpg' },
];

const DECISIONS = [
  ['El 3D, solo para lo esencial', 'El lirio y la Kusarigama son los dos objetos que cambian la historia; todo lo demás se dibuja en 2D.'],
  ['Los datos viven dentro de la escena', 'El reloj es una varilla de incienso, las barras nacen del humo y cada habitante es un farolillo.'],
  ['Tinta y sangre', 'Grises de tinta sobre papel oscuro; el rojo del higanbana marca lo importante y el azul, el fuego de los onis.'],
  ['Lectura por pasos', 'Cada paso muestra un dato nuevo: la información se dosifica al ritmo del relato.'],
];

function structureHTML() {
  const acts = ACTS.map((a, i) => `
    <div class="cx-act">
      <div class="cx-act-h"><span class="cx-tag">${a.act}</span><span lang="ja">${a.kanji}</span></div>
      <div class="cx-act-n">${a.ch} · ${a.name}</div>
      <div class="cx-act-w">${a.when}</div>
      <ol>${a.beats.map(([ic, t]) => `<li>${svgIcon(ic, { size: 18, title: false })}<span>${t}</span></li>`).join('')}</ol>
    </div>${i < 2 ? `<div class="cx-link"><i></i><span>${LINKS[i]}</span></div>` : ''}`).join('');
  const night = NIGHT_STEPS.map(([h, ic, t]) => `<li>${svgIcon(ic, { size: 18, title: false })}<b>${h}</b><span>${t}</span></li>`).join('');
  return `
    <p class="cx-lead">La historia se divide en tres actos. Cada contenedor es un capítulo; las flechas indican el tiempo que pasa entre uno y otro.</p>
    <div class="cx-acts">${acts}</div>
    <h3 class="cx-h3">Cronología de la noche del ataque <small>esquema de secuencia · 22:00 a 23:00</small></h3>
    <ol class="cx-night">${night}</ol>
    <h3 class="cx-h3">Datos de la historia</h3>
    <div class="cx-data">
      <div>${svgIcon('farolillo', { size: 22 })}<b>312</b><span>habitantes en 5 barrios</span></div>
      <div>${svgIcon('muerto', { size: 22 })}<b>184</b><span>muertos</span></div>
      <div>${svgIcon('herido', { size: 22 })}<b>68</b><span>heridos</span></div>
      <div>${svgIcon('ileso', { size: 22 })}<b>60</b><span>ilesos</span></div>
      <div>${svgIcon('oni', { size: 22 })}<b>30</b><span>criaturas: 12 · 7 · 7 · 4</span></div>
      <div>${svgIcon('derrota', { size: 22 })}<b>14</b><span>derrotadas · 16 huyeron</span></div>
      <div>${svgIcon('incienso', { size: 22 })}<b>1 h</b><span>de 22:00 a 23:00</span></div>
      <div>${svgIcon('japon', { size: 22 })}<b>7</b><span>inviernos · era Taishō</span></div>
    </div>`;
}

function iconsHTML() {
  return `
    <p class="cx-lead">Un solo sistema para todo el sitio: cuadrícula de 24 × 24, trazo de 1,6 y puntas redondas. La forma va en color hueso; el acento, en rojo higanbana (en azul solo el fuego de los onis). Los mismos íconos aparecen en mapas, fichas, gráficas y esquemas.</p>
    ${ICON_GROUPS.map((g) => `<h3 class="cx-h3">${g.name}</h3><div class="cx-icons">${g.items.map((id) => `<div>${svgIcon(id, { size: 34 })}<b>${ICONS[id].name}</b><span>${ICONS[id].note}</span></div>`).join('')}</div>`).join('')}`;
}

function visHTML() {
  return `
    <p class="cx-lead">Las cinco herramientas de la infografía y dónde aparece cada una. Toca «ver» para ir directo al pasaje.</p>
    ${VIS.map((g) => `<h3 class="cx-h3">${svgIcon(g.icon, { size: 20, title: false })} ${g.type}</h3>
      <div class="cx-vis">${g.items.map(([kind, title, desc, ch, key, step]) => `
        <div class="cx-vis-i"><span class="cx-kind">${kind}</span><b>${title}</b><span>${desc}</span>
        ${ch ? `<button data-ch="${ch}" data-key="${key}" data-step="${step}">Cap. ${['', 'I', 'II', 'III'][ch]} · ver →</button>` : '<button data-tab="estructura">ver →</button>'}</div>`).join('')}</div>`).join('')}`;
}

function processHTML() {
  return `
    <p class="cx-lead">Bitácora del proyecto: de la primera versión de la historia al sitio publicado. Las fechas vienen de los documentos y del historial de versiones en GitHub.</p>
    <ol class="cx-proc">${PROCESS.map((p) => `
      <li><div class="cx-date">${p.date}</div><div class="cx-proc-b"><b>${p.stage}</b><span>${p.text}</span>${p.link ? `<a href="${p.link[1]}" target="_blank" rel="noopener">${p.link[0]} ↗</a>` : ''}</div>
      <a class="cx-shot" href="${p.img}" target="_blank" rel="noopener" title="Ver en grande"><img src="${p.img}" alt="${p.stage}" loading="lazy"></a></li>`).join('')}</ol>
    <h3 class="cx-h3">Decisiones de diseño</h3>
    <div class="cx-dec">${DECISIONS.map(([t, d]) => `<div><b>${t}</b><span>${d}</span></div>`).join('')}</div>
    <p class="cx-foot">Código abierto: <a href="https://github.com/ArmandoMR99/Higanbana-No-Shinigami" target="_blank" rel="noopener">github.com/ArmandoMR99/Higanbana-No-Shinigami ↗</a></p>`;
}

const TABS = [['estructura', 'Estructura', structureHTML], ['iconos', 'Íconos', iconsHTML], ['visualizaciones', 'Visualizaciones', visHTML], ['proceso', 'Proceso', processHTML]];

export function buildCodex(el, { onGo, onClose, sfx }) {
  el.innerHTML = `
    <div class="cx-inner">
      <button class="about-close" aria-label="Cerrar">×</button>
      <div class="about-jp" lang="ja">黄泉川の書</div>
      <h2>Códice del valle</h2>
      <nav class="cx-tabs" role="tablist">${TABS.map(([id, name], i) => `<button role="tab" data-tab="${id}" class="${i ? '' : 'on'}">${name}</button>`).join('')}</nav>
      ${TABS.map(([id, , fn], i) => `<section class="cx-pane${i ? '' : ' on'}" data-pane="${id}">${fn()}</section>`).join('')}
    </div>`;
  const inner = el.querySelector('.cx-inner');
  const show = (id) => { el.querySelectorAll('.cx-tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === id)); el.querySelectorAll('.cx-pane').forEach((p) => p.classList.toggle('on', p.dataset.pane === id)); inner.scrollTop = 0; sfx && sfx(); };
  el.addEventListener('click', (e) => {
    if (e.target === el || e.target.closest('.about-close')) return onClose();
    const t = e.target.closest('[data-tab]'); if (t) return show(t.dataset.tab);
    const g = e.target.closest('[data-ch]'); if (g) onGo(+g.dataset.ch, g.dataset.key, +g.dataset.step);
  });
  return { show };
}
