const fs = require('fs');
const path = require('path');
const shell = require('./site-shell.js');

// 1. Charger la base de données JSON
const locationsPath = path.join(__dirname, 'locations.json');
if (!fs.existsSync(locationsPath)) {
    console.error("Erreur : Le fichier locations.json est introuvable à la racine.");
    process.exit(1);
}
const locations = JSON.parse(fs.readFileSync(locationsPath, 'utf8'));

// ==========================================================================
// 2. Le Template HTML
// --------------------------------------------------------------------------
// ATTENTION : `npm run build` exécute `npm run generate`, donc CE FICHIER est
// la seule source de vérité des 38 pages villes. Toute modification faite
// directement dans services/{ville}/index.html est écrasée au déploiement
// suivant. Modifier ici, jamais là-bas.
// ==========================================================================
// Villes de la même région, hors la page courante : sert à créer un maillage
// entre les pages villes, qui autrement ne se lient jamais entre elles.
const villesVoisines = (loc, max = 6) => locations
    .filter(v => v.region === loc.region && v.cityId !== loc.cityId)
    .sort((a, b) => a.cityName.localeCompare(b.cityName, 'fr'))
    .slice(0, max);

const generateHTML = (loc) => `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <!-- Google Tag Manager + Google Analytics -->
    <!-- Chargés après le premier rendu (audit perf du 14.09.2026) : les deux scripts
         pèsent ~290 Ko et passaient avant l'image du hero sur mobile. La file
         dataLayer est créée tout de suite : aucun évènement n'est perdu. -->
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
          /* Audit P16 (15.09.2026) : GA4 etait aussi charge en direct ici,
             alors que le conteneur GTM le charge deja lui-meme -- 167 Kio et
             173 ms de fil principal en double. */
          ['https://www.googletagmanager.com/gtm.js?id=GTM-5W69QPT3'].forEach(function (src) {
            var s = document.createElement('script');
            s.async = true;
            s.src = src;
            document.head.appendChild(s);
          });
        }
        ['pointerdown', 'keydown', 'touchstart', 'scroll'].forEach(function (type) {
          window.addEventListener(type, charger, { once: true, passive: true });
        });
        window.addEventListener('load', function () { setTimeout(charger, 3500); });
      })();
    </script>
    <!-- End Google Tag Manager + Google Analytics -->

    <title>${loc.recommendedService} à ${loc.cityName} | Clean Cars Wash</title>
    <meta name="description" content="${loc.seoIntroSnippet}">
    <link rel="canonical" href="https://www.clean-cars-wash.ch/services/${loc.cityId}/">

    <link rel="preload" href="/fonts/syne-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="preload" href="/fonts/bricolage-grotesque-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>

    <link rel="stylesheet" href="/assets/css/tailwind-src.css">
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": ["LocalBusiness", "AutoWash"],
          "name": "Clean Cars Wash ${loc.cityName}",
          "@id": "https://www.clean-cars-wash.ch/services/${loc.cityId}/",
          "url": "https://www.clean-cars-wash.ch/services/${loc.cityId}/",
          "telephone": "+41782657071",
          "priceRange": "CHF 96–312",
          "image": "https://www.clean-cars-wash.ch/assets/images/MB-01-opt.webp",
          "address": {
            "@type": "PostalAddress",
            "addressLocality": "${loc.cityName}",
            "addressRegion": "${loc.region}",
            "addressCountry": "CH"
          },
          "areaServed": {
            "@type": "City",
            "name": "${loc.cityName}"
          },
          "hasOfferCatalog": {
            "@type": "OfferCatalog",
            "name": "Packs Detailing",
            "itemListElement": [
              { "@type": "Offer", "name": "Pack Argent", "price": "98.60", "priceCurrency": "CHF" },
              { "@type": "Offer", "name": "Pack Or", "price": "165.10", "priceCurrency": "CHF" },
              { "@type": "Offer", "name": "Pack Diamant", "price": "320.20", "priceCurrency": "CHF" }
            ]
          }
        },
        {
          "@type": "Service",
          "name": "${loc.recommendedService} à ${loc.cityName}",
          "provider": {
            "@type": "LocalBusiness",
            "name": "Clean Cars Wash"
          },
          "areaServed": {
            "@type": "City",
            "name": "${loc.cityName}"
          },
          "description": "${loc.seoIntroSnippet}",
          "url": "https://www.clean-cars-wash.ch/services/${loc.cityId}/"
        }
      ]
    }
    </script>
</head>
<body class="text-gray-300 antialiased">
    <!-- Google Tag Manager (noscript) -->
    <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-5W69QPT3"
    height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
    <!-- End Google Tag Manager (noscript) -->

    ${shell.repereHeader(`services/${loc.cityId}/index.html`, 'fr')}

    <main class="max-w-5xl mx-auto px-4 md:px-6">
        <article>
            <header class="pt-16 pb-12 md:pt-24 md:pb-16">
                <p class="section-index mb-4"><em>${loc.region}</em>${loc.typology}</p>
                <h1 class="text-4xl md:text-6xl font-display font-bold text-white uppercase tracking-tight leading-[0.95] mb-6">${loc.recommendedService}<br><span class="text-gold-400">à ${loc.cityName}</span></h1>
                <div class="section-rule mb-6"></div>
                <p class="text-base md:text-lg font-light text-gray-400 max-w-2xl leading-relaxed">${loc.seoIntroSnippet}</p>
            </header>

            <section class="grid md:grid-cols-2 gap-6 md:gap-8 pb-12">
                <div class="premium-card p-8 md:p-10 rounded-2xl">
                    <h2 class="text-xl md:text-2xl font-display font-bold text-white uppercase tracking-wide mb-4">L'exigence du marché local</h2>
                    <p class="text-gray-400 font-light leading-relaxed">Notre clientèle composée de ${loc.clienteleType.toLowerCase()} exige une discrétion et une qualité sans faille. Intervenant sur le canton de ${loc.region}, notamment ${loc.localLandmark}, nous adaptons nos process à votre environnement.</p>
                </div>
                <div class="premium-card p-8 md:p-10 rounded-2xl">
                    <h2 class="text-xl md:text-2xl font-display font-bold text-white uppercase tracking-wide mb-4">Protection ciblée</h2>
                    <p class="text-gray-400 font-light leading-relaxed">Le contexte environnemental de ${loc.cityName} (${loc.typology.toLowerCase()}) implique des risques spécifiques : ${loc.environmentalPainPoint.toLowerCase()}. Notre ${loc.recommendedService.toLowerCase()} agit comme un bouclier définitif contre ces agressions.</p>
                </div>
            </section>

            <section class="conditions-intervention text-center mb-16 md:mb-24">
                <p class="conditions-eyebrow">Intervention à ${loc.cityName}</p>
                <p class="conditions-title">Déplacement offert à Genève &mdash; <a href="/zones.html" style="color:#D4AF37;text-decoration:underline;">forfait selon le district sur Vaud</a></p>
                <p class="text-gray-400 font-light text-sm leading-relaxed mb-8 max-w-xl mx-auto">Nous nous déplaçons chez vous ou sur votre lieu de travail, sans frais supplémentaires. Choisissez votre créneau en ligne et réglez un acompte de 30&nbsp;%&nbsp;; le solde se règle sur place.</p>
                <a href="/reserver.html" class="inline-block bg-gold-400 text-charcoal-900 font-display font-bold tracking-widest uppercase py-4 px-10 rounded-full hover:bg-gold-500 transition-all shadow-[0_0_20px_rgba(212,175,55,0.2)]" data-track="conversion-booking">Réserver à ${loc.cityName}</a>
            </section>

            <nav class="pb-16 md:pb-24" aria-label="Autres villes desservies">
                <p class="text-[10px] font-display font-bold tracking-[0.3em] uppercase text-gold-400 mb-4">Nous intervenons aussi sur le canton de ${loc.region}</p>
                <ul class="flex flex-wrap gap-x-4 gap-y-2 text-xs md:text-sm text-gray-400 font-light">
                    ${villesVoisines(loc).map(v => `<li><a href="/services/${v.cityId}/" class="hover:text-gold-400 transition">${v.cityName}</a></li>`).join('\n                    ')}
                    <li><a href="/tarifs.html" class="text-gold-400 hover:text-white transition">Toutes nos prestations →</a></li>
                </ul>
            </nav>
        </article>
    </main>

    <section class="max-w-5xl mx-auto px-4 md:px-6 pb-16">
        <p class="font-display font-bold text-[10px] tracking-[0.3em] uppercase text-gold-400 mb-4">Nos prestations spécialisées</p>
        <ul class="flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-400 font-light">
            <li><a href="/ciel-etoile.html" class="hover:text-gold-400 transition">Ciel étoilé</a></li>
            <li><a href="/ppf.html" class="hover:text-gold-400 transition">PPF &mdash; film de protection</a></li>
            <li><a href="/covering.html" class="hover:text-gold-400 transition">Covering</a></li>
            <li><a href="/polish-ceramique.html" class="hover:text-gold-400 transition">Pack Polish Céramique</a></li>
            <li><a href="/nettoyage-chassis.html" class="hover:text-gold-400 transition">Nettoyage châssis &amp; moteur</a></li>
        </ul>
    </section>

    ${shell.repereFooter(`services/${loc.cityId}/index.html`, 'fr')}
    ${shell.repereFinDePage('fr')}
</body>
</html>`;

