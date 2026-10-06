# Message player (`/message/listen/[id]`)

Stories-like playback of voice messages: one focal point (sender avatar, name and one large play button), progress bar attached to the player, waveform only while playing, small secondary previous and next controls shown only with several messages, a back control at the top start, a small treasure heart near the avatar, a replay button at the end, swipe as a bonus.

## 1. What the page must do

### Per role
- Child: taps a person, the message plays at once with no text; replay is free until expiry; swipe or buttons go to the previous and next message; after the last message the child lands on that relative stories; the heart keeps the message in the treasure box.
- Parent: can listen to any message of the family; listening never starts the 24 hour countdown; the heart saves it for the child.
- Relative: can replay their own message; no heart.

### Enforced server side
- `messages.listen`; only the recipient child starts `firstListenedAt` and `expiresAt` (24 hours after the first listen); refused with 410 after expiry; purge deletes the audio and offline copies.

### States
- Missing or expired: Maki and a short sentence.
- Loading: skeleton or the shared loading text, never a blank screen.
- Error: a short sentence from the server message map with a retry action.
- Offline: cached data stays readable; actions that need the network are disabled with the reason shown.

### Interactions and animations
- Waveform bars and the blob follow playback; left and right arrow keys and swipe move between messages (mirrored in right-to-left); the play control wiggles until it is used, then stops.

## 2. Design audit checklist
- [ ] One main action per screen, highlighted (main color, relief, gentle wiggle that stops after a few seconds).
- [ ] Secondary buttons visible, with an icon.
- [ ] Big childlike icons from the single icon set; a micro-animation on every interaction.
- [ ] No overflow at any text size (up to Maximum), in Arabic right-to-left and with long words, at 320, 390, 1180 and 1600 px.
- [ ] Keyboard, TV remote (D-pad) and touch: logical focus order, visible focus, targets of 48 px or more (child 66 px).
- [ ] `prefers-reduced-motion` respected.
- [ ] Fredoka (titles, buttons) and Nunito (text), hard shadow `3px 3px 0 #1F1B3A`.
