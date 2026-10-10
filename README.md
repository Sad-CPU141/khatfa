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
- Arabic (right-to-left) and English. The app opens in the device's language: Arabic on an Arabic device, English otherwise. One tap switches.
- Two teams with their own names, colours and emoji. They take turns picking categories (with undo or a random pick), then play the board.
- House rules: questions per value, categories per team, answer time, steal time, and steals on or off. Optional modifier: wrong answers lose points (OFF by default).
- Questions run on a countdown with pause. The host can peek at the answer, along with alternatives, notes and a hint, then mark it correct, wrong, stolen or missed.
- Host menu: undo (it says what it will undo), put a question back, skip, fix scores, and end the game.
- Results: winner, final scores, best moments and a game log. Play again keeps the same teams.
- TV mode works on this device or in a second window. The TV never shows an answer before the host marks it.
- Saves on every change. Continue after closing, view recent games, export and import a backup, and install to the home screen. It works offline.

**Not built yet:** the question editor and pack import, picture, sound and clip questions, lifelines, online rooms with phone buzzers, and multiple-choice questions.

## Install on a phone
- **iPhone:** open the site in Safari → Share → **Add to Home Screen**.
- **Android:** open the site in Chrome → ⋮ menu → **Install app**.

## Development
```
npm install       # Babel (build), jsdom + fake-indexeddb (tests)
npm run build     # compiles src/ into app.js, bank.js, styles.css, index.html, sw.js
npm test          # rules, 300 random games, click-through, backup, TV window
npm run shots     # Playwright screenshots at 360px and 1920px, Arabic + English
npm run audit     # question bank report: counts, gaps, duplicates, balance (--json for data)
```
Edit files in `src/`, then build. Don't edit `app.js` directly. See `CLAUDE.md` for the layout of the code.

## Credits
Fonts: Anton, Barlow, Barlow Semi Condensed and Cairo, all under the SIL Open Font License (licences in `fonts/`). React is included under its MIT licence in `vendor/`. Questions are written for this game. Facts were checked against public references (usually the Wikipedia article named in each question's source field). Please report anything wrong.
