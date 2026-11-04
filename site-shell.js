/*
 * ============================================================================
 * MODULE PARTAGE DU SITE — site-shell.js
 * ----------------------------------------------------------------------------
 * Source de verite : site.json. Tout ce qui se repete sur plusieurs pages est
 * produit ici, une seule fois, et relu par les generateurs (generate-pages.js,
 * generate-prestations.js, generate-site.js) et par inject-shell.js pour les
 * pages ecrites a la main.
 *
 * Phase 0 (concours, 23.10.2026) :
 *  - carteConcours() : carte flottante (ordinateur) / pilule d'une ligne
 *    (mobile), AUTONOME. Elle porte son propre script inline, parce que 46
 *    pages ne chargent pas public/js/app.js (zones, abonnements, legales, 404,
 *    les 38 villes) : un garde-fou qui vivrait dans app.js ne s'y executerait
 *    jamais et la carte resterait affichee apres la fin du concours.
 *  - gardeInline() : le garde-fou des blocs dates, mutualise. Il remplace la
 *    copie de 247 octets qui vivait dans generate-prestations.js et couvre
 *    data-promo-from, data-promo-until et data-promo-expired-after.
 *  - blocConcoursOffres() : le bloc date de promos.html / en/promos.html.
 *
 * Polarite de la carte : elle est servie avec l'attribut `hidden` et c'est son
 * script qui la revele, uniquement pendant le concours. Sans JavaScript, elle
 * n'apparait donc jamais : c'est voulu, une carte promotionnelle perimee est
 * pire qu'une carte absente, et tout le contenu du concours vit sur sa page.
 * Les blocs de CONTENU (promos, page concours) gardent la polarite habituelle :
 * visibles dans le HTML servi, retires par le garde-fou a l'echeance.
 *
 * Simulation de date (verification locale uniquement) :
 *   http://localhost:5173/promos.html?ccw-maintenant=2026-11-15
 * Le parametre n'est lu que sur localhost / 127.0.0.1, par la carte, par le
 * garde inline et par app.js : les trois voient la meme date.
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');

const SITE = JSON.parse(fs.readFileSync(path.join(__dirname, 'site.json'), 'utf8'));
const C = SITE.concours;

const MOIS = {
    fr: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};

const ISO = /^\d{4}-\d{2}-\d{2}$/;

function verifierConcours() {
    if (!C) throw new Error('site.json : bloc "concours" absent.');
    if (!ISO.test(C.debut || '') || !ISO.test(C.fin || '')) {
        throw new Error(`site.json : dates du concours invalides (debut="${C.debut}", fin="${C.fin}"), format AAAA-MM-JJ attendu.`);
    }
    if (C.fin < C.debut) throw new Error(`site.json : le concours finit (${C.fin}) avant de commencer (${C.debut}).`);
    ['fr', 'en'].forEach(l => {
        if (!C.lot || !C.lot[l]) throw new Error(`site.json : concours.lot.${l} manquant.`);
    });
}
verifierConcours();

// "2026-11-01" -> "1er novembre 2026" / "1 November 2026"
function dateLongue(iso, langue, avecAnnee = true) {
    const [a, m, j] = iso.split('-').map(Number);
    const jour = langue === 'fr' && j === 1 ? '1er' : String(j);
    return `${jour} ${MOIS[langue][m - 1]}${avecAnnee ? ' ' + a : ''}`;
}

// Veille d'une date ISO, sans fuseau (calcul calendaire pur).
function veille(iso) {
    const [a, m, j] = iso.split('-').map(Number);
    const d = new Date(Date.UTC(a, m - 1, j - 1));
    return d.toISOString().slice(0, 10);
}

function url(cle, langue) {
    const p = SITE.pages[cle];
    if (!p) throw new Error(`site.json : page "${cle}" inconnue.`);
    return p[langue];
}

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ---------------------------------------------------------------------------
// Lecture de la date courante, partagee par les trois scripts (carte, garde,
// app.js). Le parametre de simulation n'est lu qu'en local.
// ---------------------------------------------------------------------------
const JS_MAINTENANT =
    "var n=new Date(),q=/^(localhost|127\\.0\\.0\\.1)$/.test(location.hostname)&&location.search.match(/[?&]ccw-maintenant=(\\d{4}-\\d{2}-\\d{2})/);if(q)n=new Date(q[1]+'T12:00:00');";

// ---------------------------------------------------------------------------
// Garde-fou des blocs dates. Meme logique que celui de public/js/app.js, en
// version minimale. Inline en fin de <body> : il s'execute avant le premier
// rendu utile, donc un bloc perime n'est jamais vu, meme une fraction de
// seconde (app.js est en defer).
//   data-promo-until="AAAA-MM-JJ"        retire au lendemain de la date
//   data-promo-from="AAAA-MM-JJ"         retire tant que la date n'est pas atteinte
//   data-promo-expired-after="AAAA-MM-JJ" <template> insere / bloc revele apres la date
// Idempotent : execute deux fois (inline puis app.js), il ne fait rien de plus.
// ---------------------------------------------------------------------------
function gardeInline() {
    return '<script>(function(){' + JS_MAINTENANT +
        "function e(x,a,h){var d=new Date(x.getAttribute(a)+h);return isNaN(d.getTime())?null:d}" +
        "[].forEach.call(document.querySelectorAll('[data-promo-until],[data-promo-from]'),function(x){" +
        "var f=x.hasAttribute('data-promo-until')&&e(x,'data-promo-until','T23:59:59'),d=x.hasAttribute('data-promo-from')&&e(x,'data-promo-from','T00:00:00');" +
        "if((f&&n>f)||(d&&n<d))x.remove()});" +
        "[].forEach.call(document.querySelectorAll('[data-promo-expired-after]'),function(x){var f=e(x,'data-promo-expired-after','T23:59:59');" +
        "if(!f||n<=f)return;if(x.tagName==='TEMPLATE'){x.parentNode.insertBefore(x.content.cloneNode(true),x);x.remove()}else x.removeAttribute('hidden')})" +
        '})();</script>';
}

// Pastille du concours (DA 31.10.2026) : bouton rond fixe en bas a droite, qui
// ouvre un encart (reserver, voir le concours, masquer). Visible des maintenant
// en annonce (« Des le 1er novembre ») puis pendant le concours, retiree le
// lendemain de la fin (dates de site.json, simulation ?ccw-maintenant en local).
// data-debut et non data-promo-from : le garde-fou des dates la retirerait avant le debut.
// Masquee pour la visite si on la ferme (sessionStorage, dans un try/catch).
// Ses styles sont dans assets/css/da-2026.css.
const ICO_CADEAU = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="8" width="18" height="13" rx="2"></rect><path d="M12 8v13M3 12h18M12 8S10 3 7.5 4.5 9 8 12 8zM12 8s2-5 4.5-3.5S15 8 12 8z"></path></svg>';
const ICO_TEL = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"></path></svg>';
const ICO_WA = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 20.5l1.3-4A8.5 8.5 0 1 1 8 19.6z"></path><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1.2-1.4-2-1-1 .8c-1-.4-1.8-1.2-2.2-2.2l.8-1-1-2z"></path></svg>';

// Pastille du concours (maquette marketing 04.11.2026) : encart noir borde de
// jaune, fixe en bas a droite, fermable (masque pour la visite). Servie `hidden`,
// revelee par son script uniquement entre debut et fin du concours.
const TXT_PASTILLE = {
    fr: { eb: 'Jeu concours · novembre', titre: `Gagnez un ${C.lot.fr}`, texte: 'Un lavage en novembre suffit pour participer →', masquer: 'Fermer' },
    en: { eb: 'Giveaway · November', titre: `Win an ${C.lot.en}`, texte: 'One wash in November is all it takes →', masquer: 'Close' },
};

function scriptCarte() {
    return '<script>(function(){var d=document.getElementById("ccw-concours");if(!d)return;' + JS_MAINTENANT +
        'var st=new Date(d.getAttribute("data-debut")+"T00:00:00"),en=new Date(d.getAttribute("data-promo-until")+"T23:59:59");' +
        'if(isNaN(st.getTime())||isNaN(en.getTime())||n>en||n<st){d.remove();return}' +
        'try{if(sessionStorage.getItem("ccwPastille"))return}catch(x){}' +
        // Telephone : la bulle couvrirait le bouton principal du haut de page ;
        // elle n'apparait qu'une fois le premier ecran depasse.
        'function v(){d.hidden=false}' +
        'if(innerWidth<760&&scrollY<innerHeight*.9){var o=function(){if(scrollY>=innerHeight*.9){removeEventListener("scroll",o);v()}};addEventListener("scroll",o,{passive:true})}else v();' +
        'd.querySelector("[data-x]").addEventListener("click",function(){d.hidden=true;try{sessionStorage.setItem("ccwPastille","1")}catch(x){}});' +
        '})();</script>';
}

// Lien du concours : la section de l'accueil, sinon la page du concours.
function lienConcours(langue, actuel) {
    return actuel === SITE.pages.accueil[langue] ? '#concours' : url('jeu-concours', langue);
}

function carteConcours(langue, actuel = null) {
    const t = TXT_PASTILLE[langue];
    return `
    <aside id="ccw-concours" class="mk-bulle" aria-label="${esc(t.eb)}" data-concours data-debut="${C.debut}" data-promo-until="${C.fin}" hidden>
        <span class="mk-bulle__ico" aria-hidden="true">${ICO_CADEAU}</span>
        <a class="mk-bulle__lien" href="${lienConcours(langue, actuel)}">
            <span class="mk-bulle__eb">${esc(t.eb)}</span>
            <span class="mk-bulle__titre">${esc(t.titre)}</span>
            <span class="mk-bulle__texte">${esc(t.texte)}</span>
        </a>
        <button class="mk-bulle__x" type="button" aria-label="${esc(t.masquer)}" data-x>&times;</button>
    </aside>
    ${scriptCarte()}`;
}

// Ancienne barre de reservation mobile : retiree (la maquette n'en a pas, le
// bouton Reserver reste visible dans l'en-tete sur mobile).
function barreMobile() { return ''; }

// Contenu du repere CCW:CONCOURS d'une page. La page du concours elle-meme ne
// porte pas la carte, mais garde le garde-fou (elle a des blocs dates).
function blocFinDePage(langue, { pageConcours = false, actuel = null } = {}) {
    return `${pageConcours ? '' : carteConcours(langue, actuel)}${barreMobile(langue)}
    <!-- Garde-fou des blocs dates (site-shell.js, gardeInline) -->
    ${gardeInline()}`;
}

// Le repere complet, tel que les generateurs l'ecrivent et tel qu'inject-shell.js
// le reecrit : les deux produisent EXACTEMENT la meme chaine, d'ou l'idempotence.
function repere(nom, contenu) {
    return `<!-- CCW:${nom} -->${contenu}\n    <!-- /CCW:${nom} -->`;
}
function repereFinDePage(langue, opts) {
    return repere('CONCOURS', blocFinDePage(langue, opts));
}

// ---------------------------------------------------------------------------
// Bloc concours de la page Offres (promos.html / en/promos.html)
// Visible des aujourd'hui (annonce), retire seul au lendemain de la fin.
// ---------------------------------------------------------------------------
function blocConcoursOffres(langue) {
    const fr = langue === 'fr';
    const du = dateLongue(C.debut, langue, false), au = dateLongue(C.fin, langue);
    return `
        <section data-concours data-promo-until="${C.fin}" class="pb-14 md:pb-20">
            <div class="premium-card rounded-3xl p-8 md:p-12" style="border-color:rgba(212,175,55,.35);">
                <p class="hero-eyebrow mb-4">${fr ? 'Jeu-concours' : 'Giveaway'} &mdash; ${fr ? `du ${du} au ${au}` : `${du} to ${au}`}</p>
                <h2 class="text-3xl md:text-5xl font-display font-bold text-white uppercase tracking-tight leading-[0.95] mb-6">
                    ${fr ? 'Un' : 'An'} <span class="text-gold-400">${esc(C.lot[langue])}</span><br>${fr ? 'à gagner' : 'to win'}
                </h2>
                <p class="text-gray-400 font-light leading-relaxed mb-8 max-w-2xl">
                    ${fr
                        ? `Clean Cars Wash organise un jeu-concours du ${du} au ${au}. Le lot, les dates et les modalités de participation sont réunis sur la page du jeu-concours.`
                        : `Clean Cars Wash is running a giveaway from ${du} to ${au}. The prize, the dates and how to enter are all on the giveaway page.`}
                </p>
                <a href="${url('jeu-concours', langue)}" class="cta-star inline-block bg-gold-400 border border-gold-400 text-charcoal-900 font-display font-bold tracking-widest uppercase py-4 px-10 rounded-full hover:bg-gold-500 transition-all">
                    ${fr ? 'Voir le jeu-concours' : 'See the giveaway'}
                </a>
            </div>
        </section>`;
}


// ---------------------------------------------------------------------------
// <head> commun aux pages generees par generate-site.js.
// GTM differe (audit perf 14.09.2026), CSP identique a l'accueil — elle
// autorise https://api.sumup.com dans connect-src : toute page qui reserve en
// a besoin, sinon l'appel panier est bloque en silence (bug de septembre 2026).
// ---------------------------------------------------------------------------
const CSP = "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: https:; connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://www.googleadservices.com https://googleads.g.doubleclick.net https://pagead2.googlesyndication.com https://www.google.com https://api.sumup.com https://api3.geo.admin.ch";

function head({ langue, cle, titre, description, ogImage = '/assets/images/MB-01-opt.webp', jsonld = [], extra = '', urls = null, fil: filExtra = null, ogType = 'website' }) {
    // urls = { fr, en, libelle } pour une page hors site.json (article de blog) ;
    // fil = niveaux intermediaires du fil d'Ariane [{ name, url }].
    const p = urls || SITE.pages[cle];
    const abs = u => SITE.base + u;
    const niveaux = [{ name: SITE.pages.accueil.libelle[langue], url: SITE.pages.accueil[langue] }, ...(filExtra || []), { name: p.libelle[langue], url: p[langue] }];
    const fil = niveaux.map((n, i) => ({ '@type': 'ListItem', position: i + 1, name: n.name, item: abs(n.url) }));
    const blocs = [{ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: fil }, ...jsonld];
    return `<!DOCTYPE html>
<html lang="${langue}">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="${CSP}">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">

    <!-- PAGE GENEREE par generate-site.js depuis site.json : ne pas l'editer a la main. -->

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

    <title>${esc(titre)}</title>
    <meta name="description" content="${esc(description)}">
    <meta name="author" content="${SITE.marque}">
    <meta name="robots" content="index, follow">

    <link rel="canonical" href="${abs(p[langue])}">
    <link rel="alternate" hreflang="fr" href="${abs(p.fr)}">
    <link rel="alternate" hreflang="en" href="${abs(p.en)}">
    <link rel="alternate" hreflang="x-default" href="${abs(p.fr)}">

    <meta property="og:type" content="${ogType}">
    <meta property="og:url" content="${abs(p[langue])}">
    <meta property="og:title" content="${esc(titre)}">
    <meta property="og:description" content="${esc(description)}">
    <meta property="og:image" content="${abs(ogImage)}">
    <meta property="og:locale" content="${langue === 'fr' ? 'fr_CH' : 'en_GB'}">
    <meta property="og:site_name" content="${SITE.marque}">
    <meta name="twitter:card" content="summary_large_image">

    <link rel="apple-touch-icon" href="/assets/images/logo-v2.png">
    <link rel="icon" type="image/png" href="/assets/images/logo-v2.png">
    <meta name="theme-color" content="#FFFFFF">

    <link rel="preload" href="/fonts/syne-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="preload" href="/fonts/bricolage-grotesque-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="stylesheet" href="/assets/css/tailwind-src.css">
${extra}
${blocs.map(b => `    <script type="application/ld+json">\n${JSON.stringify(b, null, 2).replace(/^/gm, '    ')}\n    </script>`).join('\n')}
</head>`;
}

// ===========================================================================
// HEADER / FOOTER UNIFIES (phase 1, 23.10.2026)
// ---------------------------------------------------------------------------
// Un seul header pour tout le site, burger compris : le header « simplifie »
// des pages secondaires est ce qui avait casse app.js en septembre 2026.
// Le header porte son propre petit script inline (burger, sous-menus au
// clavier, Echap) : 46 pages ne chargent pas app.js. Les sous-menus
// s'ouvrent aussi sans JS, au survol et au focus (:focus-within).
// ===========================================================================
const PRESTATIONS = JSON.parse(fs.readFileSync(path.join(__dirname, 'prestations.json'), 'utf8'));

const UI = {
    fr: {
        menu: 'Menu principal', ouvrir: 'Ouvrir le menu', fermer: 'Fermer le menu', sous: 'Sous-menu',
        reserver: 'Réserver', appeler: 'Appeler', apercu: 'Vue d’ensemble', accueil: 'Accueil',
        wa: 'Bonjour, je souhaiterais obtenir un renseignement.', langue: 'Langue', faq: 'FAQ',
        bandeau: `Jeu concours : un lavage en novembre, un ${C.lot.fr} à gagner →`,
        footerAccroche: 'Lavage auto premium, en atelier et à domicile. Genève &amp; Vaud.',
        footerContact: 'Contact', footerHoraires: 'Horaires', footerPresta: 'Prestations', footerInfos: 'Infos',
        footerVilles: 'Nous intervenons à', footerAvis: 'Nos avis sur Google', skip: 'Passer au contenu principal',
        finalTitre: 'Votre voiture comme neuve.', finalTexte: 'Réservation en ligne, acompte de 30 %, solde réglé sur place.', finalBouton: 'Réserver en ligne',
    },
    en: {
        menu: 'Main menu', ouvrir: 'Open the menu', fermer: 'Close the menu', sous: 'Submenu',
        reserver: 'Book', appeler: 'Call', apercu: 'Overview', accueil: 'Home',
        wa: 'Hello, I would like some information.', langue: 'Language', faq: 'FAQ',
        bandeau: `Giveaway: one wash in November, an ${C.lot.en} to win →`,
        footerAccroche: 'Premium car care, in our workshop or at your home. Geneva &amp; Vaud.',
        footerContact: 'Contact', footerHoraires: 'Opening hours', footerPresta: 'Services', footerInfos: 'Info',
        footerVilles: 'We operate in', footerAvis: 'Our Google reviews', skip: 'Skip to main content',
        finalTitre: 'Your car, like new.', finalTexte: 'Book online, 30 % deposit, balance paid on site.', finalBouton: 'Book online',
    },
};

const ICONE_TEL = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>';
const CHEVRON = '<svg class="mk-chevron" width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M1 3l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>';
const FLECHE = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

// URL des prestations, FR et EN
function urlPrestation(p, l) { return l === 'fr' ? `/${p.id}.html` : `/en/${p.slugEn}.html`; }

// Arbre du menu, relu dans site.json (champ `menu` = ordre, `libelleMenu` =
// libelle court du menu). La FAQ, section de l'accueil, ferme le menu.
function arbreMenu(langue) {
    const P = SITE.pages;
    const enfantsDe = cle => Object.entries(P)
        .filter(([, pg]) => pg.parent === cle && pg.existe && pg[langue])
        .sort((a, b) => a[1].ordre - b[1].ordre)
        .map(([k, pg]) => ({ cle: k, libelle: pg.libelle[langue], href: pg[langue] }));
    const items = Object.entries(P)
        .filter(([, pg]) => pg.menu && !pg.bouton && pg.existe)
        .sort((a, b) => a[1].menu - b[1].menu)
        .map(([cle, pg]) => {
            let enfants = cle === 'prestations'
                ? PRESTATIONS.map(p => ({ cle: p.id, libelle: p[langue].nom, href: urlPrestation(p, langue) }))
                : enfantsDe(cle);
            const href = pg.existe && pg[langue] ? pg[langue] : null;
            return { cle, libelle: (pg.libelleMenu || pg.libelle)[langue], href, enfants };
        })
        .filter(it => it.href || it.enfants.length);
    items.push({ cle: 'faq', libelle: UI[langue].faq, href: `${P.accueil[langue]}#faq`, enfants: [] });
    return items;
}

function urlReserver(langue) {
    const r = SITE.pages.reserver;
    if (!r.existe) throw new Error('site.json : la page reserver doit exister, le bouton Reserver du menu y mene.');
    return r[langue];
}

const courant = (href, actuel) => href && actuel && href === actuel ? ' aria-current="page"' : '';

// ===========================================================================
// EN-TETE (maquette marketing 04.11.2026) : bandeau du concours + barre blanche,
// collants ensemble. Logo officiel. Menu : liens vers les vraies pages.
// Le bandeau est un bloc date (data-promo-from / until) : le garde-fou de fin
// de page le retire hors de la periode du concours.
// ===========================================================================
function header(langue, { actuel = null, alternes = {} } = {}) {
    const t = UI[langue], c = SITE.contact, arbre = arbreMenu(langue);
    const fr = alternes.fr || SITE.pages.accueil.fr, en = alternes.en || SITE.pages.accueil.en;
    const lang = `<div class="mk-lang" role="group" aria-label="${t.langue}">${langue === 'fr' ? '<span aria-current="true">FR</span>' : `<a href="${fr}" hreflang="fr" lang="fr">FR</a>`}<span aria-hidden="true">/</span>${langue === 'en' ? '<span aria-current="true">EN</span>' : `<a href="${en}" hreflang="en" lang="en">EN</a>`}</div>`;

    const desktop = arbre.map(it => {
        if (!it.enfants.length) {
            return `                <li class="mk-nav__item"><a class="mk-nav__lien" href="${it.href}"${courant(it.href, actuel)}>${esc(it.libelle)}</a></li>`;
        }
        const id = `mk-sub-${it.cle}`;
        const tete = it.href
            ? `<a class="mk-nav__lien" href="${it.href}"${courant(it.href, actuel)}>${esc(it.libelle)}</a><button type="button" class="mk-nav__toggle" aria-expanded="false" aria-controls="${id}"><span class="sr-only">${t.sous} ${esc(it.libelle)}</span>${CHEVRON}</button>`
            : `<button type="button" class="mk-nav__lien mk-nav__toggle mk-nav__toggle--seul" aria-expanded="false" aria-controls="${id}">${esc(it.libelle)}${CHEVRON}</button>`;
        return `                <li class="mk-nav__item mk-nav__item--sub">${tete}
                    <ul id="${id}" class="mk-sub">
${it.enfants.map(e => `                        <li><a href="${e.href}"${courant(e.href, actuel)}>${esc(e.libelle)}</a></li>`).join('\n')}
                    </ul>
                </li>`;
    }).join('\n');

    const mobile = arbre.map(it => {
        if (!it.enfants.length) {
            return `            <li><a class="mk-menu__lien" href="${it.href}"${courant(it.href, actuel)}>${esc(it.libelle)}</a></li>`;
        }
        const ouvert = it.enfants.some(e => e.href === actuel) || it.href === actuel ? ' open' : '';
        return `            <li><details class="mk-menu__groupe"${ouvert}><summary class="mk-menu__lien">${esc(it.libelle)}${CHEVRON}</summary>
                <ul>
${it.href ? `                    <li><a href="${it.href}"${courant(it.href, actuel)}>${esc(it.libelle)} · ${t.apercu}</a></li>\n` : ''}${it.enfants.map(e => `                    <li><a href="${e.href}"${courant(e.href, actuel)}>${esc(e.libelle)}</a></li>`).join('\n')}
                </ul>
            </details></li>`;
    }).join('\n');

    const lienBandeau = lienConcours(langue, actuel);
    return `
    <div id="ccw-header" class="mk-haut">
        <a class="mk-bandeau" href="${lienBandeau}" data-concours data-promo-from="${C.debut}" data-promo-until="${C.fin}">${esc(t.bandeau)}</a>
        <header class="mk-header">
            <div class="mk-header__barre">
                <a href="${SITE.pages.accueil[langue]}" class="mk-logo" aria-label="${SITE.marque} — ${t.accueil}">
                    <img src="/assets/images/logo-v2-tiny.webp" alt="" width="120" height="120">
                    <span class="mk-logo__mot">CLEAN CARS WASH</span>
                </a>
                <nav class="mk-nav" aria-label="${t.menu}">
                    <ul class="mk-nav__liste">
${desktop}
                    </ul>
                </nav>
                <div class="mk-header__actions">
                    <a href="tel:${c.tel}" class="mk-tel">${ICONE_TEL}<span class="mk-tel__num">${esc(c.telAffiche.replace(/^\+41 /, '0'))}</span><span class="sr-only"> — ${t.appeler} ${SITE.marque}</span></a>
                    ${lang}
                    <a href="${urlReserver(langue)}" class="mk-btn mk-btn--noir mk-header__reserver"${courant(urlReserver(langue), actuel)}>${t.reserver}</a>
                    <button type="button" id="ccw-burger" class="mk-burger" aria-expanded="false" aria-controls="ccw-menu" aria-label="${t.ouvrir}" data-label-open="${t.ouvrir}" data-label-close="${t.fermer}">
                        <svg width="26" height="26" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-width="2.2" d="M4 7h16M4 12h16M4 17h16"/></svg>
                    </button>
                </div>
            </div>
            <nav id="ccw-menu" class="mk-menu" aria-label="${t.menu}" hidden>
                <ul class="mk-menu__liste">
${mobile}
                </ul>
                <div class="mk-menu__bas">
                    <a href="${urlReserver(langue)}" class="mk-btn mk-btn--jaune">${t.reserver}</a>
                    <div class="mk-menu__contact">
                        <a class="mk-btn mk-btn--contour" href="tel:${c.tel}">${t.appeler}</a>
                        <a class="mk-btn mk-btn--contour" href="https://wa.me/${c.whatsapp}?text=${encodeURIComponent(t.wa)}" target="_blank" rel="noopener noreferrer">WhatsApp</a>
                    </div>
                    ${lang}
                </div>
            </nav>
        </header>
        <script>(function(){var b=document.getElementById("ccw-burger"),m=document.getElementById("ccw-menu");if(!b||!m)return;
function o(v){m.hidden=!v;b.setAttribute("aria-expanded",String(v));b.setAttribute("aria-label",v?b.getAttribute("data-label-close"):b.getAttribute("data-label-open"));document.documentElement.classList.toggle("mk-menu-ouvert",v)}
b.addEventListener("click",function(){o(m.hidden)});
[].forEach.call(m.querySelectorAll("a"),function(a){a.addEventListener("click",function(){o(false)})});
var t=document.querySelectorAll("#ccw-header .mk-nav__toggle");
function f(x){[].forEach.call(t,function(y){if(y!==x)y.setAttribute("aria-expanded","false")})}
[].forEach.call(t,function(x){x.addEventListener("click",function(){var v=x.getAttribute("aria-expanded")!=="true";f(x);x.setAttribute("aria-expanded",String(v))})});
document.addEventListener("keydown",function(e){if(e.key!=="Escape")return;var a=document.activeElement,l=a&&a.closest&&a.closest(".mk-nav__item--sub");f(null);if(l){var g=l.querySelector(".mk-nav__toggle");if(g)g.focus()}if(!m.hidden){o(false);b.focus()}});
document.addEventListener("click",function(e){if(!e.target.closest||!e.target.closest(".mk-nav__item--sub"))f(null)});
window.matchMedia("(min-width: 1100px)").addEventListener("change",function(e){if(e.matches)o(false)});
})();</script>
    </div>`;
}

// ===========================================================================
// PIED DE PAGE (maquette marketing) : appel final jaune + pied noir.
// L'appel final est omis sur les pages ou il ferait doublon ou serait deplace
// (reservation, mentions, confidentialite, 404).
// ===========================================================================
const SANS_APPEL_FINAL = ['reserver', 'mentions', 'confidentialite'];

function appelFinal(langue) {
    const t = UI[langue], c = SITE.contact;
    return `
    <section class="mk-final" aria-labelledby="mk-final-titre">
        <div class="mk-panneau mk-panneau--jaune">
            <img class="mk-caus" src="/images/mkt/caustique-or.svg" alt="" aria-hidden="true" loading="lazy">
            <img class="mk-mousse" src="/images/mkt/mousse.webp" srcset="/images/mkt/mousse-800.webp 800w, /images/mkt/mousse.webp 1400w" sizes="100vw" alt="" aria-hidden="true" loading="lazy">
            <div class="mk-final__in">
                <p class="mk-final__titre" id="mk-final-titre">${t.finalTitre}</p>
                <div class="mk-final__cote">
                    <p>${t.finalTexte}</p>
                    <div class="mk-final__actions">
                        <a class="mk-btn mk-btn--noir mk-btn--grand" href="${urlReserver(langue)}">${t.finalBouton}${FLECHE}</a>
                        <a class="mk-final__tel" href="tel:${c.tel}">${esc(c.telAffiche.replace(/^\+41 /, '0'))}</a>
                    </div>
                </div>
            </div>
        </div>
    </section>`;
}

function footer(langue, { villes = true, actuel = null } = {}) {
    const t = UI[langue], c = SITE.contact, P = SITE.pages;
    const cleActuelle = Object.keys(P).find(k => P[k][langue] && P[k][langue] === actuel);
    const final = /\/404\.html$/.test(actuel || '') || SANS_APPEL_FINAL.includes(cleActuelle) ? '' : appelFinal(langue);
    const lien = (href, txt) => `<li><a href="${href}">${txt}</a></li>`;
    const infos = ['tarifs', 'abonnements', 'offres', 'zones', 'particuliers', 'professionnels', 'blog', 'jeu-concours', 'mentions', 'confidentialite']
        .filter(k => P[k] && P[k].existe && P[k][langue])
        .map(k => lien(P[k][langue], esc(P[k].libelle[langue])));
    const listeVilles = villes ? (() => {
        const locs = JSON.parse(fs.readFileSync(path.join(__dirname, 'locations.json'), 'utf8'));
        return `
            <div class="mk-footer__villes">
                <p class="mk-footer__titre">${t.footerVilles}</p>
                <p>${locs.map(l => `<a href="/services/${l.cityId}/">${esc(l.cityName)}</a>`).join(' · ')}</p>
            </div>`;
    })() : '';
    return `${final}
    <footer class="mk-footer">
        <div class="mk-footer__in">
            <div class="mk-footer__grille">
                <div class="mk-footer__marque">
                    <img src="/assets/images/logo-v2-tiny.webp" alt="" width="120" height="120" loading="lazy">
                    <p class="mk-footer__nom">${SITE.marque}</p>
                    <p>${t.footerAccroche}</p>
                </div>
                <div class="mk-footer__contact">
                    <p class="mk-footer__titre">${t.footerContact}</p>
                    <ul>
                        <li><a href="tel:${c.tel}">${c.telAffiche}</a></li>
                        <li><a href="mailto:${c.email}">${c.email}</a></li>
                        <li>${c.adresse.rue}, ${c.adresse.npa} ${c.adresse.ville}</li>
                        ${c.ficheGoogle ? `<li><a href="${c.ficheGoogle}" target="_blank" rel="noopener noreferrer">${t.footerAvis} →</a></li>` : ''}
                    </ul>
                    <p class="mk-footer__titre mk-footer__titre--espace">${t.footerHoraires}</p>
                    <ul>
${c.horaires[langue].map(h => `                        <li>${h}</li>`).join('\n')}
                    </ul>
                </div>
                <div>
                    <p class="mk-footer__titre">${t.footerPresta}</p>
                    <ul>
                        ${lien(P.atelier[langue], esc(P.atelier.libelle[langue]))}
                        ${lien(P['a-domicile'][langue], esc(P['a-domicile'].libelle[langue]))}
${PRESTATIONS.map(p => `                        ${lien(urlPrestation(p, langue), esc(p[langue].nom))}`).join('\n')}
                    </ul>
                </div>
                <div>
                    <p class="mk-footer__titre">${t.footerInfos}</p>
                    <ul>
${infos.map(x => '                        ' + x).join('\n')}
                    </ul>
                </div>
            </div>${listeVilles}
            <div class="mk-footer__bas">&copy; 2026 ${SITE.marque} · ${c.raisonSociale} · ${c.tva}</div>
        </div>
    </footer>`;
}

// Page alternee (traduction) d'un fichier source, pour le selecteur de langue
// et pour la garde « traduction manquante ».
function alternes(fichier) {
    const u = cheminVersUrl(fichier);
    const paires = [];
    Object.values(SITE.pages).forEach(pg => { if (pg.fr && pg.en) paires.push([pg.fr, pg.en]); });
    PRESTATIONS.forEach(p => paires.push([urlPrestation(p, 'fr'), urlPrestation(p, 'en')]));
    paires.push(['/404.html', '/en/404.html']);
    const blog = path.join(__dirname, 'blog.json');
    if (fs.existsSync(blog) && SITE.pages.blog) {
        JSON.parse(fs.readFileSync(blog, 'utf8')).articles.forEach(a =>
            paires.push([`${SITE.pages.blog.fr}${a.slug.fr}.html`, `${SITE.pages.blog.en}${a.slug.en}.html`]));
    }
    for (const [fr, en] of paires) if (u === fr || u === en) return { fr, en, actuel: u };
    return { fr: null, en: null, actuel: u };
}

// Les arguments du header / footer d'une page, deduits de son chemin. Utilise
// par les generateurs ET par inject-shell.js : les deux produisent donc
// exactement le meme bloc, d'ou l'idempotence.
function cheminVersUrl(fichier) {
    return '/' + fichier.replace(/\\/g, '/').replace(/(^|\/)index\.html$/, '$1');
}
function contenuHeader(fichier, langue) {
    const a = alternes(fichier);
    return header(langue, { actuel: cheminVersUrl(fichier), alternes: a.fr ? a : {} });
}
function contenuFooter(fichier, langue) {
    return footer(langue, { actuel: cheminVersUrl(fichier) });
}
const repereHeader = (f, l) => repere('HEADER', contenuHeader(f, l));
const repereFooter = (f, l) => repere('FOOTER', contenuFooter(f, l));

module.exports = {
    repereHeader, repereFooter, contenuHeader, contenuFooter, cheminVersUrl,
    header, footer, appelFinal, alternes, arbreMenu, urlPrestation, urlReserver, PRESTATIONS, UI,
    head, CSP,
    SITE, dateLongue, veille, url, esc,
    gardeInline, carteConcours, blocFinDePage, blocConcoursOffres, repere, repereFinDePage,
    JS_MAINTENANT,
};
