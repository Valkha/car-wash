/*
 * ============================================================================
 * ACCUEIL — generate-accueil.js (maquette marketing du 04.11.2026)
 * ----------------------------------------------------------------------------
 * Ecrit index.html (FR) et en/index.html (EN) depuis les donnees du site :
 * prix (offres.json, alignes sur SumUp TTC), prestations (prestations.json),
 * contact, horaires, deplacement et concours (site.json). Les textes suivent la
 * maquette du marketing, corriges sur les faits verifies (CGV, reglement du
 * concours, fiche Google).
 * Regles : jamais de « prix fixe », jamais de pont elevateur, jamais « aucun
 * supplement », l'atelier passe toujours avant le domicile.
 * Lance par `npm run generate`, avant inject-shell.js.
 * ============================================================================
 */
const fs = require('fs');
const path = require('path');
const shell = require('./site-shell.js');
const comp = require('./site-composants.js');

const ROOT = __dirname;
const SITE = shell.SITE, C = SITE.concours, CT = SITE.contact, D = SITE.deplacement, P = SITE.pages;
const OFFRES = JSON.parse(fs.readFileSync(path.join(ROOT, 'offres.json'), 'utf8'));
const PRESTA = shell.PRESTATIONS;
const esc = shell.esc;
const telCourt = CT.telAffiche.replace(/^\+41 /, '0');

const FLECHE = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const COCHE = c => `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`;
const PIN = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.1-7-11.5a7 7 0 0 1 14 0C19 14.9 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>';
const LECTURE = '<svg width="20" height="20" viewBox="0 0 24 24" fill="#0E0E10" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>';
const GOUTTE = '<svg width="20" height="20" viewBox="0 0 24 24" fill="#FFCC00" aria-hidden="true"><path d="M12 2.5s-6.5 7.4-6.5 12a6.5 6.5 0 0 0 13 0c0-4.6-6.5-12-6.5-12z"/></svg>';
const CADEAU = '<svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="8" width="18" height="13" rx="2"></rect><path d="M12 8v13M3 12h18M12 8S10 3 7.5 4.5 9 8 12 8zM12 8s2-5 4.5-3.5S15 8 12 8z"></path></svg>';

const pack = id => OFFRES.packs.find(p => p.id === id);

// Photo du lot : deposer public/images/concours/iphone-18-pro-max.webp (format portrait 4/5
// conseille, ~1000 px de haut). Sans fichier, l'emplacement garde le pictogramme.
const PHOTO_LOT = fs.existsSync(path.join(ROOT, 'public/images/concours/iphone-18-pro-max.webp')) ? '/images/concours/iphone-18-pro-max.webp' : null;
const lotVisuel = (texte, alt, grand) => PHOTO_LOT
    ? `<img class="mk-lot__photo" src="${PHOTO_LOT}" alt="${esc(alt)}" loading="${grand ? 'lazy' : 'eager'}" decoding="async"><span class="mk-lot__legende">${esc(texte)}</span>`
    : `${CADEAU}<span>${esc(texte)}</span>`;
const presta = id => PRESTA.find(p => p.id === id);
const nbsp = s => String(s).replace(/ /g, ' ');

