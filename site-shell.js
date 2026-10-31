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

const TXT_PASTILLE = {
    fr: { eb: 'JEU-CONCOURS', ebPop: 'JEU-CONCOURS · NOVEMBRE', titre: `Un ${C.lot.fr} à gagner`, texte: 'Une prestation réalisée et payée du 1er au 30 novembre suffit pour participer (une participation par personne).',
        reserver: 'Réserver pour participer', voir: 'Voir le concours', masquer: 'Masquer l’offre', avant: 'Dès le 1er novembre', reste: 'Plus que ', commence: 'Commence dans ', fin: 'Fin dans ',
        appeler: 'Appeler', barre: `Réserver · dès ${'{PRIX}'} CHF` },
    en: { eb: 'GIVEAWAY', ebPop: 'GIVEAWAY · NOVEMBER', titre: `Win an ${C.lot.en}`, texte: 'One service carried out and paid for between 1 and 30 November is all it takes (one entry per person).',
        reserver: 'Book to enter', voir: 'See the giveaway', masquer: 'Hide the offer', avant: 'From 1 November', reste: 'Only ', commence: 'Starts in ', fin: 'Ends in ',
        appeler: 'Call', barre: `Book · from CHF ${'{PRIX}'}` },
};

function scriptCarte(t) {
    return '<script>(function(){var d=document.getElementById("ccw-concours");if(!d)return;' + JS_MAINTENANT +
        'var st=new Date(d.getAttribute("data-debut")+"T00:00:00"),en=new Date(d.getAttribute("data-promo-until")+"T23:59:59");' +
        'if(isNaN(st.getTime())||isNaN(en.getTime())||n>en){d.remove();return}' +
        'try{if(sessionStorage.getItem("ccwPastille"))return}catch(x){}' +
        'var dec=n.getTime()-Date.now(),pop=d.querySelector("[data-pop]"),b=d.querySelector("[data-b]"),s=d.querySelector("[data-s]"),cd=d.querySelector("[data-cd]");' +
        'function z(v){return v<10?"0"+v:""+v}' +
        `function r(){var m=Date.now()+dec,av=m<st.getTime(),x=Math.max(0,(av?st.getTime():en.getTime())-m),j=Math.floor(x/864e5),h=Math.floor(x%864e5/36e5),mi=Math.floor(x%36e5/6e4);` +
        `if(!av&&x<=0){d.remove();return}s.textContent=av?${JSON.stringify(t.avant)}:${JSON.stringify(t.reste)}+j+" j";cd.textContent=(av?${JSON.stringify(t.commence)}:${JSON.stringify(t.fin)})+j+" j "+z(h)+" h "+z(mi)+" min"}` +
        'r();d.hidden=false;setInterval(r,3e4);' +
        'b.addEventListener("click",function(){pop.hidden=!pop.hidden;b.setAttribute("aria-expanded",String(!pop.hidden))});' +
        'd.querySelector("[data-x]").addEventListener("click",function(){d.hidden=true;try{sessionStorage.setItem("ccwPastille","1")}catch(x){}});' +
        '})();</script>';
}

function carteConcours(langue) {
    const t = TXT_PASTILLE[langue];
    return `
    <div id="ccw-concours" class="da-pastille" data-concours data-debut="${C.debut}" data-promo-until="${C.fin}" hidden>
        <div class="da-pastille__pop" id="ccw-concours-pop" role="dialog" aria-label="${esc(t.ebPop)}" data-pop hidden>
            <button class="da-pastille__x" type="button" aria-label="${esc(t.masquer)}" data-x>&times;</button>
            <span class="da-pastille__eb">${esc(t.ebPop)}</span>
            <p class="da-pastille__titre">${esc(t.titre)}</p>
            <p>${esc(t.texte)}</p>
            <div class="da-pastille__cd" data-cd></div>
            <a class="da-pastille__cta" href="${urlReserver(langue)}">${esc(t.reserver)}</a>
            <a class="da-pastille__lien" href="${url('jeu-concours', langue)}">${esc(t.voir)}</a>
        </div>
        <button class="da-pastille__btn" type="button" aria-label="${esc(t.eb)} : ${esc(C.lot[langue])}" aria-expanded="false" aria-controls="ccw-concours-pop" data-b>
            <span class="da-pastille__ico">${ICO_CADEAU}</span>
            <span class="da-pastille__txt"><span class="da-pastille__eb">${esc(t.eb)}</span><span class="da-pastille__t">${esc(C.lot[langue])}</span><span class="da-pastille__s" data-s></span></span>
        </button>
    </div>
    ${scriptCarte(t)}`;
}

