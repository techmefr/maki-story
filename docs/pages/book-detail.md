# Book detail (/books/[id])

Routes: /books/[id]

Shows one book with its tags, recording progress per voice, and the actions to read or record it.

## Behaviour per role
- Child: sees the book and a Read button pointing to /kid/listen/[id]; no record or edit actions.
- Parent: Read points to /books/[id]/play; also Record and Edit, both opening the studio.
- Relative: Read and Record, no Edit.
The book is loaded through books.read (everyone), scoped to the family.

## States
Nothing is shown until the book arrives. Error or unknown book: empty state saying the book is missing. Read is disabled until the book status is ready. Offline is not handled specifically.

## Design audit checklist
- [x] One main action per screen.
- [x] Secondary buttons visible with an icon.
- [x] Targets of 44 px or more, rem sizes, wrapping text, no overflow at any text size.
- [x] Keyboard reachable with visible focus ring, native buttons for remote use.
- [x] prefers-reduced-motion respected.
- [x] Every string goes through i18n (9 locales).
