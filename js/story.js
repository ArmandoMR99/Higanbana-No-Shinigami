// Contenido canónico de Higanbana no Shinigami.
// Cada capítulo se divide en pasajes. Un pasaje tiene:
//   key   -> el encuadre / momento 3D que lo acompaña (definido en js/scenes/chX.js)
//   paras -> párrafos que se muestran en el pergamino lateral
//   cine  -> frase que aparece sola, a pantalla completa (estilo cine)
//   len   -> cuántas pantallas de scroll dura (por defecto 1; los interactivos duran más)
//   hint  -> instrucción breve para las partes interactivas

export const CHAPTERS = [
  {
    id: 1,
    roman: 'I',
    kanji: '秋分',
    reading: 'shūbun',
    name: 'Cuando florecen los muertos',
    sub: 'Equinoccio de otoño',
    icon: 'leaf',
    passages: [
      { key: 'bosque', paras: [
        'En la era Taishō, en el valle de Yomigawa todos los niños conocían la misma advertencia: los lirios de araña no eran flores comunes. Los viejos decían que crecían sobre el rastro de sangre que dejaban los muertos al caminar hacia el inframundo, y que quien tocara uno solo de sus pétalos atraería la mirada de los dioses.',
        'Los padres usaban la historia para mantener a sus hijos lejos del bosque. Kenji, como casi todos los muchachos de Akabana, pensaba que era solo un cuento para asustarlos.',
      ] },
      { key: 'bosque2', cine: 'Hasta que le tocó comprobarlo.' },
      { key: 'flor', paras: [
        'Tenía trece años. Aquella tarde había entrado al bosque a juntar leña y terminó persiguiendo algo que creyó ver moverse entre los bambúes. Cuando se dio cuenta, el pueblo había quedado muy atrás. Buscando el camino de regreso encontró una flor solitaria, roja como una herida abierta. Se agachó para verla mejor y, sin pensarlo, rozó uno de sus pétalos.',
        'Al principio no pasó nada. Después sintió un pinchazo helado en la garganta, como si le hubieran clavado una aguja. Cayó al suelo con las manos en el cuello, ahogándose con su propia saliva, convencido de que se estaba muriendo. Cuando por fin pudo levantarse, la flor ya no estaba.',
      ] },
      { key: 'rio', paras: [
        'Corrió hasta el río y se miró en el agua. En su cuello había una marca roja, fresca y detallada, con la forma exacta de un higanbana. La piel ardía como si le hubieran puesto un hierro al rojo vivo.',
        'Sus padres palidecieron al verla. Le vendaron el cuello y le hicieron prometer que nunca hablaría de ello. Kenji obedeció. Con el tiempo el ardor desapareció y la gente del barrio dejó de preguntar, aunque algunos todavía bajaban la mirada cuando él pasaba. Durante dos años no ocurrió nada. La marca se volvió una mancha más en su cuerpo.',
      ] },
      { key: 'ronin', paras: [
        'La ilusión se rompió el día en que un viejo ronin bajó de las montañas. Era ciego, tenía la cara cruzada de cicatrices y caminaba apoyado en un bastón de bambú. Kenji le sirvió agua en un cuenco, pero el hombre no llegó a beberla. Giró el rostro hacia el cuello vendado del muchacho como si pudiera verlo, y el cuenco se le cayó de las manos.',
        '—No necesito ojos para verla. Esa flor huele a azufre —dijo, apretando el mango de su katana—. Los dioses te dejaron algo pendiente, muchacho. Reza para que nunca vengan a cobrártelo.',
        'No aceptó más hospitalidad. Se marchó por el camino del norte y nadie volvió a verlo.',
      ] },
      { key: 'ronin2', cine: 'El cobro llegó tres noches después.' },
      { key: 'valle', len: 3, hint: 'Sigue bajando para consumir el incienso · toca un barrio para leer su ema', paras: [
        'A las diez de la noche el cielo se tiñó de un morado enfermizo y la lluvia cayó con tanta fuerza que no se veía nada a dos pasos. Primero se escuchó un rugido sobre las nubes. Luego, gritos.',
        'De las montañas del norte bajaron dragones con escamas de hueso, y detrás de ellos un ejército de onis que entró por los senderos incendiando las casas con antorchas de fuego azul. Por el río subieron kappas, y entre el humo se movían yokais que nadie supo nombrar.',
        'Akabana, el barrio más cercano a la montaña, fue el primero en arder. Kenji intentó correr hacia el camino, pero sus padres lo arrastraron hasta el almacén de arroz, lo empujaron adentro y atrancaron la puerta por fuera.',
      ] },
      { key: 'almacen', paras: [
        '—No salgas. Pase lo que pase —le dijo su madre.',
        'Por las rendijas de la madera, Kenji vio cómo una criatura de piel gris derribaba a su padre. Vio la sangre de su madre salpicar la pared. Golpeó la puerta hasta que le sangraron los puños, pero la madera no cedió.',
      ] },
    ],
  },
  {
    id: 2,
    roman: 'II',
    kanji: '雨夜',
    reading: 'amayo',
    name: 'La noche que llovió sangre',
    sub: 'Noche de lluvia',
    icon: 'drop',
    passages: [
      { key: 'despertar', paras: [
        'Fue en ese momento de impotencia pura cuando la marca despertó.',
        'Primero fue calor. Después, un dolor que nunca había sentido, como si le vertieran plomo fundido directamente en las venas del cuello. El fuego bajó por su hombro hasta el brazo derecho, y Kenji cayó de espaldas, gritando sin voz, mientras la piel de su antebrazo se abría de arriba abajo.',
      ] },
      { key: 'despertar2', cine: 'No salió hueso. Salió sangre, y la sangre no cayó al suelo.' },
      { key: 'forja', len: 2, hint: 'Toca las piezas en orden para forjar el arma', paras: [
        'Se quedó flotando frente a su mano, espesa, latiendo. Poco a poco empezó a tomar forma. Primero un núcleo redondo, erizado de pinchos, que palpitaba como un corazón envenenado. De él brotaron raíces de carne que se trenzaron en eslabones: una cadena carmesí que se enroscó en su brazo.',
        'Las raíces subieron hasta formar un mango, y unas vendas rituales, salidas de ninguna parte, lo envolvieron para que el calor no le quemara la mano. Al final, la sangre se estiró y se endureció en una hoja curva, roja y negra, con el relieve de un lirio de araña grabado en su base.',
      ] },
      { key: 'arma', paras: [
        'Una kusarigama. Su filo brillaba con una luz roja que parecía respirar.',
        'Apenas los dedos de Kenji rozaron el mango, la puerta del almacén salió volando. El oni que había matado a sus padres levantó su garrote para aplastarlo. Y entonces, dentro de su cabeza, habló una voz seca y rasposa que no era la suya:',
      ] },
      { key: 'arma2', cine: '—Préstame tus manos, mocoso.' },
      { key: 'latido', paras: [
        'Kenji no decidió moverse. Su cuerpo actuó solo. El brazo dio un latigazo involuntario, la cadena se extendió con un chasquido metálico y la hoja atravesó el cuello del oni antes de que pudiera pestañear. Kenji sintió el impacto vibrarle en los huesos. El olor a carne quemada le llenó la nariz.',
      ] },
      { key: 'anillo', len: 2, hint: 'Toca una criatura del anillo para abrir su ficha', paras: [
        'Después, el arma siguió tirando de él. Hacia la calle. Hacia el fuego. Hacia todo lo que se movía.',
        'Lo que pasó después lo recordaría solo a pedazos: la lluvia, el rugido de un dragón partiéndose en dos, el peso de la cadena girando sobre su cabeza. La fuerza que lo arrastraba era demasiado violenta para un cuerpo de quince años. La vista se le llenó de manchas rojas y cayó desmayado en el barro.',
      ] },
      { key: 'amanecer', len: 2, hint: 'Sigue bajando: el incienso termina de consumirse', paras: [
        'Despertó cuando el sol intentaba colarse entre el humo. Ya no llovía. Solo quedaba un silencio pesado, de esos que duelen en los oídos.',
        'A su alrededor estaban los cuerpos de los vecinos, pero también los restos de decenas de criaturas y los cadáveres cercenados de dos dragones colosales. Todo cortado con una precisión que ningún humano habría podido lograr. Junto a su mano, la kusarigama yacía clavada en el barro, limpia, como si hubiera bebido hasta la última gota de sangre.',
      ] },
      { key: 'ruinas', paras: [
        'Buscó su casa. Solo encontró madera quemada. Sus padres estaban donde los había visto caer.',
        'Intentó alejarse del arma gateando, pero la cadena seguía unida a la herida de su brazo. Se movía ligeramente, como si respirara. Intentó arrancársela. No pudo.',
        'La voz volvió, esta vez con una risita burlona:',
        '—No puedes huir de mí. Ya bebí de tu sangre y tú usaste la mía. Ellos murieron porque los dioses así lo quisieron. Tú solo fuiste el instrumento.',
      ] },
      { key: 'partida', paras: [
        'Entonces Kenji recordó las palabras del ronin ciego. Por primera vez se preguntó si aquella marca era realmente una maldición.',
      ] },
      { key: 'partida2', cine: 'O algo mucho peor.' },
      { key: 'camino', paras: [
        'Sin casa a la que volver y sin familia a la que enterrar, se echó la cadena al hombro y caminó hacia los caminos de montaña.',
      ] },
    ],
  },
  {
    id: 3,
    roman: 'III',
    kanji: '冬',
    reading: 'fuyu',
    name: 'Siete inviernos',
    sub: 'Invierno',
    icon: 'snow',
    passages: [
      { key: 'recuento', len: 2, hint: 'El humo de cada barrio y sus farolillos: lo que quedó del valle', paras: [
        'Desde el camino de montaña, Kenji miró el valle por última vez.',
        'Los primeros meses fueron un infierno. Kenji no sabía pelear, pero la kusarigama lo arrastraba cada vez que olía a una criatura que rompía el orden de los dioses. Cruzó pueblos destruidos y bosques olvidados, y se topó con seres que solo conocía por los cuentos de su madre.',
      ] },
      { key: 'viaje', len: 3, hint: 'Sigue bajando para recorrer el viaje', paras: [
        'En un templo abandonado conoció a una kitsune con la apariencia de una niña pequeña. Fue la primera que no lo atacó. Miró la marca de su cuello con lástima y le dijo que esa flor olía a azufre y a castigo divino.',
        'En la cumbre de una montaña nevada se enfrentó a un tengu orgulloso. Antes de que la guadaña lo decapitara, le escupió en la cara: —Los dioses jamás premian a sus perros.',
        'A la orilla de un río seco, un kappa intentó arrastrarlo al fondo. No quería comérselo: quería salvarlo del arma, ahogándolo antes de que fuera demasiado tarde.',
        'Y en una taberna en ruinas, un viejo bakeneko le contó algo que lo persiguió durante años: trescientos años atrás había visto a otro hombre con esa misma marca. Ese hombre había terminado convertido en un monstruo sin memoria.',
      ] },
      { key: 'pesadilla', paras: [
        'Con cada combate, Kenji entendía mejor la pesadilla en la que estaba metido. La kusarigama no era una herramienta mágica: era un fragmento vivo de la crueldad divina. Por las noches, junto a la fogata, la voz no se callaba. Le decía que dejara de llorar por sus padres, que las emociones humanas eran una debilidad, que debía entregarse por completo al arte de matar.',
        'Y funcionaba. Con cada vida que cobraba, el arma se volvía más ligera y él más rápido. Pero a cambio, los rostros de su infancia empezaban a borrársele. Ya no recordaba la voz de su madre, ni el olor del arroz tostado que preparaba su padre. La marca, en cambio, crecía: bajaba por el hombro y se enredaba en el brazo como las raíces de la cadena.',
      ] },
      { key: 'pregunta', paras: [
        'Kenji aceptó su destino, pero no se rindió. Cada vez que tenía a un yokai agonizando bajo su bota, lo sujetaba del cuello y le hacía la misma pregunta: quién le había puesto esa flor, y por qué a él.',
        'Las respuestas llegaban a pedazos, entre esputos de sangre. La marca no era un honor. Era una prisión, creada para encerrar a un espíritu rebelde que alguna vez se atrevió a desafiar el trono de los dioses.',
      ] },
      { key: 'leyenda', paras: [
        'Los años pasaron y el muchacho asustado de Akabana desapareció. La gente empezó a hablar en voz baja del Shinigami del Higanbana: un cazador de mirada muerta que aparecía en los pueblos justo antes de una tragedia. Nadie conocía su nombre. Nadie le ofrecía alojamiento. Nadie lo consideraba un héroe.',
      ] },
      { key: 'invierno', paras: [
        'Una noche de invierno, siete años después del ataque, llegó a una aldea donde los onis ya habían empezado a quemar las casas. La kusarigama tiró de él hacia las bestias, como siempre. Pero entre el humo Kenji vio a una mujer empujando a su hijo dentro de un almacén y atrancando la puerta por fuera.',
      ] },
      { key: 'invierno2', cine: 'Algo se rompió dentro de él. O algo volvió a su sitio.' },
      { key: 'eleccion', paras: [
        'Por primera vez en siete años fue Kenji quien eligió hacia dónde iba la cadena. No hacia las bestias que los dioses querían muertas, sino hacia la puerta del almacén, para protegerla. La voz gritó dentro de su cabeza. La marca le quemó el cuello como la primera noche. Pero el brazo obedeció.',
        'Al amanecer, el niño seguía vivo. Y Kenji, por primera vez en años, recordó algo: la voz de su madre diciendo «no salgas, pase lo que pase».',
        'La voz del arma tardó en hablar. Cuando lo hizo, ya no sonaba burlona.',
      ] },
      { key: 'eleccion2', cine: '—Así empecé yo también.' },
      { key: 'final', paras: [
        'Kenji siguió caminando por el Japón de la era Taishō. Ya no peleaba por obediencia ni por deber divino. Peleaba por los que quedaban detrás de las puertas atrancadas. Y llevaba una pregunta nueva clavada en la cabeza: si el espíritu rebelde que los dioses habían encerrado en la flor era el mismo que ahora le hablaba desde la cadena.',
        'Tarde o temprano encontraría al ser que le grabó esa flor en la carne. Y cuando lo tuviera enfrente, decidiría él, y no los dioses, qué hacer con el poder que le habían dado.',
      ] },
    ],
  },
];

