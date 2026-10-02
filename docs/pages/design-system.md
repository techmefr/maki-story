# Design system

Shared components consumed by every screen. Issues: #73 (buttons and form controls), #78 (empty states), #80 (fonts).

## 1. What the system must do

### Buttons: `AppButton`
One component, never a raw `.btn` class in a template.

| Variant | Look | Use |
| --- | --- | --- |
| `primary` | yellow, relief, hard shadow `3px 3px 0 #1F1B3A` (large variant 5px), 56px high | ONE per screen: the action that moves forward, always at the same place, bottom, full width (`is-block`) |
| `secondary` | pastel background (`tone`: sky, mint, grape, pink) + icon + 3px border + hard shadow | everything else; an action that skips a step is secondary; never white, never yellow |
| `tertiary` | text link with icon, no box | cancel and back |
| `destructive` | coral/alert color | deletion, always behind a parent confirmation |

Props: `variant`, `size` (`md`, `sm`), `tone`, `icon`, `is-block`, `is-round`, `loading`, `disabled`, `disabled-reason`, `wiggle`, `to` (renders a router link), `as` (`a`, `label`), `type` (`submit`).

States:
- disabled: grey background, grey border, no shadow, `not-allowed` cursor. When `disabled-reason` is set the reason is shown inside the button under the label.
- loading: spinner replaces the icon, the button is inert and `aria-busy`.
- focus: global visible outline (3px ink + sky halo).
- tap zone: `--tap` is 48px; kid screens use `--tap-kid` 66px; `btn--big` for the reader.
- wiggle (`wiggle` prop, J5): 3 iterations (about 3 seconds) then stops, disabled under `prefers-reduced-motion`.

### Back pattern: `BackLink`
The only back control: a tertiary `AppButton` with the back icon and the `common.back` label (slot overrides the text).

### Selection
- Neutral choices (book type, mode, age range, language): the single `chip--on` / `selected` style (ink background, cream text) with `aria-pressed`.
- Person chips keep the person color (`MemberPicker`, voice dots).

### Form controls
- `AppToggle`: switch (`role="switch"`), colored when on, label in the default slot.
- `AppCheckbox`: boolean or array model (`value`), `role="checkbox"`, hard-shadow box with a check icon.
- `AppSlider`: `role="slider"`, pointer + keyboard (arrows, Home, End), optional `start-icon` / `end-icon` (speaker icons for volume), RTL aware.
- `AppSelect`: `role="combobox"` + listbox, keyboard (arrows, Enter, Escape), outside click closes. Generic over the option value. Give it an `aria-label` or `aria-labelledby`.
- Zero `type="checkbox"`, `type="range"` or `<select` in `app/` (enforced by `tests/e2e/23-design-system.spec.ts`).

### Empty states: `AppEmpty`
One component for every empty state: animated Maki scene, short title, optional hint (`hint-child` adapts the text to a child profile), action buttons in the default slot.
- `kind`: `generic`, `library`, `notifications`, `offline`, `messages`, `proposals`, `treasure`, `locked`, `people`. It picks the scene prop (icon badge). Inactive kinds (notifications, offline, locked) use a grey badge.
- Animation is pure CSS on the existing Maki SVG: no heavy dependency, no network request. It is paused through `IntersectionObserver` while offscreen and static under `prefers-reduced-motion`.
- Decision: no Lottie/dotLottie player yet (a player is 150KB+ and no Lottie assets exist). The `kind` prop is the stable contract; a dotLottie file can be lazy-loaded inside the component later without touching the screens.

### Typography
- Fredoka 500/600/700 (titles, buttons) and Nunito 500/700/800 (text), latin subset woff2, self-hosted in `public/fonts`, `font-display: swap`, 6 files, about 97KB total, first two preloaded, all precached by `public/sw.js`.
- Optional learning-to-read font Andika 400/700 (about 39KB, fetched only when the setting is on and the family is used). Toggle `profile.menu.learningFont` in the profile menu (`useLearningFont`, stored on the device, `data-learning-font` on `<html>`), applied to the child reader and `.learn-text`.
- Arabic and Chinese keep their system fallback stacks.
- No request to fonts.googleapis.com or fonts.gstatic.com.

### Shadow
`--shadow: 3px 3px 0 var(--ink)` (ink is `#1F1B3A`), `--shadow-lg` only for the primary button.

## 2. Screens migrated
All buttons in `app/` use `AppButton`; native checkbox/range/select replaced in the profile menu (sounds), child parental schedule, share dialog, book steps, AI book form, studio, translate, sharing and book filters. `AppEmpty` carries a `kind` on every usage and the notifications page.

## 3. Still to do by the per-screen issues
- At most one primary per route: signed-out pages are checked by test; the other screens are to be audited by the screen issues (#74-#76 and following).
- Replace the remaining `.chip--on` ad hoc inline backgrounds (feedback moods keep their mood color on purpose).
- Optional dotLottie scenes.

## 4. Design audit checklist
- [x] One main action: single `primary` variant, others `secondary`/`tertiary`
- [x] Secondary buttons visible, pastel, with icon support
- [x] Big childlike icons (`btn--big`, `btn--tile` for the reader)
- [x] Micro-animations: press-in, icon wiggle on hover, primary wiggle (stops), empty-state float
- [x] No overflow at any text size (`overflow-wrap: anywhere`, rem sizing)
- [x] Keyboard + remote focus: all controls are real buttons with roles, arrow keys on slider and select
- [x] `prefers-reduced-motion`: wiggle, spinner and empty animation disabled
- [x] Fredoka / Nunito, hard shadow `3px 3px 0 #1F1B3A`
