// Packs and the question editor's rules (run from tests/run.js).
module.exports = async function packRules({ ok, boot }) {
  const { KH, w } = await boot();
  console.log('Packs and question validation');
  const raw = w.KH_BANK;
  const q = (over) => ({ id: 'q' + Math.random().toString(36).slice(2, 7), type: 'text', cat: 'pk-1-a', points: 200, q: { en: 'Q?', ar: '' }, a: { en: 'A', ar: '' }, alt: { en: [], ar: [] }, ref: '', media: null, ...over });
  const pack = (qs, extra = {}) => ({ id: 'P1', name: 'Test', enabled: true, categories: [{ id: 'pk-1-a', emoji: '🧪', name: { en: 'Lab', ar: 'مختبر' } }], questions: qs, ...extra });

  ok(KH.questionProblems(q()).length === 0, 'a complete text question has no problems');
  ok(KH.questionProblems(q({ points: 300 })).includes('vPoints'), 'only 200, 400 or 600 points are allowed');
  ok(KH.questionProblems(q({ q: { en: ' ', ar: '' } })).includes('vQuestion') && KH.questionProblems(q({ a: { en: '', ar: '' } })).includes('vAnswer'), 'a missing question or answer is reported');
  ok(KH.questionProblems(q({ type: 'image', media: { type: 'image', src: null } })).includes('vNoPicture'), 'a picture question needs a picture');
  ok(KH.questionProblems(q({ type: 'audio', media: { type: 'audio', src: null } })).includes('vNoSound'), 'a sound question needs a sound');
  ok(KH.questionProblems(q({ type: 'video', media: { type: 'video', yt: '', start: 0, end: null } })).includes('vBadUrl'), 'a clip needs a YouTube video');
  ok(KH.questionProblems(q({ type: 'video', media: { type: 'video', yt: 'abcdefghijk', start: 30, end: 20 } })).includes('vBadEnd'), 'the clip’s end time must be after its start');
  ok(KH.questionProblems(q({ type: 'video', media: { type: 'video', yt: 'abcdefghijk', start: NaN, end: null } })).includes('vBadStart'), 'a start time that isn’t a time is reported');
  ok(KH.questionProblems(q(), { verify: true }).includes('vNeedSource') && KH.questionProblems(q({ ref: 'Wikipedia' }), { verify: true }).length === 0, 'it can only be marked verified with a source / how it was checked');
  ok(KH.questionProblems(q({ type: 'image', media: { type: 'image', src: 'idb:x' } }), { mediaMissing: true }).includes('vMediaMissing'), 'a missing picture/sound file is reported');

  // YouTube links
  const P = KH.parseYouTube;
  ok(P('https://www.youtube.com/watch?v=dQw4w9WgXcQ').id === 'dQw4w9WgXcQ' && P('https://youtu.be/dQw4w9WgXcQ?t=43').t === 43 && P('https://www.youtube.com/shorts/dQw4w9WgXcQ').id === 'dQw4w9WgXcQ' && P('dQw4w9WgXcQ').id === 'dQw4w9WgXcQ' && P('https://youtube.com/watch?v=dQw4w9WgXcQ&t=1m5s').t === 65, 'YouTube links are understood (watch, youtu.be, shorts, plain id, ?t=)');
  ok(P('https://vimeo.com/123') === null && P('not a link') === null && P('https://www.youtube.com/watch?v=short') === null, 'non-YouTube or broken links are refused');
  ok(KH.parseTime('1:05') === 65 && KH.parseTime('83') === 83 && KH.parseTime('1:02:03') === 3723 && KH.parseTime('abc') === null && KH.parseTime('-3') === null, 'times like 1:05 are understood; nonsense is refused');
  ok(KH.titleSpoils('Finding Nemo - Official Trailer', { en: 'Finding Nemo', ar: '' }) && !KH.titleSpoils('Official clip HD', { en: 'Finding Nemo', ar: '' }), 'a video title containing the answer is spotted');

  // Packs join the bank
  const qs = [];
  for (const pts of [200, 400, 600]) for (let k = 0; k < 4; k++) qs.push(q({ points: pts, q: { en: 'Lab ' + pts + ' #' + k + '?', ar: '' } }));
  qs.push(q({ cat: 'space', points: 400, q: { en: 'A custom space question?', ar: '' } }));
  qs.push(q({ points: 200, q: { en: '', ar: '' } })); // incomplete: left out
  const merged = KH.indexBank(KH.mergePacks(raw, [pack(qs)]));
  ok(merged.cats.some((c) => c.id === 'pk-1-a' && c.group === 'custom') && merged.groups.some((g) => g.id === 'custom'), 'a pack’s own category appears under “Your packs”');
  ok((merged.byCat['pk-1-a'] || []).length === 12, 'its complete questions are in the game bank (incomplete ones are left out)');
  ok(merged.byCat.space.some((x) => x.id.startsWith('pk.P1.')), 'pack questions can also go into a built-in category');
  ok(merged.total === KH.BANK.total + 13, 'the total counts built-in + pack questions');
  const off = KH.indexBank(KH.mergePacks(raw, [pack(qs, { enabled: false })]));
  ok(!off.byCat['pk-1-a'] && off.total === KH.BANK.total, 'a switched-off pack isn’t used');
  let g = KH.createGame(merged, [{ name: 'A' }, { name: 'B' }], {}, 0, { gameNo: 1 });
  ok(g.pool.some((c) => c.id === 'pk-1-a' && c.short.every((n) => n === 0)), 'a pack category with enough questions can be picked');
  ['pk-1-a', 'capitals', 'movies', 'space', 'mammals', 'cars'].forEach((id) => { g = KH.pickCategory(g, id, { bank: merged, recent: {}, rand: Math.random }); });
  ok(g.cells.filter((c) => c.cat === 'pk-1-a').every((c) => c.q && c.q.pack === 'P1' && c.value === [200, 400, 600][c.tier - 1]), 'a board is built with the pack’s questions at the right values');
  const cell = g.cells.find((c) => c.cat === 'pk-1-a');
  g = KH.openCell(g, cell.id, 0);
  const rep = KH.findReplacement(g, g.cells.find((c) => c.id === cell.id), { bank: merged, recent: {}, rand: Math.random });
  ok(rep && rep.q.pack === 'P1' && rep.q.tier === cell.tier, '“This is wrong” on a pack question replaces it from the same pack category');
  const few = KH.indexBank(KH.mergePacks(raw, [pack(qs.slice(0, 2))]));
  const g2 = KH.createGame(few, [{ name: 'A' }, { name: 'B' }], {}, 0, { gameNo: 1 });
  ok(g2.pool.find((c) => c.id === 'pk-1-a').short.some((n) => n > 0), 'a pack category without enough questions is shown as short (not pickable)');

  // Export / import validation (no IndexedDB needed for text + clips)
  const clipQ = q({ type: 'video', points: 600, media: { type: 'video', yt: 'abcdefghijk', start: 5, end: 12 } });
  const exp = await KH.exportPack(pack([...qs.slice(0, 3), clipQ]));
  const v = KH.validatePack(JSON.parse(JSON.stringify(exp)));
  ok(v.ok && v.summary.questions === 4 && v.summary.cats === 1, 'an exported pack validates and round-trips');
  ok(KH.validatePack({ app: 'khatfa', kind: 'backup' }).error === 'pkNotPack', 'a file that isn’t a pack is refused clearly');
  ok(KH.validatePack({ ...exp, format: 99 }).error === 'bkNewer', 'a pack from a newer version is refused');
  ok(KH.validatePack({ ...exp, pack: { ...exp.pack, questions: [{ ...clipQ, points: 500 }] } }).error === 'pkBadPoints', 'a pack with other point values is refused');
  ok(KH.validatePack({ ...exp, pack: { ...exp.pack, questions: [{ ...clipQ, type: 'image', media: { type: 'image', src: 'https://evil.example/x.png' } }] } }).error === 'bkDamaged', 'a pack pointing at outside files is refused');
  ok(KH.validatePack({ ...exp, media: { x: { data: 'data:text/html,<script>' } } }).error === 'bkDamaged', 'a pack with non-picture/sound files is refused');
  const imp = await KH.importPack(v, [pack([])]);
  ok(imp.id !== 'P1' && imp.name === 'Test (2)' && imp.categories[0].id !== 'pk-1-a' && imp.questions.every((x) => x.cat === imp.categories[0].id || x.cat === 'space'), 'importing makes a new pack with fresh ids (and a new name if one exists)');
  ok(imp.questions.find((x) => x.type === 'video').media.yt === 'abcdefghijk', 'clip settings survive export/import');
  // backups keep packs
  const bk = KH.makeBackup({ settings: {}, game: null, past: [], packs: [pack(qs)], issues: [] });
  ok(KH.validateBackup(JSON.parse(JSON.stringify(bk))).ok, 'a full backup with packs validates');
};
