# Join a family (`/join/[code]`)

Routes: /join/[[code]]

## 1. What the page must do
- Public route (signed in or not). With a code in the link the invitation is checked at once; without it the page asks for the code.
- Invalid, used, expired or revoked code: explanation and a button to try another code. The preview never reveals more than the family name and the inviter name, and is rate limited.
- Already signed in: one button "Join the family" redeems the invitation for the current account (an active membership is created, nothing else changes for the other families).
- Not signed in: first name, e-mail and password. An unknown e-mail creates the account, a known e-mail must give the right password (same brute-force throttle as the login).
- After joining the relative lands on the relative home (`/relative`), without any family profile selector.
- Errors: wrong credentials or unusable invitation, too many attempts, server error. A relative who already belongs to the family is refused.
- Responsive: single narrow column, RTL ready.

## 2. Design audit checklist
- [x] One main action (check, join).
- [x] Secondary buttons visible with an icon.
- [x] Big icons, micro-animation on the join icon.
- [x] No overflow at any text size.
- [x] Keyboard and remote focus, 56 px main button.
- [x] `prefers-reduced-motion` respected.
- [x] Fredoka and Nunito, hard shadow `3px 3px 0 #1F1B3A`.
