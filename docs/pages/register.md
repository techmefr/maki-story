# Register

Routes: /register

Account creation.

## Behaviour per role
- Visitor: creates the family account; a signed-in member is redirected.

## States
Idle, submitting, validation errors, offline message.

## Responsive
Checked at 320, 390, 1180 and 1600 px wide, portrait and landscape: no horizontal scroll, targets of 48 px or more, bottom bar or header stay reachable.

## Keyboard and remote
Tab order follows the visual order, arrow keys and a TV remote D-pad move focus spatially, Back or Escape (remote mode) goes back, Enter activates.

## Design audit checklist
- [x] One main action per screen.
- [x] Secondary buttons visible with an icon.
- [x] Targets of 48 px or more, rem sizes, wrapping text, no overflow at any text size.
- [x] Keyboard reachable with visible focus ring, native buttons for remote use.
- [x] prefers-reduced-motion respected.
- [x] Light and dark themes both readable (contrast 4.5:1 or more).
- [x] Every string goes through i18n (9 locales).
