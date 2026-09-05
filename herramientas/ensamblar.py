# -*- coding: utf-8 -*-
"""
ENSAMBLADOR del sitio para sitio-vegas-del-verde.

Ninguna pagina se edita a mano. Se ARMA:
    <head> + cabecera  +  <main> concatenando sections/*.html  +  pie + scripts

v18 · DE UNA PAGINA A OCHO
Hasta v17 este script solo sabia ensamblar index.html. El PLAN-REDISENO-V4
§4.1 parte el sitio en «escaparate + profundidad»: la portada se queda en
nueve bloques cortos y las seis secciones largas se van cada una a su URL.
Ahora hay siete documentos que ensamblar con el mismo par de fragmentos
compartidos (_header.html y _footer.html).

La mecanica por documento NO cambio: se conserva la cabeza hasta <body>, se
reescribe el bloque de <link rel="stylesheet" href="styles/sections/..."> del
<head>, se inserta la cabecera, se pegan las secciones dentro de
<main id="contenido">, se inserta el pie y se conserva TAL CUAL todo lo que
venga despues de </footer> (los <script> de cola, distintos en cada pagina).

MANTENER EN PARALELO con herramientas/ensamblar.js: si cambia PAGINAS en uno,
cambia en el otro. El puerto de Node es el que se usa a diario (el equipo no
tiene Python); este fichero es la referencia original.

    python herramientas/ensamblar.py
"""
import io, os, re, sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ==========================================================================
# EL MAPA DEL SITIO
#   archivo : el .html que se reescribe (tiene que existir ya, con su <head>,
#             su <body>, un <link> de styles/sections/ cualquiera, un
#             </footer> y su cola de <script>).
#   orden   : pares (ancla, fragmento) que se pegan dentro del <main>. El id
#             del <section> del fragmento tiene que coincidir con el ancla.
#   css     : las hojas de styles/sections/ que esa pagina enlaza, EN ORDEN.
#
# colegios.html, plan-vecino.html, condiciones-de-alquiler.html,
# politica-de-datos.html, terminos.html y 404.html NO estan aqui: son paginas
# escritas a mano de un solo bloque, sin fragmentos que ensamblar.
# ==========================================================================
PAGINAS = [
    # ------------------------------------------------------------------ HOME
    # La portada es un escaparate: medía 37 pantallas de movil y 2,9 MB. Las
    # seis secciones largas se mudaron integras a sus paginas y en su sitio
    # entran seis bloques cortos nuevos (sections/home-*). #inicio, #nosotros
    # y #compromiso se quedan: el hero no tiene adonde ir, y los otros dos son
    # el bloque 7 del plan, «Nosotros + Compromiso».
    {
        "archivo": "index.html",
        "orden": [
            ("inicio",     "hero.html"),
            ("planes",     "home-planes.html"),
            ("espacios",   "home-espacios.html"),
            ("naturaleza", "home-naturaleza.html"),
            ("sendero",    "home-sendero.html"),
            ("vivero",     "home-vivero.html"),
            ("nosotros",   "nosotros.html"),
            ("compromiso", "compromiso.html"),
            ("contacto",   "home-contacto.html"),
        ],
        "css": [
            "styles/sections/inicio.css",
            "styles/sections/home.css",
            "styles/sections/nosotros.css",
            "styles/sections/pie.css",
        ],
    },

    # ---------------------------------------------------------- PROFUNDIDAD
    # Las seis paginas llevan el fragmento ORIGINAL, sin una sola clase
    # cambiada: mudarse de pagina no es rediseñarse. Todas cargan home.css
    # ademas de su hoja: de ahi sale el encabezado de pagina.
    {
        "archivo": "espacios.html",
        "orden": [("portada-espacios", "enc-espacios.html"), ("usos", "usos.html")],
        "css": ["styles/sections/home.css", "styles/sections/usos.css",
                "styles/sections/pie.css"],
    },
    {
        "archivo": "planes.html",
        "orden": [("portada-planes", "enc-planes.html"), ("planes", "planes.html")],
        "css": ["styles/sections/home.css", "styles/sections/planes.css",
                "styles/sections/pie.css"],
    },
    {
        "archivo": "naturaleza.html",
        "orden": [("portada-naturaleza", "enc-naturaleza.html"),
                  ("naturaleza", "naturaleza.html")],
        "css": ["styles/sections/home.css", "styles/sections/naturaleza.css",
                "styles/sections/pie.css"],
    },
    {
        # sendero.css DESPUES de naturaleza.css: la seccion reutiliza tal cual
        # el bloque .nat-apertura de la hoja de naturaleza, y aqui es donde se
        # matiza cualquier regla heredada sin subir especificidad.
        "archivo": "sendero-ecovital.html",
        "orden": [("portada-sendero-ecovital", "enc-sendero-ecovital.html"),
                  ("sendero", "sendero.html")],
        "css": ["styles/sections/home.css", "styles/sections/naturaleza.css",
                "styles/sections/sendero.css", "styles/sections/pie.css"],
    },
    {
        "archivo": "vivero.html",
        "orden": [("portada-vivero", "enc-vivero.html"), ("vivero", "vivero.html")],
        "css": ["styles/sections/home.css", "styles/sections/vivero.css",
                "styles/sections/pie.css"],
    },
    {
        "archivo": "contacto.html",
        "orden": [("portada-contacto", "enc-contacto.html"),
                  ("ubicacion", "ubicacion.html")],
        "css": ["styles/sections/home.css", "styles/sections/ubicacion.css",
                "styles/sections/pie.css"],
    },
]


