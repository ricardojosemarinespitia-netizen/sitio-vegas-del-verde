/* ==========================================================================
   PLAN VECINO · la portada viva
   --------------------------------------------------------------------------
   El enjambre de mariposas y el colibrí salen recortados de la portada de
   marca «animacion portada.jpeg». Las coordenadas de abajo son las que cada
   pieza ocupa ALLÍ, en tanto por ciento de su propia caja, para que en la web
   el enjambre conserve el dibujo original en vez de una dispersión inventada.

   La entrada: nacen diminutos abajo, en la mitad inferior de la lámina, y
   suben derecho hasta su sitio mientras crecen a su tamaño real — no vienen
   del centro de la escena, vienen de abajo. Después se quedan volando en
   corto, sin desplazarse, para que la portada respire sin distraer.

   El vuelo se dispara cuando la portada entra en pantalla y se REARMA al
   salir, así que se puede volver a ver cada vez que se sube. Antes ocurría
   una sola vez al cargar y quien bajaba y volvía no veía nada.

   Todo esto es decorado: el contenedor va con aria-hidden y se construye
   desde JavaScript, así que sin JS la portada se lee igual, sólo que quieta.
   Con `prefers-reduced-motion` las piezas aparecen ya colocadas y quietas.
   ========================================================================== */
