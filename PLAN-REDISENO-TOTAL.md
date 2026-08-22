# Plan de rediseño total — Vegas del Verde

**Estado: NADA ejecutado.** Solo anotación de lo que el usuario pidió, en varios mensajes,
para retomar cuando dé la orden explícita ("cuando te diga empieza te autorizo").

---

## Diagnóstico del usuario sobre el estado actual

Tras ver el sitio publicado: **"no me está gustando el sitio para nada, no transmite nada"**.
Insatisfacción explícita con el resultado de la sesión anterior (2+ horas de trabajo con
múltiples agentes) — no cumplió la expectativa. Quiere un rediseño de fondo, no ajustes.

## Lo que SÍ le gustó y se conserva

1. **El hero "Pajareo"** — captura mostrada del milano picogarfio con el título en contorno
   hueco sobre la foto. Esto ya existe en el sitio (`#naturaleza`, agente de la Fase 5). Se
   mantiene tal cual.
2. **La sección del concurso de fotografía** ("Todas fueron tomadas aquí dentro", fondo verde
   pálido, cifra 57/20 autores) — **"esto sí me encantó, dejalo"**. Se conserva el contenido y
   el argumento (fotos reales del predio, créditos), pero se le agrega la animación de abajo.
3. **Los botones "Llegar con Google Maps / Llegar con Waze"** (coral relleno + contorno) — ya
   existen en `#ubicacion`. Le gustan tal cual están.

## Cambio pedido sobre el concurso: fondo negro animado

Referencia EXACTA localizada y confirmada por el usuario: la sección **"La Prueba"** de
`PROYECTO RAFAEL SILVA/sitio` (Hotel Terra Barichara, fondo naranja/cobre). Mecanismo real
(no es niebla animada — el naranja es el grading real de la foto):

- **Pista de scroll de 300svh** (`.prueba`, `height: 300svh`) con una escena `sticky` de
  `100svh` dentro (`.prueba__escena`, `position: sticky; top: 0; overflow: hidden`).
- El contenido **entra recortado** (`clip-path: inset(...)` con más recorte arriba y a los
  lados) y **se despliega hasta pantalla completa** a medida que se scrollea, vía una variable
  `--entrada` que va de 0 a 1 en el primer tercio del recorrido (`tramo(0, 0.34)`).
- Tras desplegarse, **queda solo, protagonista, sin nada encima**, durante otro tramo del
  recorrido — esa pausa es la que le da peso.
- Recién después aparece un **velo** (gradiente) y el texto, vía otra variable `--texto`
  (`tramo(0.55, 0.80)`).
- Todo pilotado por una única función genérica `escenaPorScroll()` en `app.js` que traduce
  la posición de scroll a variables CSS (`clip-path`/`transform`/`opacity`), sin animar layout.
- Se apaga solo sin JS o con `prefers-reduced-motion: reduce` (la escena se muestra resuelta,
  sin pista que deslizar).

**Adaptación pedida para Vegas — combinar ese mecanismo con la idea nueva de las 3 filas:**
- **Fondo NEGRO** en vez de la foto naranja de Barichara.
- En vez de una sola foto desplegándose, lo que se despliega/protagoniza es una **banda de
  3 filas de fotos del concurso**, cada fila en loop infinito vertical, direcciones alternadas
  (una sube, la siguiente baja, sin parar nunca), con desvanecido en los bordes superior/
  inferior contra el negro (gradiente de máscara `mask-image`, contenido de cada fila
  duplicado para el loop sin salto).
- Se conserva el patrón general de "entra, se queda protagonista, luego aparece el texto/cifra
  encima" que ya usa `.prueba`, adaptado a fondo negro + banda de fotos en vez de foto única.

## Referencias visuales aportadas (para el prompt de ChatGPT y como brief de diseño)

### 1. Landing de paisajismo ("Naturescape Landscapes")
- Hero con foto de jardín nocturno iluminado, titular grande en dos pesos/colores
  (blanco + verde), barra de iconos de beneficios debajo.
