# Khatfa خطفة — notes for Claude

Read this first in every new chat about this repo.

## The owner's standing rules
- Never claim a feature is implemented, tested or deployed unless it really is.
- Be honest about which tests you actually ran, and say what wasn't tested (e.g. real phones, real TVs, iOS Safari).
- No backend or paid services without warning the owner first. That includes paid AI voice services: ask before suggesting one.
- No copyrighted music, clips, artwork or characters. No invented facts or stats. Starter questions with anything time-sensitive (current stats, records, recent events) must be marked `c: 1` with an `asOf` date and never presented as verified.
- Optional modifiers and extra lifelines are OFF by default.
- Check layouts with screenshots at phone (360px wide) and TV (1920×1080) sizes, in Arabic and English (`npm run shots`).
- Work step by step. Say what you're about to do before big changes. Keep features that already work.
- This game is NOT based on the owner's old "Majlis Quiz" project. Don't use or copy anything from it.
- No Seen Jeem voice lines, branding or content, and don't imitate their voice actor. Khatfa is its own game in the same genre.

## Key facts
- **What it is:** a Seen Jeem–style team quiz party game with its own name, look and content. Two teams (3–4 later) pick categories. The board has questions worth exactly 200 (easy) / 400 (hard) / 600 (brutal); these values are fixed. Teams take turns choosing. The host marks correct or wrong. A wrong or missing answer lets the other team steal, which is a "khatfa", the snatch the game is named after.
- **Live site:** https://sad-cpu141.github.io/khatfa/ (GitHub Pages, `main` branch, root folder).
- **Repo:** Sad-CPU141/khatfa.
- **Sibling game:** Draft Night, at Sad-CPU141/draft-night and https://sad-cpu141.github.io/draft-night/. Khatfa reuses its design and tech. Read that repo before rebuilding anything it already has.
- **Hub:** Sad-CPU141/sad-cpu141.github.io, a "game night" menu linking all the games.
- **Languages:** Arabic (RTL) and English, switchable. The default follows the device language (`deviceLang()` in `src/90-app.jsx`): Arabic devices get Arabic, everything else English. The game is international, so don't let Arab/Saudi content dominate. Keep it proportionate (about 10–12% of the bank; `npm run audit` reports the share). UI strings live in `src/05-i18n.js` as `[English, Arabic]`. Content is stored as `{ ar, en }`. Use `dir="auto"` for user text and CSS logical properties (`inset-inline-start`, `padding-inline`…), never `left`/`right`.
- **Fonts:** self-hosted in `fonts/` under the SIL OFL: Anton, Barlow, Barlow Semi Condensed (same as Draft Night) and Cairo for Arabic.
- **Look:** Draft Night's ink and purple palette with gold accents. Khatfa's own accent is teal `#22cfd6`, used for steals and the logo.
- **Firebase:** online play only, which is Step 5 and not started. Reuse the owner's project `draft-night-125a6` with the same config as Draft Night, but store everything under the top-level `/khatfa/rooms`. Draft Night uses the top-level `/rooms`, which must never be touched. Security rules must cover both games, and the owner needs exact paste instructions (Firebase console → Realtime Database → Rules). Warn about Spark (free) plan limits.

## How the code is laid out (same as Draft Night)
- A static site. React 18 UMD is vendored in `vendor/`. There's no bundler.
- Edit `src/`, then run `npm run build`. Never edit `app.js`, `index.html`, `sw.js` or the root `styles.css` by hand, because the build overwrites them and stamps a version.
- `src/00-platform.js` holds helpers, storage (IndexedDB → localStorage → memory), backup format and PWA/updates.
- `src/05-i18n.js` holds all interface text in both languages.
- `src/15-select.js` picks questions: difficulty curve, niche weighting, min/max tier, no-repeats (ids and shared `facts` keys), balanced Mixed, and the board report when a tier runs out.
- `src/32-categories.jsx` has the host's category browser and the in-game picker (search, Popular/Niche/group filters, counts, badges).
- `src/bank/*.js` is the built-in question bank, built into `bank.js`, which loads before `app.js`. The format is documented at the top of `src/bank/00-runtime.js`. Each row is `['id', 200|400|600, qEn, qAr, aEn, aAr, { s: sub, alt, altAr, h, hAr, n, nAr, r: 'Wikipedia article', v: 'web:YYYY-MM-DD', x: 1, f: 'fact-key', c: 1, asOf: 'YYYY-MM', ok: 1 }]`.
  - `x:1` marks a question as extra-niche for its tier.
  - `f` links questions that would give each other away, so they never share a board.
  - `c:1` plus `asOf` marks time-sensitive facts.
  - `v` is set ONLY when the fact was actually checked online that day.
  - `ok:1` marks a question as reviewed, which silences audit warnings.
  - Category meta `pop:1` / `niche:1` are curated Popular / Niche badges.
  - `KH_BANK.more(id, rows)` tops up an existing category (`95-topups.js`).
- `tools/audit.js` (`npm run audit`) has to report 0 errors before committing. Fix its warnings or mark the question as reviewed.
- `src/33-wrong.jsx` is the "This is wrong" sheet.
  - The engine side is `invalidateQuestion`, `invalidRefunds`, `findReplacement` and `replacementOptions` in `20-engine.js`.
  - Refunds reverse only that question's own score changes. Opening a question costs nothing in this game.
  - It is idempotent: the call names the question id, and a second call does nothing.
  - The reported list is `kh_issues_v1`.
