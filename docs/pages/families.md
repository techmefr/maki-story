# Family choice (/families)

Routes: /families

Lets an account with several memberships choose which family to open, or join or create another one.

## Behaviour per role
- Parent: lists their families with the child count and a role badge; picking one makes it the active family.
- Relative: same list, relative memberships carry the relative badge.
- Child: no access, children do not sign in with an account.
Buttons lead to /join and /families/new.

## States
Cards are disabled while a choice is in progress. Empty state when the account has no family. Error message when loading or choosing fails. Offline is not handled specifically.

## Design audit checklist
- [x] One main action per screen.
- [x] Secondary buttons visible with an icon.
- [x] Targets of 44 px or more, rem sizes, wrapping text, no overflow at any text size.
- [x] Keyboard reachable with visible focus ring, native buttons for remote use.
- [x] prefers-reduced-motion respected.
- [x] Every string goes through i18n (9 locales).
