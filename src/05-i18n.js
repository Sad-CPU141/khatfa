/* ============================================================
   LANGUAGE: Arabic (RTL, default) and English.
   S[key] = [English, Arabic]. t(key, {vars}) picks the current language.
   Content (questions, categories) is stored as { ar, en } and shown with
   pick(); user text is rendered with dir="auto" so mixed text lays out right.
   ============================================================ */
const S = {
  appName: ['Khatfa', 'خطفة'],
  tagline: ['The team quiz where every wrong answer can be snatched.', 'مسابقة الفرق… كل جواب غلط ممكن ينخطف.'],
  gameNight: ['Game night', 'ليلة ألعاب'],
  newGame: ['New game', 'لعبة جديدة'],
  continueGame: ['Continue game', 'كمّل اللعبة'],
  howToPlay: ['How to play', 'طريقة اللعب'],
  settings: ['Settings', 'الإعدادات'],
  back: ['Back', 'رجوع'],
  close: ['Close', 'إغلاق'],
  cancel: ['Cancel', 'إلغاء'],
  confirm: ['Confirm', 'تأكيد'],
  yes: ['Yes', 'نعم'],
  langSwitch: ['العربية', 'English'],
  langSwitchLabel: ['Switch to Arabic', 'التبديل إلى الإنجليزية'],
  resumeSub: ['{a} vs {b} · {n} questions left', '{a} ضد {b} · باقي {n} سؤال'],
  resumePick: ['{a} vs {b} · picking categories', '{a} ضد {b} · اختيار الفئات'],
  pastGames: ['Recent games', 'آخر الألعاب'],
  noPast: ['Finished games will show here.', 'الألعاب المنتهية تظهر هنا.'],
  won: ['won', 'فاز'],
  draw: ['Draw', 'تعادل'],
  sampleNote: ['Version 1 preview: a small sample question pack is built in. The full question editor and starter packs come next.', 'نسخة تجريبية: فيها حزمة أسئلة صغيرة للتجربة. محرر الأسئلة والحزم الكاملة جايين بالخطوة الجاية.'],

  // setup
  setupTitle: ['New game', 'لعبة جديدة'],
  teams: ['Teams', 'الفرق'],
  teamName: ['Team name', 'اسم الفريق'],
  teamN: ['Team {n}', 'الفريق {n}'],
  defaultTeam1: ['Falcons', 'الصقور'],
  defaultTeam2: ['Leopards', 'النمور'],
  changeEmoji: ['Change emoji', 'غيّر الرمز'],
  colour: ['Colour', 'اللون'],
  pack: ['Question pack', 'حزمة الأسئلة'],
  houseRules: ['House rules', 'قوانين اللعبة'],
  pointValues: ['Point values', 'قيم النقاط'],
  perValue: ['Questions per value in each category', 'عدد الأسئلة لكل قيمة في الفئة'],
  catsPerTeam: ['Categories per team', 'عدد الفئات لكل فريق'],
  answerTime: ['Time to answer', 'وقت الإجابة'],
  stealTime: ['Time to steal', 'وقت الخطف'],
  stealOn: ['Steals', 'الخطف'],
  stealOnSub: ['A wrong or missing answer gives the other team a chance to snatch the points.', 'إذا غلط الفريق أو ما جاوب، الفريق الثاني يقدر يخطف النقاط.'],
  modifiers: ['Optional modifiers', 'إضافات اختيارية'],
  modifiersSub: ['All off by default.', 'كلها مطفأة افتراضياً.'],
  wrongPenalty: ['Wrong answers lose points', 'الجواب الغلط يخصم نقاط'],
  wrongPenaltySub: ['The answering team loses the question’s value. Steals never lose points.', 'الفريق اللي جاوب يخسر قيمة السؤال. الخطف ما يخصم.'],
  seconds: ['{n}s', '{n} ث'],
  pickCategories: ['Pick categories', 'اختيار الفئات'],
  needCats: ['This pack has {have} categories; {need} are needed. Lower “Categories per team”.', 'الحزمة فيها {have} فئات، والمطلوب {need}. قلّل عدد الفئات لكل فريق.'],
  needNames: ['Give every team a name.', 'اكتب اسم لكل فريق.'],
  rulesSummary: ['{vals} · {per}× per value · {cats} categories each · {a}s / steal {s}s', '{vals} · {per}× لكل قيمة · {cats} فئات لكل فريق · {a}ث / خطف {s}ث'],

  // category pick
  pickTitle: ['Pick categories', 'اختيار الفئات'],
  yourPick: ['{team}, pick a category', '{team}، اختاروا فئة'],
  pickedBy: ['Picked by {team}', 'اختيار {team}'],
  picksLeft: ['{n} picks left', 'باقي {n} اختيارات'],
  questionsN: ['{n} questions', '{n} سؤال'],
  undoPick: ['Undo pick', 'تراجع'],
  randomPick: ['Random', 'عشوائي'],
  letsGo: ['Let’s play!', 'يلا نبدأ!'],

  // board
  boardTitle: ['The board', 'اللوحة'],
  turnOf: ['{team} to pick', 'دور {team}'],
  turnShort: ['Your pick', 'دوركم'],
  menu: ['Menu', 'القائمة'],
  undo: ['Undo', 'تراجع'],
  undoWhat: ['Undo: {what}', 'تراجع: {what}'],
  nothingToUndo: ['Nothing to undo', 'ما فيه شي للتراجع'],
  fixScores: ['Fix scores', 'تعديل النقاط'],
  fixScoresSub: ['For mistakes only. Changes are listed in the game log.', 'للأخطاء فقط. التعديل يظهر في سجل اللعبة.'],
  endGame: ['End game now', 'إنهاء اللعبة الآن'],
  endGameQ: ['End the game now?', 'تنهي اللعبة الآن؟'],
  endGameBody: ['Scores so far decide the winner. Unplayed questions are skipped.', 'النقاط الحالية تحدد الفائز. الأسئلة الباقية تنلغي.'],
  quitHome: ['Back to home', 'رجوع للرئيسية'],
  quitHomeSub: ['The game is saved. Continue it from the home screen.', 'اللعبة محفوظة. كمّلها من الشاشة الرئيسية.'],
  leftN: ['{n} left', 'باقي {n}'],
  emptyCell: ['No question', 'لا يوجد سؤال'],

  // question
  points: ['{n} pts', '{n} نقطة'],
  pts: ['pts', 'نقطة'],
  answering: ['{team} answering', '{team} يجاوبون'],
  stealChance: ['Steal chance: {team}!', 'فرصة خطف: {team}!'],
  timeUp: ['Time’s up!', 'انتهى الوقت!'],
  paused: ['Paused', 'متوقف'],
  pause: ['Pause', 'إيقاف مؤقت'],
  resume: ['Resume', 'استئناف'],
  correct: ['Correct', 'صح'],
  wrong: ['Wrong', 'غلط'],
  stolen: ['Stolen!', 'انخطفت!'],
  missed: ['Missed', 'ضاعت'],
  showAnswer: ['Show answer (host only)', 'إظهار الإجابة (للمقدّم فقط)'],
  hideAnswer: ['Hide answer', 'إخفاء الإجابة'],
  answer: ['Answer', 'الإجابة'],
  putBack: ['Put question back', 'رجّع السؤال للوحة'],
  putBackSub: ['Picked by mistake? It goes back on the board unanswered.', 'انختار بالغلط؟ يرجع للوحة بدون إجابة.'],
  skipQ: ['Skip question (no points)', 'تخطي السؤال (بدون نقاط)'],
  hostHint: ['Host: read the question out, then mark the answer.', 'المقدّم: اقرأ السؤال، وبعدها حدد الإجابة.'],
  needsCheck: ['⚠ Needs fact-check', '⚠ تحتاج تدقيق'],

  // reveal / flashes
  flashCorrect: ['Correct!', 'صح!'],
  flashSteal: ['Khatfa!', 'خطفة!'],
  flashWrong: ['Wrong!', 'غلط!'],
  flashMissed: ['No steal', 'ما فيه خطف'],
  pointsTo: ['+{n} to {team}', '+{n} لـ {team}'],
  lostPoints: ['−{n} for {team}', '−{n} على {team}'],
  noPoints: ['No points this time', 'ولا نقطة هالمرة'],
  skipped: ['Skipped', 'تم التخطي'],
  backToBoard: ['Back to the board', 'رجوع للوحة'],
  seeResults: ['See the results', 'شوف النتائج'],
  explanation: ['Did you know?', 'هل تعلم؟'],

  // results
  resultsTitle: ['Results', 'النتائج'],
  winnerIs: ['Winners', 'الفائز'],
  itsADraw: ['It’s a draw!', 'تعادل!'],
  finalScores: ['Final scores', 'النتيجة النهائية'],
  moments: ['Best moments', 'أفضل اللحظات'],
  mBiggestSteal: ['Biggest steal', 'أكبر خطفة'],
  mBestStreak: ['Best streak', 'أطول سلسلة'],
  mMostSteals: ['Most steals', 'أكثر خطف'],
  mAccuracy: ['Sharpest team', 'أدق فريق'],
  mBigWin: ['Biggest question won', 'أغلى سؤال'],
  streakN: ['{n} correct in a row', '{n} صح ورا بعض'],
  stealsN: ['{n} steals', '{n} خطفات'],
  accN: ['{p}% correct on their own turn', '{p}% صح في دورهم'],
  none: ['—', '—'],
  correctShort: ['Correct', 'صح'],
  stealsShort: ['Steals', 'خطف'],
  playAgain: ['Play again', 'العب مرة ثانية'],
  playAgainSub: ['Same teams and rules, new categories.', 'نفس الفرق والقوانين، فئات جديدة.'],
  home: ['Home', 'الرئيسية'],
  gameLog: ['Game log', 'سجل اللعبة'],
  logCorrect: ['{team} answered', '{team} جاوبوا صح'],
  logStolen: ['{team} stole it', '{team} خطفوها'],
  logMissed: ['Nobody got it', 'محد عرفها'],
  logSkipped: ['Skipped', 'تم التخطي'],
  logAdjust: ['Score fixed: {team} {d}', 'تعديل: {team} {d}'],

  // TV
  tvMode: ['TV mode', 'وضع التلفزيون'],
  tvIntro: ['A big-screen view of the board, question, timer and scores. The answer only shows after you mark it.', 'عرض كبير للوحة والسؤال والوقت والنقاط. الإجابة ما تظهر إلا بعد ما تحددها.'],
  tvHere: ['Show TV view on this screen', 'اعرض التلفزيون على هذي الشاشة'],
  tvHereSub: ['Tap “Back to controls” (or press Esc) to return.', 'اضغط «رجوع للتحكم» (أو Esc) للرجوع.'],
  tvWindow: ['Open TV in a new window', 'افتح التلفزيون بنافذة جديدة'],
  tvWindowSub: ['Drag that window onto the TV (or cast it) and keep running the game here. Works in this browser on this computer.', 'اسحب النافذة للتلفزيون (أو اعمل بث) وكمّل اللعبة من هنا. يشتغل بنفس المتصفح على نفس الجهاز.'],
  tvOtherDevice: ['Another device as the TV needs online rooms, which come in a later step.', 'استخدام جهاز ثاني كتلفزيون يحتاج الغرف الأونلاين، وهذي بخطوة جاية.'],
  tvBlocked: ['The browser blocked the new window. Allow pop-ups for this site, or use “on this screen”.', 'المتصفح منع النافذة. اسمح بالنوافذ المنبثقة أو استخدم «على هذي الشاشة».'],
  tvNoChannel: ['This browser can’t link windows. Use “on this screen” instead.', 'هذا المتصفح ما يقدر يربط النوافذ. استخدم «على هذي الشاشة».'],
  tvBackToControls: ['Back to controls', 'رجوع للتحكم'],
  tvFull: ['Full screen', 'ملء الشاشة'],
  tvWaiting: ['Waiting for a game… Start or continue a game in the other Khatfa window on this computer.', 'بانتظار لعبة… ابدأ أو كمّل لعبة في نافذة خطفة الثانية على نفس الجهاز.'],
  tvPicking: ['Picking categories', 'اختيار الفئات'],

  // settings
  language: ['Language', 'اللغة'],
  qLang: ['Question language', 'لغة الأسئلة'],
  qLangAuto: ['Same as app', 'مثل التطبيق'],
  qLangBoth: ['Both', 'الاثنين'],
  qLangSub: ['If a question isn’t written in the chosen language, the other one is shown.', 'إذا السؤال مو مكتوب باللغة المختارة، تظهر اللغة الثانية.'],
  motion: ['Animations', 'الحركة'],
  motionSystem: ['Device setting', 'حسب الجهاز'],
  motionFull: ['Full', 'كاملة'],
  motionReduce: ['Reduced', 'مخففة'],
  tvZoom: ['TV text size', 'حجم خط التلفزيون'],
  backup: ['Backup', 'نسخة احتياطية'],
  backupSub: ['Saves your settings, the current game and finished games to a file. Use Import on another device.', 'يحفظ الإعدادات واللعبة الحالية والألعاب المنتهية في ملف. استورده على جهاز ثاني.'],
  exportBackup: ['Export backup', 'تصدير نسخة'],
  importBackup: ['Import backup', 'استيراد نسخة'],
  importQ: ['Replace everything with this backup?', 'تستبدل كل شي بهذي النسخة؟'],
  importBody: ['{past} finished games{cur}. Exported {date}.', '{past} لعبة منتهية{cur}. تاريخ التصدير {date}.'],
  importCur: [' and a game in progress', ' ولعبة جارية'],
  restored: ['Backup restored.', 'تم استرجاع النسخة.'],
  bkNotOurs: ['That file isn’t a Khatfa backup.', 'هذا الملف مو نسخة من خطفة.'],
  bkNewer: ['This backup is from a newer version of Khatfa. Reload to update, then try again.', 'هذي النسخة من إصدار أحدث. حدّث الصفحة وجرب مرة ثانية.'],
  bkDamaged: ['This backup is damaged, so it can’t be restored.', 'النسخة تالفة وما يمكن استرجاعها.'],
  bkUnreadable: ['Couldn’t read that file.', 'ما قدرنا نقرأ الملف.'],
  storage: ['Storage', 'التخزين'],
  storageWhere: ['Saved on this device ({b}). Nothing is uploaded.', 'محفوظ على هذا الجهاز ({b}). ما يتم رفع أي شي.'],
  clearAll: ['Delete everything on this device', 'احذف كل شي من هذا الجهاز'],
  clearAllQ: ['Delete all Khatfa data on this device?', 'تحذف كل بيانات خطفة من الجهاز؟'],
  clearAllBody: ['Settings, the current game and finished games. Export a backup first if you want to keep them.', 'الإعدادات واللعبة الحالية والألعاب المنتهية. صدّر نسخة أول إذا تبي تحتفظ فيها.'],
  deleteIt: ['Delete', 'حذف'],
  version: ['Version {v}', 'الإصدار {v}'],
  updateReady: ['A new version is ready.', 'فيه إصدار جديد.'],
  reload: ['Reload', 'تحديث'],
  install: ['Install on this phone', 'ثبّت على الجوال'],
  installIos: ['iPhone: Safari → Share → Add to Home Screen.', 'آيفون: سفاري ← مشاركة ← إضافة إلى الشاشة الرئيسية.'],
  storeFull: ['Storage is full, so recent changes may not be saved. Export a backup.', 'التخزين ممتلئ وقد لا تنحفظ التغييرات. صدّر نسخة احتياطية.'],
  storeFail: ['This device isn’t saving right now. The game keeps working, but export a backup before closing.', 'الجهاز ما يحفظ حالياً. اللعبة تشتغل، بس صدّر نسخة قبل لا تقفل.'],
  dismiss: ['OK', 'تمام'],
  crashed: ['Something went wrong.', 'صار خطأ.'],
  crashedSub: ['Your game is saved. Reload to carry on.', 'لعبتك محفوظة. حدّث الصفحة وكمّل.'],

  // how to play
  howBody: [
    ['Split into two teams. Each team picks categories; they all go on the board.',
      'Teams take turns choosing a question. Harder questions are worth more.',
      'The host reads it out and starts the clock. Answer right to win the points.',
      'Wrong or out of time? The other team gets a short chance to snatch it — a Khatfa!',
      'When the board is empty, the team with the most points wins.'],
    ['انقسموا لفريقين. كل فريق يختار فئات، وكلها تنحط على اللوحة.',
      'الفرق تتناوب على اختيار الأسئلة. كل ما صعب السؤال زادت نقاطه.',
      'المقدّم يقرأ السؤال ويشغّل الوقت. جاوب صح وخذ النقاط.',
      'غلطتوا أو خلص الوقت؟ الفريق الثاني عنده فرصة قصيرة يخطف السؤال… خطفة!',
      'إذا خلصت اللوحة، الفريق صاحب أعلى نقاط يفوز.'],
  ],
};

let LANG = 'ar';
const setLang = (l) => { LANG = l === 'en' ? 'en' : 'ar'; };
function t(key, vars) {
  const e = S[key];
  let s = e ? (LANG === 'ar' ? e[1] : e[0]) : key;
  if (vars && typeof s === 'string') Object.keys(vars).forEach((k) => { s = s.split('{' + k + '}').join(vars[k]); });
  return s;
}
// Bilingual content { ar, en } → text in the wanted language, falling back to the other.
function pick(obj, lang) {
  if (obj == null) return '';
  if (typeof obj === 'string') return obj;
  const l = lang || LANG;
  return (obj[l] || obj[l === 'ar' ? 'en' : 'ar'] || '').trim();
}
const hasBoth = (obj) => !!(obj && typeof obj === 'object' && obj.ar && obj.ar.trim() && obj.en && obj.en.trim());
// Which language a string is mostly written in (for lang= attributes).
const looksArabic = (s) => /[؀-ۿ]/.test(s || '');
// Team names: stored as typed (any language).
const teamName = (team) => (team ? team.name : '');
