/**
 * fauna-ambiente.js — mariposas y colibrí AMBIENTE para las secciones que no
 * son la portada.
 *
 * ====================================================================
 * POR QUÉ EXISTE ESTE ARCHIVO
 * ====================================================================
 * El encargo del cliente es literal: «lo de los pájaros que te pedí se ve
 * excelente, quiero que TODAS se vean así». El gesto que le gusta vive hoy en
 * dos sitios y sólo en dos: js/enjambre-hero.js (nueve mariposas y un colibrí
 * sobre #inicio) y js/particulas-hero.js (el aire del bosque). Repetir
 * cualquiera de los dos sección por sección tendría dos costes que no se
 * pueden pagar:
 *
 *   1. CUATRO COPIAS DEL MISMO CÓDIGO. Cuatro agentes trabajando en paralelo
 *      escribirían cuatro variantes del mismo módulo con cuatro juegos de
 *      cifras, y el sitio dejaría de tener UN vocabulario de movimiento para
 *      tener cinco parecidos. Es exactamente el mecanismo por el que una
 *      página termina viéndose «genérica»: no por falta de efectos, sino
 *      porque ninguno rima con otro.
 *   2. NUEVE PORTADAS. Si cada sección lleva el enjambre de #inicio a plena
 *      opacidad, #inicio deja de ser la portada. El gesto se gasta.
 *
 * Así que el módulo es UNO, compartido, y lo que cambia por sección son dos
 * parámetros: cuántas piezas y de qué especies.
 *
 * ====================================================================
 * QUÉ COMPARTE CON EL ENJAMBRE DE LA PORTADA Y QUÉ NO
 * ====================================================================
 * COMPARTE (y por eso rima con él):
 *   · Los mismos recortes con alfa de img/plan-vecino/ — cero bytes nuevos en
 *     el sitio, y son archivos que el navegador probablemente ya tiene en
 *     caché porque los sirve la portada y plan-vecino.html.
 *   · Cada pieza con su propio compás, para que el conjunto no se lea como
 *     una calcomanía.
 *   · El vuelo se REARMA al salir y volver a entrar en pantalla, en vez de
 *     ocurrir una sola vez en toda la visita.
 *   · Cero mediciones de maqueta: ni un getBoundingClientRect, ni un
 *     offsetTop, ni un reflow. Todo son porcentajes que resuelve el CSS.
 *   · El estado inicial lo hornea la hoja (base.css §v7), no este archivo:
 *     las piezas no existen en el HTML, se crean aquí y nacen apagadas. No
 *     hay un solo fotograma en el que se vean puestas antes de tiempo.
 *
 * NO COMPARTE:
 *   · La intensidad. Aquí la opacidad de destino es --opacidad-fauna (0,55)
 *     y no la 0,9 de la portada.
 *   · La coreografía. En la portada las mariposas SUBEN desde 260 % más
 *     abajo: el gesto es que el enjambre llega. Aquí ya estaban, y lo que
 *     hacen es derivar despacio mientras la página las alcanza.
 *
 * ====================================================================
 * CÓMO SE USA (esto es lo que necesita cada agente de sección)
 * ====================================================================
 *   <script type="module">
 *     if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
 *       import('./js/fauna-ambiente.js')
 *         .then((m) => m.montarFaunaAmbiente(
 *           document.querySelector('#espacios .espacios__aire'),
 *           { densidad: 'discreta', especies: ['mariposa'] }
 *         ))
 *         .catch(() => {});
 *     }
 *   </script>
 *
 * El CONTENEDOR es la caja donde vuela la fauna, y hay tres reglas duras
 * sobre él:
 *   1. Tiene que ser una caja VACÍA de contenido y decorativa —igual que
 *      `.inicio__enjambre` en sections/hero.html—, no la sección entera con
 *      su texto dentro. Así ni una pieza puede cruzarse por delante de nada
 *      que se lea.
 *   2. Tiene que tener `position` propia. El módulo se la comprueba y avisa
 *      por consola si falta, porque el síntoma sin aviso —piezas volando en
 *      la esquina del documento— es difícil de diagnosticar.
 *   3. Debe estar en una zona de la composición donde el fondo sea FOTO O
 *      COLOR PLANO, nunca encima de un párrafo. Sobre texto, aunque la pieza
 *      pase por detrás, el ojo lee suciedad.
 *
 * OPCIONES
 *   densidad: 'minima' (2 piezas) · 'discreta' (4, por defecto) · 'viva' (7)
 *             En pantalla estrecha SIEMPRE baja un escalón: lo que en un
 *             monitor es abundancia, en 375 px es una plaga.
 *   especies: ['mariposa'] por defecto. ['mariposa', 'colibri'] añade UN
 *             colibrí que cruza una vez. El colibrí pesa 88 kB y es un gesto
 *             fuerte: se reserva para las secciones de naturaleza y no se
 *             pone en más de dos en toda la página. En pantalla estrecha no
 *             se monta nunca.
 *   semilla:  entero. Cambia la composición sin tocar código. Mismo número =
 *             misma escena en cada carga, que es la regla de la casa: con
 *             azar, dos capturas seguidas salen distintas y deja de poderse
 *             afinar la composición mirando una captura.
 *
 * DEVUELVE una función `desmontar()` que retira todo y desconecta los
 * observadores.
 *
 * ====================================================================
 * COSTE Y ACCESIBILIDAD
 * ====================================================================
 * Las mariposas pesan entre 3 y 9 kB cada una; todas van con `loading="lazy"`
 * y `decoding="async"`, así que no se piden hasta que el navegador decide que
 * están cerca. Todas son `aria-hidden` con `alt` vacío: no añaden ni un nodo
 * al árbol de accesibilidad y ningún lector de pantalla las nombra.
 * Con `prefers-reduced-motion` el módulo no se monta —lo comprueba quien
 * importa y lo vuelve a comprobar esta función por su cuenta—, y si el
 * visitante activa la preferencia con la página abierta, la escena se retira
 * entera.
 */

