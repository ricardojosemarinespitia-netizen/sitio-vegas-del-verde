# CONTRATO DE SECCIÓN v2 — «Vende la escapada»

Sustituye a `CONTRATO.md`. Todo lo que no se contradiga aquí sigue vigente.
Los **hechos** siguen saliendo de `BRIEF.md` y **no cambian nunca**: capacidades,
precios, servicios, especies, coordenadas. Lo que cambia es el **tono** y el **sistema**.

La fundación la escribe el director de arte: `styles/tokens.css` y `styles/base.css`.
**No los modifiques.** Si te falta un token, se pide; no se inventa.

---

## 0. EL CAMBIO DE FONDO

El sitio deja de ser un folleto informativo y pasa a **vender la escapada**.
Vegas del Verde arrienda sus espacios para que la gente **viva experiencias en la naturaleza**.

> «Escápate de la ciudad sin salir de ella.»
> «A 10 minutos del Anillo Vial, a un mundo de distancia.»

Consecuencia práctica: **cada espacio se vende por la experiencia que permite, no por su
capacidad**. La capacidad es un dato de apoyo, nunca el titular.

---

## 1. QUÉ CAMBIÓ RESPECTO A v1

| | v1 | v2 |
|---|---|---|
| **Dominante** | verde oliva `#566438` | **verde bosque `#1E3D2F`** |
| **Oliva** | color de marca principal | secundario, aclarado a `#5E6E3C` |
| **Fondo** | crema fría `#F2EFE9` | crema cálida `#F7F2E7` |
| **Tinta** | azulada `#1A2B33` | **verde `#16281F`** |
| **CTA** | verde menta | **coral cálido `#E0703C`** |
| **Display** | Poiret One | **Fraunces** |
| **Fuente de etiqueta** | Josefin Sans | **Jost** (una familia menos que cargar) |
| **Títulos de sección** | MAYÚSCULAS ESPACIADAS | caja alta y baja |
| **Ecoposada** | sección propia | **eliminada** |
| **Condiciones de alquiler** | bloque de 4 columnas | **botón → modal** |
| **Pin del mapa** | símbolo del logo gigante | pin de 36 px |
| **Fotos de aves** | sólo en su galería | **repartidas por todo el sitio** |

### Por qué

- **El oliva no sostenía la promesa.** Es un verde apagado, de folleto institucional.
  El bosque profundo `#1E3D2F` es más elegante y más aventurero: es el color de meterse
  entre los árboles, no el de leer un PDF sobre ellos.
- **Los CTA eran del mismo color que el paisaje.** En verde menta sobre un sitio verde,
  el botón no pedía nada. El coral es el único color cálido del sistema: llama a atreverse
  precisamente porque **no** hay nada más de ese color alrededor.
- **Todo iba en mayúsculas espaciadas.** Cuando todo grita, nada destaca —y el caps
  espaciado destruye la silueta de la palabra, que es de lo que vive la lectura rápida.
- **Poiret One es filiforme.** Sostenía mal el peso de un titular y a cuerpo grande se
  deshacía. Fraunces tiene carácter editorial y aguanta el tamaño.

---

## 2. TIPOGRAFÍA