// ---------------------------------------------------------------------------
// Textes
// ---------------------------------------------------------------------------
const T = {
    fr: {
        titre: 'Lavage auto en atelier et à domicile, Genève & Vaud | Clean Cars Wash',
        description: `Lavage et detailing auto dans notre atelier à Genève ou chez vous, à Genève et Vaud. Packs dès ${pack('argent').prix} CHF TTC, déplacement offert sur Genève. Réservation en ligne.`,
        ogDescription: 'Lavage et detailing auto dans notre atelier à Genève ou chez vous. Packs Argent, Or et Diamant, prix TTC annoncés avant de réserver.',
        ldDescription: 'Lavage et detailing auto en atelier et à domicile, à Genève et Vaud.', inLanguage: 'fr-CH', locale: 'fr_CH',
        heroEb: ['Entreprise suisse', 'Genève &amp; Vaud'],
        h1: ['Lavage auto ', 'en atelier et à domicile', ' à Genève et Vaud'],
        lead: 'Intérieur, extérieur et detailing. Dans notre atelier ou chez vous.',
        ligne: (rue, ville) => `Atelier au ${rue}, ${ville} · <strong>déplacement offert sur Genève</strong>`,
        ctaFormules: 'Voir les formules et prix', wa: 'ou écrivez-nous sur WhatsApp',
        note: '4,8 sur Google · 25 avis', horaires: '7 j/7, 7h30–22h',
        carte: { eb: 'Jeu concours', dates: '1–30 nov.', titre: lot => `Gagnez un ${lot}`, texte: 'Un lavage réalisé et payé en novembre suffit pour participer (une participation par personne).', lien: 'Comment participer →' },
        bandeLabel: 'Nos prestations',
        bande: ['Atelier', 'Polish', 'Céramique', 'Lavage à domicile', 'Shampoing sièges', 'Jantes', 'Detailing'],
        packsSous: { argent: 'Le lavage complet, dehors et dedans', or: 'Le lavage complet, intérieur remis à neuf', diamant: 'Le detailing haut de gamme' },
        nomCourt: n => n.replace(/^Pack /, ''),
        ttc: 'CHF TTC', reserver: 'Réserver', depl: 'Calculer mon déplacement',
        formulesH2: 'Trois formules,<br>des prix clairs.', formulesTxt: 'Prix TTC, affichés avant de réserver.',
        abo: 'Un lavage régulier ? Les abonnements reviennent de 10 % à 27 % moins cher →',
        chiffres: [['0 CHF', 'de déplacement à l’atelier et sur Genève'], ['7 j/7', 'de 7h30 à 22h'], ['24 h', 'pour annuler, acompte reporté'], ['30 %', 'd’acompte, par TWINT ou carte']],
        quizH2: 'Vous hésitez ?', quizTxt: 'Deux questions, et on vous oriente vers la bonne formule. Aucune donnée n’est collectée.',
        etapesH2: 'Réservé en quelques clics.',
        etapes: [
            ['Vous choisissez', 'Formule, lieu et créneau en ligne, acompte de 30 % par TWINT ou carte.'],
            ['On s’occupe de tout', 'Dans notre atelier, chez vous ou au bureau. À domicile, il faut une place privée et une prise 230V.'],
            ['Vous récupérez une voiture nette', 'Le solde se règle sur place, une fois le travail terminé.'],
        ],
        resultatH2: 'Le résultat.', resultatTxt: 'Avant / après et travail en cours, à l’atelier et chez nos clients. Touchez une image pour l’agrandir.',
        galerieLabel: 'Galerie de réalisations', lire: 'Lire en grand', agrandir: 'Agrandir',
        proEb: 'Pour les entreprises', proH2: 'Votre flotte lavée sur votre parking.',
        proLead: 'De 3 à plus de 50 véhicules. Un seul interlocuteur, une facturation centralisée, des interventions planifiées sur votre site ou à notre atelier.',
        proCta: 'Demander un devis entreprise', remisesTitre: 'Remise selon la taille de la flotte',
        remises: [['3 à 5 véhicules', 'sur chaque lavage', '−10 %'], ['5 à 7 véhicules', 'sur chaque lavage', '−20 %'], ['Plus de 7 véhicules', '+ un Pack Or offert (pour 1 véhicule)', '−25 %']],
        atelierH2: 'À l’atelier.',
        atelierTxt: rue => `Protection et personnalisation, dans notre atelier au ${rue}, à Genève. Pour le polish, le PPF, le covering et le ciel étoilé, on peut venir chercher votre véhicule et vous le ramener.`,
        atelierLien: 'Découvrir l’atelier →', atelierDevis: tel => `Demander un devis au ${tel} →`, des: 'dès ',
        atelierLignes: [
            ['polish-ceramique', 'Polish & céramique', 'Correction des micro-rayures, brillance miroir et protection longue durée.'],
            ['ppf', 'Film PPF', 'Film transparent qui protège la carrosserie des gravillons et des rayures.'],
            ['covering', 'Covering', 'Nouvelle couleur sans peinture : mat, brillant, satiné ou carbone.'],
            ['ciel-etoile', 'Ciel étoilé', 'Fibres optiques posées à la main dans le pavillon.'],
            ['nettoyage-chassis', 'Châssis & moteur', 'Châssis, compartiment moteur et passages de roue, par exemple avant la visite technique.'],
        ],
        concoursEb: 'Jeu concours · du 1er au 30 novembre', concoursH2: lot => `Un lavage en novembre, un ${lot} à gagner.`,
        concoursEtapes: ['Faites réaliser une prestation entre le 1er et le 30 novembre.', 'Une fois la prestation payée, vous êtes inscrit au tirage (une participation par personne).', 'Tirage au sort le 22 décembre 2026. Le gagnant est contacté personnellement.'],
        concoursCta: 'Réserver et participer', reglement: 'Règlement du jeu',
        avisH2: 'Ils en parlent mieux que nous.', avisNote: '25 avis Google →', avisSource: 'Avis Google',
        deplH2: 'Combien coûte le déplacement ?', deplTxt: 'À l’atelier, aucun frais. Pour un lavage chez vous, tapez votre adresse ou votre commune, ou touchez la carte.',
        deplLabel: 'Adresse ou commune de la voiture', deplPlaceholder: 'Ex. Rue de la Gare 1, Nyon', deplVide: 'Votre commune', deplNote: 'Tapez une adresse ou touchez la carte',
        legende: [`Genève · offert`, `Vaud zone orange · ${D.orange.prix} CHF`, `Vaud zone rouge · ${D.rouge.prix} CHF`],
        france: tel => `Voiture en France voisine ? <a href="tel:${tel}">Appelez-nous</a> pour un devis.`, zones: 'Toutes les zones',
        carteLabel: `Carte des zones de déplacement : canton de Genève offert, zone orange ${D.orange.prix} CHF, zone rouge ${D.rouge.prix} CHF`,
        carteAide: 'Survolez ou touchez une commune',
        faqH2: 'Questions fréquentes', faqTxt: tel => `Une autre question ? Appelez-nous au <a href="tel:${CT.tel}">${tel}</a>.`,
        faq: [
            ['Que dois-je prévoir pour un lavage chez moi ?', 'Une place de parking privative (garage, allée ou parking résidentiel) et une prise électrique 230V, toutes deux obligatoires ; un point d’eau est recommandé. À l’atelier, vous n’avez rien à prévoir.'],
            ['Combien coûte le déplacement ?', `Rien à l’atelier. À domicile, il est offert dans tout le canton de Genève. Sur Vaud, un forfait s’ajoute selon le district : ${D.orange.prix} CHF (Nyon, Morges, Ouest lausannois, Lausanne, Gros-de-Vaud) ou ${D.rouge.prix} CHF pour les autres districts. Il est annoncé avant de payer.`],
            ['Comment se passe le paiement ?', 'Vous choisissez votre formule, le lieu et votre créneau, puis vous réglez un acompte de 30 % en ligne, par TWINT ou carte bancaire, sécurisé par SumUp. Le solde se règle sur place. Jusqu’à 24 h avant le rendez-vous, l’acompte est reporté sur une prochaine réservation. Moins de 24 h avant, il reste acquis.'],
            ['Comment participer au jeu concours ?', 'Il suffit qu’une prestation soit réalisée et payée entre le 1er et le 30 novembre 2026 : vous êtes inscrit automatiquement, une participation par personne. Tirage au sort le 22 décembre 2026.', 'concours'],
            ['Quelle différence entre un polish et un traitement céramique ?', 'Le polish corrige la laque (micro-rayures, traces de lavage) ; la céramique la protège et fait perler l’eau. La céramique vient toujours après la correction : c’est ce que réunit le Pack Polish Céramique, dès 999 CHF TTC sur devis.'],
            ['Qu’est-ce que le PPF ?', 'Un film transparent qui encaisse gravillons et rayures à la place de votre laque. La pose exige un environnement sans poussière : elle se fait exclusivement à l’atelier, et demande une journée complète minimum.'],
        ],
        medias: [
            ['Avant / après : nettoyage intérieur, sièges arrière et tapis débarrassés des miettes et de la poussière', 'Intérieur', 'Avant / après'],
            ['Vidéo avant / après : nettoyage d’un coffre, moquette débarrassée de la poussière et des débris', 'Coffre', 'Avant / après · vidéo'],
            ['Avant / après : lavage extérieur, avant d’une petite citadine blanche couvert d’insectes puis propre', 'Carrosserie', 'Avant / après'],
            ['Avant / après : panneau de porte intérieur en cuir, taches et traces retirées', 'Portière en cuir', 'Avant / après'],
            ['Vidéo : polissage d’un capot à la polisseuse', 'Polissage', 'À l’atelier · vidéo'],
            ['Vidéo : nettoyage d’un siège en cuir à la brosse', 'Siège en cuir', 'Intérieur · vidéo'],
            ['Prélavage d’un SUV à la mousse active', 'Mousse active', 'Prélavage'],
            ['Vidéo : lavage d’une roue et de sa jante', 'Jantes', 'Lavage · vidéo'],
            ['Polissage de la carrosserie à la polisseuse', 'Polish', 'Correction de la laque'],
            ['Vidéo : nettoyage de la console centrale au pinceau', 'Console', 'Intérieur · vidéo'],
            ['Habitacle en cuir clair après nettoyage', 'Cuir clair', 'Après nettoyage'],
            ['Vidéo : brossage de la moquette', 'Moquette', 'Intérieur · vidéo'],
            ['Mousse active et rinçage d’une jante', 'Jante', 'Mousse active'],
            ['Vidéo : rinçage extérieur vu depuis l’habitacle', 'Rinçage', 'Extérieur · vidéo'],
            ['Produits de polissage, polisseuse et microfibres à l’atelier', 'L’atelier', 'Produits et polisseuse'],
            ['Volant et tableau de bord après nettoyage intérieur', 'Poste de conduite', 'Après nettoyage'],
            ['Mousse active sur l’aile avant d’une berline', 'Berline', 'Mousse active'],
            ['Habitacle en cuir noir après nettoyage', 'Cuir noir', 'Après nettoyage'],
        ],
    },
    en: {
        titre: 'Car wash in our workshop and at home, Geneva & Vaud | Clean Cars Wash',
        description: `Car wash and detailing in our Geneva workshop or at your place, across Geneva and Vaud. Packs from CHF ${pack('argent').prix} incl. VAT, travel included in Geneva. Book online.`,
        ogDescription: 'Car wash and detailing in our Geneva workshop or at your place. Silver, Gold and Diamond packs, prices incl. VAT shown before you book.',
        ldDescription: 'Car wash and detailing in our workshop and at home, in Geneva and Vaud.', inLanguage: 'en', locale: 'en_GB',
        heroEb: ['Swiss company', 'Geneva &amp; Vaud'],
        h1: ['Car wash ', 'in our workshop and at home', ' in Geneva and Vaud'],
        lead: 'Interior, exterior and detailing. In our workshop or at your place.',
        ligne: (rue, ville) => `Workshop at ${rue}, ${ville === 'Genève' ? 'Geneva' : ville} · <strong>travel included in Geneva</strong>`,
        ctaFormules: 'See packs and prices', wa: 'or message us on WhatsApp',
        note: '4.8 on Google · 25 reviews', horaires: '7 days a week, 7:30am–10pm',
        carte: { eb: 'Giveaway', dates: '1–30 Nov', titre: lot => `Win an ${lot}`, texte: 'One service carried out and paid for in November is all it takes to enter (one entry per person).', lien: 'How to enter →' },
        bandeLabel: 'Our services',
        bande: ['Workshop', 'Polish', 'Ceramic', 'Car wash at home', 'Seat shampoo', 'Rims', 'Detailing'],
        packsSous: { argent: 'The full wash, outside and in', or: 'The full wash, interior brought back', diamant: 'High-end detailing' },
        nomCourt: n => n.replace(/ Pack$/, ''),
        ttc: 'CHF incl. VAT', reserver: 'Book', depl: 'Work out my travel fee',
        formulesH2: 'Three packs,<br>clear prices.', formulesTxt: 'Prices incl. VAT, shown before you book.',
        abo: 'Washing regularly? Subscriptions work out 10% to 27% cheaper →',
        chiffres: [['CHF 0', 'travel fee at the workshop and in Geneva'], ['7/7', 'from 7:30am to 10pm'], ['24 h', 'to cancel, deposit carried over'], ['30%', 'deposit, by TWINT or card']],
        quizH2: 'Not sure?', quizTxt: 'Two questions and we point you to the right package. No data is collected.',
        etapesH2: 'Booked in a few clicks.',
        etapes: [
            ['You choose', 'Pack, place and time slot online, 30% deposit by TWINT or card.'],
            ['We take care of everything', 'In our workshop, at your home or at the office. At home, we need a private parking space and a 230V socket.'],
            ['You get a clean car back', 'The balance is settled on site, once the work is done.'],
        ],
        resultatH2: 'The result.', resultatTxt: 'Before / after and work in progress, in our workshop and at our customers’. Tap an image to enlarge it.',
        galerieLabel: 'Gallery of our work', lire: 'Play full size', agrandir: 'Enlarge',
        proEb: 'For businesses', proH2: 'Your fleet washed in your car park.',
        proLead: 'From 3 to more than 50 vehicles. One contact, centralised invoicing, scheduled visits at your site or at our workshop.',
        proCta: 'Request a business quote', remisesTitre: 'Discount by fleet size',
        remises: [['3 to 5 vehicles', 'on every wash', '−10%'], ['5 to 7 vehicles', 'on every wash', '−20%'], ['More than 7 vehicles', '+ one free Gold Pack (for 1 vehicle)', '−25%']],
        atelierH2: 'In the workshop.',
        atelierTxt: rue => `Protection and customisation, in our workshop at ${rue}, Geneva. For polish, PPF, wrapping and starlight headliners, we can collect your vehicle and bring it back.`,
        atelierLien: 'Discover the workshop →', atelierDevis: tel => `Ask for a quote on ${tel} →`, des: 'from ',
        atelierLignes: [
            ['polish-ceramique', 'Polish & ceramic', 'Swirl correction, mirror gloss and long-lasting protection.'],
            ['ppf', 'PPF film', 'Clear film that protects the bodywork from stone chips and scratches.'],
            ['covering', 'Wrapping', 'A new colour without paint: matte, gloss, satin or carbon.'],
            ['ciel-etoile', 'Starlight headliner', 'Fibre optics fitted by hand in the roof lining.'],
            ['nettoyage-chassis', 'Chassis & engine', 'Chassis, engine bay and wheel arches, for example before the vehicle inspection.'],
        ],
        concoursEb: 'Giveaway · 1 to 30 November', concoursH2: lot => `A wash in November, an ${lot} to win.`,
        concoursEtapes: ['Have a service carried out between 1 and 30 November.', 'Once the service is paid for, you are entered in the draw (one entry per person).', 'Draw on 22 December 2026. The winner is contacted personally.'],
        concoursCta: 'Book and enter', reglement: 'Giveaway rules',
        avisH2: 'They say it better than we do.', avisNote: '25 Google reviews →', avisSource: 'Google review, in French',
        deplH2: 'How much is the travel fee?', deplTxt: 'Nothing at the workshop. For a wash at your place, type your address or municipality, or tap the map.',
        deplLabel: 'Address or municipality of the car', deplPlaceholder: 'E.g. Rue de la Gare 1, Nyon', deplVide: 'Your municipality', deplNote: 'Type an address or tap the map',
        legende: [`Geneva · free`, `Vaud orange zone · CHF ${D.orange.prix}`, `Vaud red zone · CHF ${D.rouge.prix}`],
        france: tel => `Car in neighbouring France? <a href="tel:${tel}">Call us</a> for a quote.`, zones: 'All areas',
        carteLabel: `Travel zones map: canton of Geneva free, orange zone CHF ${D.orange.prix}, red zone CHF ${D.rouge.prix}`,
        carteAide: 'Hover or tap a municipality',
        faqH2: 'Frequently asked questions', faqTxt: tel => `Another question? Call us on <a href="tel:${CT.tel}">${tel}</a>.`,
        faq: [
            ['What do I need for a wash at home?', 'A private parking space (garage, driveway or residential car park) and a 230V power socket, both required; a water point is recommended. At the workshop, you don’t need anything.'],
            ['How much is the travel fee?', `Nothing at the workshop. At home, travel is included across the canton of Geneva. In Vaud, a flat fee is added depending on the district: CHF ${D.orange.prix} (Nyon, Morges, Ouest lausannois, Lausanne, Gros-de-Vaud) or CHF ${D.rouge.prix} for the other districts. It is shown before you pay.`],
            ['How does payment work?', 'You choose your pack, the place and your time slot, then pay a 30% deposit online by TWINT or card, secured by SumUp. The balance is settled on site. Up to 24 hours before the appointment, the deposit is carried over to a future booking. Less than 24 hours before, it is retained.'],
            ['How do I enter the giveaway?', 'A service carried out and paid for between 1 and 30 November 2026 is all it takes: you are entered automatically, one entry per person. Draw on 22 December 2026.', 'concours'],
            ['What is the difference between a polish and a ceramic coating?', 'A polish corrects the paint (swirls, wash marks); a ceramic coating protects it and makes water bead. The coating always comes after the correction: that is what the Polish Ceramic Pack combines, from CHF 999 incl. VAT on quotation.'],
            ['What is PPF?', 'A clear film that takes stone chips and scratches instead of your paint. Fitting it requires a dust-free environment: it is done exclusively at the workshop and takes at least one full day.'],
        ],
        medias: [
            ['Before / after: interior cleaning, rear seats and mats cleared of crumbs and dust', 'Interior', 'Before / after'],
            ['Before / after video: boot cleaning, carpet cleared of dust and debris', 'Boot', 'Before / after · video'],
            ['Before / after: exterior wash, front of a small white city car covered in insects, then clean', 'Bodywork', 'Before / after'],
            ['Before / after: leather door panel, stains and marks removed', 'Leather door', 'Before / after'],
            ['Video: polishing a bonnet with a machine polisher', 'Polishing', 'In the workshop · video'],
            ['Video: brushing a leather seat clean', 'Leather seat', 'Interior · video'],
            ['Pre-wash of an SUV with snow foam', 'Snow foam', 'Pre-wash'],
            ['Video: washing a wheel and its rim', 'Rims', 'Wash · video'],
            ['Machine polishing the bodywork', 'Polish', 'Paint correction'],
            ['Video: cleaning the centre console with a brush', 'Console', 'Interior · video'],
            ['Light leather interior after cleaning', 'Light leather', 'After cleaning'],
            ['Video: brushing the carpet', 'Carpet', 'Interior · video'],
            ['Snow foam and rinsing on a rim', 'Rim', 'Snow foam'],
            ['Video: exterior rinse seen from inside the car', 'Rinse', 'Exterior · video'],
            ['Polishing products, polisher and microfibres in the workshop', 'The workshop', 'Products and polisher'],
            ['Steering wheel and dashboard after interior cleaning', 'Driver’s seat', 'After cleaning'],
            ['Snow foam on the front wing of a saloon', 'Saloon', 'Snow foam'],
            ['Black leather interior after cleaning', 'Black leather', 'After cleaning'],
        ],
    },
};

