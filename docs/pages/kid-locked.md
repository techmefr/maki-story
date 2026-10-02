# Lock screen

Routes: /kid/locked

Sleeping maki shown outside the allowed hours or on a manual block. No text on the picture.

## Behaviour per role
- Child: sees the sleeping maki and an unlock button.
- Unlock opens a parent code gate: a correct code grants a 30 minute override, audited as member.access.override, and needs a connection.

## States
Computed locally from the cached schedule when offline, using the device timezone. The current page is finished before the lock applies.

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
