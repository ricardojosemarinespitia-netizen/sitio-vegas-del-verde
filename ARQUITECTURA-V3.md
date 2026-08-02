# ARQUITECTURA v3 — «Un hecho, un dueño»

Decidida por el director de arte. Manda sobre la estructura de `index.html`,
sobre `sections/*.html` y sobre `condiciones-de-alquiler.html`.

- Los **hechos** siguen saliendo de `BRIEF.md` y no cambian nunca.
- El **tono, el color y la tipografía** siguen saliendo de `CONTRATO-V2.md`.
- Lo que fija este documento es **qué sección dice qué, y cuál se calla**.

Si dentro de seis meses alguien retoma esto: antes de mover un hecho de sección,
lee §2 y §9. La tabla de propiedad es el contrato. Romperla es volver al problema.

---

## 0. EL PROBLEMA QUE ESTO RESUELVE

Palabras del dueño del sitio:

> «Se repiten varias cosas o espacios. Necesito que quede supremamente ordenada,
> que solo hable del tema del título y que ese tema no se repita más abajo.
> Ubicación: todo lo de ubicación y cómo llegar junto.»

Lo medido en la página real antes de tocar nada:

| Síntoma | Medida |
|---|---|
| Dos pares de secciones con el **mismo `<h2>` literal** | `#espacios`=`#experiencias` · `#nosotros`=`#ubicacion` |
| «Cuatro hectáreas» | 13 apariciones |
| «101 especies de aves» | 11 |
| «Sendero Ecovital» | 8 |
| Horario 6:00–10:00 | 7 |
| Lo de ubicación | partido en **3** secciones |
| `#colegios` | 288 palabras que **re-describen** 7 cosas que ya tienen sección propia |
| Archivos de foto usados dos veces | 20 aves + 3 de `parque/` |

Diagnóstico: el sitio no tenía un problema de redacción, tenía un problema de
**propiedad**. Nadie era dueño de nada, así que cada sección volvía a contarlo todo
por si acaso el visitante no había leído la anterior.

---

## 1. LA DECISIÓN

Se evaluaron tres arquitecturas: el **embudo de alquiler**, los **dos caminos de
público** y el **recorrido del predio**. No gana ninguna entera. La final es:

**Esqueleto: el embudo** (qué es esto → dónde se hace → qué se celebra → por qué
aquí y no en otra finca → cómo se llega), porque es el único orden que respeta
`CONTRATO-V2 §0`: el sitio *vende la escapada*, y una escapada se vende en el orden
en que se decide comprarla.

Con tres injertos de las otras dos, cada uno puesto para tapar un agujero medido:

1. **El aéreo del hero deja de ser papel pintado y pasa a ser índice** (del
   *recorrido del predio*). Sobre `img/aereo-predio.jpg` van cuatro anclas —Espacios,
   Sendero, Vivero, Cómo llegar—. Resuelve de golpe el «supremamente ordenada»: el
   visitante ve el sitio entero en la primera pantalla, y ninguna sección de más
   abajo necesita re-listar lo que hay, porque ya se vio en el plano.
2. **`#planes` se ordena por público, no por espacio** (de los *dos caminos*). La
   novia, el jefe de recursos humanos y la profesora de yoga no buscan «Alameda»:
   buscan su ocasión. Esto salva las páginas de aterrizaje por intención que el
   *recorrido del predio* destruía.
3. **El hero abre una puerta lateral a la naturaleza** (de los *dos caminos*, en
   versión ligera). El riesgo real del embudo era enterrar la biodiversidad en el
   sexto puesto y perder al pajarero extranjero —que es justo el público por el que
   el BRIEF pide versión en inglés—. Con el ancla del plano, ese visitante llega al
   Sendero en un clic, sin pasar por las bodas.

Y con dos riesgos ajenos **evitados a propósito**:

- Del *recorrido del predio* se rechaza la idea de disolver las actividades dentro
  de los cinco escenarios: dejaba el sitio sin ninguna página por intención.
- De los *dos caminos* se rechaza la bifurcación dura: partía el sitio en dos y
  mataba la venta cruzada. El pajarero tiene atajo, pero el que viene a alquilar
  **sigue pasando por las 101 especies**, que es el argumento que distingue a Vegas
  del Verde de cualquier finca de eventos del Anillo Vial. También se rechaza la
  sección `#compromiso` suelta: sin foto, sin público y sin CTA, era la primera que
  el dueño iba a querer borrar. El compromiso vive dentro de `#nosotros`, que sí
  tiene trabajo.

