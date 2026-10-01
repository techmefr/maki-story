# Tantara - project context (read first)

Working name **Tantara** (earlier names: Kalli, Lio). Mobile app and SaaS: paper books from home, read aloud in several voices by the family. Mascot: a **ring-tailed lemur (maki) wearing headphones**. Private repo, intended to become a SaaS.

## Concept
1. A parent scans the pages of a paper book (photo).
2. They split it into lines/characters and **color the voices**: each relative = 1 color. They can describe the page image, the **tone of each voice** and a **per-line hint** (whispered, laughing...).
3. Each relative records their lines in the **studio** from their phone. Before recording they see the image description, their voice tone and the line hint.
4. The child listens **paper book in hand**: the screen shows **neither text nor image** (no rights issue). It shows who is reading (color + initial/face), then at the end of each page: **a "ding" + a maki "Next page" screen** + a big arrow button.
5. **Voice messages** between child and relatives, story-style.

## Profiles
- **Parent**: creates books, colors voices, records, manages family/settings.
- **Relative**: records their lines and solo stories, leaves messages for the child.
- **Child**: listens, sends/receives messages. No settings.
- Profile switch: avatar in the header -> bottom sheet ("Who is listening?").

## Child space
- Home: relatives' faces, large (photo to upload). "Message" bubble when one is waiting.
- Tap a face -> their **single-voice** stories. "Multi-voice stories" card -> family library.
- Listening: background = reader's color, big initial/face, "X is reading", pause. Thin progress bar.

## Voice message rules
- Only one listenable message per relative at a time. Listened = **no replay**.
- Keep the **last 5** per conversation (1 active + 4 invisible history, for later). Oldest is purged.
- The child can reply at the end of a message ("Reply" button) or send from a relative's page.
- Child-side statuses: "Sent" then "Listened".

## Current phase: REAL TEST (not the final product)
- **One shared account** (password or magic link). Everyone uses it on their phone and **switches profile** at the top.
- Record real books, listen to each other, send messages.
- Lines **typed by hand** (no OCR yet).
- Not yet: public signup, Apple/Google login, multiple families, invite codes, subscription. (Screens already drawn, to be wired later.)
- The shared account becomes the first family -> nothing to throw away.
- Without real auth, avoid putting real children's voices in tests.

## Stack
- **Nuxt 4** (front + `server/api`), deployed on **Vercel**.
- **Capacitor** for the native mobile apps (iOS/Android) from the same code.
- **Supabase**: Postgres + Storage (audio, photos, scanned pages) + Realtime (message bubbles). Auth later (magic link via **Brevo** SMTP).
- Data layer: pages **never** access data directly, only via composables `useBooks()`, `useMembers()`, `useMessages()`, `useRecordings()` -> backend can change without touching screens.
- Audio: browser `MediaRecorder`. **Test early on a real iPhone** (Safari records mp4/AAC, others webm/opus -> store the mimeType, support playing both).
- Installable PWA first; Capacitor for the stores.
- Microphone requires HTTPS (Vercel OK).
- Purge of messages beyond 5: cron (Vercel Cron or Supabase pg_cron).

## Env vars (Vercel)
`SUPABASE_URL`, `SUPABASE_KEY` (anon), `SUPABASE_SERVICE_KEY` (server only), `SESSION_SECRET` (mandatory).
Supabase: private buckets `recordings`, `photos`, `pages`; signed URLs for reads.
Access protection for the test: shared password (Nuxt middleware).
Later: Brevo (Supabase SMTP + SPF/DKIM), Auth, per-family RLS.

## Data (target schema)
```
Family(id, name, invite_code, plan)
Member(id, family_id, user_id?, first_name, role[parent|relative|child], color, photo_url, status[active|invited])
Book(id, family_id, title, type[multi|solo], solo_member_id?, status[draft|to_record|ready], image_desc)
Page(id, book_id, position, scan_url)              -- family-private, never shown to the child
Line(id, book_id, page_id, position, character, text, note)   -- text = splitting only
Voice(book_id, member_id, tone)                    -- tone description per voice
Casting(book_id, character | line_id, member_id)
Recording(id, line_id, member_id, audio_url, mime, duration_ms)
Message(id, from_member, to_member, audio_url, mime, listened_at, created_at)   -- 5 max/conversation
```
6 voice colors: coral, sun, mint, sky, grape, pink.

