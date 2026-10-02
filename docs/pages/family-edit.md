# Family member edit

## Behavior
- Parent only. Child form: birth date (optional, never in the future) and a toggle asking the child for a code; off means the child enters without one.
- Code field by role: children pick 4 symbols (6 symbols with color, repeats allowed), adults type a 4 to 8 digit PIN.
- Code admin: state label (digits, symbols, disabled, none), enable or disable for a child, unlock, remove.
- Relatives never receive the birth date, only the computed age.

## Design audit checklist
- One main action, visible secondary buttons with icon
- Big childlike icons, micro-animations
- No overflow at any text size, keyboard and remote focus
- prefers-reduced-motion respected
- Fredoka and Nunito, hard shadow 3px 3px 0 #1F1B3A
