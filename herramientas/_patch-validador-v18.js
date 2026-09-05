/* PARCHE DE UN SOLO USO · v18 — actualiza la tabla HECHOS y ESPERADO de los
 * dos validadores (validar.js y validar.py) al reparto nuevo de la
 * arquitectura «escaparate + profundidad» (PLAN-REDISENO-V4 §4.1).
 *
 * Se corre una vez. Se conserva en el repo como registro de QUÉ cambió de
 * dueño y por qué; la fuente de verdad después de correrlo son los propios
 * validadores.
 *
 *   node herramientas/_patch-validador-v18.js
 */
'use strict';
const fs = require('fs');
const path = require('path');
const RAIZ = path.dirname(__dirname);

/* Cada entrada: [trozo del rótulo del hecho, dueños nuevos, motivo].
   «NADIE» significa: ninguna sección de index.html puede escribirlo — el
   hecho vive entero en la página de profundidad correspondiente, que este
   validador no lee (mismo precedente que colegios.html en v15). */
const REPARTO = [
  ['Aforo Alameda 150',   ['espacios'], 'la home lo enseña en su tarjeta; el detalle esta en espacios.html'],
  ['Aforo La Vega 100',   ['espacios'], 'idem'],
  ['Aforo Teatrino 70',   ['espacios'], 'idem'],
  ['Aforo Taller 45',     ['espacios'], 'idem'],
  ['Aforo Cancha 30/20',  ['espacios'], 'idem'],

  ['Quebrada Aranzoque',  null, 'se fue entero a sendero-ecovital.html'],
  ['Chachalaca Colombiana', null, 'se fue entero a naturaleza.html'],
  ['7 especies migratorias', null, 'se fue entero a naturaleza.html'],

  ['Direccion: Vereda Rio Frio', null, 'se fue entero a contacto.html'],
  ['Coordenadas 7.0574425',      null, 'se fue entero a contacto.html'],
  ['Cercanias y Anillo Vial',    ['inicio'], 'ubicacion salio del <main>; el hero lo sigue nombrando'],
  ['Area Metropolitana de Bucaramanga', null, 'se fue entero a contacto.html'],
  ['Horario 6:00',        ['contacto'], 'la franja corta de la home lo enseña; el resto esta en contacto.html'],
  ['Telefono +57 316',    null, 'se fue entero a contacto.html'],
  ['Correo vegasdelverde', null, 'se fue entero a contacto.html'],
  ['Instagram @vegasdelverde', ['pie'], 'ubicacion salio del <main>; queda el pie'],
  ['No hay reservas',     null, 'se fue entero a contacto.html'],

  ['Atrevete a un plan distinto', null, 'el rotulo se fue con #planes a planes.html'],
  ['Atrevete al sendero',  null, 'el rotulo se fue con #sendero a sendero-ecovital.html'],
  ['Quiero plantas del vivero', null, 'el rotulo se fue con #vivero a vivero.html'],
  ['Hablemos por WhatsApp', null, 'el rotulo se fue con #ubicacion a contacto.html'],
];

const ORDEN_NUEVO = ['inicio', 'planes', 'espacios', 'naturaleza', 'sendero',
                     'vivero', 'nosotros', 'compromiso', 'contacto'];

function parchear(rel, fmtDuenos, fmtNadie, reEsperado, esperadoNuevo) {
  const p = path.join(RAIZ, rel);
  let s = fs.readFileSync(p, 'utf8');
  let n = 0;
  for (const [etiqueta, duenos, motivo] of REPARTO) {
    // Localiza la fila del hecho por su rótulo y sustituye SOLO la lista de
    // dueños que va inmediatamente después.
    const i = s.indexOf(etiqueta);
    if (i < 0) { console.log('  (no esta en ' + rel + '): ' + etiqueta); continue; }
    const resto = s.slice(i);
    const m = /\[[^\]]*\]/.exec(resto);          // la primera lista tras el rótulo
    if (!m) { console.log('  *** sin lista de duenos: ' + etiqueta); continue; }
    const nuevo = duenos ? fmtDuenos(duenos) : fmtNadie;
    s = s.slice(0, i) + resto.slice(0, m.index) + nuevo + resto.slice(m.index + m[0].length);
    n++;
  }
  s = s.replace(reEsperado, esperadoNuevo);
  fs.writeFileSync(p, s, 'utf8');
  console.log(rel + ': ' + n + ' hechos re-asignados');
}

parchear(
  'herramientas/validar.js',
  d => '[' + d.map(x => `'${x}'`).join(',') + ']',
  '[NADIE]',
  /const ESPERADO = \[[\s\S]*?\];/,
  `const ESPERADO = [
  // v18 · EL ORDEN NUEVO DE LA PORTADA (PLAN-REDISENO-V4 §4.2).
  // Seis secciones salieron del <main> y son paginas propias, con el mismo
  // precedente que colegios.html en v15 y plan-vecino.html: este validador
  // sigue leyendo SOLO index.html, asi que los hechos que se fueron con
  // ellas figuran arriba con dueno NADIE — no para borrarlos de la
  // vigilancia, sino para vigilar la otra mitad de la regla: que ninguna
  // seccion de la portada los vuelva a escribir.
  //   #usos      -> espacios.html          (el ancla del escaparate es #espacios)
  //   #planes    -> planes.html            (el ancla del escaparate es #planes)
  //   #naturaleza-> naturaleza.html
  //   #sendero   -> sendero-ecovital.html
  //   #vivero    -> vivero.html
  //   #ubicacion -> contacto.html          (el ancla del escaparate es #contacto)
  'inicio', 'planes', 'espacios', 'naturaleza', 'sendero', 'vivero',
  // #nosotros y #compromiso siguen en la portada y siguen contiguos: son el
  // bloque 7 del plan, «Nosotros + Compromiso», fusionado por posicion y no
  // por marcado para no reabrir su composicion.
  'nosotros', 'compromiso', 'contacto'];`
);

parchear(
  'herramientas/validar.py',
  d => '[' + d.map(x => `"${x}"`).join(', ') + ']',
  '[NADIE]',
  /ESPERADO = \[[\s\S]*?\]\n/,
  'ESPERADO = ' + JSON.stringify(ORDEN_NUEVO).replace(/","/g, '", "').replace(/\["/, '["') + '\n'
);

console.log('\nListo. Ahora: node herramientas/validar.js');
