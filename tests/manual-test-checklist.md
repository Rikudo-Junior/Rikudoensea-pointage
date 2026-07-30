# Checklist de test manuel — avant mise en production

À dérouler en local (`npm run dev`) avec `TEST_MODE=true` et `NEXT_PUBLIC_TEST_MODE=true`
dans `.env.local`, en pointant `GOOGLE_SHEET_ID_TEST` vers une feuille Google Sheets
**dédiée aux tests** (jamais la feuille de production).

En `TEST_MODE`, la page `/pointage` affiche un panneau "Mode test" permettant de choisir
"Sur site" / "Hors site" / "Refuser géoloc", ainsi qu'un champ pour simuler la date/heure
("maintenant"), sans attendre plusieurs jours réels ni se déplacer physiquement.

## Inscription et vérification

- [ ] Inscription avec un email du domaine autorisé → code reçu par email, code correct
      accepté → utilisateur créé dans l'onglet `Utilisateurs`.
- [ ] Inscription avec un email d'un autre domaine → rejetée avant l'envoi du code.
- [ ] Code de vérification incorrect → message d'erreur, tentative décomptée.
- [ ] 5 codes incorrects d'affilée → blocage, message invitant à recommencer l'inscription.
- [ ] Après vérification réussie, rechargement de la page → toujours reconnu (cookie de
      session), pas de nouvelle demande de code.
- [ ] Navigation privée / cookies effacés → traité comme une nouvelle session, le
      formulaire d'inscription réapparaît.

## Pointage — arrivée

- [ ] Choix "Sur site", heure simulée avant 8h00 → arrivée enregistrée, aucun flag.
- [ ] Choix "Sur site", heure simulée après 8h00 → flag `retard`.
- [ ] Choix "Hors site" → flag `hors_zone`.
- [ ] Choix "Refuser géoloc" → flag `sans_geoloc`.
- [ ] Heure simulée en dehors de la plage matinale (ex. 13h00) → flag `hors_plage`.

## Pointage — départ

- [ ] Un deuxième scan le même jour (après une arrivée) → correctement détecté comme
      "départ", et non comme une nouvelle arrivée.
- [ ] Départ simulé à 17h30 ou après, durée ≥ 2h30 → aucun flag de départ.
- [ ] Départ simulé avant 17h30 → flag `depart_anticipe`.
- [ ] Départ moins de 2h30 après l'arrivée → flag `duree_suspecte`.
- [ ] Départ en dehors de la plage 13h00–22h00 → flag `hors_plage`.
- [ ] Un troisième scan le même jour (arrivée + départ déjà enregistrés) → rejeté avec le
      message invitant à contacter le responsable ; aucune ligne modifiée.

## Multi-jours

- [ ] En simulant une date différente ("maintenant" du panneau de test), une nouvelle
      arrivée le jour J+1 crée bien une nouvelle ligne dans `Pointages`, sans toucher à
      celle de la veille.

## Tableau de bord responsable

- [ ] Accès à `/dashboard` sans cookie → redirection vers `/dashboard/login`.
- [ ] Mauvais mot de passe → refusé.
- [ ] Bon mot de passe → accès accordé, KPI et tableau affichés.
- [ ] Recherche (nom/email/date) et filtre "à vérifier uniquement" fonctionnent.
- [ ] Export CSV → fichier ouvrable dans Excel, accents (prénoms/noms) corrects.
- [ ] Déconnexion → renvoie vers `/dashboard/login`, `/dashboard` de nouveau protégé.

## Dernière étape avant mise en service

- [ ] `TEST_MODE=false` en production (Vercel), coordonnées `SCHOOL_LAT`/`SCHOOL_LON`
      exactes renseignées.
- [ ] Passage réel sur site : scanner le QR imprimé avec un téléphone personnel, accepter
      la demande de géolocalisation réelle du navigateur, vérifier qu'un pointage sans
      flag est bien enregistré depuis l'intérieur de l'école, et qu'un test volontaire à
      quelques centaines de mètres produit bien le flag `hors_zone`.
