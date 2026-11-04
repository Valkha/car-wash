/*
 * ============================================================================
 * ACCUEIL — generate-accueil.js (maquette marketing du 04.11.2026)
 * ----------------------------------------------------------------------------
 * Ecrit index.html depuis les donnees du site : prix (offres.json, alignes sur
 * SumUp TTC), prestations (prestations.json), contact, horaires, deplacement et
 * concours (site.json). Les textes suivent la maquette du marketing, corriges
 * sur les faits verifies (CGV, reglement du concours, fiche Google).
 * Regles : jamais de « prix fixe », jamais de pont elevateur, l'atelier passe
 * toujours avant le domicile.
 * Lance par `npm run generate`, avant inject-shell.js.
 * ============================================================================
 */
const fs = require('fs');
const path = require('path');
const shell = require('./site-shell.js');
const comp = require('./site-composants.js');

const ROOT = __dirname;
const SITE = shell.SITE, C = SITE.concours, CT = SITE.contact, D = SITE.deplacement;
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
const presta = id => PRESTA.find(p => p.id === id);

// ---------------------------------------------------------------------------
// Textes (FR). L'anglais suivra au second passage.
// ---------------------------------------------------------------------------
const T = {
    titre: 'Lavage auto en atelier et à domicile, Genève & Vaud | Clean Cars Wash',
    description: `Lavage et detailing auto dans notre atelier à Genève ou chez vous, à Genève et Vaud. Packs dès ${pack('argent').prix} CHF TTC, déplacement offert sur Genève. Réservation en ligne.`,
    ogDescription: 'Lavage et detailing auto dans notre atelier à Genève ou chez vous. Packs Argent, Or et Diamant, prix TTC annoncés avant de réserver.',
};

const PACKS_TXT = {
    argent: { sous: 'Le lavage complet, dehors et dedans' },
    or: { sous: 'Le lavage complet, intérieur remis à neuf' },
    diamant: { sous: 'Le detailing haut de gamme' },
};

const BANDE = ['Atelier', 'Polish', 'Céramique', 'Lavage à domicile', 'Shampoing sièges', 'Jantes', 'Detailing'];

