/* Vegas del Verde — comportamiento global del sitio. Vanilla JS, sin dependencias. */
(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------------
     Año dinámico en el pie
     --------------------------------------------------------------------- */
  document.querySelectorAll('[data-anio]').forEach(el => {
    el.textContent = new Date().getFullYear();
  });

  /* ---------------------------------------------------------------------
     Revelado por scroll
     --------------------------------------------------------------------- */
  const objetivosReveal = document.querySelectorAll('.reveal, .reveal-secuencia');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    objetivosReveal.forEach(el => el.classList.add('visible'));
  } else {
    const io = new IntersectionObserver((entradas, obs) => {
      entradas.forEach(entrada => {
        if (entrada.isIntersecting) {
          entrada.target.classList.add('visible');
          obs.unobserve(entrada.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    objetivosReveal.forEach(el => io.observe(el));
  }

  /* ---------------------------------------------------------------------
     Iconos que se dibujan al llegar a su sección

     AQUÍ SÓLO VIVE EL DISPARADOR. La clase `icono-traza` y los `pathLength`
     de cada forma están escritos en el propio HTML, no se ponen desde aquí.
     Es deliberado y arregla un parpadeo real: este archivo va con `defer`,
     así que corre DESPUÉS del primer pintado. Cuando era él quien marcaba
     los iconos, el navegador alcanzaba a pintarlos enteros y un instante
     después desaparecían de golpe para empezar a dibujarse. Escrito en el
     HTML, el trazo nace oculto y no hay un solo fotograma de más.

     Quien los marca es herramientas/hornear-trazos.js, que reconoce los
     iconos por su firma —viewBox de 24, sin relleno, trazo heredado— y deja
     fuera las formas decorativas grandes (la orla, el cauce, la cresta) y
     los glifos rellenos como el de WhatsApp.

     El observador vigila la SECCIÓN y no el icono: el encargo es que al
     entrar en esa parte arranquen todas a la vez.
     --------------------------------------------------------------------- */
  const contenedoresTraza = new Set();
  document.querySelectorAll('.icono-traza').forEach(svg => {
    const caja = svg.closest('section, .pv-pieza, footer, header');
    if (caja) contenedoresTraza.add(caja);
  });

  if (reduceMotion || !('IntersectionObserver' in window)) {
    contenedoresTraza.forEach(caja => caja.classList.add('traza-lista'));
  } else {
    // A diferencia del revelado de contenido, este NO se desobserva: el
    // dibujado se repite cada vez que la sección vuelve a entrar. Al salir
    // se rearma quitando la clase, así que bajar a la tercera y volver a la
    // segunda vuelve a dibujar sus figuras. Es un adorno de marca, no una
    // entrada de contenido: repetirlo no molesta, y verlo una sola vez en
    // toda la visita desperdicia el gesto.
    const ioTraza = new IntersectionObserver(entradas => {
      entradas.forEach(entrada => {
        const caja = entrada.target;
        if (entrada.isIntersecting) {
          caja.classList.add('traza-lista');
          return;
        }
        // Al salir se rearma DE GOLPE, con la transición apagada: si se deja
        // des-dibujar durante 2,4 s, quien vuelve antes lo encuentra a medias
        // y la siguiente entrada sale distinta. Así el punto de partida es
        // siempre el mismo y el dibujado se repite idéntico.
        caja.classList.add('rearmando');
        caja.classList.remove('traza-lista');
        void caja.offsetHeight;
        caja.classList.remove('rearmando');
      });
    }, { threshold: 0, rootMargin: '0px 0px -15% 0px' });
    contenedoresTraza.forEach(caja => ioTraza.observe(caja));
  }

  /* ---------------------------------------------------------------------
     La mariposa del clic

     Al pulsar un CTA de conversión nace una mariposa en el punto del clic
     y sube hasta perderse. SÓLO en los CTA: cuando salía con cualquier
     enlace o botón —menú, lightbox, flechas del visor, botones del mapa—
     el gesto se banalizaba a los tres clics. Reservada al momento de
     decidirse («Reserva tu escape», «Quiero este plan»…), vuelve a
     significar algo. Es un guiño, no una confirmación: por eso no se
     dispara con teclado ni con Enter en un botón —sólo con el clic de
     verdad—, para no competir con el foco ni interferir con lectores de
     pantalla. Bajo prefers-reduced-motion no se crea ningún elemento.

     Qué cuenta como CTA de conversión: en este sitio TODOS convergen en
     WhatsApp (CONTRATO-V2 §6), así que el reconocimiento es doble y por
     selector, nunca por el texto del botón:
       · `.btn-whatsapp` — los botones de WhatsApp, incluido el submit del
         formulario de Ubicación (que es <button>, sin href).
       · `a[href^="https://wa.me/"]` — los enlaces directos a WhatsApp que
         no son botón: los «Quiero este plan» de Espacios van como
         `.enlace-flecha`, y por el atributo se reconocen sin depender de
         la clase con que cada sección los vista.
     Los `.btn-primario`/`.btn-secundario` (Google Maps, Waze, «Volver al
     inicio», condiciones) quedan fuera a propósito: son navegación.

     Las siete siluetas de la lista son un muestreo de las 21 del enjambre
     de img/plan-vecino/: no todas, porque a este tamaño varias formas casi
     idénticas no se distinguen entre sí y sólo suman peso a la lista.
     --------------------------------------------------------------------- */
  if (!reduceMotion) {
    const SILUETAS = [1, 3, 6, 8, 10, 14, 16];
    const SELECTOR_CTA = '.btn-whatsapp, a[href^="https://wa.me/"]';
    document.addEventListener('click', evento => {
      const disparador = evento.target.closest(SELECTOR_CTA);
      if (!disparador) return;
      const n = SILUETAS[Math.floor(Math.random() * SILUETAS.length)];
      const num = n < 10 ? '0' + n : String(n);
      const mariposa = document.createElement('img');
      mariposa.src = 'img/plan-vecino/mariposa-' + num + '.png';
      mariposa.alt = '';
      mariposa.setAttribute('aria-hidden', 'true');
      mariposa.decoding = 'async';
      mariposa.className = 'clic-mariposa';
      mariposa.style.left = evento.clientX + 'px';
      mariposa.style.top = evento.clientY + 'px';
      // Deriva y giro propios por instancia, para que dos clics seguidos no
      // dibujen la misma trayectoria.
      mariposa.style.setProperty('--clic-deriva', Math.round((Math.random() - 0.5) * 90) + 'px');
      mariposa.style.setProperty('--clic-giro', Math.round((Math.random() - 0.5) * 50) + 'deg');
      document.body.appendChild(mariposa);
      requestAnimationFrame(() => requestAnimationFrame(() => mariposa.classList.add('sube')));
      const quitar = () => mariposa.remove();
      mariposa.addEventListener('transitionend', quitar, { once: true });
      setTimeout(quitar, 1700); // red de seguridad si la transición no dispara
    });
  }

  /* ---------------------------------------------------------------------
     Menú móvil
     --------------------------------------------------------------------- */
  const botonMenu = document.querySelector('[data-menu]');
  const nav = document.getElementById('nav-principal');
  const velo = document.querySelector('[data-cerrar-menu]');

  function abrirMenu() {
    botonMenu.setAttribute('aria-expanded', 'true');
    nav.classList.add('nav--abierto');
    document.body.classList.add('menu-abierto');
    const primerEnlace = nav.querySelector('.nav__enlace');
    if (primerEnlace) primerEnlace.focus();
  }
  function cerrarMenu({ devolverFoco = true } = {}) {
    botonMenu.setAttribute('aria-expanded', 'false');
    nav.classList.remove('nav--abierto');
    document.body.classList.remove('menu-abierto');
    if (devolverFoco) botonMenu.focus();
  }

  /* El panel abierto TAPA el resto de la página: ocupa min(21rem, 84vw) desde
     el borde derecho y el velo cubre lo que queda. Con el ratón nada de lo de
     atrás es alcanzable, pero el foco del teclado sí se iba: desde el último
     enlace del panel Tab entraba en los ~116 controles ocultos, y Shift+Tab
     desde el primero se escapaba hacia atrás por la marca y «Saltar al
     contenido». Se cierra el ciclo igual que en el lightbox (más abajo): el
     foco da la vuelta dentro de #nav-principal y la salida es Escape, el velo
     o pulsar un enlace. */
  const FOCABLES = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  function focablesDelMenu() {
    return [...nav.querySelectorAll(FOCABLES)].filter(el => el.getClientRects().length);
  }

  if (botonMenu && nav) {
    botonMenu.addEventListener('click', () => {
      const abierto = botonMenu.getAttribute('aria-expanded') === 'true';
      abierto ? cerrarMenu() : abrirMenu();
    });
    velo?.addEventListener('click', () => cerrarMenu());
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => cerrarMenu({ devolverFoco: false })));
    document.addEventListener('keydown', e => {
      if (botonMenu.getAttribute('aria-expanded') !== 'true') return;
      if (e.key === 'Escape') { cerrarMenu(); return; }
      if (e.key !== 'Tab') return;
      const focables = focablesDelMenu();
      if (!focables.length) return;
      const primero = focables[0];
      const ultimo = focables[focables.length - 1];
      const dentro = nav.contains(document.activeElement);
      if (e.shiftKey && (document.activeElement === primero || !dentro)) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && (document.activeElement === ultimo || !dentro)) {
        e.preventDefault();
        primero.focus();
      }
    });
  }

  /* ---------------------------------------------------------------------
     Cabecera compacta + enlace activo según sección visible
     --------------------------------------------------------------------- */
  const cabecera = document.querySelector('[data-cabecera]');
  if (cabecera) {
    const alUmbral = () => window.scrollY > 24;
    let compactaAntes = alUmbral();
    cabecera.classList.toggle('cabecera--compacta', compactaAntes);
    window.addEventListener('scroll', () => {
      const compactaAhora = alUmbral();
      if (compactaAhora !== compactaAntes) {
        cabecera.classList.toggle('cabecera--compacta', compactaAhora);
        compactaAntes = compactaAhora;
      }
    }, { passive: true });
  }

  const enlacesNav = document.querySelectorAll('.nav__enlace');
  const secciones = [...enlacesNav]
    .map(a => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);

  if (secciones.length && 'IntersectionObserver' in window) {
    const marcarActivo = id => {
      enlacesNav.forEach(a => {
        const esActivo = a.getAttribute('href') === `#${id}`;
        a.classList.toggle('nav__enlace--activo', esActivo);
        if (esActivo) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    };
    const ioNav = new IntersectionObserver(entradas => {
      const visible = entradas
        .filter(e => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) marcarActivo(visible.target.id);
    }, { rootMargin: '-40% 0px -50% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] });
    secciones.forEach(s => ioNav.observe(s));
  }

  /* ---------------------------------------------------------------------
     Scroll suave compensando la altura de la cabecera fija
     --------------------------------------------------------------------- */
  document.querySelectorAll('a[href^="#"]:not([href="#"])').forEach(enlace => {
    enlace.addEventListener('click', e => {
      const destino = document.querySelector(enlace.getAttribute('href'));
      if (!destino) return;
      e.preventDefault();
      const altoCabecera = cabecera ? cabecera.offsetHeight : 0;
      const y = destino.getBoundingClientRect().top + window.scrollY - altoCabecera - 12;
      window.scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' });
      destino.setAttribute('tabindex', '-1');
      destino.focus({ preventScroll: true });
    });
  });

  /* ---------------------------------------------------------------------
     Contadores animados — data-contador="101"
     --------------------------------------------------------------------- */
  const contadores = document.querySelectorAll('[data-contador]');
  function animarContador(el) {
    const destino = parseInt(el.getAttribute('data-contador'), 10);
    if (Number.isNaN(destino)) return;
    if (reduceMotion) { el.textContent = destino; return; }
    const duracion = 1400;
    const inicio = performance.now();
    function paso(ahora) {
      const t = Math.min(1, (ahora - inicio) / duracion);
      const ease = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(destino * ease);
      if (t < 1) requestAnimationFrame(paso);
      else el.textContent = destino;
    }
    requestAnimationFrame(paso);
  }
  if (contadores.length && 'IntersectionObserver' in window) {
    const ioCont = new IntersectionObserver((entradas, obs) => {
      entradas.forEach(entrada => {
        if (entrada.isIntersecting) {
          animarContador(entrada.target);
          obs.unobserve(entrada.target);
        }
      });
    }, { threshold: 0.6 });
    contadores.forEach(el => ioCont.observe(el));
  } else {
    contadores.forEach(el => { el.textContent = el.getAttribute('data-contador'); });
  }

  /* ---------------------------------------------------------------------
     Lightbox global compartido — [data-lightbox="<grupo>"]
     --------------------------------------------------------------------- */
  const disparadores = [...document.querySelectorAll('[data-lightbox]')];
  if (disparadores.length) {
    const grupos = new Map();
    disparadores.forEach((btn, indice) => {
      const grupo = btn.getAttribute('data-lightbox');
      if (!grupos.has(grupo)) grupos.set(grupo, []);
      grupos.get(grupo).push(btn);
      btn.dataset.lightboxIndice = grupos.get(grupo).length - 1;
    });

    const overlay = document.createElement('div');
    overlay.className = 'lightbox';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Visor de imágenes');
    overlay.hidden = true;
    overlay.innerHTML = `
      <div class="lightbox__velo" data-lightbox-cerrar></div>
      <div class="lightbox__marco">
        <button type="button" class="lightbox__cerrar" data-lightbox-cerrar aria-label="Cerrar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
        </button>
        <button type="button" class="lightbox__nav lightbox__nav--prev" data-lightbox-prev aria-label="Foto anterior">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>
        </button>
        <button type="button" class="lightbox__nav lightbox__nav--next" data-lightbox-next aria-label="Foto siguiente">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>
        </button>
        <img class="lightbox__img" src="" alt="" />
        <p class="lightbox__pie"></p>
      </div>`;
    document.body.appendChild(overlay);

    const imgEl = overlay.querySelector('.lightbox__img');
    const pieEl = overlay.querySelector('.lightbox__pie');
    let grupoActivo = null;
    let indiceActivo = 0;
    let disparadorQueAbrio = null;

    function datosDe(btn) {
      const img = btn.querySelector('img');
      return {
        src: btn.getAttribute('data-lightbox-src') || img?.currentSrc || img?.src || '',
        caption: btn.getAttribute('data-lightbox-caption') || img?.alt || '',
      };
    }

    function mostrar(indice) {
      const lista = grupos.get(grupoActivo);
      indiceActivo = (indice + lista.length) % lista.length;
      const { src, caption } = datosDe(lista[indiceActivo]);
      imgEl.src = src;
      imgEl.alt = caption;
      pieEl.textContent = caption;
      const varios = lista.length > 1;
      overlay.querySelector('.lightbox__nav--prev').hidden = !varios;
      overlay.querySelector('.lightbox__nav--next').hidden = !varios;
    }

    function abrir(btn) {
      grupoActivo = btn.getAttribute('data-lightbox');
      disparadorQueAbrio = btn;
      overlay.hidden = false;
      document.body.classList.add('lightbox-abierto');
      mostrar(parseInt(btn.dataset.lightboxIndice, 10) || 0);
      overlay.querySelector('.lightbox__cerrar').focus();
    }
    function cerrar() {
      overlay.hidden = true;
      document.body.classList.remove('lightbox-abierto');
      imgEl.src = '';
      disparadorQueAbrio?.focus();
    }

    disparadores.forEach(btn => btn.addEventListener('click', () => abrir(btn)));
    overlay.querySelectorAll('[data-lightbox-cerrar]').forEach(el => el.addEventListener('click', cerrar));
    overlay.querySelector('[data-lightbox-prev]').addEventListener('click', () => mostrar(indiceActivo - 1));
    overlay.querySelector('[data-lightbox-next]').addEventListener('click', () => mostrar(indiceActivo + 1));

    document.addEventListener('keydown', e => {
      if (overlay.hidden) return;
      if (e.key === 'Escape') cerrar();
      if (e.key === 'ArrowLeft') mostrar(indiceActivo - 1);
      if (e.key === 'ArrowRight') mostrar(indiceActivo + 1);
      if (e.key === 'Tab') {
        const focables = overlay.querySelectorAll('button');
        const primero = focables[0], ultimo = focables[focables.length - 1];
        if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
        else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
      }
    });
  }
})();