- Grid de servicios con foto + ícono + texto corto por tarjeta.
- Sección "Why choose us" con video/foto de atardecer + checklist.
- Testimonios en tarjetas con estrellas.
- CTA final oscuro con formulario de contacto.
- **Vista móvil incluida** — el usuario quiere mockups de escritorio Y móvil.

### 2. Landing de decoración de exterior ("Home Veranda")
- Hero con foto real de living exterior al atardecer (luces cálidas, sofá, plantas).
- Barra de confianza (envío gratis, seguro, etc.) con íconos lineales.
- Grid de categorías de producto con foto + botón "Shop now".
- Frase editorial centrada entre plantas en macetas.

### 3. Paleta verde oscuro→claro con hex exactos
`#0D1F16` (Deep Forest) → `#14381F` → `#1C4D2E` → `#2E6B3F` → `#3F8451` → `#5AA06D` →
`#7BAE8A` → `#A1C29F` → `#C3DDBA` → `#E6F2E1` (Pistachio Cream). Íconos de hoja lineal junto
a cada nombre.

### 4. Paleta de nombres botánicos en tarjetas de tela
Linden, Meadowlark, Willow, Mosswood, Cloverfield, Fernglade, Highland, Riverpine, Nightfall,
Woodsmoke — de claro a oscuro, con ilustración lineal de hoja/rama distinta en cada franja.
Tipografía serif versalita, mucho aire.

## Dirección de diseño (instrucciones explícitas del usuario)

- **Tipografía de alta calidad**, premium — no la actual.
- **Paleta de colores que se vea "cara, costosa, premium"**.
- **Animado** — todo el sitio, no solo el hero.
- **Prioridad de negocio, la más importante de todas: VENDER LOS ESPACIOS.**
  Debajo del hero deben aparecer los **eventos que se realizan, con sus fotos, con mucho
  énfasis** — más que ninguna otra cosa en la página. El objetivo es que alguien vea la página
  y quiera alquilar un espacio para el evento que ya tiene en mente.
- **Poco texto.** Solo palabras que inciten a alquilar — "juega con su psicología". Nada de
  párrafos largos explicativos.
- **Logos originales** (no usar el actual sin más — revisar/rehacer).
- **Si faltan fotos para algún bloque del nuevo diseño, dejar el espacio marcado** en vez de
  inventar o forzar una foto que no calce — no limitarse por eso al proponer el diseño.

## Plan de ejecución (en el orden que el usuario pidió)

1. **Primero: ver qué da ChatGPT.** Generar mockups de referencia (escritorio + móvil) a partir
   de todo lo anotado arriba, usando las 4 referencias visuales como guía de estilo — sin
   alucinar contenido: los prompts deben basarse solo en los espacios/eventos reales de
   BRIEF.md, nunca inventar servicios o cifras.
2. Armar **todos los prompts** de antemano (uno por vista/sección que se necesite mockear),
   listos para pegar. El usuario dice "tengo todo a la mano" — él mismo generará las imágenes
   cuando dé la orden (o pide que lo haga el asistente vía navegador, a confirmar en el momento).
3. Con los mockups aprobados, recién ahí se pasa a ejecutar sobre el sitio real.
4. **Nada de esto se ejecuta hasta la orden explícita** ("cuando te diga empieza te autorizo").

## Mockups generados (ChatGPT, vía navegador, cuenta del usuario)

Guardados en `_mockups-chatgpt/` (12 imágenes, no forman parte del sitio, son solo referencia):

