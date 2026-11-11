// Sistema iconográfico de Higanbana no Shinigami.
// Una sola fuente: cada ícono es un trazo SVG de 24 × 24 (línea de 1,6, puntas redondas)
// que se usa igual en el HTML (fichas, leyendas, códice) y en los lienzos 2D (Path2D).
// Regla de color: los trazos van en hueso; el acento (a) va en rojo higanbana,
// salvo los onis, cuyo acento es el azul de su fuego.

export const ICON_GROUPS = [
  { id: 'personajes', name: 'Personajes', items: ['kenji', 'padres', 'ronin', 'dioses', 'espiritu'] },
  { id: 'criaturas', name: 'Criaturas', items: ['dragon', 'oni', 'yokai', 'kappa'] },
  { id: 'encuentros', name: 'Encuentros del viaje', items: ['kitsune', 'tengu', 'kappa', 'bakeneko'] },
  { id: 'artefactos', name: 'Artefactos', items: ['higanbana', 'marca', 'kusarigama', 'incienso', 'ema', 'farolillo'] },
  { id: 'lugares', name: 'Territorios', items: ['barrio', 'rio', 'montana', 'templo', 'ruta', 'japon'] },
  { id: 'datos', name: 'Datos', items: ['reloj', 'fuego', 'muerto', 'herido', 'ileso', 'derrota', 'huida'] },
];

