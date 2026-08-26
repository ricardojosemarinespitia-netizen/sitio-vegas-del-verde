/* ============================================================================
   LA RESPIRACIÓN — portada del carril 04 (#planes, «Bienestar»)

   Este archivo NO anima nada: pone y quita UNA clase (`respirando`) sobre la
   banda de bienestar según esté o no en pantalla, y todo el movimiento real
   —el `scale` de la foto y la `opacity` del velo— vive en @keyframes de
   styles/sections/planes.css §6 ter. Mismo reparto de papeles que
   escena-planes.js: el JS mide/decide, el CSS mueve.

   POR QUÉ UN OBSERVER Y NO `animation-timeline: view()`: la respiración es
   un ciclo de RELOJ —sigue su compás con la página quieta— y `view()` ata el
   progreso a la posición de scroll, que es el patrón contrario. El observer
   sólo enciende y apaga el ciclo para que no corra un keyframe infinito en
   una banda que nadie ve.

   AL SALIR SE QUITA LA CLASE y la foto vuelve de golpe a scale(1): no
   importa, ocurre fuera de pantalla y al volver a entrar el ciclo arranca
   limpio desde la inhalación.

   `prefers-reduced-motion` se resuelve DOS VECES, igual que en
   escena-planes.js y por el mismo motivo: el <script> de planes.html ya
   filtra la descarga, y esta guarda cubre a quien importe el módulo desde
   otro sitio. Sin el motor, el CSS estático deja la banda quieta con el velo
   pleno — que es además su fotograma de mejor contraste.
   ========================================================================== */

/**
 * Enciende la respiración de la banda del carril 04: mientras la banda esté
 * en el viewport lleva la clase `respirando`; al salir se le retira.
 */
export function activarRespiracionBienestar() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const banda = document.querySelector('.planes-bienestar__banda');
  if (!banda || !('IntersectionObserver' in window)) return;

  // A diferencia del revelado de contenido, este observer NO se desobserva:
  // el compás debe apagarse al salir y volver a arrancar al entrar. Umbral 0:
  // basta un borde de la banda asomando para que ya se la vea respirar.
  const io = new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
      entrada.target.classList.toggle('respirando', entrada.isIntersecting);
    });
  });
  io.observe(banda);
}
