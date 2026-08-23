/* ==========================================================================
   VEGAS DEL VERDE — usos-ovalo.js

   El óvalo de #usos: en cada una de las cinco tarjetas de «¿Qué puedes hacer
   en Vegas?» la foto de fondo se despliega en un óvalo que crece con el
   progreso de scroll de su propia tarjeta, y el bloque de texto (nombre,
   frase, aviso) se apaga en la misma proporción. Cuando la tarjeta cruza el
   centro de la ventana —su punto de mayor visibilidad, una tras otra porque
   cada una ocupa 100dvh— el óvalo llega a su máximo (cubre la tarjeta
   entera) y el texto a su mínimo (invisible). Al salir del centro, vuelve
   al reposo: óvalo pequeño, texto pleno.

   MISMO MECANISMO DE MEDICIÓN QUE js/foto-focus.js, A PROPÓSITO
   Posición de documento por la cadena `offsetTop` (inmune a los transforms
   de `.reveal`), NUNCA `getBoundingClientRect` durante una transición
   activa. Un solo cálculo por cuadro, con `requestAnimationFrame` y cerrojo
   de "ya hay uno pendiente". La curva de progreso (triángulo 0→1→0 más
   smoothstep) es la misma aritmética que usa foto-focus para centrar el
   efecto en el punto medio del recorrido de la pieza por el viewport.

   QUÉ ANIMA Y POR QUÉ CLIP-PATH ES UNA EXCEPCIÓN ANOTADA
   `opacity` en `.usos-tarjeta__marco` es compositor puro. `clip-path` en
   `.usos-tarjeta__foto` NO lo es en todos los navegadores, pero es la única
   forma de dibujar el óvalo que pidió el cliente —un `ellipse()` creciendo,
   no un rectángulo agrandándose— así que es la excepción consciente de este
   archivo (como el object-position de la ruta móvil de foto-focus). Un
   `ellipse(100% 100% at 50% 50%)` cubre la tarjeta completa: para un punto
   en la esquina de la caja, a 50% de ancho y 50% de alto del centro,
   (50/100)² + (50/100)² = 0.5 ≤ 1, así que la esquina queda dentro del
   óvalo y no se ve un rectángulo con las puntas cortadas.

   CERO PARPADEO POR CONSTRUCCIÓN
   El estado de reposo —sin este script, o con `prefers-reduced-motion:
   reduce`— es el CSS estático de usos.css: sin `clip-path` (foto completa,
   como hoy) y `.usos-tarjeta__marco` en su opacidad normal (texto visible).
   Este script nunca fija ese estado de partida: sólo escribe estilos en
   línea cuando calcula un progreso, y en progreso 0 esos estilos en línea
   son indistinguibles del reposo (óvalo pequeño concentrado, texto pleno).

   MARCADO: ninguno nuevo. Recorre `.usos-tarjeta` (el `<summary>` visible de
   cada `<details class="usos-detalle">`) y dentro de cada una toma
   `.usos-tarjeta__foto` (la <img> a sangre) y `.usos-tarjeta__marco` (el
   bloque de texto). Sin ellos dos, la tarjeta se ignora.

   Bajo `prefers-reduced-motion: reduce` el efecto no se monta: ni listeners
   ni estilos en línea, igual que foto-focus.js.
   ========================================================================== */
