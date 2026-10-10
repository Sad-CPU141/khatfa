/* ============================================================
   QUESTION SELECTION — pure functions, no UI.
   · Points are always 200 / 400 / 600 (tiers 1 / 2 / 3).
   · A question is never used twice in one game, and two questions that test
     the same fact (same `fact` key) never share a board.
   · Questions seen in recent games are avoided (soft by default; Strict No-Repeats
     excludes them until the category runs out).
   · Difficulty settings change which questions are drawn, never the labels.
   · If a category runs out for a tier, the tile is left empty with a reason;
     questions are never silently repeated within a game.
   ============================================================ */
const POINTS = [200, 400, 600];
const STRICT_WINDOW = 50;     // games: "recently seen" for Strict No-Repeats
const MIX_ID = 'mix';

// Index the bank once: categories with live counts, questions by category.
function indexBank(raw) {
  const B = raw || (typeof window !== 'undefined' && window.KH_BANK) || { groups: [], cats: [], questions: [] };
  const byCat = {};
  B.cats.forEach((c) => { byCat[c.id] = []; });
  B.questions.forEach((q) => { if (q.tier && byCat[q.cat]) byCat[q.cat].push(q); });
  return { groups: B.groups, cats: B.cats, byCat, total: B.questions.filter((q) => q.tier).length, errors: B.errors || [] };
}
const tierCounts = (qs) => [1, 2, 3].map((t) => qs.filter((q) => q.tier === t).length);
const nicheCounts = (qs) => [1, 2, 3].map((t) => qs.filter((q) => q.tier === t && q.x).length);

// Which tier each of the three board rows uses, after Minimum/Maximum Difficulty.
function rowTiers(rules) {
  const lo = clamp(rules.minTier || 1, 1, 3), hi = clamp(Math.max(rules.maxTier || 3, lo), 1, 3);
  return [1, 2, 3].map((t) => clamp(t, lo, hi));
}
// How many questions of each tier one category column needs.
function tiersNeeded(rules) {
  const need = [0, 0, 0];
  rowTiers(rules).forEach((t) => { need[t - 1] += rules.perValue; });
  return need;
}
// Can this category fill a whole column with the current rules?
function categoryShortfall(qs, rules) {
  const have = tierCounts(rules.nicheOnly ? qs.filter((q) => q.x) : qs);
  const need = tiersNeeded(rules);
  return need.map((n, i) => Math.max(0, n - have[i]));
}

// Selection weight for one question. Higher = more likely.
function weightOf(q, tier, rules, recent, gameNo) {
  let w = 1;
  const curve = rules.curve || 'standard';
  if (curve === 'steep' && tier >= 2) w *= q.x ? 4 : 0.5;
  if (curve === 'brutal') w *= q.x ? (tier >= 2 ? 8 : 3) : (tier >= 2 ? 0.25 : 0.6);
  if (rules.niche) w *= q.x ? 3 : 1;
  const seen = recent && recent[q.id];
  if (seen != null && gameNo != null) {
    const age = Math.max(1, gameNo - seen);
    w *= age <= 1 ? 0.01 : age <= 3 ? 0.05 : age <= 10 ? 0.2 : 0.6;
  }
  return w;
}
function weightedPick(items, weights, rand) {
  const total = weights.reduce((a, b) => a + b, 0);
  if (total <= 0) return items[Math.floor(rand() * items.length)];
  let r = rand() * total;
  for (let i = 0; i < items.length; i++) { r -= weights[i]; if (r <= 0) return items[i]; }
  return items[items.length - 1];
}

/* Pick `count` questions of `tier` from `pool`.
   ctx: { used:Set(ids), facts:Set(fact keys; a question with no keys uses its id), recent:{id:gameNo}, gameNo, rand }
   Returns { picked, repeats, nicheShort } — repeats = recently-seen questions that had to be used. */
function selectQuestions(pool, tier, count, rules, ctx) {
  const rand = ctx.rand || Math.random;
  const keys = (q) => (q.facts && q.facts.length ? q.facts : [q.id]);
  const clash = (q) => keys(q).some((k) => ctx.facts.has(k));
  const free = (q) => q.tier === tier && !ctx.used.has(q.id) && !clash(q);
  let cands = pool.filter(free);
  let nicheShort = 0;
  if (rules.nicheOnly) { const n = cands.filter((q) => q.x); if (n.length >= count) cands = n; else { nicheShort = count - n.length; } }
  const picked = []; let repeats = 0;
  for (let k = 0; k < count; k++) {
    const left = cands.filter((q) => !ctx.used.has(q.id) && !clash(q));
    if (!left.length) break;
    let choose = left;
    const recentOf = (q) => ctx.recent && ctx.recent[q.id] != null && ctx.gameNo != null && ctx.gameNo - ctx.recent[q.id] <= STRICT_WINDOW;
    if (rules.strict) {
      const fresh = left.filter((q) => !recentOf(q));
      if (fresh.length) choose = fresh;
      else { // all seen recently: use the one seen longest ago
        const oldest = Math.min(...left.map((q) => ctx.recent[q.id]));
        choose = left.filter((q) => ctx.recent[q.id] === oldest);
      }
    }
    const q = weightedPick(choose, choose.map((x) => weightOf(x, tier, rules, ctx.recent, ctx.gameNo)), rand);
    if (recentOf(q)) repeats++;
    picked.push(q); ctx.used.add(q.id); keys(q).forEach((k) => ctx.facts.add(k));
  }
  return { picked, repeats, nicheShort };
}

