<p align="center">
    <img src="public/icon.svg" alt="Tantara mascot: a ring-tailed lemur wearing headphones" width="120">
</p>

<h1 align="center">Tantara</h1>

<p align="center">
    <strong>Paper books, read aloud by the people you love. Each voice has its own color.</strong>
</p>

Tantara turns the paper books already on your shelf into multi-voice audio stories. A parent photographs the pages and splits the lines, every relative gets a color and records their own lines from their phone, and the child listens book in hand. The screen never shows the text or the pictures of the book, only who is reading, in their color.

> Status: private family beta. It is meant to grow into a SaaS (real authentication, several families, invitations, subscription, OCR, native apps).

## Screens

| Child home | Player | Page turn |
| --- | --- | --- |
| <img src="docs/screenshots/kid-home.png" alt="Child home with the faces of relatives" width="240"> | <img src="docs/screenshots/kid-reader.png" alt="Player colored like the current reader" width="240"> | <img src="docs/screenshots/kid-next-page.png" alt="Next page screen with the mascot" width="240"> |

| Library | Color the voices | Recording studio |
| --- | --- | --- |
| <img src="docs/screenshots/library.png" alt="Family library" width="240"> | <img src="docs/screenshots/wizard-colors.png" alt="Casting the voices of a book" width="240"> | <img src="docs/screenshots/studio.png" alt="Recording studio" width="240"> |

| Voice messages | Family |
| --- | --- |
| <img src="docs/screenshots/messages.png" alt="Voice messages" width="240"> | <img src="docs/screenshots/family.png" alt="Family members" width="240"> |

The layout adapts from phones to desktops:

<img src="docs/screenshots/desktop-library.png" alt="Library on a desktop screen" width="720">

The UI is in French for now (the audience is a French-speaking family). Code, documentation, commits and repository metadata are in English.

## How it works

1. **Describe the book**: title, type (book, comic, wordless, written by the child), language (French, Malagasy, English, Spanish, Italian, German, Portuguese, Chinese, Arabic) and, optionally, subtitle, author and age range.
2. **Scan** the pages (photos, private to the family): mark the cover, add empty pages (skipped when listening, optional synthetic voice), describe the image, add comic panels.
3. **Define the characters once** (name, color, description, narrator) and pick who reads each voice, or keep the **one voice** mode where a single relative reads everything. Switching between the two modes never loses a line.
4. **Type or paste the lines**: one tap picks the character and a tone chip (whispered, laughing, scared, sleepy...) or a free tone, with an optional scene description. Pasting a whole text splits it into one line per row, and `Name : line` switches character.
5. **Record** in the studio from any phone, line by line, with the picture description, tone and hint in view.
6. **Listen**: the child taps a face, hears the story, gets a soft "ding" and a "next page" screen at each page end, and a lighter, shorter cue plus a quick transition between two comic panels. The cue respects reduced motion and the sound on/off button of the player.
7. **Message**: children and relatives exchange short voice messages (last five kept per conversation, listened once).

## Features

- Multi-voice casting with six voice colors and a mascot (a lemur with headphones)
- Screenless listening for children: faces, colors, icons and sounds only
- "Grimace" profile photos taken from the camera or picked from the gallery, so children recognize relatives
- Responsive design system (hard outlines, offset shadows, Fredoka and Nunito), animated Lucide icons, page transitions, reduced motion support
- Installable PWA (manifest, icons, service worker), Capacitor ready for iOS and Android
- Book model: subtitle, author, age range, language and type (standard, comic, wordless, child-written), characters defined once per book (one narrator at most), pages of kind cover, content or empty, comic panels, tone and scene description per line
- Recordings per line and language (draft, submitted, approved, changes requested, stale), line translations, and a recording turns stale when the text or tone of its line is edited
- Profile picker on every launch: every profile has its own code (4 to 6 digits, or 3 shapes out of 4 in order for children), checked server side with scrypt, per-profile lockout after 5 wrong tries, and the app returns to the picker on a cold start or after 30 seconds in the background
- Soft delete everywhere: nothing is ever hard deleted
- Simple server logs written in plain sentences, easy to read in Vercel logs
- End to end tests that run the whole product on a phone and a desktop viewport

