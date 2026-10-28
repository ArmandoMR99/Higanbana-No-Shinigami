// Tarjetas: la ema de cada barrio y la ficha de cada bestia (Modo Bestias).
import { BARRIOS, CRIATURAS, hhmm } from './story.js';

const card = document.getElementById('card');
const body = card.querySelector('.card-body');
card.querySelector('.card-close').addEventListener('click', () => hideCard());
let onBestia = null;

export function hideCard() { card.hidden = true; if (onBestia) onBestia(null); }
export const cardOpen = () => !card.hidden;

export function showEma(b) {
  const total = BARRIOS.reduce((s, x) => s + x.dmg, 0);
  const share = Math.round((b.dmg / total) * 100);
  card.className = '';
  body.innerHTML = `
    <div class="m">Ema · barrio</div>
    <div class="k" lang="ja">${b.kanji}</div>
    <div class="n">${b.name} <span style="opacity:.6">— ${b.meaning}</span></div>
    <p>${b.ambient}</p>
    <p>${b.story}</p>
    <div class="stats">
      <div><b>${b.dmg} %</b><span>estructuras destruidas</span></div>
      <div><b>${hhmm(b.ignite)}</b><span>hora en que ardió</span></div>
      <div><b>${b.hab}</b><span>habitantes</span></div>
      <div><b>${b.dead}</b><span>muertos · ${b.hurt} heridos · ${b.safe} ilesos</span></div>
    </div>
    <div class="bar" title="Parte de la destrucción total del valle"><i style="width:${share}%"></i></div>
    <span style="font-family:var(--f-data);font-size:.66rem;opacity:.75">${share} % de toda la destrucción del valle</span>`;
  card.hidden = false;
}

export function showBestia(id, onChange) {
  if (onChange) onBestia = onChange;
  const c = CRIATURAS.find((x) => x.id === id) || CRIATURAS[0];
  const total = CRIATURAS.reduce((s, x) => s + x.count, 0);
  card.className = 'bestia';
  body.innerHTML = `
    <div class="m">Modo Bestias</div>
    <div class="k" lang="ja">${c.kanji}</div>
    <div class="n">${c.name}</div>
    <p>${c.how}</p>
    <p style="opacity:.75">${c.look}</p>
    <div class="stats">
      <div><b>${c.count}</b><span>atacaron (${(c.count / total * 100).toFixed(1).replace('.', ',')} %)</span></div>
      <div><b>${c.defeated}</b><span>derrotadas por Kenji</span></div>
      <div><b>${c.deaths}</b><span>muertes causadas</span></div>
      <div><b>${c.count - c.defeated}</b><span>huyeron al amanecer</span></div>
    </div>
    <div class="bar" title="Derrotadas sobre las que atacaron"><i style="width:${(c.defeated / c.count) * 100}%"></i></div>
    <div class="bestia-tabs">${CRIATURAS.map((x) => `<button data-id="${x.id}" class="${x.id === c.id ? 'on' : ''}" lang="ja" title="${x.name}">${x.kanji}</button>`).join('')}</div>`;
  body.querySelectorAll('.bestia-tabs button').forEach((b) => b.addEventListener('click', () => showBestia(b.dataset.id)));
  card.hidden = false;
  if (onBestia) onBestia(c.id);
}
