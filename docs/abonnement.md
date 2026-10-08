# Abonnement : limites de l'offre gratuite

Statut : limites gratuites et prix validés par Gaëtan (2026-10-09). Rien n'est codé.

## Offre gratuite

| Règle | Valeur |
|---|---|
| Livres créés par famille | 12 au total |
| Profils d'adultes (parents et proches) | 8 |
| Profils d'enfants | illimité |
| Familles par compte | 1 |
| Écoute et relecture | illimitées |

## Précisions

- Un livre compte dès sa création, quel que soit son statut. Un livre supprimé (corbeille) ne compte plus après sa purge.
- Les livres importés par ISBN et les propositions de proches comptent aussi.
- Les invités et voix invitées comptent comme des adultes.
- Les enfants ne comptent pas dans la limite de profils.
- Aucune limite par semaine : le plafond total suffit.
- Le serveur fait autorité : création de livre, invitation et création de profil refusent au-delà de la limite (code 402 avec le motif).

## Offre abonnée (validée)

| Formule | Prix |
|---|---|
| Mensuel | 4,99 € |
| Annuel | 39 € (soit 3,25 € par mois) |
| Essai gratuit | 14 jours |

- Un seul abonnement, pas de pack de livres à l'unité pour l'instant (à ajouter si les familles le demandent).
- Prix de lancement possible pour les premières familles, à décider.
- Contenu : livres illimités, 20 profils d'adultes, 3 familles, traductions et voix en plusieurs langues, sauvegarde et export.
- Les valeurs exactes de profils et de familles restent à confirmer.

## Paiement

- Site `maki-story.com` avec Stripe. Rien n'est codé.
- Dans les applis mobiles (iOS, Android), la vente passe par la facturation des magasins (commission de 15 à 30 %). À trancher avant de publier sur les stores.
- Frais Stripe : environ 1,5 % + 0,25 € par paiement.

## Domaines

- `maki-story.com` : site public, présentation, tarifs, abonnement, lien vers l'open source.
- `maki-story.fr` : instance de la famille.
- Nom du produit : Maki Story (renommage du code à faire).
