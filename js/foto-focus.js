/* ==========================================================================
   VEGAS DEL VERDE — foto-focus.js
   Encuadre y zoom de las fotos grandes ligados al progreso de scroll de su
   pieza. Patrón de la casa, portado del sitio de Rafael (que a su vez lo
   portó del de Felipe): la foto entra en reposo, alcanza su encuadre pleno
   cuando su pieza cruza el centro de la ventana y vuelve al reposo al salir.

   QUÉ ANIMA Y QUÉ NO — SÓLO transform, EN LOS DOS MODOS
   · Escritorio (≥64em): sólo `transform: scale`, anclado al object-position
     que la foto ya trae de su hoja de sección. Composición pura en la GPU.
   · Móvil (<64em): además del zoom viaja el ENCUADRE —del object-position del
     CSS al `data-foco` del HTML— porque ahí el recorte se come el motivo y el
     zoom solo no lo rescata. Pero el viaje NO se hace escribiendo
     object-position: eso no es propiedad de compositor y repintaría el
     recorte de una foto grande en cada cuadro, justo en los aparatos con
     menos GPU. Se hace con `translate3d` sobre el <img>, que produce el mismo
     desplazamiento del recorte en una capa ya compuesta.

     LA EQUIVALENCIA (por qué translate3d hace lo mismo que object-position)
     Con `object-fit: cover` la foto se amplía hasta tapar su caja y le sobra
     por un eje. Ese sobrante —el DESBORDE— es todo el recorrido que el
     encuadre puede viajar: mover el object-position del 30 % al 60 % desplaza
     el contenido exactamente `desborde × 0.30` px. Trasladar el <img> esos
     mismos píxeles mueve el motivo igual; lo único distinto es que la caja se
     va con él y destaparía una franja vacía por el lado contrario.
     La franja vacía se evita con la HOLGURA DEL PROPIO ZOOM: al escalar a
     `s` con origen en el centro, la caja sobresale `(s-1)/2` de su ancho por
     cada lado, y ahí es donde cabe el desplazamiento. Cuando el viaje pedido
     no cabe en el zoom declarado, la amplitud del zoom sube justo lo que
     haga falta —hasta el doble del declarado, no más— y lo que aun así no
     quepa se recorta. Los dos límites son deliberados: pasado el doble, el
     zoom deja de leerse como respiración de la foto y empieza a leerse como
     pérdida de nitidez; y un viaje corto es siempre preferible a un canto
     destapado. El desborde se mide UNA vez (en medir(), con
     offsetWidth/naturalWidth, que no ven transforms), nunca por cuadro.

   No se toca width/height/top/margin en ningún modo: jamás hay layout.

   CERO PARPADEO POR CONSTRUCCIÓN (la regla que ya causó bugs aquí)
   El estado inicial es EXACTAMENTE el CSS estático: scale(1) y el
   object-position declarado en la hoja de cada sección. Este script no fija
   ningún estado de partida distinto: parte del reposo y vuelve a él, así que
   da igual cuándo termine de llegar el defer — el primer paint es siempre el
   correcto y no hay salto al montarse.

   POR QUÉ NO SE MIDE CON getBoundingClientRect
   Las piezas marcadas viven dentro de elementos .reveal, que entran con una
   transición de transform. getBoundingClientRect devuelve la caja YA
   transformada: medir durante esa entrada da posiciones a medio camino (ya
   pasó en este proyecto). La posición de documento se acumula por la cadena
   offsetTop —que ignora los transforms— y se cachea en resize/load; dentro
   del cuadro de animación sólo queda aritmética y escritura de estilos.

   DOBLE INCLUSIÓN A PROPÓSITO
   Los dos fragmentos que usan el efecto (#nosotros y #espacios) declaran su
   propio <script defer>: cada fragmento viaja con sus dependencias, como
   momentos-video.js. El cerrojo de abajo hace inofensiva la segunda
   ejecución (el navegador además sólo descarga el archivo una vez).

   MARCADO — todo en el contenedor recortador (la <figure> con overflow
   hidden y el radio de hoja), nunca en el <img>:
     <figure data-foto-focus data-foco="50% 62%" data-zoom="0.12">
   · data-foco  encuadre de destino del viaje en móvil, en la misma sintaxis
                de object-position aunque se resuelva con translate3d. Sin él,
                en móvil sólo hay zoom. El encuadre de PARTIDA no se declara:
                es el object-position computado del CSS, para que el primer
                cuadro coincida con el primer paint.
   · data-zoom  amplitud del zoom (por defecto 0.14). En escritorio se
                aplica al 60 %, la misma calibración que en Rafael.

   Bajo prefers-reduced-motion el efecto NO SE MONTA: ni listeners ni
   estilos en línea. Si la preferencia se activa a mitad de visita, se
   limpia todo y se apaga en el acto.
   ========================================================================== */
