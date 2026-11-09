// Motor de lectura: navegación por pasos con animación suave (sin scroll nativo).
// La posición es un número continuo en "pasos": cada pasaje corto ocupa 1 paso y uno largo ocupa `len` pasos.
// Rueda, gestos táctiles, flechas e iconos mueven la posición objetivo; la posición la sigue con suavidad.
const ICONS = {
  // hoja de arce (otoño)
  leaf: '<svg viewBox="0 0 24 24"><path d="M12 1l2.2 4.6 3.4-1.4-.9 4.4 4.8.6-3.6 3 2.6 2.6-4.8.4.4 3.6-4.1-2.2V23h-1.8v-6.4l-4.1 2.2.4-3.6-4.8-.4 2.6-2.6-3.6-3 4.8-.6-.9-4.4 3.4 1.4z"/></svg>',
  // gota de lluvia
  drop: '<svg viewBox="0 0 24 24"><path d="M12 1.5C9 7 5 11 5 15.2A7 7 0 0 0 19 15.2C19 11 15 7 12 1.5z"/></svg>',
  // copo de nieve
  snow: '<svg viewBox="0 0 24 24"><path d="M11 1h2v4.2l2.3-1.6 1.1 1.6L13 7.6v3.1l2.7-1.6.3-4 2 .2-.3 2.6 3.6-2.1 1 1.7-3.6 2.1 2.4 1.1-.8 1.8-3.6-1.7L14 12l2.7 1.6 3.6-1.7.8 1.8-2.4 1.1 3.6 2.1-1 1.7-3.6-2.1.3 2.6-2 .2-.3-4-2.7-1.6v3.1l3.4 2.4-1.1 1.6-2.3-1.6V23h-2v-4.2l-2.3 1.6-1.1-1.6 3.4-2.4v-3.1l-2.7 1.6-.3 4-2-.2.3-2.6-3.6 2.1-1-1.7 3.6-2.1-2.4-1.1.8-1.8 3.6 1.7L10 12 7.3 10.4l-3.6 1.7-.8-1.8 2.4-1.1-3.6-2.1 1-1.7 3.6 2.1-.3-2.6 2-.2.3 4L11 10.7V7.6L7.6 5.2l1.1-1.6L11 5.2z"/></svg>',
};

export class Reader {
  constructor(el, { onEnd, onStep } = {}) {
    this.el = el; this.sections = []; this.onEnd = onEnd; this.onStep = onStep;
    this.progressEl = document.getElementById('progress');
    this.hintEl = document.getElementById('hint');
    this.pos = 0; this.target = 0; this.total = 1; this.i = 0; this.t = 0; this.active = -1; this.enabled = false;
    this.acc = 0; this.lockUntil = 0;
    // rueda / panel táctil: acumula y da un paso por gesto
    addEventListener('wheel', (e) => {
      if (!this.enabled || e.target.closest('#card')) return;
      e.preventDefault();
      const now = performance.now();
      const dy = e.deltaMode === 1 ? e.deltaY * 30 : e.deltaY;
      if (now < this.lockUntil) { this.acc = 0; return; }
      this.acc += dy;
      if (Math.abs(this.acc) > 45) { this.step(Math.sign(this.acc)); this.acc = 0; this.lockUntil = now + 650; }
      clearTimeout(this._accT); this._accT = setTimeout(() => (this.acc = 0), 260);
    }, { passive: false });
    // gestos táctiles
    let ty = null;
    addEventListener('touchstart', (e) => { if (this.enabled) ty = e.touches[0].clientY; }, { passive: true });
    addEventListener('touchend', (e) => { if (!this.enabled || ty === null) return; const d = ty - e.changedTouches[0].clientY; if (Math.abs(d) > 40) this.step(Math.sign(d)); ty = null; }, { passive: true });
  }

