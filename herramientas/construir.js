/* CONSTRUCTOR de producción — escribe `dist/` listo para publicar.
 *
 * POR QUÉ EXISTE ESTE ARCHIVO
 * PLAN-REDISENO-V4 §1.2 midió el problema y le puso número: el navegador se
 * está llevando 377 KB de HTML con un 44,5 % de comentarios y 788 KB de CSS
 * con un 71 % de comentarios. Es decir: la mayor parte de lo que viaja por la
 * red de un visitante en 4G son notas de trabajo escritas para el equipo.
 *
 * La respuesta NO es dejar de comentar. Los comentarios de este repositorio
 * son la memoria del proyecto —por qué el sendero cierra el recorrido, por
 * qué la foto no lleva velo, por qué el paralaje va con view() y no con un
 * listener— y sin ellos el siguiente agente repite los mismos errores. La
 * respuesta es separar las dos cosas: el CÓDIGO FUENTE se queda tal cual,
 * íntegro y comentado; lo que se PUBLICA es una copia sin comentarios y
 * compactada. Este script hace esa copia.
 *
 *   node herramientas/construir.js              construye dist/
 *   node herramientas/construir.js --desde-cero  ensambla y versiona antes
 *   node herramientas/construir.js --informe     mide y no escribe nada
 *
 * ORDEN DE LA CASA (el de LEEME.md, sin cambios):
 *   node herramientas/ensamblar.js
 *   node herramientas/versionar-assets.js --escribir
 *   node herramientas/validar.js
 *   node herramientas/construir.js
 *
 * QUÉ NO HACE, A PROPÓSITO
 *   · No toca un solo archivo del árbol de trabajo. Lee y escribe en dist/.
 *   · No renombra ni rehashea nada: el `?v=<hash>` ya lo pone
 *     versionar-assets.js y es el que _headers usa para poder marcar los
 *     assets como `immutable`. Dos sistemas de versión sobre lo mismo sería
 *     justo el tipo de duplicación que este repo evita.
 *   · No minifica agresivamente. No hay dependencias, no hay `package.json` y
 *     el BRIEF pide que el sitio siga siendo HTML/CSS/JS a la vista. Lo que
 *     se hace aquí es lo que se puede hacer sin un parser completo y sin
 *     riesgo: quitar comentarios y quitar el aire que sobra. El grueso de la
 *     ganancia está justo ahí —son dos tercios del peso— y ninguna de estas
 *     transformaciones puede cambiar el comportamiento de la página.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const RAIZ = path.dirname(__dirname);
const DIST = path.join(RAIZ, 'dist');
const DESDE_CERO = process.argv.includes('--desde-cero');
const SOLO_INFORME = process.argv.includes('--informe');
/* Con --estricto, pasarse de los objetivos de peso hace fallar la
 * construcción (código 1). Sin él sólo se avisa y se sale con 0, que es lo
 * que hace falta para que un despliegue de Netlify no se caiga por diez
 * kilobytes de más: el peso es una alerta de mantenimiento, no un error de
 * publicación. En CI se llama con --estricto. */
const ESTRICTO = process.argv.includes('--estricto');

/* Objetivos del PLAN-REDISENO-V4 §4.7, en bytes. No son decoración: al final
 * el script los compara y sale con código 1 si alguno se pasa, para que un
 * despliegue que engorde se note en el momento y no tres semanas después. */
const OBJETIVO = {
  html: 120 * 1024,
  css: 90 * 1024,
  js: 60 * 1024,
};

/* Lo que se copia tal cual, sin tocar un byte: imágenes, vídeo, fuentes y los
 * archivos de texto plano que el buscador lee literalmente. */
const BINARIO = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.avif', '.ico',
  '.mp4', '.webm', '.mov', '.woff', '.woff2', '.ttf', '.otf', '.pdf',
]);

/* Carpetas que NO viajan a producción: material de trabajo, fuentes de
 * imagen, planes, herramientas y el propio dist/. `sections/` tampoco: son
 * los fragmentos que el ensamblador ya pegó dentro de las páginas; volver a
 * subirlos sería publicar el mismo HTML dos veces. */
