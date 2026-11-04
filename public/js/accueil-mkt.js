/* Accueil (maquette marketing 04.11.2026) : calculateur de frais de deplacement.
   - Carte des communes chargee a l'approche de la section (/data/carte-zones.svg,
     /data/communes.json) : la page d'accueil reste legere.
   - Saisie : nom de commune reconnu tout de suite ; sinon adresses suisses via la
     recherche Swisstopo (api3.geo.admin.ch), puis district via « identify ».
   - Zones relues dans les donnees de la carte (identiques a site.json).
   - Le resultat est garde pour la visite (sessionStorage ccwAdresse), comme avant. */
(function () {
  var root = document.querySelector('[data-depl]');
  var carte = document.getElementById('zr-carte');
  if (!root || !carte) return;
  var $ = function (id) { return document.getElementById(id); };
  var input = $('zr-input'), liste = $('zr-liste'), card = $('zr-card'), hover = $('zr-hover');
  var EN = (document.documentElement.lang || '').indexOf('en') === 0;
  var L = EN ? {
    vide: 'Your municipality', videNote: 'Type an address or tap the map', ge: 'Canton of Geneva', geNote: 'All municipalities',
    offert: 'Free', orange: 'Vaud · orange zone', rouge: 'Vaud · red zone', district: 'district', fr: 'Neighbouring France',
    frNote: 'Call us for a quote', devis: 'Quote', introuvable: 'Not found', introuvableNote: 'Outside Geneva and Vaud, or a different spelling: call us',
    charge: 'Looking up…', erreur: 'Search unavailable', erreurNote: 'Type the name of your municipality, or call us', aide: 'Hover or tap a municipality'
  } : {
    vide: 'Votre commune', videNote: 'Tapez une adresse ou touchez la carte', ge: 'Canton de Genève', geNote: 'Toutes les communes',
    offert: 'Offert', orange: 'Vaud · zone orange', rouge: 'Vaud · zone rouge', district: 'district', fr: 'France voisine',
    frNote: 'Appelez-nous pour un devis', devis: 'Sur devis', introuvable: 'Commune introuvable', introuvableNote: 'Hors Genève et Vaud, ou orthographe différente : appelez-nous',
    charge: 'Recherche…', erreur: 'Recherche indisponible', erreurNote: 'Tapez le nom de votre commune, ou appelez-nous', aide: 'Survolez ou touchez une commune'
  };
  var Z = {
    ge: { prix: L.offert, fee: 0, bg: '#3BAF62', fg: '#0E0E10' },
    orange: { prix: '39.90 CHF', fee: 39.9, bg: '#F2994A', fg: '#0E0E10' },
    red: { prix: '59.90 CHF', fee: 59.9, bg: '#D9483B', fg: '#FFFFFF' }
  };
  var ZC = [], byId = {}, svg = null, sel = null, charge = false;

  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim(); }
  function zoneLabel(z) { return z === 'orange' ? L.orange : L.rouge; }

  function charger() {
    if (charge) return; charge = true;
    Promise.all([
      fetch(carte.getAttribute('data-src')).then(function (r) { return r.text(); }),
      fetch(carte.getAttribute('data-communes')).then(function (r) { return r.json(); })
    ]).then(function (res) {
      carte.innerHTML = res[0];
      svg = carte.querySelector('svg');
      if (svg) svg.setAttribute('aria-label', carte.getAttribute('data-label') || '');
      sel = $('zr-sel');
      ZC = res[1]; ZC.forEach(function (c) { byId[c.id] = c; });
      brancherCarte();
      if (input.value) montrer(trouver(input.value));
    }).catch(function () { charge = false; });
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (e) { if (e.some(function (x) { return x.isIntersecting; })) { io.disconnect(); charger(); } }, { rootMargin: '600px 0px' });
    io.observe(carte);
  } else charger();
  input.addEventListener('focus', charger, { once: true });

  // Commune reconnue dans un texte libre (nom ou NPA genevois).
  function trouver(raw) {
    var q = norm(raw); if (!q) return {};
    var p = ' ' + q + ' ', best = null;
    ZC.forEach(function (c) { var i = p.lastIndexOf(' ' + c.q + ' '); if (i >= 0 && (!best || i > best.i || (i === best.i && c.q.length > best.c.q.length))) best = { c: c, i: i }; });
    if (best) return { id: best.c.id };
    if (/\bfrance\b/.test(q) || /\b(74|01)\d{3}\b/.test(q)) return { mode: 'fr' };
    if (/\b12\d\d\b/.test(q)) return { mode: 'ge' };
    if (q.length >= 3) for (var k = 0; k < ZC.length; k++) if (ZC[k].q.indexOf(q) === 0) return { id: ZC[k].id };
    return { mode: q.length >= 3 ? 'none' : null };
  }

  function peindre(r) {
    $('zr-place').textContent = r.place; $('zr-note').textContent = r.note; $('zr-price').textContent = r.price;
    card.style.background = r.bg || ''; card.style.color = r.fg || '';
  }
  function montrer(st) {
    var c = st.id ? byId[st.id] : null, r;
    if (c) {
      var z = Z[c.z];
      r = { place: /\(/.test(c.n) ? c.n : c.n + (c.k === 'VD' ? ' (VD)' : ' (GE)'), note: c.k === 'GE' ? L.ge : zoneLabel(c.z) + ' · ' + L.district + ' ' + c.d, price: z.prix, bg: z.bg, fg: z.fg };
      garder({ status: 'ok', zone: r.note, fee: z.fee, label: input.value || c.n });
    } else if (st.mode === 'ge') { r = { place: L.ge, note: L.geNote, price: L.offert, bg: Z.ge.bg, fg: Z.ge.fg }; garder({ status: 'ok', zone: L.ge, fee: 0, label: input.value }); }
    else if (st.mode === 'fr') r = { place: L.fr, note: L.frNote, price: L.devis, bg: '#0E0E10', fg: '#FFFFFF' };
    else if (st.mode === 'none') r = { place: L.introuvable, note: L.introuvableNote, price: '?' };
    else if (st.mode === 'charge') r = { place: st.label || L.charge, note: L.charge, price: '…' };
    else if (st.mode === 'erreur') r = { place: L.erreur, note: L.erreurNote, price: '?' };
    else if (st.zone) { var zz = Z[st.zone]; r = { place: st.label, note: st.zone === 'ge' ? L.ge : zoneLabel(st.zone) + ' · ' + L.district + ' ' + st.district, price: zz.prix, bg: zz.bg, fg: zz.fg }; garder({ status: 'ok', zone: r.note, fee: zz.fee, label: st.label }); }
    else r = { place: L.vide, note: L.videNote, price: '—' };
    peindre(r);
    if (sel) {
      var path = c && svg ? svg.querySelector('[data-id="' + c.id + '"]') : null;
      sel.setAttribute('d', path ? path.getAttribute('d') : '');
    }
  }
  function garder(res) { try { sessionStorage.setItem('ccwAdresse', JSON.stringify(res)); } catch (e) {} }

  function brancherCarte() {
    if (!svg) return;
    svg.addEventListener('click', function (e) {
      var id = e.target.getAttribute && e.target.getAttribute('data-id'); if (!id) return;
      var c = byId[id]; input.value = c.n; fermerListe(); montrer({ id: Number(id) });
    });
    svg.addEventListener('mouseover', function (e) {
      var id = e.target.getAttribute && e.target.getAttribute('data-id'); if (!id) return;
      var c = byId[id]; hover.textContent = c.n + ' · ' + Z[c.z].prix;
    });
    svg.addEventListener('mouseleave', function () { hover.textContent = L.aide; });
  }

  // ---- Adresses (Swisstopo) ----
  var minuterie = null, seq = 0, sugg = [], actif = -1;
  function fermerListe() { liste.hidden = true; liste.innerHTML = ''; sugg = []; actif = -1; input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant'); }
  function ouvrirListe() {
    liste.innerHTML = sugg.map(function (s, i) { return '<li role="option" id="zr-opt-' + i + '" data-i="' + i + '">' + s.label.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</li>'; }).join('');
    liste.hidden = !sugg.length; input.setAttribute('aria-expanded', String(!!sugg.length));
  }
  function surligner(i) {
    actif = i;
    [].forEach.call(liste.children, function (li, k) { li.setAttribute('aria-selected', String(k === i)); });
    if (i >= 0) input.setAttribute('aria-activedescendant', 'zr-opt-' + i); else input.removeAttribute('aria-activedescendant');
  }
  function zoneDe(canton, district) {
    if (canton === 'ge') return 'ge';
    if (canton !== 'vd') return null;
    var d = norm(district).replace(/ /g, '');
    if (['nyon', 'morges', 'ouestlausannois', 'lausanne', 'grosdevaud'].indexOf(d) >= 0) return 'orange';
    if (['juranordvaudois', 'broyevully', 'lavauxoron', 'rivierapaysdenhaut', 'aigle'].indexOf(d) >= 0) return 'red';
    return null;
  }
  function choisir(s) {
    input.value = s.label; fermerListe();
    var loc = trouver(s.label);
    if (loc.id) { montrer(loc); return; }
    if (s.canton === 'ge') { montrer({ zone: 'ge', label: s.label }); return; }
    if (s.canton !== 'vd') { montrer({ mode: 'none' }); return; }
    montrer({ mode: 'charge', label: s.label });
    fetch('https://api3.geo.admin.ch/rest/services/api/MapServer/identify?geometryType=esriGeometryPoint&sr=4326&tolerance=0&returnGeometry=false&layers=all:ch.swisstopo.swissboundaries3d-bezirk-flaeche.fill&geometry=' + s.lon + ',' + s.lat)
      .then(function (r) { return r.json(); })
      .then(function (j) { var f = (j.results || [])[0], d = f && f.attributes ? f.attributes.name : '', z = zoneDe('vd', d); montrer(z ? { zone: z, district: d, label: s.label } : { mode: 'none' }); })
      .catch(function () { montrer({ mode: 'erreur' }); });
  }
  function chercher(q) {
    var n = ++seq;
    fetch('https://api3.geo.admin.ch/rest/services/api/SearchServer?type=locations&origins=address&limit=6&sr=4326&searchText=' + encodeURIComponent(q))
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (n !== seq) return;
        sugg = (j.results || []).map(function (r) {
          var a = r.attrs || {};
          return { label: String(a.label || '').replace(/\s*<b>/, ', ').replace(/<[^>]+>/g, ''), lat: a.lat, lon: a.lon, canton: String(a.detail || '').trim().split(/\s+/).pop() };
        });
        ouvrirListe();
      })
      .catch(function () { if (n === seq) fermerListe(); });
  }
  input.addEventListener('input', function () {
    charger();
    var v = input.value; clearTimeout(minuterie);
    var loc = trouver(v);
    montrer(loc.id || loc.mode === 'ge' || loc.mode === 'fr' ? loc : (v.trim().length < 3 ? {} : { mode: loc.mode === 'none' ? 'none' : null }));
    if (v.trim().length >= 3 && /\d/.test(v)) minuterie = setTimeout(function () { chercher(v); }, 250);
    else if (!loc.id) { if (v.trim().length >= 4) minuterie = setTimeout(function () { chercher(v); }, 350); else fermerListe(); }
    else fermerListe();
  });
  input.addEventListener('keydown', function (e) {
    if (liste.hidden) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); surligner(Math.min(sugg.length - 1, actif + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); surligner(Math.max(0, actif - 1)); }
    else if (e.key === 'Enter' && actif >= 0) { e.preventDefault(); choisir(sugg[actif]); }
    else if (e.key === 'Escape') fermerListe();
  });
  liste.addEventListener('mousedown', function (e) { var li = e.target.closest('li'); if (!li) return; e.preventDefault(); choisir(sugg[Number(li.getAttribute('data-i'))]); });
  document.addEventListener('click', function (e) { if (!root.contains(e.target)) fermerListe(); });
})();
