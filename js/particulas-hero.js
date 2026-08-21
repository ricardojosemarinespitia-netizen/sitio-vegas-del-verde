/**
 * particulas-hero.js — el aire del bosque, animado sobre la portada.
 *
 * La foto de la portada ya enseña el bosque quieto bajo el sol de mediodía.
 * Esto NO la reemplaza ni compite con ella: le suma lo único que una foto no
 * puede tener — el aire. Motas de polen que cruzan la luz y, de cuando en
 * cuando, una hoja que se suelta de una copa y planea hasta el prado.
 *
 * ES ATMÓSFERA, NO PROTAGONISTA. Las cifras están elegidas para que el
 * visitante no pueda decir «hay partículas»: pocas piezas, opacidad baja,
 * velocidad de deriva. Si alguna vez «se ve el efecto», está mal calibrado.
 *
 * Arquitectura calcada de la lluvia del proyecto Rafael Silva
 * (PROYECTO RAFAEL SILVA/sitio/lluvia.js), que es la referencia de la casa:
 *   · coordenadas normalizadas de la FOTO, no del canvas (ver abajo);
 *   · sprites pre-pintados una vez, nunca gradientes por cuadro;
 *   · pool fijo de partículas recicladas, cero basura para el recolector;
 *   · IntersectionObserver + visibilitychange para no gastar un solo cuadro
 *     con el hero fuera de pantalla o la pestaña en segundo plano;
 *   · con prefers-reduced-motion no se monta nada (y si el visitante lo
 *     activa con la página abierta, se desmonta solo).
 *
 * ── POR QUÉ EN COORDENADAS DE LA FOTO Y NO DEL CANVAS ──────────────────
 * La portada pinta img/portada-inicio.jpg (1400 × 2489, vertical) con
 * `object-fit: cover`: en pantalla ancha se recorta arriba y abajo, en un
 * teléfono se ve casi entera. Si las copas se marcaran en porcentajes del
 * canvas, el follaje emisor se despegaría de los árboles reales al cambiar
 * el viewport. Todo el sistema vive en 0..1 sobre la imagen original y
 * `aPantalla()` replica el encuadre exacto del CSS — incluido el
 * `object-position: 50% 52%` de .inicio__portada-foto. Si ese encuadre
 * cambia en inicio.css, hay que actualizar POSICION_FOTO aquí.
 *
 * ── DE DÓNDE SALEN LAS CIFRAS DE `COPAS` ───────────────────────────────
 * Medidas mirando la foto original con una cuadrícula superpuesta: la banda
 * de árboles del medio cruza la imagen entera entre y=0.30 y y=0.55, y el
 * árbol grande de la derecha sube desde y=0.33 hasta y=0.06 entre x=0.52 y
 * el borde. Si algún día cambia la foto de la portada, hay que volver a
 * medir estas cajas o las hojas nacerán del cielo.
 *
 * En el encuadre de escritorio (franja visible ≈ y 0.37–0.65) parte del
 * árbol de la derecha queda por ENCIMA del recorte: esas partículas entran
 * en cuadro cayendo desde el borde superior, que es exactamente la lectura
 * correcta — vienen del follaje que sigue ahí arriba aunque no se vea.
 *
 * ── EL PARALAJE DE LA FOTO NO SE PERSIGUE, Y ES A PROPÓSITO ────────────
 * inicio.css mueve la fotografía ±5 % con el scroll (animation-timeline).
 * El canvas no replica ese desplazamiento: perseguir un transform del
 * compositor desde JS es justo lo que la regla de la casa prohíbe (nada de
 * medir posiciones durante una transición). No hace falta: a diferencia de
 * la regadera de Rafael —un borde duro del que nace un chorro—, aquí la
 * emisión es una banda difusa de follaje; cinco puntos porcentuales de vaivén
 * caen dentro de la propia banda y el ojo no tiene ninguna arista contra la
 * que detectar el desfase.
 *
 * ── DÓNDE VIVE EL LIENZO EN LA PILA DE CAPAS ───────────────────────────
 * Se añade al final de .inicio__portada con z-index de fondo: queda ENCIMA
 * de la fotografía (mismo z, después en el documento) y DEBAJO del velo de
 * legibilidad, de la orla y del texto. Consecuencia buscada: hacia el pie,
 * donde el velo se cierra para proteger el titular, las partículas se
 * apagan con él — la atmósfera nunca le disputa un punto de contraste al
 * texto, y el contrato de contraste del velo (inicio.css) queda intacto.
 *
 * ── COLOR ───────────────────────────────────────────────────────────────
 * Nada de paleta propia: los pigmentos se leen de los tokens del sistema
 * (--verde-oliva-rgb, --crema-rgb, --amarillo-rgb) en el momento de montar,
 * con respaldo literal por si el CSS no llegó. Las hojas son el oliva del
 * sistema en tres estados (verde, clara, seca) y el polen es la crema
 * entibiada hacia el amarillo del logo. Si mañana la paleta cambia en
 * tokens.css, el aire cambia con ella sin tocar este archivo.
 */

