/* Inserta la precarga de los dos archivos woff2 latinos justo ANTES del
 * <link> de Google Fonts, en todas las páginas que lo cargan.
 *
 * POR QUÉ: la hoja de Google va con `display=swap`, así que el navegador
 * pinta el texto con la fuente del sistema y lo cambia cuando llega la real.
 * Ese cambio es un parpadeo visible en toda la página. Precargando los woff2
 * llegan antes del primer pintado y el cambio no se ve.
 *
 *   node precargar-fuentes.js            (informe)
 *   node precargar-fuentes.js --escribir
 */
'use strict';
const fs = require('fs');
const path = require('path');

const RAIZ = path.dirname(__dirname);
const ESCRIBIR = process.argv.includes('--escribir');

// Subconjunto «latin» de cada familia: el que cubre el español entero
// (incluye ñ, tildes, ¿, ¡, «», y los signos de 2000-206F).
const FUENTES = [
  'https://fonts.gstatic.com/s/dmsans/v17/rP2Hp2ywxg089UriCZOIHQ.woff2',
  'https://fonts.gstatic.com/s/fraunces/v38/6NUV8FyLNQOQZAnv9ZwIlOk.woff2',
];

const MARCA = 'precarga-fuentes';

const paginas = ['index.html', 'plan-vecino.html', 'condiciones-de-alquiler.html',
                 'politica-de-datos.html', 'terminos.html', '404.html'];

for (const rel of paginas) {
  const abs = path.join(RAIZ, rel);
  if (!fs.existsSync(abs)) { console.log(rel.padEnd(30), 'no existe'); continue; }
  let doc = fs.readFileSync(abs, 'utf8');

  if (doc.includes(MARCA)) { console.log(rel.padEnd(30), 'ya la tenía'); continue; }

  // localizar la línea del <link> de Google Fonts y su sangría
  const re = /^([ \t]*)<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com\/css2[^"]*"[^>]*>\s*$/m;
  const m = re.exec(doc);
  if (!m) { console.log(rel.padEnd(30), '*** no encontré el <link> de fuentes ***'); continue; }

  const sangria = m[1];
  const bloque =
    `${sangria}<!-- ${MARCA}: la hoja de Google va con display=swap, así que sin esto\n` +
    `${sangria}     el texto se pinta con la fuente del sistema y SALTA a la real cuando\n` +
    `${sangria}     llega — un parpadeo visible en toda la página. Precargados, los dos\n` +
    `${sangria}     woff2 del subconjunto latino llegan antes del primer pintado y el\n` +
    `${sangria}     cambio no se ve. Si Google versiona los archivos estas URLs darán 404:\n` +
    `${sangria}     no rompe nada (la hoja sigue trayendo los suyos), sólo vuelve el\n` +
    `${sangria}     parpadeo. Se regeneran con herramientas/precargar-fuentes.js. -->\n` +
    FUENTES.map(u =>
      `${sangria}<link rel="preload" as="font" type="font/woff2" crossorigin href="${u}">`
    ).join('\n') + '\n';

  doc = doc.slice(0, m.index) + bloque + doc.slice(m.index);
  console.log(rel.padEnd(30), 'precarga insertada');
  if (ESCRIBIR) fs.writeFileSync(abs, doc, 'utf8');
}

console.log(ESCRIBIR ? '\n>>> ESCRITO' : '\n>>> simulacion, no se escribio nada');
