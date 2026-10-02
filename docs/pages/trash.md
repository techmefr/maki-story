# Trash (/family/trash)

Parent only (permission family.trash, enforced server side). Lists deleted books, relative profiles, voice messages, treasure box memories and a departed relative recordings, each with the last restore date (30 days after deletion).

## Behaviour per role
- Parent: list, restore. A restore that conflicts (full box, message already active) shows a clear message and changes nothing.
- Relative and child: no link, API answers 403.

## States
Loading, empty (maki hint), error, conflict. A daily task (trash:purge) removes items past the window, then unreferenced files, journal entries older than 12 months and error logs older than 90 days.

## Design audit checklist
- [x] One main action per screen.
- [x] Secondary buttons visible with an icon.
- [x] Targets of 44 px or more, rem sizes, wrapping text, no overflow at any text size.
- [x] Keyboard reachable with visible focus ring, native buttons for remote use.
- [x] prefers-reduced-motion respected.
- [x] Every string goes through i18n (9 locales).
