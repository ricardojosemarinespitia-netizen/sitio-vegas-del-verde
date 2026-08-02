# -*- coding: utf-8 -*-
"""
VALIDADOR DE SITIO — todas las paginas en espanol de sitio-vegas-del-verde.
Comprueba anclas (dentro de la pagina y entre paginas), recursos en disco,
balance de etiquetas, ids duplicados y las dos prohibiciones duras.
"""
import io, os, re, json

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGINAS = ["index.html", "condiciones-de-alquiler.html",
           "politica-de-datos.html", "terminos.html", "404.html"]
EXCEPCION = {"video/hero.mp4"}

RE_COMENT = re.compile(r"<!--.*?-->", re.S)
VACIAS = {"area","base","br","col","embed","hr","img","input","link","meta",
          "param","source","track","wbr","path","circle","rect","line","polyline",
          "polygon","ellipse","stop","use"}

def leer(p):
    with io.open(p, encoding="utf-8") as f:
        return f.read()

docs, ids_por_pagina = {}, {}
for p in PAGINAS:
    ruta = os.path.join(RAIZ, p)
    if not os.path.exists(ruta):
        print("FALTA LA PAGINA: " + p); continue
    docs[p] = RE_COMENT.sub(" ", leer(ruta))
    ids_por_pagina[p] = set(re.findall(r'\bid="([^"]+)"', docs[p]))

rotos, faltan, desbalances, dup = [], [], [], []
print("=" * 74)
print("VALIDACION DE TODAS LAS PAGINAS EN ESPANOL")
print("=" * 74)
print("%-30s %6s %6s %7s %7s %6s" % ("pagina", "ids", "anclas", "rutas", "rotas", "tags"))

for p, d in docs.items():
    # ids duplicados
    todos = re.findall(r'\bid="([^"]+)"', d)
    for i in set(todos):
        if todos.count(i) > 1:
            dup.append("%s: id=%s x%d" % (p, i, todos.count(i)))

    # anclas: #x en la misma pagina  y  otra.html#x en la pagina destino
    n_rotas = 0
    for m in re.finditer(r'href="([^"]*)#([^"]+)"', d):
        destino, ancla = m.group(1), m.group(2)
        pag = p if destino in ("", ".") else destino
        if pag.startswith(("http", "//")) or pag.startswith("en/"):
            continue
        if pag not in ids_por_pagina:
            rotos.append("%s -> %s#%s (pagina desconocida)" % (p, destino, ancla)); n_rotas += 1
        elif ancla not in ids_por_pagina[pag]:
            rotos.append("%s -> %s#%s" % (p, destino, ancla)); n_rotas += 1

    # recursos internos
    rutas = set()
    for m in re.finditer(r'(?:src|href|poster)="([^"]+)"', d):
        u = m.group(1).strip()
        if not u or u.startswith(("#", "http://", "https://", "mailto:", "tel:",
                                  "data:", "//", "javascript:")):
            continue
        u = u.split("#")[0].split("?")[0]
        if u:
            rutas.add(u)
    for u in sorted(rutas):
        if u in EXCEPCION:
            continue
        # 404.html usa rutas desde la raiz del dominio («/styles/base.css»),
        # que es lo correcto: la sirve GitHub Pages desde cualquier profundidad.
        rel = u.lstrip("/").replace("/", os.sep)
        if not os.path.exists(os.path.join(RAIZ, rel)):
            faltan.append("%s -> %s" % (p, u))

    # balance de etiquetas
    limpio = re.sub(r"<(script|style)\b[^>]*>.*?</\1>", "", d, flags=re.S | re.I)
    pila, malas = [], 0
    for m in re.finditer(r"<(/?)([a-zA-Z][a-zA-Z0-9-]*)\b[^>]*?(/?)>", limpio):
        cierre, tag, auto = m.group(1), m.group(2).lower(), m.group(3)
        if tag in VACIAS or auto == "/":
            continue
        if not cierre:
            pila.append(tag)
        elif pila and pila[-1] == tag:
            pila.pop()
        else:
            desbalances.append("%s: </%s> sin apertura" % (p, tag)); malas += 1
    for t in pila:
        desbalances.append("%s: <%s> sin cierre" % (p, t)); malas += 1

    print("%-30s %6d %6d %7d %7d %6d"
          % (p, len(ids_por_pagina[p]),
             len(re.findall(r'href="[^"]*#', d)), len(rutas), n_rotas, malas))

eco = {p: len(re.findall(r"ecoposada", d, re.I)) for p, d in docs.items()}
modal = {p: len(re.findall(r"data-modal", d, re.I)) for p, d in docs.items()}

print()
print("anclas rotas       : %d %s" % (len(rotos), rotos if rotos else ""))
print("ids duplicados     : %d %s" % (len(dup), dup if dup else ""))
print("recursos que faltan: %d %s" % (len(faltan), faltan if faltan else ""))
print("desbalances        : %d %s" % (len(desbalances), desbalances[:10] if desbalances else ""))
print("«ecoposada»        : %d  %s" % (sum(eco.values()), {k: v for k, v in eco.items() if v}))
print("«data-modal»       : %d  %s" % (sum(modal.values()), {k: v for k, v in modal.items() if v}))
print()
print("VEREDICTO: " + ("TODO LIMPIO" if not (rotos or dup or faltan or desbalances
                                             or sum(eco.values()) or sum(modal.values()))
                       else "HAY HALLAZGOS"))
