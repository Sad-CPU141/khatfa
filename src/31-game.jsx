/* ============================================================
   THE GAME: category pick, board, question, results.
   Every change goes through the engine (20-engine.js).
   Host screens get `act(fn, flash?)`; TV screens get the same game read-only.
   ============================================================ */
function useNow(active, every = 200) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { if (!active) return undefined; const id = setInterval(() => setNow(Date.now()), every); return () => clearInterval(id); }, [active, every]);
  return now;
}
const UNDO_TXT = {
  pick: ['category pick', 'اختيار الفئة'], open: ['opening the question', 'فتح السؤال'], correct: ['“correct”', '«صح»'], wrong: ['“wrong”', '«غلط»'],
  stolen: ['the steal', 'الخطف'], missed: ['“missed”', '«ضاعت»'], skip: ['the skip', 'التخطي'], putBack: ['putting it back', 'إرجاع السؤال'],
  next: ['back to the board', 'الرجوع للوحة'], end: ['ending the game', 'إنهاء اللعبة'], adjust: ['the score fix', 'تعديل النقاط'],
};
const undoText = (g) => { const l = undoLabel(g); return l ? t('undoWhat', { what: (UNDO_TXT[l] || [l, l])[LANG === 'ar' ? 1 : 0] }) : t('nothingToUndo'); };

/* ---------- category pick ---------- */
function CategoryGrid({ g, cats, onPick, big }) {
  const pickedBy = (id) => { const c = g.cats.find((x) => x.id === id); return c ? teamById(g, c.by) : null; };
  return (
    <div className={'catgrid' + (big ? ' big' : '')}>
      {(cats || g.pool || []).map((c) => {
        const by = pickedBy(c.id);
        const short = (c.short || [0, 0, 0]).some((n) => n > 0);
        const off = !!by || short;
        return (
          <button key={c.id} className={'catcard' + (by ? ' taken' : '') + (short ? ' short' : '')} disabled={off || !onPick} style={by ? tStyle(by) : undefined} onClick={() => onPick && onPick(c.id)} aria-pressed={!!by}>
            <span className="cc-em">{c.emoji}</span>
            <Txt v={c.name} className="cc-name" />
            {by ? <span className="cc-by">{by.emoji} <Name team={by} /></span>
              : short ? <span className="cc-n small">⚠ {t('notEnough')}</span>
              : c.id === MIX_ID ? <span className="cc-n small muted">{t('mixSub')}</span>
              : <TierCounts count={c.count} />}
            {!by && !short && c.id !== MIX_ID && (c.popular || c.nicheTopic || (c.count && c.count[0] + c.count[1] + c.count[2] >= BIG_BANK)) && <span className="cbadges"><CatBadges c={c} total={c.count ? c.count[0] + c.count[1] + c.count[2] : 0} /></span>}
          </button>
        );
      })}
    </div>
  );
}
function CategoryPick({ g, act, ctx, bank, onMenu, onTv }) {
  const team = pickingTeam(g);
  const left = picksNeeded(g) - g.cats.length;
  return (
    <div className="app pickscreen">
      <TopBar left={<MenuBtn onClick={onMenu} />} title={t('pickTitle')} right={<TvButton onTv={onTv} />} dense />
      <div className="picker" style={tStyle(team)}>
        <span className="pk-em">{team.emoji}</span>
        <b className="pk-t">{t('yourPick', { team: teamName(team) })}</b>
        <span className="small">{t('picksLeft', { n: left })}</span>
      </div>
      {g.cats.length > 0 && <div className="chips picked">{g.cats.map((c) => { const by = teamById(g, c.by); return <span key={c.id} className="pchip" style={tStyle(by)}>{c.emoji} <Txt v={c.name} /></span>; })}</div>}
      <div className="row">
        <button className="btn btn-ghost btn-sm grow" disabled={!g.cats.length} onClick={() => act(undo)}>↶ {t('undoPick')}</button>
        <button className="btn btn-ghost btn-sm grow" onClick={() => act((x) => randomPick(x, ctx()))}>🎲 {t('randomPick')}</button>
      </div>
      <CategoryPicker g={g} bank={bank} onPick={(id) => act((x) => pickCategory(x, id, ctx()))} />
    </div>
  );
}