**De 13 secciones a 8.**

---

## 2. LA REGLA

> **Cada hecho del BRIEF tiene exactamente una sección dueña.
> Las demás lo enlazan. Ninguna lo describe dos veces.**

Corolarios que hay que poder verificar con un `grep`:

- Ningún `<h2>` se repite, y **ninguna promesa se repite** aunque cambien las palabras.
- Ninguna cifra aparece dos veces en la página. Ni siquiera dentro de la misma
  sección: si la entradilla dice «101», las fichas no lo repiten (hoy `#aves` decía
  «57» tres veces en tres párrafos seguidos).
- Ningún rótulo de botón se repite. El destino (`wa.me/573166758362`) y el número no
  cambian nunca; lo que cambia es el texto visible y el mensaje contextual.
- **Ningún archivo de imagen aparece dos veces con el mismo tratamiento.** Ver §5.

---

## 3. EL ORDEN FINAL

```
inicio      Escápate de la ciudad sin salir de ella
  ── separador a sangre ──
nosotros    Lo que hay detrás de la portería
espacios    Cinco escenarios y ningún salón
  ── separador a sangre ──
planes      Dime a quién traes y te digo dónde
colegios    Un día de colegio que no cabe en un aula
  ── separador a sangre ──
naturaleza  Camina donde cantan 101 especies
vivero      Te llevas a casa lo que crece aquí
  ── separador a sangre ──
ubicacion   Dónde queda, cuándo abrimos y con quién hablas
```

### Por qué en ese orden

- **`nosotros` va segundo y no último** porque responde a la primera objeción real
  de quien va a traer a treinta niños o a cien invitados: *¿esto es seguro?* Predio
  privado, portería, vigilancia. Es una sección de venta, no de relleno.
- **`espacios` antes que `planes`** porque el inventario es corto y concreto y el
  catálogo de ocasiones es largo: primero el mapa mental, después las historias.
- **`colegios` pegado a `planes`** porque es el mismo acto de compra (alquilar el
  predio para un grupo), pero con otro comprador —un rector, no una novia— y otra
  logística. Va después y no dentro porque `CONTRATO-V2 §5.1` obliga a conservar
  `id="colegios"`, y porque un colegio decide con criterios pedagógicos que no le
  interesan a nadie más.
- **`naturaleza` en el sexto puesto, pero con atajo desde el hero.** Sexto es su
  sitio en el embudo del que alquila (es el argumento de cierre: *y además, esto*),
  y el pajarero no tiene que llegar hasta ahí caminando.
- **`ubicacion` al final y sin poesía.** Es lo único que se lee cuando ya se decidió.

---

## 4. QUÉ DESAPARECE Y POR QUÉ

| Sección que muere | A dónde va | Por qué |
|---|---|---|
| **`#experiencias`** | a `#planes` | Compartía `<h2>` **literal** con `#espacios`. Su entradilla repetía las cuatro hectáreas, el Anillo Vial y «a un mundo de distancia»; su nota repetía las condiciones de alquiler; sus tres botones eran los mismos de `#espacios`. No era una sección: era `#espacios` otra vez con fotos de boda. |
| **`#bienestar`** | a `#planes` (carril bienestar) | Siete prácticas del BRIEF que son *ocasiones de uso*, no un tema aparte. Repetía además el compromiso entero de `#nosotros` y otra vez la tira de servicios y el horario. |
| **`#cultura`** | a `#planes` (carril talleres) | Su entradilla era la tríada del compromiso de `#nosotros` palabra por palabra. Su lista solapaba con `#nosotros`, con `#bienestar` y con `#experiencias`. Sus cuatro fotos de aves de fondo reaparecían en el muro del concurso. Lo único suyo era el collage; el collage pasa a separador. |
| **`#aves`** | a `#naturaleza` | Estaba a un scroll de `#naturaleza` contando lo mismo. Su entradilla adelantaba «una endémica y siete migratorias» y las dos fichas de debajo desarrollaban exactamente esos dos datos. |
| **`#biodiversidad`** | a `#naturaleza` | Su entradilla enumeraba cinco cifras y las cuatro tarjetas de debajo repetían esas cinco cifras. Y sus tres fotos eran las tres tarjetas-cifra de `#nosotros`. |
| **`#contacto`** | a `#ubicacion` | Petición explícita del dueño. Además tenía una tarjeta «Cómo llegar» que enlazaba a `#ubicacion`, mientras `#ubicacion` tenía una tarjeta «Horario y contacto» que enlazaba a `#contacto`: dos secciones remitiéndose la una a la otra. |
| **Rejilla de cifras de `#nosotros`** | a `#naturaleza` | 101 / 347 / 20 / 4 ha eran un tráiler de `#biodiversidad`, con las mismas tres fotos (`parque-61`, `parque-09`, `parque-13`). |
| **Los 10 chips de aves de `#naturaleza`** | al muro del concurso | Diez fotos con crédito que reaparecían con crédito en el muro, un scroll más abajo. El propio bloque terminaba con un enlace «ver las 57», reconociendo la duplicación. |
| **Seis de las siete tarjetas de `#colegios`** | a sus dueños | Teatrino y Taller → `#espacios`. Sendero y sus $15.000 → `#naturaleza`. Vivero e ICA → `#vivero`. `#colegios` se queda sólo con lo que **no existe en ningún otro sitio del BRIEF**: los dos observatorios y el jardín de polinizadores. |
| **La mitad del pie** | a sus dueños | Reproducía el bloque de canales, el horario, la tira de servicios, el registro ICA y el menú de la cabecera bajo el rótulo «Explorar». Un pie no es una segunda portada. |

