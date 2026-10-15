# New book (`/books/new`)

Guided book creation: a cover step, one step per page until "Book finished", then a review and the send. Source of truth: the mockups `docs/maquettes/Creation Livre Couverture`, `Page`, `Page Muette`, `Image` and `Prototype` (the prototype is the reference for behavior), issues #169 (flow) and #180 (voices and characters). Out of scope: #181 (night mode, time windows, validation by notification).

## 1. What the page must do

### Per role
- Child: no access.
- Parent: creates a book. Every voice can be assigned to any adult of the family.
- Relative: proposes a book. The book is read by the relative only (single reader), so "Who reads it" is fixed to the relative and not shown. The proposal goes to a parent for approval.

### Steps
1. **Cover** (step 1)
   - Title (required), description (optional: playing instructions or context).
   - Book type as chips: book (default), comic, wordless, written by the child. A hint sentence under the chips.
   - Cover image: "Blank" or "With photo". "Image" opens the sheet "Add an image": take a photo or choose from the gallery, cancel.
   - "More details" (collapsed): text language, voice languages, moods, themes, tags, subtitle, author, illustrator, age min and max, TTS fallback, ISBN scan or typing (fills title, author, cover). All optional, none blocks creation. Defaults: text language from the profile or the family, no mood, no theme.
   - Actions: "Next: page 1", "Save draft".
2. **Page N** (steps 2 to N+1), one screen per page
   - Image: "Blank page" or "With photo" (same sheet). A blank page is a real blank page, for example a credits page.
   - Voice: "With voice" or "No voice". No voice: the page is silent, nobody is asked to record it, and a short note says so.
   - With voice, one form per voice: character (name, or pick one already created for the book through chips, "New voice" opens a name field), text, description (optional: tone or playing instruction), "Who reads it" (see below). "+ Voice" adds a voice on the same page. The last used voice is preselected on the next page; in a two-voice book the other voice is proposed for the next line.
   - Pages already created collapse to one line ("Page 2, 3 lines" or "Silent") and reopen on tap.
   - Actions: "Next page" (creates the next page and saves the draft), "Book finished", "Save draft". Back goes to the previous page, or to the cover.
3. **Review and send**
   - Page count and voice count, list of characters with their reader (or "To assign" highlighted), a warning line with the number of voices to assign.
   - A book with no voice shows "This silent book is ready".
   - "Send": creates the book. Recording requests go out at this moment. Result screen: requests sent, or silent book ready; "Go to the studio" or "Back to the library".

### Who reads it
For each character (the choice is stored on the character, so it applies to all its lines):
- **A relative**: chips of the adults of the family who speak the book language, parents included. One adult can read several characters. One character never has two readers.
- **AI translation**: shown only when AI creation is enabled. The text is translated, then the character is assigned to a relative.
- **Open to everyone**: a request to every adult who speaks the language; the first to accept becomes the reader.
- **Later**: shown as "To assign" in the review and in the notifications; nothing is sent for it until it is assigned.

### Voice language
- The language is chosen on each voice when it is declared (chips of the book language and of the languages spoken in the family). The book language is the default.
- A voice in another language is the translation of the previous voice of the same character on the page: write the voice, then "+ Voice", choose the other language and write the translation. Every relative who speaks that language can record it; a translation voice has no "Who reads it" of its own.
- A translation voice needs a voice in the book language on the same page first (error otherwise).
- At send, the translations are saved on the lines and the voice languages of the book are the languages used.

### Rules
- A character cannot exist without a voice and the reverse. A character cannot be removed while one of its lines exists.
- The narrator is a character with its own role (`is_narrator`), created by default, removable. A character that is both adult and child is two characters.
- A voice without a reader, a silent page, a blank page and the draft are validated on the server. The interface reflects them through a composable.
- A wordless book has no voice by default (silent book). A comic keeps the panels editor inside the page step, collapsed under "Panels".
- Drafts do not count in the free plan limit (12 books); the book counts when it is sent.

