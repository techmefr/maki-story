# Create a family (/families/new)

Routes: /families/new

Guides a signed-in account through creating a new family in several steps.

## Behaviour per role
- Parent (any signed-in account): steps are family name, own names, first child (photo, name, age), child code, parent code, then a done screen leading to /family/invite. The creator becomes the parent of the new family.
- Child and relative: not applicable, the API only requires a session.
Back on the first step returns to /families.

## States
Next is disabled until the step is valid or while busy. Error message when creation fails. Photo capture opens in a bottom sheet. Offline is not handled specifically.

## Design audit checklist
- [x] One main action per screen.
- [x] Secondary buttons visible with an icon.
- [x] Targets of 44 px or more, rem sizes, wrapping text, no overflow at any text size.
- [x] Keyboard reachable with visible focus ring, native buttons for remote use.
- [x] prefers-reduced-motion respected.
- [x] Every string goes through i18n (9 locales).
