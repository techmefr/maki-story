# Family data (/family/data)

Parent only (permissions family.export and family.delete).

## Behaviour per role
- Parent: downloads a ZIP of the family (books, voices, messages, treasure box, no codes). Deletes the whole family after entering the parent code and the family name; everything is erased in one transaction (guest voices recorded in other families, shares and copies origin references included), a tombstone without payload is kept, the session cookie is cleared.
- Others: 403.

## States
Idle, confirming (two fields), wrong code, wrong name, failure (nothing erased), done (back to login).

## Design audit checklist
- [x] One main action per screen.
- [x] Secondary buttons visible with an icon.
- [x] Targets of 44 px or more, rem sizes, wrapping text, no overflow at any text size.
- [x] Keyboard reachable with visible focus ring, native buttons for remote use.
- [x] prefers-reduced-motion respected.
- [x] Every string goes through i18n (9 locales).