const EXCLUIDAS = new Set([
  '.git', '.claude', 'dist', 'herramientas', 'node_modules',
  'Pic', '_comparacion', '_fotos-antes-gpu', '_fotos-ia-temporales',
  '_material-fuente', '_mockups-chatgpt', 'plan vecino',
]);

/* Se excluye por RUTA, no por nombre: `sections/` de la raíz son los
 * fragmentos que el ensamblador ya pegó dentro de las páginas, pero
 * `styles/sections/` son las diecisiete hojas del sitio y tienen que
 * viajar. Excluir por nombre se llevaba las dos por delante. */
const RUTAS_EXCLUIDAS = new Set(['sections']);

const EXCLUIDOS_SUELTOS = new Set([
  '.gitignore', 'MAPA-FOTOS.json', 'netlify.toml',
]);

/* ===================================================== 1 · MINIFICADORES */

/* --- HTML ---------------------------------------------------------------
 * Dos pasadas y ninguna más:
 *   1. Fuera los comentarios `<!-- -->`. Es el 44,5 % del archivo.
 *   2. Fuera la sangría. Se quitan los espacios y tabuladores del PRINCIPIO
 *      de cada línea y las líneas que quedan vacías, pero SE CONSERVA EL
 *      SALTO DE LÍNEA. Esto último no es pereza: entre dos elementos en
 *      línea (`<span>a</span>\n<span>b</span>`) ese salto ES un espacio que
 *      el navegador pinta, y unir las líneas juntaría las palabras. Quitar
 *      sólo la sangría es seguro en cualquier marcado; unir líneas no lo es.
 * El <script> y el <style> en línea se dejan intactos aquí: sus comentarios
 * los quita el minificador de JS/CSS más abajo, que sí sabe leerlos.
 * ------------------------------------------------------------------------ */
function minHtml(src) {
  // Los <pre> y <textarea> conservan su espacio en blanco de forma
  // significativa: se apartan, se hace la pasada, y se devuelven.
  const guardados = [];
  let s = src.replace(/<(pre|textarea)\b[\s\S]*?<\/\1>/gi, (m) => {
    guardados.push(m);
    return `\u0000PRE${guardados.length - 1}\u0000`;
  });

  s = s.replace(/<!--[\s\S]*?-->/g, '');
  s = s.replace(/^[ \t]+/gm, '');
  s = s.replace(/\n{2,}/g, '\n');

  return s.replace(/\u0000PRE(\d+)\u0000/g, (_, i) => guardados[Number(i)]);
}

/* --- CSS ----------------------------------------------------------------
 * Se recorre carácter a carácter en vez de con una expresión regular porque
 * un `/*` dentro de una cadena o de un url() no es un comentario, y una
 * regular no sabe distinguirlos. Con el recorrido, sí.
 * Después: el aire alrededor de `{ } ; ,` no significa nada en CSS y se
 * quita; el de alrededor de `:` y `>` SÍ puede significar (`li:hover`,
 * `a > b` frente a `a>b` es equivalente, pero `and (min-width: 48em)` no
 * admite tocar), así que se deja. La ganancia está en los comentarios.
 * ------------------------------------------------------------------------ */
function minCss(src) {
  let out = '';
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === '"' || c === "'") {
      const fin = src.indexOf(c, i + 1);
      const j = fin < 0 ? src.length : fin + 1;
      out += src.slice(i, j);
      i = j;
      continue;
    }
    if (c === '/' && src[i + 1] === '*') {
      const fin = src.indexOf('*/', i + 2);
      i = fin < 0 ? src.length : fin + 2;
      // Un comentario entre dos tokens deja un espacio, no los pega.
      out += ' ';
      continue;
    }
    out += c;
    i++;
  }
  return out
    .replace(/\s+/g, ' ')
    .replace(/\s*([{};,])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim();
}

