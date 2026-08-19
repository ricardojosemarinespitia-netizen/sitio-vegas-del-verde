/* Le pone a cada <script src="js/...">, <link href="styles/..."> y
 * <link rel="icon" href="img/...">/<img> LOCAL un `?v=<hash>` con el hash
 * de contenido del archivo referenciado.
 *
 * POR QUÉ EXISTE: GitHub Pages sirve los .js y .css con
 * `Cache-Control: max-age=600`. Publicar un arreglo y decirle al cliente
 * «recárgalo» no basta: su navegador puede seguir sirviendo la copia vieja
 * desde caché hasta 10 minutos, y un recargo normal (no Ctrl+Shift+R) ni
 * siquiera vuelve a preguntarle al servidor. Eso fue justo lo que pasó con
 * el arreglo del vuelo de las mariposas: estaba publicado y el navegador
 * del cliente lo ignoró.
 *
 * El hash sale del CONTENIDO del archivo, no de la fecha ni de git: cambia
 * sólo cuando el archivo cambia de verdad, así que un archivo que no se
 * tocó conserva su URL y su caché sigue sirviendo (rápido, correcto);
 * el que sí cambió fuerza una URL nueva y el navegador está OBLIGADO a
 * pedirlo de nuevo sin importar el max-age.
 *
 * CUÁNDO CORRERLO: después de herramientas/ensamblar.js, porque ese script
 * reescribe el bloque de <link> de styles/sections/*.css en index.html SIN
 * versión — si se corre este script antes, ensamblar.js borra las versiones
 * que acababa de poner.
 *
 *   node herramientas/ensamblar.js
 *   node herramientas/versionar-assets.js --escribir
 *   node herramientas/validar.js
 *
 *   node herramientas/versionar-assets.js            (informe, no escribe)
 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const RAIZ = path.dirname(__dirname);
const ESCRIBIR = process.argv.includes('--escribir');

const PAGINAS = [
  'index.html', 'plan-vecino.html', 'condiciones-de-alquiler.html',
  'politica-de-datos.html', 'terminos.html', '404.html',
  'sections/momentos.html', 'sections/naturaleza.html',
];

const hashCache = new Map();
function hashDe(relRuta) {
  if (hashCache.has(relRuta)) return hashCache.get(relRuta);
  const abs = path.join(RAIZ, relRuta);
  if (!fs.existsSync(abs)) return null;
  const h = crypto.createHash('sha1').update(fs.readFileSync(abs)).digest('hex').slice(0, 8);
  hashCache.set(relRuta, h);
  return h;
}

// src="js/..." o href="styles/..." — sólo rutas locales, nunca las de
// fonts.googleapis.com ni ninguna otra externa.
const RE_REF = /\b(src|href)="(js\/[^"?]+|styles\/[^"?]+)(\?v=[a-f0-9]+)?"/g;

let totalTocados = 0, totalIntactos = 0, totalSinArchivo = 0;

for (const rel of PAGINAS) {
  const abs = path.join(RAIZ, rel);
  if (!fs.existsSync(abs)) continue;
  let doc = fs.readFileSync(abs, 'utf8');
  let tocados = 0, intactos = 0, sinArchivo = 0;

  doc = doc.replace(RE_REF, (todo, attr, ruta) => {
    const h = hashDe(ruta);
    if (!h) { sinArchivo++; console.log('  *** no existe:', ruta, '(en ' + rel + ')'); return todo; }
    const nuevo = `${attr}="${ruta}?v=${h}"`;
    if (nuevo === todo) intactos++; else tocados++;
    return nuevo;
  });

  totalTocados += tocados; totalIntactos += intactos; totalSinArchivo += sinArchivo;
  if (tocados || intactos) {
    console.log(rel.padEnd(28), 'versionados=' + (tocados + intactos), tocados ? '(' + tocados + ' actualizados)' : '(sin cambios)');
  }
  if (ESCRIBIR && tocados) fs.writeFileSync(abs, doc, 'utf8');
}

console.log('\nTOTAL  actualizados=' + totalTocados, ' ya al día=' + totalIntactos, ' rutas rotas=' + totalSinArchivo);
console.log(ESCRIBIR ? '>>> ESCRITO' : '>>> simulacion, no se escribio nada');