// Medias de « Le résultat. » : vrais avant/apres d'abord, puis le travail en video et en photo.
const MEDIAS = [
    { img: 'avant-apres-interieur.webp', aa: true },
    { img: 'avant-apres-video-poster.webp', video: 'avant-apres-video.mp4', aa: true },
    { img: 'avant-apres-carrosserie.webp', aa: true },
    { img: 'avant-apres-portiere.webp', aa: true },
    { img: 'video-polissage-poster.webp', video: 'video-polissage.mp4' },
    { img: 'video-siege-cuir-poster.webp', video: 'video-siege-cuir.mp4' },
    { img: 'photo-mousse-suv.webp' },
    { img: 'video-jante-poster.webp', video: 'video-jante.mp4' },
    { img: 'photo-polissage.webp' },
    { img: 'video-console-poster.webp', video: 'video-console.mp4' },
    { img: 'photo-interieur-cuir-creme.webp' },
    { img: 'video-moquette-poster.webp', video: 'video-moquette.mp4' },
    { img: 'photo-mousse-jante.webp' },
    { img: 'video-rincage-poster.webp', video: 'video-rincage.mp4' },
    { img: 'photo-produits-polish.webp' },
    { img: 'photo-volant.webp' },
    { img: 'photo-mousse-aile.webp' },
    { img: 'photo-interieur-cuir-noir.webp' },
];

