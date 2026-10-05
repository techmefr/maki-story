# Book access (/family/books)

Routes: /family/books

Lets a parent restrict which ready books each child can see.

## Behaviour per role
- Parent: picks a child, toggles all books or a selection, then ticks books; saved through members.manage.
- Child and relative: refused by the API (403).
When all books are allowed the list is shown checked and disabled.

## States
Empty state when there is no child, and when there is no ready book. Error message when saving fails. Offline is not handled specifically.

## Design audit checklist
- [x] One main action per screen.
- [x] Secondary buttons visible with an icon.
- [x] Targets of 44 px or more, rem sizes, wrapping text, no overflow at any text size.
- [x] Keyboard reachable with visible focus ring, native buttons for remote use.
- [x] prefers-reduced-motion respected.
- [x] Every string goes through i18n (9 locales).
