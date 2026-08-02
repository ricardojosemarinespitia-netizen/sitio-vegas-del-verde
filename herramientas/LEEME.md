# Herramientas de construcción

## La regla que más se ha roto en este proyecto

**`index.html` no se edita a mano.** Se ARMA concatenando los fragmentos de
`sections/` dentro de `<main id="contenido">`. Si editas sólo un fragmento, el
sitio no cambia. Si editas sólo `index.html`, el cambio se pierde en el próximo
ensamblado. Se edita el fragmento **y se vuelve a ensamblar**.

## Cómo se usa

```sh
python herramientas/ensamblar.py      # arma index.html desde sections/
python herramientas/validar.py        # las 5 comprobaciones del contrato
python herramientas/validar_sitio.py  # anclas y recursos de TODAS las páginas
python herramientas/validar_css.py    # ninguna clase depende de una hoja huérfana
python herramientas/mapa_fotos.py     # regenera MAPA-FOTOS.json desde lo publicado
```

`validar.py` sale con código 0 si está limpio y 1 si hay hallazgos, así que se
puede encadenar: `python herramientas/ensamblar.py && python herramientas/validar.py`.

## Qué hace cada uno

**`ensamblar.py`** — pega `<head>` + `sections/_header.html` + los ocho
fragmentos en orden + `sections/_footer.html` + los `<script>` finales. También
reescribe el bloque de `<link>` a `styles/sections/*.css` para que coincida
exactamente con las secciones que existen, y en el mismo orden que el `<main>`.
El orden vive en la constante `ORDEN`; cambiarlo ahí lo cambia todo.

**`validar.py`** — sobre `index.html` ya ensamblado:

| | comprobación |
|---|---|
| 0 | el orden del `<main>` es el pactado |
| a | ningún hecho de la tabla de propiedad aparece fuera de su dueño |
| b | toda `href="#x"` tiene su `id="x"`, y ningún `id` está duplicado |
| c | todo `src`/`href` interno existe en disco |
| d | las etiquetas cuadran, ignorando comentarios, `<script>` y `<style>` |
| e | cero «ecoposada», cero «data-modal» |
| f | un archivo, un papel: lista las fotos usadas en dos secciones |
| g | higiene: sin `!important`, sin `font-family` ni colores literales en el HTML |

La comprobación (a) es la delicada. Antes de buscar, el script **retira los
atributos que no lee nadie** (`class`, `id`, `href`, `src`, `data-*`…), porque
si no, una clase como `.inicio__ancla-item--sendero` se contaría como si la
sección hubiera escrito «Sendero» en pantalla. Lo que **sí** se mira es todo lo
que se lee o se oye: el texto, `alt`, `title`, `aria-label` y `placeholder` —
meter un aforo en un `title` es publicarlo por la puerta de atrás.

Los hechos marcados `enlaceOk` (el Sendero, los observatorios, las mariposas)
pueden **nombrarse dentro de un enlace** desde cualquier sección; lo que no
pueden es describirse. Para eso el script quita los `<a>` y los `<option>`
enteros antes de buscar.

## Excepciones legítimas, para que nadie las «arregle»

- **`video/hero.mp4`** está en la lista de excepciones de (c): iría con `hidden`
  y `preload="none"` a la espera del archivo. Hoy no se referencia.
- **Seis aves repetidas entre `#inicio` y `#naturaleza`**: hacen dos papeles
  distintos —atmósfera en la tira del inicio, pieza acreditada en el muro del
  concurso—, que es la única repetición que el contrato permite.
- **`img/mapa-ubicacion.jpg` dos veces dentro de `#ubicacion`**: una es el
  respaldo del mapa sin JS y la otra la figura de referencias; el CSS define
  hueco para las dos.
- **Siete `style=` en `#ubicacion`**: son `--ubi-pct` en las barras de
  distancia. Es un dato por fila, no un valor de diseño; sin él, las barras
  quedan a cero.
