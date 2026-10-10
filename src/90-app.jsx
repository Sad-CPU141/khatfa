/* ============================================================
   APP: state, screens, saving, TV sync.
   ============================================================ */
const DEFAULT_SETTINGS = { lang: 'ar', qLang: 'auto', motion: 'system', tvZoom: 1, rules: null, lastTeams: null };
function applyDocLang(lang) {
  const el = document.documentElement;
  el.setAttribute('lang', lang === 'en' ? 'en' : 'ar');
  el.setAttribute('dir', lang === 'en' ? 'ltr' : 'rtl');
}
const findPack = (id) => PACKS().find((p) => p.id === id) || PACKS()[0];

function App() {
  const [ready, setReady] = useState(false);
  const [settings, setSettingsRaw] = useState(DEFAULT_SETTINGS);
  const [game, setGameRaw] = useState(null);
  const [past, setPast] = useState([]);
  const [screen, setScreen] = useState('home');
  const [flash, setFlash] = useState(null);
  const [sheet, setSheet] = useState(null); // 'menu' | 'tv' | 'how'
  const [tvHere, setTvHere] = useState(false);
  const [toast, setToast] = useState(null);
  const tvRoute = typeof location !== 'undefined' && /^#tv\b/.test(location.hash);

  useEffect(() => {
    store.onError = (key) => setToast({ text: t(key) });
    store.init().then(() => {
      const s = { ...DEFAULT_SETTINGS, ...store.get(K.settings, {}) };
      setLang(s.lang); setSettingsRaw(s);
      const cur = store.get(K.current, null);
      if (cur && Array.isArray(cur.teams)) setGameRaw(cur);
      setPast(store.get(K.past, []));
      setReady(true);
    });
  }, []);
  useEffect(() => {
    setLang(settings.lang); applyDocLang(settings.lang);
    document.documentElement.setAttribute('data-motion', settings.motion || 'system');
    document.documentElement.style.setProperty('--tvzoom', String(settings.tvZoom || 1));
  }, [settings.lang, settings.motion, settings.tvZoom]);

  const setSettings = (s) => { setLang(s.lang); setSettingsRaw(s); store.set(K.settings, s); };
  // Every game change: save it, and archive finished games (one entry per game id).
  const setGame = (next) => {
    setGameRaw((prev) => {
      const g = typeof next === 'function' ? next(prev) : next;
      if (g) store.set(K.current, g); else store.del(K.current);
      if (g && g.phase === 'done' && (!prev || prev.phase !== 'done' || prev.id !== g.id)) {
        setPast((p) => { const list = [pastEntry(g), ...p.filter((x) => x.id !== g.id)].slice(0, 30); store.set(K.past, list); return list; });
      }
      return g;
    });
  };
  const act = (fn) => setGame((g) => (g ? fn(g) : g));
  const sendTv = useTvSender(game, settings);
  const doFlash = (info) => { setFlash(info); sendTv(info); };

  if (tvRoute) return <QLangCtx.Provider value={settings.qLang}>{ready ? <LocalTv /> : null}</QLangCtx.Provider>;
  if (!ready) return <div className="boot"><div>خطفة<small>KHATFA</small></div></div>;

  const startNew = (pack, teams, rules) => {
    setSettings({ ...settings, rules, lastTeams: teams });
    setGame(createGame(pack, teams, rules, Date.now()));
    setScreen('game');
  };
  const goHome = () => { setTvHere(false); setScreen('home'); };
  const playAgain = () => { setGame(rematch(game, findPack(game.pack && game.pack.id), Date.now())); setScreen('game'); };
  const restore = (d) => {
    const s = { ...DEFAULT_SETTINGS, ...(d.settings || {}) };
    setSettings(s); setGame(d.current || null); setPast(d.past || []); store.set(K.past, d.past || []); store.set(K.packs, d.packs || []);
  };
  const clearAll = () => {
    Object.values(K).forEach((k) => store.del(k));
    setSettingsRaw(DEFAULT_SETTINGS); setLang(DEFAULT_SETTINGS.lang); setGameRaw(null); setPast([]); setScreen('home');
  };

  let view;
  if (screen === 'settings') view = <SettingsScreen settings={settings} setSettings={setSettings} state={{ settings, game, past, packs: store.get(K.packs, []) }} onRestore={restore} onClearAll={clearAll} onBack={() => setScreen('home')} />;
  else if (screen === 'setup') view = <Setup initial={{ teams: settings.lastTeams, rules: settings.rules }} onBack={() => setScreen('home')} onStart={startNew} />;
  else if (screen === 'game' && game) {
    const common = { g: game, act, onMenu: () => setSheet('menu'), onTv: () => setSheet('tv') };
    if (tvHere) view = <><TvView g={game} flash={flash} onFlashDone={() => setFlash(null)} /><TvExit onExit={() => setTvHere(false)} /></>;
    else if (game.phase === 'pick') view = <CategoryPick {...common} />;
    else if (game.phase === 'board') view = <Board {...common} />;
    else if (game.phase === 'question') view = <QuestionScreen {...common} flash={doFlash} />;
    else view = <Results g={game} act={act} onHome={goHome} onAgain={playAgain} />;
  } else view = <Home game={game} past={past} settings={settings} setSettings={setSettings} onNew={() => setScreen('setup')} onContinue={() => setScreen('game')} onHow={() => setSheet('how')} onSettings={() => setScreen('settings')} />;

  return (
    <QLangCtx.Provider value={settings.qLang}>
      <div key={settings.lang} className="langroot">
        {view}
        {flash && !tvHere && screen === 'game' && <Flash f={flash} g={game} onDone={() => setFlash(null)} />}
        {sheet === 'menu' && game && <GameMenu g={game} act={act} onClose={() => setSheet(null)} onHome={goHome} />}
        {sheet === 'tv' && <TvSheet onClose={() => setSheet(null)} onHere={() => setTvHere(true)} />}
        {sheet === 'how' && <HowTo onClose={() => setSheet(null)} />}
        {toast && <Toast msg={toast.text} onClose={() => setToast(null)} />}
      </div>
    </QLangCtx.Provider>
  );
}

if (window.__KH_TEST__) window.__KH = { store, K, SAMPLE_PACK, DEFAULT_RULES, cleanRules, createGame, pickCategory, randomPick, buildBoard, openCell, markCorrect, markWrong, skipQuestion, putBack, finishQuestion, endGame, adjustScore, undo, undoLabel, winners, gameStats, rematch, pastEntry, timeLeft, pauseTimer, resumeTimer, turnTeam, pickingTeam, openCells, isBoardDone, tvGame, makeBackup, validateBackup, t, setLang, pick, S };
ReactDOM.createRoot(document.getElementById('root')).render(<Boundary><App /></Boundary>);