// ---------- Datos (Biblia del proyecto, tablas A, B y C) ----------

// Hora en minutos desde las 22:00. Posición x,y en 0..100 (norte = y 0).
export const BARRIOS = [
  { id: 'akabana', name: 'Akabana', kanji: '赤花', meaning: 'Flor roja', dmg: 80, ignite: 5, hab: 90, dead: 72, hurt: 12, safe: 6, cre: { dragon: 5, oni: 2, yokai: 1, kappa: 0 }, x: 30, y: 20,
    ambient: 'Barrio de Kenji, el más cercano a la montaña. Casas de madera y el almacén de arroz.',
    story: 'Fue el primero en arder. Aquí murieron los padres de Kenji y aquí nació el arma.' },
  { id: 'takegawa', name: 'Takegawa', kanji: '竹川', meaning: 'Río de bambú', dmg: 65, ignite: 15, hab: 70, dead: 49, hurt: 14, safe: 7, cre: { dragon: 3, oni: 1, yokai: 1, kappa: 3 }, x: 68, y: 35,
    ambient: 'Junto al río, rodeado de bambusales.',
    story: 'Los kappas subieron por el río y los dragones quemaron los muelles. En su borde cayeron los dos dragones colosales.' },
  { id: 'hikarizaka', name: 'Hikarizaka', kanji: '光坂', meaning: 'Cuesta de luz', dmg: 50, ignite: 30, hab: 60, dead: 33, hurt: 15, safe: 12, cre: { dragon: 2, oni: 2, yokai: 2, kappa: 0 }, x: 42, y: 50,
    ambient: 'Calle empinada con faroles y el templo.',
    story: 'Los onis bloquearon la cuesta y muchos quedaron atrapados entre el fuego y la subida.' },
  { id: 'tsukimori', name: 'Tsukimori', kanji: '月森', meaning: 'Bosque de la luna', dmg: 35, ignite: 40, hab: 50, dead: 20, hurt: 15, safe: 15, cre: { dragon: 1, oni: 1, yokai: 2, kappa: 1 }, x: 15, y: 66,
    ambient: 'Casas dispersas en el borde del bosque.',
    story: 'Los yokais salieron del bosque. Parte de la gente logró huir entre los árboles.' },
  { id: 'kurokawa', name: 'Kurokawa', kanji: '黒川', meaning: 'Río negro', dmg: 20, ignite: 50, hab: 42, dead: 10, hurt: 12, safe: 20, cre: { dragon: 1, oni: 1, yokai: 1, kappa: 0 }, x: 62, y: 85,
    ambient: 'El barrio más lejano, al sur.',
    story: 'Fue el último en ser alcanzado. La mayoría de su gente logró escapar.' },
];

