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
  'index.html',
  // v18 · las seis paginas de profundidad de PLAN-REDISENO-V4 §4.1. Sin
  // ellas aqui, un arreglo publicado en app.js o en una hoja de seccion se
  // quedaria servido desde la cache del navegador hasta 10 minutos en seis
  // de las ocho paginas del sitio — que es exactamente el bug que este
  // script existe para impedir.
  'espacios.html', 'planes.html', 'naturaleza.html',
  'sendero-ecovital.html', 'vivero.html', 'contacto.html',
  'plan-vecino.html', 'colegios.html',
  'condiciones-de-alquiler.html',
  'politica-de-datos.html', 'terminos.html', '404.html',
  // Fragmentos que traen su propia dependencia de js/: el <script src> de
  // momentos/naturaleza/espacios/nosotros y el import() dinámico de hero.
  // Van aquí para que la referencia viaje YA versionada hacia index.html.
  // El cinturón es doble a propósito: al ensamblar, index.html se versiona
  // otra vez —y ése es el que manda—, pero si alguien corre sólo
  // ensamblar.js y publica sin el paso de versionar (el orden ya se rompió
  // una vez, ver arriba), estas rutas llegan igualmente con su ?v=.
  'sections/momentos.html', 'sections/naturaleza.html',
  'sections/espacios.html', 'sections/nosotros.html', 'sections/hero.html',
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

// import('./js/...') dinámico dentro de un <script> en línea — así se monta
// el módulo de partículas del hero (sections/hero.html → index.html). No es
// un atributo src/href, así que RE_REF no lo ve; sin esta cobertura,
// publicar un arreglo de ese módulo dejaría al navegador del cliente
// sirviendo la copia vieja hasta 10 minutos — justo el bug que este script
// existe para impedir. Captura la comilla y el ./ para devolverlos tal cual.
const RE_IMPORT = /\bimport\((['"])(\.\/)?(js\/[^'"?]+)(\?v=[a-f0-9]+)?\1\)/g;

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

  // Misma mecánica exacta que arriba, sobre los import() dinámicos: el hash
  // sale del mismo hashDe (cacheado) y cuenta en los mismos totales.
  doc = doc.replace(RE_IMPORT, (todo, comilla, prefijo, ruta) => {
    const h = hashDe(ruta);
    if (!h) { sinArchivo++; console.log('  *** no existe:', ruta, '(en ' + rel + ')'); return todo; }
    const nuevo = `import(${comilla}${prefijo || ''}${ruta}?v=${h}${comilla})`;
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
