// Lifelines: rules, scoring, refunds, undo, log (run from tests/run.js). No real waiting: times are passed in.
module.exports = async function lifelineRules({ ok, boot }) {
  const { KH } = await boot();
  const B = KH.BANK;
  const seeded = (seed) => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const ctx = (s = 3) => ({ bank: B, recent: {}, rand: seeded(s) });
  const board = (rules = {}) => { let g = KH.createGame(B, [{ name: 'A' }, { name: 'B' }], rules, 0, { gameNo: 1 }); ['capitals', 'space', 'movies', 'fb-clubs', 'mammals', 'cars'].forEach((id) => { g = KH.pickCategory(g, id, ctx()); }); return g; };
  const cellOf = (g, tier) => g.cells.find((c) => c.status === 'open' && c.tier === tier);
  const open = (g, tier = 1, now = 1000) => KH.openCell(g, cellOf(g, tier).id, now);
  const sc = (g) => g.teams.map((t) => t.score);
  const use = (g, id, now = 2000, extra) => KH.useLifeline(g, id, { now, ctx: ctx(9), ...extra });

  console.log('Lifelines — availability');
  {
    let g = board();
    ok(JSON.stringify(KH.enabledLifelines(g)) === '["double","help","shield"]', 'the three default lifelines are on; Extra Time and Swap are off by default');
    ok(KH.cleanRules({}).extraTime === false && KH.cleanRules({}).swap === false && KH.cleanRules({}).lifelines === true, 'default rules: lifelines on, optional ones off');
    ok(['double', 'help', 'shield'].every((id) => !KH.lifelineUsed(g, 't0', id) && !KH.lifelineUsed(g, 't1', id)), 'each team starts with all three available');
    ok(KH.lifelineBlock(g, 'double') === 'notNow', 'lifelines can’t be used on the board (only during a question)');
    g = open(g);
    ok(g.current.team === 't0' && KH.lifelineBlock(g, 'double') === '', 'the answering team can use one during its answer');
    const d = use(g, 'double');
    ok(KH.lifelineUsed(d, 't0', 'double') && !KH.lifelineUsed(d, 't1', 'double'), 'using one doesn’t affect the other team');
    ok(use(d, 'double') === d, 'the same lifeline can’t be used twice on one question');
    ok(KH.lifelineBlock(use(g, 'swap'), 'swap') === 'off' && use(g, 'swap') === g && use(g, 'extra') === g, 'optional lifelines can’t be used while they’re off');
    const off = KH.createGame(B, [{ name: 'A' }, { name: 'B' }], { lifelines: false }, 0, {});
    ok(KH.enabledLifelines(off).length === 0, 'lifelines can be turned off completely');
  }

  console.log('Lifelines — Double It');
  {
    let g = open(board(), 1);
    const v = g.cells.find((c) => c.id === g.current.cell).value;
    g = use(g, 'double');
    ok(KH.curValue(g) === v * 2, 'Double It: a ' + v + ' question is now worth ' + v * 2);
    ok(KH.curValue(use(g, 'double')) === v * 2, '…and it can’t be doubled again');
    const c1 = KH.markCorrect(g);
    ok(sc(c1)[0] === v * 2 && c1.current.result.points === v * 2, 'a correct answer scores the doubled value');
    let f = KH.finishQuestion(c1, 3000);
    ok(f.log.find((e) => e.kind === 'correct').doubled === 1 && f.current === null, 'the log records the doubled question');
    // next question isn't doubled
    f = KH.openCell(f, cellOf(f, 1).id, 4000);
    ok(KH.curValue(f) === f.cells.find((c) => c.id === f.current.cell).value && !(f.current.fx && f.current.fx.double), 'the next question is back to normal (no stale ×2)');
    ok(KH.lifelineBlock(f, 'double') === '' && f.current.team === 't1', 'the other team can still use its own Double It');
    ok(KH.lifelineBlock(KH.finishQuestion(KH.markCorrect(KH.useLifeline(f, 'double', { now: 1 })), 2) , 'double') === 'notNow', 'after resolving, nothing stays active');
    // steals: the doubled value stays on the question
    let s = use(open(board(), 2), 'double');
    s = KH.markWrong(s, 2500);
    ok(s.current.stage === 'steal', 'a wrong answer still opens the steal');
    s = KH.markCorrect(s);
    ok(sc(s)[1] === 800 && s.current.result.kind === 'stolen', 'a steal scores the doubled value (400 → 800)');
    // penalty doubled, and "This is wrong" refunds exactly
    let p = use(open(board({ wrongPenalty: true }), 1), 'double');
    p = KH.markWrong(p, 2500);
    ok(sc(p)[0] === -400, 'with “wrong answers lose points”, a doubled 200 costs 400');
    p = KH.markCorrect(p);
    ok(sc(p)[0] === -400 && sc(p)[1] === 400, 'stolen at the doubled value');
    const cid = p.current.cell; const qid = p.cells.find((c) => c.id === cid).q.id;
    const refunds = KH.invalidRefunds(p, cid);
    ok(refunds.some((r) => r.team === 't0' && r.delta === 400) && refunds.some((r) => r.team === 't1' && r.delta === -400), '“This is wrong” reverses exactly what was charged (±400, not the original 200)');
    const inv = KH.invalidateQuestion(p, cid, { qid, replacement: KH.findReplacement(p, p.cells.find((c) => c.id === cid), ctx(5)), now: 3000 });
    ok(sc(inv).join() === '0,0', 'after the correction both scores are exactly back to 0');
    ok(!KH.lifelineUsed(inv, 't0', 'double'), 'and the Double It used on the broken question is given back');
    ok(KH.invalidateQuestion(inv, cid, { qid, now: 3001 }) === inv, 'the same correction can’t be applied twice');
    ok(!(inv.current.fx && inv.current.fx.double) && KH.curValue(inv) === 200, 'the replacement question isn’t doubled');
  }

  console.log('Lifelines — Call for Help');
  {
    let g = open(board(), 1, 1000);
    const before = g.current.endsAt; // answer clock ends at 1000 + 45 s
    g = use(g, 'help', 11000); // 10 s in: 35 s left on the answer clock
    const h = g.current.fx.help;
    ok(h.endsAt === 11000 + 30000 && !h.ended, 'Call for Help starts a 30-second countdown (a fixed deadline)');
    ok(g.current.pausedLeft === before - 11000, 'the answer clock waits while help runs');
    ok(KH.resumeTimer(g, 12000) === g, 'the answer clock can’t be restarted while help is running');
    ok(KH.useLifeline(g, 'help', { now: 12000 }) === g, 'it can’t be started twice');
    const e1 = KH.endHelp(g, 41000);
    ok(e1.current.fx.help.ended && e1.current.endsAt === 41000 + 35000 && e1.current.pausedLeft === null, 'when it ends the answer clock carries on with the 35 s it had');
    ok(KH.endHelp(e1, 41500) === e1 && e1.log.filter((x) => x.kind === 'help-end').length === 1, 'it ends only once (one log entry)');
    const late = KH.endHelp(g, 60000);
    ok(late.current.endsAt === 41000 + 35000, 'a late timer (app in the background) still resumes from the deadline, not from when it fired');
    const early = KH.endHelp(g, 20000);
    ok(early.current.endsAt === 20000 + 35000 && early.log.find((x) => x.kind === 'help-end').early, 'the host can end it early');
    const marked = KH.markCorrect(g);
    ok(marked.current.fx.help.ended, 'marking the answer during help ends the help period');
  }

  console.log('Lifelines — Shield');
  {
    let g = use(open(board(), 1), 'shield');
    let w = KH.markWrong(g, 2500);
    ok(w.current.stage === 'reveal' && w.current.result.kind === 'missed' && w.current.result.shielded, 'with Shield, a wrong answer can’t be stolen');
    w = KH.finishQuestion(w, 3000);
    w = KH.openCell(w, cellOf(w, 1).id, 4000);
    const w2 = KH.markWrong(w, 4500);
    ok(w2.current.stage === 'steal', 'Shield expires with its question: the next question can be stolen');
    ok(KH.lifelineBlock(w, 'shield') === '', 'the other team still has its own Shield');
    let r = use(open(board(), 1), 'shield');
    r = KH.markCorrect(r);
    ok(sc(r)[0] === 200, 'with Shield, a correct answer scores normally');
  }

  console.log('Lifelines — Extra Time and Swap (optional)');
  {
    let g = open(board({ extraTime: true, swap: true }), 1, 1000);
    ok(KH.enabledLifelines(g).join() === 'double,help,shield,extra,swap', 'when switched on, Extra Time and Swap are available');
    const x = use(g, 'extra', 5000);
    ok(x.current.endsAt === g.current.endsAt + 30000 && KH.useLifeline(x, 'extra', { now: 6000 }) === x, 'Extra Time adds 30 s once');
    const hx = use(use(g, 'help', 5000), 'extra', 6000);
    ok(hx.current.fx.help.endsAt === 5000 + 30000 + 30000, 'during Call for Help, Extra Time extends the help countdown');
    const old = g.cells.find((c) => c.id === g.current.cell).q;
    const s = use(g, 'swap', 5000);
    const nq = s.cells.find((c) => c.id === s.current.cell).q;
    ok(nq.id !== old.id && nq.tier === old.tier && nq.cat === old.cat && sc(s).join() === '0,0', 'Swap gives a different question of the same value and category; scores unchanged');
    ok(s.log.some((e) => e.kind === 'lifeline' && e.ll === 'swap' && e.from === old.id && e.to === nq.id), 'the swap is in the game log');
    ok(!s.cells.some((c) => c.q && c.q.id === old.id) && KH.gameUsed(s).used.has(old.id), 'the swapped-out question can’t come back this game');
    // no replacement left: not consumed
    let t = open(board({ swap: true }), 1, 1000);
    const cat = t.cells.find((c) => c.id === t.current.cell).cat;
    const allSame = B.byCat[cat].filter((q) => q.tier === 1).map((q) => q.id);
    const empty = KH.useLifeline(t, 'swap', { now: 2000, ctx: { bank: B, recent: {}, rand: Math.random, exclude: allSame } });
    ok(empty === t && !KH.lifelineUsed(t, 't0', 'swap'), 'with no eligible replacement, Swap does nothing and isn’t used up');
  }

  console.log('Lifelines — undo, put back, new game');
  {
    let g = open(board({ extraTime: true }), 1, 1000);
    const s0 = g;
    g = use(g, 'double', 2000); g = use(g, 'shield', 2100); g = KH.markCorrect(g);
    ok(sc(g)[0] === 400, 'setup: doubled + shielded correct answer = 400');
    let u = KH.undo(g);
    ok(sc(u)[0] === 0 && u.current.stage === 'answer' && KH.lifelineUsed(u, 't0', 'shield'), 'undo #1 reverses the answer (lifelines still used)');
    u = KH.undo(u);
    ok(!KH.lifelineUsed(u, 't0', 'shield') && KH.lifelineUsed(u, 't0', 'double'), 'undo #2 gives back Shield only');
    u = KH.undo(u);
    ok(!KH.lifelineUsed(u, 't0', 'double') && !(u.current.fx && u.current.fx.double) && JSON.stringify(u.current) === JSON.stringify(s0.current), 'undo #3 gives back Double It: exactly as before');
    ok(u.log.filter((e) => e.kind === 'lifeline').length === 0, 'undo leaves no stray log entries');
    // steal undo
    let st = use(open(board(), 2), 'double'); st = KH.markWrong(st, 2500); st = KH.markCorrect(st);
    const st1 = KH.undo(st);
    ok(sc(st1).join() === '0,0' && st1.current.stage === 'steal' && KH.curValue(st1) === 800, 'undoing a doubled steal restores both scores and the steal stage');
    // put back returns the lifeline
    let pb = use(open(board(), 1), 'help', 3000);
    pb = KH.putBack(pb);
    ok(pb.phase === 'board' && !KH.lifelineUsed(pb, 't0', 'help') && pb.log.some((e) => e.kind === 'lifeline-return'), 'putting a question back returns its lifelines');
    // new game resets
    let done = KH.endGame(use(open(board(), 1), 'double'), 9);
    const re = KH.rematch(done, B, 10, { gameNo: 2 });
    ok(!KH.lifelineUsed(re, 't0', 'double') && JSON.stringify(re.ll) === '{"t0":{},"t1":{}}', 'a new game (play again) starts with all lifelines');
    ok(KH.tvGame(use(open(board(), 1), 'double')).current.fx.double === 1, 'the TV receives the lifeline state');
    // ordinary scoring unchanged
    let o = KH.markCorrect(open(board(), 3));
    ok(sc(o)[0] === 600 && KH.curValue(o) === 600, 'questions without lifelines score exactly as before');
  }
};