- `src/35-media.jsx` holds the media players: picture (zoom/blur reveal), sound, and YouTube.
  - YouTube runs through the IFrame API on youtube-nocookie. We pause at `end` ourselves, because YouTube's `end` isn't always honoured.
  - Playback state lives in `game.current.play`, so the host's buttons drive whichever screen is the output.
  - `mediaStore` holds the user's media in the IndexedDB `khatfa-media` database, referenced as `idb:<id>`.
- `src/36-editor.jsx` is "My questions": packs (`kh_packs_v1`), the question form with validation and the verified gate, previews (including on the TV window), and pack export/import with media embedded.
  - `mergePacks` adds switched-on packs to the bank.
- `media/` holds built-in pictures and sounds. They are generated by `tools/media.js` from flag-icons, Natural Earth/world-atlas, CC0 packs and synthesis.
  - File names are content hashes. `src/bank/02-media.js` maps keys to files, and bank rows use `m: { type, src: '@key', alt, credit }`.
  - Credits are in `media/CREDITS.md`.
  - The service worker pre-caches media and serves audio byte ranges for offline Safari.
  - No built-in YouTube clips: we can't verify them from the build machine.
- **Lifelines** are in `20-engine.js`: `LIFELINES`, `enabledLifelines`, `lifelineBlock`, `useLifeline`, `endHelp` and `returnLifelines`. Their UI is in `src/38-lifelines.jsx`.
  - Team usage is stored in `game.ll[teamId][id]`. Effects for the open question are in `game.current.fx` (`double`, `shield`, `help { start, endsAt, mainLeft }`, `extra`).
  - `curValue(g)` is the question's value after Double It. markCorrect, markWrong and the penalty all use it, and refunds use the points actually recorded.
  - Shield blocks the steal in `markWrong`. The Call for Help deadline is ended by the host only (an App effect plus `endHelp`). The TV just shows the deadline.
  - A lifeline used on a question that is put back or flagged with "This is wrong" is returned.
  - Rules: `lifelines` (on), `extraTime` and `swap` (off).
- **Sound** is in `src/37-sound.jsx`, a single `sound` manager.
  - Source order: your upload in Settings (IndexedDB) → `sounds/<event>.mp3` (listed by build.js in `SOUND_FILES`) → built-in Web Audio synth → silence.
  - Exactly one device plays: the TV window if open (unless "play here"), otherwise the host. Events come from `soundEvents(prev, next)` in `setGame`, never from renders or undo, and each has a unique id, so nothing plays twice.
  - Ticks use `tickKey` (from deadlines; last 5 s, once per second).
  - Settings live in `settings.sound`.
- `src/20-engine.js` is the game rules as pure functions `(game, …) → game`, with undo history.
- `src/30-ui.jsx` has the shared UI, home, setup and how-to-play.
- `src/31-game.jsx` has category pick, board, question, results, menu and fix scores.
- `src/34-tv.jsx` handles TV mode: on this screen, or a second window linked by BroadcastChannel.
- `src/40-settings.jsx` is the settings screen and backup.
- `src/90-app.jsx` has the app state and saving, and mounts the app.
- Tests:
  - `npm test` runs rules and 300 random games, bank and selection rules (`tests/bank-rules.js`), a jsdom click-through, backup, and the TV window link.
  - `npm run shots` runs a Playwright click-through and screenshots into `shots/`, which is not committed.
  - `npm run media-test` (`tests/media.js`) and `node tests/editor.js` run the media players, TV window, editor and packs in real Chromium.
    - They use a stand-in for YouTube's IFrame API, because YouTube is unreachable from the build machine. Real YouTube is untested.
  - `node tests/step1.js` checks lifelines and sound in real Chromium: phone, laptop and TV screenshots, real Web Audio, voice-line upload, and the TV window playing alone.
  - jsdom suites are `tests/lifeline-rules.js` and `tests/sound-rules.js`.
  - Online tests will copy Draft Night's `tests/fake-firebase.js` approach.

## Roadmap
1. ✅ Foundation: board, teams, scoring, steals, timer, results, TV mode (this screen and a new window), AR/EN, settings, backup.
2. ✅ Built-in bank (~1,600 questions, 75 categories, 200/400/600, difficulty settings, no-repeats, category browser, audit). Still to do: the question editor, import/export of packs, and online verification of more questions (only a few are marked `v:` so far).
3. ✅ Picture, sound and clip questions; "This is wrong"; the question editor and packs. Still to do: a "Check all clips" button, testing real YouTube on devices, and more built-in sounds.
4. ✅ Game-night feel (Step 1 of the owner's plan): lifelines (ضاعفها / فزعة / درع, with optional تمديد / بدّل off), the sound manager, built-in generated sounds, a `sounds/` folder, voice lines in Settings, and mute/volume. Still to do: polish, private video files in packs (Step 2).
5. Online rooms with phones as buzzers or answer pads, the host still judging, and TV on another device.
6. Hub page and polish.
