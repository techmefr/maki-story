# Règles — Tantara

## Code

- TypeScript strict : pas de `any`.
- Pas de commentaires dans le code. `scripts/lint.ts` les refuse, ainsi que `console.log`.
- Dossiers au singulier en PascalCase, composables en `useXxx`.
- Composables pour la logique, stores pour l'état seul : un store n'a ni calcul ni règle.
- Une règle métier a un seul foyer (voir `docs/ARCHITECTURE.md`). Le serveur fait autorité, l'interface la reflète.
- `technical/` ne dépend jamais de `functional/`. Un domaine `functional/` ne lit pas les fichiers d'un autre domaine : il passe par ses composables ou ses routes.
- Les pages restent fines : elles assemblent des composants.
- Aucun texte en dur : tout passe par l'i18n (9 langues).

## Données

- Migrations SQL numérotées, jamais modifiées une fois appliquées. Nouvelles à partir de `0019`.
- Limites (5 messages, 10 coffre, 10 familles par livre) garanties par transaction côté serveur.
- Codes toujours hachés ; essais limités.
- Les droits sont vérifiés côté serveur sur chaque route.

## Interface

- Atomes et molécules uniquement dans `technical/`, selon `docs/DESIGN.md`.
- Un son uniquement après une action de l'utilisateur, via soundcn.
- Respecter « réduire les animations ».
- Zones tactiles d'au moins 44 px.

## Git

- Conventional commits en anglais, une branche par tâche.
- Aucune trace d'IA : pas de `Co-Authored-By`, pas de lien de session, ni dans le code ni dans les commits ni dans les descriptions de PR.
- Pas de réécriture de l'historique de `main` sans accord explicite.
- Flux : toutes les branches de tâche fusionnent dans `dev`. `main` ne reçoit qu'un seul merge, depuis `dev`, quand un lot est terminé et vérifié. Chaque push sur `main` déclenche un déploiement Vercel : plusieurs merges rapprochés le bloquent.
- Limite de 100 push par jour : regrouper le travail en commits cohérents, pousser une fois par tâche terminée, jamais un push par petit changement.

## Tests

- Chaque règle de `docs/ARCHITECTURE.md` (« Où vit chaque règle ») a un test avant le code.
- Les tests Playwright existants restent verts à chaque étape de rangement.
- Tests unitaires des composables et des règles serveur à ajouter (aujourd'hui seulement 2).

## Fin de tâche

Lint, typage, tests verts ; tâche cochée dans `docs/TASKS.md` ; décisions notées dans `docs/MEMORY.md`.
