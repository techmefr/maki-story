# Abonnement : limites de l'offre gratuite

Statut : spécification validée par Gaëtan (2026-10-09). Rien n'est codé.

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

## Offre abonnée (à confirmer)

- Livres illimités, plus de profils d'adultes, plusieurs familles.
- Traductions et voix en plusieurs langues.
- Sauvegarde et export.

Les valeurs exactes et le prix restent à fixer. Le paiement (Stripe) n'est pas spécifié.

## Domaines

- `maki-story.com` : site public, présentation, tarifs, abonnement, lien vers l'open source.
- `maki-story.fr` : instance de la famille.
- Nom du produit : Maki Story (renommage du code à faire).
