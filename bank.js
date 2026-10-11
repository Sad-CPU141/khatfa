/* Khatfa question bank f68f06ad8e — built from src/bank/ by build.js. Edit src/bank/, not this file. */
/* ---- bank/00-runtime.js ---- */
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

/* ---- bank/01-groups.js ---- */
/* Topic groups: how categories are organised in the category browser.
   The library is international: no single country, language, religion or region is the default.
   Arab, Islamic and Middle Eastern topics have their own group alongside the others. */
KH_BANK.group('sports', '🏆', 'Sports', 'رياضة');
KH_BANK.group('screen', '🎬', 'Movies & TV', 'أفلام ومسلسلات');
KH_BANK.group('anime', '🍥', 'Anime & manga', 'أنمي ومانغا');
KH_BANK.group('games', '🎮', 'Video games', 'ألعاب فيديو');
KH_BANK.group('music', '🎵', 'Music', 'موسيقى');
KH_BANK.group('internet', '📲', 'Internet & social media', 'الإنترنت والسوشال ميديا');
KH_BANK.group('geo', '🌍', 'Geography', 'جغرافيا');
KH_BANK.group('history', '🏛️', 'History', 'تاريخ');
KH_BANK.group('science', '🔬', 'Science & tech', 'علوم وتقنية');
KH_BANK.group('nature', '🐾', 'Animals & nature', 'حيوانات وطبيعة');
KH_BANK.group('food', '🍽️', 'Food & drink', 'أكل ومشروبات');
KH_BANK.group('brands', '🏷️', 'Brands & everyday life', 'ماركات وحياة يومية');
KH_BANK.group('lang', '🔤', 'Language & words', 'لغة وكلمات');
KH_BANK.group('arab', '🌙', 'Arab world & Islam', 'العالم العربي والإسلام');

/* ---- bank/02-media.js ---- */
/* Built-in media files, generated by tools/media.js — do not edit by hand.
   Questions refer to them as m.src = '@key'. File names are content hashes. */
KH_BANK.media = {
 "flag-ar": "media/i/5d7c8b15a1de.svg",
 "flag-bn": "media/i/2bb144c8ffab.svg",
 "flag-br": "media/i/fe13ea2d451c.svg",
 "flag-bz": "media/i/3aa15f93c741.svg",
 "flag-cn": "media/i/519f09953a30.svg",
 "flag-de": "media/i/e62cbf4ceac3.svg",
 "flag-fr": "media/i/a924da2ea821.svg",
 "flag-gb": "media/i/ca2de427aa73.svg",
 "flag-gr": "media/i/be012ab5e7b9.svg",
 "flag-in": "media/i/2722bd2cd9db.svg",
 "flag-it": "media/i/79c15381898d.svg",
 "flag-jm": "media/i/612fa9417e36.svg",
 "flag-ke": "media/i/6c7881a74d0c.svg",
 "flag-kg": "media/i/9632b496a0ac.svg",
 "flag-ki": "media/i/8be5e89d699a.svg",
 "flag-kz": "media/i/59212f5e7539.svg",
 "flag-lk": "media/i/e1a48ef9374f.svg",
 "flag-mn": "media/i/ce096efd452c.svg",
 "flag-ng": "media/i/e11f07adbe04.svg",
 "flag-np": "media/i/ba9af8de9057.svg",
 "flag-om": "media/i/e59c17ae357b.svg",
 "flag-pt": "media/i/3b1326de5a40.svg",
 "flag-sc": "media/i/0005213e8a31.svg",
 "flag-se": "media/i/2351c1b04235.svg",
 "flag-sz": "media/i/21f51b1bef06.svg",
 "flag-vn": "media/i/096016dcd9ae.svg",
 "flag-za": "media/i/13bdb8604a36.svg",
 "hl-bf": "media/i/d313a9bd65da.svg",
 "hl-ca": "media/i/c15abf93f35d.svg",
 "hl-es": "media/i/1a87dbc7ae3e.svg",
 "hl-et": "media/i/310e4bc0ef47.svg",
 "hl-ng": "media/i/25e7eb04c40c.svg",
 "hl-om": "media/i/d78f3b6d37af.svg",
 "hl-pe": "media/i/d2f00c96f76e.svg",
 "hl-pl": "media/i/41449d35ff61.svg",
 "hl-py": "media/i/8890bfeb2822.svg",
 "hl-th": "media/i/247a011dcba6.svg",
 "hl-tm": "media/i/81c070113407.svg",
 "hl-ua": "media/i/4fd8a3345c5e.svg",
 "shape-au": "media/i/cd1d7f0a3cc1.svg",
 "shape-bo": "media/i/9c002e7189a3.svg",
 "shape-cl": "media/i/28d0bf97e9fc.svg",
 "shape-cu": "media/i/40763ff32b30.svg",
 "shape-cy": "media/i/93a481a86c64.svg",
 "shape-eg": "media/i/067d7c4d86e0.svg",
 "shape-gb": "media/i/27ad56c67755.svg",
 "shape-in": "media/i/a4a6df1eb3c5.svg",
 "shape-is": "media/i/f8d712f984f0.svg",
 "shape-it": "media/i/33f61ea551a8.svg",
 "shape-jp": "media/i/a575c4d0cbcf.svg",
 "shape-la": "media/i/8b9102f43929.svg",
 "shape-mg": "media/i/03ce67294111.svg",
 "shape-mn": "media/i/1066d88ae68a.svg",
 "shape-mw": "media/i/1858f8da9717.svg",
 "shape-no": "media/i/08a75f34cf24.svg",
 "snd-a440": "media/a/7d8fe7dc209a.mp3",
 "snd-beats": "media/a/2f6bd9c1e46a.mp3",
 "snd-cat": "media/a/5f7bcf290230.mp3",
 "snd-cello": "media/a/7b648a2713f5.mp3",
 "snd-chiptune": "media/a/075c378e122f.mp3",
 "snd-clock": "media/a/454d41213dd5.mp3",
 "snd-dialtone": "media/a/d339215c1eaa.mp3",
 "snd-dice": "media/a/1b4f9d854aa5.mp3",
 "snd-doppler": "media/a/3c2eab98fb3a.mp3",
 "snd-heart": "media/a/7d00723c0015.mp3",
 "snd-morse-sos": "media/a/b0773dc07af3.mp3",
 "snd-mosquito": "media/a/13a9d78f7887.mp3",
 "snd-pizzicato": "media/a/ceac912f4d5f.mp3",
 "snd-rubik": "media/a/ba67a6c05adf.mp3",
 "snd-sax": "media/a/a509ab732bd1.mp3",
 "snd-shepard": "media/a/c2d235703f3b.mp3",
 "snd-slidewhistle": "media/a/0d82de22913f.mp3",
 "snd-sonar": "media/a/db99731fc53d.mp3",
 "snd-steelpan": "media/a/cca047031ff9.mp3",
 "snd-typing": "media/a/d1d4df6bc126.mp3",
 "snd-vinyl": "media/a/f9b0bfae3c2a.mp3"
};

/* ---- bank/10-sports-football.js ---- */
/* Sports — football. 200 easy · 400 hard · 600 brutal. r = where to verify (Wikipedia article). */
KH_BANK.cat('fb-clubs', { g: 'sports', pop: 1, e: '⚽', en: 'Football: Clubs & Trophies', ar: 'كرة القدم: أندية وبطولات',
  subs: { clubs: ['Clubs', 'أندية'], stadiums: ['Stadiums', 'ملاعب'], europe: ['European finals', 'نهائيات أوروبية'], world: ['Around the world', 'حول العالم'] } }, [
  ['e01', 200, 'Which Spanish club plays its home games at the Santiago Bernabéu?', 'أي نادٍ إسباني يلعب على ملعب سانتياغو برنابيو؟', 'Real Madrid', 'ريال مدريد', { s: 'stadiums', r: 'Santiago Bernabéu Stadium' }],
  ['e02', 200, 'Which English club is nicknamed "The Red Devils"?', 'أي نادٍ إنجليزي يُلقّب بـ«الشياطين الحمر»؟', 'Manchester United', 'مانشستر يونايتد', { s: 'clubs', alt: ['Man United', 'Man Utd'], r: 'Manchester United F.C.' }],
  ['e03', 200, 'What is the name of FC Barcelona’s famous home stadium?', 'ما اسم ملعب نادي برشلونة الشهير؟', 'Camp Nou', 'كامب نو', { s: 'stadiums', alt: ['Spotify Camp Nou'], r: 'Camp Nou' }],
  ['e04', 200, 'Which Italian club is nicknamed "The Old Lady" (La Vecchia Signora)?', 'أي نادٍ إيطالي يُلقّب بـ«السيدة العجوز»؟', 'Juventus', 'يوفنتوس', { s: 'clubs', r: 'Juventus FC' }],
  ['e05', 200, 'Which German club plays at the Allianz Arena in Munich?', 'أي نادٍ ألماني يلعب على ملعب أليانز أرينا في ميونخ؟', 'Bayern Munich', 'بايرن ميونخ', { s: 'stadiums', alt: ['FC Bayern'], r: 'Allianz Arena' }],
  ['e06', 200, '"El Clásico" is the rivalry between Real Madrid and which club?', '«الكلاسيكو» هو مواجهة ريال مدريد ضد أي نادٍ؟', 'Barcelona', 'برشلونة', { s: 'clubs', r: 'El Clásico' }],
  ['e07', 200, 'AC Milan and Inter Milan share which famous stadium?', 'أي ملعب شهير يتشاركه ميلان وإنتر ميلان؟', 'San Siro', 'سان سيرو', { s: 'stadiums', alt: ['Stadio Giuseppe Meazza'], altAr: ['جوزيبي مياتزا'], r: 'San Siro' }],
  ['h01', 400, 'Which club won the very first European Cup, in 1956?', 'أي نادٍ فاز بأول كأس أوروبية للأندية الأبطال عام ١٩٥٦؟', 'Real Madrid', 'ريال مدريد', { s: 'europe', n: 'They beat Stade de Reims 4–3 in Paris.', nAr: 'فاز على ستاد دو ريمس ٤–٣ في باريس.', r: '1956 European Cup final' }],
  ['h02', 400, 'Which Scottish club became the first British team to win the European Cup, in 1967?', 'أي نادٍ إسكتلندي أصبح أول فريق بريطاني يفوز بكأس أوروبا عام ١٩٦٧؟', 'Celtic', 'سلتيك', { s: 'europe', n: 'The team is remembered as the "Lisbon Lions".', nAr: 'يُعرف ذلك الفريق باسم «أسود لشبونة».', r: '1967 European Cup final' }],
  ['h03', 400, 'Which German club plays at Signal Iduna Park, known for its huge "Yellow Wall" stand?', 'أي نادٍ ألماني يلعب على ملعب سيغنال إيدونا بارك المشهور بـ«الجدار الأصفر»؟', 'Borussia Dortmund', 'بوروسيا دورتموند', { s: 'stadiums', alt: ['Dortmund', 'BVB'], r: 'Westfalenstadion' }],
  ['h04', 400, 'What was the name of Arsenal’s stadium before they moved to the Emirates in 2006?', 'ما اسم ملعب أرسنال قبل انتقاله إلى ملعب الإمارات عام ٢٠٠٦؟', 'Highbury', 'هايبري', { s: 'stadiums', r: 'Arsenal Stadium' }],
  ['h05', 400, 'Which Portuguese club is nicknamed "the Eagles" and plays at the Estádio da Luz?', 'أي نادٍ برتغالي يُلقّب بـ«النسور» ويلعب على ملعب النور (دا لوز)؟', 'Benfica', 'بنفيكا', { s: 'clubs', r: 'S.L. Benfica' }],
  ['h06', 400, 'Which Dutch club won the European Cup three years in a row, from 1971 to 1973?', 'أي نادٍ هولندي فاز بكأس أوروبا ثلاث مرات متتالية من ١٩٧١ إلى ١٩٧٣؟', 'Ajax', 'أياكس', { s: 'europe', r: 'AFC Ajax' }],
  ['h07', 400, 'In which city is La Bombonera, the home of Boca Juniors?', 'في أي مدينة يقع ملعب «لا بومبونيرا» معقل بوكا جونيورز؟', 'Buenos Aires', 'بوينس آيرس', { s: 'world', r: 'La Bombonera' }],
  ['x01', 600, 'Which Romanian club won the 1986 European Cup, beating Barcelona on penalties?', 'أي نادٍ روماني فاز بكأس أوروبا ١٩٨٦ على برشلونة بركلات الترجيح؟', 'Steaua Bucharest', 'ستيوا بوخارست', { s: 'europe', x: 1, alt: ['FCSB', 'Steaua București'], n: 'Goalkeeper Helmuth Duckadam saved all four Barcelona penalties he faced.', nAr: 'الحارس هيلموت دوكادام صدّ كل ركلات برشلونة الأربع.', r: '1986 European Cup final' }],
  ['x02', 600, 'Which club did Nottingham Forest beat in the 1979 European Cup final?', 'أي نادٍ هزمه نوتنغهام فورست في نهائي كأس أوروبا ١٩٧٩؟', 'Malmö FF', 'مالمو', { s: 'europe', x: 1, alt: ['Malmö', 'Malmo'], r: '1979 European Cup final' }],
  ['x03', 600, 'Which English club won the 1982 European Cup, beating Bayern Munich 1–0 in Rotterdam?', 'أي نادٍ إنجليزي فاز بكأس أوروبا ١٩٨٢ على بايرن ميونخ ١–٠ في روتردام؟', 'Aston Villa', 'أستون فيلا', { s: 'europe', r: '1982 European Cup final' }],
  ['x04', 600, 'Which club did Marseille beat in the 1993 Champions League final?', 'أي نادٍ هزمه مرسيليا في نهائي دوري أبطال أوروبا ١٩٩٣؟', 'AC Milan', 'إيه سي ميلان', { s: 'europe', f: 'ucl-1993', alt: ['Milan'], altAr: ['ميلان'], n: 'Basile Boli scored the only goal.', nAr: 'سجّل بازيل بولي هدف المباراة الوحيد.', r: '1993 UEFA Champions League final' }],
  ['x05', 600, 'Which Uruguayan club won the first Copa Libertadores, in 1960?', 'أي نادٍ أوروغواياني فاز بأول نسخة من كأس ليبرتادوريس عام ١٩٦٠؟', 'Peñarol', 'بينارول', { s: 'world', x: 1, alt: ['Penarol'], r: '1960 Copa de Campeones de América' }],
  ['x06', 600, 'Which Yugoslav club won the 1991 European Cup, beating Marseille on penalties in Bari?', 'أي نادٍ يوغوسلافي فاز بكأس أوروبا ١٩٩١ على مرسيليا بركلات الترجيح في باري؟', 'Red Star Belgrade', 'النجم الأحمر بلغراد', { s: 'europe', x: 1, alt: ['Crvena zvezda'], altAr: ['ريد ستار'], r: '1991 European Cup final' }],
]);

KH_BANK.cat('fb-players', { g: 'sports', pop: 1, e: '🌟', en: 'Football: Players & Legends', ar: 'كرة القدم: لاعبون وأساطير',
  subs: { legends: ['Legends', 'أساطير'], awards: ['Ballon d’Or', 'الكرة الذهبية'], careers: ['Careers & transfers', 'مسيرات وانتقالات'] } }, [
  ['e01', 200, 'Which country did Pelé play for?', 'لأي منتخب لعب بيليه؟', 'Brazil', 'البرازيل', { s: 'legends', r: 'Pelé' }],
  ['e02', 200, 'Cristiano Ronaldo plays for which national team?', 'لأي منتخب يلعب كريستيانو رونالدو؟', 'Portugal', 'البرتغال', { s: 'legends', r: 'Cristiano Ronaldo' }],
  ['e03', 200, 'Which Argentine captain lifted the 2022 World Cup?', 'أي قائد أرجنتيني رفع كأس العالم ٢٠٢٢؟', 'Lionel Messi', 'ليونيل ميسي', { s: 'legends', alt: ['Messi'], altAr: ['ميسي'], r: '2022 FIFA World Cup final' }],
  ['e04', 200, 'Which Egyptian forward joined Liverpool from Roma in 2017?', 'أي مهاجم مصري انتقل من روما إلى ليفربول عام ٢٠١٧؟', 'Mohamed Salah', 'محمد صلاح', { s: 'careers', alt: ['Salah'], altAr: ['صلاح'], r: 'Mohamed Salah' }],
  ['e05', 200, 'Which French midfielder headbutted Marco Materazzi in the 2006 World Cup final?', 'أي لاعب وسط فرنسي نطح ماركو ماتيراتزي في نهائي كأس العالم ٢٠٠٦؟', 'Zinedine Zidane', 'زين الدين زيدان', { s: 'legends', alt: ['Zidane'], altAr: ['زيدان'], r: '2006 FIFA World Cup final' }],
  ['e06', 200, 'Which French striker, nicknamed "Titi", is Arsenal’s all-time top scorer?', 'أي مهاجم فرنسي يُلقّب «تيتي» هو الهداف التاريخي لأرسنال؟', 'Thierry Henry', 'تييري هنري', { s: 'legends', alt: ['Henry'], altAr: ['هنري'], r: 'Thierry Henry' }],
  ['h01', 400, 'Who won the 2007 Ballon d’Or, the last winner before Messi and Ronaldo’s long run?', 'من فاز بالكرة الذهبية ٢٠٠٧، آخر فائز قبل سيطرة ميسي ورونالدو الطويلة؟', 'Kaká', 'كاكا', { s: 'awards', alt: ['Ricardo Kaká'], r: '2007 Ballon d\'Or' }],
  ['h02', 400, 'Which Dutch legend gave his name to a famous "turn" first seen at the 1974 World Cup?', 'أي أسطورة هولندي سُمّيت باسمه حركة «الالتفاف» الشهيرة في كأس العالم ١٩٧٤؟', 'Johan Cruyff', 'يوهان كرويف', { s: 'legends', alt: ['Cruyff'], altAr: ['كرويف'], r: 'Cruyff turn' }],
  ['h03', 400, 'Which Croatian midfielder won the 2018 Ballon d’Or?', 'أي لاعب وسط كرواتي فاز بالكرة الذهبية ٢٠١٨؟', 'Luka Modrić', 'لوكا مودريتش', { s: 'awards', alt: ['Modric'], altAr: ['مودريتش'], r: '2018 Ballon d\'Or' }],
  ['h04', 400, 'At which club did Zlatan Ibrahimović begin his professional career?', 'في أي نادٍ بدأ زلاتان إبراهيموفيتش مسيرته الاحترافية؟', 'Malmö FF', 'مالمو', { s: 'careers', alt: ['Malmö', 'Malmo'], r: 'Zlatan Ibrahimović' }],
  ['h05', 400, 'Which English striker scored a hat-trick in the 1966 World Cup final?', 'أي مهاجم إنجليزي سجّل ثلاثية في نهائي كأس العالم ١٩٦٦؟', 'Geoff Hurst', 'جيف هيرست', { s: 'legends', r: '1966 FIFA World Cup final' }],
  ['h06', 400, 'Which Portuguese club did Cristiano Ronaldo leave to join Manchester United in 2003?', 'من أي نادٍ برتغالي انتقل كريستيانو رونالدو إلى مانشستر يونايتد عام ٢٠٠٣؟', 'Sporting CP', 'سبورتينغ لشبونة', { s: 'careers', alt: ['Sporting Lisbon', 'Sporting'], r: 'Cristiano Ronaldo' }],
  ['h07', 400, 'Which German defender, nicknamed "Der Kaiser", captained West Germany to the 1974 World Cup?', 'أي مدافع ألماني يُلقّب «القيصر» قاد ألمانيا الغربية للفوز بكأس العالم ١٩٧٤؟', 'Franz Beckenbauer', 'فرانز بيكنباور', { s: 'legends', alt: ['Beckenbauer'], altAr: ['بيكنباور'], r: 'Franz Beckenbauer' }],
  ['x01', 600, 'Who won the first-ever Ballon d’Or, in 1956?', 'من فاز بأول كرة ذهبية في التاريخ عام ١٩٥٦؟', 'Stanley Matthews', 'ستانلي ماثيوز', { s: 'awards', x: 1, r: '1956 Ballon d\'Or' }],
  ['x02', 600, 'George Weah, the only African to win the Ballon d’Or, later became president of which country?', 'جورج ويا، الأفريقي الوحيد الفائز بالكرة الذهبية، أصبح لاحقاً رئيساً لأي دولة؟', 'Liberia', 'ليبيريا', { s: 'awards', r: 'George Weah' }],
  ['x03', 600, 'Who scored four goals in Real Madrid’s 7–3 European Cup final win over Eintracht Frankfurt in 1960?', 'من سجّل أربعة أهداف في فوز ريال مدريد ٧–٣ على آينتراخت فرانكفورت في نهائي كأس أوروبا ١٩٦٠؟', 'Ferenc Puskás', 'فيرينتس بوشكاش', { s: 'legends', x: 1, alt: ['Puskás', 'Puskas'], altAr: ['بوشكاش'], r: '1960 European Cup final' }],
  ['x04', 600, 'Which Northern Irish winger won the 1968 Ballon d’Or?', 'أي جناح من أيرلندا الشمالية فاز بالكرة الذهبية ١٩٦٨؟', 'George Best', 'جورج بست', { s: 'awards', r: '1968 Ballon d\'Or' }],
  ['x05', 600, 'Which Dynamo Kyiv striker won the 1975 Ballon d’Or?', 'أي مهاجم من دينامو كييف فاز بالكرة الذهبية ١٩٧٥؟', 'Oleg Blokhin', 'أوليغ بلوخين', { s: 'awards', x: 1, alt: ['Blokhin'], r: '1975 Ballon d\'Or' }],
  ['x06', 600, 'Who is the only goalkeeper ever to win the Ballon d’Or?', 'من هو الحارس الوحيد الذي فاز بالكرة الذهبية؟', 'Lev Yashin', 'ليف ياشين', { s: 'awards', n: 'He won it in 1963.', nAr: 'فاز بها عام ١٩٦٣.', r: 'Lev Yashin' }],
]);

KH_BANK.cat('fb-worldcup', { g: 'sports', pop: 1, e: '🏆', en: 'World Cup', ar: 'كأس العالم',
  subs: { winners: ['Winners & hosts', 'أبطال ومستضيفون'], moments: ['Famous moments', 'لحظات شهيرة'], records: ['Records', 'أرقام قياسية'] } }, [
  ['e01', 200, 'Which country has won the most men’s World Cups?', 'أي دولة فازت بأكبر عدد من كؤوس العالم للرجال؟', 'Brazil', 'البرازيل', { s: 'records', n: 'Five titles: 1958, 1962, 1970, 1994 and 2002.', nAr: 'خمسة ألقاب: ١٩٥٨، ١٩٦٢، ١٩٧٠، ١٩٩٤، ٢٠٠٢.', r: 'FIFA World Cup' }],
  ['e02', 200, 'Which country hosted the 2022 World Cup?', 'أي دولة استضافت كأس العالم ٢٠٢٢؟', 'Qatar', 'قطر', { s: 'winners', r: '2022 FIFA World Cup' }],
  ['e03', 200, 'Which country won the 2022 World Cup?', 'أي دولة فازت بكأس العالم ٢٠٢٢؟', 'Argentina', 'الأرجنتين', { s: 'winners', r: '2022 FIFA World Cup final' }],
  ['e04', 200, 'Which country won the 2014 World Cup in Brazil?', 'أي دولة فازت بكأس العالم ٢٠١٤ في البرازيل؟', 'Germany', 'ألمانيا', { s: 'winners', r: '2014 FIFA World Cup final' }],
  ['e05', 200, 'How often is the men’s World Cup normally held?', 'كل كم سنة تُقام كأس العالم للرجال عادةً؟', 'Every four years', 'كل أربع سنوات', { s: 'records', r: 'FIFA World Cup' }],
  ['e06', 200, 'Which country hosted and won the first World Cup, in 1930?', 'أي دولة استضافت وفازت بأول كأس عالم عام ١٩٣٠؟', 'Uruguay', 'الأوروغواي', { s: 'winners', r: '1930 FIFA World Cup' }],
  ['e07', 200, 'Who scored the "Hand of God" goal against England in 1986?', 'من سجّل هدف «يد الله» ضد إنجلترا عام ١٩٨٦؟', 'Diego Maradona', 'دييغو مارادونا', { s: 'moments', alt: ['Maradona'], altAr: ['مارادونا'], r: 'Argentina v England (1986 FIFA World Cup)' }],
  ['h01', 400, 'Who scored the winning goal in the 2010 World Cup final?', 'من سجّل هدف الفوز في نهائي كأس العالم ٢٠١٠؟', 'Andrés Iniesta', 'أندريس إنييستا', { s: 'moments', alt: ['Iniesta'], altAr: ['إنييستا'], r: '2010 FIFA World Cup final' }],
  ['h02', 400, 'Which country did Saudi Arabia beat 2–1 in their opening match of the 2022 World Cup?', 'أي منتخب هزمته السعودية ٢–١ في مباراتها الافتتاحية بكأس العالم ٢٠٢٢؟', 'Argentina', 'الأرجنتين', { s: 'moments', f: 'ksa-arg-2022', r: 'Argentina v Saudi Arabia (2022 FIFA World Cup)' }],
  ['h03', 400, 'Who scored a hat-trick in the 2022 World Cup final but still finished on the losing side?', 'من سجّل ثلاثية في نهائي كأس العالم ٢٠٢٢ لكنه خسر النهائي؟', 'Kylian Mbappé', 'كيليان مبابي', { s: 'moments', alt: ['Mbappé', 'Mbappe'], altAr: ['مبابي'], r: '2022 FIFA World Cup final' }],
  ['h04', 400, 'Which two countries co-hosted the 2002 World Cup?', 'أي دولتين استضافتا كأس العالم ٢٠٠٢ معاً؟', 'South Korea and Japan', 'كوريا الجنوبية واليابان', { s: 'winners', r: '2002 FIFA World Cup' }],
  ['h05', 400, 'Which country won the 1998 World Cup on home soil?', 'أي دولة فازت بكأس العالم ١٩٩٨ على أرضها؟', 'France', 'فرنسا', { s: 'winners', r: '1998 FIFA World Cup final' }],
  ['h06', 400, 'In 2022, which country became the first African nation to reach a World Cup semi-final?', 'في ٢٠٢٢، أي دولة أصبحت أول منتخب أفريقي يصل إلى نصف نهائي كأس العالم؟', 'Morocco', 'المغرب', { s: 'records', r: 'Morocco at the 2022 FIFA World Cup' }],
  ['h07', 400, 'Uruguay beat which host nation in the deciding 1950 match known as the "Maracanazo"?', 'أي منتخب مستضيف هزمته الأوروغواي في المباراة الحاسمة عام ١٩٥٠ المعروفة بـ«الماراكانازو»؟', 'Brazil', 'البرازيل', { s: 'moments', r: 'Uruguay v Brazil (1950 FIFA World Cup)' }],
  ['x01', 600, 'Who scored West Germany’s winner against Hungary in the 1954 final, the "Miracle of Bern"?', 'من سجّل هدف فوز ألمانيا الغربية على المجر في نهائي ١٩٥٤ «معجزة بيرن»؟', 'Helmut Rahn', 'هيلموت ران', { s: 'moments', x: 1, r: 'Miracle of Bern' }],
  ['x02', 600, 'Which Italian striker won the Golden Boot as Italy won the 1982 World Cup?', 'أي مهاجم إيطالي فاز بالحذاء الذهبي عندما فازت إيطاليا بكأس العالم ١٩٨٢؟', 'Paolo Rossi', 'باولو روسي', { s: 'records', r: '1982 FIFA World Cup' }],
  ['x03', 600, 'Who scored the fastest goal in World Cup history, after about 11 seconds in 2002?', 'من سجّل أسرع هدف في تاريخ كأس العالم بعد نحو ١١ ثانية عام ٢٠٠٢؟', 'Hakan Şükür', 'هاكان شوكور', { s: 'records', x: 1, alt: ['Hakan Sukur'], n: 'For Turkey against South Korea, in the third-place match.', nAr: 'لتركيا ضد كوريا الجنوبية في مباراة المركز الثالث.', r: 'Hakan Şükür' }],
  ['x04', 600, 'Which French striker scored a record 13 goals at a single World Cup, in 1958?', 'أي مهاجم فرنسي سجّل رقماً قياسياً بـ١٣ هدفاً في بطولة واحدة عام ١٩٥٨؟', 'Just Fontaine', 'جوست فونتين', { s: 'records', x: 1, alt: ['Fontaine'], r: 'Just Fontaine' }],
  ['x05', 600, 'Saeed Al-Owairan scored his famous solo goal at the 1994 World Cup against which country?', 'سجّل سعيد العويران هدفه الفردي الشهير في كأس العالم ١٩٩٤ ضد أي منتخب؟', 'Belgium', 'بلجيكا', { s: 'moments', x: 1, r: 'Saeed Al-Owairan' }],
  ['x06', 600, 'In a famous 1950 upset, the USA beat which country 1–0?', 'في مفاجأة شهيرة عام ١٩٥٠، أي منتخب هزمته الولايات المتحدة ١–٠؟', 'England', 'إنجلترا', { s: 'moments', r: 'United States v England (1950 FIFA World Cup)' }],
]);

KH_BANK.cat('fb-pl', { g: 'sports', pop: 1, e: '🦁', en: 'Premier League', ar: 'الدوري الإنجليزي',
  subs: { clubs: ['Clubs', 'أندية'], records: ['Records', 'أرقام قياسية'], seasons: ['Seasons', 'مواسم'] } }, [
  ['e01', 200, 'Which London club is nicknamed "The Gunners"?', 'أي نادٍ لندني يُلقّب بـ«المدفعجية»؟', 'Arsenal', 'أرسنال', { s: 'clubs', r: 'Arsenal F.C.' }],
  ['e02', 200, 'Which club plays its home games at Anfield?', 'أي نادٍ يلعب على ملعب أنفيلد؟', 'Liverpool', 'ليفربول', { s: 'clubs', r: 'Anfield' }],
  ['e03', 200, 'Which club plays at Stamford Bridge in west London?', 'أي نادٍ يلعب على ملعب ستامفورد بريدج غرب لندن؟', 'Chelsea', 'تشيلسي', { s: 'clubs', r: 'Stamford Bridge (stadium)' }],
  ['e04', 200, 'Which Manchester club plays at the Etihad Stadium?', 'أي نادٍ من مانشستر يلعب على ملعب الاتحاد؟', 'Manchester City', 'مانشستر سيتي', { s: 'clubs', alt: ['Man City'], r: 'City of Manchester Stadium' }],
  ['e05', 200, 'Which Norwegian striker set a record of 36 Premier League goals in his first season, 2022–23?', 'أي مهاجم نرويجي سجّل رقماً قياسياً بـ٣٦ هدفاً في موسمه الأول بالدوري الإنجليزي ٢٠٢٢–٢٣؟', 'Erling Haaland', 'إرلينغ هالاند', { s: 'records', alt: ['Haaland'], altAr: ['هالاند'], r: 'Erling Haaland' }],
  ['e06', 200, 'In which year did the Premier League begin?', 'في أي عام انطلق الدوري الإنجليزي الممتاز؟', '1992', '١٩٩٢', { s: 'seasons', r: 'Premier League' }],
  ['h01', 400, 'Which club won the 2015–16 Premier League after starting the season as 5000–1 outsiders?', 'أي نادٍ فاز بالدوري الإنجليزي ٢٠١٥–١٦ رغم أن احتمالات فوزه كانت ٥٠٠٠ إلى ١؟', 'Leicester City', 'ليستر سيتي', { s: 'seasons', alt: ['Leicester'], r: '2015–16 Leicester City F.C. season' }],
  ['h02', 400, 'Arsenal went the whole 2003–04 league season unbeaten. What nickname did that team earn?', 'أرسنال لم يخسر أي مباراة في موسم ٢٠٠٣–٠٤. بماذا لُقّب ذلك الفريق؟', 'The Invincibles', 'الذين لا يُقهرون', { s: 'seasons', r: 'The Invincibles (football)' }],
  ['h03', 400, 'Who is the Premier League’s all-time top scorer, with 260 goals?', 'من الهداف التاريخي للدوري الإنجليزي الممتاز برصيد ٢٦٠ هدفاً؟', 'Alan Shearer', 'آلان شيرر', { v: 'web:2026-10-10', s: 'records', alt: ['Shearer'], c: 1, asOf: '2026-06', r: 'List of Premier League goalscorers' }],
  ['h04', 400, 'Which club won the first Premier League title, in 1992–93?', 'أي نادٍ فاز بلقب الدوري الإنجليزي الممتاز الأول ١٩٩٢–٩٣؟', 'Manchester United', 'مانشستر يونايتد', { s: 'seasons', alt: ['Man United'], r: '1992–93 FA Premier League' }],
  ['h05', 400, 'Which club, backed by owner Jack Walker, won the 1994–95 Premier League?', 'أي نادٍ مدعوم من مالكه جاك ووكر فاز بالدوري الإنجليزي ١٩٩٤–٩٥؟', 'Blackburn Rovers', 'بلاكبيرن روفرز', { s: 'seasons', alt: ['Blackburn'], r: '1994–95 FA Premier League' }],
  ['h06', 400, 'Which goalkeeper holds the Premier League record for most clean sheets?', 'أي حارس يحمل الرقم القياسي لأكثر عدد من المباريات بشباك نظيفة في الدوري الإنجليزي؟', 'Petr Čech', 'بيتر تشيك', { s: 'records', alt: ['Petr Cech', 'Cech'], c: 1, asOf: '2026-06', r: 'Petr Čech' }],
  ['h07', 400, 'Who managed Arsenal’s unbeaten 2003–04 side?', 'من كان مدرب أرسنال في موسمه بلا هزيمة ٢٠٠٣–٠٤؟', 'Arsène Wenger', 'أرسين فينغر', { s: 'seasons', alt: ['Wenger'], altAr: ['فينغر'], r: 'Arsène Wenger' }],
  ['x01', 600, 'Who scored the first-ever Premier League goal, in August 1992?', 'من سجّل أول هدف في تاريخ الدوري الإنجليزي الممتاز في أغسطس ١٩٩٢؟', 'Brian Deane', 'براين دين', { s: 'records', x: 1, n: 'For Sheffield United against Manchester United.', nAr: 'لشيفيلد يونايتد ضد مانشستر يونايتد.', r: 'Brian Deane' }],
  ['x02', 600, 'Who scored the fastest hat-trick in Premier League history, in under three minutes in 2015?', 'من سجّل أسرع ثلاثية في تاريخ الدوري الإنجليزي في أقل من ثلاث دقائق عام ٢٠١٥؟', 'Sadio Mané', 'ساديو ماني', { s: 'records', alt: ['Mané', 'Mane'], altAr: ['ماني'], n: 'For Southampton against Aston Villa.', nAr: 'لساوثهامبتون ضد أستون فيلا.', r: 'Sadio Mané' }],
  ['x03', 600, 'Which club finished the 2007–08 Premier League season with a record-low 11 points?', 'أي نادٍ أنهى موسم ٢٠٠٧–٠٨ بأقل رصيد في التاريخ: ١١ نقطة؟', 'Derby County', 'ديربي كاونتي', { s: 'seasons', alt: ['Derby'], r: '2007–08 Derby County F.C. season' }],
  ['x04', 600, 'Who scored the fastest goal in Premier League history, after 7.69 seconds in 2019?', 'من سجّل أسرع هدف في تاريخ الدوري الإنجليزي بعد ٧٫٦٩ ثانية عام ٢٠١٩؟', 'Shane Long', 'شين لونغ', { s: 'records', x: 1, n: 'For Southampton at Watford.', nAr: 'لساوثهامبتون ضد واتفورد.', r: 'Shane Long' }],
  ['x05', 600, 'Who was the first player to score five goals in a single Premier League match, in 1995?', 'من أول لاعب سجّل خمسة أهداف في مباراة واحدة بالدوري الإنجليزي عام ١٩٩٥؟', 'Andy Cole', 'آندي كول', { s: 'records', x: 1, n: 'Manchester United beat Ipswich Town 9–0.', nAr: 'فاز مانشستر يونايتد على إيبسويتش ٩–٠.', r: 'Andy Cole' }],
  ['x06', 600, 'Which club finished runners-up to Manchester United in the first Premier League season?', 'أي نادٍ حلّ وصيفاً لمانشستر يونايتد في أول موسم للدوري الإنجليزي الممتاز؟', 'Aston Villa', 'أستون فيلا', { s: 'seasons', r: '1992–93 FA Premier League' }],
]);

KH_BANK.cat('fb-ucl', { g: 'sports', pop: 1, e: '⭐', en: 'Champions League', ar: 'دوري أبطال أوروبا',
  subs: { finals: ['Finals', 'نهائيات'], records: ['Records & facts', 'أرقام وحقائق'] } }, [
  ['e01', 200, 'Which club has won the European Cup / Champions League the most times?', 'أي نادٍ فاز بكأس أوروبا / دوري الأبطال أكثر عدد من المرات؟', 'Real Madrid', 'ريال مدريد', { s: 'records', r: 'List of European Cup and UEFA Champions League finals' }],
  ['e02', 200, 'Which English club came back from 3–0 down at half-time to win the 2005 final?', 'أي نادٍ إنجليزي عاد من تأخره ٣–٠ في الشوط الأول ليفوز بنهائي ٢٠٠٥؟', 'Liverpool', 'ليفربول', { s: 'finals', f: 'ucl-2005', r: '2005 UEFA Champions League final' }],
  ['e03', 200, 'What is Europe’s second-tier club competition, after the Champions League?', 'ما البطولة الأوروبية للأندية التي تأتي بعد دوري الأبطال في المستوى؟', 'The Europa League', 'الدوري الأوروبي', { s: 'records', alt: ['UEFA Cup'], r: 'UEFA Europa League' }],
  ['e04', 200, 'Which club won the 2023 Champions League to complete a treble?', 'أي نادٍ فاز بدوري الأبطال ٢٠٢٣ وأكمل الثلاثية؟', 'Manchester City', 'مانشستر سيتي', { s: 'finals', alt: ['Man City'], r: '2023 UEFA Champions League final' }],
  ['e05', 200, 'With which club did Cristiano Ronaldo win his first Champions League, in 2008?', 'مع أي نادٍ فاز كريستيانو رونالدو بأول دوري أبطال له عام ٢٠٠٨؟', 'Manchester United', 'مانشستر يونايتد', { s: 'finals', alt: ['Man United'], r: '2008 UEFA Champions League final' }],
  ['e06', 200, 'The Champions League logo is a football made of which shapes?', 'شعار دوري أبطال أوروبا عبارة عن كرة مكوّنة من أي أشكال؟', 'Stars', 'نجوم', { s: 'records', r: 'UEFA Champions League' }],
  ['h01', 400, 'Which Italian club won the 2010 Champions League under José Mourinho?', 'أي نادٍ إيطالي فاز بدوري الأبطال ٢٠١٠ تحت قيادة جوزيه مورينيو؟', 'Inter Milan', 'إنتر ميلان', { s: 'finals', alt: ['Inter', 'Internazionale'], r: '2010 UEFA Champions League final' }],
  ['h02', 400, 'Bayern Munich beat which club 8–2 in a 2020 quarter-final?', 'بايرن ميونخ هزم أي نادٍ ٨–٢ في ربع نهائي ٢٠٢٠؟', 'Barcelona', 'برشلونة', { s: 'records', r: 'Barcelona 2–8 Bayern Munich' }],
  ['h03', 400, 'The Champions League trophy has a nickname based on its huge handles. What is it?', 'لكأس دوري الأبطال لقب بسبب مقبضيه الضخمين. ما هو؟', 'Big Ears', 'ذات الأذنين', { s: 'records', r: 'European Champion Clubs\' Cup' }],
  ['h04', 400, 'From which season did a single 36-team "league phase" replace the group stage?', 'من أي موسم استُبدل دور المجموعات بـ«مرحلة الدوري» الموحدة بـ٣٦ فريقاً؟', '2024–25', '٢٠٢٤–٢٥', { s: 'records', r: '2024–25 UEFA Champions League' }],
  ['h05', 400, 'In which city was the 2005 final, where Liverpool came back from 3–0 down?', 'في أي مدينة أُقيم نهائي ٢٠٠٥ الذي عاد فيه ليفربول من تأخره ٣–٠؟', 'Istanbul', 'إسطنبول', { s: 'finals', f: 'ucl-2005', r: '2005 UEFA Champions League final' }],
  ['h06', 400, 'Which club did Porto beat in the 2004 Champions League final?', 'أي نادٍ هزمه بورتو في نهائي دوري الأبطال ٢٠٠٤؟', 'AS Monaco', 'موناكو', { s: 'finals', alt: ['Monaco'], r: '2004 UEFA Champions League final' }],
  ['x01', 600, 'Which club won the first final played under the "Champions League" name, in 1993?', 'أي نادٍ فاز بأول نهائي يحمل اسم «دوري الأبطال» عام ١٩٩٣؟', 'Marseille', 'مرسيليا', { s: 'finals', f: 'ucl-1993', alt: ['Olympique de Marseille'], r: '1993 UEFA Champions League final' }],
  ['x02', 600, 'Which German club beat Juventus in the 1997 Champions League final?', 'أي نادٍ ألماني هزم يوفنتوس في نهائي دوري الأبطال ١٩٩٧؟', 'Borussia Dortmund', 'بوروسيا دورتموند', { s: 'finals', alt: ['Dortmund'], r: '1997 UEFA Champions League final' }],
  ['x03', 600, 'Who scored Manchester United’s stoppage-time winner in the 1999 final against Bayern Munich?', 'من سجّل هدف فوز مانشستر يونايتد في الوقت بدل الضائع بنهائي ١٩٩٩ ضد بايرن ميونخ؟', 'Ole Gunnar Solskjær', 'أولي غونار سولشاير', { s: 'finals', alt: ['Solskjaer'], altAr: ['سولشاير'], r: '1999 UEFA Champions League final' }],
  ['x04', 600, 'Who scored an overhead-kick goal for Real Madrid in the 2018 final against Liverpool?', 'من سجّل هدفاً بضربة مقصية لريال مدريد في نهائي ٢٠١٨ ضد ليفربول؟', 'Gareth Bale', 'غاريث بيل', { s: 'finals', alt: ['Bale'], altAr: ['بيل'], r: '2018 UEFA Champions League final' }],
  ['x05', 600, 'Which Liverpool goalkeeper saved Andriy Shevchenko’s penalty to win the 2005 shoot-out?', 'أي حارس لليفربول صدّ ركلة أندريه شيفتشينكو ليحسم ركلات ترجيح نهائي ٢٠٠٥؟', 'Jerzy Dudek', 'يرجي دوديك', { s: 'finals', x: 1, alt: ['Dudek'], r: '2005 UEFA Champions League final' }],
  ['x06', 600, 'Which club lost the 2014 final to Real Madrid after Sergio Ramos’s 93rd-minute equaliser?', 'أي نادٍ خسر نهائي ٢٠١٤ أمام ريال مدريد بعد تعادل سيرجيو راموس في الدقيقة ٩٣؟', 'Atlético Madrid', 'أتلتيكو مدريد', { s: 'finals', alt: ['Atletico'], r: '2014 UEFA Champions League final' }],
]);

KH_BANK.cat('fb-arab', { g: 'arab', e: '🇸🇦', en: 'Saudi & Arab Football', ar: 'الكرة السعودية والعربية',
  subs: { saudi: ['Saudi football', 'الكرة السعودية'], arab: ['Arab football', 'الكرة العربية'] } }, [
  ['e01', 200, 'Which Riyadh club did Cristiano Ronaldo join in 2023?', 'أي نادٍ في الرياض انضم إليه كريستيانو رونالدو عام ٢٠٢٣؟', 'Al Nassr', 'النصر', { s: 'saudi', r: 'Al Nassr FC' }],
  ['e02', 200, 'In which city is Al-Ittihad, the Saudi club nicknamed "the Tigers"?', 'في أي مدينة يقع نادي الاتحاد السعودي الملقّب بـ«العميد» و«النمور»؟', 'Jeddah', 'جدة', { s: 'saudi', r: 'Ittihad FC' }],
  ['e03', 200, 'Which Saudi club is nicknamed "Al-Za’eem" (the Leader)?', 'أي نادٍ سعودي يُلقّب بـ«الزعيم»؟', 'Al Hilal', 'الهلال', { s: 'saudi', r: 'Al Hilal SFC' }],
  ['e04', 200, 'Which colour is Al Hilal best known for wearing?', 'ما اللون الذي يشتهر الهلال بارتدائه؟', 'Blue', 'الأزرق', { s: 'saudi', r: 'Al Hilal SFC' }],
  ['e05', 200, 'Which country won the 2023 AFC Asian Cup (played in early 2024)?', 'أي منتخب فاز بكأس آسيا ٢٠٢٣ (التي أُقيمت مطلع ٢٠٢٤)؟', 'Qatar', 'قطر', { s: 'arab', r: '2023 AFC Asian Cup' }],
  ['e06', 200, 'Which country did Saudi Arabia famously beat 2–1 at the 2022 World Cup?', 'أي منتخب هزمته السعودية ٢–١ في كأس العالم ٢٠٢٢؟', 'Argentina', 'الأرجنتين', { s: 'saudi', f: 'ksa-arg-2022', r: 'Argentina v Saudi Arabia (2022 FIFA World Cup)' }],
  ['h01', 400, 'In which three years did Saudi Arabia win the AFC Asian Cup?', 'في أي ثلاث سنوات فاز المنتخب السعودي بكأس آسيا؟', '1984, 1988 and 1996', '١٩٨٤ و١٩٨٨ و١٩٩٦', { s: 'saudi', r: 'Saudi Arabia national football team' }],
  ['h02', 400, 'Who scored Saudi Arabia’s winning goal against Argentina at the 2022 World Cup?', 'من سجّل هدف فوز السعودية على الأرجنتين في كأس العالم ٢٠٢٢؟', 'Salem Al-Dawsari', 'سالم الدوسري', { s: 'saudi', f: 'ksa-arg-scorers', r: 'Argentina v Saudi Arabia (2022 FIFA World Cup)' }],
  ['h03', 400, 'Which Egyptian club is known in Africa as "the Club of the Century"?', 'أي نادٍ مصري يُعرف أفريقياً بـ«نادي القرن»؟', 'Al Ahly', 'الأهلي', { s: 'arab', r: 'Al Ahly SC' }],
  ['h04', 400, 'Which Moroccan goalkeeper, a 2022 World Cup star, joined Al Hilal in 2023?', 'أي حارس مغربي تألق في كأس العالم ٢٠٢٢ وانضم إلى الهلال عام ٢٠٢٣؟', 'Yassine Bounou', 'ياسين بونو', { s: 'arab', alt: ['Bono', 'Bounou'], altAr: ['بونو'], r: 'Yassine Bounou' }],
  ['h05', 400, 'Which country won the 2021 FIFA Arab Cup in Qatar?', 'أي منتخب فاز بكأس العرب ٢٠٢١ في قطر؟', 'Algeria', 'الجزائر', { s: 'arab', r: '2021 FIFA Arab Cup' }],
  ['h06', 400, 'Which Jeddah stadium is nicknamed "Al-Jawhara" (the Jewel)?', 'أي ملعب في جدة يُلقّب بـ«الجوهرة»؟', 'King Abdullah Sports City', 'مدينة الملك عبدالله الرياضية', { s: 'saudi', r: 'King Abdullah Sports City' }],
  ['h07', 400, 'Who coached Morocco to the 2022 World Cup semi-finals?', 'من درّب المغرب حتى نصف نهائي كأس العالم ٢٠٢٢؟', 'Walid Regragui', 'وليد الركراكي', { s: 'arab', alt: ['Regragui'], altAr: ['الركراكي'], r: 'Walid Regragui' }],
  ['x01', 600, 'Who scored Saudi Arabia’s equaliser against Argentina at the 2022 World Cup?', 'من سجّل هدف التعادل للسعودية ضد الأرجنتين في كأس العالم ٢٠٢٢؟', 'Saleh Al-Shehri', 'صالح الشهري', { s: 'saudi', x: 1, f: 'ksa-arg-scorers', ok: 1, r: 'Argentina v Saudi Arabia (2022 FIFA World Cup)' }],
  ['x02', 600, 'In which year did Saudi Arabia play at its first men’s World Cup?', 'في أي عام شاركت السعودية في أول كأس عالم لها؟', '1994', '١٩٩٤', { s: 'saudi', r: 'Saudi Arabia at the FIFA World Cup' }],
  ['x03', 600, 'Saudi striking legend Majed Abdullah spent his club career at which team?', 'أسطورة الهجوم السعودي ماجد عبدالله قضى مسيرته مع أي نادٍ؟', 'Al Nassr', 'النصر', { s: 'saudi', x: 1, ok: 1, r: 'Majed Abdullah' }],
  ['x04', 600, 'Which country won the first Arabian Gulf Cup, in 1970?', 'أي منتخب فاز بأول كأس خليج عربي عام ١٩٧٠؟', 'Kuwait', 'الكويت', { s: 'arab', x: 1, r: '1st Arabian Gulf Cup' }],
  ['x05', 600, 'Who set a single-tournament record with nine goals at the 2019 AFC Asian Cup?', 'من سجّل رقماً قياسياً بتسعة أهداف في بطولة واحدة بكأس آسيا ٢٠١٩؟', 'Almoez Ali', 'المعز علي', { s: 'arab', x: 1, r: 'Almoez Ali' }],
  ['x06', 600, 'Which country won the 2019 AFC Asian Cup, beating Japan 3–1 in the final?', 'أي منتخب فاز بكأس آسيا ٢٠١٩ بعد فوزه على اليابان ٣–١ في النهائي؟', 'Qatar', 'قطر', { s: 'arab', ok: 1, r: '2019 AFC Asian Cup final' }],
]);

/* ---- bank/11-sports-other.js ---- */
/* Sports — beyond football. */
KH_BANK.cat('basketball', { g: 'sports', pop: 1, e: '🏀', en: 'NBA & Basketball', ar: 'كرة السلة والـNBA',
  subs: { teams: ['Teams', 'فرق'], players: ['Players', 'لاعبون'], history: ['History & records', 'تاريخ وأرقام'] } }, [
  ['e01', 200, 'With which NBA team did Michael Jordan win six championships?', 'مع أي فريق فاز مايكل جوردن بستة ألقاب في الـNBA؟', 'Chicago Bulls', 'شيكاغو بولز', { s: 'teams', alt: ['the Bulls'], r: 'Michael Jordan' }],
  ['e02', 200, 'Which NBA star is nicknamed "King James"?', 'أي نجم في الـNBA يُلقّب بـ«الملك جيمس»؟', 'LeBron James', 'ليبرون جيمس', { s: 'players', alt: ['LeBron'], r: 'LeBron James' }],
  ['e03', 200, 'How many points is a basket from behind the arc worth?', 'كم نقطة تُحسب للتسديدة من خلف القوس؟', 'Three', 'ثلاث نقاط', { s: 'history', alt: ['3'], r: 'Three-point field goal' }],
  ['e04', 200, 'In which city are the Lakers based?', 'في أي مدينة يقع فريق ليكرز؟', 'Los Angeles', 'لوس أنجلوس', { s: 'teams', alt: ['LA'], r: 'Los Angeles Lakers' }],
  ['e05', 200, 'Which Golden State Warriors guard, number 30, is famous for his three-point shooting?', 'أي لاعب في غولدن ستيت ووريرز يرتدي الرقم ٣٠ ويشتهر بالتسديد الثلاثي؟', 'Stephen Curry', 'ستيفن كاري', { s: 'players', alt: ['Steph Curry', 'Curry'], r: 'Stephen Curry' }],
  ['e06', 200, 'Giannis Antetokounmpo, "the Greek Freak", plays for which country’s national team?', 'يانيس أنتيتوكونمبو «الوحش اليوناني» يلعب لأي منتخب؟', 'Greece', 'اليونان', { s: 'players', r: 'Giannis Antetokounmpo' }],
  ['h01', 400, 'Who scored 100 points in a single NBA game, in 1962?', 'من سجّل ١٠٠ نقطة في مباراة واحدة بالـNBA عام ١٩٦٢؟', 'Wilt Chamberlain', 'ويلت تشامبرلين', { s: 'history', alt: ['Chamberlain'], r: 'Wilt Chamberlain\'s 100-point game' }],
  ['h02', 400, 'Which team drafted Kobe Bryant in 1996 before trading him to the Lakers?', 'أي فريق اختار كوبي براينت في درافت ١٩٩٦ ثم بادله إلى ليكرز؟', 'Charlotte Hornets', 'شارلوت هورنتس', { s: 'teams', alt: ['the Hornets'], r: 'Kobe Bryant' }],
  ['h03', 400, 'At which Olympics did the original US "Dream Team" play?', 'في أي دورة أولمبية شارك «فريق الأحلام» الأمريكي الأصلي؟', 'Barcelona 1992', 'برشلونة ١٩٩٢', { s: 'history', r: '1992 United States men\'s Olympic basketball team' }],
  ['h04', 400, 'Which Canadian team won the 2019 NBA championship?', 'أي فريق كندي فاز ببطولة الـNBA عام ٢٠١٩؟', 'Toronto Raptors', 'تورونتو رابتورز', { s: 'teams', alt: ['the Raptors'], r: '2019 NBA Finals' }],
  ['h05', 400, 'Which franchise has won the most NBA championships?', 'أي فريق فاز بأكبر عدد من ألقاب الـNBA؟', 'Boston Celtics', 'بوسطن سلتيكس', { v: 'web:2026-10-10', s: 'teams', alt: ['the Celtics'], c: 1, asOf: '2026-06', n: '18 titles, one more than the Lakers.', nAr: '١٨ لقباً، بفارق لقب واحد عن ليكرز.', r: 'List of NBA champions' }],
  ['h06', 400, 'Who invented basketball, in 1891?', 'من اخترع كرة السلة عام ١٨٩١؟', 'James Naismith', 'جيمس نايسميث', { s: 'history', alt: ['Naismith'], r: 'James Naismith' }],
  ['x01', 600, 'Which player was drafted first overall in 1984, two places ahead of Michael Jordan?', 'أي لاعب اختير أولاً في درافت ١٩٨٤، قبل مايكل جوردن بمركزين؟', 'Hakeem Olajuwon', 'حكيم أولاجوان', { s: 'history', alt: ['Olajuwon'], r: '1984 NBA draft' }],
  ['x02', 600, 'Which Canadian-raised point guard won back-to-back NBA MVP awards in 2005 and 2006?', 'أي صانع ألعاب نشأ في كندا فاز بجائزة أفضل لاعب في الـNBA عامي ٢٠٠٥ و٢٠٠٦؟', 'Steve Nash', 'ستيف ناش', { s: 'players', r: 'Steve Nash' }],
  ['x03', 600, 'The Seattle SuperSonics moved in 2008 and became which team?', 'فريق سياتل سوبرسونيكس انتقل عام ٢٠٠٨ وأصبح أي فريق؟', 'Oklahoma City Thunder', 'أوكلاهوما سيتي ثاندر', { s: 'teams', alt: ['the Thunder', 'OKC'], r: 'Seattle SuperSonics' }],
  ['x04', 600, 'Who holds the record for most career assists in NBA history?', 'من يحمل الرقم القياسي لأكثر عدد من التمريرات الحاسمة في تاريخ الـNBA؟', 'John Stockton', 'جون ستوكتون', { s: 'history', x: 1, c: 1, asOf: '2026-06', r: 'List of NBA career assists leaders' }],
  ['x05', 600, 'Who recorded the first officially recognised quadruple-double in NBA history, in 1974?', 'من سجّل أول «كوادروبل دبل» معترف به رسمياً في تاريخ الـNBA عام ١٩٧٤؟', 'Nate Thurmond', 'نيت ثورموند', { s: 'history', x: 1, r: 'Quadruple-double' }],
  ['x06', 600, 'Who was named Finals MVP when Toronto won the 2019 NBA title?', 'من نال جائزة أفضل لاعب في النهائيات عندما فاز تورونتو بلقب ٢٠١٩؟', 'Kawhi Leonard', 'كاواي ليونارد', { s: 'players', r: '2019 NBA Finals' }],
]);

KH_BANK.cat('f1', { g: 'sports', pop: 1, e: '🏎️', en: 'Formula 1', ar: 'فورمولا ١',
  subs: { drivers: ['Drivers', 'سائقون'], teams: ['Teams', 'فرق'], tracks: ['Circuits', 'حلبات'] } }, [
  ['e01', 200, 'Which F1 team races in red and uses a prancing horse as its badge?', 'أي فريق فورمولا ١ يتسابق باللون الأحمر وشعاره حصان جامح؟', 'Ferrari', 'فيراري', { s: 'teams', r: 'Scuderia Ferrari' }],
  ['e02', 200, 'Which British driver won seven world titles with McLaren and Mercedes?', 'أي سائق بريطاني فاز بسبعة ألقاب عالمية مع ماكلارين ومرسيدس؟', 'Lewis Hamilton', 'لويس هاميلتون', { s: 'drivers', alt: ['Hamilton'], r: 'Lewis Hamilton' }],
  ['e03', 200, 'Which Dutch driver won his first world title in 2021?', 'أي سائق هولندي فاز بأول لقب عالمي له عام ٢٠٢١؟', 'Max Verstappen', 'ماكس فيرستابن', { s: 'drivers', alt: ['Verstappen'], r: 'Max Verstappen' }],
  ['e04', 200, 'Which famous Grand Prix is raced through the streets of a tiny country known for its casino?', 'أي سباق جائزة كبرى شهير يُقام في شوارع دولة صغيرة تشتهر بالكازينو؟', 'Monaco Grand Prix', 'جائزة موناكو الكبرى', { s: 'tracks', alt: ['Monaco'], r: 'Monaco Grand Prix' }],
  ['e05', 200, 'Which German driver won seven titles, five of them in a row with Ferrari?', 'أي سائق ألماني فاز بسبعة ألقاب، خمسة منها متتالية مع فيراري؟', 'Michael Schumacher', 'مايكل شوماخر', { s: 'drivers', alt: ['Schumacher'], r: 'Michael Schumacher' }],
  ['e06', 200, 'How many points does the winner of an F1 race receive?', 'كم نقطة يحصل عليها الفائز بسباق فورمولا ١؟', '25', '٢٥', { s: 'teams', r: 'List of Formula One World Championship points scoring systems' }],
  ['h01', 400, 'Which Brazilian three-time world champion died at Imola in 1994?', 'أي بطل عالم برازيلي ثلاث مرات توفي في حلبة إيمولا عام ١٩٩٤؟', 'Ayrton Senna', 'أيرتون سينا', { s: 'drivers', alt: ['Senna'], r: 'Ayrton Senna' }],
  ['h02', 400, 'Which country hosts F1’s night race around Marina Bay?', 'أي دولة تستضيف السباق الليلي حول مارينا باي؟', 'Singapore', 'سنغافورة', { s: 'tracks', r: 'Singapore Grand Prix' }],
  ['h03', 400, 'Which Spanish driver won the 2005 and 2006 titles with Renault?', 'أي سائق إسباني فاز بلقبي ٢٠٠٥ و٢٠٠٦ مع رينو؟', 'Fernando Alonso', 'فرناندو ألونسو', { s: 'drivers', alt: ['Alonso'], r: 'Fernando Alonso' }],
  ['h04', 400, 'In which Saudi city is the Saudi Arabian Grand Prix street circuit?', 'في أي مدينة سعودية تقع حلبة جائزة السعودية الكبرى؟', 'Jeddah', 'جدة', { s: 'tracks', r: 'Jeddah Corniche Circuit' }],
  ['h05', 400, 'Which team won both championships in 2009, its only season in F1?', 'أي فريق فاز بلقبي ٢٠٠٩ في موسمه الوحيد بالفورمولا ١؟', 'Brawn GP', 'براون جي بي', { s: 'teams', alt: ['Brawn'], r: 'Brawn GP' }],
  ['h06', 400, 'Which Belgian circuit is famous for the Eau Rouge corner?', 'أي حلبة بلجيكية تشتهر بمنعطف «أو روج»؟', 'Spa-Francorchamps', 'سبا فرانكورشان', { s: 'tracks', alt: ['Spa'], r: 'Circuit de Spa-Francorchamps' }],
  ['x01', 600, 'Who was the first Formula One world champion, in 1950?', 'من أول بطل عالم في الفورمولا ١ عام ١٩٥٠؟', 'Giuseppe Farina', 'جوزيبي فارينا', { s: 'drivers', x: 1, alt: ['Nino Farina'], r: 'Nino Farina' }],
  ['x02', 600, 'Who is the only driver to be crowned F1 world champion after his death, in 1970?', 'من السائق الوحيد الذي تُوّج بطلاً للعالم بعد وفاته عام ١٩٧٠؟', 'Jochen Rindt', 'يوخن ريندت', { s: 'drivers', x: 1, r: 'Jochen Rindt' }],
  ['x03', 600, 'Which British driver beat Niki Lauda to the 1976 title by a single point?', 'أي سائق بريطاني تفوّق على نيكي لاودا بنقطة واحدة لينال لقب ١٩٧٦؟', 'James Hunt', 'جيمس هانت', { s: 'drivers', r: 'James Hunt' }],
  ['x04', 600, 'Which country held the first Formula One race in the Middle East, in 2004?', 'أي دولة استضافت أول سباق فورمولا ١ في الشرق الأوسط عام ٢٠٠٤؟', 'Bahrain', 'البحرين', { s: 'tracks', r: 'Bahrain Grand Prix' }],
  ['x05', 600, 'Which manufacturer supplied the engines for Brawn GP’s 2009 title-winning car?', 'أي شركة زوّدت سيارة براون جي بي الفائزة بلقب ٢٠٠٩ بالمحركات؟', 'Mercedes', 'مرسيدس', { s: 'teams', x: 1, r: 'Brawn BGP 001' }],
  ['x06', 600, 'Which Finnish driver won the 2007 title by one point over Hamilton and Alonso?', 'أي سائق فنلندي فاز بلقب ٢٠٠٧ بفارق نقطة واحدة عن هاميلتون وألونسو؟', 'Kimi Räikkönen', 'كيمي رايكونن', { s: 'drivers', alt: ['Raikkonen'], r: '2007 Formula One World Championship' }],
]);

KH_BANK.cat('tennis', { g: 'sports', e: '🎾', en: 'Tennis', ar: 'التنس',
  subs: { slams: ['Grand Slams', 'البطولات الكبرى'], players: ['Players', 'لاعبون'], rules: ['Rules', 'قوانين'] } }, [
  ['e01', 200, 'Which Grand Slam tournament is played on grass in London?', 'أي بطولة كبرى تُلعب على العشب في لندن؟', 'Wimbledon', 'ويمبلدون', { s: 'slams', r: 'The Championships, Wimbledon' }],
  ['e02', 200, 'Which Swiss player won 20 Grand Slam singles titles?', 'أي لاعب سويسري فاز بعشرين لقباً في البطولات الكبرى؟', 'Roger Federer', 'روجر فيدرر', { s: 'players', alt: ['Federer'], r: 'Roger Federer' }],
  ['e03', 200, 'Which Spanish player is known as "the King of Clay"?', 'أي لاعب إسباني يُلقّب بـ«ملك الملاعب الترابية»؟', 'Rafael Nadal', 'رافائيل نادال', { s: 'players', alt: ['Nadal'], r: 'Rafael Nadal' }],
  ['e04', 200, 'How many Grand Slam tournaments are played each year?', 'كم بطولة كبرى (غراند سلام) تُقام كل عام؟', 'Four', 'أربع', { s: 'slams', alt: ['4'], r: 'Grand Slam (tennis)' }],
  ['e05', 200, 'Which Grand Slam is played on clay in Paris?', 'أي بطولة كبرى تُلعب على الملاعب الترابية في باريس؟', 'The French Open', 'بطولة فرنسا المفتوحة', { s: 'slams', alt: ['Roland Garros'], altAr: ['رولان غاروس'], r: 'French Open' }],
  ['e06', 200, 'Which Serbian player holds the men’s record for most Grand Slam singles titles?', 'أي لاعب صربي يحمل الرقم القياسي للرجال في عدد ألقاب البطولات الكبرى؟', 'Novak Djokovic', 'نوفاك ديوكوفيتش', { s: 'players', alt: ['Djokovic'], c: 1, asOf: '2026-06', r: 'Novak Djokovic' }],
  ['h01', 400, 'In tennis, what is a score of 40–40 called?', 'في التنس، ماذا تُسمّى النتيجة ٤٠–٤٠؟', 'Deuce', 'تعادل (ديوس)', { s: 'rules', r: 'Tennis scoring system' }],
  ['h02', 400, 'Which Grand Slam is played at Flushing Meadows in New York?', 'أي بطولة كبرى تُلعب في فلاشينغ ميدوز بنيويورك؟', 'The US Open', 'بطولة أمريكا المفتوحة', { s: 'slams', r: 'US Open (tennis)' }],
  ['h03', 400, 'Which Scottish player won Wimbledon in 2013?', 'أي لاعب إسكتلندي فاز بويمبلدون عام ٢٠١٣؟', 'Andy Murray', 'آندي موراي', { s: 'players', alt: ['Murray'], r: 'Andy Murray' }],
  ['h04', 400, 'Which American won 23 Grand Slam singles titles in the Open Era?', 'أي لاعبة أمريكية فازت بـ٢٣ لقباً في البطولات الكبرى في الحقبة المفتوحة؟', 'Serena Williams', 'سيرينا ويليامز', { s: 'players', alt: ['Serena'], r: 'Serena Williams' }],
  ['h05', 400, 'Which Tunisian player reached the Wimbledon final in both 2022 and 2023?', 'أي لاعبة تونسية وصلت إلى نهائي ويمبلدون عامي ٢٠٢٢ و٢٠٢٣؟', 'Ons Jabeur', 'أنس جابر', { s: 'players', alt: ['Jabeur'], r: 'Ons Jabeur' }],
  ['h06', 400, 'Which surface is the Australian Open played on?', 'على أي نوع من الأرضيات تُلعب بطولة أستراليا المفتوحة؟', 'Hard court', 'ملاعب صلبة', { s: 'slams', r: 'Australian Open' }],
  ['x01', 600, 'Before Andy Murray in 2013, who was the last British man to win Wimbledon, in 1936?', 'قبل آندي موراي عام ٢٠١٣، من كان آخر بريطاني يفوز بويمبلدون عام ١٩٣٦؟', 'Fred Perry', 'فريد بيري', { s: 'players', r: 'Fred Perry' }],
  ['x02', 600, 'Who won all four Grand Slams and Olympic gold in 1988, the "Golden Slam"?', 'من فازت بالبطولات الكبرى الأربع والذهبية الأولمبية عام ١٩٨٨ «الغراند سلام الذهبي»؟', 'Steffi Graf', 'شتيفي غراف', { s: 'players', alt: ['Graf'], r: 'Steffi Graf' }],
  ['x03', 600, 'Which man won the calendar-year Grand Slam twice, in 1962 and 1969?', 'أي لاعب فاز بالبطولات الكبرى الأربع في عام واحد مرتين، في ١٩٦٢ و١٩٦٩؟', 'Rod Laver', 'رود لايفر', { s: 'players', x: 1, r: 'Rod Laver' }],
  ['x04', 600, 'Who won the longest match in tennis history, at Wimbledon in 2010 (70–68 in the fifth set)?', 'من فاز بأطول مباراة في تاريخ التنس في ويمبلدون ٢٠١٠ (٧٠–٦٨ في المجموعة الخامسة)؟', 'John Isner', 'جون إيسنر', { s: 'players', x: 1, n: 'He beat Nicolas Mahut over three days.', nAr: 'فاز على نيكولا ماهو على مدى ثلاثة أيام.', r: 'Isner–Mahut match at the 2010 Wimbledon Championships' }],
  ['x05', 600, 'The men’s singles trophy of which Grand Slam is called the "Coupe des Mousquetaires"?', 'كأس فردي الرجال في أي بطولة كبرى تُسمّى «كأس الفرسان» (Coupe des Mousquetaires)؟', 'The French Open', 'بطولة فرنسا المفتوحة', { s: 'slams', x: 1, alt: ['Roland Garros'], ok: 1, r: 'French Open' }],
  ['x06', 600, 'Who won the first Wimbledon championship, in 1877?', 'من فاز بأول بطولة ويمبلدون عام ١٨٧٧؟', 'Spencer Gore', 'سبنسر غور', { s: 'players', x: 1, r: '1877 Wimbledon Championship' }],
]);

KH_BANK.cat('olympics', { g: 'sports', e: '🥇', en: 'Olympics & Athletics', ar: 'الأولمبياد وألعاب القوى',
  subs: { games: ['The Games', 'الدورات'], athletes: ['Athletes', 'رياضيون'], records: ['Records', 'أرقام قياسية'] } }, [
  ['e01', 200, 'How many rings are on the Olympic flag?', 'كم حلقة على علم الألعاب الأولمبية؟', 'Five', 'خمس', { s: 'games', alt: ['5'], r: 'Olympic symbols' }],
  ['e02', 200, 'Which Jamaican sprinter holds the 100 m world record of 9.58 seconds?', 'أي عدّاء جامايكي يحمل الرقم القياسي العالمي لسباق ١٠٠ م (٩٫٥٨ ثانية)؟', 'Usain Bolt', 'يوسين بولت', { s: 'records', alt: ['Bolt'], c: 1, asOf: '2026-06', r: 'Usain Bolt' }],
  ['e03', 200, 'Which city hosted the 2024 Summer Olympics?', 'أي مدينة استضافت الألعاب الأولمبية الصيفية ٢٠٢٤؟', 'Paris', 'باريس', { s: 'games', r: '2024 Summer Olympics' }],
  ['e04', 200, 'In which country did the ancient Olympic Games begin?', 'في أي بلد بدأت الألعاب الأولمبية القديمة؟', 'Greece', 'اليونان', { s: 'games', r: 'Ancient Olympic Games' }],
  ['e05', 200, 'Which American swimmer has won the most Olympic medals ever?', 'أي سبّاح أمريكي فاز بأكبر عدد من الميداليات الأولمبية في التاريخ؟', 'Michael Phelps', 'مايكل فيلبس', { s: 'athletes', alt: ['Phelps'], r: 'Michael Phelps' }],
  ['e06', 200, 'How long is a marathon?', 'كم طول سباق الماراثون؟', '42.195 km (26.2 miles)', '٤٢٫١٩٥ كم', { s: 'records', alt: ['about 42 km', '26.2 miles'], r: 'Marathon' }],
  ['h01', 400, 'Which city hosted the first modern Olympic Games, in 1896?', 'أي مدينة استضافت أول ألعاب أولمبية حديثة عام ١٨٩٦؟', 'Athens', 'أثينا', { s: 'games', r: '1896 Summer Olympics' }],
  ['h02', 400, 'Which city will host the 2028 Summer Olympics?', 'أي مدينة ستستضيف الألعاب الأولمبية الصيفية ٢٠٢٨؟', 'Los Angeles', 'لوس أنجلوس', { s: 'games', r: '2028 Summer Olympics' }],
  ['h03', 400, 'Which Moroccan runner set the 1500 m world record in 1998?', 'أي عدّاء مغربي سجّل الرقم القياسي العالمي في ١٥٠٠ م عام ١٩٩٨؟', 'Hicham El Guerrouj', 'هشام الكروج', { s: 'records', alt: ['El Guerrouj'], c: 1, asOf: '2026-06', r: 'Hicham El Guerrouj' }],
  ['h04', 400, 'Which American won four gold medals at the 1936 Berlin Olympics?', 'أي رياضي أمريكي فاز بأربع ذهبيات في أولمبياد برلين ١٩٣٦؟', 'Jesse Owens', 'جيسي أوينز', { s: 'athletes', alt: ['Owens'], r: 'Jesse Owens' }],
  ['h05', 400, 'Which Romanian gymnast scored the first perfect 10 in Olympic gymnastics, in 1976?', 'أي لاعبة جمباز رومانية سجّلت أول علامة كاملة (١٠) في الجمباز الأولمبي عام ١٩٧٦؟', 'Nadia Comăneci', 'ناديا كومانتشي', { s: 'athletes', alt: ['Nadia Comaneci'], r: 'Nadia Comăneci' }],
  ['h06', 400, 'Which Kenyan ran the first marathon distance under two hours, in Vienna in 2019?', 'أي عدّاء كيني قطع مسافة الماراثون في أقل من ساعتين لأول مرة في فيينا عام ٢٠١٩؟', 'Eliud Kipchoge', 'إليود كيبتشوغي', { s: 'athletes', alt: ['Kipchoge'], n: 'It was a special event, so it doesn’t count as an official world record.', nAr: 'كان حدثاً خاصاً، فلا يُحسب رقماً قياسياً رسمياً.', r: 'Ineos 1:59 Challenge' }],
  ['x01', 600, 'Which Ethiopian ran barefoot to win the 1960 Olympic marathon in Rome?', 'أي عدّاء إثيوبي ركض حافي القدمين وفاز بماراثون أولمبياد روما ١٩٦٠؟', 'Abebe Bikila', 'أبيبي بيكيلا', { s: 'athletes', r: 'Abebe Bikila' }],
  ['x02', 600, 'Which Czechoslovak runner won the 5000 m, 10,000 m and marathon at the 1952 Olympics?', 'أي عدّاء تشيكوسلوفاكي فاز بسباقات ٥٠٠٠ م و١٠٠٠٠ م والماراثون في أولمبياد ١٩٥٢؟', 'Emil Zátopek', 'إميل زاتوبيك', { s: 'athletes', x: 1, alt: ['Zatopek'], r: 'Emil Zátopek' }],
  ['x03', 600, 'The 1956 Olympics were in Melbourne, but the equestrian events were held in which city?', 'أُقيمت ألعاب ١٩٥٦ في ملبورن، لكن منافسات الفروسية أُقيمت في أي مدينة؟', 'Stockholm', 'ستوكهولم', { s: 'games', x: 1, r: 'Equestrian at the 1956 Summer Olympics' }],
  ['x04', 600, 'Which American high jumper won gold in 1968 with a new back-first technique?', 'أي لاعب قفز عالٍ أمريكي فاز بالذهبية عام ١٩٦٨ بتقنية جديدة يقفز فيها على ظهره؟', 'Dick Fosbury', 'ديك فوسبري', { s: 'athletes', r: 'Dick Fosbury' }],
  ['x05', 600, 'Who has held the men’s long jump world record of 8.95 m since 1991?', 'من يحمل الرقم القياسي العالمي للوثب الطويل (٨٫٩٥ م) منذ ١٩٩١؟', 'Mike Powell', 'مايك باول', { s: 'records', x: 1, c: 1, asOf: '2026-06', r: 'Mike Powell (long jumper)' }],
  ['x06', 600, 'Which Greek runner won the first modern Olympic marathon, in 1896?', 'أي عدّاء يوناني فاز بأول ماراثون أولمبي حديث عام ١٨٩٦؟', 'Spyridon Louis', 'سبيريدون لويس', { s: 'athletes', x: 1, r: 'Spyridon Louis' }],
]);

KH_BANK.cat('combat', { g: 'sports', e: '🥊', en: 'Boxing, UFC & Wrestling', ar: 'ملاكمة ويو إف سي ومصارعة',
  subs: { boxing: ['Boxing', 'ملاكمة'], mma: ['UFC & MMA', 'فنون قتالية مختلطة'], wrestling: ['Pro wrestling', 'مصارعة حرة'] } }, [
  ['e01', 200, 'Which boxer, born Cassius Clay, called himself "The Greatest"?', 'أي ملاكم وُلد باسم كاسيوس كلاي ولقّب نفسه «الأعظم»؟', 'Muhammad Ali', 'محمد علي', { s: 'boxing', r: 'Muhammad Ali' }],
  ['e02', 200, 'What does UFC stand for?', 'ماذا يعني اختصار UFC؟', 'Ultimate Fighting Championship', 'بطولة القتال النهائي', { s: 'mma', r: 'Ultimate Fighting Championship' }],
  ['e03', 200, 'Which Irish fighter held two UFC title belts at the same time in 2016?', 'أي مقاتل أيرلندي حمل حزامين في يو إف سي في الوقت نفسه عام ٢٠١٦؟', 'Conor McGregor', 'كونور ماكغريغور', { s: 'mma', alt: ['McGregor'], r: 'Conor McGregor' }],
  ['e04', 200, 'In combat sports, what does "KO" stand for?', 'في الرياضات القتالية، ماذا يعني «KO»؟', 'Knockout', 'الضربة القاضية', { s: 'boxing', r: 'Knockout' }],
  ['e05', 200, 'Which American boxer retired unbeaten with a 50–0 record?', 'أي ملاكم أمريكي اعتزل دون هزيمة بسجل ٥٠–٠؟', 'Floyd Mayweather Jr.', 'فلويد مايويذر', { s: 'boxing', alt: ['Mayweather'], r: 'Floyd Mayweather Jr.' }],
  ['e06', 200, 'Which Dagestani fighter retired from the UFC unbeaten at 29–0?', 'أي مقاتل داغستاني اعتزل يو إف سي دون هزيمة بسجل ٢٩–٠؟', 'Khabib Nurmagomedov', 'حبيب نورمحمدوف', { s: 'mma', alt: ['Khabib'], altAr: ['حبيب'], r: 'Khabib Nurmagomedov' }],
  ['h01', 400, 'Which boxer bit Evander Holyfield’s ear in their 1997 rematch?', 'أي ملاكم عضّ أذن إيفاندر هوليفيلد في مباراة الإعادة عام ١٩٩٧؟', 'Mike Tyson', 'مايك تايسون', { s: 'boxing', alt: ['Tyson'], f: 'tyson', r: 'Evander Holyfield vs. Mike Tyson II' }],
  ['h02', 400, 'What was the 1974 Ali vs Foreman fight in Kinshasa called?', 'ما اسم نزال علي ضد فورمان في كينشاسا عام ١٩٧٤؟', 'The Rumble in the Jungle', 'معركة الغابة', { s: 'boxing', r: 'The Rumble in the Jungle' }],
  ['h03', 400, 'In which country was the "Thrilla in Manila" held?', 'في أي دولة أُقيم نزال «إثارة مانيلا»؟', 'The Philippines', 'الفلبين', { s: 'boxing', r: 'Thrilla in Manila' }],
  ['h04', 400, 'Which British heavyweight, "the Gypsy King", beat Wladimir Klitschko in 2015?', 'أي ملاكم بريطاني من الوزن الثقيل يُلقّب «ملك الغجر» هزم فلاديمير كليتشكو عام ٢٠١٥؟', 'Tyson Fury', 'تايسون فيوري', { s: 'boxing', alt: ['Fury'], r: 'Tyson Fury' }],
  ['h05', 400, 'What is WWE’s biggest annual event called?', 'ما اسم أكبر حدث سنوي في WWE؟', 'WrestleMania', 'رسلمانيا', { s: 'wrestling', r: 'WrestleMania' }],
  ['h06', 400, 'Which Brazilian held the UFC middleweight title from 2006 to 2013?', 'أي مقاتل برازيلي حمل لقب الوزن المتوسط في يو إف سي من ٢٠٠٦ إلى ٢٠١٣؟', 'Anderson Silva', 'أندرسون سيلفا', { s: 'mma', r: 'Anderson Silva' }],
  ['x01', 600, 'Who won the first UFC tournament, in 1993?', 'من فاز بأول بطولة يو إف سي عام ١٩٩٣؟', 'Royce Gracie', 'رويس غرايسي', { s: 'mma', x: 1, r: 'UFC 1' }],
  ['x02', 600, 'Whom did Muhammad Ali (then Cassius Clay) beat to first win the heavyweight title, in 1964?', 'من هزم محمد علي (كاسيوس كلاي آنذاك) ليفوز بلقب الوزن الثقيل لأول مرة عام ١٩٦٤؟', 'Sonny Liston', 'سوني ليستون', { s: 'boxing', r: 'Muhammad Ali vs. Sonny Liston' }],
  ['x03', 600, 'Whose WrestleMania winning streak did Brock Lesnar end in 2014?', 'سلسلة انتصارات من في رسلمانيا أنهاها بروك ليسنر عام ٢٠١٤؟', 'The Undertaker', 'أندرتيكر', { s: 'wrestling', r: 'The Streak (professional wrestling)' }],
  ['x04', 600, 'Which boxer was the first to win world titles in eight weight divisions?', 'من أول ملاكم فاز بألقاب عالمية في ثماني فئات وزن؟', 'Manny Pacquiao', 'ماني باكياو', { s: 'boxing', alt: ['Pacquiao'], r: 'Manny Pacquiao' }],
  ['x05', 600, 'Who knocked out Mike Tyson in Tokyo in 1990, one of boxing’s biggest upsets?', 'من أسقط مايك تايسون بالضربة القاضية في طوكيو عام ١٩٩٠ في واحدة من أكبر مفاجآت الملاكمة؟', 'James "Buster" Douglas', 'جيمس «باستر» دوغلاس', { s: 'boxing', x: 1, alt: ['Buster Douglas'], f: 'tyson-douglas', r: 'Mike Tyson vs. Buster Douglas' }],
  ['x06', 600, 'In which country was the 2019 Joshua vs Ruiz rematch, the "Clash on the Dunes"?', 'في أي دولة أُقيمت مباراة الإعادة بين جوشوا وروز عام ٢٠١٩ «صدام الكثبان»؟', 'Saudi Arabia', 'السعودية', { s: 'boxing', r: 'Andy Ruiz Jr. vs. Anthony Joshua II' }],
]);

KH_BANK.cat('sports-more', { g: 'sports', niche: 1, e: '🏏', en: 'Cricket, Golf & US Sports', ar: 'كريكيت وغولف ورياضات أمريكية',
  subs: { cricket: ['Cricket', 'كريكيت'], us: ['NFL, NHL & MLB', 'رياضات أمريكية'], golf: ['Golf', 'غولف'], other: ['Other sports', 'رياضات أخرى'] } }, [
  ['e01', 200, 'How many players are in a cricket team on the field?', 'كم لاعباً في فريق الكريكيت داخل الملعب؟', 'Eleven', 'أحد عشر', { s: 'cricket', alt: ['11'], r: 'Cricket' }],
  ['e02', 200, 'In which sport do teams score "touchdowns"?', 'في أي رياضة تسجّل الفرق «تاتش داون»؟', 'American football', 'كرة القدم الأمريكية', { s: 'us', r: 'Touchdown' }],
  ['e03', 200, 'Which racket sport uses a shuttlecock?', 'أي رياضة مضرب تُستخدم فيها الريشة؟', 'Badminton', 'الريشة الطائرة', { s: 'other', r: 'Badminton' }],
  ['e04', 200, 'What is the NFL’s championship game called?', 'ما اسم المباراة النهائية لدوري كرة القدم الأمريكية NFL؟', 'The Super Bowl', 'السوبر بول', { s: 'us', r: 'Super Bowl' }],
  ['e05', 200, 'In baseball, how many strikes make a strikeout?', 'في البيسبول، كم «سترايك» يُخرج الضارب؟', 'Three', 'ثلاث', { s: 'us', alt: ['3'], r: 'Strikeout' }],
  ['e06', 200, 'What is an ice hockey puck made of?', 'مِمَّ يُصنع قرص هوكي الجليد؟', 'Rubber', 'المطاط', { s: 'us', alt: ['vulcanised rubber'], r: 'Hockey puck' }],
  ['h01', 400, 'Which team won the first men’s Cricket World Cup, in 1975?', 'أي فريق فاز بأول كأس عالم للكريكيت للرجال عام ١٩٧٥؟', 'West Indies', 'جزر الهند الغربية', { s: 'cricket', r: '1975 Cricket World Cup' }],
  ['h02', 400, 'Which golfer won the 1997 Masters at 21, by a record 12 strokes?', 'أي لاعب غولف فاز ببطولة الماسترز ١٩٩٧ وعمره ٢١ عاماً بفارق قياسي ١٢ ضربة؟', 'Tiger Woods', 'تايغر وودز', { s: 'golf', r: '1997 Masters Tournament' }],
  ['h03', 400, 'Which Canadian city’s NHL team is the Maple Leafs?', 'فريق «مابل ليفز» في الـNHL من أي مدينة كندية؟', 'Toronto', 'تورونتو', { s: 'us', r: 'Toronto Maple Leafs' }],
  ['h04', 400, 'Which Indian batsman was the first to score 100 international centuries?', 'أي ضارب هندي كان أول من سجّل ١٠٠ «سنشري» دولية؟', 'Sachin Tendulkar', 'ساشين تندولكار', { s: 'cricket', alt: ['Tendulkar'], r: 'Sachin Tendulkar' }],
  ['h05', 400, 'Which quarterback won seven Super Bowls?', 'أي لاعب وسط (كوارترباك) فاز بسبعة ألقاب سوبر بول؟', 'Tom Brady', 'توم برادي', { s: 'us', alt: ['Brady'], r: 'Tom Brady' }],
  ['h06', 400, 'What is the trophy awarded to the NHL champions called?', 'ما اسم الكأس التي يفوز بها بطل الـNHL؟', 'The Stanley Cup', 'كأس ستانلي', { s: 'us', r: 'Stanley Cup' }],
  ['h07', 400, 'Which Canadian hockey player is known as "The Great One"?', 'أي لاعب هوكي كندي يُلقّب بـ«العظيم»؟', 'Wayne Gretzky', 'واين غريتزكي', { s: 'us', alt: ['Gretzky'], r: 'Wayne Gretzky' }],
  ['x01', 600, 'Who scored 400 not out, the highest individual Test cricket innings, in 2004?', 'من سجّل ٤٠٠ دون أن يُخرج، أعلى رصيد فردي في مباريات الكريكيت الاختبارية عام ٢٠٠٤؟', 'Brian Lara', 'براين لارا', { s: 'cricket', x: 1, c: 1, asOf: '2026-06', r: 'Brian Lara' }],
  ['x02', 600, 'Which team won the first Super Bowl, in January 1967?', 'أي فريق فاز بأول سوبر بول في يناير ١٩٦٧؟', 'Green Bay Packers', 'غرين باي باكرز', { s: 'us', alt: ['the Packers'], r: 'Super Bowl I' }],
  ['x03', 600, 'Who broke Babe Ruth’s career home run record in 1974?', 'من حطّم الرقم القياسي لبيب روث في عدد الضربات الكاملة (هوم رن) عام ١٩٧٤؟', 'Hank Aaron', 'هانك آرون', { s: 'us', r: 'Hank Aaron' }],
  ['x04', 600, 'Which golfer won a record 18 men’s major championships?', 'أي لاعب غولف فاز برقم قياسي ١٨ بطولة كبرى للرجال؟', 'Jack Nicklaus', 'جاك نيكلاوس', { s: 'golf', alt: ['Nicklaus'], c: 1, asOf: '2026-06', r: 'Jack Nicklaus' }],
  ['x05', 600, 'The Colorado Avalanche moved in 1995 from which Canadian city?', 'فريق كولورادو أفالانش انتقل عام ١٩٩٥ من أي مدينة كندية؟', 'Quebec City', 'مدينة كيبك', { s: 'us', x: 1, alt: ['Quebec'], n: 'They were the Quebec Nordiques.', nAr: 'كانوا يُعرفون باسم كيبك نورديك.', r: 'Quebec Nordiques' }],
  ['x06', 600, 'Which Australian batsman finished with a Test batting average of 99.94?', 'أي ضارب أسترالي أنهى مسيرته بمعدل ٩٩٫٩٤ في المباريات الاختبارية؟', 'Don Bradman', 'دون برادمان', { s: 'cricket', alt: ['Bradman'], r: 'Don Bradman' }],
]);

/* ---- bank/20-screen.js ---- */
/* Movies, TV and animation. Facts about films and shows only — no quotes beyond a few words, no lyrics. */
KH_BANK.cat('movies', { g: 'screen', pop: 1, e: '🎬', en: 'Movies', ar: 'أفلام',
  subs: { films: ['Films', 'أفلام'], people: ['Actors & directors', 'ممثلون ومخرجون'], oscars: ['Oscars & history', 'الأوسكار والتاريخ'] } }, [
  ['e01', 200, 'Who directed Jurassic Park (1993)?', 'من أخرج فيلم «الحديقة الجوراسية» (١٩٩٣)؟', 'Steven Spielberg', 'ستيفن سبيلبرغ', { f: 'jp', s: 'people', alt: ['Spielberg'], r: 'Jurassic Park (film)' }],
  ['e02', 200, 'Which 1997 film starring Leonardo DiCaprio is about a ship that sank in 1912?', 'أي فيلم من بطولة ليوناردو دي كابريو عام ١٩٩٧ يدور حول سفينة غرقت عام ١٩١٢؟', 'Titanic', 'تايتانيك', { f: 'titanic', s: 'films', r: 'Titanic (1997 film)' }],
  ['e03', 200, 'In which film series does Vin Diesel play Dominic Toretto?', 'في أي سلسلة أفلام يؤدي فين ديزل دور دومينيك توريتو؟', 'Fast & Furious', 'السريع والغاضب', { s: 'films', alt: ['The Fast and the Furious'], r: 'Fast & Furious' }],
  ['e04', 200, 'Which actor played Captain Jack Sparrow in Pirates of the Caribbean?', 'أي ممثل أدى دور الكابتن جاك سبارو في «قراصنة الكاريبي»؟', 'Johnny Depp', 'جوني ديب', { s: 'people', r: 'Jack Sparrow' }],
  ['e05', 200, 'What is the name of the school of witchcraft and wizardry in Harry Potter?', 'ما اسم مدرسة السحر في «هاري بوتر»؟', 'Hogwarts', 'هوغوورتس', { s: 'films', r: 'Hogwarts' }],
  ['e06', 200, 'In which film does Arnold Schwarzenegger play a cyborg sent back from the future?', 'في أي فيلم يؤدي أرنولد شوارزنيغر دور سايبورغ أُرسل من المستقبل؟', 'The Terminator', 'المدمر (ذا ترميناتور)', { s: 'films', alt: ['Terminator'], r: 'The Terminator' }],
  ['h01', 400, 'Which South Korean film won Best Picture at the 2020 Oscars?', 'أي فيلم كوري جنوبي فاز بأوسكار أفضل فيلم عام ٢٠٢٠؟', 'Parasite', 'طفيلي (باراسايت)', { s: 'oscars', r: 'Parasite (2019 film)' }],
  ['h02', 400, 'Which director made Inception, Interstellar and Oppenheimer?', 'أي مخرج صنع أفلام «استهلال» و«بين النجوم» و«أوبنهايمر»؟', 'Christopher Nolan', 'كريستوفر نولان', { s: 'people', alt: ['Nolan'], r: 'Christopher Nolan' }],
  ['h03', 400, 'Which film won 11 Oscars in 2004, completing a fantasy trilogy?', 'أي فيلم فاز بـ١١ أوسكار عام ٢٠٠٤ وأكمل ثلاثية خيالية؟', 'The Lord of the Rings: The Return of the King', 'سيد الخواتم: عودة الملك', { s: 'oscars', alt: ['The Return of the King'], r: 'The Lord of the Rings: The Return of the King' }],
  ['h04', 400, 'Who played the Joker in The Dark Knight (2008)?', 'من أدى دور الجوكر في «فارس الظلام» (٢٠٠٨)؟', 'Heath Ledger', 'هيث ليدجر', { s: 'people', r: 'Heath Ledger' }],
  ['h05', 400, 'What is the name of the hotel in The Shining?', 'ما اسم الفندق في فيلم «البريق» (ذا شاينينغ)؟', 'The Overlook Hotel', 'فندق أوفرلوك', { s: 'films', alt: ['The Overlook'], r: 'The Shining (film)' }],
  ['h06', 400, 'Which actor starred in the most official James Bond films, with seven?', 'أي ممثل لعب دور جيمس بوند في أكبر عدد من الأفلام الرسمية، سبعة أفلام؟', 'Roger Moore', 'روجر مور', { s: 'people', r: 'Roger Moore' }],
  ['h07', 400, 'Which film is the highest-grossing of all time (not adjusted for inflation)?', 'أي فيلم هو الأعلى إيراداً في التاريخ (دون احتساب التضخم)؟', 'Avatar (2009)', 'أفاتار (٢٠٠٩)', { v: 'web:2026-10-10', s: 'oscars', alt: ['Avatar'], c: 1, asOf: '2026-06', r: 'List of highest-grossing films' }],
  ['x01', 600, 'Which film was the first to win all "Big Five" Oscars: picture, director, actor, actress and screenplay?', 'أي فيلم كان أول من فاز بجوائز الأوسكار الخمس الكبرى: الفيلم والإخراج والممثل والممثلة والسيناريو؟', 'It Happened One Night (1934)', 'حدث ذات ليلة (١٩٣٤)', { s: 'oscars', x: 1, r: 'It Happened One Night' }],
  ['x02', 600, 'Which 1927 film was the first feature with synchronised spoken dialogue?', 'أي فيلم عام ١٩٢٧ كان أول فيلم روائي طويل بحوار منطوق متزامن؟', 'The Jazz Singer', 'مغني الجاز', { s: 'oscars', x: 1, r: 'The Jazz Singer' }],
  ['x03', 600, 'What is the name of the corporation that owns the ship in Alien (1979)?', 'ما اسم الشركة المالكة للسفينة في فيلم «الفضائي» (١٩٧٩)؟', 'Weyland-Yutani', 'ويلاند-يوتاني', { s: 'films', x: 1, r: 'Weyland-Yutani' }],
  ['x04', 600, 'Who was the first Black actor to win the Oscar for Best Actor, in 1964?', 'من أول ممثل أسود يفوز بأوسكار أفضل ممثل عام ١٩٦٤؟', 'Sidney Poitier', 'سيدني بواتييه', { s: 'oscars', r: 'Sidney Poitier' }],
  ['x05', 600, 'Which 2012 film by Haifaa al-Mansour was the first feature shot entirely in Saudi Arabia?', 'أي فيلم لهيفاء المنصور عام ٢٠١٢ كان أول فيلم روائي طويل يُصوَّر بالكامل في السعودية؟', 'Wadjda', 'وجدة', { s: 'films', r: 'Wadjda' }],
  ['x06', 600, 'In Kill Bill, what is the real name of "The Bride"?', 'في فيلم «اقتل بيل»، ما الاسم الحقيقي لـ«العروس»؟', 'Beatrix Kiddo', 'بياتريكس كيدو', { s: 'films', x: 1, r: 'The Bride (Kill Bill)' }],
]);

KH_BANK.cat('animated', { g: 'screen', pop: 1, e: '🧸', en: 'Animated Films', ar: 'أفلام الرسوم المتحركة',
  subs: { pixar: ['Pixar', 'بيكسار'], disney: ['Disney', 'ديزني'], other: ['DreamWorks & more', 'دريم ووركس وغيرها'] } }, [
  ['e01', 200, 'In The Lion King, what is the name of Simba’s father?', 'في «الأسد الملك»، ما اسم والد سيمبا؟', 'Mufasa', 'موفاسا', { s: 'disney', f: 'scar', r: 'Mufasa' }],
  ['e02', 200, 'Which Pixar film stars a cowboy toy named Woody?', 'أي فيلم من بيكسار بطله دمية راعي بقر اسمه وودي؟', 'Toy Story', 'حكاية لعبة', { s: 'pixar', r: 'Toy Story' }],
  ['e03', 200, 'What kind of fish is Nemo?', 'ما نوع السمكة نيمو؟', 'A clownfish', 'سمكة المهرج', { s: 'pixar', r: 'Finding Nemo' }],
  ['e04', 200, 'Which green DreamWorks ogre lives in a swamp?', 'أي غول أخضر من دريم ووركس يعيش في مستنقع؟', 'Shrek', 'شريك', { s: 'other', r: 'Shrek' }],
  ['e05', 200, 'In Frozen, what is the name of the talking snowman?', 'في «ملكة الثلج» (فروزن)، ما اسم رجل الثلج المتكلم؟', 'Olaf', 'أولاف', { f: 'frozen', s: 'disney', r: 'Olaf (Frozen)' }],
  ['e06', 200, 'Which Pixar film is about a rat who wants to cook in Paris?', 'أي فيلم من بيكسار يدور حول فأر يحلم بالطبخ في باريس؟', 'Ratatouille', 'راتاتوي', { s: 'pixar', r: 'Ratatouille (film)' }],
  ['h01', 400, 'Which 1937 film was Disney’s first full-length animated feature?', 'أي فيلم عام ١٩٣٧ كان أول فيلم رسوم متحركة طويل لديزني؟', 'Snow White and the Seven Dwarfs', 'سنو وايت والأقزام السبعة', { s: 'disney', alt: ['Snow White'], r: 'Snow White and the Seven Dwarfs (1937 film)' }],
  ['h02', 400, 'In Monsters, Inc., what nickname does Sulley give the little girl?', 'في «شركة المرعبين المحدودة»، بماذا يلقّب سولي الطفلة الصغيرة؟', 'Boo', 'بو', { s: 'pixar', r: 'Monsters, Inc.' }],
  ['h03', 400, 'In Toy Story, what is the name of the toy-wrecking boy next door?', 'في «حكاية لعبة»، ما اسم الولد الجار الذي يدمّر الألعاب؟', 'Sid', 'سيد', { s: 'pixar', alt: ['Sid Phillips'], r: 'Toy Story' }],
  ['h04', 400, 'In The Incredibles, who designs the superheroes’ suits?', 'في «الخارقون»، من يصمم بدلات الأبطال الخارقين؟', 'Edna Mode', 'إدنا مود', { s: 'pixar', alt: ['Edna'], r: 'The Incredibles' }],
  ['h05', 400, 'What is the name of the space-themed restaurant in Toy Story?', 'ما اسم المطعم ذي طابع الفضاء في «حكاية لعبة»؟', 'Pizza Planet', 'بيتزا بلانيت', { s: 'pixar', r: 'Toy Story' }],
  ['h06', 400, 'Who voiced Woody in the original Toy Story films?', 'من أدى صوت وودي في أفلام «حكاية لعبة» الأصلية؟', 'Tom Hanks', 'توم هانكس', { s: 'pixar', r: 'Woody (Toy Story)' }],
  ['h07', 400, 'Which studio made Kung Fu Panda?', 'أي استوديو أنتج «كونغ فو باندا»؟', 'DreamWorks Animation', 'دريم ووركس', { s: 'other', alt: ['DreamWorks'], r: 'Kung Fu Panda (film)' }],
  ['x01', 600, 'In Coco, what is the name of Miguel’s great-great-grandfather, the real musician?', 'في فيلم «كوكو»، ما اسم جد ميغيل الأكبر، الموسيقي الحقيقي؟', 'Héctor', 'هيكتور', { s: 'pixar', x: 1, alt: ['Hector Rivera'], r: 'Coco (2017 film)' }],
  ['x02', 600, 'Which was the first animated film nominated for the Best Picture Oscar?', 'ما أول فيلم رسوم متحركة يُرشَّح لأوسكار أفضل فيلم؟', 'Beauty and the Beast (1991)', 'الجميلة والوحش (١٩٩١)', { s: 'disney', r: 'Beauty and the Beast (1991 film)' }],
  ['x03', 600, 'In Finding Nemo, what is the full address that Dory keeps reciting?', 'في «البحث عن نيمو»، ما العنوان الكامل الذي تردده دوري؟', 'P. Sherman, 42 Wallaby Way, Sydney', 'بي. شيرمان، ٤٢ والابي واي، سيدني', { s: 'pixar', x: 1, r: 'Finding Nemo' }],
  ['x04', 600, 'In Shrek 2, what is the kingdom ruled by Fiona’s parents called?', 'في «شريك ٢»، ما اسم المملكة التي يحكمها والدا فيونا؟', 'Far Far Away', 'بعيد بعيد', { s: 'other', x: 1, r: 'Shrek 2' }],
  ['x05', 600, 'In Ratatouille, what is the name of the feared food critic?', 'في «راتاتوي»، ما اسم ناقد الطعام المخيف؟', 'Anton Ego', 'أنطون إيغو', { s: 'pixar', r: 'Ratatouille (film)' }],
  ['x06', 600, 'What racing number does Lightning McQueen carry in Cars?', 'ما الرقم الذي يحمله ماكوين البرق في فيلم «سيارات»؟', '95', '٩٥', { s: 'pixar', x: 1, r: 'Lightning McQueen' }],
]);

KH_BANK.cat('superheroes', { g: 'screen', pop: 1, e: '🦸', en: 'Marvel & DC', ar: 'مارفل ودي سي',
  subs: { marvel: ['Marvel', 'مارفل'], dc: ['DC', 'دي سي'], comics: ['Comic history', 'تاريخ القصص المصورة'] } }, [
  ['e01', 200, 'Bruce Wayne is the secret identity of which superhero?', 'بروس واين هو الهوية السرية لأي بطل خارق؟', 'Batman', 'باتمان', { s: 'dc', r: 'Batman' }],
  ['e02', 200, 'What is the name of Thor’s hammer?', 'ما اسم مطرقة ثور؟', 'Mjölnir', 'ميولنير', { s: 'marvel', alt: ['Mjolnir'], r: 'Mjolnir (comics)' }],
  ['e03', 200, 'Peter Parker is the secret identity of which superhero?', 'بيتر باركر هو الهوية السرية لأي بطل خارق؟', 'Spider-Man', 'الرجل العنكبوت', { s: 'marvel', r: 'Spider-Man' }],
  ['e04', 200, 'Which city does Batman protect?', 'أي مدينة يحميها باتمان؟', 'Gotham City', 'مدينة غوثام', { s: 'dc', alt: ['Gotham'], r: 'Gotham City' }],
  ['e05', 200, 'Which green giant is the angry alter ego of Bruce Banner?', 'أي عملاق أخضر هو الشخصية الغاضبة لبروس بانر؟', 'The Hulk', 'هالك', { s: 'marvel', r: 'Hulk' }],
  ['e06', 200, 'Which unbreakable metal is bonded to Wolverine’s skeleton?', 'أي معدن لا يُكسر مدموج في هيكل وولفرين العظمي؟', 'Adamantium', 'الأدامانتيوم', { s: 'marvel', r: 'Adamantium' }],
  ['h01', 400, 'What is Captain America’s real name?', 'ما الاسم الحقيقي لكابتن أمريكا؟', 'Steve Rogers', 'ستيف روجرز', { s: 'marvel', r: 'Captain America' }],
  ['h02', 400, 'What is the name of Black Panther’s home nation?', 'ما اسم وطن «النمر الأسود»؟', 'Wakanda', 'واكاندا', { s: 'marvel', r: 'Wakanda' }],
  ['h03', 400, 'Which Infinity Stone sits in Vision’s forehead?', 'أي حجر من أحجار اللانهاية موجود في جبين «فيجن»؟', 'The Mind Stone', 'حجر العقل', { s: 'marvel', r: 'Infinity Gems' }],
  ['h04', 400, 'What is Superman’s home planet?', 'ما كوكب سوبرمان الأصلي؟', 'Krypton', 'كريبتون', { s: 'dc', r: 'Krypton (comics)' }],
  ['h05', 400, 'Who co-created Spider-Man with artist Steve Ditko?', 'من شارك الرسام ستيف ديتكو في ابتكار شخصية الرجل العنكبوت؟', 'Stan Lee', 'ستان لي', { s: 'comics', r: 'Spider-Man' }],
  ['h06', 400, 'Which green-skinned warrior is Thanos’s adopted daughter in the Guardians films?', 'أي محاربة خضراء البشرة هي الابنة بالتبني لثانوس في أفلام «حراس المجرة»؟', 'Gamora', 'غامورا', { s: 'marvel', r: 'Gamora' }],
  ['h07', 400, 'Who played Batman in Tim Burton’s 1989 film?', 'من أدى دور باتمان في فيلم تيم برتون عام ١٩٨٩؟', 'Michael Keaton', 'مايكل كيتون', { s: 'dc', r: 'Batman (1989 film)' }],
  ['x01', 600, 'In which comic did Spider-Man first appear, in 1962?', 'في أي عدد من القصص المصورة ظهر الرجل العنكبوت لأول مرة عام ١٩٦٢؟', 'Amazing Fantasy #15', 'أميزنغ فانتسي العدد ١٥', { s: 'comics', x: 1, r: 'Amazing Fantasy #15' }],
  ['x02', 600, 'Which test pilot became the Silver Age Green Lantern in 1959?', 'أي طيار اختبار أصبح «الفانوس الأخضر» في العصر الفضي عام ١٩٥٩؟', 'Hal Jordan', 'هال جوردان', { s: 'dc', x: 1, r: 'Hal Jordan' }],
  ['x03', 600, 'Who is the editor-in-chief of the Daily Planet, Clark Kent’s newspaper?', 'من رئيس تحرير صحيفة «ديلي بلانيت» التي يعمل فيها كلارك كنت؟', 'Perry White', 'بيري وايت', { s: 'dc', r: 'Perry White' }],
  ['x04', 600, 'In Avengers: Infinity War, which dwarf king forges Thor’s axe Stormbreaker?', 'في «المنتقمون: حرب اللانهاية»، أي ملك من الأقزام صنع فأس ثور «ستورمبريكر»؟', 'Eitri', 'إيتري', { s: 'marvel', x: 1, r: 'Avengers: Infinity War' }],
  ['x05', 600, 'Which famous villain first appeared in Batman #1, in 1940?', 'أي شرير شهير ظهر لأول مرة في العدد الأول من «باتمان» عام ١٩٤٠؟', 'The Joker', 'الجوكر', { s: 'comics', r: 'Joker (character)' }],
  ['x06', 600, 'What is the name of Wonder Woman’s home island?', 'ما اسم الجزيرة التي تنحدر منها المرأة الخارقة (وندر وومن)؟', 'Themyscira', 'ثيميسكيرا', { s: 'dc', r: 'Themyscira' }],
]);

KH_BANK.cat('tv', { g: 'screen', pop: 1, e: '📺', en: 'TV Shows', ar: 'مسلسلات',
  subs: { sitcoms: ['Sitcoms', 'كوميديا'], drama: ['Drama & fantasy', 'دراما وفانتازيا'], arab: ['Arabic TV', 'مسلسلات عربية'] } }, [
  ['e01', 200, 'In which city is the sitcom Friends set?', 'في أي مدينة تدور أحداث مسلسل «فريندز»؟', 'New York', 'نيويورك', { s: 'sitcoms', r: 'Friends' }],
  ['e02', 200, 'Which show follows chemistry teacher Walter White?', 'أي مسلسل يتابع مدرّس الكيمياء والتر وايت؟', 'Breaking Bad', 'بريكنغ باد', { s: 'drama', r: 'Breaking Bad' }],
  ['e03', 200, 'In Stranger Things, what is the dark parallel dimension called?', 'في «أشياء غريبة»، ما اسم البُعد الموازي المظلم؟', 'The Upside Down', 'العالم المقلوب', { s: 'drama', r: 'Stranger Things' }],
  ['e04', 200, 'Which fantasy series is fought over the Iron Throne?', 'أي مسلسل فانتازيا يدور الصراع فيه على «العرش الحديدي»؟', 'Game of Thrones', 'صراع العروش', { s: 'drama', r: 'Game of Thrones' }],
  ['e05', 200, 'What is the name of the coffee shop in Friends?', 'ما اسم المقهى في مسلسل «فريندز»؟', 'Central Perk', 'سنترال بيرك', { s: 'sitcoms', r: 'Central Perk' }],
  ['e06', 200, 'Which yellow cartoon family lives in Springfield?', 'أي عائلة كرتونية صفراء تعيش في سبرينغفيلد؟', 'The Simpsons', 'عائلة سيمبسون', { s: 'sitcoms', r: 'The Simpsons' }],
  ['h01', 400, 'In the US version of The Office, what paper company do they work for?', 'في النسخة الأمريكية من «ذا أوفيس»، في أي شركة ورق يعملون؟', 'Dunder Mifflin', 'داندر ميفلن', { s: 'sitcoms', r: 'Dunder Mifflin' }],
  ['h02', 400, 'In Breaking Bad, what alias does Walter White use?', 'في «بريكنغ باد»، ما الاسم المستعار الذي يستخدمه والتر وايت؟', 'Heisenberg', 'هايزنبرغ', { s: 'drama', r: 'Walter White (Breaking Bad)' }],
  ['h03', 400, 'Which Korean Netflix series features players in green tracksuits competing in deadly children’s games?', 'أي مسلسل كوري على نتفليكس يتنافس فيه لاعبون بملابس رياضية خضراء في ألعاب أطفال قاتلة؟', 'Squid Game', 'لعبة الحبار', { s: 'drama', r: 'Squid Game' }],
  ['h04', 400, 'Which sitcom stars the physicist Sheldon Cooper?', 'أي مسلسل كوميدي بطله الفيزيائي شيلدون كوبر؟', 'The Big Bang Theory', 'نظرية الانفجار العظيم', { s: 'sitcoms', r: 'The Big Bang Theory' }],
  ['h05', 400, 'In Game of Thrones, what is the name of Jon Snow’s white direwolf?', 'في «صراع العروش»، ما اسم ذئب جون سنو الأبيض؟', 'Ghost', 'غوست (الشبح)', { s: 'drama', r: 'Jon Snow (character)' }],
  ['h06', 400, 'What is the name of Gus Fring’s fried-chicken chain in Breaking Bad?', 'ما اسم سلسلة مطاعم الدجاج المقلي التي يملكها غاس فرينغ في «بريكنغ باد»؟', 'Los Pollos Hermanos', 'لوس بويوس إرمانوس', { s: 'drama', r: 'Los Pollos Hermanos' }],
  ['h07', 400, 'Which long-running Saudi comedy starred Nasser Al-Qasabi and Abdullah Al-Sadhan?', 'أي مسلسل كوميدي سعودي طويل من بطولة ناصر القصبي وعبدالله السدحان؟', 'Tash Ma Tash', 'طاش ما طاش', { s: 'arab', r: 'Tash Ma Tash' }],
  ['x01', 600, 'In Friends, what is the name of Ross’s pet monkey?', 'في «فريندز»، ما اسم القرد الأليف لروس؟', 'Marcel', 'مارسيل', { s: 'sitcoms', r: 'Friends (season 1)' }],
  ['x02', 600, 'In Friends, what is Chandler Bing’s middle name?', 'في «فريندز»، ما الاسم الأوسط لتشاندلر بينغ؟', 'Muriel', 'موريل', { s: 'sitcoms', x: 1, r: 'Chandler Bing' }],
  ['x03', 600, 'In The Office, what is the name of Dwight’s family beet farm?', 'في «ذا أوفيس»، ما اسم مزرعة الشمندر التي تملكها عائلة دوايت؟', 'Schrute Farms', 'مزارع شروت', { s: 'sitcoms', x: 1, r: 'Dwight Schrute' }],
  ['x04', 600, 'In Stranger Things season 1, the kids name the monster after a creature from which game?', 'في الموسم الأول من «أشياء غريبة»، سمّى الأطفال الوحش على اسم مخلوق من أي لعبة؟', 'Dungeons & Dragons (the Demogorgon)', 'زنزانات وتنانين (الديموغورغون)', { s: 'drama', alt: ['Demogorgon'], r: 'Demogorgon' }],
  ['x05', 600, 'In Friends, what is the name of Phoebe’s identical twin sister?', 'في «فريندز»، ما اسم أخت فيبي التوأم؟', 'Ursula', 'أورسولا', { s: 'sitcoms', r: 'Phoebe Buffay' }],
  ['x06', 600, 'The Syrian series Bab Al-Hara is set in the old quarters of which city?', 'المسلسل السوري «باب الحارة» تدور أحداثه في أحياء أي مدينة قديمة؟', 'Damascus', 'دمشق', { s: 'arab', r: 'Bab Al-Hara' }],
]);

KH_BANK.cat('anime', { g: 'anime', pop: 1, e: '🍥', en: 'Anime', ar: 'أنمي',
  subs: { shonen: ['Action & shōnen', 'أكشن وشونين'], ghibli: ['Studio Ghibli', 'استوديو جيبلي'], classics: ['Classics', 'كلاسيكيات'] } }, [
  ['e01', 200, 'Which Studio Ghibli film features a big forest spirit called Totoro?', 'أي فيلم من استوديو جيبلي يظهر فيه روح الغابة الكبير «توتورو»؟', 'My Neighbor Totoro', 'جاري توتورو', { s: 'ghibli', r: 'My Neighbor Totoro' }],
  ['e02', 200, 'In Attack on Titan, what are the giant man-eating creatures called?', 'في «هجوم العمالقة»، ماذا تُسمّى المخلوقات الضخمة آكلة البشر؟', 'Titans', 'العمالقة', { s: 'shonen', r: 'Attack on Titan' }],
  ['e03', 200, 'Which anime is about a notebook that kills anyone whose name is written in it?', 'أي أنمي يدور حول دفتر يقتل كل من يُكتب اسمه فيه؟', 'Death Note', 'مذكرة الموت', { s: 'classics', r: 'Death Note' }],
  ['e04', 200, 'In Demon Slayer, what is the name of Tanjiro’s sister who becomes a demon?', 'في «قاتل الشياطين»، ما اسم أخت تانجيرو التي تتحول إلى شيطان؟', 'Nezuko', 'نيزوكو', { s: 'shonen', r: 'Nezuko Kamado' }],
  ['e05', 200, 'Which anime follows Gon and Killua?', 'أي أنمي يتابع مغامرات غون وكيلوا؟', 'Hunter × Hunter', 'القناص (هنتر × هنتر)', { s: 'shonen', alt: ['Hunter x Hunter'], r: 'Hunter × Hunter' }],
  ['e06', 200, 'Which anime’s hero, Saitama, beats every enemy with a single punch?', 'أي أنمي بطله سايتاما يهزم كل عدو بلكمة واحدة؟', 'One-Punch Man', 'ون بنش مان', { s: 'shonen', r: 'One-Punch Man' }],
  ['h01', 400, 'Who directed Spirited Away?', 'من أخرج فيلم «المخطوفة»؟', 'Hayao Miyazaki', 'هاياو ميازاكي', { s: 'ghibli', alt: ['Miyazaki'], r: 'Hayao Miyazaki' }],
  ['h02', 400, 'In Death Note, what is the name of the student who finds the notebook?', 'في «مذكرة الموت»، ما اسم الطالب الذي يجد الدفتر؟', 'Light Yagami', 'لايت ياغامي', { s: 'classics', alt: ['Light'], r: 'Light Yagami' }],
  ['h03', 400, 'In Jujutsu Kaisen, whose fingers does Yuji Itadori swallow?', 'في «جوجوتسو كايسن»، أصابع من يبتلعها يوجي إيتادوري؟', 'Ryomen Sukuna', 'ريومين سوكونا', { s: 'shonen', alt: ['Sukuna'], r: 'Jujutsu Kaisen' }],
  ['h04', 400, 'In Death Note, what is the name of the shinigami who drops the notebook?', 'في «مذكرة الموت»، ما اسم إله الموت الذي أسقط الدفتر؟', 'Ryuk', 'ريوك', { s: 'classics', r: 'Ryuk' }],
  ['h05', 400, 'What is the surname of Eren in Attack on Titan?', 'ما اسم عائلة إيرين في «هجوم العمالقة»؟', 'Yeager', 'ييغر', { s: 'shonen', alt: ['Jaeger'], r: 'Eren Yeager' }],
  ['h06', 400, 'Which breathing style does Tanjiro first learn in Demon Slayer?', 'ما أسلوب التنفس الذي يتعلمه تانجيرو أولاً في «قاتل الشياطين»؟', 'Water Breathing', 'تنفس الماء', { s: 'shonen', r: 'Tanjiro Kamado' }],
  ['h07', 400, 'In Fullmetal Alchemist, what is Alphonse Elric’s soul bound to?', 'في «الخيميائي المعدني»، بماذا رُبطت روح ألفونس إلريك؟', 'A suit of armour', 'درع حديدي', { s: 'classics', r: 'Alphonse Elric' }],
  ['x01', 600, 'In Hunter × Hunter, what is the name of the Chimera Ant King?', 'في «القناص»، ما اسم ملك نمل الكيميرا؟', 'Meruem', 'ميرويم', { s: 'shonen', x: 1, r: 'Meruem' }],
  ['x02', 600, 'In Death Note, what is L’s full name, revealed in official guides?', 'في «مذكرة الموت»، ما الاسم الكامل لـ«إل» كما كُشف في الأدلة الرسمية؟', 'L Lawliet', 'إل لوليت', { s: 'classics', x: 1, r: 'L (Death Note)' }],
  ['x03', 600, 'In Attack on Titan, what is Captain Levi’s family name?', 'في «هجوم العمالقة»، ما اسم عائلة الكابتن ليفاي؟', 'Ackerman', 'أكرمان', { s: 'shonen', r: 'Levi Ackerman' }],
  ['x04', 600, 'In Neon Genesis Evangelion, which Evangelion unit does Shinji Ikari pilot?', 'في «نيون جينيسيس إيفانجيليون»، أي وحدة إيفا يقودها شينجي إيكاري؟', 'Unit-01', 'الوحدة ٠١', { s: 'classics', x: 1, alt: ['Eva-01', 'Evangelion Unit-01'], r: 'Evangelion (mecha)' }],
  ['x05', 600, 'In Jujutsu Kaisen, what is Satoru Gojo’s Domain Expansion called?', 'في «جوجوتسو كايسن»، ما اسم توسيع المجال الخاص بساتورو غوجو؟', 'Unlimited Void', 'الفراغ اللامحدود', { s: 'shonen', x: 1, alt: ['Infinite Void'], r: 'Satoru Gojo' }],
  ['x06', 600, 'In Demon Slayer, which Upper Moon demon kills Kyojuro Rengoku?', 'في «قاتل الشياطين»، أي شيطان من الأقمار العليا قتل كيوجورو رينغوكو؟', 'Akaza', 'أكازا', { s: 'shonen', r: 'Kyojuro Rengoku' }],
]);

KH_BANK.cat('onepiece', { g: 'anime', pop: 1, e: '🏴‍☠️', en: 'One Piece', ar: 'ون بيس',
  subs: { crew: ['Straw Hats', 'قبعة القش'], world: ['The world', 'العالم'], powers: ['Devil Fruits', 'فاكهة الشيطان'] } }, [
  ['e01', 200, 'What is the name of Luffy’s pirate crew?', 'ما اسم طاقم القراصنة الخاص بلوفي؟', 'The Straw Hat Pirates', 'قراصنة قبعة القش', { s: 'crew', alt: ['Straw Hats'], r: 'Straw Hat Pirates' }],
  ['e02', 200, 'Which Devil Fruit gave Luffy his rubber body, as it was first called?', 'أي فاكهة شيطان منحت لوفي جسمه المطاطي حسب اسمها الأول؟', 'The Gum-Gum Fruit (Gomu Gomu no Mi)', 'فاكهة المطاط (غومو غومو)', { s: 'powers', alt: ['Gomu Gomu no Mi'], r: 'Monkey D. Luffy' }],
  ['e03', 200, 'What does Luffy dream of becoming?', 'ما الذي يحلم لوفي أن يصبحه؟', 'King of the Pirates', 'ملك القراصنة', { s: 'crew', alt: ['Pirate King'], r: 'Monkey D. Luffy' }],
  ['e04', 200, 'Which Straw Hat swordsman fights with three swords?', 'أي سيّاف من قبعة القش يقاتل بثلاثة سيوف؟', 'Roronoa Zoro', 'رورونوا زورو', { s: 'crew', alt: ['Zoro'], r: 'Roronoa Zoro' }],
  ['e05', 200, 'What is the name of the legendary treasure everyone is searching for?', 'ما اسم الكنز الأسطوري الذي يبحث عنه الجميع؟', 'The One Piece', 'ون بيس', { s: 'world', r: 'One Piece' }],
  ['e06', 200, 'Who is the Straw Hats’ cook?', 'من طبّاخ طاقم قبعة القش؟', 'Sanji', 'سانجي', { s: 'crew', r: 'Sanji (One Piece)' }],
  ['h01', 400, 'Who created One Piece?', 'من مؤلف «ون بيس»؟', 'Eiichiro Oda', 'إييتشيرو أودا', { s: 'world', alt: ['Oda'], r: 'Eiichiro Oda' }],
  ['h02', 400, 'What is the name of the Straw Hats’ second ship?', 'ما اسم السفينة الثانية لطاقم قبعة القش؟', 'Thousand Sunny', 'ثاوزند صني', { s: 'crew', r: 'Thousand Sunny' }],
  ['h03', 400, 'Who gave Luffy his straw hat?', 'من أعطى لوفي قبعة القش؟', 'Shanks', 'شانكس', { s: 'world', alt: ['Red-Haired Shanks'], r: 'Shanks (One Piece)' }],
  ['h04', 400, 'Which reindeer is the Straw Hats’ doctor?', 'أي حيوان رنّة هو طبيب طاقم قبعة القش؟', 'Tony Tony Chopper', 'توني توني تشوبر', { s: 'crew', alt: ['Chopper'], r: 'Tony Tony Chopper' }],
  ['h05', 400, 'What was the name of the Straw Hats’ first ship?', 'ما اسم السفينة الأولى لطاقم قبعة القش؟', 'Going Merry', 'غوينغ ميري', { s: 'crew', ok: 1, alt: ['the Merry'], r: 'Going Merry' }],
  ['h06', 400, 'Which Straw Hat shipwright built the Thousand Sunny?', 'أي نجّار سفن من قبعة القش بنى «ثاوزند صني»؟', 'Franky', 'فرانكي', { s: 'crew', r: 'Franky (One Piece)' }],
  ['x01', 600, 'What is the name of Luffy’s father?', 'ما اسم والد لوفي؟', 'Monkey D. Dragon', 'مونكي دي دراغون', { s: 'world', alt: ['Dragon'], r: 'Monkey D. Dragon' }],
  ['x02', 600, 'Which Devil Fruit did Blackbeard take from Whitebeard after his death?', 'أي فاكهة شيطان أخذها اللحية السوداء من اللحية البيضاء بعد موته؟', 'The Tremor-Tremor Fruit (Gura Gura no Mi)', 'فاكهة الاهتزاز (غورا غورا)', { s: 'powers', x: 1, alt: ['Gura Gura no Mi'], r: 'Marshall D. Teach' }],
  ['x03', 600, 'What is the true name of Luffy’s Devil Fruit, revealed in the Wano arc?', 'ما الاسم الحقيقي لفاكهة لوفي الذي كُشف في آرك وانو؟', 'Hito Hito no Mi, Model: Nika', 'هيتو هيتو نو مي، نموذج: نيكا', { s: 'powers', x: 1, alt: ['Human-Human Fruit, Model: Nika'], r: 'Monkey D. Luffy' }],
  ['x04', 600, 'What is the name of the old pirate song Brook often plays?', 'ما اسم أغنية القراصنة القديمة التي يعزفها بروك كثيراً؟', 'Binks’ Sake', 'شراب بينكس', { s: 'crew', x: 1, alt: ['Bink\'s Sake'], r: 'Brook (One Piece)' }],
  ['x05', 600, 'At which Marine headquarters was the war over Portgas D. Ace’s execution fought?', 'في أي مقر للبحرية دارت الحرب حول إعدام بورتغاس دي آيس؟', 'Marineford', 'مارين فورد', { s: 'world', r: 'Portgas D. Ace' }],
  ['x06', 600, 'What is the name of Zoro’s white-handled sword, a gift from his childhood friend?', 'ما اسم سيف زورو ذي المقبض الأبيض الذي ورثه عن صديقة طفولته؟', 'Wado Ichimonji', 'وادو إيتشيمونجي', { s: 'crew', x: 1, r: 'Roronoa Zoro' }],
]);

KH_BANK.cat('shonen-classics', { g: 'anime', e: '🍃', en: 'Naruto & Dragon Ball', ar: 'ناروتو ودراغون بول',
  subs: { naruto: ['Naruto', 'ناروتو'], db: ['Dragon Ball', 'دراغون بول'] } }, [
  ['e01', 200, 'Which village is Naruto Uzumaki from?', 'من أي قرية ينحدر ناروتو أوزوماكي؟', 'The Hidden Leaf (Konoha)', 'قرية الورق الخفية (كونوها)', { s: 'naruto', alt: ['Konoha', 'Konohagakure'], r: 'Konohagakure' }],
  ['e02', 200, 'Which tailed beast is sealed inside Naruto?', 'أي وحش ذي ذيول مختوم داخل ناروتو؟', 'The Nine-Tailed Fox', 'الثعلب ذو الذيول التسعة', { s: 'naruto', alt: ['Nine-Tails', 'Kurama'], r: 'Kurama (Naruto)' }],
  ['e03', 200, 'What is the name of Goku’s most famous energy-wave attack?', 'ما اسم أشهر هجوم طاقة يطلقه غوكو؟', 'Kamehameha', 'كاميهاميها', { s: 'db', r: 'Kamehameha (Dragon Ball)' }],
  ['e04', 200, 'What colour does a Super Saiyan’s hair turn?', 'إلى أي لون يتحول شعر السوبر سايان؟', 'Gold (blond)', 'ذهبي (أشقر)', { s: 'db', alt: ['Yellow'], r: 'Super Saiyan' }],
  ['e05', 200, 'Which member of the Uchiha clan is Naruto’s rival and best friend?', 'أي فرد من عشيرة أوتشيها هو منافس ناروتو وصديقه المقرب؟', 'Sasuke Uchiha', 'ساسكي أوتشيها', { s: 'naruto', alt: ['Sasuke'], r: 'Sasuke Uchiha' }],
  ['e06', 200, 'What title does Naruto dream of earning as leader of his village?', 'أي لقب يحلم ناروتو بنيله كقائد لقريته؟', 'Hokage', 'هوكاغي', { s: 'naruto', r: 'Naruto Uzumaki' }],
  ['h01', 400, 'What is Goku’s Saiyan birth name?', 'ما اسم غوكو الأصلي كسايان؟', 'Kakarot', 'كاكاروت', { s: 'db', r: 'Goku' }],
  ['h02', 400, 'Which of Goku’s sons defeats Cell?', 'أي من أبناء غوكو هزم سيل؟', 'Gohan', 'غوهان', { s: 'db', r: 'Gohan' }],
  ['h03', 400, 'Which masked Team 7 teacher has a Sharingan in one eye?', 'أي معلّم مقنّع لفريق ٧ لديه شارينغان في عين واحدة؟', 'Kakashi Hatake', 'كاكاشي هاتاكي', { s: 'naruto', alt: ['Kakashi'], r: 'Kakashi Hatake' }],
  ['h04', 400, 'Who created Dragon Ball?', 'من مؤلف «دراغون بول»؟', 'Akira Toriyama', 'أكيرا تورياما', { s: 'db', alt: ['Toriyama'], r: 'Akira Toriyama' }],
  ['h05', 400, 'What is the name of the Eternal Dragon summoned with the Dragon Balls on Earth?', 'ما اسم التنين الخالد الذي يُستدعى بكرات التنين على الأرض؟', 'Shenron', 'شينرون', { s: 'db', alt: ['Shenlong'], r: 'Dragon Ball (object)' }],
  ['h06', 400, 'Who killed Jiraiya in Naruto Shippuden?', 'من قتل جيرايا في «ناروتو شيبودن»؟', 'Pain', 'باين', { s: 'naruto', alt: ['Nagato'], r: 'Jiraiya (Naruto)' }],
  ['h07', 400, 'Who is Naruto’s father?', 'من والد ناروتو؟', 'Minato Namikaze', 'ميناتو ناميكازي', { s: 'naruto', alt: ['the Fourth Hokage', 'Minato'], r: 'Minato Namikaze' }],
  ['x01', 600, 'Goku’s Kamehameha is named after a king from which place?', 'هجوم «كاميهاميها» سُمّي على اسم ملك من أي مكان؟', 'Hawaii', 'هاواي', { s: 'db', x: 1, n: 'King Kamehameha I united the Hawaiian Islands.', nAr: 'الملك كاميهاميها الأول وحّد جزر هاواي.', r: 'Kamehameha I' }],
  ['x02', 600, 'Who was the grandfather who raised Goku and gave his name to Goku’s son?', 'من الجد الذي ربّى غوكو وسُمّي ابن غوكو على اسمه؟', 'Grandpa Gohan', 'الجد غوهان', { s: 'db', x: 1, ok: 1, r: 'List of Dragon Ball characters' }],
  ['x03', 600, 'What is the name of Minato’s signature teleportation technique?', 'ما اسم تقنية الانتقال الآني الشهيرة لميناتو؟', 'Flying Thunder God (Hiraishin)', 'إله الرعد الطائر (هيرايشين)', { s: 'naruto', x: 1, alt: ['Hiraishin'], r: 'Minato Namikaze' }],
  ['x04', 600, 'Which Naruto ninja is the great master of the Eight Inner Gates?', 'أي نينجا في ناروتو هو أستاذ «البوابات الثماني الداخلية»؟', 'Might Guy', 'مايت غاي', { s: 'naruto', alt: ['Guy'], r: 'Might Guy' }],
  ['x05', 600, 'Which God of Destruction rules Universe 7 in Dragon Ball Super?', 'أي إله دمار يحكم الكون السابع في «دراغون بول سوبر»؟', 'Beerus', 'بيروس', { s: 'db', r: 'Beerus' }],
  ['x06', 600, 'What is the name of the Saiyans’ home planet that Frieza destroyed?', 'ما اسم كوكب السايان الأصلي الذي دمّره فريزا؟', 'Planet Vegeta', 'كوكب فيجيتا', { s: 'db', x: 1, r: 'Saiyan' }],
]);

KH_BANK.cat('pokemon', { g: 'anime', pop: 1, e: '⚡', en: 'Pokémon', ar: 'بوكيمون',
  subs: { creatures: ['Pokémon', 'البوكيمونات'], games: ['Games & history', 'الألعاب والتاريخ'], anime: ['The anime', 'الأنمي'] } }, [
  ['e01', 200, 'Which Pokémon is Ash’s partner in the anime?', 'أي بوكيمون هو رفيق آش في الأنمي؟', 'Pikachu', 'بيكاتشو', { s: 'anime', r: 'Pikachu' }],
  ['e02', 200, 'What type is Charmander?', 'من أي نوع بوكيمون تشارماندر؟', 'Fire', 'ناري', { s: 'creatures', r: 'Charmander' }],
  ['e03', 200, 'Which professor gives out starter Pokémon in Pallet Town?', 'أي بروفيسور يوزّع بوكيمونات البداية في بلدة باليت؟', 'Professor Oak', 'البروفيسور أوك', { s: 'games', alt: ['Oak'], r: 'Professor Oak' }],
  ['e04', 200, 'What do trainers throw to catch Pokémon?', 'ماذا يرمي المدربون لالتقاط البوكيمون؟', 'A Poké Ball', 'كرة البوكيمون', { s: 'games', alt: ['Pokeball'], r: 'Poké Ball' }],
  ['e05', 200, 'Which legendary Pokémon, number 150, was created by scientists?', 'أي بوكيمون أسطوري رقم ١٥٠ صنعه العلماء؟', 'Mewtwo', 'ميوتو', { s: 'creatures', r: 'Mewtwo' }],
  ['e06', 200, 'Which Team Rocket Pokémon can talk like a human?', 'أي بوكيمون من فريق روكيت يتكلم مثل البشر؟', 'Meowth', 'مياوث', { s: 'anime', r: 'Meowth' }],
  ['h01', 400, 'Which water-type Pokémon does Eevee evolve into with a Water Stone?', 'إلى أي بوكيمون مائي يتطور إيفي بحجر الماء؟', 'Vaporeon', 'فابوريون', { s: 'creatures', r: 'Vaporeon' }],
  ['h02', 400, 'How many Pokémon were in the original Red and Green games?', 'كم بوكيمون كان في لعبتي الأحمر والأخضر الأصليتين؟', '151', '١٥١', { s: 'games', r: 'List of generation I Pokémon' }],
  ['h03', 400, 'Which Pokémon is number 001 in the National Pokédex?', 'أي بوكيمون رقمه ٠٠١ في البوكيديكس الوطني؟', 'Bulbasaur', 'بلباسور', { s: 'creatures', r: 'Bulbasaur' }],
  ['h04', 400, 'In which region are Pokémon Red and Blue set?', 'في أي منطقة تدور أحداث بوكيمون الأحمر والأزرق؟', 'Kanto', 'كانتو', { s: 'games', r: 'Kanto (Pokémon)' }],
  ['h05', 400, 'Who is the Water-type Gym Leader of Cerulean City?', 'من قائدة صالة سيرولين ذات النوع المائي؟', 'Misty', 'ميستي', { s: 'anime', r: 'Misty (Pokémon)' }],
  ['h06', 400, 'Which Pokémon does Ash’s Pikachu famously refuse to evolve into?', 'إلى أي بوكيمون يرفض بيكاتشو الخاص بآش أن يتطور؟', 'Raichu', 'رايتشو', { s: 'anime', r: 'Pikachu' }],
  ['x01', 600, 'According to designer Ken Sugimori, which Pokémon was the first ever designed?', 'حسب المصمم كين سوغيموري، ما أول بوكيمون صُمّم على الإطلاق؟', 'Rhydon', 'رايدون', { s: 'games', x: 1, r: 'Rhydon' }],
  ['x02', 600, 'What is the name of the famous glitch Pokémon from Red and Blue?', 'ما اسم بوكيمون الخلل البرمجي الشهير في الأحمر والأزرق؟', 'MissingNo.', 'ميسنغ نو', { s: 'games', x: 1, r: 'MissingNo.' }],
  ['x03', 600, 'Who created Pokémon, inspired by his childhood hobby of collecting insects?', 'من ابتكر بوكيمون مستوحياً هوايته في جمع الحشرات أيام طفولته؟', 'Satoshi Tajiri', 'ساتوشي تاجيري', { s: 'games', r: 'Satoshi Tajiri' }],
  ['x04', 600, 'What is Gyarados’s type combination?', 'ما نوعا بوكيمون غياردوس؟', 'Water and Flying', 'مائي وطائر', { s: 'creatures', r: 'Gyarados' }],
  ['x05', 600, 'What is Pikachu’s number in the National Pokédex?', 'ما رقم بيكاتشو في البوكيديكس الوطني؟', '25', '٢٥', { s: 'creatures', x: 1, ok: 1, r: 'Pikachu' }],
  ['x06', 600, 'What is the name of the mythical Pokémon hidden in the original games’ code, number 151?', 'ما اسم البوكيمون الأسطوري المخفي في كود الألعاب الأصلية، رقم ١٥١؟', 'Mew', 'ميو', { s: 'creatures', r: 'Mew (Pokémon)' }],
]);

/* ---- bank/21-games-music.js ---- */
/* Video games and music. No lyrics: questions about songs ask for titles, artists and facts only. */
KH_BANK.cat('videogames', { g: 'games', pop: 1, e: '🎮', en: 'Video Games', ar: 'ألعاب الفيديو',
  subs: { characters: ['Characters', 'شخصيات'], worlds: ['Worlds & lore', 'عوالم وقصص'], studios: ['Studios', 'استوديوهات'] } }, [
  ['e01', 200, 'In Minecraft, which green creature sneaks up and explodes?', 'في ماينكرافت، أي مخلوق أخضر يتسلل وينفجر؟', 'The Creeper', 'الكريبر', { s: 'characters', f: 'creeper', r: 'Creeper (Minecraft)' }],
  ['e02', 200, 'Which battle royale game drops players onto an island from a "Battle Bus"?', 'أي لعبة باتل رويال يقفز فيها اللاعبون إلى جزيرة من «باص المعركة»؟', 'Fortnite', 'فورتنايت', { s: 'worlds', r: 'Fortnite Battle Royale' }],
  ['e03', 200, 'What is the name of the green-clad hero of The Legend of Zelda?', 'ما اسم البطل ذي الملابس الخضراء في «أسطورة زيلدا»؟', 'Link', 'لينك', { s: 'characters', r: 'Link (The Legend of Zelda)' }],
  ['e04', 200, 'Which blue hedgehog is Sega’s mascot?', 'أي قنفذ أزرق هو تميمة شركة سيغا؟', 'Sonic', 'سونيك', { s: 'characters', alt: ['Sonic the Hedgehog'], r: 'Sonic the Hedgehog (character)' }],
  ['e05', 200, 'Which game series stars the armoured super-soldier Master Chief?', 'أي سلسلة ألعاب بطلها الجندي الخارق المدرّع «ماستر تشيف»؟', 'Halo', 'هيلو', { s: 'characters', r: 'Master Chief (Halo)' }],
  ['e06', 200, 'In Among Us, what are the players secretly sabotaging the crew called?', 'في لعبة «أمونغ أس»، ماذا يُسمّى اللاعبون الذين يخرّبون الطاقم سراً؟', 'Impostors', 'المحتالون', { s: 'worlds', r: 'Among Us' }],
  ['h01', 400, 'Which Swedish studio originally created Minecraft?', 'أي استوديو سويدي ابتكر ماينكرافت في الأصل؟', 'Mojang', 'موجانغ', { s: 'studios', r: 'Mojang Studios' }],
  ['h02', 400, 'What is the name of the city in Grand Theft Auto V?', 'ما اسم المدينة في لعبة «جراند ثفت أوتو ٥»؟', 'Los Santos', 'لوس سانتوس', { s: 'worlds', r: 'Los Santos' }],
  ['h03', 400, 'The famous "Konami Code" first appeared in the home version of which shoot-’em-up?', 'ظهر «كود كونامي» الشهير لأول مرة في النسخة المنزلية من أي لعبة تصويب؟', 'Gradius', 'غراديوس', { s: 'studios', r: 'Konami Code' }],
  ['h04', 400, 'In God of War (2018), what is the name of Kratos’s son?', 'في «إله الحرب» (٢٠١٨)، ما اسم ابن كريتوس؟', 'Atreus', 'أتريوس', { s: 'characters', r: 'God of War (2018 video game)' }],
  ['h05', 400, 'Which game series follows assassins such as Altaïr and Ezio Auditore?', 'أي سلسلة ألعاب تتابع قتلة مثل الطائر وإتسيو أوديتوري؟', 'Assassin’s Creed', 'عقيدة القاتل', { s: 'worlds', r: 'Assassin\'s Creed' }],
  ['h06', 400, 'Which Polish studio made The Witcher 3: Wild Hunt?', 'أي استوديو بولندي صنع «ذا ويتشر ٣»؟', 'CD Projekt Red', 'سي دي بروجكت رد', { s: 'studios', alt: ['CD Projekt'], r: 'CD Projekt' }],
  ['x01', 600, 'In Half-Life, what is the name of the research facility where the disaster begins?', 'في «هاف لايف»، ما اسم منشأة الأبحاث التي تبدأ فيها الكارثة؟', 'Black Mesa', 'بلاك ميسا', { s: 'worlds', r: 'Black Mesa (Half-Life)' }],
  ['x02', 600, 'What is the name of the testing AI that taunts you in Portal?', 'ما اسم الذكاء الاصطناعي الذي يسخر منك في لعبة «بورتال»؟', 'GLaDOS', 'غلادوس', { s: 'characters', r: 'GLaDOS' }],
  ['x03', 600, 'What was Pac-Man’s original name in Japan?', 'ما الاسم الأصلي لـ«باك مان» في اليابان؟', 'Puck Man', 'باك مان (Puck Man)', { s: 'characters', x: 1, r: 'Pac-Man' }],
  ['x04', 600, 'Which 1980 Atari 2600 game hid one of the first known video game Easter eggs, the designer’s name?', 'أي لعبة على أتاري ٢٦٠٠ عام ١٩٨٠ أخفت واحدة من أوائل «البيضات المخفية»، اسم مصممها؟', 'Adventure', 'أدفنتشر (Adventure)', { s: 'studios', x: 1, n: 'Warren Robinett hid his name in a secret room.', nAr: 'أخفى وارن روبينيت اسمه في غرفة سرية.', r: 'Adventure (1980 video game)' }],
  ['x05', 600, 'What is the first boss you face in the original Dark Souls?', 'ما أول زعيم تواجهه في «دارك سولز» الأولى؟', 'The Asylum Demon', 'شيطان المصحّة', { s: 'worlds', x: 1, r: 'Dark Souls (video game)' }],
  ['x06', 600, 'What does Geralt of Rivia call every horse he rides in The Witcher games?', 'ماذا يسمّي جيرالت كل حصان يركبه في ألعاب «ذا ويتشر»؟', 'Roach', 'روتش', { s: 'characters', r: 'Geralt of Rivia' }],
]);

KH_BANK.cat('nintendo', { g: 'games', e: '🍄', en: 'Nintendo', ar: 'نينتندو',
  subs: { mario: ['Mario', 'ماريو'], zelda: ['Zelda', 'زيلدا'], company: ['The company', 'الشركة'] } }, [
  ['e01', 200, 'What colour is Luigi’s cap?', 'ما لون قبعة لويجي؟', 'Green', 'أخضر', { s: 'mario', r: 'Luigi' }],
  ['e02', 200, 'Which Nintendo console, launched in 2017, works both as a handheld and on a TV?', 'أي جهاز من نينتندو صدر عام ٢٠١٧ يعمل محمولاً وعلى التلفزيون؟', 'Nintendo Switch', 'نينتندو سويتش', { s: 'company', alt: ['Switch'], r: 'Nintendo Switch' }],
  ['e03', 200, 'What is the name of Mario’s green dinosaur friend?', 'ما اسم صديق ماريو الديناصور الأخضر؟', 'Yoshi', 'يوشي', { s: 'mario', r: 'Yoshi' }],
  ['e04', 200, 'Which princess rules the Mushroom Kingdom?', 'أي أميرة تحكم مملكة الفطر؟', 'Princess Peach', 'الأميرة بيتش', { s: 'mario', alt: ['Peach'], r: 'Princess Peach' }],
  ['e05', 200, 'Who is the spiky-shelled King of the Koopas?', 'من ملك الكوبا ذو الدرع الشائك؟', 'Bowser', 'باوزر', { s: 'mario', r: 'Bowser (character)' }],
  ['e06', 200, 'Which pink puffball can inhale enemies and copy their powers?', 'أي كرة وردية منفوخة تستطيع ابتلاع الأعداء ونسخ قدراتهم؟', 'Kirby', 'كيربي', { s: 'company', r: 'Kirby (character)' }],
  ['h01', 400, 'In which Japanese city was Nintendo founded?', 'في أي مدينة يابانية تأسست نينتندو؟', 'Kyoto', 'كيوتو', { s: 'company', r: 'Nintendo' }],
  ['h02', 400, 'What did Nintendo make when it was founded in 1889?', 'ماذا كانت تصنع نينتندو عند تأسيسها عام ١٨٨٩؟', 'Playing cards (hanafuda)', 'أوراق اللعب (هانافودا)', { s: 'company', r: 'Nintendo' }],
  ['h03', 400, 'What is the name of the kingdom in most Legend of Zelda games?', 'ما اسم المملكة في معظم ألعاب «أسطورة زيلدا»؟', 'Hyrule', 'هايرول', { s: 'zelda', r: 'Hyrule' }],
  ['h04', 400, 'What was Mario called in the original 1981 Donkey Kong?', 'ماذا كان اسم ماريو في لعبة «دونكي كونغ» الأصلية عام ١٩٨١؟', 'Jumpman', 'جمب مان', { s: 'mario', r: 'Mario' }],
  ['h05', 400, 'What is the name of Link’s loyal horse?', 'ما اسم حصان لينك الوفي؟', 'Epona', 'إيبونا', { s: 'zelda', r: 'Epona' }],
  ['h06', 400, 'Which Nintendo designer created both Mario and The Legend of Zelda?', 'أي مصمم في نينتندو ابتكر ماريو وزيلدا معاً؟', 'Shigeru Miyamoto', 'شيغيرو مياموتو', { s: 'company', alt: ['Miyamoto'], r: 'Shigeru Miyamoto' }],
  ['h07', 400, 'Which puzzle game came bundled with the Game Boy in North America and Europe?', 'أي لعبة ألغاز كانت مرفقة مع جهاز غيم بوي في أمريكا الشمالية وأوروبا؟', 'Tetris', 'تتريس', { s: 'company', r: 'Tetris (Game Boy video game)' }],
  ['x01', 600, 'Mario was reportedly named after Mario Segale. Who was he?', 'يُقال إن ماريو سُمّي على اسم ماريو سيغالي. من كان؟', 'The landlord of Nintendo of America’s warehouse', 'مالك مستودع نينتندو أمريكا', { s: 'mario', x: 1, r: 'Mario Segale' }],
  ['x02', 600, 'Which 1995 Nintendo console, with red-and-black 3D graphics, was a commercial flop?', 'أي جهاز من نينتندو عام ١٩٩٥ بشاشة ثلاثية الأبعاد بالأحمر والأسود فشل تجارياً؟', 'Virtual Boy', 'فيرتشوال بوي', { s: 'company', r: 'Virtual Boy' }],
  ['x03', 600, 'The music track "Gerudo Valley" comes from which Zelda game?', 'مقطوعة «وادي جيرودو» من أي لعبة زيلدا؟', 'Ocarina of Time', 'أوكارينا الزمن', { s: 'zelda', x: 1, r: 'The Legend of Zelda: Ocarina of Time' }],
  ['x04', 600, 'What was the Nintendo Wii’s codename during development?', 'ما الاسم الرمزي لجهاز نينتندو وي أثناء تطويره؟', 'Revolution', 'ريفوليوشن (الثورة)', { s: 'company', x: 1, r: 'Wii' }],
  ['x05', 600, 'In the original Legend of Zelda (1986), what does the old man in the first cave give Link?', 'في «أسطورة زيلدا» الأصلية (١٩٨٦)، ماذا يعطي الرجل العجوز في الكهف الأول لينك؟', 'A sword', 'سيفاً', { s: 'zelda', n: 'With the famous line "It’s dangerous to go alone! Take this."', nAr: 'مع جملته الشهيرة: «خطر أن تذهب وحدك! خذ هذا».', r: 'It\'s dangerous to go alone' }],
  ['x06', 600, 'Samus Aran first appeared in which 1986 game?', 'في أي لعبة عام ١٩٨٦ ظهرت سامس آران لأول مرة؟', 'Metroid', 'ميترويد', { s: 'company', r: 'Metroid (video game)' }],
]);

KH_BANK.cat('gaming-history', { g: 'games', niche: 1, e: '🕹️', en: 'Consoles & Gaming History', ar: 'أجهزة الألعاب وتاريخها',
  subs: { consoles: ['Consoles', 'أجهزة'], arcade: ['Arcade era', 'عصر الأركيد'], industry: ['Industry', 'الصناعة'] } }, [
  ['e01', 200, 'Which company makes the PlayStation?', 'أي شركة تصنع البلايستيشن؟', 'Sony', 'سوني', { s: 'consoles', r: 'PlayStation' }],
  ['e02', 200, 'Which company makes the Xbox?', 'أي شركة تصنع الإكس بوكس؟', 'Microsoft', 'مايكروسوفت', { s: 'consoles', r: 'Xbox' }],
  ['e03', 200, 'Which 1980 arcade hero is a yellow circle that eats dots and avoids ghosts?', 'أي بطل أركيد عام ١٩٨٠ عبارة عن دائرة صفراء تأكل النقاط وتهرب من الأشباح؟', 'Pac-Man', 'باك مان', { s: 'arcade', r: 'Pac-Man' }],
  ['e04', 200, 'Which falling-block puzzle game was created in the Soviet Union?', 'أي لعبة ألغاز بمكعبات متساقطة ابتُكرت في الاتحاد السوفيتي؟', 'Tetris', 'تتريس', { s: 'arcade', r: 'Tetris' }],
  ['e05', 200, 'Which is the best-selling home video game console of all time?', 'ما أكثر جهاز ألعاب منزلي مبيعاً في التاريخ؟', 'PlayStation 2', 'بلايستيشن ٢', { v: 'web:2026-10-10', s: 'consoles', alt: ['PS2'], n: 'Sony: over 160 million (Nov 2024). The Switch was at 156.6 million in June 2026 and may overtake it.', nAr: 'سوني: أكثر من ١٦٠ مليون (نوفمبر ٢٠٢٤). وصل سويتش إلى ١٥٦٫٦ مليون في يونيو ٢٠٢٦ وقد يتجاوزه.', c: 1, asOf: '2026-06', r: 'List of best-selling game consoles' }],
  ['e06', 200, 'Which game is the best-selling video game of all time?', 'ما أكثر لعبة فيديو مبيعاً في التاريخ؟', 'Minecraft', 'ماينكرافت', { s: 'industry', ok: 1, c: 1, asOf: '2026-06', r: 'List of best-selling video games' }],
  ['h01', 400, 'Who created Tetris?', 'من ابتكر لعبة تتريس؟', 'Alexey Pajitnov', 'أليكسي باجيتنوف', { s: 'arcade', alt: ['Pajitnov'], r: 'Alexey Pajitnov' }],
  ['h02', 400, 'Which 1972 Atari table-tennis game was the first big arcade hit?', 'أي لعبة تنس طاولة من أتاري عام ١٩٧٢ كانت أول نجاح كبير في الأركيد؟', 'Pong', 'بونغ', { s: 'arcade', r: 'Pong' }],
  ['h03', 400, 'Which company made the Dreamcast, its last home console?', 'أي شركة صنعت جهاز دريمكاست، آخر أجهزتها المنزلية؟', 'Sega', 'سيغا', { s: 'consoles', r: 'Dreamcast' }],
  ['h04', 400, 'In which year was the first PlayStation released in Japan?', 'في أي عام صدر أول بلايستيشن في اليابان؟', '1994', '١٩٩٤', { s: 'consoles', r: 'PlayStation (console)' }],
  ['h05', 400, 'Which Sony handheld was released in 2004?', 'أي جهاز محمول من سوني صدر عام ٢٠٠٤؟', 'PlayStation Portable (PSP)', 'بلايستيشن بورتابل (PSP)', { s: 'consoles', alt: ['PSP'], r: 'PlayStation Portable' }],
  ['h06', 400, 'What does the company name Sega originally stand for?', 'ماذا يعني اسم شركة سيغا في الأصل؟', 'Service Games', 'سيرفس غيمز (Service Games)', { s: 'industry', r: 'Sega' }],
  ['x01', 600, 'What was the first home video game console, released in 1972?', 'ما أول جهاز ألعاب فيديو منزلي، صدر عام ١٩٧٢؟', 'Magnavox Odyssey', 'ماغنافوكس أوديسي', { s: 'consoles', x: 1, r: 'Magnavox Odyssey' }],
  ['x02', 600, 'In which New Mexico city were unsold Atari cartridges, including E.T., buried in 1983?', 'في أي مدينة بولاية نيو مكسيكو دُفنت أشرطة أتاري غير المباعة، ومنها E.T.، عام ١٩٨٣؟', 'Alamogordo', 'ألاموغوردو', { s: 'industry', x: 1, r: 'Atari video game burial' }],
  ['x03', 600, 'What was the name of the cancelled Nintendo–Sony console prototype from the early 1990s?', 'ما اسم نموذج الجهاز الملغى بين نينتندو وسوني أوائل التسعينيات؟', 'The Nintendo PlayStation (Play Station)', 'نينتندو بلايستيشن', { s: 'consoles', x: 1, r: 'Nintendo PlayStation' }],
  ['x04', 600, 'Who co-founded Atari in 1972 with Ted Dabney?', 'من أسس أتاري عام ١٩٧٢ مع تيد دابني؟', 'Nolan Bushnell', 'نولان بوشنل', { s: 'industry', r: 'Nolan Bushnell' }],
  ['x05', 600, 'Which company made the Neo Geo console and arcade system?', 'أي شركة صنعت نظام نيو جيو للألعاب المنزلية والأركيد؟', 'SNK', 'إس إن كيه', { s: 'consoles', r: 'Neo Geo' }],
  ['x06', 600, 'The famous Tetris theme ("Theme A") is based on which Russian folk song?', 'لحن تتريس الشهير (Theme A) مأخوذ من أي أغنية شعبية روسية؟', 'Korobeiniki', 'كوروبينيكي', { s: 'arcade', x: 1, r: 'Korobeiniki' }],
]);

KH_BANK.cat('hiphop', { g: 'music', pop: 1, e: '🎤', en: 'Hip-Hop & Rap', ar: 'هيب هوب وراب',
  subs: { artists: ['Artists', 'فنانون'], albums: ['Albums', 'ألبومات'], history: ['History', 'تاريخ'] } }, [
  ['e01', 200, 'Which rapper’s real name is Marshall Mathers?', 'أي مغني راب اسمه الحقيقي مارشال ماذرز؟', 'Eminem', 'إمينيم', { s: 'artists', r: 'Eminem' }],
  ['e02', 200, 'Which Toronto rapper released "God’s Plan"?', 'أي مغني راب من تورونتو أصدر أغنية «God’s Plan»؟', 'Drake', 'دريك', { s: 'artists', r: 'Drake (musician)' }],
  ['e03', 200, 'Which rapper co-founded Roc-A-Fella Records and is married to Beyoncé?', 'أي مغني راب شارك في تأسيس «روك-أ-فيلا» ومتزوج من بيونسيه؟', 'Jay-Z', 'جاي زي', { s: 'artists', r: 'Jay-Z' }],
  ['e04', 200, 'Who had a record-breaking 2019 hit with "Old Town Road"?', 'من حقق نجاحاً قياسياً عام ٢٠١٩ بأغنية «Old Town Road»؟', 'Lil Nas X', 'ليل ناز إكس', { s: 'artists', r: 'Old Town Road' }],
  ['e05', 200, 'Which rapper released "Sicko Mode" and the album Astroworld?', 'أي مغني راب أصدر «Sicko Mode» وألبوم «Astroworld»؟', 'Travis Scott', 'ترافيس سكوت', { s: 'artists', r: 'Astroworld (album)' }],
  ['e06', 200, 'Which Compton rapper released the single "HUMBLE." in 2017?', 'أي مغني راب من كومبتون أصدر أغنية «HUMBLE.» عام ٢٠١٧؟', 'Kendrick Lamar', 'كندريك لامار', { s: 'artists', alt: ['Kendrick'], r: 'Humble (song)' }],
  ['h01', 400, 'Which Kendrick Lamar album from 2015 features "Alright"?', 'أي ألبوم لكندريك لامار عام ٢٠١٥ يضم أغنية «Alright»؟', 'To Pimp a Butterfly', 'To Pimp a Butterfly', { s: 'albums', r: 'To Pimp a Butterfly' }],
  ['h02', 400, 'Which producer co-founded Death Row Records and later Beats Electronics?', 'أي منتج شارك في تأسيس «ديث رو» ثم شركة «بيتس»؟', 'Dr. Dre', 'دكتور دري', { s: 'artists', r: 'Dr. Dre' }],
  ['h03', 400, 'Which New York rapper’s 1994 debut album was Illmatic?', 'أي مغني راب من نيويورك كان ألبومه الأول «Illmatic» عام ١٩٩٤؟', 'Nas', 'ناس', { s: 'albums', r: 'Illmatic' }],
  ['h04', 400, 'Dr. Dre and Ice Cube were members of which Compton group?', 'دكتور دري وآيس كيوب كانا عضوين في أي فرقة من كومبتون؟', 'N.W.A', 'إن دبليو إيه', { s: 'history', alt: ['NWA'], r: 'N.W.A' }],
  ['h05', 400, 'What was The Notorious B.I.G.’s real name?', 'ما الاسم الحقيقي لـ«ذا نوتوريوس بي آي جي»؟', 'Christopher Wallace', 'كريستوفر والاس', { s: 'artists', r: 'The Notorious B.I.G.' }],
  ['h06', 400, 'Which New York City borough is the Wu-Tang Clan from?', 'من أي حي في نيويورك تنحدر فرقة «وو-تانغ كلان»؟', 'Staten Island', 'ستاتن آيلاند', { s: 'history', r: 'Wu-Tang Clan' }],
  ['x01', 600, 'Which Kendrick Lamar album was the first non-classical, non-jazz work to win the Pulitzer Prize for Music?', 'أي ألبوم لكندريك لامار كان أول عمل ليس كلاسيكياً ولا جاز يفوز بجائزة بوليتزر للموسيقى؟', 'DAMN.', 'DAMN.', { s: 'albums', x: 1, r: 'Damn (Kendrick Lamar album)' }],
  ['x02', 600, 'Which 1979 Sugarhill Gang single is often called the first hip-hop hit?', 'أي أغنية لفرقة «سوغرهيل غانغ» عام ١٩٧٩ تُعتبر غالباً أول نجاح في الهيب هوب؟', 'Rapper’s Delight', 'Rapper’s Delight', { s: 'history', r: 'Rapper\'s Delight' }],
  ['x03', 600, 'Which DJ is credited with starting hip-hop at a 1973 party in the Bronx?', 'أي دي جي يُنسب إليه إطلاق الهيب هوب في حفلة بالبرونكس عام ١٩٧٣؟', 'DJ Kool Herc', 'دي جي كول هيرك', { s: 'history', r: 'DJ Kool Herc' }],
  ['x04', 600, 'What was the title of Eminem’s little-known 1996 debut album?', 'ما عنوان ألبوم إمينيم الأول غير المعروف عام ١٩٩٦؟', 'Infinite', 'Infinite', { s: 'albums', x: 1, r: 'Infinite (Eminem album)' }],
  ['x05', 600, 'Whose 1996 debut album was Reasonable Doubt?', 'من صاحب الألبوم الأول «Reasonable Doubt» عام ١٩٩٦؟', 'Jay-Z', 'جاي زي', { s: 'albums', ok: 1, r: 'Reasonable Doubt (album)' }],
  ['x06', 600, 'In which year did Kanye West release his debut album, The College Dropout?', 'في أي عام أصدر كانييه ويست ألبومه الأول «The College Dropout»؟', '2004', '٢٠٠٤', { s: 'albums', r: 'The College Dropout' }],
]);

KH_BANK.cat('pop-rock', { g: 'music', pop: 1, e: '🎸', en: 'Pop & Rock', ar: 'بوب وروك',
  subs: { bands: ['Bands', 'فرق'], singers: ['Singers', 'مغنون'], history: ['History', 'تاريخ'] } }, [
  ['e01', 200, 'Which band’s members were John, Paul, George and Ringo?', 'أي فرقة كان أعضاؤها جون وبول وجورج ورينغو؟', 'The Beatles', 'البيتلز', { s: 'bands', r: 'The Beatles' }],
  ['e02', 200, 'Which singer is known as the "King of Pop"?', 'أي مغنٍّ يُلقّب بـ«ملك البوب»؟', 'Michael Jackson', 'مايكل جاكسون', { s: 'singers', r: 'Michael Jackson' }],
  ['e03', 200, 'Which singer’s fans call themselves "Swifties"?', 'جمهور أي مغنية يسمّون أنفسهم «سويفتيز»؟', 'Taylor Swift', 'تايلور سويفت', { s: 'singers', r: 'Taylor Swift' }],
  ['e04', 200, 'Freddie Mercury was the lead singer of which British band?', 'فريدي ميركوري كان المغني الرئيسي لأي فرقة بريطانية؟', 'Queen', 'كوين', { s: 'bands', r: 'Queen (band)' }],
  ['e05', 200, 'Which British singer-songwriter had a huge hit with "Shape of You"?', 'أي مغنٍّ بريطاني حقق نجاحاً ضخماً بأغنية «Shape of You»؟', 'Ed Sheeran', 'إد شيران', { s: 'singers', r: 'Shape of You' }],
  ['e06', 200, 'Which K-pop group includes RM, Jin, Suga, J-Hope, Jimin, V and Jungkook?', 'أي فرقة كيبوب تضم RM وجين وشوغا وجي-هوب وجيمين وفي وجونغكوك؟', 'BTS', 'بي تي إس', { s: 'bands', r: 'BTS' }],
  ['h01', 400, 'Which Michael Jackson album is the best-selling album of all time?', 'أي ألبوم لمايكل جاكسون هو الأكثر مبيعاً في التاريخ؟', 'Thriller', 'ثريلر', { s: 'history', c: 1, asOf: '2026-06', r: 'Thriller (album)' }],
  ['h02', 400, 'Which band released The Dark Side of the Moon in 1973?', 'أي فرقة أصدرت ألبوم «The Dark Side of the Moon» عام ١٩٧٣؟', 'Pink Floyd', 'بينك فلويد', { s: 'bands', r: 'The Dark Side of the Moon' }],
  ['h03', 400, 'Which Canadian singer was discovered through YouTube videos in 2008?', 'أي مغنٍّ كندي اكتُشف من خلال فيديوهات يوتيوب عام ٢٠٠٨؟', 'Justin Bieber', 'جاستن بيبر', { s: 'singers', alt: ['Bieber'], r: 'Justin Bieber' }],
  ['h04', 400, 'Kurt Cobain was the frontman of which band?', 'كورت كوبين كان المغني الرئيسي لأي فرقة؟', 'Nirvana', 'نيرفانا', { s: 'bands', r: 'Nirvana (band)' }],
  ['h05', 400, 'Which singer was born Stefani Germanotta?', 'أي مغنية اسمها الحقيقي ستيفاني جيرمانوتا؟', 'Lady Gaga', 'ليدي غاغا', { s: 'singers', r: 'Lady Gaga' }],
  ['h06', 400, 'Beyoncé first became famous in which girl group?', 'في أي فرقة نسائية اشتهرت بيونسيه أولاً؟', 'Destiny’s Child', 'ديستنيز تشايلد', { s: 'bands', r: 'Destiny\'s Child' }],
  ['h07', 400, 'Which Norwegian band had the 1985 hit "Take On Me"?', 'أي فرقة نرويجية اشتهرت عام ١٩٨٥ بأغنية «Take On Me»؟', 'a-ha', 'آها', { s: 'bands', r: 'Take On Me' }],
  ['x01', 600, 'What was the Beatles’ first UK single, in 1962?', 'ما أول أغنية منفردة للبيتلز في بريطانيا عام ١٩٦٢؟', '"Love Me Do"', '«Love Me Do»', { s: 'history', x: 1, r: 'Love Me Do' }],
  ['x02', 600, 'Freddie Mercury was born with which name?', 'ما الاسم الذي وُلد به فريدي ميركوري؟', 'Farrokh Bulsara', 'فاروخ بولسارا', { s: 'singers', f: 'freddie', r: 'Freddie Mercury' }],
  ['x03', 600, 'In which year did the Beatles give their last public performance, on a London rooftop?', 'في أي عام قدّم البيتلز آخر عرض علني لهم على سطح مبنى في لندن؟', '1969', '١٩٦٩', { s: 'history', r: 'The Beatles\' rooftop concert' }],
  ['x04', 600, 'On which island was Freddie Mercury born?', 'في أي جزيرة وُلد فريدي ميركوري؟', 'Zanzibar', 'زنجبار', { s: 'singers', f: 'freddie', x: 1, r: 'Freddie Mercury' }],
  ['x05', 600, 'What was the name of the record label the Beatles founded in 1968?', 'ما اسم شركة التسجيلات التي أسسها البيتلز عام ١٩٦٨؟', 'Apple Records', 'أبل ريكوردز', { s: 'history', x: 1, r: 'Apple Records' }],
  ['x06', 600, 'Which band started out as "The Quarrymen" in Liverpool?', 'أي فرقة بدأت باسم «ذا كواريمن» في ليفربول؟', 'The Beatles', 'البيتلز', { s: 'bands', ok: 1, r: 'The Quarrymen' }],
]);

KH_BANK.cat('music-world', { g: 'music', e: '🎻', en: 'Arabic & Classical Music', ar: 'الطرب والموسيقى الكلاسيكية',
  subs: { arab: ['Arabic music', 'الموسيقى العربية'], classical: ['Classical', 'كلاسيكية'], instruments: ['Instruments & theory', 'آلات ونظريات'] } }, [
  ['e01', 200, 'How many strings does a standard guitar have?', 'كم وتراً في الغيتار العادي؟', 'Six', 'ستة', { s: 'instruments', alt: ['6'], r: 'Guitar' }],
  ['e02', 200, 'How many keys does a standard modern piano have?', 'كم مفتاحاً في البيانو الحديث العادي؟', '88', '٨٨', { s: 'instruments', r: 'Piano' }],
  ['e03', 200, 'Which German composer wrote his Ninth Symphony after going deaf?', 'أي مؤلف ألماني كتب سيمفونيته التاسعة بعد أن فقد سمعه؟', 'Ludwig van Beethoven', 'لودفيغ فان بيتهوفن', { s: 'classical', alt: ['Beethoven'], r: 'Ludwig van Beethoven' }],
  ['e04', 200, 'Which instrument is played with a bow and held under the chin?', 'أي آلة تُعزف بالقوس وتُحمل تحت الذقن؟', 'The violin', 'الكمان', { s: 'instruments', r: 'Violin' }],
  ['e05', 200, 'Which Austrian child prodigy composed The Magic Flute?', 'أي طفل نابغة نمساوي ألّف أوبرا «الناي السحري»؟', 'Wolfgang Amadeus Mozart', 'فولفغانغ أماديوس موتسارت', { s: 'classical', alt: ['Mozart'], r: 'The Magic Flute' }],
  ['e06', 200, 'What is the fretless, pear-shaped Arabic lute called?', 'ما اسم الآلة الوترية العربية الكمثرية الشكل بلا دساتين؟', 'The oud', 'العود', { s: 'arab', r: 'Oud' }],
  ['h01', 400, 'Which Egyptian singer was called "Kawkab al-Sharq" (Star of the East)?', 'أي مطربة مصرية لُقّبت بـ«كوكب الشرق»؟', 'Umm Kulthum', 'أم كلثوم', { s: 'arab', r: 'Umm Kulthum' }],
  ['h02', 400, 'Which Lebanese singer is known as "the Neighbour of the Moon"?', 'أي مطربة لبنانية تُلقّب بـ«جارة القمر»؟', 'Fairuz', 'فيروز', { s: 'arab', r: 'Fairuz' }],
  ['h03', 400, 'Which Saudi singer is nicknamed "Fannan al-Arab" (the Artist of the Arabs)?', 'أي مطرب سعودي يُلقّب بـ«فنان العرب»؟', 'Mohammed Abdu', 'محمد عبده', { s: 'arab', r: 'Mohammed Abdu' }],
  ['h04', 400, 'Which Italian composer wrote The Four Seasons?', 'أي مؤلف إيطالي كتب «الفصول الأربعة»؟', 'Antonio Vivaldi', 'أنطونيو فيفالدي', { s: 'classical', alt: ['Vivaldi'], r: 'The Four Seasons (Vivaldi)' }],
  ['h05', 400, 'How many lines are there on a standard musical staff?', 'كم خطاً في المدرج الموسيقي العادي؟', 'Five', 'خمسة', { s: 'instruments', alt: ['5'], r: 'Staff (music)' }],
  ['h06', 400, 'Which Russian composer wrote The Nutcracker ballet?', 'أي مؤلف روسي كتب باليه «كسارة البندق»؟', 'Pyotr Ilyich Tchaikovsky', 'بيوتر إيليتش تشايكوفسكي', { s: 'classical', alt: ['Tchaikovsky'], r: 'The Nutcracker' }],
  ['x01', 600, 'How many symphonies did Beethoven complete?', 'كم سيمفونية أكمل بيتهوفن؟', 'Nine', 'تسع', { s: 'classical', alt: ['9'], ok: 1, r: 'List of compositions by Ludwig van Beethoven' }],
  ['x02', 600, 'Before a concert, an orchestra usually tunes to which note played by the oboe?', 'قبل الحفل، تضبط الأوركسترا عادةً على أي نغمة يعزفها المزمار (الأوبوا)؟', 'A (concert A)', 'لا (A)', { s: 'instruments', x: 1, ok: 1, r: 'Oboe' }],
  ['x03', 600, 'What is the Arabic system of melodic modes, such as Rast and Bayati, called?', 'ما اسم نظام الأنغام في الموسيقى العربية مثل الراست والبياتي؟', 'Maqam', 'المقام', { s: 'arab', x: 1, r: 'Arabic maqam' }],
  ['x04', 600, 'Which French composer wrote Boléro (1928)?', 'أي مؤلف فرنسي كتب «بوليرو» (١٩٢٨)؟', 'Maurice Ravel', 'موريس رافيل', { s: 'classical', alt: ['Ravel'], r: 'Boléro' }],
  ['x05', 600, 'The qanun is played on the lap. What kind of instrument is it?', 'القانون يُعزف على الحِجر. ما نوع هذه الآلة؟', 'A plucked zither (a flat, trapezoid string instrument)', 'آلة وترية مسطّحة شبه منحرفة تُعزف بالنقر', { s: 'instruments', x: 1, r: 'Qanun (instrument)' }],
  ['x06', 600, 'Which Saudi singer was nicknamed "Sawt al-Ard" (the Voice of the Earth)?', 'أي مطرب سعودي لُقّب بـ«صوت الأرض»؟', 'Talal Maddah', 'طلال مداح', { s: 'arab', x: 1, r: 'Talal Maddah' }],
]);

KH_BANK.cat('soundtracks', { g: 'music', niche: 1, e: '🎼', en: 'Soundtracks & Composers', ar: 'موسيقى الأفلام',
  subs: { scores: ['Film scores', 'موسيقى تصويرية'], songs: ['Film songs', 'أغاني الأفلام'] } }, [
  ['e01', 200, 'Who composed the music for Star Wars?', 'من ألّف موسيقى «حرب النجوم»؟', 'John Williams', 'جون ويليامز', { s: 'scores', r: 'John Williams' }],
  ['e02', 200, 'Céline Dion’s "My Heart Will Go On" is the theme of which film?', 'أغنية سيلين ديون «My Heart Will Go On» هي أغنية أي فيلم؟', 'Titanic', 'تايتانيك', { f: 'titanic', s: 'songs', r: 'My Heart Will Go On' }],
  ['e03', 200, 'Which Disney film features the song "Let It Go"?', 'أي فيلم من ديزني يضم أغنية «Let It Go»؟', 'Frozen', 'ملكة الثلج (فروزن)', { f: 'frozen', s: 'songs', r: 'Let It Go' }],
  ['e04', 200, 'Which film’s two-note theme warns that a shark is coming?', 'لحن أي فيلم من نغمتين ينذر باقتراب سمكة القرش؟', 'Jaws', 'الفك المفترس', { s: 'scores', r: 'Jaws (film)' }],
  ['e05', 200, 'Which Disney film features the song "Hakuna Matata"?', 'أي فيلم من ديزني يضم أغنية «هاكونا ماتاتا»؟', 'The Lion King', 'الأسد الملك', { s: 'songs', r: 'Hakuna Matata (song)' }],
  ['e06', 200, 'Which secret agent’s films open with a famous twangy-guitar theme and a gun barrel?', 'أفلام أي عميل سري تبدأ بلحن غيتار شهير وفوهة مسدس؟', 'James Bond', 'جيمس بوند', { s: 'scores', r: 'James Bond Theme' }],
  ['h01', 400, 'Who composed the score for The Lion King (1994)?', 'من ألّف الموسيقى التصويرية لفيلم «الأسد الملك» (١٩٩٤)؟', 'Hans Zimmer', 'هانز زيمر', { s: 'scores', r: 'The Lion King (1994 soundtrack)' }],
  ['h02', 400, 'Which band performed "Eye of the Tiger" for Rocky III?', 'أي فرقة أدّت أغنية «Eye of the Tiger» لفيلم «روكي ٣»؟', 'Survivor', 'سرفايفر', { s: 'songs', r: 'Eye of the Tiger' }],
  ['h03', 400, 'Lady Gaga and Bradley Cooper’s "Shallow" comes from which film?', 'أغنية «Shallow» لليدي غاغا وبرادلي كوبر من أي فيلم؟', 'A Star Is Born (2018)', 'ولادة نجمة (٢٠١٨)', { s: 'songs', r: 'Shallow (Lady Gaga and Bradley Cooper song)' }],
  ['h04', 400, 'Who composed the music for the Lord of the Rings film trilogy?', 'من ألّف موسيقى ثلاثية أفلام «سيد الخواتم»؟', 'Howard Shore', 'هوارد شور', { s: 'scores', r: 'Howard Shore' }],
  ['h05', 400, 'Who composed the Game of Thrones theme?', 'من ألّف لحن «صراع العروش»؟', 'Ramin Djawadi', 'رامين جوادي', { s: 'scores', r: 'Ramin Djawadi' }],
  ['h06', 400, 'Which musician wrote the songs for Tim Burton’s Batman (1989)?', 'أي موسيقي كتب أغاني فيلم «باتمان» لتيم برتون (١٩٨٩)؟', 'Prince', 'برنس', { s: 'songs', r: 'Batman (1989 soundtrack)' }],
  ['x01', 600, 'Who composed the Pink Panther theme?', 'من ألّف لحن «النمر الوردي»؟', 'Henry Mancini', 'هنري مانشيني', { s: 'scores', r: 'The Pink Panther Theme' }],
  ['x02', 600, 'Who composed the screeching-strings score for Hitchcock’s Psycho (1960)?', 'من ألّف موسيقى الكمان الحادة لفيلم هيتشكوك «سايكو» (١٩٦٠)؟', 'Bernard Herrmann', 'برنارد هيرمان', { s: 'scores', x: 1, r: 'Bernard Herrmann' }],
  ['x03', 600, 'Who composed the music for The Good, the Bad and the Ugly?', 'من ألّف موسيقى فيلم «الطيب والشرس والقبيح»؟', 'Ennio Morricone', 'إنيو موريكوني', { s: 'scores', r: 'Ennio Morricone' }],
  ['x04', 600, 'Which song won the first-ever Oscar for Best Original Song, in 1935?', 'أي أغنية فازت بأول أوسكار لأفضل أغنية أصلية عام ١٩٣٥؟', '"The Continental" (from The Gay Divorcee)', '«The Continental» (من فيلم The Gay Divorcee)', { s: 'songs', x: 1, r: 'Academy Award for Best Original Song' }],
  ['x05', 600, 'Who composed the scores for Spirited Away and most of Hayao Miyazaki’s films?', 'من ألّف موسيقى «المخطوفة» ومعظم أفلام هاياو ميازاكي؟', 'Joe Hisaishi', 'جو هيسايشي', { s: 'scores', x: 1, r: 'Joe Hisaishi' }],
  ['x06', 600, 'The Star Wars "Imperial March" is the theme of which character?', 'مقطوعة «المارش الإمبراطوري» في «حرب النجوم» هي لحن أي شخصية؟', 'Darth Vader', 'دارث فيدر', { s: 'scores', r: 'The Imperial March' }],
]);

/* ---- bank/22-internet-games.js ---- */
/* Popular games, internet culture and social media.
   Internet facts change fast: only durable facts are used, and anything that can change is marked c + asOf. */
KH_BANK.cat('popular-games', { g: 'games', e: '⛏️', en: 'Minecraft, Fortnite & Friends', ar: 'ماينكرافت وفورتنايت ورفاقهما', pop: 1,
  subs: { sandbox: ['Minecraft & Roblox', 'ماينكرافت وروبلوكس'], shooters: ['Shooters & battle royale', 'ألعاب تصويب وباتل رويال'], sports: ['Sports games', 'ألعاب رياضية'], online: ['Online hits', 'ألعاب أونلاين'] } }, [
  ['e01', 200, 'What is the name of Minecraft’s classic default player character?', 'ما اسم الشخصية الافتراضية الكلاسيكية في ماينكرافت؟', 'Steve', 'ستيف', { s: 'sandbox', r: 'Minecraft' }],
  ['e02', 200, 'In Fortnite Battle Royale, what is the shrinking danger zone called?', 'في فورتنايت باتل رويال، ماذا تُسمّى المنطقة الخطرة التي تضيق؟', 'The Storm', 'العاصفة', { s: 'shooters', r: 'Fortnite Battle Royale' }],
  ['e03', 200, 'What is Roblox’s in-game currency called?', 'ما اسم العملة داخل لعبة روبلوكس؟', 'Robux', 'روبوكس', { s: 'sandbox', r: 'Roblox' }],
  ['e04', 200, 'Which company publishes the Grand Theft Auto series?', 'أي شركة تنشر سلسلة «جراند ثفت أوتو»؟', 'Rockstar Games', 'روكستار غيمز', { s: 'online', alt: ['Rockstar'], r: 'Rockstar Games' }],
  ['e05', 200, 'Which shooter series includes Modern Warfare and Black Ops?', 'أي سلسلة ألعاب تصويب تضم «مودرن وورفير» و«بلاك أوبس»؟', 'Call of Duty', 'كول أوف ديوتي', { s: 'shooters', r: 'Call of Duty' }],
  ['e06', 200, 'From 2023, what is EA’s football game series called instead of FIFA?', 'منذ ٢٠٢٣، ما اسم سلسلة ألعاب كرة القدم من EA بدلاً من فيفا؟', 'EA Sports FC', 'إي إيه سبورتس إف سي', { s: 'sports', alt: ['EA FC'], r: 'EA Sports FC' }],
  ['e07', 200, 'In Rocket League, what do players drive to hit the giant ball?', 'في روكيت ليغ، ماذا يقود اللاعبون لضرب الكرة العملاقة؟', 'Rocket-powered cars', 'سيارات بمحركات صاروخية', { s: 'sports', r: 'Rocket League' }],
  ['h01', 400, 'In Minecraft, which dimension do you reach through a portal made of obsidian?', 'في ماينكرافت، إلى أي بُعد تصل عبر بوابة من حجر الأوبسيديان؟', 'The Nether', 'النذر (Nether)', { s: 'sandbox', r: 'The Nether' }],
  ['h02', 400, 'What is the name of Minecraft’s final boss, found in The End?', 'ما اسم الزعيم الأخير في ماينكرافت، الموجود في بُعد «النهاية»؟', 'The Ender Dragon', 'تنين الإندر', { s: 'sandbox', r: 'Ender Dragon' }],
  ['h03', 400, 'Which company makes Fortnite?', 'أي شركة تصنع فورتنايت؟', 'Epic Games', 'إبك غيمز', { s: 'shooters', r: 'Epic Games' }],
  ['h04', 400, 'Who is one of the three playable main characters of GTA V?', 'من إحدى الشخصيات الرئيسية الثلاث القابلة للعب في GTA V؟', 'Michael, Franklin or Trevor', 'مايكل أو فرانكلين أو تريفور', { s: 'online', alt: ['Michael', 'Franklin', 'Trevor'], r: 'Grand Theft Auto V' }],
  ['h05', 400, 'In Call of Duty, which killstreak reward shows enemies on the minimap from the sky?', 'في كول أوف ديوتي، أي مكافأة سلسلة قتل تكشف الأعداء على الخريطة من السماء؟', 'The UAV (spy plane)', 'طائرة الاستطلاع (UAV)', { s: 'shooters', x: 1, r: 'Call of Duty 4: Modern Warfare' }],
  ['h06', 400, 'Which company develops League of Legends and Valorant?', 'أي شركة تطوّر «ليغ أوف ليجندز» و«فالورانت»؟', 'Riot Games', 'رايوت غيمز', { s: 'online', r: 'Riot Games' }],
  ['h07', 400, 'What is the name of the spaceship map that Among Us launched with?', 'ما اسم خريطة السفينة الفضائية التي صدرت بها لعبة «أمونغ أس»؟', 'The Skeld', 'ذا سكيلد', { s: 'online', x: 1, r: 'Among Us' }],
  ['x01', 600, 'Who created Minecraft before it was sold to Microsoft?', 'من ابتكر ماينكرافت قبل بيعها لمايكروسوفت؟', 'Markus "Notch" Persson', 'ماركوس «نوتش» بيرسون', { s: 'sandbox', alt: ['Notch'], r: 'Markus Persson' }],
  ['x02', 600, 'Which Minecraft mob was born from a coding mistake while making a pig?', 'أي مخلوق في ماينكرافت وُلد من خطأ برمجي أثناء صنع خنزير؟', 'The Creeper', 'الكريبر', { s: 'sandbox', x: 1, f: 'creeper', r: 'Creeper (Minecraft)' }],
  ['x03', 600, 'In October 2019, what did Fortnite’s whole map get sucked into, leaving players staring at it for two days?', 'في أكتوبر ٢٠١٩، إلى ماذا ابتُلعت خريطة فورتنايت بالكامل وبقي اللاعبون يحدّقون فيه يومين؟', 'A black hole', 'ثقب أسود', { s: 'shooters', x: 1, r: 'The End (Fortnite)' }],
  ['x04', 600, 'Which studio developed Rocket League?', 'أي استوديو طوّر لعبة روكيت ليغ؟', 'Psyonix', 'سايونكس', { s: 'sports', r: 'Psyonix' }],
  ['x05', 600, 'What was Roblox called during its early development, around 2004?', 'ماذا كان اسم روبلوكس في بداية تطويرها نحو ٢٠٠٤؟', 'DynaBlocks', 'داينا بلوكس', { s: 'sandbox', x: 1, r: 'Roblox' }],
  ['x06', 600, 'What is the New York–inspired city of GTA IV called?', 'ما اسم المدينة المستوحاة من نيويورك في GTA IV؟', 'Liberty City', 'ليبرتي سيتي', { s: 'online', r: 'Liberty City' }],
  ['x07', 600, 'Which studio made the first Call of Duty, in 2003?', 'أي استوديو صنع أول لعبة «كول أوف ديوتي» عام ٢٠٠٣؟', 'Infinity Ward', 'إنفينيتي وورد', { s: 'shooters', r: 'Infinity Ward' }],
]);

KH_BANK.cat('internet-culture', { g: 'internet', e: '😂', en: 'Memes & Internet Culture', ar: 'الميمز وثقافة الإنترنت', pop: 1,
  subs: { memes: ['Memes', 'ميمز'], viral: ['Viral moments', 'لحظات منتشرة'], slang: ['Internet slang', 'لغة الإنترنت'] } }, [
  ['e01', 200, 'Which platform originally limited posts to 140 characters?', 'أي منصة كانت تحدّ المنشورات في البداية بـ١٤٠ حرفاً؟', 'Twitter (now X)', 'تويتر (إكس حالياً)', { s: 'viral', alt: ['X'], r: 'Twitter' }],
  ['e02', 200, 'What does "LOL" stand for?', 'ماذا يعني اختصار «LOL»؟', 'Laughing out loud', 'أضحك بصوت عالٍ', { s: 'slang', r: 'LOL' }],
  ['e03', 200, 'Which video site was founded in 2005 by three former PayPal employees?', 'أي موقع فيديو أسسه ثلاثة موظفين سابقين في باي بال عام ٢٠٠٥؟', 'YouTube', 'يوتيوب', { s: 'viral', r: 'YouTube' }],
  ['e04', 200, 'What is a short, looping animated image file often used for reactions called?', 'ماذا يُسمّى ملف الصورة المتحركة القصير المتكرر الذي يُستخدم للتفاعل؟', 'A GIF', 'صورة GIF', { s: 'memes', r: 'GIF' }],
  ['e05', 200, 'Which app made "streaks" and disappearing photos popular?', 'أي تطبيق جعل «الستريك» والصور المختفية مشهورة؟', 'Snapchat', 'سناب شات', { s: 'viral', f: 'snapchat', r: 'Snapchat' }],
  ['e06', 200, 'On social media, what does "DM" mean?', 'في وسائل التواصل، ماذا يعني «DM»؟', 'Direct message', 'رسالة خاصة', { s: 'slang', r: 'Direct message' }],
  ['e07', 200, 'What does "GOAT" stand for when fans praise a player?', 'ماذا يعني «GOAT» عندما يمدح المشجعون لاعباً؟', 'Greatest of all time', 'الأعظم على الإطلاق', { s: 'slang', r: 'Greatest of All Time' }],
  ['h01', 400, 'Which dog breed is the star of the "Doge" meme?', 'أي سلالة كلاب هي نجمة ميم «دوج»؟', 'Shiba Inu', 'شيبا إينو', { s: 'memes', r: 'Doge (meme)' }],
  ['h02', 400, 'Which song do you get tricked into hearing when you are "Rickrolled"?', 'ما الأغنية التي تُخدع لسماعها عندما تتعرض لـ«ريك رول»؟', '"Never Gonna Give You Up" by Rick Astley', '«Never Gonna Give You Up» لريك أستلي', { s: 'memes', r: 'Rickrolling' }],
  ['h03', 400, 'What is the title of the first video ever uploaded to YouTube, in 2005?', 'ما عنوان أول فيديو رُفع على يوتيوب عام ٢٠٠٥؟', '"Me at the zoo"', '«Me at the zoo» (أنا في حديقة الحيوان)', { s: 'viral', f: 'zoo', r: 'Me at the zoo' }],
  ['h04', 400, 'Which 2012 music video was the first to reach a billion views on YouTube?', 'أي فيديو موسيقي عام ٢٠١٢ كان أول من وصل إلى مليار مشاهدة على يوتيوب؟', '"Gangnam Style" by PSY', '«غانغنام ستايل» لساي', { s: 'viral', f: 'gangnam', r: 'Gangnam Style' }],
  ['h05', 400, 'Which website calls itself "the front page of the internet"?', 'أي موقع يصف نفسه بـ«الصفحة الأولى للإنترنت»؟', 'Reddit', 'ريديت', { s: 'viral', r: 'Reddit' }],
  ['h06', 400, 'Which 2014 viral challenge raised money for ALS research?', 'أي تحدٍّ منتشر عام ٢٠١٤ جمع أموالاً لأبحاث مرض التصلب الجانبي الضموري (ALS)؟', 'The Ice Bucket Challenge', 'تحدي دلو الثلج', { s: 'viral', r: 'Ice Bucket Challenge' }],
  ['h07', 400, 'What does "TL;DR" stand for?', 'ماذا يعني اختصار «TL;DR»؟', 'Too long; didn’t read', 'طويل جداً؛ لم أقرأه', { s: 'slang', x: 1, r: 'TL;DR' }],
  ['x01', 600, 'Who uploaded YouTube’s first video, "Me at the zoo"?', 'من رفع أول فيديو على يوتيوب «Me at the zoo»؟', 'Jawed Karim', 'جاويد كريم', { s: 'viral', f: 'zoo', r: 'Jawed Karim' }],
  ['x02', 600, 'What is the name of the 2011 animated cat with a Pop-Tart body that flies through space?', 'ما اسم القطة المتحركة عام ٢٠١١ ذات جسم البسكويت التي تطير في الفضاء؟', 'Nyan Cat', 'نيان كات', { s: 'memes', r: 'Nyan Cat' }],
  ['x03', 600, 'In which year did Scott Fahlman first propose the :-) smiley?', 'في أي عام اقترح سكوت فالمان لأول مرة الوجه المبتسم :-)؟', '1982', '١٩٨٢', { s: 'slang', x: 1, r: 'Scott Fahlman' }],
  ['x04', 600, 'Which 2015 viral photo split the internet over whether it was blue and black or white and gold?', 'أي صورة منتشرة عام ٢٠١٥ قسمت الإنترنت حول ما إذا كانت زرقاء وسوداء أم بيضاء وذهبية؟', 'The Dress', 'الفستان', { s: 'viral', r: 'The dress' }],
  ['x05', 600, 'Who sent the first ever tweet, in 2006?', 'من أرسل أول تغريدة في التاريخ عام ٢٠٠٦؟', 'Jack Dorsey', 'جاك دورسي', { s: 'viral', r: 'Jack Dorsey' }],
  ['x06', 600, 'Which Spanish stock photographer took the "Distracted Boyfriend" photo?', 'أي مصور إسباني للصور الجاهزة التقط صورة «الحبيب المشتّت»؟', 'Antonio Guillem', 'أنطونيو غيليم', { s: 'memes', x: 1, r: 'Distracted boyfriend meme' }],
  ['x07', 600, 'Which 2007 clip of two British brothers was for years YouTube’s most-viewed non-music video?', 'أي مقطع لأخوين بريطانيين عام ٢٠٠٧ كان لسنوات الفيديو غير الموسيقي الأكثر مشاهدة على يوتيوب؟', '"Charlie Bit My Finger"', '«تشارلي عض إصبعي»', { s: 'viral', x: 1, r: 'Charlie Bit My Finger' }],
]);

KH_BANK.cat('creators', { g: 'internet', e: '🎥', en: 'YouTubers & Streamers', ar: 'يوتيوبرز وستريمرز',
  subs: { youtube: ['YouTube', 'يوتيوب'], streaming: ['Streaming', 'البث المباشر'] } }, [
  ['e01', 200, 'Which Swedish gamer was for years the most-subscribed individual YouTuber?', 'أي لاعب سويدي كان لسنوات صاحب أكبر عدد مشتركين بين اليوتيوبرز الأفراد؟', 'PewDiePie', 'بيوديباي', { s: 'youtube', f: 'pewds', r: 'PewDiePie' }],
  ['e02', 200, 'Which YouTuber is famous for huge challenges, giveaways and Feastables chocolate?', 'أي يوتيوبر يشتهر بالتحديات الضخمة والجوائز وشوكولاتة «فيستبلز»؟', 'MrBeast', 'مستر بيست', { s: 'youtube', r: 'MrBeast' }],
  ['e03', 200, 'Which Amazon-owned live-streaming site is mainly used for gaming?', 'أي موقع بث مباشر تملكه أمازون يُستخدم أساساً للألعاب؟', 'Twitch', 'تويتش', { s: 'streaming', r: 'Twitch (service)' }],
  ['e04', 200, 'Which British YouTube group, including KSI, plays a big yearly charity football match?', 'أي مجموعة يوتيوب بريطانية، منها KSI، تلعب مباراة كرة قدم خيرية سنوية كبيرة؟', 'The Sidemen', 'السايدمن', { s: 'youtube', alt: ['Sidemen'], r: 'Sidemen' }],
  ['e05', 200, 'The streamer Ninja became a mainstream star in 2018 playing which game?', 'الستريمر «نينجا» أصبح نجماً عالمياً عام ٢٠١٨ بلعب أي لعبة؟', 'Fortnite', 'فورتنايت', { s: 'streaming', r: 'Ninja (gamer)' }],
  ['e06', 200, 'What does YouTube send creators who reach 100,000 subscribers?', 'ماذا يرسل يوتيوب لصنّاع المحتوى عند وصولهم إلى ١٠٠ ألف مشترك؟', 'A Silver Play Button', 'زر التشغيل الفضي', { s: 'youtube', r: 'YouTube Creator Awards' }],
  ['h01', 400, 'What is MrBeast’s real name?', 'ما الاسم الحقيقي لمستر بيست؟', 'Jimmy Donaldson', 'جيمي دونالدسون', { s: 'youtube', r: 'MrBeast' }],
  ['h02', 400, 'Which Indian music label overtook PewDiePie as YouTube’s most-subscribed channel in 2019?', 'أي شركة موسيقى هندية تخطّت بيوديباي كأكثر قناة مشتركين على يوتيوب عام ٢٠١٩؟', 'T-Series', 'تي سيريز', { s: 'youtube', f: 'pewds', r: 'PewDiePie vs T-Series' }],
  ['h03', 400, 'What award does YouTube give at one million subscribers?', 'ما الجائزة التي يمنحها يوتيوب عند مليون مشترك؟', 'The Gold Play Button', 'زر التشغيل الذهبي', { s: 'youtube', r: 'YouTube Creator Awards' }],
  ['h04', 400, 'In 2019 Ninja briefly left Twitch for which Microsoft streaming platform?', 'في ٢٠١٩ ترك نينجا تويتش لفترة قصيرة إلى أي منصة بث تابعة لمايكروسوفت؟', 'Mixer', 'ميكسر', { s: 'streaming', x: 1, r: 'Mixer (service)' }],
  ['h05', 400, 'Which drink brand did KSI and Logan Paul launch in 2022?', 'أي علامة مشروبات أطلقها KSI ولوغان بول عام ٢٠٢٢؟', 'Prime (Prime Hydration)', 'برايم', { s: 'youtube', r: 'Prime (drink)' }],
  ['h06', 400, 'Who hosts Hot Ones, the interview show where celebrities eat ever-hotter chicken wings?', 'من يقدّم «هوت ونز»، برنامج المقابلات الذي يأكل فيه المشاهير أجنحة دجاج تزداد حرارة؟', 'Sean Evans', 'شون إيفانز', { s: 'youtube', r: 'Hot Ones' }],
  ['h07', 400, 'What is YouTube’s award for ten million subscribers called?', 'ما اسم جائزة يوتيوب عند عشرة ملايين مشترك؟', 'The Diamond Play Button', 'زر التشغيل الماسي', { s: 'youtube', r: 'YouTube Creator Awards' }],
  ['x01', 600, 'What is KSI’s real name?', 'ما الاسم الحقيقي لـKSI؟', 'Olajide Olatunji', 'أولاجيدي أولاتونجي', { s: 'youtube', x: 1, r: 'KSI' }],
  ['x02', 600, 'What is YouTube’s award for 100 million subscribers called?', 'ما اسم جائزة يوتيوب عند ١٠٠ مليون مشترك؟', 'The Red Diamond Creator Award', 'جائزة الماسة الحمراء', { s: 'youtube', x: 1, r: 'YouTube Creator Awards' }],
  ['x03', 600, 'What is PewDiePie’s real name?', 'ما الاسم الحقيقي لبيوديباي؟', 'Felix Kjellberg', 'فيليكس كيلبرغ', { s: 'youtube', f: 'pewds', r: 'PewDiePie' }],
  ['x04', 600, 'Twitch grew out of which earlier live-streaming site, launched in 2007?', 'تويتش نشأ من أي موقع بث مباشر أقدم أُطلق عام ٢٠٠٧؟', 'Justin.tv', 'جاستن تي في', { s: 'streaming', x: 1, r: 'Justin.tv' }],
  ['x05', 600, 'In which year did MrBeast release his real-life "Squid Game" video?', 'في أي عام نشر مستر بيست فيديو «لعبة الحبار» في الواقع؟', '2021', '٢٠٢١', { s: 'youtube', r: 'MrBeast' }],
  ['x06', 600, 'What was MrBeast’s original channel name?', 'ما الاسم الأصلي لقناة مستر بيست؟', 'MrBeast6000', 'MrBeast6000', { s: 'youtube', x: 1, r: 'MrBeast' }],
  ['x07', 600, 'Which esports organisation, famous for its "100" name, was founded by former Call of Duty pro Nadeshot?', 'أي منظمة رياضات إلكترونية أسسها لاعب كول أوف ديوتي السابق «ناديشوت»؟', '100 Thieves', '100 ثيفز', { s: 'streaming', x: 1, r: '100 Thieves' }],
]);

KH_BANK.cat('social-apps', { g: 'internet', e: '📱', en: 'Social Media & Apps', ar: 'سوشال ميديا وتطبيقات',
  subs: { apps: ['Apps', 'تطبيقات'], history: ['App history', 'تاريخ التطبيقات'] } }, [
  ['e01', 200, 'Which Meta-owned app is built around photos, Stories and Reels?', 'أي تطبيق تملكه ميتا يقوم على الصور والستوريز والريلز؟', 'Instagram', 'إنستغرام', { s: 'apps', f: 'meta-apps', r: 'Instagram' }],
  ['e02', 200, 'In 2023, Twitter was renamed what?', 'في ٢٠٢٣، ما الاسم الجديد لتويتر؟', 'X', 'إكس', { s: 'history', r: 'Twitter' }],
  ['e03', 200, 'Which messaging app has a green speech bubble with a phone in its logo?', 'أي تطبيق مراسلة شعاره فقاعة كلام خضراء فيها سماعة هاتف؟', 'WhatsApp', 'واتساب', { s: 'apps', f: 'meta-apps', r: 'WhatsApp' }],
  ['e04', 200, 'Which networking site is mainly for jobs and professional profiles?', 'أي موقع تواصل مخصص أساساً للوظائف والملفات المهنية؟', 'LinkedIn', 'لينكدإن', { s: 'apps', r: 'LinkedIn' }],
  ['e05', 200, 'Which chat app, popular with gamers, organises communities into "servers"?', 'أي تطبيق دردشة مشهور بين اللاعبين ينظّم المجتمعات في «سيرفرات»؟', 'Discord', 'ديسكورد', { s: 'apps', r: 'Discord' }],
  ['e06', 200, 'On which app do short videos appear on a "For You" page?', 'في أي تطبيق تظهر المقاطع القصيرة في صفحة «For You»؟', 'TikTok', 'تيك توك', { s: 'apps', f: 'tiktok', r: 'TikTok' }],
  ['h01', 400, 'Who founded Facebook in 2004 at Harvard?', 'من أسس فيسبوك عام ٢٠٠٤ في جامعة هارفارد؟', 'Mark Zuckerberg', 'مارك زوكربيرغ', { s: 'history', alt: ['Zuckerberg'], r: 'Mark Zuckerberg' }],
  ['h02', 400, 'Which company bought Instagram in 2012?', 'أي شركة اشترت إنستغرام عام ٢٠١٢؟', 'Facebook (now Meta)', 'فيسبوك (ميتا حالياً)', { s: 'history', f: 'meta-apps', r: 'Instagram' }],
  ['h03', 400, 'TikTok merged in 2018 with which lip-sync app?', 'اندمج تيك توك عام ٢٠١٨ مع أي تطبيق لمزامنة الشفاه؟', 'Musical.ly', 'ميوزيكلي', { s: 'history', r: 'Musical.ly' }],
  ['h04', 400, 'On which platform do users save ideas as "Pins" on boards?', 'في أي منصة يحفظ المستخدمون الأفكار كـ«دبابيس» على لوحات؟', 'Pinterest', 'بنترست', { s: 'apps', r: 'Pinterest' }],
  ['h05', 400, 'Which Chinese "super app" combines messaging, payments and much more?', 'أي «تطبيق شامل» صيني يجمع المراسلة والدفع وأكثر؟', 'WeChat', 'ويتشات', { s: 'apps', r: 'WeChat' }],
  ['h06', 400, 'What is the name of Snapchat’s ghost mascot?', 'ما اسم شبح تطبيق سناب شات؟', 'Ghostface Chillah', 'غوستفيس تشيلا', { s: 'history', x: 1, f: 'snapchat', r: 'Snapchat' }],
  ['h07', 400, 'Which search giant’s social network, launched in 2011, shut down for consumers in 2019?', 'أي شبكة اجتماعية لعملاق البحث أُطلقت عام ٢٠١١ وأُغلقت أمام المستخدمين عام ٢٠١٩؟', 'Google+', 'غوغل بلس', { s: 'history', r: 'Google+' }],
  ['x01', 600, 'What was Twitter called during its development in 2006?', 'ماذا كان اسم تويتر أثناء تطويره عام ٢٠٠٦؟', 'twttr', 'twttr', { s: 'history', x: 1, r: 'Twitter' }],
  ['x02', 600, 'What was the name of the check-in app that became Instagram?', 'ما اسم تطبيق تسجيل المواقع الذي أصبح إنستغرام؟', 'Burbn', 'بيربن', { s: 'history', x: 1, f: 'meta-apps', r: 'Instagram' }],
  ['x03', 600, 'Which two former Yahoo employees founded WhatsApp?', 'أي موظفَين سابقَين في ياهو أسسا واتساب؟', 'Jan Koum and Brian Acton', 'جان كوم وبرايان أكتون', { s: 'history', x: 1, r: 'WhatsApp' }],
  ['x04', 600, 'What was Facebook called when it launched at Harvard?', 'ماذا كان اسم فيسبوك عند إطلاقه في هارفارد؟', 'TheFacebook', 'ذا فيسبوك', { s: 'history', r: 'History of Facebook' }],
  ['x05', 600, 'In which year did Facebook buy WhatsApp?', 'في أي عام اشترت فيسبوك واتساب؟', '2014', '٢٠١٤', { s: 'history', f: 'meta-apps', r: 'WhatsApp' }],
  ['x06', 600, 'Which social network, bought by News Corp in 2005, was the most visited website in the US in 2006?', 'أي شبكة اجتماعية اشترتها نيوز كورب عام ٢٠٠٥ كانت الموقع الأكثر زيارة في أمريكا عام ٢٠٠٦؟', 'Myspace', 'ماي سبيس', { s: 'history', r: 'Myspace' }],
  ['x07', 600, 'Which messaging app, founded by Pavel and Nikolai Durov, is known for channels and large groups?', 'أي تطبيق مراسلة أسسه بافيل ونيكولاي دوروف ويشتهر بالقنوات والمجموعات الكبيرة؟', 'Telegram', 'تيليجرام', { s: 'apps', r: 'Telegram (software)' }],
]);

/* ---- bank/23-more-screen-music.js ---- */
/* More film & TV topics and more music, from around the world. */
KH_BANK.cat('horror-scifi', { g: 'screen', e: '👽', en: 'Horror & Sci-Fi Films', ar: 'أفلام الرعب والخيال العلمي',
  subs: { horror: ['Horror', 'رعب'], scifi: ['Sci-fi', 'خيال علمي'] } }, [
  ['e01', 200, 'Which film’s killer clown is called Pennywise?', 'في أي فيلم يُدعى المهرج القاتل «بينيوايز»؟', 'It', 'It (هو)', { s: 'horror', r: 'It (2017 film)' }],
  ['e02', 200, 'Which sci-fi saga features the Jedi and "the Force"?', 'أي سلسلة خيال علمي تضم فرسان الجيداي و«القوة»؟', 'Star Wars', 'حرب النجوم', { s: 'scifi', r: 'Star Wars' }],
  ['e03', 200, 'Who is the masked killer in the Halloween films?', 'من القاتل المقنّع في أفلام «هالوين»؟', 'Michael Myers', 'مايكل مايرز', { s: 'horror', r: 'Michael Myers (Halloween)' }],
  ['e04', 200, 'In The Matrix, which colour pill does Neo take to learn the truth?', 'في «ذا ماتريكس»، ما لون الحبة التي يأخذها نيو ليعرف الحقيقة؟', 'Red', 'الأحمر', { s: 'scifi', r: 'Red pill and blue pill' }],
  ['e05', 200, 'Which friendly alien wants to "phone home" in a 1982 Spielberg film?', 'أي مخلوق فضائي لطيف يريد «الاتصال بالبيت» في فيلم سبيلبرغ عام ١٩٨٢؟', 'E.T.', 'إي تي', { s: 'scifi', r: 'E.T. the Extra-Terrestrial' }],
  ['e06', 200, 'In which film series do the Autobots fight the Decepticons?', 'في أي سلسلة أفلام يقاتل الأوتوبوتس الديسيبتيكونز؟', 'Transformers', 'المتحولون', { s: 'scifi', r: 'Transformers (film series)' }],
  ['e07', 200, 'Which horror franchise is about a deadly cursed videotape?', 'أي سلسلة رعب تدور حول شريط فيديو ملعون قاتل؟', 'The Ring (Ringu)', 'الحلقة (رينغو)', { s: 'horror', alt: ['Ringu'], r: 'Ring (franchise)' }],
  ['h01', 400, 'Who directed both Alien (1979) and Blade Runner (1982)?', 'من أخرج فيلمي «الفضائي» (١٩٧٩) و«بليد رنر» (١٩٨٢)؟', 'Ridley Scott', 'ريدلي سكوت', { s: 'scifi', r: 'Ridley Scott' }],
  ['h02', 400, 'What is the name of the ship’s computer in 2001: A Space Odyssey?', 'ما اسم حاسوب السفينة في «٢٠٠١: ملحمة الفضاء»؟', 'HAL 9000', 'هال ٩٠٠٠', { s: 'scifi', r: 'HAL 9000' }],
  ['h03', 400, 'In which 1973 horror film is a girl named Regan possessed?', 'في أي فيلم رعب عام ١٩٧٣ تتلبّس روح شريرة فتاة اسمها ريغان؟', 'The Exorcist', 'طارد الأرواح الشريرة', { s: 'horror', r: 'The Exorcist' }],
  ['h04', 400, 'Which slasher series features the "Ghostface" mask?', 'أي سلسلة أفلام رعب يظهر فيها قناع «غوست فيس»؟', 'Scream', 'سكريم (صرخة)', { s: 'horror', r: 'Ghostface (identity)' }],
  ['h05', 400, 'In Back to the Future, what speed must the DeLorean reach to travel in time?', 'في «العودة إلى المستقبل»، ما السرعة التي يجب أن تبلغها سيارة ديلوريان للسفر عبر الزمن؟', '88 miles per hour', '٨٨ ميلاً في الساعة', { s: 'scifi', alt: ['88 mph'], r: 'DeLorean time machine' }],
  ['h06', 400, 'Which Terminator model is the shape-shifting liquid-metal villain of Terminator 2?', 'أي طراز من المدمرين هو الشرير المعدني السائل المتحول في «المدمر ٢»؟', 'The T-1000', 'تي-١٠٠٠', { s: 'scifi', r: 'T-1000' }],
  ['h07', 400, 'On which desert planet did Luke Skywalker grow up?', 'على أي كوكب صحراوي نشأ لوك سكاي ووكر؟', 'Tatooine', 'تاتوين', { s: 'scifi', r: 'Tatooine' }],
  ['x01', 600, 'What is the desert planet at the centre of Dune called?', 'ما اسم الكوكب الصحراوي الذي تدور حوله أحداث «كثيب» (Dune)؟', 'Arrakis', 'أراكيس', { s: 'scifi', alt: ['Dune'], r: 'Arrakis' }],
  ['x02', 600, 'What is the name of the commercial towing ship in Alien (1979)?', 'ما اسم سفينة القَطر التجارية في فيلم «الفضائي» (١٩٧٩)؟', 'The Nostromo', 'نوسترومو', { s: 'scifi', x: 1, r: 'Alien (film)' }],
  ['x03', 600, 'Which 1922 German silent film was an unauthorised adaptation of Dracula?', 'أي فيلم ألماني صامت عام ١٩٢٢ كان اقتباساً غير مرخّص لـ«دراكولا»؟', 'Nosferatu', 'نوسفيراتو', { s: 'horror', r: 'Nosferatu' }],
  ['x04', 600, 'In Blade Runner, which test is used to tell replicants from humans?', 'في «بليد رنر»، أي اختبار يُستخدم للتمييز بين المستنسخين والبشر؟', 'The Voight-Kampff test', 'اختبار فويت-كامبف', { s: 'scifi', x: 1, r: 'Blade Runner' }],
  ['x05', 600, 'Who directed the original Night of the Living Dead (1968)?', 'من أخرج فيلم «ليلة الموتى الأحياء» الأصلي (١٩٦٨)؟', 'George A. Romero', 'جورج روميرو', { s: 'horror', r: 'George A. Romero' }],
  ['x06', 600, 'What is the name of Ellen Ripley’s ginger cat in Alien?', 'ما اسم القط البرتقالي لإلين ريبلي في «الفضائي»؟', 'Jones (Jonesy)', 'جونز (جونزي)', { s: 'scifi', x: 1, r: 'Alien (film)' }],
  ['x07', 600, 'In The Matrix, what is the name of Morpheus’s hovercraft?', 'في «ذا ماتريكس»، ما اسم المركبة الحوامة التي يقودها مورفيوس؟', 'The Nebuchadnezzar', 'نبوخذ نصّر', { s: 'scifi', x: 1, r: 'The Matrix' }],
]);

KH_BANK.cat('cartoons', { g: 'screen', e: '📺', en: 'Cartoon Series', ar: 'مسلسلات كرتونية',
  subs: { classic: ['Classic cartoons', 'كرتون كلاسيكي'], modern: ['Modern series', 'مسلسلات حديثة'] } }, [
  ['e01', 200, 'Which cartoon character is a sea sponge who lives in a pineapple under the sea?', 'أي شخصية كرتونية هي إسفنجة بحرية تعيش في أناناسة تحت البحر؟', 'SpongeBob SquarePants', 'سبونج بوب', { s: 'modern', r: 'SpongeBob SquarePants' }],
  ['e02', 200, 'What is the name of the cat who chases Jerry?', 'ما اسم القط الذي يطارد جيري؟', 'Tom', 'توم', { s: 'classic', f: 'tom-jerry', r: 'Tom and Jerry' }],
  ['e03', 200, 'Which Looney Tunes rabbit asks "What’s up, Doc?"', 'أي أرنب من «لوني تونز» يقول «What’s up, Doc?»؟', 'Bugs Bunny', 'باغز باني', { s: 'classic', r: 'Bugs Bunny' }],
  ['e04', 200, 'Which mystery-solving dog rides in the Mystery Machine?', 'أي كلب يحل الألغاز ويركب سيارة «ميستري ماشين»؟', 'Scooby-Doo', 'سكوبي دو', { s: 'classic', r: 'Scooby-Doo' }],
  ['e05', 200, 'Which Disney mouse starred in Steamboat Willie (1928)?', 'أي فأر من ديزني ظهر في «ستيمبوت ويلي» (١٩٢٨)؟', 'Mickey Mouse', 'ميكي ماوس', { s: 'classic', r: 'Steamboat Willie' }],
  ['e06', 200, 'Who is Fred Flintstone’s wife?', 'من زوجة فريد فلينتستون؟', 'Wilma', 'ويلما', { s: 'classic', r: 'Wilma Flintstone' }],
  ['e07', 200, 'Which boy genius has a secret laboratory that his sister Dee Dee keeps breaking into?', 'أي طفل عبقري لديه مختبر سري تقتحمه أخته دي دي باستمرار؟', 'Dexter', 'دكستر', { s: 'modern', r: 'Dexter\'s Laboratory' }],
  ['h01', 400, 'In Ben 10, what watch-like device lets Ben turn into aliens?', 'في «بن ١٠»، ما الجهاز الشبيه بالساعة الذي يحوّل بن إلى كائنات فضائية؟', 'The Omnitrix', 'الأومنيتريكس', { s: 'modern', r: 'Omnitrix' }],
  ['h02', 400, 'In which city do the Powerpuff Girls fight crime?', 'في أي مدينة تحارب فتيات القوة (باوربف غيرلز) الجريمة؟', 'Townsville', 'تاونزفيل', { s: 'modern', r: 'The Powerpuff Girls' }],
  ['h03', 400, 'What is the name of the fast-food restaurant where SpongeBob works?', 'ما اسم مطعم الوجبات السريعة الذي يعمل فيه سبونج بوب؟', 'The Krusty Krab', 'مطعم سلطع برغر (كراستي كراب)', { s: 'modern', r: 'Krusty Krab' }],
  ['h04', 400, 'In Avatar: The Last Airbender, which nation is Prince Zuko from?', 'في «أفاتار: أسطورة آنج»، من أي أمة ينحدر الأمير زوكو؟', 'The Fire Nation', 'أمة النار', { s: 'modern', r: 'Zuko' }],
  ['h05', 400, 'Which adult cartoon follows a mad scientist and his grandson across the multiverse?', 'أي مسلسل كرتوني للكبار يتابع عالماً مجنوناً وحفيده عبر الأكوان المتعددة؟', 'Rick and Morty', 'ريك ومورتي', { s: 'modern', r: 'Rick and Morty' }],
  ['h06', 400, 'Who created The Simpsons?', 'من مبتكر «عائلة سيمبسون»؟', 'Matt Groening', 'مات غرونينغ', { s: 'classic', r: 'Matt Groening' }],
  ['h07', 400, 'What kind of animal is Appa in Avatar: The Last Airbender?', 'ما نوع الحيوان «آبا» في «أفاتار: أسطورة آنج»؟', 'A flying sky bison', 'ثور سماوي طائر', { s: 'modern', r: 'List of Avatar: The Last Airbender characters' }],
  ['x01', 600, 'What is Shaggy’s real first name in Scooby-Doo?', 'ما الاسم الأول الحقيقي لشاغي في «سكوبي دو»؟', 'Norville', 'نورفيل', { s: 'classic', x: 1, r: 'Shaggy Rogers' }],
  ['x02', 600, 'Who is Perry the Platypus’s evil nemesis in Phineas and Ferb?', 'من عدو بيري خلد الماء الشرير في «فينياس وفيرب»؟', 'Dr. Heinz Doofenshmirtz', 'د. هاينز دوفنشميرتز', { s: 'modern', alt: ['Doofenshmirtz'], r: 'Dr. Heinz Doofenshmirtz' }],
  ['x03', 600, 'Which extra ingredient accidentally created the Powerpuff Girls?', 'أي مكوّن إضافي صنع فتيات القوة بالخطأ؟', 'Chemical X', 'المادة الكيميائية إكس', { s: 'modern', r: 'The Powerpuff Girls' }],
  ['x04', 600, 'What is Squidward’s surname in SpongeBob SquarePants?', 'ما اسم عائلة شفيق (سكويدوارد) في «سبونج بوب»؟', 'Tentacles', 'تنتكلز (Tentacles)', { s: 'modern', x: 1, r: 'Squidward Tentacles' }],
  ['x05', 600, 'In which year did The Simpsons first air as a half-hour series?', 'في أي عام عُرض «عائلة سيمبسون» لأول مرة كمسلسل نصف ساعة؟', '1989', '١٩٨٩', { s: 'classic', r: 'The Simpsons' }],
  ['x06', 600, 'In Courage the Cowardly Dog, what is the name of the town where Courage lives?', 'في «كوراج الكلب الجبان»، ما اسم البلدة التي يعيش فيها كوراج؟', 'Nowhere (Kansas)', 'نوهير (Nowhere) في كانساس', { s: 'modern', x: 1, r: 'Courage the Cowardly Dog' }],
  ['x07', 600, 'Which studio produced the original Tom and Jerry shorts in the 1940s?', 'أي استوديو أنتج أفلام «توم وجيري» القصيرة الأصلية في الأربعينيات؟', 'MGM (Metro-Goldwyn-Mayer)', 'إم جي إم (مترو غولدوين ماير)', { s: 'classic', f: 'tom-jerry', r: 'Tom and Jerry' }],
]);

KH_BANK.cat('villains-duos', { g: 'screen', e: '🦹', en: 'Villains & Famous Duos', ar: 'أشرار وثنائيات شهيرة',
  subs: { villains: ['Villains', 'أشرار'], duos: ['Duos & partners', 'ثنائيات'] } }, [
  ['e01', 200, 'Which clown-faced criminal is Batman’s greatest enemy?', 'أي مجرم بوجه مهرج هو ألد أعداء باتمان؟', 'The Joker', 'الجوكر', { s: 'villains', r: 'Joker (character)' }],
  ['e02', 200, 'Darth Vader is the father of which Jedi?', 'دارث فيدر هو والد أي فارس جيداي؟', 'Luke Skywalker', 'لوك سكاي ووكر', { s: 'villains', r: 'Darth Vader' }],
  ['e03', 200, 'Who is Harry Potter’s dark-wizard enemy?', 'من الساحر الشرير عدو هاري بوتر؟', 'Lord Voldemort', 'اللورد فولدمورت', { s: 'villains', f: 'voldemort', r: 'Lord Voldemort' }],
  ['e04', 200, 'In The Lion King, who kills Mufasa?', 'في «الأسد الملك»، من قتل موفاسا؟', 'Scar', 'سكار', { s: 'villains', f: 'scar', r: 'Scar (The Lion King)' }],
  ['e05', 200, 'Which Disney villain curses Princess Aurora and has a pet raven?', 'أي شريرة من ديزني لعنت الأميرة أورورا ولديها غراب أليف؟', 'Maleficent', 'ماليفيسنت', { s: 'villains', r: 'Maleficent' }],
  ['e06', 200, 'Who is Sherlock Holmes’s friend, flatmate and assistant?', 'من صديق شيرلوك هولمز ورفيق سكنه ومساعده؟', 'Dr John Watson', 'الدكتور جون واطسون', { s: 'duos', alt: ['Watson'], r: 'Dr. Watson' }],
  ['e07', 200, 'Which space ranger is Woody’s partner in Toy Story?', 'أي حارس فضاء هو شريك وودي في «حكاية لعبة»؟', 'Buzz Lightyear', 'باز يطير', { s: 'duos', r: 'Buzz Lightyear' }],
  ['h01', 400, 'What is Lord Voldemort’s real name?', 'ما الاسم الحقيقي للورد فولدمورت؟', 'Tom Marvolo Riddle', 'توم مارفولو ريدل', { s: 'villains', f: 'voldemort', alt: ['Tom Riddle'], r: 'Lord Voldemort' }],
  ['h02', 400, 'Who is Sherlock Holmes’s criminal mastermind nemesis?', 'من العقل المدبر الإجرامي عدو شيرلوك هولمز؟', 'Professor James Moriarty', 'البروفيسور جيمس موريارتي', { s: 'villains', alt: ['Moriarty'], r: 'Professor Moriarty' }],
  ['h03', 400, 'Which cannibal psychiatrist is the villain of The Silence of the Lambs?', 'أي طبيب نفسي آكل لحوم البشر هو شرير «صمت الحملان»؟', 'Hannibal Lecter', 'هانيبال ليكتر', { s: 'villains', f: 'lecter', r: 'Hannibal Lecter' }],
  ['h04', 400, 'Which golden protocol droid is R2-D2’s constant companion?', 'أي روبوت ذهبي للبروتوكول هو الرفيق الدائم لـR2-D2؟', 'C-3PO', 'سي-ثري بي أو', { s: 'duos', r: 'C-3PO' }],
  ['h05', 400, 'Which Titan collects the Infinity Stones in Avengers: Infinity War?', 'أي عملاق يجمع أحجار اللانهاية في «المنتقمون: حرب اللانهاية»؟', 'Thanos', 'ثانوس', { s: 'villains', r: 'Thanos' }],
  ['h06', 400, 'What are the names of Team Rocket’s two human members in the Pokémon anime?', 'ما اسما العضوين البشريين في فريق روكيت بأنمي بوكيمون؟', 'Jessie and James', 'جيسي وجيمس', { s: 'duos', r: 'Jessie and James' }],
  ['h07', 400, 'Which stop-motion duo are a cheese-loving inventor and his clever dog?', 'أي ثنائي بالرسوم الطينية هما مخترع يحب الجبن وكلبه الذكي؟', 'Wallace and Gromit', 'والاس وغروميت', { s: 'duos', r: 'Wallace & Gromit' }],
  ['x01', 600, 'In official Lion King books, what was Scar’s original name?', 'في كتب «الأسد الملك» الرسمية، ما الاسم الأصلي لسكار؟', 'Taka', 'تاكا', { s: 'villains', x: 1, f: 'scar', r: 'Scar (The Lion King)' }],
  ['x02', 600, 'Which actor won an Oscar for playing Hannibal Lecter in 1991?', 'أي ممثل فاز بالأوسكار عن دور هانيبال ليكتر عام ١٩٩١؟', 'Anthony Hopkins', 'أنتوني هوبكنز', { s: 'villains', f: 'lecter', r: 'Anthony Hopkins' }],
  ['x03', 600, 'What are the names of the three hyenas who serve Scar?', 'ما أسماء الضباع الثلاث التي تخدم سكار؟', 'Shenzi, Banzai and Ed', 'شنزي وبانزاي وإد', { s: 'duos', x: 1, f: 'scar', r: 'List of The Lion King characters' }],
  ['x04', 600, 'Which Bond villain, head of SPECTRE, is often seen stroking a white cat?', 'أي شرير في أفلام بوند، رئيس منظمة «سبكتر»، يظهر غالباً وهو يداعب قطة بيضاء؟', 'Ernst Stavro Blofeld', 'إرنست ستافرو بلوفيلد', { s: 'villains', alt: ['Blofeld'], r: 'Ernst Stavro Blofeld' }],
  ['x05', 600, 'Who is the explorer villain in Pixar’s Up?', 'من المستكشف الشرير في فيلم «فوق» من بيكسار؟', 'Charles Muntz', 'تشارلز مونتز', { s: 'villains', x: 1, r: 'Up (2009 film)' }],
  ['x06', 600, 'What is the Riddler’s real name in most Batman stories?', 'ما الاسم الحقيقي لـ«ريدلر» في معظم قصص باتمان؟', 'Edward Nygma (Nashton)', 'إدوارد نيغما (ناشتون)', { s: 'villains', x: 1, r: 'Riddler' }],
  ['x07', 600, 'Every night, what are Pinky and the Brain going to try to do?', 'كل ليلة، ماذا يحاول بينكي وبرين أن يفعلا؟', 'Take over the world', 'السيطرة على العالم', { s: 'duos', r: 'Pinky and the Brain' }],
]);

KH_BANK.cat('global-pop', { g: 'music', e: '🌏', en: 'K-pop, Latin & Global Hits', ar: 'كيبوب ولاتيني وأغاني عالمية', pop: 1,
  subs: { kpop: ['K-pop', 'كيبوب'], latin: ['Latin', 'لاتيني'], africa: ['Afrobeats & more', 'أفروبيتس وغيرها'] } }, [
  ['e01', 200, 'Which K-pop girl group’s members are Jisoo, Jennie, Rosé and Lisa?', 'أي فرقة كيبوب نسائية أعضاؤها جيسو وجيني وروزي وليسا؟', 'Blackpink', 'بلاك بينك', { s: 'kpop', f: 'blackpink', r: 'Blackpink' }],
  ['e02', 200, 'Who sang "Despacito" with Daddy Yankee?', 'من غنّى «ديسباسيتو» مع دادي يانكي؟', 'Luis Fonsi', 'لويس فونسي', { s: 'latin', r: 'Despacito' }],
  ['e03', 200, 'Which Colombian singer had a huge hit with "Hips Don’t Lie"?', 'أي مغنية كولومبية حققت نجاحاً ضخماً بأغنية «Hips Don’t Lie»؟', 'Shakira', 'شاكيرا', { s: 'latin', r: 'Shakira' }],
  ['e04', 200, 'Which South Korean singer made "Gangnam Style"?', 'أي مغنٍّ كوري جنوبي صنع «غانغنام ستايل»؟', 'PSY', 'ساي', { s: 'kpop', f: 'gangnam', r: 'Psy' }],
  ['e05', 200, 'Burna Boy and Wizkid are stars of which West African music style?', 'بيرنا بوي وويزكيد نجمان في أي نمط موسيقي من غرب أفريقيا؟', 'Afrobeats', 'أفروبيتس', { s: 'africa', r: 'Afrobeats' }],
  ['e06', 200, 'Which Puerto Rican star, born Benito Martínez, is one of the world’s most-streamed artists?', 'أي نجم من بورتوريكو، اسمه الحقيقي بينيتو مارتينيز، من أكثر الفنانين استماعاً في العالم؟', 'Bad Bunny', 'باد باني', { s: 'latin', r: 'Bad Bunny' }],
  ['e07', 200, 'Which K-pop group’s fans are called "ARMY"?', 'جمهور أي فرقة كيبوب يُسمّى «آرمي»؟', 'BTS', 'بي تي إس', { s: 'kpop', f: 'bts', r: 'BTS' }],
  ['h01', 400, 'Which Blackpink member is from Thailand?', 'أي عضوة في بلاك بينك من تايلاند؟', 'Lisa', 'ليسا', { s: 'kpop', f: 'blackpink', r: 'Lisa (rapper)' }],
  ['h02', 400, 'Which Spanish singer released the albums El Mal Querer and Motomami?', 'أي مغنية إسبانية أصدرت ألبومي «El Mal Querer» و«Motomami»؟', 'Rosalía', 'روساليا', { s: 'latin', alt: ['Rosalia'], r: 'Rosalía' }],
  ['h03', 400, 'Which Nigerian singer won the Grammy for Best Global Music Album with Twice as Tall?', 'أي مغنٍّ نيجيري فاز بجائزة غرامي لأفضل ألبوم موسيقى عالمية بألبوم «Twice as Tall»؟', 'Burna Boy', 'بيرنا بوي', { s: 'africa', r: 'Twice as Tall' }],
  ['h04', 400, 'Which 1990s song by Los del Río became a worldwide dance craze?', 'أي أغنية لفرقة «لوس ديل ريو» في التسعينيات أصبحت موضة رقص عالمية؟', '"Macarena"', '«ماكارينا»', { s: 'latin', r: 'Macarena (song)' }],
  ['h05', 400, 'Which K-pop girl group had a 2009 megahit with "Gee"?', 'أي فرقة كيبوب نسائية حققت نجاحاً ضخماً عام ٢٠٠٩ بأغنية «Gee»؟', 'Girls’ Generation', 'جيرلز جنريشن', { s: 'kpop', alt: ['SNSD'], r: 'Gee (Girls\' Generation song)' }],
  ['h06', 400, 'Who is the leader of BTS?', 'من قائد فرقة بي تي إس؟', 'RM', 'آر إم', { s: 'kpop', f: 'bts', alt: ['Kim Namjoon'], r: 'RM (rapper)' }],
  ['h07', 400, 'Which company manages BTS through its label Big Hit Music?', 'أي شركة تدير بي تي إس عبر علامتها «بيغ هيت ميوزك»؟', 'HYBE', 'هايب', { s: 'kpop', f: 'bts', x: 1, r: 'Hybe Corporation' }],
  ['x01', 600, 'Which group’s 1992 debut is often credited with starting modern K-pop?', 'أي فرقة يُنسب لظهورها الأول عام ١٩٩٢ إطلاق الكيبوب الحديث؟', 'Seo Taiji and Boys', 'سو تاي جي آند بويز', { s: 'kpop', x: 1, r: 'Seo Taiji and Boys' }],
  ['x02', 600, 'In which year did BTS debut?', 'في أي عام ظهرت فرقة بي تي إس لأول مرة؟', '2013', '٢٠١٣', { s: 'kpop', f: 'bts', r: 'BTS' }],
  ['x03', 600, 'Who composed the bossa nova classic "The Girl from Ipanema"?', 'من لحّن أغنية البوسا نوفا الكلاسيكية «فتاة إيبانيما»؟', 'Antônio Carlos Jobim', 'أنطونيو كارلوس جوبيم', { s: 'latin', x: 1, alt: ['Tom Jobim'], r: 'The Girl from Ipanema' }],
  ['x04', 600, 'In which year was the Cuban album Buena Vista Social Club released?', 'في أي عام صدر الألبوم الكوبي «بوينا فيستا سوشال كلوب»؟', '1997', '١٩٩٧', { s: 'latin', x: 1, r: 'Buena Vista Social Club (album)' }],
  ['x05', 600, 'Which Senegalese singer recorded "7 Seconds" with Neneh Cherry?', 'أي مغنٍّ سنغالي سجّل أغنية «7 Seconds» مع نينا تشيري؟', 'Youssou N’Dour', 'يوسو ندور', { s: 'africa', r: '7 Seconds (song)' }],
  ['x06', 600, 'Which Blackpink video was the first by a K-pop group to pass one billion YouTube views?', 'أي فيديو لبلاك بينك كان الأول لفرقة كيبوب يتخطى مليار مشاهدة على يوتيوب؟', '"Ddu-Du Ddu-Du"', '«Ddu-Du Ddu-Du»', { s: 'kpop', x: 1, f: 'blackpink', r: 'Ddu-Du Ddu-Du' }],
  ['x07', 600, 'Which Nigerian musician pioneered Afrobeat in the late 1960s and 1970s?', 'أي موسيقي نيجيري كان رائد «الأفروبيت» في أواخر الستينيات والسبعينيات؟', 'Fela Kuti', 'فيلا كوتي', { s: 'africa', r: 'Fela Kuti' }],
]);

KH_BANK.cat('rnb-electronic', { g: 'music', e: '🎧', en: 'R&B, Electronic & Dance', ar: 'آر أند بي وموسيقى إلكترونية',
  subs: { rnb: ['R&B & soul', 'آر أند بي وسول'], electronic: ['Electronic & DJs', 'إلكترونية ودي جي'] } }, [
  ['e01', 200, 'Which French electronic duo performed in robot helmets?', 'أي ثنائي فرنسي للموسيقى الإلكترونية كان يرتدي خوذات روبوت؟', 'Daft Punk', 'دافت بانك', { s: 'electronic', r: 'Daft Punk' }],
  ['e02', 200, 'Which Toronto singer released "Blinding Lights"?', 'أي مغنٍّ من تورونتو أصدر أغنية «Blinding Lights»؟', 'The Weeknd', 'ذا ويكند', { s: 'rnb', r: 'Blinding Lights' }],
  ['e03', 200, 'Whose hits include "Umbrella" and "Diamonds"?', 'من صاحبة أغاني «Umbrella» و«Diamonds»؟', 'Rihanna', 'ريهانا', { s: 'rnb', r: 'Rihanna' }],
  ['e04', 200, 'Which Swedish DJ made "Levels" and "Wake Me Up"?', 'أي دي جي سويدي صنع «Levels» و«Wake Me Up»؟', 'Avicii', 'أفيتشي', { s: 'electronic', f: 'avicii', r: 'Avicii' }],
  ['e05', 200, 'Which singer’s hits include "Crazy in Love" and "Single Ladies"?', 'أي مغنية من أغانيها «Crazy in Love» و«Single Ladies»؟', 'Beyoncé', 'بيونسيه', { s: 'rnb', r: 'Beyoncé' }],
  ['e06', 200, 'Which Scottish DJ and producer made "Summer" and "One Kiss"?', 'أي دي جي ومنتج إسكتلندي صنع «Summer» و«One Kiss»؟', 'Calvin Harris', 'كالفن هاريس', { s: 'electronic', r: 'Calvin Harris' }],
  ['e07', 200, 'Which Dutch DJ had a teenage hit with "Animals" in 2013?', 'أي دي جي هولندي حقق نجاحاً وهو مراهق بأغنية «Animals» عام ٢٠١٣؟', 'Martin Garrix', 'مارتن غاريكس', { s: 'electronic', r: 'Martin Garrix' }],
  ['h01', 400, 'What does EDM stand for?', 'ماذا يعني اختصار EDM؟', 'Electronic dance music', 'موسيقى الرقص الإلكترونية', { s: 'electronic', r: 'Electronic dance music' }],
  ['h02', 400, 'Which R&B singer released the 2016 album Blonde?', 'أي مغنٍّ آر أند بي أصدر ألبوم «Blonde» عام ٢٠١٦؟', 'Frank Ocean', 'فرانك أوشن', { s: 'rnb', r: 'Blonde (Frank Ocean album)' }],
  ['h03', 400, 'Which DJ performs wearing a giant mouse-head helmet?', 'أي دي جي يؤدي مرتدياً خوذة على شكل رأس فأر عملاق؟', 'deadmau5', 'ديدماوس', { s: 'electronic', r: 'Deadmau5' }],
  ['h04', 400, 'In which US city did house music begin in the early 1980s?', 'في أي مدينة أمريكية بدأت موسيقى «الهاوس» أوائل الثمانينيات؟', 'Chicago', 'شيكاغو', { s: 'electronic', r: 'House music' }],
  ['h05', 400, 'Which singer released the albums Ctrl (2017) and SOS (2022)?', 'أي مغنية أصدرت ألبومي «Ctrl» (٢٠١٧) و«SOS» (٢٠٢٢)؟', 'SZA', 'سيزا', { s: 'rnb', r: 'SZA' }],
  ['h06', 400, 'Which singer is known as the "Queen of Soul"?', 'أي مغنية تُلقّب بـ«ملكة السول»؟', 'Aretha Franklin', 'أريثا فرانكلين', { s: 'rnb', r: 'Aretha Franklin' }],
  ['h07', 400, 'Which 1990s girl group had the hit "No Scrubs"?', 'أي فرقة نسائية في التسعينيات اشتهرت بأغنية «No Scrubs»؟', 'TLC', 'تي إل سي', { s: 'rnb', r: 'No Scrubs' }],
  ['x01', 600, 'In which US city did techno music begin?', 'في أي مدينة أمريكية بدأت موسيقى «التكنو»؟', 'Detroit', 'ديترويت', { s: 'electronic', r: 'Detroit techno' }],
  ['x02', 600, 'What was Avicii’s real name?', 'ما الاسم الحقيقي لأفيتشي؟', 'Tim Bergling', 'تيم بيرغلينغ', { s: 'electronic', f: 'avicii', r: 'Avicii' }],
  ['x03', 600, 'Which Roland drum machine, known by three digits, shaped hip-hop and electronic music?', 'أي آلة إيقاع من «رولاند» تُعرف بثلاثة أرقام شكّلت الهيب هوب والموسيقى الإلكترونية؟', 'The TR-808', 'تي آر-٨٠٨', { s: 'electronic', x: 1, alt: ['808'], r: 'Roland TR-808' }],
  ['x04', 600, 'Which German band released the pioneering electronic album Autobahn in 1974?', 'أي فرقة ألمانية أصدرت الألبوم الإلكتروني الرائد «Autobahn» عام ١٩٧٤؟', 'Kraftwerk', 'كرافتفيرك', { s: 'electronic', r: 'Kraftwerk' }],
  ['x05', 600, 'What was the title of The Weeknd’s first mixtape, in 2011?', 'ما عنوان أول ميكستيب لذا ويكند عام ٢٠١١؟', 'House of Balloons', 'House of Balloons', { s: 'rnb', x: 1, r: 'House of Balloons' }],
  ['x06', 600, 'Which Daft Punk album includes "Get Lucky"?', 'أي ألبوم لدافت بانك يضم أغنية «Get Lucky»؟', 'Random Access Memories', 'Random Access Memories', { s: 'electronic', x: 1, r: 'Random Access Memories' }],
  ['x07', 600, 'Who founded the Motown record label in Detroit in 1959?', 'من أسس شركة التسجيلات «موتاون» في ديترويت عام ١٩٥٩؟', 'Berry Gordy', 'بيري غوردي', { s: 'rnb', r: 'Berry Gordy' }],
]);

/* ---- bank/30-geography.js ---- */
/* Geography. */
KH_BANK.cat('capitals', { g: 'geo', pop: 1, e: '🏙️', en: 'World Capitals', ar: 'عواصم العالم',
  subs: { europe: ['Europe', 'أوروبا'], asia: ['Asia & Middle East', 'آسيا والشرق الأوسط'], africa: ['Africa', 'أفريقيا'], americas: ['Americas & Oceania', 'الأمريكتان وأوقيانوسيا'] } }, [
  ['e01', 200, 'What is the capital of Italy?', 'ما عاصمة إيطاليا؟', 'Rome', 'روما', { s: 'europe', r: 'Rome' }],
  ['e02', 200, 'What is the capital of Egypt?', 'ما عاصمة مصر؟', 'Cairo', 'القاهرة', { s: 'africa', r: 'Cairo' }],
  ['e03', 200, 'What is the capital of Spain?', 'ما عاصمة إسبانيا؟', 'Madrid', 'مدريد', { s: 'europe', r: 'Madrid' }],
  ['e04', 200, 'What is the capital of Germany?', 'ما عاصمة ألمانيا؟', 'Berlin', 'برلين', { s: 'europe', r: 'Berlin' }],
  ['e05', 200, 'What is the capital of the United Arab Emirates?', 'ما عاصمة الإمارات العربية المتحدة؟', 'Abu Dhabi', 'أبوظبي', { s: 'asia', r: 'Abu Dhabi' }],
  ['e06', 200, 'What is the capital of Japan?', 'ما عاصمة اليابان؟', 'Tokyo', 'طوكيو', { s: 'asia', r: 'Tokyo' }],
  ['h01', 400, 'What is the capital of Australia?', 'ما عاصمة أستراليا؟', 'Canberra', 'كانبرا', { s: 'americas', n: 'Not Sydney or Melbourne.', nAr: 'ليست سيدني ولا ملبورن.', r: 'Canberra' }],
  ['h02', 400, 'What is the capital of Turkey?', 'ما عاصمة تركيا؟', 'Ankara', 'أنقرة', { s: 'asia', r: 'Ankara' }],
  ['h03', 400, 'What is the capital of Canada?', 'ما عاصمة كندا؟', 'Ottawa', 'أوتاوا', { s: 'americas', f: 'cap-canada', r: 'Ottawa' }],
  ['h04', 400, 'What is the capital of Brazil?', 'ما عاصمة البرازيل؟', 'Brasília', 'برازيليا', { s: 'americas', r: 'Brasília' }],
  ['h05', 400, 'What is the capital of Morocco?', 'ما عاصمة المغرب؟', 'Rabat', 'الرباط', { s: 'africa', r: 'Rabat' }],
  ['h06', 400, 'What is the capital of Switzerland?', 'ما عاصمة سويسرا؟', 'Bern', 'برن', { s: 'europe', r: 'Bern' }],
  ['h07', 400, 'What is the capital of New Zealand?', 'ما عاصمة نيوزيلندا؟', 'Wellington', 'ويلينغتون', { s: 'americas', r: 'Wellington' }],
  ['h08', 400, 'What is the capital of Kazakhstan?', 'ما عاصمة كازاخستان؟', 'Astana', 'أستانا', { s: 'asia', r: 'Astana' }],
  ['x01', 600, 'Which purpose-built city replaced Yangon as the capital of Myanmar in 2005–06?', 'أي مدينة بُنيت خصيصاً لتحل محل يانغون عاصمةً لميانمار عام ٢٠٠٥–٠٦؟', 'Naypyidaw', 'نايبيداو', { s: 'asia', x: 1, r: 'Naypyidaw' }],
  ['x02', 600, 'La Paz is Bolivia’s seat of government. What is its constitutional capital?', 'لاباز مقر الحكومة في بوليفيا. ما عاصمتها الدستورية؟', 'Sucre', 'سوكري', { s: 'americas', r: 'Sucre' }],
  ['x03', 600, 'What is the official legislative capital of Sri Lanka?', 'ما العاصمة التشريعية الرسمية لسريلانكا؟', 'Sri Jayawardenepura Kotte', 'سري جاياواردنابورا كوتي', { s: 'asia', x: 1, alt: ['Kotte'], r: 'Sri Jayawardenepura Kotte' }],
  ['x04', 600, 'What is the official capital of Côte d’Ivoire (Ivory Coast)?', 'ما العاصمة الرسمية لساحل العاج؟', 'Yamoussoukro', 'ياموسوكرو', { s: 'africa', n: 'Abidjan is the largest city and economic capital.', nAr: 'أبيدجان أكبر مدنها وعاصمتها الاقتصادية.', r: 'Yamoussoukro' }],
  ['x05', 600, 'What is the capital of the Pacific island nation of Palau?', 'ما عاصمة دولة بالاو في المحيط الهادئ؟', 'Ngerulmud', 'نغيرولمود', { s: 'americas', x: 1, r: 'Ngerulmud' }],
  ['x06', 600, 'What is the capital of the Himalayan kingdom of Bhutan?', 'ما عاصمة مملكة بوتان في جبال الهيمالايا؟', 'Thimphu', 'تيمفو', { s: 'asia', r: 'Thimphu' }],
]);

KH_BANK.cat('flags', { g: 'geo', e: '🚩', en: 'Flags', ar: 'أعلام',
  subs: { symbols: ['Symbols', 'رموز'], colours: ['Colours & shapes', 'ألوان وأشكال'] } }, [
  ['e01', 200, 'Which country’s flag is red and white with a red maple leaf?', 'أي دولة علمها أحمر وأبيض وفيه ورقة قيقب حمراء؟', 'Canada', 'كندا', { s: 'symbols', r: 'Flag of Canada' }],
  ['e02', 200, 'Which country’s flag is white with a red circle in the middle?', 'أي دولة علمها أبيض وفي وسطه دائرة حمراء؟', 'Japan', 'اليابان', { s: 'colours', r: 'Flag of Japan' }],
  ['e03', 200, 'Which country’s green flag carries the Shahada and a sword?', 'أي دولة علمها أخضر ويحمل الشهادة وسيفاً؟', 'Saudi Arabia', 'السعودية', { s: 'symbols', r: 'Flag of Saudi Arabia' }],
  ['e04', 200, 'Which country’s flag is nicknamed the "Stars and Stripes"?', 'علم أي دولة يُلقّب بـ«النجوم والخطوط»؟', 'The United States', 'الولايات المتحدة', { s: 'symbols', alt: ['USA'], r: 'Flag of the United States' }],
  ['e05', 200, 'Which country’s flag is red with a white crescent and star?', 'أي دولة علمها أحمر وفيه هلال ونجمة بيضاء؟', 'Turkey', 'تركيا', { s: 'symbols', alt: ['Türkiye'], r: 'Flag of Turkey' }],
  ['e06', 200, 'Which country’s flag is dark green with a white crescent and star, and a white stripe at the hoist?', 'أي دولة علمها أخضر داكن فيه هلال ونجمة بيضاء مع شريط أبيض عند السارية؟', 'Pakistan', 'باكستان', { s: 'symbols', r: 'Flag of Pakistan' }],
  ['h01', 400, 'Which country’s flag shows an eagle eating a snake on a cactus?', 'أي دولة يظهر في علمها نسر يأكل أفعى فوق صبّار؟', 'Mexico', 'المكسيك', { s: 'symbols', r: 'Flag of Mexico' }],
  ['h02', 400, 'Which is the only country whose national flag is not a rectangle?', 'ما الدولة الوحيدة التي علمها الوطني ليس مستطيلاً؟', 'Nepal', 'نيبال', { s: 'colours', r: 'Flag of Nepal' }],
  ['h03', 400, 'Which country’s flag has the Union Jack and four red stars outlined in white?', 'أي دولة علمها يحمل علم الاتحاد البريطاني وأربع نجوم حمراء بحواف بيضاء؟', 'New Zealand', 'نيوزيلندا', { s: 'symbols', n: 'Australia’s similar flag has white stars.', nAr: 'علم أستراليا المشابه نجومه بيضاء.', r: 'Flag of New Zealand' }],
  ['h04', 400, 'Which country’s flag features a green cedar tree?', 'أي دولة يتوسط علمها شجرة أرز خضراء؟', 'Lebanon', 'لبنان', { s: 'symbols', r: 'Flag of Lebanon' }],
  ['h05', 400, 'Which island country’s flag shows a copper-coloured map of the island?', 'أي دولة جزرية يظهر في علمها خريطة الجزيرة بلون نحاسي؟', 'Cyprus', 'قبرص', { f: 'cyprus-shape', s: 'symbols', r: 'Flag of Cyprus' }],
  ['h06', 400, 'Which North African country’s flag is half green, half white, with a red crescent and star?', 'أي دولة في شمال أفريقيا علمها نصفه أخضر ونصفه أبيض مع هلال ونجمة حمراء؟', 'Algeria', 'الجزائر', { s: 'colours', r: 'Flag of Algeria' }],
  ['x01', 600, 'Which country’s flag includes an AK-47 rifle?', 'علم أي دولة يتضمن بندقية كلاشنكوف؟', 'Mozambique', 'موزمبيق', { s: 'symbols', x: 1, r: 'Flag of Mozambique' }],
  ['x02', 600, 'Which Himalayan country’s flag shows a white dragon?', 'أي دولة في الهيمالايا يحمل علمها تنيناً أبيض؟', 'Bhutan', 'بوتان', { s: 'symbols', r: 'Flag of Bhutan' }],
  ['x03', 600, 'Which country used a plain green flag with no design from 1977 to 2011?', 'أي دولة استخدمت علماً أخضر بلا أي رسم من ١٩٧٧ إلى ٢٠١١؟', 'Libya', 'ليبيا', { s: 'colours', r: 'Flag of Libya' }],
  ['x04', 600, 'The Dannebrog is said to be the oldest national flag in continuous use. Which country’s is it?', 'علم «دانبروغ» يُقال إنه أقدم علم وطني مستخدم باستمرار. لأي دولة؟', 'Denmark', 'الدنمارك', { s: 'colours', r: 'Flag of Denmark' }],
  ['x05', 600, 'Which country’s flag has a different emblem on its front and back?', 'علم أي دولة يحمل شعاراً مختلفاً على وجهه الأمامي والخلفي؟', 'Paraguay', 'باراغواي', { s: 'symbols', x: 1, r: 'Flag of Paraguay' }],
  ['x06', 600, 'Which Caribbean country’s flag features a Sisserou parrot, giving it rare purple colouring?', 'أي دولة كاريبية يظهر في علمها ببغاء «سيسيرو» مما يمنحه لوناً بنفسجياً نادراً؟', 'Dominica', 'دومينيكا', { s: 'colours', x: 1, r: 'Flag of Dominica' }],
]);

KH_BANK.cat('landmarks', { g: 'geo', pop: 1, e: '🗽', en: 'Landmarks & Wonders', ar: 'معالم وعجائب',
  subs: { modern: ['Modern landmarks', 'معالم حديثة'], ancient: ['Ancient wonders', 'عجائب قديمة'] } }, [
  ['e01', 200, 'In which city is the Eiffel Tower?', 'في أي مدينة يقع برج إيفل؟', 'Paris', 'باريس', { s: 'modern', r: 'Eiffel Tower' }],
  ['e02', 200, 'Which country is home to the Great Wall?', 'في أي دولة يقع سور الصين العظيم؟', 'China', 'الصين', { s: 'ancient', r: 'Great Wall of China' }],
  ['e03', 200, 'In which city is the Burj Khalifa?', 'في أي مدينة يقع برج خليفة؟', 'Dubai', 'دبي', { s: 'modern', r: 'Burj Khalifa' }],
  ['e04', 200, 'In which country is Machu Picchu?', 'في أي دولة تقع ماتشو بيتشو؟', 'Peru', 'البيرو', { s: 'ancient', r: 'Machu Picchu' }],
  ['e05', 200, 'In which city is the Colosseum?', 'في أي مدينة يقع الكولوسيوم؟', 'Rome', 'روما', { s: 'ancient', r: 'Colosseum' }],
  ['e06', 200, 'Which is the only one of the Seven Wonders of the Ancient World still standing?', 'ما العجيبة الوحيدة من عجائب الدنيا السبع القديمة التي ما زالت قائمة؟', 'The Great Pyramid of Giza', 'الهرم الأكبر في الجيزة', { s: 'ancient', r: 'Great Pyramid of Giza' }],
  ['h01', 400, 'In which Indian city is the Taj Mahal?', 'في أي مدينة هندية يقع تاج محل؟', 'Agra', 'أغرا', { s: 'ancient', f: 'taj', r: 'Taj Mahal' }],
  ['h02', 400, 'In which country is the rock-cut city of Petra?', 'في أي دولة تقع مدينة البتراء المنحوتة في الصخر؟', 'Jordan', 'الأردن', { s: 'ancient', r: 'Petra' }],
  ['h03', 400, 'Which statue was a gift from France to the United States in 1886?', 'أي تمثال كان هدية من فرنسا إلى الولايات المتحدة عام ١٨٨٦؟', 'The Statue of Liberty', 'تمثال الحرية', { s: 'modern', r: 'Statue of Liberty' }],
  ['h04', 400, 'In which country is the temple complex of Angkor Wat?', 'في أي دولة يقع معبد أنغكور وات؟', 'Cambodia', 'كمبوديا', { f: 'angkor', s: 'ancient', r: 'Angkor Wat' }],
  ['h05', 400, 'Which Spanish architect designed Barcelona’s Sagrada Família?', 'أي معماري إسباني صمّم كنيسة «ساغرادا فاميليا» في برشلونة؟', 'Antoni Gaudí', 'أنطوني غاودي', { s: 'modern', alt: ['Gaudí', 'Gaudi'], r: 'Sagrada Família' }],
  ['h06', 400, 'What are the giant stone heads on Easter Island called?', 'ماذا تُسمّى الرؤوس الحجرية العملاقة في جزيرة الفصح؟', 'Moai', 'المواي', { s: 'ancient', r: 'Moai' }],
  ['h07', 400, 'Which twin towers in Kuala Lumpur were the world’s tallest buildings from 1998 to 2004?', 'أي برجين توأمين في كوالالمبور كانا الأطول في العالم من ١٩٩٨ إلى ٢٠٠٤؟', 'The Petronas Towers', 'برجا بتروناس', { s: 'modern', r: 'Petronas Towers' }],
  ['h08', 400, 'In which Spanish city is the Alhambra palace?', 'في أي مدينة إسبانية يقع قصر الحمراء؟', 'Granada', 'غرناطة', { s: 'ancient', r: 'Alhambra' }],
  ['x01', 600, 'Which Nabataean site near AlUla became Saudi Arabia’s first UNESCO World Heritage Site, in 2008?', 'أي موقع نبطي قرب العُلا أصبح أول موقع سعودي في قائمة التراث العالمي لليونسكو عام ٢٠٠٨؟', 'Hegra (Mada’in Salih)', 'الحِجر (مدائن صالح)', { s: 'ancient', alt: ['Mada\'in Salih', 'Al-Hijr'], r: 'Hegra (Mada\'in Salih)' }],
  ['x02', 600, 'In which city stood the Pharos, the ancient lighthouse that was a wonder of the world?', 'في أي مدينة كانت تقوم منارة فاروس، إحدى عجائب الدنيا القديمة؟', 'Alexandria', 'الإسكندرية', { s: 'ancient', r: 'Lighthouse of Alexandria' }],
  ['x03', 600, 'Which Indonesian temple is the world’s largest Buddhist temple?', 'أي معبد في إندونيسيا هو أكبر معبد بوذي في العالم؟', 'Borobudur', 'بوروبودور', { s: 'ancient', x: 1, r: 'Borobudur' }],
  ['x04', 600, 'What was the ceremonial capital of the ancient Persian Achaemenid Empire, near modern Shiraz?', 'ما العاصمة الاحتفالية للإمبراطورية الأخمينية الفارسية القديمة قرب شيراز؟', 'Persepolis', 'برسبوليس', { s: 'ancient', x: 1, r: 'Persepolis' }],
  ['x05', 600, 'Which Mughal emperor built the Taj Mahal in memory of his wife?', 'أي إمبراطور مغولي بنى تاج محل تخليداً لذكرى زوجته؟', 'Shah Jahan', 'شاه جهان', { s: 'ancient', f: 'taj', r: 'Shah Jahan' }],
  ['x06', 600, 'Which Riyadh skyscraper is famous for the bridge across the hole at its top?', 'أي ناطحة سحاب في الرياض تشتهر بالجسر الذي يعبر الفتحة في قمتها؟', 'Kingdom Centre (Kingdom Tower)', 'برج المملكة', { s: 'modern', alt: ['Kingdom Tower'], r: 'Kingdom Centre' }],
]);

KH_BANK.cat('physical-geo', { g: 'geo', e: '🏔️', en: 'Mountains, Rivers & Deserts', ar: 'جبال وأنهار وصحارى',
  subs: { mountains: ['Mountains', 'جبال'], water: ['Rivers, lakes & seas', 'أنهار وبحيرات وبحار'], deserts: ['Deserts & climate', 'صحارى ومناخ'] } }, [
  ['e01', 200, 'What is the tallest mountain in the world above sea level?', 'ما أعلى جبل في العالم فوق مستوى سطح البحر؟', 'Mount Everest', 'جبل إيفرست', { s: 'mountains', alt: ['Everest'], r: 'Mount Everest' }],
  ['e02', 200, 'What is the largest hot desert in the world?', 'ما أكبر صحراء حارة في العالم؟', 'The Sahara', 'الصحراء الكبرى', { s: 'deserts', r: 'Sahara' }],
  ['e03', 200, 'What is the largest ocean?', 'ما أكبر محيط؟', 'The Pacific Ocean', 'المحيط الهادئ', { s: 'water', alt: ['Pacific'], r: 'Pacific Ocean' }],
  ['e04', 200, 'Which is the coldest continent?', 'ما أبرد قارة؟', 'Antarctica', 'أنتاركتيكا (القارة القطبية الجنوبية)', { s: 'deserts', r: 'Antarctica' }],
  ['e05', 200, 'Which is the largest country in the world by area?', 'ما أكبر دولة في العالم مساحةً؟', 'Russia', 'روسيا', { s: 'mountains', r: 'Russia' }],
  ['e06', 200, 'In which mountain range is Mount Everest?', 'في أي سلسلة جبلية يقع جبل إيفرست؟', 'The Himalayas', 'الهيمالايا', { s: 'mountains', r: 'Himalayas' }],
  ['h01', 400, 'What is the name of the deepest known part of the ocean?', 'ما اسم أعمق نقطة معروفة في المحيطات؟', 'The Challenger Deep (Mariana Trench)', 'تشالنجر ديب (خندق ماريانا)', { s: 'water', alt: ['Mariana Trench'], r: 'Challenger Deep' }],
  ['h02', 400, 'What is the largest lake in the world by area?', 'ما أكبر بحيرة في العالم مساحةً؟', 'The Caspian Sea', 'بحر قزوين', { s: 'water', r: 'Caspian Sea' }],
  ['h03', 400, 'Which river flows through Baghdad?', 'أي نهر يمر عبر بغداد؟', 'The Tigris', 'دجلة', { s: 'water', r: 'Tigris' }],
  ['h04', 400, 'In which country is Angel Falls, the world’s highest uninterrupted waterfall?', 'في أي دولة تقع شلالات أنجل، أعلى شلال متصل في العالم؟', 'Venezuela', 'فنزويلا', { s: 'water', r: 'Angel Falls' }],
  ['h05', 400, 'What is the largest island in the world that is not a continent?', 'ما أكبر جزيرة في العالم ليست قارة؟', 'Greenland', 'غرينلاند', { s: 'water', r: 'Greenland' }],
  ['h06', 400, 'Into which sea does the Danube flow?', 'في أي بحر يصب نهر الدانوب؟', 'The Black Sea', 'البحر الأسود', { s: 'water', r: 'Danube' }],
  ['h07', 400, 'Which South American desert is the driest non-polar desert on Earth?', 'أي صحراء في أمريكا الجنوبية هي أجفّ صحراء غير قطبية على الأرض؟', 'The Atacama', 'أتاكاما', { s: 'deserts', r: 'Atacama Desert' }],
  ['h08', 400, 'What is the highest mountain in Africa?', 'ما أعلى جبل في أفريقيا؟', 'Mount Kilimanjaro', 'جبل كليمنجارو', { s: 'mountains', alt: ['Kilimanjaro'], r: 'Mount Kilimanjaro' }],
  ['x01', 600, 'What is the second-highest mountain in the world?', 'ما ثاني أعلى جبل في العالم؟', 'K2', 'كي ٢', { s: 'mountains', r: 'K2' }],
  ['x02', 600, 'Which river carries more water than any other river on Earth?', 'أي نهر يحمل كمية مياه أكبر من أي نهر آخر على الأرض؟', 'The Amazon', 'الأمازون', { s: 'water', r: 'Amazon River' }],
  ['x03', 600, 'The lowest point on dry land lies on the shores of which body of water?', 'أدنى نقطة على اليابسة تقع على شواطئ أي مسطح مائي؟', 'The Dead Sea', 'البحر الميت', { s: 'water', r: 'Dead Sea' }],
  ['x04', 600, 'What is the deepest lake in the world?', 'ما أعمق بحيرة في العالم؟', 'Lake Baikal', 'بحيرة بايكال', { s: 'water', r: 'Lake Baikal' }],
  ['x05', 600, 'What is the longest continental mountain range in the world?', 'ما أطول سلسلة جبال قارية في العالم؟', 'The Andes', 'جبال الأنديز', { s: 'mountains', r: 'Andes' }],
  ['x06', 600, 'What is the highest peak in Saudi Arabia?', 'ما أعلى قمة في السعودية؟', 'Jabal Sawda', 'جبل السودة', { s: 'mountains', x: 1, alt: ['Jabal al-Sawda'], r: 'Jabal Sawda' }],
]);

KH_BANK.cat('mideast', { g: 'arab', e: '🕌', en: 'Saudi Arabia & the Middle East', ar: 'السعودية والشرق الأوسط',
  subs: { saudi: ['Saudi Arabia', 'السعودية'], gulf: ['Gulf & region', 'الخليج والمنطقة'] } }, [
  ['e01', 200, 'What is the capital of Saudi Arabia?', 'ما عاصمة المملكة العربية السعودية؟', 'Riyadh', 'الرياض', { s: 'saudi', r: 'Riyadh' }],
  ['e02', 200, 'Which city is the holiest in Islam, home to the Kaaba?', 'أي مدينة هي الأقدس في الإسلام وفيها الكعبة؟', 'Mecca', 'مكة المكرمة', { s: 'saudi', alt: ['Makkah'], r: 'Mecca' }],
  ['e03', 200, 'Which sea lies between Saudi Arabia and Africa?', 'أي بحر يفصل بين السعودية وأفريقيا؟', 'The Red Sea', 'البحر الأحمر', { s: 'saudi', r: 'Red Sea' }],
  ['e04', 200, 'What is Saudi Arabia’s currency?', 'ما عملة المملكة العربية السعودية؟', 'The Saudi riyal', 'الريال السعودي', { s: 'saudi', alt: ['Riyal'], r: 'Saudi riyal' }],
  ['e05', 200, 'In which city is the Prophet’s Mosque (Al-Masjid an-Nabawi)?', 'في أي مدينة يقع المسجد النبوي؟', 'Medina', 'المدينة المنورة', { s: 'saudi', alt: ['Madinah'], r: 'Al-Masjid an-Nabawi' }],
  ['e06', 200, 'Doha is the capital of which country?', 'الدوحة عاصمة أي دولة؟', 'Qatar', 'قطر', { s: 'gulf', r: 'Doha' }],
  ['h01', 400, 'Which Saudi city is nicknamed "the Bride of the Red Sea"?', 'أي مدينة سعودية تُلقّب بـ«عروس البحر الأحمر»؟', 'Jeddah', 'جدة', { s: 'saudi', r: 'Jeddah' }],
  ['h02', 400, 'Which island kingdom is linked to Saudi Arabia by the King Fahd Causeway?', 'أي مملكة جزرية ترتبط بالسعودية عبر جسر الملك فهد؟', 'Bahrain', 'البحرين', { s: 'gulf', r: 'King Fahd Causeway' }],
  ['h03', 400, 'What is the capital of Oman?', 'ما عاصمة سلطنة عُمان؟', 'Muscat', 'مسقط', { s: 'gulf', r: 'Muscat' }],
  ['h04', 400, 'NEOM is a planned development in which Saudi province?', 'مشروع «نيوم» يقع في أي منطقة سعودية؟', 'Tabuk Province', 'منطقة تبوك', { s: 'saudi', alt: ['Tabuk'], r: 'Neom' }],
  ['h05', 400, 'Elephant Rock (Jabal AlFil) is a famous landmark near which Saudi city?', 'صخرة الفيل (جبل الفيل) معلم شهير قرب أي مدينة سعودية؟', 'AlUla', 'العُلا', { s: 'saudi', r: 'AlUla' }],
  ['h06', 400, 'Which Saudi mountain city is the traditional summer retreat famous for its roses?', 'أي مدينة جبلية سعودية هي المصيف التقليدي المشهور بالورد؟', 'Taif', 'الطائف', { s: 'saudi', r: 'Taif' }],
  ['h07', 400, 'Which narrow strait links the Persian Gulf to the Gulf of Oman?', 'أي مضيق يربط الخليج العربي بخليج عُمان؟', 'The Strait of Hormuz', 'مضيق هرمز', { s: 'gulf', r: 'Strait of Hormuz' }],
  ['x01', 600, 'Which Saudi oasis in the Eastern Province is one of the largest in the world?', 'أي واحة سعودية في المنطقة الشرقية من أكبر الواحات في العالم؟', 'Al-Ahsa', 'الأحساء', { s: 'saudi', r: 'Al-Ahsa Oasis' }],
  ['x02', 600, 'Which historic town on Riyadh’s outskirts was the first capital of the Saudi state?', 'أي بلدة تاريخية في أطراف الرياض كانت أول عاصمة للدولة السعودية؟', 'Diriyah', 'الدرعية', { s: 'saudi', r: 'Diriyah' }],
  ['x03', 600, 'On which date is Saudi National Day celebrated?', 'في أي تاريخ يُحتفل باليوم الوطني السعودي؟', '23 September', '٢٣ سبتمبر', { s: 'saudi', r: 'Saudi National Day' }],
  ['x04', 600, 'The Hejaz Railway, opened in 1908, ran from Damascus to which city?', 'سكة حديد الحجاز التي افتُتحت عام ١٩٠٨ امتدت من دمشق إلى أي مدينة؟', 'Medina', 'المدينة المنورة', { s: 'saudi', x: 1, ok: 1, r: 'Hejaz railway' }],
  ['x05', 600, 'Which Saudi island group in the southern Red Sea, off Jazan, is a protected marine area?', 'أي أرخبيل سعودي في جنوب البحر الأحمر قبالة جازان منطقة بحرية محمية؟', 'The Farasan Islands', 'جزر فرسان', { s: 'saudi', x: 1, r: 'Farasan Islands' }],
  ['x06', 600, 'Which region of Oman, around Salalah, is famous for frankincense?', 'أي منطقة في عُمان، حول صلالة، تشتهر باللبان؟', 'Dhofar', 'ظفار', { s: 'gulf', x: 1, r: 'Dhofar Governorate' }],
]);

KH_BANK.cat('north-america', { g: 'geo', e: '🍁', en: 'Canada & the USA', ar: 'كندا والولايات المتحدة',
  subs: { canada: ['Canada', 'كندا'], usa: ['United States', 'الولايات المتحدة'] } }, [
  ['e01', 200, 'How many provinces does Canada have?', 'كم مقاطعة في كندا؟', 'Ten', 'عشر', { s: 'canada', alt: ['10'], r: 'Provinces and territories of Canada' }],
  ['e02', 200, 'Which is the largest US state by area?', 'ما أكبر ولاية أمريكية مساحةً؟', 'Alaska', 'ألاسكا', { f: 'alaska', s: 'usa', r: 'Alaska' }],
  ['e03', 200, 'Which famous waterfalls sit on the border between Canada and the USA?', 'أي شلالات شهيرة تقع على الحدود بين كندا والولايات المتحدة؟', 'Niagara Falls', 'شلالات نياغرا', { s: 'canada', r: 'Niagara Falls' }],
  ['e04', 200, 'Which US city is nicknamed "the Big Apple"?', 'أي مدينة أمريكية تُلقّب بـ«التفاحة الكبيرة»؟', 'New York City', 'نيويورك', { s: 'usa', r: 'Big Apple' }],
  ['e05', 200, 'What is the capital of the United States?', 'ما عاصمة الولايات المتحدة؟', 'Washington, D.C.', 'واشنطن العاصمة', { s: 'usa', r: 'Washington, D.C.' }],
  ['e06', 200, 'Which Canadian province is mainly French-speaking?', 'أي مقاطعة كندية يتحدث أغلب سكانها الفرنسية؟', 'Quebec', 'كيبك', { s: 'canada', r: 'Quebec' }],
  ['h01', 400, 'What is Canada’s largest city?', 'ما أكبر مدينة في كندا؟', 'Toronto', 'تورونتو', { s: 'canada', r: 'Toronto' }],
  ['h02', 400, 'Which US state is made up entirely of islands?', 'أي ولاية أمريكية تتكون بالكامل من جزر؟', 'Hawaii', 'هاواي', { s: 'usa', r: 'Hawaii' }],
  ['h03', 400, 'Which Canadian province are Mississauga and Toronto in?', 'في أي مقاطعة كندية تقع ميسيساغا وتورونتو؟', 'Ontario', 'أونتاريو', { s: 'canada', r: 'Ontario' }],
  ['h04', 400, 'Which of the Great Lakes lies entirely within the United States?', 'أي من البحيرات العظمى تقع بالكامل داخل الولايات المتحدة؟', 'Lake Michigan', 'بحيرة ميشيغان', { s: 'usa', r: 'Lake Michigan' }],
  ['h05', 400, 'Which territory became Canada’s newest in 1999?', 'أي إقليم أصبح أحدث أقاليم كندا عام ١٩٩٩؟', 'Nunavut', 'نونافوت', { s: 'canada', r: 'Nunavut' }],
  ['h06', 400, 'Which river carved the Grand Canyon?', 'أي نهر نحت الأخدود العظيم (غراند كانيون)؟', 'The Colorado River', 'نهر كولورادو', { s: 'usa', r: 'Grand Canyon' }],
  ['h07', 400, 'Which is the smallest US state by area?', 'ما أصغر ولاية أمريكية مساحةً؟', 'Rhode Island', 'رود آيلاند', { s: 'usa', r: 'Rhode Island' }],
  ['h08', 400, 'Which is the largest of the Great Lakes by surface area?', 'ما أكبر البحيرات العظمى من حيث المساحة؟', 'Lake Superior', 'بحيرة سوبيريور', { s: 'canada', r: 'Lake Superior' }],
  ['x01', 600, 'Which was the last province to join Canada, in 1949?', 'ما آخر مقاطعة انضمت إلى كندا عام ١٩٤٩؟', 'Newfoundland (and Labrador)', 'نيوفاوندلاند (ولابرادور)', { s: 'canada', r: 'Newfoundland and Labrador' }],
  ['x02', 600, 'What is the capital of Nunavut?', 'ما عاصمة إقليم نونافوت؟', 'Iqaluit', 'إيكالويت', { s: 'canada', x: 1, r: 'Iqaluit' }],
  ['x03', 600, 'Which is the only US state capital without a McDonald’s?', 'ما عاصمة الولاية الأمريكية الوحيدة التي لا يوجد فيها مطعم ماكدونالدز؟', 'Montpelier, Vermont', 'مونبلييه، فيرمونت', { v: 'web:2026-10-10', s: 'usa', x: 1, c: 1, asOf: '2026-06', r: 'Montpelier, Vermont' }],
  ['x04', 600, 'Ottawa was originally known by which name?', 'بأي اسم كانت تُعرف أوتاوا في الأصل؟', 'Bytown', 'بايتاون', { s: 'canada', x: 1, f: 'cap-canada', r: 'Bytown' }],
  ['x05', 600, 'What is the highest mountain in Canada?', 'ما أعلى جبل في كندا؟', 'Mount Logan', 'جبل لوغان', { s: 'canada', r: 'Mount Logan' }],
  ['x06', 600, 'Which US state was an independent republic from 1836 to 1845?', 'أي ولاية أمريكية كانت جمهورية مستقلة من ١٨٣٦ إلى ١٨٤٥؟', 'Texas', 'تكساس', { s: 'usa', r: 'Republic of Texas' }],
]);

KH_BANK.cat('odd-geo', { g: 'geo', niche: 1, e: '🏝️', en: 'Islands, Borders & Small Countries', ar: 'جزر وحدود ودول صغيرة',
  subs: { islands: ['Islands', 'جزر'], borders: ['Borders', 'حدود'], small: ['Small countries', 'دول صغيرة'] } }, [
  ['e01', 200, 'Which country of thousands of islands includes Bali and Java?', 'أي دولة تتكون من آلاف الجزر منها بالي وجاوة؟', 'Indonesia', 'إندونيسيا', { s: 'islands', r: 'Indonesia' }],
  ['e02', 200, 'What is the smallest country in the world?', 'ما أصغر دولة في العالم؟', 'Vatican City', 'الفاتيكان', { s: 'small', r: 'Vatican City' }],
  ['e03', 200, 'Which island country lies just south of India?', 'أي دولة جزرية تقع جنوب الهند مباشرة؟', 'Sri Lanka', 'سريلانكا', { s: 'islands', r: 'Sri Lanka' }],
  ['e04', 200, 'Which European country is shaped like a boot?', 'أي دولة أوروبية شكلها مثل الحذاء الطويل؟', 'Italy', 'إيطاليا', { s: 'borders', r: 'Italy' }],
  ['e05', 200, 'Which country spans both Europe and Asia, with Istanbul on both sides?', 'أي دولة تمتد في أوروبا وآسيا وتقع إسطنبول على جانبيها؟', 'Turkey', 'تركيا', { s: 'borders', alt: ['Türkiye'], r: 'Istanbul' }],
  ['e06', 200, 'The island of Madagascar lies off the coast of which continent?', 'جزيرة مدغشقر تقع قبالة سواحل أي قارة؟', 'Africa', 'أفريقيا', { s: 'islands', r: 'Madagascar' }],
  ['h01', 400, 'Which two countries share the world’s longest international border?', 'أي دولتين تتشاركان أطول حدود دولية في العالم؟', 'Canada and the United States', 'كندا والولايات المتحدة', { s: 'borders', r: 'Canada–United States border' }],
  ['h02', 400, 'Which country is completely surrounded by South Africa?', 'أي دولة محاطة بالكامل بجنوب أفريقيا؟', 'Lesotho', 'ليسوتو', { s: 'small', r: 'Lesotho' }],
  ['h03', 400, 'Which tiny country sits in the Pyrenees between France and Spain?', 'أي دولة صغيرة تقع في جبال البرانس بين فرنسا وإسبانيا؟', 'Andorra', 'أندورا', { s: 'small', r: 'Andorra' }],
  ['h04', 400, 'Which Caribbean island is shared by Haiti and the Dominican Republic?', 'أي جزيرة كاريبية تتقاسمها هايتي وجمهورية الدومينيكان؟', 'Hispaniola', 'هيسبانيولا', { s: 'islands', r: 'Hispaniola' }],
  ['h05', 400, 'Which small republic is completely surrounded by Italy, apart from the Vatican?', 'أي جمهورية صغيرة تحيط بها إيطاليا بالكامل، غير الفاتيكان؟', 'San Marino', 'سان مارينو', { s: 'small', r: 'San Marino' }],
  ['h06', 400, 'Kaliningrad is an exclave of which country?', 'كالينينغراد جيب تابع لأي دولة؟', 'Russia', 'روسيا', { s: 'borders', r: 'Kaliningrad Oblast' }],
  ['h07', 400, 'Which large island is divided between Indonesia, Malaysia and Brunei?', 'أي جزيرة كبيرة تتقاسمها إندونيسيا وماليزيا وبروناي؟', 'Borneo', 'بورنيو', { s: 'islands', r: 'Borneo' }],
  ['x01', 600, 'Which are the world’s only two "doubly landlocked" countries?', 'ما الدولتان الوحيدتان «المحاطتان باليابسة مرتين» في العالم؟', 'Uzbekistan and Liechtenstein', 'أوزبكستان وليختنشتاين', { f: 'liecht', s: 'borders', x: 1, r: 'Landlocked country' }],
  ['x02', 600, 'Counting its overseas territories, which country has the most time zones (12)?', 'باحتساب أقاليمها ما وراء البحار، أي دولة لديها أكبر عدد من المناطق الزمنية (١٢)؟', 'France', 'فرنسا', { s: 'borders', x: 1, r: 'Time in France' }],
  ['x03', 600, 'By most counts, which country has more islands than any other (over 260,000)?', 'حسب معظم الإحصاءات، أي دولة لديها أكبر عدد من الجزر (أكثر من ٢٦٠ ألف)؟', 'Sweden', 'السويد', { s: 'islands', x: 1, n: 'Counts vary depending on how small an island can be.', nAr: 'الأعداد تختلف حسب الحجم الذي يُعتبر جزيرة.', r: 'List of islands of Sweden' }],
  ['x04', 600, 'Which town is famously split between Belgium and the Netherlands in a patchwork of enclaves?', 'أي بلدة مقسّمة بشكل شهير بين بلجيكا وهولندا في خليط من الجيوب؟', 'Baarle (Baarle-Hertog / Baarle-Nassau)', 'بارله (بارله-هيرتوغ / بارله-ناساو)', { s: 'borders', x: 1, alt: ['Baarle-Hertog', 'Baarle-Nassau'], r: 'Baarle-Hertog' }],
  ['x05', 600, 'Pheasant Island in the Bidasoa river changes hands every six months between which two countries?', 'جزيرة الدراج في نهر بيداسوا تنتقل إدارتها كل ستة أشهر بين أي دولتين؟', 'France and Spain', 'فرنسا وإسبانيا', { s: 'islands', x: 1, r: 'Pheasant Island' }],
  ['x06', 600, 'What is the largest country lying entirely within Europe?', 'ما أكبر دولة تقع بالكامل داخل أوروبا؟', 'Ukraine', 'أوكرانيا', { s: 'borders', r: 'Ukraine' }],
]);

/* ---- bank/40-history.js ---- */
/* History, civilisations and mythology. Religious topics are kept to established historical facts. */
KH_BANK.cat('ancient', { g: 'history', e: '🏺', en: 'Ancient Civilisations', ar: 'حضارات قديمة',
  subs: { egypt: ['Egypt', 'مصر القديمة'], classical: ['Greece & Rome', 'اليونان وروما'], other: ['Mesopotamia & the Americas', 'بلاد الرافدين والأمريكتان'] } }, [
  ['e01', 200, 'What were the kings of ancient Egypt called?', 'ماذا كان يُسمّى ملوك مصر القديمة؟', 'Pharaohs', 'الفراعنة', { s: 'egypt', r: 'Pharaoh' }],
  ['e02', 200, 'Which Roman city was buried by the eruption of Mount Vesuvius in 79 AD?', 'أي مدينة رومانية دُفنت تحت ثوران بركان فيزوف عام ٧٩ م؟', 'Pompeii', 'بومبي', { s: 'classical', r: 'Pompeii' }],
  ['e03', 200, 'Which language did the ancient Romans speak?', 'بأي لغة تحدّث الرومان القدماء؟', 'Latin', 'اللاتينية', { s: 'classical', r: 'Latin' }],
  ['e04', 200, 'Which boy pharaoh’s almost untouched tomb was found in 1922?', 'قبر أي فرعون صبي اكتُشف شبه سليم عام ١٩٢٢؟', 'Tutankhamun', 'توت عنخ آمون', { s: 'egypt', f: 'tut', r: 'Tutankhamun' }],
  ['e05', 200, 'Which South American empire built Machu Picchu?', 'أي إمبراطورية في أمريكا الجنوبية بنت ماتشو بيتشو؟', 'The Inca Empire', 'إمبراطورية الإنكا', { s: 'other', alt: ['Incas'], r: 'Inca Empire' }],
  ['e06', 200, 'The pyramids of Giza stand near which river?', 'تقع أهرامات الجيزة قرب أي نهر؟', 'The Nile', 'النيل', { s: 'egypt', r: 'Giza pyramid complex' }],
  ['h01', 400, 'What was the wedge-shaped writing pressed into clay in Mesopotamia called?', 'ما اسم الكتابة المسمارية الشكل التي كانت تُضغط في الطين في بلاد الرافدين؟', 'Cuneiform', 'الكتابة المسمارية', { s: 'other', r: 'Cuneiform' }],
  ['h02', 400, 'Which stone, found in 1799, helped scholars decode Egyptian hieroglyphs?', 'أي حجر اكتُشف عام ١٧٩٩ ساعد العلماء على فك رموز الهيروغليفية؟', 'The Rosetta Stone', 'حجر رشيد', { s: 'egypt', r: 'Rosetta Stone' }],
  ['h03', 400, 'Who was the first Roman emperor?', 'من أول إمبراطور روماني؟', 'Augustus', 'أغسطس', { s: 'classical', alt: ['Octavian'], r: 'Augustus' }],
  ['h04', 400, 'According to legend, the Greeks captured which city using a wooden horse?', 'حسب الأسطورة، أي مدينة استولى عليها الإغريق بحصان خشبي؟', 'Troy', 'طروادة', { s: 'classical', r: 'Trojan Horse' }],
  ['h05', 400, 'Which Carthaginian general crossed the Alps with war elephants?', 'أي قائد قرطاجي عبر جبال الألب بالفيلة؟', 'Hannibal', 'حنبعل', { s: 'classical', r: 'Hannibal' }],
  ['h06', 400, 'Which Babylonian king issued one of the earliest written law codes?', 'أي ملك بابلي أصدر واحدة من أقدم الشرائع المكتوبة؟', 'Hammurabi', 'حمورابي', { s: 'other', r: 'Code of Hammurabi' }],
  ['h07', 400, 'The Sumerians lived in the land between which two rivers?', 'عاش السومريون في الأرض بين أي نهرين؟', 'The Tigris and the Euphrates', 'دجلة والفرات', { s: 'other', r: 'Mesopotamia' }],
  ['x01', 600, 'Which pharaoh tried to replace Egypt’s gods with worship of the sun disc Aten?', 'أي فرعون حاول استبدال آلهة مصر بعبادة قرص الشمس «آتون»؟', 'Akhenaten', 'إخناتون', { s: 'egypt', r: 'Akhenaten' }],
  ['x02', 600, 'Which city was the capital of the Inca Empire?', 'أي مدينة كانت عاصمة إمبراطورية الإنكا؟', 'Cusco', 'كوسكو', { s: 'other', alt: ['Cuzco'], r: 'Cusco' }],
  ['x03', 600, 'Which Mesopotamian poem is one of the oldest surviving works of literature?', 'أي ملحمة من بلاد الرافدين من أقدم الأعمال الأدبية الباقية؟', 'The Epic of Gilgamesh', 'ملحمة جلجامش', { s: 'other', r: 'Epic of Gilgamesh' }],
  ['x04', 600, 'What was the island capital of the Aztec Empire, where Mexico City now stands?', 'ما العاصمة الجزرية لإمبراطورية الأزتك التي تقوم مكانها اليوم مدينة مكسيكو؟', 'Tenochtitlan', 'تينوختيتلان', { s: 'other', x: 1, r: 'Tenochtitlan' }],
  ['x05', 600, 'Which woman ruled Egypt as pharaoh in the 15th century BC?', 'أي امرأة حكمت مصر فرعوناً في القرن الخامس عشر قبل الميلاد؟', 'Hatshepsut', 'حتشبسوت', { s: 'egypt', r: 'Hatshepsut' }],
  ['x06', 600, 'Which British archaeologist found Tutankhamun’s tomb?', 'أي عالم آثار بريطاني اكتشف مقبرة توت عنخ آمون؟', 'Howard Carter', 'هوارد كارتر', { s: 'egypt', f: 'tut', r: 'Howard Carter' }],
]);

KH_BANK.cat('islamic-history', { g: 'arab', e: '🕌', en: 'Islamic & Arab History', ar: 'التاريخ الإسلامي والعربي',
  subs: { early: ['Early Islam', 'صدر الإسلام'], caliphates: ['Caliphates & dynasties', 'خلافات ودول'], scholars: ['Scholars & travellers', 'علماء ورحّالة'], saudi: ['Saudi history', 'تاريخ السعودية'] } }, [
  ['e01', 200, 'To which city did the Prophet Muhammad ﷺ migrate from Mecca?', 'إلى أي مدينة هاجر النبي محمد ﷺ من مكة؟', 'Medina (Yathrib)', 'المدينة المنورة (يثرب)', { s: 'early', alt: ['Medina', 'Yathrib'], r: 'Hijrah' }],
  ['e02', 200, 'Who was the first caliph after the Prophet Muhammad ﷺ?', 'من أول خليفة بعد النبي محمد ﷺ؟', 'Abu Bakr al-Siddiq', 'أبو بكر الصديق', { s: 'early', alt: ['Abu Bakr'], r: 'Abu Bakr' }],
  ['e03', 200, 'Who founded the modern Kingdom of Saudi Arabia?', 'من مؤسس المملكة العربية السعودية الحديثة؟', 'King Abdulaziz (Ibn Saud)', 'الملك عبدالعزيز آل سعود', { s: 'saudi', alt: ['Ibn Saud', 'Abdulaziz'], r: 'Ibn Saud' }],
  ['e04', 200, 'The Islamic (Hijri) calendar starts from which event?', 'من أي حدث يبدأ التقويم الهجري؟', 'The Hijra (the Prophet’s migration to Medina)', 'الهجرة النبوية إلى المدينة', { s: 'early', r: 'Islamic calendar' }],
  ['e05', 200, 'Which empire ruled from Constantinople (Istanbul) after 1453?', 'أي إمبراطورية حكمت من القسطنطينية (إسطنبول) بعد ١٤٥٣؟', 'The Ottoman Empire', 'الدولة العثمانية', { s: 'caliphates', r: 'Ottoman Empire' }],
  ['e06', 200, 'What was the name of the ancient trade route linking China with the Middle East and Europe?', 'ما اسم طريق التجارة القديم الذي ربط الصين بالشرق الأوسط وأوروبا؟', 'The Silk Road', 'طريق الحرير', { s: 'caliphates', r: 'Silk Road' }],
  ['h01', 400, 'In which year CE did the Hijra take place?', 'في أي عام ميلادي كانت الهجرة النبوية؟', '622', '٦٢٢م', { s: 'early', r: 'Hijrah' }],
  ['h02', 400, 'Which city did the Abbasids found as their capital in 762?', 'أي مدينة أسسها العباسيون عاصمةً لهم عام ٧٦٢؟', 'Baghdad', 'بغداد', { s: 'caliphates', r: 'Round city of Baghdad' }],
  ['h03', 400, 'Which Muslim leader retook Jerusalem from the Crusaders in 1187?', 'أي قائد مسلم استعاد القدس من الصليبيين عام ١١٨٧؟', 'Saladin (Salah ad-Din)', 'صلاح الدين الأيوبي', { s: 'caliphates', alt: ['Salah ad-Din'], r: 'Saladin' }],
  ['h04', 400, 'In which year was the Kingdom of Saudi Arabia proclaimed under that name?', 'في أي عام أُعلن قيام المملكة العربية السعودية بهذا الاسم؟', '1932', '١٩٣٢', { s: 'saudi', r: 'Proclamation of the Kingdom of Saudi Arabia' }],
  ['h05', 400, 'Which Ottoman sultan conquered Constantinople in 1453?', 'أي سلطان عثماني فتح القسطنطينية عام ١٤٥٣؟', 'Mehmed II (the Conqueror)', 'محمد الفاتح', { s: 'caliphates', alt: ['Mehmed the Conqueror'], r: 'Mehmed II' }],
  ['h06', 400, 'Which city was the capital of the Umayyad Caliphate?', 'أي مدينة كانت عاصمة الخلافة الأموية؟', 'Damascus', 'دمشق', { s: 'caliphates', r: 'Umayyad Caliphate' }],
  ['h07', 400, 'Which Andalusian city was the capital of the Umayyad emirate and caliphate in Spain?', 'أي مدينة أندلسية كانت عاصمة الإمارة والخلافة الأموية في الأندلس؟', 'Córdoba', 'قرطبة', { s: 'caliphates', alt: ['Cordoba'], r: 'Caliphate of Córdoba' }],
  ['x01', 600, 'Which scholar wrote "The Canon of Medicine", used in Europe for centuries?', 'أي عالم ألّف كتاب «القانون في الطب» الذي اعتمدته أوروبا لقرون؟', 'Ibn Sina (Avicenna)', 'ابن سينا', { s: 'scholars', alt: ['Avicenna'], r: 'The Canon of Medicine' }],
  ['x02', 600, 'Which Baghdad mathematician gave his name to the word "algorithm"?', 'أي عالم رياضيات من بغداد اشتُقت من اسمه كلمة «خوارزمية»؟', 'Al-Khwarizmi', 'الخوارزمي', { s: 'scholars', r: 'Muhammad ibn Musa al-Khwarizmi' }],
  ['x03', 600, 'Which 14th-century traveller from Tangier journeyed across Africa and Asia for nearly 30 years?', 'أي رحّالة من طنجة في القرن الرابع عشر جاب أفريقيا وآسيا قرابة ٣٠ عاماً؟', 'Ibn Battuta', 'ابن بطوطة', { s: 'scholars', r: 'Ibn Battuta' }],
  ['x04', 600, 'Saudi Founding Day marks the founding of the First Saudi State in which year?', 'يوم التأسيس السعودي يحيي ذكرى قيام الدولة السعودية الأولى في أي عام؟', '1727', '١٧٢٧م', { s: 'saudi', x: 1, r: 'Founding Day (Saudi Arabia)' }],
  ['x05', 600, 'At which 1260 battle did the Mamluks halt the Mongol advance?', 'في أي معركة عام ١٢٦٠ أوقف المماليك زحف المغول؟', 'Ain Jalut', 'عين جالوت', { s: 'caliphates', r: 'Battle of Ain Jalut' }],
  ['x06', 600, 'Which historian wrote the Muqaddimah, an early work on the study of societies?', 'أي مؤرخ كتب «المقدمة»، من أوائل الأعمال في دراسة المجتمعات؟', 'Ibn Khaldun', 'ابن خلدون', { s: 'scholars', r: 'Muqaddimah' }],
]);

KH_BANK.cat('modern-history', { g: 'history', e: '🎖️', en: 'Wars & the 20th Century', ar: 'حروب والقرن العشرين',
  subs: { ww: ['World Wars', 'الحربان العالميتان'], cold: ['Cold War & after', 'الحرب الباردة وما بعدها'], other: ['Other wars & events', 'حروب وأحداث أخرى'] } }, [
  ['e01', 200, 'In which year did World War II end?', 'في أي عام انتهت الحرب العالمية الثانية؟', '1945', '١٩٤٥', { s: 'ww', r: 'World War II' }],
  ['e02', 200, 'Which wall, dividing a German city, fell in 1989?', 'أي جدار كان يقسم مدينة ألمانية سقط عام ١٩٨٩؟', 'The Berlin Wall', 'جدار برلين', { s: 'cold', r: 'Berlin Wall' }],
  ['e03', 200, 'In which year did World War I begin?', 'في أي عام بدأت الحرب العالمية الأولى؟', '1914', '١٩١٤', { s: 'ww', r: 'World War I' }],
  ['e04', 200, 'Who was Britain’s prime minister for most of World War II?', 'من كان رئيس وزراء بريطانيا في معظم الحرب العالمية الثانية؟', 'Winston Churchill', 'ونستون تشرشل', { s: 'ww', alt: ['Churchill'], r: 'Winston Churchill' }],
  ['e05', 200, 'Who led India’s non-violent campaign for independence?', 'من قاد حملة الهند السلمية من أجل الاستقلال؟', 'Mahatma Gandhi', 'المهاتما غاندي', { s: 'other', alt: ['Gandhi'], r: 'Mahatma Gandhi' }],
  ['e06', 200, 'Which country dropped atomic bombs on Hiroshima and Nagasaki?', 'أي دولة ألقت القنبلتين الذريتين على هيروشيما وناغازاكي؟', 'The United States', 'الولايات المتحدة', { s: 'ww', alt: ['USA'], r: 'Atomic bombings of Hiroshima and Nagasaki' }],
  ['h01', 400, 'Whose assassination in Sarajevo in 1914 triggered World War I?', 'اغتيال من في سراييفو عام ١٩١٤ أشعل الحرب العالمية الأولى؟', 'Archduke Franz Ferdinand', 'الأرشيدوق فرانز فرديناند', { s: 'ww', alt: ['Franz Ferdinand'], r: 'Assassination of Archduke Franz Ferdinand' }],
  ['h02', 400, 'What was the codename for the Allied invasion of Normandy in 1944?', 'ما الاسم الرمزي لغزو الحلفاء لنورماندي عام ١٩٤٤؟', 'Operation Overlord', 'عملية أوفرلورد', { s: 'ww', r: 'Operation Overlord' }],
  ['h03', 400, 'Who became South Africa’s first president elected in a fully democratic vote, in 1994?', 'من أصبح أول رئيس لجنوب أفريقيا منتخب بانتخابات ديمقراطية كاملة عام ١٩٩٤؟', 'Nelson Mandela', 'نيلسون مانديلا', { s: 'other', alt: ['Mandela'], r: 'Nelson Mandela' }],
  ['h04', 400, 'In which year did the Soviet Union break up?', 'في أي عام تفكك الاتحاد السوفيتي؟', '1991', '١٩٩١', { s: 'cold', r: 'Dissolution of the Soviet Union' }],
  ['h05', 400, 'What is the 1962 nuclear standoff between the USA and the USSR called?', 'ما اسم المواجهة النووية بين أمريكا والاتحاد السوفيتي عام ١٩٦٢؟', 'The Cuban Missile Crisis', 'أزمة الصواريخ الكوبية', { s: 'cold', r: 'Cuban Missile Crisis' }],
  ['h06', 400, 'Which 1919 treaty formally ended World War I with Germany?', 'أي معاهدة عام ١٩١٩ أنهت رسمياً الحرب العالمية الأولى مع ألمانيا؟', 'The Treaty of Versailles', 'معاهدة فرساي', { s: 'ww', r: 'Treaty of Versailles' }],
  ['h07', 400, 'Which mathematician led the effort at Bletchley Park to break the German Enigma code?', 'أي عالم رياضيات قاد جهود فك شفرة «إنيغما» الألمانية في بلتشلي بارك؟', 'Alan Turing', 'آلان تورينغ', { s: 'ww', alt: ['Turing'], r: 'Alan Turing' }],
  ['x01', 600, 'Which British liner was sunk by a German U-boat in 1915, angering the USA?', 'أي سفينة ركاب بريطانية أغرقتها غواصة ألمانية عام ١٩١٥ فأثارت غضب أمريكا؟', 'RMS Lusitania', 'لوسيتانيا', { s: 'ww', alt: ['Lusitania'], r: 'Sinking of the RMS Lusitania' }],
  ['x02', 600, 'Who was the last emperor of China?', 'من آخر إمبراطور للصين؟', 'Puyi', 'بويي', { s: 'other', r: 'Puyi' }],
  ['x03', 600, 'Which 1648 treaties ended the Thirty Years’ War?', 'أي معاهدات عام ١٦٤٨ أنهت حرب الثلاثين عاماً؟', 'The Peace of Westphalia', 'صلح وستفاليا', { s: 'other', x: 1, r: 'Peace of Westphalia' }],
  ['x04', 600, 'Which 1896 war is often called the shortest in history, lasting under an hour?', 'أي حرب عام ١٨٩٦ تُعتبر غالباً الأقصر في التاريخ، استمرت أقل من ساعة؟', 'The Anglo-Zanzibar War', 'الحرب الإنجليزية الزنجبارية', { s: 'other', x: 1, r: 'Anglo-Zanzibar War' }],
  ['x05', 600, 'What was the codename for Germany’s 1941 invasion of the Soviet Union?', 'ما الاسم الرمزي لغزو ألمانيا للاتحاد السوفيتي عام ١٩٤١؟', 'Operation Barbarossa', 'عملية بربروسا', { s: 'ww', r: 'Operation Barbarossa' }],
  ['x06', 600, 'Which 1942–43 battle on the Volga is often seen as the turning point of the Eastern Front?', 'أي معركة على نهر الفولغا ١٩٤٢–٤٣ تُعتبر نقطة التحول في الجبهة الشرقية؟', 'The Battle of Stalingrad', 'معركة ستالينغراد', { s: 'ww', r: 'Battle of Stalingrad' }],
]);

KH_BANK.cat('inventions', { g: 'history', e: '💡', en: 'Inventions & Inventors', ar: 'اختراعات ومخترعون',
  subs: { comms: ['Communication', 'الاتصالات'], machines: ['Machines & transport', 'آلات ونقل'], early: ['Early inventors', 'مخترعون أوائل'] } }, [
  ['e01', 200, 'Who received the first US patent for the telephone, in 1876?', 'من حصل على أول براءة اختراع أمريكية للهاتف عام ١٨٧٦؟', 'Alexander Graham Bell', 'ألكسندر غراهام بيل', { s: 'comms', alt: ['Graham Bell'], r: 'Alexander Graham Bell' }],
  ['e02', 200, 'Which American inventor is famous for developing a practical electric light bulb?', 'أي مخترع أمريكي يشتهر بتطوير مصباح كهربائي عملي؟', 'Thomas Edison', 'توماس إديسون', { s: 'machines', alt: ['Edison'], r: 'Thomas Edison' }],
  ['e03', 200, 'Which brothers made the first powered aeroplane flight, in 1903?', 'أي أخوين قاما بأول رحلة طيران بمحرك عام ١٩٠٣؟', 'The Wright brothers', 'الأخوان رايت', { s: 'machines', r: 'Wright brothers' }],
  ['e04', 200, 'In which country was paper invented?', 'في أي بلد اختُرع الورق؟', 'China', 'الصين', { s: 'early', r: 'Paper' }],
  ['e05', 200, 'Which Apple co-founder unveiled the first iPhone in 2007?', 'أي مؤسس مشارك لأبل كشف عن أول آيفون عام ٢٠٠٧؟', 'Steve Jobs', 'ستيف جوبز', { s: 'comms', alt: ['Jobs'], r: 'iPhone (1st generation)' }],
  ['e06', 200, 'Which instrument did Galileo improve to study the Moon and Jupiter?', 'أي أداة طوّرها غاليليو لدراسة القمر والمشتري؟', 'The telescope', 'التلسكوب', { s: 'early', r: 'Galileo Galilei' }],
  ['h01', 400, 'Who invented the World Wide Web in 1989?', 'من اخترع الشبكة العنكبوتية العالمية عام ١٩٨٩؟', 'Tim Berners-Lee', 'تيم بيرنرز-لي', { s: 'comms', r: 'Tim Berners-Lee' }],
  ['h02', 400, 'Who introduced the movable-type printing press to Europe around 1440?', 'من أدخل المطبعة ذات الحروف المتحركة إلى أوروبا نحو ١٤٤٠؟', 'Johannes Gutenberg', 'يوهانس غوتنبرغ', { s: 'comms', alt: ['Gutenberg'], r: 'Johannes Gutenberg' }],
  ['h03', 400, 'Karl Benz built the first practical what, in 1885–86?', 'كارل بنز صنع أول ماذا عملية في ١٨٨٥–٨٦؟', 'Petrol-powered car (automobile)', 'سيارة تعمل بالبنزين', { s: 'machines', alt: ['car', 'automobile'], r: 'Benz Patent-Motorwagen' }],
  ['h04', 400, 'Who discovered penicillin in 1928?', 'من اكتشف البنسلين عام ١٩٢٨؟', 'Alexander Fleming', 'ألكسندر فليمنغ', { s: 'early', alt: ['Fleming'], r: 'Alexander Fleming' }],
  ['h05', 400, 'Which inventor of dynamite left his fortune to fund famous prizes?', 'أي مخترع للديناميت ترك ثروته لتمويل جوائز شهيرة؟', 'Alfred Nobel', 'ألفريد نوبل', { s: 'machines', alt: ['Nobel'], r: 'Alfred Nobel' }],
  ['h06', 400, 'Which Scottish inventor gave the first public demonstration of a working television, in 1926?', 'أي مخترع إسكتلندي قدّم أول عرض علني لتلفزيون يعمل عام ١٩٢٦؟', 'John Logie Baird', 'جون لوجي بيرد', { s: 'comms', r: 'John Logie Baird' }],
  ['h07', 400, 'Which Serbian-American inventor pioneered alternating-current (AC) motors?', 'أي مخترع صربي أمريكي كان رائداً في محركات التيار المتردد؟', 'Nikola Tesla', 'نيكولا تسلا', { s: 'machines', alt: ['Tesla'], r: 'Nikola Tesla' }],
  ['x01', 600, 'Which engineer wrote "The Book of Knowledge of Ingenious Mechanical Devices" in 1206?', 'أي مهندس ألّف «الجامع بين العلم والعمل النافع في صناعة الحيل» عام ١٢٠٦؟', 'Al-Jazari', 'الجزري', { s: 'early', x: 1, r: 'Ismail al-Jazari' }],
  ['x02', 600, 'Which French thinker built the "Pascaline", an early mechanical calculator?', 'أي مفكر فرنسي صنع «الباسكالين»، آلة حاسبة ميكانيكية مبكرة؟', 'Blaise Pascal', 'بليز باسكال', { s: 'early', alt: ['Pascal'], r: 'Pascal\'s calculator' }],
  ['x03', 600, 'Which American inventor of an early typewriter is credited with the QWERTY layout?', 'أي مخترع أمريكي لآلة كاتبة مبكرة يُنسب إليه ترتيب لوحة المفاتيح QWERTY؟', 'Christopher Latham Sholes', 'كريستوفر لاثام شولز', { s: 'comms', x: 1, alt: ['Sholes'], r: 'QWERTY' }],
  ['x04', 600, 'Which Italian sent the first transatlantic radio signal, in 1901?', 'أي إيطالي أرسل أول إشارة راديو عبر الأطلسي عام ١٩٠١؟', 'Guglielmo Marconi', 'غولييلمو ماركوني', { s: 'comms', alt: ['Marconi'], r: 'Guglielmo Marconi' }],
  ['x05', 600, 'Which 9th-century inventor from al-Andalus is said to have attempted flight with wings?', 'أي مخترع أندلسي في القرن التاسع يُقال إنه حاول الطيران بجناحين؟', 'Abbas ibn Firnas', 'عباس بن فرناس', { s: 'early', r: 'Abbas ibn Firnas' }],
  ['x06', 600, 'Which British engineer patented the turbojet engine in 1930?', 'أي مهندس بريطاني سجّل براءة اختراع المحرك النفاث عام ١٩٣٠؟', 'Frank Whittle', 'فرانك ويتل', { s: 'machines', x: 1, r: 'Frank Whittle' }],
]);

KH_BANK.cat('rulers', { g: 'history', niche: 1, e: '👑', en: 'Empires & Rulers', ar: 'إمبراطوريات وحكّام',
  subs: { ancient: ['Ancient rulers', 'حكّام قدماء'], medieval: ['Medieval', 'العصور الوسطى'], modern: ['Kings & queens', 'ملوك وملكات'] } }, [
  ['e01', 200, 'Which queen of Egypt allied with Julius Caesar and Mark Antony?', 'أي ملكة مصرية تحالفت مع يوليوس قيصر ومارك أنطونيو؟', 'Cleopatra', 'كليوباترا', { s: 'ancient', r: 'Cleopatra' }],
  ['e02', 200, 'Which French emperor was defeated at Waterloo in 1815?', 'أي إمبراطور فرنسي هُزم في واترلو عام ١٨١٥؟', 'Napoleon Bonaparte', 'نابليون بونابرت', { s: 'modern', alt: ['Napoleon'], r: 'Battle of Waterloo' }],
  ['e03', 200, 'Who founded the Mongol Empire?', 'من أسس الإمبراطورية المغولية؟', 'Genghis Khan', 'جنكيز خان', { s: 'medieval', r: 'Genghis Khan' }],
  ['e04', 200, 'Which British queen reigned for 70 years, until 2022?', 'أي ملكة بريطانية حكمت ٧٠ عاماً حتى ٢٠٢٢؟', 'Elizabeth II', 'إليزابيث الثانية', { s: 'modern', r: 'Elizabeth II' }],
  ['e05', 200, 'Which young Macedonian king conquered the Persian Empire?', 'أي ملك مقدوني شاب غزا الإمبراطورية الفارسية؟', 'Alexander the Great', 'الإسكندر الأكبر', { s: 'ancient', r: 'Alexander the Great' }],
  ['e06', 200, 'Which Roman leader was assassinated on the Ides of March, 44 BC?', 'أي قائد روماني اغتيل في منتصف مارس عام ٤٤ ق.م؟', 'Julius Caesar', 'يوليوس قيصر', { s: 'ancient', r: 'Assassination of Julius Caesar' }],
  ['h01', 400, 'Which English king married six times?', 'أي ملك إنجليزي تزوج ست مرات؟', 'Henry VIII', 'هنري الثامن', { s: 'modern', r: 'Henry VIII' }],
  ['h02', 400, 'Which Russian tsar founded St Petersburg in 1703?', 'أي قيصر روسي أسس سانت بطرسبرغ عام ١٧٠٣؟', 'Peter the Great', 'بطرس الأكبر', { s: 'modern', r: 'Peter the Great' }],
  ['h03', 400, 'Which Ottoman sultan is known as "the Magnificent" (and "the Lawgiver")?', 'أي سلطان عثماني يُلقّب بـ«العظيم» و«القانوني»؟', 'Suleiman I', 'سليمان القانوني', { s: 'medieval', f: 'suleiman', alt: ['Suleiman the Magnificent'], r: 'Suleiman the Magnificent' }],
  ['h04', 400, 'Who was the first emperor of a unified China, buried with the Terracotta Army?', 'من أول إمبراطور للصين الموحدة، دُفن مع جيش الطين؟', 'Qin Shi Huang', 'تشين شي هوانغ', { f: 'terracotta', s: 'ancient', r: 'Qin Shi Huang' }],
  ['h05', 400, 'Which queen gave her name to an era of British history from 1837 to 1901?', 'أي ملكة سُمّيت باسمها حقبة من التاريخ البريطاني من ١٨٣٧ إلى ١٩٠١؟', 'Queen Victoria', 'الملكة فيكتوريا', { s: 'modern', alt: ['Victoria'], r: 'Queen Victoria' }],
  ['h06', 400, 'Who was the last tsar of Russia?', 'من آخر قياصرة روسيا؟', 'Nicholas II', 'نيقولا الثاني', { s: 'modern', r: 'Nicholas II' }],
  ['h07', 400, 'Which grandson of Genghis Khan founded China’s Yuan dynasty?', 'أي حفيد لجنكيز خان أسس سلالة يوان في الصين؟', 'Kublai Khan', 'قوبلاي خان', { s: 'medieval', r: 'Kublai Khan' }],
  ['x01', 600, 'Which Byzantine emperor built the Hagia Sophia that stands today, completed in 537?', 'أي إمبراطور بيزنطي بنى آيا صوفيا القائمة اليوم، التي اكتملت عام ٥٣٧؟', 'Justinian I', 'جستنيان الأول', { s: 'medieval', r: 'Hagia Sophia' }],
  ['x02', 600, 'Which ruler of the Mali Empire made a famous gold-laden pilgrimage to Mecca in 1324?', 'أي حاكم لإمبراطورية مالي قام بحج شهير محمّل بالذهب إلى مكة عام ١٣٢٤؟', 'Mansa Musa', 'منسا موسى', { s: 'medieval', r: 'Mansa Musa' }],
  ['x03', 600, 'Which Persian king did Alexander the Great defeat at Gaugamela in 331 BC?', 'أي ملك فارسي هزمه الإسكندر الأكبر في غوغميلا عام ٣٣١ ق.م؟', 'Darius III', 'دارا الثالث', { s: 'ancient', x: 1, r: 'Battle of Gaugamela' }],
  ['x04', 600, 'Which king of the Franks was crowned emperor in Rome on Christmas Day, 800?', 'أي ملك للفرنجة تُوّج إمبراطوراً في روما يوم عيد الميلاد عام ٨٠٠؟', 'Charlemagne', 'شارلمان', { s: 'medieval', r: 'Charlemagne' }],
  ['x05', 600, 'Which Aztec emperor met Hernán Cortés in 1519?', 'أي إمبراطور أزتيكي التقى هيرنان كورتيس عام ١٥١٩؟', 'Moctezuma II', 'موكتيزوما الثاني', { s: 'medieval', alt: ['Montezuma'], r: 'Moctezuma II' }],
  ['x06', 600, 'Which Ottoman sultan led the siege of Vienna in 1529?', 'أي سلطان عثماني قاد حصار فيينا عام ١٥٢٩؟', 'Suleiman the Magnificent', 'سليمان القانوني', { s: 'medieval', ok: 1, f: 'suleiman', r: 'Siege of Vienna (1529)' }],
]);

KH_BANK.cat('mythology', { g: 'history', niche: 1, e: '⚡', en: 'Myths & Legends', ar: 'أساطير وخرافات',
  subs: { greek: ['Greek & Roman', 'إغريقية ورومانية'], norse: ['Norse', 'إسكندنافية'], egypt: ['Egyptian & Mesopotamian', 'مصرية ورافدية'], folk: ['Folk tales', 'حكايات شعبية'] } }, [
  ['e01', 200, 'Who is the king of the gods in Greek mythology?', 'من ملك الآلهة في الأساطير الإغريقية؟', 'Zeus', 'زيوس', { s: 'greek', r: 'Zeus' }],
  ['e02', 200, 'Which Greek hero could only be wounded in his heel?', 'أي بطل إغريقي لا يمكن جرحه إلا في كعبه؟', 'Achilles', 'أخيل', { s: 'greek', r: 'Achilles' }],
  ['e03', 200, 'Who is the Norse god of thunder?', 'من إله الرعد في الأساطير الإسكندنافية؟', 'Thor', 'ثور', { s: 'norse', r: 'Thor' }],
  ['e04', 200, 'Which monster had snakes for hair and turned people to stone?', 'أي وحش كان شعره ثعابين ويحوّل الناس إلى حجر؟', 'Medusa', 'ميدوسا', { s: 'greek', r: 'Medusa' }],
  ['e05', 200, 'In the Thousand and One Nights, who tells the stories to the king night after night?', 'في «ألف ليلة وليلة»، من تروي الحكايات للملك ليلة بعد ليلة؟', 'Scheherazade', 'شهرزاد', { s: 'folk', r: 'Scheherazade' }],
  ['e06', 200, 'What is the Roman name for the Greek war god Ares?', 'ما الاسم الروماني لإله الحرب الإغريقي آريس؟', 'Mars', 'مارس', { s: 'greek', r: 'Mars (mythology)' }],
  ['h01', 400, 'Which Egyptian god of the dead had a jackal’s head?', 'أي إله مصري للموتى كان برأس ابن آوى؟', 'Anubis', 'أنوبيس', { s: 'egypt', r: 'Anubis' }],
  ['h02', 400, 'Who was the Greek goddess of wisdom, patron of Athens?', 'من إلهة الحكمة الإغريقية وحامية أثينا؟', 'Athena', 'أثينا', { s: 'greek', r: 'Athena' }],
  ['h03', 400, 'Which winged horse sprang from Medusa’s neck?', 'أي حصان مجنّح خرج من عنق ميدوسا؟', 'Pegasus', 'بيغاسوس', { s: 'greek', r: 'Pegasus' }],
  ['h04', 400, 'What is the name of Odin’s eight-legged horse?', 'ما اسم حصان أودين ذي الأرجل الثماني؟', 'Sleipnir', 'سليبنير', { s: 'norse', r: 'Sleipnir' }],
  ['h05', 400, 'Who was punished by having to roll a boulder up a hill forever?', 'من عوقب بدحرجة صخرة إلى أعلى التل إلى الأبد؟', 'Sisyphus', 'سيزيف', { s: 'greek', r: 'Sisyphus' }],
  ['h06', 400, 'What did Prometheus steal from the gods to give to humans?', 'ماذا سرق بروميثيوس من الآلهة ليعطيه للبشر؟', 'Fire', 'النار', { s: 'greek', r: 'Prometheus' }],
  ['h07', 400, 'What was Jason searching for with the Argonauts?', 'عن ماذا كان يبحث جيسون مع الأرغونوتس؟', 'The Golden Fleece', 'الصوف الذهبي', { s: 'greek', r: 'Golden Fleece' }],
  ['x01', 600, 'What is the giant world tree of Norse mythology called?', 'ما اسم شجرة العالم العملاقة في الأساطير الإسكندنافية؟', 'Yggdrasil', 'إغدراسيل', { s: 'norse', r: 'Yggdrasil' }],
  ['x02', 600, 'Which ibis-headed Egyptian god was the god of writing and wisdom?', 'أي إله مصري برأس طائر أبي منجل كان إله الكتابة والحكمة؟', 'Thoth', 'تحوت', { s: 'egypt', r: 'Thoth' }],
  ['x03', 600, 'Who ferried the souls of the dead across the river Styx?', 'من كان ينقل أرواح الموتى عبر نهر ستيكس؟', 'Charon', 'خارون', { s: 'greek', r: 'Charon' }],
  ['x04', 600, 'Who answered the riddle of the Sphinx at Thebes?', 'من أجاب عن لغز أبي الهول في طيبة؟', 'Oedipus', 'أوديب', { s: 'greek', x: 1, r: 'Oedipus' }],
  ['x05', 600, 'In Norse mythology, who is the goddess who rules over the realm of the dead?', 'في الأساطير الإسكندنافية، من الإلهة التي تحكم عالم الموتى؟', 'Hel', 'هيل', { s: 'norse', x: 1, r: 'Hel (mythology)' }],
  ['x06', 600, 'Which Mesopotamian goddess of love and war was called Inanna by the Sumerians?', 'أي إلهة رافدية للحب والحرب سمّاها السومريون «إنانا»؟', 'Ishtar', 'عشتار', { s: 'egypt', x: 1, r: 'Inanna' }],
]);

/* ---- bank/41-more-world.js ---- */
/* More history from around the world, desserts and sweets, and dangerous animals. */
KH_BANK.cat('world-history', { g: 'history', e: '🌏', en: 'Asia, Africa & the Americas', ar: 'تاريخ آسيا وأفريقيا والأمريكتين',
  subs: { asia: ['Asia', 'آسيا'], africa: ['Africa', 'أفريقيا'], americas: ['The Americas', 'الأمريكتان'] } }, [
  ['e01', 200, 'In which country did samurai warriors serve their lords?', 'في أي بلد كان محاربو الساموراي يخدمون أسيادهم؟', 'Japan', 'اليابان', { s: 'asia', r: 'Samurai' }],
  ['e02', 200, 'Which explorer’s 1492 voyage for Spain reached the Caribbean?', 'رحلة أي مستكشف عام ١٤٩٢ لصالح إسبانيا وصلت إلى الكاريبي؟', 'Christopher Columbus', 'كريستوفر كولومبوس', { s: 'americas', alt: ['Columbus'], r: 'Voyages of Christopher Columbus' }],
  ['e03', 200, 'In which modern country is the Maya city of Chichén Itzá?', 'في أي دولة حديثة تقع مدينة تشيتشن إيتزا التابعة للمايا؟', 'Mexico', 'المكسيك', { s: 'americas', r: 'Chichen Itza' }],
  ['e04', 200, 'What is the huge palace complex of China’s emperors in Beijing called?', 'ما اسم مجمّع القصور الضخم لأباطرة الصين في بكين؟', 'The Forbidden City', 'المدينة المحرّمة', { s: 'asia', r: 'Forbidden City' }],
  ['e05', 200, 'In which country was the Terracotta Army discovered in 1974?', 'في أي دولة اكتُشف جيش الطين (التيراكوتا) عام ١٩٧٤؟', 'China', 'الصين', { s: 'asia', f: 'terracotta', r: 'Terracotta Army' }],
  ['e06', 200, 'Which country became independent from Britain in August 1947, along with Pakistan?', 'أي دولة استقلت عن بريطانيا في أغسطس ١٩٤٧ مع باكستان؟', 'India', 'الهند', { s: 'asia', r: 'Partition of India' }],
  ['h01', 400, 'Under which Chinese dynasty was most of the Great Wall that stands today built?', 'في عهد أي سلالة صينية بُني معظم سور الصين العظيم القائم اليوم؟', 'The Ming dynasty', 'سلالة مينغ', { s: 'asia', r: 'Great Wall of China' }],
  ['h02', 400, 'Which Chinese philosopher’s sayings are collected in the Analects?', 'أقوال أي فيلسوف صيني جُمعت في كتاب «المختارات» (Analects)؟', 'Confucius', 'كونفوشيوس', { s: 'asia', r: 'Analects' }],
  ['h03', 400, 'The Harappan (Indus Valley) civilisation grew up along which river?', 'نشأت حضارة هارابا (وادي السند) على ضفاف أي نهر؟', 'The Indus', 'نهر السند', { s: 'asia', r: 'Indus Valley Civilisation' }],
  ['h04', 400, 'On which island prison did Nelson Mandela spend 18 years?', 'في أي جزيرة سجن قضى نيلسون مانديلا ١٨ عاماً؟', 'Robben Island', 'جزيرة روبن', { s: 'africa', r: 'Robben Island' }],
  ['h05', 400, 'Which city was Japan’s imperial capital for over a thousand years, until 1868?', 'أي مدينة كانت عاصمة اليابان الإمبراطورية لأكثر من ألف عام حتى ١٨٦٨؟', 'Kyoto', 'كيوتو', { s: 'asia', r: 'Kyoto' }],
  ['h06', 400, 'Which Spanish conquistador brought down the Inca Empire?', 'أي غازٍ إسباني أسقط إمبراطورية الإنكا؟', 'Francisco Pizarro', 'فرانسيسكو بيزارو', { s: 'americas', f: 'pizarro', alt: ['Pizarro'], r: 'Francisco Pizarro' }],
  ['h07', 400, 'What were the military rulers of Japan called before 1868?', 'ماذا كان يُسمّى الحكّام العسكريون لليابان قبل ١٨٦٨؟', 'Shoguns', 'الشوغون', { s: 'asia', r: 'Shogun' }],
  ['x01', 600, 'Which Ming admiral led huge "treasure fleets" across the Indian Ocean in the early 1400s?', 'أي أميرال من سلالة مينغ قاد «أساطيل الكنوز» الضخمة عبر المحيط الهندي أوائل القرن الخامس عشر؟', 'Zheng He', 'تشنغ خه', { s: 'asia', r: 'Zheng He' }],
  ['x02', 600, 'At which 1896 battle did Ethiopia defeat Italy and keep its independence?', 'في أي معركة عام ١٨٩٦ هزمت إثيوبيا إيطاليا وحافظت على استقلالها؟', 'The Battle of Adwa', 'معركة عدوة', { s: 'africa', r: 'Battle of Adwa' }],
  ['x03', 600, 'Which Indian emperor turned to Buddhism after the bloody Kalinga war?', 'أي إمبراطور هندي اعتنق البوذية بعد حرب كالينغا الدامية؟', 'Ashoka', 'أشوكا', { s: 'asia', r: 'Ashoka' }],
  ['x04', 600, 'Which Inca emperor did Pizarro capture at Cajamarca in 1532?', 'أي إمبراطور للإنكا أسره بيزارو في كاخاماركا عام ١٥٣٢؟', 'Atahualpa', 'أتاوالبا', { s: 'americas', f: 'pizarro', x: 1, r: 'Atahualpa' }],
  ['x05', 600, 'What was Japan’s policy of closing itself off from most foreign contact (1630s–1850s) called?', 'ما اسم سياسة اليابان في الانغلاق عن معظم الاتصال الخارجي (١٦٣٠–١٨٥٠ تقريباً)؟', 'Sakoku', 'ساكوكو', { s: 'asia', x: 1, r: 'Sakoku' }],
  ['x06', 600, 'Which Zulu king built a powerful kingdom in southern Africa in the 1810s–1820s?', 'أي ملك زولو بنى مملكة قوية في جنوب أفريقيا في العقدين الأولين من القرن التاسع عشر؟', 'Shaka', 'شاكا', { s: 'africa', r: 'Shaka' }],
  ['x07', 600, 'Which medieval African city of stone, with a famous Great Enclosure, gave its name to a modern country?', 'أي مدينة أفريقية حجرية من العصور الوسطى، فيها «السور العظيم»، أعطت اسمها لدولة حديثة؟', 'Great Zimbabwe', 'زيمبابوي العظمى', { s: 'africa', x: 1, r: 'Great Zimbabwe' }],
]);

KH_BANK.cat('north-american-history', { g: 'history', e: '🗽', en: 'US & Canadian History', ar: 'تاريخ أمريكا وكندا',
  subs: { usa: ['United States', 'الولايات المتحدة'], canada: ['Canada', 'كندا'] } }, [
  ['e01', 200, 'Who was the first President of the United States?', 'من أول رئيس للولايات المتحدة؟', 'George Washington', 'جورج واشنطن', { s: 'usa', r: 'George Washington' }],
  ['e02', 200, 'In which year did the United States declare independence?', 'في أي عام أعلنت الولايات المتحدة استقلالها؟', '1776', '١٧٧٦', { s: 'usa', r: 'United States Declaration of Independence' }],
  ['e03', 200, 'Who was US president during the Civil War?', 'من كان رئيس الولايات المتحدة خلال الحرب الأهلية؟', 'Abraham Lincoln', 'أبراهام لينكولن', { s: 'usa', alt: ['Lincoln'], r: 'Abraham Lincoln' }],
  ['e04', 200, 'Which ship carried the Pilgrims to America in 1620?', 'أي سفينة حملت «الحجّاج» إلى أمريكا عام ١٦٢٠؟', 'The Mayflower', 'ماي فلاور', { s: 'usa', r: 'Mayflower' }],
  ['e05', 200, 'On which date is Canada Day celebrated?', 'في أي تاريخ يُحتفل بيوم كندا؟', '1 July', '١ يوليو', { s: 'canada', r: 'Canada Day' }],
  ['e06', 200, 'Which civil rights leader gave the "I Have a Dream" speech in 1963?', 'أي قائد للحقوق المدنية ألقى خطاب «لديّ حلم» عام ١٩٦٣؟', 'Martin Luther King Jr.', 'مارتن لوثر كينغ الابن', { s: 'usa', r: 'I Have a Dream' }],
  ['h01', 400, 'In which year did Canadian Confederation create the Dominion of Canada?', 'في أي عام نشأ دومينيون كندا بالاتحاد الكونفدرالي؟', '1867', '١٨٦٧', { s: 'canada', r: 'Canadian Confederation' }],
  ['h02', 400, 'Who was Canada’s first prime minister?', 'من أول رئيس وزراء لكندا؟', 'Sir John A. Macdonald', 'السير جون إيه. ماكدونالد', { s: 'canada', alt: ['John A. Macdonald'], r: 'John A. Macdonald' }],
  ['h03', 400, 'Which territory did the USA buy from Russia in 1867?', 'أي إقليم اشترته الولايات المتحدة من روسيا عام ١٨٦٧؟', 'Alaska', 'ألاسكا', { s: 'usa', f: 'alaska', r: 'Alaska Purchase' }],
  ['h04', 400, 'Which document begins with the words "We the People"?', 'أي وثيقة تبدأ بعبارة «نحن الشعب»؟', 'The US Constitution', 'دستور الولايات المتحدة', { s: 'usa', r: 'Constitution of the United States' }],
  ['h05', 400, 'Who is the only US president elected more than twice?', 'من الرئيس الأمريكي الوحيد الذي انتُخب أكثر من مرتين؟', 'Franklin D. Roosevelt', 'فرانكلين روزفلت', { s: 'usa', alt: ['FDR'], r: 'Franklin D. Roosevelt' }],
  ['h06', 400, 'What was the 1773 protest in which colonists dumped tea into a harbour called?', 'ما اسم احتجاج عام ١٧٧٣ الذي ألقى فيه المستوطنون الشاي في الميناء؟', 'The Boston Tea Party', 'حفلة شاي بوسطن', { s: 'usa', r: 'Boston Tea Party' }],
  ['h07', 400, 'Which woman’s refusal to give up her bus seat in 1955 sparked the Montgomery bus boycott?', 'رفض أي امرأة التخلي عن مقعدها في الحافلة عام ١٩٥٥ أشعل مقاطعة حافلات مونتغمري؟', 'Rosa Parks', 'روزا باركس', { s: 'usa', r: 'Rosa Parks' }],
  ['x01', 600, 'Which US city did British troops burn in 1814, including the White House?', 'أي مدينة أمريكية أحرقتها القوات البريطانية عام ١٨١٤ ومعها البيت الأبيض؟', 'Washington, D.C.', 'واشنطن العاصمة', { s: 'usa', r: 'Burning of Washington' }],
  ['x02', 600, 'Which city was the first capital of the united Province of Canada, in 1841?', 'أي مدينة كانت أول عاصمة لمقاطعة كندا الموحدة عام ١٨٤١؟', 'Kingston', 'كينغستون', { s: 'canada', x: 1, r: 'Kingston, Ontario' }],
  ['x03', 600, 'Which US president made the Louisiana Purchase from France in 1803?', 'أي رئيس أمريكي عقد صفقة شراء لويزيانا من فرنسا عام ١٨٠٣؟', 'Thomas Jefferson', 'توماس جيفرسون', { s: 'usa', r: 'Louisiana Purchase' }],
  ['x04', 600, 'Which railway, finished in 1885, first linked eastern Canada to British Columbia?', 'أي سكة حديد اكتملت عام ١٨٨٥ ربطت شرق كندا بكولومبيا البريطانية لأول مرة؟', 'The Canadian Pacific Railway', 'سكة حديد المحيط الهادئ الكندية', { s: 'canada', r: 'Canadian Pacific Railway' }],
  ['x05', 600, 'Who was Canada’s first female prime minister, in 1993?', 'من أول امرأة تتولى رئاسة وزراء كندا عام ١٩٩٣؟', 'Kim Campbell', 'كيم كامبل', { s: 'canada', x: 1, r: 'Kim Campbell' }],
  ['x06', 600, 'Which 1759 battle outside Quebec City decided British control of New France?', 'أي معركة عام ١٧٥٩ خارج مدينة كيبك حسمت سيطرة بريطانيا على فرنسا الجديدة؟', 'The Battle of the Plains of Abraham', 'معركة سهول أبراهام', { s: 'canada', r: 'Battle of the Plains of Abraham' }],
  ['x07', 600, 'What was the first permanent English settlement in North America, founded in 1607?', 'ما أول مستوطنة إنجليزية دائمة في أمريكا الشمالية، تأسست عام ١٦٠٧؟', 'Jamestown', 'جيمستاون', { s: 'usa', r: 'Jamestown, Virginia' }],
]);

KH_BANK.cat('sweets', { g: 'food', e: '🍩', en: 'Desserts, Sweets & Breakfast', ar: 'حلويات وفطور',
  subs: { desserts: ['Desserts', 'حلويات'], candy: ['Candy & chocolate', 'سكاكر وشوكولاتة'], breakfast: ['Breakfast', 'فطور'] } }, [
  ['e01', 200, 'Which ring-shaped fried treat is Homer Simpson’s favourite?', 'أي حلوى مقلية على شكل حلقة هي المفضلة لهومر سيمبسون؟', 'The doughnut', 'الدونات', { s: 'desserts', r: 'Doughnut' }],
  ['e02', 200, 'What are very thin French pancakes called?', 'ماذا تُسمّى الفطائر الفرنسية الرقيقة جداً؟', 'Crêpes', 'الكريب', { s: 'breakfast', r: 'Crêpe' }],
  ['e03', 200, 'Apart from sugar, what is meringue mainly made from?', 'غير السكر، مِمَّ تُصنع المرينغ (المارينغ) أساساً؟', 'Egg whites', 'بياض البيض', { s: 'desserts', r: 'Meringue' }],
  ['e04', 200, 'What is the denser Italian version of ice cream called?', 'ماذا تُسمّى النسخة الإيطالية الأكثف من الآيس كريم؟', 'Gelato', 'جيلاتو', { s: 'desserts', r: 'Gelato' }],
  ['e05', 200, 'Tony the Tiger is the mascot of which breakfast cereal?', 'النمر «توني» هو تميمة أي حبوب إفطار؟', 'Frosties (Frosted Flakes)', 'فروستيز', { s: 'breakfast', alt: ['Frosted Flakes'], r: 'Tony the Tiger' }],
  ['e06', 200, 'Churros are traditionally dipped in what?', 'في ماذا تُغمس التشوروز تقليدياً؟', 'Hot chocolate', 'الشوكولاتة الساخنة', { s: 'desserts', r: 'Churro' }],
  ['e07', 200, 'What are the chewy, bear-shaped fruit sweets called?', 'ماذا تُسمّى الحلوى المطاطية بنكهة الفواكه على شكل دببة؟', 'Gummy bears', 'دببة الجيلي (غامي بيرز)', { s: 'candy', f: 'gummy', r: 'Gummy bear' }],
  ['h01', 400, 'Which German company invented gummy bears in 1922?', 'أي شركة ألمانية اخترعت دببة الجيلي عام ١٩٢٢؟', 'Haribo', 'هاريبو', { s: 'candy', f: 'gummy', r: 'Haribo' }],
  ['h02', 400, 'Which Latin American cake is soaked in three kinds of milk?', 'أي كعكة لاتينية تُنقع في ثلاثة أنواع من الحليب؟', 'Tres leches cake', 'كعكة تريس ليتشيس (الحليب الثلاثي)', { s: 'desserts', r: 'Tres leches cake' }],
  ['h03', 400, 'What is Japanese mochi made from?', 'مِمَّ تُصنع حلوى الموتشي اليابانية؟', 'Glutinous (sticky) rice', 'الأرز اللزج', { s: 'desserts', r: 'Mochi' }],
  ['h04', 400, 'Which meringue dessert is named after a Russian ballerina?', 'أي حلوى من المرينغ سُمّيت على اسم راقصة باليه روسية؟', 'Pavlova', 'بافلوفا', { s: 'desserts', r: 'Pavlova (dessert)' }],
  ['h05', 400, 'Which cereal did the Kellogg brothers make famous in the 1890s?', 'أي حبوب إفطار جعلها الأخوان كيلوغ مشهورة في تسعينيات القرن التاسع عشر؟', 'Corn Flakes', 'رقائق الذرة (كورن فليكس)', { s: 'breakfast', r: 'Corn flakes' }],
  ['h06', 400, 'Which Indian sweet is fried milk-dough balls soaked in syrup?', 'أي حلوى هندية عبارة عن كرات عجين بالحليب مقلية ومنقوعة بالقطر؟', 'Gulab jamun', 'غولاب جامون', { s: 'desserts', r: 'Gulab jamun' }],
  ['h07', 400, 'What is the famous Portuguese custard tart called?', 'ما اسم تارت الكاسترد البرتغالية الشهيرة؟', 'Pastel de nata', 'باستيل دي ناتا', { s: 'desserts', alt: ['pastéis de nata'], r: 'Pastel de nata' }],
  ['x01', 600, 'Which Swiss mountain appears on the Toblerone box?', 'أي جبل سويسري يظهر على علبة توبليرون؟', 'The Matterhorn', 'ماترهورن', { s: 'candy', x: 1, r: 'Toblerone' }],
  ['x02', 600, 'Which British company is credited with the first solid chocolate bar, in 1847?', 'أي شركة بريطانية يُنسب إليها أول لوح شوكولاتة صلب عام ١٨٤٧؟', 'J. S. Fry & Sons', 'جيه إس فراي وأبناؤه', { s: 'candy', x: 1, alt: ['Fry\'s'], r: 'J. S. Fry & Sons' }],
  ['x03', 600, 'Which dessert of peaches, vanilla ice cream and raspberry sauce is named after an Australian soprano?', 'أي حلوى من الخوخ والآيس كريم بالفانيليا وصلصة التوت سُمّيت على اسم مغنية أوبرا أسترالية؟', 'Peach Melba', 'بيتش ميلبا', { s: 'desserts', r: 'Peach Melba' }],
  ['x04', 600, 'Which French pastry’s name means "a thousand leaves"?', 'أي معجنات فرنسية يعني اسمها «ألف ورقة»؟', 'Mille-feuille', 'ميل فوي', { s: 'desserts', r: 'Mille-feuille' }],
  ['x05', 600, 'Which Swiss chocolatier first made milk chocolate, in 1875, using Henri Nestlé’s condensed milk?', 'أي صانع شوكولاتة سويسري صنع أول شوكولاتة بالحليب عام ١٨٧٥ مستخدماً حليب هنري نستله المكثف؟', 'Daniel Peter', 'دانيال بيتر', { s: 'candy', x: 1, r: 'Daniel Peter (chocolatier)' }],
  ['x06', 600, 'Which crescent-shaped Austrian roll is often said to be the croissant’s ancestor?', 'أي كعكة نمساوية هلالية الشكل يُقال غالباً إنها أصل الكرواسون؟', 'The kipferl', 'الكيبفرل', { s: 'breakfast', x: 1, r: 'Kipferl' }],
  ['x07', 600, 'Turkish delight (lokum) is a gel made mainly from sugar and what?', 'الحلقوم (الراحة) عبارة عن هلام يُصنع أساساً من السكر وماذا؟', 'Starch', 'النشا', { s: 'candy', r: 'Turkish delight' }],
]);

KH_BANK.cat('dangerous-animals', { g: 'nature', e: '🦂', en: 'Dangerous & Bizarre Animals', ar: 'حيوانات خطيرة وغريبة',
  subs: { deadly: ['Deadly animals', 'حيوانات قاتلة'], weird: ['Strange abilities', 'قدرات غريبة'] } }, [
  ['e01', 200, 'Which insect causes more human deaths than any other animal, by spreading disease?', 'أي حشرة تتسبب في وفاة عدد من البشر أكبر من أي حيوان آخر بنقلها الأمراض؟', 'The mosquito', 'البعوضة', { s: 'deadly', r: 'Mosquito' }],
  ['e02', 200, 'Which huge African river animal is one of the most dangerous to people?', 'أي حيوان نهري أفريقي ضخم من أخطر الحيوانات على البشر؟', 'The hippopotamus', 'فرس النهر', { s: 'deadly', alt: ['hippo'], r: 'Hippopotamus' }],
  ['e03', 200, 'What is the poison that snakes inject through their fangs called?', 'ماذا يُسمّى السم الذي تحقنه الثعابين عبر أنيابها؟', 'Venom', 'السم (الذعاف)', { s: 'deadly', r: 'Venom' }],
  ['e04', 200, 'Which spider has a red hourglass marking on its belly?', 'أي عنكبوت لديه علامة حمراء على شكل ساعة رملية على بطنه؟', 'The black widow', 'الأرملة السوداء', { s: 'deadly', r: 'Latrodectus' }],
  ['e05', 200, 'Which sharp-toothed fish lives in South American rivers?', 'أي سمكة ذات أسنان حادة تعيش في أنهار أمريكا الجنوبية؟', 'The piranha', 'البيرانا', { s: 'deadly', r: 'Piranha' }],
  ['e06', 200, 'Which animal sprays a foul-smelling liquid to defend itself?', 'أي حيوان يرش سائلاً كريه الرائحة للدفاع عن نفسه؟', 'The skunk', 'الظربان', { s: 'weird', r: 'Skunk' }],
  ['h01', 400, 'Which jellyfish is often called the most venomous marine animal?', 'أي قنديل بحر يُعتبر غالباً أكثر الحيوانات البحرية سمّية؟', 'The box jellyfish', 'قنديل البحر الصندوقي', { s: 'deadly', r: 'Box jellyfish' }],
  ['h02', 400, 'Which brightly coloured frogs were used by hunters to poison their darts?', 'أي ضفادع ملونة زاهية استخدمها الصيادون لتسميم سهامهم؟', 'Poison dart frogs', 'ضفادع السهام السامة', { s: 'deadly', r: 'Poison dart frog' }],
  ['h03', 400, 'Which Australian snake has the most toxic venom of any land snake?', 'أي ثعبان أسترالي له أشد سم بين ثعابين اليابسة؟', 'The inland taipan', 'التايبان الداخلي', { s: 'deadly', r: 'Inland taipan' }],
  ['h04', 400, 'Which large flightless bird has a dagger-like claw and is called the world’s most dangerous bird?', 'أي طائر كبير لا يطير له مخلب كالخنجر ويُلقّب بأخطر طائر في العالم؟', 'The cassowary', 'الشبنم (الكاسوار)', { s: 'deadly', r: 'Cassowary' }],
  ['h05', 400, 'Which microscopic "water bear" can survive the vacuum of space?', 'أي «دب ماء» مجهري يستطيع البقاء حياً في فراغ الفضاء؟', 'The tardigrade', 'بطيء الخطو (التارديغرادا)', { s: 'weird', r: 'Tardigrade' }],
  ['h06', 400, 'Which fish, camouflaged as a rock, is the most venomous fish known?', 'أي سمكة متنكرة كالصخرة هي أكثر الأسماك المعروفة سمّية؟', 'The stonefish', 'سمكة الحجر', { s: 'deadly', r: 'Stonefish' }],
  ['h07', 400, 'Which reptile has the strongest bite force ever measured in a living animal?', 'أي زاحف لديه أقوى عضّة قيست في حيوان حي؟', 'The saltwater crocodile', 'تمساح المياه المالحة', { s: 'deadly', f: 'saltie', r: 'Saltwater crocodile' }],
  ['x01', 600, 'Which North American lizard can squirt blood from its eyes to scare predators?', 'أي سحلية من أمريكا الشمالية تستطيع رش الدم من عينيها لإخافة المفترسين؟', 'The horned lizard', 'السحلية المقرّنة', { s: 'weird', x: 1, r: 'Horned lizard' }],
  ['x02', 600, 'Which crustacean punches with the speed of a bullet, strong enough to crack aquarium glass?', 'أي قشري يضرب بسرعة الرصاصة وبقوة تكفي لكسر زجاج الأحواض؟', 'The mantis shrimp', 'جمبري السرعوف', { s: 'weird', r: 'Mantis shrimp' }],
  ['x03', 600, 'What is the only known venomous primate?', 'ما الرئيسي الوحيد المعروف بأنه سام؟', 'The slow loris', 'اللوريس البطيء', { s: 'weird', x: 1, r: 'Slow loris' }],
  ['x04', 600, 'Which beetle defends itself by spraying a hot chemical mix from its rear?', 'أي خنفساء تدافع عن نفسها برش خليط كيميائي ساخن من مؤخرتها؟', 'The bombardier beetle', 'الخنفساء القاذفة', { s: 'weird', x: 1, r: 'Bombardier beetle' }],
  ['x05', 600, 'Which Mexican salamander can regrow lost limbs and even parts of its heart and brain?', 'أي سمندل مكسيكي يستطيع تجديد أطرافه المفقودة بل وأجزاء من قلبه ودماغه؟', 'The axolotl', 'الأكسولوتل', { s: 'weird', r: 'Axolotl' }],
  ['x06', 600, 'Which wasp stings cockroaches into a "zombie" state and leads them to its nest?', 'أي دبور يلدغ الصراصير فيحوّلها إلى «زومبي» ويقودها إلى عشه؟', 'The emerald cockroach wasp (jewel wasp)', 'دبور الصرصور الزمردي (الدبور الجوهري)', { s: 'weird', x: 1, alt: ['jewel wasp'], r: 'Emerald cockroach wasp' }],
  ['x07', 600, 'Male platypuses have venomous spurs on which part of the body?', 'لذكور خلد الماء أشواك سامة في أي جزء من الجسم؟', 'Their hind (back) legs', 'أرجلها الخلفية', { s: 'weird', f: 'platypus', r: 'Platypus' }],
]);

/* ---- bank/50-science.js ---- */
/* Science and technology. */
KH_BANK.cat('space', { g: 'science', pop: 1, e: '🚀', en: 'Space & Astronomy', ar: 'الفضاء والفلك',
  subs: { planets: ['Planets & moons', 'كواكب وأقمار'], exploration: ['Space exploration', 'استكشاف الفضاء'], stars: ['Stars & beyond', 'نجوم وما وراءها'] } }, [
  ['e01', 200, 'Which planet is known as the Red Planet?', 'أي كوكب يُعرف بالكوكب الأحمر؟', 'Mars', 'المريخ', { s: 'planets', r: 'Mars' }],
  ['e02', 200, 'What is the largest planet in the Solar System?', 'ما أكبر كواكب المجموعة الشمسية؟', 'Jupiter', 'المشتري', { s: 'planets', r: 'Jupiter' }],
  ['e03', 200, 'How many planets are in the Solar System?', 'كم عدد كواكب المجموعة الشمسية؟', 'Eight', 'ثمانية', { s: 'planets', alt: ['8'], r: 'Solar System' }],
  ['e04', 200, 'What is the closest star to Earth?', 'ما أقرب نجم إلى الأرض؟', 'The Sun', 'الشمس', { s: 'stars', r: 'Sun' }],
  ['e05', 200, 'Who was the first person to walk on the Moon, in 1969?', 'من أول إنسان مشى على سطح القمر عام ١٩٦٩؟', 'Neil Armstrong', 'نيل آرمسترونغ', { s: 'exploration', alt: ['Armstrong'], r: 'Neil Armstrong' }],
  ['e06', 200, 'Which planet is famous for its big, bright rings?', 'أي كوكب يشتهر بحلقاته الكبيرة اللامعة؟', 'Saturn', 'زحل', { s: 'planets', r: 'Saturn' }],
  ['h01', 400, 'Who was the first human in space, in 1961?', 'من أول إنسان صعد إلى الفضاء عام ١٩٦١؟', 'Yuri Gagarin', 'يوري غاغارين', { s: 'exploration', alt: ['Gagarin'], r: 'Yuri Gagarin' }],
  ['h02', 400, 'Which Saudi prince became the first Arab and first Muslim in space, in 1985?', 'أي أمير سعودي أصبح أول عربي وأول مسلم يصعد إلى الفضاء عام ١٩٨٥؟', 'Sultan bin Salman Al Saud', 'الأمير سلطان بن سلمان آل سعود', { s: 'exploration', alt: ['Prince Sultan bin Salman'], r: 'Sultan bin Salman Al Saud' }],
  ['h03', 400, 'Which planet spins on its side, tilted about 98 degrees?', 'أي كوكب يدور على جانبه بميل نحو ٩٨ درجة؟', 'Uranus', 'أورانوس', { s: 'planets', r: 'Uranus' }],
  ['h04', 400, 'Which is the hottest planet in the Solar System?', 'ما أشد كواكب المجموعة الشمسية حرارة؟', 'Venus', 'الزهرة', { s: 'planets', n: 'Its thick carbon dioxide atmosphere traps heat, so it beats Mercury.', nAr: 'غلافها الكثيف من ثاني أكسيد الكربون يحبس الحرارة فتتفوق على عطارد.', r: 'Venus' }],
  ['h05', 400, 'Which large infrared space telescope launched on 25 December 2021?', 'أي تلسكوب فضائي كبير بالأشعة تحت الحمراء أُطلق في ٢٥ ديسمبر ٢٠٢١؟', 'The James Webb Space Telescope', 'تلسكوب جيمس ويب الفضائي', { s: 'exploration', alt: ['JWST', 'Webb'], r: 'James Webb Space Telescope' }],
  ['h06', 400, 'Who was the first woman in space, in 1963?', 'من أول امرأة صعدت إلى الفضاء عام ١٩٦٣؟', 'Valentina Tereshkova', 'فالنتينا تيريشكوفا', { s: 'exploration', alt: ['Tereshkova'], r: 'Valentina Tereshkova' }],
  ['h07', 400, 'What was the name of the first artificial satellite, launched in 1957?', 'ما اسم أول قمر صناعي أُطلق عام ١٩٥٧؟', 'Sputnik 1', 'سبوتنيك ١', { s: 'exploration', alt: ['Sputnik'], r: 'Sputnik 1' }],
  ['x01', 600, 'What is the largest volcano in the Solar System, found on Mars?', 'ما أكبر بركان في المجموعة الشمسية، ويقع على المريخ؟', 'Olympus Mons', 'أوليمبوس مونس', { s: 'planets', r: 'Olympus Mons' }],
  ['x02', 600, 'Which of Saturn’s moons has a thick atmosphere and lakes of liquid methane?', 'أي قمر من أقمار زحل له غلاف جوي كثيف وبحيرات من الميثان السائل؟', 'Titan', 'تيتان', { s: 'planets', r: 'Titan (moon)' }],
  ['x03', 600, 'Which spacecraft is the farthest human-made object from Earth?', 'أي مركبة فضائية هي أبعد جسم صنعه الإنسان عن الأرض؟', 'Voyager 1', 'فوياجر ١', { s: 'exploration', c: 1, asOf: '2026-06', r: 'Voyager 1' }],
  ['x04', 600, 'What is the name of the nearest known star to the Sun?', 'ما اسم أقرب نجم معروف إلى الشمس؟', 'Proxima Centauri', 'بروكسيما سنتوري', { s: 'stars', alt: ['Alpha Centauri C'], r: 'Proxima Centauri' }],
  ['x05', 600, 'Who became the first Saudi woman in space, in 2023?', 'من أول امرأة سعودية تصعد إلى الفضاء عام ٢٠٢٣؟', 'Rayyanah Barnawi', 'ريانة برناوي', { s: 'exploration', x: 1, r: 'Rayyanah Barnawi' }],
  ['x06', 600, 'What is the boundary called where the solar wind is stopped by the interstellar medium?', 'ما اسم الحد الذي تتوقف عنده الرياح الشمسية بفعل الوسط بين النجمي؟', 'The heliopause', 'الهليوبوز (حدّ الغلاف الشمسي)', { s: 'stars', x: 1, r: 'Heliosphere' }],
]);

KH_BANK.cat('physics-chem', { g: 'science', e: '⚗️', en: 'Physics & Chemistry', ar: 'فيزياء وكيمياء',
  subs: { elements: ['Elements', 'العناصر'], physics: ['Physics', 'فيزياء'], scientists: ['Scientists', 'علماء'] } }, [
  ['e01', 200, 'What is the chemical symbol for oxygen?', 'ما الرمز الكيميائي للأكسجين؟', 'O', 'O', { s: 'elements', r: 'Oxygen' }],
  ['e02', 200, 'At sea level, at what temperature in °C does water boil?', 'عند مستوى سطح البحر، عند أي درجة مئوية يغلي الماء؟', '100 °C', '١٠٠ °م', { s: 'physics', alt: ['100'], r: 'Boiling point' }],
  ['e03', 200, 'Which force keeps us on the ground and the Moon in orbit?', 'أي قوة تبقينا على الأرض وتُبقي القمر في مداره؟', 'Gravity', 'الجاذبية', { s: 'physics', r: 'Gravity' }],
  ['e04', 200, 'Who developed the theory of relativity?', 'من وضع النظرية النسبية؟', 'Albert Einstein', 'ألبرت أينشتاين', { s: 'scientists', alt: ['Einstein'], r: 'Theory of relativity' }],
  ['e05', 200, 'At what temperature in °C does water freeze?', 'عند أي درجة مئوية يتجمد الماء؟', '0 °C', '٠ °م', { s: 'physics', alt: ['0', 'zero'], r: 'Melting point' }],
  ['e06', 200, 'Which element has the chemical symbol Fe?', 'أي عنصر رمزه الكيميائي Fe؟', 'Iron', 'الحديد', { s: 'elements', r: 'Iron' }],
  ['h01', 400, 'What is the chemical symbol for gold?', 'ما الرمز الكيميائي للذهب؟', 'Au', 'Au', { s: 'elements', n: 'From the Latin word aurum.', nAr: 'من الكلمة اللاتينية Aurum.', r: 'Gold' }],
  ['h02', 400, 'Which gas makes up most of Earth’s atmosphere?', 'أي غاز يشكّل معظم الغلاف الجوي للأرض؟', 'Nitrogen', 'النيتروجين', { s: 'elements', n: 'About 78%.', nAr: 'نحو ٧٨٪.', r: 'Atmosphere of Earth' }],
  ['h03', 400, 'Roughly how fast does light travel in a vacuum, in km per second?', 'تقريباً، ما سرعة الضوء في الفراغ بالكيلومتر في الثانية؟', 'About 300,000 km/s', 'نحو ٣٠٠ ألف كم/ث', { s: 'physics', alt: ['299,792 km/s'], r: 'Speed of light' }],
  ['h04', 400, 'Which element has atomic number 1?', 'أي عنصر عدده الذري ١؟', 'Hydrogen', 'الهيدروجين', { s: 'elements', r: 'Hydrogen' }],
  ['h05', 400, 'What is the pH of pure water at 25 °C?', 'ما الرقم الهيدروجيني (pH) للماء النقي عند ٢٥ °م؟', '7', '٧', { s: 'elements', r: 'PH' }],
  ['h06', 400, 'Which unit is used to measure electrical resistance?', 'ما وحدة قياس المقاومة الكهربائية؟', 'The ohm', 'الأوم', { s: 'physics', r: 'Ohm' }],
  ['h07', 400, 'Who described the three laws of motion in 1687?', 'من وصف قوانين الحركة الثلاثة عام ١٦٨٧؟', 'Isaac Newton', 'إسحاق نيوتن', { s: 'scientists', alt: ['Newton'], r: 'Newton\'s laws of motion' }],
  ['h08', 400, 'Which is the only metal that is liquid at room temperature?', 'ما المعدن الوحيد الذي يكون سائلاً في درجة حرارة الغرفة؟', 'Mercury', 'الزئبق', { s: 'elements', r: 'Mercury (element)' }],
  ['x01', 600, 'Which metal has the highest melting point?', 'أي معدن له أعلى درجة انصهار؟', 'Tungsten', 'التنغستن', { s: 'elements', alt: ['Wolfram'], r: 'Tungsten' }],
  ['x02', 600, 'Who discovered the electron, in 1897?', 'من اكتشف الإلكترون عام ١٨٩٧؟', 'J. J. Thomson', 'جوزيف جون طومسون', { s: 'scientists', alt: ['Thomson'], r: 'J. J. Thomson' }],
  ['x03', 600, 'What is absolute zero in degrees Celsius?', 'كم يساوي الصفر المطلق بالدرجات المئوية؟', '−273.15 °C', '−٢٧٣٫١٥ °م', { s: 'physics', alt: ['-273'], r: 'Absolute zero' }],
  ['x04', 600, 'Which noble gas is the most common in Earth’s atmosphere?', 'أي غاز نبيل هو الأكثر وجوداً في الغلاف الجوي للأرض؟', 'Argon', 'الأرغون', { s: 'elements', x: 1, r: 'Argon' }],
  ['x05', 600, 'Which element was first detected in the Sun’s light, and is named after the Greek word for Sun?', 'أي عنصر اكتُشف أولاً في ضوء الشمس وسُمّي باسم الشمس في اليونانية؟', 'Helium', 'الهيليوم', { s: 'elements', r: 'Helium' }],
  ['x06', 600, 'Which Russian chemist published a periodic table in 1869 that predicted undiscovered elements?', 'أي كيميائي روسي نشر جدولاً دورياً عام ١٨٦٩ تنبأ بعناصر لم تُكتشف بعد؟', 'Dmitri Mendeleev', 'ديمتري مندلييف', { s: 'scientists', alt: ['Mendeleev'], r: 'Dmitri Mendeleev' }],
]);

KH_BANK.cat('body', { g: 'science', e: '🫀', en: 'The Human Body', ar: 'جسم الإنسان',
  subs: { organs: ['Organs', 'الأعضاء'], skeleton: ['Bones & muscles', 'عظام وعضلات'], blood: ['Blood & cells', 'الدم والخلايا'] } }, [
  ['e01', 200, 'What is the largest organ of the human body?', 'ما أكبر عضو في جسم الإنسان؟', 'The skin', 'الجلد', { s: 'organs', r: 'Skin' }],
  ['e02', 200, 'Which organ pumps blood around the body?', 'أي عضو يضخ الدم في أنحاء الجسم؟', 'The heart', 'القلب', { s: 'organs', r: 'Heart' }],
  ['e03', 200, 'Which vitamin does your skin make when exposed to sunlight?', 'أي فيتامين يصنعه الجلد عند التعرض لأشعة الشمس؟', 'Vitamin D', 'فيتامين د', { s: 'blood', ok: 1, r: 'Vitamin D' }],
  ['e04', 200, 'Which blood cells fight infection?', 'أي خلايا دم تحارب العدوى؟', 'White blood cells', 'خلايا الدم البيضاء', { s: 'blood', r: 'White blood cell' }],
  ['e05', 200, 'Which organs filter the blood to make urine?', 'أي أعضاء تصفّي الدم لتكوين البول؟', 'The kidneys', 'الكليتان', { s: 'organs', r: 'Kidney' }],
  ['e06', 200, 'In which part of the body is the femur?', 'في أي جزء من الجسم تقع عظمة الفخذ (Femur)؟', 'The thigh (upper leg)', 'الفخذ', { s: 'skeleton', r: 'Femur' }],
  ['h01', 400, 'How many bones are in the adult human body?', 'كم عظمة في جسم الإنسان البالغ؟', '206', '٢٠٦', { s: 'skeleton', r: 'Human skeleton' }],
  ['h02', 400, 'How many teeth does a full adult set have, including wisdom teeth?', 'كم سناً في الطقم الكامل للبالغين، مع ضروس العقل؟', '32', '٣٢', { s: 'skeleton', r: 'Human tooth' }],
  ['h03', 400, 'The smallest bone in the body, the stapes, is found where?', 'أصغر عظمة في الجسم، الركاب، أين توجد؟', 'In the (middle) ear', 'في الأذن (الوسطى)', { s: 'skeleton', r: 'Stapes' }],
  ['h04', 400, 'What is the largest internal organ?', 'ما أكبر عضو داخلي؟', 'The liver', 'الكبد', { s: 'organs', r: 'Liver' }],
  ['h05', 400, 'How many chambers does the human heart have?', 'كم حجرة في قلب الإنسان؟', 'Four', 'أربع', { s: 'organs', alt: ['4'], r: 'Heart' }],
  ['h06', 400, 'Which blood type is known as the universal donor for red blood cells?', 'أي فصيلة دم تُعرف بالمعطي العام لخلايا الدم الحمراء؟', 'O negative', 'O سالب', { s: 'blood', r: 'Blood type' }],
  ['h07', 400, 'Which coloured part of the eye controls the size of the pupil?', 'أي جزء ملوّن من العين يتحكم بحجم البؤبؤ؟', 'The iris', 'القزحية', { s: 'organs', r: 'Iris (anatomy)' }],
  ['h08', 400, 'Which organ produces insulin?', 'أي عضو يفرز الإنسولين؟', 'The pancreas', 'البنكرياس', { s: 'organs', r: 'Insulin' }],
  ['x01', 600, 'Which pea-sized gland at the base of the brain is often called the "master gland"?', 'أي غدة بحجم حبة البازلاء في قاعدة الدماغ تُسمّى غالباً «الغدة الرئيسية»؟', 'The pituitary gland', 'الغدة النخامية', { s: 'organs', r: 'Pituitary gland' }],
  ['x02', 600, 'Which part of the brain is mainly responsible for balance and coordination?', 'أي جزء من الدماغ هو المسؤول الرئيسي عن التوازن والتناسق؟', 'The cerebellum', 'المخيخ', { s: 'organs', r: 'Cerebellum' }],
  ['x03', 600, 'What are the tiny air sacs in the lungs, where gas exchange happens, called?', 'ماذا تُسمّى الأكياس الهوائية الصغيرة في الرئتين التي يحدث فيها تبادل الغازات؟', 'Alveoli', 'الحويصلات الهوائية', { s: 'organs', r: 'Pulmonary alveolus' }],
  ['x04', 600, 'Which heart valve lies between the left atrium and left ventricle?', 'أي صمام قلبي يقع بين الأذين الأيسر والبطين الأيسر؟', 'The mitral valve', 'الصمام التاجي', { s: 'organs', x: 1, alt: ['bicuspid valve'], r: 'Mitral valve' }],
  ['x05', 600, 'Which iron-containing protein carries oxygen in red blood cells?', 'أي بروتين يحتوي على الحديد ينقل الأكسجين في خلايا الدم الحمراء؟', 'Haemoglobin', 'الهيموغلوبين', { s: 'blood', alt: ['Hemoglobin'], r: 'Hemoglobin' }],
  ['x06', 600, 'What is the medical name for the kneecap?', 'ما الاسم الطبي لعظمة الرضفة (صابونة الركبة)؟', 'The patella', 'الرضفة (Patella)', { s: 'skeleton', x: 1, r: 'Patella' }],
]);

KH_BANK.cat('biology', { g: 'science', e: '🧬', en: 'Biology & Genetics', ar: 'الأحياء والوراثة',
  subs: { cells: ['Cells', 'الخلايا'], genetics: ['Genetics', 'الوراثة'], life: ['Living things', 'الكائنات الحية'] } }, [
  ['e01', 200, 'What do plants use sunlight to make food in a process called?', 'ما اسم العملية التي تصنع فيها النباتات غذاءها باستخدام ضوء الشمس؟', 'Photosynthesis', 'البناء الضوئي', { s: 'life', r: 'Photosynthesis' }],
  ['e02', 200, 'Which scientist proposed evolution by natural selection?', 'أي عالم اقترح نظرية التطور بالانتقاء الطبيعي؟', 'Charles Darwin', 'تشارلز داروين', { s: 'life', alt: ['Darwin'], r: 'Charles Darwin' }],
  ['e03', 200, 'What is the basic unit of all living things?', 'ما الوحدة الأساسية لجميع الكائنات الحية؟', 'The cell', 'الخلية', { s: 'cells', r: 'Cell (biology)' }],
  ['e04', 200, 'Which gas do humans breathe out as waste?', 'أي غاز يزفره الإنسان كفضلات؟', 'Carbon dioxide', 'ثاني أكسيد الكربون', { s: 'life', alt: ['CO2'], r: 'Carbon dioxide' }],
  ['e05', 200, 'What sweet food do bees make from flower nectar?', 'أي غذاء حلو يصنعه النحل من رحيق الأزهار؟', 'Honey', 'العسل', { s: 'life', r: 'Honey' }],
  ['e06', 200, 'Which part of a plant absorbs water from the soil?', 'أي جزء من النبات يمتص الماء من التربة؟', 'The roots', 'الجذور', { s: 'life', r: 'Root' }],
  ['h01', 400, 'What does DNA stand for?', 'ماذا يعني اختصار DNA؟', 'Deoxyribonucleic acid', 'الحمض النووي الريبي منقوص الأكسجين', { s: 'genetics', r: 'DNA' }],
  ['h02', 400, 'How many pairs of chromosomes do humans normally have?', 'كم زوجاً من الكروموسومات لدى الإنسان عادةً؟', '23', '٢٣', { s: 'genetics', r: 'Chromosome' }],
  ['h03', 400, 'What shape is the structure of DNA?', 'ما شكل بنية الحمض النووي DNA؟', 'A double helix', 'لولب مزدوج', { s: 'genetics', r: 'Nucleic acid double helix' }],
  ['h04', 400, 'Which part of the cell is nicknamed the "powerhouse of the cell"?', 'أي جزء من الخلية يُلقّب بـ«مصنع الطاقة»؟', 'The mitochondria', 'الميتوكوندريا', { s: 'cells', alt: ['mitochondrion'], r: 'Mitochondrion' }],
  ['h05', 400, 'Which monk discovered the basic laws of heredity using pea plants?', 'أي راهب اكتشف قوانين الوراثة الأساسية باستخدام نبات البازلاء؟', 'Gregor Mendel', 'غريغور مندل', { s: 'genetics', alt: ['Mendel'], r: 'Gregor Mendel' }],
  ['h06', 400, 'Which green pigment lets plants absorb light?', 'أي صبغة خضراء تمكّن النباتات من امتصاص الضوء؟', 'Chlorophyll', 'الكلوروفيل (اليخضور)', { s: 'cells', r: 'Chlorophyll' }],
  ['h07', 400, 'What was the name of the first mammal cloned from an adult cell, in 1996?', 'ما اسم أول حيوان ثديي استُنسخ من خلية بالغة عام ١٩٩٦؟', 'Dolly the sheep', 'النعجة دوللي', { s: 'genetics', alt: ['Dolly'], r: 'Dolly (sheep)' }],
  ['x01', 600, 'Whose X-ray image, "Photo 51", was key to discovering the structure of DNA?', 'صورة الأشعة السينية «الصورة ٥١» لمن كانت مفتاحاً لاكتشاف بنية الحمض النووي؟', 'Rosalind Franklin', 'روزاليند فرانكلين', { s: 'genetics', r: 'Photo 51' }],
  ['x02', 600, 'Which four bases make up DNA?', 'ما القواعد الأربع التي يتكون منها الحمض النووي DNA؟', 'Adenine, thymine, cytosine and guanine (A, T, C, G)', 'الأدينين والثايمين والسيتوسين والغوانين', { s: 'genetics', r: 'Nucleobase' }],
  ['x03', 600, 'Which gene-editing technique, based on a bacterial defence system, won the 2020 Nobel Prize in Chemistry?', 'أي تقنية لتعديل الجينات مأخوذة من نظام دفاع بكتيري فازت بجائزة نوبل للكيمياء ٢٠٢٠؟', 'CRISPR (CRISPR-Cas9)', 'كريسبر (CRISPR-Cas9)', { s: 'genetics', r: 'CRISPR gene editing' }],
  ['x04', 600, 'What is the scientific study of fungi called?', 'ما اسم العلم الذي يدرس الفطريات؟', 'Mycology', 'علم الفطريات (الميكولوجيا)', { s: 'life', x: 1, r: 'Mycology' }],
  ['x05', 600, 'Single-celled microbes found in extreme places like hot springs form which domain of life, separate from bacteria?', 'الميكروبات وحيدة الخلية الموجودة في أماكن متطرفة كالينابيع الحارة تشكّل أي نطاق حياة منفصل عن البكتيريا؟', 'Archaea', 'العتائق (الأركيا)', { s: 'cells', x: 1, r: 'Archaea' }],
  ['x06', 600, 'Who first described "cells" after looking at cork under a microscope in 1665?', 'من أول من وصف «الخلايا» بعد فحص الفلين تحت المجهر عام ١٦٦٥؟', 'Robert Hooke', 'روبرت هوك', { s: 'cells', r: 'Robert Hooke' }],
]);

KH_BANK.cat('maths', { g: 'science', e: '🔢', en: 'Maths & Numbers', ar: 'رياضيات وأرقام',
  subs: { arithmetic: ['Arithmetic', 'حساب'], geometry: ['Geometry', 'هندسة'], famous: ['Famous numbers & people', 'أرقام وعلماء مشهورون'] } }, [
  ['e01', 200, 'What is 12 × 12?', 'كم حاصل ١٢ × ١٢؟', '144', '١٤٤', { s: 'arithmetic', r: 'Multiplication table' }],
  ['e02', 200, 'How many degrees are in a right angle?', 'كم درجة في الزاوية القائمة؟', '90', '٩٠', { s: 'geometry', r: 'Right angle' }],
  ['e03', 200, 'What is pi to two decimal places?', 'كم قيمة باي (π) لمنزلتين عشريتين؟', '3.14', '٣٫١٤', { s: 'famous', r: 'Pi' }],
  ['e04', 200, 'What is an eight-sided shape called?', 'ماذا يُسمّى الشكل ذو الأضلاع الثمانية؟', 'An octagon', 'مثمّن', { s: 'geometry', r: 'Octagon' }],
  ['e05', 200, 'How many degrees are in a full circle?', 'كم درجة في الدائرة الكاملة؟', '360', '٣٦٠', { s: 'geometry', r: 'Turn (angle)' }],
  ['e06', 200, 'What is the next prime number after 7?', 'ما العدد الأولي التالي بعد ٧؟', '11', '١١', { s: 'arithmetic', r: 'Prime number' }],
  ['h01', 400, 'What is the square root of 169?', 'ما الجذر التربيعي للعدد ١٦٩؟', '13', '١٣', { s: 'arithmetic', r: 'Square root' }],
  ['h02', 400, 'What is 2 to the power of 10?', 'كم يساوي ٢ أس ١٠؟', '1,024', '١٠٢٤', { s: 'arithmetic', r: 'Power of two' }],
  ['h03', 400, 'Which Greek mathematician’s theorem says a² + b² = c² in a right-angled triangle?', 'نظرية أي عالم رياضيات إغريقي تقول إن a² + b² = c² في المثلث القائم؟', 'Pythagoras', 'فيثاغورس', { s: 'famous', r: 'Pythagorean theorem' }],
  ['h04', 400, 'What is the only even prime number?', 'ما العدد الأولي الزوجي الوحيد؟', '2', '٢', { s: 'arithmetic', r: 'Prime number' }],
  ['h05', 400, 'How many sides does a dodecagon have?', 'كم ضلعاً للشكل الاثني عشري (Dodecagon)؟', '12', '١٢', { s: 'geometry', r: 'Dodecagon' }],
  ['h06', 400, 'What do the interior angles of any triangle add up to?', 'كم مجموع الزوايا الداخلية لأي مثلث؟', '180 degrees', '١٨٠ درجة', { s: 'geometry', alt: ['180'], r: 'Triangle' }],
  ['h07', 400, 'The digits 0–9 used worldwide reached Europe through Arab scholars. What are they usually called?', 'الأرقام ٠–٩ المستخدمة عالمياً وصلت أوروبا عن طريق العلماء العرب. ماذا تُسمّى عادةً؟', 'Hindu–Arabic numerals', 'الأرقام الهندية العربية', { s: 'famous', alt: ['Arabic numerals'], r: 'Hindu–Arabic numeral system' }],
  ['x01', 600, 'What is 0! (zero factorial)?', 'كم يساوي مضروب الصفر (!٠)؟', '1', '١', { s: 'arithmetic', x: 1, ok: 1, r: 'Factorial' }],
  ['x02', 600, 'What is the golden ratio, to three decimal places?', 'ما قيمة النسبة الذهبية لثلاث منازل عشرية؟', '1.618', '١٫٦١٨', { s: 'famous', r: 'Golden ratio' }],
  ['x03', 600, 'Which British mathematician proved Fermat’s Last Theorem in 1994?', 'أي عالم رياضيات بريطاني برهن مبرهنة فيرما الأخيرة عام ١٩٩٤؟', 'Andrew Wiles', 'أندرو وايلز', { s: 'famous', r: 'Wiles\'s proof of Fermat\'s Last Theorem' }],
  ['x04', 600, 'What name is given to the number 10 to the power of 100?', 'ما الاسم الذي يُطلق على العدد ١٠ أس ١٠٠؟', 'A googol', 'غوغول', { s: 'famous', f: 'googol', r: 'Googol' }],
  ['x05', 600, 'What is the smallest perfect number (equal to the sum of its other divisors)?', 'ما أصغر عدد تام (يساوي مجموع قواسمه الأخرى)؟', '6', '٦', { s: 'arithmetic', x: 1, n: '1 + 2 + 3 = 6.', nAr: '١ + ٢ + ٣ = ٦.', r: 'Perfect number' }],
  ['x06', 600, 'What is Euler’s number e, to three decimal places?', 'ما قيمة عدد أويلر e لثلاث منازل عشرية؟', '2.718', '٢٫٧١٨', { s: 'famous', x: 1, r: 'E (mathematical constant)' }],
]);

KH_BANK.cat('computing', { g: 'science', e: '💻', en: 'Computers & the Internet', ar: 'الحاسوب والإنترنت',
  subs: { basics: ['Basics', 'أساسيات'], history: ['Computing history', 'تاريخ الحوسبة'], web: ['The web', 'الويب'] } }, [
  ['e01', 200, 'What does "www" stand for in a web address?', 'ماذا تعني «www» في عناوين المواقع؟', 'World Wide Web', 'الشبكة العنكبوتية العالمية', { s: 'web', r: 'World Wide Web' }],
  ['e02', 200, 'Which company’s name comes from "googol", the number 1 followed by 100 zeros?', 'اسم أي شركة مأخوذ من «غوغول»، العدد ١ متبوعاً بـ١٠٠ صفر؟', 'Google', 'غوغل', { s: 'web', f: 'googol', r: 'Google' }],
  ['e03', 200, 'Which short-video app is owned by the Chinese company ByteDance?', 'أي تطبيق مقاطع قصيرة تملكه الشركة الصينية «بايت دانس»؟', 'TikTok', 'تيك توك', { s: 'web', f: 'tiktok', r: 'TikTok' }],
  ['e04', 200, 'Which symbol appears in every email address?', 'أي رمز يظهر في كل عنوان بريد إلكتروني؟', '@ (the "at" sign)', '@ (آت)', { s: 'basics', f: 'email-at', r: 'Email address' }],
  ['e05', 200, 'What does "AI" stand for?', 'ماذا يعني اختصار «AI»؟', 'Artificial intelligence', 'الذكاء الاصطناعي', { s: 'basics', r: 'Artificial intelligence' }],
  ['e06', 200, 'Which company makes the Windows operating system?', 'أي شركة تصنع نظام التشغيل ويندوز؟', 'Microsoft', 'مايكروسوفت', { s: 'basics', r: 'Microsoft Windows' }],
  ['h01', 400, 'What does CPU stand for?', 'ماذا يعني اختصار CPU؟', 'Central processing unit', 'وحدة المعالجة المركزية', { s: 'basics', r: 'Central processing unit' }],
  ['h02', 400, 'What does USB stand for?', 'ماذا يعني اختصار USB؟', 'Universal Serial Bus', 'الناقل التسلسلي العام', { s: 'basics', r: 'USB' }],
  ['h03', 400, 'What was the name of the first web browser, made by Tim Berners-Lee in 1990?', 'ما اسم أول متصفح ويب صنعه تيم بيرنرز-لي عام ١٩٩٠؟', 'WorldWideWeb (later Nexus)', 'WorldWideWeb (لاحقاً Nexus)', { s: 'web', alt: ['Nexus'], r: 'WorldWideWeb' }],
  ['h04', 400, 'In which year was Google founded?', 'في أي عام تأسست غوغل؟', '1998', '١٩٩٨', { s: 'web', r: 'Google' }],
  ['h05', 400, 'What does HTML stand for?', 'ماذا يعني اختصار HTML؟', 'HyperText Markup Language', 'لغة ترميز النص التشعبي', { s: 'web', r: 'HTML' }],
  ['h06', 400, 'Which programming language is named after a British comedy group, not a snake?', 'أي لغة برمجة سُمّيت على اسم فرقة كوميدية بريطانية لا على اسم ثعبان؟', 'Python', 'بايثون', { s: 'history', n: 'Monty Python.', nAr: 'فرقة «مونتي بايثون».', r: 'Python (programming language)' }],
  ['h07', 400, 'How many bits are in one byte?', 'كم «بت» في البايت الواحد؟', '8', '٨', { s: 'basics', r: 'Byte' }],
  ['x01', 600, 'Which US network, first connected in 1969, was the forerunner of the internet?', 'أي شبكة أمريكية اتصلت لأول مرة عام ١٩٦٩ وكانت أساس الإنترنت؟', 'ARPANET', 'أربانت', { s: 'history', r: 'ARPANET' }],
  ['x02', 600, 'Who is often called the first computer programmer, for her notes on the Analytical Engine?', 'من تُسمّى غالباً أول مبرمجة حاسوب بسبب ملاحظاتها عن «المحرك التحليلي»؟', 'Ada Lovelace', 'آدا لوفليس', { s: 'history', f: 'analytical-engine', r: 'Ada Lovelace' }],
  ['x03', 600, 'Who created the C programming language at Bell Labs?', 'من ابتكر لغة البرمجة C في مختبرات بيل؟', 'Dennis Ritchie', 'دينيس ريتشي', { s: 'history', r: 'Dennis Ritchie' }],
  ['x04', 600, 'Which 1988 program was one of the first worms to spread across the internet?', 'أي برنامج عام ١٩٨٨ كان من أوائل الديدان التي انتشرت عبر الإنترنت؟', 'The Morris worm', 'دودة موريس', { s: 'history', x: 1, r: 'Morris worm' }],
  ['x05', 600, 'Who sent the first networked email, in 1971, and chose the @ sign?', 'من أرسل أول بريد إلكتروني عبر الشبكة عام ١٩٧١ واختار رمز @؟', 'Ray Tomlinson', 'راي توملينسون', { s: 'history', x: 1, f: 'email-at', r: 'Ray Tomlinson' }],
  ['x06', 600, 'Who designed the Analytical Engine, a mechanical general-purpose computer, in the 1830s?', 'من صمّم «المحرك التحليلي»، حاسوب ميكانيكي متعدد الأغراض، في ثلاثينيات القرن التاسع عشر؟', 'Charles Babbage', 'تشارلز باباج', { s: 'history', f: 'analytical-engine', r: 'Analytical engine' }],
]);

KH_BANK.cat('tech', { g: 'science', e: '📱', en: 'Tech Companies & Gadgets', ar: 'شركات التقنية والأجهزة',
  subs: { companies: ['Companies', 'شركات'], gadgets: ['Gadgets', 'أجهزة'], founders: ['Founders', 'مؤسسون'] } }, [
  ['e01', 200, 'Who co-founded Microsoft with Paul Allen?', 'من أسس مايكروسوفت مع بول ألين؟', 'Bill Gates', 'بيل غيتس', { s: 'founders', alt: ['Gates'], r: 'Bill Gates' }],
  ['e02', 200, 'Which company owns Instagram and WhatsApp?', 'أي شركة تملك إنستغرام وواتساب؟', 'Meta (formerly Facebook)', 'ميتا (فيسبوك سابقاً)', { s: 'companies', alt: ['Facebook'], f: 'meta-apps', r: 'Meta Platforms' }],
  ['e03', 200, 'Which Korean company makes Galaxy smartphones?', 'أي شركة كورية تصنع هواتف «غالاكسي»؟', 'Samsung', 'سامسونج', { s: 'companies', r: 'Samsung Galaxy' }],
  ['e04', 200, 'Who founded SpaceX in 2002?', 'من أسس شركة سبيس إكس عام ٢٠٠٢؟', 'Elon Musk', 'إيلون ماسك', { s: 'founders', alt: ['Musk'], r: 'SpaceX' }],
  ['e05', 200, 'Which company makes the Android operating system and Pixel phones?', 'أي شركة تصنع نظام أندرويد وهواتف بكسل؟', 'Google', 'غوغل', { s: 'companies', r: 'Android (operating system)' }],
  ['e06', 200, 'Which online shopping giant did Jeff Bezos found?', 'أي عملاق للتسوق الإلكتروني أسسه جيف بيزوس؟', 'Amazon', 'أمازون', { s: 'founders', r: 'Amazon (company)' }],
  ['h01', 400, 'Who co-founded Apple with Steve Jobs and built its first computers?', 'من أسس أبل مع ستيف جوبز وبنى أول حواسيبها؟', 'Steve Wozniak', 'ستيف وزنياك', { s: 'founders', alt: ['Woz', 'Wozniak'], r: 'Steve Wozniak' }],
  ['h02', 400, 'What was Google’s original name in 1996?', 'ما الاسم الأصلي لغوغل عام ١٩٩٦؟', 'BackRub', 'باك رب (BackRub)', { s: 'companies', r: 'Google' }],
  ['h03', 400, 'Which company bought YouTube in 2006?', 'أي شركة اشترت يوتيوب عام ٢٠٠٦؟', 'Google', 'غوغل', { s: 'companies', ok: 1, r: 'YouTube' }],
  ['h04', 400, 'What does IBM stand for?', 'ماذا يعني اختصار IBM؟', 'International Business Machines', 'آلات الأعمال الدولية', { s: 'companies', r: 'IBM' }],
  ['h05', 400, 'Which Japanese company made the Walkman portable cassette player?', 'أي شركة يابانية صنعت مشغل الكاسيت المحمول «ووكمان»؟', 'Sony', 'سوني', { s: 'gadgets', r: 'Walkman' }],
  ['h06', 400, 'Which Canadian company made BlackBerry phones?', 'أي شركة كندية صنعت هواتف بلاك بيري؟', 'Research In Motion (RIM)', 'ريسيرش إن موشن (RIM)', { s: 'gadgets', alt: ['RIM', 'BlackBerry Limited'], r: 'BlackBerry Limited' }],
  ['x01', 600, 'What was Amazon’s original name before Jeff Bezos changed it?', 'ما الاسم الأصلي لأمازون قبل أن يغيّره جيف بيزوس؟', 'Cadabra', 'كادابرا', { s: 'companies', x: 1, r: 'Amazon (company)' }],
  ['x02', 600, 'Nokia started in 1865 as what kind of business?', 'بدأت نوكيا عام ١٨٦٥ كأي نوع من الأعمال؟', 'A paper (wood-pulp) mill', 'مصنع ورق (لب الخشب)', { s: 'companies', x: 1, r: 'Nokia' }],
  ['x03', 600, 'Which company sold the first commercial handheld mobile phone, the DynaTAC, in 1983?', 'أي شركة باعت أول هاتف محمول تجاري، DynaTAC، عام ١٩٨٣؟', 'Motorola', 'موتورولا', { s: 'gadgets', r: 'Motorola DynaTAC' }],
  ['x04', 600, 'Who founded Samsung in 1938?', 'من أسس سامسونج عام ١٩٣٨؟', 'Lee Byung-chul', 'لي بيونغ تشول', { s: 'founders', x: 1, r: 'Lee Byung-chul' }],
  ['x05', 600, 'What was the name of Apple’s first computer, sold in 1976?', 'ما اسم أول حاسوب من أبل، بيع عام ١٩٧٦؟', 'The Apple I', 'أبل ١', { s: 'gadgets', r: 'Apple I' }],
  ['x06', 600, 'Philips developed the compact disc (CD) together with which company?', 'طوّرت فيليبس القرص المدمج (CD) بالتعاون مع أي شركة؟', 'Sony', 'سوني', { s: 'gadgets', ok: 1, r: 'Compact disc' }],
]);

/* ---- bank/60-nature.js ---- */
/* Animals and nature. */
KH_BANK.cat('mammals', { g: 'nature', pop: 1, e: '🐘', en: 'Mammals', ar: 'الثدييات',
  subs: { wild: ['Wild animals', 'حيوانات برية'], records: ['Records', 'أرقام قياسية'], arabia: ['Arabian wildlife', 'حياة الجزيرة العربية البرية'] } }, [
  ['e01', 200, 'What is the fastest land animal?', 'ما أسرع حيوان بري؟', 'The cheetah', 'الفهد (الشيتا)', { s: 'records', r: 'Cheetah' }],
  ['e02', 200, 'What is the largest animal ever known to have lived?', 'ما أكبر حيوان عاش على الإطلاق؟', 'The blue whale', 'الحوت الأزرق', { s: 'records', r: 'Blue whale' }],
  ['e03', 200, 'Which animal is called "the ship of the desert"?', 'أي حيوان يُلقّب بـ«سفينة الصحراء»؟', 'The camel', 'الجمل', { s: 'arabia', r: 'Camel' }],
  ['e04', 200, 'What do giant pandas mostly eat?', 'ماذا تأكل الباندا العملاقة في الغالب؟', 'Bamboo', 'الخيزران (البامبو)', { s: 'wild', r: 'Giant panda' }],
  ['e05', 200, 'What is a baby kangaroo called?', 'ماذا يُسمّى صغير الكنغر؟', 'A joey', 'جوي', { s: 'wild', r: 'Kangaroo' }],
  ['e06', 200, 'What is the tallest living animal?', 'ما أطول حيوان حي؟', 'The giraffe', 'الزرافة', { s: 'records', r: 'Giraffe' }],
  ['h01', 400, 'Which is the only mammal capable of true, powered flight?', 'ما الحيوان الثديي الوحيد القادر على الطيران الحقيقي؟', 'The bat', 'الخفاش', { s: 'wild', r: 'Bat' }],
  ['h02', 400, 'How many humps does a dromedary (Arabian camel) have?', 'كم سناماً للجمل العربي (وحيد السنام)؟', 'One', 'سنام واحد', { s: 'arabia', alt: ['1'], r: 'Dromedary' }],
  ['h03', 400, 'Which is the largest species of big cat?', 'ما أكبر أنواع القطط الكبيرة؟', 'The tiger', 'النمر (الببر)', { s: 'records', r: 'Tiger' }],
  ['h04', 400, 'What is a group of lions called?', 'ماذا تُسمّى مجموعة الأسود؟', 'A pride', 'زمرة (Pride)', { s: 'wild', r: 'Lion' }],
  ['h05', 400, 'Which egg-laying mammal has a duck-like bill?', 'أي حيوان ثديي يبيض وله منقار يشبه منقار البطة؟', 'The platypus', 'خلد الماء (البلاتيبوس)', { f: 'platypus', s: 'wild', r: 'Platypus' }],
  ['h06', 400, 'Which ape, along with the bonobo, is humans’ closest living relative?', 'أي قرد، إلى جانب البونوبو، هو أقرب الأقارب الأحياء للإنسان؟', 'The chimpanzee', 'الشمبانزي', { s: 'wild', r: 'Chimpanzee' }],
  ['h07', 400, 'What is a female fox called?', 'ماذا تُسمّى أنثى الثعلب؟', 'A vixen', 'ثعلبة (Vixen)', { s: 'wild', r: 'Red fox' }],
  ['x01', 600, 'What is the only marsupial native to the USA and Canada?', 'ما الحيوان الجرابي الوحيد الأصلي في الولايات المتحدة وكندا؟', 'The Virginia opossum', 'أبوسوم فيرجينيا', { s: 'wild', x: 1, alt: ['opossum'], r: 'Virginia opossum' }],
  ['x02', 600, 'Which Australian animal has fingerprints so like a human’s they are hard to tell apart?', 'أي حيوان أسترالي له بصمات أصابع تشبه بصمات الإنسان لدرجة يصعب التمييز بينها؟', 'The koala', 'الكوالا', { s: 'wild', x: 1, r: 'Koala' }],
  ['x03', 600, 'Which land mammal has the longest pregnancy, about 22 months?', 'أي حيوان ثديي بري له أطول فترة حمل، نحو ٢٢ شهراً؟', 'The (African) elephant', 'الفيل (الأفريقي)', { s: 'records', r: 'African elephant' }],
  ['x04', 600, 'Which tiny shrew is the smallest mammal by weight?', 'أي زبابة صغيرة هي أصغر حيوان ثديي وزناً؟', 'The Etruscan shrew', 'الزبابة الأترورية', { s: 'records', x: 1, r: 'Etruscan shrew' }],
  ['x05', 600, 'Which white antelope of Arabia was saved from extinction in the wild by breeding programmes?', 'أي ظبي أبيض من الجزيرة العربية أُنقذ من الانقراض في البرية عبر برامج الإكثار؟', 'The Arabian oryx', 'المها العربي', { s: 'arabia', r: 'Arabian oryx' }],
  ['x06', 600, 'Which marine mammal has the densest fur of any animal?', 'أي حيوان ثديي بحري لديه أكثف فراء بين الحيوانات؟', 'The sea otter', 'ثعلب الماء البحري', { s: 'records', x: 1, r: 'Sea otter' }],
]);

KH_BANK.cat('ocean', { g: 'nature', e: '🐙', en: 'Ocean Life', ar: 'الحياة البحرية',
  subs: { fish: ['Fish & sharks', 'أسماك وقروش'], creatures: ['Other sea creatures', 'كائنات بحرية أخرى'], reefs: ['Reefs & deep sea', 'شعاب وأعماق'] } }, [
  ['e01', 200, 'What is the largest fish in the world?', 'ما أكبر سمكة في العالم؟', 'The whale shark', 'القرش الحوتي', { s: 'fish', r: 'Whale shark' }],
  ['e02', 200, 'How many arms does an octopus have?', 'كم ذراعاً للأخطبوط؟', 'Eight', 'ثمانية', { s: 'creatures', alt: ['8'], r: 'Octopus' }],
  ['e03', 200, 'Which clever marine mammal communicates with clicks and whistles?', 'أي حيوان ثديي بحري ذكي يتواصل بالنقرات والصفير؟', 'The dolphin', 'الدلفين', { s: 'creatures', r: 'Dolphin' }],
  ['e04', 200, 'Which sea creature usually has five arms and can regrow lost ones?', 'أي كائن بحري له عادةً خمسة أذرع ويستطيع تجديد ما يفقده منها؟', 'The starfish (sea star)', 'نجم البحر', { s: 'creatures', r: 'Starfish' }],
  ['e05', 200, 'What do whales breathe through, on the top of their heads?', 'من أين تتنفس الحيتان، في أعلى رؤوسها؟', 'A blowhole', 'فتحة التنفس (المنفث)', { s: 'creatures', r: 'Blowhole (anatomy)' }],
  ['e06', 200, 'Which large shark was the villain of the film Jaws?', 'أي قرش كبير كان الشرير في فيلم «الفك المفترس»؟', 'The great white shark', 'القرش الأبيض الكبير', { s: 'fish', r: 'Great white shark' }],
  ['h01', 400, 'How many hearts does an octopus have?', 'كم قلباً للأخطبوط؟', 'Three', 'ثلاثة', { s: 'creatures', r: 'Octopus' }],
  ['h02', 400, 'What is the world’s largest coral reef system?', 'ما أكبر نظام للشعاب المرجانية في العالم؟', 'The Great Barrier Reef', 'الحاجز المرجاني العظيم', { s: 'reefs', r: 'Great Barrier Reef' }],
  ['h03', 400, 'Which fish can inflate itself into a spiky ball?', 'أي سمكة تستطيع نفخ نفسها لتصبح كرة شائكة؟', 'The pufferfish', 'السمكة المنتفخة', { s: 'fish', r: 'Tetraodontidae' }],
  ['h04', 400, 'Which Arctic whale has a long spiral tusk?', 'أي حوت قطبي له ناب طويل حلزوني؟', 'The narwhal', 'كركدن البحر (النروال)', { s: 'creatures', r: 'Narwhal' }],
  ['h05', 400, 'Which deep-sea fish lures prey with a glowing growth on its head?', 'أي سمكة أعماق تجذب فرائسها بزائدة مضيئة على رأسها؟', 'The anglerfish', 'سمكة أبو الشص', { s: 'reefs', r: 'Anglerfish' }],
  ['h06', 400, 'Tiny animals called polyps build which underwater structures?', 'حيوانات صغيرة تُسمّى البوليبات تبني أي تراكيب تحت الماء؟', 'Coral reefs', 'الشعاب المرجانية', { s: 'reefs', r: 'Coral reef' }],
  ['x01', 600, 'Which "living fossil" has blue blood that is used to test medicines for contamination?', 'أي «أحفورة حية» دمها أزرق ويُستخدم لاختبار تلوث الأدوية؟', 'The horseshoe crab', 'سرطان حدوة الحصان', { s: 'creatures', x: 1, r: 'Horseshoe crab' }],
  ['x02', 600, 'Which tiny jellyfish is nicknamed "immortal" because it can revert to an earlier life stage?', 'أي قنديل بحر صغير يُلقّب بـ«الخالد» لأنه يستطيع العودة إلى مرحلة حياة سابقة؟', 'Turritopsis dohrnii', 'توريتوبسيس دورني', { s: 'creatures', x: 1, alt: ['the immortal jellyfish'], r: 'Turritopsis dohrnii' }],
  ['x03', 600, 'Which whale holds the record for the deepest and longest dives of any mammal?', 'أي حوت يحمل الرقم القياسي لأعمق وأطول غوص بين الثدييات؟', 'Cuvier’s beaked whale', 'حوت كوفييه ذو المنقار', { s: 'creatures', x: 1, r: 'Cuvier\'s beaked whale' }],
  ['x04', 600, 'Which fish, with a large sail-like dorsal fin, is often called the fastest fish?', 'أي سمكة ذات زعنفة ظهرية كبيرة كالشراع تُعتبر غالباً أسرع سمكة؟', 'The sailfish', 'سمكة أبو شراع', { s: 'fish', r: 'Sailfish' }],
  ['x05', 600, 'Which small octopus with glowing blue rings is one of the most venomous sea animals?', 'أي أخطبوط صغير بحلقات زرقاء لامعة من أكثر الحيوانات البحرية سمّية؟', 'The blue-ringed octopus', 'الأخطبوط ذو الحلقات الزرقاء', { s: 'creatures', r: 'Blue-ringed octopus' }],
  ['x06', 600, 'Seahorses belong to which group of animals?', 'إلى أي مجموعة من الحيوانات ينتمي فرس البحر؟', 'Fish', 'الأسماك', { s: 'fish', x: 1, r: 'Seahorse' }],
]);

KH_BANK.cat('birds-reptiles', { g: 'nature', e: '🦅', en: 'Birds & Reptiles', ar: 'طيور وزواحف',
  subs: { birds: ['Birds', 'طيور'], reptiles: ['Reptiles', 'زواحف'] } }, [
  ['e01', 200, 'What is the largest bird in the world, which cannot fly?', 'ما أكبر طائر في العالم، ولا يستطيع الطيران؟', 'The ostrich', 'النعامة', { s: 'birds', r: 'Common ostrich' }],
  ['e02', 200, 'Which reptile is famous for changing colour?', 'أي زاحف يشتهر بتغيير لونه؟', 'The chameleon', 'الحرباء', { s: 'reptiles', r: 'Chameleon' }],
  ['e03', 200, 'Which tiny bird can hover and even fly backwards?', 'أي طائر صغير يستطيع التحليق في مكانه بل والطيران إلى الخلف؟', 'The hummingbird', 'الطائر الطنان', { s: 'birds', r: 'Hummingbird' }],
  ['e04', 200, 'Which bird is the national symbol of the United States?', 'أي طائر هو الرمز الوطني للولايات المتحدة؟', 'The bald eagle', 'النسر الأصلع', { s: 'birds', r: 'Bald eagle' }],
  ['e05', 200, 'Which bird of prey is used in the traditional Arabian sport of hunting with birds?', 'أي طائر جارح يُستخدم في رياضة الصيد العربية التقليدية بالطيور؟', 'The falcon', 'الصقر', { s: 'birds', r: 'Falconry' }],
  ['e06', 200, 'Which reptile carries its home on its back?', 'أي زاحف يحمل بيته على ظهره؟', 'The turtle (or tortoise)', 'السلحفاة', { s: 'reptiles', r: 'Turtle' }],
  ['h01', 400, 'What is the largest living reptile?', 'ما أكبر زاحف حي؟', 'The saltwater crocodile', 'تمساح المياه المالحة', { f: 'saltie', s: 'reptiles', r: 'Saltwater crocodile' }],
  ['h02', 400, 'Which is the heaviest snake in the world?', 'ما أثقل ثعبان في العالم؟', 'The green anaconda', 'الأناكوندا الخضراء', { s: 'reptiles', r: 'Green anaconda' }],
  ['h03', 400, 'Which bird has the largest wingspan of any living bird?', 'أي طائر لديه أكبر امتداد للجناحين بين الطيور الحية؟', 'The wandering albatross', 'القطرس الجوّال', { s: 'birds', r: 'Wandering albatross' }],
  ['h04', 400, 'Which bird is the fastest animal on Earth when diving?', 'أي طائر هو أسرع حيوان على الأرض أثناء الانقضاض؟', 'The peregrine falcon', 'صقر الشاهين', { s: 'birds', r: 'Peregrine falcon' }],
  ['h05', 400, 'What is the largest living lizard?', 'ما أكبر سحلية حية؟', 'The Komodo dragon', 'تنين كومودو', { s: 'reptiles', r: 'Komodo dragon' }],
  ['h06', 400, 'Which is the largest species of penguin?', 'ما أكبر أنواع البطاريق؟', 'The emperor penguin', 'البطريق الإمبراطوري', { s: 'birds', r: 'Emperor penguin' }],
  ['x01', 600, 'What is a baby swan called?', 'ماذا يُسمّى صغير البجعة؟', 'A cygnet', 'سيغنت (Cygnet)', { s: 'birds', x: 1, r: 'Swan' }],
  ['x02', 600, 'Which New Zealand reptile is the only survivor of an ancient order and has a "third eye"?', 'أي زاحف من نيوزيلندا هو الناجي الوحيد من رتبة قديمة ولديه «عين ثالثة»؟', 'The tuatara', 'التواتارا', { s: 'reptiles', x: 1, r: 'Tuatara' }],
  ['x03', 600, 'Which bird lays one of the largest eggs relative to its body size?', 'أي طائر يضع واحدة من أكبر البيضات قياساً بحجم جسمه؟', 'The kiwi', 'الكيوي', { s: 'birds', r: 'Kiwi (bird)' }],
  ['x04', 600, 'What is the world’s longest venomous snake?', 'ما أطول ثعبان سام في العالم؟', 'The king cobra', 'الكوبرا الملكية', { s: 'reptiles', r: 'King cobra' }],
  ['x05', 600, 'What is a group of crows traditionally called?', 'ماذا تُسمّى مجموعة الغربان تقليدياً بالإنجليزية؟', 'A murder', 'Murder («جريمة»)', { s: 'birds', x: 1, r: 'List of English terms of venery, by animal' }],
  ['x06', 600, 'What colour are flamingo chicks when they hatch?', 'ما لون فراخ النحام (الفلامنغو) عند الفقس؟', 'Grey (or white)', 'رمادي (أو أبيض)', { s: 'birds', x: 1, n: 'They turn pink from pigments in their food.', nAr: 'يصبح لونها وردياً من الأصباغ في غذائها.', r: 'Flamingo' }],
]);

KH_BANK.cat('prehistoric', { g: 'nature', niche: 1, e: '🦖', en: 'Dinosaurs & Extinct Animals', ar: 'ديناصورات وحيوانات منقرضة',
  subs: { dinos: ['Dinosaurs', 'ديناصورات'], extinct: ['Extinct animals', 'حيوانات منقرضة'], science: ['Fossils & science', 'أحافير وعلوم'] } }, [
  ['e01', 200, 'Which dinosaur’s name means "tyrant lizard king"?', 'أي ديناصور يعني اسمه «ملك السحالي الطاغية»؟', 'Tyrannosaurus rex', 'تيرانوصور ركس', { s: 'dinos', alt: ['T. rex'], r: 'Tyrannosaurus' }],
  ['e02', 200, 'What is thought to have wiped out most dinosaurs?', 'ما الذي يُعتقد أنه قضى على معظم الديناصورات؟', 'An asteroid (or comet) impact', 'اصطدام كويكب (أو مذنب)', { s: 'science', r: 'Cretaceous–Paleogene extinction event' }],
  ['e03', 200, 'Which flightless bird from Mauritius became a famous symbol of extinction?', 'أي طائر لا يطير من موريشيوس أصبح رمزاً شهيراً للانقراض؟', 'The dodo', 'الدودو', { s: 'extinct', r: 'Dodo' }],
  ['e04', 200, 'Which plant-eating dinosaur had three horns on its face?', 'أي ديناصور عاشب كان على وجهه ثلاثة قرون؟', 'Triceratops', 'ترايسيراتوبس', { s: 'dinos', r: 'Triceratops' }],
  ['e05', 200, 'Which hairy, tusked relative of the elephant lived in the Ice Age?', 'أي قريب للفيل مكسو بالشعر وله أنياب عاش في العصر الجليدي؟', 'The woolly mammoth', 'الماموث الصوفي', { s: 'extinct', r: 'Woolly mammoth' }],
  ['e06', 200, 'Flying reptiles that lived alongside dinosaurs are called what?', 'ماذا تُسمّى الزواحف الطائرة التي عاشت مع الديناصورات؟', 'Pterosaurs', 'التيروصورات', { s: 'dinos', alt: ['pterodactyls'], r: 'Pterosaur' }],
  ['h01', 400, 'In which geological period did T. rex live?', 'في أي عصر جيولوجي عاش التيرانوصور ركس؟', 'The Cretaceous', 'العصر الطباشيري', { s: 'science', r: 'Tyrannosaurus' }],
  ['h02', 400, 'Which dinosaur had large plates along its back and a spiked tail?', 'أي ديناصور كانت على ظهره صفائح كبيرة وله ذيل شائك؟', 'Stegosaurus', 'ستيغوصور', { s: 'dinos', r: 'Stegosaurus' }],
  ['h03', 400, 'What is a scientist who studies fossils called?', 'ماذا يُسمّى العالم الذي يدرس الأحافير؟', 'A palaeontologist', 'عالم الأحافير (الحفريات)', { s: 'science', alt: ['paleontologist'], r: 'Paleontology' }],
  ['h04', 400, 'About how many million years ago did the non-bird dinosaurs die out?', 'منذ نحو كم مليون سنة انقرضت الديناصورات غير الطائرة؟', 'About 66 million', 'نحو ٦٦ مليون سنة', { s: 'science', r: 'Cretaceous–Paleogene extinction event' }],
  ['h05', 400, 'Which long-necked dinosaur was famously confused with "Brontosaurus"?', 'أي ديناصور طويل العنق اختُلط شهيراً بينه وبين «البرونتوصور»؟', 'Apatosaurus', 'أباتوصور', { s: 'dinos', r: 'Apatosaurus' }],
  ['h06', 400, 'What is the scientific name of the famous sabre-toothed cat?', 'ما الاسم العلمي للقط ذي الأسنان السيفية الشهير؟', 'Smilodon', 'سميلودون', { s: 'extinct', r: 'Smilodon' }],
  ['h07', 400, 'Which giant prehistoric shark could reach around 15 metres or more?', 'أي قرش عملاق من عصور ما قبل التاريخ كان يصل طوله إلى نحو ١٥ متراً أو أكثر؟', 'Megalodon', 'ميغالودون', { s: 'extinct', r: 'Megalodon' }],
  ['x01', 600, 'What is the name of the Mexican crater linked to the dinosaur extinction?', 'ما اسم الفوهة المكسيكية المرتبطة بانقراض الديناصورات؟', 'Chicxulub', 'تشيكشولوب', { s: 'science', r: 'Chicxulub crater' }],
  ['x02', 600, 'What is the name of the famous T. rex skeleton at Chicago’s Field Museum?', 'ما اسم هيكل التيرانوصور الشهير في متحف فيلد بشيكاغو؟', 'Sue', 'سو', { s: 'dinos', x: 1, r: 'Sue (dinosaur)' }],
  ['x03', 600, 'What does the name "Velociraptor" mean?', 'ماذا يعني اسم «فيلوسيرابتور»؟', 'Swift seizer (swift thief)', 'اللص السريع', { s: 'dinos', x: 1, r: 'Velociraptor' }],
  ['x04', 600, 'Which striped marsupial predator, the "Tasmanian tiger", is believed to have died out in 1936?', 'أي مفترس جرابي مخطط، «النمر التسماني»، يُعتقد أنه انقرض عام ١٩٣٦؟', 'The thylacine', 'الثيلاسين', { s: 'extinct', r: 'Thylacine' }],
  ['x05', 600, 'Which North American bird once flew in flocks of billions but was extinct by 1914?', 'أي طائر من أمريكا الشمالية كان يطير في أسراب بالمليارات وانقرض بحلول ١٩١٤؟', 'The passenger pigeon', 'الحمام المهاجر', { s: 'extinct', r: 'Passenger pigeon' }],
  ['x06', 600, 'Which feathered dinosaur, found in Germany in the 1860s, is a famous link between dinosaurs and birds?', 'أي ديناصور ذو ريش اكتُشف في ألمانيا في ستينيات القرن التاسع عشر يُعتبر حلقة وصل شهيرة بين الديناصورات والطيور؟', 'Archaeopteryx', 'الأركيوبتركس', { s: 'science', r: 'Archaeopteryx' }],
]);

KH_BANK.cat('plants-bugs', { g: 'nature', e: '🌵', en: 'Plants, Insects & Fungi', ar: 'نباتات وحشرات وفطريات',
  subs: { plants: ['Plants', 'نباتات'], insects: ['Insects & spiders', 'حشرات وعناكب'], fungi: ['Fungi', 'فطريات'] } }, [
  ['e01', 200, 'What do caterpillars turn into?', 'إلى ماذا تتحول اليرقات (اليساريع)؟', 'Butterflies or moths', 'فراشات أو عثّ', { s: 'insects', r: 'Caterpillar' }],
  ['e02', 200, 'How many legs does an insect have?', 'كم رجلاً للحشرة؟', 'Six', 'ست', { s: 'insects', alt: ['6'], r: 'Insect' }],
  ['e03', 200, 'Which beetle lights up at night?', 'أي خنفساء تضيء في الليل؟', 'The firefly', 'اليراعة (سراج الليل)', { s: 'insects', r: 'Firefly' }],
  ['e04', 200, 'Which tree grows acorns?', 'أي شجرة تنتج البلوط (الجوز البلوطي)؟', 'The oak', 'شجرة البلوط', { s: 'plants', r: 'Acorn' }],
  ['e05', 200, 'What does a cactus store in its thick stem?', 'ماذا يخزّن الصبّار في ساقه السميكة؟', 'Water', 'الماء', { s: 'plants', r: 'Cactus' }],
  ['e06', 200, 'Mushrooms belong to which kingdom of life?', 'إلى أي مملكة من الكائنات الحية ينتمي الفطر؟', 'Fungi', 'الفطريات', { s: 'fungi', r: 'Fungus' }],
  ['h01', 400, 'Which tree species grows the tallest?', 'أي نوع من الأشجار هو الأطول؟', 'The coast redwood', 'الخشب الأحمر الساحلي', { s: 'plants', alt: ['redwood'], r: 'Sequoia sempervirens' }],
  ['h02', 400, 'Which plant has the largest single flower in the world?', 'أي نبات له أكبر زهرة مفردة في العالم؟', 'Rafflesia arnoldii', 'رافليسيا أرنولدي', { s: 'plants', alt: ['Rafflesia'], r: 'Rafflesia arnoldii' }],
  ['h03', 400, 'Which plant snaps its leaves shut to trap insects?', 'أي نبات يُغلق أوراقه فجأة ليصطاد الحشرات؟', 'The Venus flytrap', 'خانق الذباب (فينوس)', { s: 'plants', r: 'Venus flytrap' }],
  ['h04', 400, 'Which insect is famous for carrying many times its own body weight?', 'أي حشرة تشتهر بحمل أضعاف وزنها؟', 'The ant', 'النملة', { s: 'insects', r: 'Ant' }],
  ['h05', 400, 'What is the change from caterpillar to butterfly called?', 'ماذا يُسمّى التحول من يرقة إلى فراشة؟', 'Metamorphosis', 'التحول (الانسلاخ الكامل)', { s: 'insects', r: 'Metamorphosis' }],
  ['h06', 400, 'What is the fear of spiders called?', 'ماذا يُسمّى الخوف من العناكب؟', 'Arachnophobia', 'رهاب العناكب', { s: 'insects', r: 'Arachnophobia' }],
  ['x01', 600, 'Which honey fungus in Oregon is one of the largest living organisms by area?', 'أي فطر عسلي في ولاية أوريغون من أكبر الكائنات الحية مساحةً؟', 'Armillaria (honey fungus, the "Humongous Fungus")', 'فطر أرميلاريا (الفطر العسلي)', { s: 'fungi', x: 1, alt: ['Armillaria ostoyae'], r: 'Armillaria ostoyae' }],
  ['x02', 600, 'What is the name of the ancient Great Basin bristlecone pine thought to be over 4,800 years old?', 'ما اسم شجرة الصنوبر الشوكي القديمة التي يُعتقد أن عمرها يتجاوز ٤٨٠٠ عام؟', 'Methuselah', 'متوشالح', { s: 'plants', x: 1, r: 'Methuselah (tree)' }],
  ['x03', 600, 'The vanilla flavour comes from the pods of which type of plant?', 'نكهة الفانيليا تأتي من قرون أي نوع من النباتات؟', 'An orchid', 'نبات من الأوركيد (السحلبيات)', { s: 'plants', r: 'Vanilla' }],
  ['x04', 600, 'Which is the only continent with no native ants?', 'ما القارة الوحيدة التي لا يعيش فيها النمل أصلاً؟', 'Antarctica', 'القارة القطبية الجنوبية', { s: 'insects', x: 1, r: 'Ant' }],
  ['x05', 600, 'What is the scientific name of the date palm?', 'ما الاسم العلمي لنخلة التمر؟', 'Phoenix dactylifera', 'فينيكس داكتيليفيرا', { s: 'plants', x: 1, r: 'Date palm' }],
  ['x06', 600, 'Which tiny insect is the only pollinator of fig flowers?', 'أي حشرة صغيرة هي الملقّح الوحيد لأزهار التين؟', 'The fig wasp', 'دبور التين', { s: 'insects', r: 'Fig wasp' }],
]);

/* ---- bank/70-food.js ---- */
/* Food and drink. Brand questions use names and facts only, no logos or artwork. */
KH_BANK.cat('world-food', { g: 'food', pop: 1, e: '🍜', en: 'World Cuisine', ar: 'مطابخ العالم',
  subs: { asia: ['Asia', 'آسيا'], europe: ['Europe', 'أوروبا'], americas: ['Americas & Africa', 'الأمريكتان وأفريقيا'] } }, [
  ['e01', 200, 'Which country does sushi come from?', 'من أي بلد يأتي السوشي؟', 'Japan', 'اليابان', { s: 'asia', r: 'Sushi' }],
  ['e02', 200, 'What is the main ingredient of guacamole?', 'ما المكوّن الأساسي للغواكامولي؟', 'Avocado', 'الأفوكادو', { s: 'americas', r: 'Guacamole' }],
  ['e03', 200, 'Which country is the croissant most associated with?', 'بأي بلد يرتبط الكرواسون أكثر؟', 'France', 'فرنسا', { s: 'europe', r: 'Croissant' }],
  ['e04', 200, 'Paella is a famous rice dish from which country?', 'الباييا طبق أرز شهير من أي بلد؟', 'Spain', 'إسبانيا', { s: 'europe', r: 'Paella' }],
  ['e05', 200, 'Tacos are a classic dish from which country?', 'التاكو طبق كلاسيكي من أي بلد؟', 'Mexico', 'المكسيك', { s: 'americas', r: 'Taco' }],
  ['e06', 200, 'Which Italian dish is a flat dough base baked with toppings?', 'أي طبق إيطالي عبارة عن عجينة مسطحة تُخبز مع الإضافات؟', 'Pizza', 'البيتزا', { s: 'europe', r: 'Pizza' }],
  ['h01', 400, 'What are thin slices of raw fish served without rice called in Japanese cuisine?', 'ماذا تُسمّى شرائح السمك النيء الرقيقة التي تُقدّم بلا أرز في المطبخ الياباني؟', 'Sashimi', 'ساشيمي', { s: 'asia', r: 'Sashimi' }],
  ['h02', 400, 'Which Korean side dish is spicy fermented cabbage?', 'أي طبق جانبي كوري عبارة عن ملفوف مخمّر حار؟', 'Kimchi', 'كيمتشي', { s: 'asia', r: 'Kimchi' }],
  ['h03', 400, 'Which Indian dish of chicken in a creamy tomato sauce was created in Delhi?', 'أي طبق هندي من الدجاج بصلصة طماطم كريمية نشأ في دلهي؟', 'Butter chicken (murgh makhani)', 'دجاج بالزبدة (مرغ مكني)', { s: 'asia', r: 'Butter chicken' }],
  ['h04', 400, 'Which Vietnamese noodle soup is usually made with beef broth and herbs?', 'أي حساء نودلز فيتنامي يُصنع عادةً بمرق اللحم والأعشاب؟', 'Phở', 'فو', { s: 'asia', alt: ['Pho'], r: 'Pho' }],
  ['h05', 400, 'Which Hungarian stew is famously seasoned with paprika?', 'أي يخنة مجرية تشتهر بتتبيلها بالفلفل الحلو (البابريكا)؟', 'Goulash', 'غولاش', { s: 'europe', r: 'Goulash' }],
  ['h06', 400, 'Which cheese tops a classic Margherita pizza?', 'أي جبن يُوضع على بيتزا مارغريتا الكلاسيكية؟', 'Mozzarella', 'موزاريلا', { s: 'europe', r: 'Pizza Margherita' }],
  ['h07', 400, 'Which Canadian dish is fries topped with cheese curds and gravy?', 'أي طبق كندي عبارة عن بطاطس مقلية مع خثارة الجبن والمرق؟', 'Poutine', 'بوتين', { s: 'americas', r: 'Poutine' }],
  ['x01', 600, 'Which Peruvian dish is raw fish "cooked" in citrus juice?', 'أي طبق بيروفي عبارة عن سمك نيء «يُطهى» بعصير الحمضيات؟', 'Ceviche', 'سيفيتشي', { s: 'americas', r: 'Ceviche' }],
  ['x02', 600, 'Which Georgian bread is boat-shaped and filled with melted cheese and egg?', 'أي خبز جورجي على شكل قارب ومحشو بالجبن الذائب والبيض؟', 'Khachapuri', 'خاتشابوري', { s: 'europe', x: 1, r: 'Khachapuri' }],
  ['x03', 600, 'What is the spongy sourdough flatbread eaten across Ethiopia and Eritrea?', 'ما اسم الخبز المسطح الإسفنجي المخمّر الذي يُؤكل في إثيوبيا وإريتريا؟', 'Injera', 'إنجيرا', { s: 'americas', x: 1, r: 'Injera' }],
  ['x04', 600, 'Which French sauce is an emulsion of egg yolk, butter and lemon juice?', 'أي صلصة فرنسية عبارة عن مستحلب من صفار البيض والزبدة وعصير الليمون؟', 'Hollandaise', 'الهولنديز', { s: 'europe', r: 'Hollandaise sauce' }],
  ['x05', 600, 'The name of which Italian dessert means "pick me up"?', 'أي حلوى إيطالية يعني اسمها «ارفعني» أو «انعشني»؟', 'Tiramisu', 'تيراميسو', { s: 'europe', r: 'Tiramisu' }],
  ['x06', 600, 'Basil pesto (pesto alla genovese) comes from which Italian city?', 'صلصة البيستو بالريحان (البيستو الجنوي) من أي مدينة إيطالية؟', 'Genoa', 'جنوة', { s: 'europe', x: 1, r: 'Pesto' }],
]);

KH_BANK.cat('arab-food', { g: 'arab', e: '🍚', en: 'Arabic & Saudi Food', ar: 'المطبخ العربي والسعودي',
  subs: { saudi: ['Saudi dishes', 'أطباق سعودية'], levant: ['Levant & beyond', 'الشام وغيرها'], sweets: ['Sweets & dates', 'حلويات وتمور'] } }, [
  ['e01', 200, 'Which spiced rice and meat dish is considered Saudi Arabia’s national dish?', 'أي طبق أرز ولحم متبّل يُعتبر الطبق الوطني للسعودية؟', 'Kabsa', 'الكبسة', { s: 'saudi', r: 'Kabsa' }],
  ['e02', 200, 'Which fruit of the palm tree is traditionally served with Arabic coffee?', 'أي ثمرة من النخيل تُقدّم تقليدياً مع القهوة العربية؟', 'Dates', 'التمر', { s: 'sweets', r: 'Date palm' }],
  ['e03', 200, 'What is the main ingredient of hummus?', 'ما المكوّن الأساسي للحمّص (المتبّل)؟', 'Chickpeas', 'الحمّص (الحبوب)', { s: 'levant', r: 'Hummus' }],
  ['e04', 200, 'Which spice gives Arabic coffee its distinctive flavour?', 'أي بهار يمنح القهوة العربية نكهتها المميزة؟', 'Cardamom', 'الهيل', { s: 'saudi', r: 'Arabic coffee' }],
  ['e05', 200, 'What are deep-fried balls of ground chickpeas or fava beans called?', 'ماذا تُسمّى الكرات المقلية المصنوعة من الحمّص أو الفول المطحون؟', 'Falafel', 'الفلافل (الطعمية)', { s: 'levant', r: 'Falafel' }],
  ['e06', 200, 'Which dessert is made of layered filo pastry, nuts and syrup?', 'أي حلوى مصنوعة من طبقات عجين الفيلو والمكسرات والقطر؟', 'Baklava', 'البقلاوة', { s: 'sweets', r: 'Baklava' }],
  ['h01', 400, 'Which Levantine salad is made mostly of parsley, bulgur and tomato?', 'أي سلطة شامية تُصنع أساساً من البقدونس والبرغل والطماطم؟', 'Tabbouleh', 'التبولة', { s: 'levant', r: 'Tabbouleh' }],
  ['h02', 400, 'Which dish of meat and rice, Yemeni in origin and loved in Saudi Arabia, is traditionally cooked in an underground oven?', 'أي طبق لحم وأرز، أصله يمني ومحبوب في السعودية، يُطهى تقليدياً في فرن تحت الأرض؟', 'Mandi', 'المندي', { s: 'saudi', r: 'Mandi (food)' }],
  ['h03', 400, 'Which prized date variety is especially associated with Medina?', 'أي صنف تمر فاخر يرتبط خصوصاً بالمدينة المنورة؟', 'Ajwa', 'العجوة', { s: 'sweets', r: 'Ajwa' }],
  ['h04', 400, 'What is labneh made from?', 'مِمَّ تُصنع اللبنة؟', 'Strained yogurt', 'اللبن الزبادي المصفّى', { s: 'levant', r: 'Strained yogurt' }],
  ['h05', 400, 'Which herb mix with sesame and sumac is eaten with olive oil and bread?', 'أي خلطة أعشاب مع السمسم والسماق تُؤكل مع زيت الزيتون والخبز؟', 'Za’atar', 'الزعتر', { s: 'levant', r: 'Za\'atar' }],
  ['h06', 400, 'Which dessert of fine pastry, sweet cheese and syrup is famous in Nablus?', 'أي حلوى من العجين الرفيع والجبن الحلو والقطر تشتهر بها نابلس؟', 'Kunafa', 'الكنافة', { s: 'sweets', alt: ['Knafeh'], r: 'Knafeh' }],
  ['h07', 400, 'Grape leaves rolled around rice are known as what?', 'ورق العنب الملفوف حول الأرز يُعرف باسم ماذا؟', 'Stuffed vine leaves (warak enab / dolma)', 'ورق العنب (اليبرق / الدولمة)', { s: 'levant', alt: ['dolma', 'warak enab'], r: 'Dolma' }],
  ['x01', 600, 'Jareesh, a Najdi favourite, is made mainly from what?', 'الجريش، من الأطباق النجدية المحبوبة، يُصنع أساساً من ماذا؟', 'Crushed (cracked) wheat', 'القمح المجروش', { s: 'saudi', x: 1, r: 'Jareesh' }],
  ['x02', 600, 'Which Hijazi street food is a thin pan-fried pastry stuffed with egg and minced meat?', 'أي أكلة شعبية حجازية عبارة عن عجينة رقيقة مقلية محشوة بالبيض واللحم المفروم؟', 'Mutabbaq', 'المطبّق', { s: 'saudi', x: 1, alt: ['Murtabak'], r: 'Murtabak' }],
  ['x03', 600, 'Which creamy Hijazi rice dish is cooked in broth and milk and served with meat?', 'أي طبق أرز حجازي كريمي يُطهى بالمرق والحليب ويُقدّم مع اللحم؟', 'Saleeg', 'السليق', { s: 'saudi', x: 1, r: 'Saleeg' }],
  ['x04', 600, 'What is the small handle-less cup used to serve Arabic coffee called?', 'ما اسم الكوب الصغير بلا مقبض الذي تُقدّم فيه القهوة العربية؟', 'Finjan', 'الفنجان', { s: 'saudi', r: 'Arabic coffee' }],
  ['x05', 600, 'Which tangy red spice is ground from dried berries and sprinkled on fattoush?', 'أي بهار أحمر حامض يُطحن من ثمار مجففة ويُرش على الفتوش؟', 'Sumac', 'السماق', { s: 'levant', r: 'Sumac' }],
  ['x06', 600, 'Which Gulf sweet is small fried dough balls drizzled with date syrup?', 'أي حلوى خليجية عبارة عن كرات عجين صغيرة مقلية مع دبس التمر؟', 'Luqaimat', 'اللقيمات', { s: 'sweets', r: 'Luqaimat' }],
]);

KH_BANK.cat('fast-food', { g: 'food', pop: 1, e: '🍔', en: 'Fast Food & Snacks', ar: 'وجبات سريعة وسناكات',
  subs: { chains: ['Restaurant chains', 'سلاسل مطاعم'], snacks: ['Snacks & sweets', 'سناكات وحلويات'] } }, [
  ['e01', 200, 'Which fast-food chain is known for its golden arches?', 'أي سلسلة وجبات سريعة تشتهر بالأقواس الذهبية؟', 'McDonald’s', 'ماكدونالدز', { s: 'chains', r: 'McDonald\'s' }],
  ['e02', 200, 'What is Burger King’s signature burger called?', 'ما اسم البرغر المميز لبرغر كنغ؟', 'The Whopper', 'الوابر', { s: 'chains', r: 'Whopper' }],
  ['e03', 200, 'Which chain is famous for Colonel Sanders’ fried chicken?', 'أي سلسلة تشتهر بدجاج الكولونيل ساندرز المقلي؟', 'KFC', 'كنتاكي', { s: 'chains', f: 'kfc', r: 'KFC' }],
  ['e04', 200, 'Which chocolate bar is made of crispy wafer "fingers"?', 'أي لوح شوكولاتة مكوّن من «أصابع» ويفر مقرمشة؟', 'KitKat', 'كيت كات', { s: 'snacks', r: 'Kit Kat' }],
  ['e05', 200, 'Which snack is made by heating corn kernels until they burst?', 'أي سناك يُصنع بتسخين حبوب الذرة حتى تنفجر؟', 'Popcorn', 'الفشار', { s: 'snacks', r: 'Popcorn' }],
  ['e06', 200, 'Which sandwich chain is known for its "footlong" subs?', 'أي سلسلة ساندويتشات تشتهر بساندويتش «الفوت لونغ»؟', 'Subway', 'صب واي', { s: 'chains', r: 'Subway (restaurant)' }],
  ['h01', 400, 'Which famous fried-chicken chain was founded in Jeddah?', 'أي سلسلة دجاج مقلي شهيرة تأسست في جدة؟', 'Al Baik', 'البيك', { s: 'chains', r: 'Al Baik' }],
  ['h02', 400, 'What does KFC stand for?', 'ماذا يعني اختصار KFC؟', 'Kentucky Fried Chicken', 'دجاج كنتاكي المقلي', { s: 'chains', f: 'kfc', r: 'KFC' }],
  ['h03', 400, 'Which company makes Doritos and Lay’s crisps?', 'أي شركة تصنع شيبس دوريتوس وليز؟', 'Frito-Lay (PepsiCo)', 'فريتو لاي (بيبسيكو)', { s: 'snacks', alt: ['PepsiCo'], r: 'Frito-Lay' }],
  ['h04', 400, 'Which brand makes the Dairy Milk chocolate bar?', 'أي علامة تصنع شوكولاتة «ديري ميلك»؟', 'Cadbury', 'كادبوري', { s: 'snacks', r: 'Cadbury Dairy Milk' }],
  ['h05', 400, 'Which McDonald’s breakfast sandwich was created in 1971?', 'أي ساندويتش فطور من ماكدونالدز ابتُكر عام ١٩٧١؟', 'The Egg McMuffin', 'إيغ ماك مافن', { s: 'chains', r: 'Egg McMuffin' }],
  ['h06', 400, 'In which country was the hazelnut spread Nutella created?', 'في أي بلد ابتُكر كريم البندق «نوتيلا»؟', 'Italy', 'إيطاليا', { s: 'snacks', r: 'Nutella' }],
  ['h07', 400, 'Which company makes Kinder chocolate and Kinder Surprise eggs?', 'أي شركة تصنع شوكولاتة كيندر وبيض كيندر المفاجأة؟', 'Ferrero', 'فيريرو', { s: 'snacks', r: 'Kinder (brand)' }],
  ['x01', 600, 'What do the two Ms in M&M’s stand for?', 'ماذا يعني حرفا M في «إم آند إمز»؟', 'Mars and Murrie', 'مارس وموري', { s: 'snacks', x: 1, r: 'M&M\'s' }],
  ['x02', 600, 'Which McDonald’s franchise owner created the Big Mac in 1967?', 'أي صاحب امتياز لماكدونالدز ابتكر البيغ ماك عام ١٩٦٧؟', 'Jim Delligatti', 'جيم ديليغاتي', { s: 'chains', x: 1, r: 'Big Mac' }],
  ['x03', 600, 'What was Burger King originally called when it opened in 1953?', 'ماذا كان الاسم الأصلي لبرغر كنغ عند افتتاحه عام ١٩٥٣؟', 'Insta-Burger King', 'إنستا برغر كنغ', { s: 'chains', x: 1, r: 'Burger King' }],
  ['x04', 600, 'In which US state did the first KFC franchise open, in 1952?', 'في أي ولاية أمريكية افتُتح أول امتياز لكنتاكي عام ١٩٥٢؟', 'Utah (Salt Lake City)', 'يوتا (سولت ليك سيتي)', { s: 'chains', x: 1, f: 'kfc', r: 'KFC' }],
  ['x05', 600, 'The Snickers bar was named after what?', 'سُمّي لوح سنيكرز على اسم ماذا؟', 'A horse owned by the Mars family', 'حصان كانت تملكه عائلة مارس', { s: 'snacks', x: 1, r: 'Snickers' }],
  ['x06', 600, 'Which Japanese snack brand makes Pocky, the chocolate-dipped biscuit sticks?', 'أي علامة يابانية تصنع «بوكي»، أعواد البسكويت المغطاة بالشوكولاتة؟', 'Glico (Ezaki Glico)', 'غليكو', { s: 'snacks', r: 'Pocky' }],
]);

KH_BANK.cat('drinks', { g: 'food', e: '☕', en: 'Coffee, Tea & Drinks', ar: 'قهوة وشاي ومشروبات',
  subs: { coffee: ['Coffee', 'قهوة'], tea: ['Tea', 'شاي'], soft: ['Soft drinks', 'مشروبات غازية'] } }, [
  ['e01', 200, 'Which coffee chain has a green two-tailed siren (mermaid) logo?', 'أي سلسلة مقاهٍ شعارها حورية بحر خضراء بذيلين؟', 'Starbucks', 'ستاربكس', { s: 'coffee', r: 'Starbucks' }],
  ['e02', 200, 'Which drink is made from the leaves of the Camellia sinensis plant?', 'أي مشروب يُصنع من أوراق نبات «كاميليا سيننسيس»؟', 'Tea', 'الشاي', { s: 'tea', r: 'Tea' }],
  ['e03', 200, 'Which Taiwanese drink has chewy tapioca pearls at the bottom?', 'أي مشروب تايواني في قاعه كرات تابيوكا مطاطية؟', 'Bubble tea', 'شاي الفقاعات (بابل تي)', { s: 'tea', alt: ['boba'], r: 'Bubble tea' }],
  ['e04', 200, 'Which cola brand has a red, white and blue circular logo?', 'أي علامة كولا شعارها دائري بالأحمر والأبيض والأزرق؟', 'Pepsi', 'بيبسي', { s: 'soft', r: 'Pepsi' }],
  ['e05', 200, 'Which drink is made from roasted beans and contains caffeine?', 'أي مشروب يُصنع من حبوب محمّصة ويحتوي على الكافيين؟', 'Coffee', 'القهوة', { s: 'coffee', r: 'Coffee' }],
  ['e06', 200, 'What is an espresso topped with a thick layer of milk foam usually called?', 'ماذا يُسمّى الإسبريسو المغطى بطبقة سميكة من رغوة الحليب عادةً؟', 'A cappuccino', 'كابتشينو', { s: 'coffee', r: 'Cappuccino' }],
  ['h01', 400, 'Which country produces the most coffee in the world?', 'أي دولة تنتج أكبر كمية من القهوة في العالم؟', 'Brazil', 'البرازيل', { s: 'coffee', c: 1, asOf: '2026-06', r: 'List of countries by coffee production' }],
  ['h02', 400, 'What is the Indian spiced milk tea called?', 'ما اسم شاي الحليب الهندي المتبّل؟', 'Masala chai', 'شاي ماسالا', { s: 'tea', r: 'Masala chai' }],
  ['h03', 400, 'What is the powdered green tea used in Japanese tea ceremonies called?', 'ما اسم الشاي الأخضر المطحون المستخدم في طقوس الشاي اليابانية؟', 'Matcha', 'ماتشا', { s: 'tea', r: 'Matcha' }],
  ['h04', 400, 'Which coffee is an espresso "stained" with a small amount of milk foam?', 'أي قهوة عبارة عن إسبريسو «مُبقّع» بقليل من رغوة الحليب؟', 'Macchiato', 'ماكياتو', { s: 'coffee', r: 'Caffè macchiato' }],
  ['h05', 400, 'Which pharmacist invented Coca-Cola in 1886?', 'أي صيدلي اخترع كوكا كولا عام ١٨٨٦؟', 'John Pemberton', 'جون بيمبرتون', { s: 'soft', r: 'John Stith Pemberton' }],
  ['h06', 400, 'Which coffee species makes up most of the world’s coffee production?', 'أي نوع من البن يشكّل معظم إنتاج القهوة في العالم؟', 'Arabica', 'أرابيكا', { s: 'coffee', r: 'Coffea arabica' }],
  ['x01', 600, 'In which country did coffee drinking first spread, among Sufi communities in the 15th century?', 'في أي بلد انتشر شرب القهوة أولاً بين الصوفيين في القرن الخامس عشر؟', 'Yemen', 'اليمن', { s: 'coffee', f: 'yemen-coffee', r: 'History of coffee' }],
  ['x02', 600, 'Which Yemeni port gave its name to "mocha" coffee?', 'أي ميناء يمني سُمّيت باسمه قهوة «موكا»؟', 'Mocha (Al-Mukha)', 'المخا', { s: 'coffee', x: 1, f: 'yemen-coffee', r: 'Mocha, Yemen' }],
  ['x03', 600, 'What was Pepsi’s original name in 1893?', 'ما الاسم الأصلي لبيبسي عام ١٨٩٣؟', 'Brad’s Drink', 'مشروب براد', { s: 'soft', x: 1, r: 'Pepsi' }],
  ['x04', 600, 'Kopi luwak coffee is made from beans that have passed through which animal?', 'قهوة «كوبي لواك» تُصنع من حبوب مرّت عبر جهاز هضم أي حيوان؟', 'The (Asian palm) civet', 'زباد النخيل', { s: 'coffee', x: 1, r: 'Kopi luwak' }],
  ['x05', 600, 'Which citrus fruit flavours Earl Grey tea?', 'أي فاكهة حمضية تعطي شاي «إيرل غراي» نكهته؟', 'Bergamot', 'البرغموت', { s: 'tea', r: 'Earl Grey tea' }],
  ['x06', 600, 'What is "Merchandise 7X" said to be?', 'ما الذي يُقال إن «Merchandise 7X» هو؟', 'The secret flavouring of Coca-Cola', 'المكوّن السري لنكهة كوكا كولا', { s: 'soft', x: 1, r: 'Coca-Cola formula' }],
]);

/* ---- bank/80-brands-life.js ---- */
/* Brands, business, everyday life, traditions and language. */
KH_BANK.cat('cars', { g: 'brands', pop: 1, e: '🚗', en: 'Cars', ar: 'سيارات',
  subs: { brands: ['Brands', 'علامات'], models: ['Models', 'موديلات'], history: ['Car history', 'تاريخ السيارات'] } }, [
  ['e01', 200, 'Which company makes the Mustang?', 'أي شركة تصنع سيارة موستانغ؟', 'Ford', 'فورد', { s: 'models', r: 'Ford Mustang' }],
  ['e02', 200, 'Which Italian supercar brand has a charging bull as its badge?', 'أي علامة سيارات خارقة إيطالية شعارها ثور هائج؟', 'Lamborghini', 'لامبورغيني', { s: 'brands', r: 'Lamborghini' }],
  ['e03', 200, 'Which German brand’s badge is four interlinked rings?', 'أي علامة ألمانية شعارها أربع حلقات متشابكة؟', 'Audi', 'أودي', { s: 'brands', r: 'Audi' }],
  ['e04', 200, 'Which company makes the Corolla and the Land Cruiser?', 'أي شركة تصنع كورولا ولاند كروزر؟', 'Toyota', 'تويوتا', { s: 'models', r: 'Toyota' }],
  ['e05', 200, 'Which company makes the Model 3 and Model Y electric cars?', 'أي شركة تصنع السيارتين الكهربائيتين «موديل ٣» و«موديل Y»؟', 'Tesla', 'تسلا', { s: 'models', r: 'Tesla, Inc.' }],
  ['e06', 200, 'Which German brand’s badge is a three-pointed star?', 'أي علامة ألمانية شعارها نجمة ثلاثية الأطراف؟', 'Mercedes-Benz', 'مرسيدس بنز', { s: 'brands', alt: ['Mercedes'], r: 'Mercedes-Benz' }],
  ['h01', 400, 'Which country is Volvo originally from?', 'من أي بلد أصل شركة فولفو؟', 'Sweden', 'السويد', { s: 'brands', r: 'Volvo Cars' }],
  ['h02', 400, 'Which car brand’s name means "people’s car" in German?', 'أي علامة سيارات يعني اسمها «سيارة الشعب» بالألمانية؟', 'Volkswagen', 'فولكس فاغن', { s: 'brands', r: 'Volkswagen' }],
  ['h03', 400, 'Which company makes the 911 sports car?', 'أي شركة تصنع السيارة الرياضية ٩١١؟', 'Porsche', 'بورشه', { s: 'models', r: 'Porsche 911' }],
  ['h04', 400, 'Which Japanese brand’s logo shows the six stars of the Pleiades cluster?', 'أي علامة يابانية يُظهر شعارها النجوم الست لعنقود الثريا؟', 'Subaru', 'سوبارو', { s: 'brands', r: 'Subaru' }],
  ['h05', 400, 'Which German carmaker owns Rolls-Royce Motor Cars?', 'أي شركة سيارات ألمانية تملك رولز رويس للسيارات؟', 'BMW', 'بي إم دبليو', { s: 'brands', r: 'Rolls-Royce Motor Cars' }],
  ['h06', 400, 'Which Korean group owns a large stake in Kia?', 'أي مجموعة كورية تملك حصة كبيرة في كيا؟', 'Hyundai', 'هيونداي', { s: 'brands', r: 'Kia' }],
  ['x01', 600, 'Which tractor maker started a sports-car company after a famous argument with Enzo Ferrari?', 'أي صانع جرارات أسس شركة سيارات رياضية بعد خلاف شهير مع إنزو فيراري؟', 'Ferruccio Lamborghini', 'فيروتشيو لامبورغيني', { s: 'history', x: 1, ok: 1, r: 'Ferruccio Lamborghini' }],
  ['x02', 600, 'What does BMW stand for in English?', 'ماذا يعني اختصار BMW؟', 'Bavarian Motor Works', 'مصانع محركات بافاريا', { s: 'brands', alt: ['Bayerische Motoren Werke'], r: 'BMW' }],
  ['x03', 600, 'Which Ford car was the first mass-produced on a moving assembly line, from 1913?', 'أي سيارة فورد كانت أول سيارة تُنتج بكميات كبيرة على خط تجميع متحرك منذ ١٩١٣؟', 'The Model T', 'موديل تي', { s: 'history', r: 'Ford Model T' }],
  ['x04', 600, 'Ferrari’s prancing horse was first painted on the plane of which First World War pilot?', 'رسم الحصان الجامح لفيراري ظهر أولاً على طائرة أي طيار في الحرب العالمية الأولى؟', 'Francesco Baracca', 'فرانشيسكو باراكا', { s: 'history', x: 1, r: 'Francesco Baracca' }],
  ['x05', 600, 'What is the name of Saudi Arabia’s first national electric-car brand, announced in 2022?', 'ما اسم أول علامة سيارات كهربائية وطنية سعودية، أُعلن عنها عام ٢٠٢٢؟', 'Ceer', 'سير', { s: 'brands', x: 1, r: 'Ceer Motors' }],
  ['x06', 600, 'What is the name of the winged mascot on the bonnet of a Rolls-Royce?', 'ما اسم التمثال المجنّح على مقدمة سيارة رولز رويس؟', 'The Spirit of Ecstasy', 'روح النشوة', { s: 'brands', r: 'Spirit of Ecstasy' }],
]);

KH_BANK.cat('fashion', { g: 'brands', e: '👟', en: 'Fashion & Sneakers', ar: 'أزياء وأحذية رياضية',
  subs: { sport: ['Sportswear', 'ملابس رياضية'], luxury: ['Luxury', 'ماركات فاخرة'], high: ['High street', 'ماركات شعبية'] } }, [
  ['e01', 200, 'Which sportswear brand’s logo is the "Swoosh"?', 'أي علامة رياضية شعارها «السووش»؟', 'Nike', 'نايكي', { s: 'sport', r: 'Swoosh' }],
  ['e02', 200, 'Which brand is known for its three stripes?', 'أي علامة تشتهر بالخطوط الثلاثة؟', 'Adidas', 'أديداس', { s: 'sport', r: 'Adidas' }],
  ['e03', 200, 'Which French fashion house has a logo of two interlocking Cs?', 'أي دار أزياء فرنسية شعارها حرفا C متشابكان؟', 'Chanel', 'شانيل', { s: 'luxury', r: 'Chanel' }],
  ['e04', 200, 'Which clothing brand uses a small green crocodile as its logo?', 'أي علامة ملابس شعارها تمساح أخضر صغير؟', 'Lacoste', 'لاكوست', { s: 'high', r: 'Lacoste' }],
  ['e05', 200, 'Which brand makes the Chuck Taylor All Star sneaker?', 'أي علامة تصنع حذاء «تشاك تايلور أول ستار»؟', 'Converse', 'كونفرس', { s: 'sport', r: 'Chuck Taylor All-Stars' }],
  ['e06', 200, 'Which Italian fashion house uses the head of Medusa as its logo?', 'أي دار أزياء إيطالية شعارها رأس ميدوسا؟', 'Versace', 'فيرساتشي', { s: 'luxury', r: 'Versace' }],
  ['h01', 400, 'What does H&M stand for?', 'ماذا يعني اسم H&M؟', 'Hennes & Mauritz', 'هينيس وموريتز', { s: 'high', r: 'H&M' }],
  ['h02', 400, 'Which two brothers’ feud led to the founding of both Adidas and Puma?', 'خلاف أي أخوين أدى إلى تأسيس أديداس وبوما؟', 'The Dassler brothers (Adolf and Rudolf)', 'الأخوان داسلر (أدولف ورودولف)', { s: 'sport', alt: ['Adi and Rudolf Dassler'], r: 'Adidas' }],
  ['h03', 400, 'Which Spanish company owns Zara?', 'أي شركة إسبانية تملك زارا؟', 'Inditex', 'إنديتكس', { s: 'high', r: 'Inditex' }],
  ['h04', 400, 'Which Italian fashion house uses an interlocking double-G logo?', 'أي دار أزياء إيطالية شعارها حرفا G متشابكان؟', 'Gucci', 'غوتشي', { s: 'luxury', r: 'Gucci' }],
  ['h05', 400, 'Which French luxury house makes the famous Birkin bag?', 'أي دار فرنسية فاخرة تصنع حقيبة «بيركين» الشهيرة؟', 'Hermès', 'هيرميس', { s: 'luxury', alt: ['Hermes'], r: 'Birkin bag' }],
  ['h06', 400, 'Louis Vuitton began in 1854 making what?', 'بدأ لويس فويتون عام ١٨٥٤ بصناعة ماذا؟', 'Travel trunks (luggage)', 'صناديق السفر (الحقائب)', { s: 'luxury', r: 'Louis Vuitton' }],
  ['h07', 400, 'Which American brand makes the Classic Leather and Club C trainers?', 'أي علامة تصنع حذائي «كلاسيك ليذر» و«كلوب سي» الرياضيين؟', 'Reebok', 'ريبوك', { s: 'sport', r: 'Reebok' }],
  ['x01', 600, 'What was Nike’s original company name?', 'ما الاسم الأصلي لشركة نايكي؟', 'Blue Ribbon Sports', 'بلو ريبون سبورتس', { s: 'sport', x: 1, r: 'Nike, Inc.' }],
  ['x02', 600, 'Which student designed the Nike Swoosh in 1971?', 'أي طالبة صمّمت شعار «السووش» لنايكي عام ١٩٧١؟', 'Carolyn Davidson', 'كارولين ديفيدسون', { s: 'sport', x: 1, r: 'Carolyn Davidson' }],
  ['x03', 600, 'Before Nike made its own shoes, its founders sold which Japanese brand?', 'قبل أن تصنع نايكي أحذيتها، أي علامة يابانية كان مؤسسوها يبيعونها؟', 'Onitsuka Tiger (now ASICS)', 'أونيتسوكا تايغر (أسيكس حالياً)', { s: 'sport', x: 1, alt: ['ASICS'], r: 'Onitsuka Tiger' }],
  ['x04', 600, 'In which year was the first Air Jordan shoe released?', 'في أي عام صدر أول حذاء «إير جوردن»؟', '1985', '١٩٨٥', { s: 'sport', r: 'Air Jordan' }],
  ['x05', 600, 'ASICS is an acronym of a Latin phrase meaning what?', 'اسم «أسيكس» اختصار لعبارة لاتينية تعني ماذا؟', 'A sound mind in a sound body', 'العقل السليم في الجسم السليم', { s: 'sport', x: 1, r: 'ASICS' }],
  ['x06', 600, 'Which watch brand makes the Submariner dive watch?', 'أي علامة ساعات تصنع ساعة الغوص «صب مارينر»؟', 'Rolex', 'رولكس', { s: 'luxury', r: 'Rolex Submariner' }],
]);

KH_BANK.cat('business', { g: 'brands', e: '💼', en: 'Companies & Money', ar: 'شركات ومال',
  subs: { companies: ['Companies', 'شركات'], money: ['Money & currencies', 'المال والعملات'] } }, [
  ['e01', 200, 'Which country uses the yen?', 'أي دولة تستخدم الين؟', 'Japan', 'اليابان', { s: 'money', r: 'Japanese yen' }],
  ['e02', 200, 'Which Saudi company is one of the biggest oil producers in the world?', 'أي شركة سعودية من أكبر منتجي النفط في العالم؟', 'Saudi Aramco', 'أرامكو السعودية', { s: 'companies', alt: ['Aramco'], f: 'aramco', r: 'Saudi Aramco' }],
  ['e03', 200, 'What is the currency of the United Kingdom?', 'ما عملة المملكة المتحدة؟', 'The pound sterling', 'الجنيه الإسترليني', { s: 'money', alt: ['pound'], r: 'Pound sterling' }],
  ['e04', 200, 'Which Swedish company sells flat-pack furniture?', 'أي شركة سويدية تبيع الأثاث الذي يُركّب بنفسك؟', 'IKEA', 'إيكيا', { s: 'companies', f: 'ikea', r: 'IKEA' }],
  ['e05', 200, 'Which currency is used by most European Union countries?', 'أي عملة تستخدمها معظم دول الاتحاد الأوروبي؟', 'The euro', 'اليورو', { s: 'money', r: 'Euro' }],
  ['e06', 200, 'Which company makes the iPhone?', 'أي شركة تصنع الآيفون؟', 'Apple', 'أبل', { s: 'companies', r: 'iPhone' }],
  ['h01', 400, 'Which Danish company makes plastic building bricks?', 'أي شركة دنماركية تصنع مكعبات البناء البلاستيكية؟', 'LEGO', 'ليغو', { s: 'companies', f: 'lego', r: 'The Lego Group' }],
  ['h02', 400, 'Which country’s dinar is the highest-valued currency unit in the world?', 'دينار أي دولة هو أعلى وحدة عملة قيمةً في العالم؟', 'Kuwait', 'الكويت', { s: 'money', c: 1, asOf: '2026-06', r: 'Kuwaiti dinar' }],
  ['h03', 400, 'In finance, what does IPO stand for?', 'في المال، ماذا يعني اختصار IPO؟', 'Initial public offering', 'الطرح العام الأولي', { s: 'money', f: 'ipo', r: 'Initial public offering' }],
  ['h04', 400, 'Which stock exchange is based on Wall Street?', 'أي بورصة يقع مقرها في وول ستريت؟', 'The New York Stock Exchange', 'بورصة نيويورك', { s: 'money', alt: ['NYSE'], r: 'New York Stock Exchange' }],
  ['h05', 400, 'Which company was started in a Palo Alto garage by Bill Hewlett and Dave Packard?', 'أي شركة بدأها بيل هيوليت وديف باكارد في مرآب في بالو ألتو؟', 'HP (Hewlett-Packard)', 'إتش بي (هيوليت باكارد)', { s: 'companies', r: 'Hewlett-Packard' }],
  ['h06', 400, 'Who founded the Chinese e-commerce giant Alibaba?', 'من أسس عملاق التجارة الإلكترونية الصيني «علي بابا»؟', 'Jack Ma', 'جاك ما', { s: 'companies', r: 'Alibaba Group' }],
  ['x01', 600, 'IKEA’s name comes from the initials of its founder plus which other two things?', 'اسم «إيكيا» مأخوذ من الأحرف الأولى لمؤسسها ومن أي شيئين آخرين؟', 'His family farm (Elmtaryd) and home village (Agunnaryd)', 'مزرعة عائلته (إلمتاريد) وقريته (أغوناريد)', { s: 'companies', x: 1, f: 'ikea', r: 'IKEA' }],
  ['x02', 600, 'Toyota grew out of a company that made what?', 'نشأت تويوتا من شركة كانت تصنع ماذا؟', 'Automatic looms (weaving machines)', 'أنوال النسيج الآلية', { s: 'companies', x: 1, r: 'Toyota Industries' }],
  ['x03', 600, 'The name LEGO comes from the Danish phrase "leg godt". What does it mean?', 'اسم «ليغو» مأخوذ من العبارة الدنماركية «leg godt». ماذا تعني؟', 'Play well', 'العب جيداً', { s: 'companies', f: 'lego', r: 'The Lego Group' }],
  ['x04', 600, 'Saudi Aramco’s 2019 share listing was, at the time, the world’s largest what?', 'إدراج أسهم أرامكو السعودية عام ٢٠١٩ كان في وقته الأكبر في العالم من أي نوع؟', 'Initial public offering (IPO)', 'طرح عام أولي (اكتتاب)', { s: 'money', f: ['aramco', 'ipo'], r: 'Saudi Aramco' }],
  ['x05', 600, 'The Korean name "Samsung" means what in English?', 'ماذا يعني الاسم الكوري «سامسونج» بالعربية؟', 'Three stars', 'ثلاث نجوم', { s: 'companies', x: 1, r: 'Samsung' }],
  ['x06', 600, 'Which Japanese temple-building firm, founded in 578 AD, is often called the oldest company in history?', 'أي شركة يابانية لبناء المعابد تأسست عام ٥٧٨م تُعتبر غالباً أقدم شركة في التاريخ؟', 'Kongō Gumi', 'كونغو غومي', { s: 'companies', x: 1, r: 'Kongō Gumi' }],
]);

KH_BANK.cat('traditions', { g: 'history', e: '🎉', en: 'Festivals & Traditions', ar: 'أعياد وتقاليد',
  subs: { islamic: ['Islamic & Arab', 'إسلامية وعربية'], world: ['Around the world', 'حول العالم'] } }, [
  ['e01', 200, 'In which Islamic month do Muslims fast from dawn to sunset?', 'في أي شهر هجري يصوم المسلمون من الفجر إلى المغرب؟', 'Ramadan', 'رمضان', { s: 'islamic', r: 'Ramadan' }],
  ['e02', 200, 'Which festival marks the end of Ramadan?', 'أي عيد يأتي في نهاية رمضان؟', 'Eid al-Fitr', 'عيد الفطر', { s: 'islamic', r: 'Eid al-Fitr' }],
  ['e03', 200, 'Which festival on 31 October involves costumes and carved pumpkins?', 'أي مناسبة في ٣١ أكتوبر تتضمن الأزياء التنكرية والقرع المنحوت؟', 'Halloween', 'الهالوين', { s: 'world', r: 'Halloween' }],
  ['e04', 200, 'Which Hindu festival is known as the festival of lights?', 'أي عيد هندوسي يُعرف بعيد الأنوار؟', 'Diwali', 'ديوالي', { s: 'world', r: 'Diwali' }],
  ['e05', 200, 'Which holiday is celebrated on 25 December in many countries?', 'أي عيد يُحتفل به في ٢٥ ديسمبر في دول كثيرة؟', 'Christmas', 'عيد الميلاد', { s: 'world', r: 'Christmas' }],
  ['e06', 200, 'What is the meal that breaks the fast at sunset in Ramadan called?', 'ماذا تُسمّى الوجبة التي يُفطر عليها الصائم عند الغروب في رمضان؟', 'Iftar', 'الإفطار', { s: 'islamic', r: 'Iftar' }],
  ['h01', 400, 'Eid al-Adha takes place during which pilgrimage?', 'عيد الأضحى يأتي خلال أي شعيرة؟', 'The Hajj', 'الحج', { s: 'islamic', f: 'hajj', r: 'Eid al-Adha' }],
  ['h02', 400, 'How many animals are there in the Chinese zodiac?', 'كم حيواناً في الأبراج الصينية؟', 'Twelve', 'اثنا عشر', { s: 'world', alt: ['12'], r: 'Chinese zodiac' }],
  ['h03', 400, 'Which country celebrates the Day of the Dead (Día de Muertos)?', 'أي دولة تحتفل بـ«يوم الموتى»؟', 'Mexico', 'المكسيك', { s: 'world', r: 'Day of the Dead' }],
  ['h04', 400, 'What is the traditional Saudi sword dance, performed with drums and poetry, called?', 'ما اسم رقصة السيوف السعودية التقليدية التي تُؤدّى بالطبول والشعر؟', 'Al-Ardah', 'العرضة', { s: 'islamic', alt: ['Ardah'], r: 'Al-Ardah' }],
  ['h05', 400, 'Which Gulf tradition sees children go door to door for sweets and nuts in mid-Ramadan?', 'أي تقليد خليجي يجوب فيه الأطفال البيوت لجمع الحلويات والمكسرات في منتصف رمضان؟', 'Gergean (Qarqee’an)', 'القرقيعان', { s: 'islamic', alt: ['Garangao', 'Qirqian'], r: 'Gergean' }],
  ['h06', 400, 'In which country is hanami, cherry-blossom viewing, a spring tradition?', 'في أي دولة يُعد «هانامي»، مشاهدة أزهار الكرز، تقليداً ربيعياً؟', 'Japan', 'اليابان', { s: 'world', r: 'Hanami' }],
  ['h07', 400, 'Which Hindu spring festival is famous for throwing coloured powder?', 'أي عيد هندوسي ربيعي يشتهر برمي المساحيق الملونة؟', 'Holi', 'هولي', { s: 'world', r: 'Holi' }],
  ['x01', 600, 'In which Spanish town is La Tomatina, the tomato-throwing festival, held?', 'في أي بلدة إسبانية يُقام مهرجان «لا توماتينا» لرمي الطماطم؟', 'Buñol', 'بونيول', { s: 'world', x: 1, alt: ['Bunol'], r: 'La Tomatina' }],
  ['x02', 600, 'What is the Persian New Year, celebrated at the spring equinox, called?', 'ما اسم رأس السنة الفارسية الذي يُحتفل به عند الاعتدال الربيعي؟', 'Nowruz', 'النوروز', { s: 'world', r: 'Nowruz' }],
  ['x03', 600, 'In which Islamic month does the Hajj take place?', 'في أي شهر هجري يكون الحج؟', 'Dhu al-Hijjah', 'ذو الحجة', { s: 'islamic', f: 'hajj', r: 'Dhu al-Hijja' }],
  ['x04', 600, 'Which Japanese festival on 7 July celebrates two star-crossed lovers?', 'أي مهرجان ياباني في ٧ يوليو يحتفي بحبيبين من النجوم؟', 'Tanabata', 'تاناباتا', { s: 'world', x: 1, r: 'Tanabata' }],
  ['x05', 600, 'What do Scots call New Year’s Eve?', 'ماذا يسمّي الإسكتلنديون ليلة رأس السنة؟', 'Hogmanay', 'هوغماناي', { s: 'world', x: 1, r: 'Hogmanay' }],
  ['x06', 600, 'What is the pre-dawn meal eaten before a day of fasting in Ramadan called?', 'ما اسم الوجبة التي تُؤكل قبل الفجر استعداداً لصيام يوم في رمضان؟', 'Suhoor', 'السحور', { s: 'islamic', r: 'Suhur' }],
]);

KH_BANK.cat('arabic-lang', { g: 'arab', e: '✍️', en: 'The Arabic Language', ar: 'اللغة العربية',
  subs: { words: ['Words & grammar', 'كلمات وقواعد'], script: ['Script', 'الخط والكتابة'], heritage: ['Literary heritage', 'التراث الأدبي'] } }, [
  ['e01', 200, 'How many letters are in the Arabic alphabet?', 'كم عدد حروف الأبجدية العربية؟', '28', '٢٨ حرفاً', { s: 'script', r: 'Arabic alphabet' }],
  ['e02', 200, 'What is the opposite of the Arabic word «كبير» (big)?', 'ما عكس كلمة «كبير»؟', 'صغير (small)', 'صغير', { s: 'words', r: 'Arabic' }],
  ['e03', 200, 'What is the plural of the Arabic word «كتاب» (book)?', 'ما جمع كلمة «كتاب»؟', 'كُتُب (kutub)', 'كُتُب', { s: 'words', r: 'Broken plural' }],
  ['e04', 200, 'Arabic is called "the language of the letter …" which letter?', 'تُسمّى العربية «لغة …» أي حرف؟', 'Ḍād (ض)', 'الضاد', { s: 'heritage', r: 'Ḍād' }],
  ['e05', 200, 'In which direction is Arabic written?', 'في أي اتجاه تُكتب العربية؟', 'Right to left', 'من اليمين إلى اليسار', { s: 'script', r: 'Arabic script' }],
  ['e06', 200, 'What is the first letter of the Arabic alphabet?', 'ما أول حرف في الأبجدية العربية؟', 'Alif (ا)', 'الألف', { s: 'script', r: 'Alif' }],
  ['h01', 400, 'What is the singular of the Arabic word «أقلام» (pens)?', 'ما مفرد كلمة «أقلام»؟', 'قلم (qalam)', 'قلم', { s: 'words', r: 'Broken plural' }],
  ['h02', 400, 'How many dots are in the Arabic word «ثقة»?', 'كم نقطة في كلمة «ثقة»؟', '7', '٧ نقاط', { s: 'script', n: 'ث has 3, ق has 2, ة has 2.', nAr: 'ث = ٣، ق = ٢، ة = ٢', r: 'Arabic alphabet' }],
  ['h03', 400, 'What are the Arabic short-vowel marks such as fatha, damma and kasra called together?', 'ماذا تُسمّى علامات الحركات القصيرة مثل الفتحة والضمة والكسرة مجتمعة؟', 'Ḥarakāt (tashkīl)', 'الحركات (التشكيل)', { s: 'script', r: 'Arabic diacritics' }],
  ['h04', 400, 'What is the dual form of «كتاب» (two books)?', 'ما صيغة المثنى لكلمة «كتاب»؟', 'كتابان / كتابين (kitābān)', 'كتابان / كتابين', { s: 'words', r: 'Arabic grammar' }],
  ['h05', 400, 'What is the plural of the Arabic word «مسجد» (mosque)?', 'ما جمع كلمة «مسجد»؟', 'مساجد (masājid)', 'مساجد', { s: 'words', r: 'Broken plural' }],
  ['h06', 400, 'What is the mark that doubles a consonant in Arabic called?', 'ما اسم العلامة التي تضاعف الحرف في العربية؟', 'Shadda', 'الشدّة', { s: 'script', r: 'Shadda' }],
  ['x01', 600, 'Which angular style is one of the oldest forms of Arabic calligraphy, used in early Qur’an manuscripts?', 'أي خط زاوي يُعد من أقدم أنواع الخط العربي واستُخدم في مخطوطات المصاحف المبكرة؟', 'Kufic', 'الخط الكوفي', { s: 'script', r: 'Kufic' }],
  ['x02', 600, 'Which 8th-century grammarian wrote "Al-Kitab", a founding work of Arabic grammar?', 'أي نحوي في القرن الثامن ألّف «الكتاب»، من الأعمال المؤسسة لنحو العربية؟', 'Sibawayh', 'سيبويه', { s: 'heritage', r: 'Sibawayh' }],
  ['x03', 600, 'How many "sun letters" (al-ḥurūf al-shamsiyya) are there in Arabic?', 'كم عدد «الحروف الشمسية» في العربية؟', '14', '١٤ حرفاً', { s: 'script', x: 1, r: 'Sun and moon letters' }],
  ['x04', 600, 'What are the famous long pre-Islamic poems, said to have been hung at the Kaaba, called?', 'ماذا تُسمّى القصائد الطويلة الشهيرة من العصر الجاهلي التي يُقال إنها عُلّقت على الكعبة؟', 'The Mu’allaqat', 'المعلّقات', { s: 'heritage', r: 'Mu\'allaqat' }],
  ['x05', 600, 'Who compiled "Kitab al-Ayn", the first Arabic dictionary?', 'من ألّف «كتاب العين»، أول معجم عربي؟', 'Al-Khalil ibn Ahmad al-Farahidi', 'الخليل بن أحمد الفراهيدي', { s: 'heritage', x: 1, alt: ['al-Farahidi'], r: 'Al-Khalil ibn Ahmad al-Farahidi' }],
  ['x06', 600, 'In the old "abjad" order of Arabic letters, which word comes first?', 'في الترتيب الأبجدي القديم للحروف العربية، ما الكلمة الأولى؟', 'Abjad (أبجد)', 'أبجد', { s: 'script', x: 1, r: 'Abjad numerals' }],
]);

KH_BANK.cat('english-words', { g: 'lang', niche: 1, e: '🔤', en: 'English Words', ar: 'كلمات إنجليزية',
  subs: { grammar: ['Grammar & spelling', 'قواعد وإملاء'], origins: ['Word origins', 'أصول الكلمات'] } }, [
  ['e01', 200, 'How many letters are in the English alphabet?', 'كم حرفاً في الأبجدية الإنجليزية؟', '26', '٢٦', { s: 'grammar', r: 'English alphabet' }],
  ['e02', 200, 'Which letter is the most commonly used in written English?', 'ما الحرف الأكثر استخداماً في الإنجليزية المكتوبة؟', 'E', 'E', { s: 'grammar', r: 'Letter frequency' }],
  ['e03', 200, 'What is the plural of "mouse"?', 'ما جمع كلمة «mouse» (فأر) بالإنجليزية؟', 'Mice', 'Mice', { s: 'grammar', r: 'English plurals' }],
  ['e04', 200, 'What do you call a word with the opposite meaning to another word?', 'ماذا تُسمّى الكلمة التي تحمل معنى معاكساً لكلمة أخرى؟', 'An antonym', 'ضدّ (Antonym)', { s: 'grammar', ok: 1, r: 'Opposite (semantics)' }],
  ['e05', 200, 'What is the past tense of "go"?', 'ما صيغة الماضي من الفعل «go»؟', 'Went', 'Went', { s: 'grammar', r: 'Go (verb)' }],
  ['e06', 200, 'What do you call a word that means the same as another word?', 'ماذا تُسمّى الكلمة التي تحمل نفس معنى كلمة أخرى؟', 'A synonym', 'مرادف (Synonym)', { s: 'grammar', ok: 1, r: 'Synonym' }],
  ['h01', 400, 'What is a word that reads the same forwards and backwards, like "level", called?', 'ماذا تُسمّى الكلمة التي تُقرأ بالاتجاهين نفسها، مثل «level»؟', 'A palindrome', 'كلمة متناظرة (Palindrome)', { s: 'grammar', r: 'Palindrome' }],
  ['h02', 400, 'What is a sentence that uses every letter of the alphabet called?', 'ماذا تُسمّى الجملة التي تستخدم كل حروف الأبجدية؟', 'A pangram', 'بانغرام (Pangram)', { s: 'grammar', r: 'Pangram' }],
  ['h03', 400, 'Which of the vowels A, E, I, O and U appear in the word "rhythm"?', 'أي من حروف العلة A وE وI وO وU يظهر في كلمة «rhythm»؟', 'None of them', 'ولا واحد منها', { s: 'grammar', r: 'Rhythm' }],
  ['h04', 400, 'The English word "algebra" comes from which language?', 'كلمة «algebra» الإنجليزية مأخوذة من أي لغة؟', 'Arabic (al-jabr)', 'العربية (الجبر)', { s: 'origins', r: 'Algebra' }],
  ['h05', 400, 'What does the prefix "tri-" mean, as in "triangle"?', 'ماذا تعني البادئة «tri-» كما في «triangle»؟', 'Three', 'ثلاثة', { s: 'grammar', r: 'Tri-' }],
  ['h06', 400, 'Which letter is silent at the start of "knight"?', 'أي حرف لا يُنطق في بداية كلمة «knight»؟', 'K', 'K', { s: 'grammar', r: 'Silent letter' }],
  ['x01', 600, 'The very long word "pneumonoultramicroscopicsilicovolcanoconiosis" names what kind of illness?', 'الكلمة الطويلة جداً «pneumonoultramicroscopicsilicovolcanoconiosis» تدل على أي نوع من الأمراض؟', 'A lung disease caused by fine silica dust', 'مرض رئوي سببه غبار السيليكا الناعم', { s: 'origins', x: 1, r: 'Pneumonoultramicroscopicsilicovolcanoconiosis' }],
  ['x02', 600, 'The English word "coffee" comes ultimately from which Arabic word?', 'كلمة «coffee» الإنجليزية مأخوذة في أصلها من أي كلمة عربية؟', 'Qahwa (قهوة)', 'قهوة', { s: 'origins', r: 'Coffee' }],
  ['x03', 600, 'The English word "admiral" comes from which Arabic title?', 'كلمة «admiral» الإنجليزية مأخوذة من أي لقب عربي؟', 'Amīr (amīr al-…, "commander of the…")', 'أمير (أمير الـ…)', { s: 'origins', x: 1, r: 'Admiral' }],
  ['x04', 600, 'The Arabic word «صفر» (ṣifr) gave English both "cipher" and which other word?', 'الكلمة العربية «صفر» أعطت الإنجليزية كلمة «cipher» وأي كلمة أخرى؟', 'Zero', 'Zero (صفر)', { s: 'origins', r: 'Zero' }],
  ['x05', 600, 'The word "safari" reached English via Swahili from which language?', 'كلمة «safari» وصلت الإنجليزية عبر السواحيلية من أي لغة؟', 'Arabic (safar, "journey")', 'العربية (سَفَر)', { s: 'origins', r: 'Safari' }],
  ['x06', 600, 'What is the small dot over a lowercase "i" or "j" called?', 'ما اسم النقطة الصغيرة فوق الحرفين «i» و«j» الصغيرين؟', 'A tittle', 'Tittle', { s: 'grammar', x: 1, r: 'Tittle' }],
]);

/* ---- bank/90-media.js ---- */
/* Picture and sound questions (built-in, offline).
   Pictures: flags (flag-icons, MIT), map shapes (Natural Earth, public domain), emoji puzzles.
   Sounds: CC0 recordings (Kenney; Ben Burnes / Abstraction) and tones generated for Khatfa.
   See media/CREDITS.md. Media files have neutral names; '@key' refers to src/bank/02-media.js.
   No built-in video clips: clips can't be checked from here, so hosts add their own (official uploads only). */
(function () {
  var M = KH_BANK.more;
  var FLAG = 'flag-icons (MIT)';
  var NE = 'Natural Earth (public domain)';
  var KEN = 'Kenney, kenney.nl (CC0)';
  var BB = 'Ben Burnes / Abstraction (CC0)';
  var GEN = 'Generated for Khatfa';
  var img = function (key, alt, extra) { var m = { type: 'image', src: '@' + key, alt: alt, credit: key.indexOf('flag') === 0 ? FLAG : NE }; for (var k in extra || {}) m[k] = extra[k]; return m; };
  var snd = function (key, credit) { return { type: 'audio', src: '@' + key, credit: credit }; };
  var emo = function (e, alt) { return { type: 'image', emoji: e, alt: alt || ['An emoji puzzle', 'لغز إيموجي'] }; };
  var FQ = ['Which country’s flag is this?', 'علم أي دولة هذا؟'];
  var FZ = ['A close-up of a flag (the host can zoom out). Which country is it?', 'لقطة مقرّبة لعلم (المقدّم يقدر يبعّد الصورة). أي دولة؟'];
  var flagAlt = ['A national flag', 'علم دولة'];

  /* ---------------- flags (pictures) ---------------- */
  KH_BANK.sub('flags', 'pictures', 'Flag pictures', 'صور أعلام');
  M('flags', [
    ['p01', 200, FQ[0], FQ[1], 'Brazil', 'البرازيل', { s: 'pictures', m: img('flag-br', flagAlt) }],
    ['p02', 200, FQ[0], FQ[1], 'India', 'الهند', { s: 'pictures', m: img('flag-in', flagAlt) }],
    ['p03', 200, FQ[0], FQ[1], 'Germany', 'ألمانيا', { s: 'pictures', m: img('flag-de', flagAlt) }],
    ['p04', 200, FQ[0], FQ[1], 'The United Kingdom', 'المملكة المتحدة', { s: 'pictures', alt: ['UK', 'Britain', 'Great Britain'], altAr: ['بريطانيا'], m: img('flag-gb', flagAlt) }],
    ['p05', 200, FQ[0], FQ[1], 'China', 'الصين', { s: 'pictures', m: img('flag-cn', flagAlt) }],
    ['p06', 400, FQ[0], FQ[1], 'Argentina', 'الأرجنتين', { s: 'pictures', r: 'Flag of Argentina', m: img('flag-ar', flagAlt) }],
    ['p07', 400, FQ[0], FQ[1], 'Sweden', 'السويد', { s: 'pictures', r: 'Flag of Sweden', m: img('flag-se', flagAlt) }],
    ['p08', 400, FQ[0], FQ[1], 'Greece', 'اليونان', { s: 'pictures', r: 'Flag of Greece', m: img('flag-gr', flagAlt) }],
    ['p09', 400, FQ[0], FQ[1], 'Kenya', 'كينيا', { s: 'pictures', r: 'Flag of Kenya', m: img('flag-ke', flagAlt) }],
    ['p10', 400, FQ[0], FQ[1], 'Jamaica', 'جامايكا', { s: 'pictures', r: 'Flag of Jamaica', m: img('flag-jm', flagAlt) }],
    ['p11', 400, FQ[0], FQ[1], 'Portugal', 'البرتغال', { s: 'pictures', r: 'Flag of Portugal', m: img('flag-pt', flagAlt) }],
    ['p12', 400, FQ[0], FQ[1], 'South Africa', 'جنوب أفريقيا', { s: 'pictures', r: 'Flag of South Africa', m: img('flag-za', flagAlt) }],
    ['p13', 400, FQ[0], FQ[1], 'Vietnam', 'فيتنام', { s: 'pictures', r: 'Flag of Vietnam', m: img('flag-vn', flagAlt) }],
    ['p14', 400, FQ[0], FQ[1], 'Nigeria', 'نيجيريا', { s: 'pictures', r: 'Flag of Nigeria', m: img('flag-ng', flagAlt) }],
    ['p15', 600, FQ[0], FQ[1], 'Kiribati', 'كيريباتي', { s: 'pictures', x: 1, r: 'Flag of Kiribati', m: img('flag-ki', flagAlt) }],
    ['p16', 600, FQ[0], FQ[1], 'Seychelles', 'سيشل', { s: 'pictures', r: 'Flag of Seychelles', m: img('flag-sc', flagAlt) }],
    ['p17', 600, FZ[0], FZ[1], 'Eswatini', 'إسواتيني', { s: 'pictures', x: 1, alt: ['Swaziland'], altAr: ['سوازيلاند'], r: 'Flag of Eswatini', m: img('flag-sz', flagAlt, { reveal: 'zoom', focus: [0.5, 0.5] }) }],
    ['p18', 600, FZ[0], FZ[1], 'Sri Lanka', 'سريلانكا', { s: 'pictures', r: 'Flag of Sri Lanka', m: img('flag-lk', flagAlt, { reveal: 'zoom', focus: [0.65, 0.5] }) }],
    ['p19', 600, FZ[0], FZ[1], 'Brunei', 'بروناي', { s: 'pictures', x: 1, r: 'Flag of Brunei', m: img('flag-bn', flagAlt, { reveal: 'zoom', focus: [0.5, 0.5] }) }],
    ['p20', 600, FZ[0], FZ[1], 'Kazakhstan', 'كازاخستان', { s: 'pictures', r: 'Flag of Kazakhstan', m: img('flag-kz', flagAlt, { reveal: 'zoom', focus: [0.58, 0.45] }) }],
    ['p21', 600, FZ[0], FZ[1], 'Belize', 'بليز', { s: 'pictures', x: 1, r: 'Flag of Belize', m: img('flag-bz', flagAlt, { reveal: 'zoom', focus: [0.5, 0.5] }) }],
    ['p22', 600, FQ[0], FQ[1], 'Kyrgyzstan', 'قيرغيزستان', { s: 'pictures', r: 'Flag of Kyrgyzstan', m: img('flag-kg', flagAlt) }],
    ['p23', 600, FQ[0], FQ[1], 'Oman', 'عُمان', { s: 'pictures', r: 'Flag of Oman', m: img('flag-om', flagAlt) }],
    ['p24', 600, FZ[0], FZ[1], 'Mongolia', 'منغوليا', { s: 'pictures', r: 'Flag of Mongolia', m: img('flag-mn', flagAlt, { reveal: 'zoom', focus: [0.17, 0.5] }) }],
  ]);

  /* ---------------- map shapes & highlighted countries (new category) ---------------- */
  var SQ = ['Which country has this outline?', 'أي دولة هذا شكلها على الخريطة؟'];
  var HQ = ['Which country is highlighted in gold?', 'أي دولة ملوّنة بالذهبي على الخريطة؟'];
  var shapeAlt = ['The outline of a country, with no labels', 'حدود دولة بدون أسماء'];
  var hlAlt = ['A map region with one country highlighted in gold, no labels', 'خريطة منطقة وفيها دولة ملوّنة بالذهبي بدون أسماء'];
  KH_BANK.cat('maps', { g: 'geo', e: '🗺️', en: 'Maps & Country Shapes', ar: 'خرائط وأشكال الدول', subs: { shapes: ['Country outlines', 'أشكال الدول'], highlight: ['Highlighted on a map', 'دولة على الخريطة'] } }, [
    ['p01', 200, SQ[0], SQ[1], 'Italy', 'إيطاليا', { s: 'shapes', m: img('shape-it', shapeAlt) }],
    ['p02', 200, SQ[0], SQ[1], 'Australia', 'أستراليا', { s: 'shapes', m: img('shape-au', shapeAlt) }],
    ['p03', 200, SQ[0], SQ[1], 'India', 'الهند', { s: 'shapes', m: img('shape-in', shapeAlt) }],
    ['p04', 200, SQ[0], SQ[1], 'The United Kingdom', 'المملكة المتحدة', { s: 'shapes', alt: ['UK', 'Britain'], altAr: ['بريطانيا'], m: img('shape-gb', shapeAlt) }],
    ['p05', 200, SQ[0], SQ[1], 'Japan', 'اليابان', { s: 'shapes', m: img('shape-jp', shapeAlt) }],
    ['p06', 200, SQ[0], SQ[1], 'Madagascar', 'مدغشقر', { s: 'shapes', m: img('shape-mg', shapeAlt) }],
    ['p07', 200, HQ[0], HQ[1], 'Spain', 'إسبانيا', { s: 'highlight', m: img('hl-es', hlAlt) }],
    ['p08', 200, HQ[0], HQ[1], 'Canada', 'كندا', { s: 'highlight', m: img('hl-ca', hlAlt) }],
    ['p09', 400, SQ[0], SQ[1], 'Chile', 'تشيلي', { s: 'shapes', r: 'Chile', m: img('shape-cl', shapeAlt) }],
    ['p10', 400, SQ[0], SQ[1], 'Norway', 'النرويج', { s: 'shapes', r: 'Norway', n: 'Mainland Norway (Svalbard left out).', nAr: 'البر الرئيسي للنرويج (بدون سفالبارد).', m: img('shape-no', shapeAlt) }],
    ['p11', 400, SQ[0], SQ[1], 'Iceland', 'آيسلندا', { s: 'shapes', r: 'Iceland', m: img('shape-is', shapeAlt) }],
    ['p12', 400, SQ[0], SQ[1], 'Cuba', 'كوبا', { s: 'shapes', r: 'Cuba', m: img('shape-cu', shapeAlt) }],
    ['p13', 400, SQ[0], SQ[1], 'Egypt', 'مصر', { s: 'shapes', r: 'Egypt', m: img('shape-eg', shapeAlt) }],
    ['p14', 400, SQ[0], SQ[1], 'Mongolia', 'منغوليا', { s: 'shapes', r: 'Mongolia', m: img('shape-mn', shapeAlt) }],
    ['p15', 400, HQ[0], HQ[1], 'Ukraine', 'أوكرانيا', { s: 'highlight', r: 'Ukraine', m: img('hl-ua', hlAlt) }],
    ['p16', 400, HQ[0], HQ[1], 'Peru', 'بيرو', { s: 'highlight', r: 'Peru', m: img('hl-pe', hlAlt) }],
    ['p17', 400, HQ[0], HQ[1], 'Thailand', 'تايلاند', { s: 'highlight', r: 'Thailand', m: img('hl-th', hlAlt) }],
    ['p18', 400, HQ[0], HQ[1], 'Poland', 'بولندا', { s: 'highlight', r: 'Poland', m: img('hl-pl', hlAlt) }],
    ['p19', 400, HQ[0], HQ[1], 'Nigeria', 'نيجيريا', { s: 'highlight', r: 'Nigeria', m: img('hl-ng', hlAlt) }],
    ['p20', 400, HQ[0], HQ[1], 'Ethiopia', 'إثيوبيا', { s: 'highlight', r: 'Ethiopia', m: img('hl-et', hlAlt) }],
    ['p21', 600, SQ[0], SQ[1], 'Laos', 'لاوس', { s: 'shapes', x: 1, r: 'Laos', m: img('shape-la', shapeAlt) }],
    ['p22', 600, SQ[0], SQ[1], 'Malawi', 'مالاوي', { s: 'shapes', x: 1, r: 'Malawi', m: img('shape-mw', shapeAlt) }],
    ['p23', 600, SQ[0], SQ[1], 'Bolivia', 'بوليفيا', { s: 'shapes', r: 'Bolivia', m: img('shape-bo', shapeAlt) }],
    ['p24', 600, SQ[0], SQ[1], 'Cyprus', 'قبرص', { s: 'shapes', f: 'cyprus-shape', r: 'Cyprus', m: img('shape-cy', shapeAlt) }],
    ['p25', 600, HQ[0], HQ[1], 'Burkina Faso', 'بوركينا فاسو', { s: 'highlight', x: 1, r: 'Burkina Faso', m: img('hl-bf', hlAlt) }],
    ['p26', 600, HQ[0], HQ[1], 'Turkmenistan', 'تركمانستان', { s: 'highlight', r: 'Turkmenistan', m: img('hl-tm', hlAlt) }],
    ['p27', 600, HQ[0], HQ[1], 'Paraguay', 'باراغواي', { s: 'highlight', r: 'Paraguay', m: img('hl-py', hlAlt) }],
    ['p28', 600, HQ[0], HQ[1], 'Oman', 'عُمان', { s: 'highlight', r: 'Oman', m: img('hl-om', hlAlt) }],
  ]);

  /* ---------------- emoji puzzles ---------------- */
  var EF = ['Which film do these emoji describe?', 'أي فيلم يوصفه هالإيموجي؟'];
  var ET = ['Which TV show do these emoji describe?', 'أي مسلسل يوصفه هالإيموجي؟'];
  var EG = ['Which video game do these emoji describe?', 'أي لعبة فيديو يوصفها هالإيموجي؟'];
  var ES = ['Which song do these emoji describe?', 'أي أغنية يوصفها هالإيموجي؟'];
  var EI = ['Which English saying do these emoji describe?', 'أي مثل إنجليزي يوصفه هالإيموجي؟'];
  M('movies', [
    ['p01', 200, EF[0], EF[1], 'Jaws', 'الفك المفترس (Jaws)', { s: 'films', m: emo('🦈🏖️😱') }],
    ['p02', 200, EF[0], EF[1], 'Titanic', 'تايتانيك', { s: 'films', f: 'titanic', m: emo('🚢🧊💔') }],
    ['p03', 200, EF[0], EF[1], 'The Lord of the Rings', 'سيد الخواتم', { s: 'films', m: emo('🧙‍♂️💍🌋') }],
    ['p04', 400, EF[0], EF[1], 'E.T. the Extra-Terrestrial', 'إي.تي.', { s: 'films', alt: ['E.T.'], r: 'E.T. the Extra-Terrestrial', m: emo('👽📞🏠') }],
    ['p05', 400, EF[0], EF[1], 'Ghostbusters', 'صائدو الأشباح', { s: 'films', r: 'Ghostbusters', m: emo('👻🚫🔫') }],
    ['p06', 600, EF[0], EF[1], 'Rocky', 'روكي', { s: 'films', x: 1, r: 'Rocky', n: 'He drinks raw eggs while training.', nAr: 'يشرب بيض نيء وهو يتمرن.', m: emo('🥊🥚🏃‍♂️🪜') }],
  ]);
  M('animated', [
    ['p01', 200, EF[0], EF[1], 'The Lion King', 'الأسد الملك', { s: 'disney', m: emo('🦁👑') }],
    ['p02', 200, EF[0], EF[1], 'Up', 'فوق (Up)', { s: 'pixar', m: emo('🎈🎈🏠👴') }],
    ['p03', 200, EF[0], EF[1], 'Finding Nemo', 'البحث عن نيمو', { s: 'pixar', m: emo('🔍🐠') }],
    ['p04', 400, EF[0], EF[1], 'Ratatouille', 'راتاتوي', { s: 'pixar', r: 'Ratatouille (film)', m: emo('🐀👨‍🍳🇫🇷') }],
    ['p05', 400, EF[0], EF[1], 'WALL-E', 'وول-إي', { s: 'pixar', r: 'WALL-E', m: emo('🤖🌱🗑️🚀') }],
    ['p06', 600, EF[0], EF[1], 'Spirited Away', 'المخطوفة (Spirited Away)', { s: 'other', x: 1, r: 'Spirited Away', m: emo('👧🐷🐉🛁👻') }],
  ]);
  M('tv', [
    ['p01', 200, ET[0], ET[1], 'Friends', 'فريندز', { s: 'sitcoms', m: emo('☕🛋️👫👫👫') }],
    ['p02', 200, ET[0], ET[1], 'Squid Game', 'لعبة الحبار', { s: 'drama', m: emo('🦑🎮💰🔺⚪🟥') }],
    ['p03', 400, ET[0], ET[1], 'Breaking Bad', 'بريكنغ باد', { s: 'drama', r: 'Breaking Bad', m: emo('👨‍🏫🧪🚐🏜️') }],
    ['p04', 400, ET[0], ET[1], 'Game of Thrones', 'صراع العروش', { s: 'drama', r: 'Game of Thrones', m: emo('🐉👑❄️🔥') }],
    ['p05', 600, ET[0], ET[1], 'The Office', 'ذا أوفيس', { s: 'sitcoms', r: 'The Office (American TV series)', m: emo('🏢📄🧻☕🎥') }],
  ]);
  M('videogames', [
    ['p01', 200, EG[0], EG[1], 'Angry Birds', 'الطيور الغاضبة', { s: 'characters', m: emo('🐦😠🐷🏗️') }],
    ['p02', 400, EG[0], EG[1], 'Tetris', 'تتريس', { s: 'worlds', r: 'Tetris', m: emo('🟦🟨🟥🟩⬇️🧱') }],
    ['p03', 600, EG[0], EG[1], 'Frogger', 'فروغر', { s: 'worlds', x: 1, r: 'Frogger', m: emo('🐸🚗🚚🪵🌊') }],
  ]);
  M('gaming-history', [
    ['p01', 400, EG[0], EG[1], 'Pac-Man', 'باك-مان', { s: 'arcade', r: 'Pac-Man', m: emo('🟡👻👻🍒') }],
  ]);
  M('pop-rock', [
    ['p01', 400, ES[0], ES[1], 'Purple Rain (Prince)', 'Purple Rain (برنس)', { s: 'singers', alt: ['Purple Rain'], r: 'Purple Rain (song)', m: emo('🟣🌧️') }],
    ['p02', 600, ES[0], ES[1], 'Stairway to Heaven (Led Zeppelin)', 'Stairway to Heaven (ليد زيبلين)', { s: 'bands', alt: ['Stairway to Heaven'], r: 'Stairway to Heaven', m: emo('🪜➡️☁️😇') }],
  ]);
  KH_BANK.sub('english-words', 'idioms', 'Sayings & idioms', 'أمثال وتعابير');
  M('english-words', [
    ['p01', 200, EI[0], EI[1], 'It’s raining cats and dogs', 'تمطر قططاً وكلاباً (مطر غزير)', { s: 'idioms', m: emo('🌧️🐱🐶') }],
    ['p02', 400, EI[0], EI[1], 'Kill two birds with one stone', 'تضرب عصفورين بحجر', { s: 'idioms', r: 'Wiktionary: kill two birds with one stone', m: emo('🪨🐦🐦') }],
    ['p03', 400, EI[0], EI[1], 'Break the ice', 'كسر الجليد', { s: 'idioms', r: 'Wiktionary: break the ice', m: emo('🔨🧊🗣️') }],
    ['p04', 400, EI[0], EI[1], 'The elephant in the room', 'الفيل في الغرفة (مشكلة يتجاهلها الكل)', { s: 'idioms', r: 'Elephant in the room', m: emo('🐘🛋️🙈') }],
    ['p05', 600, EI[0], EI[1], 'Once in a blue moon', 'مرة في القمر الأزرق (نادراً جداً)', { s: 'idioms', r: 'Blue moon', m: emo('1️⃣🔵🌕') }],
    ['p06', 600, EI[0], EI[1], 'Let the cat out of the bag', 'أخرج القطة من الكيس (كشف السر)', { s: 'idioms', x: 1, r: 'Wiktionary: let the cat out of the bag', m: emo('🐱➡️👜🤫') }],
  ]);

  /* ---------------- sounds ---------------- */
  M('mammals', [
    ['s01', 200, 'Which animal makes this sound?', 'أي حيوان يطلّع هالصوت؟', 'A cat', 'قطة', { alt: ['Cat', 'Kitten'], altAr: ['قط', 'بسة'], m: snd('snd-cat', BB) }],
  ]);
  M('computing', [
    ['s01', 200, 'What is being used in this sound?', 'وش الشي اللي ينستخدم في هالصوت؟', 'A computer keyboard (typing)', 'لوحة مفاتيح كمبيوتر (طباعة)', { s: 'basics', alt: ['Keyboard', 'Typing'], m: snd('snd-typing', BB) }],
  ]);
  M('maths', [
    ['s01', 200, 'What is being thrown in this sound?', 'وش اللي ينرمى في هالصوت؟', 'Dice', 'نرد (زهر)', { s: 'famous', alt: ['A die'], altAr: ['زهر', 'زار'], m: snd('snd-dice', KEN) }],
  ]);
  M('music-world', [
    ['s01', 200, 'Which instrument is playing?', 'أي آلة موسيقية تعزف؟', 'The saxophone', 'الساكسفون', { s: 'instruments', alt: ['Sax'], m: snd('snd-sax', KEN) }],
    ['s02', 400, 'Which string instrument is this?', 'أي آلة وترية هذي؟', 'The cello', 'التشيلو', { s: 'instruments', r: 'Cello', h: 'It is played sitting down, held between the knees.', hAr: 'يعزفونها وهم جالسين، بين الركب.', m: snd('snd-cello', BB) }],
    ['s03', 400, 'Which instrument, first made from oil drums, is this?', 'أي آلة، صُنعت أول مرة من براميل النفط، هذي؟', 'The steelpan (steel drum)', 'الستيل بان (طبل الفولاذ)', { s: 'instruments', alt: ['Steel drum', 'Steel pan', 'Pan'], r: 'Steelpan', n: 'It comes from Trinidad and Tobago.', nAr: 'أصلها من ترينيداد وتوباغو.', m: snd('snd-steelpan', KEN) }],
    ['s04', 400, 'Which simple instrument makes this rising and falling sound?', 'أي آلة بسيطة تطلّع هالصوت اللي يطلع وينزل؟', 'A slide whistle', 'صافرة منزلقة (Slide whistle)', { s: 'instruments', alt: ['Swanee whistle'], r: 'Slide whistle', m: snd('snd-slidewhistle', BB) }],
    ['s05', 600, 'These strings aren’t played with a bow. What is this way of playing called?', 'هالأوتار ما تنعزف بالقوس. وش اسم طريقة العزف هذي؟', 'Pizzicato (plucking)', 'بيتسيكاتو (النقر بالأصابع)', { s: 'instruments', alt: ['Plucking', 'Pizz'], r: 'Pizzicato', m: snd('snd-pizzicato', KEN) }],
    ['s06', 600, 'This is the note orchestras usually tune to. What is its frequency in hertz?', 'هذي النغمة اللي تضبط عليها الأوركسترا عادةً. كم ترددها بالهيرتز؟', '440 Hz (the A above middle C)', '٤٤٠ هيرتز (نغمة لا)', { s: 'instruments', alt: ['440'], r: 'A440 (pitch standard)', m: snd('snd-a440', GEN) }],
  ]);
  M('gaming-history', [
    ['s01', 400, 'Music like this, made with the sound chips of old consoles and computers, is called what?', 'موسيقى زي هذي، مسوّاة بشرائح الصوت في الأجهزة والكمبيوترات القديمة، وش اسمها؟', 'Chiptune (8-bit music)', 'تشيب تيون (موسيقى ٨-بت)', { s: 'consoles', alt: ['8-bit', 'Chip music'], r: 'Chiptune', m: snd('snd-chiptune', KEN) }],
  ]);
  M('pop-rock', [
    ['s01', 400, 'This crackle comes from playing music on what?', 'هالطقطقة تطلع من تشغيل الموسيقى على وش؟', 'A vinyl record', 'أسطوانة فينيل', { s: 'history', alt: ['Record', 'Record player', 'Turntable', 'LP'], altAr: ['أسطوانة', 'قرامافون'], r: 'Phonograph record', m: snd('snd-vinyl', BB) }],
  ]);
  M('inventions', [
    ['s01', 200, 'This is Morse code. What famous message is it?', 'هذي شفرة مورس. وش الرسالة المشهورة؟', 'SOS', 'SOS (نداء استغاثة)', { s: 'comms', m: snd('snd-morse-sos', GEN) }],
    ['s02', 200, 'What everyday object makes this sound?', 'أي شي نستخدمه يومياً يطلّع هالصوت؟', 'A clock (ticking)', 'ساعة (تكتكة)', { s: 'machines', alt: ['Clock', 'Watch'], altAr: ['ساعة'], m: snd('snd-clock', GEN) }],
    ['s03', 400, 'You hear this when you pick up a landline phone in North America. What is it called?', 'تسمع هالصوت لما ترفع سماعة الهاتف الأرضي في أمريكا الشمالية. وش اسمه؟', 'The dial tone', 'نغمة الاتصال (Dial tone)', { s: 'comms', r: 'Dial tone', n: '350 Hz and 440 Hz played together.', nAr: 'نغمتين مع بعض: ٣٥٠ و٤٤٠ هيرتز.', m: snd('snd-dialtone', GEN) }],
    ['s04', 600, 'Which famous puzzle is being twisted?', 'أي لغز مشهور قاعد ينلف؟', 'A Rubik’s Cube', 'مكعب روبيك', { s: 'machines', f: 'rubik', alt: ['Rubik’s Cube', 'Rubiks cube', 'Magic cube'], r: 'Rubik\'s Cube', m: snd('snd-rubik', BB) }],
  ]);
  M('physics-chem', [
    ['s01', 400, 'As the siren passes, its pitch drops. What is this effect called?', 'لما تعدّي السيارة، صوت السرينة ينزل. وش اسم هالظاهرة؟', 'The Doppler effect', 'تأثير دوبلر', { s: 'physics', r: 'Doppler effect', m: snd('snd-doppler', GEN) }],
    ['s02', 600, 'Two notes 4 Hz apart make this wobble. What are the wobbles called?', 'نغمتين الفرق بينهم ٤ هيرتز يسوون هالتموّج. وش اسمه؟', 'Beats', 'الضربات (Beats)', { s: 'physics', alt: ['Beat frequency', 'Acoustic beats'], r: 'Beat (acoustics)', m: snd('snd-beats', GEN) }],
    ['s03', 600, 'This tone seems to rise forever but never gets higher. It is named after which scientist?', 'هالنغمة كأنها تطلع للأبد بس ما تعلى فعلاً. على اسم أي عالم؟', 'Roger Shepard (the Shepard tone)', 'روجر شيبرد (نغمة شيبرد)', { s: 'scientists', x: 1, alt: ['Shepard'], r: 'Shepard tone', m: snd('snd-shepard', GEN) }],
  ]);
  M('body', [
    ['s01', 200, 'Which organ makes this sound?', 'أي عضو في الجسم يطلّع هالصوت؟', 'The heart', 'القلب', { s: 'organs', alt: ['Heart', 'Heartbeat'], n: 'A generated heartbeat, pitched up so phone speakers can play it.', nAr: 'دقات قلب مصنّعة، صوتها أعلى شوي عشان تشتغل على سماعات الجوال.', m: snd('snd-heart', GEN) }],
  ]);
  M('plants-bugs', [
    ['s01', 400, 'Which insect is this whine imitating?', 'أي حشرة يقلّدها هالطنين؟', 'A mosquito', 'بعوضة', { s: 'insects', alt: ['Mosquito'], altAr: ['ناموسة'], r: 'Mosquito', n: 'A generated imitation, not a recording.', nAr: 'صوت مقلّد مصنّع، مو تسجيل حقيقي.', m: snd('snd-mosquito', GEN) }],
  ]);
  M('ocean', [
    ['s01', 200, 'Ships and submarines use this ping to find things underwater. What is it called?', 'السفن والغواصات تستخدم هالصوت عشان تلقى الأشياء تحت الماء. وش اسمه؟', 'Sonar', 'السونار', { s: 'reefs', m: snd('snd-sonar', GEN) }],
  ]);
})();

/* ---- bank/95-topups.js ---- */
/* Top-ups: more questions for categories defined in the other files, so every
   topic has at least 20. Each block adds one 200, one extra-niche 400 and one 600. */
const M = KH_BANK.more;
M('fb-clubs', [
  ['e21', 200, 'Which London club plays at the Emirates Stadium?', 'أي نادٍ لندني يلعب على ملعب الإمارات؟', 'Arsenal', 'أرسنال', { s: 'stadiums', r: 'Emirates Stadium' }],
  ['h21', 400, 'Which Istanbul club became the first Turkish side to win a European trophy, the 2000 UEFA Cup?', 'أي نادٍ من إسطنبول أصبح أول فريق تركي يفوز ببطولة أوروبية، كأس الاتحاد الأوروبي ٢٠٠٠؟', 'Galatasaray', 'غلطة سراي', { s: 'world', x: 1, r: '2000 UEFA Cup final' }],
  ['x21', 600, 'Which Scottish club, managed by Alex Ferguson, beat Real Madrid in the 1983 Cup Winners’ Cup final?', 'أي نادٍ إسكتلندي بقيادة أليكس فيرغسون هزم ريال مدريد في نهائي كأس الكؤوس الأوروبية ١٩٨٣؟', 'Aberdeen', 'أبردين', { s: 'europe', r: '1983 European Cup Winners\' Cup final' }],
]);
M('fb-players', [
  ['e21', 200, 'Which Brazilian striker is known as "R9" and "O Fenômeno"?', 'أي مهاجم برازيلي يُلقّب بـ«R9» و«الظاهرة»؟', 'Ronaldo (Nazário)', 'رونالدو (نازاريو)', { s: 'legends', r: 'Ronaldo (Brazilian footballer)' }],
  ['h21', 400, 'Which French striker won the 2022 Ballon d’Or?', 'أي مهاجم فرنسي فاز بالكرة الذهبية ٢٠٢٢؟', 'Karim Benzema', 'كريم بنزيمة', { s: 'awards', x: 1, alt: ['Benzema'], r: '2022 Ballon d\'Or' }],
  ['x21', 600, 'Which Portuguese winger won the 2000 Ballon d’Or?', 'أي جناح برتغالي فاز بالكرة الذهبية عام ٢٠٠٠؟', 'Luís Figo', 'لويس فيغو', { s: 'awards', alt: ['Figo'], r: '2000 Ballon d\'Or' }],
]);
M('fb-worldcup', [
  ['e21', 200, 'Which country won the 2018 World Cup in Russia?', 'أي منتخب فاز بكأس العالم ٢٠١٨ في روسيا؟', 'France', 'فرنسا', { s: 'winners', r: '2018 FIFA World Cup final' }],
  ['h21', 400, 'Who was named best player (Golden Ball) at the 2014 World Cup?', 'من نال جائزة أفضل لاعب (الكرة الذهبية) في كأس العالم ٢٠١٤؟', 'Lionel Messi', 'ليونيل ميسي', { s: 'records', x: 1, alt: ['Messi'], r: '2014 FIFA World Cup awards' }],
  ['x21', 600, 'Which country became the first to win two World Cups in a row, in 1934 and 1938?', 'أي منتخب كان أول من فاز بكأسي عالم متتاليتين في ١٩٣٤ و١٩٣٨؟', 'Italy', 'إيطاليا', { s: 'records', r: '1938 FIFA World Cup' }],
]);
M('fb-pl', [
  ['e21', 200, 'Which club plays its home games at Old Trafford?', 'أي نادٍ يلعب على ملعب أولد ترافورد؟', 'Manchester United', 'مانشستر يونايتد', { s: 'clubs', alt: ['Man United'], r: 'Old Trafford' }],
  ['h21', 400, 'Which manager won the Premier League with Chelsea in his first season, 2004–05?', 'أي مدرب فاز بالدوري الإنجليزي مع تشيلسي في موسمه الأول ٢٠٠٤–٠٥؟', 'José Mourinho', 'جوزيه مورينيو', { s: 'seasons', x: 1, alt: ['Mourinho'], r: '2004–05 Chelsea F.C. season' }],
  ['x21', 600, 'Who scored Manchester City’s title-winning goal against QPR in stoppage time in May 2012?', 'من سجّل هدف التتويج لمانشستر سيتي ضد كوينز بارك رينجرز في الوقت بدل الضائع في مايو ٢٠١٢؟', 'Sergio Agüero', 'سيرخيو أغويرو', { s: 'seasons', alt: ['Aguero'], r: '2011–12 Manchester City F.C. season' }],
]);
M('fb-ucl', [
  ['e21', 200, 'Who is the Champions League’s all-time top scorer?', 'من الهداف التاريخي لدوري أبطال أوروبا؟', 'Cristiano Ronaldo', 'كريستيانو رونالدو', { s: 'records', c: 1, asOf: '2026-06', r: 'List of UEFA Champions League top scorers' }],
  ['h21', 400, 'Which club beat Manchester City in the 2021 Champions League final?', 'أي نادٍ هزم مانشستر سيتي في نهائي دوري الأبطال ٢٠٢١؟', 'Chelsea', 'تشيلسي', { s: 'finals', x: 1, r: '2021 UEFA Champions League final' }],
  ['x21', 600, 'Who scored Bayern Munich’s late winner against Dortmund in the 2013 all-German final?', 'من سجّل هدف فوز بايرن ميونخ المتأخر ضد دورتموند في النهائي الألماني ٢٠١٣؟', 'Arjen Robben', 'آريين روبن', { s: 'finals', alt: ['Robben'], r: '2013 UEFA Champions League final' }],
]);
M('fb-arab', [
  ['e21', 200, 'Which Algerian winger starred for Leicester and Manchester City before joining Al-Ahli in 2023?', 'أي جناح جزائري تألق مع ليستر ومانشستر سيتي قبل انضمامه إلى الأهلي السعودي عام ٢٠٢٣؟', 'Riyad Mahrez', 'رياض محرز', { s: 'arab', alt: ['Mahrez'], r: 'Riyad Mahrez' }],
]);
M('basketball', [
  ['e21', 200, 'What is the NBA’s yearly exhibition game for its best players called?', 'ما اسم المباراة الاستعراضية السنوية لأفضل لاعبي الـNBA؟', 'The All-Star Game', 'مباراة كل النجوم', { s: 'history', r: 'NBA All-Star Game' }],
  ['h21', 400, 'Which German forward led the Dallas Mavericks to the 2011 NBA title?', 'أي لاعب ألماني قاد دالاس مافريكس إلى لقب الـNBA عام ٢٠١١؟', 'Dirk Nowitzki', 'ديرك نوفيتسكي', { s: 'players', x: 1, alt: ['Nowitzki'], r: 'Dirk Nowitzki' }],
  ['x21', 600, 'Which Serbian center won NBA MVP in both 2021 and 2022?', 'أي لاعب ارتكاز صربي فاز بجائزة أفضل لاعب في الـNBA عامي ٢٠٢١ و٢٠٢٢؟', 'Nikola Jokić', 'نيكولا يوكيتش', { s: 'players', alt: ['Jokic'], r: 'Nikola Jokić' }],
]);
M('f1', [
  ['e21', 200, 'Which flag is waved as the winner crosses the line?', 'أي علم يُرفع عندما يعبر الفائز خط النهاية؟', 'The chequered flag', 'العلم المربّع (الشطرنجي)', { s: 'tracks', r: 'Racing flags' }],
  ['h21', 400, 'Which team’s cars are nicknamed the "Silver Arrows"?', 'سيارات أي فريق تُلقّب بـ«الأسهم الفضية»؟', 'Mercedes', 'مرسيدس', { s: 'teams', x: 1, ok: 1, r: 'Silver Arrows' }],
  ['x21', 600, 'Which driver holds the record for the most Formula One race wins?', 'أي سائق يحمل الرقم القياسي لأكثر عدد من الانتصارات في سباقات الفورمولا ١؟', 'Lewis Hamilton', 'لويس هاميلتون', { s: 'drivers', ok: 1, c: 1, asOf: '2026-06', r: 'List of Formula One Grand Prix winners' }],
]);
M('tennis', [
  ['e21', 200, 'What is a serve that the receiver cannot even touch called?', 'ماذا يُسمّى الإرسال الذي لا يستطيع المستقبِل حتى لمسه؟', 'An ace', 'إرسال ساحق (Ace)', { s: 'rules', r: 'Ace (tennis)' }],
  ['h21', 400, 'Which Japanese player won the 2018 US Open, beating Serena Williams in the final?', 'أي لاعبة يابانية فازت ببطولة أمريكا المفتوحة ٢٠١٨ بعد فوزها على سيرينا ويليامز في النهائي؟', 'Naomi Osaka', 'ناومي أوساكا', { s: 'players', x: 1, r: 'Naomi Osaka' }],
  ['x21', 600, 'Which Spanish player beat Novak Djokovic in the 2023 Wimbledon final?', 'أي لاعب إسباني هزم نوفاك ديوكوفيتش في نهائي ويمبلدون ٢٠٢٣؟', 'Carlos Alcaraz', 'كارلوس ألكاراز', { s: 'players', alt: ['Alcaraz'], r: '2023 Wimbledon Championships – Men\'s singles' }],
]);
M('olympics', [
  ['e21', 200, 'Which medal is given to Olympic champions?', 'أي ميدالية تُمنح لأبطال الأولمبياد؟', 'Gold', 'الذهبية', { s: 'games', r: 'Olympic medal' }],
  ['h21', 400, 'Which country hosted the 2016 Summer Olympics?', 'أي دولة استضافت الألعاب الأولمبية الصيفية ٢٠١٦؟', 'Brazil (Rio de Janeiro)', 'البرازيل (ريو دي جانيرو)', { s: 'games', x: 1, alt: ['Brazil'], r: '2016 Summer Olympics' }],
  ['x21', 600, 'Which French town hosted the first Winter Olympics, in 1924?', 'أي بلدة فرنسية استضافت أول ألعاب أولمبية شتوية عام ١٩٢٤؟', 'Chamonix', 'شامونيه', { s: 'games', r: '1924 Winter Olympics' }],
]);
M('combat', [
  ['e21', 200, 'How many rounds is a men’s world-title boxing fight usually scheduled for?', 'كم جولة تُحدَّد عادةً لنزال ملاكمة على لقب عالمي للرجال؟', '12', '١٢', { s: 'boxing', r: 'Boxing' }],
  ['h21', 400, 'Which Ukrainian brothers dominated heavyweight boxing in the 2000s and early 2010s?', 'أي أخوين أوكرانيين سيطرا على الوزن الثقيل في الملاكمة في العقد الأول من الألفية وبداية الثاني؟', 'Vitali and Wladimir Klitschko', 'فيتالي وفلاديمير كليتشكو', { s: 'boxing', x: 1, alt: ['the Klitschkos'], r: 'Klitschko brothers' }],
  ['x21', 600, 'Who beat Muhammad Ali in the 1971 "Fight of the Century"?', 'من هزم محمد علي في «نزال القرن» عام ١٩٧١؟', 'Joe Frazier', 'جو فريزر', { s: 'boxing', r: 'Fight of the Century' }],
]);
M('sports-more', [
  ['e21', 200, 'In golf, what is a score of one under par on a hole called?', 'في الغولف، ماذا تُسمّى النتيجة الأقل من المعدّل بضربة واحدة في الحفرة؟', 'A birdie', 'بيردي', { s: 'golf', r: 'Birdie (golf)' }],
  ['e22', 200, 'In rugby union, how many points is a try worth?', 'في الرغبي (اتحاد)، كم نقطة تساوي المحاولة (Try)؟', 'Five', 'خمس نقاط', { s: 'other', alt: ['5'], r: 'Try (rugby)' }],
  ['h21', 400, 'Which country won the 2023 Rugby World Cup?', 'أي منتخب فاز بكأس العالم للرغبي ٢٠٢٣؟', 'South Africa', 'جنوب أفريقيا', { s: 'other', x: 1, r: '2023 Rugby World Cup final' }],
  ['x21', 600, 'In golf, what is a score of three under par on a single hole called?', 'في الغولف، ماذا تُسمّى النتيجة الأقل من المعدّل بثلاث ضربات في حفرة واحدة؟', 'An albatross (double eagle)', 'ألباتروس (دبل إيغل)', { s: 'golf', r: 'Albatross (golf)' }],
]);
M('movies', [
  ['e21', 200, 'Which actor played Tony Stark (Iron Man) in the Marvel films?', 'أي ممثل أدى دور توني ستارك (الرجل الحديدي) في أفلام مارفل؟', 'Robert Downey Jr.', 'روبرت داوني جونيور', { s: 'people', r: 'Robert Downey Jr.' }],
  ['h21', 400, 'Which 1994 film follows a man telling his life story on a bench while waiting for a bus?', 'أي فيلم عام ١٩٩٤ يتابع رجلاً يروي قصة حياته على مقعد بانتظار الحافلة؟', 'Forrest Gump', 'فورست غامب', { s: 'films', x: 1, r: 'Forrest Gump' }],
  ['x21', 600, 'Which film won the very first Academy Award for Best Picture, in 1929?', 'أي فيلم فاز بأول جائزة أوسكار لأفضل فيلم عام ١٩٢٩؟', 'Wings', 'أجنحة (Wings)', { s: 'oscars', x: 1, r: 'Wings (1927 film)' }],
]);
M('animated', [
  ['e21', 200, 'Which Disney film is about the royal sisters Anna and Elsa?', 'أي فيلم من ديزني يدور حول الأختين الملكيتين آنا وإلسا؟', 'Frozen', 'ملكة الثلج (فروزن)', { s: 'disney', f: 'frozen', r: 'Frozen (2013 film)' }],
  ['h21', 400, 'Which Pixar film takes place inside the mind of a girl named Riley?', 'أي فيلم من بيكسار تدور أحداثه داخل عقل فتاة اسمها رايلي؟', 'Inside Out', 'قلباً وقالباً (Inside Out)', { s: 'pixar', x: 1, r: 'Inside Out (2015 film)' }],
  ['x21', 600, 'What is the name of the desk lamp from Pixar’s 1986 short that became its logo?', 'ما اسم المصباح المكتبي من فيلم بيكسار القصير عام ١٩٨٦ الذي أصبح شعارها؟', 'Luxo Jr.', 'لوكسو جونيور', { s: 'pixar', r: 'Luxo Jr.' }],
]);
M('superheroes', [
  ['e21', 200, 'Which superhero is known as "the Man of Steel"?', 'أي بطل خارق يُلقّب بـ«رجل الفولاذ»؟', 'Superman', 'سوبرمان', { s: 'dc', r: 'Superman' }],
  ['h21', 400, 'What is the name of Tony Stark’s company?', 'ما اسم شركة توني ستارك؟', 'Stark Industries', 'ستارك إندستريز', { s: 'marvel', x: 1, r: 'Stark Industries' }],
  ['x21', 600, 'What name does Magneto usually go by in the X-Men comics and films, besides Max Eisenhardt?', 'ما الاسم الذي يُعرف به ماغنيتو عادةً في قصص وأفلام «إكس من»، غير ماكس آيزنهارت؟', 'Erik Lehnsherr', 'إريك لينشر', { s: 'marvel', r: 'Magneto (Marvel Comics)' }],
]);
M('tv', [
  ['e21', 200, 'Which sitcom follows the Pritchett and Dunphy family in a mockumentary style?', 'أي مسلسل كوميدي يتابع عائلتي بريتشيت ودنفي بأسلوب وثائقي ساخر؟', 'Modern Family', 'مودرن فاميلي', { s: 'sitcoms', r: 'Modern Family' }],
  ['h21', 400, 'In Breaking Bad, what is the name of Walter White’s young partner?', 'في «بريكنغ باد»، ما اسم شريك والتر وايت الشاب؟', 'Jesse Pinkman', 'جيسي بينكمان', { s: 'drama', x: 1, r: 'Jesse Pinkman' }],
  ['x21', 600, 'In Friends, what is the name of Joey’s stuffed penguin?', 'في «فريندز»، ما اسم البطريق المحشو الخاص بجوي؟', 'Hugsy', 'هَغزي', { s: 'sitcoms', x: 1, r: 'Joey Tribbiani' }],
]);
M('anime', [
  ['e21', 200, 'Which Studio Ghibli film features a wizard’s walking castle?', 'أي فيلم من استوديو جيبلي فيه قلعة ساحر تمشي؟', 'Howl’s Moving Castle', 'قلعة هاول المتحركة', { s: 'ghibli', r: 'Howl\'s Moving Castle (film)' }],
  ['h21', 400, 'What is the real name of "Deku", the hero of My Hero Academia?', 'ما الاسم الحقيقي لـ«ديكو» بطل «أكاديميتي للأبطال»؟', 'Izuku Midoriya', 'إيزوكو ميدوريا', { s: 'shonen', x: 1, r: 'Izuku Midoriya' }],
  ['x21', 600, 'In Attack on Titan, what is the innermost of the three great walls called?', 'في «هجوم العمالقة»، ما اسم أعمق الأسوار الثلاثة الكبرى؟', 'Wall Sina (Sheena)', 'سور سينا', { s: 'shonen', x: 1, alt: ['Wall Sheena'], r: 'Attack on Titan' }],
]);
M('onepiece', [
  ['e21', 200, 'Which Straw Hat is the crew’s navigator?', 'أي فرد من قبعة القش هو ملّاح الطاقم؟', 'Nami', 'نامي', { s: 'crew', r: 'Nami (One Piece)' }],
  ['h21', 400, 'Which Straw Hat is the crew’s long-nosed sniper?', 'أي فرد من قبعة القش هو قنّاص الطاقم ذو الأنف الطويل؟', 'Usopp', 'أوسوب', { s: 'crew', x: 1, r: 'Usopp' }],
  ['x21', 600, 'What was the name of Gol D. Roger’s ship?', 'ما اسم سفينة غول دي روجر؟', 'The Oro Jackson', 'أورو جاكسون', { s: 'world', x: 1, r: 'Gol D. Roger' }],
]);
M('shonen-classics', [
  ['e21', 200, 'What is Naruto’s favourite food?', 'ما أكلة ناروتو المفضلة؟', 'Ramen', 'الرامن', { s: 'naruto', alt: ['Ichiraku ramen'], r: 'Naruto Uzumaki' }],
  ['h21', 400, 'Which Ninja Academy teacher with a scar across his nose was the first to accept Naruto?', 'أي معلّم في أكاديمية النينجا بندبة على أنفه كان أول من تقبّل ناروتو؟', 'Iruka Umino', 'إيروكا أومينو', { s: 'naruto', x: 1, alt: ['Iruka'], r: 'List of Naruto characters' }],
  ['x21', 600, 'Who is the father of Chi-Chi, Goku’s wife?', 'من والد تشي تشي زوجة غوكو؟', 'The Ox-King', 'الملك الثور', { s: 'db', x: 1, r: 'List of Dragon Ball characters' }],
]);
M('pokemon', [
  ['e21', 200, 'What type is Squirtle?', 'من أي نوع بوكيمون سكويرتل؟', 'Water', 'مائي', { s: 'creatures', r: 'Squirtle' }],
  ['h21', 400, 'Which legendary bird of Kanto is Ice and Flying type?', 'أي طائر أسطوري من كانتو من نوعي الجليد والطيران؟', 'Articuno', 'أرتيكونو', { s: 'creatures', x: 1, r: 'Articuno' }],
  ['x21', 600, 'What is Ash Ketchum called in the original Japanese anime?', 'ماذا يُسمّى آش كيتشم في الأنمي الياباني الأصلي؟', 'Satoshi', 'ساتوشي', { s: 'anime', x: 1, r: 'Ash Ketchum' }],
]);
M('videogames', [
  ['e21', 200, 'Which adventure game series stars the archaeologist Lara Croft?', 'أي سلسلة ألعاب مغامرات بطلتها عالمة الآثار لارا كروفت؟', 'Tomb Raider', 'تومب رايدر', { s: 'characters', r: 'Lara Croft' }],
  ['h21', 400, 'Which 2017 game, known by four letters, set off the battle royale craze before Fortnite’s mode?', 'أي لعبة عام ٢٠١٧ تُعرف بأربعة أحرف أطلقت موضة الباتل رويال قبل طور فورتنايت؟', 'PUBG (PlayerUnknown’s Battlegrounds)', 'ببجي (PUBG)', { s: 'worlds', x: 1, r: 'PUBG: Battlegrounds' }],
  ['x21', 600, 'Who is the silent physicist hero of Half-Life?', 'من بطل «هاف لايف» الفيزيائي الصامت؟', 'Gordon Freeman', 'غوردون فريمان', { s: 'characters', r: 'Gordon Freeman' }],
]);
M('nintendo', [
  ['e21', 200, 'Which Nintendo racing series lets you throw shells and banana peels?', 'أي سلسلة سباقات من نينتندو تتيح لك رمي الأصداف وقشور الموز؟', 'Mario Kart', 'ماريو كارت', { s: 'mario', r: 'Mario Kart' }],
  ['h21', 400, 'Who is Link’s recurring arch-enemy in The Legend of Zelda?', 'من العدو اللدود المتكرر للينك في «أسطورة زيلدا»؟', 'Ganon (Ganondorf)', 'غانون (غانوندورف)', { s: 'zelda', x: 1, alt: ['Ganondorf'], r: 'Ganon' }],
  ['x21', 600, 'What was the Nintendo GameCube’s codename during development?', 'ما الاسم الرمزي لجهاز نينتندو غيم كيوب أثناء تطويره؟', 'Dolphin', 'دولفين', { s: 'company', x: 1, r: 'GameCube' }],
]);
M('gaming-history', [
  ['e21', 200, 'In games, what does "NPC" stand for?', 'في الألعاب، ماذا يعني اختصار «NPC»؟', 'Non-player character', 'شخصية غير قابلة للعب', { s: 'industry', r: 'Non-player character' }],
  ['h21', 400, 'Which 1993 id Software shooter set the template for first-person shooters?', 'أي لعبة تصويب من «إد سوفتوير» عام ١٩٩٣ رسمت ملامح ألعاب التصويب من منظور الشخص الأول؟', 'Doom', 'دووم', { s: 'arcade', x: 1, r: 'Doom (1993 video game)' }],
  ['x21', 600, 'What was Nintendo’s first home video game console, released in Japan in 1977?', 'ما أول جهاز ألعاب منزلي من نينتندو، صدر في اليابان عام ١٩٧٧؟', 'Color TV-Game', 'كولور تي في-غيم', { s: 'consoles', x: 1, r: 'Color TV-Game' }],
]);
M('hiphop', [
  ['e21', 200, 'Which rapper’s real name is Aubrey Graham?', 'أي مغني راب اسمه الحقيقي أوبري غراهام؟', 'Drake', 'دريك', { s: 'artists', ok: 1, r: 'Drake (musician)' }],
  ['h21', 400, 'Which rapper founded the collective Odd Future?', 'أي مغني راب أسس مجموعة «أود فيوتشر»؟', 'Tyler, the Creator', 'تايلر ذا كرييتور', { s: 'artists', x: 1, r: 'Odd Future' }],
  ['x21', 600, 'Watch the Throne (2011) was a joint album by Kanye West and which rapper?', 'ألبوم «Watch the Throne» (٢٠١١) كان ألبوماً مشتركاً بين كانييه ويست وأي مغني راب؟', 'Jay-Z', 'جاي زي', { s: 'albums', ok: 1, r: 'Watch the Throne' }],
]);
M('pop-rock', [
  ['e21', 200, 'Which singer is known as the "Queen of Pop" and the "Material Girl"?', 'أي مغنية تُلقّب بـ«ملكة البوب» و«الفتاة المادية»؟', 'Madonna', 'مادونا', { s: 'singers', r: 'Madonna' }],
  ['h21', 400, 'Which boy band did Harry Styles start out in?', 'في أي فرقة شبابية بدأ هاري ستايلز؟', 'One Direction', 'وان دايركشن', { s: 'bands', x: 1, r: 'One Direction' }],
  ['x21', 600, 'Which band’s 1977 album Rumours is one of the best-selling albums ever?', 'ألبوم «Rumours» عام ١٩٧٧ لأي فرقة من الأكثر مبيعاً في التاريخ؟', 'Fleetwood Mac', 'فليتوود ماك', { s: 'bands', r: 'Rumours (album)' }],
]);
M('music-world', [
  ['e21', 200, 'Which brass instrument uses a sliding tube to change notes?', 'أي آلة نحاسية تستخدم أنبوباً منزلقاً لتغيير النغمات؟', 'The trombone', 'الترومبون', { s: 'instruments', r: 'Trombone' }],
  ['h21', 400, 'Which Polish composer is famous for his nocturnes and études for solo piano?', 'أي مؤلف بولندي يشتهر بمقطوعات «النوكتورن» و«الدراسات» للبيانو المنفرد؟', 'Frédéric Chopin', 'فريدريك شوبان', { s: 'classical', x: 1, alt: ['Chopin'], r: 'Frédéric Chopin' }],
  ['x21', 600, 'Who composed "The Blue Danube" waltz?', 'من ألّف فالس «الدانوب الأزرق»؟', 'Johann Strauss II', 'يوهان شتراوس الابن', { s: 'classical', r: 'The Blue Danube' }],
]);
M('soundtracks', [
  ['e21', 200, '"Hedwig’s Theme" is the famous tune from which film series?', '«لحن هيدويغ» هو اللحن الشهير لأي سلسلة أفلام؟', 'Harry Potter', 'هاري بوتر', { s: 'scores', r: 'Hedwig\'s Theme' }],
  ['h21', 400, 'Who composed the scores for Inception and Interstellar?', 'من ألّف موسيقى فيلمي «استهلال» و«بين النجوم»؟', 'Hans Zimmer', 'هانز زيمر', { s: 'scores', x: 1, ok: 1, r: 'Hans Zimmer' }],
  ['x21', 600, 'Who composed the music for The Godfather (1972)?', 'من ألّف موسيقى فيلم «العرّاب» (١٩٧٢)؟', 'Nino Rota', 'نينو روتا', { s: 'scores', r: 'Nino Rota' }],
]);
M('capitals', [
  ['e21', 200, 'What is the capital of Argentina?', 'ما عاصمة الأرجنتين؟', 'Buenos Aires', 'بوينس آيرس', { s: 'americas', r: 'Buenos Aires' }],
  ['h21', 400, 'What is the capital of Nigeria?', 'ما عاصمة نيجيريا؟', 'Abuja', 'أبوجا', { s: 'africa', x: 1, n: 'Lagos is the largest city.', nAr: 'لاغوس أكبر مدنها.', r: 'Abuja' }],
  ['x21', 600, 'What is the capital of Mongolia?', 'ما عاصمة منغوليا؟', 'Ulaanbaatar', 'أولان باتور', { s: 'asia', r: 'Ulaanbaatar' }],
]);
M('flags', [
  ['e21', 200, 'Which country’s flag has green, white and orange vertical stripes?', 'أي دولة علمها خطوط عمودية خضراء وبيضاء وبرتقالية؟', 'Ireland', 'أيرلندا', { s: 'colours', r: 'Flag of Ireland' }],
  ['h21', 400, 'Which country’s flag shows a red-and-blue taegeuk circle with four black trigrams?', 'أي دولة يتوسط علمها دائرة «تايغوك» حمراء وزرقاء مع أربعة رموز سوداء؟', 'South Korea', 'كوريا الجنوبية', { s: 'symbols', x: 1, r: 'Flag of South Korea' }],
  ['x21', 600, 'Which country’s flag shows the temple of Angkor Wat?', 'أي دولة يظهر في علمها معبد أنغكور وات؟', 'Cambodia', 'كمبوديا', { s: 'symbols', f: 'angkor', r: 'Flag of Cambodia' }],
]);
M('landmarks', [
  ['e21', 200, 'In which Italian city is the famous Leaning Tower?', 'في أي مدينة إيطالية يقع البرج المائل الشهير؟', 'Pisa', 'بيزا', { s: 'ancient', r: 'Leaning Tower of Pisa' }],
  ['h21', 400, 'What is the official name of the London clock tower that houses Big Ben?', 'ما الاسم الرسمي لبرج الساعة في لندن الذي يضم «بيغ بن»؟', 'The Elizabeth Tower', 'برج إليزابيث', { s: 'modern', x: 1, r: 'Big Ben' }],
  ['x21', 600, 'The ancient Statue of Zeus, a wonder of the world, stood at which Greek site?', 'تمثال زيوس القديم، إحدى عجائب الدنيا، كان قائماً في أي موقع يوناني؟', 'Olympia', 'أولمبيا', { s: 'ancient', r: 'Statue of Zeus at Olympia' }],
]);
M('physical-geo', [
  ['e21', 200, 'Which ocean lies between Europe and the Americas?', 'أي محيط يقع بين أوروبا والأمريكتين؟', 'The Atlantic', 'المحيط الأطلسي', { s: 'water', r: 'Atlantic Ocean' }],
  ['h21', 400, 'What is the longest river in Europe?', 'ما أطول نهر في أوروبا؟', 'The Volga', 'نهر الفولغا', { s: 'water', x: 1, r: 'Volga' }],
  ['x21', 600, 'Counting cold deserts, which is the largest desert in the world?', 'باحتساب الصحارى الباردة، ما أكبر صحراء في العالم؟', 'Antarctica (the Antarctic Desert)', 'القارة القطبية الجنوبية (الصحراء القطبية)', { s: 'deserts', ok: 1, r: 'List of deserts by area' }],
]);
M('mideast', [
  ['e21', 200, 'What is the capital of Lebanon?', 'ما عاصمة لبنان؟', 'Beirut', 'بيروت', { s: 'gulf', r: 'Beirut' }],
]);
M('north-america', [
  ['e21', 200, 'In which US city is Hollywood?', 'في أي مدينة أمريكية تقع هوليوود؟', 'Los Angeles', 'لوس أنجلوس', { s: 'usa', r: 'Hollywood' }],
  ['h21', 400, 'What is the capital of British Columbia?', 'ما عاصمة مقاطعة كولومبيا البريطانية؟', 'Victoria', 'فيكتوريا', { s: 'canada', x: 1, n: 'Not Vancouver, the largest city.', nAr: 'ليست فانكوفر، أكبر مدنها.', r: 'Victoria, British Columbia' }],
  ['x21', 600, 'Which is the only officially bilingual (English–French) province in Canada?', 'ما المقاطعة الكندية الوحيدة ثنائية اللغة رسمياً (إنجليزية وفرنسية)؟', 'New Brunswick', 'نيو برونزويك', { s: 'canada', r: 'New Brunswick' }],
]);
M('odd-geo', [
  ['e21', 200, 'Which country is famous for windmills, tulips and canals?', 'أي دولة تشتهر بطواحين الهواء والتوليب والقنوات؟', 'The Netherlands', 'هولندا', { s: 'small', r: 'Netherlands' }],
  ['h21', 400, 'Which Alpine principality lies between Switzerland and Austria?', 'أي إمارة في جبال الألب تقع بين سويسرا والنمسا؟', 'Liechtenstein', 'ليختنشتاين', { s: 'small', x: 1, f: 'liecht', r: 'Liechtenstein' }],
  ['x21', 600, 'Which country has the highest population density in the world?', 'أي دولة لديها أعلى كثافة سكانية في العالم؟', 'Monaco', 'موناكو', { s: 'small', c: 1, asOf: '2026-06', r: 'List of countries and dependencies by population density' }],
]);
M('ancient', [
  ['e21', 200, 'Which ancient people built the Parthenon in Athens?', 'أي شعب قديم بنى البارثينون في أثينا؟', 'The ancient Greeks', 'الإغريق القدماء', { s: 'classical', r: 'Parthenon' }],
  ['h21', 400, 'Which Greek writer is called the "Father of History"?', 'أي كاتب إغريقي يُلقّب بـ«أبي التاريخ»؟', 'Herodotus', 'هيرودوت', { s: 'classical', x: 1, r: 'Herodotus' }],
  ['x21', 600, 'Which wonder of the ancient world is said to have stood in Babylon?', 'أي من عجائب الدنيا القديمة يُقال إنها كانت في بابل؟', 'The Hanging Gardens', 'الحدائق المعلّقة', { s: 'other', r: 'Hanging Gardens of Babylon' }],
]);
M('islamic-history', [
  ['e21', 200, 'In which city is the Dome of the Rock?', 'في أي مدينة تقع قبة الصخرة؟', 'Jerusalem', 'القدس', { s: 'caliphates', r: 'Dome of the Rock' }],
]);
M('modern-history', [
  ['e21', 200, 'Which liner sank on its maiden voyage in 1912 after hitting an iceberg?', 'أي سفينة ركاب غرقت في رحلتها الأولى عام ١٩١٢ بعد اصطدامها بجبل جليدي؟', 'The Titanic', 'تايتانيك', { s: 'other', f: 'titanic', r: 'Titanic' }],
  ['h21', 400, 'Which country did Germany invade on 1 September 1939?', 'أي دولة غزتها ألمانيا في ١ سبتمبر ١٩٣٩؟', 'Poland', 'بولندا', { s: 'ww', x: 1, r: 'Invasion of Poland' }],
  ['x21', 600, 'What name is given to the 1917 revolution that brought the Bolsheviks to power?', 'ما الاسم الذي يُطلق على ثورة ١٩١٧ التي أوصلت البلاشفة إلى الحكم؟', 'The October Revolution', 'ثورة أكتوبر', { s: 'other', r: 'October Revolution' }],
]);
M('inventions', [
  ['e21', 200, 'Samuel Morse’s famous code was made for sending messages by what?', 'شفرة صموئيل مورس الشهيرة صُممت لإرسال الرسائل عبر ماذا؟', 'The (electric) telegraph', 'التلغراف', { s: 'comms', r: 'Morse code' }],
  ['h21', 400, 'Which American engineer invented modern air conditioning in 1902?', 'أي مهندس أمريكي اخترع التكييف الحديث عام ١٩٠٢؟', 'Willis Carrier', 'ويليس كارير', { s: 'machines', x: 1, r: 'Willis Carrier' }],
  ['x21', 600, 'Which Hungarian architecture professor invented his famous cube puzzle in 1974?', 'أي أستاذ عمارة مجري اخترع لغز المكعب الشهير عام ١٩٧٤؟', 'Ernő Rubik', 'إرنو روبيك', { f: 'rubik', s: 'machines', alt: ['Rubik'], r: 'Ernő Rubik' }],
]);
M('rulers', [
  ['e21', 200, 'Which French queen was executed by guillotine in 1793?', 'أي ملكة فرنسية أُعدمت بالمقصلة عام ١٧٩٣؟', 'Marie Antoinette', 'ماري أنطوانيت', { s: 'modern', r: 'Marie Antoinette' }],
  ['h21', 400, 'Which English queen reigned when the Spanish Armada was defeated in 1588?', 'أي ملكة إنجليزية كانت تحكم عندما هُزم الأسطول الإسباني (الأرمادا) عام ١٥٨٨؟', 'Elizabeth I', 'إليزابيث الأولى', { s: 'modern', x: 1, r: 'Spanish Armada' }],
  ['x21', 600, 'Which German-born empress ruled Russia from 1762 to 1796?', 'أي إمبراطورة من أصل ألماني حكمت روسيا من ١٧٦٢ إلى ١٧٩٦؟', 'Catherine the Great', 'كاترين العظيمة', { s: 'modern', r: 'Catherine the Great' }],
]);
M('mythology', [
  ['e21', 200, 'Who is the Greek god of the sea?', 'من إله البحر عند الإغريق؟', 'Poseidon', 'بوسيدون', { s: 'greek', r: 'Poseidon' }],
  ['h21', 400, 'Which Greek messenger god wore winged sandals?', 'أي إله رسول عند الإغريق كان ينتعل صندلاً مجنّحاً؟', 'Hermes', 'هيرميس', { s: 'greek', x: 1, r: 'Hermes' }],
  ['x21', 600, 'In Norse myth, which giant wolf kills Odin at Ragnarök?', 'في الأساطير الإسكندنافية، أي ذئب عملاق يقتل أودين في «راغناروك»؟', 'Fenrir', 'فنرير', { s: 'norse', r: 'Fenrir' }],
]);
M('space', [
  ['e21', 200, 'What is the name of our galaxy?', 'ما اسم مجرتنا؟', 'The Milky Way', 'درب التبانة', { s: 'stars', r: 'Milky Way' }],
  ['h21', 400, 'Which former planet was reclassified as a dwarf planet in 2006?', 'أي كوكب سابق أُعيد تصنيفه كوكباً قزماً عام ٢٠٠٦؟', 'Pluto', 'بلوتو', { s: 'planets', x: 1, r: 'Pluto' }],
  ['x21', 600, 'Which moon of Jupiter is the largest moon in the Solar System?', 'أي قمر من أقمار المشتري هو أكبر قمر في المجموعة الشمسية؟', 'Ganymede', 'غانيميد', { s: 'planets', r: 'Ganymede (moon)' }],
]);
M('physics-chem', [
  ['e21', 200, 'What is the common name for H₂O?', 'ما الاسم الشائع للمركب H₂O؟', 'Water', 'الماء', { s: 'elements', r: 'Water' }],
  ['h21', 400, 'What is the chemical symbol for sodium?', 'ما الرمز الكيميائي للصوديوم؟', 'Na', 'Na', { s: 'elements', x: 1, n: 'From the Latin natrium.', nAr: 'من الكلمة اللاتينية Natrium.', r: 'Sodium' }],
  ['x21', 600, 'Who discovered radioactivity, in 1896?', 'من اكتشف النشاط الإشعاعي عام ١٨٩٦؟', 'Henri Becquerel', 'هنري بيكريل', { s: 'scientists', r: 'Henri Becquerel' }],
]);
M('body', [
  ['e21', 200, 'How many lungs does a person normally have?', 'كم رئة لدى الإنسان عادةً؟', 'Two', 'اثنتان', { s: 'organs', alt: ['2'], r: 'Lung' }],
  ['h21', 400, 'What is the tube that carries food from the throat to the stomach called?', 'ما اسم الأنبوب الذي ينقل الطعام من الحلق إلى المعدة؟', 'The oesophagus', 'المريء', { s: 'organs', x: 1, alt: ['esophagus', 'gullet'], r: 'Esophagus' }],
  ['x21', 600, 'What is the hardest substance in the human body?', 'ما أصلب مادة في جسم الإنسان؟', 'Tooth enamel', 'مينا الأسنان', { s: 'skeleton', r: 'Tooth enamel' }],
]);
M('biology', [
  ['e21', 200, 'What do herbivores eat?', 'ماذا تأكل الحيوانات العاشبة؟', 'Plants', 'النباتات', { s: 'life', r: 'Herbivore' }],
  ['h21', 400, 'Which English doctor created the first vaccine, against smallpox, in 1796?', 'أي طبيب إنجليزي صنع أول لقاح، ضد الجدري، عام ١٧٩٦؟', 'Edward Jenner', 'إدوارد جينر', { s: 'life', x: 1, r: 'Edward Jenner' }],
  ['x21', 600, 'Which type of RNA carries amino acids to the ribosome?', 'أي نوع من الحمض الريبي ينقل الأحماض الأمينية إلى الريبوسوم؟', 'Transfer RNA (tRNA)', 'الحمض الريبي الناقل (tRNA)', { s: 'genetics', x: 1, r: 'Transfer RNA' }],
]);
M('maths', [
  ['e21', 200, 'What is 9 squared?', 'كم يساوي ٩ تربيع؟', '81', '٨١', { s: 'arithmetic', r: 'Square number' }],
  ['h21', 400, 'Which Roman numeral stands for 50?', 'أي رقم روماني يمثّل العدد ٥٠؟', 'L', 'L', { s: 'famous', x: 1, r: 'Roman numerals' }],
  ['x21', 600, 'How many edges does a cube have?', 'كم حرفاً (ضلعاً) للمكعب؟', '12', '١٢', { s: 'geometry', r: 'Cube' }],
]);
M('computing', [
  ['e21', 200, 'Which keyboard key do you hold to type a capital letter?', 'أي مفتاح في لوحة المفاتيح تضغطه لكتابة حرف كبير؟', 'Shift', 'شِفت (Shift)', { s: 'basics', r: 'Shift key' }],
  ['h21', 400, 'What does PDF stand for?', 'ماذا يعني اختصار PDF؟', 'Portable Document Format', 'تنسيق المستندات المحمولة', { s: 'basics', x: 1, r: 'PDF' }],
  ['x21', 600, 'Which company originally created the Java programming language?', 'أي شركة ابتكرت لغة البرمجة جافا في الأصل؟', 'Sun Microsystems', 'صن مايكروسيستمز', { s: 'history', r: 'Java (programming language)' }],
]);
M('tech', [
  ['e21', 200, 'Which streaming company started out by mailing DVDs to customers?', 'أي شركة بث بدأت بإرسال أقراص DVD للعملاء بالبريد؟', 'Netflix', 'نتفليكس', { s: 'companies', r: 'Netflix' }],
  ['h21', 400, 'Which Chinese company makes the Mi and Redmi phones?', 'أي شركة صينية تصنع هواتف «مي» و«ريدمي»؟', 'Xiaomi', 'شاومي', { s: 'gadgets', x: 1, r: 'Xiaomi' }],
  ['x21', 600, 'Who co-founded Google with Larry Page?', 'من أسس غوغل مع لاري بيج؟', 'Sergey Brin', 'سيرغي برين', { s: 'founders', r: 'Sergey Brin' }],
]);
M('mammals', [
  ['e21', 200, 'What is a baby cat called?', 'ماذا يُسمّى صغير القط؟', 'A kitten', 'هُريرة (قطيطة)', { s: 'wild', r: 'Kitten' }],
  ['h21', 400, 'What is the largest rodent in the world?', 'ما أكبر القوارض في العالم؟', 'The capybara', 'الكابيبارا', { s: 'records', x: 1, r: 'Capybara' }],
  ['x21', 600, 'What is a baby echidna called?', 'ماذا يُسمّى صغير آكل النمل الشوكي (الإكيدنا)؟', 'A puggle', 'باغل (Puggle)', { s: 'wild', x: 1, r: 'Echidna' }],
]);
M('ocean', [
  ['e21', 200, 'What is a baby whale called?', 'ماذا يُسمّى صغير الحوت؟', 'A calf', 'عجل', { s: 'creatures', r: 'Whale' }],
  ['h21', 400, 'Which is the smallest of the world’s oceans?', 'ما أصغر محيطات العالم؟', 'The Arctic Ocean', 'المحيط المتجمد الشمالي', { s: 'reefs', x: 1, r: 'Arctic Ocean' }],
  ['x21', 600, 'What nickname is given to the pitch-dark ocean layer from about 1,000 to 4,000 metres deep?', 'ما الاسم الذي يُطلق على طبقة المحيط المظلمة تماماً من نحو ١٠٠٠ إلى ٤٠٠٠ متر عمقاً؟', 'The midnight zone (bathypelagic zone)', 'منطقة منتصف الليل (النطاق الباثي)', { s: 'reefs', x: 1, r: 'Bathyal zone' }],
]);
M('birds-reptiles', [
  ['e21', 200, 'Which bird fans out a huge colourful tail to show off?', 'أي طائر يفرد ذيلاً ملوناً ضخماً للتباهي؟', 'The peacock', 'الطاووس', { s: 'birds', r: 'Peafowl' }],
  ['h21', 400, 'Which bird is famous for laying its eggs in other birds’ nests?', 'أي طائر يشتهر بوضع بيضه في أعشاش طيور أخرى؟', 'The cuckoo', 'الوقواق', { s: 'birds', x: 1, r: 'Common cuckoo' }],
  ['x21', 600, 'What is a group of owls traditionally called?', 'ماذا تُسمّى مجموعة البوم تقليدياً بالإنجليزية؟', 'A parliament', 'Parliament («برلمان»)', { s: 'birds', x: 1, r: 'List of English terms of venery, by animal' }],
]);
M('prehistoric', [
  ['e21', 200, 'Which 1993 film brought dinosaurs back to life using DNA from amber?', 'أي فيلم عام ١٩٩٣ أعاد الديناصورات إلى الحياة باستخدام حمض نووي من الكهرمان؟', 'Jurassic Park', 'الحديقة الجوراسية', { s: 'dinos', f: 'jp', r: 'Jurassic Park' }],
  ['h21', 400, 'What does the word "dinosaur" mean?', 'ماذا تعني كلمة «ديناصور»؟', 'Terrible lizard', 'السحلية المرعبة', { s: 'science', x: 1, r: 'Dinosaur' }],
  ['x21', 600, 'Which dinosaur had claws up to about a metre long, the longest of any known animal?', 'أي ديناصور كانت مخالبه تصل إلى نحو متر، الأطول بين الحيوانات المعروفة؟', 'Therizinosaurus', 'ثيريزينوصور', { s: 'dinos', x: 1, r: 'Therizinosaurus' }],
]);
M('plants-bugs', [
  ['e21', 200, 'Which gas do plants give off during photosynthesis?', 'أي غاز تطلقه النباتات أثناء البناء الضوئي؟', 'Oxygen', 'الأكسجين', { s: 'plants', r: 'Photosynthesis' }],
  ['h21', 400, 'How many legs does a spider have?', 'كم رِجلاً للعنكبوت؟', 'Eight', 'ثمانٍ', { s: 'insects', x: 1, alt: ['8'], r: 'Spider' }],
  ['x21', 600, 'Bamboo belongs to which plant family?', 'إلى أي فصيلة نباتية ينتمي الخيزران (البامبو)؟', 'The grass family (Poaceae)', 'الفصيلة النجيلية (الأعشاب)', { s: 'plants', x: 1, r: 'Bamboo' }],
]);
M('world-food', [
  ['e21', 200, 'Pad thai is a famous noodle dish from which country?', 'باد تاي طبق نودلز شهير من أي بلد؟', 'Thailand', 'تايلاند', { s: 'asia', r: 'Pad thai' }],
  ['h21', 400, 'What is Spain’s famous cold tomato soup called?', 'ما اسم حساء الطماطم البارد الشهير في إسبانيا؟', 'Gazpacho', 'غاسباتشو', { s: 'europe', x: 1, r: 'Gazpacho' }],
  ['x21', 600, 'What is the Japanese name for the savoury "fifth taste"?', 'ما الاسم الياباني لـ«الطعم الخامس» المالح اللذيذ؟', 'Umami', 'أومامي', { s: 'asia', r: 'Umami' }],
]);
M('arab-food', [
  ['e21', 200, 'What is the Levantine flatbread topped with za’atar and olive oil called?', 'ما اسم الخبز الشامي المسطح المغطى بالزعتر وزيت الزيتون؟', 'Manakish', 'المناقيش', { s: 'levant', alt: ['Man\'oushe'], r: 'Manakish' }],
]);
M('fast-food', [
  ['e21', 200, 'Which Canadian coffee-and-doughnut chain is famous for Timbits?', 'أي سلسلة كندية للقهوة والدونات تشتهر بـ«تيمبتس»؟', 'Tim Hortons', 'تيم هورتنز', { s: 'chains', r: 'Tim Hortons' }],
  ['h21', 400, 'Which company owns the Oreo cookie brand?', 'أي شركة تملك علامة بسكويت أوريو؟', 'Mondelēz International', 'موندليز إنترناشونال', { s: 'snacks', x: 1, alt: ['Nabisco'], r: 'Oreo' }],
  ['x21', 600, 'In which US city did the first Pizza Hut open, in 1958?', 'في أي مدينة أمريكية افتُتح أول مطعم بيتزا هت عام ١٩٥٨؟', 'Wichita, Kansas', 'ويتشيتا، كانساس', { s: 'chains', x: 1, r: 'Pizza Hut' }],
]);
M('drinks', [
  ['e21', 200, 'Which orange fizzy drink brand is owned by Coca-Cola?', 'أي علامة مشروب غازي بالبرتقال تملكها كوكا كولا؟', 'Fanta', 'فانتا', { s: 'soft', r: 'Fanta' }],
  ['h21', 400, 'Yerba mate, drunk from a gourd through a metal straw, is the national drink of which country?', 'شاي «المتة» الذي يُشرب من قرعة بماصة معدنية هو المشروب الوطني لأي دولة؟', 'Argentina', 'الأرجنتين', { s: 'tea', x: 1, alt: ['Uruguay', 'Paraguay'], r: 'Mate (drink)' }],
  ['x21', 600, 'Red Bull was adapted from Krating Daeng, an energy drink from which country?', 'رد بول مأخوذ من «كراتينغ داينغ»، مشروب طاقة من أي بلد؟', 'Thailand', 'تايلاند', { s: 'soft', r: 'Krating Daeng' }],
]);
M('cars', [
  ['e21', 200, 'Which country is Ferrari from?', 'من أي بلد شركة فيراري؟', 'Italy', 'إيطاليا', { s: 'brands', r: 'Ferrari' }],
  ['h21', 400, 'Which Japanese brand makes the Civic and the Accord?', 'أي علامة يابانية تصنع سيفيك وأكورد؟', 'Honda', 'هوندا', { s: 'models', x: 1, r: 'Honda Civic' }],
  ['x21', 600, 'Which carmaker introduced the modern three-point seatbelt, invented by Nils Bohlin, in 1959?', 'أي شركة سيارات قدّمت حزام الأمان الحديث ثلاثي النقاط من اختراع نيلز بولين عام ١٩٥٩؟', 'Volvo', 'فولفو', { s: 'history', r: 'Nils Bohlin' }],
]);
M('fashion', [
  ['e21', 200, 'Which sportswear brand’s logo is a leaping big cat?', 'أي علامة رياضية شعارها قط كبير يقفز؟', 'Puma', 'بوما', { s: 'sport', r: 'Puma (brand)' }],
  ['h21', 400, 'Which Milan fashion house, run for decades by Miuccia, was founded by her grandfather Mario?', 'أي دار أزياء في ميلانو أدارتها ميوتشا لعقود وأسسها جدها ماريو؟', 'Prada', 'برادا', { s: 'luxury', x: 1, r: 'Prada' }],
  ['x21', 600, 'Which designer popularised the "little black dress" in the 1920s?', 'أي مصممة نشرت «الفستان الأسود القصير» في عشرينيات القرن الماضي؟', 'Coco Chanel', 'كوكو شانيل', { s: 'luxury', ok: 1, r: 'Little black dress' }],
]);
M('business', [
  ['e21', 200, 'What is the currency of the United States?', 'ما عملة الولايات المتحدة؟', 'The US dollar', 'الدولار الأمريكي', { s: 'money', r: 'United States dollar' }],
  ['h21', 400, 'What is the maximum number of bitcoins that can ever exist?', 'ما الحد الأقصى لعدد البيتكوين الذي يمكن أن يوجد؟', '21 million', '٢١ مليوناً', { s: 'money', x: 1, f: 'bitcoin', r: 'Bitcoin' }],
  ['x21', 600, 'What is the name used by the anonymous creator of Bitcoin?', 'ما الاسم الذي يستخدمه المبتكر المجهول للبيتكوين؟', 'Satoshi Nakamoto', 'ساتوشي ناكاموتو', { s: 'money', f: 'bitcoin', r: 'Satoshi Nakamoto' }],
]);
M('traditions', [
  ['e21', 200, 'Which country celebrates Thanksgiving on the fourth Thursday of November?', 'أي دولة تحتفل بعيد الشكر في الخميس الرابع من نوفمبر؟', 'The United States', 'الولايات المتحدة', { s: 'world', f: 'thanks', r: 'Thanksgiving (United States)' }],
  ['h21', 400, 'Which Chinese festival is also called the Spring Festival?', 'أي عيد صيني يُسمّى أيضاً عيد الربيع؟', 'Chinese (Lunar) New Year', 'رأس السنة الصينية (القمرية)', { s: 'world', x: 1, r: 'Chinese New Year' }],
  ['x21', 600, 'In which month is Thanksgiving celebrated in Canada?', 'في أي شهر يُحتفل بعيد الشكر في كندا؟', 'October', 'أكتوبر', { s: 'world', f: 'thanks', r: 'Thanksgiving (Canada)' }],
]);
M('arabic-lang', [
  ['e21', 200, 'What does the Arabic word «شكراً» (shukran) mean?', 'ماذا تعني كلمة «شكراً» بالإنجليزية؟', 'Thank you', 'Thank you', { s: 'words', r: 'Arabic' }],
  ['h21', 400, 'What is the Arabic word for "book"?', 'ما الكلمة الإنجليزية لـ«كتاب»؟', 'كتاب (kitāb)', 'Book', { s: 'words', x: 1, ok: 1, r: 'Arabic' }],
]);
M('english-words', [
  ['e21', 200, 'What is the past tense of "eat"?', 'ما صيغة الماضي من الفعل «eat»؟', 'Ate', 'Ate', { s: 'grammar', r: 'English irregular verbs' }],
  ['h21', 400, 'What do you call words that sound the same but differ in meaning, like "flower" and "flour"?', 'ماذا تُسمّى الكلمات التي تُنطق بالطريقة نفسها وتختلف في المعنى، مثل «flower» و«flour»؟', 'Homophones', 'كلمات متجانسة لفظاً (Homophones)', { s: 'grammar', x: 1, r: 'Homophone' }],
  ['x21', 600, 'Which word is the most frequently used in written English?', 'ما الكلمة الأكثر استخداماً في الإنجليزية المكتوبة؟', '"The"', '«The»', { s: 'grammar', x: 1, r: 'Most common words in English' }],
]);

