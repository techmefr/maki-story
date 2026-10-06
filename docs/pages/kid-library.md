# Child library (`/kid/library`)

The family library as the child sees it: only validated books with a recorded voice and a matching age range.

## 1. What the page must do

### Per role
- Child: browses validated books, opens a book to listen, can download a book for offline use.
- Parent: previews the same list; forcing visibility per book is done on the book sheet.
- Relative: no access.

### Enforced server side
- The list is the child scope of `books.list`: validated, voiced, inside the age range (no bound when empty), `childVisible` overrides.
- Scans and page images are never in the payload.

### Browsing
- A search entry opens the type, mood and theme chooser; a "who reads" chip row filters by relative voice; a segmented control switches between all, by voice, by mood and by theme.

### States
- Empty: library empty state, "ask a grown-up to record one".
- Loading: skeleton or the shared loading text, never a blank screen.
- Error: a short sentence from the server message map with a retry action.
- Offline: cached data stays readable; actions that need the network are disabled with the reason shown.

### Interactions and animations
- Cards pop in; the status strip stays on top on tablets.

## 2. Design audit checklist
- [ ] One main action per screen, highlighted (main color, relief, gentle wiggle that stops after a few seconds).
- [ ] Secondary buttons visible, with an icon.
- [ ] Big childlike icons from the single icon set; a micro-animation on every interaction.
- [ ] No overflow at any text size (up to Maximum), in Arabic right-to-left and with long words, at 320, 390, 1180 and 1600 px.
- [ ] Keyboard, TV remote (D-pad) and touch: logical focus order, visible focus, targets of 48 px or more (child 66 px).
- [ ] `prefers-reduced-motion` respected.
- [ ] Fredoka (titles, buttons) and Nunito (text), hard shadow `3px 3px 0 #1F1B3A`.