// Avis Google reels, cites mot pour mot (fiche Google, 25 avis, 4,8). Ils
// restent en francais sur la page anglaise : on ne traduit pas un avis.
const AVIS = [
    { texte: 'Excellent service, je suis vraiment satisfait du résultat. L’équipe est professionnelle, accueillante et très efficace. Ma voiture est ressortie impeccable, comme neuve ! […]', extrait: 'Excellent service, je suis vraiment satisfait du résultat. […] Ma voiture est ressortie impeccable, comme neuve !', nom: 'Aymen S.' },
    { texte: 'Service impeccable à tous points de vue : prise en charge facile et très sympathique, nettoyage intérieur et extérieur parfait, jusque dans les moindres recoins. Plus aucune saleté, excellent rapport qualité-prix. J’y retournerai sans hésiter.', nom: 'Olivier D.' },
    { texte: 'Ma voiture était dans un état catastrophique et je l’ai récupérée impeccable, propre dans les moindres détails. En plus de la qualité du travail, j’ai apprécié le sérieux, la gentillesse et le professionnalisme de l’équipe. […]', nom: 'Amina D.' },
];

// ---------------------------------------------------------------------------
function img(src, alt, { w, h, lazy = true, cls = '' } = {}) {
    return `<img src="${src}" alt="${esc(alt)}"${w ? ` width="${w}" height="${h}"` : ''}${lazy ? ' loading="lazy" decoding="async"' : ''}${cls ? ` class="${cls}"` : ''}>`;
}
const texture = (jaune = false) => `<img class="mk-caus" src="/images/mkt/caustique-${jaune ? 'or' : 'clair'}.svg" alt="" aria-hidden="true">
            <img class="mk-mousse" src="/images/mkt/mousse.webp" srcset="/images/mkt/mousse-800.webp 800w, /images/mkt/mousse.webp 1400w" sizes="100vw" alt="" aria-hidden="true" loading="lazy">`;

