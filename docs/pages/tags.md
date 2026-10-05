# Tags (/tags)

Routes: /tags

Lists the family book tags with their translations and lets a parent manage them.

## Behaviour per role
- Parent: creates a tag and edits or deletes existing ones from a sheet (the API requires the parent role); sees a badge counting missing translations per language.
- Child and relative: read the list only, rows are not editable.
A language chip row switches the label language.

## States
Empty state when there is no tag. Offline is not handled specifically.

## Design audit checklist
- [x] One main action per screen.
- [x] Secondary buttons visible with an icon.
- [x] Targets of 44 px or more, rem sizes, wrapping text, no overflow at any text size.
- [x] Keyboard reachable with visible focus ring, native buttons for remote use.
- [x] prefers-reduced-motion respected.
- [x] Every string goes through i18n (9 locales).
