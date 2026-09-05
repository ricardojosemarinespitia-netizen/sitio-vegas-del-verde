# Auditoría de diseño y plan de rediseño v4 — Vegas del Verde

**Estado: PROPUESTA. NADA EJECUTADO.**
Autorización recibida el 2026-09-01: «estás autorizado a escribir un rediseño completo
profesional pero no a ejecutarlo». Este documento es ese rediseño. Ninguna línea de código,
imagen ni commit cambia por este archivo. Cada fase del apartado 6 requiere su propia orden
explícita antes de tocarse.

Sustituye a `PLAN-REDISENO-TOTAL.md`, que quedó obsoleto: pedía fondo NEGRO animado para el
concurso y bandas oscuras, y el cliente hoy pide lo contrario («no quiere tonos oscuros en la
página ni fotos oscuras, las originales y punto»). Ese archivo no se borra —no hay orden—, pero
no debe usarse como referencia.

---

## 0. Resumen ejecutivo

El sitio tiene una base **mejor que la media**: sistema de tokens estricto, arquitectura de
contenido honesta («un hecho, un dueño»), fotografía propia, logo real, tipografía ya alineada
con el lettering de la marca, accesibilidad estructural correcta y SEO técnico completo. Lo que
lo frena no es el gusto: son **cinco problemas medibles**.

| # | Hallazgo | Dato medido | Efecto en el cliente final |
|---|---|---|---|
| 1 | **Es demasiado largo.** Una sola página de 34 pantallas en escritorio y 37 en móvil. | 30.958 px / 30.239 px de alto; #planes 8,6 pantallas, #naturaleza 7,5, #usos 5,3, #ubicación 4,7 (móvil) | Nadie llega al final. La sección de contacto está a 30 pantallas del hero. |
| 2 | **Pesa el triple de lo que debería.** Se envían al navegador los comentarios de trabajo. | CSS 788 KB (**71 % son comentarios**), HTML 377 KB (**44,5 % comentarios**), 2,9 MB por visita en escritorio | Carga lenta en 4G, la primera impresión es un fondo vacío |
| 3 | **Demasiados motores de movimiento.** | 12 archivos JS (140 KB), 57 animaciones vivas a la vez, 85 piezas `.reveal`, un `clip-path` a pantalla completa por cuadro en el carril 01 (27–55 ms/cuadro medidos) | El lag «por todas partes» en celular que el cliente ya reportó tres veces |
| 4 | **Las 108 fotos de #naturaleza** cuelgan de la misma página que todo lo demás. | 167 `<img>` en el DOM, 1,8 MB de imagen en la carga inicial | La sección más valiosa (aves reales del predio) está enterrada y ralentiza todo |
| 5 | **Deuda visible pendiente de publicar.** | 48 archivos modificados sin commit; `foto-focus.js` se carga DOS veces; `theme-color` del `<head>` sigue en el oliva de v1 (`#566438`); `en/index.html` es la arquitectura v1 con bandas oscuras | Lo que el cliente ve en vivo no es lo que ya está resuelto en el repo |

**Los cinco movimientos del rediseño v4** (detalle en el apartado 4):

1. **Home corta + páginas de profundidad.** La portada pasa a ser un escaparate de 12–14
   pantallas; Espacios, Planes, Naturaleza, Vivero y Sendero ganan página propia (URL propia,
   título propio, JSON-LD propio). Es también la palanca SEO más grande disponible.
2. **Construcción para producción.** Un paso de build que quite comentarios y minifique
   (el código fuente sigue igual de comentado). Objetivo: HTML < 120 KB, CSS < 90 KB, JS < 60 KB.
3. **Tres motores y ninguno más:** entrada por IntersectionObserver, scroll-driven CSS
   (`animation-timeline: view()`) y vídeo perezoso. Sale todo scroll-listener de JS.
4. **Regla dura codificada: foto sin filtro.** El validador rechaza cualquier degradado o velo
   sobre `<img>`/`<video>`. El texto sobre foto va SIEMPRE en placa sólida.
5. **Curaduría fotográfica y sesión nueva.** De 167 imágenes a 60 curadas para la home y las
   páginas, con lista de tomas pendientes (personas usando los espacios, luz de tarde, dron).

---

## 1. Metodología y datos medidos

