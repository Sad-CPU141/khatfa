/* Khatfa 9b0be6e83e — built from src/ by build.js. Edit src/, not this file. */
"use strict";
(function(){
const APP_VERSION = "9b0be6e83e";
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
const shuffle = arr => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const buzz = p => {
  try {
    if (navigator.vibrate) navigator.vibrate(p);
  } catch (e) {}
};
function onColor(hex) {
  const h = (hex || '#888888').replace('#', '');
  const r = parseInt(h.slice(0, 2), 16) / 255,
    g = parseInt(h.slice(2, 4), 16) / 255,
    b = parseInt(h.slice(4, 6), 16) / 255;
  const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return L > 0.55 ? '#1a1300' : '#ffffff';
}
const tStyle = team => ({
  '--c': team.color,
  '--on': onColor(team.color)
});
const COLORS = ['#ff4f64', '#3d8bff', '#2fd17c', '#a46bff', '#ff8a3a', '#ff5cbc', '#22cfd6', '#ffc83d'];
const EMOJIS = ['🦅', '🐆', '🐺', '🦁', '🐪', '🔥', '⚡', '👑', '🚀', '💎', '🦈', '🐉', '🎯', '🧠', '🌙', '⭐'];
const {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback
} = React;
const GAME_SPEED = typeof window !== 'undefined' && window.__KH_TEST_SPEED || 1;
const ms = n => Math.max(1, Math.round(n * GAME_SPEED));
const reducedMotion = () => {
  const m = document.documentElement.getAttribute('data-motion');
  if (m === 'reduce') return true;
  if (m === 'full') return false;
  return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
};
const K = {
  settings: 'kh_settings_v1',
  current: 'kh_current_v1',
  past: 'kh_past_v1',
  packs: 'kh_packs_v1'
};
const STORE_KEYS = Object.values(K);
const store = (() => {
  const mem = {};
  let backend = 'memory';
  let db = null;
  let onError = null;
  const pending = new Map();
  let timer = null;
  const lsGet = k => {
    try {
      const v = localStorage.getItem(k);
      return v == null ? undefined : JSON.parse(v);
    } catch (e) {
      return undefined;
    }
  };
  function openIDB() {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) return reject(new Error('IndexedDB unavailable'));
      let req;
      try {
        req = indexedDB.open('khatfa', 1);
      } catch (e) {
        return reject(e);
      }
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains('kv')) req.result.createObjectStore('kv');
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      req.onblocked = () => reject(new Error('IndexedDB blocked'));
      setTimeout(() => reject(new Error('IndexedDB timed out')), 5000);
    });
  }
  const idbReq = (mode, fn) => new Promise((resolve, reject) => {
    const tx = db.transaction('kv', mode);
    const st = tx.objectStore('kv');
    const r = fn(st);
    tx.oncomplete = () => resolve(r && r.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('aborted'));
  });
  function idbAll() {
    return new Promise((resolve, reject) => {
      const tx = db.transaction('kv', 'readonly');
      const st = tx.objectStore('kv');
      const kr = st.getAllKeys();
      const vr = st.getAll();
      tx.oncomplete = () => {
        const out = {};
        (kr.result || []).forEach((k, i) => {
          out[k] = vr.result[i];
        });
        resolve(out);
      };
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error('aborted'));
    });
  }
  function report(err) {
    const quota = err && (err.name === 'QuotaExceededError' || /quota/i.test(String(err.message || err)));
    if (onError) onError(quota ? 'storeFull' : 'storeFail');
  }
  async function flush() {
    timer = null;
    const batch = [...pending.entries()];
    pending.clear();
    if (!batch.length || backend === 'memory') return;
    try {
      if (backend === 'indexeddb') {
        await idbReq('readwrite', st => {
          batch.forEach(([k, v]) => v === undefined ? st.delete(k) : st.put(v, k));
          return null;
        });
      } else {
        batch.forEach(([k, v]) => v === undefined ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)));
      }
    } catch (e) {
      report(e);
    }
  }
  const schedule = () => {
    if (!timer) timer = setTimeout(flush, 120);
  };
  return {
    async init() {
      try {
        db = await openIDB();
        Object.assign(mem, await idbAll());
        backend = 'indexeddb';
        if (!STORE_KEYS.some(k => mem[k] !== undefined)) {
          STORE_KEYS.forEach(k => {
            const v = lsGet(k);
            if (v !== undefined) {
              mem[k] = v;
              pending.set(k, v);
            }
          });
          await flush();
        }
      } catch (e) {
        db = null;
        try {
          localStorage.setItem('kh__probe', '1');
          localStorage.removeItem('kh__probe');
          STORE_KEYS.forEach(k => {
            const v = lsGet(k);
            if (v !== undefined) mem[k] = v;
          });
          backend = 'localStorage';
        } catch (e2) {
          backend = 'memory';
        }
      }
      try {
        if (navigator.storage && navigator.storage.persist) navigator.storage.persist();
      } catch (e) {}
      window.addEventListener('pagehide', () => flush());
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') flush();
      });
    },
    get(k, fallback) {
      const v = mem[k];
      return v === undefined || v === null ? fallback : v;
    },
    set(k, v) {
      mem[k] = v;
      pending.set(k, v);
      schedule();
      return true;
    },
    del(k) {
      delete mem[k];
      pending.set(k, undefined);
      schedule();
      return true;
    },
    flush,
    get backend() {
      return backend;
    },
    set onError(fn) {
      onError = fn;
    }
  };
})();
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
const todayStamp = () => {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};
const BACKUP_FORMAT = 1;
function makeBackup(state) {
  return {
    app: 'khatfa',
    format: BACKUP_FORMAT,
    exportedAt: new Date().toISOString(),
    data: {
      settings: state.settings || {},
      current: state.game || null,
      past: state.past || [],
      packs: state.packs || []
    }
  };
}
function validateBackup(obj) {
  if (!obj || typeof obj !== 'object' || obj.app !== 'khatfa') return {
    ok: false,
    error: 'bkNotOurs'
  };
  if (typeof obj.format !== 'number' || obj.format > BACKUP_FORMAT) return {
    ok: false,
    error: 'bkNewer'
  };
  const d = obj.data || {};
  if (!Array.isArray(d.past) || !Array.isArray(d.packs)) return {
    ok: false,
    error: 'bkDamaged'
  };
  const games = [...d.past, ...(d.current ? [d.current] : [])];
  if (games.some(g => !g || !Array.isArray(g.teams) || !Array.isArray(g.cells) || !g.rules)) return {
    ok: false,
    error: 'bkDamaged'
  };
  if (d.packs.some(p => !p || typeof p.id !== 'string' || !Array.isArray(p.categories))) return {
    ok: false,
    error: 'bkDamaged'
  };
  return {
    ok: true,
    data: d,
    summary: {
      past: d.past.length,
      current: !!d.current,
      packs: d.packs.length,
      exportedAt: obj.exportedAt
    }
  };
}
const pwa = (() => {
  let deferred = null;
  let waiting = null;
  const subs = new Set();
  const emit = () => subs.forEach(fn => fn());
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferred = e;
    emit();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    emit();
  });
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').then(reg => {
        const watch = w => {
          if (!w) return;
          w.addEventListener('statechange', () => {
            if (w.state === 'installed' && navigator.serviceWorker.controller) {
              waiting = w;
              emit();
            }
          });
        };
        if (reg.waiting && navigator.serviceWorker.controller) {
          waiting = reg.waiting;
          emit();
        }
        reg.addEventListener('updatefound', () => watch(reg.installing));
        setInterval(() => reg.update().catch(() => {}), 30 * 60e3);
      }).catch(() => {});
      let reloaded = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!reloaded) {
          reloaded = true;
          location.reload();
        }
      });
    });
  }
  return {
    subscribe(fn) {
      subs.add(fn);
      return () => subs.delete(fn);
    },
    get canPrompt() {
      return !!deferred;
    },
    async prompt() {
      if (!deferred) return;
      deferred.prompt();
      try {
        await deferred.userChoice;
      } catch (e) {}
      deferred = null;
      emit();
    },
    get updateReady() {
      return !!waiting;
    },
    applyUpdate() {
      store.flush();
      if (waiting) waiting.postMessage('skipWaiting');else location.reload();
    }
  };
})();
function usePwa() {
  const [, f] = useState(0);
  useEffect(() => pwa.subscribe(() => f(x => x + 1)), []);
  return pwa;
}
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
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
  pickTitle: ['Pick categories', 'اختيار الفئات'],
  yourPick: ['{team}, pick a category', '{team}، اختاروا فئة'],
  pickedBy: ['Picked by {team}', 'اختيار {team}'],
  picksLeft: ['{n} picks left', 'باقي {n} اختيارات'],
  questionsN: ['{n} questions', '{n} سؤال'],
  undoPick: ['Undo pick', 'تراجع'],
  randomPick: ['Random', 'عشوائي'],
  letsGo: ['Let’s play!', 'يلا نبدأ!'],
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
  howBody: [['Split into two teams. Each team picks categories; they all go on the board.', 'Teams take turns choosing a question. Harder questions are worth more.', 'The host reads it out and starts the clock. Answer right to win the points.', 'Wrong or out of time? The other team gets a short chance to snatch it — a Khatfa!', 'When the board is empty, the team with the most points wins.'], ['انقسموا لفريقين. كل فريق يختار فئات، وكلها تنحط على اللوحة.', 'الفرق تتناوب على اختيار الأسئلة. كل ما صعب السؤال زادت نقاطه.', 'المقدّم يقرأ السؤال ويشغّل الوقت. جاوب صح وخذ النقاط.', 'غلطتوا أو خلص الوقت؟ الفريق الثاني عنده فرصة قصيرة يخطف السؤال… خطفة!', 'إذا خلصت اللوحة، الفريق صاحب أعلى نقاط يفوز.']]
};
let LANG = 'ar';
const setLang = l => {
  LANG = l === 'en' ? 'en' : 'ar';
};
function t(key, vars) {
  const e = S[key];
  let s = e ? LANG === 'ar' ? e[1] : e[0] : key;
  if (vars && typeof s === 'string') Object.keys(vars).forEach(k => {
    s = s.split('{' + k + '}').join(vars[k]);
  });
  return s;
}
function pick(obj, lang) {
  if (obj == null) return '';
  if (typeof obj === 'string') return obj;
  const l = lang || LANG;
  return (obj[l] || obj[l === 'ar' ? 'en' : 'ar'] || '').trim();
}
const hasBoth = obj => !!(obj && typeof obj === 'object' && obj.ar && obj.ar.trim() && obj.en && obj.en.trim());
const looksArabic = s => /[؀-ۿ]/.test(s || '');
const teamName = team => team ? team.name : '';
const qq = (id, tier, qAr, qEn, aAr, aEn, note) => ({
  id,
  tier,
  type: 'text',
  q: {
    ar: qAr,
    en: qEn
  },
  a: {
    ar: aAr,
    en: aEn
  },
  ...(note ? {
    note
  } : {})
});
const SAMPLE_PACK = {
  id: 'sample-v1',
  builtIn: true,
  sample: true,
  name: {
    ar: 'حزمة تجريبية',
    en: 'Sample pack'
  },
  categories: [{
    id: 'c-geo',
    emoji: '🌍',
    name: {
      ar: 'جغرافيا',
      en: 'Geography'
    },
    questions: [qq('geo1', 1, 'ما عاصمة اليابان؟', 'What is the capital of Japan?', 'طوكيو', 'Tokyo'), qq('geo2', 1, 'ما أكبر محيط في العالم؟', 'What is the largest ocean on Earth?', 'المحيط الهادئ', 'The Pacific Ocean'), qq('geo3', 2, 'أي نهر يمر بمدينة القاهرة؟', 'Which river flows through Cairo?', 'نهر النيل', 'The Nile'), qq('geo4', 2, 'ما عاصمة كندا؟', 'What is the capital of Canada?', 'أوتاوا', 'Ottawa', {
      ar: 'كثيرون يظنونها تورونتو، أكبر مدنها.',
      en: 'Many people guess Toronto, its largest city.'
    }), qq('geo5', 3, 'ما أصغر دولة في العالم من حيث المساحة؟', 'What is the smallest country in the world by area?', 'الفاتيكان', 'Vatican City'), qq('geo6', 3, 'ما اسم الصحراء الكبيرة في جنوب شبه الجزيرة العربية؟', 'What is the name of the huge desert in the south of the Arabian Peninsula?', 'الربع الخالي', 'The Rub’ al Khali (Empty Quarter)')]
  }, {
    id: 'c-sci',
    emoji: '🔬',
    name: {
      ar: 'علوم',
      en: 'Science'
    },
    questions: [qq('sci1', 1, 'ما الصيغة الكيميائية للماء؟', 'What is the chemical formula for water?', 'H₂O', 'H₂O'), qq('sci2', 1, 'كم عدد كواكب المجموعة الشمسية؟', 'How many planets are in the Solar System?', '٨ كواكب', '8 planets'), qq('sci3', 2, 'أي غاز تمتصه النباتات لتقوم بالبناء الضوئي؟', 'Which gas do plants take in for photosynthesis?', 'ثاني أكسيد الكربون', 'Carbon dioxide (CO₂)'), qq('sci4', 2, 'ما أقسى مادة طبيعية معروفة؟', 'What is the hardest natural material?', 'الألماس', 'Diamond'), qq('sci5', 3, 'ما الرمز الكيميائي للذهب؟', 'What is the chemical symbol for gold?', 'Au', 'Au', {
      ar: 'من الكلمة اللاتينية Aurum.',
      en: 'From the Latin word aurum.'
    }), qq('sci6', 3, 'كم عظمة في جسم الإنسان البالغ تقريباً؟', 'About how many bones are in an adult human body?', '٢٠٦ عظمات', '206')]
  }, {
    id: 'c-ani',
    emoji: '🐪',
    name: {
      ar: 'حيوانات',
      en: 'Animals'
    },
    questions: [qq('ani1', 1, 'ما أسرع حيوان بري؟', 'What is the fastest land animal?', 'الفهد (الشيتا)', 'The cheetah'), qq('ani2', 1, 'كم رِجلاً للعنكبوت؟', 'How many legs does a spider have?', '٨', '8'), qq('ani3', 2, 'ما أكبر حيوان عاش على الأرض؟', 'What is the largest animal ever known to have lived?', 'الحوت الأزرق', 'The blue whale'), qq('ani4', 2, 'ما الحيوان الثديي الوحيد القادر على الطيران فعلاً؟', 'Which is the only mammal that can truly fly?', 'الخفاش', 'The bat'), qq('ani5', 3, 'كم قلباً للأخطبوط؟', 'How many hearts does an octopus have?', 'ثلاثة', 'Three'), qq('ani6', 3, 'ماذا يُسمّى صغير الناقة في اللغة العربية؟', 'In Arabic, what is a baby camel called?', 'الحُوار', 'Ḥuwār (حُوار)')]
  }, {
    id: 'c-num',
    emoji: '🔢',
    name: {
      ar: 'أرقام',
      en: 'Numbers'
    },
    questions: [qq('num1', 1, 'كم حاصل ٧ × ٨؟', 'What is 7 × 8?', '٥٦', '56'), qq('num2', 1, 'كم دقيقة في ثلاث ساعات؟', 'How many minutes are in three hours?', '١٨٠ دقيقة', '180'), qq('num3', 2, 'كم ضلعاً للشكل السداسي؟', 'How many sides does a hexagon have?', '٦', '6'), qq('num4', 2, 'ما الجذر التربيعي للعدد ١٤٤؟', 'What is the square root of 144?', '١٢', '12'), qq('num5', 3, 'كم ثانية في اليوم الواحد؟', 'How many seconds are in one day?', '٨٦٤٠٠ ثانية', '86,400'), qq('num6', 3, 'كم يساوي ١٥٪ من ٢٠٠؟', 'What is 15% of 200?', '٣٠', '30')]
  }, {
    id: 'c-arb',
    emoji: '✍️',
    name: {
      ar: 'لغتنا',
      en: 'Arabic language'
    },
    questions: [qq('arb1', 1, 'كم عدد حروف الأبجدية العربية؟', 'How many letters are in the Arabic alphabet?', '٢٨ حرفاً', '28'), qq('arb2', 1, 'ما عكس كلمة «كبير»؟', 'What is the opposite of the Arabic word «كبير» (big)?', 'صغير', 'صغير (small)'), qq('arb3', 2, 'ما جمع كلمة «كتاب»؟', 'What is the plural of the Arabic word «كتاب» (book)?', 'كُتُب', 'كُتُب (kutub)'), qq('arb4', 2, 'تُسمّى العربية «لغة …» أيّ حرف؟', 'Arabic is called “the language of the letter …” which letter?', 'الضاد (ض)', 'Ḍād (ض)'), qq('arb5', 3, 'كم نقطة في كلمة «ثقة»؟', 'How many dots are in the Arabic word «ثقة»?', '٧ نقاط', '7', {
      ar: 'ث = ٣، ق = ٢، ة = ٢',
      en: 'ث has 3, ق has 2, ة has 2.'
    }), qq('arb6', 3, 'ما مفرد كلمة «أقلام»؟', 'What is the singular of the Arabic word «أقلام» (pens)?', 'قلم', 'قلم (qalam)')]
  }, {
    id: 'c-food',
    emoji: '🍽️',
    name: {
      ar: 'أكل',
      en: 'Food'
    },
    questions: [qq('food1', 1, 'ما المكوّن الأساسي للحمّص؟', 'What is the main ingredient of hummus?', 'الحمّص (الحبوب)', 'Chickpeas'), qq('food2', 1, 'ما الحبوب الأساسية في الكبسة؟', 'What grain is the base of kabsa?', 'الأرز', 'Rice'), qq('food3', 2, 'من أي بذور يُصنع الطحينة؟', 'Tahini is made from which seeds?', 'السمسم', 'Sesame'), qq('food4', 2, 'ما البهار الذي يعطي القهوة العربية نكهتها المعروفة؟', 'Which spice gives Arabic coffee its well-known flavour?', 'الهيل', 'Cardamom'), qq('food5', 3, 'أي جزء من زهرة الزعفران يُستخدم كبهار؟', 'Which part of the saffron flower is used as the spice?', 'المياسم (الخيوط الحمراء)', 'The stigmas (red threads)'), qq('food6', 3, 'من أي مكسرات تُصنع حلوى المرزبان؟', 'Which nut is marzipan made from?', 'اللوز', 'Almonds')]
  }, {
    id: 'c-spt',
    emoji: '⚽',
    name: {
      ar: 'رياضة',
      en: 'Sport'
    },
    questions: [qq('spt1', 1, 'كم لاعباً لكل فريق داخل ملعب كرة القدم؟', 'How many players does each team have on a football pitch?', '١١ لاعباً', '11'), qq('spt2', 1, 'كم حلقة في علم الألعاب الأولمبية؟', 'How many rings are on the Olympic flag?', '٥ حلقات', '5'), qq('spt3', 2, 'في أي رياضة تُستخدم حركة «السلام دانك»؟', 'In which sport do you do a “slam dunk”?', 'كرة السلة', 'Basketball'), qq('spt4', 2, 'كم لاعباً لكل فريق داخل ملعب الكرة الطائرة؟', 'How many players per team are on a volleyball court?', '٦ لاعبين', '6'), qq('spt5', 3, 'كم طول سباق الماراثون؟', 'How long is a marathon?', '٤٢٫١٩٥ كم', '42.195 km'), qq('spt6', 3, 'في التنس، ماذا تُسمّى النتيجة صفر؟', 'In tennis, what is a score of zero called?', '«لَڤ» (Love)', 'Love')]
  }, {
    id: 'c-spc',
    emoji: '🚀',
    name: {
      ar: 'فضاء',
      en: 'Space'
    },
    questions: [qq('spc1', 1, 'ما أقرب نجم إلى الأرض؟', 'What is the closest star to Earth?', 'الشمس', 'The Sun'), qq('spc2', 1, 'أي كوكب يُلقّب بالكوكب الأحمر؟', 'Which planet is known as the Red Planet?', 'المريخ', 'Mars'), qq('spc3', 2, 'ما أكبر كواكب المجموعة الشمسية؟', 'What is the largest planet in the Solar System?', 'المشتري', 'Jupiter'), qq('spc4', 2, 'كم يستغرق ضوء الشمس تقريباً ليصل إلى الأرض؟', 'Roughly how long does sunlight take to reach Earth?', 'حوالي ٨ دقائق', 'About 8 minutes'), qq('spc5', 3, 'من أول إنسان مشى على سطح القمر؟', 'Who was the first person to walk on the Moon?', 'نيل آرمسترونغ', 'Neil Armstrong', {
      ar: 'كان ذلك عام ١٩٦٩.',
      en: 'It was in 1969.'
    }), qq('spc6', 3, 'أي كوكب سنته هي الأقصر؟', 'Which planet has the shortest year?', 'عطارد', 'Mercury', {
      ar: 'يدور حول الشمس في نحو ٨٨ يوماً.',
      en: 'It goes round the Sun in about 88 days.'
    })]
  }]
};
const DEFAULT_RULES = {
  values: [200, 400, 600],
  perValue: 2,
  catsPerTeam: 3,
  answerTime: 45,
  stealTime: 15,
  steals: true,
  wrongPenalty: false
};
const VALUE_PRESETS = [[200, 400, 600], [100, 200, 300], [300, 600, 900]];
const TIME_CHOICES = [20, 30, 45, 60, 90];
const STEAL_CHOICES = [10, 15, 20, 30];
const HISTORY_MAX = 40;
function cleanRules(r) {
  const x = {
    ...DEFAULT_RULES,
    ...(r || {})
  };
  if (!Array.isArray(x.values) || x.values.length !== 3 || x.values.some(v => typeof v !== 'number' || v <= 0)) x.values = [...DEFAULT_RULES.values];
  x.perValue = x.perValue === 1 ? 1 : 2;
  x.catsPerTeam = clamp(Math.round(x.catsPerTeam) || 3, 1, 6);
  x.answerTime = clamp(Math.round(x.answerTime) || 45, 5, 300);
  x.stealTime = clamp(Math.round(x.stealTime) || 15, 5, 120);
  x.steals = x.steals !== false;
  x.wrongPenalty = !!x.wrongPenalty;
  return x;
}
const teamById = (g, id) => g.teams.find(t => t.id === id);
const turnTeam = g => g.teams[g.turn % g.teams.length];
const nextTeamIndex = (g, i) => (i + 1) % g.teams.length;
const catById = (g, id) => g.cats.find(c => c.id === id);
const cellById = (g, id) => g.cells.find(c => c.id === id);
const openCells = g => g.cells.filter(c => c.status === 'open');
const isBoardDone = g => g.phase !== 'pick' && openCells(g).length === 0;
function withHistory(g, label) {
  const {
    history,
    ...snap
  } = g;
  return {
    ...g,
    history: [...(history || []), {
      label,
      snap
    }].slice(-HISTORY_MAX)
  };
}
function undo(g) {
  const h = g.history || [];
  if (!h.length) return g;
  const last = h[h.length - 1];
  return {
    ...last.snap,
    history: h.slice(0, -1)
  };
}
const undoLabel = g => {
  const h = g.history || [];
  return h.length ? h[h.length - 1].label : null;
};
function createGame(pack, teams, rules, now = Date.now()) {
  const r = cleanRules(rules);
  return {
    v: 1,
    id: uid(),
    createdAt: now,
    pack: {
      id: pack.id,
      name: pack.name,
      sample: !!pack.sample
    },
    rules: r,
    teams: teams.map((tm, i) => ({
      id: 't' + i,
      name: (tm.name || '').trim(),
      color: tm.color || COLORS[i],
      emoji: tm.emoji || EMOJIS[i],
      score: 0
    })),
    pool: pack.categories.map(c => ({
      id: c.id,
      emoji: c.emoji,
      name: c.name,
      questions: c.questions
    })),
    cats: [],
    cells: [],
    log: [],
    phase: 'pick',
    turn: 0,
    current: null,
    history: []
  };
}
const picksNeeded = g => g.rules.catsPerTeam * g.teams.length;
const pickingTeam = g => g.teams[g.cats.length % g.teams.length];
const usable = c => c.questions && c.questions.length > 0;
function pickCategory(g, catId) {
  if (g.phase !== 'pick') return g;
  const c = g.pool.find(x => x.id === catId);
  if (!c || !usable(c) || g.cats.some(x => x.id === catId)) return g;
  const by = pickingTeam(g).id;
  let n = withHistory(g, 'pick');
  n = {
    ...n,
    cats: [...n.cats, {
      id: c.id,
      emoji: c.emoji,
      name: c.name,
      by
    }]
  };
  if (n.cats.length >= picksNeeded(n)) n = buildBoard(n);
  return n;
}
function randomPick(g) {
  const left = g.pool.filter(c => usable(c) && !g.cats.some(x => x.id === c.id));
  return left.length ? pickCategory(g, left[Math.floor(Math.random() * left.length)].id) : g;
}
function buildBoard(g) {
  const cells = [];
  g.cats.forEach(cat => {
    const src = g.pool.find(x => x.id === cat.id);
    const used = new Set();
    const byTier = tier => shuffle(src.questions.filter(q => (q.tier || 1) === tier && !used.has(q.id)));
    [1, 2, 3].forEach(tier => {
      for (let k = 0; k < g.rules.perValue; k++) {
        let q = byTier(tier)[0];
        if (!q) q = shuffle(src.questions.filter(x => !used.has(x.id))).sort((a, b) => Math.abs((a.tier || 1) - tier) - Math.abs((b.tier || 1) - tier))[0];
        if (q) used.add(q.id);
        cells.push({
          id: cat.id + ':' + tier + ':' + k,
          cat: cat.id,
          tier,
          value: g.rules.values[tier - 1],
          q: q || null,
          status: q ? 'open' : 'empty'
        });
      }
    });
  });
  return {
    ...g,
    cells,
    phase: 'board',
    turn: 0,
    pool: undefined
  };
}
function openCell(g, cellId, now = Date.now()) {
  const c = cellById(g, cellId);
  if (g.phase !== 'board' || !c || c.status !== 'open') return g;
  const n = withHistory(g, 'open');
  return {
    ...n,
    phase: 'question',
    current: {
      cell: c.id,
      stage: 'answer',
      team: turnTeam(g).id,
      endsAt: now + ms(g.rules.answerTime * 1000),
      pausedLeft: null,
      result: null
    }
  };
}
const curCell = g => g.current ? cellById(g, g.current.cell) : null;
const timeLeft = (g, now = Date.now()) => {
  const cur = g.current;
  if (!cur || cur.stage === 'reveal') return 0;
  if (cur.pausedLeft != null) return cur.pausedLeft;
  return Math.max(0, cur.endsAt - now);
};
function pauseTimer(g, now = Date.now()) {
  const cur = g.current;
  if (!cur || cur.stage === 'reveal' || cur.pausedLeft != null) return g;
  return {
    ...g,
    current: {
      ...cur,
      pausedLeft: Math.max(0, cur.endsAt - now)
    }
  };
}
function resumeTimer(g, now = Date.now()) {
  const cur = g.current;
  if (!cur || cur.pausedLeft == null) return g;
  return {
    ...g,
    current: {
      ...cur,
      endsAt: now + cur.pausedLeft,
      pausedLeft: null
    }
  };
}
const addScore = (g, teamId, d) => ({
  ...g,
  teams: g.teams.map(tm => tm.id === teamId ? {
    ...tm,
    score: tm.score + d
  } : tm)
});
function markCorrect(g) {
  const cur = g.current;
  const c = curCell(g);
  if (g.phase !== 'question' || !cur || !c || cur.stage !== 'answer' && cur.stage !== 'steal') return g;
  let n = withHistory(g, cur.stage === 'steal' ? 'stolen' : 'correct');
  n = addScore(n, cur.team, c.value);
  const kind = cur.stage === 'steal' ? 'stolen' : 'correct';
  return {
    ...n,
    current: {
      ...cur,
      stage: 'reveal',
      pausedLeft: null,
      result: {
        kind,
        team: cur.team,
        points: c.value,
        answeredBy: cur.answeredBy || cur.team,
        penalty: cur.penalty || 0
      }
    }
  };
}
function markWrong(g, now = Date.now()) {
  const cur = g.current;
  const c = curCell(g);
  if (g.phase !== 'question' || !cur || !c) return g;
  if (cur.stage === 'answer') {
    let n = withHistory(g, 'wrong');
    const penalty = n.rules.wrongPenalty ? c.value : 0;
    if (penalty) n = addScore(n, cur.team, -penalty);
    const idx = n.teams.findIndex(tm => tm.id === cur.team);
    if (n.rules.steals && n.teams.length > 1) {
      const thief = n.teams[nextTeamIndex(n, idx)].id;
      return {
        ...n,
        current: {
          ...cur,
          stage: 'steal',
          answeredBy: cur.team,
          team: thief,
          penalty,
          endsAt: now + ms(n.rules.stealTime * 1000),
          pausedLeft: null
        }
      };
    }
    return {
      ...n,
      current: {
        ...cur,
        stage: 'reveal',
        pausedLeft: null,
        penalty,
        result: {
          kind: 'missed',
          team: null,
          points: 0,
          answeredBy: cur.team,
          penalty
        }
      }
    };
  }
  if (cur.stage === 'steal') {
    const n = withHistory(g, 'missed');
    return {
      ...n,
      current: {
        ...cur,
        stage: 'reveal',
        pausedLeft: null,
        result: {
          kind: 'missed',
          team: null,
          points: 0,
          answeredBy: cur.answeredBy,
          penalty: cur.penalty || 0
        }
      }
    };
  }
  return g;
}
function skipQuestion(g) {
  const cur = g.current;
  if (g.phase !== 'question' || !cur || cur.stage === 'reveal') return g;
  const n = withHistory(g, 'skip');
  return {
    ...n,
    current: {
      ...cur,
      stage: 'reveal',
      pausedLeft: null,
      result: {
        kind: 'skipped',
        team: null,
        points: 0,
        answeredBy: cur.answeredBy || cur.team,
        penalty: cur.penalty || 0
      }
    }
  };
}
function putBack(g) {
  const cur = g.current;
  if (g.phase !== 'question' || !cur || cur.stage !== 'answer') return g;
  const n = withHistory(g, 'putBack');
  return {
    ...n,
    phase: 'board',
    current: null
  };
}
function finishQuestion(g, now = Date.now()) {
  const cur = g.current;
  const c = curCell(g);
  if (g.phase !== 'question' || !cur || cur.stage !== 'reveal' || !c) return g;
  const r = cur.result || {};
  let n = withHistory(g, 'next');
  const entry = {
    cell: c.id,
    cat: c.cat,
    tier: c.tier,
    value: c.value,
    turnTeam: turnTeam(n).id,
    kind: r.kind,
    team: r.team,
    points: r.points || 0,
    penalty: r.penalty || 0,
    at: now
  };
  n = {
    ...n,
    cells: n.cells.map(x => x.id === c.id ? {
      ...x,
      status: 'done',
      result: {
        kind: r.kind,
        team: r.team
      }
    } : x),
    log: [...n.log, entry],
    current: null,
    turn: nextTeamIndex(n, n.turn),
    phase: 'board'
  };
  if (isBoardDone(n)) n = {
    ...n,
    phase: 'done',
    endedAt: now
  };
  return n;
}
function endGame(g, now = Date.now()) {
  if (g.phase === 'done') return g;
  const n = withHistory(g, 'end');
  return {
    ...n,
    phase: 'done',
    current: null,
    endedAt: now,
    endedEarly: true
  };
}
function adjustScore(g, teamId, delta, now = Date.now()) {
  if (!delta || !teamById(g, teamId)) return g;
  const n = withHistory(g, 'adjust');
  return {
    ...addScore(n, teamId, delta),
    log: [...n.log, {
      kind: 'adjust',
      team: teamId,
      points: delta,
      at: now
    }]
  };
}
function winners(g) {
  const top = Math.max(...g.teams.map(tm => tm.score));
  const w = g.teams.filter(tm => tm.score === top);
  return w.length === g.teams.length && g.teams.length > 1 ? [] : w;
}
function gameStats(g) {
  const per = {};
  g.teams.forEach(tm => {
    per[tm.id] = {
      correct: 0,
      own: 0,
      steals: 0,
      streak: 0,
      best: 0,
      stolenPts: 0
    };
  });
  let biggestSteal = null,
    biggestWin = null;
  g.log.forEach(e => {
    if (e.kind === 'adjust' || e.kind === 'skipped') return;
    const own = per[e.turnTeam];
    if (own) own.own++;
    if (e.kind === 'correct' && per[e.team]) {
      per[e.team].correct++;
      per[e.team].streak++;
      per[e.team].best = Math.max(per[e.team].best, per[e.team].streak);
      if (!biggestWin || e.value > biggestWin.value) biggestWin = e;
    } else if (own) own.streak = 0;
    if (e.kind === 'stolen' && per[e.team]) {
      per[e.team].steals++;
      per[e.team].stolenPts += e.points;
      if (!biggestSteal || e.value > biggestSteal.value) biggestSteal = e;
    }
  });
  const list = g.teams.map(tm => ({
    team: tm,
    ...per[tm.id],
    acc: per[tm.id].own ? Math.round(per[tm.id].correct / per[tm.id].own * 100) : 0
  }));
  const by = k => {
    const top = [...list].sort((a, b) => b[k] - a[k])[0];
    return top && top[k] > 0 && list.filter(x => x[k] === top[k]).length === 1 ? top : null;
  };
  return {
    list,
    biggestSteal,
    biggestWin,
    bestStreak: by('best'),
    mostSteals: by('steals'),
    sharpest: by('acc')
  };
}
function rematch(g, pack, now = Date.now()) {
  return createGame(pack, g.teams.map(({
    name,
    color,
    emoji
  }) => ({
    name,
    color,
    emoji
  })), g.rules, now);
}
const pastEntry = g => ({
  id: g.id,
  createdAt: g.createdAt,
  endedAt: g.endedAt,
  pack: g.pack,
  rules: g.rules,
  teams: g.teams,
  cats: g.cats,
  cells: g.cells.map(({
    q,
    ...rest
  }) => rest),
  log: g.log,
  phase: 'done'
});
class Boundary extends React.Component {
  constructor(p) {
    super(p);
    this.state = {
      err: null
    };
  }
  static getDerivedStateFromError(err) {
    return {
      err
    };
  }
  componentDidCatch(err) {
    try {
      console.error(err);
    } catch (e) {}
  }
  render() {
    if (!this.state.err) return this.props.children;
    return React.createElement("div", {
      className: "app"
    }, React.createElement("div", {
      className: "card stack"
    }, React.createElement("h2", {
      className: "display"
    }, t('crashed')), React.createElement("p", {
      className: "muted",
      style: {
        margin: 0
      }
    }, t('crashedSub')), React.createElement("button", {
      className: "btn btn-gold",
      onClick: () => location.reload()
    }, t('reload')), React.createElement("pre", {
      className: "errtxt"
    }, String(this.state.err && (this.state.err.message || this.state.err)))));
  }
}
function Sheet({
  onClose,
  children,
  center
}) {
  useEffect(() => {
    const k = e => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return React.createElement("div", {
    className: 'backdrop' + (center ? ' center' : ''),
    onClick: onClose
  }, React.createElement("div", {
    className: center ? 'modal' : 'sheet',
    onClick: e => e.stopPropagation(),
    role: "dialog",
    "aria-modal": "true"
  }, !center && React.createElement("div", {
    className: "grab"
  }), children));
}
function Confirm({
  title,
  body,
  yes,
  danger,
  onYes,
  onClose
}) {
  return React.createElement(Sheet, {
    center: true,
    onClose: onClose
  }, React.createElement("h2", {
    className: "display",
    style: {
      fontSize: 30
    }
  }, title), body && React.createElement("p", {
    className: "muted",
    style: {
      margin: 0
    }
  }, body), React.createElement("div", {
    className: "row"
  }, React.createElement("button", {
    className: "btn btn-ghost grow",
    onClick: onClose
  }, t('cancel')), React.createElement("button", {
    className: 'btn grow ' + (danger ? 'btn-danger solid' : 'btn-gold'),
    onClick: () => {
      onYes();
      onClose();
    }
  }, yes || t('confirm'))));
}
const backArrow = () => LANG === 'ar' ? '→' : '←';
function TopBar({
  onBack,
  left,
  title,
  right,
  dense
}) {
  return React.createElement("div", {
    className: 'topbar' + (dense ? ' dense' : '')
  }, left || (onBack ? React.createElement("button", {
    className: "iconbtn",
    onClick: onBack,
    "aria-label": t('back')
  }, backArrow()) : React.createElement("span", {
    className: "iconspace"
  })), React.createElement("div", {
    className: "title"
  }, title), right || React.createElement("span", {
    className: "iconspace"
  }));
}
const MenuBtn = ({
  onClick
}) => React.createElement("button", {
  className: "iconbtn",
  onClick: onClick,
  "aria-label": t('menu')
}, "\u2630");
function Seg({
  value,
  options,
  onChange,
  label
}) {
  return React.createElement("div", {
    className: "seg",
    role: "group",
    "aria-label": label
  }, options.map(([v, l]) => React.createElement("button", {
    key: String(v),
    type: "button",
    "aria-pressed": value === v,
    onClick: () => onChange(v)
  }, l)));
}
function Toggle({
  on,
  onChange,
  title,
  sub
}) {
  return React.createElement("button", {
    type: "button",
    className: "toggle",
    "aria-pressed": on,
    onClick: () => onChange(!on)
  }, React.createElement("span", {
    className: "grow"
  }, React.createElement("b", {
    className: "tgl-t"
  }, title), sub && React.createElement("span", {
    className: "small muted"
  }, sub)), React.createElement("span", {
    className: "sw"
  }));
}
function Toast({
  msg,
  ok,
  onClose
}) {
  useEffect(() => {
    if (!ok) return undefined;
    const id = setTimeout(onClose, 3500);
    return () => clearTimeout(id);
  }, [msg, ok]);
  return React.createElement("div", {
    className: 'toast' + (ok ? ' ok' : ''),
    role: "status"
  }, React.createElement("span", {
    className: "grow"
  }, msg), React.createElement("button", {
    onClick: onClose
  }, t('dismiss')));
}
function LangButton({
  settings,
  setSettings
}) {
  return React.createElement("button", {
    className: "pillbtn langbtn",
    onClick: () => setSettings({
      ...settings,
      lang: settings.lang === 'ar' ? 'en' : 'ar'
    }),
    "aria-label": t('langSwitchLabel'),
    lang: LANG === 'ar' ? 'en' : 'ar'
  }, t('langSwitch'));
}
const QLangCtx = React.createContext('auto');
function Txt({
  v,
  as = 'span',
  className,
  both
}) {
  const qLang = React.useContext(QLangCtx);
  const Tag = as;
  const main = pick(v, LANG);
  const other = LANG === 'ar' ? 'en' : 'ar';
  const showOther = (both || qLang === 'both') && v && typeof v === 'object' && v[other] && v[other].trim() && v[other].trim() !== main;
  return React.createElement(Tag, {
    className: className
  }, React.createElement("span", {
    dir: "auto",
    lang: looksArabic(main) ? 'ar' : 'en'
  }, main), showOther && React.createElement("span", {
    className: "alt",
    dir: "auto",
    lang: other
  }, v[other].trim()));
}
const Name = ({
  team
}) => React.createElement("bdi", {
  dir: "auto"
}, teamName(team));
function AnimatedNumber({
  value
}) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    if (shown === value) return undefined;
    if (reducedMotion()) {
      setShown(value);
      from.current = value;
      return undefined;
    }
    const start = performance.now();
    const a = from.current;
    const dur = 700;
    let raf;
    const step = now => {
      const k = Math.min(1, (now - start) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      const v = Math.round(a + (value - a) * e);
      setShown(v);
      if (k < 1) raf = requestAnimationFrame(step);else from.current = value;
    };
    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      from.current = value;
    };
  }, [value]);
  return React.createElement("span", {
    className: "num"
  }, shown);
}
function useDelta(value) {
  const prev = useRef(value);
  const [d, setD] = useState(null);
  useEffect(() => {
    if (value !== prev.current) {
      setD({
        n: value - prev.current,
        k: Date.now()
      });
      prev.current = value;
    }
  }, [value]);
  useEffect(() => {
    if (!d) return undefined;
    const id = setTimeout(() => setD(null), 1600);
    return () => clearTimeout(id);
  }, [d]);
  return d;
}
function ScoreCard({
  team,
  active,
  label,
  big
}) {
  const d = useDelta(team.score);
  return React.createElement("div", {
    className: 'scard' + (active ? ' active' : '') + (big ? ' big' : ''),
    style: tStyle(team)
  }, React.createElement("span", {
    className: "s-em",
    "aria-hidden": "true"
  }, team.emoji), React.createElement("span", {
    className: "s-name"
  }, React.createElement(Name, {
    team: team
  })), React.createElement("span", {
    className: "s-score"
  }, React.createElement(AnimatedNumber, {
    value: team.score
  })), active && label && React.createElement("span", {
    className: "s-turn"
  }, label), d && React.createElement("span", {
    key: d.k,
    dir: "ltr",
    className: 's-delta' + (d.n < 0 ? ' neg' : '')
  }, d.n > 0 ? '+' : '−', Math.abs(d.n)));
}
function ScoreBar({
  g,
  activeId,
  label,
  big
}) {
  return React.createElement("div", {
    className: 'scorebar n' + g.teams.length + (big ? ' big' : '')
  }, g.teams.map(tm => React.createElement(ScoreCard, {
    key: tm.id,
    team: tm,
    active: tm.id === activeId,
    label: label,
    big: big
  })));
}
function Flash({
  f,
  g,
  onDone
}) {
  useEffect(() => {
    const id = setTimeout(onDone, ms(f.kind === 'stolen' ? 1700 : 1300));
    return () => clearTimeout(id);
  }, [f]);
  const team = f.team && g ? teamById(g, f.team) : null;
  const big = {
    correct: t('flashCorrect'),
    stolen: t('flashSteal'),
    wrong: t('flashWrong'),
    missed: t('flashMissed'),
    timeup: t('timeUp')
  }[f.kind];
  return React.createElement("div", {
    className: 'flash k-' + f.kind,
    onClick: onDone,
    role: "status",
    "aria-live": "assertive",
    style: team ? tStyle(team) : undefined
  }, React.createElement("div", {
    className: "inner"
  }, React.createElement("div", {
    className: "big"
  }, big), team && f.points > 0 && React.createElement("div", {
    className: "to"
  }, t('pointsTo', {
    n: f.points,
    team: teamName(team)
  })), team && f.points < 0 && React.createElement("div", {
    className: "to"
  }, t('lostPoints', {
    n: -f.points,
    team: teamName(team)
  }))));
}
function LogoMark({
  size = 64
}) {
  return React.createElement("svg", {
    className: "logomark",
    width: size,
    height: size,
    viewBox: "0 0 64 64",
    "aria-hidden": "true"
  }, React.createElement("rect", {
    x: "2",
    y: "2",
    width: "60",
    height: "60",
    rx: "14",
    fill: "#221d47",
    stroke: "#3d3672",
    strokeWidth: "2"
  }), [[10, 14], [26, 14], [10, 34], [26, 34], [42, 34]].map(([x, y], i) => React.createElement("rect", {
    key: i,
    x: x,
    y: y,
    width: "13",
    height: "16",
    rx: "3",
    fill: "#ffc83d"
  })), React.createElement("g", {
    transform: "rotate(-18 50 18)"
  }, React.createElement("rect", {
    x: "43",
    y: "8",
    width: "13",
    height: "16",
    rx: "3",
    fill: "#22cfd6"
  })), React.createElement("path", {
    d: "M41 30 L47 22",
    stroke: "#22cfd6",
    strokeWidth: "3",
    strokeLinecap: "round"
  }));
}
function Home({
  game,
  past,
  settings,
  setSettings,
  onNew,
  onContinue,
  onHow,
  onSettings
}) {
  const p = usePwa();
  const live = game && game.phase !== 'done' ? game : null;
  const left = live ? openCells(live).length : 0;
  return React.createElement("div", {
    className: "app"
  }, React.createElement("div", {
    className: "topbar"
  }, React.createElement(LangButton, {
    settings: settings,
    setSettings: setSettings
  }), React.createElement("div", {
    className: "title"
  }), React.createElement("button", {
    className: "iconbtn",
    onClick: onSettings,
    "aria-label": t('settings')
  }, "\u2699\uFE0F")), React.createElement("div", {
    className: "hero"
  }, React.createElement("span", {
    className: "tag"
  }, React.createElement("i", null), t('gameNight')), React.createElement(LogoMark, {
    size: 84
  }), React.createElement("h1", {
    className: "logo"
  }, React.createElement("span", {
    className: "ar",
    lang: "ar"
  }, "\u062E\u0637\u0641\u0629"), React.createElement("span", {
    className: "en",
    lang: "en"
  }, "KHATFA")), React.createElement("p", {
    className: "muted tagline"
  }, t('tagline'))), p.updateReady && React.createElement("div", {
    className: "card row update"
  }, React.createElement("span", {
    className: "grow"
  }, t('updateReady')), React.createElement("button", {
    className: "btn btn-sm btn-gold",
    onClick: () => p.applyUpdate()
  }, t('reload'))), React.createElement("div", {
    className: "menu"
  }, live && React.createElement("button", {
    className: "card resume rowbtn",
    onClick: onContinue
  }, React.createElement("span", {
    className: "r-em"
  }, "\u25B6\uFE0F"), React.createElement("span", {
    className: "grow"
  }, React.createElement("b", {
    className: "r-t"
  }, t('continueGame')), React.createElement("span", {
    className: "small muted r-s"
  }, live.phase === 'pick' ? t('resumePick', {
    a: teamName(live.teams[0]),
    b: teamName(live.teams[1])
  }) : t('resumeSub', {
    a: teamName(live.teams[0]),
    b: teamName(live.teams[1]),
    n: left
  })))), React.createElement("button", {
    className: "btn btn-gold",
    onClick: onNew
  }, t('newGame')), React.createElement("div", {
    className: "row"
  }, React.createElement("button", {
    className: "btn grow",
    onClick: onHow
  }, t('howToPlay')), React.createElement("button", {
    className: "btn grow",
    onClick: onSettings
  }, t('settings'))), p.canPrompt && React.createElement("button", {
    className: "btn btn-ghost",
    onClick: () => p.prompt()
  }, "\uD83D\uDCF2 ", t('install'))), React.createElement("p", {
    className: "hint center"
  }, t('sampleNote')), past.length > 0 && React.createElement("section", {
    className: "stack-sm"
  }, React.createElement("span", {
    className: "eyebrow"
  }, t('pastGames')), past.slice(0, 5).map(g => {
    const w = winners(g);
    return React.createElement("div", {
      key: g.id,
      className: "pastrow"
    }, React.createElement("span", {
      className: "grow"
    }, g.teams.map((tm, i) => React.createElement("span", {
      key: tm.id
    }, i ? ' · ' : '', tm.emoji, " ", React.createElement(Name, {
      team: tm
    }), " ", React.createElement("b", {
      className: "num"
    }, tm.score)))), React.createElement("span", {
      className: "small muted"
    }, w.length ? React.createElement(React.Fragment, null, w[0].emoji, " ", t('won')) : t('draw')));
  })));
}
function HowTo({
  onClose
}) {
  const lines = LANG === 'ar' ? S.howBody[1] : S.howBody[0];
  return React.createElement(Sheet, {
    onClose: onClose
  }, React.createElement("div", {
    className: "stack"
  }, React.createElement("h2", {
    className: "display"
  }, t('howToPlay')), React.createElement("ol", {
    className: "howlist"
  }, lines.map((l, i) => React.createElement("li", {
    key: i
  }, l))), React.createElement("button", {
    className: "btn btn-gold",
    onClick: onClose
  }, t('close'))));
}
const PACKS = () => [SAMPLE_PACK];
const freshTeams = () => [{
  name: t('defaultTeam1'),
  color: COLORS[0],
  emoji: EMOJIS[0]
}, {
  name: t('defaultTeam2'),
  color: COLORS[1],
  emoji: EMOJIS[1]
}];
function TeamEditor({
  team,
  i,
  onChange,
  others
}) {
  const used = new Set(others.map(o => o.color));
  return React.createElement("div", {
    className: "teamedit",
    style: tStyle(team)
  }, React.createElement("div", {
    className: "row"
  }, React.createElement("button", {
    className: "emo",
    "aria-label": t('changeEmoji'),
    onClick: () => onChange({
      ...team,
      emoji: EMOJIS[(EMOJIS.indexOf(team.emoji) + 1) % EMOJIS.length]
    })
  }, team.emoji), React.createElement("input", {
    className: "input grow",
    dir: "auto",
    maxLength: 18,
    value: team.name,
    "aria-label": t('teamN', {
      n: i + 1
    }),
    placeholder: t('teamN', {
      n: i + 1
    }),
    onChange: e => onChange({
      ...team,
      name: e.target.value
    })
  })), React.createElement("div", {
    className: "chips swatches",
    role: "group",
    "aria-label": t('colour')
  }, COLORS.map(c => React.createElement("button", {
    key: c,
    className: 'swatch' + (team.color === c ? ' on' : ''),
    disabled: used.has(c),
    style: {
      background: c
    },
    "aria-label": t('colour') + ' ' + c,
    "aria-pressed": team.color === c,
    onClick: () => onChange({
      ...team,
      color: c
    })
  }))));
}
function Setup({
  initial,
  onBack,
  onStart
}) {
  const [teams, setTeams] = useState(() => initial && initial.teams || freshTeams());
  const [rules, setRules] = useState(() => cleanRules(initial && initial.rules));
  const [open, setOpen] = useState(false);
  const pack = PACKS()[0];
  const usableCats = pack.categories.filter(c => c.questions.length).length;
  const need = rules.catsPerTeam * teams.length;
  const problems = [];
  if (teams.some(tm => !tm.name.trim())) problems.push(t('needNames'));
  if (need > usableCats) problems.push(t('needCats', {
    have: usableCats,
    need
  }));
  const set = (k, v) => setRules({
    ...rules,
    [k]: v
  });
  const maxCats = Math.max(1, Math.floor(usableCats / teams.length));
  return React.createElement("div", {
    className: "app"
  }, React.createElement(TopBar, {
    onBack: onBack,
    title: t('setupTitle')
  }), React.createElement("section", {
    className: "stack"
  }, React.createElement("span", {
    className: "eyebrow"
  }, t('teams')), teams.map((tm, i) => React.createElement(TeamEditor, {
    key: i,
    team: tm,
    i: i,
    others: teams.filter((_, j) => j !== i),
    onChange: x => setTeams(teams.map((y, j) => j === i ? x : y))
  }))), React.createElement("section", {
    className: "card stack-sm"
  }, React.createElement("span", {
    className: "eyebrow"
  }, t('pack')), React.createElement("div", {
    className: "row"
  }, React.createElement("span", {
    className: "packem"
  }, "\uD83E\uDDEA"), React.createElement("b", {
    className: "grow"
  }, React.createElement(Txt, {
    v: pack.name
  })), React.createElement("span", {
    className: "small muted"
  }, t('questionsN', {
    n: pack.categories.reduce((n, c) => n + c.questions.length, 0)
  })))), React.createElement("section", {
    className: "rsec"
  }, React.createElement("button", {
    className: "rtitle",
    "aria-expanded": open,
    onClick: () => setOpen(!open)
  }, React.createElement("span", {
    className: "re"
  }, "\u2699\uFE0F"), React.createElement("span", {
    className: "grow"
  }, React.createElement("b", null, t('houseRules')), React.createElement("span", {
    className: "small muted rsum"
  }, t('rulesSummary', {
    vals: rules.values.join('/'),
    per: rules.perValue,
    cats: rules.catsPerTeam,
    a: rules.answerTime,
    s: rules.stealTime
  }))), React.createElement("span", {
    className: "chev"
  }, open ? '▲' : '▼')), open && React.createElement("div", {
    className: "rbody stack"
  }, React.createElement("div", {
    className: "field"
  }, React.createElement("span", {
    className: "label"
  }, t('pointValues')), React.createElement(Seg, {
    value: rules.values.join('/'),
    options: VALUE_PRESETS.map(v => [v.join('/'), v.join('/')]),
    onChange: v => set('values', v.split('/').map(Number)),
    label: t('pointValues')
  })), React.createElement("div", {
    className: "field"
  }, React.createElement("span", {
    className: "label"
  }, t('perValue')), React.createElement(Seg, {
    value: rules.perValue,
    options: [[1, '1'], [2, '2']],
    onChange: v => set('perValue', v),
    label: t('perValue')
  })), React.createElement("div", {
    className: "field"
  }, React.createElement("span", {
    className: "label"
  }, t('catsPerTeam')), React.createElement(Seg, {
    value: rules.catsPerTeam,
    options: [1, 2, 3, 4].filter(n => n <= maxCats).map(n => [n, String(n)]),
    onChange: v => set('catsPerTeam', v),
    label: t('catsPerTeam')
  })), React.createElement("div", {
    className: "field"
  }, React.createElement("span", {
    className: "label"
  }, t('answerTime')), React.createElement(Seg, {
    value: rules.answerTime,
    options: TIME_CHOICES.map(n => [n, t('seconds', {
      n
    })]),
    onChange: v => set('answerTime', v),
    label: t('answerTime')
  })), React.createElement(Toggle, {
    on: rules.steals,
    onChange: v => set('steals', v),
    title: t('stealOn'),
    sub: t('stealOnSub')
  }), rules.steals && React.createElement("div", {
    className: "field"
  }, React.createElement("span", {
    className: "label"
  }, t('stealTime')), React.createElement(Seg, {
    value: rules.stealTime,
    options: STEAL_CHOICES.map(n => [n, t('seconds', {
      n
    })]),
    onChange: v => set('stealTime', v),
    label: t('stealTime')
  })), React.createElement("div", {
    className: "stack-sm"
  }, React.createElement("span", {
    className: "label"
  }, t('modifiers')), React.createElement("p", {
    className: "hint"
  }, t('modifiersSub')), React.createElement(Toggle, {
    on: rules.wrongPenalty,
    onChange: v => set('wrongPenalty', v),
    title: t('wrongPenalty'),
    sub: t('wrongPenaltySub')
  })))), problems.map(p => React.createElement("p", {
    key: p,
    className: "warn"
  }, p)), React.createElement("button", {
    className: "btn btn-gold",
    disabled: problems.length > 0,
    onClick: () => onStart(pack, teams.map(tm => ({
      ...tm,
      name: tm.name.trim()
    })), rules)
  }, t('pickCategories')));
}
function useNow(active, every = 200) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!active) return undefined;
    const id = setInterval(() => setNow(Date.now()), every);
    return () => clearInterval(id);
  }, [active, every]);
  return now;
}
const UNDO_TXT = {
  pick: ['category pick', 'اختيار الفئة'],
  open: ['opening the question', 'فتح السؤال'],
  correct: ['“correct”', '«صح»'],
  wrong: ['“wrong”', '«غلط»'],
  stolen: ['the steal', 'الخطف'],
  missed: ['“missed”', '«ضاعت»'],
  skip: ['the skip', 'التخطي'],
  putBack: ['putting it back', 'إرجاع السؤال'],
  next: ['back to the board', 'الرجوع للوحة'],
  end: ['ending the game', 'إنهاء اللعبة'],
  adjust: ['the score fix', 'تعديل النقاط']
};
const undoText = g => {
  const l = undoLabel(g);
  return l ? t('undoWhat', {
    what: (UNDO_TXT[l] || [l, l])[LANG === 'ar' ? 1 : 0]
  }) : t('nothingToUndo');
};
function CategoryGrid({
  g,
  onPick,
  big
}) {
  const pickedBy = id => {
    const c = g.cats.find(x => x.id === id);
    return c ? teamById(g, c.by) : null;
  };
  return React.createElement("div", {
    className: 'catgrid' + (big ? ' big' : '')
  }, (g.pool || []).map(c => {
    const by = pickedBy(c.id);
    const off = !!by || !c.questions.length;
    return React.createElement("button", {
      key: c.id,
      className: 'catcard' + (by ? ' taken' : ''),
      disabled: off || !onPick,
      style: by ? tStyle(by) : undefined,
      onClick: () => onPick && onPick(c.id),
      "aria-pressed": !!by
    }, React.createElement("span", {
      className: "cc-em"
    }, c.emoji), React.createElement(Txt, {
      v: c.name,
      className: "cc-name"
    }), by ? React.createElement("span", {
      className: "cc-by"
    }, by.emoji, " ", React.createElement(Name, {
      team: by
    })) : React.createElement("span", {
      className: "cc-n small muted"
    }, t('questionsN', {
      n: c.questions.length
    })));
  }));
}
function CategoryPick({
  g,
  act,
  onMenu,
  onTv
}) {
  const team = pickingTeam(g);
  const left = picksNeeded(g) - g.cats.length;
  return React.createElement("div", {
    className: "app"
  }, React.createElement(TopBar, {
    left: React.createElement(MenuBtn, {
      onClick: onMenu
    }),
    title: t('pickTitle'),
    right: React.createElement(TvButton, {
      onTv: onTv
    }),
    dense: true
  }), React.createElement("div", {
    className: "picker",
    style: tStyle(team)
  }, React.createElement("span", {
    className: "pk-em"
  }, team.emoji), React.createElement("b", {
    className: "pk-t"
  }, t('yourPick', {
    team: teamName(team)
  })), React.createElement("span", {
    className: "small"
  }, t('picksLeft', {
    n: left
  }))), React.createElement(CategoryGrid, {
    g: g,
    onPick: id => act(x => pickCategory(x, id))
  }), React.createElement("div", {
    className: "row"
  }, React.createElement("button", {
    className: "btn btn-ghost grow",
    disabled: !g.cats.length,
    onClick: () => act(undo)
  }, "\u21B6 ", t('undoPick')), React.createElement("button", {
    className: "btn btn-ghost grow",
    onClick: () => act(randomPick)
  }, "\uD83C\uDFB2 ", t('randomPick'))));
}
function Tile({
  g,
  cell,
  onOpen
}) {
  if (cell.status === 'empty') return React.createElement("span", {
    className: "tile empty",
    "aria-label": t('emptyCell')
  }, "\u2013");
  if (cell.status === 'done') {
    const r = cell.result || {};
    const team = r.team ? teamById(g, r.team) : null;
    const mark = r.kind === 'stolen' ? '⚡' : r.kind === 'correct' ? '✓' : '✕';
    return React.createElement("span", {
      className: 'tile done k-' + r.kind,
      style: team ? tStyle(team) : undefined,
      "aria-label": cell.value + ' ' + (team ? teamName(team) : t('logMissed'))
    }, React.createElement("span", {
      className: "num"
    }, cell.value), React.createElement("i", null, mark));
  }
  const active = g.current && g.current.cell === cell.id;
  return React.createElement("button", {
    className: 'tile open' + (active ? ' active' : ''),
    disabled: !onOpen,
    onClick: () => onOpen && onOpen(cell.id)
  }, React.createElement("span", {
    className: "num"
  }, cell.value));
}
function BoardGrid({
  g,
  onOpen,
  big
}) {
  return React.createElement("div", {
    className: 'board n' + g.cats.length + (big ? ' big' : '')
  }, g.cats.map(cat => {
    const by = teamById(g, cat.by);
    const cells = g.cells.filter(c => c.cat === cat.id);
    return React.createElement("section", {
      key: cat.id,
      className: "bcat",
      style: by ? tStyle(by) : undefined
    }, React.createElement("header", {
      className: "bc-head"
    }, React.createElement("span", {
      className: "bc-em"
    }, cat.emoji), React.createElement(Txt, {
      v: cat.name,
      className: "bc-name"
    })), React.createElement("div", {
      className: 'bc-tiles per' + g.rules.perValue
    }, cells.map(c => React.createElement(Tile, {
      key: c.id,
      g: g,
      cell: c,
      onOpen: onOpen
    }))));
  }));
}
function Board({
  g,
  act,
  onMenu,
  onTv
}) {
  const team = turnTeam(g);
  return React.createElement("div", {
    className: "app wide"
  }, React.createElement(TopBar, {
    left: React.createElement(MenuBtn, {
      onClick: onMenu
    }),
    title: t('leftN', {
      n: openCells(g).length
    }),
    right: React.createElement(TvButton, {
      onTv: onTv
    }),
    dense: true
  }), React.createElement(ScoreBar, {
    g: g,
    activeId: team.id,
    label: t('turnShort')
  }), React.createElement("p", {
    className: "turnline",
    style: tStyle(team)
  }, React.createElement("span", null, team.emoji), " ", t('turnOf', {
    team: teamName(team)
  })), React.createElement(BoardGrid, {
    g: g,
    onOpen: id => act(x => openCell(x, id, Date.now()))
  }));
}
function Clock({
  g,
  big
}) {
  const cur = g.current;
  const running = cur && cur.stage !== 'reveal' && cur.pausedLeft == null;
  const now = useNow(running, 200);
  if (!cur || cur.stage === 'reveal') return null;
  const total = ms((cur.stage === 'steal' ? g.rules.stealTime : g.rules.answerTime) * 1000);
  const left = timeLeft(g, now);
  const secs = Math.ceil(left / ms(1000));
  const pct = Math.max(0, Math.min(100, left / total * 100));
  const out = left <= 0;
  return React.createElement("div", {
    className: 'clock' + (secs <= 5 && !out ? ' hot' : '') + (out ? ' out' : '') + (big ? ' big' : ''),
    role: "timer",
    "aria-live": "off"
  }, React.createElement("span", {
    className: "ck-n num"
  }, cur.pausedLeft != null ? '⏸ ' + secs : out ? t('timeUp') : secs), React.createElement("span", {
    className: "ck-bar"
  }, React.createElement("i", {
    style: {
      width: pct + '%'
    }
  })));
}
function QuestionCard({
  cell,
  big,
  showAnswer
}) {
  const q = cell.q;
  return React.createElement("div", {
    className: 'qcard' + (big ? ' big' : '')
  }, React.createElement(Txt, {
    v: q.q,
    as: "p",
    className: "qtext"
  }), showAnswer && React.createElement("div", {
    className: "qans"
  }, React.createElement("span", {
    className: "eyebrow"
  }, t('answer')), React.createElement(Txt, {
    v: q.a,
    as: "p",
    className: "atext",
    both: true
  }), q.note && React.createElement(Txt, {
    v: q.note,
    as: "p",
    className: "anote"
  })));
}
function QHead({
  g,
  cell
}) {
  const cat = catById(g, cell.cat);
  return React.createElement("div", {
    className: "qhead"
  }, React.createElement("span", {
    className: "qh-cat"
  }, cat.emoji, " ", React.createElement(Txt, {
    v: cat.name
  })), React.createElement("span", {
    className: "qh-val num"
  }, t('points', {
    n: cell.value
  })));
}
function StageBanner({
  g
}) {
  const cur = g.current;
  const team = teamById(g, cur.team);
  if (cur.stage === 'reveal') return null;
  return React.createElement("div", {
    className: 'stage s-' + cur.stage,
    style: tStyle(team)
  }, React.createElement("span", {
    className: "st-em"
  }, cur.stage === 'steal' ? '⚡' : team.emoji), React.createElement("b", null, cur.stage === 'steal' ? t('stealChance', {
    team: teamName(team)
  }) : t('answering', {
    team: teamName(team)
  })));
}
function ResultBanner({
  g
}) {
  const r = g.current.result || {};
  const team = r.team ? teamById(g, r.team) : null;
  const answered = r.answeredBy ? teamById(g, r.answeredBy) : null;
  const title = {
    correct: t('flashCorrect'),
    stolen: t('flashSteal'),
    missed: t('noPoints'),
    skipped: t('skipped')
  }[r.kind];
  return React.createElement("div", {
    className: 'result k-' + r.kind,
    style: team ? tStyle(team) : undefined
  }, React.createElement("b", {
    className: "rs-t"
  }, title), team && React.createElement("span", {
    className: "rs-s"
  }, t('pointsTo', {
    n: r.points,
    team: teamName(team)
  })), r.penalty > 0 && answered && React.createElement("span", {
    className: "rs-s"
  }, t('lostPoints', {
    n: r.penalty,
    team: teamName(answered)
  })));
}
function QuestionScreen({
  g,
  act,
  flash,
  onMenu,
  onTv
}) {
  const cur = g.current;
  const cell = curCell(g);
  const [peek, setPeek] = useState(false);
  useEffect(() => {
    setPeek(false);
  }, [cell && cell.id]);
  const reveal = cur.stage === 'reveal';
  const correct = () => {
    const kind = cur.stage === 'steal' ? 'stolen' : 'correct';
    act(markCorrect);
    flash({
      kind,
      team: cur.team,
      points: cell.value
    });
    buzz(kind === 'stolen' ? [40, 40, 80] : 40);
  };
  const wrong = () => {
    const pen = cur.stage === 'answer' && g.rules.wrongPenalty ? -cell.value : 0;
    act(x => markWrong(x, Date.now()));
    flash(cur.stage === 'steal' ? {
      kind: 'missed'
    } : {
      kind: 'wrong',
      team: pen ? cur.team : null,
      points: pen
    });
    buzz(120);
  };
  const last = isBoardDone({
    ...g,
    cells: g.cells.map(c => c.id === cell.id ? {
      ...c,
      status: 'done'
    } : c)
  });
  return React.createElement("div", {
    className: "app qscreen"
  }, React.createElement(TopBar, {
    left: React.createElement(MenuBtn, {
      onClick: onMenu
    }),
    title: t('leftN', {
      n: openCells(g).length
    }),
    right: React.createElement(TvButton, {
      onTv: onTv
    }),
    dense: true
  }), React.createElement(ScoreBar, {
    g: g,
    activeId: reveal ? null : cur.team
  }), React.createElement(QHead, {
    g: g,
    cell: cell
  }), React.createElement(StageBanner, {
    g: g
  }), React.createElement(Clock, {
    g: g
  }), React.createElement(QuestionCard, {
    cell: cell,
    showAnswer: reveal || peek
  }), cell.q.check && React.createElement("p", {
    className: "checkbadge"
  }, t('needsCheck')), reveal && React.createElement(ResultBanner, {
    g: g
  }), !reveal && React.createElement("button", {
    className: "btn btn-ghost btn-sm peek",
    "aria-pressed": peek,
    onClick: () => setPeek(!peek)
  }, "\uD83D\uDC41 ", peek ? t('hideAnswer') : t('showAnswer')), !reveal && React.createElement("p", {
    className: "hint center"
  }, t('hostHint')), React.createElement("div", {
    className: "actions"
  }, !reveal && cur.stage === 'answer' && React.createElement(React.Fragment, null, React.createElement("button", {
    className: "btn btn-wrong",
    onClick: wrong
  }, "\u2715 ", t('wrong')), React.createElement("button", {
    className: "btn btn-right",
    onClick: correct
  }, "\u2713 ", t('correct'))), !reveal && cur.stage === 'steal' && React.createElement(React.Fragment, null, React.createElement("button", {
    className: "btn btn-wrong",
    onClick: wrong
  }, "\u2715 ", t('missed')), React.createElement("button", {
    className: "btn btn-steal",
    onClick: correct
  }, "\u26A1 ", t('stolen'))), reveal && React.createElement("button", {
    className: "btn btn-gold span2",
    onClick: () => act(x => finishQuestion(x, Date.now()))
  }, last ? t('seeResults') : t('backToBoard'))));
}
function Moments({
  g
}) {
  const s = gameStats(g);
  const items = [];
  const cname = e => {
    const c = catById(g, e.cat);
    return c ? pick(c.name) : '';
  };
  if (s.biggestSteal) {
    const tm = teamById(g, s.biggestSteal.team);
    items.push({
      k: t('mBiggestSteal'),
      v: '⚡ ' + s.biggestSteal.value,
      d: teamName(tm) + ' · ' + cname(s.biggestSteal),
      team: tm
    });
  }
  if (s.biggestWin) {
    const tm = teamById(g, s.biggestWin.team);
    items.push({
      k: t('mBigWin'),
      v: s.biggestWin.value,
      d: teamName(tm) + ' · ' + cname(s.biggestWin),
      team: tm
    });
  }
  if (s.bestStreak) items.push({
    k: t('mBestStreak'),
    v: '🔥 ' + s.bestStreak.best,
    d: teamName(s.bestStreak.team) + ' · ' + t('streakN', {
      n: s.bestStreak.best
    }),
    team: s.bestStreak.team
  });
  if (s.mostSteals) items.push({
    k: t('mMostSteals'),
    v: '⚡×' + s.mostSteals.steals,
    d: teamName(s.mostSteals.team),
    team: s.mostSteals.team
  });
  if (s.sharpest) items.push({
    k: t('mAccuracy'),
    v: s.sharpest.acc + '%',
    d: teamName(s.sharpest.team) + ' · ' + t('accN', {
      p: s.sharpest.acc
    }),
    team: s.sharpest.team
  });
  if (!items.length) return null;
  return React.createElement("section", {
    className: "stack-sm"
  }, React.createElement("span", {
    className: "eyebrow"
  }, t('moments')), React.createElement("div", {
    className: "stat-grid"
  }, items.map(x => React.createElement("div", {
    key: x.k,
    className: "stat",
    style: x.team ? tStyle(x.team) : undefined
  }, React.createElement("span", {
    className: "k"
  }, x.k), React.createElement("span", {
    className: "v num"
  }, x.v), React.createElement("span", {
    className: "d",
    dir: "auto"
  }, x.d)))));
}
function Winner({
  g,
  big
}) {
  const w = winners(g);
  if (!w.length) return React.createElement("div", {
    className: 'winner draw' + (big ? ' big' : '')
  }, React.createElement("span", {
    className: "eyebrow"
  }, t('finalScores')), React.createElement("h2", {
    className: "display"
  }, t('itsADraw')));
  return React.createElement("div", {
    className: 'winner' + (big ? ' big' : ''),
    style: tStyle(w[0])
  }, React.createElement("span", {
    className: "w-crown"
  }, "\uD83D\uDC51"), React.createElement("span", {
    className: "eyebrow"
  }, t('winnerIs')), React.createElement("h2", {
    className: "display"
  }, React.createElement("span", null, w[0].emoji), " ", React.createElement(Name, {
    team: w[0]
  })), React.createElement("span", {
    className: "w-score num"
  }, w[0].score));
}
function GameLog({
  g
}) {
  return React.createElement("details", {
    className: "card"
  }, React.createElement("summary", {
    className: "label"
  }, t('gameLog')), React.createElement("ol", {
    className: "glog"
  }, g.log.map((e, i) => {
    const tm = e.team ? teamById(g, e.team) : null;
    const c = e.cat ? catById(g, e.cat) : null;
    const what = e.kind === 'adjust' ? t('logAdjust', {
      team: teamName(tm),
      d: (e.points > 0 ? '+' : '') + e.points
    }) : e.kind === 'correct' ? t('logCorrect', {
      team: teamName(tm)
    }) : e.kind === 'stolen' ? t('logStolen', {
      team: teamName(tm)
    }) : e.kind === 'skipped' ? t('logSkipped') : t('logMissed');
    return React.createElement("li", {
      key: i
    }, c && React.createElement("span", {
      className: "muted"
    }, c.emoji, " ", pick(c.name), " ", e.value, " \xB7 "), React.createElement("span", {
      dir: "auto"
    }, what), e.penalty ? React.createElement("span", {
      className: "muted"
    }, " (\u2212", e.penalty, ")") : null);
  })));
}
function Results({
  g,
  act,
  onHome,
  onAgain
}) {
  const sorted = [...g.teams].sort((a, b) => b.score - a.score);
  const s = gameStats(g);
  return React.createElement("div", {
    className: "app"
  }, React.createElement(TopBar, {
    onBack: onHome,
    title: t('resultsTitle')
  }), React.createElement(Winner, {
    g: g
  }), React.createElement("section", {
    className: "stack-sm"
  }, React.createElement("span", {
    className: "eyebrow"
  }, t('finalScores')), sorted.map((tm, i) => {
    const st = s.list.find(x => x.team.id === tm.id);
    return React.createElement("div", {
      key: tm.id,
      className: "frow",
      style: tStyle(tm)
    }, React.createElement("span", {
      className: "fr-rk num"
    }, i + 1), React.createElement("span", {
      className: "grow fr-n"
    }, tm.emoji, " ", React.createElement(Name, {
      team: tm
    }), React.createElement("small", {
      className: "muted"
    }, " \xB7 ", t('correctShort'), " ", st.correct, " \xB7 ", t('stealsShort'), " ", st.steals)), React.createElement("b", {
      className: "fr-s num"
    }, tm.score));
  })), React.createElement(Moments, {
    g: g
  }), React.createElement(GameLog, {
    g: g
  }), React.createElement("button", {
    className: "btn btn-gold",
    onClick: onAgain
  }, t('playAgain')), React.createElement("p", {
    className: "hint center",
    style: {
      marginTop: -8
    }
  }, t('playAgainSub')), React.createElement("div", {
    className: "row"
  }, React.createElement("button", {
    className: "btn grow",
    onClick: onHome
  }, t('home')), undoLabel(g) && React.createElement("button", {
    className: "btn btn-ghost grow",
    onClick: () => act(undo)
  }, "\u21B6 ", t('undo'))));
}
function FixScores({
  g,
  act,
  onClose
}) {
  const step = g.rules.values[0];
  return React.createElement(Sheet, {
    onClose: onClose
  }, React.createElement("div", {
    className: "stack"
  }, React.createElement("h2", {
    className: "display"
  }, t('fixScores')), React.createElement("p", {
    className: "hint"
  }, t('fixScoresSub')), g.teams.map(tm => React.createElement("div", {
    key: tm.id,
    className: "fixrow",
    style: tStyle(tm)
  }, React.createElement("span", {
    className: "grow"
  }, tm.emoji, " ", React.createElement(Name, {
    team: tm
  })), React.createElement("button", {
    className: "mini",
    "aria-label": '−' + step + ' ' + teamName(tm),
    onClick: () => act(x => adjustScore(x, tm.id, -step))
  }, "\u2212"), React.createElement("b", {
    className: "num fx-s"
  }, tm.score), React.createElement("button", {
    className: "mini",
    "aria-label": '+' + step + ' ' + teamName(tm),
    onClick: () => act(x => adjustScore(x, tm.id, step))
  }, "+"))), React.createElement("button", {
    className: "btn btn-gold",
    onClick: onClose
  }, t('close'))));
}
function GameMenu({
  g,
  act,
  onClose,
  onHome
}) {
  const [ask, setAsk] = useState(null);
  const [fix, setFix] = useState(false);
  const cur = g.current;
  const inQ = g.phase === 'question' && cur && cur.stage !== 'reveal';
  const run = fn => {
    act(fn);
    onClose();
  };
  if (fix) return React.createElement(FixScores, {
    g: g,
    act: act,
    onClose: onClose
  });
  if (ask === 'end') return React.createElement(Confirm, {
    title: t('endGameQ'),
    body: t('endGameBody'),
    yes: t('endGame'),
    danger: true,
    onYes: () => act(x => endGame(x, Date.now())),
    onClose: onClose
  });
  return React.createElement(Sheet, {
    onClose: onClose
  }, React.createElement("div", {
    className: "stack-sm"
  }, React.createElement("h2", {
    className: "display"
  }, t('menu')), React.createElement("button", {
    className: "btn",
    disabled: !undoLabel(g),
    onClick: () => run(undo)
  }, "\u21B6 ", undoText(g)), inQ && (cur.pausedLeft == null ? React.createElement("button", {
    className: "btn",
    onClick: () => run(x => pauseTimer(x, Date.now()))
  }, "\u23F8 ", t('pause')) : React.createElement("button", {
    className: "btn",
    onClick: () => run(x => resumeTimer(x, Date.now()))
  }, "\u25B6 ", t('resume'))), inQ && cur.stage === 'answer' && React.createElement("button", {
    className: "btn menu2",
    onClick: () => run(putBack)
  }, React.createElement("span", null, "\u21A9 ", t('putBack')), React.createElement("small", null, t('putBackSub'))), inQ && React.createElement("button", {
    className: "btn",
    onClick: () => run(skipQuestion)
  }, "\u23ED ", t('skipQ')), g.phase !== 'pick' && React.createElement("button", {
    className: "btn",
    onClick: () => setFix(true)
  }, "\xB1 ", t('fixScores')), g.phase !== 'pick' && React.createElement("button", {
    className: "btn btn-danger",
    onClick: () => setAsk('end')
  }, "\uD83C\uDFC1 ", t('endGame')), React.createElement("button", {
    className: "btn btn-ghost menu2",
    onClick: () => {
      onClose();
      onHome();
    }
  }, React.createElement("span", null, "\uD83C\uDFE0 ", t('quitHome')), React.createElement("small", null, t('quitHomeSub'))), React.createElement("button", {
    className: "btn btn-ghost",
    onClick: onClose
  }, t('close'))));
}
const TV_CHANNEL = 'khatfa-tv';
const tvUrl = () => location.origin + location.pathname + '#tv';
const canChannel = () => typeof window !== 'undefined' && 'BroadcastChannel' in window;
function goFullscreen() {
  try {
    const el = document.documentElement;
    if (!document.fullscreenElement && el.requestFullscreen) el.requestFullscreen().catch(() => {});
  } catch (e) {}
}
function tvGame(g) {
  if (!g) return null;
  const {
    history,
    ...rest
  } = g;
  const revealed = g.current && g.current.stage === 'reveal' ? g.current.cell : null;
  return {
    ...rest,
    cells: (g.cells || []).map(c => c.q && c.id !== revealed ? {
      ...c,
      q: {
        ...c.q,
        a: null,
        note: null
      }
    } : c)
  };
}
function TvButton({
  onTv
}) {
  if (!onTv) return React.createElement("span", {
    className: "iconspace"
  });
  return React.createElement("button", {
    className: "iconbtn tvbtn",
    onClick: onTv,
    "aria-label": t('tvMode'),
    title: t('tvMode')
  }, "\uD83D\uDCFA");
}
function TvSheet({
  onClose,
  onHere
}) {
  const [msg, setMsg] = useState('');
  const newWindow = () => {
    if (!canChannel()) {
      setMsg(t('tvNoChannel'));
      return;
    }
    const w = window.open(tvUrl(), '_blank');
    if (!w) setMsg(t('tvBlocked'));else onClose();
  };
  return React.createElement(Sheet, {
    center: true,
    onClose: onClose
  }, React.createElement("h2", {
    className: "display",
    style: {
      fontSize: 30
    }
  }, "\uD83D\uDCFA ", t('tvMode')), React.createElement("p", {
    className: "hint"
  }, t('tvIntro')), React.createElement("button", {
    className: "btn btn-gold",
    onClick: () => {
      onClose();
      onHere();
    }
  }, t('tvHere')), React.createElement("p", {
    className: "hint",
    style: {
      margin: 0
    }
  }, t('tvHereSub')), React.createElement("button", {
    className: "btn",
    onClick: newWindow
  }, t('tvWindow')), React.createElement("p", {
    className: "hint",
    style: {
      margin: 0
    }
  }, t('tvWindowSub')), React.createElement("p", {
    className: "hint",
    style: {
      margin: 0
    }
  }, t('tvOtherDevice')), msg && React.createElement("p", {
    className: "warn"
  }, msg), React.createElement("button", {
    className: "btn btn-ghost",
    onClick: onClose
  }, t('close')));
}
function TvExit({
  onExit
}) {
  useEffect(() => {
    if (!onExit) return undefined;
    const k = e => {
      if (e.key === 'Escape' && !document.fullscreenElement) onExit();
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onExit]);
  return React.createElement("div", {
    className: "tvbar"
  }, React.createElement("button", {
    className: "pillbtn",
    onClick: goFullscreen
  }, "\u26F6 ", t('tvFull')), onExit && React.createElement("button", {
    className: "pillbtn",
    onClick: onExit
  }, backArrow(), " ", t('tvBackToControls')));
}
function TvView({
  g,
  flash,
  onFlashDone
}) {
  let body;
  if (!g) body = React.createElement("div", {
    className: "tv-wait"
  }, React.createElement(LogoMark, {
    size: 120
  }), React.createElement("h2", {
    className: "display"
  }, t('appName')), React.createElement("p", {
    className: "muted"
  }, t('tvWaiting')));else if (g.phase === 'pick') {
    const team = pickingTeam(g);
    body = React.createElement(React.Fragment, null, React.createElement("div", {
      className: "tv-head"
    }, React.createElement("span", {
      className: "eyebrow"
    }, t('tvPicking')), React.createElement("div", {
      className: "picker",
      style: tStyle(team)
    }, React.createElement("span", {
      className: "pk-em"
    }, team.emoji), React.createElement("b", {
      className: "pk-t"
    }, t('yourPick', {
      team: teamName(team)
    })))), React.createElement(CategoryGrid, {
      g: g,
      big: true
    }));
  } else if (g.phase === 'board') {
    const team = turnTeam(g);
    body = React.createElement(React.Fragment, null, React.createElement(ScoreBar, {
      g: g,
      activeId: team.id,
      label: t('turnShort'),
      big: true
    }), React.createElement("p", {
      className: "turnline",
      style: tStyle(team)
    }, React.createElement("span", null, team.emoji), " ", t('turnOf', {
      team: teamName(team)
    })), React.createElement(BoardGrid, {
      g: g,
      big: true
    }));
  } else if (g.phase === 'question') {
    const cell = curCell(g);
    const reveal = g.current.stage === 'reveal';
    body = React.createElement(React.Fragment, null, React.createElement(ScoreBar, {
      g: g,
      activeId: reveal ? null : g.current.team,
      big: true
    }), React.createElement("div", {
      className: "tv-q"
    }, React.createElement(QHead, {
      g: g,
      cell: cell
    }), React.createElement(StageBanner, {
      g: g
    }), React.createElement(Clock, {
      g: g,
      big: true
    }), React.createElement(QuestionCard, {
      cell: cell,
      big: true,
      showAnswer: reveal
    }), reveal && React.createElement(ResultBanner, {
      g: g
    })));
  } else {
    const sorted = [...g.teams].sort((a, b) => b.score - a.score);
    body = React.createElement(React.Fragment, null, React.createElement(Winner, {
      g: g,
      big: true
    }), React.createElement(ScoreBar, {
      g: {
        ...g,
        teams: sorted
      },
      big: true
    }), React.createElement(Moments, {
      g: g
    }));
  }
  return React.createElement("div", {
    className: "tvmode"
  }, React.createElement("div", {
    className: "tvwrap"
  }, body), flash && React.createElement(Flash, {
    f: flash,
    g: g,
    onDone: onFlashDone
  }));
}
function LocalTv() {
  const [g, setG] = useState(null);
  const [flash, setFlash] = useState(null);
  const [, setL] = useState(0);
  useEffect(() => {
    if (!canChannel()) return undefined;
    const ch = new BroadcastChannel(TV_CHANNEL);
    ch.onmessage = e => {
      const m = e.data || {};
      if (m.type === 'game') setG(m.game);else if (m.type === 'flash') setFlash(m.info);else if (m.type === 'lang') {
        setLang(m.lang);
        applyDocLang(m.lang);
        setL(x => x + 1);
      }
    };
    ch.postMessage({
      type: 'hello'
    });
    const bye = () => {
      try {
        ch.postMessage({
          type: 'bye'
        });
      } catch (e) {}
    };
    window.addEventListener('beforeunload', bye);
    return () => {
      bye();
      window.removeEventListener('beforeunload', bye);
      ch.close();
    };
  }, []);
  if (!canChannel()) return React.createElement("div", {
    className: "app"
  }, React.createElement("div", {
    className: "card stack"
  }, React.createElement("p", {
    className: "hint",
    style: {
      margin: 0
    }
  }, t('tvNoChannel'))));
  return React.createElement(React.Fragment, null, React.createElement(TvView, {
    g: g,
    flash: flash,
    onFlashDone: () => setFlash(null)
  }), React.createElement(TvExit, null));
}
function useTvSender(game, settings) {
  const ch = useRef(null);
  const latest = useRef({
    game,
    settings
  });
  latest.current = {
    game,
    settings
  };
  useEffect(() => {
    if (!canChannel()) return undefined;
    const c = new BroadcastChannel(TV_CHANNEL);
    ch.current = c;
    c.onmessage = e => {
      if ((e.data || {}).type === 'hello') {
        c.postMessage({
          type: 'lang',
          lang: latest.current.settings.lang
        });
        c.postMessage({
          type: 'game',
          game: tvGame(latest.current.game)
        });
      }
    };
    return () => {
      c.close();
      ch.current = null;
    };
  }, []);
  useEffect(() => {
    if (ch.current) ch.current.postMessage({
      type: 'game',
      game: tvGame(game)
    });
  }, [game]);
  useEffect(() => {
    if (ch.current) ch.current.postMessage({
      type: 'lang',
      lang: settings.lang
    });
  }, [settings.lang]);
  return info => {
    if (ch.current) ch.current.postMessage({
      type: 'flash',
      info
    });
  };
}
function SettingsScreen({
  settings,
  setSettings,
  state,
  onRestore,
  onClearAll,
  onBack
}) {
  const [ask, setAsk] = useState(null);
  const [msg, setMsg] = useState(null);
  const fileRef = useRef(null);
  const set = (k, v) => setSettings({
    ...settings,
    [k]: v
  });
  const exportIt = () => {
    const blob = new Blob([JSON.stringify(makeBackup(state), null, 1)], {
      type: 'application/json'
    });
    downloadBlob(blob, 'khatfa-backup-' + todayStamp() + '.json');
  };
  const readFile = file => {
    if (!file) return;
    const r = new FileReader();
    r.onerror = () => setMsg({
      text: t('bkUnreadable')
    });
    r.onload = () => {
      let obj = null;
      try {
        obj = JSON.parse(r.result);
      } catch (e) {
        setMsg({
          text: t('bkUnreadable')
        });
        return;
      }
      const v = validateBackup(obj);
      if (!v.ok) {
        setMsg({
          text: t(v.error)
        });
        return;
      }
      setAsk({
        kind: 'import',
        v
      });
    };
    r.readAsText(file);
  };
  const backendName = {
    indexeddb: 'IndexedDB',
    localStorage: 'localStorage',
    memory: LANG === 'ar' ? 'الذاكرة فقط' : 'memory only'
  }[store.backend];
  return React.createElement("div", {
    className: "app"
  }, React.createElement(TopBar, {
    onBack: onBack,
    title: t('settings')
  }), React.createElement("section", {
    className: "card stack"
  }, React.createElement("div", {
    className: "field"
  }, React.createElement("span", {
    className: "label"
  }, t('language')), React.createElement(Seg, {
    value: settings.lang,
    options: [['ar', 'العربية'], ['en', 'English']],
    onChange: v => set('lang', v),
    label: t('language')
  })), React.createElement("div", {
    className: "field"
  }, React.createElement("span", {
    className: "label"
  }, t('qLang')), React.createElement(Seg, {
    value: settings.qLang,
    options: [['auto', t('qLangAuto')], ['both', t('qLangBoth')]],
    onChange: v => set('qLang', v),
    label: t('qLang')
  }), React.createElement("p", {
    className: "hint"
  }, t('qLangSub'))), React.createElement("div", {
    className: "field"
  }, React.createElement("span", {
    className: "label"
  }, t('motion')), React.createElement(Seg, {
    value: settings.motion,
    options: [['system', t('motionSystem')], ['full', t('motionFull')], ['reduce', t('motionReduce')]],
    onChange: v => set('motion', v),
    label: t('motion')
  })), React.createElement("div", {
    className: "field"
  }, React.createElement("span", {
    className: "label"
  }, t('tvZoom')), React.createElement(Seg, {
    value: settings.tvZoom,
    options: [[0.85, 'S'], [1, 'M'], [1.2, 'L'], [1.4, 'XL']],
    onChange: v => set('tvZoom', v),
    label: t('tvZoom')
  }))), React.createElement("section", {
    className: "card stack"
  }, React.createElement("h3", null, t('backup')), React.createElement("p", {
    className: "hint"
  }, t('backupSub')), React.createElement("div", {
    className: "row"
  }, React.createElement("button", {
    className: "btn grow",
    onClick: exportIt
  }, "\u2B07 ", t('exportBackup')), React.createElement("button", {
    className: "btn grow",
    onClick: () => fileRef.current && fileRef.current.click()
  }, "\u2B06 ", t('importBackup'))), React.createElement("input", {
    ref: fileRef,
    type: "file",
    accept: "application/json,.json",
    hidden: true,
    onChange: e => {
      readFile(e.target.files[0]);
      e.target.value = '';
    }
  })), React.createElement("section", {
    className: "card stack"
  }, React.createElement("h3", null, t('storage')), React.createElement("p", {
    className: "hint"
  }, t('storageWhere', {
    b: backendName
  })), isIOS() && React.createElement("p", {
    className: "hint"
  }, t('installIos')), React.createElement("button", {
    className: "btn btn-danger",
    onClick: () => setAsk({
      kind: 'clear'
    })
  }, t('clearAll'))), React.createElement("p", {
    className: "exportfoot"
  }, t('version', {
    v: APP_VERSION
  })), ask && ask.kind === 'import' && React.createElement(Confirm, {
    title: t('importQ'),
    body: t('importBody', {
      past: ask.v.summary.past,
      cur: ask.v.summary.current ? t('importCur') : '',
      date: (ask.v.summary.exportedAt || '').slice(0, 10)
    }),
    yes: t('importBackup'),
    onYes: () => {
      onRestore(ask.v.data);
      setMsg({
        text: t('restored'),
        ok: true
      });
    },
    onClose: () => setAsk(null)
  }), ask && ask.kind === 'clear' && React.createElement(Confirm, {
    title: t('clearAllQ'),
    body: t('clearAllBody'),
    yes: t('deleteIt'),
    danger: true,
    onYes: onClearAll,
    onClose: () => setAsk(null)
  }), msg && React.createElement(Toast, {
    msg: msg.text,
    ok: msg.ok,
    onClose: () => setMsg(null)
  }));
}
const DEFAULT_SETTINGS = {
  lang: 'ar',
  qLang: 'auto',
  motion: 'system',
  tvZoom: 1,
  rules: null,
  lastTeams: null
};
function applyDocLang(lang) {
  const el = document.documentElement;
  el.setAttribute('lang', lang === 'en' ? 'en' : 'ar');
  el.setAttribute('dir', lang === 'en' ? 'ltr' : 'rtl');
}
const findPack = id => PACKS().find(p => p.id === id) || PACKS()[0];
function App() {
  const [ready, setReady] = useState(false);
  const [settings, setSettingsRaw] = useState(DEFAULT_SETTINGS);
  const [game, setGameRaw] = useState(null);
  const [past, setPast] = useState([]);
  const [screen, setScreen] = useState('home');
  const [flash, setFlash] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [tvHere, setTvHere] = useState(false);
  const [toast, setToast] = useState(null);
  const tvRoute = typeof location !== 'undefined' && /^#tv\b/.test(location.hash);
  useEffect(() => {
    store.onError = key => setToast({
      text: t(key)
    });
    store.init().then(() => {
      const s = {
        ...DEFAULT_SETTINGS,
        ...store.get(K.settings, {})
      };
      setLang(s.lang);
      setSettingsRaw(s);
      const cur = store.get(K.current, null);
      if (cur && Array.isArray(cur.teams)) setGameRaw(cur);
      setPast(store.get(K.past, []));
      setReady(true);
    });
  }, []);
  useEffect(() => {
    setLang(settings.lang);
    applyDocLang(settings.lang);
    document.documentElement.setAttribute('data-motion', settings.motion || 'system');
    document.documentElement.style.setProperty('--tvzoom', String(settings.tvZoom || 1));
  }, [settings.lang, settings.motion, settings.tvZoom]);
  const setSettings = s => {
    setLang(s.lang);
    setSettingsRaw(s);
    store.set(K.settings, s);
  };
  const setGame = next => {
    setGameRaw(prev => {
      const g = typeof next === 'function' ? next(prev) : next;
      if (g) store.set(K.current, g);else store.del(K.current);
      if (g && g.phase === 'done' && (!prev || prev.phase !== 'done' || prev.id !== g.id)) {
        setPast(p => {
          const list = [pastEntry(g), ...p.filter(x => x.id !== g.id)].slice(0, 30);
          store.set(K.past, list);
          return list;
        });
      }
      return g;
    });
  };
  const act = fn => setGame(g => g ? fn(g) : g);
  const sendTv = useTvSender(game, settings);
  const doFlash = info => {
    setFlash(info);
    sendTv(info);
  };
  if (tvRoute) return React.createElement(QLangCtx.Provider, {
    value: settings.qLang
  }, ready ? React.createElement(LocalTv, null) : null);
  if (!ready) return React.createElement("div", {
    className: "boot"
  }, React.createElement("div", null, "\u062E\u0637\u0641\u0629", React.createElement("small", null, "KHATFA")));
  const startNew = (pack, teams, rules) => {
    setSettings({
      ...settings,
      rules,
      lastTeams: teams
    });
    setGame(createGame(pack, teams, rules, Date.now()));
    setScreen('game');
  };
  const goHome = () => {
    setTvHere(false);
    setScreen('home');
  };
  const playAgain = () => {
    setGame(rematch(game, findPack(game.pack && game.pack.id), Date.now()));
    setScreen('game');
  };
  const restore = d => {
    const s = {
      ...DEFAULT_SETTINGS,
      ...(d.settings || {})
    };
    setSettings(s);
    setGame(d.current || null);
    setPast(d.past || []);
    store.set(K.past, d.past || []);
    store.set(K.packs, d.packs || []);
  };
  const clearAll = () => {
    Object.values(K).forEach(k => store.del(k));
    setSettingsRaw(DEFAULT_SETTINGS);
    setLang(DEFAULT_SETTINGS.lang);
    setGameRaw(null);
    setPast([]);
    setScreen('home');
  };
  let view;
  if (screen === 'settings') view = React.createElement(SettingsScreen, {
    settings: settings,
    setSettings: setSettings,
    state: {
      settings,
      game,
      past,
      packs: store.get(K.packs, [])
    },
    onRestore: restore,
    onClearAll: clearAll,
    onBack: () => setScreen('home')
  });else if (screen === 'setup') view = React.createElement(Setup, {
    initial: {
      teams: settings.lastTeams,
      rules: settings.rules
    },
    onBack: () => setScreen('home'),
    onStart: startNew
  });else if (screen === 'game' && game) {
    const common = {
      g: game,
      act,
      onMenu: () => setSheet('menu'),
      onTv: () => setSheet('tv')
    };
    if (tvHere) view = React.createElement(React.Fragment, null, React.createElement(TvView, {
      g: game,
      flash: flash,
      onFlashDone: () => setFlash(null)
    }), React.createElement(TvExit, {
      onExit: () => setTvHere(false)
    }));else if (game.phase === 'pick') view = React.createElement(CategoryPick, common);else if (game.phase === 'board') view = React.createElement(Board, common);else if (game.phase === 'question') view = React.createElement(QuestionScreen, _extends({}, common, {
      flash: doFlash
    }));else view = React.createElement(Results, {
      g: game,
      act: act,
      onHome: goHome,
      onAgain: playAgain
    });
  } else view = React.createElement(Home, {
    game: game,
    past: past,
    settings: settings,
    setSettings: setSettings,
    onNew: () => setScreen('setup'),
    onContinue: () => setScreen('game'),
    onHow: () => setSheet('how'),
    onSettings: () => setScreen('settings')
  });
  return React.createElement(QLangCtx.Provider, {
    value: settings.qLang
  }, React.createElement("div", {
    key: settings.lang,
    className: "langroot"
  }, view, flash && !tvHere && screen === 'game' && React.createElement(Flash, {
    f: flash,
    g: game,
    onDone: () => setFlash(null)
  }), sheet === 'menu' && game && React.createElement(GameMenu, {
    g: game,
    act: act,
    onClose: () => setSheet(null),
    onHome: goHome
  }), sheet === 'tv' && React.createElement(TvSheet, {
    onClose: () => setSheet(null),
    onHere: () => setTvHere(true)
  }), sheet === 'how' && React.createElement(HowTo, {
    onClose: () => setSheet(null)
  }), toast && React.createElement(Toast, {
    msg: toast.text,
    onClose: () => setToast(null)
  })));
}
if (window.__KH_TEST__) window.__KH = {
  store,
  K,
  SAMPLE_PACK,
  DEFAULT_RULES,
  cleanRules,
  createGame,
  pickCategory,
  randomPick,
  buildBoard,
  openCell,
  markCorrect,
  markWrong,
  skipQuestion,
  putBack,
  finishQuestion,
  endGame,
  adjustScore,
  undo,
  undoLabel,
  winners,
  gameStats,
  rematch,
  pastEntry,
  timeLeft,
  pauseTimer,
  resumeTimer,
  turnTeam,
  pickingTeam,
  openCells,
  isBoardDone,
  tvGame,
  makeBackup,
  validateBackup,
  t,
  setLang,
  pick,
  S
};
ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(Boundary, null, React.createElement(App, null)));
})();