/** Las copas emisoras, en coordenadas normalizadas de la foto (0..1).
 *  `peso` reparte los nacimientos entre las dos. */
const COPAS = [
  { x0: 0.02, x1: 0.98, y0: 0.30, y1: 0.55, peso: 0.55 }, // banda de árboles del medio
  { x0: 0.52, x1: 0.98, y0: 0.06, y1: 0.33, peso: 0.45 }, // árbol grande de la derecha
];

/** Donde muere la partícula, en coordenadas de foto: la franja de matas y
 *  materas del pie. Nada baja de aquí — debajo están el murito y el texto. */
const SUELO = 0.80;

/** El object-position de .inicio__portada-foto (50% 52%). Tiene que ser el
 *  MISMO del CSS o el encuadre replicado se desfasa un puñado de píxeles. */
const POSICION_FOTO = { x: 0.5, y: 0.52 };

const azar = (a, b) => a + Math.random() * (b - a);

function elegirCopa() {
  return Math.random() < COPAS[0].peso ? COPAS[0] : COPAS[1];
}

/**
 * Mota de polen / polvo en la luz. Se recicla en vez de recrearse — el pool
 * es fijo y diminuto, pero el hábito viene de la referencia y es gratis.
 */
class Mota {
  constructor(dispersa) { this.reiniciar(dispersa); }

  /**
   * `dispersa` reparte las motas por toda la caída en el primer cuadro. Sin
   * esto la portada abriría con el aire vacío y una primera oleada bajando
   * en bloque — artificial justo en el segundo que más se mira.
   */
  reiniciar(dispersa = false) {
    const copa = elegirCopa();
    this.x = azar(copa.x0, copa.x1);
    this.y = azar(copa.y0, copa.y1);

    // Profundidad: las de adelante son algo más grandes y más presentes.
    this.z = azar(0.5, 1.35);
    this.lejana = this.z < 0.85;

    // Alturas de foto por segundo. Es caída de polen, no de lluvia: en un
    // escritorio son ~15-40 px/s. Más rápido y se lee como nieve.
    this.vy = azar(0.006, 0.016) * this.z;
    this.deriva = azar(-0.007, 0.007);

    // Vaivén senoidal con fase y frecuencia propias: sin él, el polen baja
    // en rieles paralelos y el ojo lo descarta como artificio.
    this.tAmp = azar(0.0012, 0.0045);
    this.tFrec = azar(0.5, 1.6);
    this.tFase = azar(0, Math.PI * 2);

    // Parpadeo lento: una mota atraviesa haces de luz y sombra del follaje.
    // Es lo que la lee como «polvo en la luz» y no como un punto pegado.
    this.pFrec = azar(0.7, 2.1);
    this.pFase = azar(0, Math.PI * 2);

    this.tam = azar(2.6, 6.5) * (0.6 + 0.5 * this.z);
    this.alfa = azar(0.10, 0.28) * (0.6 + 0.5 * this.z);

    // Vida limitada además del suelo: a esta velocidad una mota tardaría
    // medio minuto en cruzar; renovarlas antes mantiene el aire cambiando.
    this.vida = azar(14, 26);
    this.t = 0;

    if (dispersa) {
      this.y = azar(copa.y0, SUELO - 0.05);
      this.t = azar(0, this.vida * 0.7);
    }
  }

