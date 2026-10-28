// Motor de lectura: arma los pasajes, mide el scroll y expone la posición (sección + avance local).
const ICONS = {
  // hoja de arce (otoño)
  leaf: '<svg viewBox="0 0 24 24"><path d="M12 1l2.2 4.6 3.4-1.4-.9 4.4 4.8.6-3.6 3 2.6 2.6-4.8.4.4 3.6-4.1-2.2V23h-1.8v-6.4l-4.1 2.2.4-3.6-4.8-.4 2.6-2.6-3.6-3 4.8-.6-.9-4.4 3.4 1.4z"/></svg>',
  // gota de lluvia
  drop: '<svg viewBox="0 0 24 24"><path d="M12 1.5C9 7 5 11 5 15.2A7 7 0 0 0 19 15.2C19 11 15 7 12 1.5z"/></svg>',
  // copo de nieve
  snow: '<svg viewBox="0 0 24 24"><path d="M11 1h2v4.2l2.3-1.6 1.1 1.6L13 7.6v3.1l2.7-1.6.3-4 2 .2-.3 2.6 3.6-2.1 1 1.7-3.6 2.1 2.4 1.1-.8 1.8-3.6-1.7L14 12l2.7 1.6 3.6-1.7.8 1.8-2.4 1.1 3.6 2.1-1 1.7-3.6-2.1.3 2.6-2 .2-.3-4-2.7-1.6v3.1l3.4 2.4-1.1 1.6-2.3-1.6V23h-2v-4.2l-2.3 1.6-1.1-1.6 3.4-2.4v-3.1l-2.7 1.6-.3 4-2-.2.3-2.6-3.6 2.1-1-1.7 3.6-2.1-2.4-1.1.8-1.8 3.6 1.7L10 12 7.3 10.4l-3.6 1.7-.8-1.8 2.4-1.1-3.6-2.1 1-1.7 3.6 2.1-.3-2.6 2-.2.3 4L11 10.7V7.6L7.6 5.2l1.1-1.6L11 5.2z"/></svg>',
};

export class Reader {
  constructor(el, { onEnd } = {}) {
    this.el = el; this.sections = []; this.onEnd = onEnd;
    this.progressEl = document.getElementById('progress');
    this.hintEl = document.getElementById('hint');
    this.current = -1;
    el.addEventListener('scroll', () => this.measure(), { passive: true });
    addEventListener('resize', () => this.layout());
  }

  load(ch, chapters) {
    this.ch = ch;
    const S = [];
    S.push({ key: ch.passages[0].key, head: true });
    for (const p of ch.passages) S.push({ ...p, len: p.len || 1 });
    S.push({ key: ch.passages[ch.passages.length - 1].key, end: true });
    this.sections = S.map((s) => ({ len: 1, ...s }));
    const next = chapters[(chapters.indexOf(ch) + 1) % chapters.length];

    this.el.innerHTML = '';
    this.sections.forEach((s, i) => {
      const sec = document.createElement('section');
      sec.className = 'passage' + (s.cine ? ' cine' : '') + (s.end ? ' end' : '');
      sec.style.height = `${s.len * 100}vh`;
      if (s.cine) {
        sec.innerHTML = `<p class="line">${s.cine}</p>`;
      } else if (s.head) {
        sec.innerHTML = `<div class="scroll"><div class="chapter-head"><div class="ch-num">Capítulo ${ch.roman}</div><div class="ch-kanji" lang="ja">${ch.kanji}</div><div class="ch-name">${ch.name}</div></div><p style="margin-top:2.4rem;font-family:var(--f-data);font-size:.72rem;letter-spacing:.2em;color:var(--ash)">BAJA PARA LEER · ↓</p></div>`;
      } else if (s.end) {
        sec.innerHTML = `<div class="scroll"><div class="chapter-head"><div class="ch-num">Fin del capítulo ${ch.roman}</div><div class="ch-kanji" lang="ja">${ch.kanji}</div></div>
          <div class="end-actions">
            <button data-go="${next.id}"><small>Capítulo ${next.roman}</small>${next.kanji} · ${next.name}</button>
            <button data-go="menu"><small>Esc</small>Volver a los capítulos</button>
          </div></div>`;
        sec.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => this.onEnd && this.onEnd(b.dataset.go)));
      } else {
        sec.innerHTML = `<div class="scroll">${s.paras.map((p) => `<p>${p}</p>`).join('')}</div>`;
      }
      s.el = sec;
      this.el.appendChild(sec);
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
    this.el.scrollTop = 0;
    this.layout();
  }

  layout() {
    let top = 0;
    const vh = innerHeight;
    for (const s of this.sections) { s.top = top; s.h = s.len * vh; top += s.h; }
    this.measure();
  }

  measure() {
    const y = this.el.scrollTop;
    const S = this.sections;
    let i = 0;
    while (i < S.length - 1 && y >= S[i + 1].top - 1) i++;
    const t = Math.min(1, Math.max(0, (y - S[i].top) / S[i].h));
    this.i = i; this.t = t;
    // un pasaje se "ve" cuando entra en pantalla
    for (let k = 0; k < S.length; k++) {
      const vis = y + innerHeight * 0.6 > S[k].top && y < S[k].top + S[k].h - innerHeight * 0.2;
      if (vis) S[k].el.classList.add('seen');
    }
    // en pasajes largos, los párrafos se revelan por partes (solo quedan los dos últimos)
    const cur = S[i];
    if (cur.len > 1 && cur.paras && cur.paras.length > 2) {
      const ps = cur.el.querySelectorAll('.scroll p');
      const k = Math.min(ps.length - 1, Math.floor(t * (ps.length + 0.4)));
      ps.forEach((p, n) => { p.classList.toggle('off', n > k || n < k - 1); });
    }
    if (i !== this.current) {
      this.current = i;
      for (const m of this.marks) {
        m.li.classList.toggle('now', m.i === i);
        m.li.classList.toggle('done', m.i < i);
      }
      const h = S[i].hint;
      this.hintEl.textContent = h || '';
      this.hintEl.classList.toggle('on', !!h);
    }
  }

  goTo(i) { this.el.scrollTo({ top: this.sections[i].top, behavior: 'smooth' }); }
  next() {
    const s = this.sections[this.i];
    // dentro de un pasaje largo, avanza una pantalla
    if (s.len > 1 && this.el.scrollTop + innerHeight < s.top + s.h - 2) this.el.scrollBy({ top: innerHeight, behavior: 'smooth' });
    else if (this.i < this.sections.length - 1) this.goTo(this.i + 1);
  }
  prev() {
    const s = this.sections[this.i];
    if (this.el.scrollTop > s.top + 2) this.el.scrollTo({ top: Math.max(s.top, this.el.scrollTop - innerHeight), behavior: 'smooth' });
    else if (this.i > 0) { const p = this.sections[this.i - 1]; this.el.scrollTo({ top: p.top + p.h - innerHeight, behavior: 'smooth' }); }
  }
}
