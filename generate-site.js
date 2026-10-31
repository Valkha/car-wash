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
const C = SITE.concours;

function ecrire(urlPage, html) {
    const rel = urlPage.replace(/^\//, '').replace(/\/$/, '/index.html');
    const abs = path.join(__dirname, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, html);
    return rel;
}

// ---------------------------------------------------------------------------
// Jeu-concours
// ---------------------------------------------------------------------------
const TC = {
    fr: {
        titre: `Jeu-concours : un ${C.lot.fr} à gagner | ${SITE.marque}`,
        description: `Jeu-concours ${SITE.marque} du ${dateLongue(C.debut, 'fr', false)} au ${dateLongue(C.fin, 'fr')} : un ${C.lot.fr} à gagner. Lot, dates et modalités de participation.`,
        eyebrow: `Genève &amp; Vaud — du ${dateLongue(C.debut, 'fr', false)} au ${dateLongue(C.fin, 'fr')}`,
        h1: `Jeu-concours ${SITE.marque}`,
        accroche: `Un <span class="text-gold-400">${esc(C.lot.fr)}</span> à gagner`,
        avant: `Le jeu-concours commence le <strong class="text-white">${dateLongue(C.debut, 'fr')}</strong>.`,
        pendant: `Le jeu-concours est ouvert jusqu'au <strong class="text-white">${dateLongue(C.fin, 'fr')}</strong>.`,
        apres: `<strong class="text-white">Ce jeu-concours est terminé.</strong> ${C.dateTirage ? `Le tirage au sort a lieu le ${dateLongue(C.dateTirage, 'fr')} ; le` : 'Le'} gagnant est contacté personnellement. Merci à toutes et à tous pour votre participation.`,
        reserver: 'Réserver une prestation', lireReglement: 'Lire le règlement',
        essentiel: 'L’essentiel',
        lot: 'Lot', dates: 'Dates', organisateur: 'Organisateur',
        datesVal: `Du ${dateLongue(C.debut, 'fr')} au ${dateLongue(C.fin, 'fr')}`,
        participer: 'Comment participer',
        reglement: 'Règlement',
        modalitesAvant: `Les modalités complètes de participation et le règlement seront publiés sur cette page avant le ${dateLongue(C.debut, 'fr')}.`,
        modalitesPendant: 'Pour toute question sur les modalités de participation, contactez-nous directement.',
        tirage: 'Désignation du gagnant',
        question: 'Une question sur le jeu-concours ?',
        whatsapp: `Bonjour, j'ai une question sur le jeu-concours (${C.lot.fr}).`,
        offres: 'Voir nos offres',
        accueil: 'Découvrir nos prestations',
    },
    en: {
        titre: `Giveaway: win an ${C.lot.en} | ${SITE.marque}`,
        description: `${SITE.marque} giveaway from ${dateLongue(C.debut, 'en', false)} to ${dateLongue(C.fin, 'en')}: win an ${C.lot.en}. Prize, dates and how to enter.`,
        eyebrow: `Geneva &amp; Vaud — ${dateLongue(C.debut, 'en', false)} to ${dateLongue(C.fin, 'en')}`,
        h1: `${SITE.marque} giveaway`,
        accroche: `Win an <span class="text-gold-400">${esc(C.lot.en)}</span>`,
        avant: `The giveaway starts on <strong class="text-white">${dateLongue(C.debut, 'en')}</strong>.`,
        pendant: `The giveaway is open until <strong class="text-white">${dateLongue(C.fin, 'en')}</strong>.`,
        apres: `<strong class="text-white">This giveaway has ended.</strong> ${C.dateTirage ? `The prize draw takes place on ${dateLongue(C.dateTirage, 'en')}; the` : 'The'} winner is contacted personally. Thank you all for taking part.`,
        reserver: 'Book a service', lireReglement: 'Read the official rules',
        essentiel: 'At a glance',
        lot: 'Prize', dates: 'Dates', organisateur: 'Organiser',
        datesVal: `${dateLongue(C.debut, 'en')} to ${dateLongue(C.fin, 'en')}`,
        participer: 'How to enter',
        reglement: 'Official rules',
        modalitesAvant: `The full entry conditions and official rules will be published on this page before ${dateLongue(C.debut, 'en')}.`,
        modalitesPendant: 'For any question about how to enter, please contact us directly.',
        tirage: 'How the winner is chosen',
        question: 'A question about the giveaway?',
        whatsapp: `Hello, I have a question about the giveaway (${C.lot.en}).`,
        offres: 'See our offers',
        accueil: 'Discover our services',
    },
};

function liste(items) {
    return `<ul class="text-gray-300 font-light leading-relaxed space-y-2 list-disc pl-5">
${items.map(i => `                    <li>${i}</li>`).join('\n')}
                </ul>`;
}

function pageConcours(langue) {
    const t = TC[langue], c = SITE.contact;
    const participation = C.participation[langue] || [];
    const reglement = C.reglement[langue] || [];
    const tirage = (C.tirage && C.tirage[langue]) || '';
    const avantDebut = veille(C.debut);

    // Tant que site.json ne porte pas les modalites, un seul bloc les remplace :
    // une annonce avant le debut, un renvoi vers le contact pendant.
    const modalites = (participation.length || reglement.length) ? `
            ${participation.length ? `<h2 class="text-2xl md:text-3xl font-display font-bold text-white uppercase tracking-tight mb-4">${t.participer}</h2>
                ${liste(participation)}` : ''}
            ${reglement.length ? `<h2 id="reglement" class="text-2xl md:text-3xl font-display font-bold text-white uppercase tracking-tight mt-12 mb-4" style="scroll-margin-top:6rem">${t.reglement}</h2>
                <ol class="text-gray-300 font-light leading-relaxed space-y-3 list-decimal pl-5">
${reglement.map(r => `                    <li>${r}</li>`).join('\n')}
                </ol>` : ''}` : `
            <h2 class="text-2xl md:text-3xl font-display font-bold text-white uppercase tracking-tight mb-4">${t.participer}</h2>
            <p data-concours data-promo-until="${avantDebut}" class="text-gray-300 font-light leading-relaxed">${t.modalitesAvant}</p>
            <p data-concours data-promo-from="${C.debut}" data-promo-until="${C.fin}" class="text-gray-300 font-light leading-relaxed">${t.modalitesPendant}</p>`;

    return `${shell.head({ langue, cle: 'jeu-concours', titre: t.titre, description: t.description })}
<body class="text-gray-300 antialiased">
    <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-5W69QPT3"
    height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>

    <a href="#main-content" class="skip-link">${langue === 'fr' ? 'Passer au contenu principal' : 'Skip to main content'}</a>
    ${shell.repereHeader(shell.SITE.pages['jeu-concours'][langue].slice(1), langue)}

    <main id="main-content" class="max-w-5xl mx-auto px-4 md:px-6">

        <!-- En-tete PERMANENT : il reste vrai avant, pendant et apres le concours. -->
        <section class="pt-14 pb-10 md:pt-20 md:pb-12">
            <p class="hero-eyebrow mb-5">${t.eyebrow}</p>
            <h1 class="text-xl md:text-2xl font-display font-bold text-white uppercase tracking-[0.15em] mb-4">${t.h1}</h1>
            <p class="text-4xl md:text-6xl font-display font-bold text-white uppercase tracking-tight leading-[0.95] mb-8">${t.accroche}</p>

            <!-- Trois etats, dates relues dans site.json. Le garde-fou (site-shell.js,
                 gardeInline) retire ceux qui ne s'appliquent pas encore ou plus. -->
            <p data-concours data-promo-until="${avantDebut}" class="inline-block bg-gold-400/10 border border-gold-400/40 text-gray-200 text-sm px-5 py-3 rounded-2xl">${t.avant}</p>
            <p data-concours data-promo-from="${C.debut}" data-promo-until="${C.fin}" class="inline-block bg-gold-400/10 border border-gold-400/40 text-gray-200 text-sm px-5 py-3 rounded-2xl">${t.pendant}</p>
            <template data-concours data-promo-expired-after="${C.fin}"><p class="inline-block bg-white/5 border border-white/10 text-gray-200 text-sm px-5 py-3 rounded-2xl">${t.apres}</p></template>
        </section>

        <section class="pb-14 md:pb-20">
            <div class="premium-card rounded-3xl p-8 md:p-12">
                <h2 class="text-2xl md:text-3xl font-display font-bold text-white uppercase tracking-tight mb-6">${t.essentiel}</h2>
                <dl class="grid gap-6 md:grid-cols-3 text-sm">
                    <div><dt class="font-display font-bold text-[10px] tracking-[0.3em] uppercase text-gold-400 mb-2">${t.lot}</dt><dd class="text-white">${esc((C.lotDetail && C.lotDetail[langue]) || C.lot[langue])}</dd></div>
                    <div><dt class="font-display font-bold text-[10px] tracking-[0.3em] uppercase text-gold-400 mb-2">${t.dates}</dt><dd class="text-white">${t.datesVal}</dd></div>
                    <div><dt class="font-display font-bold text-[10px] tracking-[0.3em] uppercase text-gold-400 mb-2">${t.organisateur}</dt><dd class="text-white">${SITE.marque} — ${c.raisonSociale}<br><span class="text-gray-400">${c.adresse.rue}, ${c.adresse.npa} ${c.adresse.ville}</span></dd></div>
                </dl>
            </div>
        </section>

        <!-- Pendant le concours : participer = reserver une prestation. -->
        <section data-concours data-promo-until="${C.fin}" class="pb-14 md:pb-20">
            <div class="flex flex-col sm:flex-row gap-3">
                <a href="${SITE.pages.reserver.existe ? SITE.pages.reserver[langue] : (langue === 'fr' ? '/#services' : '/en/#services')}" class="inline-flex items-center justify-center bg-gold-400 text-charcoal-900 font-display font-bold tracking-widest uppercase py-4 px-8 rounded-full hover:bg-gold-500 transition-all text-sm">${t.reserver}</a>
                ${reglement.length ? `<a href="#reglement" class="inline-flex items-center justify-center border border-gold-400 text-gold-400 font-display font-bold tracking-widest uppercase py-4 px-8 rounded-full hover:bg-gold-400 hover:text-charcoal-900 transition-all text-sm">${t.lireReglement}</a>` : ''}
            </div>
        </section>

        <section class="pb-14 md:pb-20 max-w-3xl">${modalites}
            ${tirage ? `<h2 class="text-2xl md:text-3xl font-display font-bold text-white uppercase tracking-tight mt-10 mb-4">${t.tirage}</h2>
            <p class="text-gray-300 font-light leading-relaxed">${tirage}</p>` : ''}
        </section>

        <section class="pb-16 md:pb-24">
            <div class="premium-card rounded-3xl p-8 md:p-12 text-center">
                <p class="text-white font-display font-bold uppercase tracking-wider mb-6">${t.question}</p>
                <div class="flex flex-col sm:flex-row gap-3 justify-center mb-8">
                    <a href="https://wa.me/${c.whatsapp}?text=${encodeURIComponent(t.whatsapp)}" target="_blank" rel="noopener noreferrer" class="inline-block bg-[#25D366] text-charcoal-900 font-display font-bold tracking-widest uppercase py-3 px-8 rounded-full hover:bg-[#1fb857] transition-all text-sm">WhatsApp</a>
                    <a href="tel:${c.tel}" class="inline-block border border-gold-400 text-gold-400 font-display font-bold tracking-widest uppercase py-3 px-8 rounded-full hover:bg-gold-400 hover:text-charcoal-900 transition-all text-sm">${c.telAffiche}</a>
                    <a href="mailto:${c.email}" class="inline-block border border-white/20 text-white font-display font-bold tracking-widest uppercase py-3 px-8 rounded-full hover:border-gold-400 hover:text-gold-400 transition-all text-sm">E-mail</a>
                </div>
                <p class="text-gray-400 text-sm">
                    <a href="${SITE.pages.offres[langue]}" class="text-gold-400 underline underline-offset-4 hover:text-white transition">${t.offres}</a>
                    &nbsp;·&nbsp;
                    <a href="${SITE.pages.accueil[langue]}" class="text-gold-400 underline underline-offset-4 hover:text-white transition">${t.accueil}</a>
                </p>
            </div>
        </section>
    </main>
    ${shell.repereFooter(shell.SITE.pages['jeu-concours'][langue].slice(1), langue)}

    ${shell.repereFinDePage(langue, { pageConcours: true })}
</body>
</html>
`;
}

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
            ['Supplément grande voiture', "Jusqu'à + 50 CHF", '0 CHF (prix fixe)'],
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
            ['Large vehicle surcharge', 'Up to + 50 CHF', '0 CHF (fixed price)'],
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

function hero(d, langue) {
    const ctas = (d.ctas || []).map(([t, h, st]) => `<a href="${lien(h, langue)}" class="${st === 'or' ? BTN_OR : BTN_LIGNE}">${t}</a>`).join('\n                ');
    return `
        <section class="pt-12 pb-10 md:pt-20 md:pb-16">
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
            ${comp.grilleOffres(langue, { prix: s.prix !== false })}`);
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
    <script src="/js/app.js" defer></script>` : ''}
    ${shell.repereFinDePage(langue)}
</body>
</html>
`;
}

