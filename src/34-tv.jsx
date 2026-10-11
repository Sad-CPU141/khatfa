/* ============================================================
   TV MODE (adapted from Draft Night's 34-tv.jsx)
   · On this screen: the host's device shows the big-screen view; "Back to controls" returns.
   · New window: a second window in the same browser, linked with BroadcastChannel,
     so no internet or server is needed. It only displays; this window runs the game.
   · Another device as the TV needs online rooms (Step 5).
   The TV never shows the answer until the host has marked the question.
   ============================================================ */
const TV_CHANNEL = 'khatfa-tv';
const tvUrl = () => location.origin + location.pathname + '#tv';
const canChannel = () => typeof window !== 'undefined' && 'BroadcastChannel' in window;
function goFullscreen() { try { const el = document.documentElement; if (!document.fullscreenElement && el.requestFullscreen) el.requestFullscreen().catch(() => {}); } catch (e) {} }
// What the TV needs: the game without undo history, and never the answers of unrevealed questions.
function tvGame(g) {
  if (!g) return null;
  const { history, ...rest } = g;
  const revealed = g.current && g.current.stage === 'reveal' ? g.current.cell : null;
  // Unrevealed questions travel without answer, accepted answers, hint or note.
  return { ...rest, cells: (g.cells || []).map((c) => (c.q && c.id !== revealed ? { ...c, q: { ...c.q, a: null, alt: null, note: null, hint: null, ref: null } } : c)) };
}

