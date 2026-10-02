# Message listen

## Behavior
- Child only. The message stays listenable (replay allowed) for 24 hours after the first listen, then expires server side and is purged.
- One active message per relative per child and per kind; the sender sees why a new one is blocked.
- No reply button.

## Design audit checklist
- One main action, visible secondary buttons with icon
- Big childlike icons, micro-animations
- No overflow at any text size, keyboard and remote focus
- prefers-reduced-motion respected
- Fredoka and Nunito, hard shadow 3px 3px 0 #1F1B3A
