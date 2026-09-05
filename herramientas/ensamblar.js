/* ENSAMBLADOR del sitio — port literal de ensamblar.py a Node.
 *
 * POR QUÉ EXISTE ESTE ARCHIVO
 * El equipo donde se retomó el proyecto no tiene Python instalado, así que
 * `herramientas/ensamblar.py` no se puede ejecutar y sin ensamblador el HTML
 * se edita a mano — que es justo la regla que más se ha roto aquí. Este port
 * hace EXACTAMENTE lo mismo y deja el mismo byte de salida: mismo orden,
 * mismo bloque de <link>, mismos saltos de línea (LF).
 *
 * Los dos ficheros deben mantenerse en paralelo. Si cambias PAGINAS en uno,
 * cámbialo en el otro.
 *
 * v18 · DE UNA PÁGINA A OCHO -----------------------------------------------
 * Hasta v17 este script sólo sabía ensamblar index.html: una lista ORDEN y
 * una lista CSS_SECCIONES, las dos sueltas en el módulo. El PLAN-REDISENO-V4
 * §4.1 parte el sitio en «escaparate + profundidad» —la portada se queda en
 * nueve bloques cortos y las seis secciones largas se van cada una a su URL—
 * así que ahora hay OCHO documentos que ensamblar con el mismo par de
 * fragmentos compartidos (_header.html y _footer.html).
 *
 * La mecánica por documento NO cambió ni una línea: se conserva la cabeza
 * hasta <body>, se reescribe el bloque de <link rel="stylesheet"
 * href="styles/sections/..."> del <head>, se inserta la cabecera, se pegan
 * las secciones dentro de <main id="contenido">, se inserta el pie y se
 * conserva TAL CUAL todo lo que venga después de </footer> (los <script> de
 * cola, que son distintos en cada página).
 *
 * Consecuencia práctica: para tocar el orden de la portada o el contenido de
 * una página interior se edita PAGINAS aquí, nunca el .html.
 *
 *   node herramientas/ensamblar.js
 */
'use strict';
const fs = require('fs');
const path = require('path');

const RAIZ = path.dirname(__dirname);

/* ==========================================================================
   EL MAPA DEL SITIO
   --------------------------------------------------------------------------
   Cada entrada es un documento HTML de la raíz:
     archivo : el .html que se reescribe (tiene que existir ya, con su <head>,
               su <body>, un <link> de styles/sections/ cualquiera, un
               </footer> y su cola de <script>).
     orden   : pares [ancla, fragmento] que se pegan dentro del <main>. El id
               del <section> del fragmento tiene que coincidir con el ancla:
               si no, el ensamblado se aborta antes de escribir nada.
     css     : las hojas de styles/sections/ que esa página enlaza, EN ORDEN.
               El orden importa: una hoja que matiza reglas heredadas de otra
               tiene que ir después (el caso conocido es sendero.css, que
               reutiliza .nat-apertura de naturaleza.css).

   colegios.html, plan-vecino.html, condiciones-de-alquiler.html,
   politica-de-datos.html, terminos.html y 404.html NO están aquí: son
   páginas escritas a mano de un solo bloque, sin fragmentos que ensamblar.
   ========================================================================== */
