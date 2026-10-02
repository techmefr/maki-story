# Book activity (`/books/[id]/activity`)

GitHub-home style activity of a book: new voices, comments, validations; a simplified view for the child is not exposed.

## 1. What the page must do

### Per role
- Child: no access.
- Parent: sees the whole activity and what is new since the last visit.
- Relative: sees the activity of books they take part in.

### Enforced server side
- `books.read` plus family scope on the activity query.

### States
- Empty: sentence saying nothing happened yet.
- Loading: skeleton or the shared loading text, never a blank screen.
- Error: a short sentence from the server message map with a retry action.
- Offline: cached data stays readable; actions that need the network are disabled with the reason shown.

### Interactions and animations
- New items are highlighted until read.

## 2. Design audit checklist
- [ ] One main action per screen, highlighted (main color, relief, gentle wiggle that stops after a few seconds).
- [ ] Secondary buttons visible, with an icon.
- [ ] Big childlike icons from the single icon set; a micro-animation on every interaction.
- [ ] No overflow at any text size (up to Maximum), in Arabic right-to-left and with long words, at 320, 390, 1180 and 1600 px.
- [ ] Keyboard, TV remote (D-pad) and touch: logical focus order, visible focus, targets of 48 px or more (child 66 px).
- [ ] `prefers-reduced-motion` respected.
- [ ] Fredoka (titles, buttons) and Nunito (text), hard shadow `3px 3px 0 #1F1B3A`.
