/* ============================================================================
   ESCENA POR SCROLL — Acto 1 del carril 01 (#planes, «Bodas y conciertos»)

   Motor genérico calcado del que ya usa «La prueba» en el sitio de Rafael
   Silva: mide el recorrido de una pista alta contra el viewport y escribe DOS
   variables CSS por cuadro (`--entrada`, `--texto`). Todo el movimiento real
   —el recorte que se abre, el desplazamiento, la opacidad del texto— lo hace
   `styles/sections/planes.css` con `clip-path`/`transform`/`opacity`; este
   archivo sólo mide y escribe números, nunca toca `style` de piezas sueltas
   ni anima nada por su cuenta.

   POR QUÉ NO ES `js/fauna-ambiente.js` NI LO TOCA: son dos capas
   independientes del mismo carril (la fauna decora, esto dirige la entrada
   de foto y texto) y no comparten estado ni contenedor.

   `prefers-reduced-motion` se resuelve DOS VECES, a propósito: quien lo pide
   no llega ni a que este módulo se descargue (el `<script>` de planes.html ya
   lo filtra), y si aun así se invoca desde otro sitio, `escenaPorScroll`
   vuelve a comprobarlo aquí y no hace nada. Con el motor sin correr, el CSS
   estático deja la escena resuelta en una sola pantalla (planes.css, junto a
   §3): cero parpadeo, cero contenido invisible esperando a un script.
   ========================================================================== */

/**
 * Mide el recorrido de una pista alta y llama a `guion(tramo, pista)` en
 * cada cuadro con una función `tramo(a, b)` que da 0..1 suavizado según en
 * qué punto del recorrido va el scroll. `pista` es el elemento con la altura
 * en `svh`; dentro de él vive el escenario clavado (`position: sticky`).
 *
 * @param {HTMLElement|null} pista
 * @param {(tramo: (a: number, b: number) => number, pista: HTMLElement) => void} guion
 */
function escenaPorScroll(pista, guion) {
  if (!pista) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const limitar = (v) => Math.max(0, Math.min(1, v));
  // Suavizado cúbico (smoothstep): la misma curva de autor que el resto del
  // sitio expresa como cubic-bezier, pero aplicada al PROGRESO, no al tiempo,
  // que es lo que hace falta cuando quien manda el reloj es el scroll.
  const suave = (t) => t * t * (3 - 2 * t);
  let pendiente = false;

  /* MEDIR UNA VEZ, NO SESENTA VECES POR SEGUNDO.
     Antes cada cuadro leía `pista.offsetHeight` y `getBoundingClientRect()`,
     y las dos obligan al navegador a rehacer estilo y maqueta antes de poder
     contestar. Con una pista de 300 svh y el resto de la página por debajo,
     en un teléfono de gama media eso es el gasto más caro de todo el scroll.
     Ninguno de los dos datos cambia al desplazarse: alto y posición sólo se
     mueven al redimensionar. Se cachean aquí y el cuadro pasa a leer sólo
     `window.scrollY`, que no cuesta maqueta. Es el mismo patrón que ya usan
     js/concurso-cinta.js y js/foto-focus.js. */
  let techo = 0;
  let recorrido = 0;

  function medir() {
    let y = 0;
    for (let n = pista; n; n = n.offsetParent) y += n.offsetTop;
    techo = y;
    recorrido = pista.offsetHeight - window.innerHeight;
  }

  /* Y SÓLO MIENTRAS LA ESCENA ESTÉ CERCA.
     Sin este cerrojo el manejador corría durante TODO el recorrido de la
     página —también con #planes seis pantallas más arriba o más abajo—
     escribiendo dos variables CSS que invalidan el clip-path de la escena.
     El margen holgado es para que la escena llegue ya resuelta al borde de
     la pantalla, nunca a medio dibujar. Se CONMUTA, nunca se desobserva:
     bajar y volver a subir tiene que volver a levantarla (§7). */
  let cerca = true;

  function cuadro() {
    pendiente = false;
    if (recorrido <= 0) return;
    const p = limitar((window.scrollY - techo) / recorrido);
    const tramo = (a, b) => suave(limitar((p - a) / (b - a)));
    guion(tramo, pista);
  }

  const alDesplazar = () => {
    if (!cerca || pendiente) return;
    pendiente = true;
    requestAnimationFrame(cuadro);
  };

  const alRedimensionar = () => {
    medir();
    alDesplazar();
  };

  medir();

  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entradas) => {
      cerca = entradas[0].isIntersecting;
      if (cerca) alDesplazar();
    }, { rootMargin: '100% 0px' }).observe(pista);
  }

  addEventListener('scroll', alDesplazar, { passive: true });
  addEventListener('resize', alRedimensionar);
  // La maqueta puede cambiar de alto cuando aterrizan las fotos de la pista:
  // sin volver a medir, el recorrido se quedaría con el valor de antes.
  addEventListener('load', alRedimensionar);
  alDesplazar();
}

/**
 * Activa la escena del Acto 1 del carril 01: la foto sube recortada, se
 * queda sola un buen tramo del recorrido y sólo entonces entra el texto
 * (marca de agua + tarjeta), que ya viven en el HTML sin duplicar nada.
 *
 * Tramos (documentados también en planes.css, junto a §3, para quien lea
 * sólo la hoja de estilos): 0–34 % sube y se abre el recorte; 34–55 % pausa
 * con la foto sola; 55–80 % entra el texto; 80–100 % queda quieto.
 *
 * Corre en TODOS los anchos. No hay —ni debe volver a haber— una comprobación
 * de ancho aquí ni en el CSS: la escena es la misma en un teléfono y en un
 * monitor, y lo único que cambia con el ancho es el cuerpo de la letra y la
 * medida de la tarjeta. Dos armados para la misma pieza fue justo lo que
 * rompió la marca de agua en móvil en agosto de 2026.
 */
export function activarEscenaFiesta() {
  const pista = document.querySelector('.planes-fiesta__escena');
  escenaPorScroll(pista, (tramo, pista) => {
    pista.style.setProperty('--entrada', tramo(0, 0.34).toFixed(3));
    pista.style.setProperty('--texto', tramo(0.55, 0.8).toFixed(3));
  });
}
