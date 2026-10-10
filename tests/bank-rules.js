// Rules tests for the question bank and selection (run from tests/run.js).
// Uses the real bank.js plus small hand-made banks for edge cases.
module.exports = async function bankRules({ ok, boot }) {
  const { KH, w } = await boot();
  const B = KH.BANK;
  const teams = [{ name: 'A' }, { name: 'B' }];
  // Deterministic random numbers, so statistical checks are repeatable.
  const seeded = (seed) => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const ctxOf = (extra = {}) => ({ bank: B, recent: {}, rand: seeded(7), ...extra });
  const fullBoard = (rules, ctx, cats) => {
    let g = KH.createGame(B, teams, rules, 0, { gameNo: (ctx && ctx.gameNo) || 1 });
    if (cats) cats.forEach((id) => { g = KH.pickCategory(g, id, ctx); });
    else g = KH.autoPick(g, ctx);
    return g;
  };
  const allFacts = (q) => (q.facts.length ? q.facts : [q.id]);

  console.log('Question bank');
  const qs = w.KH_BANK.questions;
  ok(B.total === qs.length && qs.length >= 1000, 'the bank loads: ' + qs.length + ' questions in ' + B.cats.length + ' categories');
  ok(qs.every((q) => [200, 400, 600].includes(q.points) && q.tier === [200, 400, 600].indexOf(q.points) + 1), 'every question is worth exactly 200, 400 or 600');
  ok(!w.KH_BANK.errors.length, 'the bank reports no format errors');
  ok(new Set(qs.map((q) => q.id)).size === qs.length, 'question ids are unique');
  ok(qs.every((q) => q.q.en && q.q.ar && q.a.en && q.a.ar), 'every question has English and Arabic text and answers');
  ok(B.cats.every((c) => [1, 2, 3].every((t) => (B.byCat[c.id] || []).filter((q) => q.tier === t).length >= 4)), 'every category has at least 4 questions at each value');
  ok(qs.filter((q) => q.tier >= 2).every((q) => q.ref), 'every 400 and 600 question has a verification reference');
  ok(qs.filter((q) => q.check).every((q) => q.asOf), 'every time-sensitive question has an "as of" date');

  console.log('Scoring values');
  const forced = KH.cleanRules({ values: [100, 300, 500, 1000] });
  ok(forced.values.join() === '200,400,600', 'other point values are refused: rules always use 200/400/600');
  const g0 = fullBoard({}, ctxOf());
  ok(g0.phase === 'board' && g0.cells.length === 36, 'default board: 6 categories × 6 tiles');
  ok(g0.cells.every((c) => c.value === [200, 400, 600][c.tier - 1] && c.q.tier === c.tier), 'every tile’s value matches its question’s difficulty');
  ok([...new Set(g0.cells.map((c) => c.value))].sort().join() === '200,400,600', 'only 200, 400 and 600 appear on the board');

  console.log('Difficulty progression');
  {
    let okRows = true;
    for (let s = 1; s <= 20; s++) {
      const g = fullBoard({}, ctxOf({ rand: seeded(s) }));
      g.cats.forEach((cat) => {
        const cells = g.cells.filter((c) => c.cat === cat.id);
        const tiers = cells.map((c) => c.tier).join('');
        if (tiers !== '112233') okRows = false;
      });
    }
    ok(okRows, 'in every category the rows go 200, 200, 400, 400, 600, 600 (20 boards)');
    // Steep / Brutal / Niche must change what is drawn.
    const share = (rules, tier) => {
      let x = 0, n = 0;
      for (let s = 1; s <= 120; s++) { const g = fullBoard(rules, ctxOf({ rand: seeded(1000 + s) })); g.cells.filter((c) => c.tier === tier && c.q).forEach((c) => { n++; x += c.q.x; }); }
      return x / n;
    };
    const std600 = share({}, 3), steep600 = share({ curve: 'steep' }, 3), brutal600 = share({ curve: 'brutal' }, 3), brutal200 = share({ curve: 'brutal' }, 1), std200 = share({}, 1);
    ok(steep600 > std600 + 0.1, 'Steep draws more extra-niche 600s than Standard (' + Math.round(std600 * 100) + '% → ' + Math.round(steep600 * 100) + '%)');
    ok(brutal600 > steep600, 'Brutal draws even more extra-niche 600s (' + Math.round(brutal600 * 100) + '%)');
    ok(brutal200 >= std200, 'Brutal also leans harder at 200 (' + Math.round(std200 * 100) + '% → ' + Math.round(brutal200 * 100) + '%)');
    const niche = share({ niche: true }, 2), std400 = share({}, 2);
    ok(niche > std400 + 0.05, 'Niche mode raises the share of extra-niche questions (' + Math.round(std400 * 100) + '% → ' + Math.round(niche * 100) + '% at 400)');
    // Niche only
    const gn = fullBoard({ nicheOnly: true, perValue: 1, catsPerTeam: 1 }, ctxOf());
    const pickable = gn.pool.filter((c) => c.short.every((n) => n === 0)).length;
    ok(gn.cells.every((c) => !c.q || c.q.x === 1), 'Niche only: every question on the board is extra-niche');
    ok(pickable < B.cats.length, 'Niche only: categories without enough niche questions can’t be picked (' + pickable + ' of ' + B.cats.length + ' can)');
    // Min / max difficulty
    ok(KH.rowTiers(KH.cleanRules({ minTier: 2 })).join() === '2,2,3', 'Minimum 400: the rows become 400 / 400 / 600');
    const gm = fullBoard({ minTier: 2 }, ctxOf());
    ok(gm.cells.every((c) => c.value >= 400) && gm.cells.every((c) => c.q && c.q.tier === c.tier), 'Minimum 400: no 200 tiles, every question at its tile’s difficulty');
    const gx = fullBoard({ maxTier: 1 }, ctxOf());
    ok(gx.cells.every((c) => c.value === 200), 'Maximum 200: an all-200 board');
    ok(KH.cleanRules({ minTier: 3, maxTier: 1 }).maxTier === 3, 'Maximum is never below minimum');
  }

  console.log('No repeats');
  {
    // Within one game: never the same question or the same fact twice.
    let dupQ = 0, dupFact = 0;
    for (let s = 1; s <= 60; s++) {
      const g = fullBoard({ mixed: s % 2 === 0, catsPerTeam: 3 }, ctxOf({ rand: seeded(s) }));
      const ids = g.cells.filter((c) => c.q).map((c) => c.q.id);
      if (new Set(ids).size !== ids.length) dupQ++;
      const facts = g.cells.filter((c) => c.q).flatMap((c) => allFacts(c.q));
      if (new Set(facts).size !== facts.length) dupFact++;
    }
    ok(dupQ === 0, 'no question appears twice on a board (60 boards, with and without Random Mix)');
    ok(dupFact === 0, 'questions that test the same fact never share a board');
    // Across games: recently seen questions are avoided.
    const cats = ['capitals', 'space', 'movies', 'f1', 'anime', 'mammals'];
    let recent = {};
    const g1 = fullBoard({}, ctxOf({ rand: seeded(1), gameNo: 1 }), cats);
    g1.cells.forEach((c) => { recent[c.q.id] = 1; });
    const g2 = fullBoard({}, { bank: B, recent, rand: seeded(2), gameNo: 2 }, cats);
    const repeatSoft = g2.cells.filter((c) => recent[c.q.id]).length;
    ok(repeatSoft <= 6, 'Standard: the next game with the same categories reuses few questions (' + repeatSoft + ' of 36)');
    const g3 = fullBoard({ strict: true }, { bank: B, recent, rand: seeded(3), gameNo: 2 }, cats);
    const repeatStrict = g3.cells.filter((c) => recent[c.q.id]).length;
    ok(repeatStrict === 0 && g3.report.repeats === 0, 'Strict no-repeats: none of the last game’s questions come back while unseen ones remain');
    // Strict with everything seen: the game still builds, using the questions seen longest ago, and says so.
    const allSeen = {}; cats.forEach((id) => B.byCat[id].forEach((q) => { allSeen[q.id] = 1; }));
    B.byCat.capitals.slice(0, 3).forEach((q) => { allSeen[q.id] = 0; });
    const g4 = fullBoard({ strict: true }, { bank: B, recent: allSeen, rand: seeded(4), gameNo: 3 }, cats);
    ok(g4.phase === 'board' && g4.cells.every((c) => c.q) && g4.report.repeats > 0, 'Strict with every question seen: the board still fills and reports ' + g4.report.repeats + ' repeats');
    // History bookkeeping is separate from the bank.
    let h = KH.emptyHistory(); h = KH.markSeen(h, 'space.e01', 4); h = { ...h, n: 300 };
    ok(KH.trimHistory(h).seen['space.e01'] === undefined && KH.markSeen(KH.emptyHistory(), 'x', 1).seen.x === 1, 'question history records and forgets old entries');
  }

  console.log('Categories');
  {
    const g = KH.createGame(B, teams, { exclude: ['f1', 'anime'] }, 0);
    ok(!g.pool.some((c) => c.id === 'f1' || c.id === 'anime') && g.pool.length === B.cats.length - 2, 'switched-off categories are not offered');
    ok(g.pool.every((c) => c.count && c.count.length === 3), 'every category shows its real 200/400/600 counts');
    const gm = KH.createGame(B, teams, { mixed: true }, 0);
    ok(gm.pool.some((c) => c.id === KH.MIX_ID), 'Mixed categories adds a Random Mix column');
    let mix = gm; ['capitals', 'mix', 'space', 'movies', 'f1', 'anime'].forEach((id) => { mix = KH.pickCategory(mix, id, ctxOf()); });
    const mixCells = mix.cells.filter((c) => c.cat === KH.MIX_ID);
    const fromCats = new Set(mixCells.map((c) => c.q.cat));
    ok(mixCells.length === 6 && mixCells.every((c) => c.q && c.q.tier === c.tier) && fromCats.size >= 3, 'Random Mix draws 200/400/600 questions from several categories (' + fromCats.size + ' here)');
    const gr = KH.autoPick(KH.createGame(B, teams, { randomCats: true }, 0), ctxOf());
    ok(gr.phase === 'board' && gr.cats.filter((c) => c.by === 't0').length === 3 && gr.cats.filter((c) => c.by === 't1').length === 3, 'Random categories: the board is built straight away, 3 categories per team');
    // Combine topics from different groups in one board.
    let combo = KH.createGame(B, teams, {}, 0);
    ['fb-players', 'anime', 'movies', 'space', 'capitals', 'arab-food'].forEach((id) => { combo = KH.pickCategory(combo, id, ctxOf()); });
    const groups = new Set(combo.cats.map((c) => B.cats.find((x) => x.id === c.id).group));
    ok(combo.phase === 'board' && groups.size === 6, 'one board can mix football, anime, movies, space, capitals and food (' + groups.size + ' topic groups)');
  }

  console.log('Running out');
  {
    // A tiny made-up bank: one category has only one question per tier.
    const mk = (cat, tier, n) => Array.from({ length: n }, (_, i) => ({ id: cat + '.' + tier + i, cat, tier, points: [200, 400, 600][tier - 1], q: { en: 'Q' + i + '?', ar: 'س' + i + '؟' }, a: { en: 'A', ar: 'ج' }, alt: { en: [], ar: [] }, facts: [], x: 0 }));
    const tiny = KH.indexBank({ groups: [{ id: 'g', name: { en: 'G', ar: 'G' } }],
      cats: ['big1', 'big2', 'thin'].map((id) => ({ id, group: 'g', emoji: '•', name: { en: id, ar: id }, subs: {} })),
      questions: [...[1, 2, 3].flatMap((t) => mk('big1', t, 3)), ...[1, 2, 3].flatMap((t) => mk('big2', t, 3)), ...[1, 2, 3].flatMap((t) => mk('thin', t, 1))] });
    const g = KH.createGame(tiny, teams, { catsPerTeam: 1 }, 0);
    const thin = g.pool.find((c) => c.id === 'thin');
    ok(thin.short.join() === '1,1,1', 'a category without enough questions is flagged (needs 2 per value, has 1)');
    ok(KH.pickCategory(g, 'thin', { bank: tiny }) === g, 'it can’t be picked, so a board never silently repeats questions');
    const built = KH.selectBoard([{ id: 'thin' }], tiny, KH.cleanRules({}), { recent: {}, gameNo: 1 });
    ok(built.cells.filter((c) => c.status === 'empty' && c.why === 'exhausted').length === 3 && built.report.exhausted.length === 3, 'if a tier still runs out, its tiles are left empty and reported, never repeated');
  }

  console.log('Progressive difficulty');
  {
    let g = fullBoard({ progressive: true }, ctxOf());
    const c600 = g.cells.find((c) => c.tier === 3), c200 = g.cells.find((c) => c.tier === 1 && c.cat === c600.cat);
    ok(KH.isLocked(g, c600) && KH.openCell(g, c600.id, 0) === g, 'a 600 tile is locked while its category still has 200s and 400s');
    const g2 = fullBoard({}, ctxOf());
    ok(!KH.isLocked(g2, g2.cells.find((c) => c.tier === 3)), 'without the setting, any tile can be opened');
    g = KH.openCell(g, c200.id, 0); ok(g.phase === 'question', 'the 200 opens normally');
  }
};
