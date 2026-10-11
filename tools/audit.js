// Question-bank audit. Run: npm run audit   (after npm run build)
// Reports real counts from bank.js and flags problems. Exits with code 1 on errors
// (things that must be fixed); warnings are things a person should review.
//   node tools/audit.js            full report
//   node tools/audit.js --json     machine-readable summary (used by the tests)
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const code = fs.readFileSync(path.join(root, 'bank.js'), 'utf8');
const sandbox = {}; sandbox.window = sandbox; // bank.js expects a browser-like global
vm.createContext(sandbox);
vm.runInContext(code, sandbox);
const B = sandbox.KH_BANK;

const errors = [...B.errors];
const warns = [];
const qs = B.questions;
const ids = new Map();
qs.forEach((q) => { ids.set(q.id, (ids.get(q.id) || 0) + 1); });
[...ids].filter(([, n]) => n > 1).forEach(([id, n]) => errors.push('duplicate id ' + id + ' (×' + n + ')'));
const catIds = new Map(); B.cats.forEach((c) => catIds.set(c.id, (catIds.get(c.id) || 0) + 1));
[...catIds].filter(([, n]) => n > 1).forEach(([id]) => errors.push('duplicate category id ' + id));
const groupIds = new Set(B.groups.map((g) => g.id));
B.cats.forEach((c) => { if (!groupIds.has(c.group)) errors.push(c.id + ': unknown group "' + c.group + '"'); });

const STOP = new Set('the a an of in on at to is was which what who whose whom how many much does did do for by with from and or as that this its it be are were his her their name called known first which'.split(' '));
const norm = (s) => String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9؀-ۿ ]+/g, ' ').replace(/\s+/g, ' ').trim();
const toks = (s) => new Set(norm(s).split(' ').filter((w) => w && !STOP.has(w)));
const jacc = (a, b) => { let i = 0; a.forEach((x) => { if (b.has(x)) i++; }); return i / (a.size + b.size - i || 1); };

