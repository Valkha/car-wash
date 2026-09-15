/*
 * PIERRE TOMBALE — service worker de désinscription.
 * Mise en place le 15.09.2026 (audit). À SUPPRIMER après le 15.12.2026.
 *
 * Pourquoi ce fichier existe encore alors que le service worker est retiré :
 * retirer l'appel à `register()` n'enlève PAS un service worker déjà actif dans
 * le navigateur d'un visiteur. Celui-ci continuerait de contrôler ses pages et
 * de servir un cache périmé, indéfiniment.
 *
 * L'ancien service worker n'a en principe jamais pu s'installer — 6 des 9 entrées
 * de son PRECACHE renvoyaient 404 (Vite hache les noms au build), donc
 * `cache.addAll` rejetait. Mais une version antérieure a pu réussir chez des
 * visiteurs réguliers, et un cache fantôme sur un site commercial coûte plus cher
 * que trente lignes inertes.
 *
 * Mécanique : un navigateur encore contrôlé va chercher les mises à jour de
 * /sw.js à chaque navigation. Il reçoit ce fichier, qui prend la main, vide tous
 * les caches et se désinscrit. Le visiteur est nettoyé sans rien remarquer.
 *
 * Aucun gestionnaire `fetch` ici, volontairement : ce worker n'intercepte donc
 * aucune requête, même pendant le court instant où il contrôle encore la page.
 *
 * Passé trois mois, tout navigateur actif sera repassé : supprimer ce fichier et
 * la note correspondante dans public/js/app.js.
 */
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (e) => {
  e.waitUntil(
    (async () => {
      try {
        const cles = await caches.keys();
        await Promise.all(cles.map((c) => caches.delete(c)));
      } catch (_) {
        /* stockage indisponible : on se désinscrit quand même */
      }
      await self.registration.unregister();
    })()
  );
});
