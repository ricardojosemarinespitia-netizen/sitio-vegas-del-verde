# -*- coding: utf-8 -*-
"""
ENSAMBLADOR de index.html para sitio-vegas-del-verde.

index.html NO se edita a mano. Se ARMA:
    <head> + cabecera  +  <main> concatenando sections/*.html  +  pie + scripts

Orden del <main> (ARQUITECTURA-V3):
    inicio -> usos -> nosotros -> planes -> momentos -> colegios -> naturaleza -> vivero -> ubicacion -> compromiso
"""
import io, os, re, sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IDX  = os.path.join(RAIZ, "index.html")

ORDEN = [
    ("inicio",     "hero.html"),
    ("usos",       "usos.html"),
    ("nosotros",   "nosotros.html"),
    ("planes",     "planes.html"),
    # v7 · #naturaleza ("pajareo") ocupa el hueco que dejo #momentos, justo
    # tras #planes -- pedido directo del cliente: "en su reemplazo pon
    # pajareo".
    ("naturaleza", "naturaleza.html"),
    # v15 · #colegios SALE del <main>. Pedido directo y repetido del cliente:
    # no quiere las salidas escolares en el scroll de la ventana principal. El
    # bloque vive ahora en la pagina suelta colegios.html (raiz), que enlaza su
    # propia hoja; se entra por el carril 05 de #planes y por el nav.
    # sections/colegios.html se conserva como fuente historica pero YA NO SE
    # ENSAMBLA.
    # v16 · #momentos SALE del <main>. Era una banda de carbon de atmosfera pura
    # --no poseia ni un solo hecho-- con cuatro clips de mariposas. El cliente la
    # senalo con nombre propio ("ese hero de los videos es asqueroso") y pidio
    # integrar ese metraje en el Sendero. Los cuatro clips viven ahora en el
    # hero de sections/sendero.html; ninguno se pierde y ninguno se duplica.
    # sections/momentos.html y styles/sections/momentos.css se conservan como
    # fuente historica pero YA NO SE ENSAMBLAN.
    ("vivero",     "vivero.html"),
    # v16 · #sendero: el Sendero Ecovital deja de ser el primer movimiento de
    # #naturaleza y pasa a CERRAR el recorrido, justo debajo de #vivero. Pedido
    # directo del cliente (agosto 2026): "el sendero ecovital es lo ultimo, va
    # debajo de vivero". Las secciones del <main> son bloques contiguos, asi que
    # la unica forma de que aparezca fisicamente despues de #vivero es que sea
    # seccion propia con su entrada aqui. Se lleva tres hechos de #naturaleza
    # (sendero descrito, entrada $15.000, las dos corrientes de agua); la tabla
    # HECHOS de validar.js y validar.py se actualizo en paralelo.
    ("sendero",    "sendero.html"),
    ("ubicacion",  "ubicacion.html"),
    # v14 · «Nuestro compromiso» deja de ser un bloque dentro de #nosotros y
    # pasa a ser la ULTIMA seccion del <main>, justo antes del pie. Pedido
    # directo y repetido del cliente. No lleva hoja propia en CSS_SECCIONES:
    # sus reglas viven en styles/sections/nosotros.css §3, con la que comparte
    # todo el vocabulario visual.
    ("compromiso", "compromiso.html"),
]

# Hojas de sección que deben ir en el <head>, en el mismo orden que el <main>.
CSS_SECCIONES = [
    "styles/sections/inicio.css",
    "styles/sections/usos.css",
    "styles/sections/nosotros.css",
    "styles/sections/planes.css",
    # v16 · momentos.css sale del <head> con su seccion (ver ORDEN).
    # v15 · colegios.css sale del <head> de index.html con su seccion: ahora se
    # enlaza directo desde colegios.html, la unica pagina que lo usa.
    "styles/sections/naturaleza.css",
    "styles/sections/vivero.css",
    # v16 · sendero.css DESPUES de naturaleza.css, y no es indiferente: la
    # seccion #sendero reutiliza tal cual el bloque .nat-apertura de la hoja de
    # naturaleza, asi que si alguna vez hay que matizar una regla heredada se
    # hace desde aqui, sin subir especificidad y sin un solo !important.
    "styles/sections/sendero.css",
    "styles/sections/ubicacion.css",
    "styles/sections/pie.css",
]