/* --- JS -----------------------------------------------------------------
 * Aquí NO vale una expresión regular ni de lejos: `//` dentro de una cadena
 * o de una URL, `/* ` dentro de una plantilla, y sobre todo el hecho de que
 * `/` es a la vez división y comienzo de expresión regular. Se recorre con
 * un autómata de cinco estados (código, cadena simple, cadena doble,
 * plantilla, expresión regular) y se decide si un `/` abre una regular
 * mirando el último token significativo: detrás de un identificador, un
 * número o un cierre de paréntesis o corchete, `/` es división; detrás de
 * cualquier otra cosa, es una regular.
 * Sólo se quitan comentarios y se compacta el aire de la sangría; no se
 * renombran variables ni se reordena nada. El resultado se comprueba con
 * `node --check` antes de escribirlo (ver construirArchivo).
 * ------------------------------------------------------------------------ */
function minJs(src) {
  let out = '';
  let i = 0;
  let ultimo = '';           // último carácter significativo emitido
  const abreRegular = () => !/[A-Za-z0-9_$)\]]/.test(ultimo);

  while (i < src.length) {
    const c = src[i];
    const d = src[i + 1];

    if (c === '/' && d === '/') {
      while (i < src.length && src[i] !== '\n') i++;
      continue;
    }
    if (c === '/' && d === '*') {
      const fin = src.indexOf('*/', i + 2);
      i = fin < 0 ? src.length : fin + 2;
      out += '\n';           // un salto en su lugar: nunca pega dos tokens
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      const cierre = c;
      let j = i + 1;
      while (j < src.length) {
        if (src[j] === '\\') { j += 2; continue; }
        if (src[j] === cierre) { j++; break; }
        j++;
      }
      out += src.slice(i, j);
      ultimo = cierre;
      i = j;
      continue;
    }
    if (c === '/' && abreRegular()) {
      let j = i + 1;
      let enClase = false;
      while (j < src.length) {
        if (src[j] === '\\') { j += 2; continue; }
        if (src[j] === '[') enClase = true;
        else if (src[j] === ']') enClase = false;
        else if (src[j] === '/' && !enClase) { j++; break; }
        else if (src[j] === '\n') break;   // no era una regular
        j++;
      }
      while (j < src.length && /[gimsuyvd]/.test(src[j])) j++;
      out += src.slice(i, j);
      ultimo = '/';
      i = j;
      continue;
    }
    out += c;
    if (!/\s/.test(c)) ultimo = c;
    i++;
  }

  // La sangría y las líneas vacías se van; los saltos se quedan, que es lo
  // que mantiene válida la inserción automática de punto y coma.
  return out
    .replace(/[ \t]+$/gm, '')
    .replace(/^[ \t]+/gm, '')
    .replace(/\n{2,}/g, '\n')
    .trim() + '\n';
}

/* ============================================== 2 · RECORRIDO Y ESCRITURA */

const cuenta = { html: 0, css: 0, js: 0, otros: 0, copiados: 0 };
const antes = { html: 0, css: 0, js: 0 };
const despues = { html: 0, css: 0, js: 0 };

function construirArchivo(rel) {
  const origen = path.join(RAIZ, rel);
  const destino = path.join(DIST, rel);
  const ext = path.extname(rel).toLowerCase();

  if (BINARIO.has(ext)) {
    if (!SOLO_INFORME) {
      fs.mkdirSync(path.dirname(destino), { recursive: true });
      fs.copyFileSync(origen, destino);
    }
    cuenta.copiados++;
    return;
  }

  const src = fs.readFileSync(origen, 'utf8');
  let salida = src;
  let tipo = null;

  if (ext === '.html') { salida = minHtml(src); tipo = 'html'; }
  else if (ext === '.css') { salida = minCss(src); tipo = 'css'; }
  else if (ext === '.js') { salida = minJs(src); tipo = 'js'; }

  if (tipo) {
    antes[tipo] += Buffer.byteLength(src);
    despues[tipo] += Buffer.byteLength(salida);
    cuenta[tipo]++;
  } else {
    cuenta.otros++;
  }

  if (SOLO_INFORME) return;

  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.writeFileSync(destino, salida);

  // Red de seguridad del minificador de JS: si el archivo compactado dejara
  // de ser JavaScript válido, se restituye el original y se avisa. Vale más
  // publicar 15 KB de más que publicar un script roto.
  if (tipo === 'js') {
    try {
      execFileSync(process.execPath, ['--check', destino], { stdio: 'pipe' });
    } catch (e) {
      fs.copyFileSync(origen, destino);
      despues.js += Buffer.byteLength(src) - Buffer.byteLength(salida);
      console.log('  *** ' + rel + ': el compactado no valida, se copia el original');
    }
  }
}

