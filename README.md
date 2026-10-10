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

## What's in this version (Step 1)
- Arabic (right-to-left, the default) and English, with one tap to switch. Mixed-language names and questions display correctly.
- Two teams with their own names, colours and emoji.
- House rules: point values, 1 or 2 questions per value, categories per team, answer time, steal time, and steals on or off. Optional modifier: wrong answers lose points (OFF by default).
- Teams take turns picking categories (with undo or a random pick), then play the board.
- Questions run on a countdown with pause. The host can peek at the answer, then mark it correct, wrong, stolen or missed. Scores animate.
- Host menu: undo (it says what it will undo), put a question back, skip, fix scores, and end the game.
- Results: winner, final scores, best moments (biggest steal, best streak, most steals, sharpest team) and a game log. Play again keeps the same teams.
- TV mode: show the big-screen view on this device, or open it in a second window (cast it or drag it to the TV). The TV never shows an answer before the host marks it.
- The game saves on every change. Continue after closing the page, view recent games, export and import a backup, and install to the home screen. It works offline.
- A small **sample pack** (8 categories, 48 timeless questions in both languages) so you can play now. The question editor and real starter packs come next.

## Install on a phone
- **iPhone:** open the site in Safari → Share → **Add to Home Screen**.
- **Android:** open the site in Chrome → ⋮ menu → **Install app**.

## Development
```
npm install       # Babel (build), jsdom + fake-indexeddb (tests)
npm run build     # compiles src/ into app.js, styles.css, index.html, sw.js
npm test          # rules, 300 random games, click-through, backup, TV window
npm run shots     # Playwright screenshots at 360px and 1920px, Arabic + English
```
Edit files in `src/`, then build. Don't edit `app.js` directly. See `CLAUDE.md` for the layout of the code.

## Credits
Fonts: Anton, Barlow, Barlow Semi Condensed and Cairo, all under the SIL Open Font License (licences in `fonts/`). React is included under its MIT licence in `vendor/`. Questions in the sample pack are written for this game.