(() => {
  'use strict';

  /* Cerrojo de doble inclusión: dos fragmentos cargan este mismo archivo. */
  if (window.__fotoFocusMontado) return;
  window.__fotoFocusMontado = true;

  const reducido = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reducido.matches) return;

  /* «50% 62%» → [50, 62]. Devuelve null si no hay dos números legibles. */
  const leer = (texto) => {
    if (!texto) return null;
    const par = texto.replace(/%/g, ' ').trim().split(/\s+/).map(Number);
    return par.length === 2 && par.every(Number.isFinite) ? par : null;
  };

  const piezas = [];
  document.querySelectorAll('[data-foto-focus]').forEach((cont) => {
    const imgs = Array.from(cont.querySelectorAll('img'));
    if (!imgs.length) return;
    piezas.push({
      cont,
      imgs,
      foco: leer(cont.dataset.foco),
      zoom: Math.max(0, parseFloat(cont.dataset.zoom) || 0.14),
      top: 0,
      alto: 1,
    });
  });
  if (!piezas.length) return;

  /* El mismo umbral que usa base.css como segunda vía del puntero grueso:
     por debajo de 1024 px se mira casi siempre en un teléfono o tableta. */
  const movil = window.matchMedia('(max-width: 63.99em)');
  /* Margen fuera de la ventana en el que la pieza ya no se recalcula. */
  const MARGEN = 80;

  /* El object-position que puso el CSS, leído UNA vez por modo (nunca por
     cuadro): en escritorio el zoom se ancla ahí para no descentrar el
     motivo al ampliar, y en móvil es el punto de partida del viaje. */
  const anclas = new Map();

  /* Por <img>: [desborde-x, desborde-y, ancho-caja, alto-caja] en píxeles.
     El desborde es lo que le sobra a la foto ampliada por `cover` dentro de
     su caja, o sea el recorrido completo que puede viajar el encuadre.
     Se rellena en medir() y sólo se lee dentro del cuadro. */
  const desbordes = new Map();

  const limpiar = () => {
    for (const pieza of piezas) {
      for (const img of pieza.imgs) {
        img.style.transition = '';
        img.style.transform = '';
        img.style.transformOrigin = '';
        img.style.objectPosition = '';
      }
    }
  };

  /* Al montar y al cruzar el umbral móvil/escritorio: se limpian los
     estilos en línea del modo anterior ANTES de leer el computado —el
     object-position ya no lo escribe nadie, pero se borra igual por si otra
     mano lo dejó puesto— y se fija lo que no cambia por cuadro. La
     transición de la foto se anula en línea porque el CSS le da una de
     --dur-lenta para el hover, y una transición activa pelearía con una
     escritura por cuadro. */
  const preparar = () => {
    for (const pieza of piezas) {
      for (const img of pieza.imgs) {
        img.style.transform = '';
        img.style.transformOrigin = '';
        img.style.objectPosition = '';
        const ancla = getComputedStyle(img).objectPosition;
        anclas.set(img, leer(ancla) || [50, 50]);
        img.style.transition = 'none';
        img.style.transformOrigin = movil.matches ? '50% 50%' : ancla;
      }
    }
  };

  /* Posición de documento por la cadena offsetTop: inmune a los transforms
     de .reveal. offsetHeight tampoco los ve: mide la caja en reposo. */
  const medir = () => {
    for (const pieza of piezas) {
      let el = pieza.cont;
      let top = 0;
      while (el) {
        top += el.offsetTop;
        el = el.offsetParent;
      }
      pieza.top = top;
      pieza.alto = pieza.cont.offsetHeight || 1;

      /* El desborde del `cover`, en la misma pasada y con las mismas reglas:
         offsetWidth/offsetHeight dan la caja de maquetación (ignoran los
         transforms de .reveal y los que escribe este script) y
         naturalWidth/naturalHeight las dimensiones reales del archivo.
         Si la foto todavía no ha llegado (lazy) o su celda está oculta
         —la vertical de apoyo de la banda se retira en móvil— el desborde
         queda a cero y esa foto se queda sólo con zoom hasta que se vuelva
         a medir. */
      for (const img of pieza.imgs) {
        const cw = img.offsetWidth;
        const ch = img.offsetHeight;
        const nw = img.naturalWidth;
        const nh = img.naturalHeight;
        if (!cw || !ch || !nw || !nh) { desbordes.delete(img); continue; }
        const cubre = Math.max(cw / nw, ch / nh);
        desbordes.set(img, [
          Math.max(0, nw * cubre - cw),
          Math.max(0, nh * cubre - ch),
          cw,
          ch,
        ]);
      }
    }
  };

  let pendiente = false;
  let apagado = false;

  /* El cálculo de Rafael: `p` va de 0 (pieza entrando por abajo) a 2
     (saliendo por arriba) y vale 1 con la pieza centrada; `t` lo pliega en
     un triángulo 0→1→0 y `e` lo suaviza (smoothstep). Efecto simétrico:
     nace del reposo, culmina en el centro, vuelve al reposo. */
  const cuadro = () => {
    pendiente = false;
    if (apagado) return;
    const alto = window.innerHeight;
    const y = window.scrollY;
    const esMovil = movil.matches;

    for (const pieza of piezas) {
      const top = pieza.top - y;
      if (top + pieza.alto < -MARGEN || top > alto + MARGEN) continue;

      const p = (alto / 2 - top) / (pieza.alto / 2);
      const t = Math.max(0, Math.min(1, 1 - Math.abs(1 - p)));
      const e = t * t * (3 - 2 * t);

      for (const img of pieza.imgs) {
        if (esMovil) {
          const a = anclas.get(img) || [50, 50];
          const f = pieza.foco || a;
          const d = desbordes.get(img);
          let amplitud = pieza.zoom;
          let tx = 0;
          let ty = 0;
          if (d) {
            /* Píxeles que se desplaza el recorte al ir del ancla al foco, a
               plena progresión: el desborde por el avance del encuadre.
               Signo negativo porque subir el porcentaje de object-position
               empuja el contenido hacia arriba/izquierda. */
            const dx = (-d[0] * (f[0] - a[0])) / 100;
            const dy = (-d[1] * (f[1] - a[1])) / 100;
            /* Cuánto zoom hace falta para que quepa ese viaje: la caja
               escalada sobresale (s-1)/2 por cada lado, así que un viaje de
               `v` píxeles pide una amplitud de 2·v/caja. Si el zoom
               declarado ya la da, no se toca; si no, sube hasta el doble del
               declarado y ahí se planta. El tope no es tacañería: pasado el
               doble, el zoom deja de leerse como respiración de la foto y
               empieza a leerse como pérdida de nitidez —y estas verticales
               son de 675 px de ancho—. Lo que no quepa en esa holgura se
               recorta abajo: mejor un viaje más corto que una franja vacía
               asomando por el canto. */
            amplitud = Math.min(
              Math.max(amplitud, 2 * Math.max(Math.abs(dx) / d[2], Math.abs(dy) / d[3])),
              pieza.zoom * 2
            );
            const hx = (amplitud * e * d[2]) / 2;
            const hy = (amplitud * e * d[3]) / 2;
            tx = Math.max(-hx, Math.min(hx, dx * e));
            ty = Math.max(-hy, Math.min(hy, dy * e));
          }
          const s = 1 + amplitud * e;
          /* translate3d PRIMERO en la lista = se aplica por fuera del scale,
             así sus píxeles son píxeles de pantalla y el cepo cuadra. En
             reposo (e=0) esto es exactamente translate3d(0,0,0) scale(1):
             la identidad, o sea el primer paint sin tocar. */
          img.style.transform =
            'translate3d(' + tx.toFixed(2) + 'px, ' + ty.toFixed(2) + 'px, 0) ' +
            'scale(' + s.toFixed(4) + ')';
        } else {
          img.style.transform =
            'scale(' + (1 + pieza.zoom * 0.6 * e).toFixed(4) + ')';
        }
      }
    }
  };

  /* Un cálculo por cuadro como máximo, lluevan los eventos que lluevan.
     EL REMATE: además del cuadro inmediato, se programa UNO más para cuando
     la ráfaga de scroll se asiente. Si el único evento de un salto
     programático (un ancla, otro script) corre su cuadro con el scroll aún a
     medio asentar, ese último cuadro deja la foto exactamente donde el
     scroll terminó. Es un temporizador reciclado por ráfaga: cuesta un
     cuadro extra en total, no uno por evento. */
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

  const alCambiarModo = () => {
    if (apagado) return;
    preparar();
    medir();
    alDesplazar();
  };

  /* Si la preferencia de menos movimiento se activa a mitad de visita, el
     efecto se desmonta entero: estilos fuera y listeners fuera. No se
     vuelve a montar en esta visita (una recarga con la preferencia quitada
     lo monta de nuevo). */
  const alReducir = () => {
    if (!reducido.matches || apagado) return;
    apagado = true;
    clearTimeout(remate);
    window.removeEventListener('scroll', alDesplazar);
    window.removeEventListener('resize', alRedimensionar);
    window.removeEventListener('load', alRedimensionar);
    limpiar();
  };

  preparar();
  medir();

  movil.addEventListener('change', alCambiarModo);
  reducido.addEventListener('change', alReducir);
  window.addEventListener('scroll', alDesplazar, { passive: true });
  window.addEventListener('resize', alRedimensionar);
  /* Red de seguridad: si algo por encima de las piezas cambia de alto al
     terminar de cargar (las figuras tienen aspect-ratio y no se mueven,
     pero lo de arriba no es de este script), se vuelve a medir. */
  window.addEventListener('load', alRedimensionar);

  /* El desborde necesita naturalWidth/naturalHeight, y una foto lazy puede
     llegar mucho después del evento `load` de la ventana. Cada una que aún
     no ha llegado pide su propia remedida, una sola vez. Hasta entonces esa
     foto viaja sólo con zoom, que es el reposo correcto, no un salto. */
  for (const pieza of piezas) {
    for (const img of pieza.imgs) {
      if (!img.complete || !img.naturalWidth) {
        img.addEventListener('load', alRedimensionar, { once: true });
      }
    }
  }

  alDesplazar();
})();
