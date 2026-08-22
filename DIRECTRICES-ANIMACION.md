# DIRECTRICES DE ANIMACIÓN Y CAPÍTULOS — Vegas del Verde

> Documento del DIRECTOR DE ARTE. Es normativo para los cuatro agentes que
> trabajan en paralelo sobre las secciones. Se lee entero **antes** de tocar
> una sola línea de una sección.
>
> Agosto de 2026. Nace de una queja concreta del cliente, que se cita literal
> más abajo porque es la fuente de verdad de todo lo que sigue.

---

## 0. La queja, y qué dice de verdad

> «designa un agente por sección de la página, que sea por sección de pájaros
> en un lado sendero en otro, está mezclado todo, quiero animación de aves y
> mariposas como en el hero en cada uno, animaciones de texto todo, optimiza
> de una vez para todos los dispositivos, la página sigue viéndose genérica
> […] lo de los pájaros que te pedí se ve excelente, quiero que todas se vean
> así, las letras en blanco de las fotos de eventos bonitas en celular se ven
> horribles sin animación, en PC sí […] esto de los vídeos más animados, se
> ven quietos […] quiero orden y poco texto, el poco que haya que llame la
> atención e incentive alquilar espacios, sigue viéndose genérica»

Traducido a encargos accionables, son **seis**, y sólo uno es de orden:

1. **«Está mezclado todo»** → falta jerarquía de CAPÍTULOS, no falta reordenar
   archivos. Ver §1.
2. **«Como en el hero en cada uno»** → falta un lenguaje de fauna compartido.
   Resuelto: `js/fauna-ambiente.js`. Ver §2.
3. **«Animaciones de texto todo»** → falta un revelado de texto que no sea el
   mismo fundido de bloque cuarenta veces. Resuelto: `.reveal-texto`. Ver §3.
4. **«Letras en blanco… horribles en celular»** → bug real de legibilidad.
   Arreglado en `styles/sections/planes.css`; la regla general en §4.
5. **«Los vídeos se ven quietos»** → los clips no llegaban a arrancar.
   Arreglado en `js/momentos-video.js` + `styles/sections/momentos.css`. Ver §5.
6. **«Optimiza para todos los dispositivos» / «poco texto que incentive
   alquilar»** → checklist obligatorio por zona. Ver §6 y §7.

Y una lectura de fondo que gobierna todo lo demás: **«sigue viéndose
genérica» casi nunca significa «faltan efectos». Significa que los efectos que
hay no riman entre sí.** Cuatro agentes inventando cada uno su propio módulo de
mariposas produciría más animación y un sitio MÁS genérico. Por eso el backend
compartido lo escribió el director de arte y está ya puesto: nadie lo reescribe.

---

## 1. VEREDICTO SOBRE EL ORDEN DE SECCIONES

**No se reordena `ORDEN` ni `CSS_SECCIONES`.** `herramientas/ensamblar.js` y
`herramientas/ensamblar.py` se quedan exactamente como están.

### Por qué

El orden que el cliente pide —hero, espacios, eventos y actividades,
pájaros— **ya está en el archivo**:

| Orden real hoy | Capítulo que le corresponde |
|---|---|
| `inicio` | **Portada** |
| `nosotros` | coda de portada (ver más abajo) |
| `espacios` | **Los espacios** |
| `planes` | **Eventos y actividades** (1 de 3) |
| `momentos` | **Eventos y actividades** (2 de 3 — respiro) |
| `colegios` | **Eventos y actividades** (3 de 3) |
| `naturaleza` | **El bosque** (1 de 2 — los pájaros) |
| `vivero` | **El bosque** (2 de 2) |
| `ubicacion` | **Cómo llegar** |