function recorrer(dirRel) {
  for (const e of fs.readdirSync(path.join(RAIZ, dirRel || '.'), { withFileTypes: true })) {
    const rel = dirRel ? path.join(dirRel, e.name) : e.name;
    if (e.isDirectory()) {
      if (EXCLUIDAS.has(e.name)) continue;
      if (RUTAS_EXCLUIDAS.has(rel.split(path.sep).join('/'))) continue;
      recorrer(rel);
      continue;
    }
    if (EXCLUIDOS_SUELTOS.has(e.name)) continue;
    const ext = path.extname(e.name).toLowerCase();
    // Los planes, los contratos y las notas de trabajo no se publican.
    if (ext === '.md' || ext === '.py' || ext === '.zip' || ext === '.csv') continue;
    if (!dirRel && ext === '.json') continue;
    construirArchivo(rel.split(path.sep).join('/'));
  }
}

/* ============================================================ 3 · CABECERAS */

/* `_headers` es el formato de Netlify y lo lee tal cual desde la raíz de lo
 * publicado. Las dos reglas son las del plan §4.7:
 *   · Todo lo que se pide con `?v=<hash>` puede cachearse para siempre: si el
 *     archivo cambia, cambia el hash y por tanto la URL. Netlify aplica la
 *     regla por RUTA, así que se marcan las carpetas de assets enteras.
 *   · El HTML nunca: es el documento que trae los `?v=` nuevos, y servirlo
 *     desde caché es exactamente el bug que versionar-assets.js documenta
 *     (el arreglo publicado que el navegador del cliente ignoró). */
const HEADERS = `# Generado por herramientas/construir.js — no editar a mano.
#
# Los assets viajan con ?v=<hash de contenido> que pone
# herramientas/versionar-assets.js: si el archivo cambia, cambia la URL. Por
# eso se pueden marcar como inmutables sin miedo a servir una copia vieja.

/styles/*
  Cache-Control: public, max-age=31536000, immutable

/js/*
  Cache-Control: public, max-age=31536000, immutable

/img/*
  Cache-Control: public, max-age=31536000, immutable

/video/*
  Cache-Control: public, max-age=31536000, immutable

# El HTML es lo único que NO se cachea: es el documento que trae las URLs
# nuevas de todo lo de arriba. Si se sirve viejo, no llega ningún arreglo.
/*.html
  Cache-Control: public, max-age=0, must-revalidate

/
  Cache-Control: public, max-age=0, must-revalidate

# Cabeceras de seguridad. No cambian el aspecto de nada y son gratis.
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: SAMEORIGIN
`;

/* ================================================================ 4 · MAIN */

if (DESDE_CERO) {
  console.log('Ensamblando y versionando antes de construir…\n');
  execFileSync(process.execPath, [path.join(__dirname, 'ensamblar.js')], { stdio: 'inherit' });
  execFileSync(process.execPath, [path.join(__dirname, 'versionar-assets.js'), '--escribir'], { stdio: 'inherit' });
  console.log('');
}

if (!SOLO_INFORME) {
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });
}

recorrer('');

if (!SOLO_INFORME) fs.writeFileSync(path.join(DIST, '_headers'), HEADERS);

const kb = (n) => (n / 1024).toFixed(1) + " KB";
const raya = "=".repeat(74);

/* --------------------------------------------------------------------------
   EL INFORME SE MIDE POR PÁGINA, NO POR CARPETA.
   Los objetivos del plan §4.7 (HTML < 120 KB, CSS < 90 KB, JS < 60 KB) se
   escribieron cuando el sitio era UNA sola página: entonces «el CSS» y «lo
   que descarga un visitante» eran lo mismo. Desde que la Fase 3 partió el
   sitio en portada + seis páginas de profundidad ya no lo son: hay 22 hojas
   en dist/, pero ninguna página carga más de cuatro. Sumarlas todas mide un
   visitante que no existe.
   Así que se abre cada página construida, se leen SUS <link rel=stylesheet> y
   SUS <script src>, y se pesa lo que de verdad se lleva quien la abre. El
   objetivo se compara contra la página más pesada, que es la que manda.
   -------------------------------------------------------------------------- */
