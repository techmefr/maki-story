# Profiles

## Behavior
- Unlock by role: symbol pad for a child, PIN pad for adults (4 to 8 digits chosen by the adult).
- A wrong symbol code shakes the pad with the mascot, no error text. A child with the code disabled enters directly.
- Parents see a banner on home inviting them to add missing child birth dates.

## Design audit checklist
- One main action, visible secondary buttons with icon
- Big childlike icons, micro-animations
- No overflow at any text size, keyboard and remote focus
- prefers-reduced-motion respected
- Fredoka and Nunito, hard shadow 3px 3px 0 #1F1B3A

## Personal device mode
- A parent can mark the current device as personal from the profile menu (toggle). The app then opens straight on that parent's profile and skips the profile picker and the code.
- Switching profile and opening the family area ask the parent's code (or biometrics) again; the unlock sheet appears over the home page. After the idle delay the personal profile is restored.
- Turning the toggle off is one tap. A parent can also revoke the device from the devices page, after which the device falls back to the picker.
- Never offered to a child profile (refused server side).
