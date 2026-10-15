# Abonnement : limites de l'offre gratuite

Statut : limites gratuites et prix validés par Gaëtan (2026-10-09). Les limites de l'offre gratuite sont codées (serveur, interface, tests) ; Stripe et parrainage ne le sont pas. Les codes promo internes le sont (voir ci-dessous).

## Offre gratuite

| Règle | Valeur |
|---|---|
| Livres créés par famille | 12 au total |
| Profils d'adultes (parents et proches) | 8 |
| Profils d'enfants | illimité |
| Familles par compte | 1 |
| Écoute et relecture | illimitées |

## Réalisation

- `server/utils/plan.ts` : plafonds par offre (`free`, `premium`, `lifetime` dans `families.plan`), `assertCanCreateBooks` et `assertCanAddAdult` (refus 402 `plan_book_limit` ou `plan_adult_limit`).
- Contrôles : création de livre (y compris ISBN, copie reçue d'une autre famille, brouillon IA), création de profil d'adulte, invitation d'un adulte (une invitation en attente réserve une place).
- `GET /api/plan` : usage de la famille ; affiché dans la bibliothèque (parents) et la page famille.
- `PUT /api/admin/families/:id/plan` et `GET /api/admin/families` : réservés aux administrateurs d'instance (`INSTANCE_ADMIN_EMAILS`) pour attribuer `lifetime` à ta famille et aux bêta-testeurs.

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

## Proches (reporté, lancé seulement si des proches le demandent)

- Un proche n'est jamais facturé pour enregistrer sa voix dans la famille.
- Ses propres livres solo : 10 gratuits, en plus des 12 de la famille.
- Abonnement « proche » à part : non lancé. Si des proches le demandent, prix validé : 2,99 € par mois ou 24 € par an (famille : 4,99 € et 39 €).

## Principes

- Pas de publicité, ni dans l'offre gratuite ni dans l'offre abonnée (enfants, confiance des familles, règles européennes et des magasins).
- Lancement par le web (appli installable) et Stripe ; magasins plus tard si les revenus le justifient.

## Domaines

- `maki-story.com` : site public, présentation, tarifs, abonnement, lien vers l'open source.
- `maki-story.fr` : instance de la famille.
- Nom du produit : Maki Story (renommage du code à faire).


## Codes promo internes (codés)

- Table `promo_codes` (type `premium_days` ou `lifetime`, durée, nombre max d'usages, date de fin) et `promo_redemptions` (une famille ne l'utilise qu'une fois). `families.plan_until` : un premium expiré redevient gratuit.
- Admin d'instance : `GET/POST /api/admin/promo-codes`, `DELETE /api/admin/promo-codes/:code`.
- Parent : `POST /api/plan/redeem { code }`. Les remises en pourcentage restent à faire avec Stripe.
