/* VALIDADOR de index.html — port de validar.py a Node.
 *
 * POR QUÉ EXISTE: el equipo donde se retomó el proyecto no tiene Python, y sin
 * validador nadie comprueba la tabla de propiedad de ARQUITECTURA-V3 después de
 * tocar una sección. Mismas siete comprobaciones y mismo código de salida que
 * el original (0 limpio, 1 con hallazgos), para poder encadenarlo:
 *
 *   node herramientas/ensamblar.js && node herramientas/validar.js
 *
 * Mantener en paralelo con validar.py: si cambia la tabla HECHOS en uno,
 * cambia en el otro.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const RAIZ = path.dirname(__dirname);
const doc = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8').replace(/\r\n/g, '\n');

/* ------------------------------------------------------------- utilidades */
const sinComentarios = s => s.replace(/<!--[\s\S]*?-->/g, ' ');
const RE_ANCLA = /<a\b[^>]*>[\s\S]*?<\/a>/gi;
const RE_OPTION = /<option\b[^>]*>[\s\S]*?<\/option>/gi;

// minúsculas y sin tildes, para que «Baños» y «banos» sean el mismo grep
const normaliza = s =>
  s.toLowerCase().normalize('NFD').replace(/\p{Mn}/gu, '').replace(/[ \s]+/g, ' ');

const cuenta = (texto, patron) => {
  const m = texto.match(new RegExp(patron, 'g'));
  return m ? m.length : 0;
};

/* ============================================================ 0. TROCEADO */
const iBody = doc.indexOf('<body>');
const iMain = doc.indexOf('<main id="contenido">');
const iFin = doc.indexOf('</main>');
if (iBody < 0 || iMain < 0 || iFin < 0) {
  console.error('ERROR: no encuentro <body>, <main id="contenido"> o </main>.');
  process.exit(1);
}

const regiones = {};
regiones.cabecera = doc.slice(iBody, iMain);
regiones.pie = doc.slice(iFin);

const cuerpoMain = doc.slice(iMain, iFin);
const trozos = cuerpoMain.split(/^<\/section>[ \t]*$/m);
const ordenReal = [];
for (const t of trozos) {
  const m = /^<section\b[^>]*\bid="([^"]+)"/m.exec(t);
  if (!m) continue;
  ordenReal.push(m[1]);
  regiones[m[1]] = t.slice(m.index);
}

const ESPERADO = ['inicio', 'usos', 'nosotros', 'planes',
                  // v7 · #naturaleza reemplaza a #momentos justo tras
                  // #planes; #momentos y #colegios se corren un puesto.
                  // v15 · #colegios sale del <main>: es la página suelta
                  // colegios.html, que este validador no cubre (igual que
                  // plan-vecino.html o condiciones-de-alquiler.html).
                  // v16 · #momentos sale del <main>: sus cuatro clips son
                  // ahora el hero de #sendero, que es sección propia y CIERRA
                  // el recorrido justo debajo de #vivero (pedido directo del
                  // cliente).
                  'naturaleza', 'vivero', 'sendero', 'ubicacion',
                  // v14 · el compromiso cierra el recorrido, después de cómo
                  // llegar y justo antes del pie.
                  'compromiso'];

const raya = '='.repeat(74);
console.log(raya);
console.log('0. ORDEN DEL <main>');
console.log('   esperado : ' + ESPERADO.join(' -> '));
console.log('   real     : ' + ordenReal.join(' -> '));
const ordenOk = JSON.stringify(ordenReal) === JSON.stringify(ESPERADO);
console.log('   veredicto: ' + (ordenOk ? 'OK' : '*** NO COINCIDE ***'));

