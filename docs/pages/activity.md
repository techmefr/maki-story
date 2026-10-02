# Activity journal (/family/activity)

Routes: /family/activity, /books/[id]/activity

Parent only (permission family.activity). Shows the family event journal, most recent first, 50 per page with a Show more button.

## Behaviour per role
- Parent: reads the journal of their own family only (family_id scoped query). Entries show the action label, the actor name (or automatic for the system), the outcome (denied or failed) and the date.
- Others: 403.

## States
Loading, empty, error, end of list. Unknown actions fall back to the raw action name. Secrets are never stored in the journal (scrubbed payloads).

## Design audit checklist
- [x] One main action per screen.
- [x] Secondary buttons visible with an icon.
- [x] Targets of 44 px or more, rem sizes, wrapping text, no overflow at any text size.
- [x] Keyboard reachable with visible focus ring, native buttons for remote use.
- [x] prefers-reduced-motion respected.
- [x] Every string goes through i18n (9 locales).
