# Notifications (`/notifications`)

## 1. What the page must do
- In-app list (parents and relatives): grouped notifications with unread state, mark one or all as read. New kinds: message received, birthday reminder, takes to redo (grouped per book and voice).
- Out-of-app section: enable or disable push on this device (Web Push in the browser or PWA, native push when the Capacitor push plugin is present), and a per-kind grid with two toggles, notification and e-mail. Everything defaults to on and is stored per member.
- Delivery rules (server): a notification is delivered by push to every active subscription of the recipient, and by e-mail when no push was delivered (fallback). A dead subscription is revoked. A child whose schedule is locked never receives anything out of the app. Opt-outs are honoured. Every attempt is journaled in `notification_deliveries` (parents can read their family log).
- Web Push is sent without a payload; the service worker fetches the text of the latest unread notification in the member's locale. E-mail texts and push texts come from the `mail` locale files.
- Providers: `NOTIFY_PROVIDER=fake` records without any network call; otherwise Web Push needs `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, native push needs `FCM_SERVICE_ACCOUNT`, e-mail needs `BREVO_API_KEY` and `MAIL_FROM`. Without configuration nothing is sent and in-app notifications keep working.
- Events: message received (child and parents), book proposed, recording request, voice added, validation or comment, takes to redo, birthday reminder (daily task `birthdays:remind`, three days before, once per child and year).
- States: empty list, loading, push unsupported, push denied, error saving a preference.

## 2. Design audit checklist
- [x] One main action: enable notifications.
- [x] Secondary buttons visible with an icon (toggles show check or close).
- [x] Big icons, micro-animation on the enable icon.
- [x] No overflow at any text size, 48 px targets, keyboard focus.
- [x] `prefers-reduced-motion` respected.
- [x] Fredoka and Nunito, hard shadow `3px 3px 0 #1F1B3A`.

## Access requests
- A parent sees pending access requests above the preferences (homework done, sign-in, exception outside the allowed hours), with Allow and Refuse buttons. The first parent answer wins; a request expires after 10 minutes and is hidden once expired.