/* ========================================= a) TABLA DE PROPIEDAD (hechos) */
const NADIE = '(ninguna seccion de index.html)';
const HECHOS = [
 ['Tagline «Oasis para la recreacion y el bienestar»', ['inicio','pie'], ['oasis para la recreacion'], false],
 ['«Cuatro hectareas» (tamano del predio)', ['inicio'], ['\\bcuatro hectareas\\b','\\b4 hectareas\\b','\\b4 ?ha\\b'], false],
 ['«A 10 minutos» (promesa de cercania)', ['inicio'], ['\\ba (10|diez) minutos\\b'], false],
 ['«Nosotros ponemos los arboles»', ['inicio'], ['ponemos los arboles'], false],
 ['Refugio privado, cerrado y vigilado', ['nosotros'], ['bullicio urbano'], false],
 // v14 · los dos hechos del compromiso cambian de DUEÑO, no de contenido: la
 // banda salió de #nosotros y es ahora la sección #compromiso, la última del
 // <main>. Siguen escritos una sola vez en todo el sitio.
 ['Compromiso «conexion y aprendizaje conjunto»', ['compromiso'], ['aprendizaje conjunto'], false],
 ['Los tres pilares', ['compromiso'], ['educacion ambiental','conciencia social','relaciones sanas'], false],
 ['Servicios del predio (Wifi/Banos/Vigilancia/Parqueadero)', ['nosotros'], ['\\bwifi\\b','vigilancia privada','\\bparqueadero\\b'], false],
 ['«Proximamente: arenero»', ['nosotros'], ['\\barenero\\b'], false],
 ['Aforo Alameda 150', ['usos'], ['\\b150 personas\\b'], false],
 ['Aforo La Vega 100', ['usos'], ['\\b100 personas\\b'], false],
 ['Aforo Teatrino 70', ['usos'], ['\\b70 personas\\b'], false],
 ['Aforo Taller 45', ['usos'], ['\\b45 personas\\b'], false],
 ['Aforo Cancha 30/20', ['usos'], ['\\b30 jugadores\\b','\\b20 espectadores\\b'], false],
 ['Alquiler base de 4 horas / hora adicional', [NADIE], ['\\b(cuatro|4) horas\\b','hora adicional'], false],
 ['Sillas y mesas Rimax', [NADIE], ['\\brimax\\b'], false],
 ['No incluye sonido / catering externo', [NADIE], ['\\bcatering\\b','no incluye sonido'], false],
 // v15 · los tres hechos de la oferta escolar cambian de dueno a NADIE, no de
 // contenido: viven enteros en colegios.html, que es una pagina suelta y este
 // validador solo lee index.html. Se quedan en la tabla —en vez de borrarse—
 // para que siga vigilada la otra mitad de la regla: que ninguna seccion de
 // index.html los vuelva a escribir.
 ['Observatorios como parada pedagogica', [NADIE], ['observatorio'], true],
 ['Jardin de polinizadores y mariposas', [NADIE], ['polinizador','avistamiento de mariposas','jardin de mariposas'], true],
  // v16 · los tres hechos del Sendero cambian de DUENO, no de contenido:
 // el bloque se mudo entero a la seccion #sendero, que cierra el <main>
 // debajo de #vivero. Siguen escritos una sola vez en todo el sitio.
 ['Sendero Ecovital (descrito)', ['sendero'], ['sendero'], true],
 ['Entrada $15.000 (unico precio publicado)', ['sendero'], ['15\\.000','15000'], false],
 ['Quebrada Aranzoque y riachuelo La Florida', ['sendero'], ['aranzoque','riachuelo'], false],
 ['101 especies de aves', ['naturaleza'], ['\\b101\\b'], false],
 ['Chachalaca Colombiana endemica', ['naturaleza'], ['chachalaca','ortalis columbiana'], false],
 ['7 especies migratorias boreales', ['naturaleza'], ['\\b(7|siete) especies migratorias\\b','migratorias boreales'], false],
 ['347 plantas y 20 familias botanicas', ['naturaleza'], ['\\b347\\b','\\b20 familias\\b'], false],
 ['Concurso: 57 fotografias de 20 autores', ['naturaleza'], ['\\b57 (fotografias|imagenes|obras)\\b','\\b20 autores\\b'], false],
 ['Vivero: produccion y venta de plantas / abonos', ['vivero'], ['\\babonos?\\b'], false],
 ['Mantenimiento de jardines y poda', ['vivero'], ['poda de arboles'], false],
 ['Registro ICA, Resolucion 00000819', ['vivero'], ['\\bica\\b','00000819'], false],
 ['Direccion: Vereda Rio Frio / via Carabineros', ['ubicacion'], ['vereda rio frio','via carabineros'], false],
 ['Coordenadas 7.0574425, -73.1144128', ['ubicacion'], ['7\\.0574425','-?73\\.1144128'], false],
 ['Cercanias y Anillo Vial', ['ubicacion','inicio'], ['anillo vial'], false],
 ['«Area Metropolitana de Bucaramanga»', ['ubicacion'], ['area metropolitana'], false],
 ['Horario 6:00 a.m. - 10:00 p.m.', ['ubicacion'], ['6:00 a','10:00 p','lunes a domingo'], false],
 ['Telefono +57 316 675 8362 escrito en pantalla', ['ubicacion'], ['316 675 8362'], false],
 ['Correo vegasdelverde.1@gmail.com', ['ubicacion'], ['vegasdelverde\\.1@gmail\\.com'], false],
 ['Instagram @vegasdelverde', ['ubicacion','pie'], ['@vegasdelverde'], false],
 ['«No hay reservas en linea»', ['ubicacion'], ['no hay reservas'], false],
 ['Razon social 4 Family S.A.S. / NIT', ['pie'], ['4 family','901\\.391\\.144'], false],
 ['Frases poeticas de marca (separadores a sangre)', [NADIE],
  ['tu proximo plan no es en un salon','planes distintos, mas atrevidos',
   'el ruido mas fuerte es un pajaro','no es el mismo bosque en marzo'], false],
 ['Rotulo «Reserva tu escape»', ['inicio'], ['reserva tu escape'], false],
 ['Rotulo «Ver eventos y actividades»', ['nosotros'], ['ver eventos y actividades'], false],
 ['Rotulo «Quiero este plan»', [NADIE], ['quiero este plan'], false],
 ['Rotulo «Atrevete a un plan distinto»', ['planes'], ['atrevete a un plan distinto'], false],
 ['Rotulo «Vengo con mi curso»', [NADIE], ['vengo con mi curso'], false],
 ['Rotulo «Atrevete al sendero»', ['sendero'], ['atrevete al sendero'], false],
 ['Rotulo «Quiero plantas del vivero»', ['vivero'], ['quiero plantas del vivero'], false],
 ['Rotulo «Hablemos por WhatsApp»', ['ubicacion'], ['hablemos por whatsapp'], false],
 ['Rotulo «Escribenos por WhatsApp»', ['cabecera'], ['escribenos por whatsapp'], false],
];

