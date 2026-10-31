/* Galerie : agrandissement en plein ecran (31.10.2026).
   Tout element [data-zoom] dans #galerie ouvre la visionneuse : image ou video,
   precedent / suivant, Echap, fleches, balayage tactile, focus rendu au declencheur.
   Le texte suit la langue de la page (<html lang>). */
(function () {
  var EN = (document.documentElement.lang || '').indexOf('en') === 0;
  var T = EN
    ? { titre: 'Gallery', fermer: 'Close', prec: 'Previous image', suiv: 'Next image' }
    : { titre: 'Galerie', fermer: 'Fermer', prec: 'Image précédente', suiv: 'Image suivante' };
  var dlg = null, items = [], idx = 0, retour = null, x0 = null;

  function css() {
    var s = document.createElement('style');
    s.textContent =
      '.gz{position:fixed;inset:0;width:100%;height:100%;max-width:none;max-height:none;margin:0;padding:0;border:0;background:rgba(5,5,5,.94);color:#fff;overflow:hidden}' +
      '.gz::backdrop{background:rgba(5,5,5,.94)}' +
      '.gz__scene{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:64px 16px 88px}' +
      '.gz__media{max-width:100%;max-height:100%;object-fit:contain;border-radius:12px;display:block}' +
      '.gz__btn{position:absolute;display:inline-flex;align-items:center;justify-content:center;width:52px;height:52px;border-radius:999px;border:1px solid rgba(255,255,255,.25);background:rgba(20,20,20,.75);color:#fff;cursor:pointer;font:600 26px/1 system-ui,sans-serif}' +
      '.gz__btn:hover,.gz__btn:focus-visible{background:#D4AF37;color:#0a0a0a;outline:none}' +
      '.gz__x{top:12px;right:12px}' +
      '.gz__prev{left:12px;top:50%;transform:translateY(-50%)}' +
      '.gz__next{right:12px;top:50%;transform:translateY(-50%)}' +
      '.gz__bas{pointer-events:none;position:absolute;left:0;right:0;bottom:0;padding:14px 76px 20px;text-align:center;font:500 14px/1.4 system-ui,sans-serif;color:#E6E6E6}' +
      '.gz__n{display:block;color:#F2D675;font-weight:700;margin-bottom:4px}' +
      '@media (max-width:640px){.gz__prev,.gz__next{top:auto;bottom:14px;transform:none}.gz__bas{padding:14px 72px 22px}}' +
      '[data-zoom]{cursor:zoom-in}' +
      '[data-zoom]:focus-visible{outline:3px solid #D4AF37;outline-offset:3px}';
    document.head.appendChild(s);
  }

  function construire() {
    dlg = document.createElement('dialog');
    dlg.className = 'gz';
    dlg.setAttribute('aria-label', T.titre);
    dlg.innerHTML =
      '<div class="gz__scene" data-scene></div>' +
      '<button type="button" class="gz__btn gz__x" aria-label="' + T.fermer + '" data-f>&times;</button>' +
      '<button type="button" class="gz__btn gz__prev" aria-label="' + T.prec + '" data-p>&#8249;</button>' +
      '<button type="button" class="gz__btn gz__next" aria-label="' + T.suiv + '" data-n>&#8250;</button>' +
      '<p class="gz__bas" aria-live="polite"><span class="gz__n" data-c></span><span data-l></span></p>';
    document.body.appendChild(dlg);
    dlg.querySelector('[data-f]').addEventListener('click', fermer);
    dlg.querySelector('[data-p]').addEventListener('click', function () { aller(-1); });
    dlg.querySelector('[data-n]').addEventListener('click', function () { aller(1); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg || e.target.hasAttribute('data-scene')) fermer(); });
    dlg.addEventListener('close', apresFermeture);
    dlg.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); aller(-1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); aller(1); }
    });
    dlg.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    dlg.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 50) aller(dx < 0 ? 1 : -1);
    });
  }

  function source(el) {
    var vid = el.getAttribute('data-video');
    if (vid) {
      var pi = el.querySelector('img');
      return { video: true, src: vid, poster: pi ? pi.getAttribute('src') : '', alt: pi ? pi.getAttribute('alt') : '' };
    }
    var m = el.matches('img,video') ? el : el.querySelector('img,video');
    if (!m) return null;
    var v = m.tagName === 'VIDEO';
    return { video: v, src: m.currentSrc || m.getAttribute('src'), poster: v ? m.getAttribute('poster') : '',
             alt: m.getAttribute('alt') || m.getAttribute('aria-label') || '' };
  }

  function afficher() {
    var it = items[idx], sc = dlg.querySelector('[data-scene]');
    sc.querySelectorAll('video').forEach(function (v) { v.pause(); });
    sc.innerHTML = '';
    var m;
    if (it.video) {
      m = document.createElement('video');
      m.controls = true; m.autoplay = true; m.muted = true; m.loop = true; m.playsInline = true;
      if (it.poster) m.poster = it.poster;
      m.setAttribute('aria-label', it.alt);
    } else {
      m = document.createElement('img');
      m.alt = it.alt;
      m.decoding = 'async';
    }
    m.className = 'gz__media';
    m.src = it.src;
    sc.appendChild(m);
    dlg.querySelector('[data-c]').textContent = (idx + 1) + ' / ' + items.length;
    dlg.querySelector('[data-l]').textContent = it.alt;
    var plusieurs = items.length > 1;
    dlg.querySelector('[data-p]').hidden = !plusieurs;
    dlg.querySelector('[data-n]').hidden = !plusieurs;
  }

  function aller(d) { idx = (idx + d + items.length) % items.length; afficher(); }

  function ouvrir(declencheur) {
    var gal = document.getElementById('galerie');
    if (!gal) return;
    var els = Array.prototype.slice.call(gal.querySelectorAll('[data-zoom]'));
    items = els.map(source).filter(Boolean);
    idx = Math.max(0, els.indexOf(declencheur));
    if (!items.length) return;
    if (!dlg) construire();
    retour = declencheur;
    gal.querySelectorAll('video').forEach(function (v) { v.pause(); });
    afficher();
    document.documentElement.style.overflow = 'hidden';
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
    dlg.querySelector('[data-f]').focus();
  }

  function fermer() { if (dlg.close) dlg.close(); else { dlg.removeAttribute('open'); apresFermeture(); } }

  function apresFermeture() {
    dlg.querySelectorAll('video').forEach(function (v) { v.pause(); });
    dlg.querySelector('[data-scene]').innerHTML = '';
    document.documentElement.style.overflow = '';
    if (retour && retour.focus) retour.focus();
  }

  css();
  document.addEventListener('click', function (e) {
    var z = e.target.closest && e.target.closest('#galerie [data-zoom]');
    if (!z) return;
    e.preventDefault();
    ouvrir(z);
  });
})();
