# Child home (`/kid`)

The relatives page: a card per person with a ring, a chest icon to the treasure box, and the multi voice library entry.

## 1. What the page must do

### Per role
- Child: one tap on a person plays their message at once; without a message it opens that person stories; coloured ring when unheard, grey when all heard, no ring after expiry.
- Parent: can preview the page from the profile selector.
- Relative: no access.

### Birthday
- On the child birthday (device timezone) a light CSS/SVG party opens once per year; closing it records the year server side; reduced motion shows a static version.
- A birthday message has a dashed outline on its bubble.

### Enforced server side
- `messages.list` returns only messages to or from the profile; expired messages are purged before listing; the schedule lock sends the child to the lock screen.

### States
- Empty: nobody in the family yet, with a sentence for a grown-up.
- Loading: skeleton or the shared loading text, never a blank screen.
- Error: a short sentence from the server message map with a retry action.
- Offline: cached data stays readable; actions that need the network are disabled with the reason shown.

### Interactions and animations
- The unheard ring glows gently (off under reduced motion); the chest floats; the list refreshes every 10 seconds.

## 2. Design audit checklist
- [ ] One main action per screen, highlighted (main color, relief, gentle wiggle that stops after a few seconds).
- [ ] Secondary buttons visible, with an icon.
- [ ] Big childlike icons from the single icon set; a micro-animation on every interaction.
- [ ] No overflow at any text size (up to Maximum), in Arabic right-to-left and with long words, at 320, 390, 1180 and 1600 px.
- [ ] Keyboard, TV remote (D-pad) and touch: logical focus order, visible focus, targets of 48 px or more (child 66 px).
- [ ] `prefers-reduced-motion` respected.
- [ ] Fredoka (titles, buttons) and Nunito (text), hard shadow `3px 3px 0 #1F1B3A`.
