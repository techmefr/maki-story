# Relative category (/categories/[slug])

Routes: /categories/[slug]

Lists the items of one relative to-do category (toRecord, proposals or toFix) across the relative families.

## Behaviour per role
- Relative: sees the rows of the chosen category with a count; each row opens the share or the studio. toRecord rows are record requests, proposals show the share status, toFix rows show the parent comment and the number of takes.
- Parent and child: no entry point; the data comes from the relative flow.
Any slug other than the three known ones shows a not found empty state.

## States
Empty state when the category has no row once loaded. Not found state for an unknown slug. Offline is not handled specifically.

## Design audit checklist
- [x] One main action per screen.
- [x] Secondary buttons visible with an icon.
- [x] Targets of 44 px or more, rem sizes, wrapping text, no overflow at any text size.
- [x] Keyboard reachable with visible focus ring, native buttons for remote use.
- [x] prefers-reduced-motion respected.
- [x] Every string goes through i18n (9 locales).
