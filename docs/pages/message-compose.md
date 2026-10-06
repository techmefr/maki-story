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

## Update v3
- One active message per relative, per child and per kind (normal, birthday). A new one is refused with a reason until the previous one expires or is deleted.
- Birthday wish: available from 7 days before the birthday, opens the compose screen with the birthday kind. Max 120 s.

## All children
- `/message/all` is available to adults with two or more children: the same recording is sent once per active child through the outbox, the per-child quota is checked first, and a result list (sent, queued, limit reached, blocked, failed) is shown.
- The message listen screen marks a message as listened for any recipient, adults included.
