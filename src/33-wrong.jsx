/* ============================================================
   "THIS IS WRONG": the host flags a broken / wrong question.
   The sheet shows exactly which score changes will be reversed and what
   replaces the question, then applies it as ONE engine step
   (invalidateQuestion), which is idempotent and undoable.
   ============================================================ */
const fmtDelta = (d) => (d > 0 ? '+' : '−') + Math.abs(d);
const catName = (g, bank, id) => { const c = catById(g, id) || (bank && bank.cats.find((x) => x.id === id)); return c ? pick(c.name) : id; };

function WrongSheet({ g, cellId, ctx, act, onClose, onDone }) {
  const cell = cellById(g, cellId);
  const qid = cell && cell.q && cell.q.id;
  const [reason, setReason] = useState(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  // Work the replacement out once, so what the host sees is exactly what happens.
  const plan = useMemo(() => {
    if (!cell || !cell.q) return null;
    const c = ctx();
    const same = findReplacement(g, cell, c);
    return { refunds: invalidRefunds(g, cellId), same, options: same ? [] : replacementOptions(g, cell, c) };
  }, [cellId, qid]);
  const [choice, setChoice] = useState(0);
  if (!cell || !plan) return null;
  const isCur = !!(g.current && g.current.cell === cellId);
  const realCat = cell.q.cat;
  const choices = plan.same ? [plan.same] : [...plan.options, 'empty'];
  const chosen = choices[Math.min(choice, choices.length - 1)];
  const refunding = plan.refunds.length > 0;
  const go = () => {
    if (busy) return; setBusy(true);
    const rec = { qid, reason: reason || 'other', note, replacement: chosen, now: Date.now() };
    act((x) => invalidateQuestion(x, cellId, rec));
    onDone && onDone({ refunded: refunding, cell, rec, refunds: plan.refunds, replacement: chosen });
    onClose();
  };
  const yes = refunding ? (chosen === 'empty' ? t('reverseAndEmpty') : t('reverseAndReplace')) : (chosen === 'empty' ? t('removeIt') : t('replaceIt'));
  return (
    <Sheet onClose={onClose}>
      <div className="stack wrongsheet">
        <h2 className="display" style={{ fontSize: 28 }}>⚠ {t('wrongTitle')}</h2>
        <div className="card wq"><span className="small muted">{catName(g, null, cell.cat)} · {cell.value}</span><Txt v={cell.q.q} as="p" className="wq-q" /></div>
        <p className="hint" style={{ margin: 0 }}>{t('wrongSub', { v: cell.value })}</p>
        <span className="label">{t('whyWrong')}</span>
        <div className="chips">
          {INVALID_REASONS.map((r) => <button key={r} className={'chip' + (reason === r ? ' on' : '')} aria-pressed={reason === r} onClick={() => setReason(reason === r ? null : r)}>{t('reason_' + r)}</button>)}
        </div>
        <input className="input" dir="auto" maxLength={300} value={note} placeholder={t('wrongNote')} aria-label={t('wrongNote')} onChange={(e) => setNote(e.target.value)} />
        <div className={'card refundbox' + (refunding ? ' on' : '')}>
          {refunding ? <>
            <b>{t('willRefund')}</b>
            <ul>{plan.refunds.map((r, i) => { const tm = teamById(g, r.team); return <li key={i} style={tStyle(tm)}><span className="dot" /> <span dir="auto">{t('refundLine', { team: teamName(tm), d: fmtDelta(r.delta) })}</span> <span className="muted num">({tm.score} → {tm.score + r.delta})</span></li>; })}</ul>
          </> : <span>{t('noRefund')}</span>}
        </div>
        {plan.same ? (
          <p className="repline">🔁 {t('repSame', { v: cell.value, cat: cell.cat === MIX_ID ? catName(g, null, MIX_ID) : catName(g, ctx().bank, realCat) })} {isCur ? t('repSameNow') : t('repSameBoard')}</p>
        ) : (
          <div className="stack-sm" role="radiogroup">
            <p className="warn" style={{ margin: 0 }}>{t('repNone', { cat: catName(g, ctx().bank, realCat), v: cell.value })}</p>
            {choices.map((c, i) => (
              <button key={i} role="radio" aria-checked={choice === i} className={'optrow' + (choice === i ? ' on' : '')} onClick={() => setChoice(i)}>
                <span className="radio" aria-hidden="true" />
                <span className="grow">{c === 'empty' ? <>{t('repEmpty')}{isCur ? <small className="muted"> · {t('repEmptyNow')}</small> : null}</> : t(c.how === 'related' ? 'repRelated' : 'repBoard', { v: cell.value, cat: catName(g, ctx().bank, c.q.cat) })}</span>
              </button>
            ))}
          </div>
        )}
        <div className="row">
          <button className="btn btn-ghost grow" onClick={onClose}>{t('cancel')}</button>
          <button className="btn btn-flag solid grow" disabled={busy} onClick={go}>{yes}</button>
        </div>
      </div>
    </Sheet>
  );
}

// Choose an already-played question to flag (from the menu or the results screen).
function PlayedList({ g, onPick, onClose }) {
  // Most recently played first.
  const order = {}; g.log.forEach((e, i) => { if (e.cell && !e.void && e.kind !== 'invalid') order[e.cell] = i; });
  const played = g.cells.filter((c) => c.status === 'done' && c.q && !isInvalidated(g, c.q.id)).sort((a, b) => (order[b.id] || 0) - (order[a.id] || 0));
  return (
    <Sheet onClose={onClose}>
      <div className="stack-sm">
        <h2 className="display" style={{ fontSize: 28 }}>⚠ {t('flagPlayed')}</h2>
        <p className="hint" style={{ margin: 0 }}>{t('flagPlayedSub')}</p>
        {!played.length && <p className="hint center">{t('noPlayed')}</p>}
        {played.map((c) => {
          const tm = c.result && c.result.team ? teamById(g, c.result.team) : null;
          return (
            <button key={c.id} className="optrow played" onClick={() => onPick(c.id)}>
              <span className="pl-v num">{c.value}</span>
              <span className="grow"><span className="small muted">{catName(g, null, c.cat)}{tm ? ' · ' + teamName(tm) : ''}</span><Txt v={c.q.q} as="span" className="pl-q" /></span>
            </button>
          );
        })}
        <button className="btn btn-ghost" onClick={onClose}>{t('close')}</button>
      </div>
    </Sheet>
  );
}

/* ---------- the device's reported-questions list (kept apart from games) ---------- */
const ISSUES_MAX = 500;
function issueEntry(g, info) {
  const c = info.cell; const q = c.q;
  return { id: uid(), at: info.rec.now, gameId: g.id, qid: q.id, cat: q.cat, tier: c.tier, value: c.value, type: q.type || 'text',
    q: q.q, a: q.a, ref: q.ref || null, pack: q.pack || null, reason: info.rec.reason, note: info.rec.note || '',
    refunds: info.refunds, replacement: info.replacement && info.replacement !== 'empty' ? info.replacement.q.id : null };
}
function addIssue(list, entry) {
  if ((list || []).some((x) => x.gameId === entry.gameId && x.qid === entry.qid)) return list; // once per game
  return [entry, ...(list || [])].slice(0, ISSUES_MAX);
}
