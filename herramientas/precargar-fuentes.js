/* Migra el <head> de cada página para usar las fuentes ALOJADAS EN EL
 * PROPIO SITIO (styles/fonts/*.woff2, declaradas por @font-face en
 * base.css) en vez del <link> a fonts.googleapis.com.
 *
 * POR QUÉ: con Google Fonts, aunque se pidiera display=optional y se
 * precargara el woff2, el navegador seguía dependiendo del round-trip a un
 * servidor externo dentro de la ventana de ~100ms que `optional` da antes
 * de resignarse a la fuente del sistema — y esa ventana seguía fallando. Con
 * el archivo en el propio dominio no hay servidor externo que esperar: el
 * mismo `display: optional` casi nunca llega tarde.
 *
 * Este script:
 *   1. Borra el `<link rel="preconnect">` (x2) y el `<link rel="stylesheet">`
 *      de fonts.googleapis.com — ya no hace falta negociar con Google.
 *   2. Inserta dos `<link rel="preload" as="font">` a los woff2 propios,
 *      justo ANTES del primer `<link rel="stylesheet" href="styles/...">`
 *      (para que empiecen a bajar en el primer instante posible).
 *
 * Es idempotente: si ya migró, no vuelve a tocar la página.
 *
 *   node precargar-fuentes.js            (informe)
 *   node precargar-fuentes.js --escribir
 */
'use strict';
const fs = require('fs');
const path = require('path');

const RAIZ = path.dirname(__dirname);
const ESCRIBIR = process.argv.includes('--escribir');

// Rutas relativas a cada página: todas viven en la raíz del sitio o un
// nivel dentro de sections/, así que "styles/fonts/..." es correcta para
// todas las páginas de nivel superior. Si algún día se versiona el sitio en
// inglés (en/index.html), esa página necesita "../styles/fonts/...".
const FUENTES = [
  'styles/fonts/dm-sans-latin.woff2',
  'styles/fonts/fraunces-latin.woff2',
];

const MARCA = 'fuentes-propias';

const paginas = ['index.html', 'plan-vecino.html', 'condiciones-de-alquiler.html',
                 'politica-de-datos.html', 'terminos.html', '404.html'];

for (const rel of paginas) {
  const abs = path.join(RAIZ, rel);
  if (!fs.existsSync(abs)) { console.log(rel.padEnd(30), 'no existe'); continue; }
  let doc = fs.readFileSync(abs, 'utf8');

  if (doc.includes(MARCA)) { console.log(rel.padEnd(30), 'ya migrada'); continue; }

  // 1. quitar preconnect y stylesheet de Google Fonts (y el bloque de
  //    comentario viejo de la precarga anterior, si quedó de una corrida
  //    previa de este mismo script bajo su nombre antiguo).
  const antes = doc;
  doc = doc.replace(/^[ \t]*<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com"[^>]*>\n/m, '');
  doc = doc.replace(/^[ \t]*<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com"[^>]*>\n/m, '');
  doc = doc.replace(/^[ \t]*<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com\/css2[^"]*"[^>]*>\n/m, '');
  doc = doc.replace(/^[ \t]*<!-- precarga-fuentes:[\s\S]*?-->\n(?:[ \t]*<link rel="preload" as="font"[^>]*fonts\.gstatic\.com[^>]*>\n?){0,2}/m, '');

  if (doc === antes) {
    console.log(rel.padEnd(30), '*** no encontré el <link> de Google Fonts para quitar ***');
  }

  // 2. insertar la precarga local, antes del primer <link rel="stylesheet"
  //    href="styles/...">. 404.html es la única página con rutas absolutas
  //    desde la raíz del dominio (href="/styles/..."): ver LEEME.md, es a
  //    propósito porque GitHub Pages sirve /404.html para cualquier ruta
  //    rota, a cualquier profundidad, y una ruta relativa se rompería.
  const raizAbsoluta = /href="\/styles\//.test(doc);
  const prefijo = raizAbsoluta ? '/' : '';
  const re = new RegExp('^([ \\t]*)<link rel="stylesheet" href="' + prefijo.replace('/', '\\/') + 'styles\\/[^"]+"[^>]*>\\s*$', 'm');
  const m = re.exec(doc);
  if (!m) { console.log(rel.padEnd(30), '*** no encontré ningún <link> a styles/ ***'); continue; }

  const sangria = m[1];
  const bloque =
    `${sangria}<!-- ${MARCA}: Fraunces y DM Sans viven en styles/fonts/ y se declaran\n` +
    `${sangria}     por @font-face en base.css — no hay <link> a fonts.googleapis.com,\n` +
    `${sangria}     ni preconnect a Google. La precarga es lo único que sigue haciendo\n` +
    `${sangria}     falta: hace que el navegador pida el woff2 desde el primer instante,\n` +
    `${sangria}     en paralelo a parsear el CSS, en vez de esperar a descubrir el\n` +
    `${sangria}     @font-face durante el layout. Con display: optional (en base.css) y\n` +
    `${sangria}     el archivo del propio dominio, la fuente casi siempre llega dentro de\n` +
    `${sangria}     la ventana corta que el navegador le da antes de resignarse a la del\n` +
    `${sangria}     sistema — sin swap visible. Se regenera con\n` +
    `${sangria}     herramientas/precargar-fuentes.js. -->\n` +
    FUENTES.map(u =>
      `${sangria}<link rel="preload" as="font" type="font/woff2" crossorigin href="${prefijo}${u}">`
    ).join('\n') + '\n';

  doc = doc.slice(0, m.index) + bloque + doc.slice(m.index);
  console.log(rel.padEnd(30), 'migrada a fuentes propias');
  if (ESCRIBIR) fs.writeFileSync(abs, doc, 'utf8');
}

console.log(ESCRIBIR ? '\n>>> ESCRITO' : '\n>>> simulacion, no se escribio nada');
