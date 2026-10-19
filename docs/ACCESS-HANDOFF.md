# Access batch — 2026-10-18

## Current user instructions — 2026-10-19
Work only on dev. Do not run E2E tests, open a PR to main, merge main or deploy. The user will group the main release later. The user subsequently authorized finishing all adult and child screens and confirmed remote deletion after an account-deletion request. All implementation for this batch is now delivered.

## Shared screen batch
Account #145, Profile #147, Family/Invitation #148, Lock #149, Help #161, notifications/mails #160 and auxiliary pages #162 are closed with their verified scope recorded in each issue. The Account UI closure is separate from Supabase migration #193, now closed for the opt-in server implementation and tested lifecycle; production activation remains explicit. Domain/sender configuration remains in #194. Do not claim that provider activation or E2E verification has been completed.

Allowed checks passed: lint, typecheck, i18n, route documentation, design audit, 65 unit tests and production build. Current progress and commits are in docs/MEMORY.md and docs/TASKS.md. Preserve unrelated .claude/ and .github/workflows/migrate.yml.

## Profile codes — #146
Server validation lives in shared/utils/code.ts: adult PINs have 4–8 ASCII digits, child codes have 4–6 entries from the six shapes. technical/Auth/server/utils/profile-code.ts hashes kind and value with a salted scrypt hash and limits attempts. Parent reset and lockout recovery remain server-authorized.

The old request for a stored codeLength is superseded by the implemented variable-length input with explicit confirmation. The server validates the submitted length; the hash does not expose a profile's code length. No additional database column is required.

Verification: tests/e2e/11-profile-code.spec.ts and 21-profile-code-admin.spec.ts pass on mobile and desktop, including exhaustive accepted lengths, rejected boundaries/alphabets, distinct salted hashes and successful verification. Existing reset, throttling and cross-role checks are retained.

## Supabase — #193
Dedicated project: kebfzacaiqkjxcvhhvsp, Maki Story, eu-west-3 (Paris), in techmefr's Org. The application database and profile codes stay in the existing application; only adult account credentials move to Supabase Auth. Production activation requires the explicit provider setting and private server credentials.

Project auth configuration lives in supabase/config.toml. Current application URL remains https://tantara.vercel.app. Domain/OVH email/custom templates are deferred in #194. No provider secret belongs in the client or Git.

Account deletion was explicitly authorized on 2026-10-19. Migration 0070 enqueues remote identities only when their local account is actually deleted. Transaction rollback preserves both; remaining family memberships retain the account. Immediate processing and the daily auth purge retry provider failures. Active bindings cancel a queued deletion; concurrent workers reserve rows. CRON_SECRET protects the HTTP cron. No migration or login deletes an identity.

The dedicated live check creates only a disposable identity, exercises password verification/change and idempotent deletion, then cleans it up. Run tests/integration/supabase-live.test.ts with SUPABASE_LIVE_CHECK=1 and private server credentials; the default suite skips this external check. A real run passed on 2026-10-19. Legacy stays the default; cloud Auth configuration and production provider activation are not performed by this batch. Existing local magic-link and social OAuth flows stay in place. Interactive social-provider and physical-device acceptance are still manual release checks.

Final code: 6ee2a03 on dev. Native run 39263493179 passed (Android without GMS/Firebase, iOS simulator and PWA). Issues #193 and #166 closed with evidence. #194 remains deferred. Main is unchanged at 614ada34900a0aec4449db5cfb971bbc06550baa. No release PR or merge has been made. For a later release, apply application migrations through 0070 and verify the deployment. Keep AUTH_PROVIDER=legacy unless deliberately configuring/activating Supabase with the private server variables and verified cloud Auth settings.