  avanzar(dt) {
    this.t += dt;
    this.y += this.vy * dt;
    // El vaivén se aplica como velocidad, no como desplazamiento absoluto:
    // sumado a la posición, la mota «saltaría» al eje al reciclar la fase.
    this.x += (this.deriva + this.tAmp * this.tFrec
      * Math.cos(this.t * this.tFrec + this.tFase)) * dt;
    if (this.t > this.vida || this.y > SUELO || this.x < -0.04 || this.x > 1.04) {
      this.reiniciar();
    }
  }
}

/**
 * Hoja que se suelta de la copa. Son muy pocas — la hoja es el acento y el
 * polen la textura; al revés, la portada parecería un otoño en Santander.
 */
class Hoja {
  constructor(dispersa) { this.reiniciar(dispersa); }

  reiniciar(dispersa = false) {
    const copa = elegirCopa();
    this.x = azar(copa.x0, copa.x1);
    // Nace en la mitad BAJA de la copa: una hoja que aparece en el borde
    // superior del árbol se vería materializarse contra el cielo.
    this.y = azar(copa.y0 + (copa.y1 - copa.y0) * 0.45, copa.y1);

    this.z = azar(0.6, 1.3);
    this.vy = azar(0.020, 0.040) * this.z;
    this.deriva = azar(-0.010, 0.010);

    // El balanceo de una hoja es mucho más ancho que el del polen: planea.
    this.tAmp = azar(0.006, 0.014);
    this.tFrec = azar(1.1, 2.3);
    this.tFase = azar(0, Math.PI * 2);

    this.tam = azar(6, 11) * (0.7 + 0.35 * this.z);
    this.alfa = azar(0.26, 0.46);
    this.variante = Math.floor(Math.random() * 3); // verde · clara · seca

    this.ang = azar(0, Math.PI * 2);
    this.giro = azar(-0.5, 0.5);        // deriva de rotación, rad/s
    this.balanceo = azar(0.35, 0.7);    // cuánto acompaña el giro al vaivén

    this.t = 0;
    if (dispersa) {
      this.y = azar(copa.y0, SUELO - 0.06);
      this.t = azar(2, 9);
    }
  }

  avanzar(dt) {
    this.t += dt;
    const fase = this.t * this.tFrec + this.tFase;
    // El planeo: la hoja frena su caída cuando va lanzada de lado (máximo
    // de velocidad lateral = mínimo de caída). Un multiplicador, no física
    // de verdad — pero es el gesto que el ojo reconoce como «hoja».
    this.y += this.vy * (1 - 0.35 * Math.abs(Math.cos(fase))) * dt;
    this.x += (this.deriva + this.tAmp * this.tFrec * Math.cos(fase)) * dt;
    this.ang += this.giro * dt;
    if (this.y > SUELO || this.x < -0.05 || this.x > 1.05) this.reiniciar();
  }
}

/**
 * Monta la animación sobre la portada. Devuelve la función de desmontaje —
 * se usa de verdad si el visitante activa «reducir movimiento» en caliente.
 */
