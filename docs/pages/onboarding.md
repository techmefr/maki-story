# Onboarding (/onboarding)

Routes: /onboarding

Presents three welcome slides before sign in.

## Behaviour per role
- Parent, child and relative: identical, a signed-out page with no API call.
Next moves through the slides, Skip is available until the last one, and finishing marks the onboarding as seen then goes to /login.

## States
Static page, no loading, empty or error state. Progress is announced to screen readers.

## Design audit checklist
- [x] One main action per screen.
- [x] Secondary buttons visible with an icon.
- [x] Targets of 44 px or more, rem sizes, wrapping text, no overflow at any text size.
- [x] Keyboard reachable with visible focus ring, native buttons for remote use.
- [x] prefers-reduced-motion respected.
- [x] Every string goes through i18n (9 locales).
