/* ==========================================================================
   LA CINTA DEL CONCURSO — motor de la escena por scroll  (v8)

   Mismo patrón que `escenaPorScroll()` del sitio de Rafael Silva (Hotel
   Terra Barichara), reconstruido para este sitio: una pista alta con el
   escenario clavado (sticky) dentro, y el avance por la pista traducido a
   dos variables CSS que el stylesheet convierte en clip-path / opacity /
   transform. Aquí no se decide ni un estilo: solo se mide cuánto se lleva
   recorrido.

   CONTRATO (ver styles/sections/naturaleza.css, bloque LA CINTA):
     · El CSS hornea el estado RESUELTO. Este script, al arrancar, clona el
       grupo de cada fila (para el loop sin costura) y añade `.cinta-lista`:
       recién ahí existen la pista de 200svh y las variables.
     · Con prefers-reduced-motion: reduce el script se retira entero: ni
       clase, ni clones, ni oyentes. La escena queda como la dejó el CSS.
     · La posición de la pista se mide con la CADENA DE offsetTop y se
       cachea; en el cuadro solo se lee scrollY. Nunca getBoundingClientRect()
       durante el desplazamiento: la escena vive en transición casi permanente
       y esa lectura forzaría layout en cada cuadro.

   v8 · DOS FUGAS DE RENDIMIENTO TAPADAS (agosto de 2026, queja del cliente
   «las fotos se mueven a tirones al deslizar»):

     1. EL CUADRO LEÍA `pista.offsetHeight`. El contrato de arriba ya lo
        prohibía y aun así estaba escrito dentro de `cuadro()`. `offsetHeight`
        obliga al navegador a rehacer estilo y maqueta ANTES de contestar, y
        aquí se le preguntaba por una pista de dos pantallas con una banda
        dentro que lleva máscara de degradado, un `clip-path` vivo y las
        veinticuatro fotografías de sus tres filas en bucle —cuarenta y ocho
        contando los clones—. Era el gasto más caro del scroll de
        #naturaleza, sesenta veces por segundo. Ahora el alto se cachea en
        `medir()` —igual que el techo— y el cuadro sólo hace aritmética.
     2. EL MOTOR CORRÍA SIEMPRE. Sin cerrojo de cercanía, estas dos variables
        CSS se reescribían durante TODO el recorrido de la página, también con
        la cinta diez pantallas más arriba, invalidando el `clip-path` de la
        banda a cada cuadro. Se añade el mismo `IntersectionObserver` que ya
        usa js/escena-planes.js, con su margen holgado y CONMUTANDO el estado
        —nunca `unobserve`—: bajar y volver a subir tiene que volver a
        levantarlo.
   ========================================================================== */
(() => {
  'use strict';

  const pista = document.querySelector('.nat-cinta');
  if (!pista) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  /* El loop sin salto: cada fila viaja exactamente el 50% de sí misma, así
     que necesita su contenido dos veces. El clon se hace aquí y no en el
     HTML para que el estado sin JS no cargue 24 imágenes duplicadas de
     balde. Es decoración (la banda entera va aria-hidden en el marcado). */
  for (const fila of pista.querySelectorAll('.nat-cinta__fila')) {
    const grupos = fila.querySelectorAll('.nat-cinta__grupo');
    if (grupos.length === 1) fila.appendChild(grupos[0].cloneNode(true));
  }

  pista.classList.add('cinta-lista');

  /* Distancia de la pista al techo del documento (cadena de offsetTop) y
     recorrido útil (alto de la pista menos una pantalla). NINGUNO DE LOS DOS
     cambia al desplazarse: sólo al redimensionar o cuando la maqueta de
     encima termina de asentarse. Se cachean aquí y el cuadro no vuelve a
     preguntar por maqueta. */
  let techo = 0;
  let recorrido = 0;
  const medir = () => {
    let y = 0;
    let nodo = pista;
    while (nodo) {
      y += nodo.offsetTop;
      nodo = nodo.offsetParent;
    }
    techo = y;
    recorrido = pista.offsetHeight - window.innerHeight;
  };
  medir();

  const limitar = (v) => Math.max(0, Math.min(1, v));
  const suave = (t) => t * t * (3 - 2 * t);
  let pendiente = false;

  /* Cerrojo de cercanía: fuera del margen, ni un cálculo. Se CONMUTA, nunca
     se desobserva. */
  let cerca = true;

  function cuadro() {
    pendiente = false;
    if (recorrido <= 0) return; // pista más corta que la pantalla
    const p = limitar((window.scrollY - techo) / recorrido);
    const tramo = (a, b) => suave(limitar((p - a) / (b - a)));

    /* El guion, calcado del ritmo de «La Prueba»: la banda se despliega en
       el primer tercio, reina sola hasta pasada la mitad, y solo entonces
       entran el velo y la cifra. */
    pista.style.setProperty('--entrada', tramo(0, 0.34).toFixed(3));
    pista.style.setProperty('--texto', tramo(0.55, 0.8).toFixed(3));
  }

  const alDesplazar = () => {
    if (!cerca || pendiente) return;
    pendiente = true;
    requestAnimationFrame(cuadro);
  };

  const alRedimensionar = () => { medir(); alDesplazar(); };

  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entradas) => {
      cerca = entradas[0].isIntersecting;
      if (cerca) alDesplazar();
    }, { rootMargin: '100% 0px' }).observe(pista);
  }

  addEventListener('scroll', alDesplazar, { passive: true });
  addEventListener('resize', alRedimensionar);
  /* Las 24 fotografías de la banda son `lazy`: la pista puede cambiar de alto
     mucho después del primer cálculo, y sin volver a medir el recorrido se
     quedaría con el valor de antes (el mismo remate que ya tiene
     js/escena-planes.js). */
  addEventListener('load', alRedimensionar);
  alDesplazar();
})();