/* ---------- board ---------- */
function Tile({ g, cell, onOpen }) {
  if (cell.status === 'empty') { const why = cell.why === 'invalid' ? t('tileInvalid') : t('tierExhausted', { v: cell.value }); return <span className={'tile empty' + (cell.why === 'invalid' ? ' invalid' : '')} title={why} aria-label={cell.value + ' · ' + why}><span className="num">{cell.value}</span><i>{cell.why === 'invalid' ? '⚠' : '∅'}</i></span>; }
  if (cell.status === 'done') {
    const r = cell.result || {};
    const team = r.team ? teamById(g, r.team) : null;
    const mark = r.kind === 'stolen' ? '⚡' : r.kind === 'correct' ? '✓' : '✕';
    return <span className={'tile done k-' + r.kind} style={team ? tStyle(team) : undefined} aria-label={cell.value + ' ' + (team ? teamName(team) : t('logMissed'))}><span className="num">{cell.value}</span><i>{mark}</i></span>;
  }
  const active = g.current && g.current.cell === cell.id;
  const locked = isLocked(g, cell);
  return <button className={'tile open' + (active ? ' active' : '') + (locked ? ' locked' : '')} disabled={!onOpen || locked} aria-label={locked ? cell.value + ' · ' + t('lockedTile') : undefined} onClick={() => onOpen && onOpen(cell.id)}><span className="num">{cell.value}</span>{locked && <i>🔒</i>}</button>;
}
function BoardGrid({ g, onOpen, big }) {
  return (
    <div className={'board n' + g.cats.length + (big ? ' big' : '')}>
      {g.cats.map((cat) => {
        const by = teamById(g, cat.by);
        const cells = g.cells.filter((c) => c.cat === cat.id);
        return (
          <section key={cat.id} className="bcat" style={by ? tStyle(by) : undefined}>
            <header className="bc-head"><span className="bc-em">{cat.emoji}</span><Txt v={cat.name} className="bc-name" /></header>
            <div className={'bc-tiles per' + g.rules.perValue}>
              {cells.map((c) => <Tile key={c.id} g={g} cell={c} onOpen={onOpen} />)}
            </div>
          </section>
        );
      })}
    </div>
  );
}
function Board({ g, act, onMenu, onTv }) {
  const team = turnTeam(g);
  return (
    <div className="app wide">
      <TopBar left={<MenuBtn onClick={onMenu} />} title={t('leftN', { n: openCells(g).length })} right={<TvButton onTv={onTv} />} dense />
      <ScoreBar g={g} activeId={team.id} label={t('turnShort')} />
      <p className="turnline" style={tStyle(team)}><span>{team.emoji}</span> {t('turnOf', { team: teamName(team) })}</p>
      <BoardReport g={g} />
      <BoardGrid g={g} onOpen={(id) => act((x) => openCell(x, id, Date.now()))} />
    </div>
  );
}

// Tells the host when the bank couldn't fill every tile, or had to reuse recent questions.
function BoardReport({ g }) {
  const [hide, setHide] = useState(false);
  const r = g.report;
  if (hide || !r || (!r.exhausted.length && !r.repeats && !r.nicheShort)) return null;
  return (
    <div className="card boardnote" role="status">
      {r.exhausted.length > 0 && <p>⚠ {t('reportExhausted', { list: r.exhausted.map((e) => { const c = catById(g, e.cat); return (c ? pick(c.name) : e.cat) + ' ' + POINTS[e.tier - 1]; }).join(', ') })}</p>}
      {r.repeats > 0 && <p>↺ {t('reportRepeats', { n: r.repeats })}</p>}
      {r.nicheShort > 0 && <p>🌶️ {t('reportNiche', { n: r.nicheShort })}</p>}
      <button className="btn btn-sm btn-ghost" onClick={() => setHide(true)}>{t('dismiss')}</button>
    </div>
  );
}