// Tabla B: criaturas acumuladas en el pueblo y pueblo alcanzado (%) cada 15 minutos.
export const NIGHT = [
  { m: 0, reach: 0, creatures: 4, power: 0 },
  { m: 15, reach: 10, creatures: 12, power: 0 },
  { m: 30, reach: 30, creatures: 21, power: 15 },
  { m: 45, reach: 70, creatures: 27, power: 100 },
  { m: 60, reach: 100, creatures: 30, power: 20 },
];

export const CRIATURAS = [
  { id: 'dragon', name: 'Dragones', kanji: '竜', count: 12, defeated: 2, deaths: 82, how: 'Bajan de las nubes desde las montañas del norte.', look: 'Escamas de hueso bajo un cielo morado. Dos de ellos eran colosales.' },
  { id: 'oni', name: 'Onis', kanji: '鬼', count: 7, defeated: 6, deaths: 42, how: 'Entran por los senderos con antorchas de fuego azul.', look: 'Piel gris, garrotes y fuego azul: el único color frío de la noche.' },
  { id: 'yokai', name: 'Yokais', kanji: '妖', count: 7, defeated: 4, deaths: 38, how: 'Se mueven entre el humo, sin forma fija.', look: 'Siluetas difusas que nadie supo nombrar.' },
  { id: 'kappa', name: 'Kappas', kanji: '河童', count: 4, defeated: 2, deaths: 22, how: 'Suben por el río hacia Takegawa.', look: 'Caparazón y un plato de agua en la cabeza.' },
];

