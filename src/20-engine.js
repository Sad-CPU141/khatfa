/* ============================================================
   GAME ENGINE — pure functions: (game, ...) → new game.
   The UI, the TV view and (later) the online host all use these.

   Phases:  pick → board ⇄ question → done
   A question goes through stages:  answer → (steal) → reveal
   Times are absolute ms timestamps (endsAt) so any screen can draw the clock.
   ============================================================ */
const DEFAULT_RULES = {
  values: [200, 400, 600],  // points for tier 1 / 2 / 3
  perValue: 2,              // questions per value in each category
  catsPerTeam: 3,
  answerTime: 45,           // seconds
  stealTime: 15,
  steals: true,
  // optional modifiers (all OFF by default)
  wrongPenalty: false,
};
const VALUE_PRESETS = [[200, 400, 600], [100, 200, 300], [300, 600, 900]];
const TIME_CHOICES = [20, 30, 45, 60, 90];
const STEAL_CHOICES = [10, 15, 20, 30];
const HISTORY_MAX = 40;

function cleanRules(r) {
  const x = { ...DEFAULT_RULES, ...(r || {}) };
  if (!Array.isArray(x.values) || x.values.length !== 3 || x.values.some((v) => typeof v !== 'number' || v <= 0)) x.values = [...DEFAULT_RULES.values];
  x.perValue = x.perValue === 1 ? 1 : 2;
  x.catsPerTeam = clamp(Math.round(x.catsPerTeam) || 3, 1, 6);
  x.answerTime = clamp(Math.round(x.answerTime) || 45, 5, 300);
  x.stealTime = clamp(Math.round(x.stealTime) || 15, 5, 120);
  x.steals = x.steals !== false;
  x.wrongPenalty = !!x.wrongPenalty;
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
// teams: [{ name, color, emoji }]
function createGame(pack, teams, rules, now = Date.now()) {
  const r = cleanRules(rules);
  return {
    v: 1, id: uid(), createdAt: now,
    pack: { id: pack.id, name: pack.name, sample: !!pack.sample },
    rules: r,
    teams: teams.map((tm, i) => ({ id: 't' + i, name: (tm.name || '').trim(), color: tm.color || COLORS[i], emoji: tm.emoji || EMOJIS[i], score: 0 })),
    // available categories (snapshot, so editing a pack later never breaks a saved game)
    pool: pack.categories.map((c) => ({ id: c.id, emoji: c.emoji, name: c.name, questions: c.questions })),
    cats: [], cells: [], log: [],
    phase: 'pick', turn: 0, current: null, history: [],
  };
}
const picksNeeded = (g) => g.rules.catsPerTeam * g.teams.length;
// Teams alternate picking: 0,1,0,1… (with more teams: 0,1,2,0,1,2…)
const pickingTeam = (g) => g.teams[g.cats.length % g.teams.length];
const usable = (c) => c.questions && c.questions.length > 0;
function pickCategory(g, catId) {
  if (g.phase !== 'pick') return g;
  const c = g.pool.find((x) => x.id === catId);
  if (!c || !usable(c) || g.cats.some((x) => x.id === catId)) return g;
  const by = pickingTeam(g).id;
  let n = withHistory(g, 'pick');
  n = { ...n, cats: [...n.cats, { id: c.id, emoji: c.emoji, name: c.name, by }] };
  if (n.cats.length >= picksNeeded(n)) n = buildBoard(n);
  return n;
}
function randomPick(g) {
  const left = g.pool.filter((c) => usable(c) && !g.cats.some((x) => x.id === c.id));
  return left.length ? pickCategory(g, left[Math.floor(Math.random() * left.length)].id) : g;
}
// Lay out the board: for each picked category, perValue questions for each tier.
// Missing tiers borrow the nearest unused question from the same category.
function buildBoard(g) {
  const cells = [];
  g.cats.forEach((cat) => {
    const src = g.pool.find((x) => x.id === cat.id);
    const used = new Set();
    const byTier = (tier) => shuffle(src.questions.filter((q) => (q.tier || 1) === tier && !used.has(q.id)));
    [1, 2, 3].forEach((tier) => {
      for (let k = 0; k < g.rules.perValue; k++) {
        let q = byTier(tier)[0];
        if (!q) q = shuffle(src.questions.filter((x) => !used.has(x.id))).sort((a, b) => Math.abs((a.tier || 1) - tier) - Math.abs((b.tier || 1) - tier))[0];
        if (q) used.add(q.id);
        cells.push({ id: cat.id + ':' + tier + ':' + k, cat: cat.id, tier, value: g.rules.values[tier - 1], q: q || null, status: q ? 'open' : 'empty' });
      }
    });
  });
  return { ...g, cells, phase: 'board', turn: 0, pool: undefined };
}

/* ---------- a question ---------- */
function openCell(g, cellId, now = Date.now()) {
  const c = cellById(g, cellId);
  if (g.phase !== 'board' || !c || c.status !== 'open') return g;
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
function rematch(g, pack, now = Date.now()) {
  return createGame(pack, g.teams.map(({ name, color, emoji }) => ({ name, color, emoji })), g.rules, now);
}
// A finished game, slimmed down for the "recent games" list.
const pastEntry = (g) => ({ id: g.id, createdAt: g.createdAt, endedAt: g.endedAt, pack: g.pack, rules: g.rules, teams: g.teams, cats: g.cats, cells: g.cells.map(({ q, ...rest }) => rest), log: g.log, phase: 'done' });
