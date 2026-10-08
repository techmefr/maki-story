# Data model v3

Source of truth: `server/migrations`. Migration `0016_data_model_v3` adds everything the spec v3 section P needs. Every table is scoped by `family_id` (except account-level tables noted below) and every route must filter on it.

Naming: the spec says Profile, the database says `members`. `members.role` is the profile role, `members.pin_hash` + `members.code_kind` hold the code hash (adult PIN or child symbol code), so no separate `symbol_code_hash` column exists.

## Profiles (`members`)

| Column | Meaning |
| --- | --- |
| `birth_date date` | Child only, parent-written, private to the family. Never copied to a guest voice, a share payload, a log or the journal. Age is always computed (`shared/utils/age.ts`), never stored. |
| `code_enabled boolean` | Child code is optional per child. `false` lets the child in without a pad. |
| `birthday_celebrated_year int` | Last year the party animation was shown, so it plays once per birthday across devices. |
| `tour_status text` | Guided tour state of an adult: `null` (never armed), `pending` (starts on the next home load), `done` (finished or skipped). Never set for a child: the tour routes answer 403. Migration 0063. |

Legacy `shapes` codes (3 shapes among 4) cannot be converted to the new 4 tokens among 6 format: they are reset (`pin_hash` and `code_kind` null) and the child gets `code_enabled = false` until a parent sets a new code. Documented, not reversible by `down` (only a hash is lost).

## Voice messages (`messages`)

New columns: `kind NORMAL|BIRTHDAY`, `first_listened_at`, `expires_at`, `status ACTIVE|EXPIRED|DELETED` (`listened_at` stays for compatibility and equals `first_listened_at`).

- Partial unique index `messages_one_active_key (from_member_id, to_member_id, kind) where status = 'ACTIVE'`: one active message per relative per child and kind. A birthday wish does not block a normal message.
- `expires_at = first_listened_at + 24 h`, set only by the recipient child. Parent or sender listens never set it. Never listened means `expires_at is null` and the message stays until a parent deletes it.
- Expiry is enforced on every read (`status`, `expires_at`) and a purge (`server/utils/messages.ts`, `purgeExpiredMessages`) moves due rows to `EXPIRED` and deletes their audio file unless a treasure references it. The purge runs lazily on the message routes and daily through the Nitro task `messages:purge` (`server/tasks/messages/purge.ts`).
- Parent delete (`DELETE /api/messages/:id`) sets `DELETED` and `deleted_at` (restore window, see recovery below).
- Backfill: per (sender, child, kind) only the latest message stays `ACTIVE`; older ones become `EXPIRED`. Previously listened rows get a fresh 24 h window from the migration.

## Treasure (`treasures`)

`id, family_id, child_id, source_message_id, from_member_id, file_id (copy of the audio), mime, duration_ms, saved_by_member_id, created_at, deleted_at`. The audio is copied into a new `files` row so it survives the purge. The 10 memory limit is enforced by the `treasures_limit` trigger (advisory lock per child, counts non-deleted rows), so concurrent inserts cannot exceed it. Unique `(child_id, source_message_id)` among non-deleted rows.

## Schedules

`child_schedules` (migration 0013) is the documented mapping of `ParentalSchedule` (`weekly` jsonb of lock/unlock windows per weekday, `timezone`). `parental_overrides{child_id, kind UNLOCK|LOCK, starts_at, ends_at, created_by_member_id}` stores temporary unlocks and locks.

## Memberships, invitations, notifications

- `memberships{account_id, family_id, member_id?, role parent|relative, status ACTIVE|LEFT|DECEASED|BLOCKED, child_ids[]}` unique per (account, family). Backfilled as `parent` from `account_families`.
- `invitations{code unique, family_id, channel WHATSAPP|SMS|EMAIL|LINK, role, child_ids[], contact, expires_at, used_at, used_by_account_id}`.
- `push_subscriptions{family_id, account_id, member_id, platform WEB|IOS|ANDROID, endpoint unique, keys jsonb, revoked_at}`.
- `notification_preferences{member_id, kind, channel IN_APP|PUSH|EMAIL, is_enabled}`.
- `moderation_log{family_id, ai_job_id, subject TEXT|IMAGE, verdict PASSED|FLAGGED|BLOCKED, categories[], action NONE|REGENERATED|REFUSED, detail}`. Never store the moderated content itself.

## Books

`written_language`, `voice_languages text[]`, `moods text[]`, `themes text[]` (controlled lists in `shared/utils/bookMeta.ts`). `language` is kept in sync with `written_language` for compatibility. Existing books: `written_language = language`, `voice_languages` seeded with the languages already recorded.

## Journal, errors, recovery

- `audit_log` is the append-only event journal (extended with `actor_account_id, entity_type, entity_id, before, after, request_id, outcome`). Write through `record()` in `server/utils/journal.ts`, which scrubs secrets and personal data (keys such as code, pin, token, audio, text, birth date, email are redacted, strings truncated, depth limited).
- `error_log` stores server and client errors (route without query, status, scrubbed message, user agent, app version, role, request id). Write through `recordError()`.
- `family_tombstones{family_id, restore_until, sealed_payload}` for the family deletion window.
- Soft delete columns: `deleted_at` on members, books, messages (existing), recordings and treasures (new). Retention (journal 12 months, error log 90 days, 30 day restore window) and the purge job are application logic for a later wave.

## Reverting

Every migration has a down. `0016` down drops the new tables, trigger and columns. Data written into those columns is lost on down (expected).
