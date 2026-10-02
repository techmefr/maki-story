# Book player (adults) (`/books/[id]/play`)

Adult player of a whole book with a segment per line and a playback rate.

## 1. What the page must do

### Per role
- Child: uses the child reader (`kid-listen`).
- Parent: plays any line, jumps between lines, changes the rate.
- Relative: plays books they take part in.

### Enforced server side
- Audio files are served only if `assertFileReadable` allows them for the profile.

### States
- Empty: no recording yet shows a sentence.
- Loading: skeleton or the shared loading text, never a blank screen.
- Error: a short sentence from the server message map with a retry action.
- Offline: cached data stays readable; actions that need the network are disabled with the reason shown.

### Interactions and animations
- The blob around the avatar follows playback; segments are tap targets of 48 px.

## 2. Design audit checklist
- [ ] One main action per screen, highlighted (main color, relief, gentle wiggle that stops after a few seconds).
- [ ] Secondary buttons visible, with an icon.
- [ ] Big childlike icons from the single icon set; a micro-animation on every interaction.
- [ ] No overflow at any text size (up to Maximum), in Arabic right-to-left and with long words, at 320, 390, 1180 and 1600 px.
- [ ] Keyboard, TV remote (D-pad) and touch: logical focus order, visible focus, targets of 48 px or more (child 66 px).
- [ ] `prefers-reduced-motion` respected.
- [ ] Fredoka (titles, buttons) and Nunito (text), hard shadow `3px 3px 0 #1F1B3A`.
