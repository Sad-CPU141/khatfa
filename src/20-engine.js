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
  const { cells, report } = selectBoard(g.cats, ctx.bank, g.rules, { recent: ctx.recent, gameNo: g.gameNo, rand: ctx.rand, allowed });
  return { ...g, cells, report, phase: 'board', turn: 0, pool: g.pool };
}

/* ---------- a question ---------- */
// Progressive Difficulty: a tile is locked while easier tiles in its category are still open.
function isLocked(g, c) {
  if (!g.rules.progressive || c.status !== 'open') return false;
  return g.cells.some((x) => x.cat === c.cat && x.status === 'open' && x.tier < c.tier);
}
function openCell(g, cellId, now = Date.now()) {
  const c = cellById(g, cellId);
  if (g.phase !== 'board' || !c || c.status !== 'open' || isLocked(g, c)) return g;
  const n = withHistory(g, 'open');
  return { ...n, phase: 'question', current: { cell: c.id, stage: 'answer', team: turnTeam(g).id, endsAt: now + ms(g.rules.answerTime * 1000), pausedLeft: null, result: null } };
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
  const entry = { cell: c.id, cat: c.cat, tier: c.tier, value: c.value, turnTeam: turnTeam(n).id, kind: r.kind, team: r.team, points: r.points || 0, penalty: r.penalty || 0, at: now };
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
    if (e.kind === 'adjust' || e.kind === 'skipped') return;
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
const pastEntry = (g) => ({ id: g.id, createdAt: g.createdAt, endedAt: g.endedAt, gameNo: g.gameNo, rules: g.rules, teams: g.teams, cats: g.cats, cells: g.cells.map(({ q, ...rest }) => rest), log: g.log, phase: 'done' });
