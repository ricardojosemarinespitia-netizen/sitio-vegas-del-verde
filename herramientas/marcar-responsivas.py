"""INYECTOR DE srcset/sizes EN sections/*.html

POR QUÉ EXISTE
herramientas/derivar-imagenes.py deja los derivados en disco, pero un
derivado que nadie referencia no ahorra un solo byte. Este script escribe el
`srcset` y el `sizes` de cada <img> para que el navegador pueda elegir el
peldaño que le corresponde.

DE DÓNDE SALE EL `sizes` — Y POR QUÉ NO ESTÁ PUESTO A OJO
El checklist móvil de DIRECTRICES-ANIMACION.md §6 pide «sizes del layout
REAL, nunca 100vw». Aquí el layout real está MEDIDO, no estimado: se abrió
la página en el navegador a 375 px y a 906 px de ancho y se anotó el
getBoundingClientRect().width de cada <img> en las dos. El `sizes` se
escribe en `vw` —la fracción de ventana que la foto ocupa de verdad— en vez
de en px, porque en vw la cifra sigue siendo correcta en los anchos
intermedios que no se midieron. Las medidas viven en MEDIDAS-FOTOS.json,
al lado de este script, para que se puedan volver a comprobar.

Se le suma un 12 % de holgura: varias fotos crecen con `transform: scale()`
—el zoom de js/foto-focus.js, el hover de `.marco--zoom`, el ken-burns de
#momentos— y el elemento sigue midiendo lo mismo aunque se pinte más grande.
Sin esa holgura el navegador elegiría el peldaño justo y la foto se vería
blanda mientras dura el zoom.

EL LIGHTBOX
js/app.js:337 abre la foto grande con `img.currentSrc || img.src`, y
`currentSrc` es el peldaño que el navegador eligió para la MINIATURA. Sin
más cuidado, poner srcset en las 57 miniaturas del muro de aves haría que el
lightbox abriera a pantalla completa una foto de 400 px. Por eso a cada
disparador se le escribe `data-lightbox-src` con el original: es el atributo
que ese mismo `datosDe()` mira PRIMERO, así que la foto grande sigue siendo
la de siempre.

    python herramientas/marcar-responsivas.py            (informe)
    python herramientas/marcar-responsivas.py --escribir
"""
import json
import os
import re
import sys
import glob

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ESCRIBIR = "--escribir" in sys.argv

ANCHOS = (400, 600, 800, 1200)
HOLGURA = 1.12          # margen para los zooms por transform (ver cabecera)
CORTE_MOVIL = "47.99em"  # el mismo corte que ya usa el resto del sitio

with open(os.path.join(RAIZ, "herramientas", "MEDIDAS-FOTOS.json"), encoding="utf-8") as fh:
    MEDIDAS = json.load(fh)

VW_MOVIL = MEDIDAS["vw_movil"]
VW_ESCRITORIO = MEDIDAS["vw_escritorio"]

# <img ...> completo, con los atributos repartidos en varias líneas.
RE_IMG = re.compile(r"<img\b[^>]*?/?>", re.S)
RE_COMENTARIO = re.compile(r"<!--.*?-->", re.S)


def ancho_real(ruta):
    """Ancho en píxeles del .jpg original, leído de la cabecera JPEG."""
    import struct
    abs_ruta = os.path.join(RAIZ, ruta.replace("/", os.sep))
    with open(abs_ruta, "rb") as fh:
        if fh.read(2) != b"\xff\xd8":
            return None
        while True:
            b = fh.read(1)
            while b and b != b"\xff":
                b = fh.read(1)
            while b == b"\xff":
                b = fh.read(1)
            if not b:
                return None
            if b[0] in (0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7,
                        0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF):
                fh.read(3)
                _alto, ancho = struct.unpack(">HH", fh.read(4))
                return ancho
            largo = struct.unpack(">H", fh.read(2))[0]
            fh.read(largo - 2)


def vw(px, ventana):
    """Fracción de ventana, con holgura, redondeada y tapada en 100."""
    return min(100, max(1, round(px * HOLGURA / ventana * 100)))


def atributos(ruta, solo_movil=False):
    """Devuelve (srcset, sizes) para una foto, o None si no toca marcarla.

    `solo_movil` es para los <source media="(max-width: …)">: esa foto no
    existe en escritorio, así que no hay medida de escritorio que buscar ni
    condición que escribir — el propio `media` del <source> ya acota dónde
    se usa, y un `sizes` con dos ramas ahí sobraría.
    """
    m = MEDIDAS["movil"].get(ruta)
    e = MEDIDAS["escritorio"].get(ruta)
    if m is None or (e is None and not solo_movil):
        return None  # no se midió: no se toca, mejor eso que adivinar

    orig = ancho_real(ruta)
    if orig is None:
        return None

    peldanos = []
    for a in ANCHOS:
        derivado = ruta[:-4] + "-%d.jpg" % a
        if os.path.exists(os.path.join(RAIZ, derivado.replace("/", os.sep))):
            peldanos.append("%s %dw" % (derivado, a))
    if not peldanos:
        return None
    peldanos.append("%s %dw" % (ruta, orig))

    v_movil = vw(m, VW_MOVIL)
    if solo_movil:
        return ", ".join(peldanos), "%dvw" % v_movil
    v_escritorio = vw(e, VW_ESCRITORIO)
    if v_movil == v_escritorio:
        sizes = "%dvw" % v_movil
    else:
        sizes = "(max-width: %s) %dvw, %dvw" % (CORTE_MOVIL, v_movil, v_escritorio)
    return ", ".join(peldanos), sizes


