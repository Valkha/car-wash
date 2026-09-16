const fs = require('fs');
const path = require('path');

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
             173 ms de fil principal en double. Voir rapport §21. */
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

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Montserrat:wght@400;700&display=swap" onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Montserrat:wght@400;700&display=swap" rel="stylesheet"></noscript>

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
              { "@type": "Offer", "name": "Pack Argent", "price": "96.20", "priceCurrency": "CHF" },
              { "@type": "Offer", "name": "Pack Or", "price": "161.05", "priceCurrency": "CHF" },
              { "@type": "Offer", "name": "Pack Diamant", "price": "312.40", "priceCurrency": "CHF" }
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

    <header class="bg-charcoal-900/90 backdrop-blur-lg border-b border-white/5 sticky top-0 z-50">
        <div class="max-w-5xl mx-auto px-4 md:px-6 py-4 flex justify-between items-center gap-4">
            <a href="/" class="flex items-center gap-3 group" aria-label="Clean Cars Wash — Accueil">
                <img src="/assets/images/logo-v2-tiny.webp" alt="Logo Clean Cars Wash" width="120" height="34" loading="eager" class="h-9 md:h-11 w-auto object-contain transition-transform group-hover:scale-105">
                <span class="text-xs md:text-sm font-display font-bold text-white tracking-[0.2em] uppercase whitespace-nowrap group-hover:text-gold-400 transition-colors hidden sm:block">Clean Cars Wash</span>
            </a>
            <div class="flex items-center gap-3 md:gap-5">
                <a href="tel:+41782657071" class="hidden sm:flex items-center justify-center w-9 h-9 shrink-0 rounded-full border border-gold-400/40 text-gold-400 hover:bg-gold-400 hover:text-charcoal-900 transition-colors" title="Appeler +41 78 265 70 71">
                    <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                    <span class="sr-only">Appeler Clean Cars Wash au +41 78 265 70 71</span>
                </a>
                <a href="/#services" class="text-[10px] md:text-xs font-display font-bold tracking-widest uppercase text-gold-400 border border-gold-400 px-4 py-2 rounded-full hover:bg-gold-400 hover:text-charcoal-900 transition-colors whitespace-nowrap">Réserver</a>
            </div>
        </div>
    </header>

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
                <p class="conditions-title">Déplacement offert, prix TTC annoncé à l'avance</p>
                <p class="text-gray-400 font-light text-sm leading-relaxed mb-8 max-w-xl mx-auto">Nous nous déplaçons chez vous ou sur votre lieu de travail, sans frais supplémentaires. Choisissez votre créneau en ligne et réglez un acompte de 30&nbsp;%&nbsp;; le solde se règle sur place.</p>
                <a href="/#services" class="inline-block bg-gold-400 text-charcoal-900 font-display font-bold tracking-widest uppercase py-4 px-10 rounded-full hover:bg-gold-500 transition-all shadow-[0_0_20px_rgba(212,175,55,0.2)]" data-track="conversion-booking">Réserver à ${loc.cityName}</a>
            </section>

            <nav class="pb-16 md:pb-24" aria-label="Autres villes desservies">
                <p class="text-[10px] font-display font-bold tracking-[0.3em] uppercase text-gold-400 mb-4">Nous intervenons aussi sur le canton de ${loc.region}</p>
                <ul class="flex flex-wrap gap-x-4 gap-y-2 text-xs md:text-sm text-gray-400 font-light">
                    ${villesVoisines(loc).map(v => `<li><a href="/services/${v.cityId}/" class="hover:text-gold-400 transition">${v.cityName}</a></li>`).join('\n                    ')}
                    <li><a href="/#services" class="text-gold-400 hover:text-white transition">Toutes nos prestations →</a></li>
                </ul>
            </nav>
        </article>
    </main>

    <footer class="bg-charcoal-900 border-t border-white/10 py-12">
        <div class="max-w-5xl mx-auto px-4 md:px-6 flex flex-col md:flex-row justify-between items-start gap-8">
            <div>
                <p class="font-display font-bold text-sm tracking-[0.2em] uppercase text-white mb-3">Clean Cars Wash</p>
                <p class="text-gray-400 text-sm mb-1">AHMED-YAHIA LM</p>
                <p class="text-gray-400 text-sm mb-1">Chemin des Vergers</p>
                <p class="text-gray-400 text-sm mb-4">1208 Genève</p>
                <a href="mailto:info@clean-cars-wash.ch" class="text-gold-400 text-sm hover:text-white transition">info@clean-cars-wash.ch</a>
            </div>
            <div>
                <p class="font-display font-bold text-[10px] tracking-[0.3em] uppercase text-white mb-3">Contact &amp; Horaires</p>
                <a href="tel:+41782657071" class="block text-gold-400 font-display font-bold text-sm hover:text-white transition mb-3">+41 78 265 70 71</a>
                <ul class="text-gray-400 text-sm space-y-1">
                    <li>Lun–Sam : 07h30 – 22h00</li>
                    <li>Dimanche : Fermé</li>
                </ul>
            </div>
            <div>
                <p class="font-display font-bold text-[10px] tracking-[0.3em] uppercase text-white mb-3">Informations</p>
                <ul class="text-gray-400 text-sm space-y-2">
                    <li><a href="/" class="hover:text-gold-400 transition">Accueil</a></li>
                    <li><a href="/mentions-legales.html" class="hover:text-gold-400 transition">Mentions Légales &amp; CGV</a></li>
                    <li><a href="/politique-confidentialite.html" class="hover:text-gold-400 transition">Politique de Confidentialité</a></li>
                </ul>
            </div>
        </div>
        <div class="max-w-5xl mx-auto px-4 md:px-6 mt-10 pt-6 border-t border-white/5 text-center text-[10px] text-gray-400 tracking-[0.2em] uppercase">
            &copy; 2026 Clean Cars Wash &nbsp;|&nbsp; <span style="opacity:.7;">CHE-377.481.423 TVA</span>
        </div>
    </footer>
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

    const staticPages = [
        { url: 'https://www.clean-cars-wash.ch/',                              changefreq: 'weekly',  priority: '1.0' },
        { url: 'https://www.clean-cars-wash.ch/en/',                           changefreq: 'weekly',  priority: '1.0' },
        { url: 'https://www.clean-cars-wash.ch/mentions-legales.html',         changefreq: 'yearly',  priority: '0.3' },
        { url: 'https://www.clean-cars-wash.ch/politique-confidentialite.html',changefreq: 'yearly',  priority: '0.3' },
        { url: 'https://www.clean-cars-wash.ch/en/legal-notices.html',         changefreq: 'yearly',  priority: '0.3' },
        { url: 'https://www.clean-cars-wash.ch/en/privacy-policy.html',        changefreq: 'yearly',  priority: '0.3' },
        { url: 'https://www.clean-cars-wash.ch/abonnements.html',              changefreq: 'monthly', priority: '0.7' },
        { url: 'https://www.clean-cars-wash.ch/en/subscriptions.html',         changefreq: 'monthly', priority: '0.7' },
        { url: 'https://www.clean-cars-wash.ch/promo.html',                    changefreq: 'weekly',  priority: '0.9' },
        { url: 'https://www.clean-cars-wash.ch/en/promo.html',                 changefreq: 'weekly',  priority: '0.9' },
    ];

    const staticUrls = staticPages.map(p => `
    <url>
        <loc>${p.url}</loc>
        <lastmod>${date}</lastmod>
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
