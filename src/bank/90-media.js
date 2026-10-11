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
