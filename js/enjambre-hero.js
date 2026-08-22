/**
 * enjambre-hero.js — nueve mariposas y un colibrí sobre la portada.
 *
 * ES EL MISMO MECANISMO DE js/plan-vecino.js, no uno nuevo: los mismos
 * recortes con alfa de img/plan-vecino/, la misma idea de que cada pieza lleva
 * su propio compás para que el enjambre no se lea como una calcomanía, y el
 * mismo criterio de que el vuelo se REARMA al salir de pantalla en vez de
 * ocurrir una sola vez en toda la visita.
 *
 * QUÉ CAMBIA RESPECTO A AQUÉL, Y POR QUÉ
 *
 * 1. NUEVE MARIPOSAS, NO VEINTIUNA. En plan-vecino.html el enjambre es el
 *    motivo de la lámina y las veintiuna son el dibujo original de la portada
 *    de marca. Aquí compiten con un pájaro de verdad que ocupa media ventana:
 *    nueve son abundancia, veintiuna son papel pintado encima de una
 *    fotografía. En pantalla estrecha bajan a cuatro.
 *
 * 2. CERO MEDICIONES DE MAQUETA. plan-vecino.js tiene que medir el layout
 *    (cadena de offsetTop) porque cada pieza vuela hasta una coordenada del
 *    arte original. Aquí el punto de partida es relativo a la propia pieza
 *    —«260 % de tu alto más abajo»—, así que lo resuelve el CSS solo: ni una
 *    lectura del layout, ni un reflow, ni la ocasión de leer una caja mientras
 *    hay una transición activa, que es la regla dura que más veces se ha roto
 *    en este proyecto.
 *
 * 3. ENTRADA Y ALETEO SON DOS @keyframes ENCADENADOS POR RETARDO, no una
 *    transición seguida de una animación. Mientras la segunda no arranca no
 *    aporta nada al `transform`; cuando arranca, manda ella. Se evita el baile
 *    de clases en dos requestAnimationFrame del módulo viejo.
 *
 * 4. NO EXISTE NINGÚN ESTADO INICIAL QUE PUEDA PARPADEAR. Las piezas no están
 *    en el HTML: se crean aquí, después del decode() de la fotografía de
 *    portada, y nacen con `opacity: 0` escrito en inicio.css. El primer
 *    fotograma de la página no las contiene, así que no hay un solo cuadro en
 *    el que se vean puestas antes de tiempo.
 *
 * COSTE. Los PNG no se piden hasta que el LCP está decodificado, y son los
 * mismos archivos que ya sirve plan-vecino.html: entre 3 y 9 KB cada mariposa
 * y 88 KB el colibrí, todos con `loading="lazy"` y `decoding="async"`.
 *
 * ACCESIBILIDAD. Con prefers-reduced-motion el módulo ni se monta —lo
 * comprueba el <script> del fragmento antes de importar— y esta función lo
 * vuelve a comprobar por su cuenta. Si el visitante activa la preferencia con
 * la página abierta, el enjambre se retira entero. Todas las piezas son
 * `aria-hidden` con `alt` vacío: no añaden ni un elemento al árbol de
 * accesibilidad.
 */

/** Las nueve, en % de la caja del enjambre. Nada es aleatorio: con azar, dos
 *  cargas seguidas dibujan escenas distintas y deja de poderse afinar la
 *  composición mirando una captura. `n` es el archivo de img/plan-vecino/. */
const MARIPOSAS = [
  { n: 3,  x: 56, y: 2,  w: 13, movil: false },
  { n: 14, x: 24, y: 11, w: 10, movil: true },
  { n: 8,  x: 78, y: 20, w: 11, movil: false },
  { n: 19, x: 6,  y: 27, w: 8,  movil: true },
  { n: 1,  x: 44, y: 34, w: 14, movil: true },
  { n: 11, x: 80, y: 47, w: 9,  movil: false },
  { n: 5,  x: 18, y: 55, w: 11, movil: false },
  { n: 16, x: 52, y: 66, w: 12, movil: true },
  { n: 21, x: 4,  y: 79, w: 8,  movil: false },
];

