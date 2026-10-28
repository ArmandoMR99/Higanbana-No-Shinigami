// Postproceso "tinta": todo pasa a gris con bordes de pincel y grano de papel.
// Solo el rojo (higanbana, sangre, arma) y el azul de los onis conservan su color.
import * as THREE from 'three';

export const InkShader = {
  uniforms: {
    tDiffuse: { value: null },
    resolution: { value: new THREE.Vector2(1, 1) },
    time: { value: 0 },
    edge: { value: 0.9 },      // fuerza del trazo de tinta
    grain: { value: 0.055 },   // grano de papel
    vignette: { value: 0.55 },
    fade: { value: 0 },        // fundido a negro (cortes entre escenas)
    paper: { value: 0.0 },     // 0 = noche de tinta, 1 = papel claro
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform vec2 resolution;
    uniform float time, edge, grain, vignette, fade, paper;
    varying vec2 vUv;

    float lum(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      float a = hash(i), b = hash(i + vec2(1, 0)), c = hash(i + vec2(0, 1)), d = hash(i + vec2(1, 1));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
    }

    void main() {
      vec2 px = 1.0 / resolution;
      // pequeño temblor de pincel en la lectura de bordes
      vec2 wob = (vec2(noise(vUv * 180.0), noise(vUv * 180.0 + 7.3)) - 0.5) * px * 1.6;
      vec3 c = texture2D(tDiffuse, vUv).rgb;

      // Sobel sobre luminancia
      float tl = lum(texture2D(tDiffuse, vUv + wob + px * vec2(-1, 1)).rgb);
      float t  = lum(texture2D(tDiffuse, vUv + wob + px * vec2( 0, 1)).rgb);
      float tr = lum(texture2D(tDiffuse, vUv + wob + px * vec2( 1, 1)).rgb);
      float l  = lum(texture2D(tDiffuse, vUv + wob + px * vec2(-1, 0)).rgb);
      float r  = lum(texture2D(tDiffuse, vUv + wob + px * vec2( 1, 0)).rgb);
      float bl = lum(texture2D(tDiffuse, vUv + wob + px * vec2(-1,-1)).rgb);
      float b  = lum(texture2D(tDiffuse, vUv + wob + px * vec2( 0,-1)).rgb);
      float br = lum(texture2D(tDiffuse, vUv + wob + px * vec2( 1,-1)).rgb);
      float gx = -tl - 2.0 * l - bl + tr + 2.0 * r + br;
      float gy = -tl - 2.0 * t - tr + bl + 2.0 * b + br;
      float e = smoothstep(0.05, 0.32, sqrt(gx * gx + gy * gy));

      float L = lum(c);
      // máscara de color: solo rojo y azul sobreviven
      float red = smoothstep(0.05, 0.22, c.r - max(c.g, c.b));
      float blue = smoothstep(0.06, 0.22, c.b - max(c.r, c.g));
      float keep = max(red, blue);

      vec3 gray = vec3(L) * vec3(1.0, 0.975, 0.94);        // gris cálido de papel
      vec3 col = mix(gray, c * 1.08, keep);

      // tinta: en noche oscurece; en papel dibuja líneas negras
      float inkLine = e * edge * (1.0 - keep * 0.7);
      col = mix(col, col * 0.25, inkLine * (1.0 - paper));
      col = mix(col, vec3(0.06), inkLine * paper);
      // un leve halo claro en bordes sobre fondos negros: da sensación de trazo seco
      col += vec3(0.035) * e * (1.0 - L) * (1.0 - paper);

      // grano de papel + fibras
      float g = noise(vUv * resolution * 0.55 + time * 13.0) - 0.5;
      float fib = noise(vec2(vUv.x * 900.0, vUv.y * 40.0)) - 0.5;
      col += (g * grain + fib * grain * 0.35) * (0.6 + 0.4 * (1.0 - L));

      // viñeta
      vec2 q = vUv - 0.5;
      col *= 1.0 - dot(q, q) * vignette * 1.6;

      col = mix(col, vec3(0.0), fade);
      gl_FragColor = vec4(max(col, 0.0), 1.0);
    }
  `,
};
