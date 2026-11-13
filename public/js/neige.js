/* ==========================================================================
   Neige de l'offre d'hiver (accueil)
   --------------------------------------------------------------------------
   Flocons en Canvas 2D dans chaque element [data-neige] : chute lente, derive
   laterale sinusoidale, trois profondeurs (taille, vitesse, opacite).
   Garde-fous : surface plafonnee en pixels, densite reduite sur telephone,
   pause hors ecran et onglet cache, rien du tout si l'utilisateur demande
   moins d'animations. Aucune dependance, aucun appel reseau.
   ========================================================================== */
(function (global) {
  'use strict';
  if (global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var hotes = document.querySelectorAll('[data-neige]');
  if (!hotes.length) return;

  function neige(hote) {
    var toile = document.createElement('canvas');
    toile.className = 'mk-neige';
    toile.setAttribute('aria-hidden', 'true');
    hote.appendChild(toile);
    var ctx = toile.getContext('2d');
    if (!ctx) { toile.remove(); return; }

    var L = 0, H = 0, flocons = [], visible = false, tPrec = 0, enCours = false;

    function dimensionner() {
      var r = hote.getBoundingClientRect();
      var w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
      var dpr = Math.min(global.devicePixelRatio || 1, 1.5);
      if (w * h * dpr * dpr > 1600000) dpr = Math.sqrt(1600000 / (w * h));
      L = w; H = h;
      toile.width = Math.round(w * dpr); toile.height = Math.round(h * dpr);
      toile.style.width = w + 'px'; toile.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Densite proportionnelle a la surface, plafonnee.
      var cible = Math.min(w < 760 ? 30 : 100, Math.round(w * h / 9000));
      while (flocons.length < cible) flocons.push(nouveau(true));
      flocons.length = cible;
    }

    function nouveau(partout) {
      var p = Math.random();                 // profondeur : 0 loin, 1 pres
      return {
        x: Math.random() * L, y: partout ? Math.random() * H : -10,
        r: 0.8 + p * 2.6, v: 18 + p * 42,    // rayon (px), vitesse (px/s)
        a: 0.35 + p * 0.55, ph: Math.random() * 6.28, f: 0.4 + Math.random() * 0.8, amp: 6 + p * 18
      };
    }

    function image(t) {
      if (!visible || document.hidden) { enCours = false; tPrec = 0; return; }
      // 30 images/s suffisent a une chute lente : moitie moins de travail.
      if (tPrec && t - tPrec < 31) { global.requestAnimationFrame(image); return; }
      var dt = tPrec ? Math.min(0.06, (t - tPrec) / 1000) : 0.033;
      tPrec = t;
      ctx.clearRect(0, 0, L, H);
      for (var i = 0; i < flocons.length; i++) {
        var f = flocons[i];
        f.y += f.v * dt; f.ph += f.f * dt;
        var x = f.x + Math.sin(f.ph) * f.amp;
        if (f.y > H + 6) { flocons[i] = nouveau(false); continue; }
        ctx.beginPath(); ctx.arc(x, f.y, f.r, 0, 6.2832);
        ctx.fillStyle = 'rgba(255,255,255,' + f.a.toFixed(3) + ')'; ctx.fill();
      }
      global.requestAnimationFrame(image);
    }

    function lancer() { if (!enCours && visible && !document.hidden) { enCours = true; global.requestAnimationFrame(image); } }

    dimensionner();
    if ('ResizeObserver' in global) new ResizeObserver(dimensionner).observe(hote);
    if ('IntersectionObserver' in global) {
      new IntersectionObserver(function (e) { visible = e[0].isIntersecting; lancer(); }, { rootMargin: '10% 0px' }).observe(hote);
    } else { visible = true; lancer(); }
    document.addEventListener('visibilitychange', lancer);
  }

  // Demarre apres le chargement : la neige ne doit rien couter au premier affichage.
  function demarrer() {
    setTimeout(function () {
      for (var i = 0; i < hotes.length; i++) if (hotes[i].getClientRects().length) neige(hotes[i]);
    }, 1200);
  }
  if (document.readyState === 'complete') demarrer(); else global.addEventListener('load', demarrer);
})(window);
