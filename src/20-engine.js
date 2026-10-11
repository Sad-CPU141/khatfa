/* ============================================================
   GAME ENGINE — pure functions: (game, ...) → new game.
   The UI, the TV view and (later) the online host all use these.

   Phases:  pick → board ⇄ question → done
   A question goes through stages:  answer → (steal) → reveal
   Times are absolute ms timestamps (endsAt) so any screen can draw the clock.
   ============================================================ */
const DEFAULT_RULES = {
  values: [200, 400, 600],  // fixed: 200 easy · 400 hard · 600 brutal
  perValue: 2,              // questions per value in each category
  catsPerTeam: 3,
  answerTime: 45,           // seconds
  stealTime: 15,
  steals: true,
  exclude: [],              // category ids the host switched off
  // optional settings (all OFF / standard by default)
  curve: 'standard',        // 'standard' | 'steep' | 'brutal'
  minTier: 1, maxTier: 3,   // Minimum / Maximum Difficulty (1 = 200, 2 = 400, 3 = 600)
  niche: false,             // Niche Mode: more extra-niche questions
  nicheOnly: false,         // Niche Only: only extra-niche questions where available
  strict: false,            // Strict No-Repeats across games
  mixed: false,             // Mixed Categories: adds a Random Mix category
  randomCats: false,        // Random Categories: categories are chosen automatically
  progressive: false,       // Progressive Difficulty: 200s before 400s before 600s in each category
  wrongPenalty: false,
};
const TIME_CHOICES = [20, 30, 45, 60, 90];
const STEAL_CHOICES = [10, 15, 20, 30];
const CURVES = ['standard', 'steep', 'brutal'];
const HISTORY_MAX = 40;

function cleanRules(r) {
  const x = { ...DEFAULT_RULES, ...(r || {}) };
  x.values = [200, 400, 600];
  x.perValue = x.perValue === 1 ? 1 : 2;
  x.catsPerTeam = clamp(Math.round(x.catsPerTeam) || 3, 1, 6);
  x.answerTime = clamp(Math.round(x.answerTime) || 45, 5, 300);
  x.stealTime = clamp(Math.round(x.stealTime) || 15, 5, 120);
  x.steals = x.steals !== false;
  x.exclude = Array.isArray(x.exclude) ? x.exclude.filter((id) => typeof id === 'string') : [];
  x.curve = CURVES.includes(x.curve) ? x.curve : 'standard';
  x.minTier = clamp(Math.round(x.minTier) || 1, 1, 3);
  x.maxTier = clamp(Math.round(x.maxTier) || 3, x.minTier, 3);
  ['niche', 'nicheOnly', 'strict', 'mixed', 'randomCats', 'progressive', 'wrongPenalty'].forEach((k) => { x[k] = !!x[k]; });
  return x;
}

const teamById = (g, id) => g.teams.find((t) => t.id === id);
const turnTeam = (g) => g.teams[g.turn % g.teams.length];
const nextTeamIndex = (g, i) => (i + 1) % g.teams.length;
const catById = (g, id) => g.cats.find((c) => c.id === id);
const cellById = (g, id) => g.cells.find((c) => c.id === id);
const openCells = (g) => g.cells.filter((c) => c.status === 'open');
const isBoardDone = (g) => g.phase !== 'pick' && openCells(g).length === 0;

// Snapshot for undo (history itself is never nested).
function withHistory(g, label) {
  const { history, ...snap } = g;
  return { ...g, history: [...(history || []), { label, snap }].slice(-HISTORY_MAX) };
}
function undo(g) {
  const h = g.history || [];
  if (!h.length) return g;
  const last = h[h.length - 1];
  return { ...last.snap, history: h.slice(0, -1) };
}
const undoLabel = (g) => { const h = g.history || []; return h.length ? h[h.length - 1].label : null; };

