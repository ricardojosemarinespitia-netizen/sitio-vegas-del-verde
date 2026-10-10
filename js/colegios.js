/* colegios.js — sólo para colegios.html (salidas escolares · Alianza Educativa)
   v9 · Sustituye al de v8 (cifra que contaba y respaldo de la línea del
   margen): ese marcado ya no existe. Todo el movimiento vive en CSS.

   Pixel de Meta: app.js ya dispara «Contact» en todo clic de WhatsApp; aquí
   se suma «Lead» con el pase elegido (data-se-pase) y los UTM de la URL de
   llegada. Los UTM se guardan en sessionStorage (misma clave que
   yoga-pareja.js) para no perderlos si la persona navega por el sitio y
   vuelve. Todo storage va en try/catch (WebView de Instagram/Facebook,
   navegación privada). Sin JS los enlaces a WhatsApp funcionan igual. */
(function () {
  'use strict';

  var CLAVES = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  var utm = {};
  try { utm = JSON.parse(sessionStorage.getItem('vdv_utm') || '{}') || {}; } catch (e) { utm = {}; }
  var params = new URLSearchParams(location.search);
  if (CLAVES.some(function (k) { return params.has(k); })) {
    utm = {};
    CLAVES.forEach(function (k) { if (params.get(k)) utm[k] = params.get(k); });
    try { sessionStorage.setItem('vdv_utm', JSON.stringify(utm)); } catch (e) { /* sin storage */ }
  }

  document.addEventListener('click', function (ev) {
    var a = ev.target.closest('a[data-se-pase]');
    if (!a || (a.getAttribute('href') || '').indexOf('https://wa.me/') !== 0) return;
    if (typeof fbq !== 'function') return;
    var datos = { content_name: 'Salidas escolares', content_category: 'colegios', pase: a.getAttribute('data-se-pase') };
    Object.keys(utm).forEach(function (k) { datos[k] = utm[k]; });
    fbq('track', 'Lead', datos);
  });
})();
