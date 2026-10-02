# Guided first launch (`/welcome`)

## 1. What the page must do
- Reached right after `/register` (account, family and first parent are created there). Four short steps with a progress label ("Step n of 4") and a four-segment bar: parent code, children, first invitation, done.
- Step 1, parent code: the parent profile is unlocked through the shared profile unlock component (numeric code typed twice, or biometrics offered when the device supports them). No "switch profile" button here.
- Step 2, children: add one or more children (first name, birth date, photo, code with the symbol option). Added children are listed with a check. "Continue" is disabled until one child exists; "Skip" is always available. Birth date is parent-only data and never leaves the family.
- Step 3, invitation: the shared invitation form (WhatsApp, SMS, e-mail or link). The button reads "Later" until an invitation exists, then "Continue". Inviting can be skipped.
- Step 4, done: friendly empty-state scene and one main button to the parent home.
- Roles: parent only (the account just created). The route is exempt from the "choose a profile first" redirect so step 1 can run.
- States: loading (members not yet there: "One moment"), error per step (child not added, invitation not created), offline (calls fail with the usual error message, nothing is lost: already created children stay).
- Responsive: single narrow column from 320 px; RTL mirrors icons and bar; large text sizes wrap.

## 2. Design audit checklist
- [x] One main action per step (continue / add the child / finish).
- [x] Secondary buttons visible with an icon (skip, later, copy, share).
- [x] Big childlike icons, micro-animations (floating mascot, bouncing icons).
- [x] No overflow at any text size (checked at the maximum size in right-to-left).
- [x] Keyboard and remote focus, visible focus ring, headings take focus per step.
- [x] `prefers-reduced-motion` respected (progress bar transition disabled).
- [x] Fredoka and Nunito, hard shadow `3px 3px 0 #1F1B3A`.
