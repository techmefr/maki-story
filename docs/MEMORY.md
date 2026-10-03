# Mémoire du projet — Tantara

Décisions prises et pièges connus. À relire avant une tâche, à compléter en fin de tâche (date, décision, raison).

## Décisions confirmées

- Stack gardée ; structure refaite en OSDD (couches `technical/` et `functional/`) et en atomic design.
- Code enfant : 4 à 6 formes parmi 6 touches, longueur choisie par l'enfant (décidé le 2026-10-03). Adultes : code à chiffres.
- Messages : chaque adulte laisse 5 messages au maximum à un même enfant ; accessible 24 h après la première écoute, puis supprimé sauf mis au coffre.
- Studio : création page par page conservée, certains champs deviennent optionnels.
- IA : reportée à plus tard ; seulement `Book.origin = manuel` prévu.
- Maquettes Claude Design : font foi pour l'interface et les règles métier.
- Un message mis au coffre ne compte plus dans les 5 de l'expéditeur (décidé le 2026-10-03).
- L'enfant peut aussi envoyer des messages audio : 5 au maximum par destinataire, même effacement 24 h après la première écoute sauf mis au coffre (décidé le 2026-10-03).
- Le coffre adulte garde les messages reçus d'un enfant, 10 au maximum (confirmé le 2026-10-03).
- Un enfant peut écrire à tous les adultes de sa famille (confirmé le 2026-10-03).
- Pas de messages entre adultes en dehors des demandes liées au livre (demande d'enregistrement, proposition de livre) ou à la revue (décidé le 2026-10-03).
- Pages sans maquette (activité, appareils, corbeille, stockage, grimace, traduction) : conçues dans le même style que le design system.
- Passage RGAA demandé (2026-10-03) : des couleurs se superposent parfois en clair et en sombre et rendent le texte illisible ; les deux thèmes sont gardés et les contrastes contrôlés (voir `docs/DESIGN.md`).
- Mise en page : vraie version adaptative (téléphone, tablette, ordinateur, Android TV), pas une colonne de 440 px étirée.

## Points ouverts

- Fuseau horaire du verrouillage : on reprend le fuseau par règle du dépôt actuel.
- Liste des champs optionnels du studio à valider.
- Écrans adaptatifs : points de rupture et navigation tablette, ordinateur et TV à dessiner (issue de mise en page).
- Migrations : les 18 existantes gardent leur nom (le migrateur suit le nom complet, pas le numéro, donc les 4 numéros en double sont sans effet). Aucune renumérotation. À partir de `0019`, chaque numéro est unique, contrôlé par `scripts/check-migrations.ts`.
- À compléter : vrai logo et favicon, textes juridiques à valider par un juriste, domaine, adresse postale, contact des e-mails.

## Pièges connus

- `nuxt-osdd` : couches à la racine (`/functional`, `/technical`), chacune avec son `app/` et son `server/`. Le README du paquet parle d'« Open Source Driven Development », la description npm d'« Operating System Dependency Design » : ne pas figer l'expansion du sigle.
- Les maquettes de `docs/maquettes/` remplacent celles de `design/` (Kalli). `deck-stage.js` et `support.js` servent seulement à ouvrir les maquettes, ne pas les reprendre dans l'app. Le logo `logo-maki.png` est provisoire.
- Vercel : un seul merge `dev` vers `main` par lot, sinon les déploiements se bloquent. Tout le reste va dans `dev`.
- GitHub : 100 push par jour au maximum. Pousser par tâche terminée, pas par petit changement.
- L'ancien `CLAUDE.md` était obsolète (Supabase, compte partagé, un seul message actif) ; il est remplacé.
- `server/api/messages/index.post.ts` refuse un second message actif par expéditeur, destinataire et type (409) : à remplacer par la limite de 5 (un message au coffre ne compte plus).
- `server/utils/ai/` et 5 routes `server/api/ai` existent mais `aiCreationEnabled` est faux en production : isoler le domaine IA derrière son drapeau.
- 34 commits sur 52 contiennent un `Co-Authored-By` d'IA, contraire à `docs/RULES.md` ; ne pas en ajouter, ne pas réécrire `main` sans accord.
- `scripts/design-audit.ts` vérifie encore l'ancien design (voir `docs/DESIGN.md`).

## Journal

- 2026-10-03 : audit refait avec le référentiel nuxt-osdd ; création de `CLAUDE.md` et `docs/`.