---

## 5. LAS FOTOS

`CONTRATO-V2 §5.4` ordena repartir las 57 fotos del concurso por todo el sitio.
**Se mantiene.** Las tres arquitecturas propuestas querían concentrarlas en el muro;
se rechaza, porque el latido visual del sitio son las aves apareciendo por sorpresa.

Lo que se corrige no es *dónde* están, es que **el mismo archivo hacía el mismo papel
dos veces**. Regla nueva:

> Un archivo puede aparecer en dos sitios sólo si hace **dos papeles distintos**:
> atmósfera (tira del hero, fondo a sangre) frente a archivo (miniatura con crédito
> en el muro). **Nunca dos fichas con crédito visible del mismo pájaro.**

Consecuencias:

- El muro del concurso publica **las 57**, porque es un archivo y un archivo
  incompleto no es un archivo. Es el único sitio con fichas de ave acreditadas.
- La tira del hero (6 archivos) y los 4 separadores a sangre son atmósfera: legales.
- Los **10 chips de `#naturaleza` se borran**: eran fichas con crédito, mismo papel
  que el muro, a un scroll de distancia. Ésta es la duplicación que molestaba.
- Las fotos de `parque/` y `eventos/` **no tienen excepción**: un archivo, una
  sección. `parque-61`, `parque-09` y `parque-13` se quedan en `#naturaleza` y
  desaparecen de `#nosotros`.

Sigue vigente `CONTRATO-V2 §5.5`: si el texto nombra algo que existe, al lado va la
foto de ese algo, abierta antes con `Read`. Y `§5.4`: toda ave lleva el crédito de
`img/aves/_creditos.json`, nunca inventado.

### Reparto verificado (existen todos en disco)

| Sección | Archivos |
|---|---|
| `inicio` | `aereo-predio.jpg` + tira `ave-46, 38, 27, 07, 56, 31` |
| separadores | `ave-25`, `ave-42`, `ave-39`, `ave-21` |
| `nosotros` | `parque-05.jpg` (verificada: arbolado y prado a ras de suelo) + la foto del mural de aves |
| `espacios` | `alameda-1`, `alameda-2`, `taller-1`, `parque-47` (La Vega), `parque-56` (Teatrino), `parque-57` (Cancha) |
| `planes` | `boda-1..4`, `infantil-1..4`, `cumpleanos-1`, `yoga-1..2`, `parque-30` (verificada: sesión al aire libre con adultos mayores), `parque-02`, `parque-21/22/23` |
| `colegios` | `infantil-3` **no** (ya está en planes) → `parque-20`, `parque-32`, `parque-34` |
| `naturaleza` | `sendero-1`, `parque-60`, `parque-45` (guaduas), `parque-61`, `parque-17`, `parque-13`, `parque-09`, `parque-18` + el muro de 57 |
| `vivero` | `parque-35`, `parque-40`, `parque-42`, `parque-49` |
| `ubicacion` | `mapa-ubicacion.jpg` |

