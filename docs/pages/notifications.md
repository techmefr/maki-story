# Notifications (`/notifications`)

Routes: /notifications, /notifications/settings

## 1. What the page must do
- In-app list (parents and relatives): grouped notifications with unread state, mark one or all as read. New kinds: message received, birthday reminder, takes to redo (grouped per book and voice).
- Out-of-app section: enable or disable push on this device (Web Push in the browser or PWA, native push when the Capacitor push plugin is present), and a per-kind grid with three toggles: in-app, push and e-mail. Everything defaults to on and is stored per member.
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
- [x] Fredoka, ink outlines and hard token shadows.

## Access requests
- A parent sees pending access requests above the preferences (homework done, sign-in, exception outside the allowed hours), with Allow and Refuse buttons. The first parent answer wins; a request expires after 10 minutes and is hidden once expired.

## Daily digest

`notifications:digest` runs at 07:00 UTC. Vercel calls `/api/cron/notifications` with `Authorization: Bearer <CRON_SECRET>`; Nitro uses the scheduled task. Both paths share the same database reservation, unique per account and UTC day. The claim is committed before any provider request. Even when the provider times out after accepting a message, another job cannot send a second digest that day. Pending items can be retried the next day; successful deliveries mark only the selected item IDs. This provides at most one attempt per account/day, not guaranteed delivery during a provider failure.

The sender rechecks e-mail preferences, active family membership, member status and deleted families. It groups at most ten visible lines, with an overflow count, and removes queue/history records older than thirty days; pending events older than seven days are ignored. Empty filtered batches send nothing. The recipient gets the link to the working `/notifications/settings` route.

Activation on the later main release requires `CRON_SECRET`, `APP_BASE_URL`, `BREVO_API_KEY` and `MAIL_FROM`; domain/sender setup remains tracked in #194. No real mail was sent during this batch. No E2E was run.
