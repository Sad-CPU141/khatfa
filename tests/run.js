// Khatfa tests: game rules (random games), a full click-through of the app in a
// simulated browser (jsdom, same approach as Draft Night), backup/restore,
// persistence, and the TV window link (BroadcastChannel between two windows).
// Run: npm test   (after npm install and npm run build)
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const root = path.join(__dirname, '..');
let failures = 0;
const ok = (cond, msg) => { if (cond) console.log('  ✓ ' + msg); else { failures++; console.log('  ✗ ' + msg); } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function boot({ idb = true, storage, speed, url, bc, navLang } = {}) {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8').replace(/<script[^>]*src="[^"]*"[^>]*><\/script>/g, '').replace(/<link[^>]*>/g, '');
  const dom = new JSDOM(html, { url: url || 'https://sad-cpu141.github.io/khatfa/', runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window;
  w.__KH_TEST__ = true;
  w.addEventListener('error', (e) => console.log('    PAGE ERROR:', e.error && (e.error.stack || e.error.message)));
  w.console.error = (...a) => { console.log('    CONSOLE.ERROR:', String(a[0]).slice(0, 400), a[0] && a[0].stack ? a[0].stack.slice(0, 600) : ''); };
  if (speed) w.__KH_TEST_SPEED = speed;
  if (navLang) { Object.defineProperty(w.navigator, 'language', { value: navLang, configurable: true }); Object.defineProperty(w.navigator, 'languages', { value: [navLang], configurable: true }); }
  if (bc) w.BroadcastChannel = globalThis.BroadcastChannel;
  w.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {} });
  w.scrollTo = () => {};
  w.navigator.vibrate = () => true;
  w.URL.createObjectURL = () => 'blob:test'; w.URL.revokeObjectURL = () => {};
  if (idb) { const fake = require('fake-indexeddb'); w.indexedDB = fake.indexedDB; w.IDBKeyRange = fake.IDBKeyRange; }
  if (storage) Object.entries(storage).forEach(([k, v]) => w.localStorage.setItem(k, v));
  for (const f of ['vendor/react.production.min.js', 'vendor/react-dom.production.min.js', 'bank.js', 'app.js']) w.eval(fs.readFileSync(path.join(root, f), 'utf8'));
  await sleep(150);
  return { dom, w, d: w.document, KH: w.__KH };
}
const btn = (d, text) => [...d.querySelectorAll('button')].find((b) => b.textContent.replace(/\s+/g, ' ').trim().toLowerCase().includes(text.toLowerCase()) && !b.disabled);
async function click(w, el) { if (!el) throw new Error('missing element'); el.dispatchEvent(new w.MouseEvent('click', { bubbles: true })); await sleep(25); }
const text = (d) => d.body.textContent;
const closeFlash = async (w, d) => { const f = d.querySelector('.flash'); if (f) await click(w, f); };

(async () => {
  /* ---------------- rules ---------------- */
  console.log('Game rules');
  {
    const { KH } = await boot();
    const B = KH.BANK;
    const teams = [{ name: 'A' }, { name: 'B' }];
    const ctx = { bank: B, recent: {} };
    const board = (rules) => { let g = KH.createGame(B, teams, rules || {}, 0); for (let i = 0; i < 20 && g.phase === 'pick'; i++) g = KH.randomPick(g, ctx); return g; };
    let g = KH.createGame(B, teams, {}, 1000);
    ok(g.phase === 'pick' && g.rules.perValue === 2 && g.rules.catsPerTeam === 3, 'defaults: 2 per value, 3 categories per team');
    ok(g.rules.steals === true && g.rules.wrongPenalty === false && g.rules.curve === 'standard' && !g.rules.niche && !g.rules.nicheOnly && !g.rules.strict && !g.rules.mixed && !g.rules.randomCats && !g.rules.progressive, 'defaults: steals on; every optional setting off / standard');
    ok(KH.pickingTeam(g).id === 't0', 'team 1 picks first');
    g = KH.pickCategory(g, 'capitals', ctx);
    ok(KH.pickingTeam(g).id === 't1', 'teams alternate picks');
    ok(KH.pickCategory(g, 'capitals', ctx) === g, 'a category can’t be picked twice');
    g = KH.undo(g);
    ok(g.cats.length === 0 && KH.pickingTeam(g).id === 't0', 'undo takes a pick back');
    g = board();
    ok(g.phase === 'board' && g.cells.length === 36 && g.cells.every((c) => c.q), 'after 6 picks the board has 36 questions');
    ok(!JSON.stringify(g).includes('"questions"'), 'the saved game holds only its own 36 questions, not the whole bank');
    // correct answer
    const t0 = 50000;
    let c = g.cells.find((x) => x.value === 400);
    g = KH.openCell(g, c.id, t0);
    ok(g.phase === 'question' && g.current.team === 't0' && g.current.endsAt === t0 + 45000, 'opening a question starts a 45s clock for the team whose turn it is');
    ok(KH.timeLeft(g, t0 + 10000) === 35000, 'time left counts down');
    let p = KH.pauseTimer(g, t0 + 10000); ok(KH.timeLeft(p, t0 + 99999) === 35000, 'pause freezes the clock');
    p = KH.resumeTimer(p, t0 + 60000); ok(KH.timeLeft(p, t0 + 61000) === 34000, 'resume carries on from where it paused');
    g = KH.markCorrect(g);
    ok(g.teams[0].score === 400 && g.current.stage === 'reveal' && g.current.result.kind === 'correct', 'correct: +400 to the answering team, answer revealed');
    g = KH.finishQuestion(g, t0 + 20000);
    ok(g.phase === 'board' && KH.turnTeam(g).id === 't1' && g.cells.find((x) => x.id === c.id).status === 'done', 'after the question the turn passes and the tile is used');
    c = g.cells.find((x) => x.status === 'open' && x.value === 600);
    g = KH.openCell(g, c.id, t0); g = KH.markWrong(g, t0 + 5000);
    ok(g.current.stage === 'steal' && g.current.team === 't0' && g.current.endsAt === t0 + 5000 + 15000, 'wrong: the other team gets a 15s steal chance');
    ok(g.teams[1].score === 0, 'no penalty by default');
    g = KH.markCorrect(g);
    ok(g.teams[0].score === 1000 && g.current.result.kind === 'stolen', 'stolen: the stealing team gets the 600');
    g = KH.finishQuestion(g, t0);
    ok(KH.turnTeam(g).id === 't0', 'turn order is unaffected by steals');
    c = KH.openCells(g)[0];
    g = KH.openCell(g, c.id, t0); g = KH.markWrong(g, t0); g = KH.markWrong(g, t0);
    ok(g.current.stage === 'reveal' && g.current.result.kind === 'missed' && g.teams.map((x) => x.score).join() === '1000,0', 'a missed steal gives nobody points');
    g = KH.finishQuestion(g, t0);
    c = KH.openCells(g)[0];
    const before = KH.turnTeam(g).id;
    g = KH.putBack(KH.openCell(g, c.id, t0));
    ok(g.phase === 'board' && g.cells.find((x) => x.id === c.id).status === 'open' && KH.turnTeam(g).id === before, 'putting a question back leaves it open and keeps the same team’s turn');
    g = KH.finishQuestion(KH.skipQuestion(KH.openCell(g, c.id, t0)), t0);
    ok(g.cells.find((x) => x.id === c.id).status === 'done' && g.log[g.log.length - 1].kind === 'skipped', 'skipping uses the question up with no points');
    let gp = board({ wrongPenalty: true });
    const c2 = gp.cells.find((x) => x.value === 200);
    gp = KH.markWrong(KH.openCell(gp, c2.id, 0), 0);
    ok(gp.teams[0].score === -200 && gp.current.stage === 'steal', 'with the penalty modifier on, a wrong answer loses the value (then the steal still happens)');
    gp = KH.markCorrect(gp);
    ok(gp.teams[1].score === 200, '…and a steal never loses points');
    let gs = board({ steals: false });
    gs = KH.markWrong(KH.openCell(gs, gs.cells[0].id, 0), 0);
    ok(gs.current.stage === 'reveal', 'with steals off, a wrong answer goes straight to the answer');
    let gu = KH.adjustScore(g, 't1', 200, 0);
    ok(gu.teams[1].score === 200 && gu.log[gu.log.length - 1].kind === 'adjust', 'fix scores adds to the score and to the log');
    ok(KH.undo(gu).teams[1].score === 0, 'undo reverts a score fix');
    const g1 = board({ perValue: 1, catsPerTeam: 2 });
    ok(g1.phase === 'board' && g1.cells.length === 12, '1 question per value, 2 categories each → 12 tiles');

    let stuck = 0, badSum = 0, reused = 0;
    for (let run = 0; run < 300; run++) {
      let r = KH.createGame(B, run % 5 === 0 ? [{ name: 'A' }, { name: 'B' }, { name: 'C' }] : teams, { perValue: 1 + (run % 2), catsPerTeam: 1 + (run % 2), wrongPenalty: run % 3 === 0, steals: run % 7 !== 0, curve: ['standard', 'steep', 'brutal'][run % 3], mixed: run % 4 === 0, progressive: run % 6 === 0, minTier: run % 9 === 0 ? 2 : 1 }, 0);
      let steps = 0;
      while (r.phase !== 'done' && steps++ < 3000) {
        if (r.phase === 'pick') { r = KH.randomPick(r, ctx); continue; }
        if (r.phase === 'board') { const open = KH.openCells(r).filter((x) => !KH.isLocked(r, x)); r = KH.openCell(r, open[Math.floor(Math.random() * open.length)].id, 0); continue; }
        const x = Math.random();
        if (r.current.stage === 'reveal') r = x < 0.05 ? KH.undo(r) : KH.finishQuestion(r, 0);
        else if (x < 0.4) r = KH.markCorrect(r); else if (x < 0.9) r = KH.markWrong(r, 0); else if (x < 0.95) r = KH.skipQuestion(r); else r = KH.putBack(r);
      }
      if (r.phase !== 'done') stuck++;
      const fromLog = {}; r.teams.forEach((tm) => { fromLog[tm.id] = 0; });
      r.log.forEach((e) => { if (e.team) fromLog[e.team] += e.points; if (e.penalty) fromLog[e.turnTeam] -= e.penalty; });
      if (r.teams.some((tm) => tm.score !== fromLog[tm.id])) badSum++;
      const cells = r.log.filter((e) => e.cell).map((e) => e.cell);
      if (new Set(cells).size !== cells.length) reused++;
      KH.gameStats(r); KH.winners(r);
    }
    ok(stuck === 0, '300 random games (2–3 teams, every setting mixed in, undo/skip/put back) all finish');
    ok(badSum === 0, 'final scores always match the game log');
    ok(reused === 0, 'no tile is ever played twice');
    let gt = board(); gt = KH.openCell(gt, gt.cells[0].id, 0);
    const tv = KH.tvGame(gt);
    ok(!tv.history && tv.cells.every((x) => !x.q.a && !x.q.alt && !x.q.hint), 'the TV copy has no answers, accepted answers or hints while the question is open');
    gt = KH.markCorrect(gt);
    ok(KH.tvGame(gt).cells[0].q.a && KH.tvGame(gt).cells[1].q.a === null, 'after marking, the TV gets only that question’s answer');
    ok(KH.winners({ teams: [{ id: 'a', score: 5 }, { id: 'b', score: 5 }] }).length === 0, 'equal scores = a draw');
  }
  await require('./bank-rules.js')({ ok, boot });
  await require('./wrong-rules.js')({ ok, boot });
  await require('./pack-rules.js')({ ok, boot });

  /* ---------------- language ---------------- */
  console.log('Language');
  {
    const { KH } = await boot();
    const keys = Object.keys(KH.S);
    ok(keys.every((k) => Array.isArray(KH.S[k]) && KH.S[k].length === 2 && KH.S[k][0] && KH.S[k][1]), 'every interface string has English and Arabic (' + keys.length + ' strings)');
    const vars = keys.filter((k) => typeof KH.S[k][0] === 'string' && (KH.S[k][0].match(/\{\w+\}/g) || []).sort().join() !== (KH.S[k][1].match(/\{\w+\}/g) || []).sort().join());
    ok(!vars.length, 'English and Arabic strings use the same placeholders' + (vars.length ? ' — mismatched: ' + vars.join(', ') : ''));
    ok(KH.pick({ ar: '', en: 'Only English' }, 'ar') === 'Only English', 'content missing in one language falls back to the other');
  }

  /* ---------------- click-through ---------------- */
  console.log('Click-through (language follows the device, then switching)');
  {
    const E = await boot({ idb: false, navLang: 'en-GB' });
    ok(E.d.documentElement.getAttribute('dir') === 'ltr' && E.d.documentElement.getAttribute('lang') === 'en' && !!btn(E.d, 'New game'), 'an English (or any non-Arabic) device opens in English, left-to-right');
    E.w.close();
    const { w, d, KH } = await boot({ speed: 0.02, navLang: 'ar-SA' });
    ok(d.documentElement.getAttribute('dir') === 'rtl' && d.documentElement.getAttribute('lang') === 'ar', 'an Arabic device opens in Arabic, right-to-left');
    ok(/خطفة/.test(text(d)) && !!btn(d, 'لعبة جديدة'), 'home screen shows the logo and “New game”');
    await click(w, btn(d, 'English'));
    ok(d.documentElement.getAttribute('dir') === 'ltr' && !!btn(d, 'New game'), 'one tap switches to English, left-to-right');
    await click(w, btn(d, 'العربية'));
    ok(d.documentElement.getAttribute('dir') === 'rtl', 'and back to Arabic');
    await click(w, btn(d, 'English'));

    await click(w, btn(d, 'New game'));
    const names = d.querySelectorAll('.teamedit input');
    ok(names.length === 2 && names[0].value === 'Falcons' && names[1].value === 'Leopards', 'setup starts with two named teams');
    const setVal = async (el, v) => { const proto = Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, 'value'); proto.set.call(el, v); el.dispatchEvent(new w.Event('input', { bubbles: true })); await sleep(20); };
    await setVal(names[0], 'الأبطال');
    await setVal(names[1], '');
    ok(!btn(d, 'Pick categories') && /Give every team a name/.test(text(d)), 'a blank team name blocks the start, with a reason');
    await setVal(names[1], 'Night Owls');
    const sec = (t) => [...d.querySelectorAll('.rtitle')].find((b) => b.textContent.includes(t));
    await click(w, sec('House rules'));
    ok(d.querySelector('.rbody .toggle').getAttribute('aria-pressed') === 'true' && /always 200 \(easy\), 400 \(hard\) and 600/.test(text(d)), 'house rules: points fixed at 200/400/600, steals on');
    await click(w, sec('Difficulty'));
    ok(/Standard/.test(text(d)) && [...d.querySelectorAll('.rbody .toggle')].slice(1).every((x) => x.getAttribute('aria-pressed') === 'false'), 'difficulty: Standard curve, niche / strict / progressive all off');
    await click(w, sec('Optional modifiers'));
    ok(/Wrong answers lose points/.test(text(d)) && [...d.querySelectorAll('.toggle')].find((x) => /Wrong answers lose/.test(x.textContent)).getAttribute('aria-pressed') === 'false', 'the optional modifier is off');
    ok([...d.querySelectorAll('.toggle')].filter((x) => /Random categories|Mixed categories/.test(x.textContent)).every((x) => x.getAttribute('aria-pressed') === 'false'), 'random and mixed categories are off');
    // category browser: search, switch one off
    await click(w, btn(d, 'Choose categories'));
    const search = d.querySelector('.catbrowser input[type=search]');
    await setVal(search, 'formula');
    ok(d.querySelectorAll('.crow').length === 1 && /Formula 1/.test(d.querySelector('.crow').textContent), 'searching categories finds Formula 1');
    ok(/\d+/.test(d.querySelector('.crow .tiercounts').textContent), 'each category shows its real question counts per value');
    await click(w, d.querySelector('.crow-main'));
    ok(d.querySelector('.crow').classList.contains('off'), 'a category can be switched off');
    await setVal(search, 'tennis');
    await click(w, btn(d, 'Shown off'));
    await setVal(search, '');
    const nSports = KH.BANK.cats.filter((c) => c.group === 'sports').length;
    ok([...d.querySelectorAll('.cgroup')].length > 5 && new RegExp((nSports - 2) + '/' + nSports).test(text(d)), 'with a search typed, “Shown off” only switches off the categories shown (F1 and tennis off, ' + (nSports - 2) + ' of ' + nSports + ' sports on)');
    await setVal(search, 'tennis');
    await click(w, btn(d, 'Shown on'));
    await setVal(search, '');
    await click(w, btn(d, 'Done'));
    ok(/of \d+ categories on/.test(text(d)), 'setup shows how many categories are on');
    await click(w, btn(d, '30s'));
    await click(w, btn(d, 'Pick categories'));
    ok(!!d.querySelector('.catgrid') && /الأبطال, pick a category/.test(text(d)), 'category pick: the first team is asked to pick (mixed Arabic name in English UI)');
    const cards = () => [...d.querySelectorAll('.catcard')];
    ok(!cards().some((c) => /Formula 1/.test(c.textContent)), 'the switched-off category isn’t offered in the game');
    await click(w, cards()[0]);
    ok(cards()[0].disabled && /Night Owls, pick a category/.test(text(d)), 'picked category is taken, turn passes');
    await click(w, btn(d, 'Undo pick'));
    ok(!cards()[0].disabled, 'undo last pick works');
    for (let i = 0; i < 6; i++) await click(w, cards().find((c) => !c.disabled));
    ok(!!d.querySelector('.board') && d.querySelectorAll('.tile.open').length === 36, 'the board appears with 36 open tiles');
    ok(/الأبطال to pick/.test(text(d)), 'the board says whose turn it is');

    // a question: correct
    await click(w, d.querySelector('.tile.open'));
    ok(!!d.querySelector('.qcard') && !d.querySelector('.qans'), 'opening a tile shows the question, answer hidden');
    ok(/30/.test(d.querySelector('.ck-n').textContent), 'the clock uses the 30s house rule');
    await click(w, btn(d, 'Show answer'));
    ok(!!d.querySelector('.qans'), 'host can peek at the answer');
    await click(w, btn(d, 'Hide answer'));
    await click(w, btn(d, 'Correct'));
    ok(/Correct!/.test(d.querySelector('.flash').textContent), 'marking correct shows a “Correct!” flash');
    await closeFlash(w, d);
    ok(!!d.querySelector('.qans') && /\+200 to الأبطال/.test(text(d)), 'the answer is revealed with the points awarded');
    await click(w, btn(d, 'Back to the board'));
    ok(d.querySelectorAll('.tile.done').length === 1 && /Night Owls to pick/.test(text(d)), 'back on the board: one tile used, other team’s turn');
    ok(KH.store.get('kh_current_v1').teams[0].score === 200, 'the game is saved after every change');

    // wrong → steal
    await click(w, d.querySelectorAll('.tile.open')[3]);
    await click(w, d.querySelector('.btn-wrong'));
    await closeFlash(w, d);
    ok(/Steal chance: الأبطال/.test(text(d)) && !!btn(d, 'Stolen'), 'wrong answer opens a steal chance for the other team');
    await click(w, btn(d, 'Stolen'));
    ok(/Khatfa!/.test(d.querySelector('.flash').textContent), 'a steal shows the “Khatfa!” flash');
    await closeFlash(w, d);
    await click(w, btn(d, 'Back to the board'));
    ok(d.querySelector('.tile.done.k-stolen'), 'the stolen tile is marked on the board');

    // timer runs out (fast test speed): shows Time's up, host still decides
    await click(w, d.querySelector('.tile.open'));
    await sleep(30 * 1000 * 0.02 + 400);
    ok(/Time’s up/.test(d.querySelector('.clock').textContent), 'when the clock runs out it says “Time’s up!”');
    await click(w, d.querySelector('.btn-wrong')); await closeFlash(w, d);
    await click(w, btn(d, 'Missed')); await closeFlash(w, d);
    ok(/No points this time/.test(text(d)), 'missed steal: no points');
    await click(w, btn(d, 'Back to the board'));

    // menu: put back, fix scores, undo
    await click(w, d.querySelector('.tile.open'));
    await click(w, d.querySelector('[aria-label="Menu"]'));
    await click(w, btn(d, 'Put question back'));
    ok(!!d.querySelector('.board') && d.querySelectorAll('.tile.done').length === 3, 'menu → put question back returns to the board');
    await click(w, d.querySelector('[aria-label="Menu"]'));
    await click(w, btn(d, 'Fix scores'));
    const before = KH.store.get('kh_current_v1').teams[1].score;
    await click(w, d.querySelector('.fixrow:nth-of-type(2) .mini:last-of-type') || d.querySelectorAll('.fixrow')[1].querySelectorAll('.mini')[1]);
    ok(KH.store.get('kh_current_v1').teams[1].score === before + 200, 'fix scores adds 200');
    await click(w, btn(d, 'Close'));
    await click(w, d.querySelector('[aria-label="Menu"]'));
    ok(/Undo: the score fix/.test(text(d)), 'the menu says exactly what undo will undo');
    await click(w, btn(d, 'Undo: the score fix'));
    ok(KH.store.get('kh_current_v1').teams[1].score === before, 'undo reverts it');
    // tap a score to fix it, including typing an exact score
    await click(w, d.querySelectorAll('.scard.editable')[0]);
    ok(!!d.querySelector('.fixteam') && /Gave the wrong team points/.test(text(d)), 'tapping a team’s score opens “Fix scores”');
    const ex = d.querySelectorAll('.fixexact input')[0];
    const setter = Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, 'value').set;
    setter.call(ex, '1300'); ex.dispatchEvent(new w.Event('input', { bubbles: true }));
    await sleep(20);
    await click(w, d.querySelectorAll('.fixexact .btn')[0]);
    const fixed = KH.store.get('kh_current_v1');
    ok(fixed.teams[0].score === 1300 && fixed.log[fixed.log.length - 1].kind === 'adjust', 'typing an exact score sets it (and it’s logged)');
    await click(w, btn(d, 'Undo the last fix'));
    ok(KH.store.get('kh_current_v1').teams[0].score !== 1300, '“Undo the last fix” puts it back');
    await click(w, btn(d, 'Close'));

    // TV view on this screen
    await click(w, d.querySelector('.tvbtn'));
    await click(w, btn(d, 'Show TV view on this screen'));
    ok(!!d.querySelector('.tvmode .board.big') && !d.querySelector('.tvmode .tile.open:not([disabled])'), 'TV view shows the board, with no buttons that change the game');
    await click(w, btn(d, 'Back to controls'));
    ok(!!d.querySelector('.board:not(.big)'), 'back to controls');

    // resume after reload
    const saved = KH.store.get('kh_current_v1'); await KH.store.flush();
    const r2 = await boot({ storage: { kh_current_v1: JSON.stringify(saved), kh_settings_v1: JSON.stringify({ lang: 'en' }) }, idb: false });
    ok(!!btn(r2.d, 'Continue game') && /33 questions left/.test(text(r2.d)), 'after a reload, home offers “Continue game”');
    await click(r2.w, btn(r2.d, 'Continue game'));
    ok(r2.d.querySelectorAll('.tile.done').length === 3, 'continuing restores the board exactly');

    // "This is wrong" on an answered question: exact refund, replacement, logged
    await click(w, d.querySelector('.tile.open'));
    const qBefore = d.querySelector('.qtext').textContent;
    const pre = KH.store.get('kh_current_v1').teams.map((x) => x.score);
    const turnIdx = KH.store.get('kh_current_v1').teams.findIndex((x) => x.id === KH.store.get('kh_current_v1').current.team);
    await click(w, d.querySelector('.btn-right')); await closeFlash(w, d);
    const val = KH.store.get('kh_current_v1').cells.find((c) => c.id === KH.store.get('kh_current_v1').current.cell).value;
    ok(KH.store.get('kh_current_v1').teams[turnIdx].score === pre[turnIdx] + val, 'setup: a correct answer added ' + val);
    ok(!!btn(d, 'This is wrong') && d.querySelector('.wrongbtn').classList.contains('btn-flag'), '“This is wrong” is on the question screen, styled apart from the scoring buttons');
    await click(w, btn(d, 'This is wrong'));
    ok(/These score changes will be reversed/.test(text(d)) && /−/.test(d.querySelector('.refundbox').textContent), 'the sheet shows exactly which points will be reversed');
    await click(w, btn(d, 'Wrong answer'));
    await click(w, btn(d, 'Reverse points and replace'));
    const after = KH.store.get('kh_current_v1');
    ok(after.teams.map((x) => x.score).join() === pre.join(), 'confirming restores both teams to their scores before that question');
    ok(after.phase === 'question' && after.current.stage === 'answer' && d.querySelector('.qtext').textContent !== qBefore, 'a replacement question opens straight away');
    ok(/points reversed/.test(text(d)), 'the host sees a short confirmation');
    ok(KH.store.get('kh_issues_v1', []).length === 1 && KH.store.get('kh_issues_v1')[0].reason === 'answer', 'the flagged question is saved to the reported list with its reason');
    await click(w, btn(d, 'This is wrong'));
    ok(/nothing needs refunding/.test(text(d)), 'flagging the replacement before anyone answers: nothing to refund');
    await click(w, btn(d, 'Cancel'));
    await click(w, d.querySelector('.btn-wrong')); await closeFlash(w, d);
    await click(w, btn(d, 'Missed')); await closeFlash(w, d);
    await click(w, btn(d, 'Back to the board'));
    // a played question, from the menu
    const doneBefore = d.querySelectorAll('.tile.done').length;
    await click(w, d.querySelector('[aria-label="Menu"]'));
    await click(w, btn(d, 'A played question was wrong'));
    await click(w, d.querySelector('.optrow.played'));
    await click(w, btn(d, 'Remove and replace'));
    ok(d.querySelectorAll('.tile.done').length === doneBefore - 1 && !!d.querySelector('.board'), 'a played question can be flagged from the menu: its tile reopens with a replacement');

    // end the game
    await click(w, d.querySelector('[aria-label="Menu"]'));
    await click(w, btn(d, 'End game now'));
    await click(w, d.querySelector('.modal .btn-danger'));
    ok(!!d.querySelector('.winner') && /Results/.test(text(d)), 'ending the game shows the results');
    ok(/Biggest steal/.test(text(d)) && /Final scores/.test(text(d)), 'results show final scores and best moments');
    ok(KH.store.get('kh_past_v1', []).length === 1, 'the finished game is saved to recent games');
    await click(w, btn(d, 'Play again'));
    ok(!!d.querySelector('.catgrid') && /الأبطال/.test(text(d)), 'play again: same teams, straight to picking categories');
    await click(w, d.querySelector('[aria-label="Menu"]'));
    await click(w, btn(d, 'Back to home'));
    ok(/Recent games/.test(text(d)), 'home lists recent games');

    // backup round trip
    const bk = KH.makeBackup({ settings: { lang: 'en' }, game: KH.store.get('kh_current_v1'), past: KH.store.get('kh_past_v1', []), packs: [] });
    const v = KH.validateBackup(JSON.parse(JSON.stringify(bk)));
    ok(v.ok && v.summary.past === 1 && v.summary.current, 'backup: export validates and round-trips');
    ok(KH.validateBackup({ app: 'draft-night' }).error === 'bkNotOurs', 'backup: a Draft Night file is refused with a clear message');
    ok(KH.validateBackup({ ...bk, format: 99 }).error === 'bkNewer', 'backup: a newer format is refused');
    ok(KH.validateBackup({ ...bk, data: { ...bk.data, past: [{}] } }).error === 'bkDamaged', 'backup: damaged games are refused');
  }

  /* ---------------- TV window link ---------------- */
  console.log('TV in a second window (BroadcastChannel)');
  {
    if (typeof globalThis.BroadcastChannel !== 'function') { console.log('  (skipped: this Node has no BroadcastChannel)'); }
    else {
      const H = await boot({ speed: 0.02, bc: true, idb: false, storage: { kh_settings_v1: JSON.stringify({ lang: 'ar' }) } });
      const T = await boot({ bc: true, url: 'https://sad-cpu141.github.io/khatfa/#tv', idb: false, navLang: 'ar' });
      await sleep(100);
      ok(/بانتظار لعبة/.test(text(T.d)), 'TV window waits for a game');
      await click(H.w, btn(H.d, 'لعبة جديدة'));
      await click(H.w, btn(H.d, 'اختيار الفئات'));
      await sleep(80);
      ok(!!T.d.querySelector('.tvmode .tv-head .picker'), 'TV shows whose turn it is to pick a category');
      for (let i = 0; i < 6; i++) await click(H.w, [...H.d.querySelectorAll('.catcard')].find((c) => !c.disabled));
      await sleep(80);
      ok(T.d.querySelectorAll('.tvmode .tile.open').length === 36, 'TV shows the full board');
      await click(H.w, H.d.querySelector('.tile.open'));
      await sleep(80);
      ok(!!T.d.querySelector('.tvmode .qcard') && !T.d.querySelector('.tvmode .qans'), 'TV shows the question without the answer');
      await click(H.w, btn(H.d, 'إظهار الإجابة'));
      await sleep(60);
      ok(!T.d.querySelector('.tvmode .qans'), 'the host peeking at the answer doesn’t show it on the TV');
      await click(H.w, btn(H.d, 'صح'));
      await sleep(80);
      ok(!!T.d.querySelector('.tvmode .flash.k-correct'), 'the TV plays the “correct” flash');
      ok(!!T.d.querySelector('.tvmode .qans') && /200/.test(T.d.querySelector('.scard').textContent), 'after marking, the TV shows the answer and the new score');
      H.w.close(); T.w.close();
    }
  }

  console.log(failures ? '\n' + failures + ' FAILED' : '\nAll tests passed');
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
