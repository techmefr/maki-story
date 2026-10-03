# Mémoire du projet — Tantara

Décisions prises et pièges connus. À relire avant une tâche, à compléter en fin de tâche (date, décision, raison).

## Décisions confirmées

- Stack gardée ; structure refaite en OSDD (couches `technical/` et `functional/`) et en atomic design.
- Code enfant : 4 à 6 formes parmi 6 touches. Adultes : code à chiffres.
- Messages : chaque adulte laisse 5 messages au maximum à un même enfant ; accessible 24 h après la première écoute, puis supprimé sauf mis au coffre.
- Studio : création page par page conservée, certains champs deviennent optionnels.
- IA : reportée à plus tard ; seulement `Book.origin = manuel` prévu.
- Maquettes Claude Design : font foi pour l'interface et les règles métier.

## Points ouverts

- Code enfant : qui fixe la longueur de 4 à 6 formes ? Hypothèse : le parent, à la création du code.
- Un message mis au coffre cesse-t-il de compter dans les 5 de l'adulte ? Hypothèse : oui.
- Messages privés entre adultes : directement au coffre du destinataire, sans minuteur ? Hypothèse : oui.
- Fuseau horaire du verrouillage : on reprend le fuseau par règle du dépôt actuel.
- Mise en page adaptative (tablette, ordinateur, Android TV) : maquettes seulement en une colonne de 440 px.
- Liste des champs optionnels du studio à valider.
- Thème sombre : non décidé.
- Pages sans maquette : activité, appareils, corbeille, stockage, grimace, traduction.
- Migrations déjà appliquées en production : renumérotation interdite sans plan.
- Emplacement exact des couches serveur dans `nuxt-osdd` : à lire dans le README du paquet.
- À compléter : vrai logo et favicon, textes juridiques à valider par un juriste, domaine, adresse postale, contact des e-mails.

## Pièges connus

- Les maquettes de `docs/maquettes/` remplacent celles de `design/` (Kalli). `deck-stage.js` et `support.js` servent seulement à ouvrir les maquettes, ne pas les reprendre dans l'app. Le logo `logo-maki.png` est provisoire.
- Vercel : un seul merge `dev` vers `main` par lot, sinon les déploiements se bloquent. Tout le reste va dans `dev`.
- GitHub : 100 push par jour au maximum. Pousser par tâche terminée, pas par petit changement.
- L'ancien `CLAUDE.md` était obsolète (Supabase, compte partagé, un seul message actif) ; il est remplacé.
- `server/api/messages/index.post.ts` refuse un second message actif par expéditeur, destinataire et type (409) : à remplacer par la limite de 5.
- `server/utils/ai/` et 5 routes `server/api/ai` existent mais `aiCreationEnabled` est faux en production : isoler le domaine IA derrière son drapeau.
- 34 commits sur 52 contiennent un `Co-Authored-By` d'IA, contraire à `docs/RULES.md` ; ne pas en ajouter, ne pas réécrire `main` sans accord.
- `scripts/design-audit.ts` vérifie encore l'ancien design (voir `docs/DESIGN.md`).

## Journal

- 2026-10-03 : audit refait avec le référentiel nuxt-osdd ; création de `CLAUDE.md` et `docs/`.