`planes` + `momentos` + `colegios` ya están juntos y ya van antes de
`naturaleza`. Mover archivos no arreglaría nada y sí rompería anclas de
navegación, `sitemap.xml`, la versión `/en` y los enlaces que el cliente ya
puede haber compartido. **El problema no es el orden: es que los tres no se
LEEN como un mismo capítulo.** Hoy cada uno abre con su propio eyebrow, su
propio fondo y su propia tipografía de rótulo, así que la vista los cuenta como
tres secciones sueltas —y una página con nueve secciones sueltas es,
exactamente, una página genérica.

Única desviación real respecto a lo que pidió el cliente: `nosotros` se cuela
entre la portada y los espacios. Tampoco se mueve. Se resuelve tratándolo como
**coda de la portada** y no como sección independiente: mismo fondo que
`inicio`, sin banda propia, sin eyebrow de capítulo, sin filete de apertura.
Así la vista lo lee como el último párrafo de la portada y el primer capítulo
percibido pasa a ser «Los espacios», que es lo que el cliente pide.

### El tratamiento de capítulo — OBLIGATORIO para los tres agentes de eventos

Los tres —`planes`, `momentos`, `colegios`— comparten, sin excepción:

1. **Un rótulo de capítulo idéntico.** El eyebrow de los tres pasa a ser
   `Eventos y actividades`, con la ocasión concreta en el `<h2>` de cada uno.
   Mismo `--fs-eyebrow`, mismo `--tracking-rotulo`, mismo color.
   *Sólo el primero de los tres (`planes`) lleva además el número de capítulo.*
2. **Una sola alternancia de fondo, no tres.** `planes` claro → `momentos`
   carbón → `colegios` claro es la secuencia correcta y ya existe: `momentos` es
   el respiro DENTRO del capítulo, no un corte entre capítulos. Ningún agente
   cambia el fondo de su sección sin acordarlo con los otros dos.
3. **Ningún filete de apertura entre ellos.** El filete a todo lo ancho que
   abre un capítulo lo lleva `planes` y sólo `planes`. `momentos` y `colegios`
   abren sin él: es lo que dice visualmente «esto sigue siendo lo mismo».
4. **La misma familia de contorno de foto.** La «hoja» —dos esquinas curvas en
   diagonal y dos vivas— que ya usan `momentos.css` §4 y `planes.css` §8. En
   `colegios` hoy no está: hay que llevarla.
5. **Cierre y apertura que se pasan el testigo.** El último elemento de
   `planes` y el primero de `momentos` comparten margen; lo mismo entre
   `momentos` y `colegios`. Nunca `--esp-seccion` completo entre los tres: ese
   aire es lo que separa CAPÍTULOS, y aquí sólo hay uno.

`naturaleza` + `vivero` reciben el mismo tratamiento entre sí bajo el rótulo
**«El bosque»**. `naturaleza` es la vara de medir del cliente («se ve
excelente»), así que aquí el trabajo es al revés: **`vivero` sube al nivel de
`naturaleza`, `naturaleza` no baja al de `vivero`.**

---

## 2. FAUNA AMBIENTE — el lenguaje del hero, en voz baja

**Módulo ya creado: `js/fauna-ambiente.js` + `styles/base.css` §v7. Nadie
escribe otro. Nadie copia `enjambre-hero.js` a su sección.**

### La decisión, y por qué es un módulo compartido y no un patrón a copiar

`js/enjambre-hero.js` no se puede reutilizar tal cual: sus cifras están
calibradas para una portada (nueve piezas, opacidad 0,9, un colibrí que cruza
la ventana entera) y su CSS vive en `inicio.css` bajo clases `.inicio__*`.
Copiarlo a cuatro secciones daría cuatro variantes divergentes del mismo gesto
—el mecanismo exacto por el que un sitio se vuelve genérico— y convertiría cada
sección en una portada, con lo que ninguna lo sería.

El módulo nuevo **rima** con el de la portada (mismos recortes de
`img/plan-vecino/`, mismo rearme por `IntersectionObserver`, mismo estado
inicial horneado en CSS, cero mediciones de maqueta) y **se diferencia en
intensidad**: opacidad `--opacidad-fauna` (0,55) en vez de 0,9, y una deriva
lenta en lugar de una entrada coreografiada.