// Medias de « Le résultat. » : vrais avant/apres d'abord, puis le travail en video et en photo.
const MEDIAS = [
    { img: 'avant-apres-interieur.webp', alt: 'Avant / après : nettoyage intérieur, sièges arrière et tapis débarrassés des miettes et de la poussière', titre: 'Intérieur', sous: 'Avant / après', aa: true },
    { img: 'avant-apres-video-poster.webp', video: 'avant-apres-video.mp4', alt: 'Vidéo avant / après : nettoyage d’un coffre, moquette débarrassée de la poussière et des débris', titre: 'Coffre', sous: 'Avant / après · vidéo', aa: true },
    { img: 'avant-apres-carrosserie.webp', alt: 'Avant / après : lavage extérieur, avant d’une petite citadine blanche couvert d’insectes puis propre', titre: 'Carrosserie', sous: 'Avant / après', aa: true },
    { img: 'avant-apres-portiere.webp', alt: 'Avant / après : panneau de porte intérieur en cuir, taches et traces retirées', titre: 'Portière en cuir', sous: 'Avant / après', aa: true },
    { img: 'video-polissage-poster.webp', video: 'video-polissage.mp4', alt: 'Vidéo : polissage d’un capot à la polisseuse', titre: 'Polissage', sous: 'À l’atelier · vidéo' },
    { img: 'video-siege-cuir-poster.webp', video: 'video-siege-cuir.mp4', alt: 'Vidéo : nettoyage d’un siège en cuir à la brosse', titre: 'Siège en cuir', sous: 'Intérieur · vidéo' },
    { img: 'photo-mousse-suv.webp', alt: 'Prélavage d’un SUV à la mousse active', titre: 'Mousse active', sous: 'Prélavage' },
    { img: 'video-jante-poster.webp', video: 'video-jante.mp4', alt: 'Vidéo : lavage d’une roue et de sa jante', titre: 'Jantes', sous: 'Lavage · vidéo' },
    { img: 'photo-polissage.webp', alt: 'Polissage de la carrosserie à la polisseuse', titre: 'Polish', sous: 'Correction de la laque' },
    { img: 'video-console-poster.webp', video: 'video-console.mp4', alt: 'Vidéo : nettoyage de la console centrale au pinceau', titre: 'Console', sous: 'Intérieur · vidéo' },
    { img: 'photo-interieur-cuir-creme.webp', alt: 'Habitacle en cuir clair après nettoyage', titre: 'Cuir clair', sous: 'Après nettoyage' },
    { img: 'video-moquette-poster.webp', video: 'video-moquette.mp4', alt: 'Vidéo : brossage de la moquette', titre: 'Moquette', sous: 'Intérieur · vidéo' },
    { img: 'photo-mousse-jante.webp', alt: 'Mousse active et rinçage d’une jante', titre: 'Jante', sous: 'Mousse active' },
    { img: 'video-rincage-poster.webp', video: 'video-rincage.mp4', alt: 'Vidéo : rinçage extérieur vu depuis l’habitacle', titre: 'Rinçage', sous: 'Extérieur · vidéo' },
    { img: 'photo-produits-polish.webp', alt: 'Produits de polissage, polisseuse et microfibres à l’atelier', titre: 'L’atelier', sous: 'Produits et polisseuse' },
    { img: 'photo-volant.webp', alt: 'Volant et tableau de bord après nettoyage intérieur', titre: 'Poste de conduite', sous: 'Après nettoyage' },
    { img: 'photo-mousse-aile.webp', alt: 'Mousse active sur l’aile avant d’une berline', titre: 'Berline', sous: 'Mousse active' },
    { img: 'photo-interieur-cuir-noir.webp', alt: 'Habitacle en cuir noir après nettoyage', titre: 'Cuir noir', sous: 'Après nettoyage' },
];

// Avis Google reels, cites mot pour mot (fiche Google, 25 avis, 4,8).
const AVIS = [
    { texte: 'Excellent service, je suis vraiment satisfait du résultat. L’équipe est professionnelle, accueillante et très efficace. Ma voiture est ressortie impeccable, comme neuve ! […]', extrait: 'Excellent service, je suis vraiment satisfait du résultat. […] Ma voiture est ressortie impeccable, comme neuve !', nom: 'Aymen S.' },
    { texte: 'Service impeccable à tous points de vue : prise en charge facile et très sympathique, nettoyage intérieur et extérieur parfait, jusque dans les moindres recoins. Plus aucune saleté, excellent rapport qualité-prix. J’y retournerai sans hésiter.', nom: 'Olivier D.' },
    { texte: 'Ma voiture était dans un état catastrophique et je l’ai récupérée impeccable, propre dans les moindres détails. En plus de la qualité du travail, j’ai apprécié le sérieux, la gentillesse et le professionnalisme de l’équipe. […]', nom: 'Amina D.' },
];