## Profile codes

- A parent without a code creates one the first time the profile is selected. A child code (digits or shapes) is set by a parent, in the family screen.
- The session only changes profile after a verified code. A child session can never open a parent or relative profile, nor change anyone else code.
- Five wrong codes lock the profile for five minutes (persisted in `members`), whatever the session.
- The client clears the active profile on a cold start and after `PROFILE_IDLE_LOCK_MS` in the background (`app/utils/profile-lock.ts`).
- Biometrics plug in through `useProfileUnlockers` (see `IProfileUnlocker`), see Biometric unlock below.

## Social sign-in

Google and Apple use the OAuth 2.0 authorization code flow with PKCE (S256), a `state` and a `nonce` bound to a short lived signed cookie, and the ID token is verified server side (RS256, issuer, audience, expiry, nonce) against the provider JWKS, cached for one hour. There is no dependency beyond `node:crypto` and `fetch`.

- A button only appears when its provider is fully configured (`GET /api/auth/oauth/providers`). The Apple button is shown on iOS, on Safari for macOS and in the native app only. The "Autre compte" entry lists the providers that are not available yet, disabled.
- A known identity (provider and subject) signs straight in. Otherwise the provider must assert a verified e-mail: it is linked to the account with that e-mail when one exists, or a new account, family and parent profile are created (like `/register`). An unverified e-mail is always refused and never merged.
- Social accounts get an unusable random password hash; the password sign-in keeps working for accounts that registered with one.

Google setup:

1. In the Google Cloud console, create a project, configure the OAuth consent screen and create an OAuth client of type "Web application".
2. Add the authorized redirect URI `https://YOUR_HOST/api/auth/oauth/google/callback` (and `http://localhost:3000/api/auth/oauth/google/callback` for development).
3. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

Apple setup:

1. In the Apple Developer portal, register an App ID with the "Sign in with Apple" capability, then a Services ID: its identifier is `APPLE_CLIENT_ID`.
2. Configure the Services ID: add your domain and the return URL `https://YOUR_HOST/api/auth/oauth/apple/callback` (Apple requires HTTPS and a public domain, `localhost` is not accepted).
3. Create a key with "Sign in with Apple" enabled and download the `.p8` file once: its Key ID is `APPLE_KEY_ID`, its content is `APPLE_PRIVATE_KEY`, and your Team ID is `APPLE_TEAM_ID`.
4. Apple answers with a form post and only sends the name on the first authorization; the server reads both.

Native apps: Google refuses embedded web views. Until a native sign-in plugin is added, social sign-in on the Capacitor apps is expected to open the system browser; email and password and the profile codes work everywhere.

## Biometric unlock

Biometrics prove presence only. The server still issues the profile token after checking a device bound secret.

- Web: not available, the profile code is the only option and no biometric UI is shown.
- Native: `app/composables/useBiometric.ts` implements `IProfileUnlocker` with `@capgo/capacitor-native-biometric`, an optional dependency imported dynamically on native platforms only (a separate chunk, never loaded on the web).
- Enrolment: after a successful code entry the profile screen offers to enable biometrics (opt-in). The server creates a device (`POST /api/devices`) and returns a random 256 bit secret once; only its SHA-256 hash is stored in `member_devices`. The secret is kept in the Keychain or Android Keystore through the plugin.
- Unlock: the user passes the system biometric prompt, the app reads the secret and calls `POST /api/auth/profile` with `device: { id, secret }`. Wrong secrets are throttled per device and per IP (five failures lock for fifteen minutes, HTTP 429). A revoked or unknown device gets 403 and the app drops its local secret and falls back to the code.
- Revocation: a parent can remove any device of the family, anyone can remove their own, from the family screen (`/family/devices`) or `DELETE /api/devices/:id`.

Native setup:

```bash
pnpm install
pnpm cap:sync
```