### API

```js
import('./js/fauna-ambiente.js')
  .then((m) => m.montarFaunaAmbiente(contenedor, {
    densidad: 'discreta',        // 'minima' (2) · 'discreta' (4) · 'viva' (7)
    especies: ['mariposa'],      // o ['mariposa', 'colibri']
    semilla: 0,                  // entero; cambia la composición sin tocar código
  }))
  .catch(() => {});
```

Devuelve `desmontar()`. En pantalla estrecha la densidad **baja sola** un
escalón y el colibrí **no se monta nunca**.

### Cómo lo invoca cada agente (patrón exacto, cópialo)

En el fragmento de tu sección, al final, replicando el mismo cerrojo que ya usa
`sections/hero.html`:

```html
<!-- La caja donde vuela la fauna. Vacía, decorativa, aria-hidden. -->
<div class="espacios__aire" aria-hidden="true"></div>

<script type="module">
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    import('./js/fauna-ambiente.js')
      .then((m) => m.montarFaunaAmbiente(
        document.querySelector('#espacios .espacios__aire'),
        { densidad: 'discreta', especies: ['mariposa'], semilla: 1 }
      ))
      .catch(() => {});
  }
</script>
```

Y en la hoja de tu sección, la caja:

```css
.espacios__aire {
  position: absolute;      /* OBLIGATORIO: el módulo avisa por consola si falta */
  inset-block: 0 auto;
  inset-inline-end: 0;
  inline-size: 32%;
  block-size: 60%;
  pointer-events: none;
}
```

### Las cinco reglas duras de uso

1. **La caja es decorativa y VACÍA.** Nunca la sección entera con su texto
   dentro. Igual que `.inicio__enjambre` en `sections/hero.html`.
2. **La caja tiene `position` propia.** El módulo lo comprueba y avisa por
   consola; el síntoma sin aviso —piezas volando en la esquina del documento—
   cuesta media hora de depuración.
3. **La caja cae sobre foto o color plano, nunca sobre un párrafo.** Aunque la
   pieza pase por detrás (va a `--z-fondo`), sobre texto el ojo lee suciedad.
4. **Reparto de densidad acordado, no a gusto de cada uno.** Si las nueve
   secciones llevan `'viva'`, el sitio es una plaga:

   | Sección | densidad | especies | semilla |
   |---|---|---|---|
   | `inicio` | — (usa el enjambre propio, no se toca) | — | — |
   | `espacios` | `discreta` | `['mariposa']` | 1 |
   | `planes` | `minima` | `['mariposa']` | 2 |
   | `momentos` | **ninguna** (el motivo ya está EN los clips) | — | — |
   | `colegios` | `minima` | `['mariposa']` | 3 |
   | `naturaleza` | `viva` | `['mariposa','colibri']` | 4 |
   | `vivero` | `discreta` | `['mariposa']` | 5 |
   | `ubicacion` | `minima` | `['mariposa']` | 6 |

   **El colibrí sale una sola vez en toda la página, en `naturaleza`.** Es el
   gesto fuerte y pesa 88 kB.
5. **`momentos` no lleva fauna montada.** Los cuatro clips ya son mariposas
   reales; añadir recortes encima sería competir con el metraje.

---

## 3. ANIMACIÓN DE TEXTO — `.reveal-texto`

**Clase ya creada en `styles/base.css` §v7. No se duplica ni se reinventa.**

`.reveal` y `.reveal--velo` siguen siendo el motor del sitio y no se tocan.
`.reveal-texto` es un **modificador** que se pone JUNTO a `.reveal`: el bloque
deja de moverse como pieza y se descubre renglón a renglón. Reutiliza el mismo
`IntersectionObserver` de `js/app.js` — **cero JavaScript nuevo**.

### Marcado

