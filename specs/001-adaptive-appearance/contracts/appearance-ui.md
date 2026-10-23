# Contract — contexte, préférences et rendu

Ce contrat est local ; aucun nouvel endpoint ni permission serveur.

## Résolution pure

Entrées : thème validé, AmbiencePreferenceV1 normalisée, LocalCivilContext. Sortie : EffectiveAmbience. Aucune lecture implicite du stockage, aucune horloge globale, aucun accès réseau ou import de domaine fonctionnel. Mêmes entrées = même sortie.

L’ordre est : activation → saison manuelle/automatique → phase manuelle/automatique → événement manuel ou automatique autorisé. Un événement ne remplace ni thème ni saison. Un seul événement ; priorité anniversaire > Noël > Nouvel An. eventMode=none force event=null. enabled=false force les trois dimensions adaptatives à null.

## Stockage

read(profileId) renvoie une préférence normalisée sans hériter d’un autre profil. save(profileId, preference) renvoie un résultat distinguant applied et persisted. Les erreurs de quota/accès privé ne bloquent pas l’interface. Ne jamais appeler cette sauvegarde avec le profil précédent après un changement de currentId.

## Orchestration

Le module technique reçoit profileId, contexte civil autorisé et activités. L’adaptateur app/plugins/theme.client.ts fait le lien avec le profil, sans créer de dépendance technique vers un domaine. Une horloge active partagée, vérification à visibilitychange/focus et nettoyage à la destruction/HMR. La salutation suit l’heure actuelle même si le décor automatique attend une transition sûre.

## Attributs de rendu

- data-appearance : forest | notebook | library, existant.
- data-season : spring | summer | autumn | winter ; supprimer si null.
- data-day-phase : day | night ; supprimer si null.
- data-event : birthday | christmas | new-year ; supprimer si null.
- data-theme : propriété exclusive du mode clair/sombre existant, ne pas l’écraser.

Valeurs issues d’énumérations fermées, jamais une chaîne de stockage injectée telle quelle dans CSS. Ne pas mettre de key dépendante de ces attributs sur NuxtPage, lecteur ou enregistreur.

## Activités sensibles

acquire(kind) → jeton ; release(jeton) idempotent ; nettoyage au démontage. Garde toute session de lecture (même pause), enregistrement effectif et lecture de message/audio. Tant qu’un jeton est actif, seules les nouvelles valeurs desired sont calculées pour un changement automatique. À libération, appliquer le dernier état sûr, sans recharger l’app. La modification explicite depuis Apparence ne doit pas faire démarrer un média et la prévisualisation doit respecter les mêmes limites.

## Écran Apparence

Thème de base, activation des variations, saison/calendrier, phase, luminosité existante, événements choisis et aperçu. Nom accessible, état sélectionné, clavier, cible >=44px. Prévisualiser ne sauvegarde pas ; appliquer indique session seule si persistence impossible. Le bouton « Réinitialiser les variations » conserve le thème de base et met les adaptations à disabled, événements vides ; le bouton de thème Forêt douce reste distinct pour revenir au thème par défaut. La réinitialisation ne modifie pas les réglages audio, langue ou données métier.

## Splash et repli

Avant identification : dernier thème de base seulement. Après restauration : contexte autorisé, sans nouvel appel personnel. En cas d’échec d’asset : fond lisible ; aucune prolongation du contrôle de mise à jour. Le bouton d’aperçu ne relance ni authentification ni mise à jour et respecte le mouvement réduit.
