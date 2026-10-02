# Child reader (`/kid/listen/[id]`)

Routes: /kid/listen/[id]

The child listens to a book with no text or scan on screen: who reads, previous, pause, next, page turn with the ding, sleep timer and resume.

## 1. What the page must do

### Per role
- Child: language flags (unless locked by a parent), previous page, pause, next page, progress bar, sleep timer, resume where stopped.
- Parent: same, and can unlock the language lock with a code.
- Relative: no access.

### Enforced server side
- The playback plan, the book payload and the files endpoint expose approved audio only.
- Scans are never exposed to the child: the page file id is null and a scan request answers 403.

### States
- End of book: Maki, restart and back.
- Loading: skeleton or the shared loading text, never a blank screen.
- Error: a short sentence from the server message map with a retry action.
- Offline: cached data stays readable; actions that need the network are disabled with the reason shown.

### Interactions and animations
- Page turn: a realistic folding page and the ding when a page is turned by hand; skipped under reduced motion.
- The main action wiggles for about 3 seconds and stops.
- Previous and skip buttons are reachable by keyboard and D-pad.

## 2. Design audit checklist
- [ ] One main action per screen, highlighted (main color, relief, gentle wiggle that stops after a few seconds).
- [ ] Secondary buttons visible, with an icon.
- [ ] Big childlike icons from the single icon set; a micro-animation on every interaction.
- [ ] No overflow at any text size (up to Maximum), in Arabic right-to-left and with long words, at 320, 390, 1180 and 1600 px.
- [ ] Keyboard, TV remote (D-pad) and touch: logical focus order, visible focus, targets of 48 px or more (child 66 px).
- [ ] `prefers-reduced-motion` respected.
- [ ] Fredoka (titles, buttons) and Nunito (text), hard shadow `3px 3px 0 #1F1B3A`.