def leer(p):
    with io.open(p, encoding="utf-8") as f:
        return f.read().replace("\r\n", "\n")


def escribir(p, s):
    with io.open(p, "w", encoding="utf-8", newline="\n") as f:
        f.write(s)


# Los dos fragmentos compartidos se leen UNA vez y se pegan identicos en las
# siete paginas: es la garantia de que el menu y el pie no se separen.
cabecera = leer(os.path.join(RAIZ, "sections", "_header.html")).rstrip("\n")
pie = leer(os.path.join(RAIZ, "sections", "_footer.html")).rstrip("\n")

total_secciones = 0

for pagina in PAGINAS:
    IDX = os.path.join(RAIZ, pagina["archivo"])
    if not os.path.exists(IDX):
        sys.exit("ERROR: %s no existe." % pagina["archivo"])
    original = leer(IDX)

    # ------------------------------------------------------------ 1. cabeza
    i_head_ini = original.index("<!DOCTYPE html>")
    i_body = original.index("<body>") + len("<body>")
    cabeza = original[i_head_ini:i_body]

    # --------------------------------------------- 2. <head>: hojas de seccion
    # Se sustituye el bloque completo de <link ... styles/sections/*.css> por
    # el nuevo, para que borrar y añadir sea una sola operacion y no se cuele
    # ninguna hoja de una seccion muerta.
    links_sec = re.findall(
        r'^[ \t]*<link rel="stylesheet" href="styles/sections/[^"]+">\n',
        cabeza, flags=re.M)
    if not links_sec:
        sys.exit("ERROR: %s: no encontre ningun <link> de styles/sections/."
                 % pagina["archivo"])

    antes = [re.search(r'href="([^"]+)"', l).group(1).split("?")[0]
             for l in links_sec]

    # OJO: primero se BORRAN todos y solo despues se inserta el bloque nuevo.
    # Sustituir uno a uno hace que el replace encuentre su coincidencia DENTRO
    # del bloque recien insertado y se coma la linea buena.
    i_ins = cabeza.index(links_sec[0])
    for l in links_sec:
        cabeza = cabeza.replace(l, "", 1)
    bloque_nuevo = "".join('<link rel="stylesheet" href="%s">\n' % h
                           for h in pagina["css"])
    cabeza = cabeza[:i_ins] + bloque_nuevo + cabeza[i_ins:]

    css_borradas = [h for h in antes if h not in pagina["css"]]
    css_anadidas = [h for h in pagina["css"] if h not in antes]

    # --------------------------------------------------------------- 3. main
    partes = []
    for ancla, arch in pagina["orden"]:
        frag = leer(os.path.join(RAIZ, "sections", arch)).strip("\n")
        m = re.search(r'<section[^>]*\bid="([^"]+)"', frag)
        if not m:
            sys.exit("ERROR: %s no abre con un <section id=...>" % arch)
        if m.group(1) != ancla:
            sys.exit("ERROR: %s trae id=%r y el orden pide %r"
                     % (arch, m.group(1), ancla))
        partes.append(frag)
    main = '<main id="contenido">\n' + "\n\n".join(partes) + "\n</main>"

    # ------------------------------------------------------------ 4. scripts
    i_cierre = original.rindex("</footer>") + len("</footer>")
    cola = original[i_cierre:]

    nuevo = cabeza + "\n" + cabecera + "\n" + main + "\n" + pie + cola
    escribir(IDX, nuevo)
    total_secciones += len(pagina["orden"])

    print("%-24s OK" % pagina["archivo"])
    print("   secciones: %s" % " -> ".join(a for a, _ in pagina["orden"]))
    if css_borradas:
        print("   hojas borradas del <head>: %s" % ", ".join(css_borradas))
    if css_anadidas:
        print("   hojas anadidas al <head> : %s" % ", ".join(css_anadidas))

print("\nENSAMBLADO OK · %d paginas · %d secciones"
      % (len(PAGINAS), total_secciones))