qs.forEach((q) => {
  if (![200, 400, 600].includes(q.points)) errors.push(q.id + ': invalid points ' + q.points);
  if (!q.q.en || !q.q.ar) errors.push(q.id + ': missing question text (' + (!q.q.en ? 'en' : 'ar') + ')');
  if (!q.a.en || !q.a.ar) errors.push(q.id + ': missing answer (' + (!q.a.en ? 'en' : 'ar') + ')');
  if (q.tier >= 2 && !q.ref) errors.push(q.id + ': 400/600 questions need a verification reference (r)');
  if (q.check && !q.asOf) errors.push(q.id + ': time-sensitive (c) but no asOf date');
  if (q.verified && !/^web:\d{4}-\d{2}-\d{2}$/.test(q.verified)) errors.push(q.id + ': v must look like web:YYYY-MM-DD');
  if (q.q.en && !/[?؟][”"»’']?$/.test(q.q.en.trim())) warns.push(q.id + ': English question does not end with "?"');
  if (q.q.ar && !/[?؟][”"»’']?$/.test(q.q.ar.trim())) warns.push(q.id + ': Arabic question does not end with "؟"');
  // An accepted alternative identical to the answer, or empty, is pointless.
  [...q.alt.en, ...q.alt.ar].forEach((a) => { const l = (x) => String(x || '').trim().toLowerCase(); if (!l(a) || l(a) === l(q.a.en) || l(a) === l(q.a.ar)) warns.push(q.id + ': accepted answer "' + a + '" is empty or the same as the main answer'); });
  if (q.a.en && !q.reviewed && norm(q.q.en).includes(norm(q.a.en)) && norm(q.a.en).length > 3) warns.push(q.id + ': the answer appears in the question');
});

// Exact and near duplicates (across the whole bank), skipping pairs that share a declared fact key on purpose.
const ex = new Map();
// A picture/sound question is identified by its text plus its media (the same "Which flag is this?" with different flags is fine).
const mediaKey = (q) => (q.media ? ' #' + (q.media.src || q.media.emoji || q.media.yt || '') : '');
qs.forEach((q) => { const k = norm(q.q.en) + mediaKey(q); if (ex.has(k)) errors.push('exact duplicate question: ' + ex.get(k) + ' / ' + q.id); else ex.set(k, q.id); });
const T = qs.map((q) => ({ q, t: toks(q.q.en), a: norm(q.a.en) }));
for (let i = 0; i < T.length; i++) for (let j = i + 1; j < T.length; j++) {
  const A = T[i], C = T[j];
  if (A.q.facts.some((k) => C.q.facts.includes(k))) continue;
  if (A.q.reviewed || C.q.reviewed) continue; // a person checked this pair
  if (A.q.media && C.q.media) { if (mediaKey(A.q) === mediaKey(C.q)) warns.push('same media used twice: ' + A.q.id + ' / ' + C.q.id); continue; }
  const s = jacc(A.t, C.t);
  if (s >= 0.72 || (s >= 0.45 && A.a && A.a === C.a)) warns.push('possible near-duplicate (' + s.toFixed(2) + '): ' + A.q.id + ' / ' + C.q.id);
}

// Media: the file must exist, pictures need a description, sound/clip settings must make sense.
qs.filter((q) => q.media).forEach((q) => {
  const m = q.media;
  if (m.src && !/^(https?:|idb:)/.test(m.src) && !fs.existsSync(path.join(root, m.src))) errors.push(q.id + ': media file missing: ' + m.src);
  if (m.type === 'image' && !m.alt) warns.push(q.id + ': picture has no description (alt text)');
  if (m.src && m.src.startsWith('media/') && !/^[0-9a-f]{12}$/.test(path.basename(m.src).replace(/\.[a-z0-9]+$/, ''))) warns.push(q.id + ': media file name is not neutral (could give the answer away): ' + m.src);
  if (m.type === 'video') { if (!/^[\w-]{11}$/.test(m.yt || '')) errors.push(q.id + ': clip needs a YouTube id'); if (m.end != null && !(m.end > (m.start || 0))) errors.push(q.id + ': clip end must be after start'); }
  if ((m.type === 'audio' || m.type === 'image') && !m.emoji && !m.credit) warns.push(q.id + ': media has no credit/licence');
});

// Difficulty sanity checks (heuristics for a person to review).
B.cats.forEach((c) => {
  const mine = qs.filter((q) => q.cat === c.id);
  const easyAns = new Set(mine.filter((q) => q.tier === 1).map((q) => norm(q.a.en)));
  mine.filter((q) => q.tier === 3 && !q.reviewed && easyAns.has(norm(q.a.en))).forEach((q) => warns.push(q.id + ': 600 question has the same answer as a 200 question in ' + c.id + ' — check the difficulty'));
  mine.filter((q) => q.tier === 3 && !q.reviewed && norm(q.q.en).split(' ').length < 5).forEach((q) => warns.push(q.id + ': very short 600 question — check it is really expert level'));
});

// Cultural balance: how much of the bank is about the Arab world / Middle East / Islam.
const ARAB_RE = /\b(saudi|arab|arabs|arabic|arabia|arabian|islam|islamic|muslim|muslims|mecca|makkah|medina|madinah|riyadh|jeddah|hejaz|hijazi|najd|najdi|gulf|qatar|qatari|kuwait|bahrain|oman|omani|emirati|emirates|uae|dubai|abu dhabi|yemen|yemeni|hijri|hijra|hajj|ramadan|eid|iftar|suhoor|caliph|caliphate|umayyad|abbasid|ottoman|egypt|egyptian|cairo|iraq|baghdad|damascus|syria|syrian|jordan|lebanon|lebanese|morocco|moroccan|algeria|tunisia|tunisian|levant|levantine|alula|neom|aramco|kabsa|oud|maqam)\b/i;
const isArab = (q) => { const c = B.cats.find((x) => x.id === q.cat); return (c && c.group === 'arab') || ARAB_RE.test(q.q.en + ' ' + q.a.en); };
const arabAll = qs.filter(isArab).length, arab600 = qs.filter((q) => q.points === 600 && isArab(q)).length;

// Counts.
const per = (pred) => qs.filter(pred).length;
const byTier = [200, 400, 600].map((p) => per((q) => q.points === p));
const cats = B.cats.map((c) => {
  const mine = qs.filter((q) => q.cat === c.id);
  const t = [1, 2, 3].map((x) => mine.filter((q) => q.tier === x).length);
  const subs = {}; mine.forEach((q) => { const k = q.sub || '(none)'; subs[k] = (subs[k] || 0) + 1; });
  return { id: c.id, group: c.group, name: c.name.en, total: mine.length, tiers: t, niche: mine.filter((q) => q.x).length, web: mine.filter((q) => q.verified).length, subs };
});
const subCount = cats.reduce((n, c) => n + Object.keys(c.subs).filter((k) => k !== '(none)').length, 0);
const missingTier = cats.filter((c) => c.tiers.some((n) => n === 0));
const under = cats.filter((c) => c.tiers.some((n) => n < 4)); // < 4 per tier = only one full game at 2 per value
const summary = {
  questions: qs.length, unique: ex.size, groups: B.groups.length, categories: B.cats.length, subcategories: subCount,
  byPoints: { 200: byTier[0], 400: byTier[1], 600: byTier[2] },
  niche: per((q) => q.x), webChecked: per((q) => q.verified), timeSensitive: per((q) => q.check), withRef: per((q) => q.ref),
  missingTier: missingTier.map((c) => c.id), underfilled: under.map((c) => c.id),
  errors: errors.length, warnings: warns.length,
  arabShare: { all: arabAll, pctAll: Math.round((arabAll / qs.length) * 1000) / 10, of600: arab600, pct600: Math.round((arab600 / Math.max(1, qs.filter((q) => q.points === 600).length)) * 1000) / 10 },
  byGroup: Object.fromEntries(B.groups.map((g) => [g.id, { categories: B.cats.filter((c) => c.group === g.id).length, questions: qs.filter((q) => (B.cats.find((c) => c.id === q.cat) || {}).group === g.id).length }])),
  smallest: Math.min(...cats.map((c) => c.total)),
  byType: { text: per((q) => !q.media), image: per((q) => q.media && q.media.type === 'image' && !q.media.emoji), emoji: per((q) => q.media && q.media.emoji), audio: per((q) => q.media && q.media.type === 'audio'), video: per((q) => q.media && q.media.type === 'video') },
};

if (process.argv.includes('--json')) { console.log(JSON.stringify({ summary, cats, errors, warns })); process.exit(errors.length ? 1 : 0); }

const pad = (s, n) => String(s).padEnd(n);
console.log('QUESTION BANK AUDIT');
console.log('Questions: ' + summary.questions + ' (' + summary.unique + ' unique by text) · ' + summary.categories + ' categories in ' + summary.groups + ' groups · ' + summary.subcategories + ' subcategories in use');
console.log('By points: 200 → ' + byTier[0] + ' · 400 → ' + byTier[1] + ' · 600 → ' + byTier[2]);
console.log('Extra-niche: ' + summary.niche + ' · checked online: ' + summary.webChecked + ' · time-sensitive: ' + summary.timeSensitive + ' · with a source reference: ' + summary.withRef);
console.log('Smallest category: ' + summary.smallest + ' questions');
console.log('By type: text ' + summary.byType.text + ' · pictures ' + summary.byType.image + ' · emoji puzzles ' + summary.byType.emoji + ' · sounds ' + summary.byType.audio + ' · clips ' + summary.byType.video);
console.log('Arab / Middle East / Islam related: ' + arabAll + ' (' + summary.arabShare.pctAll + '% of all) · at 600: ' + arab600 + ' (' + summary.arabShare.pct600 + '% of 600s)');
console.log('By topic group: ' + B.groups.map((g) => g.id + ' ' + summary.byGroup[g.id].questions + ' (' + summary.byGroup[g.id].categories + ' cats)').join(' · '));
console.log('');
console.log(pad('category', 22) + pad('group', 9) + pad('total', 7) + pad('200', 5) + pad('400', 5) + pad('600', 5) + pad('niche', 7) + 'online-checked');
cats.forEach((c) => console.log(pad(c.id, 22) + pad(c.group, 9) + pad(c.total, 7) + pad(c.tiers[0], 5) + pad(c.tiers[1], 5) + pad(c.tiers[2], 5) + pad(c.niche, 7) + c.web));
console.log('');
console.log('Subcategories:');
cats.forEach((c) => console.log('  ' + c.id + ': ' + Object.entries(c.subs).map(([k, n]) => k + ' ' + n).join(', ')));
console.log('');
console.log('Missing a tier: ' + (missingTier.length ? missingTier.map((c) => c.id).join(', ') : 'none'));
console.log('Underfilled (fewer than 4 questions in a tier): ' + (under.length ? under.map((c) => c.id + ' [' + c.tiers.join('/') + ']').join(', ') : 'none'));
console.log('');
console.log('ERRORS (' + errors.length + ')'); errors.forEach((e) => console.log('  ✗ ' + e));
console.log('WARNINGS (' + warns.length + ')'); warns.forEach((w) => console.log('  ! ' + w));
process.exit(errors.length ? 1 : 0);