// Barre de reservation mobile (DA 31.10.2026) : Appeler, WhatsApp, Reserver.
function barreMobile(langue) {
    const t = TXT_PASTILLE[langue];
    const prix = require('./offres.json').packs[0].prix;
    return `
    <div class="da-sticky">
        <a class="da-ico" href="tel:${SITE.contact.tel}" aria-label="${esc(t.appeler)}">${ICO_TEL}</a>
        <a class="da-ico" href="https://wa.me/${SITE.contact.whatsapp}" aria-label="WhatsApp" target="_blank" rel="noopener noreferrer">${ICO_WA}</a>
        <a class="da-go" href="${urlReserver(langue)}">${esc(t.barre.replace('{PRIX}', prix))}</a>
    </div>`;
}

// Contenu du repere CCW:CONCOURS d'une page. La page du concours elle-meme ne
// porte pas la carte, mais garde le garde-fou (elle a des blocs dates).
function blocFinDePage(langue, { pageConcours = false } = {}) {
    return `${pageConcours ? '' : carteConcours(langue)}${barreMobile(langue)}
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
const CSP = "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://www.googleadservices.com https://googleads.g.doubleclick.net https://pagead2.googlesyndication.com https://www.google.com https://api.sumup.com https://api3.geo.admin.ch";

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
    <meta name="theme-color" content="#D4AF37">

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@400;700;800;900&display=swap" onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@400;700;800;900&display=swap" rel="stylesheet"></noscript>
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
        wa: 'Bonjour, je souhaiterais obtenir un renseignement.', langue: 'Langue',
        footerPages: 'Pages', footerPresta: 'Prestations spécialisées', footerContact: 'Contact &amp; horaires',
        footerVilles: 'Nous intervenons à', footerInfos: 'Informations', skip: 'Passer au contenu principal',
    },
    en: {
        menu: 'Main menu', ouvrir: 'Open the menu', fermer: 'Close the menu', sous: 'Submenu',
        reserver: 'Book', appeler: 'Call', apercu: 'Overview', accueil: 'Home',
        wa: 'Hello, I would like some information.', langue: 'Language',
        footerPages: 'Pages', footerPresta: 'Specialist services', footerContact: 'Contact &amp; hours',
        footerVilles: 'We operate in', footerInfos: 'Information', skip: 'Skip to main content',
    },
};

const ICONE_TEL = '<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>';
const CHEVRON = '<svg class="ccw-chevron" width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M1 3l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';

// URL des prestations, FR et EN
function urlPrestation(p, l) { return l === 'fr' ? `/${p.id}.html` : `/en/${p.slugEn}.html`; }

// Arbre du menu, relu dans site.json. Seules les pages existantes y entrent.
function arbreMenu(langue) {
    const P = SITE.pages;
    const enfantsDe = cle => Object.entries(P)
        .filter(([, pg]) => pg.parent === cle && pg.existe && pg[langue])
        .sort((a, b) => a[1].ordre - b[1].ordre)
        .map(([k, pg]) => ({ cle: k, libelle: pg.libelle[langue], href: pg[langue] }));
    return Object.entries(P)
        .filter(([, pg]) => pg.menu && !pg.bouton)
        .sort((a, b) => a[1].menu - b[1].menu)
        .map(([cle, pg]) => {
            let enfants = cle === 'prestations'
                ? PRESTATIONS.map(p => ({ cle: p.id, libelle: p[langue].nom, href: urlPrestation(p, langue) }))
                : enfantsDe(cle);
            const href = pg.existe && pg[langue] ? pg[langue] : null;
            return { cle, libelle: pg.libelle[langue], href, enfants };
        })
        .filter(it => it.href || it.enfants.length);
}

function urlReserver(langue) {
    const r = SITE.pages.reserver;
    if (!r.existe) throw new Error('site.json : la page reserver doit exister, le bouton Reserver du menu y mene.');
    return r[langue];
}

const courant = (href, actuel) => href && actuel && href === actuel ? ' aria-current="page"' : '';

function header(langue, { actuel = null, alternes = {} } = {}) {
    const t = UI[langue], c = SITE.contact, arbre = arbreMenu(langue);
    const fr = alternes.fr || SITE.pages.accueil.fr, en = alternes.en || SITE.pages.accueil.en;
    const lang = `<div class="ccw-lang" aria-label="${t.langue}">
                    ${langue === 'fr' ? '<span class="lang-active" aria-current="true">FR</span>' : `<a href="${fr}" hreflang="fr" lang="fr">FR</a>`}
                    <span aria-hidden="true">|</span>
                    ${langue === 'en' ? '<span class="lang-active" aria-current="true">EN</span>' : `<a href="${en}" hreflang="en" lang="en">EN</a>`}
                </div>`;

    const desktop = arbre.map(it => {
        if (!it.enfants.length) {
            return `                    <li class="ccw-nav__item"><a class="ccw-nav__lien" href="${it.href}"${courant(it.href, actuel)}>${esc(it.libelle)}</a></li>`;
        }
        const id = `ccw-sub-${it.cle}`;
        const tete = it.href
            ? `<a class="ccw-nav__lien" href="${it.href}"${courant(it.href, actuel)}>${esc(it.libelle)}</a><button type="button" class="ccw-nav__toggle" aria-expanded="false" aria-controls="${id}"><span class="sr-only">${t.sous} ${esc(it.libelle)}</span>${CHEVRON}</button>`
            : `<button type="button" class="ccw-nav__lien ccw-nav__toggle ccw-nav__toggle--seul" aria-expanded="false" aria-controls="${id}">${esc(it.libelle)}${CHEVRON}</button>`;
        return `                    <li class="ccw-nav__item ccw-nav__item--sub">${tete}
                        <ul id="${id}" class="ccw-sub">
${it.enfants.map(e => `                            <li><a href="${e.href}"${courant(e.href, actuel)}>${esc(e.libelle)}</a></li>`).join('\n')}
                        </ul>
                    </li>`;
    }).join('\n');

    const mobile = arbre.map(it => {
        if (!it.enfants.length) {
            return `            <li><a class="ccw-menu__lien" href="${it.href}"${courant(it.href, actuel)}>${esc(it.libelle)}</a></li>`;
        }
        const ouvert = it.enfants.some(e => e.href === actuel) || it.href === actuel ? ' open' : '';
        return `            <li><details class="ccw-menu__groupe"${ouvert}><summary class="ccw-menu__lien">${esc(it.libelle)}${CHEVRON}</summary>
                <ul>
${it.href ? `                    <li><a href="${it.href}"${courant(it.href, actuel)}>${t.apercu}</a></li>\n` : ''}${it.enfants.map(e => `                    <li><a href="${e.href}"${courant(e.href, actuel)}>${esc(e.libelle)}</a></li>`).join('\n')}
                </ul>
            </details></li>`;
    }).join('\n');

    return `
    <header id="ccw-header" class="ccw-header">
        <div class="ccw-header__barre">
            <a href="${SITE.pages.accueil[langue]}" class="ccw-header__logo group" aria-label="${SITE.marque} — ${t.accueil}">
                <img src="/assets/images/logo-v2-tiny.webp" alt="" width="120" height="120" loading="eager">
                <span>${SITE.marque}</span>
            </a>
            <nav class="ccw-nav" aria-label="${t.menu}">
                <ul class="ccw-nav__liste">
${desktop}
                </ul>
            </nav>
            <div class="ccw-header__actions">
                <a href="tel:${c.tel}" class="ccw-header__tel" title="${t.appeler} ${c.telAffiche}">${ICONE_TEL}<span class="sr-only">${t.appeler} ${SITE.marque} ${c.telAffiche}</span></a>
                ${lang}
                <a href="${urlReserver(langue)}" class="ccw-header__reserver"${courant(urlReserver(langue), actuel)}>${t.reserver}</a>
                <button type="button" id="ccw-burger" class="ccw-burger" aria-expanded="false" aria-controls="ccw-menu" aria-label="${t.ouvrir}" data-label-open="${t.ouvrir}" data-label-close="${t.fermer}">
                    <svg width="26" height="26" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
                </button>
            </div>
        </div>
        <nav id="ccw-menu" class="ccw-menu" aria-label="${t.menu}" hidden>
            <ul class="ccw-menu__liste">
${mobile}
            </ul>
            <div class="ccw-menu__bas">
                <a href="${urlReserver(langue)}" class="ccw-menu__reserver">${t.reserver}</a>
                <div class="ccw-menu__contact">
                    <a href="tel:${c.tel}">${t.appeler}</a>
                    <a href="https://wa.me/${c.whatsapp}?text=${encodeURIComponent(t.wa)}" target="_blank" rel="noopener noreferrer">WhatsApp</a>
                </div>
                ${lang}
            </div>
        </nav>
        <script>(function(){var b=document.getElementById("ccw-burger"),m=document.getElementById("ccw-menu");if(!b||!m)return;
function o(v){m.hidden=!v;b.setAttribute("aria-expanded",String(v));b.setAttribute("aria-label",v?b.getAttribute("data-label-close"):b.getAttribute("data-label-open"));document.documentElement.classList.toggle("ccw-menu-ouvert",v)}
b.addEventListener("click",function(){o(m.hidden)});
[].forEach.call(m.querySelectorAll("a"),function(a){a.addEventListener("click",function(){o(false)})});
var t=document.querySelectorAll("#ccw-header .ccw-nav__toggle");
function f(x){[].forEach.call(t,function(y){if(y!==x)y.setAttribute("aria-expanded","false")})}
[].forEach.call(t,function(x){x.addEventListener("click",function(){var v=x.getAttribute("aria-expanded")!=="true";f(x);x.setAttribute("aria-expanded",String(v))})});
document.addEventListener("keydown",function(e){if(e.key!=="Escape")return;var a=document.activeElement,l=a&&a.closest&&a.closest(".ccw-nav__item--sub");f(null);if(l){var g=l.querySelector(".ccw-nav__toggle");if(g)g.focus()}if(!m.hidden){o(false);b.focus()}});
document.addEventListener("click",function(e){if(!e.target.closest||!e.target.closest(".ccw-nav__item--sub"))f(null)});
window.matchMedia("(min-width: 1024px)").addEventListener("change",function(e){if(e.matches)o(false)});
})();</script>
    </header>`;
}

function footer(langue, { villes = true } = {}) {
    const t = UI[langue], c = SITE.contact, P = SITE.pages, fr = langue === 'fr';
    const arbre = arbreMenu(langue).filter(it => it.cle !== 'prestations');
    const pages = [{ libelle: P.accueil.libelle[langue], href: P.accueil[langue] }];
    arbre.forEach(it => {
        if (it.href) pages.push({ libelle: it.libelle, href: it.href });
        it.enfants.forEach(e => pages.push(e));
    });
    if (P.reserver.existe) pages.push({ libelle: P.reserver.libelle[langue], href: P.reserver[langue] });
    const pied = Object.values(P).filter(pg => pg.pied && pg.existe).map(pg => ({ libelle: pg.libelle[langue], href: pg[langue] }));
    const lis = l => l.map(x => `                    <li><a href="${x.href}">${esc(x.libelle)}</a></li>`).join('\n');
    const listeVilles = villes ? (() => {
        const locs = JSON.parse(fs.readFileSync(path.join(__dirname, 'locations.json'), 'utf8'));
        return `
        <div class="ccw-footer__villes">
            <p class="ccw-footer__titre">${t.footerVilles}</p>
            <p>${locs.map(l => `<a href="/services/${l.cityId}/">${esc(l.cityName)}</a>`).join(' · ')}</p>
        </div>`;
    })() : '';
    return `
    <footer class="ccw-footer">
        <div class="ccw-footer__grille">
            <div>
                <p class="ccw-footer__marque">${SITE.marque}</p>
                <p>${c.raisonSociale}<br>${c.adresse.rue}<br>${c.adresse.npa} ${c.adresse.ville}</p>
                <p><a class="ccw-footer__or" href="mailto:${c.email}">${c.email}</a></p>
            </div>
            <div>
                <p class="ccw-footer__titre">${t.footerContact}</p>
                <p><a class="ccw-footer__or ccw-footer__tel" href="tel:${c.tel}">${c.telAffiche}</a></p>
                ${c.ficheGoogle ? `<p><a class="ccw-footer__or" href="${c.ficheGoogle}" target="_blank" rel="noopener noreferrer">${fr ? 'Nos avis sur Google' : 'Our Google reviews'} &rarr;</a></p>` : ''}
                <ul>
${c.horaires[langue].map(h => `                    <li>${h}</li>`).join('\n')}
                </ul>
            </div>
            <div>
                <p class="ccw-footer__titre">${t.footerPages}</p>
                <ul>
${lis(pages)}
                </ul>
            </div>
            <div>
                <p class="ccw-footer__titre">${t.footerPresta}</p>
                <ul>
${lis(PRESTATIONS.map(p => ({ libelle: p[langue].nom, href: urlPrestation(p, langue) })))}
                </ul>
                <p class="ccw-footer__titre ccw-footer__titre--espace">${t.footerInfos}</p>
                <ul>
${lis(pied)}
                </ul>
            </div>
        </div>${listeVilles}
        <div class="ccw-footer__bas">&copy; 2026 ${SITE.marque} &nbsp;|&nbsp; <span>${c.tva}</span></div>
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
    return footer(langue);
}
const repereHeader = (f, l) => repere('HEADER', contenuHeader(f, l));
const repereFooter = (f, l) => repere('FOOTER', contenuFooter(f, l));

module.exports = {
    repereHeader, repereFooter, contenuHeader, contenuFooter, cheminVersUrl,
    header, footer, alternes, arbreMenu, urlPrestation, urlReserver, PRESTATIONS, UI,
    head, CSP,
    SITE, dateLongue, veille, url, esc,
    gardeInline, carteConcours, blocFinDePage, blocConcoursOffres, repere, repereFinDePage,
    JS_MAINTENANT,
};
