# Maki Story

Appli de livres lus à voix haute par la famille (Nuxt 4 en SPA, Capacitor 8, PostgreSQL, Vercel). Les maquettes Claude Design font foi pour l'interface.

## Lire avant toute tâche

Dans cet ordre, et seulement ce qui concerne la tâche :

1. `docs/PRD.md` : ce que fait l'app, pour qui, règles métier chiffrées.
2. `docs/ARCHITECTURE.md` : couches OSDD `technical/` et `functional/`, domaines, modèle de données.
3. `docs/RULES.md` : règles de code, de commit et de test. Non négociables.
4. `docs/DESIGN.md` : design system atomique, tokens, composants. Toute interface s'y conforme.
5. `docs/TASKS.md` : tâches à faire, en cours, faites. Prendre la première tâche non bloquée.
6. `docs/MEMORY.md` : décisions déjà prises et pièges connus. À mettre à jour en fin de tâche.

Maquettes : `docs/maquettes/` (un fichier `*.dc.html` par écran, `Design System.dc.html`, 9 e-mails `mail-*.html`, `README.md` avec les parcours, `PROMPT - Appliquer le design Tantara.md` avec la spécification page par page). Ouvrir la maquette de l'écran avant de le coder. Elles priment sur `DESIGN.md` en cas d'écart ; signaler l'écart, ne pas le trancher seul.

## Méthode

- Spécification d'abord : la spécification du domaine (règles, états, cas limites) est écrite et validée avant son code.
- Une tâche = un domaine ou un lot d'écrans, une branche, un commit conventionnel en anglais.
- Les branches fusionnent dans `dev`. `main` ne reçoit qu'un seul merge depuis `dev` par lot terminé (Vercel se bloque sinon). Maximum 100 push par jour : un push par tâche terminée.
- Le serveur fait autorité sur chaque règle métier ; l'interface la reflète par un composable.
- Avant de finir : lint, typage, tests, puis cocher la tâche dans `docs/TASKS.md` et noter toute décision dans `docs/MEMORY.md`.

## Interdits

- Aucune trace d'IA dans le code versionné ni dans les messages de commit (pas de `Co-Authored-By`, pas de lien de session).
- Pas de `any`, pas de commentaires, pas de `console.log`.
- Pas de nouvelle dépendance sans le dire dans `docs/MEMORY.md`.

## Commandes

Les commandes (dev, build, lint, test, migrations) sont dans `package.json` ; ne pas les redéfinir ici.
