"""GENERADOR DE DERIVADOS RESPONSIVOS — img/*.jpg -> img/*-400.jpg, -800.jpg, -1200.jpg

POR QUÉ EXISTE
Las fotos del sitio están guardadas al tamaño con el que salieron del
retoque —entre 1125 y 1800 px de ancho— y se servían así a TODO el mundo.
Medido en el navegador a 375 px de ancho (la medida real, no a ojo), la foto
más grande de la página se dibuja a 428 px y las miniaturas del concurso de
aves a 163 px. Es decir: en un teléfono se descargaban entre 4 y 10 veces
más píxeles de los que se pintan. Con 136 fotos en una sola página larga eso
son decenas de megas de datos móviles tirados a la basura.

La solución NO es un <picture> con AVIF. Se estudió y se descartó: envolver
los <img> en <picture> rompería las tres docenas de selectores `> img` que
hay repartidos por styles/ (`.marco > img`, `.nat-obra__disparador > img`,
`.planes-familia__contexto > img`…) y el encargo era rendimiento, no
rediseño. `srcset` + `sizes` van EN el propio <img>, no cambian ni un nodo
del árbol, y por tanto no pueden romper ningún selector ni ninguna
animación. Es la palanca grande con riesgo cero de regresión visual.

QUÉ HACE
Por cada .jpg referenciado desde sections/*.html genera las variantes de
400, 800 y 1200 px de ancho que sean MENORES que el original (nunca se
agranda: un derivado más grande que la fuente sería peso sin detalle).
El original se conserva intacto y sigue siendo el `src` y el candidato más
grande del srcset, así que un navegador viejo sin soporte de srcset —o el
lightbox, que abre a pantalla completa— recibe exactamente lo de antes.

CALIDAD
q84 progresivo con submuestreo 4:2:0. Se probó re-comprimir los originales
sin reescalar y no daba nada (estas fotos de follaje ya venían casi óptimas;
varias ENGORDABAN al recomprimir). Todo el ahorro viene de la escala, que es
justo el ahorro que no cuesta nitidez: 400 px de ancho pintados en un hueco
de 163 px siguen sobrando.

    python herramientas/derivar-imagenes.py            (informe, no escribe)
    python herramientas/derivar-imagenes.py --escribir
"""
import os
import re
import sys
import glob

from PIL import Image, ImageOps

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ESCRIBIR = "--escribir" in sys.argv

# Los cuatro peldaños. 400 cubre las miniaturas de aves (163 px a DPR 2 = 326),
# 600 es el que rescata a las fotos del parque —rondan los 900 px de origen,
# así que sin él el salto de 400 al original se comía el ahorro entero—,
# 800 cubre la foto a sangre en teléfono (428 a DPR 2 = 856) y 1200 el
# escritorio.
ANCHOS = (400, 600, 800, 1200)

# Por debajo de este peso el derivado no compensa: la petición HTTP extra y
# el byte de srcset cuestan más que lo que se ahorra.
PESO_MINIMO = 80 * 1024

# ...PERO EL PESO NO ES EL ÚNICO COSTE, Y EN v19 RESULTÓ SER EL QUE NO DOLÍA.
# `PESO_MINIMO` se escribió pensando en BYTES —datos móviles ahorrados—, que
# era el encargo de v17. La queja de v19 es otra cosa: el navegador se traba
# mientras el dedo arrastra sobre las fotos. Eso no lo causa el peso del
# archivo sino la DECODIFICACIÓN y el mapa de bits que queda en memoria, y
# las dos escalan con los PÍXELES, no con los kB.
#
# Medido en el muro de aves, que es donde se vio: de las 58 fotos, 11 pesan
# entre 35 y 79 kB y por eso las saltaba el filtro de arriba. Están tan
# ligeras porque comprimen bien —follaje y fondos suaves—, no porque sean
# pequeñas: ave-21-vegas.jpg pesa 35 kB y mide 1300x1107, o sea 1,44 Mpx que
# se decodifican para pintarse en una caja de 163x139 CSS px. Son 15,9 veces
# los píxeles necesarios a DPR 2, y 5,7 MB de mapa de bits descomprimido por
# cada una. Un JPEG bien comprimido cuesta lo MISMO de decodificar que uno
# gordo del mismo tamaño en píxeles; el kB sólo dice cuánto tarda en bajar.
#
# Así que el peso deja de ser suficiente para saltarse una foto: se salta
# sólo la que es ligera Y ADEMÁS pequeña en píxeles. El umbral son 0,5 Mpx
# porque la caja más grande que pinta estas miniaturas es de 175x148 CSS px
# —0,10 Mpx a DPR 2—, así que por encima de 0,5 ya se está decodificando
# cinco veces de más y el peldaño de 400w siempre gana. Por debajo, la foto
# ya está en su medida y derivarla sería trabajo sin ahorro.
MPX_MINIMO = 0.5

