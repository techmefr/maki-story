# Adult experience — resume

Tracking: https://github.com/techmefr/maki-story/issues/189

## User intent
Adult mockups first, implement the reviewed visual direction in the real application, merge a verified batch so the user can test. Work autonomously. Track the work before implementation and preserve a handoff for another session. Child redesign comes after adult testing.

## This batch
- Interactive six-view prototype: `public/maquettes/adultes.html` (public URL `/maquettes/adultes.html`) and `docs/maquettes/Adultes Prototype.html` (local standalone copy).
- Prototype covers home, library, simplified book creation, studio, child/adult messages and personal vault, family and parent review. Parent/relative switch. All recording, messages, invitations and approvals explicitly simulated. Bundled fonts; no external dependencies.
- Actual application: adult home welcome card links to real creation/library; existing counts and child message bubbles retained. Adult-only default layout modifier gives readable 224 px desktop rail, spacing and card styles. Library actions/cards, desktop studio controls and family groups adapted. Existing domain data, permissions, recording/review, translations and routes reused. No server changes or migration.
- This does not complete all older epic issues or replace the production message composer and parent review screens with the demonstration. Do not close #155/#157/#158/#159/#163 wholesale.

## Verified locally
- lint, Nuxt typecheck, i18n (2073 keys / 9 locales), docs/pages audit, design audit.
- 36 unit tests passed.
- 47 migrations up/down/up passed against a disposable local PostgreSQL 16 container, then applied to its empty E2E database.
- Production build passed.
- 4 new adult E2E passed on 390 / 1440 px (real authentication, home → creation/library, primary routes fit, desktop rail).
- 4 existing shell E2E passed on mobile/desktop (parent/relative/child navigation, no horizontal scroll, 48 px touch targets).
- Prototype smoke test passed for all six views at 320 / 390 / 1180 / 1600 px, creation, personal vault, role controls, ready-book detail and no JavaScript errors.
- Actual home screenshots visually inspected at 390 / 1440 px.

## Environment
Original `.nuxt/manifest/meta` is root-owned; pnpm's automatic prepare failed with EACCES before running lint. Source ownership was not changed. Validation used a clean temporary copy and direct Node invocations. The installed browser is chromium_headless_shell-1248; the package expects 1243, so the local check configuration used the installed executable. CI installs its matching browser normally.
Unrelated `.claude/` and `.github/workflows/migrate.yml` predated this work and must not be staged.

## Next work
1. Check the latest issue #189 status and PR/CI/deployment links before doing anything; do not repeat completed merges.
2. Obtain the user's adult visual/functional feedback after testing.
3. Audit remaining gaps in #159, #155, #157, #158, #148/#149, #163 and #165 against actual app and original per-screen mockups; current checkbox state is not reliable evidence of missing implementation.
4. Fix the adult feedback on task branches from `dev`, then one verified `dev` → `main` release for the next batch.
5. Start child mockups only after the adult test cycle.

Read `CLAUDE.md`, `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/RULES.md`, `docs/DESIGN.md`, `docs/TASKS.md`, `docs/MEMORY.md`. Keep prototype and production claims distinct.