- iOS: add `NSFaceIDUsageDescription` to `ios/App/App/Info.plist` (for example "Open your profile with Face ID").
- Android: add `<uses-permission android:name="android.permission.USE_BIOMETRIC" />` to `AndroidManifest.xml` and make sure the activity extends `FragmentActivity` (the Capacitor default does).
- Manual test on a real device: enable the offer after a code entry, lock the app (background it for 30 seconds), reopen the profile and unlock with the fingerprint or face; refuse the prompt and check the code pad stays available; remove the device from `/family/devices` and check the next biometric attempt falls back to the code.
- CI cannot run the native prompt: the e2e suite injects a mocked bridge (`window.__TANTARA_BIOMETRIC__`, honoured only when `NUXT_PUBLIC_BIOMETRIC_TEST_BRIDGE` is set) and covers the server endpoints directly.

## Roles and permissions

Every route under `server/api` resolves the active profile of the session on the server and checks it against `ROLE_PERMISSIONS` (`shared/utils/permissions.ts`). A profile that is removed, left, deceased or blocked is refused everywhere, and a session that has not entered a profile yet only has the rights of a child.

| Capability | Parent | Relative | Child |
| --- | --- | --- | --- |
| List and read books | All books of the family | Only books with lines assigned to them | Only ready books that have recordings |
| Create and edit books, characters, pages, panels, translations | Yes | Only their own single voice books | No |
| Delete a book | Yes | No | No |
| Record or erase a line | Any line | Lines assigned to them | No |
| Upload files | Everything | Audio and images | Audio only |
| Read a file | Every file of the family | Own uploads, own messages, files of books they can read | Own messages, files of books they can read, a received message until it is listened |
| Messages | See and replay every message | See own, send, mark received as listened | See own, send, mark received as listened (no replay) |
| Members | Add, edit, remove, mark a relative left, deceased or blocked | List only | List only |
| Feedback | Send, read, delete | Send | Send |
| AI helpers and draft validation | Yes | No | No |

## Tech stack

| Area | Choice |
| --- | --- |
| Front | Nuxt 4 (SPA), Vue 3, TypeScript |
| Server | Nitro routes in `server/api`, bundled as a single file for Vercel |
| Data | PostgreSQL (Neon on Vercel) through the `postgres` driver, files stored as `bytea` |
| Icons | `lucide-vue-next` |
| Mobile | Capacitor |
| Tests | Playwright |
| Hosting | Vercel |

Project layout:

```
app/        Nuxt app: pages, components, composables, middleware, design system CSS
server/     API routes, database schema, session and request logging
shared/     Types and helpers shared by app and server
tests/e2e/  Playwright specs and helpers
docs/       GitHub Pages landing page and screenshots
design/     Original clickable prototypes (French) the UI was built from
```

## Getting started

Requirements: Node 22, pnpm, a PostgreSQL database.

```bash
pnpm install
cp .env.example .env
pnpm dev
```

### Environment

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Mandatory. Signs the session cookies; sessions are refused (HTTP 500) when it is missing |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Optional. Enable Sign in with Google (see Social sign-in) |
| `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY` | Optional. Enable Sign in with Apple (the key is the content of the `.p8` file, newlines may be written as `
`) |
| `OAUTH_REDIRECT_BASE` | Optional. Public origin used to build the OAuth redirect URI (default: the request origin, honouring `X-Forwarded-*`) |
| `OIDC_FAKE` | `1` swaps Google and Apple for an in-app fake OpenID provider (tests only, never in production) |
| `NUXT_PUBLIC_BIOMETRIC_TEST_BRIDGE` | `1` lets the e2e suite inject a mocked native biometric bridge (tests only, never in production) |
| `LEGACY_OWNER_EMAIL` | Optional. The account registered with this e-mail adopts the family created from pre-accounts data |
| `MAIL_MODE` | `capture` keeps mails in memory for tests (never in production) |
| `BREVO_API_KEY` and `MAIL_FROM` | Optional transactional mail provider used for code recovery |
| `OPENROUTER_API_KEY` | Optional, server only. Without it the AI endpoints answer 503 and `/api/ai/status` reports `enabled: false` |
| `AI_MONTHLY_BUDGET_USD` | Per family monthly AI budget in USD (default `1`). Checked before each call, the real cost reported by OpenRouter is recorded in `ai_jobs`; an exhausted budget answers 429 |
| `AI_MODEL_VISION`, `AI_MODEL_TEXT`, `AI_MODEL_IMAGE` | Optional OpenRouter model ids (defaults `google/gemini-2.5-flash` for vision and text, `google/gemini-2.5-flash-image` for pages) |
| `AI_PROVIDER` | `fake` swaps OpenRouter for a deterministic offline provider (tests only, never in production) |

