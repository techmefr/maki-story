# Vault (/vault)

Routes: /vault

Lists the voice messages saved as treasures and plays or removes them.

## Behaviour per role
- Parent: sees the family treasures, plays and removes them (treasure.remove is parent and relative).
- Relative: sees only the treasures that belong to them, plays and removes them.
- Child: sees only their own treasures; removal is refused by the API.
A counter shows the count against the limit.

## States
Empty state with the treasure illustration when nothing is saved. The play button of the playing item is disabled. Offline is not handled specifically.

## Design audit checklist
- [x] One main action per screen.
- [x] Secondary buttons visible with an icon.
- [x] Targets of 44 px or more, rem sizes, wrapping text, no overflow at any text size.
- [x] Keyboard reachable with visible focus ring, native buttons for remote use.
- [x] prefers-reduced-motion respected.
- [x] Every string goes through i18n (9 locales).
