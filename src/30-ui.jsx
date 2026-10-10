/* ============================================================
   SHARED UI (same building blocks as Draft Night) + home, setup, how to play
   ============================================================ */
class Boundary extends React.Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  componentDidCatch(err) { try { console.error(err); } catch (e) {} }
  render() {
    if (!this.state.err) return this.props.children;
    return (
      <div className="app"><div className="card stack">
        <h2 className="display">{t('crashed')}</h2>
        <p className="muted" style={{ margin: 0 }}>{t('crashedSub')}</p>
        <button className="btn btn-gold" onClick={() => location.reload()}>{t('reload')}</button>
        <pre className="errtxt">{String(this.state.err && (this.state.err.message || this.state.err))}</pre>
      </div></div>
    );
  }
}

function Sheet({ onClose, children, center }) {
  useEffect(() => { const k = (e) => { if (e.key === 'Escape') onClose(); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [onClose]);
  return (
    <div className={'backdrop' + (center ? ' center' : '')} onClick={onClose}>
      <div className={center ? 'modal' : 'sheet'} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        {!center && <div className="grab" />}
        {children}
      </div>
    </div>
  );
}
function Confirm({ title, body, yes, danger, onYes, onClose }) {
  return (
    <Sheet center onClose={onClose}>
      <h2 className="display" style={{ fontSize: 30 }}>{title}</h2>
      {body && <p className="muted" style={{ margin: 0 }}>{body}</p>}
      <div className="row">
        <button className="btn btn-ghost grow" onClick={onClose}>{t('cancel')}</button>
        <button className={'btn grow ' + (danger ? 'btn-danger solid' : 'btn-gold')} onClick={() => { onYes(); onClose(); }}>{yes || t('confirm')}</button>
      </div>
    </Sheet>
  );
}
// The back arrow points the reading direction's "back" (→ in Arabic).
const backArrow = () => (LANG === 'ar' ? '→' : '←');
function TopBar({ onBack, left, title, right, dense }) {
  return (
    <div className={'topbar' + (dense ? ' dense' : '')}>
      {left || (onBack ? <button className="iconbtn" onClick={onBack} aria-label={t('back')}>{backArrow()}</button> : <span className="iconspace" />)}
      <div className="title">{title}</div>
      {right || <span className="iconspace" />}
    </div>
  );
}
const MenuBtn = ({ onClick }) => <button className="iconbtn" onClick={onClick} aria-label={t('menu')}>☰</button>;
function Seg({ value, options, onChange, label }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map(([v, l]) => <button key={String(v)} type="button" aria-pressed={value === v} onClick={() => onChange(v)}>{l}</button>)}
    </div>
  );
}
function Toggle({ on, onChange, title, sub }) {
  return (
    <button type="button" className="toggle" aria-pressed={on} onClick={() => onChange(!on)}>
      <span className="grow"><b className="tgl-t">{title}</b>{sub && <span className="small muted">{sub}</span>}</span>
      <span className="sw" />
    </button>
  );
}
function Toast({ msg, ok, onClose }) {
  useEffect(() => { if (!ok) return undefined; const id = setTimeout(onClose, 3500); return () => clearTimeout(id); }, [msg, ok]);
  return <div className={'toast' + (ok ? ' ok' : '')} role="status"><span className="grow">{msg}</span><button onClick={onClose}>{t('dismiss')}</button></div>;
}
function LangButton({ settings, setSettings }) {
  return <button className="pillbtn langbtn" onClick={() => setSettings({ ...settings, lang: settings.lang === 'ar' ? 'en' : 'ar' })} aria-label={t('langSwitchLabel')} lang={LANG === 'ar' ? 'en' : 'ar'}>{t('langSwitch')}</button>;
}

/* ---------- bilingual content ---------- */
const QLangCtx = React.createContext('auto');
// Shows { ar, en } content. "both" shows the other language underneath when it exists.
function Txt({ v, as = 'span', className, both }) {
  const qLang = React.useContext(QLangCtx);
  const Tag = as;
  const main = pick(v, LANG);
  const other = LANG === 'ar' ? 'en' : 'ar';
  const showOther = (both || qLang === 'both') && v && typeof v === 'object' && v[other] && v[other].trim() && v[other].trim() !== main;
  return (
    <Tag className={className}>
      <span dir="auto" lang={looksArabic(main) ? 'ar' : 'en'}>{main}</span>
      {showOther && <span className="alt" dir="auto" lang={other}>{v[other].trim()}</span>}
    </Tag>
  );
}
const Name = ({ team }) => <bdi dir="auto">{teamName(team)}</bdi>;

