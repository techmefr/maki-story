# Book review (`/books/[id]/review`)

Only the parts changed by the page view lot are described here. The page card itself is documented in `book-page-view.md`.

## 1. What the page must do
- Parent only. Two reading modes: "Line by line" (historical list, default) and "Page by page" (shared page view with the scan, description, characters and per-line validate or request-a-redo with comment).
- States: empty filter, loading, save error are unchanged.

## 2. Design audit checklist
- [x] One main action: validate everything.
- [x] Secondary buttons visible with an icon.
- [x] Big icons, micro-animation on state change.
- [x] No overflow at any text size.
- [x] Keyboard and remote focus, visible focus ring.
- [x] `prefers-reduced-motion` respected.
- [x] Fredoka and Nunito, hard shadow `3px 3px 0 #1F1B3A`.

## Languages, stale takes and ready books (review lot)
- A language switcher lists the book language, the voice languages and every language that already has a take. The list, the take, the approve and the redo actions all use the selected language (the API already accepted `language`). Page mode uses the same language.
- A "Show the original" toggle appears for translated languages and shows the original text under each line.
- The "validate everything" gate and its hints still look at the book language only; validating the whole book approves the pending takes of every language.
- A redo request on one line of an already validated book keeps the book `ready` and visible to the child. The line is flagged `changes_requested` and the previously approved take stays playable for the child (approved take preserved) until the new take is approved.