/** Las nueve posiciones posibles, en % de la caja, ordenadas de más a menos
 *  importante: una densidad de 4 se queda con las cuatro primeras, y por eso
 *  las primeras son las que mejor reparten el cuadro. `n` es el archivo de
 *  img/plan-vecino/; `w` es el ancho en % de la caja. Nada es aleatorio. */
const POSICIONES = [
  { n: 14, x: 8, y: 14, w: 11 },
  { n: 8, x: 74, y: 30, w: 9 },
  { n: 3, x: 34, y: 62, w: 12 },
  { n: 19, x: 86, y: 74, w: 8 },
  { n: 5, x: 20, y: 40, w: 10 },
  { n: 16, x: 58, y: 10, w: 9 },
  { n: 11, x: 4, y: 78, w: 8 },
];

const CUANTAS = { minima: 2, discreta: 4, viva: 7 };

/** El colibrí entra tarde: cuando las mariposas ya están puestas. Es el mismo
 *  criterio y el mismo número que la portada (enjambre-hero.js). */
const ESPERA_COLIBRI = 2400;

const dos = (n) => (n < 10 ? '0' + n : String(n));

/** Un escalón menos de densidad, sin bajar nunca de una pieza. */
const bajarUnEscalon = (nombre) =>
  nombre === 'viva' ? 'discreta' : nombre === 'discreta' ? 'minima' : 'minima';

