/*
 * ============================================================================
 * GENERATEUR DES NOUVELLES PAGES — generate-site.js
 * ----------------------------------------------------------------------------
 * Source de verite : site.json (+ pages.json et blog.json en phase 1).
 * Meme principe que generate-pages.js et generate-prestations.js : le gabarit
 * vit ici, sous forme de chaines JS. AUCUN gabarit en fichier .html :
 * vite.config.js compile **\/*.html, un fragment deviendrait une page publique.
 *
 * Phase 0 (23.10.2026) : la page jeu-concours FR / EN (gabarit « prise
 * d'information »). Elle n'affiche QUE ce que site.json contient : aucun fait
 * invente. Tant que participation / reglement sont vides, elle dit que les
 * modalites seront publiees, et le build l'annonce en avertissement.
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const shell = require('./site-shell.js');

const { SITE, esc, dateLongue, veille } = shell;

function ecrire(urlPage, html) {
    const rel = urlPage.replace(/^\//, '').replace(/\/$/, '/index.html');
    const abs = path.join(__dirname, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, html);
    return rel;
}

// Jeu-concours de novembre 2026 : annule le 12.11.2026, page retiree
// (site.json pages.jeu-concours.existe = false).

// ===========================================================================
// PHASE 1 — pages des gabarits commercial / prise d'information (pages.json)
// ===========================================================================
const comp = require('./site-composants.js');
const { OFFRES, BLOG, lien, liens, enTete, puces, LABEL, H2, BTN_OR, BTN_LIGNE } = comp;
const PAGES = JSON.parse(fs.readFileSync(path.join(__dirname, 'pages.json'), 'utf8'));

// Garde cle par cle des identifiants SumUp des packs et combos (offres.json)
// contre CCW_OFFERS (app.js). Meme regle que generate-prestations.js : une
// permutation ou un identifiant vide enverrait le client sur un autre
// calendrier, ou sur la liste generique, sans aucun message.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
function verifierSumUpOffres() {
    const appjs = fs.readFileSync(path.join(__dirname, 'public', 'js', 'app.js'), 'utf8').replace(/\r\n/g, '\n');
    const i = appjs.indexOf('var CCW_OFFERS = {'), j = appjs.indexOf('\n};', i);
    if (i < 0 || j < 0) throw new Error('CCW_OFFERS introuvable dans public/js/app.js.');
    const app = new Function('return (' + appjs.slice(i + 'var CCW_OFFERS = '.length, j + 2) + ');')();
    [...OFFRES.packs, ...OFFRES.combos].forEach(o => {
        const a = app[o.id];
        if (!a) throw new Error(`[offres/${o.id}] cle absente de CCW_OFFERS dans public/js/app.js.`);
        const lj = Object.keys(o.sumup || {}).sort().join(','), la = Object.keys(a).sort().join(',');
        if (lj !== 'garage,home' || la !== lj) throw new Error(`[offres/${o.id}] variantes differentes : offres.json [${lj}], app.js [${la}] (attendu garage,home).`);
        ['home', 'garage'].forEach(lieu => ['service', 'variant'].forEach(ch => {
            const v = o.sumup[lieu][ch];
            if (!UUID.test(v || '')) throw new Error(`[offres/${o.id}/${lieu}] ${ch} invalide dans offres.json : "${v}".`);
            if (v !== a[lieu][ch]) throw new Error(`[offres/${o.id}/${lieu}] ${ch} different : offres.json="${v}", app.js="${a[lieu][ch]}".`);
        }));
    });
}

const TX = {
    fr: {
        reserver: 'Réserver', appeler: 'Appeler', ctaLabel: 'Prêt ?', ctaTitre: 'Réservez votre créneau',
        ctaTexte: "Choisissez votre formule, le lieu et l'heure : l'acompte de 30 % se règle en ligne, le solde sur place.",
        critere: 'Critère', agences: 'Agences classiques', nous: 'Clean Cars Wash',
        comparatif: [
            ['Frais de déplacement', '+ 100 CHF', 'Offert à Genève · dès {o} CHF sur Vaud'],
            ['Nettoyage complet à domicile', '~ 239 CHF', '{or} CHF (Pack Or)'],
            ['Detailing premium à domicile', '~ 549 CHF', '{diamant} CHF (Pack Diamant)'],
        ],
        remises: [['3 à 5 véhicules', '−10 %', ''], ['5 à 7 véhicules', '−20 %', ''], ['Plus de 7 véhicules', '−25 %', '+ 1 Pack Or offert (pour 1 véhicule)']],
        remisesNote: "Remise sur nos tarifs TTC, appliquée à chaque prestation de la flotte.",
        parrainage: { label: 'Programme de recommandation', titre: 'Partagez votre expérience, soyez récompensé',
            texte: "Demandez votre formulaire de recommandation papier lors de votre prestation. Complétez-le avec les coordonnées de vos proches intéressés : nous nous occupons de les contacter. Si 5 de vos filleuls réservent une prestation, un Pack Or d'une valeur de {or} CHF TTC vous est entièrement offert.",
            etapes: [['Remplissez', 'Inscrivez les proches et collègues intéressés sur votre formulaire papier.'], ['Nous contactons', 'Clean Cars Wash prend contact directement avec vos filleuls pour leur proposer nos services.'], ['Gagnez {or} CHF', 'Dès que 5 filleuls ont validé leur lavage, votre Pack Or vous est offert.']] },
        etapes: [['Choix de la formule et du lieu', 'À domicile / au travail, ou au garage CCW.'], ['Créneau et acompte de 30 %', 'Vous choisissez la date et l’heure, puis réglez l’acompte en ligne, par TWINT ou carte bancaire, via SumUp.'], ['Le jour du rendez-vous', 'À domicile, nous venons à vous à l’heure convenue ; à l’atelier, vous nous confiez le véhicule. Le solde se règle sur place.']],
        etapesTitre: 'Comment se déroule votre réservation', etapesLabel: 'En trois étapes',
        direct: { label: 'Autre option', titre: 'Vous préférez voir toutes les disponibilités ?', texte: "La page de réservation SumUp liste toutes nos prestations. Report sans frais jusqu'à 24 h avant le rendez-vous.", lien: 'Réserver en ligne', note: 'Redirection sécurisée vers notre partenaire SumUp.', appel: 'Appelez-nous' },
        adresse: 'Adresse', itineraire: 'Itinéraire', reservation: 'Réservation', reservationTexte: 'Sur rendez-vous, réservé en ligne : choisissez « au garage » au moment de réserver.',
        contact: { wa: 'WhatsApp', tel: 'Appeler', mail: 'E-mail' },
        supplementsNote: 'Montants TTC, TVA 8,1 % incluse.',
    },
    en: {
        reserver: 'Book', appeler: 'Call', ctaLabel: 'Ready?', ctaTitre: 'Book your time slot',
        ctaTexte: 'Choose your package, the place and the time: the 30% deposit is paid online, the balance on site.',
        critere: 'Criterion', agences: 'Typical agencies', nous: 'Clean Cars Wash',
        comparatif: [
            ['Travel fees', '+ 100 CHF', 'Included in Geneva · from CHF {o} in Vaud'],
            ['Full cleaning at home', '~ 239 CHF', '{or} CHF (Gold Pack)'],
            ['Premium detailing at home', '~ 549 CHF', '{diamant} CHF (Diamond Pack)'],
        ],
        remises: [['3 to 5 vehicles', '−10%', ''], ['5 to 7 vehicles', '−20%', ''], ['More than 7 vehicles', '−25%', '+ 1 free Gold Pack (for 1 vehicle)']],
        remisesNote: 'Discount on our prices incl. VAT, applied to every service for the fleet.',
        parrainage: { label: 'Referral programme', titre: 'Share your experience, get rewarded',
            texte: 'Ask for your paper referral form during your service. Fill it in with the details of interested friends and family: we take care of contacting them. If 5 of your referrals book a service, a Gold Pack worth CHF {or} incl. VAT is entirely on us.',
            etapes: [['Fill in', 'Write down interested friends and colleagues on your paper form.'], ['We get in touch', 'Clean Cars Wash contacts your referrals directly to offer them our services.'], ['Earn CHF {or}', 'As soon as 5 referrals have completed their wash, your Gold Pack is free.']] },
        etapes: [['Choose package and place', 'At home / at work, or at the CCW garage.'], ['Time slot and 30% deposit', 'Pick the date and time, then pay the deposit online by TWINT or card, via SumUp.'], ['On the day', 'At home, we come to you at the agreed time; at the workshop, you drop the vehicle off. The balance is settled on site.']],
        etapesTitre: 'How your booking works', etapesLabel: 'In three steps',
        direct: { label: 'Another option', titre: 'Prefer to see every available slot?', texte: 'The SumUp booking page lists all our services. Rescheduling at no cost up to 24 hours before the appointment.', lien: 'Book online', note: 'Secure redirection to our partner SumUp.', appel: 'Call us' },
        adresse: 'Address', itineraire: 'Directions', reservation: 'Booking', reservationTexte: 'By appointment, booked online: choose “at the garage” when you book.',
        contact: { wa: 'WhatsApp', tel: 'Call', mail: 'E-mail' },
        supplementsNote: 'Amounts incl. VAT (8.1%).',
    },
};

const prixPack = id => OFFRES.packs.find(p => p.id === id).prix;
const remplir = s => String(s).replace(/\{o\}/g, SITE.deplacement.orange.prix).replace(/\{or\}/g, prixPack('or')).replace(/\{diamant\}/g, prixPack('diamant'));

function hero(d, langue, photo = null) {
    const ctas = (d.ctas || []).map(([t, h, st]) => `<a href="${lien(h, langue)}" class="${st === 'or' ? BTN_OR : BTN_LIGNE}">${t}</a>`).join('\n                ');
    return `
        <section class="pt-12 pb-10 md:pt-20 md:pb-16">${photo ? `
            <img class="mk-hero-photo" src="${photo}" srcset="${photo.replace(/\.webp$/, '-800.webp')} 800w, ${photo} 1600w" sizes="100vw" alt="" aria-hidden="true" fetchpriority="high" decoding="async">` : ''}
            <h1 class="text-xs md:text-sm font-display font-bold text-gold-400 uppercase tracking-[0.25em] mb-5 max-w-3xl leading-relaxed">${esc(d.h1)}</h1>
            <p class="text-4xl md:text-6xl font-display font-bold text-white uppercase tracking-tight leading-[0.95] mb-6 max-w-4xl">${esc(d.accroche)}</p>
            <p class="text-gray-300 font-light leading-relaxed max-w-2xl mb-8 text-base md:text-lg">${liens(d.intro, langue)}</p>
            ${ctas ? `<div class="flex flex-col sm:flex-row flex-wrap gap-3">
                ${ctas}
            </div>` : ''}
        </section>`;
}

function enveloppe(id, contenu, { fond = false } = {}) {
    return `
        <section${id ? ` id="${id}"` : ''} class="py-12 md:py-20${fond ? ' border-t border-white/5' : ''}" style="scroll-margin-top:5rem">
            ${contenu}
        </section>`;
}

function section(s, langue, cle, ctx) {
    const d = s[langue] || {}, t = TX[langue];
    const tete = enTete({ label: d.label, titre: d.titre, intro: d.intro && liens(d.intro, langue) });
    switch (s.type) {
    case 'cartes': {
        const n = s.colonnes || 3;
        const cols = { 2: 'md:grid-cols-2', 3: 'md:grid-cols-3', 4: 'md:grid-cols-2 lg:grid-cols-4' }[n];
        return enveloppe(s.id, `${tete}
            <div class="grid gap-5 ${cols}">
${d.cartes.map(c => `                <div class="premium-card rounded-2xl p-6 md:p-7 flex flex-col">
                    <h3 class="text-white font-display font-bold uppercase tracking-wider text-base mb-3">${c.titre}</h3>
                    <p class="text-gray-400 text-sm font-light leading-relaxed grow">${liens(c.texte, langue)}</p>
                    ${c.lien ? `<a href="${lien(c.lien[1], langue)}" class="text-gold-400 text-xs font-display font-bold tracking-widest uppercase mt-5">${c.lien[0]} &rarr;</a>` : ''}
                </div>`).join('\n')}
            </div>`);
    }
    case 'texte':
        return enveloppe(s.id, `${tete}
            <div class="max-w-3xl space-y-4">
${d.paragraphes.map(p => `                <p class="text-gray-300 font-light leading-relaxed">${liens(p, langue)}</p>`).join('\n')}
            </div>
            ${d.lien ? `<a href="${lien(d.lien[1], langue)}" class="${BTN_LIGNE} mt-8">${d.lien[0]}</a>` : ''}`);
    case 'offres':
        ctx.reservation = true;
        return enveloppe(s.id, `${tete}
            ${comp.grilleOffres(langue, { prix: s.prix !== false, packsSeuls: !!s.packsSeuls })}`);
    case 'galerie':
        ctx.galerie = true;
        return enveloppe(s.id, `${tete}
            <ul id="galerie" class="mk-defile mk-defile--page" aria-label="${esc(d.titre)}">
${s.medias.map(m => `                <li class="mk-media${m.video ? ' mk-media--video' : ''}">
                    <button type="button" class="mk-media__btn" data-zoom${m.video ? ` data-video="/images/accueil/${m.video}"` : ''} aria-label="${langue === 'fr' ? (m.video ? 'Lire en grand' : 'Agrandir') : (m.video ? 'Play full screen' : 'Enlarge')} : ${esc(m[langue])}">
                        <span class="mk-media__cadre"><img src="/images/accueil/${m.img}" alt="${esc(m[langue])}" loading="lazy" decoding="async">${m.video ? '<span class="mk-media__play" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="#0E0E10" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg></span>' : ''}</span>
                    </button>
                </li>`).join('\n')}
            </ul>`);
    case 'abonnements':
        ctx.appjs = true;
        return enveloppe(s.id, `${tete}
            ${comp.abonnements(langue, { prix: s.prix !== false })}
            ${d.lien ? `<p class="mt-8"><a href="${lien(d.lien[1], langue)}" class="text-gold-400 underline underline-offset-4">${d.lien[0]}</a></p>` : ''}`);
    case 'prestations':
        return enveloppe(s.id, `${tete}
            ${comp.prestations(langue, { prix: s.prix !== false, filtre: s.filtre || null })}`);
    case 'zones':
        return enveloppe(s.id, `${tete}
            ${comp.zones(langue)}`);
    case 'conditions':
        return enveloppe(s.id, `${tete}
            ${comp.conditions(langue)}`);
    case 'faq':
        ctx.jsonld.push(comp.faqJsonLd(d.items, langue));
        return enveloppe(s.id, `${tete}
            ${comp.faq(d.items, langue)}`);
    case 'aLire': {
        const bloc = comp.aLireAussi(cle, langue);
        return bloc ? enveloppe('a-lire', bloc) : '';
    }
    case 'questionnaire':
        return enveloppe(s.id, `${tete}
            ${comp.questionnaire(langue)}`);
    case 'comparatif':
        return enveloppe(s.id, `${tete}
            <div class="overflow-x-auto">
                <table class="w-full text-left text-sm min-w-[36rem]">
                    <thead><tr class="border-b border-white/10 text-[11px] font-display uppercase tracking-widest text-gray-400"><th scope="col" class="py-3 pr-4">${t.critere}</th><th scope="col" class="py-3 pr-4">${t.agences}</th><th scope="col" class="py-3 text-gold-400">${t.nous}</th></tr></thead>
                    <tbody>
${t.comparatif.map(([c, a, n]) => `                        <tr class="border-b border-white/5"><th scope="row" class="py-4 pr-4 text-white font-normal">${c}</th><td class="py-4 pr-4 text-gray-400">${a}</td><td class="py-4 text-gold-400 font-bold">${remplir(n)}</td></tr>`).join('\n')}
                    </tbody>
                </table>
            </div>`);
    case 'remises':
        return enveloppe(s.id, `${tete}
            <div class="grid gap-5 md:grid-cols-3">
${t.remises.map(([q, r, plus]) => `                <div class="premium-card rounded-2xl p-6 md:p-8">
                    <p class="text-gray-300 font-display uppercase tracking-wider text-sm mb-3">${q}</p>
                    <p class="text-5xl font-display font-bold text-gold-400">${r}</p>
                    ${plus ? `<p class="text-white text-sm mt-3">${plus}</p>` : ''}
                </div>`).join('\n')}
            </div>
            <p class="text-gray-400 text-sm font-light mt-6">${t.remisesNote}</p>`);
    case 'parrainage': {
        const p = t.parrainage;
        return enveloppe('parrainage', `${enTete({ label: p.label, titre: p.titre })}
            <p class="text-gray-300 font-light leading-relaxed max-w-3xl mb-10">${remplir(p.texte)}</p>
            <ol class="grid gap-5 md:grid-cols-3">
${p.etapes.map(([ti, tx], i) => `                <li class="premium-card rounded-2xl p-6"><span class="text-gold-400 font-display font-bold text-2xl">${i + 1}</span><p class="text-white font-display font-bold uppercase tracking-wider text-sm mt-2 mb-2">${remplir(ti)}</p><p class="text-gray-400 text-sm font-light">${tx}</p></li>`).join('\n')}
            </ol>`);
    }
    case 'etapes':
        return enveloppe('etapes', `${enTete({ label: t.etapesLabel, titre: t.etapesTitre })}
            <ol class="grid gap-5 md:grid-cols-3">
${t.etapes.map(([ti, tx], i) => `                <li class="premium-card rounded-2xl p-6"><span class="text-gold-400 font-display font-bold text-2xl">${i + 1}</span><p class="text-white font-display font-bold uppercase tracking-wider text-sm mt-2 mb-2">${ti}</p><p class="text-gray-400 text-sm font-light">${tx}</p></li>`).join('\n')}
            </ol>`);
    case 'supplements':
        return enveloppe(s.id, `${tete}
            <ul class="max-w-2xl divide-y divide-white/5">
${OFFRES.supplements[langue].map(([l, p]) => `                <li class="flex justify-between gap-6 py-3 text-sm"><span class="text-gray-300">${l}</span><span class="text-gold-400 font-bold text-right">${p}</span></li>`).join('\n')}
            </ul>
            <p class="text-gray-400 text-xs mt-4">${t.supplementsNote}</p>`);
    case 'contact': {
        const c = SITE.contact;
        return enveloppe(s.id, `${tete}
            <div class="flex flex-col sm:flex-row flex-wrap gap-3">
                <a href="https://wa.me/${c.whatsapp}?text=${encodeURIComponent(d.wa)}" target="_blank" rel="noopener noreferrer" class="${BTN_OR}">${t.contact.wa}</a>
                <a href="tel:${c.tel}" class="${BTN_LIGNE}">${t.contact.tel} ${c.telAffiche}</a>
                <a href="mailto:${c.email}" class="${BTN_LIGNE}">${t.contact.mail}</a>
            </div>`);
    }
    case 'adresse': {
        const c = SITE.contact, a = `${c.adresse.rue}, ${c.adresse.npa} ${c.adresse.ville}`;
        return enveloppe(s.id, `${tete}
            <div class="grid gap-5 md:grid-cols-2">
                <div class="premium-card rounded-2xl p-6 md:p-8">
                    <p class="${LABEL}">${t.adresse}</p>
                    <p class="text-white text-lg mb-4">${SITE.marque}<br>${c.adresse.rue}<br>${c.adresse.npa} ${c.adresse.ville}</p>
                    <a href="https://www.google.com/maps/search/?api=1&amp;query=${encodeURIComponent(a)}" target="_blank" rel="noopener noreferrer" class="text-gold-400 underline underline-offset-4">${t.itineraire}</a>
                </div>
                <div class="premium-card rounded-2xl p-6 md:p-8">
                    <p class="${LABEL}">${t.reservation}</p>
                    <p class="text-gray-300 font-light leading-relaxed mb-4">${t.reservationTexte}</p>
                    <a href="tel:${c.tel}" class="text-gold-400 font-display font-bold">${c.telAffiche}</a>
                </div>
            </div>`);
    }
    case 'reserverDirect': {
        ctx.reservation = true;
        const r = t.direct;
        return enveloppe('reservation', `${enTete({ label: r.label, titre: r.titre, intro: r.texte })}
            <div class="flex flex-col sm:flex-row flex-wrap gap-3 items-start">
                <a href="https://sumupbookings.com/clean-car-wash-geneva" target="_blank" rel="noopener noreferrer" data-track="conversion-booking" class="${BTN_OR}">${r.lien}</a>
                <button type="button" onclick="ccwModalOpen()" aria-haspopup="dialog" aria-controls="ccw-contact-modal" class="cursor-pointer ${BTN_LIGNE}">${r.appel}</button>
            </div>
            <p class="text-gray-400 text-xs mt-4">${r.note} TWINT · VISA · MASTERCARD · SUMUP</p>`);
    }
    case 'cta':
        return ctaFinal(langue);
    default:
        throw new Error(`pages.json : type de section inconnu "${s.type}" (${cle}).`);
    }
}

const ctaFinal = comp.ctaFinal;

// Enveloppe commune d'une page generee : <head>, header, <main>, footer,
// modales si la page reserve, app.js si elle reserve ou porte le widget
// abonnements, repere concours (carte + garde-fou) en fin de <body>.
function document_(cle, langue, d, corps, ctx, fichier) {
    const app = ctx.reservation || ctx.appjs;
    return `${shell.head({ langue, cle, titre: d.titre, description: d.description, jsonld: ctx.jsonld })}
<body class="text-gray-300 antialiased">
    <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-5W69QPT3"
    height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>

    <a href="#main-content" class="skip-link">${shell.UI[langue].skip}</a>
    ${shell.repereHeader(fichier, langue)}

    <main id="main-content" class="max-w-6xl mx-auto px-4 md:px-6">${corps}
    </main>
    ${shell.repereFooter(fichier, langue)}
${ctx.reservation ? comp.modales(langue) : ''}
${app ? `
    <!-- app.js : reservation SumUp (CCW_OFFERS, modale, verrou anti-double-clic)
         et widget abonnements. Chemin absolu pour les pages EN. -->
    <script src="/js/app.js" defer></script>` : ''}${ctx.galerie ? `
    <script src="/js/galerie-zoom.js" defer></script>` : ''}
    ${shell.repereFinDePage(langue)}
</body>
</html>
`;
}

function pageGabarit(cle, langue) {
    // Jetons de donnees ({prix:argent}, {dpack:or}…) remplaces dans tout le contenu de la page.
    const J = v => typeof v === 'string' ? comp.jetons(v, `pages.json (${cle}/${langue})`, langue)
        : Array.isArray(v) ? v.map(J) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, J(x)])) : v;
    const P = J(PAGES[cle]), d = P[langue];
    const ctx = { jsonld: [], reservation: false, appjs: false, galerie: false };
    const fichier = SITE.pages[cle][langue].replace(/^\//, '');
    // "cle": true sur UNE section de la page => panneau sombre (classe mk-cle).
    const marquer = (s, h) => s.cle ? h.replace(/<section\b([^>]*?)\bclass="/, '<section$1class="mk-cle ') : h;
    const corps = hero(d, langue, P.photo || null) + P.sections.map(s => marquer(s, section(s, langue, cle, ctx))).join('');
    return { fichier, html: document_(cle, langue, d, corps, ctx, fichier) };
}

// ---------------------------------------------------------------------------
if (require.main === module) {
verifierSumUpOffres();


Object.keys(PAGES).filter(k => !k.startsWith('_') && k !== 'accueil').forEach(cle => {
    if (!SITE.pages[cle]) throw new Error(`pages.json : "${cle}" n'existe pas dans site.json.`);
    if (!SITE.pages[cle].existe) throw new Error(`site.json : "${cle}" est genere par generate-site.js mais marque existe=false.`);
    ['fr', 'en'].forEach(l => {
        const { html } = pageGabarit(cle, l);
        console.log(`✅ ${ecrire(SITE.pages[cle][l], html)}`);
    });
});

// Le blog (index + articles) est produit par generate-blog.js.


}

module.exports = { ctaFinal, hero, document_, section, TX };
