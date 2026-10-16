# Adult and child interface — resume

Tracking: https://github.com/techmefr/maki-story/issues/189

## User intent
Adult mockups first, implement the reviewed visual direction in the real application, merge a verified batch so the user can test. Work autonomously. Track the work before implementation and preserve a handoff for another session. Latest instruction: finish adults, then children autonomously, and publish the combined batch through the sole PR #191. Work directly on dev; dev deployments are disabled in vercel.json.

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
1. Check the latest issues #189 and #192 status, PR #191 and CI/deployment links before doing anything; do not repeat completed merges.
2. The user authorized adult and child completion without another review pause. Test links are `/maquettes/adultes.html`, `/maquettes/enfants.html`, plus actual `/home` and `/kid` routes after signing in.
3. Audit remaining gaps in #159, #155, #157, #158, #148/#149, #163 and #165 against actual app and original per-screen mockups; current checkbox state is not reliable evidence of missing implementation.
4. Fix the adult feedback on task branches from `dev`, then one verified `dev` → `main` release for the next batch.
5. Child mockups and this visual batch are now implemented; next work is feedback and any independently identified remaining epic gaps, not redoing these screens.

Read `CLAUDE.md`, `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/RULES.md`, `docs/DESIGN.md`, `docs/TASKS.md`, `docs/MEMORY.md`. Keep prototype and production claims distinct.

## Combined final batch (2026-10-16)
- All work after #190 stays directly on dev. The only main release PR is #191. Do not create another release PR or push a feature branch; the user has a deployment quota.
- Adult finishing pass: adult-only composer presentation, private vault grid, parent-review spacing/actions with a sticky bar above mobile navigation.
- Child mockup: six states (home, library, story/page-turn, received message, private treasure, night/locked), light/dark, bundled mascot/fonts, explicit simulated audio/actions. Paths: `public/maquettes/enfants.html`, `docs/maquettes/Enfants Prototype.html`.
- Actual child screens: welcome with mascot, face cards and bubbles, readable covers, responsive personal treasure, larger navigation labels, reader and locked-screen short-height fixes. No domain/server/authorization changes.
- Final local validation: lint, Nuxt typecheck, locale/docs/design audits, production build and 36 unit tests pass. The original 47 migrations up/down/up check passed in the disposable database (no new migrations in this batch).
- A broad final selection had 70 passing E2E and two teleprompter timing failures; 14 studio tests were skipped by its serial suite. The font was captured at 22px before style rendering but appeared correctly enlarged in the failure screenshot. The test now waits for the visible prompter and polls the computed text size; rerunning all 16 studio tests passed. Together all 86 selected scenarios passed across the final runs. Do not report the first run as wholly green.
- Four additional existing shell tests passed at 320/390/1180/1600 px, checking every main adult/child route for overflow and 48px targets. Two additional actual child-layout runs passed at four widths and both themes. Prototype: 48 child view/viewport/theme combinations, message→treasure, page turns and restart passed; adult prototype six views at four widths passed.
- Source screenshots of actual adult and child home and the child mockup inspected. The prototype message bubble width and dark badge contrast were corrected after visual inspection.
- Old messages-only run lacked the profiles seeded by `05-kid.spec.ts`; rerunning with its prerequisite passed all message cases. No application workaround was added for missing test data.
- Remote CI, PR merge and production URL status must be read from the latest #189/#192 status comments before claiming release complete.