```html
<h2 class="titulo-seccion reveal reveal-texto">
  <span class="reveal-texto__linea">Aquí el día</span>
  <span class="reveal-texto__linea">se toma su tiempo</span>
</h2>
```

Los cortes de línea los decide quien escribe, no el navegador: son parte del
dibujo, igual que los renglones de la marca de agua de `#planes`. Con
`display: block` cada renglón es una línea real, así que si no cabe parte
dentro de su propio span y sigue funcionando.

### Variante persiana

`.reveal-texto--persiana` añade una máscara: el renglón sube **desde detrás**
en vez de desde el aire, sin fundido. Es el gesto caro.
**Se gasta UNA VEZ por capítulo, en el titular de apertura.** Un sitio donde
todo entra en persiana es un sitio donde nada entra en persiana.

### Dónde se usa y dónde NO

- **SÍ**: el `<h2>` que abre un capítulo; la entradilla que lo acompaña; el
  titular de una banda a sangre.
- **NO**: párrafos de cuerpo, listas, pies de foto, etiquetas de formulario,
  precios, ninguna cifra. Ponerlo en todo vuelve a ser un tic, que es la queja
  de partida.
- **Techo**: ocho renglones. Un titular de nueve líneas no es un titular.

---

## 4. CONTRASTE DE TEXTO SOBRE FOTO — el bug y la regla general

### El bug (arreglado en `styles/sections/planes.css`)

La marca de agua de `#planes` (`.planes-portada__renglon`) va con **relleno
transparente y contorno de 1,5 px** (`-webkit-text-stroke`).

Y **no era el velo**: el velo estaba bien calculado y la marca cae dentro de su
tramo pleno en los dos anchos, así que la banda que hay detrás de la letra es la
misma en móvil y en escritorio. El fallo es el tratamiento tipográfico:

- A 128 px (escritorio) el contorno encierra contraformas de 20-30 px. La foto
  se ve por dentro de la letra y **eso es el gesto**: una marca de agua.
- A 21,6 px (móvil de 375 px, `clamp(1.35rem, …)`) las mismas contraformas
  miden 2-3 px y están llenas de follaje en movimiento. El ojo no cierra la
  forma, no lee la palabra: ve una letra sucia. Y el trazo pasa de ser el 1,2 %
  del cuerpo a ser el 7 %, así que en los remates finos de Fraunces los dos
  lados del trazo se tocan y la letra se empasta.

**Arreglo aplicado:** el contorno queda acotado a `@media (min-width: 48em)`.
Por debajo, relleno crema sólido (`--color-texto-inverso`, 10,7:1 sobre el
velo). El gesto de la sección se conserva entero —escala descomunal, cruce
sobre la foto, sangrado por la derecha—; lo único que cambia es que en móvil la
letra está llena.

### LA REGLA GENERAL — nadie la repite en su propia sección

1. **Texto con relleno transparente sobre fotografía: sólo por encima de ~48 px
   de cuerpo.** Por debajo, relleno sólido. Sin excepciones.
2. **Todo texto sobre foto va sobre velo**, y el velo se calcula **contra los
   píxeles reales de la franja donde caen los renglones**, no a ojo. El método
   ya está documentado con cifras en `planes.css` §3 y §6: cópialo, no lo
   inventes.
3. **El velo se revisa en CADA breakpoint por separado.** Un `object-position`
   o un `clip-path` que cambia en móvil mueve la foto debajo del texto y puede
   dejar el renglón sobre una zona clara que en escritorio no existe.
4. **Si un efecto de movimiento es lo que hace legible el texto, el texto no es
   legible.** El cliente lo dijo sin saberlo: «se ven horribles **sin
   animación**». El contraste tiene que aguantar con el fotograma congelado y
   con `prefers-reduced-motion` activo.
5. **Nunca `text-shadow` como parche de contraste.** Ensucia la serif fina.
   Velo o relleno sólido.

---

## 5. LOS VÍDEOS DE `#momentos` — «se ven quietos»

