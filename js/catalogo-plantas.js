/* Vegas del Verde — catalogo-plantas.html · buscador y abecedario.
 * Vanilla, sin dependencias. Sin JS la página es la lista completa y el
 * buscador ni se muestra (styles/sections/catalogo-plantas.css, .no-js).
 *
 * QUÉ HACE
 *  1. Filtra las fichas por lo que se escribe, ignorando tildes y caja
 *     (normalización NFD, el mismo criterio que herramientas/validar.js),
 *     buscando en nombre común y científico (data-busca, horneado en HTML).
 *  2. Esconde las estacas de letra cuyo tramo quedó vacío y atenúa su
 *     enlace en el abecedario.
 *  3. Recuento en voz alta (aria-live) y estado vacío con dos salidas.
 *  4. Marca en el abecedario la letra que se está viendo (aria-current),
 *     con un IntersectionObserver sobre las estacas.
 *  5. Escape vacía el campo. ?q= en la URL prellena la búsqueda (enlaces
 *     compartibles: catalogo-plantas.html?q=menta). */
(() => {
  'use strict';

  const raiz = document.getElementById('catalogo');
  if (!raiz) return;

  const campo = raiz.querySelector('.cat-buscar__campo');
  const fichas = [...raiz.querySelectorAll('.cat-ficha')];
  const letras = [...raiz.querySelectorAll('.cat-letra')];
  const enlacesAbc = [...raiz.querySelectorAll('.cat-abc__letra')];
  const cuenta = raiz.querySelector('.cat-cuenta');
  const vacio = raiz.querySelector('.cat-vacio');
  const vacioTermino = raiz.querySelector('[data-vacio-termino]');
  const total = fichas.length;

  const normaliza = s => s.toLowerCase().normalize('NFD').replace(/\p{Mn}/gu, '')
    .replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();

  const abcDe = letra => enlacesAbc.find(a => a.getAttribute('href') === '#' + letra.id);

  function filtrar(texto) {
    const q = normaliza(texto);
    const palabras = q ? q.split(' ') : [];
    let visibles = 0;

    for (const f of fichas) {
      const ok = palabras.every(p => f.dataset.busca.includes(p));
      f.hidden = !ok;
      if (ok) visibles += 1;
    }

    // Una estaca se ve si alguna ficha hasta la siguiente estaca se ve.
    for (const l of letras) {
      let hay = false;
      let el = l.nextElementSibling;
      while (el && !el.classList.contains('cat-letra')) {
        if (!el.hidden) { hay = true; break; }
        el = el.nextElementSibling;
      }
      l.hidden = !hay;
      const a = abcDe(l);
      if (a) {
        if (hay) a.removeAttribute('aria-disabled');
        else a.setAttribute('aria-disabled', 'true');
      }
    }

    if (cuenta) {
      cuenta.textContent = q
        ? `${visibles} de ${total} plantas`
        : `${total} plantas`;
    }
    if (vacio) {
      const sinNada = visibles === 0;
      vacio.dataset.visible = sinNada ? 'true' : 'false';
      if (sinNada && vacioTermino) vacioTermino.textContent = texto.trim();
    }
  }

  if (campo) {
    // La URL puede traer la búsqueda hecha (?q=...): se aplica antes del
    // primer pintado del filtro para que el enlace compartido abra ya
    // filtrado y no parpadee la lista completa.
    const q = new URLSearchParams(location.search).get('q');
    if (q) { campo.value = q; filtrar(q); }

    let temporizador = 0;
    campo.addEventListener('input', () => {
      clearTimeout(temporizador);
      // 120 ms: por debajo del umbral en que se nota la espera, por encima
      // del ritmo de tecleo — no se filtra 69 fichas a cada pulsación.
      temporizador = setTimeout(() => filtrar(campo.value), 120);
    });
    campo.addEventListener('keydown', e => {
      if (e.key === 'Escape' && campo.value) {
        campo.value = '';
        filtrar('');
      }
    });

    raiz.querySelectorAll('[data-borrar-busqueda]').forEach(b => {
      b.addEventListener('click', () => {
        campo.value = '';
        filtrar('');
        campo.focus();
      });
    });

    // El formulario no envía a ningún lado: Enter sólo confirma el filtro.
    const form = campo.closest('form');
    if (form) form.addEventListener('submit', e => { e.preventDefault(); filtrar(campo.value); });
  }

  /* ---- La letra que se está viendo ------------------------------------ */
  if ('IntersectionObserver' in window && letras.length) {
    let actual = null;
    const marcar = l => {
      if (l === actual) return;
      actual = l;
      enlacesAbc.forEach(a => a.removeAttribute('aria-current'));
      const a = abcDe(l);
      if (a) a.setAttribute('aria-current', 'true');
    };
    // La franja de observación es una línea justo bajo la barra pegajosa:
    // la estaca «actual» es la última que la ha cruzado hacia arriba.
    const io = new IntersectionObserver(entradas => {
      for (const e of entradas) {
        if (e.isIntersecting) marcar(e.target);
      }
    }, { rootMargin: '-25% 0px -65% 0px', threshold: 0 });
    letras.forEach(l => io.observe(l));
  }
})();
