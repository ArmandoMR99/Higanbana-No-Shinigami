# 彼岸花の死神 · Higanbana no Shinigami

Historia interactiva en 3D, en tres capítulos, sobre Kenji y la flor de los muertos.
Sitio estático para GitHub Pages: HTML, CSS y JavaScript con [Three.js](https://threejs.org) (incluido en `vendor/`), sin paso de compilación.

**Ver en línea:** https://armandomr99.github.io/Higanbana-No-Shinigami/

## Estado: versión final

- **3D solo en lo importante:** el lirio (portada y cierre, cuando se rearma) y la Kusarigama (forja y mini juego).
- **2D en todo lo demás**, al estilo de la infografía Kusarigama Radiata: papel carbón, pincel claro, carmesí, marcos finos y etiquetas con líneas guía. Escenas en capas con paralaje.
- El valle es un mapa pintado con incienso, fuego, criaturas y emas; las gráficas son trazos de pincel (línea de humo, latido, ensō de bestias, columnas de humo, 312 farolillos, emakimono del viaje, marca contra memoria).
- **Música compuesta con código** (Web Audio), a volumen de fondo: koto (cuerda pulsada Karplus-Strong), shakuhachi, cuerdas, bajo y taiko en escala miyako-bushi (Re). El arreglo cambia con cada pasaje (calma, tormenta, forja, pelea, nieve, redención). Botón de silencio arriba a la derecha.
- Las animaciones de los pasajes cortos se reproducen solas al llegar; las de los pasajes largos (el valle, el viaje) avanzan con el scroll. El scroll se acomoda suavemente en cada pasaje.

## Estructura

```
index.html            página única
css/style.css         estilos, paleta y tipografía
js/main.js            estados (portada → menú → lectura) y qué acompaña a cada pasaje
js/story.js           texto de los capítulos y datos (tablas A, B y C de la biblia)
js/reader.js          motor de lectura por pasajes
js/ui.js              ema de barrio y ficha de bestia
js/audio.js           música generativa y efectos
js/two/brush.js       pincel 2D: papel, trazos, aguadas, montañas, bambú, lirio, siluetas, etiquetas
js/two/stage.js       escenario 2D por capas con paralaje
js/two/valley2d.js    el valle (noche del ataque y recuento)
js/two/views.js       el resto de escenas 2D y el arte del menú
js/two/fx.js          lluvia, nieve, pétalos, hojas, brasas
js/scenes/intro.js    3D: el lirio
js/scenes/forge.js    3D: la Kusarigama y la forja
js/geo.js, js/ink.js  geometría 3D y postproceso de tinta
vendor/three/         Three.js r169 (licencia MIT)
```

## Probar en tu computador

Los módulos de JavaScript necesitan un servidor local (no funcionan abriendo el archivo directamente):

```
python -m http.server 8000
```

y abre http://localhost:8000
