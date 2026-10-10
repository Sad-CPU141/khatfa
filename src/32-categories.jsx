/* ============================================================
   CATEGORIES: the host's browser (include / exclude, search, counts)
   and the searchable picker used during the game.
   ============================================================ */
const normSearch = (s) => String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ًͯ-ْ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي');
function catMatches(c, q, bank) {
  if (!q) return true;
  const g = bank && bank.groups.find((x) => x.id === c.group);
  const subs = c.subs ? Object.values(c.subs) : [];
  const hay = [c.name.en, c.name.ar, g && g.name.en, g && g.name.ar, ...subs.map((s) => s.en + ' ' + s.ar)].map(normSearch).join(' | ');
  return normSearch(q).split(/\s+/).filter(Boolean).every((w) => hay.includes(w));
}
function TierCounts({ count, short }) {
  if (!count) return null;
  return (
    <span className="tiercounts num" dir="ltr">
      {count.map((n, i) => <span key={i} className={'tc t' + (i + 1) + (short && short[i] > 0 ? ' short' : '')} title={POINTS[i] + ': ' + n}>{n}</span>)}
    </span>
  );
}

const BIG_BANK = 30;
const catTotal = (bank, id) => (bank.byCat[id] || []).length;
function CatBadges({ c, total }) {
  return <>{c.popular ? <span className="cbadge pop">★ {t('popular')}</span> : null}{c.nicheTopic ? <span className="cbadge niche">🌶️ {t('nicheTopics')}</span> : null}{total >= BIG_BANK ? <span className="cbadge big">📚 {t('bigBank')}</span> : null}</>;
}
function FilterChips({ value, onChange, groups }) {
  return (
    <div className="fchips" role="tablist">
      <button className={'fchip' + (value === 'all' ? ' on' : '')} role="tab" aria-selected={value === 'all'} onClick={() => onChange('all')}>{t('all')}</button>
      <button className={'fchip' + (value === 'popular' ? ' on' : '')} role="tab" aria-selected={value === 'popular'} onClick={() => onChange('popular')}>★ {t('popular')}</button>
      <button className={'fchip' + (value === 'niche' ? ' on' : '')} role="tab" aria-selected={value === 'niche'} onClick={() => onChange('niche')}>🌶️ {t('nicheTopics')}</button>
      {groups.map((x) => <button key={x.id} className={'fchip' + (value === x.id ? ' on' : '')} role="tab" aria-selected={value === x.id} onClick={() => onChange(x.id)}>{x.emoji} <Txt v={x.name} /></button>)}
    </div>
  );
}
const filterMatch = (c, f) => f === 'all' || (f === 'popular' && c.popular) || (f === 'niche' && c.nicheTopic) || c.group === f;
function CategoryBrowser({ bank, rules, onChange, onClose }) {
  const [q, setQ] = useState('');
  const [flt, setFlt] = useState('all');
  const [open, setOpen] = useState({});
  const [subsOpen, setSubsOpen] = useState(null);
  const off = new Set(rules.exclude);
  const toggle = (id) => { const n = new Set(off); if (n.has(id)) n.delete(id); else n.add(id); onChange([...n]); };
  const setMany = (ids, on) => { const n = new Set(off); ids.forEach((id) => (on ? n.delete(id) : n.add(id))); onChange([...n]); };
  const searching = q.trim().length > 0;
  const visible = bank.cats.filter((c) => filterMatch(c, flt) && catMatches(c, q, bank)).map((c) => c.id);
  return (
    <Sheet onClose={onClose}>
      <div className="stack catbrowser">
        <div className="row"><h2 className="display grow">{t('chooseCats')}</h2><button className="btn btn-sm btn-gold" onClick={onClose}>{t('done')}</button></div>
        <input className="input" type="search" dir="auto" value={q} placeholder={t('searchCats')} aria-label={t('searchCats')} onChange={(e) => setQ(e.target.value)} />
        <div className="row">
          <button className="btn btn-sm grow" onClick={() => setMany(visible, true)}>{t(searching || flt !== 'all' ? 'shownOn' : 'allOn')}</button>
          <button className="btn btn-sm btn-ghost grow" onClick={() => setMany(visible, false)}>{t(searching || flt !== 'all' ? 'shownOff' : 'allOff')}</button>
        </div>
        <FilterChips value={flt} onChange={setFlt} groups={bank.groups} />
        <p className="hint">{t('countsKey')}</p>
        {bank.groups.map((g) => {
          const cats = bank.cats.filter((c) => c.group === g.id && filterMatch(c, flt) && catMatches(c, q, bank));
          if (!cats.length) return null;
          const onN = cats.filter((c) => !off.has(c.id)).length;
          const expanded = searching || flt !== 'all' || open[g.id];
          return (
            <section key={g.id} className="cgroup">
              <div className="cg-head">
                <button className="cg-title" aria-expanded={!!expanded} onClick={() => setOpen({ ...open, [g.id]: !open[g.id] })}>
                  <span className="cg-em">{g.emoji}</span><b className="grow"><Txt v={g.name} /></b><span className="small muted num">{onN}/{cats.length}</span><span className="chev">{expanded ? '▲' : '▼'}</span>
                </button>
                <button className="mini-sw" role="switch" aria-checked={onN === cats.length} aria-label={t('allInGroup', { g: pick(g.name) })} onClick={() => setMany(cats.map((c) => c.id), onN !== cats.length)}><span /></button>
              </div>
              {expanded && (
                <div className="stack-sm cg-body">
                  {cats.map((c) => {
                    const qs = bank.byCat[c.id] || [];
                    const count = tierCounts(qs); const short = categoryShortfall(qs, rules);
                    const subs = Object.keys(c.subs || {});
                    return (
                      <div key={c.id} className={'crow' + (off.has(c.id) ? ' off' : '')}>
                        <button className="crow-main" role="switch" aria-checked={!off.has(c.id)} onClick={() => toggle(c.id)}>
                          <span className="cr-em">{c.emoji}</span>
                          <span className="grow cr-txt"><Txt v={c.name} className="cr-name" /><span className="cbadges"><CatBadges c={c} total={qs.length} /></span>
                            <span className="small muted">{t('questionsN', { n: qs.length })}{short.some((n) => n) ? ' · ⚠ ' + t('shortFor', { tiers: short.map((n, i) => (n ? POINTS[i] : null)).filter(Boolean).join('/') }) : ''}</span></span>
                          <TierCounts count={count} short={short} />
                          <span className={'cr-check' + (off.has(c.id) ? '' : ' on')} aria-hidden="true">{off.has(c.id) ? '' : '✓'}</span>
                        </button>
                        {subs.length > 0 && <button className="cr-subbtn" aria-expanded={subsOpen === c.id} onClick={() => setSubsOpen(subsOpen === c.id ? null : c.id)}>{t('subcats', { n: subs.length })} {subsOpen === c.id ? '▲' : '▼'}</button>}
                        {subsOpen === c.id && (
                          <ul className="sublist">{subs.map((k) => { const n = qs.filter((x) => x.sub === k); return <li key={k}><Txt v={c.subs[k]} /> <TierCounts count={tierCounts(n)} /></li>; })}</ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </Sheet>
  );
}

// In-game picker: search + group filter, so 60+ categories stay manageable on a phone.
function CategoryPicker({ g, bank, onPick }) {
  const [q, setQ] = useState('');
  const [grp, setGrp] = useState('all');
  const groups = bank.groups.filter((x) => g.pool.some((c) => c.group === x.id));
  const meta = (c) => bank.cats.find((x) => x.id === c.id) || c;
  const list = g.pool.filter((c) => (c.id === MIX_ID ? grp === 'all' : filterMatch(c, grp)) && (c.id === MIX_ID ? !q : catMatches(meta(c), q, bank)));
  return (
    <div className="stack-sm">
      <input className="input" type="search" dir="auto" value={q} placeholder={t('searchCats')} aria-label={t('searchCats')} onChange={(e) => setQ(e.target.value)} />
      <FilterChips value={grp} onChange={setGrp} groups={groups} />
      {list.length ? <CategoryGrid g={g} cats={list} onPick={onPick} /> : <p className="hint center">{t('noMatch')}</p>}
    </div>
  );
}
