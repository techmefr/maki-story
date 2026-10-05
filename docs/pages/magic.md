# Magic link (/magic)

Routes: /magic

Verifies the token of a sign-in link and sends the user to their landing page.

## Behaviour per role
- Parent and relative: the token from the query string is verified, then the app navigates to the landing path of their families.
- Child: not applicable.
No session is needed to open the page.

## States
Loading: logo and title announced as status. Error: an expired link message with a button to /login. Offline is not handled specifically.

## Design audit checklist
- [x] One main action per screen.
- [x] Secondary buttons visible with an icon.
- [x] Targets of 44 px or more, rem sizes, wrapping text, no overflow at any text size.
- [x] Keyboard reachable with visible focus ring, native buttons for remote use.
- [x] prefers-reduced-motion respected.
- [x] Every string goes through i18n (9 locales).
