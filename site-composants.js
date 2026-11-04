/*
 * ============================================================================
 * COMPOSANTS DES PAGES — site-composants.js
 * ----------------------------------------------------------------------------
 * Blocs reutilises par generate-site.js (nouvelles pages) et par
 * inject-shell.js (sections generees de l'accueil, ecrit a la main) :
 * cartes d'offres, abonnements, prestations, zones, conditions, questionnaire,
 * modales de reservation, « A lire aussi ».
 *
 * Donnees : site.json, offres.json, prestations.json, blog.json. Un prix ne
 * s'ecrit qu'une fois : il est relu ici, jamais retape dans un gabarit.
 *
 * Mise en forme PROVISOIRE (charte existante de style.css) : le rendu final
 * viendra d'une maquette validee.
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const shell = require('./site-shell.js');

const { SITE, esc, PRESTATIONS, urlPrestation } = shell;
const OFFRES = JSON.parse(fs.readFileSync(path.join(__dirname, 'offres.json'), 'utf8'));
const lireJson = f => { const p = path.join(__dirname, f); return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null; };
const BLOG = lireJson('blog.json') || { articles: [] };

// ---------------------------------------------------------------------------
// Liens symboliques : "@tarifs#abonnements" -> URL de la page dans la langue.
// ---------------------------------------------------------------------------
function lien(ref, langue) {
    if (!ref || ref[0] !== '@') return ref;
    const [cle, ancre] = ref.slice(1).split('#');
    const pg = SITE.pages[cle];
    let u;
    if (pg) u = pg[langue];
    else {
        const pr = PRESTATIONS.find(p => p.id === cle);
        if (pr) u = urlPrestation(pr, langue);
        const ar = BLOG.articles.find(a => a.id === cle);
        if (ar) u = urlArticle(ar, langue);
    }
    if (!u) throw new Error(`Lien symbolique inconnu : ${ref}`);
    return u + (ancre ? '#' + ancre : '');
}
function urlArticle(a, langue) { return `${SITE.pages.blog[langue]}${a.slug[langue]}.html`; }

// Remplace les @cle dans un texte HTML (attribut href="@cle").
function liens(html, langue) {
    return String(html).replace(/href="(@[^"]+)"/g, (_, r) => `href="${lien(r, langue)}"`);
}

const T = {
    fr: {
        apartir: 'À partir de', ttc: 'CHF TTC', ht: '/période TTC', duree: 'Durée', reserverFormule: 'Réserver cette formule',
        voirDetail: 'Voir le détail', auLieu: 'au lieu de', separement: 'séparément', abonner: "S'abonner",
        mensuel: 'Mensuel', annuel: 'Annuel', fois1: '1×/mois', fois2: '2×/mois', pack: 'Pack', combo: 'Combo',
        des: 'Dès', fixe: 'Prix', atelier: 'Atelier', atelierDomicile: 'Atelier ou domicile', voirPresta: 'Découvrir',
        prixTtc: 'Prix TTC, TVA 8,1 % incluse.', aLire: 'À lire aussi', lire: "Lire l'article",
        appeler: 'Appeler', email: 'E-mail', offert: 'Offert', geneve: 'Canton de Genève', vaudO: 'Vaud — zone orange', vaudR: 'Vaud — zone rouge',
        communes: 'Les 45 communes, sans frais de déplacement.', districts: 'Districts', voirZones: 'Voir la carte des zones',
        zonesNote: 'Le forfait est ajouté une fois par déplacement, réglé sur place avec le solde. Il ne fait pas partie de l’acompte en ligne.',
    },
    en: {
        apartir: 'From', ttc: 'CHF incl. VAT', ht: '/period incl. VAT', duree: 'Duration', reserverFormule: 'Book this package',
        voirDetail: 'See details', auLieu: 'instead of', separement: 'separately', abonner: 'Subscribe',
        mensuel: 'Monthly', annuel: 'Annual', fois1: '1×/month', fois2: '2×/month', pack: 'Pack', combo: 'Combo',
        des: 'From', fixe: 'Price', atelier: 'Workshop', atelierDomicile: 'Workshop or at home', voirPresta: 'Discover',
        prixTtc: 'Prices incl. VAT (8.1%).', aLire: 'Further reading', lire: 'Read the article',
        appeler: 'Call', email: 'E-mail', offert: 'Included', geneve: 'Canton of Geneva', vaudO: 'Vaud — orange zone', vaudR: 'Vaud — red zone',
        communes: 'All 45 municipalities, no travel fee.', districts: 'Districts', voirZones: 'See the zone map',
        zonesNote: 'The fee is charged once per trip and settled on site with the balance. It is not part of the online deposit.',
    },
};

const H2 = 'text-3xl md:text-5xl font-display font-bold text-white uppercase tracking-tight leading-[0.95] mb-6';
const LABEL = 'text-[11px] font-display font-bold tracking-[0.3em] uppercase text-gold-400 mb-3';
const BTN_OR = 'inline-flex items-center justify-center bg-gold-400 text-charcoal-900 font-display font-bold tracking-widest uppercase py-4 px-8 rounded-full hover:bg-gold-500 transition-all text-sm';
const BTN_LIGNE = 'inline-flex items-center justify-center border border-gold-400 text-gold-400 font-display font-bold tracking-widest uppercase py-4 px-8 rounded-full hover:bg-gold-400 hover:text-charcoal-900 transition-all text-sm';

function enTete({ label, titre, intro, centre = false }) {
    return `${label ? `<p class="${LABEL}">${label}</p>` : ''}
            ${titre ? `<h2 class="${H2}">${titre}</h2>` : ''}
            ${intro ? `<p class="text-gray-400 font-light leading-relaxed ${centre ? 'mx-auto' : ''} max-w-2xl mb-10">${intro}</p>` : ''}`;
}

const puces = (items, cls = 'text-gray-300') => `<ul class="space-y-2 text-sm font-light ${cls}">
${items.map(i => `                    <li class="flex gap-3"><span class="text-gold-400" aria-hidden="true">✓</span><span>${i}</span></li>`).join('\n')}
                </ul>`;

// ---------------------------------------------------------------------------
// Cartes d'offres (packs, combos). Trois usages, une seule carte :
//   prix + bouton de reservation (Tarifs, Reserver)
//   sans prix + lien vers Tarifs (accueil S4)
// ---------------------------------------------------------------------------
function carteOffre(o, type, langue, { prix = true, action = 'reserver' } = {}) {
    const t = T[langue], d = o[langue];
    const badge = o.badge ? `<span class="absolute -top-3 left-6 bg-gold-400 text-charcoal-900 text-[10px] font-display font-bold tracking-widest uppercase py-1 px-3 rounded-full">${o.badge[langue]}</span>` : '';
    const blocPrix = !prix ? '' : type === 'pack'
        ? `<p class="text-xs uppercase tracking-widest text-gray-400 mt-2">${t.apartir}</p>
                <p class="text-gold-400 font-display font-semibold text-3xl mb-1">${o.prix} <span class="text-sm">${t.ttc}</span></p>
                <p class="text-gray-400 text-xs mb-4">${t.duree} : ${d.duree}</p>`
        : `<p class="text-xs uppercase tracking-widest text-gray-400 mt-2">${t.apartir}</p>
                <p class="text-gold-400 font-display font-semibold text-3xl mb-1">${o.prix} <span class="text-sm">${t.ttc}</span></p>
                <p class="text-gray-400 text-xs mb-4">${t.auLieu} <span style="text-decoration:line-through">${o.prixSepare} CHF</span> ${t.separement}</p>`;
    const bouton = action === 'reserver'
        ? `<button type="button" onclick="ccwLocationModalOpen('${o.id}')" class="cursor-pointer ${o.badge ? BTN_OR : BTN_LIGNE} w-full mt-6">${t.reserverFormule}</button>`
        : `<a href="${lien('@tarifs', langue)}#offre-${o.id}" class="${BTN_LIGNE} w-full mt-6">${t.voirDetail}</a>`;
    return `
            <article id="offre-${o.id}" class="premium-card rounded-2xl p-7 md:p-8 flex flex-col relative${o.badge ? ' border-gold-400/40' : ''}" style="scroll-margin-top:6rem">
                ${badge}
                <p class="${LABEL} mt-1">${type === 'pack' ? t.pack : t.combo}${type === 'combo' ? ` · ${d.compose}` : ''}</p>
                <h3 class="text-xl font-display font-bold uppercase text-white tracking-wider mb-2">${esc(d.nom)}</h3>
                <p class="text-gray-400 text-sm font-light mb-2">${prix && d.description ? d.description : d.resume}</p>
                ${blocPrix}
                <div class="grow">${puces(d.inclus)}</div>
                ${bouton}
            </article>`;
}

function grilleOffres(langue, opts = {}) {
    const cartes = [
        ...OFFRES.packs.map(o => carteOffre(o, 'pack', langue, opts)),
        ...(opts.packsSeuls ? [] : OFFRES.combos.map(o => carteOffre(o, 'combo', langue, opts))),
    ];
    return `<div class="grid gap-6 md:gap-8 md:grid-cols-2 lg:grid-cols-3">${cartes.join('')}
            </div>`;
}

// ---------------------------------------------------------------------------
// Abonnements. Avec prix : le widget existant de app.js (ids price-*, btn-*,
// link-*), dont les montants et les liens de paiement vivent dans le tableau P
// de app.js. Les valeurs initiales (mensuel, 1x/mois) sont RELUES dans app.js
// au build : rien n'est retape. Sans prix : cartes qui menent a abonnements.html.
// ---------------------------------------------------------------------------
function prixAbonnementsAppJs() {
    const appjs = fs.readFileSync(path.join(__dirname, 'public', 'js', 'app.js'), 'utf8').replace(/\r\n/g, '\n');
    const i = appjs.indexOf('    var P = {');
    const j = appjs.indexOf('\n    };', i);
    if (i < 0 || j < 0) throw new Error('Tableau P des abonnements introuvable dans public/js/app.js.');
    return new Function('return (' + appjs.slice(i + '    var P = '.length, j + 6) + ');')();
}

function abonnements(langue, { prix = true } = {}) {
    const t = T[langue];
    const P = prix ? prixAbonnementsAppJs() : null;
    const cartes = OFFRES.abonnements.map(a => {
        const d = a[langue];
        const badge = a.badge ? `<span class="absolute -top-3 left-6 bg-gold-400 text-charcoal-900 text-[10px] font-display font-bold tracking-widest uppercase py-1 px-3 rounded-full">${a.badge[langue]}</span>` : '';
        const m1 = P && P[a.id].m1;
        return `
            <article class="premium-card rounded-2xl p-7 md:p-8 flex flex-col relative${a.badge ? ' border-gold-400/40' : ''}">
                ${badge}
                <p class="${LABEL} mt-1">${t.pack}</p>
                <h3 class="text-2xl font-display font-bold text-white mb-3">${esc(d.nom)}</h3>
                ${prix ? `<p class="mb-1"><span class="text-gray-400 text-sm">${t.apartir} </span><span id="price-${a.id}" class="text-4xl font-display font-bold text-gold-400">${m1[0]}</span><span class="text-gold-400 font-display font-bold text-xl"> CHF</span> <span class="text-gray-400 text-xs">${t.ht}</span></p>
                <p class="flex items-center gap-2 mb-5"><span id="base-${a.id}" class="text-gray-400 text-xs" style="text-decoration:line-through">${m1[1]}</span><span id="discount-${a.id}" class="text-green-400 text-xs font-bold">${m1[2]}</span></p>` : ''}
                <div class="grow">${puces(d.inclus)}</div>
                ${prix
                    ? `<a id="link-${a.id}" href="${m1[3]}" target="_blank" rel="noopener noreferrer" class="${a.badge ? BTN_OR : BTN_LIGNE} w-full mt-6">${t.abonner}</a>`
                    : `<a href="${lien('@abonnements', langue)}" class="${BTN_LIGNE} w-full mt-6">${t.voirDetail}</a>`}
            </article>`;
    }).join('');
    const ON = 'px-5 py-3.5 rounded-full text-xs font-display font-bold uppercase tracking-widest transition-all bg-gold-400 text-charcoal-900';
    const OFF = 'px-5 py-3.5 rounded-full text-xs font-display uppercase tracking-widest transition-all text-gray-400';
    const bascules = prix ? `
            <div class="flex flex-wrap gap-3 mb-3">
                <button type="button" id="btn-mensuel" onclick="setAboEng('mensuel')" class="${ON}">${t.mensuel}</button>
                <button type="button" id="btn-annuel" onclick="setAboEng('annuel')" class="${OFF}">${t.annuel}</button>
            </div>
            <div class="flex flex-wrap gap-3 mb-8">
                <button type="button" id="btn-freq1" onclick="setAboFreq(1)" class="${ON}">${t.fois1}</button>
                <button type="button" id="btn-freq2" onclick="setAboFreq(2)" class="${OFF}">${t.fois2}</button>
            </div>` : '';
    return `${bascules}
            <div class="grid gap-6 md:gap-8 md:grid-cols-3">${cartes}
            </div>`;
}

// ---------------------------------------------------------------------------
// Prestations specialisees (prestations.json)
// ---------------------------------------------------------------------------
function prestations(langue, { prix = true, filtre = null } = {}) {
    const t = T[langue];
    const liste = PRESTATIONS.filter(p => filtre === 'domicile' ? p.domicile : filtre === 'atelier' ? !p.domicile : true);
    return `<div class="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
${liste.map(p => `                <a href="${urlPrestation(p, langue)}" class="premium-card rounded-2xl p-6 flex flex-col group">
                    <p class="${LABEL}">${p.domicile ? t.atelierDomicile : t.atelier}</p>
                    <h3 class="text-lg font-display font-bold uppercase text-white tracking-wider mb-2 group-hover:text-gold-400 transition-colors">${esc(p[langue].nom)}</h3>
                    ${prix ? `<p class="text-gold-400 font-display font-semibold mb-2">${p.prixDes ? t.des + ' ' : ''}${p.prix} <span class="text-xs">${t.ttc}</span></p>` : ''}
                    <p class="text-gray-400 text-sm font-light leading-relaxed grow">${p[langue].resume}</p>
                    <span class="text-gold-400 text-xs font-display font-bold tracking-widest uppercase mt-4">${t.voirPresta} &rarr;</span>
                </a>`).join('\n')}
            </div>`;
}

// ---------------------------------------------------------------------------
// Zones et frais de deplacement (site.json). zones.html reste la reference.
// ---------------------------------------------------------------------------
function zones(langue) {
    const t = T[langue], D = SITE.deplacement;
    const col = (titre, prix, couleur, corps) => `
                <div class="premium-card rounded-2xl p-6" style="border-color:${couleur}">
                    <p class="font-display font-bold uppercase tracking-wider text-white text-sm mb-2">${titre}</p>
                    <p class="text-2xl font-display font-bold text-gold-400 mb-3">${prix}</p>
                    <div class="text-gray-400 text-sm font-light leading-relaxed">${corps}</div>
                </div>`;
    return `<div class="grid gap-5 md:grid-cols-3">${col(t.geneve, t.offert, 'rgba(74,222,128,.35)', t.communes)}${col(t.vaudO, `${D.orange.prix} <span class="text-sm">${t.ttc}</span>`, 'rgba(249,115,22,.35)', `${t.districts} : ${D.orange.districts.join(', ')}.`)}${col(t.vaudR, `${D.rouge.prix} <span class="text-sm">${t.ttc}</span>`, 'rgba(239,68,68,.35)', `${t.districts} : ${D.rouge.districts.join(', ')}.`)}
            </div>
            <p class="text-gray-400 text-sm font-light mt-6 max-w-3xl">${t.zonesNote} <a href="${lien('@zones', langue)}" class="text-gold-400 underline underline-offset-4">${t.voirZones}</a>.</p>`;
}

// ---------------------------------------------------------------------------
// Conditions d'intervention a domicile (texte du site, inchange).
// ---------------------------------------------------------------------------
const CONDITIONS = {
    fr: {
        items: [
            ['🅿️', 'Place de parking privative', 'Obligatoire', 'Garage, allée ou parking résidentiel. Le lavage sur voie publique est interdit en Suisse.'],
            ['⚡', 'Prise électrique 230V', 'Obligatoire', "Accessible depuis l'emplacement du véhicule pendant toute la durée de la prestation."],
            ['💧', "Point d'eau", 'Recommandé', 'Non indispensable selon la prestation — notre équipe vous le précisera à la confirmation.'],
        ],
        clause: "En confirmant votre réservation, vous attestez que ces conditions sont réunies à l'adresse indiquée. <strong class=\"text-white\">En cas d'impossibilité d'intervention à notre arrivée</strong> (absence d'emplacement, de prise ou d'accès au véhicule), la prestation reste due et sera facturée intégralement.",
    },
    en: {
        items: [
            ['🅿️', 'Private parking space', 'Required', 'Garage, driveway, or residential parking. Car washing on public roads is illegal in Switzerland.'],
            ['⚡', '230V power outlet', 'Required', "Accessible from the vehicle's location for the full duration of the service."],
            ['💧', 'Water point', 'Recommended', 'Not essential depending on the chosen service — our team will confirm at booking.'],
        ],
        clause: 'By confirming your booking, you confirm these conditions are met at the given address. <strong class="text-white">If our team cannot intervene on arrival</strong> (no parking, no outlet, or no vehicle access), the full service fee remains due and will be invoiced.',
    },
};
function conditions(langue) {
    const c = CONDITIONS[langue];
    return `<ul class="grid gap-5 md:grid-cols-3" role="list">
${c.items.map(([ico, titre, statut, texte]) => `                <li class="premium-card rounded-2xl p-6">
                    <span class="text-2xl" aria-hidden="true">${ico}</span>
                    <p class="text-white font-display font-bold uppercase tracking-wider text-sm mt-3 mb-1">${titre} <span class="text-gold-400 text-[10px] tracking-widest ml-1">${statut}</span></p>
                    <p class="text-gray-400 text-sm font-light leading-relaxed">${texte}</p>
                </li>`).join('\n')}
            </ul>
            <p class="text-gray-400 text-sm font-light leading-relaxed mt-6 max-w-3xl">${c.clause}</p>`;
}

// ---------------------------------------------------------------------------
// FAQ en <details> : fonctionne sans JavaScript. + donnees FAQPage.
// ---------------------------------------------------------------------------
function faq(items, langue) {
    return `<div class="space-y-3 max-w-3xl">
${items.map(([q, r]) => `                <details class="premium-card rounded-xl px-5 md:px-6 group">
                    <summary class="cursor-pointer list-none flex justify-between items-center gap-4 py-5 text-white font-display font-bold text-sm md:text-base">${q}<span class="text-gold-400 text-xl group-open:rotate-45 transition-transform" aria-hidden="true">+</span></summary>
                    <div class="text-gray-400 font-light leading-relaxed pb-5 text-sm md:text-base">${liens(r, langue)}</div>
                </details>`).join('\n')}
            </div>`;
}
function faqJsonLd(items, langue) {
    const brut = s => liens(s, langue).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    return { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: items.map(([q, r]) => ({ '@type': 'Question', name: brut(q), acceptedAnswer: { '@type': 'Answer', text: brut(r) } })) };
}

// ---------------------------------------------------------------------------
// « A lire aussi » : articles du blog lies a une page (blog.json, champ
// "pages"). Liens dans les deux sens : l'article pointe vers la page qui vend,
// la page qui vend affiche l'article.
// ---------------------------------------------------------------------------
function aLireAussi(cle, langue, { titre = true, max = 3 } = {}) {
    const t = T[langue];
    const arts = BLOG.articles.filter(a => (a.pages || []).includes(cle)).slice(0, max);
    if (!arts.length) return '';
    return `${titre ? `<p class="${LABEL}">${t.aLire}</p>` : ''}
            <div class="grid gap-5 md:grid-cols-3">
${arts.map(a => `                <a href="${urlArticle(a, langue)}" class="premium-card rounded-2xl p-6 flex flex-col group">
                    <h3 class="text-white font-display font-bold text-base leading-snug mb-3 group-hover:text-gold-400 transition-colors">${esc(a[langue].titre)}</h3>
                    <p class="text-gray-400 text-sm font-light leading-relaxed grow">${esc(a[langue].description)}</p>
                    <span class="text-gold-400 text-xs font-display font-bold tracking-widest uppercase mt-4">${t.lire} &rarr;</span>
                </a>`).join('\n')}
            </div>`;
}

// Les 3 derniers articles (accueil S5)
function derniersArticles(langue, n = 3) {
    const t = T[langue];
    const arts = [...BLOG.articles].sort((a, b) => b.publie.localeCompare(a.publie)).slice(0, n);
    return `<div class="grid gap-5 md:grid-cols-3">
${arts.map(a => `                <a href="${urlArticle(a, langue)}" class="premium-card rounded-2xl p-6 flex flex-col group">
                    <p class="text-gray-400 text-xs mb-3"><time datetime="${a.publie}">${shell.dateLongue(a.publie, langue)}</time></p>
                    <h3 class="text-white font-display font-bold text-base leading-snug mb-3 group-hover:text-gold-400 transition-colors">${esc(a[langue].titre)}</h3>
                    <p class="text-gray-400 text-sm font-light leading-relaxed grow">${esc(a[langue].description)}</p>
                    <span class="text-gold-400 text-xs font-display font-bold tracking-widest uppercase mt-4">${t.lire} &rarr;</span>
                </a>`).join('\n')}
            </div>`;
}

// ---------------------------------------------------------------------------
// Modales de reservation (markup identique a l'accueil). Les boutons de la
// modale portent data-track="conversion-booking" : c'est le declencheur GTM.
// ---------------------------------------------------------------------------
const MODALE = {
    fr: { fermer: 'Fermer', contactTitre: 'Nous Contacter', contactQ: 'Comment souhaitez-vous<br>nous joindre&nbsp;?', wa: 'Bonjour, je souhaite réserver un créneau.',
        dehors: 'Touchez en dehors pour fermer', resa: 'Réservation', ou: 'Où souhaitez-vous<br>être servi&nbsp;?', creneau: "Vous choisirez votre créneau, puis réglerez l'acompte de 30&nbsp;%.",
        deplacement: (o, r, z) => `Déplacement offert à Genève. Sur Vaud, forfait de ${o} ou ${r}&nbsp;CHF TTC réglé sur place — <a href="${z}" class="text-gold-400 underline underline-offset-2">voir les zones</a>.`,
        domicile: 'À domicile / au travail', garage: 'À l’atelier, Genève' },
    en: { fermer: 'Close', contactTitre: 'Contact Us', contactQ: 'How would you like<br>to reach us?', wa: 'Hello, I would like to book a slot.',
        dehors: 'Tap outside to close', resa: 'Booking', ou: 'Where would you like<br>to be served?', creneau: 'You will pick your time slot, then pay the 30% deposit.',
        deplacement: (o, r, z) => `Travel included in Geneva. In Vaud, a flat CHF ${o} or ${r} incl. VAT settled on site — <a href="${z}" class="text-gold-400 underline underline-offset-2">see the zones</a>.`,
        domicile: 'At home / at work', garage: 'At our workshop, Geneva' },
};
const CROIX = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>';
function modales(langue) {
    const m = MODALE[langue], c = SITE.contact, D = SITE.deplacement;
    const boite = 'relative bg-charcoal-800 border border-gold-400/30 rounded-2xl p-8 w-full max-w-xs text-center';
    const fond = fn => `<div class="absolute inset-0 backdrop-blur" style="background:rgba(0,0,0,0.75);" onclick="${fn}()" aria-hidden="true"></div>`;
    const x = fn => `<button type="button" onclick="${fn}()" class="absolute top-3 right-3 w-9 h-9 flex items-center justify-center text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors" aria-label="${m.fermer}">${CROIX}</button>`;
    return `
    <div id="ccw-contact-modal" class="hidden fixed inset-0 items-center justify-center px-4" style="z-index:300;" role="dialog" aria-modal="true" aria-labelledby="ccw-modal-title">
        ${fond('ccwModalClose')}
        <div class="${boite}" style="box-shadow:0 25px 50px rgba(0,0,0,.6);">
            ${x('ccwModalClose')}
            <p class="text-[10px] font-display tracking-[0.3em] uppercase text-gold-400 mb-3" id="ccw-modal-title">${m.contactTitre}</p>
            <p class="text-white font-display font-bold text-lg leading-snug mb-7">${m.contactQ}</p>
            <div class="flex flex-col gap-4">
                <a href="https://wa.me/${c.whatsapp}?text=${encodeURIComponent(m.wa)}" target="_blank" rel="noopener noreferrer" onclick="ccwModalClose()" class="flex items-center justify-center gap-3 bg-[#25D366] text-charcoal-900 font-display font-bold tracking-widest uppercase py-4 px-6 rounded-full hover:bg-[#1fb857] transition-all text-sm">WhatsApp</a>
                <a href="tel:${c.tel}" onclick="ccwModalClose()" class="flex items-center justify-center gap-3 border border-gold-400 text-gold-400 font-display font-bold tracking-widest uppercase py-4 px-6 rounded-full hover:bg-gold-400 hover:text-charcoal-900 transition-all text-sm">${c.telAffiche}</a>
            </div>
            <p class="text-gray-400 text-[10px] mt-5 uppercase tracking-widest font-display">${m.dehors}</p>
        </div>
    </div>

    <div id="ccw-location-modal" class="hidden fixed inset-0 items-center justify-center px-4" style="z-index:300;" role="dialog" aria-modal="true" aria-labelledby="ccw-location-modal-title">
        ${fond('ccwLocationModalClose')}
        <div class="${boite}" style="box-shadow:0 25px 50px rgba(0,0,0,.6);">
            ${x('ccwLocationModalClose')}
            <p class="text-[10px] font-display tracking-[0.3em] uppercase text-gold-400 mb-3" id="ccw-location-modal-title">${m.resa}</p>
            <p class="text-white font-display font-bold text-lg leading-snug mb-3">${m.ou}</p>
            <p class="text-gray-400 text-xs leading-snug mb-3">${m.creneau}</p>
            <p class="text-gray-400 text-[11px] leading-snug mb-6">${m.deplacement(D.orange.prix, D.rouge.prix, lien('@zones', langue))}</p>
            <div class="flex flex-col gap-5">
                <div>
                    <button type="button" id="ccw-location-garage" data-track="conversion-booking" onclick="ccwBookingGo('garage')" class="cursor-pointer w-full flex items-center justify-center gap-3 bg-gold-400 text-charcoal-900 font-display font-bold tracking-widest uppercase py-4 px-6 rounded-full hover:bg-gold-500 transition-all text-sm">${m.garage}</button>
                    <p class="text-gray-400 text-[10px] leading-snug mt-2"><span id="ccw-location-garage-label" class="text-gray-400"></span></p>
                </div>
                <div>
                    <button type="button" id="ccw-location-home" data-track="conversion-booking" onclick="ccwBookingGo('home')" class="cursor-pointer w-full flex items-center justify-center gap-3 border border-gold-400 text-gold-400 font-display font-bold tracking-widest uppercase py-4 px-6 rounded-full hover:bg-gold-400 hover:text-charcoal-900 transition-all text-sm">${m.domicile}</button>
                    <p class="text-gray-400 text-[10px] leading-snug mt-2"><span id="ccw-location-home-label" class="text-gray-400"></span></p>
                </div>
            </div>
            <p class="text-gray-400 text-[10px] mt-5 uppercase tracking-widest font-display">${m.dehors}</p>
        </div>
    </div>`;
}

// ---------------------------------------------------------------------------
// Questionnaire d'aiguillage . Fonctionne dans la page, AUCUNE donnee
// collectee ni stockee. Deux questions au plus, puis une recommandation.
// Un evenement dataLayer par reponse (questionnaire_profil,
// questionnaire_besoin), sans donnee personnelle ; il n'atteint GA4 que si
// GTM a le declencheur correspondant.
// Sans JavaScript : la liste de liens de repli reste visible.
// ---------------------------------------------------------------------------
function remisesAbonnement() {
    const P = prixAbonnementsAppJs();
    const r = Object.values(P).flatMap(x => Object.values(x).map(v => parseInt(String(v[2]).replace(/[^\d]/g, ''), 10))).filter(n => !isNaN(n));
    return [Math.min(...r), Math.max(...r)];
}

const QUIZ = {
    fr: {
        q1: 'Vous êtes…', pro: 'Je suis un professionnel', part: 'Je suis un particulier',
        q2pro: 'Que souhaitez-vous faire entretenir ?', q2part: 'De quoi avez-vous besoin ?',
        recommencer: 'Recommencer', retour: 'Retour', repli: 'Accès direct :',
        appeler: 'Appeler', email: 'E-mail', whatsapp: 'Demander un devis sur WhatsApp',
        proOpts: [
            ['flotte-3-5', 'Une flotte de 3 à 5 véhicules'],
            ['flotte-5-7', 'Une flotte de 5 à 7 véhicules'],
            ['flotte-7', 'Une flotte de plus de 7 véhicules'],
            ['clients', 'Les véhicules de mes clients (garage, concession)'],
            ['un-vehicule', 'Un seul véhicule de société'],
        ],
        partOpts: [
            ['ponctuel', 'Un lavage ponctuel'],
            ['regulier', 'Un entretien régulier'],
            ['neuf', 'Remettre à neuf ou protéger ma voiture'],
            ['domicile', "Qu'on vienne chez moi"],
        ],
    },
    en: {
        q1: 'You are…', pro: "I'm a business", part: "I'm a private customer",
        q2pro: 'What do you need looked after?', q2part: 'What do you need?',
        recommencer: 'Start again', retour: 'Back', repli: 'Direct links:',
        appeler: 'Call', email: 'E-mail', whatsapp: 'Ask for a quote on WhatsApp',
        proOpts: [
            ['flotte-3-5', 'A fleet of 3 to 5 vehicles'],
            ['flotte-5-7', 'A fleet of 5 to 7 vehicles'],
            ['flotte-7', 'A fleet of more than 7 vehicles'],
            ['clients', 'My customers’ vehicles (garage, dealership)'],
            ['un-vehicule', 'A single company vehicle'],
        ],
        partOpts: [
            ['ponctuel', 'A one-off wash'],
            ['regulier', 'Regular maintenance'],
            ['neuf', 'Restore or protect my car'],
            ['domicile', 'Someone to come to my place'],
        ],
    },
};

function resultatsQuiz(langue) {
    const [rmin, rmax] = remisesAbonnement();
    const fr = langue === 'fr';
    const wa = msg => `https://wa.me/${SITE.contact.whatsapp}?text=${encodeURIComponent(msg)}`;
    const devis = (fr_, en_) => wa(fr ? `Bonjour, je suis un professionnel, ${fr_}, je souhaite un devis.` : `Hello, I'm a business customer, ${en_}, I would like a quote.`);
    return {
        'flotte-3-5': { texte: fr ? 'Pour une flotte de 3 à 5 véhicules, la remise flotte est de −10 %. Écrivez-nous, nous préparons votre devis.' : 'For a fleet of 3 to 5 vehicles, the fleet discount is −10%. Message us and we will prepare your quote.', wa: devis('flotte de 3 à 5 véhicules', 'fleet of 3 to 5 vehicles') },
        'flotte-5-7': { texte: fr ? 'Pour une flotte de 5 à 7 véhicules, la remise flotte est de −20 %. Écrivez-nous, nous préparons votre devis.' : 'For a fleet of 5 to 7 vehicles, the fleet discount is −20%. Message us and we will prepare your quote.', wa: devis('flotte de 5 à 7 véhicules', 'fleet of 5 to 7 vehicles') },
        'flotte-7': { texte: fr ? 'Au-delà de 7 véhicules, la remise flotte est de −25 %, et un Pack Or est offert pour un véhicule. Écrivez-nous, nous préparons votre devis.' : 'Beyond 7 vehicles, the fleet discount is −25%, plus one free Gold Pack for one vehicle. Message us and we will prepare your quote.', wa: devis('flotte de plus de 7 véhicules', 'fleet of more than 7 vehicles') },
        'clients': { texte: fr ? 'Pour les véhicules de vos clients, parlons volume et fréquence : écrivez-nous, nous préparons votre devis.' : "For your customers' vehicles, let's talk volume and frequency: message us and we will prepare your quote.", wa: devis('je gère des véhicules de clients (garage, concession)', 'I handle customer vehicles (garage, dealership)') },
        'un-vehicule': { texte: fr ? 'Pour un seul véhicule de société, nos formules s’appliquent telles quelles : à domicile, au bureau ou à l’atelier.' : 'For a single company vehicle, our packages apply as they are: at home, at the office or in our workshop.', lien: lien('@tarifs', langue), bouton: fr ? 'Voir les tarifs' : 'See the prices', wa: devis('un seul véhicule de société', 'a single company vehicle') },
        'ponctuel': { texte: fr ? 'Pour un lavage ponctuel, choisissez votre pack, de l’Argent au Diamant, à domicile ou à l’atelier.' : 'For a one-off wash, pick your pack, from Silver to Diamond, at home or in our workshop.', lien: lien('@tarifs', langue), bouton: fr ? 'Voir les tarifs' : 'See the prices' },
        'regulier': { texte: fr ? `Pour un entretien régulier, l’abonnement revient moins cher : de −${rmin} % à −${rmax} % selon la formule et la fréquence.` : `For regular maintenance, a subscription costs less: −${rmin}% to −${rmax}% depending on the plan and frequency.`, lien: lien('@abonnements', langue), bouton: fr ? 'Voir les abonnements' : 'See subscriptions' },
        'neuf': { texte: fr ? 'Pour remettre à neuf ou protéger : polish céramique, PPF, covering, ciel étoilé ou nettoyage châssis.' : 'To restore or protect: ceramic polish, PPF, wrapping, starlight headliner or chassis cleaning.', lien: lien('@tarifs#prestations', langue), bouton: fr ? 'Voir les prestations' : 'See the services' },
        'domicile': { texte: fr ? 'Nous venons chez vous ou au travail : déplacement offert à Genève, forfait annoncé à l’avance sur Vaud.' : 'We come to your home or office: travel included in Geneva, a flat fee announced upfront in Vaud.', lien: lien('@a-domicile', langue), bouton: fr ? 'Le service à domicile' : 'The at-home service' },
    };
}

function questionnaire(langue, { id = 'ccw-quiz' } = {}) {
    const q = QUIZ[langue], c = SITE.contact;
    const btn = 'cursor-pointer w-full text-left border border-white/15 hover:border-gold-400 hover:text-gold-400 text-white rounded-2xl px-5 py-4 font-display font-bold text-sm tracking-wide transition-colors';
    const options = (etape, opts) => `<div class="grid gap-3 sm:grid-cols-2">
${opts.map(([v, l]) => `                    <button type="button" class="${btn}" data-${etape}="${v}">${l}</button>`).join('\n')}
                </div>`;
    const donnees = { resultats: resultatsQuiz(langue), appeler: q.appeler, email: q.email, whatsapp: q.whatsapp, tel: c.tel, mail: c.email };
    const repli = [['@professionnels', langue === 'fr' ? 'Professionnels' : 'Business'], ['@tarifs', langue === 'fr' ? 'Tarifs' : 'Prices'], ['@abonnements', langue === 'fr' ? 'Abonnements' : 'Subscriptions'], ['@a-domicile', langue === 'fr' ? 'À domicile' : 'At home'], ['@atelier', langue === 'fr' ? 'En atelier' : 'Workshop']];
    return `<div id="${id}" class="premium-card rounded-3xl p-6 md:p-10" data-quiz>
                <div data-etape="profil">
                    <p class="text-white font-display font-bold text-xl md:text-2xl mb-5">${q.q1}</p>
                    ${options('profil', [['pro', q.pro], ['particulier', q.part]])}
                </div>
                <div data-etape="pro" hidden>
                    <p class="text-white font-display font-bold text-xl md:text-2xl mb-5">${q.q2pro}</p>
                    ${options('besoin', q.proOpts)}
                    <button type="button" class="mt-5 text-gray-400 text-sm underline underline-offset-4" data-retour>${q.retour}</button>
                </div>
                <div data-etape="particulier" hidden>
                    <p class="text-white font-display font-bold text-xl md:text-2xl mb-5">${q.q2part}</p>
                    ${options('besoin', q.partOpts)}
                    <button type="button" class="mt-5 text-gray-400 text-sm underline underline-offset-4" data-retour>${q.retour}</button>
                </div>
                <div data-etape="resultat" hidden>
                    <p class="text-white text-lg md:text-xl font-light leading-relaxed mb-6" data-res-texte tabindex="-1"></p>
                    <div class="flex flex-col sm:flex-row flex-wrap gap-3" data-res-actions></div>
                    <button type="button" class="mt-6 text-gray-400 text-sm underline underline-offset-4" data-recommencer>${q.recommencer}</button>
                </div>
                <p class="text-gray-400 text-sm mt-6" data-repli>${q.repli} ${repli.map(([h, l]) => `<a class="text-gold-400 underline underline-offset-4" href="${lien(h, langue)}">${l}</a>`).join(' · ')}</p>
                <script type="application/json" data-quiz-donnees>${JSON.stringify(donnees).replace(/</g, '\\u003c')}</script>
            </div>
            <script>(function(){var r=document.getElementById(${JSON.stringify(id)});if(!r)return;
var D=JSON.parse(r.querySelector("[data-quiz-donnees]").textContent),profil=null;
var rp=r.querySelector("[data-repli]");if(rp)rp.hidden=true;
function e(n){[].forEach.call(r.querySelectorAll("[data-etape]"),function(x){x.hidden=x.getAttribute("data-etape")!==n});var t=r.querySelector('[data-etape="'+n+'"] p,[data-etape="'+n+'"] [tabindex]');if(t&&n!=="profil"){t.setAttribute("tabindex","-1");t.focus()}}
function push(o){try{(window.dataLayer=window.dataLayer||[]).push(o)}catch(x){}}
var B="inline-flex items-center justify-center font-display font-bold tracking-widest uppercase py-4 px-8 rounded-full transition-all text-sm ";
function a(h,t,c,ext){return '<a href="'+h+'" class="'+B+c+'"'+(ext?' target="_blank" rel="noopener noreferrer"':'')+'>'+t+'</a>'}
[].forEach.call(r.querySelectorAll("[data-profil]"),function(b){b.addEventListener("click",function(){profil=b.getAttribute("data-profil");push({event:"questionnaire_profil",profil:profil});e(profil)})});
[].forEach.call(r.querySelectorAll("[data-besoin]"),function(b){b.addEventListener("click",function(){var k=b.getAttribute("data-besoin"),x=D.resultats[k];push({event:"questionnaire_besoin",profil:profil,besoin:k});
r.querySelector("[data-res-texte]").textContent=x.texte;var h="";
if(x.lien)h+=a(x.lien,x.bouton,"bg-gold-400 text-charcoal-900 hover:bg-gold-500");
if(x.wa){h+=a(x.wa,D.whatsapp,(x.lien?"border border-gold-400 text-gold-400 hover:bg-gold-400 hover:text-charcoal-900":"bg-gold-400 text-charcoal-900 hover:bg-gold-500"),1);h+=a("tel:"+D.tel,D.appeler,"border border-white/20 text-white hover:border-gold-400");h+=a("mailto:"+D.mail,D.email,"border border-white/20 text-white hover:border-gold-400")}
r.querySelector("[data-res-actions]").innerHTML=h;e("resultat")})});
[].forEach.call(r.querySelectorAll("[data-retour]"),function(b){b.addEventListener("click",function(){e("profil")})});
r.querySelector("[data-recommencer]").addEventListener("click",function(){profil=null;e("profil");var f=r.querySelector("[data-profil]");if(f)f.focus()});
})();</script>`;
}

// ---------------------------------------------------------------------------
// Jetons de donnees dans les textes (blog.json, pages.json) : un prix ou une
// duree ne s'ecrit jamais dans un texte, il y est relu au build.
//   {prix:argent} {combo:excellence} {presta:ppf} {depl:orange} {abo:min|max}
//   {duree:ppf} -> la duree en <strong> du bloc immobilisation de prestations.json
// Un jeton inconnu fait echouer le build.
// ---------------------------------------------------------------------------
function jetons(texte, ou, langue = 'fr') {
    let remises = null;
    return String(texte).replace(/\{(prix|combo|presta|depl|abo|duree|dpack):([a-z-]+)\}/g, (m, type, id) => {
        let v;
        if (type === 'prix') v = (OFFRES.packs.find(p => p.id === id) || {}).prix;
        if (type === 'dpack') v = ((OFFRES.packs.find(p => p.id === id) || {})[langue] || {}).duree;
        if (type === 'combo') v = (OFFRES.combos.find(p => p.id === id) || {}).prix;
        if (type === 'presta') v = (PRESTATIONS.find(p => p.id === id) || {}).prix;
        if (type === 'depl') v = (SITE.deplacement[id] || {}).prix;
        if (type === 'abo') {
            remises = remises || Object.values(prixAbonnementsAppJs()).flatMap(x => Object.values(x).map(r => parseInt(String(r[2]).replace(/[^\d]/g, ''), 10)));
            v = id === 'min' ? Math.min(...remises) : id === 'max' ? Math.max(...remises) : undefined;
        }
        if (type === 'duree') {
            const p = PRESTATIONS.find(x => x.id === id);
            const mm = p && p[langue].immobilisation && p[langue].immobilisation.match(/<strong class="text-white">(.*?)<\/strong>/);
            v = mm ? mm[1] : (p && p[langue].duree);
        }
        if (v === undefined || v === null || v === '') throw new Error(`${ou} : jeton inconnu ou vide ${m}.`);
        return v;
    });
}

// Bandeau d'appel a l'action final (S7 de l'accueil, fin des pages generees).
const CTA = {
    fr: { label: 'Prêt ?', titre: 'Réservez votre créneau', texte: "Choisissez votre formule, le lieu et l'heure : l'acompte de 30 % se règle en ligne, le solde sur place.", reserver: 'Réserver', appeler: 'Appeler' },
    en: { label: 'Ready?', titre: 'Book your time slot', texte: 'Choose your package, the place and the time: the 30% deposit is paid online, the balance on site.', reserver: 'Book', appeler: 'Call' },
};
function ctaFinal(langue) {
    const t = CTA[langue], c = SITE.contact;
    return `
        <section class="py-12 md:py-20">
            <div class="premium-card rounded-3xl p-8 md:p-14 text-center" style="border-color:rgba(212,175,55,.35)">
                <p class="${LABEL}">${t.label}</p>
                <p class="${H2}">${t.titre}</p>
                <p class="text-gray-400 font-light leading-relaxed max-w-xl mx-auto mb-8">${t.texte}</p>
                <div class="flex flex-col sm:flex-row gap-3 justify-center">
                    <a href="${lien('@reserver', langue)}" class="${BTN_OR}">${t.reserver}</a>
                    <a href="tel:${c.tel}" class="${BTN_LIGNE}">${t.appeler} ${c.telAffiche}</a>
                </div>
            </div>
        </section>`;
}

// ---------------------------------------------------------------------------
// ACCUEIL (index.html / en/index.html, ecrits a la main) : sections produites
// ici et injectees par inject-shell.js entre reperes CCW:ACCUEIL-*.
// Textes : pages.json, cle "accueil".
// ---------------------------------------------------------------------------
const PAGES_JSON = lireJson('pages.json') || {};
function accueil(langue) {
    const A = PAGES_JSON.accueil;
    if (!A) throw new Error('pages.json : cle "accueil" absente.');
    const d = A[langue], ou = `pages.json/accueil/${langue}`;
    const J = s => liens(jetons(s, ou, langue), langue);
    const tete = (b, centre) => enTete({ label: b.label, titre: b.titre, intro: b.intro && J(b.intro), centre });
    const sec = (id, html) => `
        <section${id ? ` id="${id}"` : ''} class="py-16 md:py-24 max-w-6xl mx-auto px-4 md:px-6" style="scroll-margin-top:5rem">
            ${html}
        </section>`;
    const faqItems = d.faq.items.map(([q, r]) => [jetons(q, ou, langue), jetons(r, ou, langue)]);
    return {
        QUESTIONNAIRE: sec('questionnaire', `${tete(d.questionnaire)}
            ${questionnaire(langue, { id: 'ccw-quiz-accueil' })}`),
        OFFRES: sec('offres', `${tete(d.offres)}
            ${grilleOffres(langue, { prix: false, action: 'lien' })}
            <p class="${LABEL} mt-14">${d.offres.aboLabel}</p>
            ${abonnements(langue, { prix: false })}
            <p class="text-gray-300 font-light mt-10">${J(d.offres.prestations)}</p>
            <a href="${lien('@tarifs', langue)}" class="${BTN_OR} mt-8">${d.offres.bouton}</a>`),
        BLOG: BLOG.articles.length ? sec('blog', `${tete(d.blog)}
            ${derniersArticles(langue)}
            <a href="${lien('@blog', langue)}" class="${BTN_LIGNE} mt-8">${d.blog.bouton}</a>`) : '',
        FAQ: sec('faq', `${tete(d.faq)}
            ${faq(faqItems, langue)}`) + `
        <script type="application/ld+json">${JSON.stringify(faqJsonLd(faqItems, langue))}</script>`,
        CTA: `<div class="max-w-6xl mx-auto px-4 md:px-6">${ctaFinal(langue)}
        </div>`,
        ANCRES: ancresSecours(langue),
    };
}

// ---------------------------------------------------------------------------
// Ancres de secours . Les sections parties de l'accueil laissent
// leur ancre (element vide) ; un petit script envoie vers la nouvelle page.
// Des annonces ou des liens externes peuvent encore pointer vers /#services.
// ---------------------------------------------------------------------------
const ANCRES = {
    services: '@tarifs', combos: '@tarifs#offre-excellence', prestations: '@tarifs#prestations', reservation: '@reserver',
    abonnements: '@abonnements', zones: '@a-domicile#zones', comparatif: '@a-domicile', 'conditions-intervention': '@a-domicile#conditions',
    entreprises: '@professionnels', 'qui-sommes-nous': '@particuliers', 'referral-section': '@particuliers#parrainage',
};
function ancresSecours(langue) {
    const carte = {};
    Object.entries(ANCRES).forEach(([a, r]) => { carte[a] = lien(r, langue); });
    return `
    <div aria-hidden="true">${Object.keys(ANCRES).map(a => `<span id="${a}"></span>`).join('')}</div>
    <script>(function(){var m=${JSON.stringify(carte)};function g(){var h=location.hash.slice(1);if(m.hasOwnProperty(h))location.replace(m[h])}g();window.addEventListener("hashchange",g)})();</script>`;
}

module.exports = {
    jetons, accueil, ancresSecours, ANCRES, ctaFinal,
    questionnaire,
    OFFRES, BLOG, T, H2, LABEL, BTN_OR, BTN_LIGNE, lien, liens, urlArticle, enTete, puces,
    carteOffre, grilleOffres, abonnements, prixAbonnementsAppJs, prestations, zones, conditions,
    faq, faqJsonLd, aLireAussi, derniersArticles, modales,
};