const PAGINAS = [

  /* ---------------------------------------------------------------- HOME */
  /* v18 · LA PORTADA ES AHORA UN ESCAPARATE, no el sitio entero.
     Medía 37 pantallas de móvil y 2,9 MB (PLAN-REDISENO-V4 §1). Las seis
     secciones largas —usos, planes, naturaleza, sendero, vivero y
     ubicación— se mudaron íntegras, sin tocar una clase ni una hoja, a sus
     páginas. En su sitio entran seis bloques cortos nuevos (sections/home-*)
     que enseñan una muestra y enlazan.

     Lo que NO se movió y por qué:
       · #inicio      el hero es la portada; no tiene página adonde ir.
       · #nosotros    1,3 pantallas ya medidas: cabe entero, y es el «quiénes
                      somos» que el plan §4.2 pide en el bloque 7.
       · #compromiso  va pegado a #nosotros porque el plan los fusiona en un
                      solo bloque; se dejan como dos <section> contiguas para
                      no reabrir su composición ni su hoja (nosotros.css §3).

     El orden es exactamente la tabla «home pantalla por pantalla» del §4.2:
     hero · qué hacer · espacios · naturaleza · sendero · vivero ·
     nosotros+compromiso · contacto. */
  {
    archivo: 'index.html',
    orden: [
      ['inicio',     'hero.html'],
      ['planes',     'home-planes.html'],
      ['espacios',   'home-espacios.html'],
      ['naturaleza', 'home-naturaleza.html'],
      ['sendero',    'home-sendero.html'],
      ['vivero',     'home-vivero.html'],
      ['nosotros',   'nosotros.html'],
      ['compromiso', 'compromiso.html'],
      ['contacto',   'home-contacto.html'],
    ],
    css: [
      'styles/sections/inicio.css',
      // La hoja de los bloques cortos nuevos. Va antes que nosotros.css
      // porque no matiza nada de ella: sólo define clases .home-* propias.
      'styles/sections/home.css',
      'styles/sections/nosotros.css',
      'styles/sections/pie.css',
    ],
  },

  /* ------------------------------------------------------ PROFUNDIDAD (6) */
  /* Las seis páginas llevan el fragmento ORIGINAL, sin una sola clase
     cambiada: mudarse de página no es rediseñarse. Lo único que cambió en
     ellos son los enlaces que apuntaban a anclas de index.html que ya no
     existen allí (ver la cabecera de cada fragmento).
     Todas cargan home.css además de su hoja: de ahí sale el encabezado de
     página (.pagina-encabezado), que es la única pieza nueva que comparten. */

  {
    archivo: 'espacios.html',
    orden: [['portada-espacios', 'enc-espacios.html'], ['usos', 'usos.html']],
    css: ['styles/sections/home.css', 'styles/sections/usos.css', 'styles/sections/pie.css'],
  },
  {
    archivo: 'planes.html',
    orden: [['portada-planes', 'enc-planes.html'], ['planes', 'planes.html']],
    css: ['styles/sections/home.css', 'styles/sections/planes.css', 'styles/sections/pie.css'],
  },
  {
    archivo: 'naturaleza.html',
    orden: [['portada-naturaleza', 'enc-naturaleza.html'], ['naturaleza', 'naturaleza.html']],
    css: ['styles/sections/home.css', 'styles/sections/naturaleza.css', 'styles/sections/pie.css'],
  },
  {
    // sendero.css DESPUÉS de naturaleza.css, y no es indiferente: la sección
    // reutiliza tal cual el bloque .nat-apertura de la hoja de naturaleza, y
    // aquí es donde se matiza cualquier regla heredada sin subir
    // especificidad y sin un solo !important.
    archivo: 'sendero-ecovital.html',
    orden: [['portada-sendero-ecovital', 'enc-sendero-ecovital.html'], ['sendero', 'sendero.html']],
    css: ['styles/sections/home.css', 'styles/sections/naturaleza.css',
          'styles/sections/sendero.css', 'styles/sections/pie.css'],
  },
  {
    archivo: 'vivero.html',
    orden: [['portada-vivero', 'enc-vivero.html'], ['vivero', 'vivero.html']],
    css: ['styles/sections/home.css', 'styles/sections/vivero.css', 'styles/sections/pie.css'],
  },
  {
    archivo: 'contacto.html',
    orden: [['portada-contacto', 'enc-contacto.html'], ['ubicacion', 'ubicacion.html']],
    css: ['styles/sections/home.css', 'styles/sections/ubicacion.css', 'styles/sections/pie.css'],
  },
];

const morir = m => { console.error('ERROR: ' + m); process.exit(1); };
// Se normaliza a LF al leer: los fragmentos están guardados con CRLF y las
// páginas con LF; sin esto el ensamblado mezcla finales de línea.
const leer = p => fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

