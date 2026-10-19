# Access batch — 2026-10-18

## Current user instructions — 2026-10-19
Work only on dev. Do not run E2E tests, open a PR to main, merge main or deploy. The user will group the main release later. The latest requested batch was the shared screens, now delivered; report before starting another batch.

## Shared screen batch
Account #145, Profile #147, Family/Invitation #148, Lock #149, Help #161, notifications/mails #160 and auxiliary pages #162 are closed with their verified scope recorded in each issue. The Account UI closure is separate from Supabase migration #193, which remains open. Domain/sender configuration remains in #194. Do not claim that provider activation or E2E verification has been completed.

Allowed checks passed: lint, typecheck, i18n, route documentation, design audit, 65 unit tests and production build. Current progress and commits are in docs/MEMORY.md and docs/TASKS.md. Preserve unrelated .claude/ and .github/workflows/migrate.yml.

## Profile codes — #146
Server validation lives in shared/utils/code.ts: adult PINs have 4–8 ASCII digits, child codes have 4–6 entries from the six shapes. technical/Auth/server/utils/profile-code.ts hashes kind and value with a salted scrypt hash and limits attempts. Parent reset and lockout recovery remain server-authorized.

The old request for a stored codeLength is superseded by the implemented variable-length input with explicit confirmation. The server validates the submitted length; the hash does not expose a profile's code length. No additional database column is required.

Verification: tests/e2e/11-profile-code.spec.ts and 21-profile-code-admin.spec.ts pass on mobile and desktop, including exhaustive accepted lengths, rejected boundaries/alphabets, distinct salted hashes and successful verification. Existing reset, throttling and cross-role checks are retained.

## Supabase — #193
Dedicated project: kebfzacaiqkjxcvhhvsp, Maki Story, eu-west-3 (Paris), in techmefr's Org. The application database and profile codes stay in the existing application; only adult account credentials move to Supabase Auth. Production activation requires the explicit provider setting and private server credentials.

Project auth configuration lives in supabase/config.toml. Current application URL remains https://tantara.vercel.app. Domain/OVH email/custom templates are deferred in #194. No provider secret belongs in the client or Git.
