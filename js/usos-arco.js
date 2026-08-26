/* ==========================================================================
   VEGAS DEL VERDE — usos-arco.js
   (antes `usos-ovalo.js`; el nombre cambió con el gesto, ver «QUÉ CAMBIÓ»)

   EL ARCO QUE CRECE, en las cinco tarjetas de «¿Qué puedes hacer en Vegas?».
   Cada tarjeta se ve en reposo con la silueta de arco que le da usos.css
   —medio punto arriba, lados rectos, borde recto abajo con las dos esquinas
   apenas curvas—, y alrededor se ve el fondo crema. A medida que la tarjeta
   sube hacia el centro de la ventana, ESA MISMA SILUETA crece: no cambia de
   forma, cambia de tamaño. Su cúpula se sale por arriba y sus costados por
   los lados, hasta que ningún borde del arco queda dentro de la pantalla y
   sólo se ve la fotografía a sangre. Al salir del centro, el arco vuelve a
   entrar en cuadro y regresa a su reposo.

   QUÉ CAMBIÓ respecto del intento anterior. Antes esto dibujaba un
   `ellipse()` que crecía: un óvalo, una forma DISTINTA de la que la tarjeta
   tiene en reposo, así que el gesto se leía como «aparece un óvalo» en vez
   de «el arco se acerca». Ahora la única variable es la escala del arco.

   CÓMO SE DIBUJA, Y POR QUÉ EN EL <summary> Y NO EN LA <img>
   El arco se aplica como `clip-path: path(...)` sobre `.usos-tarjeta`, la
   misma caja que hasta ahora lo llevaba como `border-radius` + `overflow:
   hidden`. Tiene que ser esa caja y no la foto porque el arco recorta por
   igual foto, velo, marco de texto y pastilla de aforo; si el recorte
   bajara sólo a la <img>, la pastilla de aforo quedaría flotando sobre el
   crema en el reposo, fuera de la silueta. Con el recorte arriba, todo lo
   de la tarjeta entra y sale del arco a la vez, que es lo que el ojo espera.

   Mientras el script gobierna la silueta, el `border-radius` estático se
   pone en línea a `0`: si se dejara, seguiría recortando la caja al arco
   pequeño y el crecimiento no se vería. No hay salto al hacer el relevo
   porque en progreso 0 el `path()` reproduce exactamente el mismo arco que
   dibujaba el `border-radius` (mismos radios: rx = ancho/2, ry = alto/2
   arriba; el radio de `--radio-md` abajo, leído de la propia caja).

   LA GEOMETRÍA, en una línea: el arco se escala por un factor `s` alrededor
   del centro de su borde inferior. Así el borde recto de abajo se queda
   clavado en el suelo de la tarjeta —el arco no «flota»— y todo lo demás se
   aleja del centro. Con rx = A/2 y ry = H/2, la esquina superior de la
   ventana queda cubierta cuando (1/s)² + ((2−s)/s)² ≤ 1, o sea a partir de
   s = 1,25; `S_MAX` va a 1,7 para que la pantalla llene con holgura antes
   del centro y se mantenga llena mientras la tarjeta lo cruza.

   MISMO MECANISMO DE MEDICIÓN QUE js/foto-focus.js, A PROPÓSITO
   Posición de documento por la cadena `offsetTop` (inmune a los transforms
   de `.reveal`), NUNCA `getBoundingClientRect` durante una transición
   activa. Las medidas de la caja (`offsetWidth`/`offsetHeight`) se toman
   sólo en `medir()` —arranque, `resize`, `load`—, nunca por cuadro. Un solo
   cálculo por cuadro, con `requestAnimationFrame` y cerrojo de «ya hay uno
   pendiente». La curva de progreso (triángulo 0→1→0 más smoothstep) es la
   misma aritmética que usa foto-focus para centrar el efecto en el punto
   medio del recorrido de la pieza por el viewport.

   v16 · ESTE ARCHIVO YA NO TOCA EL TEXTO. Hasta la v15 escribía también
   `opacity` en línea sobre `.usos-tarjeta__marco`, igual a `1 − e`: el
   texto se apagaba con la misma curva con la que crecía el arco. El error
   de fondo es que cada tarjeta mide 100dvh, así que «tarjeta centrada»
   —donde `e` vale 1 y la opacidad 0— es exactamente «tarjeta en posición de
   lectura». El título, la frase y el aviso llegaban a invisibles justo
   cuando había que leerlos, y a media opacidad durante todo el tramo
   previo. El cliente lo reportó como «el efecto no deja leer el texto», y
   tenía razón literal.

   Ahora este script gobierna UNA sola cosa —la silueta de `.usos-tarjeta`—
   y el texto es asunto exclusivo de usos.css, que lo deja en opacidad plena
   y le da su propia entrada con `animation-timeline: view()`. Un motor por
   pieza: la lección que este proyecto ya aprendió varias veces.

   QUÉ ANIMA Y POR QUÉ CLIP-PATH ES UNA EXCEPCIÓN ANOTADA
   `clip-path` no es compositor puro en todos los navegadores,
   pero es la única forma de recortar la caja
   con una silueta que crece manteniendo su dibujo; la alternativa —agrandar
   la caja con `transform: scale()`— movería también el texto, la pastilla
   de aforo y la maqueta de la sección. Es la excepción consciente de este
   archivo (como el object-position de la ruta móvil de foto-focus), y se
   paga sólo en las una o dos tarjetas visibles a la vez.

   CERO PARPADEO POR CONSTRUCCIÓN
   El estado de reposo —sin este script, o con `prefers-reduced-motion:
   reduce`— es el CSS estático de usos.css: el arco hecho con
   `border-radius` + `overflow: hidden`, y el texto legible. Este script
   nunca fija ese estado de partida: sólo escribe estilos en línea cuando
   calcula un progreso, y en progreso 0 esos estilos son indistinguibles del
   reposo.

   MARCADO: ninguno nuevo. Recorre `.usos-tarjeta` (el `<summary>` visible de
   cada `<details class="usos-detalle">`) y no busca nada dentro de ella.

   EN ESCRITORIO TAMBIÉN. Desde la v14 de usos.css las tarjetas ocupan la
   pantalla completa en cualquier ancho (se retiró la rejilla de tres
   columnas), así que «llenar la pantalla» significa lo mismo en las dos
   orillas y el efecto no necesita un `@media`.

   Bajo `prefers-reduced-motion: reduce` el efecto no se monta: ni listeners
   ni estilos en línea, igual que foto-focus.js. La foto se queda en su arco
   de reposo y no se expande.
   ========================================================================== */