/* ---------- question ---------- */
function Clock({ g, big }) {
  const cur = g.current;
  const running = cur && cur.stage !== 'reveal' && cur.pausedLeft == null;
  const now = useNow(running, 200);
  if (!cur || cur.stage === 'reveal') return null;
  const total = ms((cur.stage === 'steal' ? g.rules.stealTime : g.rules.answerTime) * 1000);
  const left = timeLeft(g, now);
  const secs = Math.ceil(left / ms(1000));
  const pct = Math.max(0, Math.min(100, (left / total) * 100));
  const out = left <= 0;
  return (
    <div className={'clock' + (secs <= 5 && !out ? ' hot' : '') + (out ? ' out' : '') + (big ? ' big' : '')} role="timer" aria-live="off">
      <span className="ck-n num">{cur.pausedLeft != null ? '⏸ ' + secs : out ? t('timeUp') : secs}</span>
      <span className="ck-bar"><i style={{ width: pct + '%' }} /></span>
    </div>
  );
}
const altList = (q) => (q.alt ? [...(q.alt[LANG] || []), ...(q.alt[LANG === 'ar' ? 'en' : 'ar'] || [])] : []);
function QuestionCard({ cell, big, showAnswer, host, cur, output, onStatus, status }) {
  const q = cell.q;
  return (
    <div className={'qcard' + (big ? ' big' : '') + (q.media ? ' hasmedia m-' + q.media.type : '')}>
      {q.media && <MediaView q={q} cur={cur} big={big} output={output} onStatus={onStatus} status={status} full={showAnswer && !host} />}
      <Txt v={q.q} as="p" className="qtext" />
      {showAnswer && (
        <div className="qans">
          <span className="eyebrow">{t('answer')}</span>
          <Txt v={q.a} as="p" className="atext" both />
          {host && altList(q).length > 0 && <p className="aalt"><b>{t('alsoAccept')}</b> <bdi dir="auto">{altList(q).join(' · ')}</bdi></p>}
          {q.note && <Txt v={q.note} as="p" className="anote" />}
          {host && q.asOf && <p className="aalt">{t('asOf', { d: q.asOf })}</p>}
          {host && q.hint && <p className="aalt">💡 <b>{t('hintForHost')}</b> <Txt v={q.hint} /></p>}
        </div>
      )}
    </div>
  );
}
function QHead({ g, cell }) {
  const cat = catById(g, cell.cat);
  return (
    <div className="qhead">
      <span className="qh-cat">{cat.emoji} <Txt v={cat.name} />{cell.q && cell.q.media && <span className="qh-type">{MEDIA_ICON[cell.q.media.type]} {t('type_' + cell.q.media.type)}</span>}</span>
      <span className="qh-val num">{t('points', { n: cell.value })}</span>
    </div>
  );
}
function StageBanner({ g }) {
  const cur = g.current; const team = teamById(g, cur.team);
  if (cur.stage === 'reveal') return null;
  return (
    <div className={'stage s-' + cur.stage} style={tStyle(team)}>
      <span className="st-em">{cur.stage === 'steal' ? '⚡' : team.emoji}</span>
      <b>{cur.stage === 'steal' ? t('stealChance', { team: teamName(team) }) : t('answering', { team: teamName(team) })}</b>
    </div>
  );
}
function ResultBanner({ g }) {
  const r = g.current.result || {};
  const team = r.team ? teamById(g, r.team) : null;
  const answered = r.answeredBy ? teamById(g, r.answeredBy) : null;
  const title = { correct: t('flashCorrect'), stolen: t('flashSteal'), missed: t('noPoints'), skipped: t('skipped') }[r.kind];
  return (
    <div className={'result k-' + r.kind} style={team ? tStyle(team) : undefined}>
      <b className="rs-t">{title}</b>
      {team && <span className="rs-s">{t('pointsTo', { n: r.points, team: teamName(team) })}</span>}
      {r.penalty > 0 && answered && <span className="rs-s">{t('lostPoints', { n: r.penalty, team: teamName(answered) })}</span>}
    </div>
  );
}
function QuestionScreen({ g, act, flash, onMenu, onTv, onWrong, media }) {
  const cur = g.current; const cell = curCell(g);
  const [peek, setPeek] = useState(false);
  useEffect(() => { setPeek(false); }, [cell && cell.id]);
  const reveal = cur.stage === 'reveal';
  const correct = () => {
    const kind = cur.stage === 'steal' ? 'stolen' : 'correct';
    act(markCorrect); flash({ kind, team: cur.team, points: cell.value }); buzz(kind === 'stolen' ? [40, 40, 80] : 40);
  };
  const wrong = () => {
    const pen = cur.stage === 'answer' && g.rules.wrongPenalty ? -cell.value : 0;
    act((x) => markWrong(x, Date.now()));
    flash(cur.stage === 'steal' ? { kind: 'missed' } : { kind: 'wrong', team: pen ? cur.team : null, points: pen }); buzz(120);
  };
  const last = isBoardDone({ ...g, cells: g.cells.map((c) => (c.id === cell.id ? { ...c, status: 'done' } : c)) });
  return (
    <div className="app qscreen">
      <TopBar left={<MenuBtn onClick={onMenu} />} title={t('leftN', { n: openCells(g).length })} right={<TvButton onTv={onTv} />} dense />
      <ScoreBar g={g} activeId={reveal ? null : cur.team} />
      <QHead g={g} cell={cell} />
      <StageBanner g={g} />
      <Clock g={g} />
      <QuestionCard cell={cell} showAnswer={reveal || peek} host cur={cur} output={media ? media.output : true} onStatus={media && media.onStatus} status={media && media.status} />
      {cell.q.media && <MediaControls g={g} act={act} status={media && media.status} where={media && media.where} swap={media && media.swap} answer={cell.q.a} onWrong={onWrong ? () => onWrong(cell.id) : null} />}
      {!!cell.q.check && <p className="checkbadge">{t('needsCheck')}</p>}
      {reveal && <ResultBanner g={g} />}
      {onWrong && <button className="btn btn-sm btn-flag wrongbtn" onClick={() => onWrong(cell.id)}>⚠ {t('thisIsWrong')}</button>}
      {!reveal && <button className="btn btn-ghost btn-sm peek" aria-pressed={peek} onClick={() => setPeek(!peek)}>👁 {peek ? t('hideAnswer') : t('showAnswer')}</button>}
      {!reveal && <p className="hint center">{t('hostHint')}</p>}
      <div className="actions">
        {!reveal && cur.stage === 'answer' && <>
          <button className="btn btn-wrong" onClick={wrong}>✕ {t('wrong')}</button>
          <button className="btn btn-right" onClick={correct}>✓ {t('correct')}</button>
        </>}
        {!reveal && cur.stage === 'steal' && <>
          <button className="btn btn-wrong" onClick={wrong}>✕ {t('missed')}</button>
          <button className="btn btn-steal" onClick={correct}>⚡ {t('stolen')}</button>
        </>}
        {reveal && <button className="btn btn-gold span2" onClick={() => act((x) => finishQuestion(x, Date.now()))}>{last ? t('seeResults') : t('backToBoard')}</button>}
      </div>
    </div>
  );
}