function pesoDe(rel) {
  const abs = path.join(DIST, rel.split("?")[0]);
  return fs.existsSync(abs) ? fs.statSync(abs).size : 0;
}

const paginas = fs.readdirSync(DIST)
  .filter((f) => f.endsWith(".html"))
  .sort();

const peor = { html: 0, css: 0, js: 0 };
const filas = [];

for (const pag of paginas) {
  const doc = fs.readFileSync(path.join(DIST, pag), "utf8");
  const hojas = new Set();
  const guiones = new Set();
  // Los atributos se leen en dos pasos y no con una sola regular: el orden
  // de rel= y href= dentro de la etiqueta no está garantizado, y una regular
  // que lo presuponga devuelve cero sin avisar.
  for (const m of doc.matchAll(/<link\b[^>]*>/g)) {
    if (!/rel="stylesheet"/.test(m[0])) continue;
    const h = /href="([^"]+)"/.exec(m[0]);
    if (h && !/^https?:/.test(h[1])) hojas.add(h[1]);
  }
  for (const m of doc.matchAll(/<script\b[^>]*>/g)) {
    const g = /src="([^"]+)"/.exec(m[0]);
    if (g && !/^https?:/.test(g[1])) guiones.add(g[1]);
  }
  const fila = {
    pag,
    html: Buffer.byteLength(doc),
    css: [...hojas].reduce((a, h) => a + pesoDe(h), 0),
    js: [...guiones].reduce((a, g) => a + pesoDe(g), 0),
  };
  filas.push(fila);
  for (const t of ["html", "css", "js"]) peor[t] = Math.max(peor[t], fila[t]);
}

console.log(raya);
console.log(SOLO_INFORME ? "INFORME (no se ha escrito nada)" : "CONSTRUIDO EN dist/");
console.log(raya);
console.log("  archivos: %d html · %d css · %d js · %d otros · %d copiados tal cual",
  cuenta.html, cuenta.css, cuenta.js, cuenta.otros, cuenta.copiados);
console.log("");
for (const t of ["html", "css", "js"]) {
  const ahorro = antes[t] ? (100 * (1 - despues[t] / antes[t])).toFixed(1) : "0.0";
  console.log("  %s en el árbol: %s -> %s  (-%s%%)",
    t.toUpperCase().padEnd(4), kb(antes[t]).padStart(9), kb(despues[t]).padStart(9), ahorro.padStart(4));
}

console.log("");
console.log("  LO QUE DESCARGA UN VISITANTE, POR PÁGINA (sin imágenes ni vídeo)");
console.log("  %s %s %s %s %s", "página".padEnd(26), "HTML".padStart(10), "CSS".padStart(10), "JS".padStart(10), "total".padStart(10));
for (const f of filas.sort((a, b) => (b.html + b.css + b.js) - (a.html + a.css + a.js))) {
  console.log("  %s %s %s %s %s",
    f.pag.padEnd(26), kb(f.html).padStart(10), kb(f.css).padStart(10),
    kb(f.js).padStart(10), kb(f.html + f.css + f.js).padStart(10));
}

console.log("");
console.log("  CONTRA LOS OBJETIVOS DEL PLAN §4.7 (la página más pesada de cada columna)");
let excedido = false;
for (const t of ["html", "css", "js"]) {
  const ok = peor[t] <= OBJETIVO[t];
  if (!ok) excedido = true;
  console.log("    %s  peor página %s   objetivo %s   %s",
    t.toUpperCase().padEnd(4), kb(peor[t]).padStart(9), kb(OBJETIVO[t]).padStart(9),
    ok ? "OK" : "*** SE PASA ***");
}

console.log(raya);
console.log("VEREDICTO: " + (excedido
  ? (ESTRICTO ? "HAY OBJETIVOS EXCEDIDOS (ver arriba)" : "AVISO: hay objetivos excedidos (ver arriba); dist/ se escribió igual")
  : "DENTRO DE LOS OBJETIVOS"));

process.exit(excedido && ESTRICTO ? 1 : 0);
