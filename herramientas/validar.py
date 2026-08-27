# -*- coding: utf-8 -*-
"""
VALIDADOR de index.html — sitio-vegas-del-verde.

a) tablaPropiedad: ningun hecho fuera de su dueno
b) toda ancla href="#x" tiene su id="x"
c) todo src/href interno existe en disco
d) etiquetas balanceadas, ignorando comentarios
e) cero «ecoposada», cero «data-modal»
"""
import io, os, re, sys, json, unicodedata
from collections import Counter

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IDX  = os.path.join(RAIZ, "index.html")

def leer(p):
    with io.open(p, encoding="utf-8") as f:
        return f.read()

doc = leer(IDX)

# ---------------------------------------------------------------- utilidades
RE_COMENT = re.compile(r"<!--.*?-->", re.S)
RE_ANCLA  = re.compile(r"<a\b[^>]*>.*?</a>", re.S | re.I)
RE_OPTION = re.compile(r"<option\b[^>]*>.*?</option>", re.S | re.I)

def sin_comentarios(s):
    return RE_COMENT.sub(" ", s)

def normaliza(s):
    """minusculas y sin tildes, para que «Baños» y «banos» sean el mismo grep"""
    s = unicodedata.normalize("NFD", s.lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[\u00a0\s]+", " ", s)

# ============================================================== 0. TROCEADO
# El ensamblado deja cada <section> de fragmento abriendo y cerrando en la
# columna 0, asi que el troceado es exacto y no necesita un parser de DOM.
i_body = doc.index("<body>")
i_main = doc.index('<main id="contenido">')
i_fin  = doc.index("</main>")

regiones = {}
regiones["cabecera"] = doc[i_body:i_main]
regiones["pie"]      = doc[i_fin:]

cuerpo_main = doc[i_main:i_fin]
trozos = re.split(r"^</section>\s*$", cuerpo_main, flags=re.M)
orden_real = []
for t in trozos:
    m = re.search(r'^<section\b[^>]*\bid="([^"]+)"', t, flags=re.M)
    if not m:
        continue
    sid = m.group(1)
    orden_real.append(sid)
    regiones[sid] = t[m.start():]

# v14 · se pone al dia con validar.js: la segunda seccion es "usos" (lo era ya
# desde hace varias versiones y aqui habia quedado el nombre viejo) y el
# recorrido cierra con "compromiso", despues de #ubicacion y antes del pie.
# v7 · #naturaleza reemplaza a #momentos justo tras #planes; #momentos y
# #colegios se corren un puesto.
# v15 · #colegios sale del <main>: es la pagina suelta colegios.html, que este
# validador no cubre (igual que plan-vecino.html o condiciones-de-alquiler.html).
# v16 · #momentos sale del <main>: sus cuatro clips son ahora el hero de
# #sendero, que es seccion propia y CIERRA el recorrido justo debajo de
# #vivero (pedido directo del cliente).
ESPERADO = ["inicio", "usos", "nosotros", "planes", "naturaleza",
            "vivero", "sendero", "ubicacion", "compromiso"]

print("=" * 74)
print("0. ORDEN DEL <main>")
print("   esperado : " + " -> ".join(ESPERADO))
print("   real     : " + " -> ".join(orden_real))
print("   veredicto: " + ("OK" if orden_real == ESPERADO else "*** NO COINCIDE ***"))

# ============================================ a) TABLA DE PROPIEDAD (hechos)
# (hecho, dueno(s), [patrones], enlaceOk)
#   enlaceOk=True -> el termino SI puede aparecer dentro de un <a>/<option>
#                    en secciones que no son su dueno (regla «se enlaza,
#                    no se describe»); esos elementos se retiran antes de mirar.
NADIE = "(ninguna seccion de index.html)"
HECHOS = [
 ("Tagline «Oasis para la recreacion y el bienestar»", ["inicio","pie"],
  [r"oasis para la recreacion"], False),
 ("«Cuatro hectareas» (tamano del predio)", ["inicio"],
  [r"\bcuatro hectareas\b", r"\b4 hectareas\b", r"\b4 ?ha\b"], False),
 ("«A 10 minutos» (promesa de cercania)", ["inicio"],
  [r"\ba (10|diez) minutos\b"], False),
 ("«Nosotros ponemos los arboles»", ["inicio"],
  [r"ponemos los arboles"], False),
 ("Vista aerea del predio como plano-indice", ["inicio"],
  [r"aereo-predio\.jpg"], "raw"),
 ("Refugio privado, cerrado y vigilado", ["nosotros"],
  [r"bullicio urbano"], False),
 # v14 · los dos hechos del compromiso cambian de DUENO, no de contenido: la
 # banda salio de #nosotros y es ahora la seccion #compromiso, la ultima del
 # <main>. Siguen escritos una sola vez en todo el sitio.
 ("Compromiso «conexion y aprendizaje conjunto»", ["compromiso"],
  [r"aprendizaje conjunto"], False),
 ("Los tres pilares", ["compromiso"],
  [r"educacion ambiental", r"conciencia social", r"relaciones sanas"], False),
 ("Servicios del predio (Wifi/Banos/Vigilancia/Parqueadero)", ["nosotros"],
  [r"\bwifi\b", r"vigilancia privada", r"\bparqueadero\b"], False),
 ("«Proximamente: arenero»", ["nosotros"],
  [r"\barenero\b"], False),
 ("Aforo Alameda 150", ["espacios"], [r"\b150 personas\b"], False),
 ("Aforo La Vega 100", ["espacios"], [r"\b100 personas\b"], False),
 ("Aforo Teatrino 70",  ["espacios"], [r"\b70 personas\b"], False),
 ("Aforo Taller 45",    ["espacios"], [r"\b45 personas\b"], False),
 ("Aforo Cancha 30/20", ["espacios"], [r"\b30 jugadores\b", r"\b20 espectadores\b"], False),
 ("Alquiler base de 4 horas / hora adicional", [NADIE],
  [r"\b(cuatro|4) horas\b", r"hora adicional"], False),
 ("Sillas y mesas Rimax", [NADIE], [r"\brimax\b"], False),
 ("No incluye sonido / catering externo", [NADIE],
  [r"\bcatering\b", r"no incluye sonido"], False),
 # v15 · los tres hechos de la oferta escolar cambian de dueno a NADIE, no de
 # contenido: viven enteros en colegios.html, que es una pagina suelta y este
 # validador solo lee index.html. Se quedan en la tabla —en vez de borrarse—
 # para que siga vigilada la otra mitad de la regla: que ninguna seccion de
 # index.html los vuelva a escribir.
 ("Observatorios como parada pedagogica", [NADIE],
  [r"observatorio"], True),
 # «mariposa» a secas se retiro del patron: el mural pintado en el muro
 # turquesa de img/parque/parque-11.jpg lleva mariposas, y describirlo en el
 # alt no es afirmar que exista el jardin. Un escape real del hecho tendria
 # que nombrar a los polinizadores o el avistamiento, y eso si se sigue
 # cazando. Se prefiere un patron que no obligue a mentir en un alt.
 ("Jardin de polinizadores y mariposas", [NADIE],
  [r"polinizador", r"avistamiento de mariposas", r"jard[ií]n de mariposas"], True),
  # v16 · los tres hechos del Sendero cambian de DUENO, no de contenido: el
 # bloque se mudo entero a la seccion #sendero, que cierra el <main> debajo
 # de #vivero. Siguen escritos una sola vez en todo el sitio.
 ("Sendero Ecovital (descrito)", ["sendero"],
  [r"sendero"], True),
 ("Entrada $15.000 (unico precio publicado)", ["sendero"],
  [r"15\.000", r"15000"], False),
 ("Quebrada Aranzoque y riachuelo La Florida", ["sendero"],
  [r"aranzoque", r"riachuelo"], False),
 ("101 especies de aves", ["naturaleza"], [r"\b101\b"], False),
 ("Chachalaca Colombiana endemica", ["naturaleza"],
  [r"chachalaca", r"ortalis columbiana"], False),
 ("7 especies migratorias boreales", ["naturaleza"],
  [r"\b(7|siete) especies migratorias\b", r"migratorias boreales"], False),
 ("347 plantas y 20 familias botanicas", ["naturaleza"],
  [r"\b347\b", r"\b20 familias\b"], False),
 ("Concurso: 57 fotografias de 20 autores", ["naturaleza"],
  [r"\b57 (fotografias|imagenes|obras)\b", r"\b20 autores\b"], False),
 ("Vivero: produccion y venta de plantas / abonos", ["vivero"],
  [r"\babonos?\b"], False),
 ("Mantenimiento de jardines y poda", ["vivero"],
  [r"poda de arboles"], False),
 ("Registro ICA, Resolucion 00000819", ["vivero"],
  [r"\bica\b", r"00000819"], False),
 ("Direccion: Vereda Rio Frio / via Carabineros", ["ubicacion"],
  [r"vereda rio frio", r"via carabineros"], False),
 ("Coordenadas 7.0574425, -73.1144128", ["ubicacion"],
  [r"7\.0574425", r"-?73\.1144128"], False),
 ("Cercanias y Anillo Vial", ["ubicacion","inicio"],
  [r"anillo vial"], False),
 ("«Area Metropolitana de Bucaramanga»", ["ubicacion"],
  [r"area metropolitana"], False),
 ("Horario 6:00 a.m. - 10:00 p.m.", ["ubicacion"],
  [r"6:00 a", r"10:00 p", r"lunes a domingo"], False),
 # Sólo el número ESCRITO. wa.me/573166758362 es un destino, no un dato en
 # pantalla, y va en todas las secciones a propósito (regla 4 del encargo).
 ("Telefono +57 316 675 8362 escrito en pantalla", ["ubicacion"],
  [r"316 675 8362"], False),
 ("Correo vegasdelverde.1@gmail.com", ["ubicacion"],
  [r"vegasdelverde\.1@gmail\.com"], False),
 ("Instagram @vegasdelverde", ["ubicacion","pie"],
  [r"@vegasdelverde"], False),
 ("«No hay reservas en linea»", ["ubicacion"],
  [r"no hay reservas"], False),
 ("Razon social 4 Family S.A.S. / NIT", ["pie"],
  [r"4 family", r"901\.391\.144"], False),
 ("Frases poeticas de marca (separadores a sangre)", [NADIE],
  [r"tu proximo plan no es en un salon",
   r"planes distintos, mas atrevidos",
   r"el ruido mas fuerte es un pajaro",
   r"no es el mismo bosque en marzo"], False),
 ("Rotulo «Reserva tu escape»",            ["inicio"],     [r"reserva tu escape"], False),
 ("Rotulo «Ver eventos y actividades»",    ["nosotros"],   [r"ver eventos y actividades"], False),
 ("Rotulo «Quiero este plan»",             ["espacios"],   [r"quiero este plan"], False),
 ("Rotulo «Atrevete a un plan distinto»",  ["planes","espacios"], [r"atrevete a un plan distinto"], False),
 ("Rotulo «Vengo con mi curso»",           [NADIE],        [r"vengo con mi curso"], False),
 ("Rotulo «Atrevete al sendero»",          ["sendero"],    [r"atrevete al sendero"], False),
 ("Rotulo «Quiero plantas del vivero»",    ["vivero"],     [r"quiero plantas del vivero"], False),
 ("Rotulo «Hablemos por WhatsApp»",        ["ubicacion"],  [r"hablemos por whatsapp"], False),
 ("Rotulo «Escribenos por WhatsApp»",      ["cabecera"],   [r"escribenos por whatsapp"], False),
]

# Atributos que NO llegan a ninguna persona: son ganchos para CSS y JS. Si no
# se retiran, una clase como .inicio__ancla-item--sendero se cuenta como si la
# sección hubiera escrito «Sendero» en pantalla. Lo que SÍ se conserva es todo
# lo que se lee o se oye: el texto, alt, title, aria-label y placeholder.
# `poster` va en esta lista por la misma razon que `src`: es una RUTA DE
# ARCHIVO, no algo que nadie lea en pantalla. Sin el, el nombre de un video
# —video/jardin-polinizadores.mp4— se contaba como si la seccion hubiera
# escrito «polinizadores» en el texto visible, y hacia saltar la tabla de
# propiedad de una seccion que no es su duena. Es una trampa que solo aparece
# cuando se mete video, asi que queda documentada aqui.
RE_MAQUINA = re.compile(
    r'\s(?:class|id|href|src|srcset|poster|for|form|name|type|rel|role|loading|'
    r'decoding|fetchpriority|preload|playsinline|muted|loop|target|hreflang|'
    r'lang|width|height|viewBox|d|'
    r'aria-labelledby|aria-controls|aria-describedby|data-[a-z-]*)="[^"]*"',
    re.I)

# tres lecturas por region: cruda (para nombres de archivo), visible, y
# visible sin enlaces (para los hechos que se pueden ENLAZAR pero no describir)
txt_raw, txt, txt_sin_enlaces = {}, {}, {}
for k, v in regiones.items():
    limpio = sin_comentarios(v)
    txt_raw[k] = normaliza(limpio)
    visible = RE_MAQUINA.sub(" ", limpio)
    txt[k] = normaliza(visible)
    txt_sin_enlaces[k] = normaliza(RE_OPTION.sub(" ", RE_ANCLA.sub(" ", visible)))

repeticiones = []
print()
print("=" * 74)
print("a) TABLA DE PROPIEDAD — un hecho, un dueno")
for hecho, duenos, patrones, enlaceOk in HECHOS:
    intrusas, conteo_dueno = [], 0
    for reg in list(regiones):
        base = (txt_raw[reg] if enlaceOk == "raw"
                else txt_sin_enlaces[reg] if enlaceOk else txt[reg])
        n = sum(len(re.findall(p, base)) for p in patrones)
        if n == 0:
            continue
        if reg in duenos:
            conteo_dueno += n
        else:
            intrusas.append("%s(%d)" % (reg, n))
    if intrusas:
        repeticiones.append({"hecho": hecho, "secciones": intrusas})
        print("  FUERA DE SITIO  %-52s -> %s" % (hecho[:52], ", ".join(intrusas)))
print("  hechos vigilados: %d   ·   hechos fuera de su dueno: %d"
      % (len(HECHOS), len(repeticiones)))

# ==================================================== b) ANCLAS INTERNAS
sin_com = sin_comentarios(doc)
ids = set(re.findall(r'\bid="([^"]+)"', sin_com))
anclas = re.findall(r'href="#([^"]+)"', sin_com)
rotos = sorted({"#" + a for a in anclas if a and a not in ids})
dup_ids = [i for i, c in Counter(re.findall(r'\bid="([^"]+)"', sin_com)).items() if c > 1]

print()
print("=" * 74)
print("b) ANCLAS INTERNAS")
print("   href=\"#x\" distintos: %d   ·   id= distintos: %d" % (len(set(anclas)), len(ids)))
print("   anclas muertas: %d %s" % (len(rotos), rotos if rotos else ""))
print("   ids duplicados: %d %s" % (len(dup_ids), sorted(dup_ids) if dup_ids else ""))

# ====================================== c) RECURSOS INTERNOS EN DISCO
EXCEPCION = {"video/hero.mp4"}
recursos = set()
for m in re.finditer(r'(?:src|href|poster|data-src)="([^"]+)"', sin_com):
    u = m.group(1).strip()
    if (not u or u.startswith(("#", "http://", "https://", "mailto:", "tel:",
                               "data:", "//", "javascript:"))):
        continue
    recursos.add(u.split("#")[0].split("?")[0])
faltan = sorted(u for u in recursos
                if u not in EXCEPCION and not os.path.exists(os.path.join(RAIZ, u.replace("/", os.sep))))
print()
print("=" * 74)
print("c) RECURSOS INTERNOS")
print("   rutas internas distintas: %d" % len(recursos))
print("   presentes en disco      : %d" % (len(recursos) - len(faltan) - len(recursos & EXCEPCION)))
print("   excepcion pactada       : %s" % ", ".join(sorted(recursos & EXCEPCION)))
print("   NO EXISTEN              : %d %s" % (len(faltan), faltan if faltan else ""))

# ============================================== d) BALANCE DE ETIQUETAS
VACIAS = {"area","base","br","col","embed","hr","img","input","link","meta",
          "param","source","track","wbr","path","circle","rect","line","polyline",
          "polygon","ellipse","stop","use"}
sin_sc = re.sub(r"<(script|style)\b[^>]*>.*?</\1>", "", sin_com, flags=re.S | re.I)
pila, desbalance = [], []
for m in re.finditer(r"<(/?)([a-zA-Z][a-zA-Z0-9-]*)\b[^>]*?(/?)>", sin_sc):
    cierre, tag, auto = m.group(1), m.group(2).lower(), m.group(3)
    if tag in VACIAS or auto == "/":
        continue
    if not cierre:
        pila.append((tag, m.start()))
    else:
        if pila and pila[-1][0] == tag:
            pila.pop()
        else:
            desbalance.append("</%s> sin apertura en offset %d" % (tag, m.start()))
for tag, off in pila:
    desbalance.append("<%s> sin cierre en offset %d" % (tag, off))
print()
print("=" * 74)
print("d) BALANCE DE ETIQUETAS (comentarios, script y style excluidos)")
print("   desbalances: %d" % len(desbalance))
for d in desbalance[:15]:
    print("     " + d)

# ============================================== e) PROHIBICIONES DURAS
n_eco   = len(re.findall(r"ecoposada", doc, re.I))
n_modal = len(re.findall(r"data-modal", doc, re.I))
print()
print("=" * 74)
print("e) PROHIBICIONES DURAS")
print("   «ecoposada» : %d   ·   «data-modal» : %d" % (n_eco, n_modal))

# ================================ f) UN ARCHIVO, UN PAPEL (fotos repetidas)
# ARQUITECTURA-V3: una foto sólo puede repetirse si hace dos papeles distintos
# (atmósfera vs. archivo acreditado). Se listan las repetidas para revisarlas.
usos = {}
for reg in orden_real:
    limpio_reg = sin_comentarios(regiones[reg])
    for m in re.finditer(r'<img\b[^>]*\bsrc="([^"]+)"', limpio_reg):
        usos.setdefault(m.group(1), []).append(reg)
repes = {k: v for k, v in usos.items() if len(v) > 1}
print()
print("=" * 74)
print("f) UN ARCHIVO, UN PAPEL")
print("   <img> distintos en el <main>: %d   ·   repetidos: %d" % (len(usos), len(repes)))
for k in sorted(repes):
    print("     %-44s %s" % (k, repes[k]))

# El VIDEO se cuenta aparte y sin excepciones. La regla de las aves (una misma
# foto puede hacer de atmosfera en un sitio y de archivo acreditado en otro) no
# le aplica: un clip repetido en dos secciones se nota muchisimo mas que una
# foto, porque se MUEVE, y el visitante lo lee como que no habia mas material.
# Este bloque existe porque el chequeo de arriba solo miraba <img> y dejo pasar
# el mismo clip en #momentos y en #naturaleza, puesto por dos manos distintas.
usos_v = {}
for reg in orden_real:
    limpio_reg = sin_comentarios(regiones[reg])
    for m in re.finditer(r'<source\b[^>]*\bsrc="([^"]+\.(?:mp4|webm))"', limpio_reg):
        usos_v.setdefault(re.sub(r'\.(mp4|webm)$', '', m.group(1)), []).append(reg)
    for m in re.finditer(r'\bposter="([^"]+)"', limpio_reg):
        usos_v.setdefault(m.group(1), []).append(reg)
usos_v = {k: sorted(set(v)) for k, v in usos_v.items()}
repes_v = {k: v for k, v in usos_v.items() if len(v) > 1}
print("   clips y posters distintos   : %d   ·   repetidos: %d %s"
      % (len(usos_v), len(repes_v), "  *** REVISAR ***" if repes_v else ""))
for k in sorted(repes_v):
    print("     %-44s %s" % (k, repes_v[k]))

# ============================================ g) HIGIENE DE CSS EN EL HTML
cuerpo = doc[i_body:]
hex_lit = re.findall(r'(?<!&)#[0-9a-fA-F]{3,8}\b(?=[;\'"\s)])', sin_comentarios(cuerpo))
print()
print("=" * 74)
print("g) HIGIENE (dentro de <body>, sin comentarios)")
print("   !important            : %d" % len(re.findall(r"!important", sin_comentarios(cuerpo))))
print("   atributos style=      : %d" % len(re.findall(r'\bstyle="', sin_comentarios(cuerpo))))
print("   font-family en el HTML: %d" % len(re.findall(r"font-family", sin_comentarios(cuerpo))))
print("   colores literales     : %d %s" % (len(hex_lit), sorted(set(hex_lit))[:6]))
print("   Lorem Ipsum           : %d" % len(re.findall(r"lorem ipsum", cuerpo, re.I)))

# --------------------------------------------------------------- resultado
res = {
  "orden_ok": orden_real == ESPERADO,
  "repeticionesRestantes": repeticiones,
  "enlacesRotos": rotos,
  "idsDuplicados": sorted(dup_ids),
  "fotosQueFaltan": faltan,
  "desbalance": desbalance,
  "ecoposada": n_eco, "dataModal": n_modal,
}
print()
print("=" * 74)
todo = (res["orden_ok"] and not repeticiones and not rotos and not dup_ids
        and not faltan and not desbalance and not n_eco and not n_modal)
print("VEREDICTO GLOBAL: " + ("TODO LIMPIO" if todo else "HAY HALLAZGOS (ver arriba)"))
# Salida legible para un script que encadene: 0 limpio, 1 con hallazgos.
sys.exit(0 if todo else 1)