export function montarParticulas(contenedor, img) {
  const reducido = window.matchMedia('(prefers-reduced-motion: reduce)');
  // Con movimiento reducido no se monta nada: la foto comunica el bosque por
  // su cuenta y la ausencia de aire no deja ningún hueco. (El <script> del
  // fragmento ya lo comprobó antes de importar; esta guarda es el cinturón.)
  if (reducido.matches) return () => {};

  const lienzo = document.createElement('canvas');
  lienzo.className = 'inicio__particulas';
  lienzo.setAttribute('aria-hidden', 'true');
  contenedor.appendChild(lienzo);
  const ctx = lienzo.getContext('2d', { alpha: true });
  if (!ctx) { lienzo.remove(); return () => {}; }

  /* ── PIGMENTOS: leídos de los tokens del sistema ──────────────────────
     Los tripletes RGB de tokens.css (--verde-oliva-rgb etc.) existen justo
     para poder componer transparencias; aquí se leen una sola vez al montar.
     El respaldo literal es el valor v4 de cada token, por si el CSS no
     estuviera (un test aislado, un navegador raro): el efecto degrada a la
     paleta congelada, nunca a un error.                                    */
  function leerTripleta(nombre, respaldo) {
    const crudo = getComputedStyle(document.documentElement)
      .getPropertyValue(nombre).trim();
    const n = crudo.split(/\s+/).map(Number);
    return n.length === 3 && n.every(Number.isFinite) ? n : respaldo;
  }
  const mezclar = (a, b, t) => a.map((c, i) => Math.round(c + (b[i] - c) * t));
  const rgba = (c, a) => `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${a})`;

  const OLIVA = leerTripleta('--verde-oliva-rgb', [94, 110, 60]);
  const CREMA = leerTripleta('--crema-rgb', [237, 230, 226]);
  const AMARILLO = leerTripleta('--amarillo-rgb', [228, 203, 58]);
  const BLANCO = [255, 255, 255];

  // Tres estados de la misma hoja oliva: recién suelta, clara al trasluz y
  // seca. Nada inventado: mezclas del oliva con la crema y el amarillo.
  const COLORES_HOJA = [
    OLIVA,
    mezclar(OLIVA, CREMA, 0.35),
    mezclar(OLIVA, AMARILLO, 0.55),
  ];
  // El polen es crema entibiada hacia el amarillo del logo, con corazón
  // casi blanco: es una mota ATRAPANDO luz, no un confeti amarillo.
  const POLEN_NUCLEO = mezclar(mezclar(CREMA, AMARILLO, 0.30), BLANCO, 0.55);
  const POLEN_HALO = mezclar(CREMA, AMARILLO, 0.45);

  /* ── LOS SPRITES ──────────────────────────────────────────────────────
     Todo el detalle (gradientes, forma de hoja, nervadura) se pinta UNA vez
     aquí y luego se estira con drawImage. Gradientes por partícula y por
     cuadro serían basura para el recolector en cada fotograma — la lección
     central de la lluvia de Rafael.                                        */

  /** Mota: un resplandor radial suave. La versión desenfocada del plano
   *  lejano no hace falta pintarla con filter: a este tamaño, el propio
   *  gradiente estirado un punto más ya lee como bokeh. */
  function crearSpriteMota() {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 16;
    const c = cv.getContext('2d');
    const g = c.createRadialGradient(8, 8, 0, 8, 8, 8);
    g.addColorStop(0, rgba(POLEN_NUCLEO, 0.9));
    g.addColorStop(0.35, rgba(POLEN_HALO, 0.4));
    g.addColorStop(1, rgba(POLEN_HALO, 0));
    c.fillStyle = g;
    c.fillRect(0, 0, 16, 16);
    return cv;
  }

  /** Hoja: la MISMA figura orgánica del sistema — dos esquinas plenamente
   *  redondas en diagonal y dos vivas, el remate de .lista-hojas en base.css
   *  (`border-radius: 0 var(--radio-full) 0 var(--radio-full)`). Que las
   *  hojas que caen tengan la forma de la casa es lo que las hace parte del
   *  sitio y no un efecto pegado encima. Geométricamente es la lente de dos
   *  arcos: cada esquina redonda a radio pleno convierte su cuarto en un
   *  arco centrado en la esquina viva opuesta. */
  function crearSpriteHoja(color) {
    const s = 24;
    const cv = document.createElement('canvas');
    cv.width = cv.height = s + 4;
    const c = cv.getContext('2d');
    c.translate(2, 2);

    c.beginPath();
    c.arc(0, s, s, -Math.PI / 2, 0);      // de la punta (0,0) a la punta (s,s)
    c.arc(s, 0, s, Math.PI / 2, Math.PI); // y de vuelta por el otro lomo
    c.closePath();

    // Trasluz: más clara hacia la punta de arriba, más honda hacia abajo.
    const g = c.createLinearGradient(0, 0, s, s);
    g.addColorStop(0, rgba(mezclar(color, BLANCO, 0.22), 0.95));
    g.addColorStop(1, rgba(mezclar(color, [0, 0, 0], 0.18), 0.95));
    c.fillStyle = g;
    c.fill();

    // La nervadura central, de punta a punta. Un trazo tenue: a 6-11 px en
    // pantalla es apenas una insinuación, pero sin ella la silueta se lee
    // como pétalo, no como hoja.
    c.beginPath();
    c.moveTo(s * 0.12, s * 0.12);
    c.lineTo(s * 0.88, s * 0.88);
    c.strokeStyle = rgba(mezclar(color, [0, 0, 0], 0.35), 0.5);
    c.lineWidth = 1;
    c.stroke();

    return cv;
  }

  const SPRITE_MOTA = crearSpriteMota();
  const SPRITES_HOJA = COLORES_HOJA.map(crearSpriteHoja);

  // Densidad BAJA a conciencia: la lluvia de Rafael usa cientos de gotas
  // porque es el sujeto de su foto; aquí el aire es acompañamiento. En
  // móvil aún menos: pantalla chica y cuadro más caro.
  const movil = window.innerWidth < 640;
  const motas = Array.from({ length: movil ? 14 : 26 }, () => new Mota(true));
  const hojas = Array.from({ length: movil ? 4 : 7 }, () => new Hoja(true));

  let anchoCss = 0, altoCss = 0;
  let despX = 0, despY = 0, anchoFoto = 0, altoFoto = 0;

  /** Replica `object-fit: cover` + `object-position: 50% 52%` (inicio.css).
   *  Mide con clientWidth/clientHeight y no con getBoundingClientRect: la
   *  regla de la casa prohíbe medir cajas mientras puede haber una
   *  transición activa, y client* devuelve la caja de layout sin transforms. */
  function medir() {
    if (!contenedor.clientWidth || !contenedor.clientHeight) return false;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    anchoCss = contenedor.clientWidth;
    altoCss = contenedor.clientHeight;
    lienzo.width = Math.round(anchoCss * dpr);
    lienzo.height = Math.round(altoCss * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const iw = img.naturalWidth || 1400;
    const ih = img.naturalHeight || 2489;
    const escala = Math.max(anchoCss / iw, altoCss / ih);
    anchoFoto = iw * escala;
    altoFoto = ih * escala;
    despX = (anchoCss - anchoFoto) * POSICION_FOTO.x;
    despY = (altoCss - altoFoto) * POSICION_FOTO.y;
    return true;
  }

  const aPantallaX = (u) => despX + u * anchoFoto;
  const aPantallaY = (v) => despY + v * altoFoto;

  /** Aparición y muerte suaves: nada entra ni sale de golpe.
   *  · entrada: ~1,5 s de fundido al nacer (las dispersas del primer cuadro
   *    ya nacen con t avanzado, así que abren visibles);
   *  · salida: fundido en los últimos 0.07 de foto antes del SUELO;
   *  · apagado: las motas además se apagan al agotar su vida. */
  function alfaDe(p, conVida) {
    const entrada = Math.min(1, p.t / 1.5);
    const salida = Math.max(0, Math.min(1, (SUELO - p.y) / 0.07));
    const apagado = conVida ? Math.max(0, Math.min(1, (p.vida - p.t) / 1.5)) : 1;
    return p.alfa * entrada * salida * apagado;
  }

  function pintar(dt) {
    ctx.clearRect(0, 0, anchoCss, altoCss);

    // ── HOJAS, en composición normal: una hoja tapa, no suma luz ────────
    for (const h of hojas) {
      h.avanzar(dt);
      const px = aPantallaX(h.x);
      const py = aPantallaY(h.y);
      if (py < -h.tam || py > altoCss + h.tam || px < -h.tam || px > anchoCss + h.tam) continue;
      const a = alfaDe(h, false);
      if (a <= 0.01) continue;

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(h.ang + Math.sin(h.t * h.tFrec + h.tFase) * h.balanceo);
      ctx.globalAlpha = a;
      ctx.drawImage(SPRITES_HOJA[h.variante], -h.tam / 2, -h.tam / 2, h.tam, h.tam);
      ctx.restore();
    }

    // ── MOTAS, en `lighter`: el polvo en un haz de sol SUMA luz ─────────
    // Consecuencia gratis: sobre el cielo ya claro casi no se ven y sobre
    // el follaje oscuro resplandecen — que es exactamente cómo se comporta
    // el polvo iluminado de verdad.
    ctx.globalCompositeOperation = 'lighter';
    for (const m of motas) {
      m.avanzar(dt);
      const px = aPantallaX(m.x);
      const py = aPantallaY(m.y);
      if (py < -m.tam || py > altoCss + m.tam || px < -m.tam || px > anchoCss + m.tam) continue;
      const parpadeo = 0.7 + 0.3 * Math.sin(m.t * m.pFrec + m.pFase);
      const a = alfaDe(m, true) * parpadeo;
      if (a <= 0.01) continue;

      // Las lejanas se estiran un punto más grandes con la misma pintura:
      // el gradiente diluido hace de desenfoque sin pagar ctx.filter.
      const tam = m.lejana ? m.tam * 1.5 : m.tam;
      ctx.globalAlpha = m.lejana ? a * 0.7 : a;
      ctx.drawImage(SPRITE_MOTA, px - tam / 2, py - tam / 2, tam, tam);
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }

  let anterior = 0;
  let animando = false;
  let cuadro = 0;

  function bucle(ahora) {
    if (!animando) return;
    // Al volver de segundo plano el delta sería enorme y todo daría un
    // salto; se recorta a ~3 cuadros de 60 Hz, como en la referencia.
    const dt = anterior ? Math.min((ahora - anterior) / 1000, 0.05) : 0.016;
    anterior = ahora;
    pintar(dt);
    cuadro = requestAnimationFrame(bucle);
  }

  function arrancar() {
    if (animando) return;
    animando = true;
    anterior = 0;
    cuadro = requestAnimationFrame(bucle);
  }

  function parar() {
    animando = false;
    cancelAnimationFrame(cuadro);
  }

  if (!medir()) { lienzo.remove(); return () => {}; }

  // Fuera de pantalla no se pinta un solo cuadro. El observador NO se
  // desconecta al salir (regla de la casa: la observación se mantiene y el
  // estado se conmuta en cada entrada/salida), así que al volver arriba el
  // aire se reanuda solo. Las dos pausas —viewport y pestaña— se CRUZAN:
  // volver a la pestaña con el hero fuera de pantalla no debe rearrancar
  // nada (la referencia arrastraba ese cabo suelto; aquí queda atado).
  let enPantalla = false;

  function decidir() {
    if (enPantalla && !document.hidden) arrancar();
    else parar();
  }

  const io = new IntersectionObserver(
    ([e]) => { enPantalla = e.isIntersecting; decidir(); },
    { threshold: 0 },
  );
  io.observe(contenedor);

  const alCambiarVisibilidad = () => decidir();
  document.addEventListener('visibilitychange', alCambiarVisibilidad);

  const ro = new ResizeObserver(() => medir());
  ro.observe(contenedor);

  // Si el visitante activa «reducir movimiento» con la página abierta, el
  // aire se retira entero: canvas fuera, oyentes fuera.
  const alCambiarPreferencia = () => reducido.matches && desmontar();
  reducido.addEventListener('change', alCambiarPreferencia);

  function desmontar() {
    parar();
    io.disconnect();
    ro.disconnect();
    document.removeEventListener('visibilitychange', alCambiarVisibilidad);
    reducido.removeEventListener('change', alCambiarPreferencia);
    lienzo.remove();
  }

  return desmontar;
}
