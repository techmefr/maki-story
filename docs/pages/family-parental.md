# Parental control (/family/parental)

Routes: /family/parental

Lets a parent set a usage schedule for each child: enabled flag, days and hours.

## Behaviour per role
- Parent: per child, toggles the rule, picks days (week, weekend and all presets) and from and to hours, reads a summary sentence, then saves (permission members.schedule.manage, child targets only).
- Child and relative: refused by the API (403).

## States
Empty state when there is no child. The save button shows saved after success and is disabled while busy. Error message when saving fails. Controls are disabled when the rule is off. Offline is not handled specifically.

## Design audit checklist
- [x] One main action per screen.
- [x] Secondary buttons visible with an icon.
- [x] Targets of 44 px or more, rem sizes, wrapping text, no overflow at any text size.
- [x] Keyboard reachable with visible focus ring, native buttons for remote use.
- [x] prefers-reduced-motion respected.
- [x] Every string goes through i18n (9 locales).

## Homework follow-up
- A toggle per child turns homework follow-up on or off (off by default).