def marcar(texto):
    """Escribe srcset/sizes en cada <img> y data-lightbox-src en su botón."""
    tocados = []

    def reemplazo(mo):
        etiqueta = mo.group(0)
        if "srcset=" in etiqueta:
            return etiqueta
        m_src = re.search(r'\bsrc="(img/[^"]+\.jpg)"', etiqueta)
        if not m_src:
            return etiqueta
        ruta = m_src.group(1)
        par = atributos(ruta)
        if par is None:
            return etiqueta
        srcset, sizes = par

        # Se calca la sangría del propio <img> —más dos espacios, que es como
        # están ya sangrados sus atributos— para que el fragmento siga
        # leyéndose igual: estos archivos se editan a mano a diario. Hay que
        # mirar el texto ENTERO, no sólo la etiqueta: en los <img> escritos en
        # una sola línea la sangría está delante del `<`, fuera de la captura.
        arranque = mo.string.rfind("\n", 0, mo.start()) + 1
        delante = mo.string[arranque:mo.start()]
        base = len(delante) if not delante.strip() else len(delante.rstrip()) + 1
        sangria = "\n" + " " * (base + 2)
        nuevo = '%s%ssrcset="%s"%ssizes="%s"' % (
            m_src.group(0), sangria, srcset, sangria, sizes)
        tocados.append(ruta)
        return etiqueta[:m_src.start()] + nuevo + etiqueta[m_src.end():]

    # 1) los <img> (saltando los que viven dentro de un comentario)
    trozos, ultimo = [], 0
    for c in RE_COMENTARIO.finditer(texto):
        trozos.append(RE_IMG.sub(reemplazo, texto[ultimo:c.start()]))
        trozos.append(c.group(0))
        ultimo = c.end()
    trozos.append(RE_IMG.sub(reemplazo, texto[ultimo:]))
    texto = "".join(trozos)

    # 2) el original para el lightbox, en el <button> que envuelve la foto
    def con_original(mo):
        bloque = mo.group(0)
        if "data-lightbox-src=" in bloque:
            return bloque
        m_src = re.search(r'\bsrc="(img/[^"]+\.jpg)"', bloque)
        if not m_src or "srcset=" not in bloque:
            return bloque
        m_cap = re.search(r'(\n(\s*)data-lightbox-caption="[^"]*")', bloque)
        if not m_cap:
            return bloque
        inyectado = '%s\n%sdata-lightbox-src="%s"' % (
            m_cap.group(1), m_cap.group(2), m_src.group(1))
        return bloque[:m_cap.start()] + inyectado + bloque[m_cap.end():]

    texto = re.sub(r"<button\b[^>]*data-lightbox=.*?</button>", con_original,
                   texto, flags=re.S)

    # 3) los <source media> de una sola URL. En #usos dos tarjetas cambian a
    #    un recorte vertical en teléfono; ese recorte vive SÓLO aquí, así que
    #    es la única foto de la página que se sirve en exclusiva a móvil y era
    #    también la única que seguía bajando a tamaño completo. Van a sangre
    #    (100vw medido), y el `sizes` tiene que ir en el propio <source>: el
    #    del <img> no lo hereda un <source> que trae srcset propio.
    def marcar_source(mo):
        bloque = mo.group(0)
        ruta = mo.group(1)
        if " " in mo.group(1) or "sizes=" in bloque:
            return bloque
        par = atributos(ruta, solo_movil="max-width" in bloque)
        if par is None:
            return bloque
        srcset, sizes = par
        tocados.append(ruta)
        return bloque.replace('srcset="%s"' % ruta,
                              'srcset="%s" sizes="%s"' % (srcset, sizes))

    texto = re.sub(r'<source\b[^>]*srcset="(img/[^"]+\.jpg)"[^>]*/?>',
                   marcar_source, texto)
    return texto, tocados


# El mismo alcance acotado que herramientas/derivar-imagenes.py — ver allí el
# porqué. Los dos listados tienen que cambiar a la vez: marcar un fragmento
# cuyos derivados no se generaron dejaría un srcset apuntando a archivos que
# no existen.
#
# v18 · ENTRA usos.html, por el tercer pedido del cliente sobre la foto del
# evento nocturno bajo la carpa («SOLUCIONAR EL LAGEO DE ESTA FOTO YA EN
# CELULAR»). El porqué medido está en la cabecera de derivar-imagenes.py.
#
# AQUÍ NO HACE FALTA REPETIR LA LISTA DE EXCLUIDAS. Las cinco fotos de tarjeta
# de #usos van a 100dvh con `object-fit: cover` y su `sizes` no se puede
# deducir del ancho del elemento (allá se explica). Basta con que allá no se
# les generen peldaños: `atributos()` devuelve None cuando no encuentra ni un
# derivado en disco, así que este script las salta solo. Una sola lista, en un
# solo sitio, y las dos mitades no pueden desincronizarse.
ALCANCE = ("hero.html", "nosotros.html", "planes.html", "momentos.html",
           "usos.html")


def main():
    total = 0
    for frag in [os.path.join(RAIZ, "sections", n) for n in ALCANCE]:
        with open(frag, encoding="utf-8") as fh:
            antes = fh.read()
        despues, tocados = marcar(antes)
        if tocados:
            total += len(tocados)
            print("%-28s %d <img> marcados" % (os.path.basename(frag), len(tocados)))
        if ESCRIBIR and despues != antes:
            with open(frag, "w", encoding="utf-8", newline="") as fh:
                fh.write(despues)
    print("\nTOTAL <img> con srcset: %d" % total)
    print(">>> ESCRITO" if ESCRIBIR else ">>> simulacion, no se escribio nada")


if __name__ == "__main__":
    main()
