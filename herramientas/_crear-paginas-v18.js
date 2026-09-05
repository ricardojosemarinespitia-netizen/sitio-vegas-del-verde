/* GENERADOR DE UN SOLO USO · v18
 *
 * Crea el ESQUELETO de las seis páginas de profundidad del
 * PLAN-REDISENO-V4 §4.1 y los seis fragmentos de encabezado que las abren.
 * Se corre UNA vez; a partir de ahí las páginas las mantiene
 * herramientas/ensamblar.js (que reescribe <body>…</footer> y el bloque de
 * <link> de styles/sections/, y conserva el <head> y la cola de <script>).
 *
 * Se deja en el repo, y no se borra, porque es la documentación ejecutable de
 * cómo se construyó cada <head>: si mañana hay que crear una séptima página,
 * se copia una entrada de PAGINAS y se vuelve a correr — no se improvisa un
 * <head> a mano, que es como se acumulan las metas incoherentes.
 *
 *   node herramientas/_crear-paginas-v18.js
 *
 * NO PISA NADA: si el archivo ya existe, lo salta.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const RAIZ = path.dirname(__dirname);

const BASE = 'https://vegasdelverde.co/';

const PAGINAS = [
  {
    archivo: 'espacios.html',
    ancla: 'usos',
    hoja: 'styles/sections/usos.css',
    titulo: 'Alquiler de espacios para eventos · Vegas del Verde',
    desc: 'Alameda, La Vega, Teatrino, Taller y Cancha: cinco espacios al aire libre para alquilar en Floridablanca, Santander, con los usos recomendados de cada uno.',
    ogImagen: 'img/espacios/alameda-2.jpg',
    eyebrow: 'Alquiler de espacios',
    h1: 'Cinco espacios para alquilar',
    entradilla: 'Escoge por tamaño y por lo que va a pasar ese día. Cada uno trae los usos que mejor le funcionan, con fotos de eventos que ya pasaron aquí.',
    scripts: [],
  },
  {
    archivo: 'planes.html',
    ancla: 'planes',
    hoja: 'styles/sections/planes.css',
    titulo: 'Planes y eventos al aire libre · Vegas del Verde',
    desc: 'Bodas y conciertos, cumpleaños y reuniones, jornadas de empresa, bienestar y talleres: cinco maneras de usar un bosque privado a diez minutos de Bucaramanga.',
    ogImagen: 'img/eventos/boda-carpa-50-nocturna.jpg',
    eyebrow: 'Eventos y actividades',
    h1: 'Dime a quién traes y te digo dónde',
    entradilla: 'Cinco maneras distintas de usar el mismo bosque. Escoge la tuya y aparta la fecha.',
    scripts: [],
  },
  {
    archivo: 'naturaleza.html',
    ancla: 'naturaleza',
    hoja: 'styles/sections/naturaleza.css',
    titulo: 'Aves y biodiversidad · Vegas del Verde',
    desc: 'Ciento una especies de aves registradas, 347 especies de plantas y las 57 fotografías del concurso de fotografía de Vegas del Verde, con el crédito de sus 20 autores.',
    ogImagen: 'img/naturaleza-milano.jpg',
    eyebrow: 'Pajareo y biodiversidad',
    h1: 'Lo que vuela, lo que crece y quién lo fotografió',
    entradilla: 'El concurso completo, las especies registradas y las plantas del predio.',
    scripts: [],
  },
  {
    archivo: 'sendero-ecovital.html',
    ancla: 'sendero',
    hoja: 'styles/sections/sendero.css',
    titulo: 'Sendero Ecovital · Vegas del Verde',
    desc: 'Recorrido guiado de pajareo y observación de plantas por la quebrada Aranzoque, bordeado de guaduas, búcaros y caracolíes, en Floridablanca, Santander.',
    ogImagen: 'img/sendero/sendero-hero.jpg',
    eyebrow: 'El bosque',
    h1: 'El Sendero Ecovital',
    entradilla: 'Se anda poco y se para mucho: un recorrido guiado para mirar aves y reconocer las plantas del lugar.',
    scripts: [],
  },
  {
    archivo: 'vivero.html',
    ancla: 'vivero',
    hoja: 'styles/sections/vivero.css',
    titulo: 'Vivero · Vegas del Verde',
    desc: 'Producción y venta de plantas, abonos, mantenimiento de jardines y poda, y alquiler de complementos para decorar eventos. Registro ICA Resolución 00000819.',
    ogImagen: 'img/vivero/vivero-02.jpg',
    eyebrow: 'El vivero',
    h1: 'Te llevas a casa lo que crece aquí',
    entradilla: 'Lo que ves plantado afuera sale de aquí. Y también lo que te llevas.',
    scripts: [],
  },
  {
    archivo: 'contacto.html',
    ancla: 'ubicacion',
    hoja: 'styles/sections/ubicacion.css',
    titulo: 'Cómo llegar y contacto · Vegas del Verde',
    desc: 'Vereda Río Frío, 500 m sobre la vía Carabineros, Floridablanca, Santander. Mapa, referencias del sector, horario y el número de WhatsApp para cotizar.',
    ogImagen: 'img/mapa-ubicacion.jpg',
    eyebrow: 'Cómo llegar',
    h1: 'Dónde queda, cuándo abrimos y con quién hablas',
    entradilla: 'El mapa, las referencias y el número al que escribir.',
    // El mapa satelital con el vuelo de descenso: el único módulo de cola que
    // cambia de página con su sección.
    scripts: ['js/mapa.js'],
  },
];

/* -------------------------------------------------- fragmento de encabezado */
/* Todas las páginas abren igual: eyebrow, <h1> y una frase, sobre el fondo de
   papel del sitio y SIN FOTO DETRÁS. Es lo que garantiza la regla del cliente
   —«el texto NO debe tapar la foto»— en el punto más tentador de una página:
   la primera pantalla. La primera fotografía aparece inmediatamente debajo,
   entera y sin nada encima.
   Es un <section> propio con id propio porque el ensamblador sólo sabe pegar
   fragmentos que abren con <section id=...>. */
