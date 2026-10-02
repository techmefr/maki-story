# Invite a relative (`/family/invite`, parent only)

## 1. What the page must do
- Create an invitation per relative: channel WhatsApp, SMS, e-mail or link, optional first name, optional phone, e-mail required for the e-mail channel, optional list of concerned children (none selected means every child).
- The server generates a single-use code, valid 72 hours, rate limited to 30 per family per hour. Creation, listing and revocation are parent only (server side).
- Result card: the link `/join/<code>`, a native share button when the device supports it, "Open WhatsApp" for the WhatsApp channel, "Send by SMS" for SMS, copy, and "Invite someone else". For the e-mail channel the e-mail is sent by the configured provider; when it cannot be sent the card says to share the link by hand.
- History list: state (pending, used, expired, revoked) and a revoke button on pending invitations.
- States: empty history (empty scene), loading, create error, rate-limit message, offline (creation fails with the error message).
- The same form is reused by the first launch (`welcome.md`).

## 2. Design audit checklist
- [x] One main action: create the invitation.
- [x] Secondary buttons visible with an icon.
- [x] Big icons, micro-animation on the send icon.
- [x] No overflow at any text size (link field truncates, texts wrap).
- [x] Keyboard and remote focus, visible focus ring, 48 px targets.
- [x] `prefers-reduced-motion` respected.
- [x] Fredoka and Nunito, hard shadow `3px 3px 0 #1F1B3A`.
