# Plan del hero vivo y rediagramación — v6

Resultado de la auditoría de `web-design-master` sobre el banco completo de fotos
(`_material-fuente/`, 452 imágenes). Este documento es la referencia de ejecución.

---

## Diagnóstico

El hero no es genérico por la maquetación, sino por **la fotografía**.
`img/portada-inicio.jpg` (1400×2489) es un prado a mediodía sin sujeto: sin persona,
sin animal, sin evento. El propio código lo confesaba — `js/particulas-hero.js:4-6`:
*"La foto de la portada ya enseña el bosque quieto bajo el sol de mediodía."*

Consecuencias en cadena:
- El velo de legibilidad (`inicio.css:279`) existe porque el cielo blanco de mediodía
  no aguanta texto crema encima (coral se queda en 3,6:1).
- `--fs-hero` topa en 5,25rem (84px). Los referentes juegan a 15–20vw. Sin drama de escala.
- Cero profundidad: titular plano sobre velo sobre foto. Tres capas apiladas, ninguna
  interpenetrada.

Se conserva intacto: la entrada escalonada (`.reveal-secuencia`), la orla orgánica,
el paralaje sin JS (`animation-timeline: view()`), el indicador de scroll, `sobre-oscuro`.

---

## Concepto — "El bosque te está mirando"

La portada deja de ser paisaje y pasa a ser **retrato**: el barranquero de Leyner Lozano
ocupando la ventana entera, la cola de raqueta colgando por delante del titular, bosque
desenfocado en verdes hondos. Movimiento abundante pero **lento y desincronizado**.

La metáfora no se importa: el barranquero ya es el ave nº1 de la tira de `#inicio`, y el
mismo pájaro está pintado como mural en el predio (`img/parque/parque-62.jpg`).

---

## Hallazgos de fotos

### Correcciones a supuestos previos
- Las 11 fotos de `img/eventos/` **sí se usan** (todas en `planes.html` salvo `infantil-3`).
  El problema es **jerarquía, no ausencia**: `boda-2/3/4` viven como miniaturas de ~180px.
- Las 21 mariposas y el colibrí **sí se usan**, pero por JS y sólo en `plan-vecino.html`.
  En `index.html` no vuela ninguna.
- Las 4 fotos de boda de `_material-fuente/` son **las mismas que ya están publicadas, pero
  peores** (1280×960 fuente vs 1500×1125 publicada). No hay upgrade ahí.

### Originales de altísima resolución nunca publicados

| Origen | Píxeles | Qué es | Destino |
|---|---|---|---|
| `CONCURSO_FOTOGRAFIA/Leyner Lozano -Momotus subrufescens- Foto 02.jpg` | 4640×6960 | Barranquero, cola de raqueta, baya en el pico, bokeh verde | **EL HERO** |
| `CONCURSO_FOTOGRAFIA/Leyner Lozano - Chondrohierax uncinatus- Foto 01 .jpg` | 2975×4463 | Milano picogarfio sobre rama | Portada de `#naturaleza` |
| `Contexto/IMG_9916.jpg` | 4536×8064 | Camino de losas entre heliconias y guaduas | Apertura del Sendero |
| `ESPACIOS/Alameda/IMG_9897.jpg` | 4220×5626 | La Alameda real | Reemplazo de `alameda-1-TEMP` |
| `ESPACIOS/Eventos/Recreación Infantil/1021 (19..22)` | 2340–4160 | Los 4 momentos infantiles a 3× | Re-derivar |
| `ESPACIOS/Yoga/1021 (24).jpeg` | 4160×2340 | Yoga apaisada | Banda a sangre, carril bienestar |
| `FOTOS_WEB/*` (63) | 2000px | **Originales de `img/parque/*`** (hoy a 1200px) | Re-derivar lo que suba a protagonista |

### Fotos ya en `img/` sin usar que valen
- `parque-62.jpg` — **el mural del barranquero**. Cierre de `#naturaleza`.
- `parque-44.jpg` — vivero por dentro con jardinera trabajando. Persona + producto reales.
- `parque-12.jpg` — enramada de guadua del vivero.
- `parque-26.jpg` — cuento al parque, toma ancha. Para `#colegios`.
- `parque-30.jpg` — yoga vertical.
- `eventos/infantil-3.jpg` — cuadrada 1:1, la única del set.

### Huecos que el material NO tapa
Carpetas **vacías** en `_material-fuente/ESPACIOS/`: Café del Verde, Jardín de Polinizadores,
La Vega, Observatorio de Aves, Observatorio de Plantas, Teatrino, Vivero, Zona de Parqueo.
→ **La Vega, Teatrino y Cancha siguen sin foto propia.** Requiere sesión fotográfica.

---

## Composición del hero

**Foto:** `hero-momotus.jpg` derivada del original 4640×6960 → ~1600×2400 + AVIF/WebP.

