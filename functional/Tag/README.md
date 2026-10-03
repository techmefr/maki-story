# Tag

Type: functional

Spécification du domaine, à valider avant le code (voir `docs/ARCHITECTURE.md` et `docs/RULES.md`).

## Écrans

Tags (fichiers `docs/maquettes/<Écran>.dc.html`).

## Règles

- Un tag a un slug anglais, unique par famille, et un nom par langue de la famille.
- Repli d'affichage : langue choisie, puis anglais, puis slug.
- Les livres ne stockent que le slug.
- Seuls les parents gèrent les tags ; tags automatiques (`auto`) possibles.

## États

- Tag sans traduction dans une langue (pastille de manque).

## Cas limites

- Suppression d'un tag utilisé par des livres.
- Ajout d'une langue à la famille.

## Données

Tag, TagTranslation, BookTag (modèle complet dans `docs/ARCHITECTURE.md`).

## Code existant à reprendre

`app/pages/books`, `useBooks` (tags)

## Tests attendus

- Repli en trois étapes.
- Slug unique par famille.

## Validation

- [ ] Relue par Gaëtan
