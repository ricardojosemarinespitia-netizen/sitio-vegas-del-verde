# -*- coding: utf-8 -*-
"""
VALIDADOR de index.html — sitio-vegas-del-verde.

a) tablaPropiedad: ningun hecho fuera de su dueno
b) toda ancla href="#x" tiene su id="x"
c) todo src/href interno existe en disco
d) etiquetas balanceadas, ignorando comentarios
e) cero «ecoposada», cero «data-modal»
f) un archivo, un papel (fotos y clips repetidos)
g) higiene de CSS en el HTML
h) cero velos, degradados o filtros sobre fotografia (plan v4, 4.3)

Mantener en paralelo con validar.js: si cambia la tabla HECHOS en uno,
cambia en el otro. v18 · reconstruido tras una colision de edicion
concurrente que trunco este archivo a las lineas 1-114 (ver validar.js,
que quedo intacto, como fuente de verdad para la reconstruccion).
"""
import io, os, re, sys, unicodedata
from collections import Counter

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IDX  = os.path.join(RAIZ, "index.html")

def leer(p):
    with io.open(p, encoding="utf-8") as f:
        return f.read()

doc = leer(IDX).replace("\r\n", "\n")

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
    return re.sub(r"[ \s]+", " ", s)

def cuenta(texto, patron):
    return len(re.findall(patron, texto))

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

# v18 · EL ORDEN NUEVO DE LA PORTADA (PLAN-REDISENO-V4 §4.2).
# Seis secciones salieron del <main> y son paginas propias, con el mismo
# precedente que colegios.html en v15 y plan-vecino.html: este validador
# sigue leyendo SOLO index.html, asi que los hechos que se fueron con
# ellas figuran abajo con dueno NADIE — no para borrarlos de la vigilancia,
# sino para vigilar la otra mitad de la regla: que ninguna seccion de la
# portada los vuelva a escribir.
#   #usos      -> espacios.html          (el ancla del escaparate es #espacios)
#   #planes    -> planes.html            (el ancla del escaparate es #planes)
#   #naturaleza-> naturaleza.html
#   #sendero   -> sendero-ecovital.html
#   #vivero    -> vivero.html
#   #ubicacion -> contacto.html          (el ancla del escaparate es #contacto)
ESPERADO = ["inicio", "planes", "espacios", "naturaleza", "sendero", "vivero",
            # #nosotros y #compromiso siguen en la portada y siguen contiguos:
            # son el bloque 7 del plan, «Nosotros + Compromiso».
            "nosotros", "compromiso", "contacto"]

raya = "=" * 74
print(raya)
print("0. ORDEN DEL <main>")
print("   esperado : " + " -> ".join(ESPERADO))
print("   real     : " + " -> ".join(orden_real))
orden_ok = orden_real == ESPERADO
print("   veredicto: " + ("OK" if orden_ok else "*** NO COINCIDE ***"))