  load(ch, chapters) {
    this.ch = ch;
    const S = [];
    S.push({ key: ch.passages[0].key, head: true });
    for (const p of ch.passages) S.push({ ...p, len: p.len || 1 });
    S.push({ key: ch.passages[ch.passages.length - 1].key, end: true });
    this.sections = S.map((s) => ({ len: 1, ...s }));
    const next = chapters[(chapters.indexOf(ch) + 1) % chapters.length];
    let start = 0;
    for (const s of this.sections) { s.start = start; start += s.len; }
    this.total = start;

    this.el.innerHTML = '';
    this.sections.forEach((s) => {
      const sec = document.createElement('section');
      sec.className = 'passage' + (s.cine ? ' cine' : '') + (s.end ? ' end' : '');
      if (s.cine) sec.innerHTML = `<p class="line">${s.cine}</p>`;
      else if (s.head) sec.innerHTML = `<div class="scroll"><div class="chapter-head"><div class="ch-num">Capítulo ${ch.roman}</div><div class="ch-kanji" lang="ja">${ch.kanji}</div><div class="ch-name">${ch.name}</div></div><p class="cue">Baja para leer <span>↓</span></p></div>`;
      else if (s.end) {
        sec.innerHTML = `<div class="scroll"><div class="chapter-head"><div class="ch-num">Fin del capítulo ${ch.roman}</div><div class="ch-kanji" lang="ja">${ch.kanji}</div></div>
          <div class="end-actions"><button data-go="${next.id}"><small>Capítulo ${next.roman}</small>${next.kanji} · ${next.name}</button><button data-go="menu"><small>Esc</small>Volver a los capítulos</button></div></div>`;
        sec.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => this.onEnd && this.onEnd(b.dataset.go)));
      } else if (s.len > 1 && s.paras.length > 2) {
        const pages = []; for (let k = 0; k < s.paras.length; k += 2) pages.push(s.paras.slice(k, k + 2));
        sec.innerHTML = `<div class="scroll paged"><div class="pages">${pages.map((pg, k) => `<div class="page${k ? '' : ' on'}">${pg.map((p) => `<p>${p}</p>`).join('')}</div>`).join('')}</div></div>`;
        s.pages = [...sec.querySelectorAll('.page')];
      } else sec.innerHTML = `<div class="scroll">${s.paras.map((p) => `<p>${p}</p>`).join('')}</div>`;
      s.el = sec; this.el.appendChild(sec);
    });

    this.progressEl.innerHTML = '';
    this.marks = [];
    this.sections.forEach((s, i) => {
      if (s.head || s.end) return;
      const li = document.createElement('li');
      li.innerHTML = ICONS[ch.icon];
      li.title = s.cine ? 'Frase' : `Pasaje ${this.marks.length + 1}`;
      li.addEventListener('click', () => this.goTo(i));
      this.progressEl.appendChild(li);
      this.marks.push({ li, i });
    });
    this.pos = this.target = 0; this.active = -1; this.enabled = true;
    this.update(0, true);
  }

  step(dir) { this.target = Math.max(0, Math.min(this.total - 1, Math.round(this.target) + dir)); if (this.onStep) this.onStep(dir); }
  next() { this.step(1); }
  prev() { this.step(-1); }
  goTo(i) { this.target = this.sections[i].start; }
  jump(i, frac = 0) { const s = this.sections[i]; this.pos = this.target = s.start + frac * s.len; this.update(0, true); }

  // se llama en cada cuadro: la posición sigue al objetivo con una curva suave (sin rebotes)
  update(dt, force) {
    if (!this.sections.length) return;
    const d = this.target - this.pos;
    if (Math.abs(d) > 0.0005) this.pos += d * (1 - Math.exp(-dt * 3.6));
    else this.pos = this.target;
    const S = this.sections;
    let i = 0; while (i < S.length - 1 && this.pos >= S[i + 1].start - 1e-6) i++;
    this.i = i; this.t = Math.min(1, Math.max(0, (this.pos - S[i].start) / S[i].len));
    // el texto cambia a mitad de la transición, cuando la escena está en su punto más oscuro
    const look = this.pos + 0.5; let a = 0; while (a < S.length - 1 && look >= S[a + 1].start) a++;
    if (S[a].len > 1 && look - S[a].start > S[a].len - 0.5) a = Math.min(S.length - 1, a + 1);
    if (a !== this.active || force) {
      this.active = a;
      S.forEach((s, k) => { s.el.classList.toggle('active', k === a); if (k === a) s.el.classList.add('seen'); else s.el.classList.remove('seen'); });
      for (const m of this.marks) { m.li.classList.toggle('now', m.i === a); m.li.classList.toggle('done', m.i < a); }
      const h = S[a].hint; this.hintEl.textContent = h || ''; this.hintEl.classList.toggle('on', !!h);
    }
    const cur = S[a];
    if (cur.pages) {
      const n = cur.pages.length, tt = a === i ? this.t : 0, tIn = Math.min(1, tt * cur.len / (cur.len - 0.6));
      const k = Math.min(n - 1, Math.floor(tIn * n + 0.001));
      cur.pages.forEach((pg, j) => pg.classList.toggle('on', j === k));
    }
  }
}
