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
  ['momentos',   'momentos.html'],
  ['colegios',   'colegios.html'],
  ['naturaleza', 'naturaleza.html'],
  ['vivero',     'vivero.html'],
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
  'styles/sections/momentos.css',
  'styles/sections/colegios.css',
  'styles/sections/naturaleza.css',
  'styles/sections/vivero.css',
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