const FAQ = [
    ['Que dois-je prévoir pour un lavage chez moi ?', 'Une place de parking privative (garage, allée ou parking résidentiel) et une prise électrique 230V, toutes deux obligatoires ; un point d’eau est recommandé. À l’atelier, vous n’avez rien à prévoir.'],
    ['Combien coûte le déplacement ?', `Rien à l’atelier. À domicile, il est offert dans tout le canton de Genève. Sur Vaud, un forfait s’ajoute selon le district : ${D.orange.prix} CHF (Nyon, Morges, Ouest lausannois, Lausanne, Gros-de-Vaud) ou ${D.rouge.prix} CHF pour les autres districts. Il est annoncé avant de payer.`],
    ['Comment se passe le paiement ?', 'Vous choisissez votre formule, le lieu et votre créneau, puis vous réglez un acompte de 30 % en ligne, par TWINT ou carte bancaire, sécurisé par SumUp. Le solde se règle sur place. Jusqu’à 24 h avant le rendez-vous, vous pouvez annuler sans frais : l’acompte est reporté sur une prochaine réservation. Moins de 24 h avant, il reste acquis.'],
    ['Comment participer au jeu concours ?', 'Il suffit qu’une prestation soit réalisée et payée entre le 1er et le 30 novembre 2026 : vous êtes inscrit automatiquement, une participation par personne. Tirage au sort le 22 décembre 2026.', 'concours'],
    ['Quelle différence entre un polish et un traitement céramique ?', 'Le polish corrige la laque (micro-rayures, traces de lavage) ; la céramique la protège et fait perler l’eau. La céramique vient toujours après la correction : c’est ce que réunit le Pack Polish Céramique, dès 999 CHF TTC sur devis.'],
    ['Qu’est-ce que le PPF ?', 'Un film transparent qui encaisse gravillons et rayures à la place de votre laque. La pose exige un environnement sans poussière : elle se fait exclusivement à l’atelier, et demande une journée complète minimum.'],
];

// ---------------------------------------------------------------------------
function img(src, alt, { w, h, lazy = true, cls = '' } = {}) {
    return `<img src="${src}" alt="${esc(alt)}"${w ? ` width="${w}" height="${h}"` : ''}${lazy ? ' loading="lazy" decoding="async"' : ''}${cls ? ` class="${cls}"` : ''}>`;
}
const texture = (jaune = false) => `<img class="mk-caus" src="/images/mkt/caustique-${jaune ? 'or' : 'clair'}.svg" alt="" aria-hidden="true">
            <img class="mk-mousse" src="/images/mkt/mousse.webp" srcset="/images/mkt/mousse-800.webp 800w, /images/mkt/mousse.webp 1400w" sizes="100vw" alt="" aria-hidden="true" loading="lazy">`;