**Arreglado por el director de arte en `js/momentos-video.js` y
`styles/sections/momentos.css` §4 bis. El agente de esa zona lo verifica en
móvil real; no lo rehace.**

### Diagnóstico (dos causas, y la gorda no era de animación)

1. **El clip no llegaba a arrancar.** Con `preload="none"`, el navegador no
   pedía ni un byte hasta que el observador veía el clip un 20 % dentro de
   pantalla — es decir, la descarga de un archivo de varios megas empezaba
   cuando el clip ya estaba a la vista. En datos móviles eso son segundos
   enseñando el póster, y la banda es lo bastante alta como para que el
   visitante la pase entera antes del primer fotograma. **No son vídeos
   quietos: son vídeos que no empezaron.**
2. **El encuadre está clavado.** Aun corriendo, un plano fijo de 2-6 segundos
   sobre una vara que se mece, dentro de un recuadro de bordes quietos, se lee
   como una foto con ruido.

### Arreglo

1. **Dos observadores en vez de uno.** Uno de precarga con `rootMargin:
   '1200px 0px'` que sólo sube `preload` a `'auto'` — el búfer se llena
   mientras el visitante todavía está en `#planes`. Otro de reproducción con
   `threshold: 0.01` en vez de 0,2: el clip corre desde que asoma el primer
   píxel. *Nada se descarga al abrir la página: lo que se adelanta es el
   momento dentro del recorrido, no el hecho de descargar.*
2. **Ken-burns lentísimo mientras corre** (`.momentos__video.en-marcha`): 14 %
   de escala en un ciclo larguísimo, sólo `transform`, cada pieza con su propio
   compás y un **retardo negativo** distinto para que las cuatro no respiren a
   la vez. Se pausa fuera de pantalla (`animation-play-state`).
3. **La clase `en-marcha` se pone cuando `play()` RESUELVE**, no cuando se
   pide. Sobre un póster fijo (iOS en bajo consumo) el zoom no se aplica: un
   póster que hace zoom miente sobre lo que está pasando.

### Lo que se aprende, y aplica a toda la página

**Un `preload="none"` sin observador de precarga adelantado es indistinguible
de una imagen fija en móvil.** Cualquier agente que meta vídeo en su zona
—`naturaleza` ya tiene `js/naturaleza-video.js`— usa este mismo patrón de dos
etapas.

---

## 6. CHECKLIST DE OPTIMIZACIÓN MÓVIL — cada agente, en su zona, antes de cerrar

- [ ] **Área táctil ≥ 44 × 44 px** en todo lo que se pulsa, incluidos enlaces
      de texto sueltos e iconos. Se mide con las herramientas, no a ojo.
- [ ] **Nada existe sólo en `:hover`.** Ninguna información, ningún control y
      ningún estado. En táctil el hover no ocurre. Si un efecto de hover revela
      algo, tiene que haber una réplica táctil.
- [ ] **Tipografía fluida y sólo de `tokens.css`.** Ni un `font-size` literal.
      Suelo 12,8 px (`--paso--2`); ningún texto baja de ahí.
- [ ] **Comprobado a 320 px con la raíz del sistema en 24 px** (usuario mayor
      con letra agrandada). `base.css` tiene una red de seguridad al final para
      esto, pero no lo cubre todo.
- [ ] **Imágenes con `sizes` del layout REAL, nunca `100vw`** si la pieza no
      ocupa el ancho de la ventana. `width`/`height` o `aspect-ratio` en todas
      → CLS cero.
- [ ] **`loading="lazy"` + `decoding="async"`** en todo lo que no sea el LCP.
      El hero, y sólo el hero, va con `fetchpriority="high"`.
- [ ] **Cero scroll horizontal.** `overflow-x: clip` (nunca `hidden`, que mata
      `sticky` y `scroll-margin-top`) en las secciones que sangran.
- [ ] **Ningún `100vh`.** `svh` o `dvh`, siempre.
- [ ] **Todas las animaciones nuevas verificadas con `prefers-reduced-motion`
      activo**, comprobando que el contenido queda VISIBLE y no en `opacity: 0`.