/* ---------- results ---------- */
function Moments({ g }) {
  const s = gameStats(g);
  const items = [];
  const cname = (e) => { const c = catById(g, e.cat); return c ? pick(c.name) : ''; };
  if (s.biggestSteal) { const tm = teamById(g, s.biggestSteal.team); items.push({ k: t('mBiggestSteal'), v: '⚡ ' + s.biggestSteal.value, d: teamName(tm) + ' · ' + cname(s.biggestSteal), team: tm }); }
  if (s.biggestWin) { const tm = teamById(g, s.biggestWin.team); items.push({ k: t('mBigWin'), v: s.biggestWin.value, d: teamName(tm) + ' · ' + cname(s.biggestWin), team: tm }); }
  if (s.bestStreak) items.push({ k: t('mBestStreak'), v: '🔥 ' + s.bestStreak.best, d: teamName(s.bestStreak.team) + ' · ' + t('streakN', { n: s.bestStreak.best }), team: s.bestStreak.team });
  if (s.mostSteals) items.push({ k: t('mMostSteals'), v: '⚡×' + s.mostSteals.steals, d: teamName(s.mostSteals.team), team: s.mostSteals.team });
  if (s.sharpest) items.push({ k: t('mAccuracy'), v: s.sharpest.acc + '%', d: teamName(s.sharpest.team) + ' · ' + t('accN', { p: s.sharpest.acc }), team: s.sharpest.team });
  if (!items.length) return null;
  return (
    <section className="stack-sm">
      <span className="eyebrow">{t('moments')}</span>
      <div className="stat-grid">{items.map((x) => <div key={x.k} className="stat" style={x.team ? tStyle(x.team) : undefined}><span className="k">{x.k}</span><span className="v num">{x.v}</span><span className="d" dir="auto">{x.d}</span></div>)}</div>
    </section>
  );
}
function Winner({ g, big }) {
  const w = winners(g);
  if (!w.length) return <div className={'winner draw' + (big ? ' big' : '')}><span className="eyebrow">{t('finalScores')}</span><h2 className="display">{t('itsADraw')}</h2></div>;
  return (
    <div className={'winner' + (big ? ' big' : '')} style={tStyle(w[0])}>
      <span className="w-crown">👑</span>
      <span className="eyebrow">{t('winnerIs')}</span>
      <h2 className="display"><span>{w[0].emoji}</span> <Name team={w[0]} /></h2>
      <span className="w-score num">{w[0].score}</span>
    </div>
  );
}
function GameLog({ g }) {
  return (
    <details className="card">
      <summary className="label">{t('gameLog')}</summary>
      <ol className="glog">
        {g.log.map((e, i) => {
          const tm = e.team ? teamById(g, e.team) : null;
          const c = e.cat ? catById(g, e.cat) : null;
          if (e.kind === 'invalid') return <li key={i} className="lg-invalid">{c && <span className="muted">{c.emoji} {pick(c.name)} {e.value} · </span>}<span>⚠ {e.replaced ? t('logInvalidRep') : t('logInvalid')}</span>{(e.refunds || []).map((r, k) => { const rt = teamById(g, r.team); return <span key={k} className="muted"> · {teamName(rt)} {fmtDelta(r.delta)}</span>; })}</li>;
          const what = e.kind === 'adjust' ? t('logAdjust', { team: teamName(tm), d: (e.points > 0 ? '+' : '') + e.points })
            : e.kind === 'correct' ? t('logCorrect', { team: teamName(tm) }) : e.kind === 'stolen' ? t('logStolen', { team: teamName(tm) }) : e.kind === 'skipped' ? t('logSkipped') : t('logMissed');
          return <li key={i} className={e.void ? 'lg-void' : undefined}>{c && <span className="muted">{c.emoji} {pick(c.name)} {e.value} · </span>}<span dir="auto">{what}</span>{e.penalty ? <span className="muted"> (−{e.penalty})</span> : null}{e.void ? <span className="muted"> {t('logVoid')}</span> : null}</li>;
        })}
      </ol>
    </details>
  );
}
function Results({ g, act, onHome, onAgain, onFlagPlayed }) {
  const sorted = [...g.teams].sort((a, b) => b.score - a.score);
  const s = gameStats(g);
  return (
    <div className="app">
      <TopBar onBack={onHome} title={t('resultsTitle')} />
      <Winner g={g} />
      <section className="stack-sm">
        <span className="eyebrow">{t('finalScores')}</span>
        {sorted.map((tm, i) => {
          const st = s.list.find((x) => x.team.id === tm.id);
          return (
            <div key={tm.id} className="frow" style={tStyle(tm)}>
              <span className="fr-rk num">{i + 1}</span>
              <span className="grow fr-n">{tm.emoji} <Name team={tm} /><small className="muted"> · {t('correctShort')} {st.correct} · {t('stealsShort')} {st.steals}</small></span>
              <b className="fr-s num">{tm.score}</b>
            </div>
          );
        })}
      </section>
      <Moments g={g} />
      <GameLog g={g} />
      {onFlagPlayed && <button className="btn btn-sm btn-flag" onClick={onFlagPlayed}>⚠ {t('flagPlayed')}</button>}
      <button className="btn btn-gold" onClick={onAgain}>{t('playAgain')}</button>
      <p className="hint center" style={{ marginTop: -8 }}>{t('playAgainSub')}</p>
      <div className="row">
        <button className="btn grow" onClick={onHome}>{t('home')}</button>
        {undoLabel(g) && <button className="btn btn-ghost grow" onClick={() => act(undo)}>↶ {t('undo')}</button>}
      </div>
    </div>
  );
}