function fragmentoEncabezado(p) {
  const id = 'portada-' + p.archivo.replace('.html', '');
  return `<!-- ==========================================================================
     ENCABEZADO DE PÁGINA: ${p.h1}
     CSS: styles/sections/home.css (bloque «PÁGINAS DE PROFUNDIDAD»)
     JS propio: NINGUNO

     Generado por herramientas/_crear-paginas-v18.js y mantenido a mano desde
     entonces. Lo pega el ensamblador como PRIMERA sección de ${p.archivo}.

     Aquí vive el único <h1> de la página. La sección que va debajo conserva
     su <h2> original tal como estaba en index.html: mudarse de página no es
     rediseñarse, y así la jerarquía queda h1 -> h2 sin tocar el fragmento.

     SIN FOTOGRAFÍA DE FONDO, a propósito: ninguna imagen que el texto pueda
     tapar. Corrección directa del cliente en esta fase.
     ========================================================================== -->
<section id="${id}" class="pagina-encabezado" aria-labelledby="${id}-titulo">
  <div class="contenedor contenedor--ancho">
    <a class="pagina-miga" href="index.html">← Vegas del Verde</a>
    <div class="pagina-encabezado__interior reveal">
      <p class="eyebrow">${p.eyebrow}</p>
      <h1 id="${id}-titulo" class="pagina-encabezado__titulo">${p.h1}</h1>
      <p class="entradilla">${p.entradilla}</p>
    </div>
  </div>
</section>
`;
}

/* ------------------------------------------------------------ la página */
function documento(p) {
  const url = BASE + p.archivo;
  const scripts = ['js/app.js'].concat(p.scripts)
    .map(s => `<script src="${s}" defer></script>`).join('\n');
  return `<!DOCTYPE html>
<html lang="es">
<head>
<script>document.documentElement.classList.add('js');</script>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${p.titulo}</title>
<meta name="description" content="${p.desc}">
<link rel="canonical" href="${url}">
<!-- SIN hreflang="en": el sitio en inglés (en/) sigue siendo la arquitectura
     v1 y no tiene equivalente de esta página. Declarar una alternativa que no
     existe es peor que no declarar ninguna. Se añadirá cuando /en/ se rehaga
     con paridad (PLAN-REDISENO-V4 §7.5). -->
<link rel="alternate" hreflang="es" href="${url}">

<meta property="og:type" content="website">
<meta property="og:title" content="${p.titulo}">
<meta property="og:description" content="${p.desc}">
<meta property="og:image" content="${BASE}${p.ogImagen}">
<meta property="og:url" content="${url}">
<meta property="og:locale" content="es_CO">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${p.titulo}">
<meta name="twitter:image" content="${BASE}${p.ogImagen}">

<link rel="icon" type="image/png" href="img/logo/simbolo-vegas.png">
<link rel="apple-touch-icon" href="img/logo/simbolo-vegas.png">

<!-- fuentes-propias: Josefin Sans y DM Sans viven en styles/fonts/ y se
     declaran por @font-face en base.css — no hay <link> a fonts.googleapis.com
     ni preconnect a Google. La precarga hace que el navegador pida el woff2
     desde el primer instante, en paralelo a parsear el CSS, en vez de esperar
     a descubrir el @font-face durante el layout.
     Se regenera con herramientas/precargar-fuentes.js. -->
<link rel="preload" as="font" type="font/woff2" crossorigin href="styles/fonts/dm-sans-latin.woff2">
<link rel="preload" as="font" type="font/woff2" crossorigin href="styles/fonts/josefin-sans-latin.woff2">

<link rel="stylesheet" href="styles/tokens.css">
<link rel="stylesheet" href="styles/base.css">
<link rel="stylesheet" href="styles/shell.css">
<!-- Este bloque lo REESCRIBE herramientas/ensamblar.js a partir de PAGINAS.
     No lo edites a mano: la lista buena está allí. -->
<link rel="stylesheet" href="${p.hoja}">
<link rel="stylesheet" href="styles/lightbox.css">

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Vegas del Verde", "item": "${BASE}" },
    { "@type": "ListItem", "position": 2, "name": ${JSON.stringify(p.h1)}, "item": "${url}" }
  ]
}
</script>
</head>
<body>
<main id="contenido">
</main>
<footer>
</footer>
${scripts}
</body>
</html>
`;
}

let creados = 0, saltados = 0;
for (const p of PAGINAS) {
  const fragmento = path.join(RAIZ, 'sections', 'enc-' + p.archivo);
  if (fs.existsSync(fragmento)) { saltados++; }
  else { fs.writeFileSync(fragmento, fragmentoEncabezado(p), 'utf8'); creados++; console.log('creado  sections/enc-' + p.archivo); }

  const pagina = path.join(RAIZ, p.archivo);
  if (fs.existsSync(pagina)) { saltados++; console.log('SALTADO ' + p.archivo + ' (ya existe)'); }
  else { fs.writeFileSync(pagina, documento(p), 'utf8'); creados++; console.log('creado  ' + p.archivo); }
}
console.log('\ncreados=%d  saltados=%d', creados, saltados);
console.log('Ahora: node herramientas/ensamblar.js');
