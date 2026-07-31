# CONTRATO DE SECCIÓN — obligatorio

La fundación ya existe: `styles/tokens.css`, `styles/base.css`, `styles/shell.css`,
`sections/_header.html`, `sections/_footer.html`.
**No los modifiques.** Si necesitas algo que no existe, resuélvelo dentro de TU css de sección.

## Lo que escribes tú

Exactamente dos archivos (más `js/` solo si tu sección lo pide explícitamente):

```
sections/<nombre>.html          fragmento, sin <html>/<head>/<body>
styles/sections/<nombre>.css    todo tu CSS, con prefijo propio
```

## Estructura obligatoria del fragmento

```html
<section id="<ancla>" class="seccion" aria-labelledby="<ancla>-titulo">
  <div class="contenedor">
    <header class="seccion-encabezado reveal">
      <p class="eyebrow">Antetítulo</p>
      <h2 id="<ancla>-titulo" class="titulo-seccion">TÍTULO EN MAYÚSCULAS</h2>
      <p class="entradilla">Frase de entrada.</p>
    </header>
    ...
  </div>
</section>
```

### ANCLAS ASIGNADAS (el header ya enlaza a estas — respétalas exactamente)

| Sección | id obligatorio |
|---|---|
| hero | `inicio` |
| sobre / compromiso | `nosotros` |
| espacios | `espacios` |
| eventos + bienestar | `experiencias` |
| naturaleza / aves / vivero | `naturaleza` |
| ecoposada + colegios | `ecoposada` |
| ubicación / mapa | `ubicacion` |
| contacto | `contacto` |

Si tu bloque tiene varias sub-secciones, la PRIMERA lleva el id de la tabla; las demás
pueden llevar ids propios (`#vivero`, `#aves`, `#colegios`…) pero nunca duplicar los de arriba.

## NUNCA declares valores literales

Prohibido escribir colores hex, rgb, tamaños de fuente en px/rem sueltos, radios, sombras
o duraciones. **Todo sale de los tokens.** Si escribes `#fff` o `24px` para un tamaño de
fuente, está mal.

### Tokens semánticos (usa estos, no los de marca)
`--color-fondo` `--color-fondo-alt` `--color-fondo-oscuro` `--color-superficie`
`--color-superficie-solida` `--color-superficie-oscura` `--color-texto` `--color-texto-suave`
`--color-texto-inverso` `--color-texto-inverso-suave` `--color-acento` `--color-acento-texto`
`--color-acento-alt` `--color-destacado` `--color-alerta` `--color-borde` `--color-borde-suave`
`--color-borde-inverso` `--color-velo`

Marca cruda (solo cuando el rol semántico no aplique): `--verde-oliva` `--verde-menta` `--teal`
`--salvia` `--gris-verde` `--crema` `--amarillo` `--rojo-baya` `--tinta` `--verde-texto` `--blanco`
Transparencias: `rgb(var(--tinta-rgb) / 0.5)` — existen `*-rgb` de todos.

### Tipografía
Fuentes: `--fuente-display` (Poiret One) `--fuente-titulo` (Josefin Sans) `--fuente-cuerpo` (Jost)
Tamaños: `--fs-hero` `--fs-h1` `--fs-h2` `--fs-h3` `--fs-h4` `--fs-cuerpo` `--fs-grande`
`--fs-pequeno` `--fs-micro` `--fs-eyebrow` `--fs-cifra`
Escala cruda si hace falta: `--paso--2` … `--paso-6`
Pesos: `--peso-ligero` (300) `--peso-normal` `--peso-medio`
Interlineado: `--alto-linea-apretado` `--alto-linea-titulo` `--alto-linea-base` `--alto-linea-suelto`
Tracking: `--track-display` `--track-titulo` `--track-caps` `--track-eyebrow` `--track-boton`
Medida: `--medida` (68ch) `--medida-corta` (46ch)

### Espaciado y layout
`--esp-3xs … --esp-4xl` · `--esp-seccion` `--esp-seccion-sm` `--esp-seccion-lg`
`--gap` `--gap-sm` `--gap-lg`
`--ancho-xs/sm/md/lg/xl` `--ancho-contenedor` `--padding-contenedor`
`--alto-header` `--alto-hero`

### Radios, sombras, movimiento
`--radio-xs/sm/md/lg/xl/full`
`--sombra-xs/sm/md/lg/xl` `--sombra-header` `--anillo-foco` `--blur-vidrio`
`--dur-instant/rapida/media/lenta/reveal/vuelo` · `--ease` `--ease-salida` `--ease-suave`
`--transicion` `--transicion-rapida` `--transicion-reveal`
`--desplazamiento-reveal` `--escala-hover`
Capas: `--z-fondo/base/elevado/pegajoso/header/menu/modal/saltar`

## Clases de utilidad YA disponibles (no las redefinas)

**Layout:** `.contenedor` `.contenedor--estrecho` `.contenedor--medio` `.contenedor--ancho`
`.seccion` `.seccion--alt` `.seccion--oscura` `.seccion--compacta` `.seccion--amplia`
`.grid` `.grid-2` `.grid-3` `.grid-4` `.grid-auto` `.grid-auto--estrecha` `.grid-auto--ancha`
`.fila` `.apilar` `.centrado` `.sin-margen` `.medida-corta`

**Texto:** `.eyebrow` `.titulo-seccion` `.titulo-seccion--sm` `.titulo-seccion--xs`
`.titulo-display` `.entradilla` `.cifra` `.nota` `.credito` `.regla` `.lista-hojas`
`.pildora` `.pildora--destacada` `.sobre-oscuro` `.solo-lectores`

**Botones:** `.btn` + modificadores `.btn-primario` `.btn-secundario` `.btn-fantasma`
`.btn-claro` `.btn-whatsapp` `.btn-grande` `.btn-pequeno` `.btn-bloque` · grupo: `.grupo-botones`
`.enlace-flecha`

**Media:** `.marco` + `.marco--1-1` `.marco--4-3` `.marco--3-2` `.marco--16-9` `.marco--retrato`
`.marco--zoom` · `.tarjeta` `.tarjeta__cuerpo`

**Animación:** `.reveal` (aparición al entrar en viewport) y `.reveal-secuencia`
(escalona los hijos). El JS global las activa — tú solo pones la clase.
`.js` está en `<html>` cuando hay JavaScript.

## Imágenes

- Todas con `loading="lazy"` y `decoding="async"` **salvo el hero** (`fetchpriority="high"`).
- Siempre `width` y `height` reales para evitar CLS.
- `alt` descriptivo real en español (qué se ve), nunca "imagen" ni vacío en fotos de contenido.
- Rutas relativas desde la raíz: `img/parque/parque-07.jpg`.
- **Antes de elegir una foto de `img/parque/`, ábrela con Read** para no poner una imagen
  que no corresponda a lo que dice el texto.

## WhatsApp

Formato exacto, con mensaje contextual distinto por sección:
```
https://wa.me/573166758362?text=Hola%2C%20quiero%20...
```

## Prohibido

Lorem Ipsum · `href="#"` muertos · precios (salvo los $15.000 del Sendero) · inventar datos
que no estén en BRIEF.md · frameworks o librerías CSS · `!important` (salvo utilidad de a11y)
· modificar archivos de otro agente.
