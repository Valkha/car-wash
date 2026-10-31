/*
 * ============================================================================
 * GENERATEUR DU BLOG — generate-blog.js
 * ----------------------------------------------------------------------------
 * Source : blog.json. Produit blog/index.html, en/blog/index.html et une page
 * par article et par langue (gabarit « informatif »).
 *
 *  - Reponse des le premier paragraphe (They Ask, You Answer).
 *  - Appels a l'action DANS le texte (liens data-cta), un encadre au milieu,
 *    un rappel en fin. Pas de fenetre surgissante.
 *  - Chaque clic d'appel a l'action pousse dataLayer {event:'blog_cta',
 *    article, cible} : a declencher dans GTM.
 *  - Les prix ne sont jamais ecrits dans blog.json : {prix:or}, {presta:ppf},
 *    {depl:orange}, {abo:min}... sont relus ici dans offres.json,
 *    prestations.json, site.json et app.js. Un jeton inconnu fait echouer le build.
 *  - JSON-LD Article (datePublished, dateModified, auteur), « Mis a jour le ».
 *  - Le sitemap est ecrit par generate-pages.js, qui relit blog.json.
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const shell = require('./site-shell.js');
const comp = require('./site-composants.js');
const { ctaFinal } = require('./generate-site.js');

const { SITE, esc, dateLongue, PRESTATIONS } = shell;
const { OFFRES, BLOG, lien, liens, urlArticle, LABEL, BTN_OR, BTN_LIGNE } = comp;

const jetons = (t, ou) => comp.jetons(t, 'blog.json (' + ou + ')', ou.split('/')[1]);

const TB = {
    fr: { titre: 'Blog lavage & detailing auto à Genève | Clean Cars Wash', description: 'Prix, comparatifs et conseils pour l’entretien de votre voiture à Genève et Vaud : les réponses de l’équipe Clean Cars Wash.',
        h1: 'Blog lavage et detailing auto', accroche: 'Les réponses, sans détour.', intro: 'Prix, comparatifs, conseils : ce que nos clients nous demandent le plus souvent, avec la réponse dès le premier paragraphe.',
        publie: 'Publié le', maj: 'Mis à jour le', par: 'Par', lire: "Lire l'article", retour: 'Tous les articles', aLire: 'À lire aussi' },
    en: { titre: 'Car wash & detailing blog, Geneva | Clean Cars Wash', description: 'Prices, comparisons and advice on looking after your car in Geneva and Vaud: answers from the Clean Cars Wash team.',
        h1: 'Car wash and detailing blog', accroche: 'Straight answers.', intro: 'Prices, comparisons, advice: what our customers ask most often, with the answer in the first paragraph.',
        publie: 'Published on', maj: 'Updated on', par: 'By', lire: 'Read the article', retour: 'All articles', aLire: 'Further reading' },
};

function blocs(corps, langue, ou) {
    return corps.map(b => {
        const L = s => liens(jetons(s, ou), langue);
        if (b.p) return `            <p>${L(b.p)}</p>`;
        if (b.h2) return `            <h2>${L(b.h2)}</h2>`;
        if (b.img) return `            <figure class="ccw-article__figure">
                <img src="${b.img.src}" alt="${esc(b.img.alt)}" width="${b.img.largeur}" height="${b.img.hauteur}" loading="lazy" decoding="async">
                ${b.img.mention ? `<figcaption>${esc(b.img.mention)}</figcaption>` : ''}
            </figure>`;
        if (b.ul) return `            <ul>\n${b.ul.map(i => `                <li>${L(i)}</li>`).join('\n')}\n            </ul>`;
        if (b.encadre) return `            <aside class="ccw-article__encadre">
                <p class="ccw-article__encadre-titre">${L(b.encadre.titre)}</p>
                <p>${L(b.encadre.texte)}</p>
                <a href="${lien(b.encadre.bouton[1], langue)}" class="${BTN_OR}" data-cta>${L(b.encadre.bouton[0])}</a>
            </aside>`;
        if (b.rappel) return `            <div class="ccw-article__rappel">
                <p>${L(b.rappel.texte)}</p>
                <a href="${lien(b.rappel.bouton[1], langue)}" class="${BTN_OR}" data-cta>${L(b.rappel.bouton[0])}</a>
            </div>`;
        throw new Error(`blog.json (${ou}) : bloc inconnu ${JSON.stringify(b).slice(0, 80)}`);
    }).join('\n');
}

// Script d'evenement : un dataLayer.push par clic d'appel a l'action.
function scriptCta(id) {
    return `<script>(function(){var a=document.querySelectorAll("[data-article] [data-cta]");[].forEach.call(a,function(x){x.addEventListener("click",function(){try{(window.dataLayer=window.dataLayer||[]).push({event:"blog_cta",article:${JSON.stringify(id)},cible:x.getAttribute("href")})}catch(e){}})})})();</script>`;
}

function enveloppe({ langue, fichier, headOpts, corps, cta = true }) {
    return `${shell.head(Object.assign({ langue }, headOpts))}
<body class="text-gray-300 antialiased">
    <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-5W69QPT3"
    height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>

    <a href="#main-content" class="skip-link">${shell.UI[langue].skip}</a>
    ${shell.repereHeader(fichier, langue)}

    <main id="main-content" class="max-w-6xl mx-auto px-4 md:px-6">${corps}${cta ? ctaFinal(langue) : ''}
    </main>
    ${shell.repereFooter(fichier, langue)}

    ${shell.repereFinDePage(langue)}
</body>
</html>
`;
}

function pageArticle(a, langue) {
    const t = TB[langue], d = a[langue], ou = `${a.id}/${langue}`;
    const url = urlArticle(a, langue);
    const fichier = url.replace(/^\//, '');
    const jsonld = [{
        '@context': 'https://schema.org', '@type': 'Article',
        headline: jetons(d.titre, ou), description: jetons(d.description, ou),
        datePublished: a.publie, dateModified: a.maj, inLanguage: langue === 'fr' ? 'fr-CH' : 'en',
        mainEntityOfPage: SITE.base + url,
        author: { '@type': 'Organization', name: BLOG.auteur[langue], url: SITE.base + SITE.pages.accueil[langue] },
        publisher: { '@type': 'Organization', name: SITE.marque, logo: { '@type': 'ImageObject', url: SITE.base + '/assets/images/logo-v2.png' } },
        image: SITE.base + ((d.corps.find(b => b.img) || {}).img ? d.corps.find(b => b.img).img.src : '/assets/images/MB-01-opt.webp'),
    }];
    const autres = BLOG.articles.filter(x => x.id !== a.id).slice(0, 3);
    const corps = `
        <article data-article="${a.id}" class="ccw-article pt-12 md:pt-20 pb-6 max-w-3xl">
            <p class="${LABEL}"><a href="${SITE.pages.blog[langue]}" class="hover:text-white">Blog</a></p>
            <h1 class="text-3xl md:text-5xl font-display font-bold text-white tracking-tight leading-[1.05] mb-6">${esc(jetons(d.titre, ou))}</h1>
            <p class="text-gray-400 text-sm mb-10">${t.par} ${BLOG.auteur[langue]} · ${t.publie} <time datetime="${a.publie}">${dateLongue(a.publie, langue)}</time> · ${t.maj} <time datetime="${a.maj}">${dateLongue(a.maj, langue)}</time></p>
${blocs(d.corps, langue, ou)}
        </article>
        ${autres.length ? `<section class="py-12 md:py-16 border-t border-white/5">
            <p class="${LABEL}">${t.aLire}</p>
            <div class="grid gap-5 md:grid-cols-3">
${autres.map(x => `                <a href="${urlArticle(x, langue)}" class="premium-card rounded-2xl p-6 flex flex-col group"><span class="text-white font-display font-bold leading-snug mb-3 group-hover:text-gold-400 transition-colors">${esc(jetons(x[langue].titre, ou))}</span><span class="text-gray-400 text-sm font-light grow">${esc(jetons(x[langue].description, ou))}</span><span class="text-gold-400 text-xs font-display font-bold tracking-widest uppercase mt-4">${t.lire} &rarr;</span></a>`).join('\n')}
            </div>
        </section>` : ''}
        ${scriptCta(a.id)}`;
    return { url, html: enveloppe({ langue, fichier, corps, cta: false, headOpts: {
        titre: d.titreSeo ? jetons(d.titreSeo, ou) : `${jetons(d.titre, ou)} | ${SITE.marque}`, description: jetons(d.description, ou), jsonld, ogType: 'article',
        urls: { fr: urlArticle(a, 'fr'), en: urlArticle(a, 'en'), libelle: { fr: jetons(a.fr.titre, ou), en: jetons(a.en.titre, ou) } },
        fil: [{ name: SITE.pages.blog.libelle[langue], url: SITE.pages.blog[langue] }],
    } }) };
}

function pageIndex(langue) {
    const t = TB[langue];
    const fichier = SITE.pages.blog[langue].replace(/^\//, '') + 'index.html';
    const arts = [...BLOG.articles].sort((x, y) => y.publie.localeCompare(x.publie));
    const corps = `
        <section class="pt-12 pb-10 md:pt-20 md:pb-14">
            <h1 class="text-xs md:text-sm font-display font-bold text-gold-400 uppercase tracking-[0.25em] mb-5">${t.h1}</h1>
            <p class="text-4xl md:text-6xl font-display font-bold text-white uppercase tracking-tight leading-[0.95] mb-6">${t.accroche}</p>
            <p class="text-gray-300 font-light leading-relaxed max-w-2xl text-base md:text-lg">${t.intro}</p>
        </section>
        <section class="pb-12 md:pb-20">
            <div class="grid gap-6 md:grid-cols-2">
${arts.map(a => { const ou = `${a.id}/${langue}`; const im = (a[langue].corps.find(b => b.img) || {}).img; return `                <a href="${urlArticle(a, langue)}" class="premium-card rounded-2xl p-7 md:p-8 flex flex-col group">
${im ? `                    <img class="ccw-blog__vignette" src="${im.src}" alt="" width="${im.largeur}" height="${im.hauteur}" loading="lazy" decoding="async">
` : ''}                    <p class="text-gray-400 text-xs mb-3"><time datetime="${a.publie}">${dateLongue(a.publie, langue)}</time></p>
                    <h2 class="text-white font-display font-bold text-xl leading-snug mb-3 group-hover:text-gold-400 transition-colors">${esc(jetons(a[langue].titre, ou))}</h2>
                    <p class="text-gray-400 text-sm font-light leading-relaxed grow">${esc(jetons(a[langue].description, ou))}</p>
                    <span class="text-gold-400 text-xs font-display font-bold tracking-widest uppercase mt-5">${t.lire} &rarr;</span>
                </a>`; }).join('\n')}
            </div>
        </section>`;
    return enveloppe({ langue, fichier, corps, headOpts: { cle: 'blog', titre: t.titre, description: t.description } });
}

if (!SITE.pages.blog.existe) throw new Error('site.json : la page "blog" est generee par generate-blog.js mais marquee existe=false.');
// Validation complete AVANT toute ecriture : un article sans sa version EN
// (ou FR) fait echouer le build avec un message clair.
BLOG.articles.forEach(a => ['fr', 'en'].forEach(l => {
    if (!a[l] || !a.slug || !a.slug[l] || !a[l].titre || !a[l].corps) throw new Error(`blog.json : l'article "${a.id}" n'a pas sa version ${l} complete (traduction manquante).`);
}));
const ids = new Set();
BLOG.articles.forEach(a => {
    if (ids.has(a.id)) throw new Error(`blog.json : id en double "${a.id}".`);
    ids.add(a.id);
    ['fr', 'en'].forEach(l => {
        if (!a[l] || !a.slug[l]) throw new Error(`blog.json : l'article "${a.id}" n'a pas sa version ${l} (traduction manquante).`);
        const { url, html } = pageArticle(a, l);
        const rel = url.replace(/^\//, '');
        fs.mkdirSync(path.dirname(path.join(__dirname, rel)), { recursive: true });
        fs.writeFileSync(path.join(__dirname, rel), html);
        console.log(`✅ ${rel}`);
    });
});
['fr', 'en'].forEach(l => {
    const rel = SITE.pages.blog[l].replace(/^\//, '') + 'index.html';
    fs.mkdirSync(path.dirname(path.join(__dirname, rel)), { recursive: true });
    fs.writeFileSync(path.join(__dirname, rel), pageIndex(l));
    console.log(`✅ ${rel}`);
});