function hero() {
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
                    <p class="mk-a-hero__eb mk-in mk-d1"><span class="mk-suisse" aria-hidden="true">+</span>Entreprise suisse<span class="mk-trait" aria-hidden="true"></span>Genève &amp; Vaud</p>
                    <h1 id="mk-h1" class="mk-a-hero__h1 mk-in mk-d2">Lavage auto <span class="mk-brille">en atelier et à domicile</span> à Genève et Vaud</h1>
                    <p class="mk-a-hero__lead mk-in mk-d3">Intérieur, extérieur et detailing. Dans notre atelier ou chez vous.</p>
                    <p class="mk-a-hero__ligne mk-in mk-d3">Atelier au ${CT.adresse.rue}, ${CT.adresse.ville} · <strong>déplacement offert sur Genève</strong></p>
                    <div class="mk-a-hero__ctas mk-in mk-d4">
                        <a href="#formules" class="mk-btn mk-btn--jaune mk-btn--grand mk-reflet">Voir les formules et prix${FLECHE}</a>
                        <a href="https://wa.me/${CT.whatsapp}" class="mk-a-hero__wa" target="_blank" rel="noopener noreferrer">ou écrivez-nous sur WhatsApp</a>
                    </div>
                    <p class="mk-a-hero__note mk-in mk-d5"><a href="#avis"><span class="mk-etoiles" aria-hidden="true">★★★★★</span> 4,8 sur Google · 25 avis</a> · 7 j/7, 7h30–22h</p>
                </div>
                <a href="#concours" class="mk-a-hero__carte mk-in mk-d5" data-concours data-promo-from="${C.debut}" data-promo-until="${C.fin}">
                    <span class="mk-a-hero__carte-haut"><span>Jeu concours</span><span class="mk-pastille">1–30 nov.</span></span>
                    <span class="mk-lot mk-lot--petit" aria-hidden="true">${CADEAU}<span>${esc(C.lot.fr)}</span></span>
                    <span class="mk-a-hero__carte-titre">Gagnez un ${esc(C.lot.fr)}</span>
                    <span class="mk-a-hero__carte-texte">Un lavage réalisé et payé en novembre suffit pour participer (une participation par personne).</span>
                    <span class="mk-a-hero__carte-lien">Comment participer →</span>
                </a>
            </div>
        </div>
    </section>`;
}

function bande() {
    const item = (t, cache) => `<li${cache ? ' aria-hidden="true"' : ''}>${esc(t)}${GOUTTE}</li>`;
    const serie = cache => BANDE.map(t => item(t, cache)).join('');
    return `
    <section class="mk-bande" aria-label="Nos prestations">
        <div class="mk-bande__ruban">
            <ul class="mk-bande__piste">${serie(false)}${serie(true)}${serie(true)}${serie(true)}</ul>
        </div>
    </section>`;
}

function carteFormule(p) {
    const fr = p.fr, principal = !!p.badge;
    const nomCourt = fr.nom.replace(/^Pack /, '');
    return `
                <article class="mk-formule${principal ? ' mk-formule--principale' : ''} mk-carte-in" id="offre-${p.id}">
                    ${principal ? `<span class="mk-formule__badge">${esc(p.badge.fr)}</span>` : ''}
                    <h3 class="mk-formule__nom">${esc(nomCourt)}</h3>
                    <p class="mk-formule__sous">${esc(PACKS_TXT[p.id].sous)} · ${esc(fr.duree).replace(/ /g, '\u00a0')}</p>
                    <p class="mk-formule__prix"><span>${p.prix}</span> CHF TTC</p>
                    <ul class="mk-formule__liste">
${fr.inclus.map(x => `                        <li>${COCHE(principal ? '#FFCC00' : '#0E0E10')}<span>${esc(x)}</span></li>`).join('\n')}
                    </ul>
                    <button type="button" class="mk-btn ${principal ? 'mk-btn--jaune mk-reflet' : 'mk-btn--contour'}" onclick="ccwLocationModalOpen('${p.id}')">Réserver ${esc(nomCourt)}${FLECHE}</button>
                    <a href="#deplacement" class="mk-formule__depl">${PIN}<span>Calculer mon déplacement</span></a>
                </article>`;
}

function formules() {
    const ordre = ['argent', 'or', 'diamant'].map(pack);
    return `
    <section id="formules" class="mk-a-formules">
        <div class="mk-conteneur">
            <div class="mk-tete">
                <h2 class="mk-h2 mk-revele">Trois formules,<br>des prix clairs.</h2>
                <p class="mk-tete__texte">Citadine, berline ou SUV : même prix, sans supplément grande voiture. Tout est TTC et annoncé avant le rendez-vous.</p>
            </div>
            <div class="mk-formules">${ordre.map(carteFormule).join('')}
            </div>
            <p class="mk-a-formules__abo"><a href="${SITE.pages.abonnements.fr}">Un lavage régulier ? Les abonnements reviennent de 10 % à 27 % moins cher →</a></p>
            <ul class="mk-chiffres">
                <li class="mk-carte-in"><strong>0 CHF</strong><span>de déplacement à l’atelier et sur Genève</span></li>
                <li class="mk-carte-in"><strong>0 CHF</strong><span>de supplément pour un SUV</span></li>
                <li class="mk-carte-in"><strong>24 h</strong><span>pour annuler, acompte reporté</span></li>
                <li class="mk-carte-in"><strong>30 %</strong><span>d’acompte, par TWINT ou carte</span></li>
            </ul>
        </div>
    </section>`;
}

function etapes() {
    const e = [
        ['Vous choisissez', 'Formule, lieu et créneau en ligne, acompte de 30 % par TWINT ou carte.'],
        ['On s’occupe de tout', 'Dans notre atelier, chez vous ou au bureau. À domicile, il faut une place privée et une prise 230V.'],
        ['Vous récupérez une voiture nette', 'Le solde se règle sur place, une fois le travail terminé.'],
    ];
    return `
    <section class="mk-a-etapes" aria-labelledby="mk-etapes-titre">
        <div class="mk-conteneur mk-etapes">
            <h2 class="mk-h2 mk-h2--moyen mk-revele" id="mk-etapes-titre">Réservé en quelques clics.</h2>
${e.map(([t, x], i) => `            <div class="mk-etape mk-carte-in"><span class="mk-etape__n">${i + 1}</span><h3>${t}</h3><p>${x}</p></div>`).join('\n')}
        </div>
    </section>`;
}

function resultat() {
    const tuile = (m, i) => `
                <li class="mk-media mk-carte-in${m.video ? ' mk-media--video' : ''}">
                    <button type="button" class="mk-media__btn" data-zoom${m.video ? ` data-video="/images/accueil/${m.video}"` : ''} aria-label="${m.video ? 'Lire en grand' : 'Agrandir'} : ${esc(m.alt)}">
                        <span class="mk-media__cadre">
                            ${img('/images/accueil/' + m.img, m.alt, { lazy: i > 1 })}
                            ${m.video ? `<span class="mk-media__play" aria-hidden="true">${LECTURE}</span>` : ''}
                        </span>
                    </button>
                    <p class="mk-media__titre">${esc(m.titre)}</p>
                    <p class="mk-media__sous">${esc(m.sous)}</p>
                </li>`;
    return `
    <section id="realisations" class="mk-a-resultat">
        <div class="mk-conteneur">
            <div class="mk-tete">
                <h2 class="mk-h2 mk-revele">Le résultat.</h2>
                <p class="mk-tete__texte">Avant / après et travail en cours, à l’atelier et chez nos clients. Touchez une image pour l’agrandir.</p>
            </div>
        </div>
        <ul id="galerie" class="mk-defile" aria-label="Galerie de réalisations">${MEDIAS.map(tuile).join('')}
        </ul>
    </section>`;
}

function entreprises() {
    const r = [['3 à 5 véhicules', 'sur chaque lavage', '−10 %'], ['5 à 7 véhicules', 'sur chaque lavage', '−20 %'], ['Plus de 7 véhicules', '+ un Pack Or offert (pour 1 véhicule)', '−25 %']];
    return `
    <section id="entreprises" class="mk-a-pro">
        <div class="mk-panneau mk-panneau--noir mk-panneau--section">
            ${texture()}
            <div class="mk-a-pro__in">
                <div class="mk-a-pro__texte">
                    <p class="mk-eb mk-eb--jaune">Pour les entreprises</p>
                    <h2 class="mk-h2 mk-revele">Votre flotte lavée sur votre parking.</h2>
                    <p class="mk-a-pro__lead">De 3 à plus de 50 véhicules. Un seul interlocuteur, une facturation centralisée, des interventions planifiées sur votre site ou à notre atelier.</p>
                    <div class="mk-a-pro__ctas">
                        <a href="${SITE.pages.professionnels.fr}" class="mk-btn mk-btn--jaune mk-btn--grand mk-reflet">Demander un devis entreprise${FLECHE}</a>
                        <a href="mailto:${CT.email}" class="mk-a-pro__mail">${CT.email}</a>
                    </div>
                </div>
                <div class="mk-a-pro__remises">
                    <p class="mk-a-pro__remises-titre">Remise selon la taille de la flotte</p>
${r.map(([a, b, c], i) => `                    <div class="mk-remise mk-carte-in"><div><strong>${a}</strong><span>${b}</span></div><span class="mk-remise__val${i === 2 ? ' mk-remise__val--jaune' : ''}">${c}</span></div>`).join('\n')}
                </div>
            </div>
        </div>
    </section>`;
}

function atelier() {
    const lignes = [
        ['polish-ceramique', 'Polish & céramique', 'Correction des micro-rayures, brillance miroir et protection longue durée.'],
        ['ppf', 'Film PPF', 'Film transparent qui protège la carrosserie des gravillons et des rayures.'],
        ['covering', 'Covering', 'Nouvelle couleur sans peinture : mat, brillant, satiné ou carbone.'],
        ['ciel-etoile', 'Ciel étoilé', 'Fibres optiques posées à la main dans le pavillon.'],
        ['nettoyage-chassis', 'Châssis & moteur', 'Châssis, compartiment moteur et passages de roue, par exemple avant la visite technique.'],
    ];
    return `
    <section id="atelier" class="mk-a-atelier">
        <div class="mk-conteneur mk-a-atelier__in">
            <div class="mk-a-atelier__texte">
                <h2 class="mk-h2 mk-h2--atelier mk-revele">À l’atelier.</h2>
                <p>Protection et personnalisation, dans notre atelier au ${CT.adresse.rue}, à Genève. Pour le polish, le PPF, le covering et le ciel étoilé, on peut venir chercher votre véhicule et vous le ramener.</p>
                <a href="${SITE.pages.atelier.fr}" class="mk-lien-fort">Découvrir l’atelier →</a>
                <a href="tel:${CT.tel}" class="mk-lien-fort">Demander un devis au ${telCourt} →</a>
            </div>
            <ul class="mk-a-atelier__liste">
${lignes.map(([id, nom, txt]) => { const p = presta(id); return `                <li class="mk-carte-in"><a href="${shell.urlPrestation(p, 'fr')}" class="mk-a-atelier__nom">${nom}</a><span class="mk-a-atelier__prix">${p.prixDes ? 'dès ' : ''}<strong>${p.prix}</strong> CHF</span><p>${txt}</p></li>`; }).join('\n')}
            </ul>
        </div>
    </section>`;
}

function concours() {
    return `
    <section id="concours" class="mk-a-concours" data-concours data-promo-from="${C.debut}" data-promo-until="${C.fin}">
        <div class="mk-panneau mk-panneau--jaune mk-panneau--section">
            ${texture(true)}
            <div class="mk-a-concours__in">
                <div class="mk-a-concours__texte">
                    <p class="mk-eb">Jeu concours · du 1er au 30 novembre</p>
                    <h2 class="mk-h2 mk-h2--grand mk-revele">Un lavage en novembre, un ${esc(C.lot.fr)} à gagner.</h2>
                    <ol class="mk-a-concours__etapes">
                        <li class="mk-carte-in"><span>1</span>Faites réaliser une prestation entre le 1er et le 30 novembre.</li>
                        <li class="mk-carte-in"><span>2</span>Une fois la prestation payée, vous êtes inscrit au tirage (une participation par personne).</li>
                        <li class="mk-carte-in"><span>3</span>Tirage au sort le 22 décembre 2026. Le gagnant est contacté personnellement.</li>
                    </ol>
                    <div class="mk-a-concours__ctas">
                        <a href="${shell.urlReserver('fr')}" class="mk-btn mk-btn--noir mk-btn--grand mk-reflet">Réserver et participer${FLECHE}</a>
                        <a href="${SITE.pages['jeu-concours'].fr}" class="mk-lien-fort">Règlement du jeu</a>
                    </div>
                </div>
                <div class="mk-lot mk-lot--grand mk-incline" aria-hidden="true">${CADEAU}<span>${esc(C.lotDetail.fr)}</span></div>
            </div>
        </div>
    </section>`;
}

function avis() {
    const [a0, ...autres] = AVIS;
    return `
    <section id="avis" class="mk-a-avis">
        <div class="mk-conteneur">
            <div class="mk-tete">
                <h2 class="mk-h2 mk-revele">Ils en parlent mieux que nous.</h2>
                <a href="${CT.ficheGoogle}" class="mk-a-avis__note" target="_blank" rel="noopener noreferrer"><strong>4,8</strong><span><span class="mk-etoiles mk-etoiles--fonce" aria-hidden="true">★★★★★</span> 25 avis Google →</span></a>
            </div>
            <div class="mk-a-avis__grille">
                <figure class="mk-avis mk-avis--grand mk-carte-in"><blockquote>« ${esc(a0.extrait)} »</blockquote><figcaption><strong>${esc(a0.nom)}</strong> · Avis Google</figcaption></figure>
${autres.map(a => `                <figure class="mk-avis mk-carte-in"><blockquote>« ${esc(a.texte)} »</blockquote><figcaption><strong>${esc(a.nom)}</strong> · Avis Google</figcaption></figure>`).join('\n')}
            </div>
        </div>
    </section>`;
}

function deplacement() {
    return `
    <section id="deplacement" class="mk-a-depl">
        <div class="mk-conteneur mk-a-depl__in">
            <div class="mk-a-depl__texte">
                <h2 class="mk-h2 mk-revele">Combien coûte le déplacement ?</h2>
                <p class="mk-tete__texte">À l’atelier, aucun frais. Pour un lavage chez vous, tapez votre adresse ou votre commune, ou touchez la carte.</p>
                <div class="mk-depl" data-depl>
                    <label for="zr-input" class="mk-depl__label">Adresse ou commune de la voiture</label>
                    <div class="mk-depl__champ">
                        ${PIN}
                        <input id="zr-input" type="text" autocomplete="off" placeholder="Ex. Rue de la Gare 1, Nyon" aria-describedby="zr-note" aria-controls="zr-liste" aria-autocomplete="list" role="combobox" aria-expanded="false">
                        <ul id="zr-liste" class="mk-depl__liste" role="listbox" hidden></ul>
                    </div>
                    <div id="zr-card" class="mk-depl__carte" aria-live="polite">
                        <div><p id="zr-place" class="mk-depl__lieu">Votre commune</p><p id="zr-note" class="mk-depl__note">Tapez une adresse ou touchez la carte</p></div>
                        <p id="zr-price" class="mk-depl__prix">—</p>
                    </div>
                    <ul class="mk-depl__legende">
                        <li><span style="background:#FFCC00"></span>Genève · offert</li>
                        <li><span style="background:#F2994A"></span>Vaud zone orange · ${D.orange.prix} CHF</li>
                        <li><span style="background:#D9483B"></span>Vaud zone rouge · ${D.rouge.prix} CHF</li>
                    </ul>
                    <p class="mk-depl__fr">Voiture en France voisine ? <a href="tel:${CT.tel}">Appelez-nous</a> pour un devis. <a href="${SITE.pages.zones.fr}">Toutes les zones</a></p>
                </div>
            </div>
            <div class="mk-a-depl__carte">
                <div class="mk-carte" id="zr-carte" data-src="/data/carte-zones.svg" data-communes="/data/communes.json" data-label="Carte des zones de déplacement : canton de Genève offert, zone orange ${D.orange.prix} CHF, zone rouge ${D.rouge.prix} CHF"></div>
                <p id="zr-hover" class="mk-carte__aide">Survolez ou touchez une commune</p>
            </div>
        </div>
    </section>`;
}

function faq() {
    return `
    <section id="faq" class="mk-a-faq">
        <div class="mk-conteneur mk-a-faq__in">
            <div class="mk-a-faq__texte">
                <h2 class="mk-h2 mk-h2--atelier mk-revele">Questions fréquentes</h2>
                <p>Une autre question ? Appelez-nous au <a href="tel:${CT.tel}">${telCourt}</a>.</p>
            </div>
            <div class="mk-a-faq__liste">
${FAQ.map(([q, r, k]) => `                <details class="mk-faq mk-carte-in"${k === 'concours' ? ` data-concours data-promo-from="${C.debut}" data-promo-until="${C.fin}"` : ''}><summary><span>${esc(q)}</span><span class="mk-faq__plus" aria-hidden="true">+</span></summary><p>${esc(r)}</p></details>`).join('\n')}
            </div>
        </div>
    </section>`;
}

// ---------------------------------------------------------------------------
function jsonld() {
    const base = SITE.base;
    const prix = OFFRES.packs.map(p => Number(p.prix));
    const autoWash = {
        '@context': 'https://schema.org', '@type': 'AutoWash', name: 'Clean Cars Wash Genève',
        image: `${base}/assets/images/MB-01-opt.webp`, '@id': base, url: base, telephone: CT.tel, vatID: CT.tva.replace(/ TVA$/, ''),
        priceRange: `CHF ${Math.floor(Math.min(...prix))}–${Math.floor(Math.max(...prix))}`, currenciesAccepted: 'CHF',
        address: { '@type': 'PostalAddress', streetAddress: CT.adresse.rue, addressLocality: CT.adresse.ville, postalCode: CT.adresse.npa, addressCountry: CT.adresse.pays },
        geo: { '@type': 'GeoCoordinates', latitude: 46.1989683, longitude: 6.1615317 },
        areaServed: [{ '@type': 'City', name: 'Genève' }, { '@type': 'State', name: 'Vaud' }],
        openingHoursSpecification: [{ '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], opens: '07:30', closes: '22:00' }],
        aggregateRating: undefined,
        hasOfferCatalog: { '@type': 'OfferCatalog', name: 'Packs Detailing', itemListElement: OFFRES.packs.map(p => ({ '@type': 'Offer', name: p.fr.nom, price: p.prix, priceCurrency: 'CHF' })) },
    };
    delete autoWash.aggregateRating;
    const site = { '@context': 'https://schema.org', '@type': 'WebSite', '@id': `${base}/#website`, url: `${base}/`, name: SITE.marque, description: 'Lavage et detailing auto en atelier et à domicile, à Genève et Vaud.', inLanguage: 'fr-CH' };
    const faqLd = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.filter(f => !f[2]).map(([q, r]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: r } })) };
    return [autoWash, site, faqLd].map(b => `    <script type="application/ld+json">\n${JSON.stringify(b, null, 2).replace(/^/gm, '    ')}\n    </script>`).join('\n');
}

