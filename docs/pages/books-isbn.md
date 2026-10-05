# Add a book by ISBN (/books/isbn)

Routes: /books/isbn

Looks a book up by ISBN (typed or scanned) and saves it to the library with tags.

## Behaviour per role
- Parent: full flow; the lookup and creation require books.create.
- Relative: books.create is also allowed to relatives.
- Child: refused by the API (403), no entry point.
Steps: search, form (title, author, subjects, tags with automatic suggestions, link to /tags), then a done screen with links to the library or another ISBN. The scan button only appears when the browser supports BarcodeDetector.

## States
Search is disabled while busy or empty. Not found: a card explaining the book is missing with a manual entry button. Failure: error message on search and on save. Offline is not handled specifically.

## Design audit checklist
- [x] One main action per screen.
- [x] Secondary buttons visible with an icon.
- [x] Targets of 44 px or more, rem sizes, wrapping text, no overflow at any text size.
- [x] Keyboard reachable with visible focus ring, native buttons for remote use.
- [x] prefers-reduced-motion respected.
- [x] Every string goes through i18n (9 locales).
