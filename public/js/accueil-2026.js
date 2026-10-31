/* Accueil 2026 : reprend la main sur le HTML pre-rendu (meme rendu, puis interactions). */
class DCLogic {
  constructor(props) { this.props = props || {}; this.state = {}; }
  setState(p) { Object.assign(this.state, typeof p === 'function' ? p(this.state) : p); this.__app && this.__app.schedule(); }
  forceUpdate() { this.__app && this.__app.schedule(); }
}
(function () {
  const RAW = /^\{\{\s*([^}]+?)\s*\}\}$/;
  function look(ctx, p) {
    p = p.trim();
    if (p === 'true') return true; if (p === 'false') return false;
    if (/^-?\d+(\.\d+)?$/.test(p)) return Number(p);
    return p.split('.').reduce((o, k) => (o == null ? undefined : o[k]), ctx);
  }
  const interp = (s, ctx) => s.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, p) => { const v = look(ctx, p); return v == null ? '' : String(v); });
  function render(node, ctx, out) {
    if (node.nodeType === 3) { out.push(document.createTextNode(interp(node.nodeValue, ctx))); return; }
    if (node.nodeType !== 1) return;
    const tag = node.localName;
    if (tag === 'sc-if') { const m = (node.getAttribute('value') || '').match(RAW); if (m && look(ctx, m[1])) node.childNodes.forEach((c) => render(c, ctx, out)); return; }
    if (tag === 'sc-for') {
      const m = (node.getAttribute('list') || '').match(RAW); const list = (m && look(ctx, m[1])) || []; const as = node.getAttribute('as') || 'item';
      list.forEach((it, i) => { const c2 = Object.assign(Object.create(ctx), { [as]: it, $index: i }); node.childNodes.forEach((c) => render(c, c2, out)); });
      return;
    }
    const el = document.createElementNS(node.namespaceURI, tag);
    for (const a of Array.from(node.attributes)) {
      if (a.name.startsWith('hint-')) continue;
      const m = a.value.match(RAW);
      if (a.name.startsWith('on')) { if (m) { let ev = a.name.slice(2); if (ev === 'change') ev = 'input'; el.__on = el.__on || {}; el.__on[ev] = look(ctx, m[1]); } continue; }
      if (m) {
        const v = look(ctx, m[1]);
        if (a.name === 'disabled') { if (v) el.setAttribute('disabled', ''); continue; }
        if (a.name.startsWith('aria-')) { el.setAttribute(a.name, String(!!v)); continue; }
        if (v == null || v === false) continue;
        el.setAttribute(a.name, String(v));
      } else el.setAttribute(a.name, interp(a.value, ctx));
    }
    const kids = []; node.childNodes.forEach((c) => render(c, ctx, kids)); kids.forEach((k) => el.appendChild(k));
    out.push(el);
  }
  function morph(a, b) {
    if (a.nodeType !== b.nodeType || a.nodeName !== b.nodeName) { a.replaceWith(b); return; }
    if (a.nodeType === 3) { if (a.nodeValue !== b.nodeValue) a.nodeValue = b.nodeValue; return; }
    for (const at of Array.from(a.attributes)) if (!b.hasAttribute(at.name)) a.removeAttribute(at.name);
    for (const at of Array.from(b.attributes)) if (a.getAttribute(at.name) !== at.value) a.setAttribute(at.name, at.value);
    a.__on = b.__on;
    if (a.localName === 'input' && b.hasAttribute('value') && document.activeElement !== a && a.value !== b.getAttribute('value')) a.value = b.getAttribute('value');
    morphKids(a, Array.from(b.childNodes));
  }
  function morphKids(parent, next) {
    const cur = Array.from(parent.childNodes);
    next.forEach((n, i) => { if (cur[i]) morph(cur[i], n); else parent.appendChild(n); });
    for (let i = next.length; i < cur.length; i++) cur[i].remove();
  }
  window.mountDC = function (root, tplId, Comp) {
    const tpl = document.getElementById(tplId).content;
    const inst = new Comp({}); let raf = 0;
    const app = { schedule() { if (!raf) raf = requestAnimationFrame(() => { raf = 0; draw(); }); } };
    inst.__app = app;
    function draw() { const ctx = inst.renderVals(); const out = []; tpl.childNodes.forEach((c) => render(c, ctx, out)); morphKids(root, out); }
    ['click', 'input'].forEach((ev) => { root['on' + ev] = (e) => { let el = e.target; while (el && el !== root) { if (el.__on && el.__on[ev]) { el.__on[ev](e); break; } el = el.parentNode; } }; });
    draw(); inst.componentDidMount && inst.componentDidMount();
    return () => { inst.componentWillUnmount && inst.componentWillUnmount(); inst.__app = null; root.innerHTML = ''; };
  };
})();

