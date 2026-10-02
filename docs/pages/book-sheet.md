# Book sheet (`/home (sheet) and /kid/library (sheet link)`)

Title, subtitle, author, age tag and the "read by" section listing every relative who recorded a voice.

## 1. What the page must do

### Per role
- Child: sees title, age tag and readers only, with a play button.
- Parent: sees everything plus visibility, review and sharing entry points.
- Relative: sees the books they take part in, with their own lines.

### Enforced server side
- The sheet reads `books.read`; readers come from approved recordings only for a child.

### States
- Empty: no reader yet shows a sentence and, for adults, a record button.
- Loading: skeleton or the shared loading text, never a blank screen.
- Error: a short sentence from the server message map with a retry action.
- Offline: cached data stays readable; actions that need the network are disabled with the reason shown.

### Interactions and animations
- Reader dots use the person colors; the play button pulses once on open.

## 2. Design audit checklist
- [ ] One main action per screen, highlighted (main color, relief, gentle wiggle that stops after a few seconds).
- [ ] Secondary buttons visible, with an icon.
- [ ] Big childlike icons from the single icon set; a micro-animation on every interaction.
- [ ] No overflow at any text size (up to Maximum), in Arabic right-to-left and with long words, at 320, 390, 1180 and 1600 px.
- [ ] Keyboard, TV remote (D-pad) and touch: logical focus order, visible focus, targets of 48 px or more (child 66 px).
- [ ] `prefers-reduced-motion` respected.
- [ ] Fredoka (titles, buttons) and Nunito (text), hard shadow `3px 3px 0 #1F1B3A`.
