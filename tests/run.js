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

async function boot({ idb = true, storage, speed, url, bc } = {}) {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8').replace(/<script[^>]*src="[^"]*"[^>]*><\/script>/g, '').replace(/<link[^>]*>/g, '');
  const dom = new JSDOM(html, { url: url || 'https://sad-cpu141.github.io/khatfa/', runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window;
  w.__KH_TEST__ = true;
  w.addEventListener('error', (e) => console.log('    PAGE ERROR:', e.error && (e.error.stack || e.error.message)));
  w.console.error = (...a) => { console.log('    CONSOLE.ERROR:', String(a[0]).slice(0, 400), a[0] && a[0].stack ? a[0].stack.slice(0, 600) : ''); };
  if (speed) w.__KH_TEST_SPEED = speed;
  if (bc) w.BroadcastChannel = globalThis.BroadcastChannel;
  w.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {} });
  w.scrollTo = () => {};
  w.navigator.vibrate = () => true;
  w.URL.createObjectURL = () => 'blob:test'; w.URL.revokeObjectURL = () => {};
  if (idb) { const fake = require('fake-indexeddb'); w.indexedDB = fake.indexedDB; w.IDBKeyRange = fake.IDBKeyRange; }
  if (storage) Object.entries(storage).forEach(([k, v]) => w.localStorage.setItem(k, v));
  for (const f of ['vendor/react.production.min.js', 'vendor/react-dom.production.min.js', 'app.js']) w.eval(fs.readFileSync(path.join(root, f), 'utf8'));
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
    const P = KH.SAMPLE_PACK;
    const teams = [{ name: 'A' }, { name: 'B' }];
    // Every sample question is well formed and bilingual.
    const qs = P.categories.flatMap((c) => c.questions);
    ok(qs.every((q) => q.q.ar && q.q.en && q.a.ar && q.a.en && [1, 2, 3].includes(q.tier)), 'sample pack: all ' + qs.length + ' questions have Arabic + English question and answer, and a tier');
    ok(new Set(qs.map((q) => q.id)).size === qs.length, 'sample pack: question ids are unique');
    ok(P.categories.every((c) => [1, 2, 3].every((tier) => c.questions.filter((q) => q.tier === tier).length >= 2)), 'sample pack: every category has 2 questions per tier');

    let g = KH.createGame(P, teams, {}, 1000);
    ok(g.phase === 'pick' && g.rules.values.join() === '200,400,600' && g.rules.perValue === 2 && g.rules.catsPerTeam === 3, 'defaults: 200/400/600, 2 per value, 3 categories per team');
    ok(g.rules.steals === true && g.rules.wrongPenalty === false, 'defaults: steals on, wrong-answer penalty (a modifier) off');
    ok(KH.pickingTeam(g).id === 't0', 'team 1 picks first');
    g = KH.pickCategory(g, 'c-geo');
    ok(KH.pickingTeam(g).id === 't1', 'teams alternate picks');
    ok(KH.pickCategory(g, 'c-geo') === g, 'a category can’t be picked twice');
    g = KH.undo(g);
    ok(g.cats.length === 0 && KH.pickingTeam(g).id === 't0', 'undo takes a pick back');
    ['c-geo', 'c-sci', 'c-ani', 'c-num', 'c-arb', 'c-food'].forEach((id) => { g = KH.pickCategory(g, id); });
    ok(g.phase === 'board' && g.cells.length === 36, 'after 6 picks the board has 6 categories × 6 questions');
    ok(g.cats.filter((c) => c.by === 't0').length === 3 && g.cats.filter((c) => c.by === 't1').length === 3, 'each team picked 3 categories');
    ok(g.cells.every((c) => c.q && c.q.tier === c.tier && c.value === [200, 400, 600][c.tier - 1]), 'every cell has a question of the right difficulty and value');
    ok(new Set(g.cells.map((c) => c.q.id)).size === 36, 'no question appears twice on the board');

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

    // wrong → steal → stolen
    c = g.cells.find((x) => x.status === 'open' && x.value === 600);
    g = KH.openCell(g, c.id, t0);
    g = KH.markWrong(g, t0 + 5000);
    ok(g.current.stage === 'steal' && g.current.team === 't0' && g.current.endsAt === t0 + 5000 + 15000, 'wrong: the other team gets a 15s steal chance');
    ok(g.teams[1].score === 0, 'no penalty by default');
    g = KH.markCorrect(g);
    ok(g.teams[0].score === 1000 && g.current.result.kind === 'stolen', 'stolen: the stealing team gets the 600');
    g = KH.finishQuestion(g, t0);
    ok(KH.turnTeam(g).id === 't0', 'turn order is unaffected by steals');

    // wrong → steal missed
    c = KH.openCells(g)[0];
    g = KH.openCell(g, c.id, t0); g = KH.markWrong(g, t0); g = KH.markWrong(g, t0);
    ok(g.current.stage === 'reveal' && g.current.result.kind === 'missed' && g.teams.map((x) => x.score).join() === '1000,0', 'a missed steal gives nobody points');
    g = KH.finishQuestion(g, t0);
    // put back / skip
    c = KH.openCells(g)[0];
    const before = KH.turnTeam(g).id;
    g = KH.putBack(KH.openCell(g, c.id, t0));
    ok(g.phase === 'board' && g.cells.find((x) => x.id === c.id).status === 'open' && KH.turnTeam(g).id === before, 'putting a question back leaves it open and keeps the same team’s turn');
    g = KH.finishQuestion(KH.skipQuestion(KH.openCell(g, c.id, t0)), t0);
    ok(g.cells.find((x) => x.id === c.id).status === 'done' && g.log[g.log.length - 1].kind === 'skipped', 'skipping uses the question up with no points');
    // penalty modifier
    let gp = KH.createGame(P, teams, { wrongPenalty: true }, 0);
    gp = KH.randomPick(KH.randomPick(KH.randomPick(KH.randomPick(KH.randomPick(KH.randomPick(gp))))));
    const c2 = gp.cells.find((x) => x.value === 200);
    gp = KH.markWrong(KH.openCell(gp, c2.id, 0), 0);
    ok(gp.teams[0].score === -200 && gp.current.stage === 'steal', 'with the penalty modifier on, a wrong answer loses the value (then the steal still happens)');
    gp = KH.markCorrect(gp);
    ok(gp.teams[1].score === 200, '…and a steal never loses points');
    // steals off
    let gs = KH.createGame(P, teams, { steals: false }, 0);
    for (let i = 0; i < 6; i++) gs = KH.randomPick(gs);
    gs = KH.markWrong(KH.openCell(gs, gs.cells[0].id, 0), 0);
    ok(gs.current.stage === 'reveal', 'with steals off, a wrong answer goes straight to the answer');
    // undo + adjust
    let gu = KH.adjustScore(g, 't1', 200, 0);
    ok(gu.teams[1].score === 200 && gu.log[gu.log.length - 1].kind === 'adjust', 'fix scores adds to the score and to the log');
    ok(KH.undo(gu).teams[1].score === 0, 'undo reverts a score fix');
    // per value 1, 2 categories each
    let g1 = KH.createGame(P, teams, { perValue: 1, catsPerTeam: 2 }, 0);
    for (let i = 0; i < 4; i++) g1 = KH.randomPick(g1);
    ok(g1.phase === 'board' && g1.cells.length === 12, '1 question per value, 2 categories each → 12 tiles');

    // 300 random games: always finish, scores add up, no tile reused
    let stuck = 0, badSum = 0, reused = 0;
    for (let run = 0; run < 300; run++) {
      let r = KH.createGame(P, run % 5 === 0 ? [{ name: 'A' }, { name: 'B' }, { name: 'C' }] : teams, { perValue: 1 + (run % 2), catsPerTeam: 1 + (run % 2), wrongPenalty: run % 3 === 0, steals: run % 7 !== 0 }, 0);
      let steps = 0;
      while (r.phase !== 'done' && steps++ < 2000) {
        if (r.phase === 'pick') { r = KH.randomPick(r); continue; }
        if (r.phase === 'board') { const open = KH.openCells(r); r = KH.openCell(r, open[Math.floor(Math.random() * open.length)].id, 0); continue; }
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
    ok(stuck === 0, '300 random games (2–3 teams, all rule mixes, undo/skip/put back) all finish');
    ok(badSum === 0, 'final scores always match the game log');
    ok(reused === 0, 'no tile is ever played twice');

    // TV never receives unrevealed answers
    let gt = KH.createGame(P, teams, {}, 0); for (let i = 0; i < 6; i++) gt = KH.randomPick(gt);
    gt = KH.openCell(gt, gt.cells[0].id, 0);
    const tv = KH.tvGame(gt);
    ok(!tv.history && tv.cells.every((c) => !c.q.a), 'the TV copy has no answers while the question is open');
    gt = KH.markCorrect(gt);
    ok(KH.tvGame(gt).cells[0].q.a && KH.tvGame(gt).cells[1].q.a === null, 'after marking, the TV gets only that question’s answer');

    // results
    const w = KH.winners({ teams: [{ id: 'a', score: 5 }, { id: 'b', score: 5 }] });
    ok(w.length === 0, 'equal scores = a draw');
  }

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
  console.log('Click-through (Arabic first, then English)');
  {
    const { w, d, KH } = await boot({ speed: 0.02 });
    ok(d.documentElement.getAttribute('dir') === 'rtl' && d.documentElement.getAttribute('lang') === 'ar', 'opens in Arabic, right-to-left');
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
    await click(w, d.querySelector('.rtitle'));
    ok(/Wrong answers lose points/.test(text(d)) && d.querySelectorAll('.rbody .toggle')[1].getAttribute('aria-pressed') === 'false' && d.querySelectorAll('.rbody .toggle')[0].getAttribute('aria-pressed') === 'true', 'house rules open: steals on, the optional modifier off');
    await click(w, btn(d, '30s'));
    await click(w, btn(d, 'Pick categories'));
    ok(!!d.querySelector('.catgrid') && /الأبطال, pick a category/.test(text(d)), 'category pick: the first team is asked to pick (mixed Arabic name in English UI)');
    const cards = () => [...d.querySelectorAll('.catcard')];
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
    await click(w, btn(d, 'Wrong'));
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
    await click(w, btn(d, 'Wrong')); await closeFlash(w, d);
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
      const T = await boot({ bc: true, url: 'https://sad-cpu141.github.io/khatfa/#tv', idb: false });
      await sleep(100);
      ok(/بانتظار لعبة/.test(text(T.d)), 'TV window waits for a game');
      await click(H.w, btn(H.d, 'لعبة جديدة'));
      await click(H.w, btn(H.d, 'اختيار الفئات'));
      await sleep(80);
      ok(!!T.d.querySelector('.tvmode .catgrid.big'), 'TV shows category picking');
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
