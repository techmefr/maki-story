# Device permissions (/permissions)

Routes: /permissions

Explains why the microphone, camera and notifications are needed and lets the user allow each one.

## Behaviour per role
- Parent: each permission can be requested; continue goes to the next path from the query (checked as safe), else /home.
- Relative: same, the default target is /relative.
- Child: same as the parent.
Permissions can be skipped.

## States
Each row shows allow, allowed, denied or unsupported with a hint. Granted and unsupported rows have the button disabled. No API call, so offline has no effect.

## Design audit checklist
- [x] One main action per screen.
- [x] Secondary buttons visible with an icon.
- [x] Targets of 44 px or more, rem sizes, wrapping text, no overflow at any text size.
- [x] Keyboard reachable with visible focus ring, native buttons for remote use.
- [x] prefers-reduced-motion respected.
- [x] Every string goes through i18n (9 locales).