(() => {
  'use strict';

  const reducido = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reducido.matches) return;

  const piezas = [];
  document.querySelectorAll('.usos-tarjeta').forEach((tarjeta) => {
    const foto = tarjeta.querySelector('.usos-tarjeta__foto');
    const marco = tarjeta.querySelector('.usos-tarjeta__marco');
    if (!foto || !marco) return;
    piezas.push({ tarjeta, foto, marco, top: 0, alto: 1 });
  });
  if (!piezas.length) return;

  /* Margen fuera de la ventana en el que la tarjeta ya no se recalcula:
     el mismo valor que foto-focus.js. */
  const MARGEN = 80;

  /* Radios del óvalo en reposo (progreso 0) y en su máximo (progreso 1),
     en porcentaje de la caja. 100% de ancho y alto en el máximo cubre la
     tarjeta entera (ver comentario de cabecera); en reposo un óvalo chico
     y centrado, claramente concentrado y no un simple recorte. */
  const RX_MIN = 20;
  const RX_MAX = 100;
  const RY_MIN = 14;
  const RY_MAX = 100;

  const limpiar = () => {
    for (const pieza of piezas) {
      pieza.foto.style.clipPath = '';
      pieza.marco.style.opacity = '';
      pieza.marco.style.pointerEvents = '';
    }
  };

  /* Posición de documento por la cadena offsetTop, igual que foto-focus.js:
     inmune a los transforms de .reveal. offsetHeight mide la caja en
     reposo (100dvh, fijada por CSS, así que no varía por cuadro). */
  const medir = () => {
    for (const pieza of piezas) {
      let el = pieza.tarjeta;
      let top = 0;
      while (el) {
        top += el.offsetTop;
        el = el.offsetParent;
      }
      pieza.top = top;
      pieza.alto = pieza.tarjeta.offsetHeight || 1;
    }
  };

  let pendiente = false;
  let apagado = false;

  /* El mismo cálculo que foto-focus.js: `p` va de 0 (entrando por abajo) a
     2 (saliendo por arriba) y vale 1 con la tarjeta centrada; `t` lo pliega
     en un triángulo 0→1→0 y `e` lo suaviza (smoothstep). Progreso simétrico:
     nace del reposo, culmina en el centro, vuelve al reposo. */
  const cuadro = () => {
    pendiente = false;
    if (apagado) return;
    const altoVentana = window.innerHeight;
    const y = window.scrollY;

    for (const pieza of piezas) {
      const top = pieza.top - y;
      if (top + pieza.alto < -MARGEN || top > altoVentana + MARGEN) continue;

      const p = (altoVentana / 2 - top) / (pieza.alto / 2);
      const t = Math.max(0, Math.min(1, 1 - Math.abs(1 - p)));
      const e = t * t * (3 - 2 * t);

      const rx = RX_MIN + (RX_MAX - RX_MIN) * e;
      const ry = RY_MIN + (RY_MAX - RY_MIN) * e;
      pieza.foto.style.clipPath = 'ellipse(' + rx.toFixed(2) + '% ' + ry.toFixed(2) + '% at 50% 50%)';

      const opacidad = 1 - e;
      pieza.marco.style.opacity = opacidad.toFixed(3);
      /* Con el marco prácticamente invisible, su aviso deja de ser
         clicable: por debajo de 5 % de opacidad ya no se distingue del
         fondo, así que ahí se le quita el puntero. */
      pieza.marco.style.pointerEvents = opacidad < 0.05 ? 'none' : '';
    }
  };

  /* Un cálculo por cuadro como máximo, igual que foto-focus.js: cuadro
     inmediato más un remate cuando la ráfaga de scroll se asienta, para
     que un salto programático no deje el óvalo a medio camino. */
  let remate = 0;
  const alDesplazar = () => {
    if (apagado) return;
    if (!pendiente) {
      pendiente = true;
      requestAnimationFrame(cuadro);
    }
    clearTimeout(remate);
    remate = setTimeout(() => {
      if (apagado || pendiente) return;
      pendiente = true;
      requestAnimationFrame(cuadro);
    }, 140);
  };

  const alRedimensionar = () => {
    if (apagado) return;
    medir();
    alDesplazar();
  };

  /* Si la preferencia de menos movimiento se activa a mitad de visita, el
     efecto se desmonta entero: estilos fuera y listeners fuera, foto y
     texto vuelven a su reposo normal (CSS estático). */
  const alReducir = () => {
    if (!reducido.matches || apagado) return;
    apagado = true;
    clearTimeout(remate);
    window.removeEventListener('scroll', alDesplazar);
    window.removeEventListener('resize', alRedimensionar);
    window.removeEventListener('load', alRedimensionar);
    limpiar();
  };

  medir();
  reducido.addEventListener('change', alReducir);
  window.addEventListener('scroll', alDesplazar, { passive: true });
  window.addEventListener('resize', alRedimensionar);
  /* Red de seguridad: si algo por encima de #usos cambia de alto al
     terminar de cargar, se vuelve a medir (fotos lazy, fuentes, etc.). */
  window.addEventListener('load', alRedimensionar);

  alDesplazar();
})();
