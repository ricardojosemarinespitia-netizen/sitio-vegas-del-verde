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
    objetivosReveal.forEach(el => el.classList.add('is-visible'));
  } else {
    const io = new IntersectionObserver((entradas, obs) => {
      entradas.forEach(entrada => {
        if (entrada.isIntersecting) {
          entrada.target.classList.add('is-visible');
          obs.unobserve(entrada.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    objetivosReveal.forEach(el => io.observe(el));
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

  if (botonMenu && nav) {
    botonMenu.addEventListener('click', () => {
      const abierto = botonMenu.getAttribute('aria-expanded') === 'true';
      abierto ? cerrarMenu() : abrirMenu();
    });
    velo?.addEventListener('click', () => cerrarMenu());
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => cerrarMenu({ devolverFoco: false })));
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && botonMenu.getAttribute('aria-expanded') === 'true') cerrarMenu();
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
