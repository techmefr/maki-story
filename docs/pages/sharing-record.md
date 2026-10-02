# Share recording (/sharing/[id])

Routes: /sharing/[id]

## Behaviour
A guest family member must choose the recording language before recording (mandatory, one of the book voice languages or their spoken languages); the language is stored with the recording and added to the book voice languages. Copying a shared book keeps the illustrator, the cover page kind and the panels (other page kinds become empty pages without file).

## States
Language not chosen (recording disabled with hint), recording, saved, error.

## Design audit checklist
- [x] One main action per screen.
- [x] Secondary buttons visible with an icon.
- [x] Targets of 44 px or more, rem sizes, wrapping text, no overflow at any text size.
- [x] Keyboard reachable with visible focus ring, native buttons for remote use.
- [x] prefers-reduced-motion respected.
- [x] Every string goes through i18n (9 locales).