/* ---------- setup ---------- */
// The categories this game can use (host's include list), with counts. No questions are stored here.
function gamePool(bank, rules) {
  const pool = bank.cats.filter((c) => !rules.exclude.includes(c.id) && (bank.byCat[c.id] || []).length)
    .map((c) => ({ id: c.id, emoji: c.emoji, name: c.name, group: c.group, popular: c.popular, nicheTopic: c.nicheTopic, count: tierCounts(bank.byCat[c.id]), short: categoryShortfall(bank.byCat[c.id], rules) }));
  if (rules.mixed && pool.length) pool.push({ id: MIX_ID, emoji: '🎲', name: { en: 'Random Mix', ar: 'خلطة عشوائية' }, group: 'mix', count: null, short: [0, 0, 0] });
  return pool;
}
// teams: [{ name, color, emoji }]; opts: { gameNo }
function createGame(bank, teams, rules, now = Date.now(), opts = {}) {
  const r = cleanRules(rules);
  return {
    v: 2, id: uid(), createdAt: now, gameNo: opts.gameNo || 1,
    rules: r,
    teams: teams.map((tm, i) => ({ id: 't' + i, name: (tm.name || '').trim(), color: tm.color || COLORS[i], emoji: tm.emoji || EMOJIS[i], score: 0 })),
    pool: gamePool(bank, r),
    cats: [], cells: [], log: [], report: null,
    phase: 'pick', turn: 0, current: null, history: [],
  };
}
const picksNeeded = (g) => g.rules.catsPerTeam * g.teams.length;
// Teams alternate picking: 0,1,0,1… (with more teams: 0,1,2,0,1,2…)
const pickingTeam = (g) => g.teams[g.cats.length % g.teams.length];
const canPick = (g, c) => !!c && !g.cats.some((x) => x.id === c.id) && (c.short || [0, 0, 0]).every((n) => n === 0);
// ctx: { bank, recent, rand } — only used when the last pick builds the board.
function pickCategory(g, catId, ctx) {
  if (g.phase !== 'pick') return g;
  const c = g.pool.find((x) => x.id === catId);
  if (!canPick(g, c)) return g;
  const by = pickingTeam(g).id;
  let n = withHistory(g, 'pick');
  n = { ...n, cats: [...n.cats, { id: c.id, emoji: c.emoji, name: c.name, by }] };
  if (n.cats.length >= picksNeeded(n)) n = buildBoard(n, ctx);
  return n;
}
// A random pick prefers a topic group that isn't on the board yet, so random boards are varied.
function randomPick(g, ctx) {
  const left = g.pool.filter((c) => canPick(g, c));
  if (!left.length) return g;
  const rand = (ctx && ctx.rand) || Math.random;
  const usedGroups = new Set(g.cats.map((c) => (g.pool.find((p) => p.id === c.id) || {}).group));
  const freshGroups = [...new Set(left.map((c) => c.group))].filter((x) => !usedGroups.has(x));
  const groups = freshGroups.length ? freshGroups : [...new Set(left.map((c) => c.group))];
  const grp = groups[Math.floor(rand() * groups.length)];
  const inGroup = left.filter((c) => c.group === grp);
  return pickCategory(g, inGroup[Math.floor(rand() * inGroup.length)].id, ctx);
}
// Random Categories: every pick made automatically (teams still alternate, for the colours).
function autoPick(g, ctx) {
  let n = g; let guard = 0;
  while (n.phase === 'pick' && guard++ < 50) { const next = randomPick(n, ctx); if (next === n) break; n = next; }
  return { ...n, history: [] };
}
const pickable = (g) => g.pool.filter((c) => canPick(g, c)).length;
// Lay out the board from the bank (see 15-select.js). Questions are copied into the game,
// so a saved or refreshed game always shows exactly the same questions.
function buildBoard(g, ctx) {
  if (!ctx || !ctx.bank) return g;
  const allowed = g.pool.filter((c) => c.id !== MIX_ID).map((c) => c.id);
  const { cells, report } = selectBoard(g.cats, ctx.bank, g.rules, { recent: ctx.recent, gameNo: g.gameNo, rand: ctx.rand, allowed, used: ctx.exclude || [] });
  return { ...g, cells, report, phase: 'board', turn: 0, pool: g.pool };
}

/* ---------- a question ---------- */
/* Media playback is part of the game state, so the host's buttons drive whichever screen
   is playing (this device, the TV view, or a TV window). Nothing plays until the host
   presses play. seq goes up on every Replay. These aren't undo steps. */
