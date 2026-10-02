# Relative home (`/relative`)

Routes: /relative

Home of a relative account across the families it belongs to.

## 1. What the page must do

### Per role
- Relative account: sees the memberships and opens a family.
- Others: redirected to their home.

### States
- Empty, loading, error, offline.

### Responsive
- Checked at 320, 390, 1180 and 1600 px, portrait and landscape.

## 2. Design audit checklist
- [x] One main action per screen.
- [x] Secondary buttons visible with an icon.
- [x] Keyboard, TV remote and touch: logical focus order, targets of 48 px or more.
- [x] prefers-reduced-motion respected.
- [x] Every string goes through i18n.
