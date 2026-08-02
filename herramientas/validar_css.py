# -*- coding: utf-8 -*-
"""
Comprueba que ninguna clase usada en index.html dependa de una hoja que ya no
esta enlazada (hero.css, experiencias.css, contacto.css), y lista las clases
que no estan definidas en ninguna hoja enlazada.
"""
import io, os, re

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def leer(p):
    with io.open(p, encoding="utf-8") as f:
        return f.read()

doc = re.sub(r"<!--.*?-->", " ", leer(os.path.join(RAIZ, "index.html")), flags=re.S)

enlazadas = re.findall(r'<link rel="stylesheet" href="(styles/[^"]+)"', doc)
todas = []
for d, _, fs in os.walk(os.path.join(RAIZ, "styles")):
    for f in fs:
        if f.endswith(".css"):
            todas.append(os.path.relpath(os.path.join(d, f), RAIZ).replace("\\", "/"))
huerfanas = sorted(set(todas) - set(enlazadas) - {"styles/lightbox.css"})

usadas = set()
for m in re.finditer(r'\bclass="([^"]+)"', doc):
    usadas.update(m.group(1).split())

def definidas(rutas):
    s = set()
    for r in rutas:
        s.update(re.findall(r"\.(-?[_a-zA-Z][\w-]*)", leer(os.path.join(RAIZ, r.replace("/", os.sep)))))
    return s

def_enlazadas = definidas(enlazadas + ["styles/lightbox.css"])
def_huerfanas = definidas(huerfanas)

sin_css   = sorted(c for c in usadas if c not in def_enlazadas)
en_muerta = sorted(c for c in sin_css if c in def_huerfanas)

print("hojas enlazadas en el <head> (%d):" % len(enlazadas))
for h in enlazadas:
    print("   " + h)
print()
print("hojas presentes en disco pero YA NO enlazadas (%d): %s" % (len(huerfanas), huerfanas))
print()
print("clases distintas usadas en index.html : %d" % len(usadas))
print("clases sin regla en ninguna hoja enlazada: %d" % len(sin_css))
for c in sin_css:
    print("   . " + c)
print()
print(">>> CRITICO — clases que SOLO estan definidas en una hoja huerfana: %d" % len(en_muerta))
for c in en_muerta:
    print("   . " + c)