`MAPA-FOTOS.json` hay que actualizarlo a este reparto: hoy asigna `infantil-3` a
colegios y a experiencias, y los `chips_especies` ya no existen.

---

## 6. LOS SEPARADORES A SANGRE

Cuatro franjas de foto de ave a todo el ancho, entre secciones. **No poseen ningún
hecho**: son el único sitio donde vive la frase poética, precisamente para que
ninguna sección tenga que competir con otra por la misma promesa.

| Después de | Foto | Texto |
|---|---|---|
| `inicio` | `ave-25-eufonia-piquigruesa.jpg` | «Tu próximo plan no es en un salón.» |
| `espacios` | `ave-42-machetornis-rixosa.jpg` | «Planes distintos, más atrevidos, más naturales.» |
| `colegios` | `ave-39-colibri.jpg` | «Aquí el ruido más fuerte es un pájaro.» |
| `vivero` | `ave-21-vegas.jpg` | «Vuelve. No es el mismo bosque en marzo que en octubre.» |

Se retira «A 10 minutos del Anillo Vial, a un mundo de distancia» como titular: era
el `<h2>` duplicado de `#nosotros` y `#ubicacion`. La proximidad se promete **una
sola vez**, en la entradilla del hero.

---

## 7. LO QUE HAY QUE ARREGLAR DE PASO

Defectos reales, verificados en el repo:

1. **`condiciones-de-alquiler.html` línea 40** lista «el **Prado Japonés**» como uno
   de los cinco espacios. No existe ni en el BRIEF ni en `index.html`. El quinto
   espacio es **el Taller**.
2. **`sections/contacto.html` líneas 182 y 185**: dos `<option>` distintos con
   `value="colegios"` («Colegios y grupos educativos» y «Programa para colegios»).
   Queda una. El `<select>` pasa a tener un valor por destino real:
   `espacios · planes · colegios · sendero · vivero · otro`.
3. **`index.html` tiene `id` duplicados**: `contacto` ×3, `espacios` ×2,
   `ubicacion` ×2. HTML inválido y anclas impredecibles.
4. **`condiciones-de-alquiler.html`** pierde lo que no es suyo: los chips de usos
   (dueño: `#planes`), «Próximamente: arenero» (dueño: `#nosotros`) y el horario
   (dueño: `#ubicacion`, se sustituye por un enlace).
5. **Anclas que mueren**: `#experiencias`, `#bienestar`, `#cultura`, `#aves`,
   `#biodiversidad`. Hay que purgarlas de `sitemap.xml`, de `sections/_header.html`,
   de `sections/_footer.html`, de `en/` y de todo enlace interno. Ninguna queda
   muerta. Sobreviven `#inicio`, `#nosotros`, `#espacios`, `#colegios`,
   `#naturaleza`, `#vivero`, `#ubicacion` y `#contacto` (este último como ancla del
   bloque de canales **dentro** de `#ubicacion`, para no romper enlaces externos).
6. **Navegación**: de siete anclas a seis — Nosotros · Espacios · Planes · Colegios ·
   Naturaleza · Cómo llegar. El pie deja de reproducirla.

---

## 8. REORGANIZACIÓN DE ARCHIVOS

| Antes | Después |
|---|---|
| `sections/hero.html` | igual |
| `sections/nosotros.html` | igual, adelgazado |
| `sections/espacios.html` | igual |
| `sections/experiencias.html` (4 secciones dentro) | → `sections/planes.html` (sólo planes) |
| ” | → `sections/colegios.html` (nuevo, extraído) |
| `sections/naturaleza.html` (4 secciones dentro) | → `sections/naturaleza.html` (sendero + aves + biodiversidad) |
| ” | → `sections/vivero.html` (nuevo, extraído) |
| `sections/ubicacion.html` + `sections/contacto.html` | → `sections/ubicacion.html` (funde ambos) |

En `styles/sections/`: `experiencias.css` → `planes.css`; nace `vivero.css`;
`contacto.css` se funde en `ubicacion.css`. Sin valores literales, sin `!important`.

**Recordatorio para quien retome esto:** `index.html` se **ensambla** desde
`sections/*.html`. Editar sólo el fragmento no cambia el sitio publicado.

---

## 9. LA TABLA DE PROPIEDAD

