# Register (`/register`)

## 1. What the page must do
- Public form: e-mail, password (8 characters minimum), family name, parent first name. The account, the family, the parent profile and its parent membership are created in one transaction.
- On success the session starts without a profile and the user goes to the guided first launch (`welcome.md`), not to the profile selector.
- Other entry point for relatives: `/join/<code>` (see `join.md`); a relative never creates a family.
- Errors: invalid fields or e-mail already used, server unreachable, server error, throttling. All strings are translated.

## 2. Design audit checklist
- [x] One main action: create my account.
- [x] Secondary link to the login visible.
- [x] Big logo, micro-animation (floating logo).
- [x] No overflow at any text size, keyboard focus, `prefers-reduced-motion`.
- [x] Fredoka and Nunito, hard shadow `3px 3px 0 #1F1B3A`.
