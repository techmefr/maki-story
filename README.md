# Tantara

Family audio books: read paper books aloud with the voices of your loved ones, each voice with its own color. The child listens book in hand, with no text or image on screen, and can exchange voice messages with relatives.

Private project, intended to become a SaaS. Stack: Nuxt 4, Capacitor, Supabase, Vercel.

## Getting started

```bash
pnpm install
cp .env.example .env
pnpm dev
```

## Environment

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection string (Neon on Vercel) |
| `TEST_ACCESS_EMAIL` / `TEST_ACCESS_PASSWORD` | Shared test account |
| `SESSION_SECRET` | Signs the session cookie |

The schema is created on first request.

## Scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Dev server |
| `pnpm generate` | Static build in `.output/public` |
| `pnpm cap:sync` | Build and sync the Capacitor native projects |

## Mobile

```bash
pnpm exec cap add ios
pnpm exec cap add android
pnpm cap:sync
```

## Design

Clickable prototypes live in `design/`. Project context and roadmap are in `CLAUDE.md`.
