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

  /* ------------------------------------------------------------------------
     ARREGLO DE AGOSTO DE 2026 — «esto de los vídeos se ven quietos»

     EL DIAGNÓSTICO. No era la animación: era el CALENDARIO. El observador
     original arrancaba la reproducción con el clip ya un 20 % dentro de la
     pantalla, y ése es TAMBIÉN el instante en el que `preload="none"` deja de
     valer y el navegador pide el archivo por primera vez. O sea: la descarga
     de un vídeo de varios megas empezaba cuando el clip ya estaba a la vista.
     En una conexión de móvil eso son segundos enseñando el póster —una foto
     fija— y, con lo alta que es esta banda, hay muchas probabilidades de que
     el visitante la haya pasado entera antes del primer fotograma. Lo que el
     cliente ve como «vídeos quietos» son cuatro vídeos que no llegaron a
     empezar.

     EL ARREGLO. Se parten en dos los dos trabajos que antes hacía un solo
     observador, porque tienen momentos distintos:

       1. OBSERVADOR DE PRECARGA, con `rootMargin` de una pantalla y media por
          arriba y por abajo. No reproduce: sólo sube `preload` a 'auto' para
          que el navegador empiece a llenar el búfer MIENTRAS el visitante
          todavía está leyendo #planes. Cuando la banda llega, el clip ya
          tiene fotogramas.
       2. OBSERVADOR DE REPRODUCCIÓN, con `threshold: 0.01` en vez de 0,2. Con
          piezas de más de 500 px de alto, esperar a un quinto significaba
          esperar a más de 100 px de recorrido después de asomar. Ahora el
          clip está corriendo desde que asoma el primer píxel, que es lo que
          hace que la banda se sienta viva al entrar en ella y no un cuarto de
          pantalla después.

     LO QUE NO CAMBIA: el trato con el usuario del encabezado sigue intacto.
     Nada se descarga al abrir la página; lo que se adelanta es el momento de
     la descarga DENTRO del recorrido, no el hecho de descargar. Quien nunca
     baje hasta cerca de esta banda no paga un solo byte de vídeo.

     LAS DOS CLASES QUE ESTE ARCHIVO PONE EN EL <video>, y para qué las quiere
     momentos.css §4 bis:
       · `en-marcha`   — la reproducción arrancó DE VERDAD (la promesa de
                         play() resolvió). Es la que enciende el ken-burns.
                         No se pone al pedir play, sino al conseguirlo: sobre
                         un póster fijo el zoom sería un carrusel de banco de
                         imágenes.
       · `en-pantalla` — el clip está a la vista. Al quitarla, la hoja pausa
                         la animación (`animation-play-state`), porque una
                         animación corriendo invisible es batería quemada.
     Ninguna de las dos crea, borra ni reordena elementos: este archivo sigue
     sin tocar la estructura del DOM.
     ------------------------------------------------------------------------ */

  function precargar(clip) {
    if (clip.preload !== 'auto') clip.preload = 'auto';
  }

  function arrancar(clip) {
    if (menosMovimiento.matches || document.hidden) return;
    /* preload="none" ya cumplió su función; a partir de aquí el navegador
       puede seguir llenando el búfer del bucle. */
    precargar(clip);
    const promesa = clip.play();
    if (promesa && typeof promesa.then === 'function') {
      /* La clase de movimiento se pone SÓLO si la promesa resuelve. iOS en
         bajo consumo la rechaza y ahí lo correcto es quedarse con el póster
         quieto: un póster que hace zoom miente sobre lo que está pasando. */
      promesa.then(() => clip.classList.add('en-marcha')).catch(() => {});
    } else {
      /* Navegador viejo sin promesa en play(): no hay forma de confirmar, así
         que se confía en el evento propio del medio, que es más honesto que
         suponerlo. */
      clip.addEventListener(
        'playing',
        () => clip.classList.add('en-marcha'),
        { once: true }
      );
    }
  }

  function pausar(clip) {
    if (!clip.paused) clip.pause();
  }

  /* 1. PRECARGA. `rootMargin` en px y no en %: el % de rootMargin se mide
     contra la raíz, y aquí se quiere una distancia de recorrido estable, no
     una que dependa del alto de la ventana del visitante.

     LA DISTANCIA NO ES LA MISMA EN TELÉFONO QUE EN ESCRITORIO. 1200 px son
     más de dos pantallas de teléfono, y los cuatro clips juntos pesan varios
     megas: en datos móviles eso es bajarse la banda entera —en paralelo con
     las fotos de #planes— para un visitante que puede no llegar nunca a
     verla. 600 px siguen siendo más de media pantalla de aviso, que es de
     sobra para que el búfer llegue lleno; lo que se recorta es la apuesta,
     no el margen. En escritorio, donde la conexión suele ser fija y la
     pantalla más alta, se mantiene el 1200 de siempre.

     Y si el visitante ha pedido ahorro de datos, no se precarga nada: el
     clip se descargará cuando de verdad asome, que es lo que él pidió. */
  const estrecho = window.matchMedia('(max-width: 47.99em)').matches;
  const ahorroDatos = !!(navigator.connection && navigator.connection.saveData);
  const margenPrecarga = estrecho ? '600px 0px' : '1200px 0px';

  const observadorPrecarga = new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
      if (entrada.isIntersecting && !menosMovimiento.matches && !ahorroDatos) {
        precargar(entrada.target);
      }
    });
  }, { rootMargin: margenPrecarga });

  /* 2. REPRODUCCIÓN. Con que asome se considera en pantalla. */
  const observador = new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
      const clip = entrada.target;
      clip.classList.toggle('en-pantalla', entrada.isIntersecting);
      if (entrada.isIntersecting) {
        enPantalla.add(clip);
        arrancar(clip);
      } else {
        enPantalla.delete(clip);
        pausar(clip);
      }
    });
  }, {
    threshold: 0.01
  });

  clips.forEach((clip) => {
    observadorPrecarga.observe(clip);
    observador.observe(clip);
  });

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
        /* Se retira también la clase de movimiento: el ken-burns de
           momentos.css §4 bis ya está dentro de `no-preference`, pero si el
           clip se queda marcado como «en marcha» estando parado, la próxima
           vez que el visitante desactive la preferencia el zoom aparecería
           encima de un póster quieto durante el instante en que play() está
           resolviendo. */
        clip.classList.remove('en-marcha');
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