# Un peldaño tiene que ahorrar al menos esto respecto al original para que
# valga la pena servirlo. Por debajo, la petición HTTP extra y el riesgo de
# perder nitidez pesan más que los pocos kB que se ganan.
AHORRO_MINIMO = 0.20

# Sufijo de derivado, para no volver a derivar un derivado en una segunda
# pasada. Tiene que casar con el que escribe marcar-responsivas.py.
RE_DERIVADO = re.compile(r"-(?:%s)\.jpg$" % "|".join(str(a) for a in ANCHOS))


# EL ALCANCE, Y POR QUÉ NO ES TODA LA PÁGINA.
# Petición expresa del cliente: la pasada de rendimiento se limita a las
# zonas que se rehicieron en esta tanda —la portada, #nosotros, los cinco
# carriles de #planes y la marquesina de #momentos—. El resto del sitio se
# queda EXACTAMENTE como está, con sus fotos originales y sin derivados, para
# no mezclar en un mismo commit trabajo revisado con trabajo no revisado.
# Cuando toque ampliar, se añaden aquí los fragmentos y se vuelve a correr:
# el script es idempotente y no rehace lo que ya existe.
#
# v18 · ENTRA usos.html. Tercer pedido del cliente sobre la MISMA fotografía
# —la del evento nocturno bajo la carpa—: «SOLUCIONAR EL LAGEO DE ESTA FOTO
# YA EN CELULAR», después de que los dos arreglos anteriores de esta tanda
# (el arco de `.usos-tarjeta` a `animation-timeline: view()`, §ARCO de
# styles/sections/usos.css, y la auditoría de compositor de js/app.js) ya
# estuvieran publicados y el cliente siguiera viendo el tirón.
#
# LO QUE SE MIDIÓ EN PRODUCCIÓN, en vegasdelverde.co con emulación de 375×812,
# antes de tocar nada. Ninguna de las 20 fotos de #usos llevaba `srcset`: la
# sección estaba fuera de ESTE alcance desde el principio, así que el trabajo
# de rendimiento nunca la alcanzó. img/eventos/noche-evento-1.jpg —la foto del
# pedido, la única que aparece TRES veces en el fragmento— se bajaba y se
# decodificaba a 1800×1350 (2,43 Mpx, 591 kB, 9,3 MB de mapa de bits en
# memoria) para pintarse en una caja de 338×225 CSS px. Son 8 veces los
# píxeles necesarios a DPR 2 y 32 veces a DPR 1. Cronometrada la decodificación
# en este equipo de escritorio: 47,2 ms — la más cara de toda la sección, por
# delante de boda-arbol.jpg (25,0 ms) y de alameda-2.jpg (27,0 ms). 47 ms es
# casi el triple del presupuesto de un cuadro (16,7 ms) EN ESCRITORIO; en un
# teléfono de gama media, con el factor 5-6× habitual, son 250 ms de hilo
# principal robados de golpe.
#
# Y AHÍ ES DONDE ENCAJA CON EL ARREGLO ANTERIOR. La cabecera de §ARCO ya había
# identificado al ladrón de cuadros y lo había dejado escrito con todas las
# letras: «cada cuadro que el hilo principal perdía —decodificando la foto de
# la tarjeta siguiente…— era un cuadro en el que la FOTO se movía y el BORDE
# DEL ARCO se quedaba quieto». Aquel arreglo blindó al ARCO contra esa pérdida
# de cuadros, pero no quitó la pérdida. Éste quita la pérdida.
# v19 · ENTRAN naturaleza.html, vivero.html Y sendero.html. Cuarto pedido del
# cliente sobre lo mismo: «SIGO SCROLEANDO Y SE BUGUEAN MÁS QUE TODO CUANDO
# PASO EL DEDO A DESLIZAR SOBRE LAS FOTOS». Esta vez la queja NO es de una
# sección concreta: es de deslizar el dedo encima de CUALQUIER fotografía.
#
# LO QUE SE MIDIÓ EN PRODUCCIÓN, en vegasdelverde.co con emulación táctil de
# 375x812 (maxTouchPoints 5), antes de tocar nada. Contando `srcset` presente
# y `naturalWidth*naturalHeight` de cada <img> del documento:
#
#     #naturaleza   108 <img>   108 SIN srcset    89,3 Mpx    peor ratio 16,0x
#     #vivero         8 <img>     8 SIN srcset                peor ratio  0,8x
#     #sendero        6 <img>     6 SIN srcset                peor ratio  3,5x
#     #planes        13 <img>     4 SIN srcset    (ya en alcance desde v17)
#     #usos          20 <img>     5 SIN srcset    (ya en alcance desde v18)
#
# 89,3 Mpx en UNA sección son ~357 MB de mapa de bits descomprimido. En un
# teléfono de 3-4 GB el caché de imágenes de Chrome no sostiene ni de lejos
# esa cifra: descarta y VUELVE A DECODIFICAR mientras el dedo arrastra, que
# es literalmente el síntoma reportado —la sección no tarda en aparecer, se
# TRABA mientras se desliza sobre ella—. El muro de aves de `.nat-cinta`
# pinta miniaturas de 175x148 CSS px con archivos de 1300 px de ancho: entre
# 8x y 16x los píxeles necesarios a DPR 2, repetido 108 veces.
#
# Y EL AGRAVANTE DE v19: LAS SEIS FOTOS NUEVAS SON ORIGINALES DE TELÉFONO,
# sin pasar por retoque, y son con diferencia lo más pesado del sitio:
#
#     img/sendero/sendero-hero.jpg        2400x4268   10,24 Mpx   2139 kB
#     img/naturaleza-jardin-hero.jpg      2268x4032    9,14 Mpx    710 kB
#     img/vivero/vivero-01..04.jpg        2000x3556    7,11 Mpx   1182-1878 kB
#
# Son 47,8 Mpx entre las seis (~191 MB de mapa de bits) para pintarse en
# cajas de entre 168 y 386 CSS px de ancho. El resto del sitio vive entre
# 1125 y 1800 px de ancho; éstas doblan eso y triplican el alto.
# v20 · ENTRA compromiso.html. La sección de cierre pasa a tener una
# fotografía A SANGRE de fondo (img/compromiso-fondo.jpg) en lugar del panel de
# aves que sangraba por la derecha. Es otro original de teléfono sin retocar,
# exactamente del mismo tipo que las seis de v19: 2268x4032 = 9,14 Mpx y
# 3,4 MB, para pintarse a 385 CSS px de ancho en teléfono. Sin escalera se
# bajarían y decodificarían esos 9,14 Mpx (~36 MB de mapa de bits) en la
# última sección de la página, que es justo donde el teléfono lleva ya toda la
# página en memoria. Con ella, un móvil de 385 px a DPR 2 se lleva el peldaño
# de 800w.
ALCANCE = ("hero.html", "nosotros.html", "planes.html", "momentos.html",
           "usos.html", "naturaleza.html", "vivero.html", "sendero.html",
           "compromiso.html")

