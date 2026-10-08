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

## Gratuité à vie et codes promo

- **Gratuité à vie (ta famille, trois bêta-testeurs):** un statut posé directement sur la famille côté serveur (`plan` = `lifetime`), indépendant de Stripe. Il donne l'offre abonnée sans paiement, sans date de fin, et ne dépend d'aucun abonnement qui pourrait expirer.
- **Qui l'attribue:** seul un administrateur d'instance (variable `INSTANCE_ADMIN_EMAILS`), depuis un écran ou une commande réservée. Chaque attribution est journalisée.
- **Codes promo (marketing, lancement):** codes à usage limité (nombre d'utilisations, date de fin, remise en pourcentage ou durée offerte), saisis à l'abonnement. Ils s'appuient sur les codes promotionnels de Stripe. Les codes ne servent pas à la gratuité à vie.
- **Prix de lancement:** par exemple 2,99 € par mois pour les 100 premières familles, via un code.
- **Limites de l'offre gratuite:** la famille `lifetime` n'est pas limitée (livres, profils, familles de l'offre abonnée).

## Parrainage

- Chaque famille abonnée a un code de parrainage personnel (lien et code court).
- Quand un ami s'abonne à l'offre **annuelle** avec ce code, le parrain gagne **1 mois offert**, ajouté à son abonnement.
- Le crédit n'est accordé qu'une fois le premier paiement de l'annuel encaissé et le délai de rétractation de 14 jours passé.
- Plafond : 12 mois offerts par parrain et par an.
- Le filleul ne peut pas utiliser son propre code, ni un code d'une famille qui partage son compte, son e-mail ou son moyen de paiement.
- À décider : un avantage pour le filleul (par exemple le premier mois offert).
- Les familles en gratuité à vie n'ont rien à gagner mais peuvent parrainer.

## Proches (reporté, si la demande existe)

- Un proche n'est jamais facturé pour enregistrer sa voix dans la famille.
- Ses propres livres solo : 10 gratuits, en plus des 12 de la famille.
- Abonnement « proche » à part : non lancé. Si des proches le demandent, prix à fixer (hypothèse de départ : 4 € par mois, 29 € par an, à comparer au prix famille de 4,99 € et 39 €).

## Domaines

- `maki-story.com` : site public, présentation, tarifs, abonnement, lien vers l'open source.
- `maki-story.fr` : instance de la famille.
- Nom du produit : Maki Story (renommage du code à faire).
