# 彼岸花の死神 · Higanbana no Shinigami

Historia interactiva en 3D, en tres capítulos, sobre Kenji y la flor de los muertos.
Sitio estático para GitHub Pages: HTML, CSS y JavaScript con [Three.js](https://threejs.org) (incluido en `vendor/`), sin paso de compilación.

**Ver en línea:** https://armandomr99.github.io/higanbana-no-shinigami/

## Estado: boceto (etapa 1)

Todo el recorrido funciona de punta a punta con escenas sencillas; el pulido viene después.

- Portada: un higanbana 3D que reacciona al cursor; al hacer clic los trazos de tinta forman el menú.
- Menú de capítulos al estilo pergamino vertical (I 秋分 · II 雨夜 · III 冬).
- Lectura por pasajes con scroll (o flechas ↑ ↓), Esc para volver, frases a pantalla completa e indicador de progreso por capítulo.
- Regla visual: todo en tinta y gris, solo el rojo del higanbana (y el azul de los onis) tiene color. Lo hace el shader de `js/ink.js`.

## Estructura

```
index.html            página única
css/style.css         estilos, paleta y tipografía
js/main.js            render, cámara, estados (portada → menú → lectura)
js/ink.js             postproceso de tinta
js/story.js           texto de los capítulos y datos (tablas A, B y C de la biblia)
js/reader.js          motor de lectura por pasajes
js/ui.js              ema de barrio y ficha de bestia
js/geo.js             geometría hecha con código (lirio, arma, figuras, partículas)
js/valley.js          el valle de Yomigawa (mapa, incienso, criaturas, columnas, farolillos)
js/scenes/            escenas de la portada y de cada capítulo
vendor/three/         Three.js r169 (licencia MIT)
```

## Probar en tu computador

Los módulos de JavaScript necesitan un servidor local (no funcionan abriendo el archivo directamente):

```
python -m http.server 8000
```

y abre http://localhost:8000
