// Service worker minimal, uniquement pour satisfaire les critères d'installation
// ("Ajouter à l'écran d'accueil") des navigateurs mobiles.
//
// Volontairement sans cache : toutes les pages sont personnalisées (session, pointages
// du jour) et le pointage lui-même nécessite un aller-retour réseau (géolocalisation,
// horodatage serveur) — servir du contenu hors-ligne ou périmé serait faux, pas juste
// indisponible. Le fetch handler ne fait donc rien (laisse passer au réseau) ; sa seule
// utilité est d'exister pour les heuristiques d'installabilité.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // Pass-through intentionnel — voir commentaire en tête de fichier.
});