def leer(p):
    with io.open(p, encoding="utf-8") as f:
        return f.read()

def escribir(p, s):
    with io.open(p, "w", encoding="utf-8", newline="\n") as f:
        f.write(s)

original = leer(IDX)

# ---------------------------------------------------------------- 1. cabeza
i_head_ini = original.index("<!DOCTYPE html>")
i_body     = original.index("<body>") + len("<body>")
cabeza = original[i_head_ini:i_body]          # <!DOCTYPE> .. <head>..</head> <body>

# ------------------------------------------------- 2. <head>: hojas de sección
# Se sustituye el bloque completo de <link ... styles/sections/*.css> por el
# nuevo, para que borrar y añadir sea una sola operación y no se cuele ninguna
# hoja de una sección muerta (hero, experiencias, contacto).
links_sec = re.findall(r'^[ \t]*<link rel="stylesheet" href="styles/sections/[^"]+">\n',
                       cabeza, flags=re.M)
if not links_sec:
    sys.exit("ERROR: no encontré ningún <link> de styles/sections/ en el <head>.")

antes = [re.search(r'href="([^"]+)"', l).group(1) for l in links_sec]

# OJO: primero se BORRAN todos y sólo después se inserta el bloque nuevo. Si se
# sustituye el primero y luego se borran los demás uno a uno, el `replace(l,"")`
# encuentra su primera coincidencia DENTRO del bloque recién insertado y se come
# la línea buena, dejando la vieja: el <head> queda desordenado y con la hoja
# equivocada. Pasó en la primera pasada; por eso el borrado va antes.
i_ins = cabeza.index(links_sec[0])
for l in links_sec:
    cabeza = cabeza.replace(l, "", 1)
bloque_nuevo = "".join('<link rel="stylesheet" href="%s">\n' % h for h in CSS_SECCIONES)
cabeza = cabeza[:i_ins] + bloque_nuevo + cabeza[i_ins:]

css_borradas = [h for h in antes if h not in CSS_SECCIONES]
css_anadidas = [h for h in CSS_SECCIONES if h not in antes]
css_reordenadas = [h for h in CSS_SECCIONES if h in antes] != [h for h in antes if h in CSS_SECCIONES]

# ---------------------------------------------------------------- 3. cabecera
cabecera = leer(os.path.join(RAIZ, "sections", "_header.html")).rstrip("\n")

# ------------------------------------------------------------------- 4. main
partes = []
for ancla, arch in ORDEN:
    ruta = os.path.join(RAIZ, "sections", arch)
    frag = leer(ruta).strip("\n")
    m = re.search(r'<section[^>]*\bid="([^"]+)"', frag)
    if not m:
        sys.exit("ERROR: %s no abre con un <section id=...>" % arch)
    if m.group(1) != ancla:
        sys.exit("ERROR: %s trae id=%r y el orden pide %r" % (arch, m.group(1), ancla))
    partes.append(frag)
main = "<main id=\"contenido\">\n" + "\n\n".join(partes) + "\n</main>"

# -------------------------------------------------------------------- 5. pie
pie = leer(os.path.join(RAIZ, "sections", "_footer.html")).rstrip("\n")

# ---------------------------------------------------------------- 6. scripts
i_cierre = original.rindex("</footer>") + len("</footer>")
cola = original[i_cierre:]                     # <script ...> ... </body></html>

nuevo = cabeza + "\n" + cabecera + "\n" + main + "\n" + pie + cola
escribir(IDX, nuevo)

print("ENSAMBLADO OK")
print("  secciones en <main>: %d -> %s" % (len(ORDEN), " -> ".join(a for a, _ in ORDEN)))
print("  hojas de seccion borradas del <head>: %s" % (", ".join(css_borradas) or "ninguna"))
print("  hojas de seccion anadidas al <head> : %s" % (", ".join(css_anadidas) or "ninguna"))
print("  orden del <head> reescrito al del <main>: %s" % ("si" if css_reordenadas else "ya estaba bien"))
print("  lineas: %d -> %d" % (original.count("\n") + 1, nuevo.count("\n") + 1))
