/* ==========================================================================
   LA CINTA DEL CONCURSO — motor de la escena por scroll  (v7)

   Mismo patrón que `escenaPorScroll()` del sitio de Rafael Silva (Hotel
   Terra Barichara), reconstruido para este sitio: una pista alta con el
   escenario clavado (sticky) dentro, y el avance por la pista traducido a
   dos variables CSS que el stylesheet convierte en clip-path / opacity /
   transform. Aquí no se decide ni un estilo: solo se mide cuánto se lleva
   recorrido.

   CONTRATO (ver styles/sections/naturaleza.css, bloque LA CINTA):
     · El CSS hornea el estado RESUELTO. Este script, al arrancar, clona el
       grupo de cada fila (para el loop sin costura) y añade `.cinta-lista`:
       recién ahí existen la pista de 300svh y las variables.
     · Con prefers-reduced-motion: reduce el script se retira entero: ni
       clase, ni clones, ni oyentes. La escena queda como la dejó el CSS.
     · La posición de la pista se mide con la CADENA DE offsetTop y se
       cachea; en el cuadro solo se leen scrollY y offsetHeight. Nunca
       getBoundingClientRect() durante el desplazamiento: la escena vive en
       transición casi permanente y esa lectura forzaría layout en cada
       cuadro.
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

  /* Distancia de la pista al techo del documento, por la cadena de
     offsetTop. Se recalcula solo al redimensionar. */
  let techo = 0;
  const medir = () => {
    let y = 0;
    let nodo = pista;
    while (nodo) {
      y += nodo.offsetTop;
      nodo = nodo.offsetParent;
    }
    techo = y;
  };
  medir();

  const limitar = (v) => Math.max(0, Math.min(1, v));
  const suave = (t) => t * t * (3 - 2 * t);
  let pendiente = false;

  function cuadro() {
    pendiente = false;
    const recorrido = pista.offsetHeight - window.innerHeight;
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
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(cuadro);
  };

  addEventListener('scroll', alDesplazar, { passive: true });
  addEventListener('resize', () => { medir(); alDesplazar(); });
  alDesplazar();
})();
