// Escenario 2D: cada escena es un conjunto de capas pintadas (con paralaje) + una capa dinámica.
import { canvas } from './brush.js';

const PAD = 70; // margen extra de las capas para el paralaje

export class Stage {
  constructor(el) {
    this.el = el; this.views = {}; this.defs = {}; this.mouse = { x: 0, y: 0 }; this.sm = { x: 0, y: 0 };
    addEventListener('resize', () => { clearTimeout(this._rt); this._rt = setTimeout(() => this.relayout(), 150); });
    addEventListener('pointermove', (e) => { this.mouse.x = e.clientX / innerWidth * 2 - 1; this.mouse.y = e.clientY / innerHeight * 2 - 1; });
  }
  define(name, def) { this.defs[name] = def; }

  layout() {
    const w = innerWidth, h = innerHeight, mobile = w <= 760;
    const textW = mobile ? 0 : Math.min(w * 0.36, 520);
    const ax = textW + (mobile ? 12 : 30), aw = w - ax - (mobile ? 12 : 64);
    const ah = mobile ? h * 0.56 : h;
    const s = Math.min(aw / 1000, ah / 720);
    const ox = ax + (aw - 1000 * s) / 2, oy = (ah - 720 * s) / 2;
    return { w, h, ax, aw, ah, s, ox, oy, mobile, textW, X: (x) => ox + x * s, Y: (y) => oy + y * s };
  }

  get(name) {
    if (this.views[name]) return this.views[name];
    const def = this.defs[name]; if (!def) return null;
    const el = document.createElement('div'); el.className = 'view'; el.dataset.view = name;
    this.el.appendChild(el);
    const v = { name, def, el, layers: [], dyn: null, html: null, state: {}, painted: false };
    this.views[name] = v;
    return v;
  }

  paint(v) {
    const L = this.layout();
    v.L = L;
    v.el.querySelectorAll('canvas').forEach((c) => c.remove());
    v.layers = (v.def.layers || []).map((ly, i) => {
      const c = canvas(L.w + PAD * 2, L.h + PAD * 2, Math.min(devicePixelRatio || 1, 1.5));
      c.className = 'layer'; c.style.left = -PAD + 'px'; c.style.top = -PAD + 'px';
      c.ctx.translate(PAD, PAD);
      ly.paint(c.ctx, L, v.state);
      v.el.appendChild(c);
      return { c, depth: ly.depth ?? i * 0.4 };
    });
    if (v.def.dyn) {
      const c = canvas(L.w + PAD * 2, L.h + PAD * 2, Math.min(devicePixelRatio || 1, 1.5)); c.className = 'layer dyn';
      c.style.left = -PAD + 'px'; c.style.top = -PAD + 'px'; c.ctx.translate(PAD, PAD);
      v.el.appendChild(c);
      v.dyn = c;
    }
    if (v.def.mount && !v.html) { v.html = document.createElement('div'); v.html.className = 'view-html'; document.getElementById('overlay').appendChild(v.html); }
    if (v.def.mount) { v.html.innerHTML = ''; v.def.mount(v.html, L, v.state, v); }
    if (v.def.prepare) v.def.prepare(v);
    v.painted = true;
  }

  // pinta en segundo plano las escenas que aún no se han pintado (una por pausa del navegador)
  warm(names) {
    const queue = names.filter((n) => this.defs[n] && !(this.views[n] && this.views[n].painted));
    const step = () => { const n = queue.shift(); if (!n) return; const v = this.get(n); if (!v.painted) { this.paint(v); v.el.style.visibility = 'hidden'; } (window.requestIdleCallback || setTimeout)(step, { timeout: 400 }); };
    (window.requestIdleCallback || setTimeout)(step, { timeout: 400 });
  }

  relayout() { for (const k in this.views) if (this.views[k].painted) this.paint(this.views[k]); }

  // weights: {name: opacidad}; st: estado común (key, t, time...)
  frame(weights, st, scales = {}) {
    this.sm.x += (this.mouse.x - this.sm.x) * 0.06; this.sm.y += (this.mouse.y - this.sm.y) * 0.06;
    for (const k in this.views) { if (!(k in weights) || weights[k] <= 0.001) { const v = this.views[k]; v.el.style.opacity = 0; v.el.style.visibility = 'hidden'; if (v.html) v.html.style.visibility = 'hidden'; if (v.on && v.def.leave) v.def.leave(v); v.on = false; } }
    for (const name in weights) {
      const wgt = weights[name]; if (wgt <= 0.001) continue;
      const v = this.get(name); if (!v) continue;
      if (!v.painted) this.paint(v);
      if (!v.on && v.def.enter) v.def.enter(v, st);
      v.on = true;
      v.el.style.visibility = 'visible'; v.el.style.opacity = wgt.toFixed(3);
      v.el.style.transform = scales[name] ? `scale(${scales[name].toFixed(4)})` : '';
      if (v.html) { v.html.style.visibility = wgt > 0.5 ? 'visible' : 'hidden'; v.html.style.opacity = wgt; }
      const tm = st.time || 0;
      const tr = (d) => { const dx = -this.sm.x * d * 16 + Math.sin(tm * 0.13) * d * 6, dy = -this.sm.y * d * 8 + Math.cos(tm * 0.11) * d * 4; return `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0)`; };
      for (const ly of v.layers) ly.c.style.transform = tr(ly.depth);
      const dd = v.def.dynDepth ?? 0.3;
      if (v.dyn) v.dyn.style.transform = tr(dd);
      if (v.html) v.html.style.transform = tr(dd);
      const vs = { ...st, ...(st.views?.[name] || {}) };
      if (v.def.update) v.def.update(v, vs);
      if (v.dyn) { const ctx = v.dyn.ctx; ctx.clearRect(-PAD, -PAD, v.L.w + PAD * 2, v.L.h + PAD * 2); v.def.dyn(ctx, v.L, vs, v); }
    }
  }
}