# LAS DOS FOTOS DE LA PORTADA NO LLEVAN ESCALERA DE JPG.
# Son el LCP y ya se sirven por <picture> en AVIF y WebP, con una rama propia
# por ancho (la vertical en teléfono, la apaisada en escritorio). El AVIF de
# móvil pesa 60 kB: menos que cualquier JPG que se pudiera derivar de ellas.
# El .jpg que queda en el `src` es sólo el respaldo del navegador que no
# entienda ninguno de los dos formatos, y a ése hay que darle la foto entera.
#
# LAS CINCO FOTOS DE TARJETA DE #usos TAMPOCO, Y LA RAZÓN NO ES LA MISMA.
# `.usos-tarjeta__foto` ocupa una caja de 100dvh con `object-fit: cover`
# (styles/sections/usos.css). En una caja mucho más alta que ancha, el recorte
# de `cover` escala la foto POR EL ALTO, no por el ancho: alameda-2.jpg
# (1500×844) se dibuja a 812 px de alto, o sea a 1443 px de ancho, y de ahí se
# recortan los 375 visibles. El ancho del elemento —los 375 px que
# MEDIDAS-FOTOS.json anotó midiendo `getBoundingClientRect()`— es la mitad del
# dato que hace falta, y `marcar-responsivas.py` calcula el `sizes` justo a
# partir de ese ancho. Escribirles la escalera les serviría un peldaño de 800w
# para pintarlos a 1443 px y el cliente cambiaría un tirón por cinco fotos
# blandas a pantalla completa. Con sus 1500-1600 px de origen ya están
# prácticamente en la medida correcta: no sobra casi nada que recortar y no hay
# ahorro que perseguir. Se quedan como están, a propósito.
#
# El pedido era el LAGEO DE ESA FOTO, no una pasada general por la sección: lo
# que se optimiza es lo que se decodifica de más, que son las 15 miniaturas de
# los paneles —las tres de noche-evento-1.jpg entre ellas—, no las portadas.
#
# Y UNA SOLA FOTO DE LAS QUE ENTRAN EN v19, POR LA MISMA RAZÓN QUE ELLAS.
# Se comprobó UNA A UNA, en el navegador y con las 70 fotos ya cargadas, cuál
# de las tres secciones nuevas cae en la trampa de `cover`: se comparó la
# proporción de la CAJA con la proporción NATURAL de cada imagen, que es lo
# que decide si `cover` escala por el ancho (y entonces el `sizes` por ancho
# es correcto) o por el alto (y entonces se queda corto). De 70 fotos únicas,
# 69 escalan por el ancho y una no:
#
#     img/naturaleza-milano.jpg   2000x1815 (1,10)   caja 401x501 (0,80)
#     -> `cover` escala por el ALTO: se pinta a 552 px de ancho, no a 401.
#
# Escribirle el `sizes` calculado sobre los 401 px de la caja le serviría un
# peldaño para 401 y el navegador lo estiraría a 552: foto blanda, que es
# cambiar un tirón por un defecto visible. Se queda como está, a propósito.
#
# Las 57 miniaturas del muro de aves NO caen aquí: van con `object-fit: fill`
# y su caja tiene EXACTAMENTE la proporción natural de cada foto (medido:
# 188x281 contra 0,67 natural, 188x150 contra 1,25...), así que el ancho de
# la caja es el ancho pintado y el `sizes` por ancho es exacto.
SIN_DERIVAR = {
    "img/naturaleza-milano.jpg",
    "img/hero-ave-flor.jpg", "img/hero-ave-rosada.jpg",
    "img/espacios/alameda-2.jpg", "img/espacios/taller-1.jpg",
    "img/eventos/vega-horizontal.jpg", "img/eventos/vega-vertical.jpg",
    "img/eventos/boda-4.jpg",
    "img/eventos/cancha-horizontal.jpg", "img/eventos/cancha-vertical.jpg",
}


