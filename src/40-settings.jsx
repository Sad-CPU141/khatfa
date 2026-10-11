/* ============================================================
   SETTINGS: language, question language, animations, TV size, backup.
   ============================================================ */
function SettingsScreen({ settings, setSettings, state, onRestore, onClearAll, onBack, bank, qhist, onResetHistory, issues, onClearIssues, extra }) {
  const [ask, setAsk] = useState(null);
  const [msg, setMsg] = useState(null);
  const fileRef = useRef(null);
  const set = (k, v) => setSettings({ ...settings, [k]: v });
  const exportIt = () => {
    const blob = new Blob([JSON.stringify(makeBackup(state), null, 1)], { type: 'application/json' });
    downloadBlob(blob, 'khatfa-backup-' + todayStamp() + '.json');
  };
  const readFile = (file) => {
    if (!file) return;
    const r = new FileReader();
    r.onerror = () => setMsg({ text: t('bkUnreadable') });
    r.onload = () => {
      let obj = null; try { obj = JSON.parse(r.result); } catch (e) { setMsg({ text: t('bkUnreadable') }); return; }
      const v = validateBackup(obj);
      if (!v.ok) { setMsg({ text: t(v.error) }); return; }
      setAsk({ kind: 'import', v });
    };
    r.readAsText(file);
  };
  const backendName = { indexeddb: 'IndexedDB', localStorage: 'localStorage', memory: LANG === 'ar' ? 'الذاكرة فقط' : 'memory only' }[store.backend];
  return (
    <div className="app">
      <TopBar onBack={onBack} title={t('settings')} />
      <section className="card stack">
        <div className="field"><span className="label">{t('language')}</span>
          <Seg value={settings.lang} options={[['ar', 'العربية'], ['en', 'English']]} onChange={(v) => set('lang', v)} label={t('language')} /></div>
        <div className="field"><span className="label">{t('qLang')}</span>
          <Seg value={settings.qLang} options={[['auto', t('qLangAuto')], ['both', t('qLangBoth')]]} onChange={(v) => set('qLang', v)} label={t('qLang')} />
          <p className="hint">{t('qLangSub')}</p></div>
        <div className="field"><span className="label">{t('motion')}</span>
          <Seg value={settings.motion} options={[['system', t('motionSystem')], ['full', t('motionFull')], ['reduce', t('motionReduce')]]} onChange={(v) => set('motion', v)} label={t('motion')} /></div>
        <div className="field"><span className="label">{t('tvZoom')}</span>
          <Seg value={settings.tvZoom} options={[[0.85, 'S'], [1, 'M'], [1.2, 'L'], [1.4, 'XL']]} onChange={(v) => set('tvZoom', v)} label={t('tvZoom')} /></div>
      </section>
      {bank && <section className="card stack">
        <h3>{t('qbank')}</h3>
        <p className="hint">{t('qbankSub', { q: bank.total, c: bank.cats.length })}</p>
        <p className="hint">{t('historySub', { n: Object.keys((qhist && qhist.seen) || {}).length, g: (qhist && qhist.n) || 0 })}</p>
        <button className="btn" disabled={!qhist || !Object.keys(qhist.seen || {}).length} onClick={() => setAsk({ kind: 'hist' })}>{t('resetHistory')}</button>
      </section>}
      {issues && <section className="card stack">
        <h3>⚠ {t('issues')}</h3>
        <p className="hint">{t('issuesSub')} <b>{t('issuesN', { n: issues.length })}</b></p>
        <Toggle on={settings.skipReported !== false} onChange={(v) => set('skipReported', v)} title={t('skipReported')} />
        {issues.length > 0 ? (
          <details className="issuelist"><summary className="label">{t('issuesN', { n: issues.length })}</summary>
            <ol>{issues.slice(0, 100).map((x) => {
              const c = bank && bank.cats.find((k) => k.id === x.cat);
              return <li key={x.id}><span className="muted small">{c ? c.emoji + ' ' + pick(c.name) : x.cat} · {x.value} · {t('reason_' + (x.reason || 'other'))}{x.note ? ' · ' : ''}</span>{x.note ? <bdi dir="auto" className="small">{x.note}</bdi> : null}<Txt v={x.q} as="span" className="iq" /><span className="small muted"> → <Txt v={x.a} /></span></li>;
            })}</ol>
          </details>
        ) : <p className="hint">{t('issuesNone')}</p>}
        <div className="row">
          <button className="btn grow" disabled={!issues.length} onClick={() => downloadBlob(new Blob([JSON.stringify({ app: 'khatfa', kind: 'reported-questions', exportedAt: new Date().toISOString(), issues }, null, 1)], { type: 'application/json' }), 'khatfa-reported-' + todayStamp() + '.json')}>⬇ {t('exportIssues')}</button>
          <button className="btn btn-ghost grow" disabled={!issues.length} onClick={() => setAsk({ kind: 'issues' })}>{t('clearIssues')}</button>
        </div>
      </section>}
      {extra}
      <section className="card stack">
        <h3>{t('backup')}</h3>
        <p className="hint">{t('backupSub')}</p>
        <div className="row">
          <button className="btn grow" onClick={exportIt}>⬇ {t('exportBackup')}</button>
          <button className="btn grow" onClick={() => fileRef.current && fileRef.current.click()}>⬆ {t('importBackup')}</button>
        </div>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => { readFile(e.target.files[0]); e.target.value = ''; }} />
      </section>
      <section className="card stack">
        <h3>{t('storage')}</h3>
        <p className="hint">{t('storageWhere', { b: backendName })}</p>
        {isIOS() && <p className="hint">{t('installIos')}</p>}
        <button className="btn btn-danger" onClick={() => setAsk({ kind: 'clear' })}>{t('clearAll')}</button>
      </section>
      <details className="card"><summary className="label">{t('credits')}</summary><p className="hint">{t('creditsBody')}</p></details>
      <p className="exportfoot">{t('version', { v: APP_VERSION })}</p>
      {ask && ask.kind === 'import' && (
        <Confirm title={t('importQ')} body={t('importBody', { past: ask.v.summary.past, cur: ask.v.summary.current ? t('importCur') : '', date: (ask.v.summary.exportedAt || '').slice(0, 10) })} yes={t('importBackup')}
          onYes={() => { onRestore(ask.v.data); setMsg({ text: t('restored'), ok: true }); }} onClose={() => setAsk(null)} />
      )}
      {ask && ask.kind === 'hist' && <Confirm title={t('resetHistoryQ')} body={t('resetHistoryBody')} yes={t('resetHistory')} onYes={onResetHistory} onClose={() => setAsk(null)} />}
      {ask && ask.kind === 'issues' && <Confirm title={t('clearIssuesQ')} body={t('clearIssuesBody')} yes={t('clearIssues')} onYes={onClearIssues} onClose={() => setAsk(null)} />}
      {ask && ask.kind === 'clear' && <Confirm title={t('clearAllQ')} body={t('clearAllBody')} yes={t('deleteIt')} danger onYes={onClearAll} onClose={() => setAsk(null)} />}
      {msg && <Toast msg={msg.text} ok={msg.ok} onClose={() => setMsg(null)} />}
    </div>
  );
}
