/* yoga-pareja.js — sólo para yoga-en-pareja.html
   1) Fechas: pasada la hora de cierre de una sesión (data-yp-hasta), su tarjeta
      pasa a «Sesión finalizada» sola, sin editar a mano. Sin JS se ven las dos.
   2) CTA del hero y del cierre (data-yp-fecha="auto"): apuntan al WhatsApp de
      la PRÓXIMA sesión vigente. Sin JS bajan a #fechas.
   3) Pixel de Meta: app.js ya dispara «Contact» en todo clic de WhatsApp; aquí
      se suma «Lead» con la sesión elegida y los UTM de la URL de llegada.
      Los UTM se guardan en sessionStorage para no perderlos si la persona
      navega a otra página del sitio y vuelve. Todo storage en try/catch
      (WebView de Instagram/Facebook, navegación privada). */
(function () {
  'use strict';

  var CLAVES = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  var utm = {};
  try { utm = JSON.parse(sessionStorage.getItem('vdv_utm') || '{}') || {}; } catch (e) { utm = {}; }
  var params = new URLSearchParams(location.search);
  var hayNuevos = CLAVES.some(function (k) { return params.has(k); });
  if (hayNuevos) {
    utm = {};
    CLAVES.forEach(function (k) { if (params.get(k)) utm[k] = params.get(k); });
    try { sessionStorage.setItem('vdv_utm', JSON.stringify(utm)); } catch (e) { /* sin storage */ }
  }

  var ahora = Date.now();
  var vigente = null;
  document.querySelectorAll('[data-yp-hasta]').forEach(function (tarjeta) {
    var hasta = Date.parse(tarjeta.getAttribute('data-yp-hasta') || '');
    if (!Number.isNaN(hasta) && ahora > hasta) {
      tarjeta.classList.add('esta-finalizada');
      var cta = tarjeta.querySelector('.yp__fecha-cta');
      if (cta) cta.hidden = true;
      var fin = tarjeta.querySelector('.yp__fecha-fin');
      if (fin) fin.hidden = false;
    } else if (!vigente) {
      vigente = tarjeta;
    }
  });

  if (vigente) {
    var destino = vigente.querySelector('.yp__fecha-cta');
    var dia = vigente.querySelector('.yp__fecha-num');
    document.querySelectorAll('[data-yp-fecha="auto"]').forEach(function (a) {
      a.href = destino.href;
      a.target = '_blank';
      a.rel = 'noopener';
      a.setAttribute('data-yp-sesion', destino.getAttribute('data-yp-sesion'));
      var texto = a.querySelector('.yp__cta-texto');
      // en/couples-yoga.html declara su propio prefijo (data-yp-prefijo).
      var prefijo = a.getAttribute('data-yp-prefijo') || 'Aparta el sábado ';
      if (texto && dia) texto.textContent = prefijo + dia.textContent;
    });
  }

  document.addEventListener('click', function (ev) {
    var a = ev.target.closest('a[data-yp-sesion]');
    if (!a || a.getAttribute('href').indexOf('https://wa.me/') !== 0) return;
    if (typeof fbq !== 'function') return;
    var datos = { content_name: 'Yoga en Pareja', content_category: 'evento', sesion: a.getAttribute('data-yp-sesion') };
    Object.keys(utm).forEach(function (k) { datos[k] = utm[k]; });
    fbq('track', 'Lead', datos);
  });
})();
