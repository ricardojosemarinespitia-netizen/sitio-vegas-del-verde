/* ==========================================================================
   COLEGIOS · el cuaderno de campo — lo poco que necesita JavaScript
   --------------------------------------------------------------------------
   Todo el movimiento de colegios.html vive en CSS (styles/sections/
   colegios.css §3, §6 y §8) y lo enciende app.js con sus observadores. Este
   módulo sólo cubre dos cosas que el CSS no puede hacer solo:

   1. LA CIFRA QUE CUENTA. «40.000 m²» sube de cero al entrar en pantalla,
      con separador de miles en es-CO. app.js ya trae un contador
      (data-contador) pero escribe el entero pelado —«40000»— y en Colombia
      un número sin punto de miles se lee mal. Aquí se formatea con
      Intl.NumberFormat('es-CO'). Misma curva que la de app.js (cúbica de
      salida) para que las dos cuenten al mismo pulso. El valor final está
      ESCRITO en el HTML: sin JS se lee entero desde el primer pintado.

   2. EL RESPALDO DEL MARGEN DEL CUADERNO. La línea de las cinco aulas se
      dibuja con `animation-timeline: view()` donde exista. Donde no —Safari
      viejo, Firefox sin la bandera—, este módulo le pone `.col-ruta--lista`
      al <svg> cuando la lista asoma y el trazo se dibuja con la transición
      larga que declara el CSS. Se rearma al salir, como los iconos de
      trazo, para que se vuelva a ver al subir.

   Con prefers-reduced-motion la cifra se escribe de golpe y la línea sale
   dibujada desde el CSS: aquí no se monta nada.
   ========================================================================== */
(function () {
  'use strict';

  var quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hayIO = 'IntersectionObserver' in window;

  /* ----------------------------------------------------------- 1. la cifra */
  var cifras = document.querySelectorAll('[data-cifra]');
  var formato = new Intl.NumberFormat('es-CO');

  function contar(el) {
    var destino = parseInt(el.getAttribute('data-cifra'), 10);
    if (isNaN(destino)) return;
    if (quieto) { el.textContent = formato.format(destino); return; }
    var duracion = 1400;
    var inicio = performance.now();
    function paso(ahora) {
      var t = Math.min(1, (ahora - inicio) / duracion);
      var ease = 1 - Math.pow(1 - t, 3);
      el.textContent = formato.format(Math.round(destino * ease));
      if (t < 1) requestAnimationFrame(paso);
      else el.textContent = formato.format(destino);
    }
    requestAnimationFrame(paso);
  }

  if (cifras.length) {
    if (!hayIO || quieto) {
      cifras.forEach(function (el) { el.textContent = formato.format(parseInt(el.getAttribute('data-cifra'), 10)); });
    } else {
      var ioCifra = new IntersectionObserver(function (entradas, obs) {
        entradas.forEach(function (entrada) {
          if (!entrada.isIntersecting) return;
          contar(entrada.target);
          obs.unobserve(entrada.target);
        });
      }, { threshold: 0.6 });
      cifras.forEach(function (el) { ioCifra.observe(el); });
    }
  }

  /* ---------------------------------------------- 2. el margen del cuaderno */
  var ruta = document.querySelector('.col-ruta');
  if (!ruta || quieto) return;

  var soportaScroll = window.CSS && CSS.supports && CSS.supports('animation-timeline: view()');
  if (soportaScroll) return;            // lo dibuja el compositor, no hay nada que hacer

  var lista = ruta.parentElement;
  if (!hayIO) { ruta.classList.add('col-ruta--lista'); return; }

  new IntersectionObserver(function (entradas) {
    entradas.forEach(function (entrada) {
      ruta.classList.toggle('col-ruta--lista', entrada.isIntersecting);
    });
  }, { threshold: 0, rootMargin: '0px 0px -20% 0px' }).observe(lista);
})();
