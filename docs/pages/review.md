# Book review (`/books/[id]/review`)

Routes: /books/[id]/review

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