Por qué esta: vertical (la relación que ya usa `.inicio__portada-foto`), fondo bokeh verde
oscuro uniforme (crema da >10:1 **sin velo**), sujeto descentrado a la izquierda dejando el
tercio derecho limpio, y **la cola de raqueta baja recta por donde va el titular** — el efecto
de profundidad servido, no hay que inventar dónde cruza.

**Tipografía:** texto sin cambiar ni una palabra. Cambia la escala:
```css
--fs-portada: clamp(3.2rem, 1.6rem + 7.4vw, 8.5rem);   /* único token nuevo */
```
No toca la escala modular ni la paleta; añade un paso por encima del 6 reservado al titular
de portada. Sigue en caja alta y baja → no roza la regla de mayúsculas (§3).

**Profundidad (efecto Gibraltar) — Opción A, sin recorte manual:**
Se pinta la **misma foto dos veces**. La capa 2 (`.inicio__portada-recorte`) lleva un
`clip-path: polygon()` de ~24 puntos siguiendo el contorno del pájaro y su cola.
Funciona porque el fondo es bokeh verde uniforme: si el polígono se pasa 8px, es verde
sobre verde. **0 bytes de red** (misma URL ya decodificada), `clip-path` es compositor puro.

Atadura crítica: las dos capas comparten `object-fit`, `object-position` y paralaje.
→ el paralaje va en un **envoltorio común**, no en cada `<img>`.

**Móvil (<64em):** la capa 2 no se monta. A 375px el `cover` recorta la cola fuera de cuadro.

---

## Sistema de animación

Regla que gobierna todo: **nada se mueve al mismo compás y nada empieza al mismo tiempo.**
Nueve gestos sincronizados = GIF. Nueve desfasados = bosque.

| # | Gesto | Mecanismo | Costo |
|---|---|---|---|
| 1 | Entrada escalonada del texto | Ya existe (`.reveal-secuencia`) | 0 |
| 2 | Paralaje de la foto | Ya existe (`animation-timeline: view()`) | 0 |
| 3 | Partículas polen + hojas | `particulas-hero.js` **recalibrado** | ya pagado |
| 4 | Mariposas que suben (9, no 21) | Enjambre de `plan-vecino.js` | ~500 B c/u |
| 5 | El colibrí cruza | `colibri.png` (ya trae alfa) | 88 KB lazy |
| 6 | Siluetas SVG que se dibujan | `hornear-trazos.js` + `.icono-traza` | ~2 KB |
| 7 | Texto-contorno gigante | `-webkit-text-stroke` + `view()` | 0 |
| 8 | foto-focus | `foto-focus.js` | ya pagado |

**Recalibrado obligatorio:** `particulas-hero.js` está en coordenadas normalizadas *de la foto*
y su cabecera avisa que cambiar la portada obliga a re-medir `COPAS`, `SUELO` y `POSICION_FOTO`.
Con el barranquero el follaje ocupa el encuadre entero → la densidad sube de "invisible" a
"perceptible", que es lo que se pidió.

**Siluetas:** 3 en la firma exacta que reconoce `hornear-trazos.js:36-40`
(`fill="none"` + `stroke="currentColor"` + `viewBox="0 0 24 24"`): vencejo en vuelo, hoja de
caracolí, pluma de raqueta. Estado inicial **horneado en el HTML** → cero parpadeo por
construcción. No hace falta JS nuevo.

### Lo que NO se hace, y por qué
- **Nada de Ken Burns.** Ya hay paralaje; dos movimientos sobre el mismo píxel se pelean.
- **Nada de vídeo de fondo** (aunque hay 16 mp4 sin usar). Mata el LCP.
- **Nada de cursor personalizado ni partículas que sigan el mouse.** No existe en móvil ni
  con teclado, y es el gesto que más rápido envejece.
- **Nada de texto letra por letra.** 20 capas de compositor durante el LCP, y `text-wrap` se rompe.
- **Nada de scroll-jacking.** Rompe teclado y lector de pantalla.
- **9 mariposas, no 21.** En `plan-vecino` el enjambre es *el* motivo; en el hero compite con
  el pájaro real. Nueve es abundancia; 21 es calcomanía.

---

## Rediagramación

### `#planes` carril 01 — Bodas
Hoy: una foto grande + 3 miniaturas de ~180px. Se parte en dos actos:
- **Acto 1:** pieza de contorno a sangre completa con `boda-3.jpg` (100vw × ~85svh, esquinas rectas).
- **Acto 2:** díptico asimétrico — `boda-2` (5 col, desbordando 2rem por arriba) + `boda-1`
  (7 col, alineada abajo). Radios hoja en diagonales opuestas.
- `boda-4` sale del carril → `#espacios` La Vega (que no tiene foto propia).

### `#planes` carril 02 — Cumpleaños
Hoy: 4 verticales iguales en fila (el defecto que v5 ya corrigió en la tira de aves).
- `infantil-4` (el niño saltando a atrapar pompas — **la mejor foto emocional del banco**)
  sube a protagonista al 55%.