(() => {
  'use strict';

  const reducido = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reducido.matches) return;

  const piezas = [];
  document.querySelectorAll('.usos-tarjeta').forEach((tarjeta) => {
    piezas.push({ tarjeta, top: 0, ancho: 1, alto: 1, base: 0 });
  });
  if (!piezas.length) return;

  /* Margen fuera de la ventana en el que la tarjeta ya no se recalcula:
     el mismo valor que foto-focus.js. */
  const MARGEN = 80;

  /* Escala del arco en reposo y en su máximo. 1 = exactamente el arco que
     dibuja usos.css; 1,7 = arco tan grande que sus bordes ya quedaron fuera
     de la ventana (el umbral de cobertura es 1,25, ver cabecera). */
  const S_MIN = 1;
  const S_MAX = 1.7;

  const limpiar = () => {
    for (const pieza of piezas) {
      pieza.tarjeta.style.clipPath = '';
      pieza.tarjeta.style.borderRadius = '';
    }
  };

  /* Posición de documento por la cadena offsetTop, igual que foto-focus.js:
     inmune a los transforms de .reveal. offsetWidth/offsetHeight miden la
     caja en reposo (100dvh, fijada por CSS, así que no varía por cuadro).
     `base` es el radio de las dos esquinas de abajo: se lee de la caja
     ANTES de anular el border-radius, para no repetir aquí el valor de
     `--radio-md` que ya declara usos.css. */
  const medir = () => {
    for (const pieza of piezas) {
      let el = pieza.tarjeta;
      let top = 0;
      while (el) {
        top += el.offsetTop;
        el = el.offsetParent;
      }
      pieza.top = top;
      pieza.ancho = pieza.tarjeta.offsetWidth || 1;
      pieza.alto = pieza.tarjeta.offsetHeight || 1;
      if (!pieza.base) {
        const radio = parseFloat(
          getComputedStyle(pieza.tarjeta).borderBottomLeftRadius
        );
        pieza.base = Number.isFinite(radio) && radio > 0 ? radio : 0;
      }
    }
  };

  /* El arco en coordenadas de la propia caja, escalado por `s` alrededor
     del centro de su borde inferior —el punto (A/2, H)—, que es lo que
     mantiene el borde recto pegado al suelo mientras el resto se aleja.

     El recorrido, en sentido horario: sube por el costado izquierdo, cruza
     el medio punto de una sola arcada (radios A/2 × H/2: una semielipse
     exacta), baja por el costado derecho y cierra por abajo con las dos
     esquinas de `base`. */
  const arco = (ancho, alto, base, s) => {
    const cx = ancho / 2;
    const ex = (x) => (cx + (x - cx) * s).toFixed(2);
    const ey = (y) => (alto + (y - alto) * s).toFixed(2);
    const rx = ((ancho / 2) * s).toFixed(2);
    const ry = ((alto / 2) * s).toFixed(2);
    const rb = (base * s).toFixed(2);
    return (
      'path("M ' + ex(0) + ' ' + ey(alto - base) +
      ' L ' + ex(0) + ' ' + ey(alto / 2) +
      ' A ' + rx + ' ' + ry + ' 0 0 1 ' + ex(ancho) + ' ' + ey(alto / 2) +
      ' L ' + ex(ancho) + ' ' + ey(alto - base) +
      ' A ' + rb + ' ' + rb + ' 0 0 1 ' + ex(ancho - base) + ' ' + ey(alto) +
      ' L ' + ex(base) + ' ' + ey(alto) +
      ' A ' + rb + ' ' + rb + ' 0 0 1 ' + ex(0) + ' ' + ey(alto - base) +
      ' Z")'
    );
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

      const s = S_MIN + (S_MAX - S_MIN) * e;
      pieza.tarjeta.style.clipPath = arco(pieza.ancho, pieza.alto, pieza.base, s);
      /* El relevo: mientras el `path()` manda, el arco de `border-radius`
         estorbaría recortando la caja al tamaño de reposo. */
      pieza.tarjeta.style.borderRadius = '0';
    }
  };

  /* Un cálculo por cuadro como máximo, igual que foto-focus.js: cuadro
     inmediato más un remate cuando la ráfaga de scroll se asienta, para
     que un salto programático no deje el arco a medio camino. */
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
