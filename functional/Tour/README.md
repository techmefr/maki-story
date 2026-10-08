# Tour

Type: functional

Visite guidée des adultes (parents et proches), construite sur Driver.js. Fiche d'écran : `docs/pages/guided-tour.md`.

## Règles

- Jamais pour un profil enfant : le serveur refuse la lecture et l'écriture (403), l'interface ne la lance pas.
- L'état est stocké par membre sur le serveur (`members.tour_status`, migration 0063) : `pending` après `/welcome`, `done` après la fin ou le saut.
- La visite se rejoue depuis la feuille des réglages sans modifier l'état stocké.
- Les étapes visent des ancres `data-testid` stables ; une étape dont l'ancre manque est sautée.
- Tout le texte passe par l'i18n (espace de noms `tour`).

## Code

- `server/api/tour` : `GET` et `PUT`, `server/utils/tour.ts` (garde adulte).
- `app/utils/tour-steps.ts` : les étapes parent et proche.
- `app/composables/useTour.ts` (état serveur, rejouer) et `useTourRunner.ts` (pilotage de Driver.js, monté par le layout par défaut).
- `app/assets/css/tour.css` : habillage du popover avec les jetons du design system.

## Tests attendus

- `tests/e2e/32-guided-tour.spec.ts`.
