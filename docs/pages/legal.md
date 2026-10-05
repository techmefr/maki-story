# Legal texts (/legal)

Routes: /legal

Shows the terms of use, privacy policy and terms of sale in tabs, and records acceptance when required.

## Behaviour per role
- Parent: when reached with a next path and the current terms version not yet accepted, ticks both boxes (terms read, guardian) and accepts, which saves the consent; otherwise the acceptance date is shown.
- Relative: same flow as the parent when signed in.
- Child and signed out: read only; back goes to /profiles when signed in, else /login.

## States
A draft notice is always visible. Accept is disabled until both boxes are ticked or while busy. Error message when saving the consent fails. Offline is not handled specifically.

## Design audit checklist
- [x] One main action per screen.
- [x] Secondary buttons visible with an icon.
- [x] Targets of 44 px or more, rem sizes, wrapping text, no overflow at any text size.
- [x] Keyboard reachable with visible focus ring, native buttons for remote use.
- [x] prefers-reduced-motion respected.
- [x] Every string goes through i18n (9 locales).
