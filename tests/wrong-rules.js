// "This is wrong" — invalidating questions: refunds, replacements, idempotency (run from tests/run.js).
module.exports = async function wrongRules({ ok, boot }) {
  const { KH } = await boot();
  const B = KH.BANK;
  const teams = [{ name: 'A' }, { name: 'B' }];
  const seeded = (seed) => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const ctxOf = (s = 3, extra = {}) => ({ bank: B, recent: {}, rand: seeded(s), ...extra });
  const board = (rules = {}, cats = ['capitals', 'space', 'movies', 'fb-clubs', 'mammals', 'cars'], s = 3) => {
    let g = KH.createGame(B, teams, rules, 0, { gameNo: 1 });
    cats.forEach((id) => { g = KH.pickCategory(g, id, ctxOf(s)); });
    return g;
  };
  const score = (g, i) => g.teams[i].score;
  const inval = (g, cellId, extra = {}) => {
    const cell = g.cells.find((c) => c.id === cellId);
    const rep = extra.replacement !== undefined ? extra.replacement : KH.findReplacement(g, cell, ctxOf(9));
    return KH.invalidateQuestion(g, cellId, { qid: cell.q.id, reason: 'answer', replacement: rep || 'empty', now: 1000, ...extra });
  };

  console.log('“This is wrong” — refunds');
  {
    // Question open, nobody marked yet: nothing to refund, replaced at once, same team, fresh clock.
    let g = board();
    const cell = g.cells.find((c) => c.tier === 2);
    g = KH.openCell(g, cell.id, 0);
    const before = g.teams.map((t) => t.score).join();
    const oldQ = cell.q;
    ok(KH.invalidRefunds(g, cell.id).length === 0, 'opened but not marked: there is nothing to refund');
    const n = inval(g, cell.id);
    const nc = n.cells.find((c) => c.id === cell.id);
    ok(n.teams.map((t) => t.score).join() === before, '…and no score changes (no invented refund)');
    ok(nc.q.id !== oldQ.id && nc.q.cat === oldQ.cat && nc.q.tier === oldQ.tier && nc.value === cell.value, 'the replacement is a different question from the same category at the same value');
    ok(n.phase === 'question' && n.current.cell === cell.id && n.current.stage === 'answer' && n.current.team === g.current.team && n.current.endsAt === 1000 + 45000, 'the same team gets the replacement straight away, with a fresh clock');
    ok(n.invalid.length === 1 && n.invalid[0].qid === oldQ.id && n.invalid[0].stage === 'answer', 'the invalid question is recorded in the game');
    ok(!n.cells.some((c) => c.q && c.q.id === oldQ.id), 'the invalid question is no longer on the board');
  }
  {
    // Correct answer already awarded: only the scorer loses exactly those points.
    let g = board();
    g = KH.adjustScore(g, 't1', 600, 0); // unrelated earlier change must survive
    const cell = g.cells.find((c) => c.tier === 3);
    g = KH.openCell(g, cell.id, 0); g = KH.markCorrect(g);
    ok(score(g, 0) === 600 && score(g, 1) === 600, 'setup: A answered a 600 correctly; B has an unrelated +600 fix');
    const r = KH.invalidRefunds(g, cell.id);
    ok(r.length === 1 && r[0].team === 't0' && r[0].delta === -600, 'after a correct answer: reverse exactly −600 from the team that scored');
    const n = inval(g, cell.id);
    ok(score(n, 0) === 0 && score(n, 1) === 600, 'scores go back to exactly what they were before the question; the other team is untouched');
  }
  {
    // Wrong (with the optional penalty) then stolen: reverse the steal AND give the penalty back.
    let g = board({ wrongPenalty: true });
    const cell = g.cells.find((c) => c.tier === 2);
    g = KH.openCell(g, cell.id, 0); g = KH.markWrong(g, 0);
    ok(score(g, 0) === -400, 'setup: wrong answer with the penalty on: A −400');
    const mid = KH.invalidRefunds(g, cell.id);
    ok(mid.length === 1 && mid[0].team === 't0' && mid[0].delta === 400, 'during the steal: only A’s penalty is refunded (+400)');
    g = KH.markCorrect(g);
    ok(score(g, 0) === -400 && score(g, 1) === 400, 'B stole it: A −400, B +400');
    const r = KH.invalidRefunds(g, cell.id);
    ok(r.length === 2 && r.some((x) => x.team === 't1' && x.delta === -400) && r.some((x) => x.team === 't0' && x.delta === 400), 'after the steal: B −400 and A +400 (each team corrected from what actually happened)');
    const n = inval(g, cell.id);
    ok(score(n, 0) === 0 && score(n, 1) === 0, 'both teams are back to their scores before this question');
    ok(n.current.team === 't0' && n.current.stage === 'answer', 'A (who opened it) answers the replacement');
  }
  {
    // Missed with no penalty: no refund.
    let g = board();
    const cell = g.cells.find((c) => c.tier === 1);
    g = KH.openCell(g, cell.id, 0); g = KH.markWrong(g, 0); g = KH.markWrong(g, 0);
    ok(g.current.stage === 'reveal' && KH.invalidRefunds(g, cell.id).length === 0, 'nobody got it and no penalty: nothing to refund');
  }

  console.log('“This is wrong” — idempotent, undoable, never twice');
  {
    let g = board();
    const cell = g.cells.find((c) => c.tier === 3);
    g = KH.openCell(g, cell.id, 0); g = KH.markCorrect(g);
    const qid = cell.q.id;
    const rep = KH.findReplacement(g, g.cells.find((c) => c.id === cell.id), ctxOf(9));
    const n1 = KH.invalidateQuestion(g, cell.id, { qid, replacement: rep, now: 5 });
    const n2 = KH.invalidateQuestion(n1, cell.id, { qid, replacement: rep, now: 6 });
    ok(n2 === n1 && score(n2, 0) === 0, 'pressing it twice for the same question changes nothing the second time (no double refund)');
    const n3 = KH.invalidateQuestion(n1, cell.id, { qid: 'not-on-this-tile', replacement: rep, now: 6 });
    ok(n3 === n1, 'a stale or mismatched request is ignored');
    // Two "simultaneous" requests computed from the same old state: only the first can apply.
    const a = KH.invalidateQuestion(g, cell.id, { qid, replacement: rep, now: 5 });
    const b = KH.invalidateQuestion(a, cell.id, { qid, replacement: KH.findReplacement(g, g.cells.find((c) => c.id === cell.id), ctxOf(11)), now: 5 });
    ok(b === a && a.invalid.length === 1, 'two requests for the same question create one replacement and one refund');
    const u = KH.undo(n1);
    ok(score(u, 0) === 600 && u.cells.find((c) => c.id === cell.id).q.id === qid && !(u.invalid || []).length, 'undo restores the question and the score exactly');
  }
  {
    // A tile flagged again and again never brings back an invalid question, and it runs out honestly.
    let g = board({}, ['capitals', 'space', 'movies', 'fb-clubs', 'mammals', 'cars']);
    const cell = g.cells.find((c) => c.cat === 'space' && c.tier === 1);
    g = KH.openCell(g, cell.id, 0);
    const seen = new Set(g.cells.filter((c) => c.q).map((c) => c.q.id));
    let guard = 0; let dup = false; let wrongTier = false; let wrongCat = false;
    while (guard++ < 60) {
      const cur = g.cells.find((c) => c.id === cell.id);
      const rep = KH.findReplacement(g, cur, ctxOf(guard));
      if (!rep) break;
      if (seen.has(rep.q.id)) dup = true;
      if (rep.q.tier !== 1) wrongTier = true;
      if (rep.q.cat !== 'space') wrongCat = true;
      seen.add(rep.q.id);
      g = KH.invalidateQuestion(g, cell.id, { qid: cur.q.id, replacement: rep, now: guard });
    }
    ok(!dup, 'flagging the same tile repeatedly never brings back a question already used or flagged this game (' + g.invalid.length + ' flags)');
    ok(!wrongTier && !wrongCat, 'every replacement was from the same category at the same value');
    const cur = g.cells.find((c) => c.id === cell.id);
    ok(KH.findReplacement(g, cur, ctxOf(1)) === null, 'when the category runs out at that value, no replacement is invented');
    const opts = KH.replacementOptions(g, cur, ctxOf(2));
    ok(opts.length >= 1 && opts.every((o) => o.q.tier === 1 && o.q.cat !== 'space' && !seen.has(o.q.id)), 'the host is offered same-value questions from other categories instead');
    ok(opts.some((o) => o.how === 'related' && B.cats.find((c) => c.id === o.q.cat).group === 'science'), 'one option comes from a related category (same topic group)');
    const turnBefore = KH.turnTeam(g).id;
    const e = KH.invalidateQuestion(g, cell.id, { qid: cur.q.id, replacement: 'empty', now: 99 });
    const ec = e.cells.find((c) => c.id === cell.id);
    ok(ec.status === 'empty' && ec.why === 'invalid' && !ec.q && e.phase === 'board', 'or the tile can be left empty, and play goes back to the board');
    ok(KH.turnTeam(e).id === turnBefore, '…and the same team picks again (they didn’t get a question)');
  }

  console.log('“This is wrong” — played questions, end of game, Mix, TV');
  {
    let g = board();
    const c1 = g.cells.find((c) => c.tier === 2);
    g = KH.openCell(g, c1.id, 0); g = KH.markCorrect(g); g = KH.finishQuestion(g, 1);
    const c2 = g.cells.find((c) => c.status === 'open');
    g = KH.openCell(g, c2.id, 2); g = KH.markCorrect(g); g = KH.finishQuestion(g, 3);
    ok(score(g, 0) === 400 && score(g, 1) === c2.value, 'setup: A scored 400, then B scored ' + c2.value);
    const turn = KH.turnTeam(g).id;
    const n = inval(g, c1.id);
    ok(score(n, 0) === 0 && score(n, 1) === c2.value, 'flagging an earlier played question reverses only that question’s points');
    const nc = n.cells.find((c) => c.id === c1.id);
    ok(nc.status === 'open' && nc.q.id !== c1.q.id && n.phase === 'board' && KH.turnTeam(n).id === turn, 'its tile reopens with a replacement; whose turn it is doesn’t change');
    ok(n.log.find((e) => e.cell === c1.id && e.kind === 'correct').void === true && n.log.some((e) => e.kind === 'invalid'), 'the game log keeps the original entry (marked cancelled) plus the invalidation');
    const st = KH.gameStats(n).list.find((x) => x.team.id === 't0');
    ok(st.correct === 0, 'cancelled answers don’t count in the end-of-game stats');
  }
  {
    // Last question of the game: flagging it reopens the board to play the replacement.
    let g = board({ perValue: 1 }, ['capitals', 'space', 'movies', 'fb-clubs', 'mammals', 'cars']);
    let last;
    while (KH.openCells(g).length) { last = KH.openCells(g)[0]; g = KH.openCell(g, last.id, 0); g = KH.markWrong(g, 0); g = KH.markWrong(g, 0); g = KH.finishQuestion(g, 1); }
    ok(g.phase === 'done', 'setup: the board is finished');
    const n = inval(g, last.id);
    ok(n.phase === 'board' && KH.openCells(n).length === 1, 'flagging the last question brings the game back to play its replacement');
    const ended = KH.endGame(board(), 1);
    ok(ended.phase === 'done' && ended.endedEarly, 'a game ended early stays ended');
  }
  {
    let g = board({ mixed: true }, ['capitals', 'space', 'movies', 'fb-clubs', 'mammals', 'mix']);
    if (g.phase === 'pick') g = KH.pickCategory(g, g.pool.find((p) => p.id === 'cars') ? 'cars' : g.pool[0].id, ctxOf(3));
    const mc = g.cells.find((c) => c.cat === 'mix' && c.q);
    if (mc) {
      g = KH.openCell(g, mc.id, 0);
      const rep = KH.findReplacement(g, mc, ctxOf(4));
      ok(rep && rep.q.tier === mc.tier && rep.q.id !== mc.q.id, 'a Random Mix tile is replaced by another mix question of the same value');
    } else ok(false, 'a Random Mix tile is replaced by another mix question of the same value (no mix tile built)');
  }
  {
    let g = board();
    const cell = g.cells.find((c) => c.tier === 1);
    g = KH.openCell(g, cell.id, 0);
    const n = inval(g, cell.id);
    const tv = KH.tvGame(n);
    const tc = tv.cells.find((c) => c.id === cell.id);
    ok(tc.q.a === null && tc.q.alt === null && !('history' in tv), 'the TV gets the replacement without its answer');
  }

  console.log('Reported questions');
  {
    let g = board();
    const cell = g.cells.find((c) => c.tier === 1);
    g = KH.openCell(g, cell.id, 0);
    const info = { cell, rec: { qid: cell.q.id, reason: 'answer', note: 'x', now: 7 }, refunds: [], replacement: 'empty' };
    let list = KH.addIssue([], KH.issueEntry(g, info));
    list = KH.addIssue(list, KH.issueEntry(g, info));
    ok(list.length === 1 && list[0].qid === cell.q.id && list[0].reason === 'answer', 'a flagged question is logged once per game with its reason');
    // Reported questions are skipped when new boards are built.
    let ng = KH.createGame(B, teams, {}, 0, { gameNo: 2 });
    const ex = B.byCat.capitals.filter((q) => q.tier === 1).slice(0, 5).map((q) => q.id);
    ['capitals', 'space', 'movies', 'fb-clubs', 'mammals', 'cars'].forEach((id) => { ng = KH.pickCategory(ng, id, ctxOf(5, { exclude: ex })); });
    ok(!ng.cells.some((c) => c.q && ex.includes(c.q.id)), 'reported questions are left out of new boards');
  }
};