AI features (parent profiles only): `POST /api/ai/photo-prefill` turns page photos into an unsaved draft, `POST /api/ai/book-generation` writes a book from an idea (a fixed character sheet is repeated in every image prompt) and stores it as a hidden draft (`status = draft`, `ai_generated = true`), `POST /api/ai/translation` suggests translations, `POST /api/books/:id/validate` is the parental validation that releases a draft. Model output is validated against a strict schema and size limits; text read from photos is treated as data, never as instructions.

The database schema is created and migrated on the first request. Accounts are created on `/register` (e-mail, password hashed with scrypt, one family and its first parent profile); every row belongs to a family and is only served to the accounts of that family.

### Scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Development server |
| `pnpm generate` | Static build in `.output/public` |
| `pnpm cap:sync` | Build and sync the Capacitor native projects |
| `pnpm exec nuxt typecheck` | Type check the app and the server |
| `pnpm exec playwright test` | Run the end to end suite |

### End to end tests

The suite starts its own dev server and database and runs twice, on a phone and on a desktop viewport, with a fake microphone and camera.

```bash
createdb tantara_e2e
pnpm exec playwright test
```

Run it against a deployed site (the suite registers its own accounts and soft deletes its test data afterwards):

```bash
E2E_BASE_URL=https://your-app.vercel.app \
    pnpm exec playwright test
```

### Mobile apps

```bash
pnpm exec cap add ios
pnpm exec cap add android
pnpm cap:sync
```

## Resumable audio upload

Audio is sent in 256 KB chunks so a dropped connection never loses a take. `POST /api/uploads` (size, mime) opens a session, `PATCH /api/uploads/:id` with an `Upload-Offset` header appends a chunk (a replayed chunk is accepted, a wrong offset answers 409 with the current offset), `GET /api/uploads/:id` returns the offset to resume from, `POST /api/uploads/:id/finish` assembles a `files` row (audio mime allowlist, 16 MB cap, family scoped) and `DELETE` aborts. Unfinished sessions expire after 24 hours. On the client, `useChunkedUpload` retries with backoff and resumes from the server offset; `useFiles.upload` uses it for audio and keeps the single request for images.

## Offline books

A ready book can be downloaded for offline listening (button on the library, the book player and the kid library). Only the line recordings are stored, since children never see page images: audio goes to Cache Storage (`tantara-offline-audio`), book metadata and the family and library lists go to IndexedDB (`tantara-offline`), with no dependency. A download is resumable (files already stored are skipped when it restarts), shows its progress and size, and `useFiles.fetchUrl` reads the local copy first and falls back to the network. While offline, `GET /auth/me`, `/members`, `/books` and the downloaded `/books/:id` are served from IndexedDB, a banner explains the state and actions that need a connection (new book, voice message) are disabled. The `/storage` screen (family tab) lists downloads with their size, shows used space against `navigator.storage.estimate()`, deletes one or all books and requests persistent storage. Signing out or signing in clears all offline data, so nothing leaks between families sharing a device. The service worker still only caches the app shell and `/_nuxt` assets; it never stores API responses.

Targets: the PWA runs on phones, tablets and desktop browsers (Chrome, Edge, Safari, Firefox), and the same build runs in Capacitor on Android and iOS. Android TV and a leanback layout are planned separately (#31) and not implemented here.

## Deployment

The project deploys on Vercel from the `main` branch. Connect a Postgres database (Neon integration), set the environment variables above, and push.

## Landing page

A static presentation page lives in `docs/` and is published with GitHub Pages (source: `main` branch, `/docs` folder).

## License

All rights reserved. This is a private project.