function hero(L) {
    const t = T[L];
    return `
    <section id="top" class="mk-a-hero" aria-labelledby="mk-h1">
        <div class="mk-panneau mk-panneau--noir" data-bulles>
            <picture class="mk-a-hero__photo">
                <source media="(max-width: 768px)" srcset="/images/accueil/hero-bg-mobile.webp">
                <img src="/images/accueil/hero-bg-opt.webp" alt="" aria-hidden="true" fetchpriority="high" decoding="async">
            </picture>
            <div class="mk-a-hero__voile" aria-hidden="true"></div>
            <img class="mk-caus" src="/images/mkt/caustique-clair.svg" alt="" aria-hidden="true">
            <img class="mk-mousse mk-mousse--hero" src="/images/mkt/mousse.webp" srcset="/images/mkt/mousse-800.webp 800w, /images/mkt/mousse.webp 1400w" sizes="100vw" alt="" aria-hidden="true">
            <div class="mk-a-hero__in">
                <div class="mk-a-hero__texte">
                    <p class="mk-a-hero__eb mk-in mk-d1"><span class="mk-suisse" aria-hidden="true">+</span>${t.heroEb[0]}<span class="mk-trait" aria-hidden="true"></span>${t.heroEb[1]}</p>
                    <h1 id="mk-h1" class="mk-a-hero__h1 mk-in mk-d2">${t.h1[0]}<span class="mk-brille">${t.h1[1]}</span>${t.h1[2]}</h1>
                    <p class="mk-a-hero__lead mk-in mk-d3">${t.lead}</p>
                    <p class="mk-a-hero__ligne mk-in mk-d3">${t.ligne(CT.adresse.rue, CT.adresse.ville)}</p>
                    <div class="mk-a-hero__ctas mk-in mk-d4">
                        <a href="#formules" class="mk-btn mk-btn--jaune mk-btn--grand mk-reflet">${t.ctaFormules}${FLECHE}</a>
                        <a href="https://wa.me/${CT.whatsapp}" class="mk-a-hero__wa" target="_blank" rel="noopener noreferrer">${t.wa}</a>
                    </div>
                    <p class="mk-a-hero__note mk-in mk-d5"><a href="#avis"><span class="mk-etoiles" aria-hidden="true">★★★★★</span> ${t.note}</a> · ${t.horaires}</p>
                </div>
                <a href="#concours" class="mk-a-hero__carte mk-in mk-d5" data-concours data-promo-from="${C.debut}" data-promo-until="${C.fin}">
                    <span class="mk-a-hero__carte-haut"><span>${t.carte.eb}</span><span class="mk-pastille">${t.carte.dates}</span></span>
                    <span class="mk-lot mk-lot--petit${PHOTO_LOT ? ' mk-lot--photo' : ''}" aria-hidden="true">${lotVisuel(C.lot[L], C.lotDetail[L], false)}</span>
                    <span class="mk-a-hero__carte-titre">${esc(t.carte.titre(C.lot[L]))}</span>
                    <span class="mk-a-hero__carte-texte">${t.carte.texte}</span>
                    <span class="mk-a-hero__carte-lien">${t.carte.lien}</span>
                </a>
            </div>
        </div>
    </section>`;
}

function bande(L) {
    const t = T[L];
    const item = (x, cache) => `<li${cache ? ' aria-hidden="true"' : ''}>${esc(x)}${GOUTTE}</li>`;
    const serie = cache => t.bande.map(x => item(x, cache)).join('');
    return `
    <section class="mk-bande" aria-label="${t.bandeLabel}">
        <div class="mk-bande__ruban">
            <ul class="mk-bande__piste">${serie(false)}${serie(true)}${serie(true)}${serie(true)}</ul>
        </div>
    </section>`;
}