# ============================================ a) TABLA DE PROPIEDAD (hechos)
# (hecho, dueno(s), [patrones], enlaceOk)
#   enlaceOk=True -> el termino SI puede aparecer dentro de un <a>/<option>
#                    en secciones que no son su dueno (regla «se enlaza,
#                    no se describe»); esos elementos se retiran antes de mirar.
NADIE = "(ninguna seccion de index.html)"
HECHOS = [
 ("Tagline «Oasis para la recreacion y el bienestar»", ["inicio", "pie"],
  [r"oasis para la recreacion"], False),
 ("«Cuatro hectareas» (tamano del predio)", ["inicio"],
  [r"\bcuatro hectareas\b", r"\b4 hectareas\b", r"\b4 ?ha\b"], False),
 ("«A 10 minutos» (promesa de cercania)", ["inicio"],
  [r"\ba (10|diez) minutos\b"], False),
 ("«Nosotros ponemos los arboles»", ["inicio"],
  [r"ponemos los arboles"], False),
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
 # validador solo lee index.html.
 ("Observatorios como parada pedagogica", [NADIE],
  [r"observatorio"], True),
 ("Jardin de polinizadores y mariposas", [NADIE],
  [r"polinizador", r"avistamiento de mariposas", r"jard[ií]n de mariposas"], True),
 # v16 · los tres hechos del Sendero cambian de DUENO: el bloque se mudo
 # entero a la seccion #sendero.
 ("Sendero Ecovital (descrito)", ["sendero"],
  [r"sendero"], True),
 # v18 · pasa a NADIE: el detalle de la quebrada vive en sendero-ecovital.html,
 # pagina propia que este validador no lee.
 ("Quebrada Aranzoque y riachuelo La Florida", [NADIE],
  [r"aranzoque", r"riachuelo"], False),
 ("101 especies de aves", ["naturaleza"], [r"\b101\b"], False),
 # v18 · pasa a NADIE: vive en naturaleza.html.
 ("Chachalaca Colombiana endemica", [NADIE],
  [r"chachalaca", r"ortalis columbiana"], False),
 ("7 especies migratorias boreales", [NADIE],
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
 # v18 · direccion/coordenadas/telefono/correo/"no hay reservas" pasan a
 # NADIE: viven en contacto.html, pagina propia.
 ("Direccion: Vereda Rio Frio / via Carabineros", [NADIE],
  [r"vereda rio frio", r"via carabineros"], False),
 ("Coordenadas 7.0574425, -73.1144128", [NADIE],
  [r"7\.0574425", r"-?73\.1144128"], False),
 ("Cercanias y Anillo Vial", ["inicio"],
  [r"anillo vial"], False),
 ("«Area Metropolitana de Bucaramanga»", [NADIE],
  [r"area metropolitana"], False),
 ("Horario 6:00 a.m. - 10:00 p.m.", ["contacto"],
  [r"6:00 a", r"10:00 p", r"lunes a domingo"], False),
 ("Telefono +57 316 675 8362 escrito en pantalla", [NADIE],
  [r"316 675 8362"], False),
 ("Correo vegasdelverde.1@gmail.com", [NADIE],
  [r"vegasdelverde\.1@gmail\.com"], False),
 ("Instagram @vegasdelverde", ["pie"],
  [r"@vegasdelverde"], False),
 ("«No hay reservas en linea»", [NADIE],
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
 ("Rotulo «Quiero este plan»",             [NADIE],        [r"quiero este plan"], False),
 ("Rotulo «Atrevete a un plan distinto»",  [NADIE],        [r"atrevete a un plan distinto"], False),
 ("Rotulo «Vengo con mi curso»",           [NADIE],        [r"vengo con mi curso"], False),
 ("Rotulo «Atrevete al sendero»",          [NADIE],        [r"atrevete al sendero"], False),
 ("Rotulo «Quiero plantas del vivero»",    [NADIE],        [r"quiero plantas del vivero"], False),
 ("Rotulo «Hablemos por WhatsApp»",        [NADIE],        [r"hablemos por whatsapp"], False),
 ("Rotulo «Escribenos por WhatsApp»",      ["cabecera"],   [r"escribenos por whatsapp"], False),
 # v19 · ALIANZA EDUCATIVA · PASES POR JORNADAS (flyer de septiembre 2026).
 # Los hechos nuevos viven ENTEROS en colegios.html, pagina suelta que este
 # validador no lee; el dueno `colegios` esta escrito para que quede dicho
 # donde estan, y para vigilar la otra mitad de la regla: que ninguna
 # seccion de index.html los vuelva a escribir. El «4 horas» de la jornada
 # se vigila por su frase propia para no chocar con el hecho del alquiler
 # («alquiler base de 4 horas»), que ya tiene su patron arriba.
 ("Alianza Educativa · 40.000 m2 de bosque vivo", ["colegios"],
  [r"40\.000 ?m", r"40000 ?m", r"bosque vivo"], False),
 ("Jornada escolar = 4 horas", ["colegios"],
  [r"dura cada jornada", r"jornada = 4", r"jornadas de cuatro horas"], False),
 ("Cinco aulas vivas", ["colegios"], [r"aulas? vivas?"], True),
 ("40 estudiantes por jornada / contado / validez un ano", ["colegios"],
  [r"\b40 estudiantes\b", r"pago de contado"], False),
 ("Pase Semilla · 1 jornada · $400.000", ["colegios"], [r"pase semilla", r"\$?400\.000"], False),
 ("Pase Bosque · 2 jornadas · $750.000", ["colegios"], [r"pase bosque", r"\$?750\.000"], False),
 ("Pase Sede · 4 jornadas · $1.400.000", ["colegios"], [r"pase sede", r"\$?1\.400\.000"], False),
 ("Actividad ludica $8.000 por estudiante", ["colegios"],
  [r"actividad ludica", r"\$?8\.000 por estudiante"], False),
 ("Refrigerio $12.000 a $18.000 por estudiante", ["colegios"],
  [r"\brefrigerio\b", r"12\.000 a \$?18\.000"], False),
 ("Nota: el colegio aporta el diseno pedagogico y el profesor", ["colegios"],
  [r"diseno pedagogico", r"acompanamiento pedagogico", r"\bbinoculares\b"], False),
 ("Servicio social (cuatro opciones)", ["colegios"],
  [r"servicio social", r"guardianes del vivero", r"guardianes polinizadores", r"cientificos junior"], False),
 ("Puntos Verdes: 1 punto por recarga · 12 = Pase Semilla · 3 meses", ["colegios"],
  [r"puntos verdes", r"12 puntos", r"cada recarga"], False),
 ("Direccion escolar: 500 m via Carabineros desde Mediterraneo", ["colegios"],
  [r"\bmediterraneo\b", r"500 ?m por la via"], False),
]

# Atributos que NO llegan a ninguna persona: son ganchos para CSS y JS. Si no
# se retiran, una clase como .inicio__ancla-item--sendero se cuenta como si la
# sección hubiera escrito «Sendero» en pantalla. Lo que SÍ se conserva es todo
# lo que se lee o se oye: el texto, alt, title, aria-label y placeholder.
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
print(raya)
print("a) TABLA DE PROPIEDAD — un hecho, un dueno")
for hecho, duenos, patrones, enlaceOk in HECHOS:
    intrusas = []
    for reg in list(regiones):
        base = (txt_raw[reg] if enlaceOk == "raw"
                else txt_sin_enlaces[reg] if enlaceOk else txt[reg])
        n = sum(cuenta(base, p) for p in patrones)
        if n == 0 or reg in duenos:
            continue
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
dup_ids = sorted(i for i, c in Counter(re.findall(r'\bid="([^"]+)"', sin_com)).items() if c > 1)

print()
print(raya)
print("b) ANCLAS INTERNAS")
print("   href=\"#x\" distintos: %d   ·   id= distintos: %d" % (len(set(anclas)), len(ids)))
print("   anclas muertas: %d %s" % (len(rotos), rotos if rotos else ""))
print("   ids duplicados: %d %s" % (len(dup_ids), dup_ids if dup_ids else ""))

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
print(raya)
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
print(raya)
print("d) BALANCE DE ETIQUETAS (comentarios, script y style excluidos)")
print("   desbalances: %d" % len(desbalance))
for d in desbalance[:15]:
    print("     " + d)

# ============================================== e) PROHIBICIONES DURAS
n_eco   = len(re.findall(r"ecoposada", doc, re.I))
n_modal = len(re.findall(r"data-modal", doc, re.I))
print()
print(raya)
print("e) PROHIBICIONES DURAS")
print("   «ecoposada» : %d   ·   «data-modal» : %d" % (n_eco, n_modal))

# ================================ f) UN ARCHIVO, UN PAPEL (fotos repetidas)
usos = {}
for reg in orden_real:
    limpio_reg = sin_comentarios(regiones[reg])
    for m in re.finditer(r'<img\b[^>]*\bsrc="([^"]+)"', limpio_reg):
        usos.setdefault(m.group(1), []).append(reg)
repes = {k: v for k, v in usos.items() if len(v) > 1}
print()
print(raya)
print("f) UN ARCHIVO, UN PAPEL")
print("   <img> distintos en el <main>: %d   ·   repetidos: %d" % (len(usos), len(repes)))
for k in sorted(repes):
    print("     %-44s %s" % (k, repes[k]))

# El VIDEO se cuenta aparte y sin excepciones: un clip repetido se nota mucho
# mas que una foto, porque se MUEVE.
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
cuerpo = sin_comentarios(doc[i_body:])
hex_lit = re.findall(r'(?<!&)#[0-9a-fA-F]{3,8}\b(?=[;\'"\s)])', cuerpo)
print()
print(raya)
print("g) HIGIENE (dentro de <body>, sin comentarios)")
print("   !important            : %d" % cuenta(cuerpo, "!important"))
print("   atributos style=      : %d" % cuenta(cuerpo, r'\bstyle="'))
print("   font-family en el HTML: %d" % cuenta(cuerpo, "font-family"))
print("   colores literales     : %d %s" % (len(hex_lit), sorted(set(hex_lit))[:6]))
print("   Lorem Ipsum           : %d" % len(re.findall(r"lorem ipsum", doc, re.I)))

# ================== h) LA FOTO ES LA FOTO — CERO VELOS Y CERO FILTROS
# v14 · plan de rediseño v4, apartado 4.3.
#
# POR QUE EXISTE. Es la unica regla del sitio que sale de una orden textual
# del cliente repetida varias veces: «no quiere tonos oscuros en la pagina ni
# fotos oscuras, las originales y punto» y, en la correccion de septiembre,
# «es importante que la foto se aprecie bien, el texto NO debe tapar la
# foto». La alternativa correcta es el componente .placa (base.css §4b):
# placa OPACA, en su propio espacio, foto entera.
#
# QUE MIRA. Las hojas que el sitio en espanol envia de verdad: las enlazadas
# desde index.html y desde las paginas sueltas de la raiz. /en/ queda fuera
# a proposito — es la arquitectura v1 congelada y el plan v4 decide su
# futuro en la fase 6.
#
# CUATRO HALLAZGOS: VELO (selector de velo/scrim/overlay que pinta encima),
# FILTRO (filter: sobre la imagen), PSEUDO (degradado/mezcla en el pseudo de
# una foto), PLACA (una .placa posicionada, que iria encima de la imagen).
#
# LO QUE NO ES HALLAZGO: los degradados de mask-image (alfa, no color), los
# fondos de seccion debajo del contenido (no sobre una imagen), y el velo de
# lightbox/modales (superficies fuera del documento). Fuera por lista blanca
# o por el filtro de mascaras.
RE_TINTE = re.compile(r"(linear-gradient|radial-gradient|conic-gradient|backdrop-filter|mix-blend-mode)")
RE_VELO_SEL = re.compile(r"velo|scrim|overlay|veladura", re.I)
# v17 · `.inicio__portada-velo` es la UNICA excepcion de todo el sitio a
# esta regla, y es por orden explicita y textual del cliente: «rompe esa
# regla en el hero y ponlo como estaba antes» (despues de ver que la
# cartela solida de v16 tapaba media fotografia). El velo claro (--luz) del
# hero vuelve, ver el historial completo en el comentario de la regla en
# styles/sections/inicio.css. No es una excepcion tecnica ni un olvido: que
# quede aqui, a la vista, para que nadie la retire creyendo que es un
# hallazgo real.
RE_BLANCA = re.compile(r"lightbox|modal|velo-menu|menu__velo|dialogo|inicio__portada-velo", re.I)
RE_FOTO_SEL = re.compile(r"(^|[\s>+~])(img|video)\b|foto|imagen|media\b|clip|thumb", re.I)
RE_FILTRO = re.compile(r"(^|[^-\w])filter\s*:")
RE_PSEUDO = re.compile(r"::(before|after)")
RE_POSICION = re.compile(r"position\s*:\s*(absolute|fixed)")
RE_MASCARA = re.compile(r"[a-z-]*mask[a-z-]*\s*:[^;}]*", re.I)
RE_REGLA = re.compile(r"([^{}]+)\{([^{}]*)\}")

def sin_mascaras(css):
    return RE_MASCARA.sub("", css)

def hojas_del_sitio():
    hojas = set()
    for f in os.listdir(RAIZ):
        if not f.endswith(".html"):
            continue  # solo la raiz: /en/ fuera
        html = sin_comentarios(leer(os.path.join(RAIZ, f)))
        for m in re.finditer(r'<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"', html, re.I):
            if re.match(r"^(https?:)?//", m.group(1)):
                continue
            u = m.group(1).split("?")[0]
            u = re.sub(r"^\.?/", "", u)
            if os.path.exists(os.path.join(RAIZ, *u.split("/"))):
                hojas.add(u)
    return sorted(hojas)

hojas = hojas_del_sitio()
velos = []
for hoja in hojas:
    bruto = leer(os.path.join(RAIZ, *hoja.split("/"))).replace("\r\n", "\n")
    limpio = sin_mascaras(re.sub(r"/\*.*?\*/", "", bruto, flags=re.S))
    for m in RE_REGLA.finditer(limpio):
        sel = " ".join(m.group(1).split())
        regla = m.group(2)
        if not sel or sel[0] in "@%" or RE_BLANCA.search(sel):
            continue
        if RE_VELO_SEL.search(sel) and (RE_TINTE.search(regla) or re.search(r"background(-color|-image)?\s*:", regla)):
            velos.append(("VELO  ", hoja, sel[:62], "selector de velo que pinta encima"))
        if RE_FOTO_SEL.search(sel):
            if RE_FILTRO.search(regla):
                velos.append(("FILTRO", hoja, sel[:62], "filter: sobre la imagen"))
            if RE_TINTE.search(regla) and RE_PSEUDO.search(sel):
                velos.append(("PSEUDO", hoja, sel[:62], "degradado o mezcla en el pseudo de una foto"))
        if ".placa" in sel and RE_POSICION.search(regla):
            velos.append(("PLACA ", hoja, sel[:62], "placa posicionada: iria encima de la foto"))

print()
print(raya)
print("h) LA FOTO ES LA FOTO (cero velos, cero filtros sobre imagen)")
print("   hojas auditadas (las del sitio en espanol): %d" % len(hojas))
print("   hallazgos: %d" % len(velos))
for tipo, hoja, sel, motivo in velos:
    print("     %s  %s  ||  %s   <- %s" % (tipo, hoja, sel, motivo))

# --------------------------------------------------------------- resultado
res = {
  "orden_ok": orden_ok,
  "repeticionesRestantes": repeticiones,
  "enlacesRotos": rotos,
  "idsDuplicados": sorted(dup_ids),
  "fotosQueFaltan": faltan,
  "desbalance": desbalance,
  "ecoposada": n_eco, "dataModal": n_modal,
}
print()
print(raya)
todo = (res["orden_ok"] and not repeticiones and not rotos and not dup_ids
        and not faltan and not desbalance and not n_eco and not n_modal
        and not velos)
print("VEREDICTO GLOBAL: " + ("TODO LIMPIO" if todo else "HAY HALLAZGOS (ver arriba)"))
# Salida legible para un script que encadene: 0 limpio, 1 con hallazgos.
sys.exit(0 if todo else 1)