// Atributos que no lee ninguna persona: son ganchos de CSS y JS. Sin retirarlos,
// una clase como .inicio__ancla-item--sendero contaría como si la sección
// hubiera escrito «Sendero» en pantalla. Se conserva lo que se lee o se oye:
// texto, alt, title, aria-label y placeholder.
const RE_MAQUINA = new RegExp(
  '\\s(?:class|id|href|src|srcset|poster|for|form|name|type|rel|role|loading|' +
  'decoding|fetchpriority|preload|playsinline|muted|loop|target|hreflang|' +
  'lang|width|height|viewBox|d|' +
  'aria-labelledby|aria-controls|aria-describedby|data-[a-z-]*)="[^"]*"', 'gi');

const txtRaw = {}, txt = {}, txtSinEnlaces = {};
for (const [k, v] of Object.entries(regiones)) {
  const limpio = sinComentarios(v);
  txtRaw[k] = normaliza(limpio);
  const visible = limpio.replace(RE_MAQUINA, ' ');
  txt[k] = normaliza(visible);
  txtSinEnlaces[k] = normaliza(visible.replace(RE_ANCLA, ' ').replace(RE_OPTION, ' '));
}

const repeticiones = [];
console.log('\n' + raya);
console.log('a) TABLA DE PROPIEDAD — un hecho, un dueno');
for (const [hecho, duenos, patrones, enlaceOk] of HECHOS) {
  const intrusas = [];
  for (const reg of Object.keys(regiones)) {
    const base = enlaceOk === 'raw' ? txtRaw[reg] : enlaceOk ? txtSinEnlaces[reg] : txt[reg];
    const n = patrones.reduce((a, p) => a + cuenta(base, p), 0);
    if (n === 0 || duenos.includes(reg)) continue;
    intrusas.push(`${reg}(${n})`);
  }
  if (intrusas.length) {
    repeticiones.push({ hecho, secciones: intrusas });
    console.log('  FUERA DE SITIO  ' + hecho.slice(0, 52).padEnd(52) + ' -> ' + intrusas.join(', '));
  }
}
console.log(`  hechos vigilados: ${HECHOS.length}   ·   hechos fuera de su dueno: ${repeticiones.length}`);