function carteFormule(p, L) {
    const t = T[L], d = p[L], principal = !!p.badge;
    const nomCourt = t.nomCourt(d.nom);
    return `
                <article class="mk-formule${principal ? ' mk-formule--principale' : ''} mk-carte-in" id="offre-${p.id}">
                    ${principal ? `<span class="mk-formule__badge">${esc(p.badge[L])}</span>` : ''}
                    <h3 class="mk-formule__nom">${esc(nomCourt)}</h3>
                    <p class="mk-formule__sous">${esc(t.packsSous[p.id])} · ${nbsp(esc(d.duree))}</p>
                    <p class="mk-formule__prix"><span>${p.prix}</span> ${t.ttc}</p>
                    <ul class="mk-formule__liste">
${d.inclus.map(x => `                        <li>${COCHE(principal ? '#FFCC00' : '#0E0E10')}<span>${esc(x)}</span></li>`).join('\n')}
                    </ul>
                    <button type="button" class="mk-btn ${principal ? 'mk-btn--jaune mk-reflet' : 'mk-btn--contour'}" onclick="ccwLocationModalOpen('${p.id}')">${t.reserver} ${esc(nomCourt)}${FLECHE}</button>
                    <a href="#deplacement" class="mk-formule__depl">${PIN}<span>${t.depl}</span></a>
                </article>`;
}

function formules(L) {
    const t = T[L];
    const ordre = ['argent', 'or', 'diamant'].map(pack);
    return `
    <section id="formules" class="mk-a-formules">
        <div class="mk-conteneur">
            <div class="mk-tete">
                <h2 class="mk-h2 mk-revele">${t.formulesH2}</h2>
                <p class="mk-tete__texte">${t.formulesTxt}</p>
            </div>
            <div class="mk-formules">${ordre.map(p => carteFormule(p, L)).join('')}
            </div>
            <p class="mk-a-formules__abo"><a href="${P.abonnements[L]}">${t.abo}</a></p>
            <ul class="mk-chiffres">
${t.chiffres.map(([a, b]) => `                <li class="mk-carte-in"><strong>${a}</strong><span>${b}</span></li>`).join('\n')}
            </ul>
        </div>
    </section>`;
}

function questionnaire(L) {
    const t = T[L];
    return `
    <section id="questionnaire" class="mk-a-quiz">
        <div class="mk-conteneur">
            <div class="mk-tete">
                <h2 class="mk-h2 mk-h2--moyen mk-revele">${t.quizH2}</h2>
                <p class="mk-tete__texte">${t.quizTxt}</p>
            </div>
            ${comp.questionnaire(L, { id: 'ccw-quiz-accueil' })}
        </div>
    </section>`;
}

function etapes(L) {
    const t = T[L];
    return `
    <section class="mk-a-etapes" aria-labelledby="mk-etapes-titre">
        <div class="mk-conteneur mk-etapes">
            <h2 class="mk-h2 mk-h2--moyen mk-revele" id="mk-etapes-titre">${t.etapesH2}</h2>
${t.etapes.map(([a, x], i) => `            <div class="mk-etape mk-carte-in"><span class="mk-etape__n">${i + 1}</span><h3>${a}</h3><p>${x}</p></div>`).join('\n')}
        </div>
    </section>`;
}

function resultat(L) {
    const t = T[L];
    const tuile = (m, i) => {
        const [alt, titre, sous] = t.medias[i];
        return `
                <li class="mk-media mk-carte-in${m.video ? ' mk-media--video' : ''}">
                    <button type="button" class="mk-media__btn" data-zoom${m.video ? ` data-video="/images/accueil/${m.video}"` : ''} aria-label="${m.video ? t.lire : t.agrandir} : ${esc(alt)}">
                        <span class="mk-media__cadre">
                            ${img('/images/accueil/' + m.img, alt, { lazy: i > 1 })}
                            ${m.video ? `<span class="mk-media__play" aria-hidden="true">${LECTURE}</span>` : ''}
                        </span>
                    </button>
                    <p class="mk-media__titre">${esc(titre)}</p>
                    <p class="mk-media__sous">${esc(sous)}</p>
                </li>`;
    };
    return `
    <section id="realisations" class="mk-a-resultat">
        <div class="mk-conteneur">
            <div class="mk-tete">
                <h2 class="mk-h2 mk-revele">${t.resultatH2}</h2>
                <p class="mk-tete__texte">${t.resultatTxt}</p>
            </div>
        </div>
        <ul id="galerie" class="mk-defile" aria-label="${t.galerieLabel}">${MEDIAS.map(tuile).join('')}
        </ul>
    </section>`;
}

function entreprises(L) {
    const t = T[L];
    return `
    <section id="entreprises" class="mk-a-pro">
        <div class="mk-panneau mk-panneau--noir mk-panneau--section">
            ${texture()}
            <div class="mk-a-pro__in">
                <div class="mk-a-pro__texte">
                    <p class="mk-eb mk-eb--jaune">${t.proEb}</p>
                    <h2 class="mk-h2 mk-revele">${t.proH2}</h2>
                    <p class="mk-a-pro__lead">${t.proLead}</p>
                    <div class="mk-a-pro__ctas">
                        <a href="${P.professionnels[L]}" class="mk-btn mk-btn--jaune mk-btn--grand mk-reflet">${t.proCta}${FLECHE}</a>
                        <a href="mailto:${CT.email}" class="mk-a-pro__mail">${CT.email}</a>
                    </div>
                </div>
                <div class="mk-a-pro__remises">
                    <p class="mk-a-pro__remises-titre">${t.remisesTitre}</p>
${t.remises.map(([a, b, c], i) => `                    <div class="mk-remise mk-carte-in"><div><strong>${a}</strong><span>${b}</span></div><span class="mk-remise__val${i === 2 ? ' mk-remise__val--jaune' : ''}">${c}</span></div>`).join('\n')}
                </div>
            </div>
        </div>
    </section>`;
}

