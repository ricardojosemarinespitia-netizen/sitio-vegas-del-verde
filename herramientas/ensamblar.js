/* ENSAMBLADOR de index.html — port literal de ensamblar.py a Node.
 *
 * POR QUÉ EXISTE ESTE ARCHIVO
 * El equipo donde se retomó el proyecto no tiene Python instalado, así que
 * `herramientas/ensamblar.py` no se puede ejecutar y sin ensamblador
 * `index.html` se edita a mano — que es justo la regla que más se ha roto
 * aquí. Este port hace EXACTAMENTE lo mismo y deja el mismo byte de salida:
 * mismo orden, mismo bloque de <link>, mismos saltos de línea (LF).
 *
 * Los dos ficheros deben mantenerse en paralelo. Si cambias ORDEN o
 * CSS_SECCIONES en uno, cámbialo en el otro.
 *
 *   node herramientas/ensamblar.js
 */
'use strict';
const fs = require('fs');
const path = require('path');

const RAIZ = path.dirname(__dirname);
const IDX = path.join(RAIZ, 'index.html');

const ORDEN = [
  ['inicio',     'hero.html'],
  ['usos',       'usos.html'],
  ['nosotros',   'nosotros.html'],
  ['planes',     'planes.html'],
  // v7 · #naturaleza («pajareo») ocupa el hueco que dejó #momentos, justo
  // tras #planes — pedido directo del cliente: "en su reemplazo pon
  // pajareo".
  ['naturaleza', 'naturaleza.html'],
  // v15 · #colegios SALE del <main>. Pedido directo y repetido del cliente:
  // no quiere las salidas escolares en el scroll de la ventana principal. El
  // bloque vive ahora en la página suelta colegios.html (raíz), que enlaza su
  // propia hoja; se entra por el carril 05 de #planes y por el nav.
  // sections/colegios.html se conserva como fuente histórica pero YA NO SE
  // ENSAMBLA.
  // v16 · #momentos SALE del <main>. Era una banda de carbón de atmósfera pura
  // —no poseía ni un solo hecho— con cuatro clips de mariposas. El cliente la
  // señaló con nombre propio («ese hero de los videos es asqueroso») y pidió
  // integrar ese metraje en el Sendero. Los cuatro clips viven ahora en el
  // hero de sections/sendero.html; ninguno se pierde y ninguno se duplica.
  // sections/momentos.html y styles/sections/momentos.css se conservan como
  // fuente histórica pero YA NO SE ENSAMBLAN.
  ['vivero',     'vivero.html'],
  // v16 · #sendero: el Sendero Ecovital deja de ser el primer movimiento de
  // #naturaleza y pasa a CERRAR el recorrido, justo debajo de #vivero. Pedido
  // directo del cliente (agosto 2026): «el sendero ecovital es lo último, va
  // debajo de vivero». Las secciones del <main> son bloques contiguos, así que
  // la única forma de que aparezca físicamente después de #vivero es que sea
  // sección propia con su entrada aquí. Se lleva tres hechos de #naturaleza
  // (sendero descrito, entrada $15.000, las dos corrientes de agua); la tabla
  // HECHOS de validar.js y validar.py se actualizó en paralelo.
  ['sendero',    'sendero.html'],
  ['ubicacion',  'ubicacion.html'],
  // v14 · «Nuestro compromiso» deja de ser un bloque dentro de #nosotros y
  // pasa a ser la ÚLTIMA sección del <main>, justo antes del pie. Pedido
  // directo y repetido del cliente. No lleva hoja propia en CSS_SECCIONES:
  // sus reglas viven en styles/sections/nosotros.css §3, con la que comparte
  // todo el vocabulario visual.
  ['compromiso', 'compromiso.html'],
];

const CSS_SECCIONES = [
  'styles/sections/inicio.css',
  'styles/sections/usos.css',
  'styles/sections/nosotros.css',
  'styles/sections/planes.css',
  // v16 · momentos.css sale del <head> con su sección (ver ORDEN).
  // v15 · colegios.css sale del <head> de index.html con su sección: ahora se
  // enlaza directo desde colegios.html, la única página que lo usa.
  'styles/sections/naturaleza.css',
  'styles/sections/vivero.css',
  // v16 · sendero.css DESPUÉS de naturaleza.css, y no es indiferente: la
  // sección #sendero reutiliza tal cual el bloque .nat-apertura de la hoja de
  // naturaleza, así que si alguna vez hay que matizar una regla heredada se
  // hace desde aquí, sin subir especificidad y sin un solo !important.
  'styles/sections/sendero.css',
  'styles/sections/ubicacion.css',
  'styles/sections/pie.css',
];

