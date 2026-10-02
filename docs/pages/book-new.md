# Create a book (`/books/new`)

Step by step creation of a book filled by hand: book, pages, characters, lines, review.

## 1. What the page must do

### Per role
- Child: no access.
- Parent: full wizard, simple or casting mode, optional AI pre-fill from a photo.
- Relative: proposes a single voice book read by themselves; the AI card is hidden.

### Enforced server side
- `books.create`; a relative can only create a book read by themselves; the family is taken from the session.

### States
- Empty: pages can be left empty and skipped.
- Loading: skeleton or the shared loading text, never a blank screen.
- Error: a short sentence from the server message map with a retry action.
- Offline: cached data stays readable; actions that need the network are disabled with the reason shown.

### Interactions and animations
- Draft is kept locally between steps; the primary action is always bottom, full width.

## 2. Design audit checklist
- [ ] One main action per screen, highlighted (main color, relief, gentle wiggle that stops after a few seconds).
- [ ] Secondary buttons visible, with an icon.
- [ ] Big childlike icons from the single icon set; a micro-animation on every interaction.
- [ ] No overflow at any text size (up to Maximum), in Arabic right-to-left and with long words, at 320, 390, 1180 and 1600 px.
- [ ] Keyboard, TV remote (D-pad) and touch: logical focus order, visible focus, targets of 48 px or more (child 66 px).
- [ ] `prefers-reduced-motion` respected.
- [ ] Fredoka (titles, buttons) and Nunito (text), hard shadow `3px 3px 0 #1F1B3A`.