Todo lo que sigue se midió el 2026-09-01 sobre el working tree actual (incluye los cambios
sin publicar de esta sesión: tipografía Josefin, logo real, sin tonos oscuros, sin velos,
sendero acortado, compromiso rediseñado). Herramientas: `getBoundingClientRect` por sección,
`performance.getEntriesByType('resource')`, conteo de nodos/animaciones/`.reveal`, lectura
directa de `<head>`, `tokens.css`, `BRIEF.md`, `git status`.

### 1.1 Longitud por sección

| Sección | Escritorio 1440×900 | Móvil 375×812 | Imágenes | Palabras | CTA | WhatsApp |
|---|---|---|---|---|---|---|
| #inicio | 1,1 pantallas | 1,1 | 1 | 30 | 1 | 0 |
| #usos (Espacios) | 5,3 | 5,3 | 20 | 122 | 0 | 0 |
| #nosotros | 1,3 | 1,6 | 1 | 46 | 1 | 0 |
| #planes | 7,8 | **8,6** | 13 | 357 | 2 | 5 |
| #naturaleza | **8,5** | 7,5 | **108** | 293 | 1 | 0 |
| #vivero | 2,3 | 2,8 | 8 | 116 | 1 | 1 |
| #sendero | 2,0 | 2,5 | 7 + 5 vídeos | 178 | 2 | 1 |
| #ubicacion | 3,4 | 4,7 | 6 | 275 | 4 | 2 |
| #compromiso | 1,5 | 1,8 | 1 | 92 | 0 | 0 |
| **Total** | **34,4** | **37,2** | 167 | ~1.500 | 14 | 11 |

### 1.2 Peso y técnica

| Métrica | Valor | Referencia razonable |
|---|---|---|
| HTML index.html | 377 KB, 7.043 líneas, 44,5 % comentarios | < 120 KB |
| CSS enlazado (13 hojas) | 788 KB, 71 % comentarios; `planes.css` sola 209 KB | < 90 KB minificado |
| JS | 12 archivos, 140 KB; `foto-focus.js` cargado 2 veces | < 60 KB, sin duplicados |
| Transferencia carga inicial (escritorio, lazy activo) | 2,9 MB / 62 peticiones | < 1,2 MB |
| Nodos DOM | 1.528 | < 1.000 en la home |
| Animaciones vivas simultáneas | 57 | < 20 |
| Piezas `.reveal` | 85 | ~30 en la home |
| Build / minificación | **no existe** (sin `netlify.toml`, sin `package.json`) | paso de build obligatorio |
| Caché (`_headers`) | no existe | assets con hash → `immutable` |

### 1.3 Accesibilidad y SEO (lo que ya está bien y lo que no)

- ✅ Un solo `<h1>`, sin saltos de jerarquía, 0 imágenes sin `alt`, `<main>`/`<nav>`/`<footer>`,
  enlace «saltar al contenido», `lang="es"`, `prefers-reduced-motion` respetado.
- ✅ `canonical`, `hreflang` es/en/x-default, Open Graph, Twitter card, `robots.txt`,
  `sitemap.xml`, JSON-LD `TouristAttraction` con geo, horario, teléfono, imagen y `sameAs`.
- ⚠️ 16 de 112 objetivos táctiles miden menos de 44 px (WCAG 2.5.8).
- ⚠️ Texto mínimo 12,56 px (el suelo de 12,5 px está pensado para legal/créditos, pero se usa
  en rótulos de interfaz).