/* ==================================================== b) ANCLAS INTERNAS */
const sinCom = sinComentarios(doc);
const idsTodos = [...sinCom.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
const ids = new Set(idsTodos);
const anclas = [...sinCom.matchAll(/href="#([^"]+)"/g)].map(m => m[1]);
const rotos = [...new Set(anclas.filter(a => a && !ids.has(a)).map(a => '#' + a))].sort();
const conteoIds = {};
idsTodos.forEach(i => { conteoIds[i] = (conteoIds[i] || 0) + 1; });
const dupIds = Object.keys(conteoIds).filter(i => conteoIds[i] > 1).sort();

console.log('\n' + raya);
console.log('b) ANCLAS INTERNAS');
console.log(`   href="#x" distintos: ${new Set(anclas).size}   ·   id= distintos: ${ids.size}`);
console.log(`   anclas muertas: ${rotos.length} ${rotos.length ? JSON.stringify(rotos) : ''}`);
console.log(`   ids duplicados: ${dupIds.length} ${dupIds.length ? JSON.stringify(dupIds) : ''}`);

/* ============================================ c) RECURSOS INTERNOS */
const EXCEPCION = new Set(['video/hero.mp4']);
const recursos = new Set();
for (const m of sinCom.matchAll(/(?:src|href|poster|data-src)="([^"]+)"/g)) {
  const u = m[1].trim();
  if (!u || /^(#|https?:\/\/|mailto:|tel:|data:|\/\/|javascript:)/.test(u)) continue;
  recursos.add(u.split('#')[0].split('?')[0]);
}
const faltan = [...recursos]
  .filter(u => !EXCEPCION.has(u) && !fs.existsSync(path.join(RAIZ, u.split('/').join(path.sep))))
  .sort();
const exc = [...recursos].filter(u => EXCEPCION.has(u)).sort();
console.log('\n' + raya);
console.log('c) RECURSOS INTERNOS');
console.log(`   rutas internas distintas: ${recursos.size}`);
console.log(`   presentes en disco      : ${recursos.size - faltan.length - exc.length}`);
console.log(`   excepcion pactada       : ${exc.join(', ')}`);
console.log(`   NO EXISTEN              : ${faltan.length} ${faltan.length ? JSON.stringify(faltan) : ''}`);

/* ====================================== d) BALANCE DE ETIQUETAS */
const VACIAS = new Set(['area','base','br','col','embed','hr','img','input','link','meta',
  'param','source','track','wbr','path','circle','rect','line','polyline','polygon',
  'ellipse','stop','use']);
const sinSc = sinCom.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '');
const pila = [], desbalance = [];
for (const m of sinSc.matchAll(/<(\/?)([a-zA-Z][a-zA-Z0-9-]*)\b[^>]*?(\/?)>/g)) {
  const cierre = m[1], tag = m[2].toLowerCase(), auto = m[3];
  if (VACIAS.has(tag) || auto === '/') continue;
  if (!cierre) pila.push([tag, m.index]);
  else if (pila.length && pila[pila.length - 1][0] === tag) pila.pop();
  else desbalance.push(`</${tag}> sin apertura en offset ${m.index}`);
}
for (const [tag, off] of pila) desbalance.push(`<${tag}> sin cierre en offset ${off}`);
console.log('\n' + raya);
console.log('d) BALANCE DE ETIQUETAS (comentarios, script y style excluidos)');
console.log(`   desbalances: ${desbalance.length}`);
desbalance.slice(0, 15).forEach(d => console.log('     ' + d));

/* ====================================== e) PROHIBICIONES DURAS */
const nEco = cuenta(doc.toLowerCase(), 'ecoposada');
const nModal = cuenta(doc.toLowerCase(), 'data-modal');
console.log('\n' + raya);
console.log('e) PROHIBICIONES DURAS');
console.log(`   «ecoposada» : ${nEco}   ·   «data-modal» : ${nModal}`);

/* ============================ f) UN ARCHIVO, UN PAPEL */
const usos = {};
for (const reg of ordenReal) {
  for (const m of sinComentarios(regiones[reg]).matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g)) {
    (usos[m[1]] = usos[m[1]] || []).push(reg);
  }
}
const repes = Object.entries(usos).filter(([, v]) => v.length > 1);
console.log('\n' + raya);
console.log('f) UN ARCHIVO, UN PAPEL');
console.log(`   <img> distintos en el <main>: ${Object.keys(usos).length}   ·   repetidos: ${repes.length}`);
repes.sort().forEach(([k, v]) => console.log('     ' + k.padEnd(44) + ' ' + JSON.stringify(v)));

