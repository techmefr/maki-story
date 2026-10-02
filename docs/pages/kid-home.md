# Child home

## Behavior
- Child: relatives faces, message bubble when an active message waits (birthday messages get a dashed outline and their own label).
- On the child birthday (device timezone, birth date known) a light CSS/SVG party opens once per year; closing it records the year server side. Reduced motion shows a static version.
- Loading, empty and offline states follow the shared components.

## Design audit checklist
- One main action, visible secondary buttons with icon
- Big childlike icons, micro-animations
- No overflow at any text size, keyboard and remote focus
- prefers-reduced-motion respected
- Fredoka and Nunito, hard shadow 3px 3px 0 #1F1B3A