const freshPlay = () => ({ state: 'idle', seq: 0, vol: 0.9 });
const REVEAL_STEPS = 3; // progressive picture reveal: 0 = most hidden … 3 = whole picture
function mediaCmd(g, cmd, v) {
  const cur = g.current; if (!cur) return g;
  const p = { ...freshPlay(), ...(cur.play || {}) };
  if (cmd === 'play') p.state = 'playing';
  else if (cmd === 'pause') p.state = 'paused';
  else if (cmd === 'replay') { p.state = 'playing'; p.seq = (p.seq || 0) + 1; }
  else if (cmd === 'stop') p.state = 'idle';
  else if (cmd === 'vol') p.vol = clamp(+v || 0, 0, 1);
  else return g;
  return { ...g, current: { ...cur, play: p } };
}
function revealMore(g) {
  const cur = g.current; if (!cur) return g;
  return { ...g, current: { ...cur, reveal: Math.min(REVEAL_STEPS, (cur.reveal || 0) + 1) } };
}
// After a reload nothing should start playing by itself.
function quietMedia(g) {
  if (!g || !g.current || !g.current.play || g.current.play.state !== 'playing') return g;
  return { ...g, current: { ...g.current, play: { ...g.current.play, state: 'paused' } } };
}
// Progressive Difficulty: a tile is locked while easier tiles in its category are still open.
function isLocked(g, c) {
  if (!g.rules.progressive || c.status !== 'open') return false;
  return g.cells.some((x) => x.cat === c.cat && x.status === 'open' && x.tier < c.tier);
}
function openCell(g, cellId, now = Date.now()) {
  const c = cellById(g, cellId);
  if (g.phase !== 'board' || !c || c.status !== 'open' || isLocked(g, c)) return g;
  const n = withHistory(g, 'open');
  return { ...n, phase: 'question', current: { cell: c.id, stage: 'answer', team: turnTeam(g).id, opener: turnTeam(g).id, endsAt: now + ms(g.rules.answerTime * 1000), pausedLeft: null, result: null, play: freshPlay(), reveal: 0 } };
}
const curCell = (g) => (g.current ? cellById(g, g.current.cell) : null);
const timeLeft = (g, now = Date.now()) => {
  const cur = g.current; if (!cur || cur.stage === 'reveal') return 0;
  if (cur.pausedLeft != null) return cur.pausedLeft;
  return Math.max(0, cur.endsAt - now);
};
function pauseTimer(g, now = Date.now()) {
  const cur = g.current; if (!cur || cur.stage === 'reveal' || cur.pausedLeft != null) return g;
  return { ...g, current: { ...cur, pausedLeft: Math.max(0, cur.endsAt - now) } };
}
function resumeTimer(g, now = Date.now()) {
  const cur = g.current; if (!cur || cur.pausedLeft == null) return g;
  return { ...g, current: { ...cur, endsAt: now + cur.pausedLeft, pausedLeft: null } };
}
const addScore = (g, teamId, d) => ({ ...g, teams: g.teams.map((tm) => (tm.id === teamId ? { ...tm, score: tm.score + d } : tm)) });

