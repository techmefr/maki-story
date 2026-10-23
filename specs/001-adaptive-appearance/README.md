# Reprise des ambiances adaptatives

Ce dossier est la spécification de la prochaine évolution. Il ne signifie pas que saisons, événements ou nouvelles variations jour/nuit sont déjà implémentés.

## Ouvrir et vérifier

1. Récupérer la branche `dev` du dépôt `techmefr/maki-story` et ouvrir sa racine dans Claude Code.
2. Lire `CLAUDE.md`, `.specify/memory/constitution.md`, `specs/001-adaptive-appearance/spec.md`, sa checklist et `docs/maquettes/planches/README.md`.
3. Relire les hypothèses de calendrier, d’horaire et d’événements avec le demandeur, puis exécuter `/speckit-clarify` si nécessaire.
4. Après revue de la spécification, lancer `/speckit-plan`, faire relire le plan, puis `/speckit-tasks` et `/speckit-analyze`.
5. Implémenter ensuite sur une branche de travail, puis utiliser `/speckit-converge` ; garder les tâches inachevées visibles et revenir sur `dev` avant une éventuelle unique MR vers `main`.

`.specify/feature.json` pointe vers ce dossier dans la copie locale de préparation. Ce fichier est volontairement ignoré par SpecKit et ne voyage pas avec Git. Dans un nouveau clone, demander à Claude Code de créer ce pointeur local avant de lancer le workflow :

```json
{"feature_directory": "specs/001-adaptive-appearance"}
```

Une autre possibilité est de lancer Claude depuis un terminal où `SPECIFY_FEATURE_DIRECTORY=specs/001-adaptive-appearance` est exporté. Les chemins de la spécification restent relatifs et portables. Les compétences officielles SpecKit 1.0.12 pour Claude sont versionnées dans `.claude/skills/`. Aucun outil de génération n’est nécessaire pour lire les PNG ou rédiger le plan. Les scripts sont destinés à un shell Linux/WSL ; pour initialiser ou maintenir l’outillage, la CLI officielle peut être utilisée avec `uvx --from specify-cli specify`.

## Contexte réel de l’application

- Nuxt SPA, couches `technical/` et `functional/`, PWA/Capacitor ; ne pas réorganiser le produit en plusieurs dépôts.
- Trois thèmes déjà codés : `technical/Theme/app/composables/useAppearance.ts`, `technical/Theme/app/components/AppearancePicker.vue`, `shared/utils/appearance.ts`, `app/assets/css/appearance.css`.
- Décor enfant : `app/assets/css/child-world.css`, `technical/Motion/app/components/ChildFoliage.vue` et `useFoliageMotion.ts`.
- Démarrage : `app/components/SplashScreen.vue` ; conserver son contrôle de mise à jour et le comportement existant du worker.
- Salutation locale : `app/composables/useLocalGreeting.ts` ; conserver Bonjour/Bonsoir, sans Coucou.
- Préférences actuellement locales par profil, pas synchronisées entre appareils.
- Dernier lot publié : MR #217, main `8dd83ff5b4823e13d8831758fcd21dd069d76ec9`, worker `tantara-d40f4552c992d973`.
- Vérifications de ce lot précédent : lint/types/i18n/docs/contrastes, 89 tests unitaires et migrations ; limites visuelles documentées dans #216. Ce n’est pas une certification RGAA.
- Pas d’E2E en local sous l’instruction utilisateur actuelle ; la remise en état de la suite distante et Driver.js reste suivie en #197. Ne pas annoncer cette suite verte par défaut.
- Famille, messages, livres et photos réels doivent rester intacts ; utiliser les comptes fictifs du seeder pour les démonstrations.

## Prompt de reprise

> Initialise si nécessaire le pointeur local `.specify/feature.json` vers `specs/001-adaptive-appearance`, puis lis la spécification active `specs/001-adaptive-appearance/spec.md`, sa checklist et toutes les planches référencées dans `docs/maquettes/planches/README.md`. Reprends les trois thèmes adultes/enfants existants pour les rendre fidèles aux maquettes, puis prépare leur composition avec saisons, jour/nuit et événements facultatifs. Commence par relire les hypothèses, puis suis SpecKit plan → tasks → analyze → implement → converge. Respecte les règles du dépôt, les vraies photos, Bonjour/Bonsoir local, les feuilles indépendantes et l’accessibilité ; ne lance pas d’E2E local et ne publie pas automatiquement sur main. Consigne précisément ce qui est réalisé, testé et encore à valider.
