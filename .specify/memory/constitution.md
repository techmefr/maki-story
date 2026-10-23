# Maki Story Constitution

## Core Principles

### I. Existing product rules remain authoritative
Follow CLAUDE.md, docs/PRD.md, docs/ARCHITECTURE.md, docs/RULES.md and docs/DESIGN.md. This constitution records existing rules; it does not replace user-approved requirements. Server-side permissions and family/message/reading rules remain unchanged by decoration.

### II. Stable and accessible family experience
Themes are presentation variants of the same routes and actions. Keep real family photos, legible text, 44px minimum touch targets, keyboard operation, text scaling and reduced motion. Reading accompanies a physical book and does not display scanned pages or reading text. Every supported language has translated interface labels.

### III. Clear boundaries
Technical layers stay independent from functional domains. Application code uses strict TypeScript without any, code comments or console.log. Reuse existing components; document any new dependency. A visual change must not weaken permissions or expose another profile’s settings or data.

### IV. Offline and non-Google operation
The app must keep its existing offline reading/messages behavior and work without Google services. Decorative failure falls back to a readable base theme. No sound starts without user action.

### V. Verifiable development and grouped releases
Work from the shared dev branch and create implementation branches when needed. Use conventional English commits, meaningful tests and the required verify/build checks. Do not run local E2E suites under the current user instruction. Track their existing correction separately in issue #197. Publish only one grouped dev-to-main merge when authorized, to preserve deployment quota.

## Workflow

Specifications describe user needs before technical plans and implementation tasks. A prepared specification is not evidence that its feature is implemented. Capture outstanding visual/device/accessibility checks honestly; static palette checks are not full RGAA certification.

## Governance

User instructions take precedence. Existing project rules govern conflicts. The adaptive scenery spec, plan and tasks are prepared for review before implementation with Claude Code; the current handoff changes documentation and tooling only.

**Version**: 1.0.0 | **Ratified**: 2026-10-23 | **Last Amended**: 2026-10-23