### Enforced server side
- Creating a book: `books.edit` permission and the plan limit at send. A relative can only create a book read by themselves.
- Assigning a voice: the reader must belong to the family, speak the language, and be an adult. Open proposals are limited to the family.
- A page is `image` (file or none) and `voice` (with or without); `kind` values `empty`/`cover`/`content` are replaced by these two flags plus a cover flag.

### States
- Empty: first visit shows the cover step with the title focused.
- Draft: a saved draft offers "Resume" or "Discard". The draft is saved at each "Next page" and by "Save draft"; it is stored on the server (book in `draft` status, not counted in the limit) with a local copy for offline use.
- Loading: the photo sheet shows an upload spinner; "Send" shows a busy state.
- Error: inline message with a retry; plan limit message (`plan_book_limit`); offline notice with the local draft kept.
- Offline: pages and voices can be written, the send waits for the connection.

### Interactions and animations
- Chips are toggles with `aria-pressed`. The main action of each step is yellow with relief; secondary actions are neutral. Moving to the next page slides the screen.
- Keyboard and TV remote: logical focus order, visible focus, Back goes to the previous step.

### Responsive
Checked at 320, 390, 1180 and 1600 px wide, portrait and landscape: no horizontal scroll, targets of 44 px or more, the action bar stays reachable.

## 2. Gaps between the mockups and the existing behavior (to confirm)
1. **"Later"** is in the prototype and the issue but not in the static `Page` mockup: kept.
2. **AI translation** option is shown only when the AI flag is on (the AI domain is postponed).
3. **Voice color**: the mockups have none, the PRD requires one per character. Proposal: automatic, shown as a dot in the review, editable in the character line of the review.
4. **Description on a voice**: stored on the line as the tone or playing instruction (per use), not on the character. A character description (for the AI) stays in the review.
5. **ISBN scan** moves into "More details" (issue #169) instead of the first screen added earlier; a "Scan a barcode" shortcut stays visible on the cover step. To confirm.
6. **Comic panels and page title** are not in the mockups: kept inside the page step, collapsed.
7. **Draft on the server** (a book in `draft` status) rather than only local storage, so that it is validated by the server and can be resumed on another device.
8. **Relatives**: voice assignment hidden, single reader, several characters allowed (all read by the relative).
9. **Blank page versus silent page** are two independent choices (image and voice), which replaces the current `empty` page kind.

## 3. Data model and server (for the second batch)
- `book_pages`: image optional (already), `is_silent boolean`, `is_cover boolean` (cover is page 0 with the cover image); remove the `empty` kind.
- `characters`: `member_id` (reader, nullable), `assignment` in (`relative`, `ai`, `open`, `later`), a unique reader per character. Lines inherit the reader from the character. Migration keeps existing `lines.member_id` and `book_voices` by copying the most frequent reader per character.
- Draft: `books.status = 'draft'`, saved by `PATCH` at each step, excluded from the plan limit; promoted to `to_record` at send.
- Requests: reuse the recording request notifications (#109) for `relative` and `open`; `later` creates nothing until assigned; AI translation reuses the translation path.

## 4. Design audit checklist
- [ ] One main action per screen.
- [ ] Secondary buttons visible with an icon.
- [ ] Targets of 44 px or more, rem sizes, wrapping text, no overflow at any text size.
- [ ] Keyboard reachable with visible focus ring, native buttons for remote use.
- [ ] prefers-reduced-motion respected.
- [ ] Light and dark themes both readable (contrast 4.5:1 or more).
- [ ] Every string goes through i18n (9 locales).

## 5. Tests
- `30-book-draft.spec.ts` and the creation specs updated to the new flow.
- New cases: silent book (no voice), credits page (blank and silent), voice assigned "later", draft resumed, plan limit refused at send, relative proposal.