Es el contrato antirrepetición. **Un hecho, un dueño.** Si un hecho no aparece aquí,
el sitio lo pierde. Si aparece dos veces, volvemos al problema de la primera página.

| Hecho | Dueño |
|---|---|
| Tagline «Oasis para la recreación y el bienestar» | `inicio` |
| «Cuatro hectáreas de bosque» (tamaño del predio) | `inicio` |
| «A 10 minutos del Anillo Vial» como promesa de cercanía | `inicio` |
| «Nosotros ponemos los árboles; el plan lo pones tú» | `inicio` |
| Vista aérea del predio como plano-índice | `inicio` |
| Menú de navegación y cambio de idioma ES/EN | cabecera |
| Refugio privado, cerrado, «tranquilidad y seguridad en medio del bullicio urbano» | `nosotros` |
| Compromiso: «creemos en el poder de la conexión y el aprendizaje conjunto» | `nosotros` |
| Los tres pilares (educación ambiental · relaciones sanas · respeto) | `nosotros` |
| Bienestar físico, mental y emocional como propósito | `nosotros` |
| Servicios del predio: Wifi · Baños · Vigilancia privada · Parqueadero | `nosotros` |
| «Se alquila a colegios, empresas y particulares» | `nosotros` |
| «Próximamente: arenero» | `nosotros` |
| Mural pintado con aves del predio (motivo fotográfico) | `nosotros` |
| Alameda · hasta 150 personas | `espacios` |
| La Vega · hasta 100 personas | `espacios` |
| Teatrino · hasta 70 personas | `espacios` |
| Taller · hasta 45 personas, único bajo techo | `espacios` |
| Cancha · 30 jugadores y 20 espectadores | `espacios` |
| Alquiler base de 4 horas + 1 adicional | `condiciones-de-alquiler.html` |
| Sillas y mesas Rimax incluidas | `condiciones-de-alquiler.html` |
| No incluye sonido: lo lleva el cliente | `condiciones-de-alquiler.html` |
| Comida y catering externo sólo para eventos | `condiciones-de-alquiler.html` |
| Bodas, conciertos, cumpleaños, reuniones familiares, sociales y corporativas | `planes` |
| Bienestar: caminatas terapéuticas, entrenamiento funcional, acondicionamiento, pilates, yoga, mindfulness, taller de emociones | `planes` |
| Talleres educativos, de jardinería y de pintura al aire libre | `planes` |
| Carpa iluminada y galerías de eventos reales | `planes` |
| Observatorio de aves (parada pedagógica) | `colegios` |
| Observatorio de plantas (parada pedagógica) | `colegios` |
| Jardín de polinizadores · mariposas | `colegios` |
| Formato de la jornada escolar: llegada, grupos, docentes, cierre | `colegios` |
| Sendero Ecovital: guaduas, Búcaro y Caracolí; sigue la Aranzoque hasta La Florida | `naturaleza` |
| Entrada $15.000 COP por persona (único precio del sitio) | `naturaleza` |
| Quebrada Aranzoque y riachuelo La Florida | `naturaleza` |
| 101 especies de aves registradas | `naturaleza` |
| Chachalaca Colombiana (*Ortalis columbiana*), endémica | `naturaleza` |
| 7 especies migratorias boreales | `naturaleza` |
| 347 especies de plantas · 20 familias botánicas | `naturaleza` |
| 18 anfibios · 23 reptiles · 3 mamíferos | `naturaleza` |
| Cedro y Guayacán Amarillo (CITES III) | `naturaleza` |
| Concurso: 57 fotografías · 20 autores · todas tomadas dentro del predio | `naturaleza` |
| Créditos por fotógrafo (`img/aves/_creditos.json`) | `naturaleza` |
| Vivero: producción y venta de plantas | `vivero` |
| Venta de abonos | `vivero` |
| Mantenimiento de jardines y poda de árboles y raíces | `vivero` |
| Venta de productos y alquiler de complementos para decoración de eventos | `vivero` |
| Espacio de aprendizaje que apoya los talleres de conexión con la naturaleza | `vivero` |
| Registro ICA, Resolución n.º 00000819 del 03/02/2025 | `vivero` |
| Dirección: Vereda Río Frío, 500 m sobre la vía Carabineros, Floridablanca | `ubicacion` |
| Coordenadas 7.0574425, -73.1144128 | `ubicacion` |
| Mapa Leaflet: vuelo, pin de 36 px, repetir vuelo, `prefers-reduced-motion` | `ubicacion` |
| Botones «Llegar con Google Maps» y «Llegar con Waze» | `ubicacion` |
| Cercanías: Anillo Vial Floridablanca–Girón, Conjunto Natura, Alkosto/Makro/PriceSmart, Mediterráneo Fútbol Park, Mediterráneo Royal, C.C. Cañaveral / La Florida / Caracolí | `ubicacion` |
| Distancias: Bucaramanga 10,2 km … Barichara 120,6 km | `ubicacion` |
| «En el corazón del Área Metropolitana de Bucaramanga» | `ubicacion` |
| Horario: lunes a domingo, 6:00 a. m. – 10:00 p. m. | `ubicacion` |
| WhatsApp +57 316 675 8362 escrito en pantalla | `ubicacion` |
| Correo vegasdelverde.1@gmail.com | `ubicacion` |
| Instagram @vegasdelverde | `ubicacion` |
| «No hay reservas en línea: se confirma por WhatsApp» | `ubicacion` |
| Formulario de contacto y qué mandar para cotizar | `ubicacion` |
| Razón social 4 Family S.A.S. · NIT 901.391.144-7 | pie |
| Política de datos y términos | pie |
| Las cuatro frases poéticas de marca | separadores |

