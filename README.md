# خطفة · Khatfa

A team quiz party game. Pick categories, choose a question, beat the clock. Get it wrong and the other team can snatch your points: that's a **khatfa**.

**Play:** https://sad-cpu141.github.io/khatfa/

A sibling of [Draft Night](https://sad-cpu141.github.io/draft-night/), from the same game night.

## How to play
- Split into two teams. Each team picks categories, and they all go on the board.
- Teams take turns choosing a question. Harder questions are worth more (200 / 400 / 600 by default).
- The host reads the question and the clock runs. If it's right, the team takes the points.
- If it's wrong or the time runs out, the other team gets a short chance to steal it.
- When the board is empty, the team with the most points wins.

## What's in this version
- **Built-in question bank:** about 1,600 questions in 75 categories across 14 topic groups: sport, film and TV, anime, video games, music, internet culture, geography, history, science, nature, food, brands, language, and the Arab world and Islam. Every category has at least 20 questions, in both Arabic and English. Run `npm run audit` for exact counts.
- **Three difficulty levels:** 200 (easy), 400 (hard) and 600 (brutal). Points are fixed. Each question also has a source reference. Time-sensitive facts (records, "best-selling"…) carry an "as of" date and are flagged for checking.
- **Difficulty settings:** curve (Standard / Steep / Brutal), minimum and maximum difficulty, Niche mode, Niche only, Strict no-repeats, and Progressive difficulty. All optional ones are OFF by default.
- **No repeats:** the same question or fact never appears twice in a game. Recently seen questions are avoided across games on this device. With Strict no-repeats, a category that runs out shows an empty tile and explains why rather than repeating. You can reset the question history in Settings.
- **Categories:** search; filters for Popular, Niche and each topic group; real question counts per value; switch categories or whole groups on and off; subcategories. Also Random categories, and a balanced Mixed category drawn from several topics.
- **Picture, sound and clip questions** across the topics:
  - 52 pictures: flags, country outlines and countries highlighted on a map, some with a zoomed-in reveal.
  - 29 emoji puzzles.
  - 21 sounds: instruments, animals, everyday sounds and science tones.
  - All of these are built in and work offline. Media questions also use 200 / 400 / 600.
  - The host has Play, Pause, Replay and volume. Nothing plays until the host presses Play.
  - Sound and clips play on the TV window when one is open.
- **Clip questions** (YouTube): add your own in the editor, using official uploads only.
  - The clip plays in YouTube's own player, between a start and end time you choose. The player is never covered, and the video is never downloaded.
  - The host is warned if the video's title may give the answer away, or if the video can't be embedded.
  - Clips need internet. There are no built-in clips, because they couldn't be checked from where the game was built.
- **Lifelines:** each team gets one use of each, during its own answer.
  - **ضاعفها Double It:** the question scores double, steals included.
  - **فزعة Call for Help:** a 30-second countdown on the host and TV; the answer clock waits.
  - **درع Shield:** no steal if the answer is wrong.
  - Optional, off by default: **تمديد Extra Time** (+30 s) and **بدّل Swap** (a new question of the same value). Turn them on in Settings or in New game.
  - Undo, "This is wrong" refunds and the game log all handle them.
- **Sound:**
  - Clock ticks in the last 5 seconds, plus correct, wrong and steal sounds, category reveal, intro, winner fanfare and lifeline sounds.
  - Built-in generated sounds, or your own: upload a voice line for any moment in Settings → Sound (for example "Khatfa!" for a steal), or drop files into `sounds/` (see `sounds/README.md`).
  - Volume, mute and preview controls. Only one screen plays: the TV window if open, otherwise this device.
- **“This is wrong”** button on every question. It removes a broken or wrong question and reverses only the points that question caused, and nothing is reversed twice. It replaces the question with an unused one of the same value from the same category, or lets the host choose a fallback. Played questions can be flagged from the menu. Flagged questions go to a reported list in Settings, which you can export.
- **My questions:** an editor for your own packs.
  - Supports text, picture, sound and clip questions, in built-in categories or your own.
  - Each question checks for missing information before saving. A question can only be saved as verified once a source is given.
  - Previews work on the TV window.
  - Export and import packs: one file per pack, with its pictures and sounds included.
- Arabic (right-to-left) and English. The app opens in the device's language: Arabic on an Arabic device, English otherwise. One tap switches.
- Two teams with their own names, colours and emoji. They take turns picking categories (with undo or a random pick), then play the board.
- House rules: questions per value, categories per team, answer time, steal time, and steals on or off. Optional modifier: wrong answers lose points (OFF by default).
- Questions run on a countdown with pause. The host can peek at the answer, along with alternatives, notes and a hint, then mark it correct, wrong, stolen or missed.
- Host menu: undo (it says what it will undo), put a question back, skip, fix scores, and end the game.
- Results: winner, final scores, best moments and a game log. Play again keeps the same teams.
- TV mode works on this device or in a second window. The TV never shows an answer before the host marks it.
- Saves on every change. Continue after closing, view recent games, export and import a backup, and install to the home screen. It works offline.

**Not built yet:** online rooms with phone buzzers (so no multiplayer sync yet), and multiple-choice questions.

## Install on a phone
- **iPhone:** open the site in Safari → Share → **Add to Home Screen**.
- **Android:** open the site in Chrome → ⋮ menu → **Install app**.

## Development
```
npm install       # Babel (build), jsdom + fake-indexeddb (tests)
npm run build     # compiles src/ into app.js, bank.js, styles.css, index.html, sw.js
npm test          # rules, 300 random games, click-through, backup, TV window
npm run shots     # Playwright screenshots at 360px and 1920px, Arabic + English
npm run audit     # question bank report: counts, gaps, duplicates, balance, media files (--json for data)
npm run media-test  # pictures, sounds, clips (stand-in YouTube player), TV window, in Chromium
node tests/editor.js  # the question editor and packs, in Chromium
node tools/media.js <cc0-folder>  # rebuild the built-in pictures and sounds (see media/CREDITS.md)
```
Edit files in `src/`, then build. Don't edit `app.js` directly. See `CLAUDE.md` for the layout of the code.

## Credits
Fonts: Anton, Barlow, Barlow Semi Condensed and Cairo, all under the SIL Open Font License (licences in `fonts/`). React is included under its MIT licence in `vendor/`. Built-in pictures and sounds: see [media/CREDITS.md](media/CREDITS.md). Flags come from flag-icons (MIT). Maps come from Natural Earth (public domain) via world-atlas (ISC). Recorded sounds are CC0, by Kenney and Ben Burnes / Abstraction. Other tones are generated. Questions are written for this game. Facts were checked against public references (usually the Wikipedia article named in each question's source field). Please report anything wrong.