// Host marks the answer right. During a steal, the stealing team gets the points.
function markCorrect(g) {
  const cur = g.current; const c = curCell(g);
  if (g.phase !== 'question' || !cur || !c || (cur.stage !== 'answer' && cur.stage !== 'steal')) return g;
  let n = withHistory(g, cur.stage === 'steal' ? 'stolen' : 'correct');
  n = addScore(n, cur.team, c.value);
  const kind = cur.stage === 'steal' ? 'stolen' : 'correct';
  return { ...n, current: { ...cur, stage: 'reveal', pausedLeft: null, result: { kind, team: cur.team, points: c.value, answeredBy: cur.answeredBy || cur.team, penalty: cur.penalty || 0 } } };
}
// Host marks it wrong (or nobody answered). With steals on, the next team gets a chance.
function markWrong(g, now = Date.now()) {
  const cur = g.current; const c = curCell(g);
  if (g.phase !== 'question' || !cur || !c) return g;
  if (cur.stage === 'answer') {
    let n = withHistory(g, 'wrong');
    const penalty = n.rules.wrongPenalty ? c.value : 0;
    if (penalty) n = addScore(n, cur.team, -penalty);
    const idx = n.teams.findIndex((tm) => tm.id === cur.team);
    if (n.rules.steals && n.teams.length > 1) {
      const thief = n.teams[nextTeamIndex(n, idx)].id;
      return { ...n, current: { ...cur, stage: 'steal', answeredBy: cur.team, team: thief, penalty, endsAt: now + ms(n.rules.stealTime * 1000), pausedLeft: null } };
    }
    return { ...n, current: { ...cur, stage: 'reveal', pausedLeft: null, penalty, result: { kind: 'missed', team: null, points: 0, answeredBy: cur.team, penalty } } };
  }
  if (cur.stage === 'steal') {
    const n = withHistory(g, 'missed');
    return { ...n, current: { ...cur, stage: 'reveal', pausedLeft: null, result: { kind: 'missed', team: null, points: 0, answeredBy: cur.answeredBy, penalty: cur.penalty || 0 } } };
  }
  return g;
}
// Skip: no points, the question is used up.
function skipQuestion(g) {
  const cur = g.current;
  if (g.phase !== 'question' || !cur || cur.stage === 'reveal') return g;
  const n = withHistory(g, 'skip');
  return { ...n, current: { ...cur, stage: 'reveal', pausedLeft: null, result: { kind: 'skipped', team: null, points: 0, answeredBy: cur.answeredBy || cur.team, penalty: cur.penalty || 0 } } };
}
// Opened by mistake: back on the board, same team still to pick. Only before anyone was marked.
function putBack(g) {
  const cur = g.current;
  if (g.phase !== 'question' || !cur || cur.stage !== 'answer') return g;
  const n = withHistory(g, 'putBack');
  return { ...n, phase: 'board', current: null };
}
// After the reveal: close the cell, log it, next team's turn.
function finishQuestion(g, now = Date.now()) {
  const cur = g.current; const c = curCell(g);
  if (g.phase !== 'question' || !cur || cur.stage !== 'reveal' || !c) return g;
  const r = cur.result || {};
  let n = withHistory(g, 'next');
  const entry = { cell: c.id, qid: c.q && c.q.id, cat: c.cat, tier: c.tier, value: c.value, turnTeam: turnTeam(n).id, kind: r.kind, team: r.team, points: r.points || 0, penalty: r.penalty || 0, answeredBy: r.answeredBy || null, at: now };
  n = { ...n, cells: n.cells.map((x) => (x.id === c.id ? { ...x, status: 'done', result: { kind: r.kind, team: r.team } } : x)), log: [...n.log, entry], current: null, turn: nextTeamIndex(n, n.turn), phase: 'board' };
  if (isBoardDone(n)) n = { ...n, phase: 'done', endedAt: now };
  return n;
}
function endGame(g, now = Date.now()) {
  if (g.phase === 'done') return g;
  const n = withHistory(g, 'end');
  return { ...n, phase: 'done', current: null, endedAt: now, endedEarly: true };
}
// Host fixes a mistake by hand. Logged so it shows in the game log.
function adjustScore(g, teamId, delta, now = Date.now()) {
  if (!delta || !teamById(g, teamId)) return g;
  const n = withHistory(g, 'adjust');
  return { ...addScore(n, teamId, delta), log: [...n.log, { kind: 'adjust', team: teamId, points: delta, at: now }] };
}

/* ---------- results ---------- */
function winners(g) {
  const top = Math.max(...g.teams.map((tm) => tm.score));
  const w = g.teams.filter((tm) => tm.score === top);
  return w.length === g.teams.length && g.teams.length > 1 ? [] : w; // [] = draw
}
function gameStats(g) {
  const per = {};
  g.teams.forEach((tm) => { per[tm.id] = { correct: 0, own: 0, steals: 0, streak: 0, best: 0, stolenPts: 0 }; });
  let biggestSteal = null, biggestWin = null;
  g.log.forEach((e) => {
    if (e.kind === 'adjust' || e.kind === 'skipped' || e.void) return;
    const own = per[e.turnTeam]; if (own) own.own++;
    if (e.kind === 'correct' && per[e.team]) {
      per[e.team].correct++; per[e.team].streak++; per[e.team].best = Math.max(per[e.team].best, per[e.team].streak);
      if (!biggestWin || e.value > biggestWin.value) biggestWin = e;
    } else if (own) own.streak = 0;
    if (e.kind === 'stolen' && per[e.team]) {
      per[e.team].steals++; per[e.team].stolenPts += e.points;
      if (!biggestSteal || e.value > biggestSteal.value) biggestSteal = e;
    }
  });
  const list = g.teams.map((tm) => ({ team: tm, ...per[tm.id], acc: per[tm.id].own ? Math.round((per[tm.id].correct / per[tm.id].own) * 100) : 0 }));
  const by = (k) => { const top = [...list].sort((a, b) => b[k] - a[k])[0]; return top && top[k] > 0 && list.filter((x) => x[k] === top[k]).length === 1 ? top : null; };
  return { list, biggestSteal, biggestWin, bestStreak: by('best'), mostSteals: by('steals'), sharpest: by('acc') };
}
// The next game with the same teams and rules.
function rematch(g, bank, now = Date.now(), opts = {}) {
  return createGame(bank, g.teams.map(({ name, color, emoji }) => ({ name, color, emoji })), g.rules, now, opts);
}
// A finished game, slimmed down for the "recent games" list.
const pastEntry = (g) => ({ id: g.id, createdAt: g.createdAt, endedAt: g.endedAt, gameNo: g.gameNo, rules: g.rules, teams: g.teams, cats: g.cats, cells: g.cells.map(({ q, ...rest }) => rest), log: g.log, invalid: g.invalid || [], phase: 'done' });