/* Random Mix: each question comes from a different, randomly chosen topic group and category,
   so a mix is spread across subjects instead of following which categories have the most questions. */
function selectMix(bank, allowed, tier, count, rules, c) {
  const out = { picked: [], repeats: 0, nicheShort: 0 };
  const usedGroups = new Set(); const usedCats = new Set();
  for (let k = 0; k < count; k++) {
    const cats = allowed.map((id) => bank.cats.find((x) => x.id === id)).filter(Boolean);
    const groups = [...new Set(cats.map((x) => x.group))];
    const freshGroups = groups.filter((g) => !usedGroups.has(g));
    const tryGroups = shuffleWith(freshGroups.length ? freshGroups : groups, c.rand);
    let done = false;
    for (const g of tryGroups) {
      const inGroup = shuffleWith(cats.filter((x) => x.group === g && !usedCats.has(x.id)), c.rand);
      for (const cat of inGroup) {
        const r = selectQuestions(bank.byCat[cat.id] || [], tier, 1, rules, c);
        if (r.picked.length) { out.picked.push(r.picked[0]); out.repeats += r.repeats; out.nicheShort += r.nicheShort; usedGroups.add(g); usedCats.add(cat.id); done = true; break; }
      }
      if (done) break;
    }
    if (!done) break;
  }
  return out;
}
function shuffleWith(arr, rand) { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

/* Build every cell of the board.
   cats: [{ id, ... }] in board order; bank: indexBank(); ctx as above (+ allowed: ids for the Random Mix).
   Returns { cells, report: { exhausted:[{cat,tier}], repeats, nicheShort } } */
function selectBoard(cats, bank, rules, ctx) {
  const c = { used: new Set(ctx.used || []), facts: new Set(ctx.facts || []), recent: ctx.recent || {}, gameNo: ctx.gameNo, rand: ctx.rand || Math.random };
  const report = { exhausted: [], repeats: 0, nicheShort: 0 };
  const cells = [];
  const rows = rowTiers(rules);
  // Real categories first so the Random Mix takes what's left.
  const order = [...cats].sort((a, b) => (a.id === MIX_ID) - (b.id === MIX_ID));
  const byCatCells = {};
  order.forEach((cat) => {
    const isMix = cat.id === MIX_ID;
    const pool = isMix ? null : (bank.byCat[cat.id] || []);
    const out = [];
    const need = {};
    rows.forEach((tier) => { need[tier] = (need[tier] || 0) + rules.perValue; });
    const got = {};
    Object.keys(need).forEach((tier) => {
      const r = isMix ? selectMix(bank, ctx.allowed || Object.keys(bank.byCat), +tier, need[tier], rules, c) : selectQuestions(pool, +tier, need[tier], rules, c);
      got[tier] = r.picked; report.repeats += r.repeats; report.nicheShort += r.nicheShort;
      if (r.picked.length < need[tier]) report.exhausted.push({ cat: cat.id, tier: +tier, missing: need[tier] - r.picked.length });
    });
    rows.forEach((tier, row) => {
      for (let k = 0; k < rules.perValue; k++) {
        const q = got[tier].shift() || null;
        out.push({ id: cat.id + ':' + (row + 1) + ':' + k, cat: cat.id, tier, value: POINTS[tier - 1], q, status: q ? 'open' : 'empty', why: q ? undefined : 'exhausted' });
      }
    });
    byCatCells[cat.id] = out;
  });
  cats.forEach((cat) => cells.push(...byCatCells[cat.id]));
  return { cells, report };
}

/* ---------- question history (kept apart from the bank) ---------- */
// history = { n: games started, seen: { questionId: game number when last shown } }
const emptyHistory = () => ({ n: 0, seen: {} });
function markSeen(history, qid, gameNo) {
  const h = history || emptyHistory();
  return { ...h, seen: { ...h.seen, [qid]: gameNo } };
}
function startGameNo(history) { return ((history && history.n) || 0) + 1; }
// Keep history small: forget questions not seen for a long time.
function trimHistory(h, keepGames = 200) {
  if (!h) return emptyHistory();
  const seen = {}; Object.keys(h.seen || {}).forEach((id) => { if (h.n - h.seen[id] < keepGames) seen[id] = h.seen[id]; });
  return { n: h.n || 0, seen };
}
