# Edit profile (/profile/edit)

Routes: /profile/edit

Lets the current member change name and photo, change their code, and open data settings.

## Behaviour per role
- Parent: edits name and photo, sees the account email read only, changes their code, changes the account password, links to /family/data.
- Relative: same without the password form.
- Child: redirected to their home.
Account details are refused to children by the API.

## States
Save is disabled while the name is empty or while busy and shows saved afterwards. Error message when saving fails. The email stays empty if the account call fails. Photo capture opens in a bottom sheet. Offline is not handled specifically.

## Design audit checklist
- [x] One main action per screen.
- [x] Secondary buttons visible with an icon.
- [x] Targets of 44 px or more, rem sizes, wrapping text, no overflow at any text size.
- [x] Keyboard reachable with visible focus ring, native buttons for remote use.
- [x] prefers-reduced-motion respected.
- [x] Every string goes through i18n (9 locales).