// Tabla C: la marca y la memoria a través de los años.
export const MARCA = [
  { age: 13, marca: 5, memoria: 100, label: 'Toca el lirio' },
  { age: 14, marca: 5, memoria: 100, label: 'La marca duerme' },
  { age: 15, marca: 25, memoria: 90, label: 'El ataque' },
  { age: 16, marca: 32, memoria: 75, label: 'Primeras cacerías' },
  { age: 18, marca: 45, memoria: 55, label: 'Kitsune, tengu, kappa, bakeneko' },
  { age: 20, marca: 58, memoria: 35, label: 'La leyenda' },
  { age: 22, marca: 65, memoria: 20, label: 'Invierno' },
  { age: 22.6, marca: 65, memoria: 30, label: 'Redención' },
];

export const PIEZAS = [
  { id: 'nucleo', name: 'Núcleo Tóxico', desc: 'Sangre y veneno de lirio. El corazón del arma.' },
  { id: 'vascular', name: 'Sistema Vascular', desc: 'Venas que unen la sangre de Kenji con el arma.' },
  { id: 'cadena', name: 'Cadena Carmesí', desc: 'Eslabones orgánicos que se extienden a voluntad.' },
  { id: 'empunadura', name: 'Empuñadura', desc: 'Vendas rituales que aíslan el calor.' },
  { id: 'hoja', name: 'Hoja Carmesí', desc: 'Cuchilla de sangre que regenera sus bordes.' },
  { id: 'relieve', name: 'Relieve del lirio', desc: 'Sello que reacciona con la marca del cuello.' },
];

export const VIAJE = [
  { name: 'Templo abandonado', who: 'Kitsune', kanji: '狐', x: -7, z: 3 },
  { name: 'Montaña nevada', who: 'Tengu', kanji: '天狗', x: -2, z: -4 },
  { name: 'Río seco', who: 'Kappa', kanji: '河童', x: 3.5, z: 1.5 },
  { name: 'Taberna en ruinas', who: 'Bakeneko', kanji: '化猫', x: 8, z: -2.5 },
];

export const hhmm = (m) => {
  const h = 22 + Math.floor(m / 60);
  const mm = Math.floor(m % 60);
  return `${h}:${String(mm).padStart(2, '0')}`;
};

// Interpola una columna de NIGHT para el minuto m.
export function nightAt(m, col) {
  if (m <= 0) return NIGHT[0][col];
  for (let i = 1; i < NIGHT.length; i++) {
    const a = NIGHT[i - 1], b = NIGHT[i];
    if (m <= b.m) return a[col] + (b[col] - a[col]) * ((m - a.m) / (b.m - a.m));
  }
  return NIGHT[NIGHT.length - 1][col];
}