function head() {
    const base = SITE.base;
    return `<!DOCTYPE html>
<html lang="fr">
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

    <title>${esc(T.titre)}</title>
    <meta name="description" content="${esc(T.description)}">
    <meta name="author" content="${SITE.marque}">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="${base}/">
    <link rel="alternate" hreflang="fr" href="${base}/">
    <link rel="alternate" hreflang="en" href="${base}/en/">
    <link rel="alternate" hreflang="x-default" href="${base}/">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${base}/">
    <meta property="og:title" content="${esc(T.titre)}">
    <meta property="og:description" content="${esc(T.ogDescription)}">
    <meta property="og:image" content="${base}/assets/images/MB-01-opt.webp">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:locale" content="fr_CH">
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
${jsonld()}
</head>`;
}

function page() {
    const fichier = 'index.html';
    return `${head()}
<body class="mk-corps">
    <a href="#main-content" class="skip-link">Passer au contenu principal</a>
    ${shell.repereHeader(fichier, 'fr')}

    <main id="main-content" class="mk-accueil">${hero()}${bande()}${formules()}${etapes()}${resultat()}${entreprises()}${atelier()}${concours()}${avis()}${deplacement()}${faq()}
    </main>

    ${shell.repereFooter(fichier, 'fr')}
${comp.modales('fr')}

    <script src="/js/app.js" defer></script>
    <script src="/js/galerie-zoom.js" defer></script>
    <script src="/js/accueil-mkt.js" defer></script>
    <script>addEventListener("load",function(){setTimeout(function(){var s=document.createElement("script");s.src="/js/bulles.js";document.body.appendChild(s)},1500)});</script>
    ${shell.repereFinDePage('fr', { actuel: '/' })}
</body>
</html>
`;
}

fs.writeFileSync(path.join(ROOT, 'index.html'), page());
console.log('🏠 generate-accueil.js : index.html ecrit.');
