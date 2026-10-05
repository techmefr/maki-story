# Account (/account)

Routes: /account

Shows the signed-in account identity, lets a family manager export the family data and delete the family, and links to the legal texts.

## Behaviour per role
- Parent: sees the identity (name, email, role). When the account can manage the family, requests a data export by email (permission family.export) and deletes the family after typing the confirmation word and entering their code (permission family.delete, a 403 is shown as a wrong code).
- Child: sees the identity and a parent-only notice, no export or delete.
- Relative: same as child; the back button returns to /relative instead of /family.

## States
Error: load failure message, export failed message, delete failed or wrong code message. The export button shows sending then sent. After deletion the app reloads on /onboarding. Offline is not handled specifically.

## Design audit checklist
- [x] One main action per screen.
- [x] Secondary buttons visible with an icon.
- [x] Targets of 44 px or more, rem sizes, wrapping text, no overflow at any text size.
- [x] Keyboard reachable with visible focus ring, native buttons for remote use.
- [x] prefers-reduced-motion respected.
- [x] Every string goes through i18n (9 locales).
