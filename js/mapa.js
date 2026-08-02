/* ==========================================================================
   VEGAS DEL VERDE — js/mapa.js
   Mapa satelital "tipo Google Earth" de la sección #ubicacion.

   Cómo cargarlo:  <script src="js/mapa.js" defer></script>  al final del <body>.
   No necesita nada en el <head>: Leaflet (CSS + JS) se pide al CDN de unpkg en
   tiempo de ejecución, con integrity/SRI y crossorigin.

   Comportamiento:
   1. Al acercarse la sección (600 px antes) se carga Leaflet y se construye el
      mapa en zoom 6 sobre Colombia, para que las teselas ya estén tibias.
   2. Cuando el mapa entra de verdad en pantalla se ejecuta el vuelo
      cinematográfico flyTo() hasta el predio, una sola vez.
   3. Con prefers-reduced-motion: reduce se salta directo al encuadre final.
   4. Si el CDN no responde (sin red, bloqueado, caído) o Leaflet falla, no se
      toca nada: la vista aérea de img/mapa-ubicacion.jpg — que es lo que se ve
      por defecto — se queda, y se muestra el aviso correspondiente. Los botones
      de Google Maps y Waze son enlaces normales y funcionan siempre.
   ========================================================================== */

(function () {
  "use strict";

  /* ---- Datos fijos (BRIEF.md) -------------------------------------------- */
  var COORDENADAS = [7.0574425, -73.1144128];
  var ZOOM_DESTINO = 17;
  var ZOOM_PARTIDA = 6;
  var CENTRO_PARTIDA = [4.7, -73.9]; /* Colombia en cuadro, Santander arriba   */

  var CDN_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
  var CDN_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
  var SRI_CSS = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
  var SRI_JS = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";

  var TESELAS =
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
  var ATRIBUCION = "Tiles &copy; Esri";

  var ESPERA_MAXIMA = 9000; /* ms antes de dar el CDN por perdido             */

  /* ---- Nodos -------------------------------------------------------------- */
  var figura = document.querySelector("[data-mapa]");
  if (!figura) {
    return;
  }

  var lienzo = figura.querySelector("[data-mapa-lienzo]");
  var credito = figura.querySelector("[data-mapa-credito]");
  var notaRespaldo = figura.querySelector("[data-mapa-respaldo-nota]");
  var aviso = figura.querySelector("[data-mapa-aviso]");
  var botonActivar = figura.querySelector("[data-mapa-activar]");
  var botonRepetir = document.querySelector("[data-mapa-repetir]");

  /* ---- Estado ------------------------------------------------------------- */
  var mapa = null;
  var promesaLeaflet = null;
  var arrancado = false;
  var listo = false;
  var vueloPedido = false;

  /* ======================================================================
     UTILIDADES
     ====================================================================== */
  function prefiereMenosMovimiento() {
    return (
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  function esTactil() {
    return (
      typeof window.matchMedia === "function" &&
      window.matchMedia("(hover: none) and (pointer: coarse)").matches
    );
  }

  /* Lee un token del :root. Devuelve el texto en bruto ("2.25rem", "4500ms"). */
  function token(nombre) {
    try {
      return window
        .getComputedStyle(document.documentElement)
        .getPropertyValue(nombre)
        .trim();
    } catch (e) {
      return "";
    }
  }

  /* La duración sale del token --dur-vuelo (4500 ms), no de un número suelto. */
  function duracionVuelo() {
    var bruto = token("--dur-vuelo");
    var valor = parseFloat(bruto);
    if (!isFinite(valor) || valor <= 0) {
      return 4.5;
    }
    return bruto.slice(-2) === "ms" ? valor / 1000 : valor;
  }

  /* Los tamaños del pin también salen de tokens (--tam-pin, --tam-pin-punta):
     Leaflet necesita píxeles, así que se convierte rem → px con el tamaño de
     letra raíz. Si el token falta o no se entiende, se usa el respaldo.     */
  function medidaPx(nombre, respaldo) {
    var bruto = token(nombre);
    var valor = parseFloat(bruto);
    if (!isFinite(valor) || valor <= 0) {
      return respaldo;
    }
    if (bruto.slice(-3) === "rem" || bruto.slice(-2) === "em") {
      var raiz = parseFloat(
        window.getComputedStyle(document.documentElement).fontSize
      );
      return valor * (isFinite(raiz) && raiz > 0 ? raiz : 16);
    }
    return valor;
  }

  function cargarHoja(url, sri) {
    return new Promise(function (resolver, rechazar) {
      var enlace = document.createElement("link");
      enlace.rel = "stylesheet";
      enlace.href = url;
      enlace.integrity = sri;
      enlace.crossOrigin = "anonymous";
      enlace.referrerPolicy = "no-referrer";
      enlace.onload = function () {
        resolver();
      };
      enlace.onerror = function () {
        rechazar(new Error("No se pudo cargar la hoja de estilos de Leaflet"));
      };
      /* Se inserta al principio del <head> para que ubicacion.css, que va
         después, siga mandando en la cascada sin recurrir a !important. */
      document.head.insertBefore(enlace, document.head.firstChild);
    });
  }

  function cargarGuion(url, sri) {
    return new Promise(function (resolver, rechazar) {
      var guion = document.createElement("script");
      guion.src = url;
      guion.async = true;
      guion.integrity = sri;
      guion.crossOrigin = "anonymous";
      guion.referrerPolicy = "no-referrer";
      guion.onload = function () {
        resolver();
      };
      guion.onerror = function () {
        rechazar(new Error("No se pudo cargar Leaflet"));
      };
      document.head.appendChild(guion);
    });
  }

  function cargarLeaflet() {
    if (window.L && window.L.map) {
      return Promise.resolve();
    }
    if (promesaLeaflet) {
      return promesaLeaflet;
    }

    promesaLeaflet = new Promise(function (resolver, rechazar) {
      var cerrado = false;

      var reloj = window.setTimeout(function () {
        if (cerrado) {
          return;
        }
        cerrado = true;
        rechazar(new Error("Tiempo de espera agotado esperando al CDN"));
      }, ESPERA_MAXIMA);

      function terminar(fn, argumento) {
        window.clearTimeout(reloj);
        if (cerrado) {
          return;
        }
        cerrado = true;
        fn(argumento);
      }

      Promise.all([cargarHoja(CDN_CSS, SRI_CSS), cargarGuion(CDN_JS, SRI_JS)])
        .then(function () {
          if (window.L && window.L.map) {
            terminar(resolver);
          } else {
            terminar(rechazar, new Error("Leaflet cargó pero no expuso L.map"));
          }
        })
        .catch(function (error) {
          terminar(rechazar, error);
        });
    });

    return promesaLeaflet;
  }

  /* ======================================================================
     ESTADOS DE LA SECCIÓN
     ====================================================================== */
  function activarRespaldo() {
    if (aviso) {
      aviso.hidden = false;
    }
    if (notaRespaldo) {
      notaRespaldo.hidden = true;
    }
    if (botonRepetir) {
      botonRepetir.hidden = true;
    }
    if (botonActivar) {
      botonActivar.hidden = true;
    }
    /* Un lienzo vacío no aporta nada a un lector de pantalla. */
    if (lienzo) {
      lienzo.removeAttribute("role");
      lienzo.removeAttribute("aria-label");
      lienzo.setAttribute("aria-hidden", "true");
    }
  }

  function marcarInteractivo() {
    figura.classList.add("ubi-mapa--interactivo");
    if (credito) {
      credito.hidden = false;
    }
    if (aviso) {
      aviso.hidden = true;
    }
    if (botonRepetir) {
      botonRepetir.hidden = false;
    }
    if (botonActivar && esTactil()) {
      botonActivar.hidden = false;
    }
  }

  /* ======================================================================
     MAPA
     ====================================================================== */
  function abrirGlobo() {
    if (mapa && mapa.__marcadorVegas) {
      mapa.__marcadorVegas.openPopup();
    }
  }

  function construirMapa() {
    var tactil = esTactil();

    mapa = L.map(lienzo, {
      center: CENTRO_PARTIDA,
      zoom: ZOOM_PARTIDA,
      minZoom: 4,
      maxZoom: 19,
      zoomControl: false,
      /* La rueda del ratón nunca secuestra el scroll de la página. */
      scrollWheelZoom: false,
      /* En táctil el arrastre empieza apagado y lo enciende el usuario. */
      dragging: !tactil,
      touchZoom: !tactil,
      doubleClickZoom: !tactil,
      zoomAnimationThreshold: 20,
      attributionControl: true
    });

    L.control
      .zoom({
        position: "bottomright",
        zoomInTitle: "Acercar el mapa",
        zoomOutTitle: "Alejar el mapa"
      })
      .addTo(mapa);

    mapa.attributionControl.setPrefix(
      '<a href="https://leafletjs.com/" target="_blank" rel="noopener">Leaflet</a>'
    );

    L.tileLayer(TESELAS, {
      attribution: ATRIBUCION,
      maxZoom: 19,
      maxNativeZoom: 19
    }).addTo(mapa);

    /* PIN PEQUEÑO Y DISCRETO. La foto satelital manda: el pin señala y se
       aparta. El ancho sale de --tam-pin (36 px) con tope duro de 40 px, y
       el alto añade la punta (--tam-pin-punta). El ancla va en la PUNTA
       —no en el centro— para que el vértice caiga sobre la coordenada.    */
    var anchoPin = Math.min(40, Math.round(medidaPx("--tam-pin", 36)));
    var puntaPin = Math.round(medidaPx("--tam-pin-punta", 8));
    var altoPin = anchoPin + puntaPin;

    var icono = L.divIcon({
      className: "ubi-pin-caja",
      iconSize: [anchoPin, altoPin],
      iconAnchor: [Math.round(anchoPin / 2), altoPin],
      popupAnchor: [0, -altoPin],
      html:
        '<span class="ubi-pin">' +
        '<span class="ubi-pin__halo"></span>' +
        '<span class="ubi-pin__disco">' +
        '<img src="img/logo/simbolo-vegas.png" width="512" height="512" alt="" decoding="async" />' +
        "</span></span>"
    });

    var marcador = L.marker(COORDENADAS, {
      icon: icono,
      title: "Vegas del Verde",
      alt: "Ubicación de Vegas del Verde",
      riseOnHover: true,
      keyboard: true
    }).addTo(mapa);

    marcador.bindPopup(
      '<span class="ubi-popup__titulo">Vegas del Verde</span>' +
        "Vereda Río Frío, 500 mts sobre la vía Carabineros.<br />" +
        "Floridablanca, Santander." +
        '<br /><a href="https://www.google.com/maps/dir/?api=1&amp;destination=7.0574425,-73.1144128"' +
        ' target="_blank" rel="noopener">Cómo llegar</a>',
      { className: "ubi-popup", autoPan: false }
    );

    mapa.__marcadorVegas = marcador;
    mapa.invalidateSize(false);
  }

  function volar() {
    if (!mapa) {
      return;
    }
    mapa.closePopup();

    if (prefiereMenosMovimiento()) {
      mapa.setView(COORDENADAS, ZOOM_DESTINO, { animate: false });
      abrirGlobo();
      return;
    }

    mapa.setView(CENTRO_PARTIDA, ZOOM_PARTIDA, { animate: false });
    mapa.once("moveend", abrirGlobo);
    mapa.flyTo(COORDENADAS, ZOOM_DESTINO, {
      duration: duracionVuelo(),
      easeLinearity: 0.2
    });
  }

  function arrancar() {
    if (arrancado) {
      return;
    }
    arrancado = true;

    if (!window.Promise || !lienzo) {
      activarRespaldo();
      return;
    }

    cargarLeaflet()
      .then(function () {
        construirMapa();
        listo = true;
        marcarInteractivo();
        if (vueloPedido) {
          volar();
        }
      })
      .catch(function () {
        activarRespaldo();
      });
  }

  function pedirVuelo() {
    if (vueloPedido) {
      return;
    }
    vueloPedido = true;
    if (listo) {
      volar();
    }
  }

  /* ======================================================================
     DISPARADORES
     ====================================================================== */
  if ("IntersectionObserver" in window) {
    /* 1) Precarga: 600 px antes de que el mapa entre en pantalla. */
    var observadorCarga = new IntersectionObserver(
      function (entradas) {
        var i;
        for (i = 0; i < entradas.length; i += 1) {
          if (entradas[i].isIntersecting) {
            observadorCarga.disconnect();
            arrancar();
          }
        }
      },
      { rootMargin: "600px 0px" }
    );
    observadorCarga.observe(figura);

    /* 2) Vuelo: cuando el mapa está de verdad a la vista. Una sola vez. */
    var observadorVuelo = new IntersectionObserver(
      function (entradas) {
        var i;
        for (i = 0; i < entradas.length; i += 1) {
          if (entradas[i].isIntersecting) {
            observadorVuelo.disconnect();
            pedirVuelo();
          }
        }
      },
      { threshold: 0.4 }
    );
    observadorVuelo.observe(figura);
  } else {
    /* Navegador sin IntersectionObserver: se monta y se vuela sin más. */
    arrancar();
    pedirVuelo();
  }

  /* ---- Repetir vuelo ------------------------------------------------------ */
  if (botonRepetir) {
    botonRepetir.addEventListener("click", function () {
      if (listo) {
        volar();
      }
    });
  }

  /* ---- Activación táctil --------------------------------------------------- */
  if (botonActivar) {
    botonActivar.addEventListener("click", function () {
      if (!mapa) {
        return;
      }
      mapa.dragging.enable();
      mapa.touchZoom.enable();
      mapa.doubleClickZoom.enable();
      botonActivar.hidden = true;
    });
  }
})();