/** El colibrí entra tarde: cuando el enjambre ya está puesto y el titular ya
 *  se leyó. 2,4 s medidos desde que arranca el vuelo, no desde la carga. */
const ESPERA_COLIBRI = 2400;

const dos = (n) => (n < 10 ? '0' + n : String(n));

export function montarEnjambre(caja) {
  if (!caja) return () => {};

  const reducido = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reducido.matches) return () => {};

  // El mismo corte que usa inicio.css para sacar el enjambre de la esquina de
  // abajo: por debajo de 64em el bloque de texto ocupa el ancho entero.
  const estrecho = window.matchMedia('(max-width: 63.99em)').matches;
  const elegidas = estrecho ? MARIPOSAS.filter((m) => m.movil) : MARIPOSAS;

  const piezas = [];

  elegidas.forEach((m, i) => {
    const img = document.createElement('img');
    img.className = 'inicio__bicho inicio__mariposa';
    img.src = 'img/plan-vecino/mariposa-' + dos(m.n) + '.png';
    img.alt = '';
    img.setAttribute('aria-hidden', 'true');
    img.decoding = 'async';
    img.loading = 'lazy';
    img.style.left = m.x + '%';
    img.style.top = m.y + '%';
    img.style.width = m.w + '%';
    /* Cada una con su compás. El desfase sale del índice y no del azar: la
       escena tiene que salir igual en cada carga para poder afinarla. Ninguna
       cifra es un tiempo nuevo del sistema; son fracciones de --dur-reveal,
       que es la duración de «algo que entra» en este sitio. */
    img.style.setProperty('--espera', 120 + i * 190 + 'ms');
    img.style.setProperty('--aleteo', (1.6 + ((i * 7) % 11) / 10).toFixed(2) + 's');
    img.style.setProperty('--giro', (((i * 11) % 15) - 7) + 'deg');
    img.style.setProperty('--dur-subida', (1500 + ((i * 13) % 9) * 90) + 'ms');
    piezas.push(img);
  });

  const colibri = document.createElement('img');
  colibri.className = 'inicio__bicho inicio__colibri';
  colibri.src = 'img/plan-vecino/colibri.png';
  colibri.alt = '';
  colibri.setAttribute('aria-hidden', 'true');
  colibri.decoding = 'async';
  colibri.loading = 'lazy';
  colibri.style.top = '26%';
  colibri.style.right = '0%';
  colibri.style.width = estrecho ? '38%' : '26%';
  colibri.style.setProperty('--espera', ESPERA_COLIBRI + 'ms');
  piezas.push(colibri);

  const fragmento = document.createDocumentFragment();
  piezas.forEach((p) => fragmento.appendChild(p));
  caja.appendChild(fragmento);

  /* El vuelo vive en una clase de la CAJA, no de cada pieza: quitarla y
     ponerla reinicia las diez animaciones a la vez y con sus retardos
     intactos, que es exactamente el rearme que se quiere.
     El observador NO SE DESCONECTA al salir —regla de la casa: se mantiene la
     observación y se conmuta el estado en cada entrada y cada salida— así que
     bajar y volver a subir vuelve a levantar el enjambre. */
  const io = new IntersectionObserver(
    ([e]) => caja.classList.toggle('en-vuelo', e.isIntersecting),
    { threshold: 0 },
  );
  io.observe(caja);

  const alCambiarPreferencia = () => reducido.matches && desmontar();
  reducido.addEventListener('change', alCambiarPreferencia);

  function desmontar() {
    io.disconnect();
    reducido.removeEventListener('change', alCambiarPreferencia);
    caja.classList.remove('en-vuelo');
    piezas.forEach((p) => p.remove());
  }

  return desmontar;
}