export const ICONS = {
  kenji: { name: 'Kenji', d: 'M12 3.4a2.7 2.7 0 1 0 0 5.4a2.7 2.7 0 1 0 0-5.4Z M6.8 20.6v-4.4a5.2 5.2 0 0 1 10.4 0v4.4', a: 'M14.9 9.6l1.3 1.1 M15.6 9l.3 1.7', note: 'El protagonista. Se reconoce por la marca roja del cuello.' },
  padres: { name: 'Padres de Kenji', d: 'M8 4.6a2.1 2.1 0 1 0 0 4.2a2.1 2.1 0 1 0 0-4.2Z M16 4.6a2.1 2.1 0 1 0 0 4.2a2.1 2.1 0 1 0 0-4.2Z M3.8 19.6v-3.7a4.2 4.2 0 0 1 8.4 0v3.7 M11.8 19.6v-3.7a4.2 4.2 0 0 1 8.4 0v3.7', note: 'Lo encierran en el almacén para salvarlo.' },
  ronin: { name: 'Ronin ciego', d: 'M4.6 8.2h12.8L11 3.4Z M9 10.6a2 2 0 1 0 4 0a2 2 0 1 0-4 0 M7 21v-3.8a4 4 0 0 1 8 0V21 M19.4 8.6V21', note: 'Huele la marca y anuncia el cobro.' },
  dioses: { name: 'Los dioses', d: 'M12 7.2a4.8 4.8 0 1 0 0 9.6a4.8 4.8 0 1 0 0-9.6Z M12 2.2v2.4 M12 19.4v2.4 M2.2 12h2.4 M19.4 12h2.4 M5 5l1.7 1.7 M17.3 17.3L19 19 M5 19l1.7-1.7 M17.3 6.7L19 5', a: 'M10.6 12a1.4 1.4 0 1 0 2.8 0a1.4 1.4 0 1 0-2.8 0', note: 'Crearon la marca como prisión.' },
  espiritu: { name: 'Espíritu rebelde', d: 'M8.4 15.2a3.8 3.8 0 1 0 7.6 0c0-2.6-2.2-3.9-3.4-6.4C11.6 6.6 12.4 4.6 14.6 3.2C10 4 7.4 8 8.9 12', a: 'M11.4 15.4h.01 M13.6 15.4h.01', note: 'Desafió a los dioses; habla desde la cadena.' },
  dragon: { name: 'Dragón', d: 'M2.6 19.4c2.8 0 3.8-3.4 6.6-3.4s3.8 3.4 6.6 3.4c1.8 0 2.8-1.2 3.4-3.2 M9.4 16l1.6-8.6 2.2 3 2-2.6 1 5 M19.2 16.2l2.6-2.2-3-.6-.5-2.6', a: 'M18.4 13.4h.01', note: '12 atacaron · 2 eran colosales.' },
  oni: { name: 'Oni', d: 'M7.2 5.4l1.6 3.4 M16.8 5.4l-1.6 3.4 M6 12.4a6 6 0 0 1 12 0v2.6a6 6 0 0 1-12 0Z M9.4 16.8l1-1 1.1 1 1-1 1.1 1 1-1', a: 'M9.6 12.6h.01 M14.4 12.6h.01', ac: 'oni', note: '7 atacaron con antorchas de fuego azul.' },
  yokai: { name: 'Yokai', d: 'M6 20.4v-9a6 6 0 0 1 12 0v9l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5Z', a: 'M9.6 11.4h.01 M14.4 11.4h.01', note: '7 siluetas que nadie supo nombrar.' },
  kappa: { name: 'Kappa', d: 'M6 12.6a6 6 0 0 1 12 0c0 4-2.7 7-6 7s-6-3-6-7Z M8 6.8a4 1.4 0 1 0 8 0a4 1.4 0 1 0-8 0 M10.4 15.6c1 .8 2.2 .8 3.2 0', a: 'M9.6 12h.01 M14.4 12h.01', note: '4 subieron por el río.' },
  kitsune: { name: 'Kitsune', d: 'M4 4l4.2 4.2h7.6L20 4l-1 8.2-7 7.8-7-7.8Z', a: 'M8.8 12.2l1.6.6 M15.2 12.2l-1.6.6', note: 'Templo abandonado: la primera que no lo ataca.' },
  tengu: { name: 'Tengu', d: 'M11.4 3.8a6.4 6.4 0 1 0 0 12.8a6.4 6.4 0 1 0 0-12.8Z M12.6 10.4l8.4 3.6-8-.8 M8 8.4l2 1 M15 8l-1.6 1.2', a: 'M9.4 11h.01', note: 'Montaña nevada: «los dioses jamás premian a sus perros».' },
  bakeneko: { name: 'Bakeneko', d: 'M5 4.6l3 4h8l3-4v8.2a7 6.2 0 0 1-14 0Z M2.6 14.2h3 M18.4 14.2h3 M10.8 15.6l1.2.8 1.2-.8', a: 'M9.4 12.4h.01 M14.6 12.4h.01', note: 'Taberna en ruinas: vio la marca hace 300 años.' },
  higanbana: { name: 'Higanbana', d: 'M12 21.4V11.2', a: 'M12 11.2C11 8.2 8.6 6.8 6 7.2 M12 11.2c1-3 3.4-4.4 6-4 M12 11.2C9.6 10.2 8.6 7 9.4 4 M12 11.2c2.4-1 3.4-4.2 2.6-7.2 M12 11.2c-3 0-5.6 1.4-6.6 3.4 M12 11.2c3 0 5.6 1.4 6.6 3.4', note: 'Lirio de araña: la flor de los muertos.' },
  marca: { name: 'La marca', d: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18Z', a: 'M12 16.4v-4.2 M12 12.2c-.6-1.8-2-2.6-3.6-2.4 M12 12.2c.6-1.8 2-2.6 3.6-2.4 M12 12.2c-1.4-.6-2-2.4-1.4-4 M12 12.2c1.4-.6 2-2.4 1.4-4', note: 'Prisión de los dioses, en el lado derecho del cuello.' },
  kusarigama: { name: 'Kusarigama', d: 'M4.6 19.4L11.8 8.2 M4.8 19.4C8 21.4 12.6 21.6 17 19.2 M17 19.2a1.8 1.8 0 1 0 3.6 0a1.8 1.8 0 1 0-3.6 0', a: 'M11.8 8.2C13.4 4.6 17 3 21 3.6c-3 1-5.4 3-6.8 6.2Z', note: 'Hoz y cadena forjadas con la sangre de Kenji.' },
  incienso: { name: 'Incienso', d: 'M5 16.2h14c0 2.8-3 4.4-7 4.4s-7-1.6-7-4.4Z M12 16.2V8.6 M12 6.4c-1.4-1.3 1.4-2.3 0-3.8', a: 'M11 8.2h2', note: 'Reloj de la noche: una hora, de 22:00 a 23:00.' },
  ema: { name: 'Ema', d: 'M4 9.4L12 4l8 5.4V19H4Z M8 13.2h8 M8 16.2h5.2', a: 'M10.6 6.4h2.8', note: 'Tablilla votiva: la historia de cada barrio.' },
  farolillo: { name: 'Farolillo', d: 'M9 4h6 M9 20h6 M12 2.4V4 M12 20v1.6 M8.2 6C6.8 7.6 6.2 9.6 6.2 12s.6 4.4 2 6h7.6c1.4-1.6 2-3.6 2-6s-.6-4.4-2-6Z', a: 'M12 9.6v4.8', note: 'Un farolillo por habitante: 312.' },
  barrio: { name: 'Barrio', d: 'M3 11l9-7 9 7 M5 9.8V20h14V9.8 M10 20v-5h4v5', note: 'Cinco barrios en el valle de Yomigawa.' },
  rio: { name: 'Río', d: 'M3 8c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0 M3 12.4c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0 M3 16.8c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0', note: 'El río Yomigawa cruza el valle de norte a sur.' },
  montana: { name: 'Montañas', d: 'M2 20l7-12 4 6.2 3-4.2 6 10Z', note: 'De las montañas del norte bajaron las bestias.' },
  templo: { name: 'Templo', d: 'M3 6c4 1.2 14 1.2 18 0 M4.6 9.2h14.8 M7 6.8V21 M17 6.8V21 M12 7v2.2', note: 'Lugar de los encuentros del viaje.' },
  ruta: { name: 'Ruta', d: 'M4 20.2l1.5-1.4 M7.6 17.2l1.7-.8 M11.6 15.6l1.8-.4 M15.6 13.6l1.3-1.4 M18.4 9.8l.7-1.6', a: 'M19 2.8a2.1 2.1 0 1 0 0 4.2a2.1 2.1 0 1 0 0-4.2Z', note: 'El camino de Kenji durante siete inviernos.' },
  japon: { name: 'Japón · era Taishō', d: 'M16.8 3.2l2.6 1.6-1.2 2.4-2-.4Z M15.4 8.6l1.8 2.2-.6 3.4-2.4 2.6-3.6 1.2-2.8 2.2-1.6-1 2-2.6 3.2-1.4 2.2-2.8Z M4.6 19.6l1.6.6-.8 1.6-1.4-.6Z', a: 'M12.2 14.4h.01', note: 'Japón, era Taishō (1912-1926).' },
  reloj: { name: 'Hora', d: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18Z M12 7v5l3.4 2', note: 'Hora de la noche del ataque.' },
  fuego: { name: 'Incendio', d: '', a: 'M12 21a6 6 0 0 0 6-6c0-4-3-6-4-10-1 2.5-3 3.5-3 6-1-1-1.5-2-1.5-3C7 10.2 6 12.6 6 15a6 6 0 0 0 6 6Z', note: 'Barrio en llamas · estructuras destruidas.' },
  muerto: { name: 'Muertos', d: 'M9 4h6 M9 20h6 M8.2 6C6.8 7.6 6.2 9.6 6.2 12s.6 4.4 2 6h7.6c1.4-1.6 2-3.6 2-6s-.6-4.4-2-6Z M9.6 10l4.8 4.8 M14.4 10l-4.8 4.8', note: 'Farolillo apagado: 184 muertos.' },
  herido: { name: 'Heridos', d: 'M9 4h6 M9 20h6 M8.2 6C6.8 7.6 6.2 9.6 6.2 12s.6 4.4 2 6h7.6c1.4-1.6 2-3.6 2-6s-.6-4.4-2-6Z', a: 'M12 12v3', note: 'Farolillo que parpadea: 68 heridos.' },
  ileso: { name: 'Ilesos', d: 'M9 4h6 M9 20h6 M8.2 6C6.8 7.6 6.2 9.6 6.2 12s.6 4.4 2 6h7.6c1.4-1.6 2-3.6 2-6s-.6-4.4-2-6Z', a: 'M12 8.6v6.8 M10 12h4', note: 'Farolillo encendido: 60 ilesos.' },
  derrota: { name: 'Derrotadas', d: 'M5 19L19 5', a: 'M14.2 4.6h5.2v5.2', note: 'Criaturas que cayeron ante la cadena: 14.' },
  huida: { name: 'Huyeron', d: 'M3.6 12h13 M13 7l5 5-5 5 M21 5v14', note: 'Criaturas que huyeron antes del amanecer: 16.' },
};

const ACC = { red: '#e0303a', oni: '#5a8cff' };

// HTML: <svg> con el trazo y el acento
export function svgIcon(id, { size = 22, cls = '', title = true } = {}) {
  const I = ICONS[id]; if (!I) return '';
  const ac = ACC[I.ac || 'red'];
  return `<svg class="ico ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="${title ? 'false' : 'true'}" role="img">${title ? `<title>${I.name}</title>` : ''}${I.d ? `<path d="${I.d}" stroke="currentColor" stroke-width="1.6"/>` : ''}${I.a ? `<path d="${I.a}" stroke="${ac}" stroke-width="1.9"/>` : ''}</svg>`;
}

// Lienzo: mismo dibujo con Path2D
const P2 = {};
const p2 = (s) => (P2[s] ||= new Path2D(s));
export function drawIcon(ctx, id, x, y, size = 22, { color = 'rgba(232,226,218,0.92)', accent = null, alpha = 1, lw = 1.6 } = {}) {
  const I = ICONS[id]; if (!I) return;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x - size / 2, y - size / 2); ctx.scale(size / 24, size / 24);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (I.d) { ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.stroke(p2(I.d)); }
  if (I.a) { ctx.strokeStyle = accent || ACC[I.ac || 'red']; ctx.lineWidth = lw + 0.3; ctx.stroke(p2(I.a)); }
  ctx.restore();
}