/* ---------- "This is wrong": invalidate a bad question ----------
   The host flags the question on a tile (the open one, or one already played).
   1. Exactly the score changes this question caused are reversed:
        · +points to the team that answered or stole it,
        · −points of the "wrong answers lose points" penalty (only if it was applied).
      Opening a question costs nothing in Khatfa, so there's nothing else to refund.
   2. The question is recorded in g.invalid and can't come back this game.
   3. A replacement of the same value is found: same category (same subcategory if possible).
      If none is left, the host chooses: a same-value question from a related category,
      from any category in this game, or leave the tile empty. Nothing is silently repeated.
   Idempotent: the call names the question id it is about; once that question is no longer
   on the tile (or is already in g.invalid), the call does nothing. One undo step. */
const INVALID_REASONS = ['answer', 'unclear', 'media', 'duplicate', 'other'];
const isInvalidated = (g, qid) => (g.invalid || []).some((x) => x.qid === qid);
// What reversing this question would change: [{ team, delta }] (never more than the question caused).
function invalidRefunds(g, cellId) {
  const c = cellById(g, cellId); if (!c || !c.q) return [];
  const out = [];
  const add = (team, delta) => { if (team && delta) out.push({ team, delta }); };
  const cur = g.current && g.current.cell === cellId ? g.current : null;
  if (cur) {
    if (cur.stage === 'steal') add(cur.answeredBy, cur.penalty || 0);
    if (cur.stage === 'reveal' && cur.result) { add(cur.result.team, -(cur.result.points || 0)); add(cur.result.answeredBy, cur.result.penalty || 0); }
  } else if (c.status === 'done') {
    const e = [...g.log].reverse().find((x) => x.cell === cellId && !x.void && x.kind !== 'adjust');
    if (e) { add(e.team, -(e.points || 0)); add(e.answeredBy || e.turnTeam, e.penalty || 0); }
  }
  return out;
}
// Every question id this game has used or ruled out (so a replacement is always fresh).
function gameUsed(g) {
  const used = new Set(); const facts = new Set();
  g.cells.forEach((c) => { if (c.q) { used.add(c.q.id); (c.q.facts && c.q.facts.length ? c.q.facts : [c.q.id]).forEach((k) => facts.add(k)); } });
  (g.invalid || []).forEach((x) => { used.add(x.qid); (x.facts || []).forEach((k) => facts.add(k)); });
  return { used, facts };
}
// Same value, same category (same subcategory first). ctx: { bank, recent, rand, exclude:[ids] }
function findReplacement(g, cell, ctx) {
  if (!ctx || !ctx.bank) return null;
  const { used, facts } = gameUsed(g);
  (ctx.exclude || []).forEach((id) => used.add(id));
  const base = { used, facts, recent: ctx.recent || {}, gameNo: g.gameNo, rand: ctx.rand || Math.random };
  const rules = { ...g.rules, nicheOnly: false };
  const realCat = cell.q ? cell.q.cat : cell.cat;
  const try1 = (pool) => selectQuestions(pool, cell.tier, 1, rules, { ...base, used: new Set(base.used), facts: new Set(base.facts) }).picked[0] || null;
  if (cell.cat === MIX_ID) {
    const allowed = g.pool.filter((p) => p.id !== MIX_ID).map((p) => p.id);
    const r = selectMix(ctx.bank, allowed, cell.tier, 1, rules, { ...base, used: new Set(base.used), facts: new Set(base.facts) });
    return r.picked[0] ? { q: r.picked[0], how: 'same' } : null;
  }
  const pool = ctx.bank.byCat[realCat] || [];
  const sub = cell.q && cell.q.sub;
  const q = (sub && try1(pool.filter((x) => x.sub === sub))) || try1(pool);
  return q ? { q, how: 'same' } : null;
}
// When the category has nothing left at this value: candidates the host can choose from.
function replacementOptions(g, cell, ctx) {
  if (!ctx || !ctx.bank) return [];
  const { used, facts } = gameUsed(g);
  (ctx.exclude || []).forEach((id) => used.add(id));
  const rules = { ...g.rules, nicheOnly: false };
  const realCat = cell.q ? cell.q.cat : cell.cat;
  const meta = ctx.bank.cats.find((x) => x.id === realCat);
  const group = meta ? meta.group : null;
  const inGame = g.cats.map((c) => c.id).filter((id) => id !== MIX_ID && id !== realCat);
  const related = ctx.bank.cats.filter((x) => x.group === group && x.id !== realCat).map((x) => x.id);
  const out = [];
  const tryCats = (ids, how) => {
    for (const id of shuffleWith(ids, ctx.rand || Math.random)) {
      const q = selectQuestions(ctx.bank.byCat[id] || [], cell.tier, 1, rules, { used: new Set(used), facts: new Set(facts), recent: ctx.recent || {}, gameNo: g.gameNo, rand: ctx.rand || Math.random }).picked[0];
      if (q) { out.push({ q, how }); used.add(q.id); return; }
    }
  };
  tryCats(related, 'related');
  tryCats(inGame, 'board');
  return out;
}
/* opts: { qid (required: the question being flagged), reason, note, replacement: { q, how } | 'empty', now }
   Returns the same game if nothing should change (wrong qid, already done, etc.). */
