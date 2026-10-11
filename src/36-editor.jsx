/* ============================================================
   QUESTION EDITOR + PACKS ("My questions")
   · A pack = { id, name, enabled, categories: [{ id, emoji, name }], questions: [...] }
     stored in kh_packs_v1. Pictures and sounds are stored as files in this browser's
     IndexedDB ('khatfa-media') and referenced as 'idb:<id>'.
   · Pack questions join the game: in a built-in category, or in the pack's own categories
     (shown under "Your packs"). Same 200 / 400 / 600 values, same selection rules.
   · Export a pack = one .json file with its pictures and sounds inside (base64),
     so it can be backed up or moved to another device. Import validates everything.
   ============================================================ */
const PACK_FORMAT = 1;
const PACK_MAX_IMAGE = 8 * 1024 * 1024, PACK_MAX_AUDIO = 5 * 1024 * 1024, PACK_MAX_FILE = 60 * 1024 * 1024;
const QTYPES = ['text', 'image', 'audio', 'video'];

/* ---------- packs → bank ---------- */
function packQuestion(p, q) {
  return {
    id: 'pk.' + p.id + '.' + q.id, cat: q.cat, tier: POINTS.indexOf(q.points) + 1, points: q.points, sub: q.sub || null,
    q: q.q, a: q.a, alt: { en: (q.alt && q.alt.en) || [], ar: (q.alt && q.alt.ar) || [] },
    hint: q.hint && (q.hint.en || q.hint.ar) ? q.hint : null, note: q.note && (q.note.en || q.note.ar) ? q.note : null,
    ref: q.ref || null, verified: q.verified ? 'host:' + q.verified : null, x: q.x ? 1 : 0, facts: [], tags: [], reviewed: 0, check: 0, asOf: null,
    type: q.type || 'text', media: q.type && q.type !== 'text' ? q.media || null : null, pack: p.id,
  };
}
// The built-in bank plus every switched-on pack. Pack categories go in a "Your packs" group.
function mergePacks(raw, packs) {
  const on = (packs || []).filter((p) => p && p.enabled !== false);
  if (!on.length) return raw;
  const groups = [...raw.groups];
  const cats = raw.cats.map((c) => ({ ...c }));
  const own = [];
  on.forEach((p) => (p.categories || []).forEach((c) => own.push({ id: c.id, group: 'custom', emoji: c.emoji || '📦', name: c.name, subs: {}, count: [0, 0, 0], popular: 0, nicheTopic: 0, pack: p.id })));
  if (own.length) { groups.push({ id: 'custom', emoji: '📦', name: { en: 'Your packs', ar: 'حزمك' } }); cats.push(...own); }
  const ids = new Set(cats.map((c) => c.id));
  const questions = [...raw.questions];
  on.forEach((p) => (p.questions || []).forEach((q) => { if (ids.has(q.cat) && POINTS.includes(q.points) && (q.q.en || q.q.ar) && (q.a.en || q.a.ar)) questions.push(packQuestion(p, q)); }));
  return { ...raw, groups, cats, questions };
}

/* ---------- validation ---------- */
const clipLen = (m) => (m && m.end != null ? m.end - (m.start || 0) : null);
// Returns a list of problem keys (empty = OK). `verify`: also what's needed to mark it verified.
function questionProblems(q, opts = {}) {
  const out = [];
  if (!POINTS.includes(q.points)) out.push('vPoints');
  if (!q.cat) out.push('vCat');
  if (!(q.q.en || '').trim() && !(q.q.ar || '').trim()) out.push('vQuestion');
  if (!(q.a.en || '').trim() && !(q.a.ar || '').trim()) out.push('vAnswer');
  const m = q.media || {};
  if (q.type === 'image' && !m.src && !m.emoji) out.push('vNoPicture');
  if (q.type === 'audio' && !m.src) out.push('vNoSound');
  if (q.type === 'video') {
    if (!m.yt) out.push('vBadUrl');
    if (m.start != null && (!(m.start >= 0) || isNaN(m.start))) out.push('vBadStart');
    if (m.end != null && (isNaN(m.end) || !(m.end > (m.start || 0)))) out.push('vBadEnd');
  }
  if (opts.mediaMissing) out.push('vMediaMissing');
  if (opts.verify && !(q.ref || '').trim()) out.push('vNeedSource');
  return out;
}
const emptyQuestion = (type, cat) => ({ id: uid(), type, cat: cat || '', sub: '', points: 200, q: { en: '', ar: '' }, a: { en: '', ar: '' }, alt: { en: [], ar: [] }, hint: { en: '', ar: '' }, note: { en: '', ar: '' }, ref: '', verified: null, media: type === 'video' ? { type: 'video', yt: '', start: 0, end: null } : type === 'text' ? null : { type, src: null } });