- `infantil-2` + `cumpleanos-1` al lado en dos alturas distintas.
- `infantil-1` se retira → `#colegios`.
- Entra `infantil-3` (cuadrada, hoy sin usar) como foto de contexto ancha.

### `#planes` carril 04 — Bienestar
`yoga-2` en 16:9 dentro de carril oscuro. El original es 4160×2340 → **banda a sangre completa**,
texto en negativo sobre el césped en sombra. Es el único carril en negativo y no lo aprovecha.

### `#colegios` y `#vivero`
- Colegios: las 2 `-TEMP` → `parque-26.jpg` + `infantil-1.jpg`.
- Vivero: `parque-40-TEMP` → `parque-44.jpg` (jardinera trabajando: persona real + producto real).

### `#naturaleza`
Portada con el **milano picogarfio**, cierre con **`parque-62.jpg`** (el mural del barranquero).
El sitio abre con el pájaro real y cierra con el pájaro pintado en la pared.

---

## La pieza de texto-contorno

**Choque con regla dura, resuelto:** el referente es mayúsculas gigantes, pero
`CONTRATO-V2.md:118-119` prohíbe `text-transform: uppercase` sobre cualquier cosa ≥24px.

El gesto del referente **no es el caps** — es la escala descomunal + el contorno hueco + el
cruce sobre la foto. Los tres se conservan en caja alta y baja. Con Fraunces a peso 320 se ve
**mejor**: la serif tiene ascendentes y descendentes que dan al contorno un dibujo que las
mayúsculas no tienen.

- **Foto:** `img/eventos/boda-3.jpg` — la única con cielo azul de hora azul ocupando el 35%
  superior, oscuro y sin detalle. Contorno crema da >12:1 sin velo. Las otras tienen cielo
  blanco, o carpa blanca justo donde iría el texto, o son verticales.
- **Frase:** **"La fiesta empieza cuando se encienden los bombillos"** — es el `h3` que ya
  existe en `planes.html:97-99`. Se **promueve** a marca de agua y el `h3` se retira
  (ARQUITECTURA-V3, "un hecho, un dueño").
- **Contraste, tres medidas:** (1) la frase va también en `<span class="solo-lectores">` y el
  contorno lleva `aria-hidden` — es decoración, no contenido; (2) velo `--color-velo` acotado
  a la banda del texto; (3) **la tarjeta flotante** (ícono `.icono-traza` + título + 2 líneas
  + CTA con flecha) sobre `--color-superficie-solida`: ahí vive el contraste AA real y el CTA.
  El contorno es atmósfera; la tarjeta es la información.
- **Scroll:** deriva horizontal ~12vw a contramarcha con `animation-timeline: view()`.
  Sin JS, sin `getBoundingClientRect`, sólo `transform`.

---

## Fases

Todas terminan en `ensamblar.js` → `versionar-assets.js` → `validar.js` + capturas a 375/768/1280.

| Fase | Qué | Riesgo | Tiempo |
|---|---|---|---|
| **0** | Derivar imágenes de `_material-fuente/` a `img/` (`<picture>` AVIF/WebP/JPG) | cero | 1 h |
| **1** | 🏆 **EL HERO** — el mayor impacto/costo | **alto** | 3-4 h |
| **2** | Sustituir las 4 `-TEMP` por fotos reales | bajo | 1 h |
| **3** | Pieza de texto-contorno sobre `boda-3` | medio | 2-3 h |
| **4** | Rediagramar carriles 01, 02, 04 de `#planes` | medio | 3-4 h |
| **5** | Portada y cierre de `#naturaleza` (milano + mural) | bajo | 2 h |

**Riesgos concretos de la Fase 1:**
- `clip-path` desfasado respecto a la capa 1 → paralaje en envoltorio común.
- Parpadeo si algún estado inicial se pone desde JS → todo horneado (regla dura).
- LCP → enjambre y colibrí por `import()` dinámico post-`decode()`.

**Verificación Fase 1:** LCP < 2,5 s en móvil emulado, captura del primer frame para descartar
parpadeo, recorrido completo con `Tab`, `prefers-reduced-motion` forzado.

---

## Decisiones tomadas (por defecto, revisables)

1. **Barranquero** en el hero (no el milano): fondo verde = contraste resuelto, cola que cruza
   el titular = profundidad gratis, y es el ave del mural del predio.
2. **Se respeta el CONTRATO**: caja alta y baja contorneada, no mayúsculas. Conserva escala,
   hueco y cruce.
3. **Se añade `--fs-portada`** — único token nuevo.
4. **Se retira el `h3`** de `planes.html:97` al promover la frase a marca de agua.
5. **Opción A** (`clip-path`) para la profundidad, no PNG recortado.

## Pendiente del cliente

- **Sesión fotográfica de La Vega, Teatrino y Cancha** — los tres espacios que se alquilan y no
  tienen ni una foto propia. Ningún rediseño inventa eso.
- Evaluar en fase posterior los 16 vídeos sin usar (nunca en el hero).
