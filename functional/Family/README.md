# Family

Type: functional

Spécification du domaine, à valider avant le code (voir `docs/ARCHITECTURE.md` et `docs/RULES.md`).

## Écrans

Creer Famille, Choix Famille, Famille (fichiers `docs/maquettes/<Écran>.dc.html`).

## Règles

- Une famille a un ou plusieurs enfants et un ou plusieurs parents.
- Une même personne peut être parent d'une famille et proche d'une autre ; le rôle est porté par `Membership`.
- Une famille garde au moins un parent : impossible de retirer le dernier parent ou son propre profil.
- Seuls les parents gèrent proches, enfants, livres, tags et connexions autorisées.
- Les langues de la famille sont les seules proposées partout.

## États

- Aucune famille, une famille, plusieurs familles (choix).

## Cas limites

- Un proche dans 10 familles ou plus : liste paginée.
- Changement de rôle en cours de session.

## Données

Family, Membership, FamilyLanguage, AllowedProvider (modèle complet dans `docs/ARCHITECTURE.md`).

## Code existant à reprendre

`server/api/family`, `server/api/members`, `useMembers`, `useCurrentMember`

## Tests attendus

- Retrait du dernier parent refusé.
- Un proche reçoit 403 sur les routes réservées aux parents.
- Une langue hors famille est refusée dans tags, studio et lecteurs.

## Validation

- [ ] Relue par Gaëtan