function atelier(L) {
    const t = T[L];
    const prix = p => L === 'fr' ? `<strong>${p.prix}</strong> CHF` : `CHF <strong>${p.prix}</strong>`;
    return `
    <section id="atelier" class="mk-a-atelier">
        <div class="mk-conteneur mk-a-atelier__in">
            <div class="mk-a-atelier__texte">
                <h2 class="mk-h2 mk-h2--atelier mk-revele">${t.atelierH2}</h2>
                <p>${t.atelierTxt(CT.adresse.rue)}</p>
                <a href="${P.atelier[L]}" class="mk-lien-fort">${t.atelierLien}</a>
                <a href="tel:${CT.tel}" class="mk-lien-fort">${t.atelierDevis(telCourt)}</a>
            </div>
            <ul class="mk-a-atelier__liste">
${t.atelierLignes.map(([id, nom, txt]) => { const p = presta(id); return `                <li class="mk-carte-in"><a href="${shell.urlPrestation(p, L)}" class="mk-a-atelier__nom">${nom}</a><span class="mk-a-atelier__prix">${p.prixDes ? t.des : ''}${prix(p)}</span><p>${txt}</p></li>`; }).join('\n')}
            </ul>
        </div>
    </section>`;
}

function concours(L) {
    const t = T[L];
    return `
    <section id="concours" class="mk-a-concours" data-concours data-promo-from="${C.debut}" data-promo-until="${C.fin}">
        <div class="mk-panneau mk-panneau--jaune mk-panneau--section">
            ${texture(true)}
            <div class="mk-a-concours__in">
                <div class="mk-a-concours__texte">
                    <p class="mk-eb">${t.concoursEb}</p>
                    <h2 class="mk-h2 mk-h2--grand mk-revele">${esc(t.concoursH2(C.lot[L]))}</h2>
                    <ol class="mk-a-concours__etapes">
${t.concoursEtapes.map((x, i) => `                        <li class="mk-carte-in"><span>${i + 1}</span>${x}</li>`).join('\n')}
                    </ol>
                    <div class="mk-a-concours__ctas">
                        <a href="${shell.urlReserver(L)}" class="mk-btn mk-btn--noir mk-btn--grand mk-reflet">${t.concoursCta}${FLECHE}</a>
                        <a href="${P['jeu-concours'][L]}" class="mk-lien-fort">${t.reglement}</a>
                    </div>
                </div>
                <div class="mk-lot mk-lot--grand mk-incline${PHOTO_LOT ? ' mk-lot--photo' : ''}"${PHOTO_LOT ? '' : ' aria-hidden="true"'}>${lotVisuel(C.lotDetail[L], C.lotDetail[L], true)}</div>
            </div>
        </div>
    </section>`;
}

function avis(L) {
    const t = T[L];
    const [a0, ...autres] = AVIS;
    const lang = L === 'fr' ? '' : ' lang="fr"';
    const note = L === 'fr' ? '4,8' : '4.8';
    return `
    <section id="avis" class="mk-a-avis">
        <div class="mk-conteneur">
            <div class="mk-tete">
                <h2 class="mk-h2 mk-revele">${t.avisH2}</h2>
                <a href="${CT.ficheGoogle}" class="mk-a-avis__note" target="_blank" rel="noopener noreferrer"><strong>${note}</strong><span><span class="mk-etoiles mk-etoiles--fonce" aria-hidden="true">★★★★★</span> ${t.avisNote}</span></a>
            </div>
            <div class="mk-a-avis__grille">
                <figure class="mk-avis mk-avis--grand mk-carte-in"><blockquote${lang}>« ${esc(a0.extrait)} »</blockquote><figcaption><strong>${esc(a0.nom)}</strong> · ${t.avisSource}</figcaption></figure>
${autres.map(a => `                <figure class="mk-avis mk-carte-in"><blockquote${lang}>« ${esc(a.texte)} »</blockquote><figcaption><strong>${esc(a.nom)}</strong> · ${t.avisSource}</figcaption></figure>`).join('\n')}
            </div>
        </div>
    </section>`;
}

function deplacement(L) {
    const t = T[L];
    return `
    <section id="deplacement" class="mk-a-depl">
        <div class="mk-conteneur mk-a-depl__in">
            <div class="mk-a-depl__texte">
                <h2 class="mk-h2 mk-revele">${t.deplH2}</h2>
                <p class="mk-tete__texte">${t.deplTxt}</p>
                <div class="mk-depl" data-depl>
                    <label for="zr-input" class="mk-depl__label">${t.deplLabel}</label>
                    <div class="mk-depl__champ">
                        ${PIN}
                        <input id="zr-input" type="text" autocomplete="off" placeholder="${t.deplPlaceholder}" aria-describedby="zr-note" aria-controls="zr-liste" aria-autocomplete="list" role="combobox" aria-expanded="false">
                        <ul id="zr-liste" class="mk-depl__liste" role="listbox" hidden></ul>
                    </div>
                    <div id="zr-card" class="mk-depl__carte" aria-live="polite">
                        <div><p id="zr-place" class="mk-depl__lieu">${t.deplVide}</p><p id="zr-note" class="mk-depl__note">${t.deplNote}</p></div>
                        <p id="zr-price" class="mk-depl__prix">—</p>
                    </div>
                    <ul class="mk-depl__legende">
                        <li><span style="background:#3BAF62"></span>${t.legende[0]}</li>
                        <li><span style="background:#F2994A"></span>${t.legende[1]}</li>
                        <li><span style="background:#D9483B"></span>${t.legende[2]}</li>
                    </ul>
                    <p class="mk-depl__fr">${t.france(CT.tel)} <a href="${P.zones[L]}">${t.zones}</a></p>
                </div>
            </div>
            <div class="mk-a-depl__carte">
                <div class="mk-carte" id="zr-carte" data-src="/data/carte-zones.svg" data-communes="/data/communes.json" data-label="${t.carteLabel}"></div>
                <p id="zr-hover" class="mk-carte__aide">${t.carteAide}</p>
            </div>
        </div>
    </section>`;
}

function faq(L) {
    const t = T[L];
    return `
    <section id="faq" class="mk-a-faq">
        <div class="mk-conteneur mk-a-faq__in">
            <div class="mk-a-faq__texte">
                <h2 class="mk-h2 mk-h2--atelier mk-revele">${t.faqH2}</h2>
                <p>${t.faqTxt(telCourt)}</p>
            </div>
            <div class="mk-a-faq__liste">
${t.faq.map(([q, r, k]) => `                <details class="mk-faq mk-carte-in"${k === 'concours' ? ` data-concours data-promo-from="${C.debut}" data-promo-until="${C.fin}"` : ''}><summary><span>${esc(q)}</span><span class="mk-faq__plus" aria-hidden="true">+</span></summary><p>${esc(r)}</p></details>`).join('\n')}
            </div>
        </div>
    </section>`;
}

