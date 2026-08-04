/* ==========================================================================
   Vegas del Verde — vídeo de #naturaleza.  Vanilla JS, sin dependencias.

   Qué hace, y sólo esto:
     · reproduce un <video data-video-escena> cuando entra en pantalla;
     · lo pausa en cuanto sale, y también si la pestaña se va al fondo;
     · con `prefers-reduced-motion: reduce` NO lo reproduce nunca: se queda
       el póster quieto, que es la imagen fija del propio metraje.

   Qué NO hace: no pone controles, no pone icono de play, no quita el póster
   y no toca el sonido —el metraje no tiene pista de audio—. Si este archivo
   no llega, si el navegador no trae IntersectionObserver o si bloquea la
   reproducción automática, la página se queda con el póster y no se rompe
   nada: el <video> ya es válido y visible sin JavaScript.
   ========================================================================== */
(() => {
  'use strict';

  const piezas = document.querySelectorAll('video[data-video-escena]');
  if (!piezas.length) return;

  const menosMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)');

  function parar(video) {
    if (!video.paused) video.pause();
  }

  function reproducir(video) {
    if (menosMovimiento.matches) return;
    /* `muted` va en el atributo, pero Safari sólo se fía de la PROPIEDAD:
       sin esto la promesa de play() se rechaza por política de autoplay. */
    video.muted = true;
    const promesa = video.play();
    /* Un rechazo aquí no es un error de la página: es el navegador diciendo
       que no reproduce solo. Se traga en silencio y queda el póster. */
    if (promesa && typeof promesa.catch === 'function') promesa.catch(() => {});
  }

  if (!('IntersectionObserver' in window)) return;

  /* Quién está ahora mismo en pantalla. Hace falta llevar la cuenta porque el
     observador sólo avisa cuando algo CAMBIA: al volver de una pestaña en
     segundo plano no se dispara ninguna entrada nueva y, sin esta lista, el
     vídeo se quedaría congelado para siempre delante del visitante. */
  const enPantalla = new Set();

  /* El umbral es bajo a propósito: el metraje es VERTICAL y en escritorio la
     columna mide más que media pantalla, así que exigir la mitad visible
     dejaría el vídeo parado justo cuando ya se está mirando. */
  const io = new IntersectionObserver(entradas => {
    entradas.forEach(entrada => {
      const video = entrada.target;
      if (entrada.isIntersecting) {
        enPantalla.add(video);
        if (!document.hidden) reproducir(video);
      } else {
        enPantalla.delete(video);
        parar(video);
      }
    });
  }, { threshold: 0.2 });

  piezas.forEach(video => io.observe(video));

  /* Si el visitante pide menos movimiento a mitad de sesión, se para todo. */
  const alCambiarPreferencia = evento => {
    if (evento.matches) piezas.forEach(parar);
    else enPantalla.forEach(reproducir);
  };
  if (typeof menosMovimiento.addEventListener === 'function') {
    menosMovimiento.addEventListener('change', alCambiarPreferencia);
  } else if (typeof menosMovimiento.addListener === 'function') {
    menosMovimiento.addListener(alCambiarPreferencia);
  }

  /* Pestaña al fondo: nada que mirar, nada que decodificar. Al volver, se
     retoma sólo lo que siga en pantalla. */
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) piezas.forEach(parar);
    else enPantalla.forEach(reproducir);
  });
})();
