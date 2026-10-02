# Home library (`/home`)

Parent and relative home: the family library, book filters, proposals and the entry points to create a book.

## 1. What the page must do

### Per role
- Child: redirected to the child home (`/kid`); the route is not reachable.
- Parent: sees every book, drafts and books being recorded, the new book button, the AI creation button and the unread message banner.
- Relative: sees books they take part in and their own proposals; the AI button is hidden.

### Enforced server side
- `books.list` filters books by family and by role scope; AI creation needs `ai.use` (parent only).

### States
- Empty: library empty state with a sentence adapted to the filter and a main button.
- Loading: skeleton or the shared loading text, never a blank screen.
- Error: a short sentence from the server message map with a retry action.
- Offline: cached data stays readable; actions that need the network are disabled with the reason shown.

### Interactions and animations
- Filters (name, author, type, mood, theme, language) update the list without a reload.
- The new book button is disabled with the reason when offline.

## 2. Design audit checklist
- [ ] One main action per screen, highlighted (main color, relief, gentle wiggle that stops after a few seconds).
- [ ] Secondary buttons visible, with an icon.
- [ ] Big childlike icons from the single icon set; a micro-animation on every interaction.
- [ ] No overflow at any text size (up to Maximum), in Arabic right-to-left and with long words, at 320, 390, 1180 and 1600 px.
- [ ] Keyboard, TV remote (D-pad) and touch: logical focus order, visible focus, targets of 48 px or more (child 66 px).
- [ ] `prefers-reduced-motion` respected.
- [ ] Fredoka (titles, buttons) and Nunito (text), hard shadow `3px 3px 0 #1F1B3A`.