/* ---------- scores ---------- */
// Counts up to the new score so changes are easy to follow.
function AnimatedNumber({ value }) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    if (shown === value) return undefined;
    if (reducedMotion()) { setShown(value); from.current = value; return undefined; }
    const start = performance.now(); const a = from.current; const dur = 700;
    let raf;
    const step = (now) => {
      const k = Math.min(1, (now - start) / dur); const e = 1 - Math.pow(1 - k, 3);
      const v = Math.round(a + (value - a) * e); setShown(v);
      if (k < 1) raf = requestAnimationFrame(step); else from.current = value;
    };
    raf = requestAnimationFrame(step);
    return () => { cancelAnimationFrame(raf); from.current = value; };
  }, [value]);
  return <span className="num">{shown}</span>;
}
// Floating "+400" when a team's score changes.
function useDelta(value) {
  const prev = useRef(value); const [d, setD] = useState(null);
  useEffect(() => {
    if (value !== prev.current) { setD({ n: value - prev.current, k: Date.now() }); prev.current = value; }
  }, [value]);
  useEffect(() => { if (!d) return undefined; const id = setTimeout(() => setD(null), 1600); return () => clearTimeout(id); }, [d]);
  return d;
}
function ScoreCard({ team, active, label, big }) {
  const d = useDelta(team.score);
  return (
    <div className={'scard' + (active ? ' active' : '') + (big ? ' big' : '')} style={tStyle(team)}>
      <span className="s-em" aria-hidden="true">{team.emoji}</span>
      <span className="s-name"><Name team={team} /></span>
      <span className="s-score"><AnimatedNumber value={team.score} /></span>
      {active && label && <span className="s-turn">{label}</span>}
      {d && <span key={d.k} dir="ltr" className={'s-delta' + (d.n < 0 ? ' neg' : '')}>{d.n > 0 ? '+' : '−'}{Math.abs(d.n)}</span>}
    </div>
  );
}
function ScoreBar({ g, activeId, label, big }) {
  return (
    <div className={'scorebar n' + g.teams.length + (big ? ' big' : '')}>
      {g.teams.map((tm) => <ScoreCard key={tm.id} team={tm} active={tm.id === activeId} label={label} big={big} />)}
    </div>
  );
}

/* ---------- flash: correct / wrong / khatfa ---------- */
function Flash({ f, g, onDone }) {
  useEffect(() => { const id = setTimeout(onDone, ms(f.kind === 'stolen' ? 1700 : 1300)); return () => clearTimeout(id); }, [f]);
  const team = f.team && g ? teamById(g, f.team) : null;
  const big = { correct: t('flashCorrect'), stolen: t('flashSteal'), wrong: t('flashWrong'), missed: t('flashMissed'), timeup: t('timeUp') }[f.kind];
  return (
    <div className={'flash k-' + f.kind} onClick={onDone} role="status" aria-live="assertive" style={team ? tStyle(team) : undefined}>
      <div className="inner">
        <div className="big">{big}</div>
        {team && f.points > 0 && <div className="to">{t('pointsTo', { n: f.points, team: teamName(team) })}</div>}
        {team && f.points < 0 && <div className="to">{t('lostPoints', { n: -f.points, team: teamName(team) })}</div>}
      </div>
    </div>
  );
}

