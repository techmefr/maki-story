# Treasure box (`/kid/treasure`)

The box of at most 10 permanent voice memories of a child.

## 1. What the page must do

### Per role
- Child: sees and plays the memories, sees the n/10 counter; cannot remove.
- Parent: opens it with `?child=<id>` from the child profile page, plays, and removes a memory after an explicit confirmation.
- Relative: no access.

### Enforced server side
- `treasure.list` (child, parent), `treasure.save` (child, parent), `treasure.remove` (parent); the 10 limit is enforced by a database trigger with an advisory lock so concurrent hearts never exceed it; the audio is copied into its own file so it survives the purge; family isolation on every query.
- Removal is permanent: the memory row and its audio copy are deleted.
- A memory of a blocked or departed relative is kept unless a parent removes it.

### States
- Empty: Maki with a heart and a sentence adapted to the role.
- Loading: skeleton or the shared loading text, never a blank screen.
- Error: a short sentence from the server message map with a retry action.
- Offline: cached data stays readable; actions that need the network are disabled with the reason shown.

### Interactions and animations
- The heart fills, then explodes into heart confetti with a small sound (no animation under reduced motion); a full box disables the heart and shows the reason.

## 2. Design audit checklist
- [ ] One main action per screen, highlighted (main color, relief, gentle wiggle that stops after a few seconds).
- [ ] Secondary buttons visible, with an icon.
- [ ] Big childlike icons from the single icon set; a micro-animation on every interaction.
- [ ] No overflow at any text size (up to Maximum), in Arabic right-to-left and with long words, at 320, 390, 1180 and 1600 px.
- [ ] Keyboard, TV remote (D-pad) and touch: logical focus order, visible focus, targets of 48 px or more (child 66 px).
- [ ] `prefers-reduced-motion` respected.
- [ ] Fredoka (titles, buttons) and Nunito (text), hard shadow `3px 3px 0 #1F1B3A`.
