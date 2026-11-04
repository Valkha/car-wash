/* ==========================================================================
   Bulles de savon du haut de page (accueil)
   --------------------------------------------------------------------------
   Modele porte de « Champagne Fizz », Radiant — MIT License,
   Copyright (c) 2025 Paul Bakaus — https://github.com/pbakaus/radiant
   --------------------------------------------------------------------------
   Simulation Canvas 2D : des sites de nucleation au bas du panneau (dans la
   mousse), une remontee ralentie pour les petites bulles, une legere
   dilatation en montant, un eclat en gouttelettes quand elles crevent.
   Rendu bulle de savon : corps presque transparent, liseré blanc, reflet
   irise. Garde-fous : surface plafonnee en pixels, pause hors ecran et onglet
   cache, rien du tout si l'utilisateur demande moins d'animations.
   ========================================================================== */
(function (global) {
  'use strict';
  var hote = document.querySelector('[data-bulles]');
  if (!hote) return;
  if (global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var toile = document.createElement('canvas');
  toile.className = 'mk-bulles';
  toile.setAttribute('aria-hidden', 'true');
  hote.appendChild(toile);
  var ctx = toile.getContext('2d');
  if (!ctx) { toile.remove(); return; }

  var L = 0, H = 0, dpr = 1, mobile = false;
  var bulles = [], eclats = [], sites = [];
  var MAX = 90, NB_SITES = 12, DENSITE = 0.06;
  var visible = true, tPrec = 0;

  function poserSites() {
    sites = [];
    for (var i = 0; i < NB_SITES; i++) {
      sites.push({ x: L * (0.03 + 0.94 * i / (NB_SITES - 1)) + (Math.random() - 0.5) * 40, gigue: 10 + Math.random() * 30 });
    }
  }

  // Plafond de pixels : une toile 2D coute peu, mais pas rien a 60 images/s.
  function dimensionner() {
    var r = hote.getBoundingClientRect();
    var w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
    mobile = w < 760;
    MAX = mobile ? 34 : 90; DENSITE = mobile ? 0.03 : 0.06;
    dpr = Math.min(global.devicePixelRatio || 1, 1.5);
    if (w * h * dpr * dpr > 2200000) dpr = Math.sqrt(2200000 / (w * h));
    L = w; H = h;
    toile.width = Math.round(w * dpr); toile.height = Math.round(h * dpr);
    toile.style.width = w + 'px'; toile.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    poserSites();
  }

  function naitre() {
    if (bulles.length >= MAX) return;
    var x;
    if (Math.random() < 0.75) { var s = sites[Math.floor(Math.random() * sites.length)]; x = s.x + (Math.random() - 0.5) * s.gigue; }
    else x = Math.random() * L;
    var d = Math.random(), r;
    if (d < 0.5) r = 2 + Math.random() * 3;
    else if (d < 0.82) r = 4 + Math.random() * 5;
    else if (d < 0.95) r = 8 + Math.random() * 6;
    else r = 13 + Math.random() * 9;
    if (mobile) r *= 0.8;
    bulles.push({
      x: x, y: H - 30 - Math.random() * 60, r: r, r0: r,
      crete: H * (0.12 + Math.random() * 0.6),
      phase: Math.random() * 6.2832, freq: 1.2 + Math.random() * 1.3,
      ampl: (0.3 + Math.random() * 0.7) * r, vit: 0.45 + Math.random() * 0.5,
      opac: 0.55 + Math.random() * 0.45, age: 0,
      teinte: Math.random() * 360, pulseHz: 2 + Math.random() * 2
    });
  }

  function eclat(x, y, r) {
    var n = Math.min(8, Math.floor(3 + r * 0.6));
    for (var i = 0; i < n; i++) {
      var a = Math.random() * 6.2832;
      eclats.push({ x: x, y: y, vx: Math.cos(a) * (0.4 + Math.random()), vy: Math.sin(a) * (0.4 + Math.random()) - 0.3, vie: 1, perte: 0.035 + Math.random() * 0.03, r: 0.6 + Math.random() });
    }
  }

  function avancer(dt) {
    var i = bulles.length;
    while (i--) {
      var b = bulles[i];
      b.age += dt;
      var f = 0.6 + 0.4 * Math.min(b.r0 / 10, 1);
      b.y -= 0.9 * b.vit * f * dt * 60;
      b.phase += b.freq * dt;
      b.x += Math.sin(b.phase) * b.ampl * dt * 1.6;
      b.r = b.r0 * (1 + 0.05 * Math.sin(b.age * b.pulseHz)) * (1 + (1 - b.y / H) * 0.15);
      if (b.y <= b.crete) { eclat(b.x, b.y, b.r0); bulles.splice(i, 1); continue; }
      if (b.x < -50 || b.x > L + 50) bulles.splice(i, 1);
    }
    var j = eclats.length;
    while (j--) {
      var e = eclats[j];
      e.x += e.vx * dt * 60; e.y += e.vy * dt * 60; e.vy += 0.02 * dt * 60;
      e.vie -= e.perte * dt * 60;
      if (e.vie <= 0) eclats.splice(j, 1);
    }
  }

  // Bulle de savon : voile tres leger, liseré blanc, reflet blanc et une
  // pointe d'irisation sur le bord oppose.
  function peindreBulle(b) {
    var r = b.r; if (r < 0.6) return;
    var proche = Math.max(0, Math.min(1, (b.y - b.crete) / 60));
    var a = b.opac * Math.min(b.age * 2.5, 1) * (0.35 + 0.65 * proche);
    ctx.beginPath(); ctx.arc(b.x, b.y, r, 0, 6.2832);
    ctx.fillStyle = 'rgba(255,255,255,' + (a * 0.06).toFixed(3) + ')'; ctx.fill();
    ctx.lineWidth = Math.max(0.8, r * 0.1);
    ctx.strokeStyle = 'rgba(255,255,255,' + (a * 0.75).toFixed(3) + ')'; ctx.stroke();
    if (r > 3) {
      ctx.beginPath(); ctx.arc(b.x, b.y, r * 0.82, 0.6, 1.9);
      ctx.strokeStyle = 'hsla(' + Math.round(b.teinte) + ',90%,75%,' + (a * 0.55).toFixed(3) + ')';
      ctx.lineWidth = Math.max(0.8, r * 0.12); ctx.stroke();
      var hx = b.x - r * 0.38, hy = b.y - r * 0.38, hr = r * 0.32;
      var g = ctx.createRadialGradient(hx, hy, 0, hx, hy, hr);
      g.addColorStop(0, 'rgba(255,255,255,' + (a * 0.9).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(hx, hy, hr, 0, 6.2832); ctx.fill();
    }
  }

  function peindre() {
    ctx.clearRect(0, 0, L, H);
    for (var i = 0; i < bulles.length; i++) peindreBulle(bulles[i]);
    for (var j = 0; j < eclats.length; j++) {
      var e = eclats[j];
      ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, 6.2832);
      ctx.fillStyle = 'rgba(255,255,255,' + (Math.max(0, e.vie) * 0.7).toFixed(3) + ')'; ctx.fill();
    }
  }

  function tic(t) {
    global.requestAnimationFrame(tic);
    if (document.hidden || !visible) { tPrec = t; return; }
    var dt = tPrec ? Math.min(0.05, (t - tPrec) / 1000) : 0.016;
    tPrec = t;
    var n = DENSITE * 20 * dt * 60;
    for (var k = 0; k < Math.floor(n); k++) naitre();
    if (Math.random() < n % 1) naitre();
    if (!bulles.length && !eclats.length) return;
    avancer(dt); peindre();
  }

  dimensionner();
  if ('ResizeObserver' in global) new ResizeObserver(dimensionner).observe(hote);
  if ('IntersectionObserver' in global) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }, { rootMargin: '10% 0px' }).observe(hote);
  global.requestAnimationFrame(tic);
})(window);
