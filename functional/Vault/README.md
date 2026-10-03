# Vault

Type: functional

Spécification du domaine, à valider avant le code (voir `docs/ARCHITECTURE.md` et `docs/RULES.md`).

## Écrans

Coffre Adulte, coffre de Accueil Enfant (fichiers `docs/maquettes/<Écran>.dc.html`).

## Règles

- Coffre enfant : 10 favoris au maximum, ajoutés par l'enfant ou un parent ; le 11e est refusé, pas de remplacement automatique.
- Ajouter au coffre renseigne `savedAt` et supprime l'expiration.
- Cœur désactivé (gris) quand le coffre est plein, avec le message « Retire un cœur avant d'en ajouter un nouveau ».
- Coffre adulte : 10 souvenirs au maximum. Sans messages libres entre adultes, son contenu reste à trancher (messages reçus d'enfants, éléments marqués).

## États

- Vide, rempli, plein.

## Cas limites

- Retirer un cœur rend un emplacement.
- Message expiré pendant l'ajout.

## Données

VaultItem (modèle complet dans `docs/ARCHITECTURE.md`).

## Code existant à reprendre

`server/api/treasure`, `useTreasure`

## Tests attendus

- Le 11e ajout est refusé côté serveur.
- Un message au coffre survit à la purge.

## Validation

- [ ] Relue par Gaëtan
