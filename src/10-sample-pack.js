/* ============================================================
   SAMPLE PACK (Step 1 only)
   A small built-in pack so the board can be played end to end.
   Only timeless, well-established facts are used here. Any question
   whose answer can change over time must carry check: true and is
   shown to the host with a "Needs fact-check" badge.
   The full editor, import/export and real starter packs come in Step 2.

   Question: { id, tier: 1|2|3 (easy → hard; points come from the rules),
               type: 'text', q: { ar, en }, a: { ar, en }, note?: { ar, en }, check?: bool }
   ============================================================ */
const qq = (id, tier, qAr, qEn, aAr, aEn, note) => ({ id, tier, type: 'text', q: { ar: qAr, en: qEn }, a: { ar: aAr, en: aEn }, ...(note ? { note } : {}) });

const SAMPLE_PACK = {
  id: 'sample-v1',
  builtIn: true,
  sample: true,
  name: { ar: 'حزمة تجريبية', en: 'Sample pack' },
  categories: [
    { id: 'c-geo', emoji: '🌍', name: { ar: 'جغرافيا', en: 'Geography' }, questions: [
      qq('geo1', 1, 'ما عاصمة اليابان؟', 'What is the capital of Japan?', 'طوكيو', 'Tokyo'),
      qq('geo2', 1, 'ما أكبر محيط في العالم؟', 'What is the largest ocean on Earth?', 'المحيط الهادئ', 'The Pacific Ocean'),
      qq('geo3', 2, 'أي نهر يمر بمدينة القاهرة؟', 'Which river flows through Cairo?', 'نهر النيل', 'The Nile'),
      qq('geo4', 2, 'ما عاصمة كندا؟', 'What is the capital of Canada?', 'أوتاوا', 'Ottawa', { ar: 'كثيرون يظنونها تورونتو، أكبر مدنها.', en: 'Many people guess Toronto, its largest city.' }),
      qq('geo5', 3, 'ما أصغر دولة في العالم من حيث المساحة؟', 'What is the smallest country in the world by area?', 'الفاتيكان', 'Vatican City'),
      qq('geo6', 3, 'ما اسم الصحراء الكبيرة في جنوب شبه الجزيرة العربية؟', 'What is the name of the huge desert in the south of the Arabian Peninsula?', 'الربع الخالي', 'The Rub’ al Khali (Empty Quarter)'),
    ] },
    { id: 'c-sci', emoji: '🔬', name: { ar: 'علوم', en: 'Science' }, questions: [
      qq('sci1', 1, 'ما الصيغة الكيميائية للماء؟', 'What is the chemical formula for water?', 'H₂O', 'H₂O'),
      qq('sci2', 1, 'كم عدد كواكب المجموعة الشمسية؟', 'How many planets are in the Solar System?', '٨ كواكب', '8 planets'),
      qq('sci3', 2, 'أي غاز تمتصه النباتات لتقوم بالبناء الضوئي؟', 'Which gas do plants take in for photosynthesis?', 'ثاني أكسيد الكربون', 'Carbon dioxide (CO₂)'),
      qq('sci4', 2, 'ما أقسى مادة طبيعية معروفة؟', 'What is the hardest natural material?', 'الألماس', 'Diamond'),
      qq('sci5', 3, 'ما الرمز الكيميائي للذهب؟', 'What is the chemical symbol for gold?', 'Au', 'Au', { ar: 'من الكلمة اللاتينية Aurum.', en: 'From the Latin word aurum.' }),
      qq('sci6', 3, 'كم عظمة في جسم الإنسان البالغ تقريباً؟', 'About how many bones are in an adult human body?', '٢٠٦ عظمات', '206'),
    ] },
    { id: 'c-ani', emoji: '🐪', name: { ar: 'حيوانات', en: 'Animals' }, questions: [
      qq('ani1', 1, 'ما أسرع حيوان بري؟', 'What is the fastest land animal?', 'الفهد (الشيتا)', 'The cheetah'),
      qq('ani2', 1, 'كم رِجلاً للعنكبوت؟', 'How many legs does a spider have?', '٨', '8'),
      qq('ani3', 2, 'ما أكبر حيوان عاش على الأرض؟', 'What is the largest animal ever known to have lived?', 'الحوت الأزرق', 'The blue whale'),
      qq('ani4', 2, 'ما الحيوان الثديي الوحيد القادر على الطيران فعلاً؟', 'Which is the only mammal that can truly fly?', 'الخفاش', 'The bat'),
      qq('ani5', 3, 'كم قلباً للأخطبوط؟', 'How many hearts does an octopus have?', 'ثلاثة', 'Three'),
      qq('ani6', 3, 'ماذا يُسمّى صغير الناقة في اللغة العربية؟', 'In Arabic, what is a baby camel called?', 'الحُوار', 'Ḥuwār (حُوار)'),
    ] },
    { id: 'c-num', emoji: '🔢', name: { ar: 'أرقام', en: 'Numbers' }, questions: [
      qq('num1', 1, 'كم حاصل ٧ × ٨؟', 'What is 7 × 8?', '٥٦', '56'),
      qq('num2', 1, 'كم دقيقة في ثلاث ساعات؟', 'How many minutes are in three hours?', '١٨٠ دقيقة', '180'),
      qq('num3', 2, 'كم ضلعاً للشكل السداسي؟', 'How many sides does a hexagon have?', '٦', '6'),
      qq('num4', 2, 'ما الجذر التربيعي للعدد ١٤٤؟', 'What is the square root of 144?', '١٢', '12'),
      qq('num5', 3, 'كم ثانية في اليوم الواحد؟', 'How many seconds are in one day?', '٨٦٤٠٠ ثانية', '86,400'),
      qq('num6', 3, 'كم يساوي ١٥٪ من ٢٠٠؟', 'What is 15% of 200?', '٣٠', '30'),
    ] },
    { id: 'c-arb', emoji: '✍️', name: { ar: 'لغتنا', en: 'Arabic language' }, questions: [
      qq('arb1', 1, 'كم عدد حروف الأبجدية العربية؟', 'How many letters are in the Arabic alphabet?', '٢٨ حرفاً', '28'),
      qq('arb2', 1, 'ما عكس كلمة «كبير»؟', 'What is the opposite of the Arabic word «كبير» (big)?', 'صغير', 'صغير (small)'),
      qq('arb3', 2, 'ما جمع كلمة «كتاب»؟', 'What is the plural of the Arabic word «كتاب» (book)?', 'كُتُب', 'كُتُب (kutub)'),
      qq('arb4', 2, 'تُسمّى العربية «لغة …» أيّ حرف؟', 'Arabic is called “the language of the letter …” which letter?', 'الضاد (ض)', 'Ḍād (ض)'),
      qq('arb5', 3, 'كم نقطة في كلمة «ثقة»؟', 'How many dots are in the Arabic word «ثقة»?', '٧ نقاط', '7', { ar: 'ث = ٣، ق = ٢، ة = ٢', en: 'ث has 3, ق has 2, ة has 2.' }),
      qq('arb6', 3, 'ما مفرد كلمة «أقلام»؟', 'What is the singular of the Arabic word «أقلام» (pens)?', 'قلم', 'قلم (qalam)'),
    ] },
    { id: 'c-food', emoji: '🍽️', name: { ar: 'أكل', en: 'Food' }, questions: [
      qq('food1', 1, 'ما المكوّن الأساسي للحمّص؟', 'What is the main ingredient of hummus?', 'الحمّص (الحبوب)', 'Chickpeas'),
      qq('food2', 1, 'ما الحبوب الأساسية في الكبسة؟', 'What grain is the base of kabsa?', 'الأرز', 'Rice'),
      qq('food3', 2, 'من أي بذور يُصنع الطحينة؟', 'Tahini is made from which seeds?', 'السمسم', 'Sesame'),
      qq('food4', 2, 'ما البهار الذي يعطي القهوة العربية نكهتها المعروفة؟', 'Which spice gives Arabic coffee its well-known flavour?', 'الهيل', 'Cardamom'),
      qq('food5', 3, 'أي جزء من زهرة الزعفران يُستخدم كبهار؟', 'Which part of the saffron flower is used as the spice?', 'المياسم (الخيوط الحمراء)', 'The stigmas (red threads)'),
      qq('food6', 3, 'من أي مكسرات تُصنع حلوى المرزبان؟', 'Which nut is marzipan made from?', 'اللوز', 'Almonds'),
    ] },
    { id: 'c-spt', emoji: '⚽', name: { ar: 'رياضة', en: 'Sport' }, questions: [
      qq('spt1', 1, 'كم لاعباً لكل فريق داخل ملعب كرة القدم؟', 'How many players does each team have on a football pitch?', '١١ لاعباً', '11'),
      qq('spt2', 1, 'كم حلقة في علم الألعاب الأولمبية؟', 'How many rings are on the Olympic flag?', '٥ حلقات', '5'),
      qq('spt3', 2, 'في أي رياضة تُستخدم حركة «السلام دانك»؟', 'In which sport do you do a “slam dunk”?', 'كرة السلة', 'Basketball'),
      qq('spt4', 2, 'كم لاعباً لكل فريق داخل ملعب الكرة الطائرة؟', 'How many players per team are on a volleyball court?', '٦ لاعبين', '6'),
      qq('spt5', 3, 'كم طول سباق الماراثون؟', 'How long is a marathon?', '٤٢٫١٩٥ كم', '42.195 km'),
      qq('spt6', 3, 'في التنس، ماذا تُسمّى النتيجة صفر؟', 'In tennis, what is a score of zero called?', '«لَڤ» (Love)', 'Love'),
    ] },
    { id: 'c-spc', emoji: '🚀', name: { ar: 'فضاء', en: 'Space' }, questions: [
      qq('spc1', 1, 'ما أقرب نجم إلى الأرض؟', 'What is the closest star to Earth?', 'الشمس', 'The Sun'),
      qq('spc2', 1, 'أي كوكب يُلقّب بالكوكب الأحمر؟', 'Which planet is known as the Red Planet?', 'المريخ', 'Mars'),
      qq('spc3', 2, 'ما أكبر كواكب المجموعة الشمسية؟', 'What is the largest planet in the Solar System?', 'المشتري', 'Jupiter'),
      qq('spc4', 2, 'كم يستغرق ضوء الشمس تقريباً ليصل إلى الأرض؟', 'Roughly how long does sunlight take to reach Earth?', 'حوالي ٨ دقائق', 'About 8 minutes'),
      qq('spc5', 3, 'من أول إنسان مشى على سطح القمر؟', 'Who was the first person to walk on the Moon?', 'نيل آرمسترونغ', 'Neil Armstrong', { ar: 'كان ذلك عام ١٩٦٩.', en: 'It was in 1969.' }),
      qq('spc6', 3, 'أي كوكب سنته هي الأقصر؟', 'Which planet has the shortest year?', 'عطارد', 'Mercury', { ar: 'يدور حول الشمس في نحو ٨٨ يوماً.', en: 'It goes round the Sun in about 88 days.' }),
    ] },
  ],
};
