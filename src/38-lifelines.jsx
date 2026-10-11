/* ============================================================
   LIFELINES UI: the host's lifeline bar, the effect badges, the Call-for-Help
   countdown, and the small "lifelines left" row on each team's score card.
   All rules live in the engine (20-engine.js); this file only shows and asks.
   ============================================================ */
const llInfo = (id) => LIFELINES.find((l) => l.id === id);
// "ضاعفها · Double It" in English, "ضاعفها" (with the English small) in Arabic.
function LlName({ id, small }) {
  const l = llInfo(id);
  return <span className="llname"><b lang="ar" dir="rtl">{l.ar}</b>{!small && <small lang="en" dir="ltr">{l.en}</small>}</span>;
}
const BLOCK_TXT = { used: 'llUsedState', active: 'llActiveState', notNow: 'llNotNow', off: 'llOff' };

// Host: the answering team's lifelines, during its answer.
function LifelineBar({ g, act, ctx, onUsed, onFail }) {
  const busy = useRef({}); // stops a double tap on the same button from firing twice
  const cur = g.current; if (!cur || cur.stage !== 'answer') return null;
  const ids = enabledLifelines(g); if (!ids.length) return null;
  const team = teamById(g, cur.team);
  const fire = (id) => {
    if (busy.current[id]) return; busy.current[id] = true; setTimeout(() => { busy.current[id] = false; }, 400);
    const before = g;
    const c = ctx ? ctx() : null;
    const next = useLifeline(before, id, { now: Date.now(), ctx: c });
    if (next === before) { onFail && onFail(id); return; }
    act(() => next);
    onUsed && onUsed(id, team);
  };
  return (
    <section className="llbar" style={tStyle(team)} aria-label={t('llOf', { team: teamName(team) })}>
      <div className="llhead"><span>{team.emoji}</span> <b>{t('llOf', { team: teamName(team) })}</b></div>
      <div className={'llbtns n' + ids.length}>
        {ids.map((id) => {
          const fx = cur.fx || {};
          const on = (id === 'double' && fx.double) || (id === 'shield' && fx.shield) || (id === 'help' && helpRunning(cur)) || (id === 'extra' && fx.extra);
          const why0 = lifelineBlock(g, id); const why = on ? 'active' : why0;
          const l = llInfo(id);
          const state = on ? 'active' : why === 'used' ? 'used' : why ? 'off' : 'ready';
          return (
            <button key={id} className={'llbtn s-' + state} disabled={!!why} onClick={() => fire(id)}
              aria-label={(state === 'ready' ? t('llUse') + ' ' : '') + l.ar + ' (' + l.en + ')' + (why ? ' · ' + t(BLOCK_TXT[why]) : '')}>
              <span className="llicon" aria-hidden="true" dir="ltr">{l.icon}</span>
              <LlName id={id} />
              <span className="llstate">{state === 'ready' ? t('llReady') : t(BLOCK_TXT[why])}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

// Badges for the effects on the open question (host and TV).
function FxBadges({ g, big }) {
  const cur = g.current; const fx = (cur && cur.fx) || {};
  const c = curCell(g); if (!c) return null;
  const items = [];
  if (fx.double) items.push(<span key="d" className="fxb fx-double"><span aria-hidden="true" dir="ltr">✖2</span> <LlName id="double" small={!big} /> <b className="num" dir="ltr">{c.value} → {c.value * 2}</b></span>);
  if (fx.shield) items.push(<span key="s" className="fxb fx-shield"><span aria-hidden="true">🛡️</span> <LlName id="shield" small={!big} /> <span>{t('llShieldOn')}</span></span>);
  if (fx.extra) items.push(<span key="e" className="fxb fx-extra"><span aria-hidden="true">⏱️</span> <LlName id="extra" small={!big} /> <b className="num" dir="ltr">+{30 * fx.extra}s</b></span>);
  if (!items.length) return null;
  return <div className={'fxbadges' + (big ? ' big' : '')} role="status">{items}</div>;
}

// The Call-for-Help countdown, from its fixed deadline (no drifting counter).
function HelpClock({ g, big, onEnd }) {
  const cur = g.current;
  const running = helpRunning(cur);
  const now = useNow(running, 200);
  if (!running || cur.stage !== 'answer') return null;
  const h = cur.fx.help;
  const left = Math.max(0, h.endsAt - now);
  const secs = Math.ceil(left / ms(1000));
  const total = Math.max(1, h.endsAt - (h.start || h.endsAt - ms(HELP_SECONDS * 1000)));
  return (
    <div className={'helpclock' + (big ? ' big' : '') + (secs <= 5 ? ' hot' : '')} role="timer" aria-live="off">
      <div className="hc-row">
        <span className="hc-n num">{secs}</span>
        <div className="hc-top"><span className="hc-ic" aria-hidden="true">📞</span><LlName id="help" small={!big} /><span className="hc-msg">{t('llHelpAllowed')}</span></div>
      </div>
      <span className="ck-bar"><i style={{ width: Math.min(100, (left / total) * 100) + '%' }} /></span>
      {onEnd && <button className="btn btn-sm btn-ghost" onClick={onEnd}>{t('llHelpDone')}</button>}
    </div>
  );
}

// Small row of lifeline icons for a team (used ones crossed out). Shown on score cards.
function LlDots({ g, team }) {
  const ids = enabledLifelines(g); if (!ids.length || !g.ll) return null;
  return (
    <span className="lldots" aria-label={t('llLeft', { n: ids.filter((id) => !lifelineUsed(g, team.id, id)).length })}>
      {ids.map((id) => <i key={id} dir="ltr" className={lifelineUsed(g, team.id, id) ? 'used' : ''} title={llInfo(id).ar + ' · ' + llInfo(id).en + (lifelineUsed(g, team.id, id) ? ' (' + t('llUsedState') + ')' : '')}>{llInfo(id).icon}</i>)}
    </span>
  );
}
