# Forgot code (/forgot)

Routes: /forgot

Asks for an account email to send a code reset link.

## Behaviour per role
- Parent and relative: enter the email and submit; the page then shows a sent confirmation. No session is needed.
- Child: a note tells the child to ask a parent.
The back button returns to the previous page or /profiles.

## States
Send is disabled until the email looks valid or while sending. The sent state replaces the form. Error message when the request fails. Offline is not handled specifically.

## Design audit checklist
- [x] One main action per screen.
- [x] Secondary buttons visible with an icon.
- [x] Targets of 44 px or more, rem sizes, wrapping text, no overflow at any text size.
- [x] Keyboard reachable with visible focus ring, native buttons for remote use.
- [x] prefers-reduced-motion respected.
- [x] Every string goes through i18n (9 locales).
