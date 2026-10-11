/* ============================================================
   QUESTION BANK — runtime for the data files in src/bank/.
   build.js joins src/bank/*.js (in name order) into bank.js, which
   index.html loads before app.js. The game reads window.KH_BANK.
   Question history (what's been seen) is stored separately on the device.

   Category meta: { g: group, e: emoji, en, ar, subs, pop: 1 = curated as broadly popular, niche: 1 = curated as a specialist topic }
   Writing questions (one row per question):
     ['id', points, 'Question (English)', 'السؤال (عربي)', 'Answer', 'الإجابة', { options }]
   points: 200 (easy) · 400 (hard) · 600 (brutal / expert). Nothing else is allowed.
   options (all optional):
     s:   subcategory key (from the category's subs)
     alt: other acceptable answers, English  (string or array)
     altAr: other acceptable answers, Arabic
     h / hAr: a hint the host may give
     n / nAr: a short explanation shown after the answer
     r:   where to verify it (a Wikipedia article title, or a full URL)
     v:   'web:YYYY-MM-DD' when the fact was checked online on that date
     x:   1 = extra-niche for its tier (used by Steep / Brutal / Niche settings)
     f:   fact key(s) — questions sharing a key test the same fact (or give each other away) and never share a board
     t:   tags (array)
     c:   1 = time-sensitive; must also have asOf
     asOf:'YYYY-MM' the date the answer was true
     ok:  1 = a person reviewed this question's audit warnings (same answer as an easier one, etc.)
     m:   media (picture / sound / clip questions), e.g.
            { type: 'image', src: 'media/i/xxxx.svg', alt: ['English description', 'وصف عربي'], reveal: 'zoom', focus: [0.3, 0.6], credit: '…' }
            { type: 'image', emoji: '🦁👑' }
            { type: 'audio', src: 'media/a/xxxx.mp3', credit: '…', license: 'CC0' }
            { type: 'video', yt: 'VIDEO_ID', start: 30, end: 42 }   (official uploads only; not used in the built-in bank)
          File names are neutral (hashes) so they never give the answer away.
   Question ids are permanent: never reuse or renumber them.
   ============================================================ */
(function () {
  var B = window.KH_BANK = { groups: [], cats: [], questions: [], errors: [] };
  var VALUES = { 200: 1, 400: 2, 600: 3 };
  B.group = function (id, emoji, en, ar) { B.groups.push({ id: id, emoji: emoji, name: { en: en, ar: ar } }); };
  var arr = function (v) { return v == null ? [] : Array.isArray(v) ? v : [v]; };
  B.cat = function (id, meta, rows) {
    var subs = {};
    Object.keys(meta.subs || {}).forEach(function (k) { subs[k] = { en: meta.subs[k][0], ar: meta.subs[k][1] }; });
    var c = { id: id, group: meta.g, emoji: meta.e, name: { en: meta.en, ar: meta.ar }, subs: subs, count: [0, 0, 0], popular: meta.pop ? 1 : 0, nicheTopic: meta.niche ? 1 : 0 };
    B.cats.push(c);
    addRows(c, rows);
  };
  // Add a subcategory to a category defined elsewhere.
  B.sub = function (id, key, en, ar) {
    var c = B.cats.filter(function (x) { return x.id === id; })[0];
    if (!c) { B.errors.push('sub(): unknown category "' + id + '"'); return; }
    c.subs[key] = { en: en, ar: ar };
  };
  // More questions for a category defined elsewhere (used by the top-up files).
  B.more = function (id, rows) {
    var c = B.cats.filter(function (x) { return x.id === id; })[0];
    if (!c) { B.errors.push('more(): unknown category "' + id + '"'); return; }
    addRows(c, rows);
  };
  function addRows(c, rows) {
    var id = c.id, subs = c.subs;
    rows.forEach(function (row, i) {
      var o = row[6] || {};
      var tier = VALUES[row[1]];
      var media = null;
      if (o.m) {
        media = {}; Object.keys(o.m).forEach(function (k) { media[k] = o.m[k]; });
        if (typeof media.src === 'string' && media.src.charAt(0) === '@') {
          var key = media.src.slice(1);
          media.src = (B.media || {})[key] || null;
          if (!media.src) B.errors.push(id + '.' + row[0] + ': unknown media file "' + key + '"');
        }
      }
      var q = {
        id: id + '.' + row[0], cat: id, tier: tier || 0, points: row[1], sub: o.s || null,
        q: { en: row[2], ar: row[3] }, a: { en: row[4], ar: row[5] },
        alt: { en: arr(o.alt), ar: arr(o.altAr) },
        hint: o.h || o.hAr ? { en: o.h || '', ar: o.hAr || '' } : null,
        note: o.n || o.nAr ? { en: o.n || '', ar: o.nAr || '' } : null,
        ref: o.r || null, verified: o.v || null, x: o.x ? 1 : 0,
        facts: arr(o.f), tags: arr(o.t), reviewed: o.ok ? 1 : 0, check: o.c ? 1 : 0, asOf: o.asOf || null, type: media ? media.type : 'text', media: media,
      };
      if (!tier) B.errors.push(q.id + ': points must be 200, 400 or 600 (got ' + row[1] + ')');
      if (q.sub && !subs[q.sub]) B.errors.push(q.id + ': unknown subcategory "' + q.sub + '"');
      if (o.m && ['image', 'audio', 'video'].indexOf(o.m.type) < 0) B.errors.push(q.id + ': unknown media type');
      if (o.m && o.m.type === 'image' && !o.m.src && !o.m.emoji) B.errors.push(q.id + ': picture question without a picture');
      if (o.m && o.m.type === 'audio' && !o.m.src) B.errors.push(q.id + ': sound question without a sound file');
      if (tier) c.count[tier - 1]++;
      B.questions.push(q);
    });
  }
})();
