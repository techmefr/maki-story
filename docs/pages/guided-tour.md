# Guided tour (overlay on `/home`, `/family`, `/sharing`, `/vault`, `/family/activity`)

A short, skippable tour for adults that highlights the real screens one step at a time, built on Driver.js. It is not a route: it runs on top of the existing screens from the default layout.

## 1. What the page must do

### Per role
- Child: never shown, never started, no API call. A child profile cannot read or write the tour state.
- Parent: 13 steps: profile selector, library, book creation, recording studio, review, trash, family area, members and invitations, schedule, sharing, treasure box, activity, and where to replay the tour.
- Relative: 5 steps: home with the children, sending a message, recording a book, notifications, and where to replay the tour.

### Start, skip, replay
- Starts automatically once after the first launch: finishing `/welcome` stores the status `pending` for the parent, and the next `/home` load starts the tour.
- Skippable at any step: the close button, the "Skip the tour" button and the Escape key all end it. Finishing or skipping stores the status `done`.
- Replay: the settings sheet has a "Replay the guided tour" button for parents and relatives; replaying never changes the stored status back.
- A step whose anchor is missing on the screen (for example no child yet) is skipped.

### Enforced server side
- `GET /api/tour` and `PUT /api/tour` need a chosen profile and answer 403 for a child profile.
- The status is stored per member in `members.tour_status` (`null`, `pending`, `done`, migration 0063), not in the browser. `PUT` accepts only `pending` and `done`, anything else is a 400.

### States
- Empty: not applicable, the tour only highlights existing screens.
- Loading: the popover appears once the anchor is visible (up to 4 seconds), otherwise the step is skipped.
- Error: a failed status read or write never blocks the app, the tour simply does not start or is not recorded.
- Offline: the status read fails quietly and the tour does not start.

### Interactions and animations
- Steps target stable `data-testid` anchors (`profile-open`, `home-card-*`, `nav-tab-family`, `family-invite`, `family-parental`, `sharing-title`, `vault-counter`, `activity-all`, `settings-open`, `home-kid-cards`, `bell`).
- Focus moves into the popover on each step and Tab stays inside it; the popover is a labelled dialog and the close button has an accessible label. Escape closes.
- `prefers-reduced-motion` turns off the highlight animation, smooth scrolling and the popover fade.
- The popover uses only design tokens, rem sizes, wraps long words and never exceeds the viewport at the largest text size.

### Responsive
- The popover is at most 24 rem wide and always inside the viewport, from 320 px to 1600 px, in both orientations.

## 2. Design audit checklist
- [x] One main action per step (Next, then Finish on the last step).
- [x] Secondary buttons visible (Back, Skip the tour, Close).
- [x] No overflow at any text size (up to Maximum), checked in the e2e suite at the largest size.
- [x] Keyboard: focus moves into the popover, Tab is trapped in it, Escape closes, visible focus ring, targets of 48 px or more.
- [x] `prefers-reduced-motion` respected.
- [x] Light and dark readable: tokens only (paper, ink, ink-soft, yellow, grey-ui), covered by the design audit pairs.
- [x] Every string goes through i18n (9 locales, namespace `tour`).
