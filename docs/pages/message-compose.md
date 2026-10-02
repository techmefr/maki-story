# Message compose and listen

Routes: /message/[toId], /message/listen/[id]

## Behavior
- Only parents and relatives can send a voice message; the recipient must be a child of the family (server enforced: child sender 403, non child recipient 400).
- A child can listen but has no reply button (no child to relative reply yet).
- Empty, loading, error and offline states follow the shared components.

## Design audit checklist
- One main action, visible secondary buttons with icon
- Big childlike icons, micro-animations
- No overflow at any text size, keyboard and remote focus
- prefers-reduced-motion respected
- Fredoka and Nunito, hard shadow 3px 3px 0 #1F1B3A
