# Quickstart — validation de la future implémentation

Ce guide décrit les vérifications à exécuter après développement. Les fichiers de tests et nouveaux composants cités dans tasks.md ne sont pas encore réalisés. Ne pas présenter ces scénarios comme déjà passés.

## Préparer

1. Récupérer dev, lire CLAUDE.md, spec.md, plan.md et tasks.md ; ouvrir les planches dans docs/maquettes/planches/galerie.html.
2. Initialiser le pointeur local .specify/feature.json vers specs/001-adaptive-appearance si nécessaire ; vérifier `bash .specify/scripts/bash/check-prerequisites.sh --json --require-spec --require-tasks --include-tasks`.
3. Utiliser Node >=22, pnpm du package.json et une base PostgreSQL locale isolée. La démo doit utiliser une base nommée maki_demo et DEMO_MODE=true ; suivre les consignes seed:demo du README, jamais la base réelle.
4. Démarrer le serveur local du projet avec ces variables de démo et ouvrir /profiles. Choisir successivement deux adultes et deux enfants fictifs. Les sons factices du seeder ne sont pas de vrais livres enregistrés.

## Contrôles automatiques autorisés

```sh
pnpm lint
pnpm typecheck
pnpm i18n:check
pnpm audit:design
pnpm test:unit
pnpm check:docs
pnpm build
```

Pour la vérification complète, fournir MIGRATION_ADMIN_URL vers un PostgreSQL de test puis lancer pnpm verify. Aucun E2E local. La suite distante et Driver.js restent un chantier séparé (#197).

## Logique / stockage

Les tests unitaires doivent injecter le contexte civil, sans attendre de vraie date : limites de saisons nord/sud, 04:59/05:00/17:59/18:00, dates 24/25/26 décembre et 30/31 décembre/1er/2 janvier, anniversaire et 29 février. Vérifier événement désactivé, priorité, mode manuel, changements de fuseau, paramètres invalides et version future. Stockage simulé bloqué : message session seule, pas de fausse confirmation. Trois profils : aucun héritage de préférence adaptative.

## Revue visuelle manuelle

Pour les deux rôles : accueil, bibliothèque avec livres, coffre, message, lecture, Apparence et splash. Utiliser 320×640, 390×844, 844×390, 768×1024, 1024×768, 1440×900 et 3840×2160 ; texte normal puis 200 %, français, titre long et au moins un parcours RTL.

1. Vérifier les 24 bases (3 thèmes × 4 saisons × 2 phases) et les événements sur chacune ; si le rendu est identique entre plusieurs tailles, documenter la matrice contrôlée plutôt que multiplier des captures sans justification.
2. Vérifier photos réelles de démo, Bonjour/Bonsoir selon l’heure, mêmes commandes et aucun contenu caché sous la navigation après défilement.
3. Répéter clair/sombre manuel et auto ; seuils de contraste et cibles tactiles, focus et lecteur d’écran sur les réglages.
4. Capturer l’écran réel en indiquant thème, saison, phase, événement, rôle, taille et date. Les PNG de maquettes ne sont pas une preuve de rendu.
5. Si un outil de contrôle navigateur échoue, consigner exactement ce qui n’a pas été vérifié ; ne pas lancer de suite E2E de contournement.

## Continuité média et hors ligne

Démarrer une lecture, la mettre en pause, puis reprendre ; enregistrer une voix fictive et écouter un message. Faire franchir une limite d’ambiance avec contexte injecté dans les tests de logique ; en manuel vérifier le report au retour sur une page sûre. Aucun son automatique, perte de progression, micro redémarré ou reconnexion. Répéter hors connexion après téléchargement et avec réduction des mouvements/pause des feuilles. Sur smartphone réel installé/PWA et appareil sans Google, consigner les résultats séparément des vérifications navigateur.

## Relecture / publication

La checklist de développement doit rester non cochée tant que son résultat n’existe pas. Lancer /speckit-converge, consigner les écarts, puis une éventuelle unique MR dev→main seulement lorsqu’une publication est autorisée. Pas de déploiement dans le lot documentaire actuel.