export function montarFaunaAmbiente(contenedor, opciones = {}) {
  if (!contenedor) return () => {};

  const reducido = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reducido.matches) return () => {};

  /* Navegador sin IntersectionObserver: no se monta nada. El vuelo depende
     entero de saber si la caja está en pantalla, y sin eso quedarían siete
     mariposas animándose para siempre fuera de la vista —batería quemada a
     cambio de nada, que es la regla de la casa—. */
  if (!('IntersectionObserver' in window)) return () => {};

  const estrecho = window.matchMedia('(max-width: 63.99em)').matches;
  const densidad = estrecho
    ? bajarUnEscalon(opciones.densidad || 'discreta')
    : opciones.densidad || 'discreta';
  const especies = opciones.especies || ['mariposa'];
  const semilla = Number.isInteger(opciones.semilla) ? opciones.semilla : 0;

  /* El aviso que ahorra media hora de depuración. Una caja sin `position` no
     es bloque contenedor de sus hijos absolutos, así que las piezas se van a
     posicionarse contra el primer antepasado que sí la tenga —normalmente la
     sección entera o el propio documento— y aparecen en un sitio que no tiene
     nada que ver con el que se pidió. */
  if (getComputedStyle(contenedor).position === 'static') {
    console.warn(
      'fauna-ambiente: el contenedor no tiene `position` propia; las piezas ' +
        'se posicionarán contra otro elemento. Añade la clase .fauna-ambiente ' +
        'en la hoja de la sección o dale `position: relative`.',
      contenedor,
    );
  }

  const cuantas = Math.min(CUANTAS[densidad] || CUANTAS.discreta, POSICIONES.length);
  const piezas = [];

  POSICIONES.slice(0, cuantas).forEach((p, i) => {
    const img = document.createElement('img');
    img.className = 'fauna-ambiente__pieza fauna-ambiente__mariposa';
    img.src = 'img/plan-vecino/mariposa-' + dos(p.n) + '.png';
    img.alt = '';
    img.setAttribute('aria-hidden', 'true');
    img.decoding = 'async';
    img.loading = 'lazy';
    img.style.left = p.x + '%';
    img.style.top = p.y + '%';
    img.style.width = p.w + '%';

    /* Los cuatro compases. Todos salen del índice y de la semilla, nunca de
       Math.random(): la escena tiene que salir igual en cada carga para poder
       afinarla mirando una captura. Ninguna cifra es una duración nueva del
       sistema; son desfases, y los desfases sí son números. */
    const k = i + semilla;
    img.style.setProperty('--espera', 200 + i * 240 + 'ms');
    img.style.setProperty('--giro', (((k * 11) % 17) - 8) + 'deg');
    /* La deriva es corta a propósito: entre un 4 y un 12 % de la propia
       pieza. Más recorrido y deja de leerse como aire para leerse como un
       elemento que se mueve, que es justo lo que no se quiere fuera de la
       portada. Los signos alternan para que dos vecinas no floten al mismo
       lado. */
    img.style.setProperty('--deriva-x', (((k * 7) % 9) - 4) + '%');
    img.style.setProperty('--deriva-y', (((k * 13) % 11) - 6) + '%');
    piezas.push(img);
  });

  /* EL COLIBRÍ. Nunca en pantalla estrecha: 88 kB y un cruce de 38vw sobre
     una ventana de 375 px es un pájaro que ocupa la sección entera. */
  if (especies.indexOf('colibri') !== -1 && !estrecho) {
    const colibri = document.createElement('img');
    colibri.className = 'fauna-ambiente__pieza fauna-ambiente__colibri';
    colibri.src = 'img/plan-vecino/colibri.png';
    colibri.alt = '';
    colibri.setAttribute('aria-hidden', 'true');
    colibri.decoding = 'async';
    colibri.loading = 'lazy';
    colibri.style.top = '18%';
    colibri.style.right = '0%';
    colibri.style.width = '22%';
    colibri.style.setProperty('--espera', ESPERA_COLIBRI + 'ms');
    piezas.push(colibri);
  }

  contenedor.classList.add('fauna-ambiente');
  const fragmento = document.createDocumentFragment();
  piezas.forEach((p) => fragmento.appendChild(p));
  contenedor.appendChild(fragmento);

  /* El vuelo vive en una clase de la CAJA, no de cada pieza: quitarla y
     ponerla reinicia todas las animaciones a la vez y con sus retardos
     intactos, que es exactamente el rearme que se quiere.
     EL OBSERVADOR NO SE DESCONECTA AL SALIR — regla dura de la casa: se
     mantiene la observación y se CONMUTA el estado en cada entrada y cada
     salida con classList.toggle. Nada de unobserve. Bajar y volver a subir
     vuelve a levantar la escena. */
  const io = new IntersectionObserver(
    ([e]) => contenedor.classList.toggle('en-vuelo', e.isIntersecting),
    { threshold: 0 },
  );
  io.observe(contenedor);

  const alCambiarPreferencia = () => reducido.matches && desmontar();
  reducido.addEventListener('change', alCambiarPreferencia);

  function desmontar() {
    io.disconnect();
    reducido.removeEventListener('change', alCambiarPreferencia);
    contenedor.classList.remove('en-vuelo', 'fauna-ambiente');
    piezas.forEach((p) => p.remove());
  }

  return desmontar;
}
