# Book

Type: functional

Spécification du domaine, à valider avant le code (voir `docs/ARCHITECTURE.md` et `docs/RULES.md`).

## Écrans

Bibliotheque, Livre Detail, Ajouter Livre, Acces Livres (fichiers `docs/maquettes/<Écran>.dc.html`).

## Règles

- Un livre : titre, auteur, ISBN, couverture, âges min et max, origine (`manuel`), statut (brouillon, en enregistrement, en relecture, validé).
- Langue écrite du livre indépendante des langues de voix.
- Un livre sans voix est caché de l'enfant ; aucune visibilité enfant avant validation d'un parent.
- Un livre peut être partagé à 10 familles au maximum, validé par un parent de chaque famille.
- Accès par enfant : si une sélection existe, seulement ces livres ; sinon tous les livres validés.
- Filtres de la bibliothèque : type, humeur, thème, âge.

## États

- Brouillon, en enregistrement, en relecture, validé.

## Cas limites

- ISBN introuvable : saisie manuelle.
- Livre partagé à une famille sans la langue du livre.

## Données

Book, BookLanguage, BookShare, BookAccess, Page, PageTranslation, Character (modèle complet dans `docs/ARCHITECTURE.md`).

## Code existant à reprendre

`server/api/books`, `server/api/shares`, `useBooks`, `useShares`, `useBookDraft`

## Tests attendus

- Un enfant ne voit pas un livre non validé.
- Le 11e partage est refusé.
- Filtrage par âge avec `childVisible`.

## Validation

- [ ] Relue par Gaëtan
