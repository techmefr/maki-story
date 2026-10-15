# Vault (/vault)

Routes: /vault (the same `VaultScreen` component also serves `/kid/treasure`)

Lists the voice messages saved as treasures and plays or removes them.

## Behaviour per role
- Parent: sees the family treasures, plays and removes them (treasure.remove is parent and relative).
- Relative: sees only the treasures that belong to them, plays and removes them.
- Child: sees only their own treasures; removal is refused by the API.
The screen is shared with the child vault (`/kid/treasure`, see `kid-treasure.md`): same rows, counter, empty state and removal confirmation. Each person only ever sees their own vault (10 memories at most); a parent can open a child vault with `?child=<id>`. Removal asks for a confirmation and is hidden for children.

## States
Empty state with the treasure illustration when nothing is saved. The play button of the playing item is disabled. Offline is not handled specifically.

## Design audit checklist
- [x] One main action per screen.
- [x] Secondary buttons visible with an icon.
- [x] Targets of 44 px or more, rem sizes, wrapping text, no overflow at any text size.
- [x] Keyboard reachable with visible focus ring, native buttons for remote use.
- [x] prefers-reduced-motion respected.
- [x] Every string goes through i18n (9 locales).