function TvButton({ onTv }) {
  if (!onTv) return <span className="iconspace" />;
  return <button className="iconbtn tvbtn" onClick={onTv} aria-label={t('tvMode')} title={t('tvMode')}>📺</button>;
}
function TvSheet({ onClose, onHere }) {
  const [msg, setMsg] = useState('');
  const newWindow = () => {
    if (!canChannel()) { setMsg(t('tvNoChannel')); return; }
    const w = window.open(tvUrl(), '_blank');
    if (!w) setMsg(t('tvBlocked')); else onClose();
  };
  return (
    <Sheet center onClose={onClose}>
      <h2 className="display" style={{ fontSize: 30 }}>📺 {t('tvMode')}</h2>
      <p className="hint">{t('tvIntro')}</p>
      <button className="btn btn-gold" onClick={() => { onClose(); onHere(); }}>{t('tvHere')}</button>
      <p className="hint" style={{ margin: 0 }}>{t('tvHereSub')}</p>
      <button className="btn" onClick={newWindow}>{t('tvWindow')}</button>
      <p className="hint" style={{ margin: 0 }}>{t('tvWindowSub')}</p>
      <p className="hint" style={{ margin: 0 }}>{t('tvOtherDevice')}</p>
      {msg && <p className="warn">{msg}</p>}
      <button className="btn btn-ghost" onClick={onClose}>{t('close')}</button>
    </Sheet>
  );
}
function TvExit({ onExit }) {
  useEffect(() => {
    if (!onExit) return undefined;
    const k = (e) => { if (e.key === 'Escape' && !document.fullscreenElement) onExit(); };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [onExit]);
  return (
    <div className="tvbar">
      <button className="pillbtn" onClick={goFullscreen}>⛶ {t('tvFull')}</button>
      {onExit && <button className="pillbtn" onClick={onExit}>{backArrow()} {t('tvBackToControls')}</button>}
    </div>
  );
}

// The big-screen view. Read-only: no buttons that change the game.
function TvView({ g, flash, onFlashDone, onStatus, status, preview }) {
  let body;
  if (!g) body = <div className="tv-wait"><LogoMark size={120} /><h2 className="display">{t('appName')}</h2><p className="muted">{t('tvWaiting')}</p></div>;
  else if (g.phase === 'pick') {
    const team = pickingTeam(g);
    body = <>
      <div className="tv-head"><span className="eyebrow">{t('tvPicking')}</span><div className="picker" style={tStyle(team)}><span className="pk-em">{team.emoji}</span><b className="pk-t">{t('yourPick', { team: teamName(team) })}</b><span>{t('picksLeft', { n: picksNeeded(g) - g.cats.length })}</span></div></div>
      {g.cats.length > 0 && <CategoryGrid g={g} cats={g.cats.map((c) => g.pool.find((p) => p.id === c.id) || c)} big />}
    </>;
  } else if (g.phase === 'board') {
    const team = turnTeam(g);
    body = <>
      <ScoreBar g={g} activeId={team.id} label={t('turnShort')} big />
      <p className="turnline" style={tStyle(team)}><span>{team.emoji}</span> {t('turnOf', { team: teamName(team) })}</p>
      <BoardGrid g={g} big />
    </>;
  } else if (g.phase === 'question') {
    const cell = curCell(g); const reveal = g.current.stage === 'reveal';
    body = <>
      <ScoreBar g={g} activeId={reveal ? null : g.current.team} big />
      <div className="tv-q">
        <QHead g={g} cell={cell} />
        <StageBanner g={g} />
        <Clock g={g} big />
        <QuestionCard cell={cell} big showAnswer={reveal} cur={g.current} output onStatus={onStatus} status={status} />
        {reveal && <ResultBanner g={g} />}
      </div>
    </>;
  } else {
    const sorted = [...g.teams].sort((a, b) => b.score - a.score);
    body = <>
      <Winner g={g} big />
      <ScoreBar g={{ ...g, teams: sorted }} big />
      <Moments g={g} />
    </>;
  }
  if (preview) body = <div className="tv-q"><span className="eyebrow">{t('previewOnTv')}</span><QuestionCard cell={{ q: preview.q }} big cur={preview.cur} output onStatus={onStatus} status={status} /></div>;
  return (
    <div className="tvmode">
      <div className="tvwrap">{body}</div>
      {flash && <Flash f={flash} g={g} onDone={onFlashDone} />}
    </div>
  );
}

// The second window: listens to the host window in this browser.
const TV_ID = uid();
const soundAllowed = () => { try { return !navigator.userActivation || navigator.userActivation.hasBeenActive; } catch (e) { return true; } };
function LocalTv() {
  const [g, setG] = useState(null); const [flash, setFlash] = useState(null); const [, setL] = useState(0);
  const [preview, setPreview] = useState(null); const [status, setStatus] = useState(null);
  const [unlocked, setUnlocked] = useState(soundAllowed());
  const chRef = useRef(null);
  useEffect(() => {
    if (!canChannel()) return undefined;
    const ch = new BroadcastChannel(TV_CHANNEL); chRef.current = ch;
    ch.onmessage = (e) => {
      const m = e.data || {};
      if (m.type === 'game') setG(m.game);
      else if (m.type === 'flash') setFlash(m.info);
      else if (m.type === 'preview') setPreview(m.preview || null);
      else if (m.type === 'host-hello') ch.postMessage({ type: 'hello', tv: TV_ID, sound: soundAllowed() });
      else if (m.type === 'lang') { setLang(m.lang); applyDocLang(m.lang); setL((x) => x + 1); }
    };
    ch.postMessage({ type: 'hello', tv: TV_ID });
    const ping = setInterval(() => { try { ch.postMessage({ type: 'ping', tv: TV_ID, sound: soundAllowed() }); } catch (e) {} }, 2500);
    const bye = () => { try { ch.postMessage({ type: 'bye', tv: TV_ID }); } catch (e) {} };
    window.addEventListener('beforeunload', bye);
    return () => { clearInterval(ping); bye(); window.removeEventListener('beforeunload', bye); ch.close(); };
  }, []);
  const onStatus = (s) => { setStatus(s); try { chRef.current && chRef.current.postMessage({ type: 'media-status', tv: TV_ID, status: s }); } catch (e) {} };
  if (!canChannel()) return <div className="app"><div className="card stack"><p className="hint" style={{ margin: 0 }}>{t('tvNoChannel')}</p></div></div>;
  const needsClick = !unlocked || (status && status.s === 'blocked');
  return <>
    <TvView g={g} flash={flash} onFlashDone={() => setFlash(null)} onStatus={onStatus} status={status} preview={preview} />
    {needsClick && <button className="soundunlock" onClick={() => { setUnlocked(true); if (status && status.s === 'blocked') setStatus(null); try { chRef.current.postMessage({ type: 'ping', tv: TV_ID, sound: true }); chRef.current.postMessage({ type: 'media-status', tv: TV_ID, status: { s: 'ready' } }); } catch (e) {} }}>🔊 {t('tvAllowSound')}</button>}
    <TvExit />
  </>;
}

// Host side: keeps any TV windows in sync, and knows whether one is open (so sound
// and clips play there instead of here). Returns { send(flash), sendPreview, tv: { open, sound }, status }.
function useTvSender(game, settings, preview) {
  const ch = useRef(null);
  const latest = useRef({ game, settings, preview });
  latest.current = { game, settings, preview };
  const [tvs, setTvs] = useState({}); // id → { seen, sound }
  const [status, setStatus] = useState(null);
  useEffect(() => {
    if (!canChannel()) return undefined;
    const c = new BroadcastChannel(TV_CHANNEL); ch.current = c;
    c.onmessage = (e) => {
      const m = e.data || {};
      if (m.type === 'hello') {
        c.postMessage({ type: 'lang', lang: latest.current.settings.lang });
        c.postMessage({ type: 'game', game: tvGame(latest.current.game) });
        if (latest.current.preview) c.postMessage({ type: 'preview', preview: latest.current.preview });
      }
      if ((m.type === 'hello' || m.type === 'ping') && m.tv) setTvs((x) => ({ ...x, [m.tv]: { seen: Date.now(), sound: m.sound !== false } }));
      if (m.type === 'bye' && m.tv) setTvs((x) => { const n = { ...x }; delete n[m.tv]; return n; });
      if (m.type === 'media-status') setStatus(m.status || null);
    };
    c.postMessage({ type: 'host-hello' }); // any TV window already open answers with "hello"
    const sweep = setInterval(() => setTvs((x) => { const now = Date.now(); const n = {}; let ch2 = false; Object.keys(x).forEach((k) => { if (now - x[k].seen < 8000) n[k] = x[k]; else ch2 = true; }); return ch2 ? n : x; }), 3000);
    return () => { clearInterval(sweep); c.close(); ch.current = null; };
  }, []);
  useEffect(() => { if (ch.current) ch.current.postMessage({ type: 'game', game: tvGame(game) }); }, [game]);
  useEffect(() => { if (ch.current) ch.current.postMessage({ type: 'lang', lang: settings.lang }); }, [settings.lang]);
  useEffect(() => { if (ch.current) ch.current.postMessage({ type: 'preview', preview: preview || null }); }, [preview]);
  const list = Object.values(tvs);
  return { send: (info) => { if (ch.current) ch.current.postMessage({ type: 'flash', info }); }, tv: { open: list.length > 0, sound: list.some((x) => x.sound) }, status, setStatus };
}
