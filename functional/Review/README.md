# Review

Type: functional

Spécification du domaine, à valider avant le code (voir `docs/ARCHITECTURE.md` et `docs/RULES.md`).

## Écrans

Revue Parent (fichiers `docs/maquettes/<Écran>.dc.html`).

## Règles

- Un parent approuve chaque prise ou demande un changement avec un commentaire.
- Le texte précédent est gardé pour comparer (`previousText`).
- « Valider » n'est actif que lorsque tout est approuvé.
- Aucun accès enfant avant validation ; un livre prêt reste visible du parent.
- La revue couvre toutes les langues ; les voix concernées sont notifiées.

## États

- À relire, corrections demandées, approuvé, validé.

## Cas limites

- Un parent par famille partagée valide chacun pour sa famille.
- Nouvelle prise après correction : retour à relire.

## Données

Review, Recording, BookShare (modèle complet dans `docs/ARCHITECTURE.md`).

## Code existant à reprendre

`useReview`, `server/api/books` (revue)

## Tests attendus

- « Valider » refusé tant qu'une prise n'est pas approuvée.
- Un enfant ne peut pas lire une prise non validée.

## Validation

- [ ] Relue par Gaëtan