function invalidateQuestion(g, cellId, opts) {
  const o = opts || {};
  const c = cellById(g, cellId);
  if (!c || !c.q || c.q.id !== o.qid || isInvalidated(g, o.qid) || g.phase === 'pick') return g;
  const isCur = !!(g.current && g.current.cell === cellId);
  if (!isCur && c.status !== 'done') return g; // only an opened or already-played question can be flagged
  const now = o.now || Date.now();
  const refunds = invalidRefunds(g, cellId);
  const stage = isCur ? g.current.stage : 'done';
  const opener = isCur ? (g.current.opener || g.current.answeredBy || (g.current.result && g.current.result.answeredBy) || g.current.team) : null;
  let n = withHistory(g, 'invalid');
  refunds.forEach((r) => { n = addScore(n, r.team, r.delta); });
  const rep = o.replacement && o.replacement !== 'empty' && o.replacement.q ? o.replacement : null;
  const record = { qid: c.q.id, cell: cellId, cat: c.cat, tier: c.tier, value: c.value, facts: c.q.facts || [], stage, reason: INVALID_REASONS.includes(o.reason) ? o.reason : 'other', note: o.note ? String(o.note).slice(0, 300) : '', refunds, replacement: rep ? rep.q.id : null, how: rep ? rep.how : 'empty', at: now, q: { q: c.q.q, a: c.q.a } };
  const log = n.log.map((e) => (!isCur && e.cell === cellId && !e.void && e.kind !== 'adjust' ? { ...e, void: true } : e));
  log.push({ kind: 'invalid', cell: cellId, cat: c.cat, tier: c.tier, value: c.value, refunds, replaced: !!rep, at: now });
  const cells = n.cells.map((x) => {
    if (x.id !== cellId) return x;
    const { result, ...rest } = x;
    return rep ? { ...rest, q: rep.q, status: 'open', replaced: (x.replaced || 0) + 1, why: undefined } : { ...rest, q: null, status: 'empty', why: 'invalid' };
  });
  n = { ...n, cells, log, invalid: [...(n.invalid || []), record] };
  if (isCur) {
    // The team that opened it gets the replacement straight away (fresh clock); with no replacement they pick again.
    if (rep) n = { ...n, phase: 'question', current: { cell: cellId, stage: 'answer', team: opener, opener, endsAt: now + ms(n.rules.answerTime * 1000), pausedLeft: null, result: null, play: freshPlay(), reveal: 0 } };
    else n = { ...n, phase: 'board', current: null };
  }
  if (n.phase === 'done' && !n.endedEarly && openCells(n).length) n = { ...n, phase: 'board', endedAt: undefined };
  if (n.phase === 'board' && isBoardDone(n)) n = { ...n, phase: 'done', endedAt: now };
  return n;
}
