# Recording studio (`/books/[id]/studio`)

Only the parts changed by the page view lot are described here. The page card itself is documented in `book-page-view.md`.

## 1. What the page must do
- The recording language menu only offers the member's `spokenLanguages` (all languages when none is set). The server also refuses a take in a language the recorder does not speak.
- A "Show the page" toggle opens the shared page view (scan viewer, description, characters, own lines highlighted, "My lines" filter, record and listen buttons per own line). The page follows the current line.
- Recording constraints: Opus, 16 kHz mono, variable bitrate 24 kbit/s, 10 minutes maximum. The server refuses non-audio files and durations above 10 minutes plus a 5 s tolerance.
- States: empty (no line for this voice), loading, error, offline (take queued by the upload layer) are unchanged.

## 2. Design audit checklist
- [x] One main action: the round record button.
- [x] Secondary buttons visible with an icon.
- [x] Big icons, micro-animation on the record pulse.
- [x] No overflow at any text size (wrapping text).
- [x] Keyboard and remote focus on every control, visible focus ring.
- [x] `prefers-reduced-motion` respected.
- [x] Fredoka and Nunito, hard shadow `3px 3px 0 #1F1B3A`.

## Security (takes)
- Recording again an approved line creates a pending take; the child keeps hearing the approved take until the parent validates the new one (approved_takes table, child_recordings view). Same for the shared record flow and new languages.
