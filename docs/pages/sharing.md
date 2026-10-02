# Sharing (`/sharing`)

Invite code, books shared with other families, approvals and proposals.

## 1. What the page must do

### Per role
- Child: no access.
- Parent: manages the invite code, approves, shares and stops sharing.
- Relative: sees what concerns them and proposes books.

### Enforced server side
- `shares.*` permissions; every query checks both families; a book is shared with at most 10 families; scans are never sent.

### States
- Empty: nothing shared yet with a main button.
- Loading: skeleton or the shared loading text, never a blank screen.
- Error: a short sentence from the server message map with a retry action.
- Offline: cached data stays readable; actions that need the network are disabled with the reason shown.

### Interactions and animations
- Revoking an invite asks for confirmation.

## 2. Design audit checklist
- [ ] One main action per screen, highlighted (main color, relief, gentle wiggle that stops after a few seconds).
- [ ] Secondary buttons visible, with an icon.
- [ ] Big childlike icons from the single icon set; a micro-animation on every interaction.
- [ ] No overflow at any text size (up to Maximum), in Arabic right-to-left and with long words, at 320, 390, 1180 and 1600 px.
- [ ] Keyboard, TV remote (D-pad) and touch: logical focus order, visible focus, targets of 48 px or more (child 66 px).
- [ ] `prefers-reduced-motion` respected.
- [ ] Fredoka (titles, buttons) and Nunito (text), hard shadow `3px 3px 0 #1F1B3A`.