/* ---------- logo ---------- */
function LogoMark({ size = 64 }) {
  // A 3×2 board of tiles with one tile snatched away (the "khatfa").
  return (
    <svg className="logomark" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect x="2" y="2" width="60" height="60" rx="14" fill="#221d47" stroke="#3d3672" strokeWidth="2" />
      {[[10, 14], [26, 14], [10, 34], [26, 34], [42, 34]].map(([x, y], i) => <rect key={i} x={x} y={y} width="13" height="16" rx="3" fill="#ffc83d" />)}
      <g transform="rotate(-18 50 18)"><rect x="43" y="8" width="13" height="16" rx="3" fill="#22cfd6" /></g>
      <path d="M41 30 L47 22" stroke="#22cfd6" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/* ============================================================
   HOME
   ============================================================ */
function Home({ game, past, settings, setSettings, onNew, onContinue, onHow, onSettings }) {
  const p = usePwa();
  const live = game && game.phase !== 'done' ? game : null;
  const left = live ? openCells(live).length : 0;
  return (
    <div className="app">
      <div className="topbar">
        <LangButton settings={settings} setSettings={setSettings} />
        <div className="title" />
        <button className="iconbtn" onClick={onSettings} aria-label={t('settings')}>⚙️</button>
      </div>
      <div className="hero">
        <span className="tag"><i />{t('gameNight')}</span>
        <LogoMark size={84} />
        <h1 className="logo"><span className="ar" lang="ar">خطفة</span><span className="en" lang="en">KHATFA</span></h1>
        <p className="muted tagline">{t('tagline')}</p>
      </div>
      {p.updateReady && <div className="card row update"><span className="grow">{t('updateReady')}</span><button className="btn btn-sm btn-gold" onClick={() => p.applyUpdate()}>{t('reload')}</button></div>}
      <div className="menu">
        {live && (
          <button className="card resume rowbtn" onClick={onContinue}>
            <span className="r-em">▶️</span>
            <span className="grow">
              <b className="r-t">{t('continueGame')}</b>
              <span className="small muted r-s">{live.phase === 'pick' ? t('resumePick', { a: teamName(live.teams[0]), b: teamName(live.teams[1]) }) : t('resumeSub', { a: teamName(live.teams[0]), b: teamName(live.teams[1]), n: left })}</span>
            </span>
          </button>
        )}
        <button className="btn btn-gold" onClick={onNew}>{t('newGame')}</button>
        <div className="row">
          <button className="btn grow" onClick={onHow}>{t('howToPlay')}</button>
          <button className="btn grow" onClick={onSettings}>{t('settings')}</button>
        </div>
        {p.canPrompt && <button className="btn btn-ghost" onClick={() => p.prompt()}>📲 {t('install')}</button>}
      </div>
      <p className="hint center">{t('bankNote', { q: BANK.total, c: BANK.cats.length })}</p>
      {past.length > 0 && (
        <section className="stack-sm">
          <span className="eyebrow">{t('pastGames')}</span>
          {past.slice(0, 5).map((g) => {
            const w = winners(g);
            return (
              <div key={g.id} className="pastrow">
                <span className="grow">{g.teams.map((tm, i) => <span key={tm.id}>{i ? ' · ' : ''}{tm.emoji} <Name team={tm} /> <b className="num">{tm.score}</b></span>)}</span>
                <span className="small muted">{w.length ? <>{w[0].emoji} {t('won')}</> : t('draw')}</span>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}

/* ============================================================
   HOW TO PLAY
   ============================================================ */
function HowTo({ onClose }) {
  const lines = LANG === 'ar' ? S.howBody[1] : S.howBody[0];
  return (
    <Sheet onClose={onClose}>
      <div className="stack">
        <h2 className="display">{t('howToPlay')}</h2>
        <ol className="howlist">{lines.map((l, i) => <li key={i}>{l}</li>)}</ol>
        <button className="btn btn-gold" onClick={onClose}>{t('close')}</button>
      </div>
    </Sheet>
  );
}

/* ============================================================
   SETUP: teams + house rules
   ============================================================ */
const freshTeams = () => [
  { name: t('defaultTeam1'), color: COLORS[0], emoji: EMOJIS[0] },
  { name: t('defaultTeam2'), color: COLORS[1], emoji: EMOJIS[1] },
];
function TeamEditor({ team, i, onChange, others }) {
  const used = new Set(others.map((o) => o.color));
  return (
    <div className="teamedit" style={tStyle(team)}>
      <div className="row">
        <button className="emo" aria-label={t('changeEmoji')} onClick={() => onChange({ ...team, emoji: EMOJIS[(EMOJIS.indexOf(team.emoji) + 1) % EMOJIS.length] })}>{team.emoji}</button>
        <input className="input grow" dir="auto" maxLength={18} value={team.name} aria-label={t('teamN', { n: i + 1 })} placeholder={t('teamN', { n: i + 1 })} onChange={(e) => onChange({ ...team, name: e.target.value })} />
      </div>
      <div className="chips swatches" role="group" aria-label={t('colour')}>
        {COLORS.map((c) => <button key={c} className={'swatch' + (team.color === c ? ' on' : '')} disabled={used.has(c)} style={{ background: c }} aria-label={t('colour') + ' ' + c} aria-pressed={team.color === c} onClick={() => onChange({ ...team, color: c })} />)}
      </div>
    </div>
  );
}
function Section({ icon, title, sub, children, startOpen }) {
  const [open, setOpen] = useState(!!startOpen);
  return (
    <section className="rsec">
      <button className="rtitle" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="re">{icon}</span>
        <span className="grow"><b>{title}</b>{sub && <span className="small muted rsum">{sub}</span>}</span>
        <span className="chev">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="rbody stack">{children}</div>}
    </section>
  );
}
const tierLabel = (tier) => POINTS[tier - 1] + ' · ' + t(['tierEasy', 'tierHard', 'tierBrutal'][tier - 1]);
function difficultySummary(r) {
  const parts = [t('curve_' + r.curve)];
  if (r.minTier > 1 || r.maxTier < 3) parts.push(POINTS[r.minTier - 1] + '–' + POINTS[r.maxTier - 1]);
  if (r.niche) parts.push(t('nicheMode'));
  if (r.nicheOnly) parts.push(t('nicheOnly'));
  if (r.strict) parts.push(t('strictRepeats'));
  if (r.progressive) parts.push(t('progressive'));
  return parts.join(' · ');
}
function Setup({ initial, bank, onBack, onStart }) {
  const [teams, setTeams] = useState(() => (initial && initial.teams) || freshTeams());
  const [rules, setRules] = useState(() => cleanRules(initial && initial.rules));
  const [browse, setBrowse] = useState(false);
  const set = (k, v) => setRules(cleanRules({ ...rules, [k]: v }));
  const pool = useMemo(() => gamePool(bank, rules), [bank, rules]);
  const real = pool.filter((c) => c.id !== MIX_ID);
  const playable = pool.filter((c) => (c.short || [0, 0, 0]).every((n) => n === 0));
  const shortCats = real.filter((c) => c.short.some((n) => n > 0));
  const need = rules.catsPerTeam * teams.length;
  const included = bank.cats.length - rules.exclude.filter((id) => bank.byCat[id]).length;
  const qIncluded = real.reduce((n, c) => n + c.count[0] + c.count[1] + c.count[2], 0);
  const problems = [];
  if (teams.some((tm) => !tm.name.trim())) problems.push(t('needNames'));
  if (playable.length < need) problems.push(t('needCats', { have: playable.length, need }));
  return (
    <div className="app">
      <TopBar onBack={onBack} title={t('setupTitle')} />
      <section className="stack">
        <span className="eyebrow">{t('teams')}</span>
        {teams.map((tm, i) => <TeamEditor key={i} team={tm} i={i} others={teams.filter((_, j) => j !== i)} onChange={(x) => setTeams(teams.map((y, j) => (j === i ? x : y)))} />)}
      </section>
      <section className="card stack-sm">
        <span className="eyebrow">{t('categories')}</span>
        <div className="row"><span className="packem">📚</span><b className="grow">{t('catsOn', { n: included, of: bank.cats.length })}</b><span className="small muted num">{t('questionsN', { n: qIncluded })}</span></div>
        {shortCats.length > 0 && <p className="hint">⚠ {t('catsShort', { n: shortCats.length })}</p>}
        <button className="btn btn-sm" style={{ width: '100%' }} onClick={() => setBrowse(true)}>{t('chooseCats')}</button>
        <Toggle on={rules.randomCats} onChange={(v) => set('randomCats', v)} title={t('randomCats')} sub={t('randomCatsSub')} />
        <Toggle on={rules.mixed} onChange={(v) => set('mixed', v)} title={t('mixedCats')} sub={t('mixedCatsSub')} />
      </section>
      <Section icon="⚙️" title={t('houseRules')} sub={t('rulesSummary', { per: rules.perValue, cats: rules.catsPerTeam, a: rules.answerTime, s: rules.stealTime })}>
        <p className="hint">{t('valuesFixed')}</p>
        <div className="field"><span className="label">{t('perValue')}</span>
          <Seg value={rules.perValue} options={[[1, '1'], [2, '2']]} onChange={(v) => set('perValue', v)} label={t('perValue')} /></div>
        <div className="field"><span className="label">{t('catsPerTeam')}</span>
          <Seg value={rules.catsPerTeam} options={[1, 2, 3, 4].map((n) => [n, String(n)])} onChange={(v) => set('catsPerTeam', v)} label={t('catsPerTeam')} /></div>
        <div className="field"><span className="label">{t('answerTime')}</span>
          <Seg value={rules.answerTime} options={TIME_CHOICES.map((n) => [n, t('seconds', { n })])} onChange={(v) => set('answerTime', v)} label={t('answerTime')} /></div>
        <Toggle on={rules.steals} onChange={(v) => set('steals', v)} title={t('stealOn')} sub={t('stealOnSub')} />
        {rules.steals && <div className="field"><span className="label">{t('stealTime')}</span>
          <Seg value={rules.stealTime} options={STEAL_CHOICES.map((n) => [n, t('seconds', { n })])} onChange={(v) => set('stealTime', v)} label={t('stealTime')} /></div>}
      </Section>
      <Section icon="🌶️" title={t('difficulty')} sub={difficultySummary(rules)}>
        <div className="field"><span className="label">{t('curve')}</span>
          <Seg value={rules.curve} options={CURVES.map((c) => [c, t('curve_' + c)])} onChange={(v) => set('curve', v)} label={t('curve')} />
          <p className="hint">{t('curveSub_' + rules.curve)}</p></div>
        <div className="field"><span className="label">{t('minDiff')}</span>
          <Seg value={rules.minTier} options={[1, 2, 3].map((n) => [n, String(POINTS[n - 1])])} onChange={(v) => setRules(cleanRules({ ...rules, minTier: v, maxTier: Math.max(v, rules.maxTier) }))} label={t('minDiff')} /></div>
        <div className="field"><span className="label">{t('maxDiff')}</span>
          <Seg value={rules.maxTier} options={[1, 2, 3].map((n) => [n, String(POINTS[n - 1])])} onChange={(v) => setRules(cleanRules({ ...rules, maxTier: v, minTier: Math.min(v, rules.minTier) }))} label={t('maxDiff')} />
          {(rules.minTier > 1 || rules.maxTier < 3) && <p className="hint">{t('minMaxSub', { rows: rowTiers(rules).map((x) => POINTS[x - 1]).join(' / ') })}</p>}</div>
        <Toggle on={rules.niche} onChange={(v) => set('niche', v)} title={t('nicheMode')} sub={t('nicheModeSub')} />
        <Toggle on={rules.nicheOnly} onChange={(v) => set('nicheOnly', v)} title={t('nicheOnly')} sub={t('nicheOnlySub')} />
        <Toggle on={rules.strict} onChange={(v) => set('strict', v)} title={t('strictRepeats')} sub={t('strictRepeatsSub')} />
        <Toggle on={rules.progressive} onChange={(v) => set('progressive', v)} title={t('progressive')} sub={t('progressiveSub')} />
      </Section>
      <Section icon="🧩" title={t('modifiers')} sub={t('modifiersSub')}>
        <Toggle on={rules.wrongPenalty} onChange={(v) => set('wrongPenalty', v)} title={t('wrongPenalty')} sub={t('wrongPenaltySub')} />
      </Section>
      {problems.map((p) => <p key={p} className="warn">{p}</p>)}
      <button className="btn btn-gold" disabled={problems.length > 0} onClick={() => onStart(teams.map((tm) => ({ ...tm, name: tm.name.trim() })), rules)}>{rules.randomCats ? t('startGame') : t('pickCategories')}</button>
      {browse && <CategoryBrowser bank={bank} rules={rules} onChange={(exclude) => setRules(cleanRules({ ...rules, exclude }))} onClose={() => setBrowse(false)} />}
    </div>
  );
}