// 3. Génération des fichiers physiques
locations.forEach(loc => {
    const dir = path.join(__dirname, 'services', loc.cityId);

    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
    }

    // Écrire le fichier index.html
    const filePath = path.join(dir, 'index.html');
    fs.writeFileSync(filePath, generateHTML(loc));
    console.log(`✅ Page générée : /services/${loc.cityId}/index.html`);
});

// 4. Mise à jour automatique du Sitemap XML
const generateSitemap = (locations) => {
    const date = new Date().toISOString().split('T')[0];

    // Pages statiques : relues dans site.json (pages existantes, FR + EN) et
    // prestations.json, depuis le 23.10.2026. Une page ajoutee a site.json
    // entre dans le sitemap sans toucher a ce fichier ; generate-pages.js reste
    // le SEUL ecrivain de public/sitemap.xml.
    const PRIORITE = {
        accueil: ['weekly', '1.0'], offres: ['weekly', '0.9'], zones: ['monthly', '0.8'],
        abonnements: ['monthly', '0.7'], 'jeu-concours': ['weekly', '0.6'],
        mentions: ['yearly', '0.3'], confidentialite: ['yearly', '0.3'],
    };
    const staticPages = [];
    Object.entries(shell.SITE.pages).forEach(([cle, pg]) => {
        if (!pg.existe || !pg.fr) return;
        const [changefreq, priority] = PRIORITE[cle] || ['monthly', '0.8'];
        ['fr', 'en'].forEach(l => staticPages.push({ url: shell.SITE.base + pg[l], changefreq, priority }));
    });
    // Prestations specialisees — pages generees par generate-prestations.js
    JSON.parse(fs.readFileSync(path.join(__dirname, 'prestations.json'), 'utf8')).forEach(pr => {
        staticPages.push({ url: `${shell.SITE.base}/${pr.id}.html`, changefreq: 'monthly', priority: '0.8' });
        staticPages.push({ url: `${shell.SITE.base}/en/${pr.slugEn}.html`, changefreq: 'monthly', priority: '0.8' });
    });

    // Articles du blog (blog.json) : lastmod = date de mise a jour reelle.
    const blogJson = path.join(__dirname, 'blog.json');
    if (fs.existsSync(blogJson) && shell.SITE.pages.blog.existe) {
        JSON.parse(fs.readFileSync(blogJson, 'utf8')).articles.forEach(a => ['fr', 'en'].forEach(l =>
            staticPages.push({ url: `${shell.SITE.base}${shell.SITE.pages.blog[l]}${a.slug[l]}.html`, changefreq: 'monthly', priority: '0.7', lastmod: a.maj })));
    }

    const staticUrls = staticPages.map(p => `
    <url>
        <loc>${p.url}</loc>
        <lastmod>${p.lastmod || date}</lastmod>
        <changefreq>${p.changefreq}</changefreq>
        <priority>${p.priority}</priority>
    </url>`).join('');

    let urls = locations.map(loc => `
    <url>
        <loc>https://www.clean-cars-wash.ch/services/${loc.cityId}/</loc>
        <lastmod>${date}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>`).join('');

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${staticUrls}${urls}
</urlset>`;

    // Le sitemap DOIT être écrit dans public/ : Vite ne copie que ce dossier
    // vers dist/. Écrit à la racine du dépôt, il n'était jamais déployé et
    // répondait 404 en production.
    fs.writeFileSync(path.join(__dirname, 'public', 'sitemap.xml'), sitemap);
    console.log(`🗺️  public/sitemap.xml mis à jour : ${staticPages.length} pages statiques + ${locations.length} pages locales.`);
};

generateSitemap(locations);

console.log('🚀 Build SEO Programmique terminé avec succès.');