- ⚠️ `theme-color` = `#566438` (oliva de v1): la barra del navegador no coincide con la marca.
- ⚠️ `hreflang="en"` apunta a `en/index.html`, que es la arquitectura v1 (162 KB, secciones
  #experiencias/#bienestar/#cultura/#aves, bandas oscuras). Google compara ambas versiones.
- ⚠️ El formulario de contacto es `data-form-whatsapp` (JS arma el mensaje): sin JS hace un
  GET a la misma página con los datos en la URL. Falta respaldo `mailto:`.
- ⚠️ Una sola URL para siete intenciones de búsqueda distintas (eventos, bodas, vivero, aves,
  colegios, yoga, sendero). Cada una compite contra sitios con página dedicada.

---

## 2. Diagnóstico de diseño, por capa

### 2.1 Estrategia y embudo

El negocio vende **cotizaciones por WhatsApp** (alquiler de espacios, planes, vivero, sendero)
y visitas (sendero, plan vecino, colegios). El sitio lo entiende: 11 enlaces a WhatsApp con
mensaje prellenado por intención («quiero cotizar para un matrimonio o un concierto», «para
una reunión corporativa»…). Eso es correcto y se conserva.

Lo que falla es la **distancia**: el hero tiene un solo CTA («Ver los espacios») que manda
cinco pantallas abajo, y el bloque de contacto real (mapa, horario, formulario) está en la
pantalla 30. En móvil no hay barra fija de acción: el botón flotante de WhatsApp es lo único
persistente, y compite visualmente con la gota de scroll y el menú.

### 2.2 Arquitectura de información

Orden actual: inicio → usos → nosotros → planes → naturaleza → vivero → sendero → ubicación →
compromiso. Dos problemas:

- **#compromiso cierra la página DESPUÉS del contacto.** Es contenido de marca (tres pilares),
  no de acción: debilita el cierre. Va mejor fusionado con #nosotros, antes de la naturaleza.
- **#planes y #usos cuentan lo mismo desde dos ejes** (qué espacio / qué plan). Juntas suman
  14 pantallas y 20+13 fotos. En una home corta sólo cabe UNA de las dos como escaparate y la
  otra como página.

El menú tiene 7 entradas (Nosotros, Espacios, Planes, Colegios, Naturaleza, Cómo llegar, Plan
vecino). Mezcla anclas y páginas sin distinción; falta «Vivero» y «Sendero», que son productos
propios con demanda de búsqueda.

### 2.3 Sistema visual

**Fortalezas reales:** `tokens.css` es una sola fuente de verdad y se cumple (0 colores
literales en el HTML según el validador); la silueta de «hoja» (dos radios en diagonal) es una
firma reconocible; el fondo crema-greige con trama botánica fija (`body::before`) está bien
razonado (medido contra 61.488 píxeles de las fotos); el logo real ya está en cabecera; los
acentos coral/terracota para la acción funcionan.

**Debilidades:**

1. **Los roles de color siguen pensados para bandas oscuras.** `--verde-bosque` está
   documentado como «DOMINANTE: fondos oscuros» y existen `--color-fondo-oscuro`,
   `--color-fondo-hondo`, `--color-fondo-carbon`, `--color-sala`, `--negro-escena` y dos velos
   oscuros. Tras la directriz del cliente ya casi nadie los consume, pero siguen declarados y
   cualquier agente futuro los usará. Hay que **rebasar los roles**: el bosque pasa a ser color
   de TEXTO, filete e icono; nunca fondo.
2. **Tres paletas conviven en la historia del archivo** (v1 oliva, v2 bosque, v4 greige). El
   `theme-color` y `en/` todavía son v1.
3. **Las superficies sólidas nuevas** (`--color-superficie-solida: #fdfaf1`) son un buen
   patrón, pero se introdujeron en un solo día sobre 9 secciones: falta unificar su radio,
   sombra y relleno en UN componente (`.placa`) en `base.css`.
4. **Los eyebrows/rótulos en caja alta** con tracking amplio son un recurso repetido en todas
   las secciones: bien como sistema, pero hoy son el único ritmo. La home necesita un segundo
   registro (cifras grandes en Josefin 300, ya usado en «101 especies») dosificado.

### 2.4 Tipografía

- `--fuente-display`: Josefin Sans 300 (la más cercana al lettering del logo — decisión
  correcta y documentada). Riesgo: una monolineal a peso 300 **por debajo de ~32 px** se
  desvanece sobre trama. Regla propuesta: 300 sólo a partir de `--fs-h2`; 400 para h3/h4 y
  cifras pequeñas.
- `--fuente-cuerpo`: DM Sans. Correcta.
- El cambio de fuente destapó un bug estructural en los titulares de dos renglones con
  `--persiana` (colchón `-0.18em` sin compensar): se arregló en #inicio, pero **hay que
  auditar todos los `.reveal-texto--persiana`** (#planes, #espacios, #naturaleza).
- h1 móvil 38 px / cuerpo 16 px / mínimo 12,56 px. Propuesta: mínimo 14 px en interfaz;
  12,5 px sólo en créditos de foto y legal.

### 2.5 Fotografía y medios

- 167 imágenes en la home; 108 en #naturaleza (57 del concurso + aves + jardín). Es el activo
  más diferenciador del sitio y está mal distribuido: la home debería enseñar 12 aves y
  mandar a una galería propia.
- La curaduría es desigual: conviven fotos de teléfono, fotos del concurso (excelentes), 3–4
  imágenes antiguas de menor resolución y una foto de referencia (chachalaca) que no es del
  predio (correctamente rotulada, pero conviene reemplazarla por una real o quitarla).
- Vídeos: 6 clips verticales, mudos (verificado: sin pista de audio; no existe ninguna
  «recomposición» en el repo), 9:16, 2–8 s. Funcionan como textura; no como contenido.
- Pipeline: `derivar-imagenes.py` + `marcar-responsivas.py` generan 400/600/800/1200 en JPG.
  Falta AVIF/WebP (sólo el hero lo tiene) y un tope de 1600 px para retina.

### 2.6 Movimiento

Inventario de motores hoy: `.reveal` (IO), `.reveal-texto`/`--persiana`, `animation-timeline:
view()` (paralaje y deriva), `escena-planes.js` (scroll-listener → variables CSS → clip-path),
`foto-focus.js` (scroll → transform inline), `concurso-cinta.js`, `fauna-ambiente.js`,
`enjambre-hero.js` + `particulas-hero.js` (canvas/partículas), `respiracion-bienestar.js`,
`momentos-video.js`/`naturaleza-video.js` (vídeo perezoso), bombillos que se encienden por
`--entrada`, diorama del carril 02 (pompas, mariposas, destello).

Es **demasiado**. Cada motor nuevo se justificó bien en su comentario, pero la suma produce
57 animaciones vivas y el lag reportado. El único bug de rendimiento abierto —el `clip-path`
a pantalla completa del carril 01— no se pudo cerrar porque choca con un paralaje
`view()` sobre el mismo `<img>`: dos motores en la misma pieza, exactamente lo que la regla
de la casa prohíbe.

### 2.7 Contenido y copy

La voz editorial es buena y distintiva («Se anda poco, se para mucho», «Dime a quién traes y
te digo dónde»). El problema es la cantidad: ~1.500 palabras en la home y párrafos de 40–60
palabras donde el cliente pidió «más fotos, menos texto». El sistema «un hecho, un dueño»
(50 hechos vigilados por `validar.js`) es un activo y se conserva íntegro.

Decisiones de contenido que el brief y el sitio ya no coinciden y hay que cerrar con el cliente
(apartado 7): precio del sendero (retirado), Ecoposada (en el brief, prohibida en el
validador), «Próximamente: arenero», distancias a los 8 sitios cercanos (retiradas por falta
de dato), fotos generadas con IA que quedaron en páginas interiores.

---

## 3. Principios del rediseño v4

Todos salen de pedidos textuales del cliente en esta y las sesiones anteriores.

1. **Claro y con trama.** Ningún fondo de sección oscuro. El papel botánico de `body::before`
   se ve en toda la página; las bandas alternan crema / salvia-trama / luz.
2. **La foto es la foto.** Sin velos, degradados, viñetas ni grading. Texto sobre foto → placa
   sólida. Se codifica en el validador para que no vuelva.
3. **El logo manda.** Logotipo real en cabecera y pie; Josefin Sans para display; DM Sans
   para leer.
4. **Menos texto, más fotos.** Un bloque = un titular, una frase, una foto, un botón.
5. **Premium es aire y consistencia**, no efectos. Un motor por pieza; tres motores en total.
6. **Móvil primero.** Se diseña a 375 px y se expande; barra de acción fija en móvil.
7. **Honestidad.** Ningún dato, testimonio, cifra o foto que no sea real y verificable. Lo que
   no se sabe, no se publica.
8. **Todo medible.** Cada fase cierra con Lighthouse móvil, validador `TODO LIMPIO` y prueba en
   dispositivo real.

---

## 4. Propuesta de rediseño

### 4.1 Arquitectura nueva: escaparate + profundidad

```
/                     Home (escaparate, 12–14 pantallas)
/espacios/            Los 5 espacios con capacidad, condiciones, galería, CTA por espacio
/planes/              Bodas y conciertos · Cumpleaños y reuniones · Empresas · Bienestar · Talleres
/naturaleza/          Aves (101), concurso completo (57 fotos + créditos), flora, milano/chachalaca
/sendero-ecovital/    Hero de vídeo, recorrido, cómo se reserva
/vivero/              Servicios, sello ICA, catálogo fotográfico, WhatsApp
/colegios/            (existe) Se conserva y se alinea al sistema v4
/plan-vecino/         (existe) Se conserva y se alinea al sistema v4
/contacto/            Mapa, Maps/Waze, horario, formulario, distancias
/en/                  Se congela (noindex + sin hreflang) hasta tener paridad, o se rehace
```

Ventajas: cada URL responde a una intención de búsqueda concreta («alquiler de espacios para
eventos Floridablanca», «vivero Floridablanca», «avistamiento de aves Bucaramanga»); la home
baja de 30.000 a ~11.000 px; las 108 fotos de naturaleza dejan de cargar en la portada; el
`<main>` se ensambla igual que hoy (`ensamblar.js` ya soporta varias páginas).

### 4.2 La home, pantalla por pantalla

| # | Bloque | Contenido | Alto móvil aprox. |
|---|---|---|---|
| 1 | **Hero** | Foto original del ave a sangre (sin velo), logotipo, titular en 2 líneas, subtítulo de una frase, **CTA primario «Cotizar por WhatsApp»** + secundario «Ver espacios» | 1 pantalla |
| 2 | **Qué puedes hacer aquí** | 5 tarjetas (foto original + placa + verbo): Celebrar · Reunir · Aprender · Cuidarse · Caminar → /planes | 1,5 |
| 3 | **Los espacios** | 5 tarjetas horizontales con foto, nombre, capacidad y «Ver usos» → /espacios; 1 frase de condiciones + enlace | 2 |
| 4 | **Naturaleza en 3 cifras** | 101 especies · 57 fotos de 20 autores · 4 ha; muro de 12 aves (no 108); «Ver todas» → /naturaleza | 1,5 |
| 5 | **Sendero Ecovital** | Hero de vídeo (4 planos, ya resuelto) + 1 foto + «Atrévete al sendero» | 1,5 |
| 6 | **Vivero** | 4 fotos propias + 4 servicios en una línea + sello ICA + WhatsApp | 1,2 |
| 7 | **Nosotros + Compromiso** (fusionados) | Foto «Nuestro compromiso», 3 pilares en placa, 1 párrafo | 1,2 |
| 8 | **Cómo llegar y hablar** | Mapa, Maps/Waze, horario, WhatsApp, formulario corto (3 campos) | 1,5 |
| 9 | **Pie claro** | Logo, enlaces, legal, Instagram | 0,6 |

Total ≈ 12–13 pantallas móvil. Copy máximo por bloque: 45 palabras.

### 4.3 Sistema visual v4 (cambios a `tokens.css` y `base.css`)

- **Rebase de roles:** `--color-fondo` (crema greige) · `--color-banda-trama` (salvia 0,55,
  ya existe) · `--color-banda-luz` (nuevo: `--luz`) · `--color-superficie-solida` para placas.
  `--color-fondo-oscuro/-hondo/-carbon/-sala` y `--color-velo` quedan **sólo** para lightbox y
  modales, renombrados `--color-lightbox` y `--color-velo-modal` para que nadie los reutilice
  en secciones.
- **Verde bosque = texto, iconos, filetes.** Coral = acción. Amarillo/menta/baya = detalles del
  logo, nunca fondo.
- **Componente `.placa`** único (radio hoja, sombra `--sombra-md`, relleno `--esp-md`,
  fondo `--color-superficie-solida`) que sustituye a las 9 variantes creadas ad hoc.
- **`theme-color`** → `#ede6e2` (crema) en claro; `#1e3d2f` sólo si algún día hay modo oscuro.
- **Trama:** una sola capa fija (`body::before`) ya resuelta para iOS; las bandas la dejan ver
  por transparencia. Se documenta como patrón y no se duplica en cada sección.
- **Regla en `validar.js` (nueva, sección h):** falla si detecta `linear-gradient`,
  `radial-gradient`, `backdrop-filter` o `mix-blend-mode` en un selector que contenga
  `velo`, `scrim`, `overlay` o que sea hermano directo de `<img>`/`<video>` dentro de una
  `figure`/tarjeta. Excepciones explícitas: `.lightbox`, `.velo-menu`, modales.

### 4.4 Tipografía v4

- Display: Josefin Sans **300 ≥ 40 px**, **400 < 40 px**. Cifras: 300 en tabular.
- Cuerpo: DM Sans 400/500; párrafos 16–18 px; interfaz mínimo 14 px; legal 12,5 px.
- Auditoría única de todos los titulares con `--persiana` para el colchón de descendentes.
- Titulares de sección: 2 líneas máximo; subtítulos de 1 frase.

### 4.5 Fotografía v4

1. **Curaduría:** de 167 a ~60 imágenes en la home + páginas. Criterios: original, del predio,
   luz natural, ≥ 1600 px, sin personas irreconocibles cortadas, sin IA.
2. **Formatos fijos:** 3:2 apaisada (espacios, planes), 4:5 retrato (vivero, sendero), 1:1
   (aves en muro). Cada imagen se recorta a su formato UNA vez en el pipeline.
3. **Pipeline:** `derivar-imagenes.py` genera **AVIF + WebP + JPG** a 400/800/1200/1600;
   `<picture>` sólo donde no rompa selectores `> img` (documentado en la herramienta).
4. **Sesión fotográfica pendiente** (lista de tomas, apartado 7): personas reales usando cada
   espacio; taller y yoga en curso; la trabajadora del vivero (ya hay una, excelente); camino
   del sendero con guía; aéreo actualizado con dron a la hora dorada; el «50» de la carpa de
   noche ya existe y es la única toma nocturna que se conserva.
5. La chachalaca de referencia se sustituye por una foto real del predio o se retira.

### 4.6 Movimiento v4: tres motores

| Motor | Uso | Coste |
|---|---|---|
| `.reveal` por IntersectionObserver | Entrada de bloques y titulares (máx. 30 en la home) | 0 en reposo |
| `animation-timeline: view()` | Paralaje suave de fotos grandes, deriva del carril de vídeo | Compositor |
| Vídeo perezoso (`[data-momento-video]`) | Los 6 clips | Sólo en pantalla |

Sale: `escena-planes.js` (el pin de 200 svh del carril 01 se sustituye por una portada
estática con paralaje `view()`), `foto-focus.js`, `concurso-cinta.js`, `fauna-ambiente.js`,
`particulas-hero.js`/`enjambre-hero.js` (las mariposas del hero pueden quedarse como 6 SVG
con `view()` si el cliente las quiere), bombillos y diorama (se conservan como ilustración
estática o con una sola animación CSS pausable). Presupuesto: ≤ 20 animaciones vivas, 0
listeners de scroll en JS.

### 4.7 Rendimiento v4

- **`herramientas/construir.js`**: ensambla → quita comentarios HTML/CSS/JS → minifica →
  escribe a `dist/`. Netlify publica `dist/`. El código fuente queda tal cual, comentado.
- **`netlify.toml` + `_headers`**: `Cache-Control: immutable` para `?v=` hash; `no-cache` para
  HTML.
- **Objetivos (Lighthouse móvil, 4G simulado):** LCP < 2,5 s · CLS < 0,1 · INP < 200 ms ·
  Performance ≥ 90. Hoy no hay medición base; se toma en la Fase 0.
- Corregir la carga duplicada de `foto-focus.js`; precargar sólo hero + 2 fuentes.
- `sizes` correcto para toda foto `object-fit: cover` a pantalla completa (ya corregido en
  el carril 01; auditar el resto).

### 4.8 Accesibilidad v4

- Todos los objetivos táctiles ≥ 44×44 (16 hoy no cumplen: píldoras de idioma, créditos,
  enlaces de pie).
- Formulario: envío a WhatsApp con JS y **respaldo `mailto:` sin JS**; `aria-live` en el
  estado; etiquetas visibles.
- Contraste ya recalculado sobre placas (≥ 13:1). Se mantiene la tabla de pares en
  `tokens.css`.
- `prefers-reduced-motion`: ya se respeta; con tres motores es trivial de garantizar.

### 4.9 SEO v4

- Título y meta por página; `og:image` por página (hoy todas comparten `aereo-predio.jpg`).
- JSON-LD: `TouristAttraction` (existe) + `LocalBusiness` con `priceRange`, `EventVenue` por
  espacio (capacidad), `FAQPage` con las condiciones de alquiler.
- `en/`: o se rehace con paridad o se pone `noindex` y se retira el `hreflang` hasta entonces
  (hoy perjudica).
- `sitemap.xml` regenerado por el build.

### 4.10 Conversión v4

- Un CTA primario por pantalla; el mensaje de WhatsApp prellenado por intención (se conserva).
- **Barra fija inferior en móvil:** «WhatsApp» + «Cómo llegar». Sustituye al botón flotante.
- Prueba social **sólo con datos reales**: número de eventos del último año, colegios que han
  venido, reseñas de Google embebidas por API oficial. Si no hay dato verificable, no se pone.
- Instagram: 6 publicaciones reales o nada.

---

## 5. Lo que se conserva tal cual

- Sistema de tokens y la regla «ningún literal».
- «Un hecho, un dueño» y la tabla HECHOS del validador.
- Ensamblador de fragmentos (`ensamblar.js/.py`) y versionado de assets.
- Silueta de hoja (dos radios en diagonal), acento coral, trama botánica de fondo.
- Logotipo real en cabecera, Josefin Sans + DM Sans.
- Hero de vídeo del sendero, botones Maps/Waze reales, muro del concurso (como página).
- Mensajes de WhatsApp por intención.

---

## 6. Plan de ejecución por fases

Cada fase se ejecuta **sólo con orden explícita** («ejecuta la fase N»). Ninguna arranca sola.
Estimaciones en sesiones de trabajo de agente (≈ 1–3 h cada una), no en días calendario.

| Fase | Qué | Entregable verificable | Estimación | Depende de |
|---|---|---|---|---|
| **0 · Estabilizar** | Publicar los 48 archivos pendientes (incluye `josefin-sans-latin.woff2` sin trackear); quitar `foto-focus.js` duplicado; corregir `theme-color`; tomar Lighthouse base móvil/escritorio; decidir `Pic/` | Commit + deploy + informe base | 1 sesión | — |
| **1 · Build y peso** | `construir.js`, `netlify.toml`, `_headers`, AVIF/WebP en el pipeline | HTML < 120 KB, CSS < 90 KB, JS < 60 KB, Lighthouse ≥ 80 | 1–2 sesiones | 0 |
| **2 · Sistema v4** | Rebase de roles de color, `.placa` único, tipografía (pesos por tamaño), regla «sin velo» en el validador, auditoría `--persiana` | `TODO LIMPIO` + regla nueva verde | 1–2 sesiones | 1 |
| **3 · Arquitectura** | Páginas `/espacios`, `/planes`, `/naturaleza`, `/sendero-ecovital`, `/vivero`, `/contacto`; home corta según 4.2; menú nuevo; barra móvil | Home ≤ 14 pantallas; sitemap; JSON-LD por página | 3–4 sesiones | 2 |
| **4 · Fotografía** | Curaduría a ~60; recortes fijos; reemplazo de la chachalaca; sesión nueva (cliente) | Banco curado + lista de tomas cubierta | 2 sesiones + sesión de fotos del cliente | 3 (paralelizable) |
| **5 · Movimiento** | Reducción a tres motores; portada del carril 01 sin clip-path; presupuesto ≤ 20 animaciones | Sin scroll-listeners; prueba en celular real sin lag | 2 sesiones | 3 |
| **6 · SEO e inglés** | Metas por página, schemas, decisión sobre `/en/` | Search Console sin errores de hreflang | 1 sesión | 3 |
| **7 · QA final** | Dispositivos reales (iOS Safari, Android Chrome), Lighthouse ≥ 90, validador, Clarity 2 semanas | Informe de cierre | 1 sesión | todas |

Orden recomendado: 0 → 1 → 2 → 3 → (4 ∥ 5) → 6 → 7. Total: 12–15 sesiones de agente más
la sesión fotográfica del cliente.

---

## 7. Decisiones que necesita el cliente antes de ejecutar

1. **Precio del Sendero ($15.000):** retirado por orden directa. ¿Se queda fuera para siempre o
   vuelve en la página `/sendero-ecovital/`?
2. **Ecoposada:** está en el brief (cabaña para 8, 4 habitaciones, desayuno) y prohibida en el
   validador. ¿Existe y se ofrece? Si sí, es una página nueva con reservas por WhatsApp.
3. **«Próximamente: arenero»:** ¿se publica?
4. **Distancias a los 8 sitios cercanos** (Natura, Alkosto/Makro/PriceSmart, Mediterráneo,
   Cañaveral, La Florida, Caracolí): el brief da los nombres pero no los kilómetros. Con dato
   real vuelven a `/contacto/`.
5. **Sitio en inglés:** ¿rehacer con paridad (≈ 2 sesiones más) o congelar con `noindex`?
6. **Mariposas, bombillos y diorama:** ¿se conservan como ilustración estática, con una sola
   animación pausable, o se retiran?
7. **Prueba social:** ¿hay reseñas de Google, cifra de eventos del año, colegios atendidos?
   Sólo se publica lo verificable.
8. **Sesión fotográfica:** fecha y lista de tomas (4.5). Es la palanca de calidad más grande
   que no depende del código.
9. **Carpeta `Pic/`:** ¿se sube al repo como material fuente o se deja fuera?
10. **Audio en los vídeos:** no existe ninguna pista ni recomposición en el repo. ¿Se buscan
    los archivos originales con audio o se asume mudo?

---

## 8. Riesgos

- **Rehacer en vez de podar.** El mayor riesgo es volver a inflar: cada agente añade su motor
  y su comentario. Mitigación: presupuestos numéricos en el validador (animaciones, KB, pantallas)
  que fallan si se superan.
- **Ejecutar la Fase 3 sin la 1.** Partir la home en páginas sin build multiplica el peso por
  siete. El orden importa.
- **Pérdida de posicionamiento durante la migración a páginas.** Mitigación: redirecciones
  301 de cada ancla (`/#usos` → `/espacios/`), sitemap nuevo y Search Console el mismo día.
- **Fotos nuevas que no llegan.** Sin la sesión del cliente, la Fase 4 se limita a curar lo que
  hay; el sitio mejora igual, pero menos.
- **Agentes concurrentes sobre los mismos archivos.** Ya ocurrió esta sesión. Regla: una fase,
  un agente, un archivo de plan por fase.

---

## 9. Métricas de éxito

| Métrica | Hoy (2026-09-01) | Objetivo v4 |
|---|---|---|
| Alto de la home (móvil) | 37 pantallas | ≤ 14 |
| HTML / CSS / JS transferidos | 377 / 788 / 140 KB | 120 / 90 / 60 KB |
| Transferencia inicial escritorio | 2,9 MB | ≤ 1,2 MB |
| Animaciones vivas simultáneas | 57 | ≤ 20 |
| Scroll-listeners en JS | 5 | 0 |
| Lighthouse móvil Performance | sin medir | ≥ 90 |
| LCP / CLS / INP móvil | sin medir | < 2,5 s / < 0,1 / < 200 ms |
| Objetivos táctiles < 44 px | 16 | 0 |
| Fotos con velo o degradado | 0 (recién) | 0, garantizado por validador |
| URLs indexables por intención | 1 (+ colegios, plan vecino) | 8 |
| Clics a WhatsApp / 100 visitas (Clarity) | sin base | +50 % sobre la base de la Fase 0 |

---

## Anexo A · Estado del repositorio al escribir esto

- Último commit publicado: `51992a5` (2026-08-27) «Ubicacion: quita la foto 'lo que hay al
  final del camino'».
- Sin publicar: 39 archivos modificados + 9 sin trackear (fuente Josefin, foto de compromiso y
  derivados, vídeo/póster `flores-del-sendero`, carpeta `Pic/`). Incluye: tipografía v12, logo
  real en cabecera, «sin tonos oscuros / sin velos» v13, sendero acortado v5, compromiso
  rediseñado, precio retirado, enlaces de vivero retirados, `sizes` del carril 01.
- Validador: `VEREDICTO GLOBAL: TODO LIMPIO` sobre el working tree.
- Bug abierto conocido: `clip-path` por cuadro en el carril 01 (`planes.css`, `.js
  .planes-fiesta__escena .planes-portada__foto`) en conflicto con `planes-paralaje-y`; se
  resuelve en la Fase 5.

## Anexo B · Archivos huérfanos detectados

`styles/sections/momentos.css` (66 KB), `espacios.css` (55 KB), `experiencias.css`,
`contacto.css`, `hero.css` (parcial), `sections/momentos.html`, `sections/espacios.html`,
`img/logo/vegas-del-verde.svg` (hoja dibujada a mano, ya no referenciada). No se enlazan desde
`index.html`; algunos los usa `en/index.html`. Se limpian en la Fase 3 junto con la decisión
sobre `/en/`.
