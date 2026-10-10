# Khatfa خطفة — notes for Claude

Read this first in every new chat about this repo.

## The owner's standing rules
- Never claim a feature is implemented, tested or deployed unless it really is.
- Be honest about which tests you actually ran, and say what wasn't tested (e.g. real phones, real TVs, iOS Safari).
- No backend or paid services without warning the owner first. That includes paid AI voice services: ask before suggesting one.
- No copyrighted music, clips, artwork or characters. No invented facts or stats. Starter questions with anything time-sensitive (current stats, records, recent events) must be marked `check: true` and never presented as verified.
- Optional modifiers and extra lifelines are OFF by default.
- Check layouts with screenshots at phone (360px wide) and TV (1920×1080) sizes, in Arabic and English (`npm run shots`).
- Work step by step. Say what you're about to do before big changes. Keep features that already work.
- This game is NOT based on the owner's old "Majlis Quiz" project. Don't use or copy anything from it.
- No Seen Jeem voice lines, branding or content, and don't imitate their voice actor. Khatfa is its own game in the same genre.

## Key facts
- **What it is:** a Seen Jeem–style team quiz party game with its own name, look and content. Two teams (3–4 later) pick categories. The board has questions worth 200/400/600 (configurable). Teams take turns choosing. The host marks correct or wrong. A wrong or missing answer lets the other team steal, which is a "khatfa", the snatch the game is named after.
- **Live site:** https://sad-cpu141.github.io/khatfa/ (GitHub Pages, `main` branch, root folder).
- **Repo:** Sad-CPU141/khatfa.
- **Sibling game:** Draft Night, at Sad-CPU141/draft-night and https://sad-cpu141.github.io/draft-night/. Khatfa reuses its design and tech. Read that repo before rebuilding anything it already has.
- **Hub:** Sad-CPU141/sad-cpu141.github.io, a "game night" menu linking all the games.
- **Languages:** Arabic (RTL, the default) and English, switchable. UI strings live in `src/05-i18n.js` as `[English, Arabic]`. Content is stored as `{ ar, en }`. Use `dir="auto"` for user text and CSS logical properties (`inset-inline-start`, `padding-inline`…), never `left`/`right`.
- **Fonts:** self-hosted in `fonts/` under the SIL OFL: Anton, Barlow, Barlow Semi Condensed (same as Draft Night) and Cairo for Arabic.
- **Look:** Draft Night's ink and purple palette with gold accents. Khatfa's own accent is teal `#22cfd6`, used for steals and the logo.
- **Firebase:** online play only, which is Step 5 and not started. Reuse the owner's project `draft-night-125a6` with the same config as Draft Night, but store everything under the top-level `/khatfa/rooms`. Draft Night uses the top-level `/rooms`, which must never be touched. Security rules must cover both games, and the owner needs exact paste instructions (Firebase console → Realtime Database → Rules). Warn about Spark (free) plan limits.

## How the code is laid out (same as Draft Night)
- A static site. React 18 UMD is vendored in `vendor/`. There's no bundler.
- Edit `src/`, then run `npm run build`. Never edit `app.js`, `index.html`, `sw.js` or the root `styles.css` by hand, because the build overwrites them and stamps a version.
- `src/00-platform.js` holds helpers, storage (IndexedDB → localStorage → memory), backup format and PWA/updates.
- `src/05-i18n.js` holds all interface text in both languages.
- `src/10-sample-pack.js` is the small built-in sample pack (Step 1 only).
- `src/20-engine.js` is the game rules as pure functions `(game, …) → game`, with undo history.
- `src/30-ui.jsx` has the shared UI, home, setup and how-to-play.
- `src/31-game.jsx` has category pick, board, question, results, menu and fix scores.
- `src/34-tv.jsx` handles TV mode: on this screen, or a second window linked by BroadcastChannel.
- `src/40-settings.jsx` is the settings screen and backup.
- `src/90-app.jsx` has the app state and saving, and mounts the app.
- Tests:
  - `npm test` runs rules and 300 random games, a jsdom click-through, backup, and the TV window link.
  - `npm run shots` runs a Playwright click-through and screenshots into `shots/`, which is not committed.
  - Online tests will copy Draft Night's `tests/fake-firebase.js` approach.

## Roadmap
1. ✅ Foundation: board, teams, scoring, steals, timer, results, TV mode (this screen and a new window), AR/EN, settings, backup.
2. Question bank editor, import/export of packs, real starter packs with fact-check flags.
3. Image, audio and YouTube clip questions. Clips use embed `start`/`end`, official uploads only, and never cover the player. Add a clip editor, a "Check all clips" button, and a title-spoiler warning.
4. Lifelines with original names. Proposed defaults are Dabbilha ضاعفها (double), Faz'a فزعة (call a friend) and Dir' درع (block the steal). Tamdeed تمديد (extra time) and Baddil بدّل (swap) are OFF by default. Also: steal polish, the owner's uploaded voice lines with the built-in voice as fallback, and generated sound effects.
5. Online rooms with phones as buzzers or answer pads, the host still judging, and TV on another device.
6. Hub page and polish.
