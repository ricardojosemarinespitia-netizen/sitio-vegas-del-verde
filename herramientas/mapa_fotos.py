# -*- coding: utf-8 -*-
"""Regenera MAPA-FOTOS.json leyendo el index.html ya ensamblado."""
import io, os, re, json

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def leer(p):
    with io.open(p, encoding="utf-8") as f:
        return f.read()

doc = re.sub(r"<!--.*?-->", " ", leer(os.path.join(RAIZ, "index.html")), flags=re.S)
i_main, i_fin = doc.index('<main id="contenido">'), doc.index("</main>")
cuerpo = doc[i_main:i_fin]

secciones, orden = {}, []
for t in re.split(r"^</section>\s*$", cuerpo, flags=re.M):
    m = re.search(r'^<section\b[^>]*\bid="([^"]+)"', t, flags=re.M)
    if not m:
        continue
    sid = m.group(1)
    orden.append(sid)
    vistas, fotos = set(), []
    for s in re.findall(r'<img\b[^>]*\bsrc="(img/[^"]+)"', t[m.start():]):
        if s not in vistas:
            vistas.add(s); fotos.append(s)
    secciones[sid] = fotos

creditos = {}
rc = os.path.join(RAIZ, "img", "aves", "_creditos.json")
if os.path.exists(rc):
    creditos = json.loads(leer(rc))

usos = {}
for sid in orden:
    for f in secciones[sid]:
        usos.setdefault(f, []).append(sid)

mapa = {
  "_leeme": [
    "Este archivo NO se edita a mano: lo regenera herramientas/mapa_fotos.py",
    "leyendo el index.html YA ENSAMBLADO. Es un espejo de lo que se publica,",
    "no una lista de deseos. Si una foto no esta aqui, no esta en la pagina.",
    "Regla: un archivo, un papel. La unica repeticion permitida es un ave que",
    "haga de atmosfera en #inicio y de pieza acreditada en el muro de #naturaleza."
  ],
  "_generado_desde": "index.html",
  "orden_de_secciones": orden,
  "por_seccion": {s: secciones[s] for s in orden},
  "totales": {
    "archivos_distintos": len(usos),
    "usos_totales": sum(len(v) for v in usos.values()),
    "por_seccion": {s: len(secciones[s]) for s in orden},
  },
  "repetidas": {f: v for f, v in usos.items() if len(v) > 1},
  "creditos_de_aves": "img/aves/_creditos.json (%d entradas)" % len(creditos),
}

destino = os.path.join(RAIZ, "MAPA-FOTOS.json")
with io.open(destino, "w", encoding="utf-8", newline="\n") as f:
    json.dump(mapa, f, ensure_ascii=False, indent=2)
    f.write("\n")

print("MAPA-FOTOS.json regenerado")
for s in orden:
    print("  %-12s %3d fotos" % (s, len(secciones[s])))
print("  archivos distintos: %d  ·  repetidos: %d"
      % (len(usos), len(mapa["repetidas"])))
