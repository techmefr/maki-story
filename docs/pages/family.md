# Family (parent only)

Routes: /family, /family/[id]

## Behavior
- The Family tab and the pages /family and /storage are parent only: hidden in the tab bar and redirected to /home for relatives, and the profile switcher reloads the code state through a profile-less session.
- GET /api/members returns the code state (hasCode, codeKind, isCodeLocked, status) to parents and to the profile selector only; relatives get those fields neutralized.

## Design audit checklist
- One main action, visible secondary buttons with icon
- Big childlike icons, micro-animations
- No overflow at any text size, keyboard and remote focus
- prefers-reduced-motion respected
- Fredoka and Nunito, hard shadow 3px 3px 0 #1F1B3A
