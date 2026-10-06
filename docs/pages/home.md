# Home

## Relative section (`/relative`)
### 1. What the page must do
- Landing page of an account that only has relative memberships (log in, or join through an invitation): no family profile selector, no code. The server derives the profile from the active membership.
- One flow mixing every family the account belongs to: for each active membership, the family name, a card per concerned child ("Message for <child>", with child first name and family name), the recording requests (shared books to record and cast lines still without a take) and the relative's own book proposals with their status. A button joins another family.
- Opening a card of another family switches the session to that family (`POST /api/auth/family`) and then opens the message, studio or sharing screen.
- Isolation: only memberships of the account are listed; a membership that is not ACTIVE (left, deceased, blocked) disappears from the flow; a status change by a parent affects only that family. A restricted relative sees only the children selected in the invitation and cannot message the others.
- States: empty (no family yet, with a hint to ask for an invitation), loading, error, offline (the error message is shown).
- Responsive: cards stack on a single column, two columns from tablet width.

### 2. Design audit checklist
- [x] One main action per card (message, record).
- [x] Secondary button "Join another family" visible with an icon.
- [x] Big icons, wiggle micro-animation on the message icon.
- [x] No overflow at any text size, keyboard and remote focus.
- [x] `prefers-reduced-motion` respected.
- [x] Fredoka and Nunito, hard shadow `3px 3px 0 #1F1B3A`.

## Adult home (`/home`)
- First row: children bar with an All children bubble then one bubble per child. Tapping a bubble starts a live recording, tapping it again stops and sends. Each child quota and block rule applies, and a result per child (sent, queued, limit reached, blocked, failed) is announced.
- Below: cards with icon, number and label from `GET /api/home/counts`. Parent: proposals, started, to record, recorded, to review, trash, each opening `/library?status=...` or the trash. Relative: proposed by me, requested from me, proposals waiting, to fix.
- The nudges and the book search entry are not shown on this page.

## AI flag

The create with AI button and the AI draft row are hidden when NUXT_PUBLIC_AI_CREATION_ENABLED is false.