function pageGabarit(cle, langue) {
    const P = PAGES[cle], d = P[langue];
    const ctx = { jsonld: [], reservation: false, appjs: false };
    const fichier = SITE.pages[cle][langue].replace(/^\//, '');
    const corps = hero(d, langue) + P.sections.map(s => section(s, langue, cle, ctx)).join('');
    return { fichier, html: document_(cle, langue, d, corps, ctx, fichier) };
}

// ---------------------------------------------------------------------------
if (require.main === module) {
verifierSumUpOffres();

['fr', 'en'].forEach(l => {
    const rel = ecrire(SITE.pages['jeu-concours'][l], pageConcours(l));
    console.log(`✅ ${rel}`);
});

Object.keys(PAGES).filter(k => !k.startsWith('_') && k !== 'accueil').forEach(cle => {
    if (!SITE.pages[cle]) throw new Error(`pages.json : "${cle}" n'existe pas dans site.json.`);
    if (!SITE.pages[cle].existe) throw new Error(`site.json : "${cle}" est genere par generate-site.js mais marque existe=false.`);
    ['fr', 'en'].forEach(l => {
        const { html } = pageGabarit(cle, l);
        console.log(`✅ ${ecrire(SITE.pages[cle][l], html)}`);
    });
});

// Le blog (index + articles) est produit par generate-blog.js.

if (!C.participation.fr.length && !C.reglement.fr.length) {
    console.warn(`⚠️  site.json : concours.participation et concours.reglement sont vides. ` +
        `La page jeu-concours annonce les modalites « avant le ${dateLongue(C.debut, 'fr')} » : ` +
        `a renseigner dans site.json avant le debut du concours.`);
}

}

module.exports = { ctaFinal, hero, document_, section, TX };