/* ---------- files ---------- */
const blobToDataUrl = (blob) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(r.error); r.readAsDataURL(blob); });
function dataUrlToBlob(d) {
  const m = /^data:([^;,]+)(;base64)?,(.*)$/s.exec(d || ''); if (!m) return null;
  const bin = m[2] ? atob(m[3]) : decodeURIComponent(m[3]); const u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return new Blob([u], { type: m[1] });
}
// Big photos are scaled down (max 1600 px) so they fit in browser storage; small files are kept as they are.
async function prepareImage(file) {
  if (!/^image\//.test(file.type)) throw new Error('vNotImage');
  if (file.size > PACK_MAX_IMAGE) throw new Error('vTooBig');
  if (file.type === 'image/svg+xml' || file.type === 'image/gif' || file.size < 450 * 1024) return file;
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('vUnsupported')); i.src = url; });
    const scale = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * scale); c.height = Math.round(img.naturalHeight * scale);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    const out = await new Promise((res) => c.toBlob(res, 'image/webp', 0.86));
    if (out && out.type === 'image/webp' && out.size < file.size) return out;
    const jpg = await new Promise((res) => c.toBlob(res, 'image/jpeg', 0.86));
    return jpg && jpg.size < file.size ? jpg : file;
  } finally { URL.revokeObjectURL(url); }
}
// Checks this browser can actually play the sound; returns its length in seconds.
function checkAudio(blob) {
  return new Promise((resolve, reject) => {
    if (!/^audio\//.test(blob.type) && !/\.(mp3|m4a|aac|wav|ogg|oga|opus|webm)$/i.test(blob.name || '')) return reject(new Error('vNotAudio'));
    if (blob.size > PACK_MAX_AUDIO) return reject(new Error('vTooBigAudio'));
    const url = URL.createObjectURL(blob); const a = new Audio(); let done = false;
    const end = (fn, v) => { if (done) return; done = true; URL.revokeObjectURL(url); fn(v); };
    a.preload = 'metadata';
    a.onloadedmetadata = () => end(resolve, a.duration);
    a.onerror = () => end(reject, new Error('vUnsupported'));
    setTimeout(() => end(reject, new Error('vUnsupported')), 8000);
    a.src = url;
  });
}
// Media ids used by questions (to clean up files nothing uses any more).
const packMediaIds = (packs) => { const s = new Set(); (packs || []).forEach((p) => (p.questions || []).forEach((q) => { const src = q.media && q.media.src; if (isLocalMedia(src)) s.add(src.slice(4)); })); return s; };
// Deletes stored files nothing uses any more. It always looks at EVERY pack and the sound
// uploads (saved state), so cleaning up after one pack can never delete another pack's files.
async function cleanMedia(packsOverride) {
  const packs = packsOverride || store.get(K.packs, []);
  const used = packMediaIds(packs);
  const snd = ((store.get(K.settings, {}) || {}).sound || {}).files || {};
  Object.values(snd).forEach((src) => { if (isLocalMedia(src)) used.add(src.slice(4)); });
  const keys = await mediaStore.keys();
  await Promise.all((keys || []).filter((k) => !used.has(k)).map((k) => mediaStore.del(k)));
}

/* ---------- pack export / import ---------- */
async function exportPack(p) {
  const media = {};
  for (const q of p.questions || []) {
    const src = q.media && q.media.src;
    if (isLocalMedia(src)) { const rec = await mediaStore.get(src.slice(4)); if (rec && rec.blob) media[src.slice(4)] = { type: rec.blob.type, name: rec.name || '', data: await blobToDataUrl(rec.blob) }; }
  }
  return { app: 'khatfa', kind: 'pack', format: PACK_FORMAT, exportedAt: new Date().toISOString(), pack: p, media };
}
// Returns { ok, error, pack, media, summary } — nothing is saved until importPack().
function validatePack(obj) {
  if (!obj || obj.app !== 'khatfa' || obj.kind !== 'pack') return { ok: false, error: 'pkNotPack' };
  if (typeof obj.format !== 'number' || obj.format > PACK_FORMAT) return { ok: false, error: 'bkNewer' };
  const p = obj.pack;
  if (!p || typeof p.name !== 'string' || !Array.isArray(p.questions) || !Array.isArray(p.categories)) return { ok: false, error: 'bkDamaged' };
  const media = obj.media && typeof obj.media === 'object' ? obj.media : {};
  const catIds = new Set(p.categories.map((c) => c && c.id));
  if (p.categories.some((c) => !c || typeof c.id !== 'string' || !c.name || typeof c.name !== 'object')) return { ok: false, error: 'bkDamaged' };
  let bad = 0;
  for (const q of p.questions) {
    if (!q || typeof q !== 'object' || !q.q || !q.a || !QTYPES.includes(q.type || 'text')) return { ok: false, error: 'bkDamaged' };
    if (!POINTS.includes(q.points)) return { ok: false, error: 'pkBadPoints' };
    if (questionProblems(q).length) bad++;
    const src = q.media && q.media.src;
    if (isLocalMedia(src) && !media[src.slice(4)]) bad++;
    if (q.media && q.media.src && !isLocalMedia(q.media.src) && !/^media\//.test(q.media.src)) return { ok: false, error: 'bkDamaged' }; // no outside links
  }
  for (const k of Object.keys(media)) { const m = media[k]; if (!m || typeof m.data !== 'string' || !/^data:(image|audio)\//.test(m.data)) return { ok: false, error: 'bkDamaged' }; }
  return { ok: true, pack: p, media, summary: { name: p.name, questions: p.questions.length, cats: p.categories.length, media: Object.keys(media).length, bad, unknownCats: p.questions.filter((q) => !catIds.has(q.cat)).length } };
}
// Saves an imported pack as a NEW pack (fresh ids), with its media files.
async function importPack(v, packs) {
  const p = v.pack; const remap = {};
  for (const [oldId, m] of Object.entries(v.media)) { const blob = dataUrlToBlob(m.data); if (blob) remap[oldId] = await mediaStore.put({ blob, name: m.name || '', size: blob.size, at: Date.now() }); }
  const pid = uid(); const catMap = {};
  const categories = p.categories.map((c) => { const id = 'pk-' + pid + '-' + uid().slice(0, 5); catMap[c.id] = id; return { id, emoji: c.emoji || '📦', name: { en: String(c.name.en || ''), ar: String(c.name.ar || '') } }; });
  const questions = p.questions.map((q) => {
    const media = q.media ? { ...q.media } : null;
    if (media && isLocalMedia(media.src)) media.src = remap[media.src.slice(4)] ? 'idb:' + remap[media.src.slice(4)] : null;
    return { ...q, id: uid(), cat: catMap[q.cat] || q.cat, media };
  });
  let name = p.name || 'Pack'; const names = new Set((packs || []).map((x) => x.name));
  if (names.has(name)) { let k = 2; while (names.has(name + ' (' + k + ')')) k++; name = name + ' (' + k + ')'; }
  return { id: pid, name, enabled: true, createdAt: Date.now(), updatedAt: Date.now(), categories, questions };
}

/* ============================================================
   SCREENS
   ============================================================ */
function QuestionsScreen({ packs, setPacks, bank, onBack, tvOpen, setPreview, previewStatus }) {
  const [openId, setOpenId] = useState(null);
  const [msg, setMsg] = useState(null);
  const [ask, setAsk] = useState(null);
  const [persist, setPersist] = useState(true);
  const fileRef = useRef(null);
  useEffect(() => { mediaStore.persistent.then(setPersist); }, []);
  useEffect(() => () => setPreview(null), []);
  const pack = packs.find((p) => p.id === openId);
  const savePack = (p) => setPacks(packs.map((x) => (x.id === p.id ? { ...p, updatedAt: Date.now() } : x)));
  const newPack = () => { const p = { id: uid(), name: t('newPackName', { n: packs.length + 1 }), enabled: true, createdAt: Date.now(), updatedAt: Date.now(), categories: [], questions: [] }; setPacks([...packs, p]); setOpenId(p.id); };
  const readFile = (file) => {
    if (!file) return;
    if (file.size > PACK_MAX_FILE) { setMsg({ text: t('vTooBigPack') }); return; }
    const r = new FileReader();
    r.onerror = () => setMsg({ text: t('bkUnreadable') });
    r.onload = () => { let obj; try { obj = JSON.parse(r.result); } catch (e) { setMsg({ text: t('bkUnreadable') }); return; } const v = validatePack(obj); if (!v.ok) { setMsg({ text: t(v.error) }); return; } setAsk({ kind: 'import', v }); };
    r.readAsText(file);
  };
  if (pack) return <PackScreen pack={pack} savePack={savePack} bank={bank} onBack={() => { setOpenId(null); setPreview(null); }} tvOpen={tvOpen} setPreview={setPreview} previewStatus={previewStatus}
    onDelete={() => setAsk({ kind: 'delete', p: pack })} onExport={async () => { const data = await exportPack(pack); downloadBlob(new Blob([JSON.stringify(data)], { type: 'application/json' }), 'khatfa-pack-' + pack.name.replace(/[^\p{L}\p{N}]+/gu, '-').slice(0, 40) + '.json'); }}
    extra={ask && ask.kind === 'delete' && <Confirm title={t('deletePackQ')} body={t('deletePackBody', { n: ask.p.questions.length })} yes={t('deleteIt')} danger onYes={() => { const rest = packs.filter((x) => x.id !== ask.p.id); setPacks(rest); setOpenId(null); setTimeout(() => cleanMedia().catch(() => {}), 0); }} onClose={() => setAsk(null)} />} />;
  return (
    <div className="app">
      <TopBar onBack={onBack} title={t('myQuestions')} />
      <p className="hint">{t('myQuestionsSub')}</p>
      {!persist && <p className="warn">{t('mediaNoStore')}</p>}
      {packs.map((p) => (
        <div key={p.id} className="card packrow">
          <button className="pr-main" onClick={() => setOpenId(p.id)}>
            <b className="grow" dir="auto">📦 {p.name}</b>
            <span className="small muted">{t('questionsN', { n: p.questions.length })} · {p.categories.length ? t('packCatsN', { n: p.categories.length }) : t('packNoCats')}</span>
          </button>
          <Toggle on={p.enabled !== false} onChange={(v) => setPacks(packs.map((x) => (x.id === p.id ? { ...x, enabled: v } : x)))} title={t('packInGames')} />
        </div>
      ))}
      {!packs.length && <p className="hint center">{t('noPacks')}</p>}
      <button className="btn btn-gold" onClick={newPack}>＋ {t('newPack')}</button>
      <button className="btn" onClick={() => fileRef.current && fileRef.current.click()}>⬆ {t('importPack')}</button>
      <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => { readFile(e.target.files[0]); e.target.value = ''; }} />
      <p className="hint">{t('packStorageNote')}</p>
      {ask && ask.kind === 'import' && <Confirm title={t('importPackQ', { name: ask.v.summary.name })} body={t('importPackBody', ask.v.summary) + (ask.v.summary.bad ? ' ' + t('importPackBad', { n: ask.v.summary.bad }) : '')} yes={t('importPack')}
        onYes={async () => { try { const p = await importPack(ask.v, packs); setPacks([...packs, p]); setMsg({ text: t('packImported', { name: p.name }), ok: true }); } catch (e) { setMsg({ text: t(/quota/i.test(e.message) ? 'storeFull' : 'storeFail') }); } }} onClose={() => setAsk(null)} />}
      {msg && <Toast msg={msg.text} ok={msg.ok} onClose={() => setMsg(null)} />}
    </div>
  );
}

function PackScreen({ pack, savePack, bank, onBack, onDelete, onExport, extra, tvOpen, setPreview, previewStatus }) {
  const [edit, setEdit] = useState(null); // a question draft
  const [newType, setNewType] = useState(false);
  const [catForm, setCatForm] = useState(null);
  const [filter, setFilter] = useState('all');
  const [delQ, setDelQ] = useState(null);
  if (edit) return <QuestionForm initial={edit} pack={pack} bank={bank} tvOpen={tvOpen} setPreview={setPreview} previewStatus={previewStatus}
    onCancel={() => { setEdit(null); setPreview(null); }}
    onSave={(q) => { const exists = pack.questions.some((x) => x.id === q.id); const next = { ...pack, questions: exists ? pack.questions.map((x) => (x.id === q.id ? q : x)) : [...pack.questions, q] }; savePack(next); setEdit(null); setPreview(null); setTimeout(() => cleanMedia().catch(() => {}), 0); }} />;
  const catName = (id) => { const c = pack.categories.find((x) => x.id === id) || bank.cats.find((x) => x.id === id); return c ? (c.emoji || '') + ' ' + pick(c.name) : '—'; };
  const list = pack.questions.filter((q) => filter === 'all' || (q.type || 'text') === filter);
  return (
    <div className="app">
      <TopBar onBack={onBack} title={pack.name} />
      <div className="card stack-sm">
        <label className="field"><span className="label">{t('packName')}</span><input className="input" dir="auto" maxLength={60} value={pack.name} onChange={(e) => savePack({ ...pack, name: e.target.value })} /></label>
        <span className="label">{t('packCategories')}</span>
        <p className="hint" style={{ margin: 0 }}>{t('packCategoriesSub')}</p>
        <div className="chips">
          {pack.categories.map((c) => <button key={c.id} className="chip" onClick={() => setCatForm(c)}>{c.emoji} <Txt v={c.name} /> · {pack.questions.filter((q) => q.cat === c.id).length}</button>)}
          <button className="chip" onClick={() => setCatForm({ id: 'pk-' + pack.id + '-' + uid().slice(0, 5), emoji: '📦', name: { en: '', ar: '' }, isNew: true })}>＋ {t('addCategory')}</button>
        </div>
      </div>
      <div className="row"><span className="label grow">{t('questionsN', { n: pack.questions.length })}</span></div>
      <div className="fchips">{['all', ...QTYPES].map((k) => <button key={k} className={'fchip' + (filter === k ? ' on' : '')} onClick={() => setFilter(k)}>{k === 'all' ? t('all') : (MEDIA_ICON[k] || '📝') + ' ' + t('type_' + k)}</button>)}</div>
      {list.map((q) => {
        const probs = questionProblems(q);
        return (
          <div key={q.id} className="card qrow">
            <button className="qr-main" onClick={() => setEdit(JSON.parse(JSON.stringify(q)))}>
              <span className="qr-v num">{q.points}</span>
              <span className="grow"><span className="small muted">{MEDIA_ICON[q.type] || '📝'} {catName(q.cat)}{q.verified ? ' · ✅ ' + t('verified') : ''}{probs.length ? ' · ⚠ ' + t('incomplete') : ''}</span><Txt v={q.q} as="span" className="qr-q" /><span className="small muted">→ <Txt v={q.a} /></span></span>
            </button>
            <button className="iconbtn" aria-label={t('deleteQ')} onClick={() => setDelQ(q)}>🗑</button>
          </div>
        );
      })}
      {!pack.questions.length && <p className="hint center">{t('noQuestionsYet')}</p>}
      {newType ? (
        <div className="card stack-sm">
          <span className="label">{t('chooseType')}</span>
          <div className="typegrid">{QTYPES.map((k) => <button key={k} className="btn" onClick={() => { setNewType(false); setEdit(emptyQuestion(k, pack.categories[0] ? pack.categories[0].id : '')); }}>{MEDIA_ICON[k] || '📝'} {t('type_' + k)}</button>)}</div>
          <button className="btn btn-ghost btn-sm" onClick={() => setNewType(false)}>{t('cancel')}</button>
        </div>
      ) : <button className="btn btn-gold" onClick={() => setNewType(true)}>＋ {t('addQuestion')}</button>}
      <div className="row">
        <button className="btn grow" onClick={onExport} disabled={!pack.questions.length}>⬇ {t('exportPack')}</button>
        <button className="btn btn-danger grow" onClick={onDelete}>{t('deletePack')}</button>
      </div>
      <p className="hint">{t('packMinNote', { n: 2 })}</p>
      {catForm && <CategoryForm c={catForm} onClose={() => setCatForm(null)} inUse={pack.questions.filter((q) => q.cat === catForm.id).length}
        onSave={(c) => { const { isNew, ...cc } = c; savePack({ ...pack, categories: isNew ? [...pack.categories, cc] : pack.categories.map((x) => (x.id === cc.id ? cc : x)) }); setCatForm(null); }}
        onDelete={() => { savePack({ ...pack, categories: pack.categories.filter((x) => x.id !== catForm.id) }); setCatForm(null); }} />}
      {delQ && <Confirm title={t('deleteQQ')} body={pick(delQ.q)} yes={t('deleteIt')} danger onYes={() => { const next = { ...pack, questions: pack.questions.filter((x) => x.id !== delQ.id) }; savePack(next); setTimeout(() => cleanMedia().catch(() => {}), 0); }} onClose={() => setDelQ(null)} />}
      {extra}
    </div>
  );
}

function CategoryForm({ c, onSave, onDelete, onClose, inUse }) {
  const [d, setD] = useState(c);
  const okName = (d.name.en || '').trim() || (d.name.ar || '').trim();
  return (
    <Sheet onClose={onClose}>
      <div className="stack-sm">
        <h2 className="display" style={{ fontSize: 26 }}>{c.isNew ? t('addCategory') : t('editCategory')}</h2>
        <label className="field"><span className="label">{t('emoji')}</span><input className="input" style={{ maxWidth: 90, fontSize: 26 }} maxLength={4} value={d.emoji} onChange={(e) => setD({ ...d, emoji: e.target.value })} /></label>
        <label className="field"><span className="label">{t('nameEn')}</span><input className="input" dir="ltr" maxLength={40} value={d.name.en} onChange={(e) => setD({ ...d, name: { ...d.name, en: e.target.value } })} /></label>
        <label className="field"><span className="label">{t('nameAr')}</span><input className="input" dir="rtl" maxLength={40} value={d.name.ar} onChange={(e) => setD({ ...d, name: { ...d.name, ar: e.target.value } })} /></label>
        <button className="btn btn-gold" disabled={!okName} onClick={() => onSave(d)}>{t('save')}</button>
        {!c.isNew && <button className="btn btn-danger" disabled={inUse > 0} onClick={onDelete}>{t('deleteCategory')}</button>}
        {!c.isNew && inUse > 0 && <p className="hint" style={{ margin: 0 }}>{t('categoryInUse', { n: inUse })}</p>}
        <button className="btn btn-ghost" onClick={onClose}>{t('cancel')}</button>
      </div>
    </Sheet>
  );
}

function BiField({ label, v, onChange, area, max = 300 }) {
  const El = area ? 'textarea' : 'input';
  return (
    <div className="field">
      <span className="label">{label}</span>
      <div className="bifield">
        <El className="input" dir="ltr" lang="en" maxLength={max} placeholder="English" value={v.en || ''} onChange={(e) => onChange({ ...v, en: e.target.value })} rows={area ? 2 : undefined} />
        <El className="input" dir="rtl" lang="ar" maxLength={max} placeholder="عربي" value={v.ar || ''} onChange={(e) => onChange({ ...v, ar: e.target.value })} rows={area ? 2 : undefined} />
      </div>
    </div>
  );
}

function QuestionForm({ initial, pack, bank, onSave, onCancel, tvOpen, setPreview, previewStatus }) {
  const [q, setQ] = useState(initial);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [play, setPlay] = useState(freshPlay());
  const [reveal, setReveal] = useState(0);
  const [status, setStatus] = useState(null);
  const [urlText, setUrlText] = useState(initial.media && initial.media.yt ? 'https://youtu.be/' + initial.media.yt : '');
  const [startText, setStartText] = useState(initial.media && initial.media.start != null ? fmtTime(initial.media.start) : '0:00');
  const [endText, setEndText] = useState(initial.media && initial.media.end != null ? fmtTime(initial.media.end) : '');
  const [audioLen, setAudioLen] = useState(null);
  const [mediaMissing, setMediaMissing] = useState(false);
  const [tried, setTried] = useState(false);
  const fileRef = useRef(null);
  const set = (patch) => setQ({ ...q, ...patch });
  const setM = (patch) => setQ({ ...q, media: { ...(q.media || { type: q.type }), ...patch } });
  // Local media: is the file still here?
  useEffect(() => { const s = q.media && q.media.src; if (isLocalMedia(s)) mediaStore.get(s.slice(4)).then((r) => setMediaMissing(!r)); else setMediaMissing(false); }, [q.media && q.media.src]);
  // Clip fields → media
  useEffect(() => {
    if (q.type !== 'video') return;
    const y = parseYouTube(urlText); const st = parseTime(startText); const en = endText.trim() ? parseTime(endText) : null;
    setQ((x) => ({ ...x, media: { type: 'video', yt: y ? y.id : '', start: st == null ? NaN : st, end: endText.trim() ? (en == null ? NaN : en) : null } }));
  }, [urlText, startText, endText]);
  useEffect(() => { setStatus(null); setPlay(freshPlay()); }, [q.media && (q.media.src || q.media.yt), q.media && q.media.start, q.media && q.media.end]);
  const probs = questionProblems(q, { mediaMissing });
  const verifyProbs = questionProblems(q, { mediaMissing, verify: true });
  const pickFile = async (file) => {
    if (!file) return;
    setErr(null); setBusy(true);
    try {
      let blob = file; let len = null;
      if (q.type === 'image') blob = await prepareImage(file);
      else { len = await checkAudio(file); setAudioLen(len); }
      const id = await mediaStore.put({ blob, name: '', size: blob.size, at: Date.now() }); // the original file name isn't kept (it could give the answer away)
      setM({ type: q.type, src: 'idb:' + id });
      if (len && len > 30) setErr('vLongSound');
    } catch (e) { setErr(/quota/i.test(e.message) ? 'storeFull' : e.message && S[e.message] ? e.message : 'vUnsupported'); }
    setBusy(false);
  };
  const cats = [...pack.categories.map((c) => ({ ...c, group: 'custom' })), ...bank.cats.filter((c) => !c.pack)];
  const catObj = cats.find((c) => c.id === q.cat);
  const subs = catObj && catObj.subs ? Object.keys(catObj.subs) : [];
  const previewQ = { ...packQuestion(pack, { ...q, alt: q.alt }), q: q.q.en || q.q.ar ? q.q : { en: '…', ar: '…' } };
  const cur = { play, reveal, stage: 'answer' };
  const previewing = useRef(false);
  const tvPreview = () => setPreview({ q: { ...previewQ, a: null, alt: null, hint: null, note: null, ref: null }, cur });
  useEffect(() => { if (tvOpen && previewing.current) tvPreview(); }, [play, reveal, q]);
  const cmd = (c, v) => { const g = mediaCmd({ current: { play } }, c, v); setPlay(g.current.play); };
  const shownStatus = tvOpen && previewing.current ? previewStatus : status;
  const save = (verifyNow) => {
    setTried(true);
    if (probs.length) return;
    if (verifyNow && verifyProbs.length) return;
    // Saving changes removes an earlier "verified" mark; "Save as verified" sets it again.
    const out = { ...q, verified: verifyNow ? todayStamp() : null,
      alt: { en: (q.alt.en || []).map((s) => s.trim()).filter(Boolean), ar: (q.alt.ar || []).map((s) => s.trim()).filter(Boolean) } };
    if (out.type === 'video') out.media = { type: 'video', yt: out.media.yt, start: out.media.start || 0, end: out.media.end };
    onSave(out);
  };
  const altText = (lang) => (q.alt[lang] || []).join(', ');
  return (
    <div className="app qform">
      <TopBar onBack={onCancel} title={(MEDIA_ICON[q.type] || '📝') + ' ' + t('type_' + q.type)} />
      <div className="field"><span className="label">{t('category')}</span>
        <select className="input" value={q.cat} onChange={(e) => set({ cat: e.target.value, sub: '' })}>
          <option value="">{t('chooseCategory')}</option>
          {pack.categories.length > 0 && <optgroup label={t('thisPack')}>{pack.categories.map((c) => <option key={c.id} value={c.id}>{c.emoji} {pick(c.name)}</option>)}</optgroup>}
          {bank.groups.filter((g) => g.id !== 'custom').map((g) => <optgroup key={g.id} label={g.emoji + ' ' + pick(g.name)}>{bank.cats.filter((c) => c.group === g.id).map((c) => <option key={c.id} value={c.id}>{c.emoji} {pick(c.name)}</option>)}</optgroup>)}
        </select></div>
      {subs.length > 0 && <div className="field"><span className="label">{t('subcategory')}</span>
        <select className="input" value={q.sub || ''} onChange={(e) => set({ sub: e.target.value })}><option value="">—</option>{subs.map((k) => <option key={k} value={k}>{pick(catObj.subs[k])}</option>)}</select></div>}
      <div className="field"><span className="label">{t('pointsLabel')}</span><Seg value={q.points} options={POINTS.map((p, i) => [p, p + ' · ' + t(['tierEasy', 'tierHard', 'tierBrutal'][i])])} onChange={(v) => set({ points: v })} label={t('pointsLabel')} /></div>

      {q.type === 'image' && <div className="card stack-sm">
        <span className="label">{t('picture')}</span>
        <button className="btn" disabled={busy} onClick={() => fileRef.current.click()}>🖼️ {q.media && q.media.src ? t('replacePicture') : t('choosePicture')}</button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { pickFile(e.target.files[0]); e.target.value = ''; }} />
        <label className="field"><span className="label">{t('orEmoji')}</span><input className="input" style={{ fontSize: 24 }} maxLength={40} value={(q.media && q.media.emoji) || ''} onChange={(e) => setM({ emoji: e.target.value, src: e.target.value ? null : q.media.src })} /></label>
        <BiField label={t('pictureDesc')} v={mText(q.media && q.media.alt) || { en: '', ar: '' }} onChange={(v) => setM({ alt: v })} max={160} />
        <div className="field"><span className="label">{t('revealMode')}</span><Seg value={(q.media && q.media.reveal) || ''} options={[['', t('revealNone')], ['zoom', t('revealZoom')], ['blur', t('revealBlur')]]} onChange={(v) => { setM({ reveal: v || null }); setReveal(0); }} label={t('revealMode')} /></div>
        {q.media && q.media.reveal === 'zoom' && <p className="hint" style={{ margin: 0 }}>{t('focusHint')}</p>}
        <p className="hint" style={{ margin: 0 }}>{t('pictureRights')}</p>
      </div>}
      {q.type === 'audio' && <div className="card stack-sm">
        <span className="label">{t('sound')}</span>
        <button className="btn" disabled={busy} onClick={() => fileRef.current.click()}>🔊 {q.media && q.media.src ? t('replaceSound') : t('chooseSound')}</button>
        <input ref={fileRef} type="file" accept="audio/*,.mp3,.m4a,.wav,.ogg" hidden onChange={(e) => { pickFile(e.target.files[0]); e.target.value = ''; }} />
        {audioLen != null && <p className="hint" style={{ margin: 0 }}>{t('soundLength', { s: Math.round(audioLen) })}</p>}
        <p className="hint" style={{ margin: 0 }}>{t('soundRights')}</p>
      </div>}
      {q.type === 'video' && <div className="card stack-sm">
        <span className="label">{t('clip')}</span>
        <label className="field"><span className="label">{t('clipUrl')}</span><input className="input" dir="ltr" inputMode="url" placeholder="https://www.youtube.com/watch?v=…" value={urlText} onChange={(e) => { setUrlText(e.target.value); const y = parseYouTube(e.target.value); if (y && y.t != null && (!startText || startText === '0:00')) setStartText(fmtTime(y.t)); }} /></label>
        <div className="row">
          <label className="field grow"><span className="label">{t('clipStart')}</span><input className="input" dir="ltr" placeholder="1:05" value={startText} onChange={(e) => setStartText(e.target.value)} /></label>
          <label className="field grow"><span className="label">{t('clipEnd')}</span><input className="input" dir="ltr" placeholder="1:20" value={endText} onChange={(e) => setEndText(e.target.value)} /></label>
        </div>
        {clipLen(q.media) > 60 && <p className="warn">{t('vLongClip')}</p>}
        <p className="hint" style={{ margin: 0 }}>{t('clipRules')}</p>
      </div>}

      <BiField label={t('questionText') + ' *'} v={q.q} onChange={(v) => set({ q: v })} area />
      <BiField label={t('answerText') + ' *'} v={q.a} onChange={(v) => set({ a: v })} />
      <div className="field"><span className="label">{t('alsoAcceptField')}</span>
        <div className="bifield">
          <input className="input" dir="ltr" placeholder="English, comma separated" defaultValue={altText('en')} onChange={(e) => set({ alt: { ...q.alt, en: e.target.value.split(',') } })} />
          <input className="input" dir="rtl" placeholder="عربي، افصل بفاصلة" defaultValue={altText('ar')} onChange={(e) => set({ alt: { ...q.alt, ar: e.target.value.split(/[,،]/) } })} />
        </div></div>
      <BiField label={t('hintField')} v={q.hint || { en: '', ar: '' }} onChange={(v) => set({ hint: v })} />
      <BiField label={t('noteField')} v={q.note || { en: '', ar: '' }} onChange={(v) => set({ note: v })} />
      <label className="field"><span className="label">{t('sourceField')}</span><textarea className="input" dir="auto" rows={2} maxLength={500} placeholder={t('sourcePh')} value={q.ref || ''} onChange={(e) => set({ ref: e.target.value })} /></label>

      {/* Preview */}
      {q.type !== 'text' && <div className="card stack-sm preview">
        <span className="label">{t('previewLabel')}</span>
        <div className={q.type === 'image' && q.media && q.media.reveal === 'zoom' ? 'focuspick' : undefined} onClick={(e) => {
          if (!(q.type === 'image' && q.media && q.media.reveal === 'zoom')) return;
          const box = e.currentTarget.querySelector('.qimg'); if (!box) return; const r = box.getBoundingClientRect();
          setM({ focus: [clamp((e.clientX - r.left) / r.width, 0, 1), clamp((e.clientY - r.top) / r.height, 0, 1)].map((x) => Math.round(x * 100) / 100) }); setReveal(0);
        }}>
          <QuestionCard cell={{ q: previewQ }} cur={cur} output={!(tvOpen && previewing.current)} onStatus={setStatus} status={shownStatus} host />
        </div>
        {(q.type === 'audio' || q.type === 'video') && <div className="row mbtns">
          <button className="btn btn-sm btn-gold grow" onClick={() => cmd(play.state === 'playing' ? 'pause' : 'play')}>{play.state === 'playing' ? '⏸ ' + t('mPause') : '▶ ' + t('mPlay')}</button>
          <button className="btn btn-sm" onClick={() => cmd('replay')}>↺ {t('mReplay')}</button>
        </div>}
        {q.type === 'image' && q.media && q.media.reveal && <button className="btn btn-sm" onClick={() => setReveal(reveal >= REVEAL_STEPS ? 0 : reveal + 1)}>🔍 {t('revealMore')} ({reveal}/{REVEAL_STEPS})</button>}
        {shownStatus && shownStatus.s && <p className={'mstatus' + (shownStatus.s === 'error' ? ' bad' : '')}>{t(STATUS_TXT[shownStatus.s] || 'mReady')}{shownStatus.msg ? ' ' + t(shownStatus.msg) : ''}</p>}
        {q.type === 'video' && shownStatus && shownStatus.title && <p className="hint" style={{ margin: 0 }}>{t('videoTitle', { title: shownStatus.title })}</p>}
        {q.type === 'video' && shownStatus && shownStatus.title && titleSpoils(shownStatus.title, q.a) && <p className="warn">⚠ {t('titleSpoils', { title: shownStatus.title })}</p>}
        {tvOpen
          ? <button className="btn btn-sm" onClick={() => { previewing.current = !previewing.current; if (previewing.current) tvPreview(); else setPreview(null); setPlay(freshPlay()); }}>📺 {previewing.current ? t('stopTvPreview') : t('previewOnTvBtn')}</button>
          : <p className="hint" style={{ margin: 0 }}>{t('previewTvHint')}</p>}
      </div>}

      {(tried || q.verified) && probs.length > 0 && <ul className="verrors">{probs.map((k) => <li key={k}>{t(k)}</li>)}</ul>}
      {err && <p className="warn">{t(err)}</p>}
      {busy && <p className="hint">{t('mLoading')}</p>}
      <div className="row qf-actions">
        <button className="btn btn-gold grow" disabled={busy} onClick={() => save(false)}>{t('save')}</button>
        <button className="btn grow" disabled={busy || verifyProbs.length > 0} onClick={() => save(true)} title={verifyProbs.length ? verifyProbs.map((k) => t(k)).join(' · ') : ''}>✅ {t('saveVerified')}</button>
      </div>
      {verifyProbs.length > 0 && <p className="hint">{t('verifyNeeds')} {verifyProbs.map((k) => t(k)).join(' · ')}</p>}
      {q.verified && <p className="hint">✅ {t('verifiedOn', { d: q.verified })} {t('editUnverifies')}</p>}
      <button className="btn btn-ghost" onClick={onCancel}>{t('cancel')}</button>
    </div>
  );
}
