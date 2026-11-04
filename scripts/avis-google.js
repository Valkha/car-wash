/*
 * Avis Google : met a jour avis.json (note, nombre d'avis, 3 avis recents)
 * depuis l'API Google Places (New). Lance avant `npm run generate`.
 *
 * Variables d'environnement (GitHub : Settings > Secrets and variables > Actions) :
 *   GOOGLE_PLACES_API_KEY  cle API Google Cloud, API « Places API (New) » activee
 *   GOOGLE_PLACE_ID        identifiant de la fiche (facultatif : retrouve par recherche sinon)
 *
 * Sans cle, ou si Google ne repond pas, avis.json reste tel quel : le build
 * ne casse jamais a cause des avis.
 */
const fs = require('fs');
const path = require('path');

const FICHIER = path.join(__dirname, '..', 'avis.json');
const CLE = process.env.GOOGLE_PLACES_API_KEY;
const RECHERCHE = 'Clean Cars Wash, Chemin des Vergers, 1208 Genève';

async function api(url, options) {
    const r = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': CLE, ...(options.headers || {}) } });
    if (!r.ok) throw new Error(`Google Places ${r.status} : ${(await r.text()).slice(0, 200)}`);
    return r.json();
}

async function trouverPlace() {
    if (process.env.GOOGLE_PLACE_ID) return process.env.GOOGLE_PLACE_ID;
    const d = await api('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST', headers: { 'X-Goog-FieldMask': 'places.id,places.displayName' },
        body: JSON.stringify({ textQuery: RECHERCHE, languageCode: 'fr' }),
    });
    const p = (d.places || [])[0];
    if (!p) throw new Error('fiche introuvable par recherche');
    console.log(`ℹ️  avis-google : fiche trouvee « ${p.displayName && p.displayName.text} » (${p.id}). Ajoutez GOOGLE_PLACE_ID=${p.id} pour eviter la recherche.`);
    return p.id;
}

// Initiale du nom de famille seulement, comme sur le site jusqu'ici.
const nomCourt = n => { const m = String(n || '').trim().split(/\s+/); return m.length > 1 ? `${m[0]} ${m[m.length - 1][0].toUpperCase()}.` : m[0]; };
const couper = (t, max = 260) => t.length <= max ? t : t.slice(0, t.lastIndexOf(' ', max)).replace(/[,;:]$/, '') + ' […]';

async function main() {
    const avant = JSON.parse(fs.readFileSync(FICHIER, 'utf8'));
    if (!CLE) { console.log('ℹ️  avis-google : pas de GOOGLE_PLACES_API_KEY, avis.json inchange.'); return; }
    try {
        const id = await trouverPlace();
        const d = await api(`https://places.googleapis.com/v1/places/${encodeURIComponent(id)}?languageCode=fr`, {
            method: 'GET', headers: { 'X-Goog-FieldMask': 'rating,userRatingCount,reviews,googleMapsUri' },
        });
        if (typeof d.rating !== 'number' || typeof d.userRatingCount !== 'number') throw new Error('note absente de la reponse');
        const avis = (d.reviews || [])
            .map(r => ({ r, t: ((r.originalText && r.originalText.text) || (r.text && r.text.text) || '').trim() }))
            .filter(({ r, t }) => r.rating >= 5 && t.length >= 40)
            .sort((a, b) => String(b.r.publishTime).localeCompare(String(a.r.publishTime)))
            .slice(0, 3)
            .map(({ r, t }) => ({
                nom: nomCourt(r.authorAttribution && r.authorAttribution.displayName),
                note: r.rating, texte: couper(t),
                langue: (r.originalText && r.originalText.languageCode) || 'fr',
                lien: (r.authorAttribution && r.authorAttribution.uri) || undefined,
            }));
        const apres = {
            ...avant,
            majLe: new Date().toISOString().slice(0, 10),
            note: Math.round(d.rating * 10) / 10,
            nombre: d.userRatingCount,
            fiche: d.googleMapsUri || avant.fiche,
            avis: avis.length >= 3 ? avis : avant.avis,
        };
        fs.writeFileSync(FICHIER, JSON.stringify(apres, null, 2) + '\n');
        console.log(`✅ avis-google : ${apres.note} / 5, ${apres.nombre} avis, ${avis.length >= 3 ? 'avis recents' : 'avis precedents conserves'}.`);
    } catch (e) {
        console.warn(`⚠️  avis-google : ${e.message}. avis.json inchange.`);
    }
}

main();
