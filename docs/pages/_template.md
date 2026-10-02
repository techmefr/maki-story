# <Screen title> (`<route>`)

<One sentence: what the screen is for.>

## 1. What the page must do

### Per role
- Child: <what the child sees and can do, or "no access">
- Parent: <...>
- Relative: <...>

### Enforced server side
- <the permission or ownership check that protects every route the screen calls>

### States
- Empty: <Lottie empty state, sentence, main button when useful>
- Loading:
- Error:
- Offline:

### Interactions and animations
- <micro-animation, sound cue, gestures, keyboard and remote behavior>

### Responsive
- <portrait and landscape at 320, 390, 1180, 1600 px>

## 2. Design audit checklist
- [ ] One main action per screen, highlighted (main color, relief, gentle wiggle that stops after a few seconds).
- [ ] Secondary buttons visible, with an icon.
- [ ] Big childlike icons from the single icon set; a micro-animation on every interaction.
- [ ] No overflow at any text size (up to Maximum), in Arabic right-to-left and with long words, at 320, 390, 1180 and 1600 px.
- [ ] Keyboard, TV remote (D-pad) and touch: logical focus order, visible focus, targets of 48 px or more (child 66 px).
- [ ] `prefers-reduced-motion` respected.
- [ ] Fredoka (titles, buttons) and Nunito (text), hard shadow `3px 3px 0 #1F1B3A`.