/* ---------- menu + fix scores ---------- */
function FixScores({ g, act, onClose }) {
  const step = g.rules.values[0];
  return (
    <Sheet onClose={onClose}>
      <div className="stack">
        <h2 className="display">{t('fixScores')}</h2>
        <p className="hint">{t('fixScoresSub')}</p>
        {g.teams.map((tm) => (
          <div key={tm.id} className="fixrow" style={tStyle(tm)}>
            <span className="grow">{tm.emoji} <Name team={tm} /></span>
            <button className="mini" aria-label={'−' + step + ' ' + teamName(tm)} onClick={() => act((x) => adjustScore(x, tm.id, -step))}>−</button>
            <b className="num fx-s">{tm.score}</b>
            <button className="mini" aria-label={'+' + step + ' ' + teamName(tm)} onClick={() => act((x) => adjustScore(x, tm.id, step))}>+</button>
          </div>
        ))}
        <button className="btn btn-gold" onClick={onClose}>{t('close')}</button>
      </div>
    </Sheet>
  );
}
function GameMenu({ g, act, onClose, onHome, onFlagPlayed }) {
  const [ask, setAsk] = useState(null);
  const [fix, setFix] = useState(false);
  const cur = g.current; const inQ = g.phase === 'question' && cur && cur.stage !== 'reveal';
  const run = (fn) => { act(fn); onClose(); };
  if (fix) return <FixScores g={g} act={act} onClose={onClose} />;
  if (ask === 'end') return <Confirm title={t('endGameQ')} body={t('endGameBody')} yes={t('endGame')} danger onYes={() => act((x) => endGame(x, Date.now()))} onClose={onClose} />;
  return (
    <Sheet onClose={onClose}>
      <div className="stack-sm">
        <h2 className="display">{t('menu')}</h2>
        <button className="btn" disabled={!undoLabel(g)} onClick={() => run(undo)}>↶ {undoText(g)}</button>
        {inQ && (cur.pausedLeft == null
          ? <button className="btn" onClick={() => run((x) => pauseTimer(x, Date.now()))}>⏸ {t('pause')}</button>
          : <button className="btn" onClick={() => run((x) => resumeTimer(x, Date.now()))}>▶ {t('resume')}</button>)}
        {inQ && cur.stage === 'answer' && <button className="btn menu2" onClick={() => run(putBack)}><span>↩ {t('putBack')}</span><small>{t('putBackSub')}</small></button>}
        {inQ && <button className="btn" onClick={() => run(skipQuestion)}>⏭ {t('skipQ')}</button>}
        {g.phase !== 'pick' && <button className="btn" onClick={() => setFix(true)}>± {t('fixScores')}</button>}
        {g.phase !== 'pick' && onFlagPlayed && <button className="btn btn-flag" onClick={() => { onClose(); onFlagPlayed(); }}>⚠ {t('flagPlayed')}</button>}
        {g.phase !== 'pick' && <button className="btn btn-danger" onClick={() => setAsk('end')}>🏁 {t('endGame')}</button>}
        <button className="btn btn-ghost menu2" onClick={() => { onClose(); onHome(); }}><span>🏠 {t('quitHome')}</span><small>{t('quitHomeSub')}</small></button>
        <button className="btn btn-ghost" onClick={onClose}>{t('close')}</button>
      </div>
    </Sheet>
  );
}