// El vídeo se cuenta aparte y sin excepciones: un clip repetido se nota mucho
// más que una foto, porque se mueve.
const usosV = {};
for (const reg of ordenReal) {
  const limpio = sinComentarios(regiones[reg]);
  for (const m of limpio.matchAll(/<source\b[^>]*\bsrc="([^"]+\.(?:mp4|webm))"/g)) {
    const k = m[1].replace(/\.(mp4|webm)$/, '');
    (usosV[k] = usosV[k] || []).push(reg);
  }
  for (const m of limpio.matchAll(/\bposter="([^"]+)"/g)) {
    (usosV[m[1]] = usosV[m[1] ] || []).push(reg);
  }
}
Object.keys(usosV).forEach(k => { usosV[k] = [...new Set(usosV[k])].sort(); });
const repesV = Object.entries(usosV).filter(([, v]) => v.length > 1);
console.log(`   clips y posters distintos   : ${Object.keys(usosV).length}   ·   repetidos: ${repesV.length} ${repesV.length ? '  *** REVISAR ***' : ''}`);
repesV.sort().forEach(([k, v]) => console.log('     ' + k.padEnd(44) + ' ' + JSON.stringify(v)));

/* ============================ g) HIGIENE DE CSS EN EL HTML */
const cuerpo = sinComentarios(doc.slice(iBody));
const hexLit = [...cuerpo.matchAll(/(?<!&)#[0-9a-fA-F]{3,8}\b(?=[;'"\s)])/g)].map(m => m[0]);
console.log('\n' + raya);
console.log('g) HIGIENE (dentro de <body>, sin comentarios)');
console.log(`   !important            : ${cuenta(cuerpo, '!important')}`);
console.log(`   atributos style=      : ${cuenta(cuerpo, '\\bstyle="')}`);
console.log(`   font-family en el HTML: ${cuenta(cuerpo, 'font-family')}`);
console.log(`   colores literales     : ${hexLit.length} ${JSON.stringify([...new Set(hexLit)].sort().slice(0, 6))}`);
console.log(`   Lorem Ipsum           : ${cuenta(doc.toLowerCase(), 'lorem ipsum')}`);

/* --------------------------------------------------------- resultado */
const todo = ordenOk && !repeticiones.length && !rotos.length && !dupIds.length
  && !faltan.length && !desbalance.length && !nEco && !nModal;
console.log('\n' + raya);
console.log('VEREDICTO GLOBAL: ' + (todo ? 'TODO LIMPIO' : 'HAY HALLAZGOS (ver arriba)'));
process.exit(todo ? 0 : 1);