(function () {
  'use strict';

  var caja = document.querySelector('[data-bichos]');
  if (!caja) return;

  var portada = caja.closest('.pv-portada') || caja.parentElement;
  var quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* x, y, w, h en % de la caja del enjambre (medidos sobre la portada) */
  var MARIPOSAS = [
    { n: 1,  x: 19.3, y: 4.5,  w: 25.3, h: 16.1 },
    { n: 2,  x: 45.7, y: 5.5,  w: 12.0, h: 8.9  },
    { n: 3,  x: 63.7, y: 5.9,  w: 23.0, h: 16.8 },
    { n: 4,  x: 0.7,  y: 6.8,  w: 14.0, h: 9.8  },
    { n: 5,  x: 50.0, y: 14.5, w: 14.0, h: 10.2 },
    { n: 6,  x: 9.7,  y: 17.1, w: 13.7, h: 10.2 },
    { n: 7,  x: 23.7, y: 21.1, w: 13.0, h: 8.6  },
    { n: 8,  x: 37.3, y: 21.1, w: 24.7, h: 17.5 },
    { n: 9,  x: 2.3,  y: 28.6, w: 14.0, h: 9.3  },
    { n: 10, x: 11.3, y: 34.5, w: 24.3, h: 15.0 },
    { n: 11, x: 35.3, y: 40.2, w: 14.0, h: 9.5  },
    { n: 12, x: 4.3,  y: 45.2, w: 11.0, h: 7.9  },
    { n: 13, x: 51.0, y: 48.0, w: 13.0, h: 9.1  },
    { n: 14, x: 34.3, y: 50.4, w: 24.0, h: 16.8 },
    { n: 15, x: 13.0, y: 50.7, w: 16.0, h: 10.5 },
    { n: 16, x: 5.3,  y: 61.8, w: 24.0, h: 15.0 },
    { n: 17, x: 29.0, y: 66.2, w: 12.7, h: 8.2  },
    { n: 18, x: 43.0, y: 70.9, w: 13.7, h: 9.1  },
    { n: 19, x: 18.7, y: 76.4, w: 14.0, h: 9.8  },
    { n: 20, x: 35.7, y: 80.9, w: 15.0, h: 9.5  },
    { n: 21, x: 22.3, y: 89.3, w: 12.0, h: 8.6  }
  ];

  var dos = function (n) { return n < 10 ? '0' + n : String(n); };

  /* ---------------------------------------------------------------- montaje */
  var enjambre = document.createElement('div');
  enjambre.className = 'pv-enjambre';

  var piezas = [];

  MARIPOSAS.forEach(function (m, i) {
    var img = document.createElement('img');
    img.className = 'pv-bicho pv-mariposa';
    img.src = 'img/plan-vecino/mariposa-' + dos(m.n) + '.png';
    img.alt = '';
    img.setAttribute('aria-hidden', 'true');
    img.decoding = 'async';
    img.style.left = m.x + '%';
    img.style.top = m.y + '%';
    img.style.width = m.w + '%';
    /* Cada una con su propio compás: si todas aletean igual, el enjambre
       parece una calcomanía. El desfase sale del índice, no de un azar, para
       que la escena se vea igual en cada carga. */
    img.style.setProperty('--pv-aleteo', (1.7 + ((i * 7) % 11) / 10).toFixed(2) + 's');
    img.style.setProperty('--pv-vaiven', (3.2 + ((i * 5) % 17) / 5).toFixed(2) + 's');
    img.style.setProperty('--pv-desfase', (-((i * 13) % 21) / 10).toFixed(2) + 's');
    img.style.setProperty('--pv-giro', (((i * 11) % 15) - 7) + 'deg');
    /* Escalonado de llegada: las grandes (las del frente) aterrizan antes */
    img.style.setProperty('--pv-espera', (60 + i * 55) + 'ms');
    enjambre.appendChild(img);
    piezas.push(img);
  });

  var colibri = document.createElement('img');
  colibri.className = 'pv-bicho pv-colibri';
  colibri.src = 'img/plan-vecino/colibri.png';
  colibri.alt = '';
  colibri.setAttribute('aria-hidden', 'true');
  colibri.decoding = 'async';
  colibri.style.setProperty('--pv-espera', '220ms');
  piezas.push(colibri);

  caja.appendChild(enjambre);
  caja.appendChild(colibri);

  if (quieto) {
    piezas.forEach(function (p) { p.classList.add('esta-puesto', 'sin-vuelo'); });
    return;
  }

  /* ------------------------------------------------- de dónde nacen y arranque
     Cada pieza nace más abajo de su sitio final y sube derecho hasta él —no
     converge desde el centro de la lámina, sólo asciende—. El origen es un
     punto fijo bajo la mitad inferior de la escena; el desplazamiento se mide
     de verdad sobre el layout ya resuelto —no a ojo— para que la trayectoria
     termine exactamente en su sitio a cualquier ancho. */
  /* Posición de reposo de una pieza dentro de la lámina, SIN contar
     transformaciones. Se suma la cadena de offsetTop hasta la lámina.

     ESTO ES LA CORRECCIÓN DEL BUG «a veces sube y a veces no».
     Antes se medía con getBoundingClientRect(), que devuelve la caja YA
     TRANSFORMADA. Al volver a entrar en pantalla, las piezas seguían
     desplazadas hacia abajo por el rearme —o a medio camino de la
     transición— así que la resta daba casi cero y el vuelo no ocurría: la
     pieza «aparecía» en su sitio en vez de subir. Con offsetTop se lee la
     posición de maqueta, que no cambia nunca, y el trayecto sale idéntico
     en todas y cada una de las veces. */
  function topDeMaqueta(el) {
    var y = 0, n = el;
    while (n && n !== portada) { y += n.offsetTop; n = n.offsetParent; }
    return y;
  }

  function medir() {
    // Punto de partida: bien abajo en la lámina, no en su centro geométrico.
    // Con 0.82 de la altura, hasta las mariposas que terminan cerca del techo
    // recorren un ascenso claro sin que la más baja del enjambre tenga que
    // nacer fuera de la lámina.
    var cy = portada.offsetHeight * 0.82;
    piezas.forEach(function (p) {
      if (!p.offsetHeight) return;
      // Sin arrastre horizontal: sube en línea recta hasta su sitio.
      p.style.setProperty('--pv-dx', '0px');
      p.style.setProperty('--pv-dy',
        Math.round(cy - (topDeMaqueta(p) + p.offsetHeight / 2)) + 'px');
    });
  }

  /* EL PUNTO DE PARTIDA SE COLOCA SIN ANIMAR. Esto es lo que arregla el
     «en la primera carga no sale de abajo».

     Al arrancar, --pv-dy todavía no existe, así que la pieza está en su sitio
     final (dy = 0) y diminuta. Si `medir()` escribe --pv-dy con la transición
     ACTIVA, cambiar esa variable cambia el transform y la pieza empieza a
     viajar hacia abajo durante 1,5 s. Dos fotogramas después se le añade
     `esta-puesto` y se le manda subir — pero apenas ha bajado unos píxeles,
     así que «sube» desde casi su destino: se ve aparecer, no volar.

     Por eso al bajar y volver sí funcionaba: el rearme ya la había dejado
     abajo de verdad, y desde ahí el vuelo era el bueno.

     Ahora se apaga la transición, se coloca abajo de golpe, se reactiva en el
     fotograma siguiente y sólo entonces se lanza el vuelo. Primera carga y
     reentradas quedan idénticas. */
  function soltar() {
    piezas.forEach(function (p) { p.classList.add('sin-transicion'); });
    medir();
    void portada.offsetHeight;          // aplica el salto al punto de partida
    requestAnimationFrame(function () {
      piezas.forEach(function (p) { p.classList.remove('sin-transicion'); });
      requestAnimationFrame(function () {
        piezas.forEach(function (p) { p.classList.add('esta-puesto'); });
      });
    });
  }

  /* Rearme: devuelve las piezas abajo y diminutas para que el vuelo se pueda
     volver a ver. Sin esto el efecto ocurre una sola vez en toda la visita y
     quien baja y vuelve a subir a la portada no ve nada.

     Va DE GOLPE, con la transición apagada. Si se deja animar, las piezas
     tardan segundo y medio en bajar y quien vuelve a subir antes las pilla a
     medio camino: el vuelo arranca desde donde estén y unas suben y otras
     casi no. Cortando la transición, el punto de partida es siempre el
     mismo. */
  function recoger() {
    piezas.forEach(function (p) {
      p.classList.add('sin-transicion');
      p.classList.remove('esta-puesto');
    });
    void portada.offsetHeight;            // fuerza el salto antes de re-armar
    piezas.forEach(function (p) { p.classList.remove('sin-transicion'); });
  }

  /* Se espera a que los PNG estén decodificados: si se lanza el vuelo con las
     imágenes a medio cargar, las piezas aparecen de golpe ya posadas y se
     pierde justo el efecto. Con tope de tiempo, para que un fallo de red no
     deje la portada vacía. */
  var pendientes = piezas.length;
  var cargado = false;
  var enPantalla = false;

  function lanzar() {
    if (!cargado || !enPantalla) return;
    soltar();
  }
  function marcarCargado() {
    if (cargado) return;
    cargado = true;
    lanzar();
  }
  piezas.forEach(function (p) {
    var listo = function () { if (--pendientes <= 0) marcarCargado(); };
    if (p.complete && p.naturalWidth) listo();
    else { p.addEventListener('load', listo, { once: true });
           p.addEventListener('error', listo, { once: true }); }
  });
  setTimeout(marcarCargado, 2200);

  /* El vuelo se dispara al entrar la portada en pantalla y se rearma al
     salir, igual que el dibujado de los iconos: así se puede volver a ver
     cada vez que se sube. Si no hay IntersectionObserver, vuela al cargar. */
  if (!('IntersectionObserver' in window)) {
    enPantalla = true;
    lanzar();
  } else {
    new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        enPantalla = entrada.isIntersecting;
        if (enPantalla) lanzar();
        else recoger();
      });
    }, { threshold: 0.25 }).observe(portada);
  }

  /* Si se redimensiona antes de que lleguen, se recalcula el origen. */
  var t;
  window.addEventListener('resize', function () {
    clearTimeout(t);
    t = setTimeout(medir, 120);
  }, { passive: true });
})();
