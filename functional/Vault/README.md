# Vault

Type: functional

Spécification du domaine, à valider avant le code (voir `docs/ARCHITECTURE.md` et `docs/RULES.md`).

## Écrans

Coffre Adulte, coffre de Accueil Enfant (fichiers `docs/maquettes/<Écran>.dc.html`).

## Règles

- Coffre enfant : 10 favoris au maximum, ajoutés par l'enfant ou un parent ; le 11e est refusé, pas de remplacement automatique.
- Ajouter au coffre renseigne `savedAt` et supprime l'expiration.
- Cœur désactivé (gris) quand le coffre est plein, avec le message « Retire un cœur avant d'en ajouter un nouveau ».
- Coffre adulte : 10 souvenirs au maximum. Il garde les messages reçus d'un enfant.

- Un seul écran, `VaultScreen`, pour les deux rôles (`/vault` et `/kid/treasure`) : mêmes lignes, compteur, état vide et confirmation avant retrait ; seule la variante `kid` ou `adult` change le layout et la taille de l’avatar. Chaque personne a son coffre privé ; seul un adulte retire un souvenir.

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

## Retrait d’un souvenir

La confirmation « supprimé pour toujours » retire le souvenir et marque aussi son message source comme supprimé. Le retrait ne réintroduit donc jamais ce message dans la boîte active ni dans le quota de cinq. Un parent gère son propre coffre et ceux des enfants ; le coffre d’un autre adulte reste privé.
