/*
 * ============================================================================
 * INJECTION DU MODULE PARTAGE DANS LES SOURCES — inject-shell.js
 * ----------------------------------------------------------------------------
 * Lance par `npm run generate` (donc par `npm run build`), APRES les trois
 * generateurs. Reecrit, dans les fichiers SOURCES, le contenu compris entre
 * des reperes :
 *
 *   <!-- CCW:HEADER -->          ... <!-- /CCW:HEADER -->           header unifie, toutes les pages
 *   <!-- CCW:FOOTER -->          ... <!-- /CCW:FOOTER -->           footer unifie, toutes les pages
 *   <!-- CCW:CONCOURS -->        ... <!-- /CCW:CONCOURS -->         fin de <body>, toutes les pages
 *   <!-- CCW:CONCOURS-OFFRES --> ... <!-- /CCW:CONCOURS-OFFRES -->  promos.html, en/promos.html
 *   <!-- CCW:ACCUEIL-* -->       ... (QUESTIONNAIRE, OFFRES, BLOG, FAQ, CTA, ANCRES) les deux accueils
 *
 * Pourquoi dans les sources et pas dans dist/ : `npm run dev` (localhost:5173)
 * sert les sources. Une injection faite au build seulement serait invisible en
 * local, et ce qu'on verifie ne serait pas ce qui part en ligne. Meme modele
 * que les 38 pages villes : generees, puis commitees.
 *
 * Idempotent : relance sans changement de site.json, il ne modifie aucun
 * fichier. Les fins de ligne CRLF des fichiers Windows sont conservees.
 *
 * LE SCRIPT ECHOUE (code 1) SI :
 *  - une page n'a pas l'un de ses reperes (HEADER, FOOTER, CONCOURS) ;
 *  - une page (hors 38 villes) n'a pas sa traduction declaree ET presente ;
 *  - une page declaree existante dans site.json, ou une entree du menu, est
 *    introuvable sur le disque ;
 *  - une page Offres n'a pas son repere CCW:CONCOURS-OFFRES ;
 *  - un element data-concours, ou qu'il soit, porte une date differente de
 *    site.json (from = debut ; until = fin ou veille du debut ;
 *    expired-after = fin).
 *
 * `node inject-shell.js --amorcer` pose les reperes manquants : il REMPLACE le
 * premier <header> / <footer> de la page, pose CCW:CONCOURS avant </body> et
 * CCW:CONCOURS-OFFRES avant les sections permanentes des pages Offres. A n'utiliser qu'une
 * fois, ou pour une nouvelle page ecrite a la main.
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const { globSync } = require('tinyglobby');
const shell = require('./site-shell.js');
const comp = require('./site-composants.js');

const AMORCER = process.argv.includes('--amorcer');
const C = shell.SITE.concours;
const ROOT = __dirname;

const pages = globSync('**/*.html', { cwd: ROOT, ignore: ['node_modules/**', 'dist/**'] }).sort();

const PAGES_CONCOURS = ['jeu-concours', 'en/giveaway'].map(p => p + '.html');
const PAGES_OFFRES = ['promos.html', 'en/promos.html'];
const ANCRE_OFFRES = [
    "<!-- ===== À PARTIR D'ICI : SECTIONS PERMANENTES ===== -->",
    '<!-- ===== FROM HERE ON: PERMANENT SECTIONS ===== -->',
];

const erreurs = [];

function existeUrl(u) {
    const rel = u.replace(/^\//, '').replace(/(^|\/)$/, '$1index.html').split('#')[0];
    return fs.existsSync(path.join(ROOT, rel || 'index.html'));
}

// Garde « page du menu manquante » : toute page declaree existante dans
// site.json, et toute entree du menu ou du pied de page, doit exister en FR et
// en EN sur le disque.
Object.entries(shell.SITE.pages).forEach(([cle, pg]) => {
    if (!pg.existe) return;
    ['fr', 'en'].forEach(l => { if (pg[l] && !existeUrl(pg[l])) erreurs.push(`site.json : la page "${cle}" (${l}) est declaree existante mais ${pg[l]} est introuvable.`); });
});
['fr', 'en'].forEach(l => {
    shell.arbreMenu(l).forEach(it => [it, ...it.enfants].forEach(e => {
        if (e.href && !existeUrl(e.href)) erreurs.push(`menu (${l}) : ${e.libelle} pointe vers ${e.href}, introuvable.`);
    }));
});
let modifiees = 0;

function langueDe(html, fichier) {
    const m = html.match(/<html[^>]*\blang="([a-z]{2})/i);
    if (m) return m[1].toLowerCase() === 'en' ? 'en' : 'fr';
    return fichier.startsWith('en/') ? 'en' : 'fr';
}

// Amorce par REMPLACEMENT : le premier <tag ...>...</tag> de la page devient le
// repere (l'ancien header / footer ecrit a la main disparait). Delimite par la
// balise, jamais par un commentaire .
function remplacerElement(html, tag, nom) {
    const i = html.search(new RegExp(`<${tag}[\\s>]`));
    const j = html.indexOf(`</${tag}>`, i);
    if (i < 0 || j < 0) return null;
    return html.slice(0, i) + `<!-- CCW:${nom} -->\n    <!-- /CCW:${nom} -->` + html.slice(j + tag.length + 3);
}

function remplacer(html, nom, contenu, fichier, amorce) {
    const ouv = `<!-- CCW:${nom} -->`, ferm = `<!-- /CCW:${nom} -->`;
    const i = html.indexOf(ouv), j = html.indexOf(ferm);
    if (i < 0 || j < 0 || j < i) {
        if (i >= 0 || j >= 0) { erreurs.push(`${fichier} : repere CCW:${nom} mal forme (ouvrant/fermant).`); return html; }
        if (!AMORCER) { erreurs.push(`${fichier} : repere CCW:${nom} manquant (node inject-shell.js --amorcer pour le poser).`); return html; }
        if (typeof amorce === 'string') {
            const r = remplacerElement(html, amorce, nom);
            if (!r) { erreurs.push(`${fichier} : aucun <${amorce}> a remplacer par CCW:${nom}.`); return html; }
            console.log(`   + <${amorce}> remplace par le repere CCW:${nom} dans ${fichier}`);
            return remplacer(r, nom, contenu, fichier, amorce);
        }
        const pos = amorce(html);
        if (pos < 0) { erreurs.push(`${fichier} : impossible de poser le repere CCW:${nom}.`); return html; }
        const ind = html.slice(html.lastIndexOf('\n', pos - 1) + 1, pos);
        const debutLigne = /^\s*$/.test(ind) ? pos - ind.length : pos;
        const retrait = /^\s*$/.test(ind) ? ind : '    ';
        html = html.slice(0, debutLigne) + `${retrait}${ouv}\n${retrait}${ferm}\n` + html.slice(debutLigne);
        console.log(`   + repere CCW:${nom} pose dans ${fichier}`);
        return remplacer(html, nom, contenu, fichier, amorce);
    }
    if (html.indexOf(ouv, i + 1) >= 0) { erreurs.push(`${fichier} : repere CCW:${nom} en double.`); return html; }
    // Le fermant reprend le retrait de l'ouvrant : relance, le fichier ne bouge pas.
    const retrait = html.slice(html.lastIndexOf('\n', i - 1) + 1, i).replace(/\S.*$/, '');
    return html.slice(0, i + ouv.length) + contenu + '\n' + retrait + html.slice(j);
}

function verifierDates(html, fichier) {
    const re = /<[a-z]+\b[^>]*\bdata-concours\b[^>]*>/gi;
    let m;
    while ((m = re.exec(html))) {
        const tag = m[0];
        const attr = n => { const x = tag.match(new RegExp(`\\b${n}="([^"]*)"`)); return x ? x[1] : null; };
        const from = attr('data-promo-from'), until = attr('data-promo-until'), apres = attr('data-promo-expired-after');
        if (!from && !until && !apres) erreurs.push(`${fichier} : bloc data-concours sans date : ${tag.slice(0, 120)}`);
        if (from !== null && from !== C.debut) erreurs.push(`${fichier} : data-promo-from="${from}" sur un bloc concours, site.json dit ${C.debut}.`);
        if (until !== null && until !== C.fin && until !== shell.veille(C.debut)) erreurs.push(`${fichier} : data-promo-until="${until}" sur un bloc concours, site.json dit ${C.fin}.`);
        if (apres !== null && apres !== C.fin) erreurs.push(`${fichier} : data-promo-expired-after="${apres}" sur un bloc concours, site.json dit ${C.fin}.`);
    }
}

pages.forEach(fichier => {
    const abs = path.join(ROOT, fichier);
    const brut = fs.readFileSync(abs, 'utf8');
    const crlf = brut.includes('\r\n');
    let html = crlf ? brut.replace(/\r\n/g, '\n') : brut;
    const langue = langueDe(html, fichier);
    const avant = html;

    html = remplacer(html, 'HEADER', shell.contenuHeader(fichier, langue), fichier, 'header');
    html = remplacer(html, 'FOOTER', shell.contenuFooter(fichier, langue), fichier, 'footer');

    // Traduction : chaque page (hors 38 villes, FR seulement par decision du
    // decision de conception) doit avoir sa paire declaree et presente sur le disque.
    if (!fichier.startsWith('services/')) {
        const a = shell.alternes(fichier);
        if (!a.fr) erreurs.push(`${fichier} : aucune traduction declaree (site.json, prestations.json, blog.json).`);
        else [a.fr, a.en].forEach(u => { if (!existeUrl(u)) erreurs.push(`${fichier} : sa traduction ${u} n'existe pas.`); });
    }

    html = remplacer(html, 'CONCOURS', shell.blocFinDePage(langue, { pageConcours: PAGES_CONCOURS.includes(fichier) }),
        fichier, h => h.lastIndexOf('</body>'));

    // Accueil EN : sections S3 a S7 generees (site-composants.js, pages.json).
    // L'accueil FR suit la planche DA 2026 (public/js/accueil-2026.js) : plus de reperes ACCUEIL-*.
    if (fichier === 'en/index.html') {
        const blocs = comp.accueil(langue);
        Object.keys(blocs).forEach(n => {
            html = remplacer(html, 'ACCUEIL-' + n, blocs[n], fichier, () => -1);
        });
    }

    if (PAGES_OFFRES.includes(fichier)) {
        html = remplacer(html, 'CONCOURS-OFFRES', shell.blocConcoursOffres(langue), fichier,
            h => { for (const a of ANCRE_OFFRES) { const p = h.indexOf(a); if (p >= 0) return p; } return -1; });
    }

    verifierDates(html, fichier);

    if (html !== avant) {
        fs.writeFileSync(abs, crlf ? html.replace(/\n/g, '\r\n') : html);
        modifiees++;
    }
});

if (erreurs.length) {
    console.error(`\n❌ inject-shell.js : ${erreurs.length} erreur(s)\n - ` + erreurs.join('\n - '));
    process.exit(1);
}
console.log(`🧩 inject-shell.js : ${pages.length} pages verifiees, ${modifiees} mise(s) a jour.`);
