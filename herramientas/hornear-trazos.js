/* Hornea en el HTML el estado inicial del dibujado de iconos.
 *
 * POR QUÉ: app.js va con `defer`, así que corre después del primer pintado.
 * Si es él quien marca los iconos, el navegador alcanza a pintarlos enteros
 * y un instante después desaparecen: eso es el parpadeo. Escribiendo la
 * clase y el pathLength en el propio HTML, el trazo ya nace oculto y no hay
 * un solo fotograma con el icono visible antes de tiempo.
 *
 *   node hornear-trazos.js            (informe, no escribe)
 *   node hornear-trazos.js --escribir
 */
'use strict';
const fs = require('fs');
const path = require('path');

const RAIZ = path.dirname(__dirname);
const ESCRIBIR = process.argv.includes('--escribir');

const objetivos = [
  ...fs.readdirSync(path.join(RAIZ, 'sections'))
      .filter(f => f.endsWith('.html'))
      .map(f => 'sections/' + f),
  'plan-vecino.html',
  'condiciones-de-alquiler.html',
];

const FORMAS = 'path|circle|rect|line|polyline|polygon|ellipse';

let totalIconos = 0, totalContinuas = 0, totalDetalle = 0, totalYaHechas = 0;

for (const rel of objetivos) {
  const abs = path.join(RAIZ, rel);
  if (!fs.existsSync(abs)) continue;
  let doc = fs.readFileSync(abs, 'utf8');
  let iconos = 0, continuas = 0, detalle = 0, yaHechas = 0;

  // Sólo los SVG con la firma de icono: viewBox de 24, sin relleno y con el
  // trazo heredado. Las formas decorativas grandes no la tienen y se quedan
  // fuera, que es lo que se quiere: ésas no se dibujan.
  doc = doc.replace(
    /<svg\b([^>]*)>([\s\S]*?)<\/svg>/g,
    (todo, attrs, cuerpo) => {
      const esIcono = /fill="none"/.test(attrs)
        && /stroke="currentColor"/.test(attrs)
        && /viewBox="0 0 24 24"/.test(attrs);
      if (!esIcono) return todo;
      iconos++;

      // 1. la clase, en el propio SVG
      let nuevosAttrs = attrs;
      if (/\bclass="[^"]*\bicono-traza\b/.test(nuevosAttrs)) {
        yaHechas++;
      } else if (/\bclass="/.test(nuevosAttrs)) {
        nuevosAttrs = nuevosAttrs.replace(/\bclass="/, 'class="icono-traza ');
      } else {
        nuevosAttrs = ' class="icono-traza"' + nuevosAttrs;
      }

      // 2. cada forma hija: continua o detalle suelto
      const nuevoCuerpo = cuerpo.replace(
        new RegExp('<(' + FORMAS + ')\\b([^>]*?)(/?)>', 'g'),
        (f, tag, fattrs, cierre) => {
          if (/\bpathLength=|\bdata-traza=/.test(fattrs)) return f;   // ya horneada
          if (/\bstroke-dasharray=/.test(fattrs)) return f;           // trae su propio guion
          const d = (/\bd="([^"]+)"/.exec(fattrs) || [])[1];
          const sueltos = d ? (d.match(/[Mm]/g) || []).length > 1 : false;
          if (sueltos) { detalle++; return `<${tag}${fattrs} data-traza="detalle"${cierre}>`; }
          continuas++;
          return `<${tag}${fattrs} pathLength="1"${cierre}>`;
        }
      );

      return `<svg${nuevosAttrs}>${nuevoCuerpo}</svg>`;
    }
  );

  totalIconos += iconos; totalContinuas += continuas;
  totalDetalle += detalle; totalYaHechas += yaHechas;

  if (iconos) {
    console.log(
      rel.padEnd(34),
      'iconos=' + String(iconos).padStart(2),
      'continuas=' + String(continuas).padStart(3),
      'detalle=' + detalle,
      yaHechas ? '(' + yaHechas + ' ya estaban)' : ''
    );
    if (ESCRIBIR) fs.writeFileSync(abs, doc, 'utf8');
  }
}

console.log('\nTOTAL  iconos=' + totalIconos,
            ' continuas=' + totalContinuas,
            ' detalle=' + totalDetalle,
            ' ya horneados=' + totalYaHechas);
console.log(ESCRIBIR ? '>>> ESCRITO' : '>>> simulacion, no se escribio nada');