- [ ] **Teclado completo**: foco visible, orden lógico, nada alcanzable sólo
      con puntero.
- [ ] **Contraste AA con el fotograma congelado** (§4, regla 4).

---

## 7. REGLAS DURAS — se cumplen sin discusión

**Movimiento**
- Sólo `transform` y `opacity` (o las propiedades independientes `translate` /
  `rotate` / `scale`). Cualquier otra cosa se justifica en un comentario.
- **Estado inicial horneado en HTML/CSS estático.** Cero parpadeo: nunca un
  fotograma con el contenido invisible esperando a un script.
- `IntersectionObserver` siempre con `classList.toggle`. **Nunca `unobserve`.**
  Bajar y volver a subir tiene que volver a levantar la escena.
- Animaciones pausadas fuera del viewport.
- Nada de duraciones ni curvas nuevas: todas salen de `tokens.css` §9. Los
  DESFASES sí pueden ser números, las duraciones no.
- **Tres animaciones simultáneas sobre `transform` no se suman: la última
  declarada gana la propiedad entera.** Si necesitas compases independientes,
  reparte por propiedad (`translate` / `scale` / `rotate`), como hace
  `base.css` §v7 con la fauna.
- **Nada se mueve al mismo compás y nada empieza al mismo tiempo.** Gestos
  sincronizados se leen como GIF; desfasados se leen como diseño.

**Tipografía y color**
- **Prohibido `text-transform: uppercase` en texto ≥ 24 px.**
- Ni un color, tamaño, radio, sombra o duración literal. Todo de `tokens.css`.
  Si falta un token, se pide al director de arte; no se inventa.

**Contenido y lengua**
- Nombres de clase, variables y comentarios **en español**.
- **Prohibidas las palabras «ecoposada» y «data-modal».**
- **No se inventa contenido, fotos ni cifras.** Ni un aforo, ni un precio, ni
  una distancia, ni una especie que no esté ya en el sitio. Regla de
  ARQUITECTURA-V3: **un hecho, un dueño** — si el dato es de otra sección, no
  se repite aquí.
- Español colombiano con **tuteo**.
- **«Poco texto, y el que haya que incentive alquilar.»** Cada sección de
  eventos cierra con una salida hacia WhatsApp o hacia el formulario. Ningún
  bloque de texto sin siguiente paso.

**Prohibido ejecutar**
- No se corre `ensamblar.js`, `ensamblar.py`, `versionar-assets.js` ni
  `validar.js`. No se hace `git commit` ni deploy. Sin autorización explícita
  del usuario, nada se publica.

---

## 8. Qué está YA hecho y no hay que rehacer

| Archivo | Qué se hizo |
|---|---|
| `styles/tokens.css` | Tokens nuevos: `--dur-aleteo`, `--dur-deriva`, `--dur-cruce`, `--opacidad-fauna`, `--opacidad-fauna-suave`, `--retardo-linea`, `--desplazamiento-linea`, con sus anulaciones en `prefers-reduced-motion`. |
| `styles/base.css` | §v7 nuevo: `.reveal-texto` (+ variante `--persiana`) y toda la capa `.fauna-ambiente` con sus cuatro `@keyframes`. Añadido antes del bloque móvil autoritativo, que sigue siendo el último. |
| `js/fauna-ambiente.js` | **NUEVO.** Módulo compartido `montarFaunaAmbiente()`. |
| `styles/sections/planes.css` | Arreglo del contraste móvil de la marca de agua (§4). |
| `js/momentos-video.js` | Precarga adelantada + arranque al primer píxel + clases `en-marcha` / `en-pantalla` (§5). |
| `styles/sections/momentos.css` | §4 bis: ken-burns desincronizado sobre el clip en marcha (§5). |
| `herramientas/ensamblar.js` / `.py` | **SIN TOCAR**, y es una decisión (§1). |