// ---------------------------------------------------------------------------
function jsonld(L) {
    const t = T[L];
    const base = SITE.base;
    const prix = OFFRES.packs.map(p => Number(p.prix));
    const autoWash = {
        '@context': 'https://schema.org', '@type': 'AutoWash', name: 'Clean Cars Wash Genève',
        image: `${base}/assets/images/MB-01-opt.webp`, '@id': base, url: base, telephone: CT.tel, vatID: CT.tva.replace(/ TVA$/, ''),
        priceRange: `CHF ${Math.floor(Math.min(...prix))}–${Math.floor(Math.max(...prix))}`, currenciesAccepted: 'CHF',
        address: { '@type': 'PostalAddress', streetAddress: CT.adresse.rue, addressLocality: CT.adresse.ville, postalCode: CT.adresse.npa, addressCountry: CT.adresse.pays },
        geo: { '@type': 'GeoCoordinates', latitude: 46.1989683, longitude: 6.1615317 },
        hasMap: CT.ficheGoogle, logo: `${base}/assets/images/logo-v2.png`,
        areaServed: [{ '@type': 'City', name: 'Genève' }, { '@type': 'State', name: 'Vaud' }],
        openingHoursSpecification: [{ '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], opens: '07:30', closes: '22:00' }],
        hasOfferCatalog: { '@type': 'OfferCatalog', name: 'Packs Detailing', itemListElement: OFFRES.packs.map(p => ({ '@type': 'Offer', name: p[L].nom, price: p.prix, priceCurrency: 'CHF' })) },
    };
    const url = L === 'fr' ? `${base}/` : `${base}/en/`;
    const site = { '@context': 'https://schema.org', '@type': 'WebSite', '@id': `${base}/#website`, url, name: SITE.marque, description: t.ldDescription, inLanguage: t.inLanguage };
    const faqLd = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: t.faq.filter(f => !f[2]).map(([q, r]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: r } })) };
    return [autoWash, site, faqLd].map(b => `    <script type="application/ld+json">\n${JSON.stringify(b, null, 2).replace(/^/gm, '    ')}\n    </script>`).join('\n');
}

function head(L) {
    const t = T[L];
    const base = SITE.base;
    const url = L === 'fr' ? `${base}/` : `${base}/en/`;
    return `<!DOCTYPE html>
<html lang="${L}">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="${shell.CSP}">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">

    <!-- PAGE GENEREE par generate-accueil.js : ne pas l'editer a la main. -->

    <!-- Google Tag Manager — chargement differe (audit perf 14.09.2026) -->
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
          var s = document.createElement('script');
          s.async = true;
          s.src = 'https://www.googletagmanager.com/gtm.js?id=GTM-5W69QPT3';
          document.head.appendChild(s);
        }
        ['pointerdown', 'keydown', 'touchstart', 'scroll'].forEach(function (type) {
          window.addEventListener(type, charger, { once: true, passive: true });
        });
        window.addEventListener('load', function () { setTimeout(charger, 3500); });
      })();
    </script>

    <title>${esc(t.titre)}</title>
    <meta name="description" content="${esc(t.description)}">
    <meta name="author" content="${SITE.marque}">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="${url}">
    <link rel="alternate" hreflang="fr" href="${base}/">
    <link rel="alternate" hreflang="en" href="${base}/en/">
    <link rel="alternate" hreflang="x-default" href="${base}/">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${url}">
    <meta property="og:title" content="${esc(t.titre)}">
    <meta property="og:description" content="${esc(t.ogDescription)}">
    <meta property="og:image" content="${base}/assets/images/MB-01-opt.webp">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:locale" content="${t.locale}">
    <meta property="og:site_name" content="${SITE.marque}">
    <meta name="twitter:card" content="summary_large_image">
    <link rel="manifest" href="/manifest.json">
    <meta name="theme-color" content="#FFFFFF">
    <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
    <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32.png">
    <link rel="preload" as="image" href="/images/accueil/hero-bg-opt.webp" media="(min-width: 769px)" fetchpriority="high">
    <link rel="preload" as="image" href="/images/accueil/hero-bg-mobile.webp" media="(max-width: 768px)" fetchpriority="high">
    <link rel="preload" href="/fonts/syne-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="preload" href="/fonts/bricolage-grotesque-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="stylesheet" href="/assets/css/tailwind-src.css">
${jsonld(L)}
</head>`;
}

function page(L) {
    const fichier = L === 'fr' ? 'index.html' : 'en/index.html';
    return `${head(L)}
<body class="mk-corps">
    <a href="#main-content" class="skip-link">${shell.UI[L].skip}</a>
    ${shell.repereHeader(fichier, L)}

    <main id="main-content" class="mk-accueil">${hero(L)}${bande(L)}${formules(L)}${questionnaire(L)}${etapes(L)}${resultat(L)}${entreprises(L)}${atelier(L)}${concours(L)}${avis(L)}${deplacement(L)}${faq(L)}
    </main>

    ${shell.repereFooter(fichier, L)}
${comp.modales(L)}

    <script src="/js/app.js" defer></script>
    <script src="/js/galerie-zoom.js" defer></script>
    <script src="/js/accueil-mkt.js" defer></script>
    <script>addEventListener("load",function(){setTimeout(function(){var s=document.createElement("script");s.src="/js/bulles.js";document.body.appendChild(s)},200)});</script>
    ${shell.repereFinDePage(L, { actuel: P.accueil[L] })}
</body>
</html>
`;
}

for (const L of ['fr', 'en']) {
    if (T.fr.medias.length !== MEDIAS.length || T[L].medias.length !== MEDIAS.length) throw new Error(`generate-accueil.js : ${L}.medias doit avoir ${MEDIAS.length} entrees.`);
    if (T[L].faq.length !== T.fr.faq.length) throw new Error(`generate-accueil.js : ${L}.faq incomplete.`);
    const fichier = L === 'fr' ? 'index.html' : path.join('en', 'index.html');
    fs.writeFileSync(path.join(ROOT, fichier), page(L));
    console.log(`🏠 generate-accueil.js : ${fichier} ecrit.`);
}