def fuentes():
    """Los .jpg que alguna sección DEL ALCANCE referencia, sin repetir."""
    vistas = set()
    for frag in [os.path.join(RAIZ, "sections", n) for n in ALCANCE]:
        with open(frag, encoding="utf-8") as fh:
            texto = fh.read()
        texto = re.sub(r"<!--.*?-->", " ", texto, flags=re.S)
        # `src=` de los <img> y `srcset=` de una sola URL de los <source>: en
        # #usos dos tarjetas cambian a un recorte VERTICAL en teléfono, y ese
        # recorte sólo existe como <source media>. Sin mirar también ahí, las
        # dos únicas fotos que se sirven en exclusiva a móvil se quedaban sin
        # derivar — justo al revés de lo que busca este script.
        for ruta in re.findall(r'(?:src|srcset)="(img/[^" ,]+\.jpg)"', texto):
            if RE_DERIVADO.search(ruta) or ruta in SIN_DERIVAR:
                continue
            vistas.add(ruta)
    return sorted(vistas)


def main():
    generados = ahorro_total = 0
    saltadas = []
    descartados = []

    for rel in fuentes():
        abs_ruta = os.path.join(RAIZ, rel.replace("/", os.sep))
        if not os.path.exists(abs_ruta):
            print("  *** no existe:", rel)
            continue

        peso = os.path.getsize(abs_ruta)
        if peso < PESO_MINIMO:
            # Ligera, pero ¿también pequeña? Se mira el tamaño en píxeles
            # antes de saltársela: es lo que cuesta decodificar (ver
            # MPX_MINIMO). Abrir la cabecera no descomprime la imagen.
            with Image.open(abs_ruta) as sonda:
                mpx = (sonda.size[0] * sonda.size[1]) / 1e6
            if mpx < MPX_MINIMO:
                saltadas.append((rel, "pesa poco y mide poco"))
                continue

        with Image.open(abs_ruta) as im:
            # LA ORIENTACIÓN EXIF SE APLICA ANTES DE NADA, Y NO ES UN DETALLE.
            # Un JPEG puede traer los píxeles guardados de lado y una etiqueta
            # EXIF (0x0112) que le dice al navegador cuánto girarlos al
            # pintar. Pillow NO la aplica al abrir y TAMPOCO la copia al
            # guardar: sin esta línea, el derivado sale con los píxeles en la
            # orientación ALMACENADA y sin la etiqueta que los enderezaba, así
            # que el navegador lo pinta girado 90° respecto del original. El
            # srcset serviría la misma foto tumbada en el teléfono y derecha
            # en el escritorio, según el peldaño que tocara.
            #
            # Hasta ahora no había mordido porque las fotos del ALCANCE
            # anterior venían de retoque, ya enderezadas y sin etiqueta. Las
            # que entran en v19 son ORIGINALES DE TELÉFONO, que es justo de
            # donde salen las etiquetas de orientación: medido sobre las 98
            # fuentes de los ocho fragmentos, una sola la trae —
            # img/aves/ortalis-columbiana-referencia.jpg, orientación 6,
            # guardada 1570x1010 y mostrada 1010x1570— y está en
            # naturaleza.html, que es uno de los fragmentos que entran aquí.
            # `exif_transpose` deja los píxeles ya girados y quita la
            # etiqueta, que es exactamente el estado que hay que guardar.
            im = ImageOps.exif_transpose(im)
            im = im.convert("RGB")
            ancho_orig, alto_orig = im.size
            hechos = []
            for ancho in ANCHOS:
                # Nunca agrandar, y no molestarse si la diferencia es mínima.
                if ancho >= ancho_orig * 0.95:
                    continue
                destino = abs_ruta[:-4] + "-%d.jpg" % ancho
                alto = round(alto_orig * ancho / ancho_orig)
                if ESCRIBIR:
                    chico = im.resize((ancho, alto), Image.LANCZOS)
                    chico.save(destino, "JPEG", quality=84, optimize=True,
                               progressive=True, subsampling="4:2:0")
                    # UN DERIVADO QUE NO ADELGAZA NO SE QUEDA.
                    # Cuando el original ya es casi tan estrecho como el
                    # peldaño, reescalarlo no quita píxeles y el reencode a
                    # q84 puede incluso ENGORDARLO (le pasaba a boda-2.jpg:
                    # 844 px de origen, 272 KB, y su «800w» salía a 282 KB).
                    # Ofrecérselo al navegador sería pagar una petición más
                    # para bajarse un archivo peor. Se exige un ahorro
                    # mínimo real; si no lo da, se borra y el srcset se queda
                    # sin ese peldaño, que es exactamente lo correcto.
                    peso_chico = os.path.getsize(destino)
                    if peso_chico > peso * (1 - AHORRO_MINIMO):
                        os.remove(destino)
                        descartados.append((rel, ancho))
                        continue
                    hechos.append((ancho, peso_chico))
                else:
                    hechos.append((ancho, 0))
                generados += 1

        if hechos and ESCRIBIR:
            # El ahorro que de verdad importa es el del peldaño que se lleva
            # el teléfono, no la suma de todos los derivados.
            movil = min(hechos, key=lambda h: abs(h[0] - 800))
            ahorro_total += peso - movil[1]
            print("%-46s %7.1fKB -> %s" % (
                rel, peso / 1024,
                "  ".join("%dw %.1fKB" % (a, b / 1024) for a, b in hechos)))
        elif hechos:
            print("%-46s %7.1fKB -> %s" % (
                rel, peso / 1024, " ".join("%dw" % a for a, _ in hechos)))

    print("\nderivados: %d   ·   fuentes saltadas: %d   ·   peldanos descartados: %d"
          % (generados, len(saltadas), len(descartados)))
    for rel_d, ancho_d in descartados:
        print("   descartado (ahorro corto) %-38s %dw" % (rel_d, ancho_d))
    if ESCRIBIR:
        print("ahorro en el peldaño de teléfono: %.1f MB" % (ahorro_total / 1024 / 1024))
        print(">>> ESCRITO")
    else:
        print(">>> simulacion, no se escribio nada")


if __name__ == "__main__":
    main()
