# AI book generation (`/books/ai`)

Generate a full draft book from an idea, always passing moderation before the parent.

## 1. What the page must do

### Per role
- Child: no access.
- Parent: enters an idea and a sheet of characters, sees the quota, gets a draft to validate.
- Relative: sees a "parents only" notice.

### Enforced server side
- `ai.use` (parent only); monthly quota per family; every generated text and image is moderated and journaled before display.

### States
- Unavailable: the AI is not configured, with a clear sentence.
- Loading: skeleton or the shared loading text, never a blank screen.
- Error: a short sentence from the server message map with a retry action.
- Offline: cached data stays readable; actions that need the network are disabled with the reason shown.

### Interactions and animations
- The sparkles icon is reserved for AI features.

## 2. Design audit checklist
- [ ] One main action per screen, highlighted (main color, relief, gentle wiggle that stops after a few seconds).
- [ ] Secondary buttons visible, with an icon.
- [ ] Big childlike icons from the single icon set; a micro-animation on every interaction.
- [ ] No overflow at any text size (up to Maximum), in Arabic right-to-left and with long words, at 320, 390, 1180 and 1600 px.
- [ ] Keyboard, TV remote (D-pad) and touch: logical focus order, visible focus, targets of 48 px or more (child 66 px).
- [ ] `prefers-reduced-motion` respected.
- [ ] Fredoka (titles, buttons) and Nunito (text), hard shadow `3px 3px 0 #1F1B3A`.
