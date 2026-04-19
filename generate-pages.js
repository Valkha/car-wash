const fs = require('fs');
const path = require('path');

// 1. Charger la base de données JSON
const locationsPath = path.join(__dirname, 'locations.json');
if (!fs.existsSync(locationsPath)) {
    console.error("Erreur : Le fichier locations.json est introuvable à la racine.");
    process.exit(1);
}
const locations = JSON.parse(fs.readFileSync(locationsPath, 'utf8'));

// 2. Le Template HTML Sémantique (Optimisé SEO & Tailwind prêt)
const generateHTML = (loc) => `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${loc.recommendedService} à ${loc.cityName} | Clean Cars Wash</title>
    <meta name="description" content="${loc.seoIntroSnippet}">
    <link rel="canonical" href="https://www.clean-cars-wash.ch/services/${loc.cityId}/">
    <link rel="stylesheet" href="../../assets/css/tailwind.min.css">
    <link rel="stylesheet" href="../../assets/css/style.css">
</head>
<body class="bg-gray-50 text-gray-900">
    <header class="bg-black text-white p-6">
        <div class="container mx-auto">
            <nav>
                <a href="../../" class="text-xl font-bold">Clean Cars Wash</a>
            </nav>
        </div>
    </header>

    <main class="container mx-auto px-4 py-12">
        <article>
            <header class="mb-10">
                <h1 class="text-4xl font-extrabold mb-4">Expert en ${loc.recommendedService} à ${loc.cityName}</h1>
                <p class="text-xl text-gray-600">${loc.seoIntroSnippet}</p>
            </header>

            <section class="grid md:grid-cols-2 gap-8 mb-12">
                <div class="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
                    <h2 class="text-2xl font-bold mb-4">L'exigence du marché local</h2>
                    <p class="mb-4">Notre clientèle composée de ${loc.clienteleType.toLowerCase()} exige une discrétion et une qualité sans faille. Intervenant sur le canton de ${loc.region}, notamment ${loc.localLandmark}, nous adaptons nos process à votre environnement.</p>
                </div>
                <div class="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
                    <h2 class="text-2xl font-bold mb-4">Protection ciblée</h2>
                    <p>Le contexte environnemental de ${loc.cityName} (${loc.typology.toLowerCase()}) implique des risques spécifiques : ${loc.environmentalPainPoint.toLowerCase()}. Notre ${loc.recommendedService.toLowerCase()} agit comme un bouclier définitif contre ces agressions.</p>
                </div>
            </section>
            
            <div class="text-center">
                <a href="../../#reservation" class="inline-block bg-black text-white font-bold py-4 px-8 rounded hover:bg-gray-800 transition">Réserver une intervention à ${loc.cityName}</a>
            </div>
        </article>
    </main>

    <footer class="bg-black text-white py-12 border-t border-white/10 mt-16">
        <div class="container mx-auto px-4 flex flex-col md:flex-row justify-between items-start gap-8">
            <div>
                <p class="font-bold text-lg tracking-widest uppercase mb-3">Clean Cars Wash</p>
                <p class="text-gray-400 text-sm mb-1">AHMED-YAHIA LM</p>
                <p class="text-gray-400 text-sm mb-1">Rue des pâquis 49</p>
                <p class="text-gray-400 text-sm mb-4">1201 Genève</p>
                <a href="mailto:info@cleancarswash.ch" class="text-yellow-400 text-sm hover:text-white transition">info@cleancarswash.ch</a>
            </div>
            <div>
                <p class="font-bold text-xs tracking-widest uppercase mb-3 text-white">Contact &amp; Horaires</p>
                <a href="tel:+41782657071" class="block text-yellow-400 font-bold text-sm hover:text-white transition mb-3">+41 78 265 70 71</a>
                <ul class="text-gray-400 text-sm space-y-1">
                    <li>Lun–Ven : 09h00 – 18h00</li>
                    <li>Samedi : Sur demande</li>
                    <li>Dimanche : Fermé</li>
                </ul>
            </div>
            <div>
                <p class="font-bold text-xs tracking-widest uppercase mb-3 text-white">Informations</p>
                <ul class="text-gray-400 text-sm space-y-2">
                    <li><a href="../../mentions-legales.html" class="hover:text-yellow-400 transition">Mentions Légales</a></li>
                    <li><a href="../../politique-confidentialite.html" class="hover:text-yellow-400 transition">Politique de Confidentialité</a></li>
                </ul>
            </div>
        </div>
        <div class="container mx-auto px-4 mt-8 text-center text-xs text-gray-600 tracking-widest uppercase">
            &copy; 2026 Clean Cars Wash — <a href="../../" class="hover:text-yellow-400 transition">Retour à l'accueil</a>
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
    
    let urls = locations.map(loc => `
    <url>
        <loc>https://www.clean-cars-wash.ch/services/${loc.cityId}/</loc>
        <lastmod>${date}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>`).join('');

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>https://www.clean-cars-wash.ch/</loc>
        <lastmod>${date}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>1.0</priority>
    </url>${urls}
</urlset>`;

    fs.writeFileSync(path.join(__dirname, 'sitemap.xml'), sitemap);
    console.log(`🗺️  Sitemap.xml mis à jour avec ${locations.length} URLs locales.`);
};

generateSitemap(locations);
console.log('🚀 Build SEO Programmique terminé avec succès.');