### Rótulos de botón — uno por sección, sin repetir

| Rótulo | Dueño |
|---|---|
| «Reserva tu escape» | `inicio` |
| «Ver los cinco espacios» (interno) | `nosotros` |
| «Quiero este plan» | `espacios` |
| «Atrévete a un plan distinto» | `planes` |
| «Vengo con mi curso» | `colegios` |
| «Atrévete al sendero» | `naturaleza` |
| «Quiero plantas del vivero» | `vivero` |
| «Hablemos por WhatsApp» | `ubicacion` |
| «Escríbenos por WhatsApp» | cabecera |

---

## 10. EL CASO `#colegios`, EXPLICADO APARTE

Es la sección que más fácilmente vuelve a romperse, así que queda por escrito.

`#colegios` **no puede** volver a describir el Teatrino, el Taller, el Sendero ni el
Vivero. Los nombra como **enlace** y sigue. Su contenido propio es:

- Los **dos observatorios y el jardín de polinizadores**: son los tres únicos puntos
  que en el BRIEF existen *sólo* dentro de la oferta escolar. No se alquilan, no
  aparecen en ninguna otra sección, y por tanto son suyos.
- El **formato de la jornada**: cómo se organiza un grupo, qué pasa de la llegada al
  regreso del bus.

Y tiene **prohibido escribir un solo número** que no sea una hora del itinerario.
Nada de aforos, nada de $15.000, nada de 101 ni 347, nada de resoluciones del ICA.

**Deconflicto de vocabulario:** `#naturaleza` no usa nunca la palabra «observatorio»
—habla del sendero y del muro del concurso—, y `#colegios` no usa nunca «sendero»
salvo como enlace. Sin esta regla, las dos secciones vuelven a sonar iguales aunque
los hechos estén bien repartidos.

---

## 11. CÓMO SE VERIFICA QUE NO SE DEGRADÓ

Antes de publicar, sobre el `index.html` ya ensamblado:

- [ ] `4 hectáreas`, `101`, `347`, `20 familias`, `57`, `15.000`, `00000819` y
      `7.0574425` aparecen **una vez cada uno** en el texto visible.
- [ ] Ningún `<h2>` repetido; ninguna promesa repetida con otras palabras.
- [ ] Ningún `src` de imagen repetido, salvo los 10 archivos de ave con doble papel
      declarados en §5.
- [ ] Ningún `id` duplicado. Ningún `href="#..."` que apunte a un ancla que ya no existe.
- [ ] Dirección, horario y teléfono: una sola aparición visible, toda dentro de
      `#ubicacion`.
- [ ] `#colegios` no contiene ningún dígito que no sea una hora.
- [ ] Sigue vigente todo el checklist de `CONTRATO-V2 §7`.

Y las reglas duras que no se tocan: la Ecoposada no existe · las condiciones viven
en su **página propia**, nunca en un modal · el único precio publicado son los
$15.000 del Sendero · no hay reserva en línea, todo va a WhatsApp 573166758362 con
mensaje contextual · toda foto existe en disco y se verificó con `Read` · toda ave
lleva su crédito.