/* Los dos fragmentos compartidos se leen UNA vez y se pegan idénticos en las
   ocho páginas: es la garantía de que el menú y el pie no se separen. */
const cabecera = leer(path.join(RAIZ, 'sections', '_header.html')).replace(/\n+$/, '');
const pie = leer(path.join(RAIZ, 'sections', '_footer.html')).replace(/\n+$/, '');

let totalSecciones = 0;

for (const pagina of PAGINAS) {
  const IDX = path.join(RAIZ, pagina.archivo);
  if (!fs.existsSync(IDX)) morir(`${pagina.archivo} no existe. Créalo primero con su <head>, su <body>, al menos un <link rel="stylesheet" href="styles/sections/...">, un </footer> y su cola de <script>.`);
  const original = leer(IDX);

  /* ----------------------------------------------------------- 1. cabeza */
  const iHead = original.indexOf('<!DOCTYPE html>');
  if (iHead < 0) morir(`${pagina.archivo} no empieza por <!DOCTYPE html>.`);
  const iBody = original.indexOf('<body>') + '<body>'.length;
  let cabeza = original.slice(iHead, iBody);

  /* -------------------------------------------- 2. <head>: hojas de sección */
  const reLinks = /^[ \t]*<link rel="stylesheet" href="styles\/sections\/[^"]+">\n/gm;
  const linksSec = cabeza.match(reLinks);
  if (!linksSec) morir(`${pagina.archivo}: no encontré ningún <link> de styles/sections/ en el <head>.`);

  const antes = linksSec.map(l => /href="([^"]+)"/.exec(l)[1].split('?')[0]);

  // Igual que en el original: primero se BORRAN todas y sólo después se
  // inserta el bloque nuevo. Sustituir una por una hace que el replace
  // encuentre su coincidencia dentro del bloque recién insertado y se coma
  // la línea buena.
  const iIns = cabeza.indexOf(linksSec[0]);
  for (const l of linksSec) cabeza = cabeza.replace(l, '');
  const bloque = pagina.css.map(h => `<link rel="stylesheet" href="${h}">\n`).join('');
  cabeza = cabeza.slice(0, iIns) + bloque + cabeza.slice(iIns);

  const borradas = antes.filter(h => !pagina.css.includes(h));
  const anadidas = pagina.css.filter(h => !antes.includes(h));

  /* --------------------------------------------------------------- 3. main */
  const partes = [];
  for (const [ancla, arch] of pagina.orden) {
    const frag = leer(path.join(RAIZ, 'sections', arch)).replace(/^\n+|\n+$/g, '');
    const m = /<section[^>]*\bid="([^"]+)"/.exec(frag);
    if (!m) morir(`${arch} no abre con un <section id=...>`);
    if (m[1] !== ancla) morir(`${arch} trae id="${m[1]}" y el orden pide "${ancla}"`);
    partes.push(frag);
  }
  const main = '<main id="contenido">\n' + partes.join('\n\n') + '\n</main>';

  /* ------------------------------------------------------------ 4. scripts */
  const iCierre = original.lastIndexOf('</footer>') + '</footer>'.length;
  if (iCierre <= 8) morir(`${pagina.archivo}: no encontré </footer>.`);
  const cola = original.slice(iCierre);

  const nuevo = cabeza + '\n' + cabecera + '\n' + main + '\n' + pie + cola;
  fs.writeFileSync(IDX, nuevo, 'utf8');
  totalSecciones += pagina.orden.length;

  console.log('%s  OK', pagina.archivo.padEnd(24));
  console.log('   secciones: %s', pagina.orden.map(o => o[0]).join(' -> '));
  if (borradas.length) console.log('   hojas borradas del <head>: %s', borradas.join(', '));
  if (anadidas.length) console.log('   hojas anadidas al <head> : %s', anadidas.join(', '));
}

console.log('\nENSAMBLADO OK · %d paginas · %d secciones', PAGINAS.length, totalSecciones);
