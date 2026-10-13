/*
 * ============================================================================
 * GENERATEUR DES PAGES PRESTATIONS
 * ----------------------------------------------------------------------------
 * Source de verite : prestations.json
 * Produit : 5 pages FR a la racine + 5 pages EN dans en/
 *
 * MEME PRINCIPE QUE generate-pages.js : le gabarit vit ici, editer un fichier
 * produit ne sert a rien, `npm run build` le reecrit.
 *
 * Choix de conception, a ne pas defaire sans raison :
 *  - AUCUNE IMAGE. Le patron a fourni des affiches avec le texte incruste ;
 *    elles ne sont pas utilisees. Le texte est en HTML, donc lisible par Google
 *    et par les lecteurs d'ecran, et l'accueil ne gagne pas un octet.
 *  - PAS DE app.js. Ces pages n'ont ni modale ni bloc date : inutile de leur
 *    servir le fichier. Elles n'ont donc pas non plus de menu burger.
 *  - Le JSON-LD porte le TARIF STANDARD, jamais le prix promotionnel. En
 *    septembre 2026 un prix remise pose hors bloc date etait reste cinq jours
 *    en ligne apres la fin de l'offre ; voir CLAUDE.md.
 *  - La remise d'octobre apparait dans un bloc data-promo-until, donc elle
 *    disparait seule. Le prix barre n'existe nulle part ailleurs.
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');

const prestations = JSON.parse(fs.readFileSync(path.join(__dirname, 'prestations.json'), 'utf8'));

const BASE = 'https://www.clean-cars-wash.ch';
const TEL = '+41782657071';

// Promo en cours. Mettre a null des qu'elle est terminee : les blocs dates
// disparaissent alors des 10 pages d'un coup.
const PROMO = { remise: 0.20, jusquAu: '2026-10-31', marqueur: 'PROMO-OCT-2026' };

// Arrondi suisse aux 5 centimes
function remise(prix) {
    const n = parseFloat(prix) * (1 - PROMO.remise);
    return (Math.round(n * 20) / 20).toFixed(2);
}

function arrondi5(n) {
    return (Math.round(n * 20) / 20).toFixed(2);
}

// La duree reelle n'est ecrite QU'UNE FOIS par prestation, dans le bloc
// immobilisation de prestations.json. La bulle d'information placee pres du
// bouton de reservation la relit ici plutot que de la repeter : en septembre,
// la page polish annoncait "une journee complete" en haut et "plusieurs jours"
// en bas parce que la duree etait saisie a deux endroits.
function dureeReelle(presta, langue) {
    const m = presta[langue].immobilisation &&
        presta[langue].immobilisation.match(/<strong class="text-white">(.*?)<\/strong>/);
    if (!m) {
        throw new Error(
            `[${presta.id}/${langue}] duree introuvable : le bloc "immobilisation" doit ` +
            `contenir la duree dans un <strong class="text-white">…</strong>. ` +
            `Sans elle, la bulle de reservation ne peut pas l'afficher.`
        );
    }
    return m[1];
}

// Les identifiants SumUp vivent a deux endroits : prestations.json (pour le
// gabarit) et public/js/app.js (pour l'execution). S'ils divergent, le bouton
// mene a la liste generique sans rien signaler — le bug de septembre. On fait
// donc echouer le build.
function verifierIdentifiantsSumUp() {
    const appjs = fs.readFileSync(path.join(__dirname, 'public', 'js', 'app.js'), 'utf8');
    prestations.forEach(p => {
        if (!p.sumup) throw new Error(`[${p.id}] bloc "sumup" absent de prestations.json.`);
        if (!!p.sumup.home !== !!p.domicile) {
            throw new Error(`[${p.id}] incoherence : domicile=${p.domicile} mais sumup.home=${!!p.sumup.home}.`);
        }
        Object.keys(p.sumup).forEach(lieu => {
            [p.sumup[lieu].service, p.sumup[lieu].variant].forEach(id => {
                if (!appjs.includes(id)) {
                    throw new Error(
                        `[${p.id}/${lieu}] l'identifiant ${id} est dans prestations.json ` +
                        `mais absent de public/js/app.js : le bouton tomberait sur la liste generique.`
                    );
                }
            });
        });
        if (!appjs.includes(`'${p.id}': {`)) {
            throw new Error(`[${p.id}] cle absente de CCW_OFFERS dans public/js/app.js.`);
        }
    });
}

// Le bandeau hero est l'element LCP et il est precharge : s'il manque, la page
// part en production avec un bloc vide et un prechargement en 404. On echoue au
// build plutot que de laisser passer ca.
function verifierBandeaux() {
    prestations.forEach(p => {
        ['avif', 'webp'].forEach(ext => {
            const f = path.join(__dirname, 'assets', 'images', 'prestations', `${p.id}.${ext}`);
            if (!fs.existsSync(f)) {
                throw new Error(
                    `[${p.id}] bandeau manquant : assets/images/prestations/${p.id}.${ext}. ` +
                    `Deposez la source dans assets/images/prestations-src/${p.id}.png ` +
                    `puis relancez "npm run optimize".`
                );
            }
        });
    });
}

const T = {
    fr: {
        lang: 'fr', autre: 'en', libelleAutre: 'EN', locale: 'fr_CH',
        skip: 'Passer au contenu principal', accueil: 'Accueil',
        appeler: 'Appeler Clean Cars Wash au +41 78 265 70 71',
        apartirde: 'À partir de', prixFixe: 'Prix fixe', ttc: 'CHF TTC',
        promoTitre: 'Offre d\'octobre', promoAu: 'jusqu\'au 31 octobre',
        promoTexte: n => `<strong class="text-white">&minus;20 % sur cette prestation</strong> jusqu'au 31 octobre 2026, pour les 100 premiers clients. Soit ${n} CHF TTC au lieu du tarif habituel. La remise est déduite du solde réglé sur place.`,
        lieuTitre: 'Où se déroule la prestation', lieuSurtitre: 'Lieu',
        lieuAtelierTitre: 'À notre atelier', lieuDomicileTitre: 'À votre domicile',
        lieuAtelierSeul: 'Atelier uniquement',
        immobilisationTitre: 'Votre véhicule reste immobilisé',
        reserverTitre: 'Réserver cette prestation',
        reserverDevis: a => `Vous bloquez votre rendez-vous en ligne et réglez un acompte de <strong class="text-white">${a} CHF</strong>, soit 30 % du tarif de base. Le solde est confirmé après examen du véhicule et réglé sur place.`,
        reserverFerme: (a, s) => `Vous bloquez votre créneau en ligne et réglez un acompte de <strong class="text-white">${a} CHF</strong>, soit 30 % du prix. Le solde de ${s} CHF est réglé sur place à la fin de la prestation.`,
        bullePriseEnCharge: duree => `Le créneau de 30 minutes que vous réservez est un <strong class="text-white">rendez-vous de prise en charge</strong> — le temps de déposer le véhicule et de faire le point. La prestation, elle, demande <strong class="text-white">${duree}</strong>.`,
        bulleDureeReelle: 'Le créneau que vous réservez correspond à la <strong class="text-white">durée réelle de la prestation</strong>, et non à un simple rendez-vous de dépôt.',
        ctaReserverPriseEnCharge: 'Réserver ma prise en charge', ctaReserver: 'Réserver mon créneau',
        sansJs: 'Réservation en ligne',
        appelerCta: 'Appeler pour un devis', appelerSimple: 'Nous appeler', whatsapp: 'Écrire sur WhatsApp',
        voirPrestations: 'Voir toutes nos prestations',
        modaleTitre: 'Réservation', modaleQuestion: 'Où souhaitez-vous<br>être servi&nbsp;?',
        modaleCreneau: 'Vous choisirez votre créneau, puis réglerez l\'acompte de 30&nbsp;%.',
        modaleZones: 'Déplacement offert à Genève. Sur Vaud, forfait de 39.90 ou 59.90&nbsp;CHF TTC réglé sur place',
        modaleZonesLien: 'voir les zones', modaleHome: 'À domicile / au travail', modaleGarage: 'Au garage CCW',
        modaleFermer: 'Fermer', modaleDehors: 'Touchez en dehors pour fermer',
        horaires: ['Lun–Sam : 07h30 – 22h00', 'Dimanche : Fermé'],
        contactTitre: 'Contact &amp; Horaires', infosTitre: 'Informations',
        liens: [
            ['./', 'Accueil'], ['./#services', 'Nos prestations'],
            ['./promos.html', 'Promotions &amp; Offres'], ['./zones.html', 'Zones &amp; frais de déplacement'],
            ['./abonnements.html', 'Abonnements'], ['./mentions-legales.html', 'Mentions Légales &amp; CGV']
        ],
        ville: 'Genève', tva: 'CHE-377.481.423 TVA'
    },
    en: {
        lang: 'en', autre: 'fr', libelleAutre: 'FR', locale: 'en_GB',
        skip: 'Skip to main content', accueil: 'Home',
        appeler: 'Call Clean Cars Wash on +41 78 265 70 71',
        apartirde: 'From', prixFixe: 'Fixed price', ttc: 'CHF incl. VAT',
        promoTitre: 'October offer', promoAu: 'until 31 October',
        promoTexte: n => `<strong class="text-white">20% off this service</strong> until 31 October 2026, for the first 100 customers. That is CHF ${n} incl. VAT instead of the usual rate. The discount comes off the balance settled on site.`,
        lieuTitre: 'Where the work is done', lieuSurtitre: 'Location',
        lieuAtelierTitre: 'At our workshop', lieuDomicileTitre: 'At your place',
        lieuAtelierSeul: 'Workshop only',
        immobilisationTitre: 'Your vehicle stays off the road',
        reserverTitre: 'Book this service',
        reserverDevis: a => `You book your appointment online and pay a deposit of <strong class="text-white">CHF ${a}</strong>, which is 30% of the base rate. The balance is confirmed after an inspection and settled on site.`,
        reserverFerme: (a, s) => `You book your slot online and pay a deposit of <strong class="text-white">CHF ${a}</strong>, which is 30% of the price. The balance of CHF ${s} is settled on site once the work is done.`,
        bullePriseEnCharge: duree => `The 30-minute slot you book is a <strong class="text-white">drop-off appointment</strong> — time to hand the vehicle over and go through the details. The work itself takes <strong class="text-white">${duree}</strong>.`,
        bulleDureeReelle: 'The slot you book matches the <strong class="text-white">actual duration of the work</strong>, not just a drop-off appointment.',
        ctaReserverPriseEnCharge: 'Book my drop-off', ctaReserver: 'Book my slot',
        sansJs: 'Book online',
        appelerCta: 'Call for a quote', appelerSimple: 'Call us', whatsapp: 'Message on WhatsApp',
        voirPrestations: 'See all our services',
        modaleTitre: 'Booking', modaleQuestion: 'Where would you like<br>to be served&nbsp;?',
        modaleCreneau: 'You will pick your slot, then pay the 30% deposit.',
        modaleZones: 'Travel included in Geneva. In Vaud, a flat fee of CHF 39.90 or 59.90 incl. VAT is settled on site',
        modaleZonesLien: 'see the areas', modaleHome: 'At home / at work', modaleGarage: 'At the CCW workshop',
        modaleFermer: 'Close', modaleDehors: 'Tap outside to close',
        horaires: ['Mon–Sat: 07:30 AM – 10:00 PM', 'Sunday: Closed'],
        contactTitre: 'Contact &amp; Opening hours', infosTitre: 'Information',
        liens: [
            ['./', 'Home'], ['./#services', 'Our services'],
            ['promos.html', 'Offers &amp; Promotions'], ['zones.html', 'Service areas &amp; travel fees'],
            ['subscriptions.html', 'Subscriptions'], ['legal-notices.html', 'Legal Notice &amp; Terms']
        ],
        ville: 'Geneva', tva: 'CHE-377.481.423 VAT'
    }
};

function page(presta, langue) {
    const t = T[langue];
    const d = presta[langue];
    const slugFr = presta.id;
    const slugEn = presta.slugEn;
    const slug = langue === 'fr' ? slugFr : slugEn;
    const url = langue === 'fr' ? `${BASE}/${slugFr}.html` : `${BASE}/en/${slugEn}.html`;
    const urlFr = `${BASE}/${slugFr}.html`;
    const urlEn = `${BASE}/en/${slugEn}.html`;
    const r = langue === 'fr' ? './' : '../';
    const lienAutre = langue === 'fr' ? `en/${slugEn}.html` : `../${slugFr}.html`;

    const sections = d.sections.map((s, i) => `
        <section class="pb-14 md:pb-20">
            <p class="section-index mb-3"><em>0${i + 1}</em>${s.surtitre}</p>
            <h2 class="text-2xl md:text-4xl font-display font-bold text-white uppercase tracking-tight leading-[0.95] mb-8">${s.titre}</h2>
            <div class="grid gap-6 md:grid-cols-2">
${s.items.map(([titre, texte]) => `                <div class="premium-card rounded-2xl p-6 md:p-8">
                    <h3 class="text-white font-display font-bold uppercase tracking-wider text-sm mb-2">${titre}</h3>
                    <p class="text-gray-400 font-light text-sm leading-relaxed">${texte}</p>
                </div>`).join('\n')}
            </div>
        </section>`).join('\n');

    // Immobilisation : avertissement place haut, juste sous le prix, parce que
    // c'est une contrainte que le client doit connaitre AVANT de s'engager.
    const blocImmobilisation = d.immobilisation ? `
        <section class="pb-10">
            <div class="premium-card rounded-2xl p-6 md:p-8 flex items-start gap-4" style="border-color:rgba(249,115,22,.4);">
                <svg class="w-6 h-6 shrink-0 mt-0.5" style="color:#f97316;" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <div>
                    <h2 class="text-white font-display font-bold uppercase tracking-wider text-sm mb-2">${t.immobilisationTitre}</h2>
                    <p class="text-gray-400 font-light text-sm leading-relaxed">${d.immobilisation}</p>
                </div>
            </div>
        </section>` : '';

    const blocLieu = `
        <section class="pb-14 md:pb-20">
            <p class="section-index mb-3"><em>${String(d.sections.length + 1).padStart(2, '0')}</em>${t.lieuSurtitre}</p>
            <h2 class="text-2xl md:text-4xl font-display font-bold text-white uppercase tracking-tight leading-[0.95] mb-8">${t.lieuTitre}</h2>
            <div class="grid gap-6 md:grid-cols-2">
                <div class="premium-card rounded-2xl p-6 md:p-8">
                    <h3 class="text-white font-display font-bold uppercase tracking-wider text-sm mb-2">${t.lieuAtelierTitre}</h3>
                    <p class="text-gray-400 font-light text-sm leading-relaxed">${d.lieuAtelier}</p>
                </div>
${d.lieuDomicile ? `                <div class="premium-card rounded-2xl p-6 md:p-8" style="border-color:rgba(212,175,55,.3);">
                    <h3 class="text-white font-display font-bold uppercase tracking-wider text-sm mb-2">${t.lieuDomicileTitre}</h3>
                    <p class="text-gray-400 font-light text-sm leading-relaxed">${d.lieuDomicile}</p>
                </div>` : `                <div class="premium-card rounded-2xl p-6 md:p-8 flex items-center" style="opacity:.55;">
                    <p class="text-gray-400 font-light text-sm leading-relaxed"><strong class="text-gray-300">${t.lieuAtelierSeul}.</strong></p>
                </div>`}
            </div>
        </section>`;

    // ------------------------------------------------------------------
    // Bloc de reservation
    // ------------------------------------------------------------------
    // Ces prestations sont desormais reservables en ligne : le client bloque un
    // creneau SumUp et regle 30 % d'acompte. Pour les quatre prestations longues,
    // le creneau declare dans SumUp est de 30 minutes — c'est un rendez-vous de
    // depot, pas la duree du travail (voir CLAUDE.md). La bulle le dit, sinon un
    // client qui reserve a 14h croit recuperer sa voiture a 14h30.
    const bulle = presta.priseEnCharge
        ? t.bullePriseEnCharge(dureeReelle(presta, langue))
        : t.bulleDureeReelle;

    const texteAcompte = presta.prixDes
        ? t.reserverDevis(presta.acompte)
        : t.reserverFerme(presta.acompte, arrondi5(parseFloat(presta.prix) - parseFloat(presta.acompte)));

    // Deux variantes SumUp => modale de choix. Une seule => appel direct, on
    // n'ouvre pas une modale pour une question qui n'a qu'une reponse.
    const ctaReserver = presta.domicile
        ? `<button type="button" data-track="conversion-booking" onclick="ccwLocationModalOpen('${presta.id}')"
                            class="cursor-pointer w-full sm:w-auto text-center bg-gold-400 border border-gold-400 text-charcoal-900 font-display font-bold tracking-widest uppercase text-sm py-4 px-6 md:px-10 rounded-full hover:bg-gold-500 transition-all">${presta.priseEnCharge ? t.ctaReserverPriseEnCharge : t.ctaReserver}</button>`
        : `<button type="button" id="ccw-book-direct" data-track="conversion-booking" onclick="ccwBookingDirect('${presta.id}', 'garage')"
                            class="cursor-pointer w-full sm:w-auto text-center bg-gold-400 border border-gold-400 text-charcoal-900 font-display font-bold tracking-widest uppercase text-sm py-4 px-6 md:px-10 rounded-full hover:bg-gold-500 transition-all">${presta.priseEnCharge ? t.ctaReserverPriseEnCharge : t.ctaReserver}</button>`;

    const blocReservation = `
        <section class="pb-16 md:pb-24">
            <div class="premium-card rounded-3xl p-8 md:p-12">
                <h2 class="text-xl md:text-2xl font-display font-bold text-white uppercase tracking-tight mb-4">${t.reserverTitre}</h2>
                <p class="text-gray-400 font-light leading-relaxed mb-6">${texteAcompte}</p>
                <div class="flex items-start gap-3 rounded-2xl p-4 md:p-5 mb-8" style="background:rgba(212,175,55,.06);border:1px solid rgba(212,175,55,.28);">
                    <svg class="w-5 h-5 shrink-0 mt-0.5 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    <p class="text-gray-300 font-light text-sm leading-relaxed">${bulle}</p>
                </div>
                <p class="text-gray-400 font-light text-sm leading-relaxed mb-8">${d.duree}</p>
                <div class="flex flex-wrap gap-3">
                    ${ctaReserver}
                    <a href="tel:${TEL}" class="inline-block w-full sm:w-auto text-center border border-gold-400 text-gold-400 font-display font-bold tracking-widest uppercase py-4 px-6 md:px-8 rounded-full hover:bg-gold-400 hover:text-charcoal-900 transition-all text-sm">${presta.prixDes ? t.appelerCta : t.appelerSimple}</a>
                    <a href="https://wa.me/41782657071" target="_blank" rel="noopener noreferrer" class="inline-block border border-white/15 text-gray-300 font-display font-bold tracking-widest uppercase text-xs py-4 px-6 rounded-full hover:border-gold-400 hover:text-gold-400 transition-all">${t.whatsapp}</a>
                    <a href="${r}#services" class="inline-block border border-white/15 text-gray-300 font-display font-bold tracking-widest uppercase text-xs py-4 px-6 rounded-full hover:border-gold-400 hover:text-gold-400 transition-all">${t.voirPrestations}</a>
                </div>
                <noscript>
                    <p class="text-gray-400 text-sm mt-6"><a href="https://www.sumupbookings.com/clean-car-wash-geneva#services" class="text-gold-400 underline underline-offset-2">${t.sansJs}</a></p>
                </noscript>
            </div>
        </section>
`;

    // Modale de choix du lieu, reprise de l'accueil. Uniquement sur les deux
    // prestations qui existent en deux variantes SumUp.
    const blocModale = presta.domicile ? `
    <div id="ccw-location-modal" class="hidden fixed inset-0 items-center justify-center px-4" style="z-index:300;" role="dialog" aria-modal="true" aria-labelledby="ccw-location-modal-title">
        <div class="absolute inset-0 backdrop-blur" style="background:rgba(0,0,0,0.75);" onclick="ccwLocationModalClose()" aria-hidden="true"></div>
        <div class="relative bg-charcoal-800 border border-gold-400/30 rounded-2xl p-8 w-full max-w-xs text-center" style="box-shadow:0 25px 50px rgba(0,0,0,.6);">
            <button onclick="ccwLocationModalClose()" class="absolute top-3 right-3 w-9 h-9 flex items-center justify-center text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors" aria-label="${t.modaleFermer}">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
            <p class="text-[10px] font-display tracking-[0.3em] uppercase text-gold-400 mb-3" id="ccw-location-modal-title">${t.modaleTitre}</p>
            <p class="text-white font-display font-bold text-lg leading-snug mb-3">${t.modaleQuestion}</p>
            <p class="text-gray-400 text-xs leading-snug mb-3">${t.modaleCreneau}</p>
            <p class="text-gray-400 text-[11px] leading-snug mb-6">${t.modaleZones} — <a href="./zones.html" class="text-gold-400 underline underline-offset-2">${t.modaleZonesLien}</a>.</p>
            <div class="flex flex-col gap-5">
                <div>
                    <button type="button" id="ccw-location-home" data-track="conversion-booking" onclick="ccwBookingGo('home')"
                            class="cursor-pointer w-full flex items-center justify-center gap-3 bg-gold-400 text-charcoal-900 font-display font-bold tracking-widest uppercase py-4 px-6 rounded-full hover:bg-gold-500 transition-all text-sm">${t.modaleHome}</button>
                    <p class="text-gray-400 text-[10px] leading-snug mt-2"><span id="ccw-location-home-label" class="text-gray-400"></span></p>
                </div>
                <div>
                    <button type="button" id="ccw-location-garage" data-track="conversion-booking" onclick="ccwBookingGo('garage')"
                            class="cursor-pointer w-full flex items-center justify-center gap-3 border border-gold-400 text-gold-400 font-display font-bold tracking-widest uppercase py-4 px-6 rounded-full hover:bg-gold-400 hover:text-charcoal-900 transition-all text-sm">${t.modaleGarage}</button>
                    <p class="text-gray-400 text-[10px] leading-snug mt-2"><span id="ccw-location-garage-label" class="text-gray-400"></span></p>
                </div>
            </div>
            <p class="text-gray-400 text-[10px] mt-5 uppercase tracking-widest font-display">${t.modaleDehors}</p>
        </div>
    </div>` : '';

    const blocPromo = PROMO ? `
        <!-- ${PROMO.marqueur} — bloc daté, retiré seul le ${PROMO.jusquAu} à minuit. -->
        <section data-promo-until="${PROMO.jusquAu}" class="pb-14 md:pb-20">
            <div class="premium-card rounded-2xl p-6 md:p-8" style="border-color:rgba(212,175,55,.35);">
                <p class="text-gold-400 font-display font-bold text-xs tracking-[0.3em] uppercase mb-3">${t.promoTitre}</p>
                <p class="text-gray-400 font-light text-sm leading-relaxed">${t.promoTexte(remise(presta.prix))}</p>
            </div>
        </section>` : '';

    return `<!DOCTYPE html>
<html lang="${t.lang}">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://www.googleadservices.com https://googleads.g.doubleclick.net https://pagead2.googlesyndication.com https://www.google.com https://api.sumup.com">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">

    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-QMTGD5E2NW');
      dataLayer.push({'gtm.start': new Date().getTime(), event: 'gtm.js'});
      (function () {
        var charge = false;
        function charger() {
          if (charge) return;
          charge = true;
          ['https://www.googletagmanager.com/gtm.js?id=GTM-5W69QPT3'].forEach(function (src) {
            var s = document.createElement('script');
            s.async = true; s.src = src; document.head.appendChild(s);
          });
        }
        ['pointerdown', 'keydown', 'touchstart', 'scroll'].forEach(function (type) {
          window.addEventListener(type, charger, { once: true, passive: true });
        });
        window.addEventListener('load', function () { setTimeout(charger, 3500); });
      })();
    </script>

    <!-- Page generee par generate-prestations.js depuis prestations.json. Ne pas editer ici. -->

    <title>${d.titrePage}</title>
    <meta name="description" content="${d.description}">
    <meta name="author" content="Clean Cars Wash">
    <meta name="robots" content="index, follow">

    <link rel="canonical" href="${url}">
    <link rel="alternate" hreflang="fr" href="${urlFr}">
    <link rel="alternate" hreflang="en" href="${urlEn}">
    <link rel="alternate" hreflang="x-default" href="${urlFr}">

    <meta property="og:type" content="website">
    <meta property="og:url" content="${url}">
    <meta property="og:title" content="${d.nom} — Clean Cars Wash ${t.ville}">
    <meta property="og:description" content="${d.description}">
    <meta property="og:locale" content="${t.locale}">
    <meta property="og:site_name" content="Clean Cars Wash">
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="${d.nom} — Clean Cars Wash ${t.ville}">
    <meta name="twitter:description" content="${d.description}">

    <link rel="apple-touch-icon" href="${r}assets/images/logo-v2.png">
    <link rel="icon" type="image/png" href="${r}assets/images/logo-v2.png">
    <meta name="theme-color" content="#D4AF37">

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Montserrat:wght@400;700&display=swap" onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Montserrat:wght@400;700&display=swap" rel="stylesheet"></noscript>
    <link rel="stylesheet" href="${r}assets/css/tailwind-src.css">

    <!-- Bandeau hero : c'est l'element LCP de la page, donc on le precharge.
         Le type AVIF fait que les navigateurs qui ne le lisent pas ignorent ce
         prechargement et tombent sur le repli WebP du <picture>, sans telecharger
         les deux. -->
    <link rel="preload" as="image" type="image/avif" href="${r}assets/images/prestations/${presta.id}.avif" fetchpriority="high">

    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Service",
          "name": "${d.nom}",
          "description": "${d.description.replace(/"/g, '\\"')}",
          "serviceType": "${d.nom}",
          "url": "${url}",
          "areaServed": [
            { "@type": "City", "name": "${t.ville}" },
            { "@type": "AdministrativeArea", "name": "Vaud" }
          ],
          "provider": {
            "@type": "AutoWash",
            "name": "Clean Cars Wash",
            "telephone": "${TEL}",
            "url": "${BASE}/",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "Chemin des Vergers",
              "postalCode": "1208",
              "addressLocality": "${t.ville}",
              "addressCountry": "CH"
            }
          },
          "offers": {
            "@type": "Offer",
            "price": "${presta.prix}",
            "priceCurrency": "CHF"${presta.prixDes ? ',\n            "priceSpecification": { "@type": "PriceSpecification", "minPrice": "' + presta.prix + '", "priceCurrency": "CHF" }' : ''}
          }
        },
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "${t.accueil}", "item": "${BASE}/${langue === 'en' ? 'en/' : ''}" },
            { "@type": "ListItem", "position": 2, "name": "${d.nom}", "item": "${url}" }
          ]
        }
      ]
    }
    </script>
</head>
<body class="text-gray-300 antialiased">
    <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-5W69QPT3"
    height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>

    <a href="#main-content" class="skip-link">${t.skip}</a>

    <header class="bg-charcoal-900/90 backdrop-blur-lg border-b border-white/5 sticky top-0 z-50">
        <div class="max-w-5xl mx-auto px-4 md:px-6 py-4 flex justify-between items-center gap-4">
            <a href="${r}" class="flex items-center gap-3 group" aria-label="Clean Cars Wash — ${t.accueil}">
                <img src="${r}assets/images/logo-v2-tiny.webp" alt="Logo Clean Cars Wash" width="120" height="34" loading="eager" class="h-9 md:h-11 w-auto object-contain transition-transform group-hover:scale-105">
                <span class="text-xs md:text-sm font-display font-bold text-white tracking-[0.2em] uppercase whitespace-nowrap group-hover:text-gold-400 transition-colors hidden sm:block">Clean Cars Wash</span>
            </a>
            <div class="flex items-center gap-3 md:gap-5">
                <a href="tel:${TEL}" class="hidden sm:flex items-center justify-center w-9 h-9 shrink-0 rounded-full border border-gold-400/40 text-gold-400 hover:bg-gold-400 hover:text-charcoal-900 transition-colors" title="${t.appeler}">
                    <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                    <span class="sr-only">${t.appeler}</span>
                </a>
                <div class="flex items-center gap-2 text-[10px] font-display tracking-widest uppercase border-l border-white/10 pl-4">
                    ${langue === 'fr'
                        ? `<span class="lang-active">FR</span>\n                    <span class="text-gray-700" aria-hidden="true">|</span>\n                    <a href="${lienAutre}" class="text-gray-500 hover:text-white transition">EN</a>`
                        : `<a href="${lienAutre}" class="text-gray-500 hover:text-white transition">FR</a>\n                    <span class="text-gray-700" aria-hidden="true">|</span>\n                    <span class="lang-active">EN</span>`}
                </div>
            </div>
        </div>
    </header>

    <main id="main-content" class="max-w-5xl mx-auto px-4 md:px-6">

        <!-- Rapport 1024/572 impose a partir de md : c'est le rapport natif des
             images, donc aucun recadrage et aucun sujet perdu, quelle que soit la
             largeur de l'ecran. Sous md, la hauteur suit le texte. -->
        <section class="relative overflow-hidden rounded-3xl mt-6 mb-10 md:mb-12 md:aspect-[1024/572] md:flex md:items-center">
            <picture>
                <source type="image/avif" srcset="${r}assets/images/prestations/${presta.id}.avif">
                <img src="${r}assets/images/prestations/${presta.id}.webp" alt="" aria-hidden="true"
                     width="1024" height="572" fetchpriority="high" loading="eager"
                     class="absolute inset-0 w-full h-full object-cover object-right md:object-center">
            </picture>
            <div class="presta-hero-voile" aria-hidden="true"></div>
            <div class="relative z-10 w-full px-6 py-14 md:px-12 md:py-0">
                <p class="hero-eyebrow mb-5">${d.eyebrow}</p>
                <h1 class="text-4xl md:text-6xl font-display font-bold text-white uppercase tracking-tight leading-[0.95] mb-6">
                    ${d.h1a}<br><span class="text-gold-400">${d.h1b}</span>
                </h1>
                <p class="text-gray-300 font-light leading-relaxed max-w-2xl mb-8">${d.accroche}</p>
                <p class="flex items-end flex-wrap gap-x-4 gap-y-1">
                    <span class="text-gray-400 text-sm">${presta.prixDes ? t.apartirde : t.prixFixe}</span>
                    <span class="text-4xl md:text-5xl font-display font-bold text-gold-400 leading-none">${presta.prix}</span>
                    <span class="text-gray-300 text-sm">${t.ttc}</span>
                </p>
            </div>
        </section>
${blocImmobilisation}${blocPromo}
${sections}
${blocLieu}

${blocReservation}
    </main>

    <footer class="bg-[#050505] border-t border-white/5 py-12">
        <div class="max-w-5xl mx-auto px-4 md:px-6 flex flex-col md:flex-row justify-between items-start gap-8">
            <div>
                <p class="font-display font-bold text-sm tracking-[0.2em] uppercase text-white mb-3">Clean Cars Wash</p>
                <p class="text-gray-500 text-sm mb-1">AHMED-YAHIA LM</p>
                <p class="text-gray-500 text-sm mb-1">Chemin des Vergers</p>
                <p class="text-gray-500 text-sm mb-4">1208 ${t.ville}</p>
                <a href="mailto:info@clean-cars-wash.ch" class="text-gold-400 text-sm hover:text-white transition">info@clean-cars-wash.ch</a>
            </div>
            <div>
                <p class="font-display font-bold text-[10px] tracking-[0.3em] uppercase text-white mb-3">${t.contactTitre}</p>
                <a href="tel:${TEL}" class="block text-gold-400 font-display font-bold text-sm hover:text-white transition mb-3">+41 78 265 70 71</a>
                <ul class="text-gray-500 text-sm space-y-1">
${t.horaires.map(h => `                    <li>${h}</li>`).join('\n')}
                </ul>
            </div>
            <div>
                <p class="font-display font-bold text-[10px] tracking-[0.3em] uppercase text-white mb-3">${t.infosTitre}</p>
                <ul class="text-gray-500 text-sm space-y-2">
${t.liens.map(([href, lib]) => `                    <li><a href="${href}" class="hover:text-gold-400 transition">${lib}</a></li>`).join('\n')}
                </ul>
            </div>
        </div>
        <div class="max-w-5xl mx-auto px-4 md:px-6 mt-10 pt-6 border-t border-white/5 text-center text-[10px] text-gray-600 tracking-[0.2em] uppercase">
            &copy; 2026 Clean Cars Wash &nbsp;|&nbsp; <span style="opacity:.7;">${t.tva}</span>
        </div>
    </footer>
${blocModale}
${PROMO ? `
    <!-- Garde-fou des promos datees, copie minimale de celui de public/js/app.js.
         Redondant depuis que ces pages chargent app.js, mais conserve a dessein :
         app.js est en defer, donc il s'execute apres le premier rendu. Ce script
         inline, lui, retire le bloc perime AVANT que le client ne le voie. 247
         octets pour eviter un clignotement sur une offre expiree. -->
    <script>(function(){var m=new Date();Array.prototype.forEach.call(document.querySelectorAll('[data-promo-until]'),function(e){var f=new Date(e.getAttribute('data-promo-until')+'T23:59:59');if(!isNaN(f.getTime())&&m>f){e.remove();}});})();</script>` : ''}

    <!-- app.js porte la logique de reservation SumUp (creation du panier puis
         redirection vers le calendrier de CE service). Charge en defer : ne
         bloque pas le rendu, ne compte pas dans le LCP, et il est deja en cache
         pour tout visiteur venu de l'accueil. Le chemin est absolu pour que les
         pages EN, situees dans en/, le trouvent aussi. -->
    <script src="/js/app.js" defer></script>
</body>
</html>
`;
}

verifierIdentifiantsSumUp();
verifierBandeaux();

let n = 0;
prestations.forEach(p => {
    fs.writeFileSync(path.join(__dirname, `${p.id}.html`), page(p, 'fr'));
    fs.writeFileSync(path.join(__dirname, 'en', `${p.slugEn}.html`), page(p, 'en'));
    console.log(`✅ ${p.id}.html + en/${p.slugEn}.html`);
    n += 2;
});
console.log(`🧾 ${n} pages prestations générées depuis prestations.json.`);

module.exports = { prestations, remise, PROMO };