### El `<link>` exacto que el integrador debe poner en el `<head>`

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..700&family=Jost:wght@300;400;500&display=swap">
```

**Borra del `<head>` el `<link>` de Poiret One y Josefin Sans: ya no se usan.**
Cuando pongas el `<link>`, **borra también el `@import` del principio de `base.css`**
(está ahí sólo como red de seguridad; un `@import` bloquea el render y duplica la petición).

Variante opcional, si se quieren los ejes `SOFT` y `WONK` de Fraunces —`base.css` ya los
pide vía `--ejes-display` y se ignoran solos si no están en el archivo—:

```
https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT,WONK@9..144,300..700,0..100,0..1&family=Jost:wght@300;400;500&display=swap
```

### Por qué Fraunces y no Marcellus

El lettering del logo es un déco geométrico de trazo fino. Marcellus es una capital romana
inscripcional: sólo luce en mayúsculas —justo el tratamiento que v2 retira— y viene en un
único peso. Fraunces es variable (300–700), tiene eje óptico y pertenece a la misma familia
de serifas comerciales cálidas de principios del s. XX que rodea al déco. Y hace mejor pareja
con Jost, que es una Futura: **geométrica de los años 20, la misma época que el logotipo.**
Marcellus queda como primer respaldo en la pila por si Fraunces no carga.

### Los tres roles

| Token | Fuente | Para qué |
|---|---|---|
| `--fuente-display` | Fraunces | titulares, `.titulo-seccion`, `.titulo-display`, `.cifra` |
| `--fuente-titulo` | **Jost** | **REDEFINIDA:** ya no es un segundo display. Es la fuente de ETIQUETA: `.eyebrow`, `.btn`, `.pildora`, `h5`/`h6`, `.cifra-etiqueta` |
| `--fuente-cuerpo` | Jost | texto corrido |

`base.css` ya pone Fraunces en `h1`–`h4`, `.titulo-seccion`, `.titulo-display` y `.cifra`.
**No declares `font-family` en tus titulares: hereda.** Si escribes
`font-family: var(--fuente-titulo)` en un `h2`, lo dejas en sans y rompes el sistema.

### Pesos

Los titulares van en `--peso-display` (500), no en `--peso-ligero`.
**No pongas `--peso-ligero` (300) en un titular Fraunces**: se queda sin carácter, que es
justo lo que veníamos a arreglar. El 300 es para `.entradilla` y texto suelto en Jost.

---

## 3. LA REGLA DE LAS MAYÚSCULAS

> **Los títulos de sección van en caja alta y baja. Punto.**

El caps espaciado sobrevive **sólo** en:

- `.eyebrow` — el antetítulo. Es el único caps «de nivel sección».
- Micro-etiquetas: `.btn`, `.pildora`, `.cifra-etiqueta`, `h5`, `h6`.
- El logotipo del hero, porque **es** el logotipo. Usa `.titulo-logotipo`
  (va en Jost, nunca en la serifa: en Fraunces no se parece al logo).

Prohibido: `text-transform: uppercase` sobre cualquier cosa de 24 px o más que no sea
el logotipo. Prohibido `--track-caps` fuera de esa lista.

Escribe los títulos **ya redactados en caja alta y baja en el HTML**, no en mayúsculas
confiando en el CSS: si el CSS falla, el texto queda gritando.

---

## 4. COLOR

### Tokens nuevos

```
--verde-bosque        #1E3D2F   DOMINANTE. Fondos oscuros, marca.
--verde-bosque-hondo  #14291F   Pie de sitio, degradados, veladuras.
--coral               #E0703C   EL ACENTO DE ACCIÓN. Mezcla real del amarillo
                                (#E4CB3A) y el rojo baya (#E84C40) del logo.
--coral-hondo         #A8452A   El coral en versión legible como TEXTO.
--coral-claro         #F0A072   El coral en versión legible SOBRE bosque.

--color-accion            = --coral         relleno del CTA
--color-accion-texto      = --tinta         etiqueta del CTA
--color-accion-borde      = --coral-hondo   contorno del CTA (obligatorio, ver abajo)
--color-accion-hover      = --verde-bosque  el CTA invierte a verde al pasar el ratón
--color-acento-inverso    = --coral-claro   acento cálido sobre fondo oscuro
--color-fondo-hondo       = --verde-bosque-hondo
--color-borde-fuerte      = --verde-oliva   contornos de componente (3:1)
--color-velo-modal        veladura del modal de condiciones

--peso-display  500     --peso-fuerte  600
--ejes-display          ejes variables de Fraunces (SOFT/WONK)
--ancho-modal   44rem
--tam-pin       2.25rem --tam-pin-punta --sombra-pin --borde-pin
--sombra-accion --sombra-modal --blur-modal
```

### Tokens con valor modificado (mismo nombre)

```
--verde-oliva   #566438 → #5E6E3C    ahora es SECUNDARIO
--crema         #F2EFE9 → #F7F2E7    más cálida
--salvia        #DBE7D3 → #DDE5CD    más cálida
--gris-verde    #BAC4B4 → #C2C7B3    más cálida
--tinta         #1A2B33 → #16281F    tinta VERDE, ya no azulada
--verde-texto   #2E6B2E → #2F5F41
--color-acento-texto   oliva → --coral-hondo   (enlaces, eyebrows, cifras)
--color-acento-alt     teal  → --verde-oliva   (el teal no llegaba a 4.5:1)
--color-fondo-oscuro   tinta → --verde-bosque
--alto-linea-apretado  1.06 → 1.02
--alto-linea-titulo    1.16 → 1.14
--track-display  -0.015em → -0.02em
--track-titulo     0.02em → -0.005em
--track-caps        0.16em → 0.14em
--track-eyebrow      0.3em → 0.26em
--paso-4/-5/-6   bajan de tope (Fraunces pesa mucho más que Poiret One a igual cuerpo)
```

**Intactos porque son el logo:** `--verde-menta #50C58E` (hojas), `--teal #4B7F7D`
(lettering), `--amarillo #E4CB3A` (círculos), `--rojo-baya #E84C40` (bayas).

### Reparto: dónde va el cálido y dónde el verde

El cálido funciona **por escasez**. Si lo pones en todas partes deja de llamar.

- **Coral** → sólo botones de acción (`.btn-primario`, `.btn-whatsapp`) y `.btn-destacado`
  en amarillo. **Un `.btn-destacado` por pantalla como mucho.**
- **Terracota `--coral-hondo`** → `.eyebrow`, enlaces de texto, `.cifra` sobre claro.
- **Verde** → todo lo demás: fondos, `.pildora`, viñetas de `.lista-hojas`, contornos,
  `.btn-secundario`.

### Contraste — verificado, no lo rompas

Todo par texto/fondo del sistema está medido y pasa **AA**. Los que van justos:

| Par | Ratio |
|---|---|
| tinta sobre coral (etiqueta del CTA) | **4.83** |
| terracota sobre salvia | **4.55** |
| oliva sobre crema | **4.99** |
| coral claro sobre bosque | 5.66 |
| terracota sobre crema | 5.30 |
| menta sobre bosque | 5.51 |
| amarillo sobre bosque | 7.32 |
| tinta sobre crema | 13.86 |

**El borde del `.btn-primario` no es decorativo.** El relleno coral sólo contrasta 2.87:1
contra la crema, y WCAG 1.4.11 exige 3:1 en el contorno del componente. El borde terracota
lo sube a 5.30:1. **No se lo quites al botón.**

**Nunca uses `--verde-bosque` como texto sobre coral** (3.72:1). La etiqueta del CTA va en
`--color-accion-texto` (tinta).

---

## 5. CAMBIOS ESTRUCTURALES

### 5.1 Ecoposada: eliminar por completo

Ya no se ofrece. Purgar de **todos** estos archivos:

```
index.html · en/index.html · sections/ecoposada.html · styles/sections/ecoposada.css
sections/_header.html · sections/_footer.html · sections/contacto.html
sections/experiencias.html · sitemap.xml · terminos.html · politica-de-datos.html
en/terms.html · en/privacy-policy.html
```

Quitar el `<link>` a `ecoposada.css` del `<head>` y la entrada del nav y del pie.
El ancla `#ecoposada` desaparece: revisa que **ningún** enlace quede muerto.

**La sub-sección «Colegios» SE CONSERVA** y se muda dentro de Experiencias, con su
`id="colegios"`. Su oferta es la del BRIEF y no cambia: Teatrino, Taller, Observatorio de
aves, Observatorio de plantas, Jardín de polinizadores, Sendero Ecovital, Vivero.

### 5.2 Condiciones de alquiler: botón + modal

Hoy es un bloque de 4 columnas que satura la sección de Espacios. Pasa a ser **un botón**:

```html
<button type="button" class="btn btn-secundario" data-modal="condiciones">
  Ver condiciones de alquiler
</button>
```

El contenido del modal es exactamente el del BRIEF, sin añadir nada: alquiler base de
4 horas con opción de 1 hora adicional · incluye sillas y mesas Rimax · **no** incluye
sonido (lo lleva el cliente) · comida/catering externo permitido sólo para eventos.

Requisitos del modal: `--ancho-modal`, `--color-velo-modal`, `--sombra-modal`, `--z-modal`.
Cierra con `Esc` y con clic en el velo, atrapa el foco mientras está abierto, devuelve el
foco al botón al cerrar, y lleva `role="dialog"` + `aria-modal="true"` + `aria-labelledby`.

### 5.3 Mapa: pin pequeño

El pin actual mete el símbolo del logo a tamaño gigante y tapa la vista satelital.
**La foto satelital manda.** Pin de `--tam-pin` (36 px; tope absoluto 2.5rem/40 px), con
`--sombra-pin` y punta que apunte a la coordenada real `7.0574425, -73.1144128`.
En `js/mapa.js`, `iconSize` baja de `[48, 48]` al nuevo tamaño y hay que recalcular
`iconAnchor` para que la punta —no el centro— caiga sobre el punto.
Todo lo demás del mapa (vuelo cinematográfico, botones de Google Maps y Waze, «repetir
vuelo», `prefers-reduced-motion`) sigue igual.

### 5.4 Las aves son protagonistas

Las 57 fotos del concurso (`img/aves/ave-01..57-*.jpg`) hoy viven sólo en su galería.
Deben regarse por todo el sitio. **Toda foto de ave lleva crédito al fotógrafo**, que sale
de `img/aves/_creditos.json` — nunca inventes un autor ni dejes una foto sin crédito.

### 5.5 Toda mención concreta lleva foto real

> **Si el texto nombra algo que existe, al lado va una foto de ese algo.**

Una especie, el vivero, las guaduas, el sendero, el invernadero, la quebrada Aranzoque:
va la fotografía del banco, **no un icono suelto**. Los iconos valen para conceptos
abstractos (horario, wifi, parqueadero), nunca para sustituir algo que se puede fotografiar.

Antes de elegir una foto de `img/parque/`, **ábrela con Read** y comprueba que es lo que
dice el texto. Nunca un hueco, nunca un placeholder gris. Para lo que no tiene foto propia
(La Vega, Teatrino, Cancha, Vivero, Observatorios, Jardín de polinizadores) usa fotos de
`img/parque/` que encajen temáticamente.

---

## 6. EL TONO DEL COPY

Invitación, provocación amable, escape de lo cotidiano. Segunda persona. Frases cortas.
**El tono cambia; los hechos no.** Nunca inventes capacidades, precios ni servicios.

| | ❌ v1 | ✅ v2 |
|---|---|---|
| **1. Hero** | «Vegas del Verde — Oasis para la recreación y el bienestar» | **«Escápate de la ciudad sin salir de ella»**<br>_Cuatro hectáreas de bosque a 10 minutos del Anillo Vial._<br>CTA: **Reserva tu escape** |
| **2. Alameda** | «Alameda · 150 personas» | **«Un concierto entre árboles»**<br>_Alameda · hasta 150 personas._<br>CTA: **Quiero este plan** |
| **3. Teatrino** | «Teatrino · 70 personas» | **«Que el escenario sea el bosque»**<br>_Teatrino · hasta 70 personas._<br>CTA: **Atrévete a un plan distinto** |
| **4. Sendero Ecovital** | «Sendero Ecovital · Entrada $15.000» | **«Camina donde cantan 101 especies»**<br>_Sendero Ecovital · $15.000 por persona._<br>CTA: **Atrévete al sendero** |
| **5. Cancha** | «Cancha · 30 jugadores + 20 espectadores» | **«Un partido con banda sonora de pájaros»**<br>_Cancha · 30 jugadores y 20 espectadores._<br>CTA: **Quiero este plan** |

Otros titulares aprobados: «Tu próximo plan no es en un salón» · «Planes distintos, más
atrevidos, más naturales» · «A 10 minutos del Anillo Vial, a un mundo de distancia» ·
«Tu clase de yoga, con techo de guaduas».

**Fórmula de cada espacio:** titular de experiencia (`.titulo-seccion`) → capacidad como
dato de apoyo (`.pildora` o `.nota`) → foto real → CTA con energía.

**Lo que no se hace:** superlativos vacíos («el mejor», «único», «inigualable»),
exclamaciones, urgencia falsa («¡últimos cupos!»), ni prometer nada que no esté en el BRIEF.

### CTAs

Siguen yendo todos a WhatsApp con mensaje contextual distinto por sección:

```
https://wa.me/573166758362?text=Hola%2C%20quiero%20...
```

El texto visible cambia de registro: «Reserva tu escape», «Quiero este plan»,
«Atrévete a un plan distinto», «Vengo con mi curso». El destino y el número no cambian.
No hay reservas en línea. **No se publican precios salvo los $15.000 del Sendero.**

---

## 7. CHECKLIST DE MIGRACIÓN

Al reescribir tu sección, arregla estos defectos ya detectados (medidos en la página real):

1. **`sections/hero.html` + `styles/sections/hero.css`** — `.hero__wordmark` usa
   `--fuente-display`: con Fraunces el logotipo sale en serifa y **no se parece al logo**.
   Cámbialo a la clase `.titulo-logotipo` (Jost en caps), que ya está en `base.css`.
2. **`styles/sections/naturaleza.css`** — `.nat-aves .nat-ficha--endemica .pildora`
   (especificidad 0,3,0) pisa la regla correcta de `base.css` y deja la píldora
   «Endémica de Colombia» en **4.14:1**. Bórrala y deja que herede
   `.seccion--oscura .pildora--destacada`.
3. **`styles/shell.css`** — `.marca__nombre` usa `--teal` a 17 px: **4.06:1**.
   Pásalo a `--verde-bosque` (10.66:1).
4. **`styles/shell.css`** — `.pie__creditos` usa crema al 55 %: **4.41:1**.
   Usa `--color-texto-inverso-suave` (7.2:1).
5. **`styles/sections/nosotros.css`** — `.nosotros__pilar-indice` usa `--verde-menta`
   sobre superficie clara: **2.07:1**. Usa `--color-acento-texto` o `--color-borde-fuerte`.
6. **`styles/sections/nosotros.css`** — `.nosotros__pilar-titulo` sigue en Jost a 23 px.
   Quita su `font-family` para que herede Fraunces.

### Antes de dar tu sección por terminada

- [ ] Ningún `font-family` declarado en un titular (que herede Fraunces).
- [ ] Ningún `--peso-ligero` en un titular.
- [ ] Ningún `text-transform: uppercase` fuera de la lista del §3.
- [ ] Ningún valor literal de color, tamaño, radio, sombra ni duración.
- [ ] Ninguna regla de sección pisa un color de `base.css` por especificidad.
- [ ] Cada mención concreta tiene su foto real, con `alt` descriptivo de verdad.
- [ ] Cada foto de ave tiene su crédito de `_creditos.json`.
- [ ] Todas las imágenes con `loading="lazy"`, `decoding="async"`, `width` y `height`
      reales (salvo el hero, que va con `fetchpriority="high"`).
- [ ] Ningún `href="#"` muerto, ninguna referencia a Ecoposada.
- [ ] Probado a 375, 768 y 1280 px.

---

## 8. LO QUE SIGUE IGUAL DE v1

Anclas (menos `#ecoposada`, que desaparece), estructura obligatoria del fragmento
(`.seccion` > `.contenedor` > `.seccion-encabezado` con `.eyebrow` + `.titulo-seccion` +
`.entradilla`), clases de utilidad, las reglas de imágenes, el formato de los enlaces de
WhatsApp, y las prohibiciones: sin Lorem Ipsum, sin enlaces muertos, sin precios salvo el
Sendero, sin inventar datos, sin frameworks, sin `!important`, sin tocar archivos de otro
agente.
