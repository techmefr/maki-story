# Message

Type: functional

Spécification du domaine, à valider avant le code (voir `docs/ARCHITECTURE.md` et `docs/RULES.md`).

## Écrans

Message Enfant, Accueil Enfant, Accueil Proche, Categorie (fichiers `docs/maquettes/<Écran>.dc.html`).

## Règles

- Un message vocal vise exactement un enfant.
- Un adulte laisse au maximum 5 messages actifs à un même enfant ; un message mis au coffre ne compte plus. Garanti par transaction serveur.
- `expiresAt = firstListenedAt + 24 h`, écrit une seule fois, jamais mis à jour à la réécoute. Un message jamais écouté n'expire pas.
- Tâche planifiée : supprime les messages expirés et leur audio ; les lectures filtrent aussi sur `expiresAt`.
- Pas de messages libres entre adultes : seulement les demandes liées au livre et à la revue.
- Lecture façon stories : balayage entre messages, réécoute libre.
- Durée maximale d'un message selon `MESSAGE_MAX_DURATION_MS`.

## États

- Non écouté, écouté (minuteur 24 h), mis au coffre, expiré.

## Cas limites

- Deux envois simultanés ne dépassent pas 5.
- À 5/5 le plus ancien peut être retiré par l'expéditeur.
- Message d'anniversaire (`BIRTHDAY`).

## Données

Message (modèle complet dans `docs/ARCHITECTURE.md`).

## Code existant à reprendre

`server/api/messages/index.post.ts` (409 actuel), `useMessages`, `useNotifications`

## Tests attendus

- Le 6e message est refusé (remplace le 409 actuel d'un seul message actif).
- Réécoute sans remise à zéro.
- Message au coffre sans expiration et hors du compte de 5.

## Validation

- [ ] Relue par Gaëtan
