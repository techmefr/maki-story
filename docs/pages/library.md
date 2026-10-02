# Library, proposals, filters (kid library, parent home, book sheet, AI page)

## Behaviour per role
- Child: only books of their age (age computed from birth date in their timezone, plus the parent age shift, between age_min and age_max). A book with childVisible true is always shown, false never. No birth date means no filter. Hidden books are unreachable by id and by files.
- Parent: filters by type, mood and theme in the library; sets childVisible (auto, show, hide) in the book sheet; age shift (-5 to +5) on a child profile; sees a Proposals row with accept and decline; sees a birth date nudge when a child has none; sets a per-family AI budget on the AI page.
- Relative: proposes a book to the family (pending until a parent accepts, restorable from the trash when declined), sees My proposals; gets a notification when lines are assigned to them (recording request) and the result of a proposal.
- AI: every generated text and image is moderated before saving; a blocked text answers 422, a blocked image leaves the page empty.

## States
Empty rows hidden, pending proposal, blocked content notice, budget saved or error.

## Design audit checklist
- [x] One main action per screen.
- [x] Secondary buttons visible with an icon.
- [x] Targets of 44 px or more, rem sizes, wrapping text, no overflow at any text size.
- [x] Keyboard reachable with visible focus ring, native buttons for remote use.
- [x] prefers-reduced-motion respected.
- [x] Every string goes through i18n (9 locales).