const morir = m => { console.error('ERROR: ' + m); process.exit(1); };
// Se normaliza a LF al leer: los fragmentos están guardados con CRLF y el
// index con LF; sin esto el ensamblado mezcla finales de línea.
const leer = p => fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

const original = leer(IDX);

/* ------------------------------------------------------------- 1. cabeza */
const iHead = original.indexOf('<!DOCTYPE html>');
if (iHead < 0) morir('index.html no empieza por <!DOCTYPE html>.');
const iBody = original.indexOf('<body>') + '<body>'.length;
let cabeza = original.slice(iHead, iBody);

/* ---------------------------------------------- 2. <head>: hojas de sección */
const reLinks = /^[ \t]*<link rel="stylesheet" href="styles\/sections\/[^"]+">\n/gm;
const linksSec = cabeza.match(reLinks);
if (!linksSec) morir('no encontré ningún <link> de styles/sections/ en el <head>.');

const antes = linksSec.map(l => /href="([^"]+)"/.exec(l)[1]);

// Igual que en el original: primero se BORRAN todas y sólo después se inserta
// el bloque nuevo. Sustituir una por una hace que el replace encuentre su
// coincidencia dentro del bloque recién insertado y se coma la línea buena.
const iIns = cabeza.indexOf(linksSec[0]);
for (const l of linksSec) cabeza = cabeza.replace(l, '');
const bloque = CSS_SECCIONES.map(h => `<link rel="stylesheet" href="${h}">\n`).join('');
cabeza = cabeza.slice(0, iIns) + bloque + cabeza.slice(iIns);

const borradas = antes.filter(h => !CSS_SECCIONES.includes(h));
const anadidas = CSS_SECCIONES.filter(h => !antes.includes(h));
const reordenadas =
  JSON.stringify(CSS_SECCIONES.filter(h => antes.includes(h))) !==
  JSON.stringify(antes.filter(h => CSS_SECCIONES.includes(h)));

/* ----------------------------------------------------------- 3. cabecera */
const cabecera = leer(path.join(RAIZ, 'sections', '_header.html')).replace(/\n+$/, '');

/* --------------------------------------------------------------- 4. main */
const partes = [];
for (const [ancla, arch] of ORDEN) {
  const frag = leer(path.join(RAIZ, 'sections', arch)).replace(/^\n+|\n+$/g, '');
  const m = /<section[^>]*\bid="([^"]+)"/.exec(frag);
  if (!m) morir(`${arch} no abre con un <section id=...>`);
  if (m[1] !== ancla) morir(`${arch} trae id="${m[1]}" y el orden pide "${ancla}"`);
  partes.push(frag);
}
const main = '<main id="contenido">\n' + partes.join('\n\n') + '\n</main>';

/* ---------------------------------------------------------------- 5. pie */
const pie = leer(path.join(RAIZ, 'sections', '_footer.html')).replace(/\n+$/, '');

/* ------------------------------------------------------------ 6. scripts */
const iCierre = original.lastIndexOf('</footer>') + '</footer>'.length;
const cola = original.slice(iCierre);

const nuevo = cabeza + '\n' + cabecera + '\n' + main + '\n' + pie + cola;
fs.writeFileSync(IDX, nuevo, 'utf8');

console.log('ENSAMBLADO OK');
console.log('  secciones en <main>: %d -> %s', ORDEN.length, ORDEN.map(o => o[0]).join(' -> '));
console.log('  hojas borradas del <head>: %s', borradas.join(', ') || 'ninguna');
console.log('  hojas anadidas al <head> : %s', anadidas.join(', ') || 'ninguna');
console.log('  orden del <head> reescrito: %s', reordenadas ? 'si' : 'ya estaba bien');
console.log('  lineas: %d -> %d',
  original.split('\n').length, nuevo.split('\n').length);
