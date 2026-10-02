# Record a shared book (`/sharing/[id]`)

A relative of another family records lines of a shared book from texts, descriptions and characters only.

## 1. What the page must do

### Per role
- Child: no access.
- Parent: records or reviews lines for the shared book.
- Relative: records their lines, replays, sends or cancels.

### Enforced server side
- `shares.record`; the recipient receives no scan; each take goes through parent validation.

### States
- Empty: no line left to record.
- Loading: skeleton or the shared loading text, never a blank screen.
- Error: a short sentence from the server message map with a retry action.
- Offline: cached data stays readable; actions that need the network are disabled with the reason shown.

### Interactions and animations
- Record, replay and send follow the studio pattern.

## 2. Design audit checklist
- [ ] One main action per screen, highlighted (main color, relief, gentle wiggle that stops after a few seconds).
- [ ] Secondary buttons visible, with an icon.
- [ ] Big childlike icons from the single icon set; a micro-animation on every interaction.
- [ ] No overflow at any text size (up to Maximum), in Arabic right-to-left and with long words, at 320, 390, 1180 and 1600 px.
- [ ] Keyboard, TV remote (D-pad) and touch: logical focus order, visible focus, targets of 48 px or more (child 66 px).
- [ ] `prefers-reduced-motion` respected.
- [ ] Fredoka (titles, buttons) and Nunito (text), hard shadow `3px 3px 0 #1F1B3A`.