| # | Archivo | Qué muestra |
|---|---|---|
| 1 | `01-desktop-landing.png` | Landing completa escritorio: hero + eventos protagonistas debajo |
| 2 | `02-concurso-fondo-negro.png` | Concurso fondo negro, 3 filas horizontales — **la que más gustó** |
| 3 | `03-mobile-landing.png` | Landing completa en móvil |
| 5 | `05-concurso-vertical-movil.png` | Concurso fondo negro adaptado a móvil, 2 columnas verticales |
| 6 | `06-espacios-grilla.png` | Grilla de 6 espacios alquilables (Alameda, Vega, Teatrino, Cancha, Vivero, Mirador) |
| 7 | `07-bienestar-banda-oscura.png` | Banda oscura yoga/bienestar, texto en negativo |
| 8 | `08-footer-cta.png` | Pie de página / CTA final, con propuesta de nombre de marca "Verde Sereno" |
| 9 | `09-logo-conceptos.png` | 6 variaciones de logo lineal minimalista (propuesta de nombre "VerdeAlto") |
| 10 | `10-colegios-vivero.png` | Sección colegios + vivero, díptico asimétrico |
| 11 | `11-ubicacion-mapa.png` | "Cómo llegar" con mapa ilustrado + botones Maps/Waze (se conservan tal cual pidió) |
| 12 | `12-testimonios.png` | 3 tarjetas de testimonios con foto, estrellas y cita |

(`04-concurso-doble-fallido.png` fue un intento fallido, se descarta.)

Nombres de marca que salieron solos en las generaciones ("Verde Sereno", "VerdeAlto") son
sólo sugerencias del modelo — pendiente que el usuario elija o pida otro naming.

## Instrucción de ejecución (cuando se autorice)

El usuario pidió explícitamente: cuando el plan esté cerrado y dé la orden, lanzar **agentes
a tope**, aprovechando los procesadores del PC (GPU para imágenes vía Real-ESRGAN, como ya
se hizo en la fase anterior), y que la ejecución/terminación del sitio corra **con el modelo
Fable únicamente** (no Sonnet/Opus) para esa fase.

## Ejecución realizada (autorizada por el usuario, 5 agentes en paralelo, modelo Fable)

Estado: **ejecutado y validado en local, NO publicado/commiteado todavía** (falta orden explícita
de "publica").

- Logo original SVG (3 hojas + río) en header, nombre real "Vegas del Verde" conservado.
- Pie de página rediseñado premium, sin datos inventados.
- Concurso: fondo negro, mecanismo scroll-driven tipo "La Prueba" implementado con
  `js/concurso-cinta.js`, 3 filas (escritorio) / 2 columnas (móvil) de las 24 fotos reales del
  concurso, cifra "57 · 20 autores" aparece igual que en el mockup aprobado. Verificado en
  navegador, sin errores de consola.
- Banda nocturna nueva en `#planes` con foto real de evento nocturno (GPU-procesada), texto en
  contorno + tarjeta CTA.
- Espacios, colegios, vivero, nosotros y ubicación: pulido quirúrgico manteniendo contenido real
  (botones Maps/Waze y titular de Nosotros intactos, como se pidió).
- `node herramientas/ensamblar.js` → OK · `versionar-assets.js --escribir` → 0 rutas rotas ·
  `node herramientas/validar.js` → **TODO LIMPIO**.

Pendientes que dejaron los agentes (decisiones de contenido, no de código):
- Sello "+N años" en Nosotros: omitido, no hay esa cifra en el contenido real.
- Foto de la reja/portón para Nosotros: no existe en el banco, se usó `parque-05` (prado).
- La Vega, Teatrino y Cancha siguen sin foto propia (pendiente sesión fotográfica, ya anotado
  desde PLAN-HERO-V6).
- Réplica de estos cambios en `/en/index.html` (versión inglesa) no se hizo — sigue divergida.

## Pendiente antes de dar por cerrado el plan

- Que el usuario revise los 12 mockups y diga cuáles aprueba, cuáles ajustar, y elija naming
  de marca / logo definitivo.
- Aclarar si el usuario pegará más prompts él mismo en ChatGPT o si se sigue haciendo vía
  navegador (como se hizo en esta sesión, con su cuenta ya con cuota paga).
- Confirmar orden de fases de ejecución sobre el sitio real una vez haya autorización.