(function(){

class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { menuOpen: false, pastilleOpen: false, pastilleHidden: false, mode: 'domicile', q1: null, q2: null, faqOpen: 0, now: Date.now(), addrQuery: '', addrSugg: [], addrRes: null };
  }
  componentDidMount() {
    this.timer = setInterval(() => this.setState({ now: Date.now() }), 1000);
  }
  componentWillUnmount() { clearInterval(this.timer); clearTimeout(this.addrTimer); }
  addrNorm(t) { return String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, ''); }
  addrZone(canton, district) {
    if (canton === 'ge') return { status: 'ok', zone: 'Canton de Genève', fee: 0, color: '#2E7D32' };
    if (canton !== 'vd') return { status: 'hors' };
    const d = this.addrNorm(district);
    const orange = ['nyon', 'morges', 'ouestlausannois', 'lausanne', 'grosdevaud'];
    const rouge = ['juranordvaudois', 'broyevully', 'lavauxoron', 'rivierapaysdenhaut', 'aigle'];
    if (orange.indexOf(d) >= 0) return { status: 'ok', zone: 'Vaud, district ' + district + ' · zone orange', fee: 39.90, color: '#E07A1F' };
    if (rouge.indexOf(d) >= 0) return { status: 'ok', zone: 'Vaud, district ' + district + ' · zone rouge', fee: 59.90, color: '#C62828' };
    return { status: 'hors' };
  }
  addrSave(res) { try { sessionStorage.setItem('ccwAdresse', JSON.stringify(res)); } catch (e) {} }
  addrInput(q) {
    this.setState({ addrQuery: q, addrRes: null });
    clearTimeout(this.addrTimer);
    if (q.trim().length < 3) { this.setState({ addrSugg: [] }); return; }
    this.addrTimer = setTimeout(() => this.addrFetch(q), 250);
  }
  addrFetch(q) {
    const seq = (this.addrSeq = (this.addrSeq || 0) + 1);
    const live = typeof window !== 'undefined' && window.__ccwLive;
    if (!live) {
      const demo = [
        { label: 'Rue du Rhône 12, 1204 Genève', canton: 'ge' },
        { label: 'Rue de la Gare 1, 1260 Nyon', canton: 'vd', district: 'Nyon' },
        { label: 'Avenue de Rumine 20, 1005 Lausanne', canton: 'vd', district: 'Lausanne' },
        { label: 'Grand-Rue 50, 1820 Montreux', canton: 'vd', district: 'Riviera-Pays-d’Enhaut' },
        { label: 'Avenue de la Gare 3, 1950 Sion', canton: 'vs' }
      ];
      const words = q.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
      const hit = demo.filter((d) => words.some((w) => d.label.toLowerCase().indexOf(w) >= 0));
      this.setState({ addrSugg: hit.length ? hit : demo });
      return;
    }
    fetch('https://api3.geo.admin.ch/rest/services/api/SearchServer?type=locations&origins=address&limit=6&sr=4326&searchText=' + encodeURIComponent(q))
      .then((r) => r.json())
      .then((j) => {
        if (seq !== this.addrSeq) return;
        const sugg = (j.results || []).map((r) => {
          const a = r.attrs || {};
          return { label: String(a.label || '').replace(/\s*<b>/, ', ').replace(/<[^>]+>/g, ''), lat: a.lat, lon: a.lon, canton: String(a.detail || '').trim().split(/\s+/).pop() };
        });
        this.setState({ addrSugg: sugg });
      })
      .catch(() => this.setState({ addrSugg: [], addrRes: { status: 'error' } }));
  }
  addrPick(sg) {
    this.setState({ addrQuery: sg.label, addrSugg: [], addrRes: { status: 'loading', label: sg.label } });
    const done = (res) => { res.label = sg.label; this.setState({ addrRes: res }); if (res.status === 'ok') this.addrSave(res); };
    if (sg.canton !== 'vd' || sg.district) { done(this.addrZone(sg.canton, sg.district)); return; }
    fetch('https://api3.geo.admin.ch/rest/services/api/MapServer/identify?geometryType=esriGeometryPoint&sr=4326&tolerance=0&returnGeometry=false&layers=all:ch.swisstopo.swissboundaries3d-bezirk-flaeche.fill&geometry=' + sg.lon + ',' + sg.lat)
      .then((r) => r.json())
      .then((j) => { const f = (j.results || [])[0]; done(this.addrZone('vd', f && f.attributes ? f.attributes.name : '')); })
      .catch(() => this.setState({ addrRes: { status: 'error', label: sg.label } }));
  }
  addrVals() {
    const s = this.state; const r = s.addrRes;
    const ok = !!r && r.status === 'ok';
    return {
      query: s.addrQuery,
      onInput: (e) => this.addrInput(e.target.value),
      sugg: (s.addrSugg || []).map((sg) => ({ label: sg.label, pick: () => this.addrPick(sg) })),
      hasSugg: !!(s.addrSugg && s.addrSugg.length),
      france: () => this.setState({ addrSugg: [], addrRes: { status: 'hors', label: 'Adresse en France' } }),
      isEmpty: !r, isLoading: !!r && r.status === 'loading', isOk: ok, isHors: !!r && r.status === 'hors', isErr: !!r && r.status === 'error',
      label: r && r.label ? r.label : '', zone: ok ? r.zone : '', color: ok ? r.color : '#2E7D32',
      fee: ok ? (r.fee ? r.fee.toFixed(2) + ' CHF' : 'Offert') : '',
      note: ok ? (r.fee ? 'Forfait fixe, ajouté au prix du pack et rappelé avant de payer.' : 'Aucun frais de déplacement dans tout le canton de Genève.') : ''
    };
  }
  countdown() {
    const start = Date.parse('2026-10-31T23:00:00Z');
    const end = Date.parse('2026-11-30T22:59:59Z');
    const now = this.state.now;
    if (now > end) return null;
    const before = now < start;
    const diff = Math.max(0, (before ? start : end) - now);
    const j = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const sec = Math.floor((diff % 60000) / 1000);
    const p = (n) => String(n).padStart(2, '0');
    return {
      label: before ? 'Le concours commence dans' : 'Fin du concours dans',
      short: before ? 'Dès le 1er novembre' : 'Plus que ' + j + ' j',
      j: p(j), h: p(h), m: p(m), s: p(sec)
    };
  }
  renderVals() {
    const s = this.state;
    const clair = this.props.headerClair ?? false;
    const concours = this.props.concours ?? true;
    const cd = this.countdown();
    const pillLight = (sel) => sel ? { bg: '#0a0a0a', fg: '#ffffff', border: '#0a0a0a' } : { bg: '#ffffff', fg: '#1A1A1A', border: '#D9D2C2' };
    const pillDark = (sel) => sel ? { bg: '#D4AF37', fg: '#0a0a0a', border: '#D4AF37' } : { bg: 'transparent', fg: '#ffffff', border: '#3A3A3A' };

    const packsData = [
      { id: 'argent', nom: 'Pack Argent', prix: '98.60', duree: '1 h 30', resume: 'Le lavage complet, dehors et dedans.', inclus: ['Lavage manuel extérieur', 'Aspiration habitacle & coffre', 'Nettoyage des vitres', 'Séchage microfibre'] },
      { id: 'or', nom: 'Pack Or', prix: '165.10', duree: '2 h 30', resume: 'Le Pack Argent, plus l’intérieur remis à neuf.', inclus: ['Inclus le Pack Argent', 'Shampoing sièges & tapis', 'Rénovation plastiques', 'Nettoyage jantes & pneus', 'Finition parfumée'], reco: true },
      { id: 'diamant', nom: 'Pack Diamant', prix: '320.20', duree: '3 h 30', resume: 'Le soin le plus complet : protection et cuir.', inclus: ['Inclus le Pack Or', 'Cire premium déperlante', 'Soin cuir ou Alcantara', 'Traitement anti-odeur', 'Finitions ultra-précises'] }
    ];
    const packs = packsData.map((p) => p.reco
      ? Object.assign({}, p, { cls: 'mq-reco', bg: '#0a0a0a', fg: '#ffffff', border: '#D4AF37', muted: '#BDBDBD', check: '#D4AF37', priceColor: '#D4AF37', ctaBg: '#D4AF37', ctaFg: '#0a0a0a', ctaBorder: '#D4AF37', lift: -12, shadow: '0 30px 70px rgba(10,10,10,.28)' })
      : Object.assign({}, p, { cls: '', reco: false, bg: '#ffffff', fg: '#1A1A1A', border: '#E2DCCD', muted: '#5B5B5B', check: '#7A5C0E', priceColor: '#1A1A1A', ctaBg: '#ffffff', ctaFg: '#0a0a0a', ctaBorder: '#0a0a0a', lift: 0, shadow: 'none' }));


    const push = (o) => { try { (window.dataLayer = window.dataLayer || []).push(o); } catch (e) {} };
    const wa = (m) => 'https://wa.me/41782657071?text=' + encodeURIComponent('Bonjour, je suis un professionnel, ' + m + ', je souhaite un devis.');
    const q1 = [['pro', 'Je suis un professionnel'], ['particulier', 'Je suis un particulier']].map(([id, label]) =>
      Object.assign({ label: label, sel: s.q1 === id, pick: () => { push({ event: 'questionnaire_profil', profil: id }); this.setState({ q1: id, q2: null }); } }, pillDark(s.q1 === id)));
    const q2opts = s.q1 === 'pro'
      ? [['flotte-3-5', 'Une flotte de 3 à 5 véhicules'], ['flotte-5-7', 'Une flotte de 5 à 7 véhicules'], ['flotte-7', 'Une flotte de plus de 7 véhicules'], ['clients', 'Les véhicules de mes clients (garage, concession)'], ['un-vehicule', 'Un seul véhicule de société']]
      : [['ponctuel', 'Un lavage ponctuel'], ['regulier', 'Un entretien régulier'], ['neuf', 'Remettre à neuf ou protéger ma voiture'], ['domicile', 'Qu’on vienne chez moi']];
    const q2 = q2opts.map(([id, label]) =>
      Object.assign({ label: label, sel: s.q2 === id, pick: () => { push({ event: 'questionnaire_besoin', profil: s.q1, besoin: id }); this.setState({ q2: id }); } }, pillDark(s.q2 === id)));
    const lienBtn = (label, href) => ({ label: label, href: href, bg: '#0a0a0a', fg: '#ffffff' });
    const contacts = (msg, principal) => [
      { label: 'Demander un devis sur WhatsApp', href: wa(msg), target: '_blank', rel: 'noopener noreferrer', bg: principal ? '#0a0a0a' : 'transparent', fg: principal ? '#ffffff' : '#0a0a0a' },
      { label: 'Appeler', href: 'tel:+41782657071', bg: 'transparent', fg: '#0a0a0a' },
      { label: 'E-mail', href: 'mailto:info@clean-cars-wash.ch', bg: 'transparent', fg: '#0a0a0a' }
    ];
    const recos = {
      'flotte-3-5': { texte: 'Pour une flotte de 3 à 5 véhicules, la remise flotte est de −10 %. Écrivez-nous, nous préparons votre devis.', actions: contacts('flotte de 3 à 5 véhicules', true) },
      'flotte-5-7': { texte: 'Pour une flotte de 5 à 7 véhicules, la remise flotte est de −20 %. Écrivez-nous, nous préparons votre devis.', actions: contacts('flotte de 5 à 7 véhicules', true) },
      'flotte-7': { texte: 'Au-delà de 7 véhicules, la remise flotte est de −25 %, et un Pack Or est offert pour un véhicule. Écrivez-nous, nous préparons votre devis.', actions: contacts('flotte de plus de 7 véhicules', true) },
      'clients': { texte: 'Pour les véhicules de vos clients, parlons volume et fréquence : écrivez-nous, nous préparons votre devis.', actions: contacts('je gère des véhicules de clients (garage, concession)', true) },
      'un-vehicule': { texte: 'Pour un seul véhicule de société, nos formules s’appliquent telles quelles : à l’atelier, à domicile ou au bureau.', actions: [lienBtn('Voir les tarifs', '/tarifs.html')].concat(contacts('un seul véhicule de société', false)) },
      'ponctuel': { texte: 'Pour un lavage ponctuel, choisissez votre pack, de l’Argent au Diamant, à l’atelier ou à domicile.', actions: [lienBtn('Voir les tarifs', '/tarifs.html')] },
      'regulier': { texte: 'Pour un entretien régulier, l’abonnement revient moins cher : de −10 % à −27 % selon la formule et la fréquence.', actions: [lienBtn('Voir les abonnements', '/abonnements.html')] },
      'neuf': { texte: 'Pour remettre à neuf ou protéger : polish céramique, PPF, covering, ciel étoilé ou nettoyage châssis.', actions: [lienBtn('Voir les prestations', '/tarifs.html#prestations')] },
      'domicile': { texte: 'Nous venons chez vous ou au travail : déplacement offert à Genève, forfait annoncé à l’avance sur Vaud.', actions: [lienBtn('Le service à domicile', '/a-domicile.html')] }
    };

    const faqData = [
      ['Comment se passe le paiement ?', 'Vous choisissez votre formule et le lieu, puis votre créneau, et vous réglez un acompte de 30 % en ligne, sécurisé par SumUp. Le solde se règle sur place. Jusqu’à 24 h avant le rendez-vous, vous pouvez annuler sans frais : l’acompte est reporté sur une prochaine réservation. Moins de 24 h avant, il reste acquis.'],
      ['Le déplacement est-il payant ?', 'Il est offert dans tout le canton de Genève. Sur Vaud, un forfait fixe s’ajoute selon le district : 39.90 CHF (Nyon, Morges, Ouest lausannois, Lausanne, Gros-de-Vaud) ou 59.90 CHF pour les autres districts. Il est annoncé avant de payer.'],
      ['Comment participer au jeu-concours ?', 'Il suffit qu’une prestation soit réalisée et payée entre le 1er et le 30 novembre 2026 : vous êtes inscrit automatiquement, une participation par personne. Tirage au sort le 22 décembre.'],
      ['Quelle différence entre un polish et un traitement céramique ?', 'Le polish corrige la laque (micro-rayures, traces de lavage) ; la céramique la protège et fait perler l’eau. La céramique vient toujours après la correction : c’est ce que réunit le Pack Polish Céramique, dès 999 CHF TTC sur devis.'],
      ['Combien de temps le véhicule est-il immobilisé pour un polish céramique ?', 'Comptez une journée complète minimum, souvent davantage selon l’état de la laque. Le polish céramique se fait à l’atelier, ou chez vous dans un garage fermé : la céramique ne supporte ni la poussière ni la pluie pendant la prise.'],
      ['Qu’est-ce que le PPF ?', 'Un film transparent qui encaisse gravillons et rayures à la place de votre laque. La pose exige un environnement sans poussière : elle se fait exclusivement à l’atelier, et demande une journée complète minimum.'],
      ['Le covering touche-t-il à la peinture ?', 'Non : le covering change la couleur du véhicule sans toucher à la peinture — mat, brillant, satiné ou carbone. Il se fait à l’atelier ; comptez une journée complète minimum.'],
      ['Quelles options pour l’intérieur ?', 'Le Pack Or ajoute le shampoing des sièges et des tapis et la rénovation des plastiques ; le Pack Diamant, le soin du cuir ou de l’Alcantara et un traitement anti-odeur. La suppression de poils d’animaux est en option. Après un shampoing, comptez 4 à 6 heures de séchage avant une utilisation intensive.'],
      ['Qu’est-ce que le ciel étoilé ?', 'Des fibres optiques posées à la main dans le pavillon, quatre coloris, intensité réglable à la télécommande. Le pavillon doit être déposé : la prestation se fait à l’atelier et demande une demi-journée minimum.'],
      ['Comment garder le résultat après un detailing ?', 'Avec un lavage régulier : les combos incluent un lavage Argent d’entretien dans les 30 jours, et les abonnements reviennent de −10 % à −27 % moins cher qu’à l’unité.']
    ];
    const faq = faqData.map(([q, r], i) => {
      const open = s.faqOpen === i;
      return { q: q, r: r, open: open, closed: !open, rot: open ? 45 : 0, border: open ? '#D4AF37' : '#E2DCCD', iconBg: open ? '#D4AF37' : '#F2EEE3', iconFg: open ? '#0a0a0a' : '#7A5C0E', toggle: () => this.setState({ faqOpen: open ? -1 : i }) };
    });

    return {
      cd: cd || { label: '', short: '', j: '00', h: '00', m: '00', s: '00' },
      showConcours: concours && !!cd,
      showPastille: concours && !!cd && !s.pastilleHidden,
      pastilleOpen: s.pastilleOpen,
      togglePastille: () => this.setState({ pastilleOpen: !s.pastilleOpen }),
      dismissPastille: () => this.setState({ pastilleHidden: true, pastilleOpen: false }),
      menuOpen: s.menuOpen,
      toggleMenu: () => this.setState({ menuOpen: !s.menuOpen }),
      hdr: clair ? { bg: 'rgba(255,255,255,.96)', fg: '#1A1A1A', line: '#E7E1D3' } : { bg: 'rgba(10,10,10,.9)', fg: '#ffffff', line: '#262626' },
      prixAccueil: this.props.prixAccueil ?? true,
      avis: [
        { nom: 'Olivier D.', ini: 'OD', texte: 'Service impeccable à tous points de vue : prise en charge facile et très sympathique, nettoyage intérieur et extérieur parfait, jusque dans les moindres recoins. Plus aucune saleté, excellent rapport qualité-prix. J’y retournerai sans hésiter.' },
        { nom: 'Aymen S.', ini: 'AS', texte: 'Excellent service, je suis vraiment satisfait du résultat. L’équipe est professionnelle, accueillante et très efficace. Ma voiture est ressortie impeccable, comme neuve ! […]' },
        { nom: 'Amina D.', ini: 'AD', texte: 'Ma voiture était dans un état catastrophique et je l’ai récupérée impeccable, propre dans les moindres détails. En plus de la qualité du travail, j’ai apprécié le sérieux, la gentillesse et le professionnalisme de l’équipe. […]' }
      ],
      etapes: [
        { n: '1', titre: 'Choisissez', texte: 'Votre formule et le lieu : à l’atelier, chez vous ou au travail.' },
        { n: '2', titre: 'Réservez', texte: 'Votre créneau en ligne, avec un acompte sécurisé de 30 %.' },
        { n: '3', titre: 'Récupérez', texte: 'Une voiture comme neuve, prête à repartir.' }
      ],
      modeNote: 'Mêmes prix à l’atelier et à domicile. À domicile : déplacement offert à Genève, forfait fixe sur Vaud. Deux suppléments seulement, annoncés avant de réserver : véhicule extrêmement sale (74.60 CHF de l’heure) et poils d’animaux (dès 49.90 CHF).',
      setDomicile: () => this.setState({ mode: 'domicile' }),
      setAtelier: () => this.setState({ mode: 'atelier' }),
      segDom: s.mode === 'domicile' ? { bg: '#0a0a0a', fg: '#ffffff' } : { bg: 'transparent', fg: '#1A1A1A' },
      segAt: s.mode === 'atelier' ? { bg: '#0a0a0a', fg: '#ffffff' } : { bg: 'transparent', fg: '#1A1A1A' },
      packs: packs,
      combos: [
        { nom: 'Combo Excellence', compose: 'Pack Or + Pack Argent', prix: '228.00', separe: '263.70', eco: '35.70', badge: false },
        { nom: 'Combo Prestige', compose: 'Pack Diamant + Pack Argent', prix: '366.00', separe: '418.80', eco: '52.80', badge: true }
      ],
      prestations: [
        { nom: 'Polish céramique', href: '/polish-ceramique.html', de: 'dès ', prix: '999', note: 'sur devis', img: '/images/accueil/polish-ceramique.webp' },
        { nom: 'PPF', href: '/ppf.html', de: 'dès ', prix: '999', note: 'à l’atelier', img: '/images/accueil/ppf.webp' },
        { nom: 'Covering', href: '/covering.html', de: 'dès ', prix: '999', note: 'à l’atelier', img: '/images/accueil/covering.webp' },
        { nom: 'Ciel étoilé', href: '/ciel-etoile.html', de: 'dès ', prix: '499', note: 'à l’atelier', img: '/images/accueil/ciel-etoile.webp' },
        { nom: 'Châssis & moteur', href: '/nettoyage-chassis.html', de: '', prix: '159.90', note: 'prix fixe, à l’atelier', img: '/images/accueil/nettoyage-chassis.webp' }
      ],
      addr: this.addrVals(),
      q1: q1,
      q2visible: !!s.q1,
      q2titre: s.q1 === 'pro' ? 'Que souhaitez-vous faire entretenir ?' : 'De quoi avez-vous besoin ?',
      recommencer: () => this.setState({ q1: null, q2: null }),
      q2: q2,
      reco: s.q2 ? recos[s.q2] : null,
      faq: faq,
      abos: [
        { nom: 'Pack Argent', pop: false, inclus: 'Lavage intérieur + extérieur · aspirateur complet · vitres intérieures' },
        { nom: 'Pack Or', pop: true, inclus: 'Tout le Pack Argent · shampoing sièges · cire protectrice · désodorisant premium' },
        { nom: 'Pack Diamant', pop: false, inclus: 'Tout le Pack Or · traitement cuir / plastiques · prise en charge & restitution · rapport photos avant/après' }
      ],
      faits: [
        'Atelier à Genève, Chemin des Vergers : environnement sans poussière',
        'Prix TTC fixes, annoncés avant de réserver',
        'Aucun supplément grande voiture',
        'À domicile : déplacement offert dans tout le canton de Genève',
        'Acompte de 30 % sécurisé par SumUp, solde sur place',
        'Report sans frais jusqu’à 24 h avant : l’acompte passe sur la réservation suivante',
        'Entreprise enregistrée — TVA CHE-377.481.423'
      ],
      articles: [
        { href: '/blog/polissage-phares-jaunis-geneve.html', date: '31 octobre 2026', titre: 'Phares jaunis ou opaques : retrouvez une meilleure visibilité grâce au polissage professionnel', desc: 'Pourquoi les phares jaunissent, les risques de rouler avec des optiques opaques, et notre méthode de rénovation.' },
        { href: '/blog/nettoyage-poils-chien-voiture-geneve.html', date: '30 octobre 2026', titre: 'Poils de chien dans votre voiture : comment retrouver un intérieur impeccable ?', desc: 'Pourquoi les poils résistent à l’aspirateur, notre méthode, et le prix du supplément : dès 49.90 CHF TTC.' },
        { href: '/blog/prix-lavage-auto-domicile-geneve.html', date: '23 octobre 2026', titre: 'Combien coûte un lavage auto à domicile à Genève ?', desc: 'Un lavage auto à domicile à Genève coûte à partir de 98.60 CHF TTC, déplacement offert. Ce qui fait varier le prix, le cas de Vaud et les abonnements.' }
      ]
    };
  }
}

window.__ccwLive=true;mountDC(document.getElementById("app"),"tpl-accueil",Component);
})();