## Screens -> Nuxt routes
- `pages/index.vue` splash/welcome, `pages/auth/login.vue`, `pages/auth/register.vue`
- `pages/profiles.vue` + `components/ProfileSwitcher.vue`
- `pages/home.vue` (parent home, empty/filled)
- `pages/books/new/{scan,voices,review}.vue`, `pages/books/[id]/{studio,play}.vue`
- `pages/kid/index.vue`, `kid/[member].vue`, `kid/library.vue`, `kid/listen/[id].vue`, `kid/message/[member].vue`
- `pages/family/{index,invite,new}.vue`, `pages/profile.vue`, `pages/settings.vue`, `pages/premium/{index,success}.vue`

## Design - look kept: "Tantara Mobile"
Very kid-friendly, simple, colorful, graphic.
- **Outlines** dark 2.5-3px `#1F1B3A`, **hard offset shadows** (`3px 3px 0 #1F1B3A`), press-in on click (`translate(3px,3px)`, shadow 0).
- **Background** cream `#FFF4D9`; ink `#1F1B3A`.
- **Voices**: coral `#FF7A6B`, sun `#FFC940`, mint `#4CD4A8`, sky `#6BB6FF`, grape `#B08CFF`, pink `#FF94C8`.
- **Fonts**: Fredoka (titles, buttons) + Nunito (text). Covers/illustrations = diagonal stripe placeholders.
- Big buttons (>= 44px, child >= 66-84px), very rounded corners (14-30px).
- Logo: maki with headphones (`design/Maki.dc.html`, headphone color adjustable).
- Softer alternative (cream/coral, no outlines) kept for reference in `design/Kalli App.dc.html`.

## Design files (`design/`)
- `Tantara Mobile.dc.html` - **reference clickable prototype** (login, profiles, library, scan, color voices + descriptions, review, studio, player, child space, messages, family, add relative/family). All interaction logic lives in the `Component` class.
- `Kalli App.dc.html` - 14 static screens (splash, welcome, login, onboarding x3, home empty/filled, profile, settings, subscription x2, listening, next page).
- `Kalli Synthese Projet.dc.html` - A4 project summary.
- `Maki.dc.html` - logo/mascot.
- `image-slot.js`, `doc-page.js` - mockup utility components.

## Text and language
UI in **French** for now (warm tone, informal "tu"); i18n to add for SaaS. Sample names are Malagasy (Nosy Be, Itasy, Ravo, zebu, lemur). Code, docs, commits and repo metadata in **English**.

## Competition
Bookinou (paper books, device, 1 voice) - Weconte (multi-voice, imposed catalog) - Storyplay'r / Story Time Together (catalog) - Gramms/HearLoom/Tellioh (AI-cloned voices).
**Tantara**: your own books + several real colored voices + zero text on screen + voice messages + real voice (no cloning).

## Business model (planned, later)
Free: 5 books, 4 relatives, 1 family, messages included. Family: unlimited, 5 families, offline. **3 EUR/month** or **24 EUR/year** (2 EUR/month), 7-day trial.

## Proposed work order
1. Init Nuxt 4 + Supabase module + mobile layout + design tokens + components (Card, hard Button, VoiceDot, Avatar, Maki).
2. Shared-password protection + profiles screen + switcher.
3. Data composables + Supabase tables + buckets.
4. Book creation: scan (photo upload) -> type lines -> color (image_desc, tone, notes) -> review.
5. Recording studio (MediaRecorder, iPhone test) -> publish.
6. Child space: faces home, solo, multi-voice, listening + ding + "Next page".
7. Voice messages (rules above) + Realtime.
8. Vercel deploy + real family test.
9. Then: real auth, multiple families, invites, subscription, OCR, Capacitor apps.
