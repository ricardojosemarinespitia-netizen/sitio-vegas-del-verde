/* ==========================================================================
   VEGAS DEL VERDE — js/momentos-video.js
   Reproducción PEREZOSA de los clips del muro de #momentos. Vanilla JS, sin
   dependencias, sin tocar el DOM más allá de play()/pause().

   EL TRATO CON EL USUARIO
     · Nada se descarga hasta que el clip entra en pantalla. En el HTML cada
       <video> lleva preload="none", así que hasta ese momento el navegador
       sólo ha pedido el póster (una foto de ~150 kB). Los cuatro clips juntos
       pesan varios megas: en un móvil con datos, cargarlos al abrir la página
       sería cobrarle al visitante una sección que ni siquiera ha visto.
     · Al salir de pantalla se pausan. Un bucle reproduciéndose fuera de la
       vista gasta batería y CPU a cambio de nada.
     · Con `prefers-reduced-motion: reduce` NO se reproduce ninguno: cada
       <video> se queda enseñando su póster, que es un fotograma del mismo
       clip. La sección sigue completa, sólo que quieta.
     · Sin JS o sin IntersectionObserver tampoco pasa nada malo: cuatro fotos
       fijas. Por eso este archivo no crea, no borra ni reordena elementos.

   POR QUÉ NO SE USA EL ATRIBUTO `autoplay`
     `autoplay` arranca la descarga en cuanto el navegador ve la etiqueta y
     anula el preload="none": los cuatro clips se bajarían aunque el visitante
     no llegue nunca a la banda de carbón. El arranque se hace desde aquí.

   POR QUÉ play() PUEDE FALLAR Y POR QUÉ NO SE AVISA
     Los navegadores sólo permiten reproducción automática si el vídeo está en
     silencio (`muted` + `playsinline`, ambos en el HTML), y aun así iOS la
     bloquea en modo de bajo consumo. La promesa se rechaza, se ignora en
     silencio y se queda el póster: exactamente el mismo suelo que en todos
     los demás casos. Un error en consola aquí sería ruido, no información.
   ========================================================================== */
(() => {
  'use strict';

  const clips = Array.prototype.slice.call(
    document.querySelectorAll('[data-momento-video]')
  );
  if (!clips.length) return;

  /* Navegador viejo: se queda el póster. No hay plan B con scroll + timers;
     un listener de scroll para esto costaría más de lo que resuelve. */
  if (!('IntersectionObserver' in window)) return;

  const menosMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* Qué clips están ahora mismo en pantalla. Hace falta recordarlo para poder
     reanudar cuando el usuario vuelve a la pestaña o desactiva la preferencia
     de movimiento reducido sin haber movido el scroll. */
  const enPantalla = new Set();

  function arrancar(clip) {
    if (menosMovimiento.matches || document.hidden) return;
    /* preload="none" ya cumplió su función; a partir de aquí el navegador
       puede seguir llenando el búfer del bucle. */
    if (clip.preload !== 'auto') clip.preload = 'auto';
    const promesa = clip.play();
    if (promesa && typeof promesa.catch === 'function') {
      promesa.catch(() => {});
    }
  }

  function pausar(clip) {
    if (!clip.paused) clip.pause();
  }

  const observador = new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
      const clip = entrada.target;
      if (entrada.isIntersecting) {
        enPantalla.add(clip);
        arrancar(clip);
      } else {
        enPantalla.delete(clip);
        pausar(clip);
      }
    });
  }, {
    /* Un quinto del clip visible basta para considerarlo «en pantalla»: con
       piezas de más de 500 px de alto, esperar a la mitad haría que el clip
       arrancase cuando ya lleva rato a la vista. */
    threshold: 0.2
  });

  clips.forEach((clip) => observador.observe(clip));

  /* La pestaña deja de estar visible: se pausa todo. Al volver, se reanuda
     sólo lo que sigue en pantalla. */
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      clips.forEach(pausar);
    } else {
      enPantalla.forEach(arrancar);
    }
  });

  /* El usuario puede cambiar la preferencia de movimiento con la página
     abierta (es un ajuste del sistema). Si la activa, todo se para y vuelve al
     primer fotograma; si la desactiva, se reanuda lo que esté a la vista.
     addListener() es el nombre viejo del método: Safari lo necesitó hasta 2022
     y aquí cuesta una línea mantenerlo. */
  function alCambiarPreferencia() {
    if (menosMovimiento.matches) {
      clips.forEach((clip) => {
        pausar(clip);
        clip.currentTime = 0;
      });
    } else {
      enPantalla.forEach(arrancar);
    }
  }

  if (typeof menosMovimiento.addEventListener === 'function') {
    menosMovimiento.addEventListener('change', alCambiarPreferencia);
  } else if (typeof menosMovimiento.addListener === 'function') {
    menosMovimiento.addListener(alCambiarPreferencia);
  }
})();
