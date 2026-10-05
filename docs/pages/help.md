# Help (/help)

Routes: /help

Shows a short FAQ with expandable answers, a support mail button and links to the legal texts and the account.

## Behaviour per role
- Parent: back goes to /home.
- Child: same page and back target as the parent.
- Relative: back goes to /relative.
Content is static, no API call; the support button only appears when a support email is configured.

## States
Static page: one answer open at a time, the first open by default. No loading, empty or error state.

## Design audit checklist
- [x] One main action per screen.
- [x] Secondary buttons visible with an icon.
- [x] Targets of 44 px or more, rem sizes, wrapping text, no overflow at any text size.
- [x] Keyboard reachable with visible focus ring, native buttons for remote use.
- [x] prefers-reduced-motion respected.
- [x] Every string goes through i18n (9 locales).
