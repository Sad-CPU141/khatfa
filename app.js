/* Khatfa 0d66f796ba — built from src/ by build.js. Edit src/, not this file. */
"use strict";
(function(){
const APP_VERSION = "0d66f796ba";
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
  packs: 'kh_packs_v1',
  history: 'kh_qhistory_v1',
  issues: 'kh_issues_v1'
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
      packs: state.packs || [],
      history: state.history || null,
      issues: state.issues || []
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
  if (d.history != null && (typeof d.history !== 'object' || typeof d.history.seen !== 'object')) return {
    ok: false,
    error: 'bkDamaged'
  };
  if (d.issues != null && !Array.isArray(d.issues)) return {
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
  bankNote: ['{q} questions in {c} categories. 200 easy · 400 hard · 600 brutal.', '{q} سؤال في {c} فئة. ٢٠٠ سهل · ٤٠٠ صعب · ٦٠٠ نار.'],
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
  needCats: ['Only {have} categories can fill a whole column with these settings, and {need} are needed. Switch more categories on, or lower “Categories per team”.', 'فقط {have} فئات تقدر تعبّي عمود كامل بهذي الإعدادات، والمطلوب {need}. شغّل فئات أكثر أو قلّل عدد الفئات لكل فريق.'],
  needNames: ['Give every team a name.', 'اكتب اسم لكل فريق.'],
  rulesSummary: ['200/400/600 · {per}× per value · {cats} categories each · {a}s / steal {s}s', '٢٠٠/٤٠٠/٦٠٠ · {per}× لكل قيمة · {cats} فئات لكل فريق · {a}ث / خطف {s}ث'],
  valuesFixed: ['Points are always 200 (easy), 400 (hard) and 600 (brutal).', 'النقاط دائماً ٢٠٠ (سهل) و٤٠٠ (صعب) و٦٠٠ (نار).'],
  categories: ['Categories', 'الفئات'],
  catsOn: ['{n} of {of} categories on', '{n} من {of} فئة مفعّلة'],
  catsShort: ['{n} categories don’t have enough questions for these settings, so they can’t be picked.', '{n} فئات ما فيها أسئلة كافية لهذي الإعدادات، فما تنختار.'],
  chooseCats: ['Choose categories', 'اختر الفئات'],
  randomCats: ['Random categories', 'فئات عشوائية'],
  randomCatsSub: ['Skip the picking: categories are chosen for you from the ones switched on.', 'بدون اختيار: الفئات تنختار لكم عشوائياً من المفعّلة.'],
  mixedCats: ['Mixed categories', 'فئات مخلوطة'],
  mixedCatsSub: ['Adds “Random Mix”: a column with questions from all your switched-on categories.', 'يضيف «خلطة عشوائية»: عمود أسئلته من كل الفئات المفعّلة.'],
  difficulty: ['Difficulty', 'الصعوبة'],
  curve: ['Difficulty curve', 'منحنى الصعوبة'],
  curve_standard: ['Standard', 'عادي'],
  curve_steep: ['Steep', 'حاد'],
  curve_brutal: ['Brutal', 'نار'],
  curveSub_standard: ['200 easy, 400 hard, 600 brutal.', '٢٠٠ سهل، ٤٠٠ صعب، ٦٠٠ نار.'],
  curveSub_steep: ['400s and 600s lean towards the most niche questions in their tier.', 'أسئلة ٤٠٠ و٦٠٠ تميل لأصعب وأندر أسئلة مستواها.'],
  curveSub_brutal: ['Specialist questions everywhere, especially at 400 and 600.', 'أسئلة للمختصين في كل مكان، خصوصاً ٤٠٠ و٦٠٠.'],
  minDiff: ['Minimum difficulty', 'أقل صعوبة'],
  maxDiff: ['Maximum difficulty', 'أعلى صعوبة'],
  minMaxSub: ['Board rows will be {rows}.', 'صفوف اللوحة بتكون {rows}.'],
  nicheMode: ['Niche mode', 'وضع النوادر'],
  nicheModeSub: ['More of the extra-niche questions in every tier.', 'أسئلة نادرة أكثر في كل مستوى.'],
  nicheOnly: ['Niche only', 'نوادر فقط'],
  nicheOnlySub: ['Only extra-niche questions. Categories without enough of them can’t be picked.', 'أسئلة نادرة فقط. الفئات اللي ما فيها كفاية ما تنختار.'],
  strictRepeats: ['Strict no-repeats', 'منع التكرار الصارم'],
  strictRepeatsSub: ['Never use a question this device has shown before, until a category runs out. (Questions never repeat within one game either way.)', 'لا تستخدم أي سؤال ظهر على هذا الجهاز قبل، إلا إذا خلصت الفئة. (الأسئلة ما تتكرر في نفس اللعبة بكل الأحوال.)'],
  progressive: ['Progressive difficulty', 'صعوبة متدرجة'],
  progressiveSub: ['In each category, the 200s must be played before the 400s, and the 400s before the 600s.', 'في كل فئة لازم تنلعب ٢٠٠ قبل ٤٠٠، و٤٠٠ قبل ٦٠٠.'],
  startGame: ['Start the game', 'ابدأ اللعبة'],
  tierEasy: ['easy', 'سهل'],
  tierHard: ['hard', 'صعب'],
  tierBrutal: ['brutal', 'نار'],
  done: ['Done', 'تم'],
  searchCats: ['Search categories…', 'ابحث عن فئة…'],
  allOn: ['All on', 'شغّل الكل'],
  allOff: ['All off', 'أطفئ الكل'],
  shownOn: ['Shown on', 'شغّل الظاهرة'],
  shownOff: ['Shown off', 'أطفئ الظاهرة'],
  countsKey: ['Numbers show how many 200 · 400 · 600 questions each category has.', 'الأرقام = عدد أسئلة ٢٠٠ · ٤٠٠ · ٦٠٠ في كل فئة.'],
  allInGroup: ['All of {g}', 'كل {g}'],
  shortFor: ['not enough {tiers} for these settings', 'ما يكفي {tiers} لهذي الإعدادات'],
  subcats: ['{n} subcategories', '{n} فئات فرعية'],
  all: ['All', 'الكل'],
  popular: ['Popular', 'الأشهر'],
  nicheTopics: ['Niche', 'نوادر'],
  bigBank: ['Big bank', 'أسئلة كثيرة'],
  noMatch: ['No categories match.', 'ما فيه فئات مطابقة.'],
  notEnough: ['Not enough questions', 'أسئلة غير كافية'],
  mixSub: ['From all your categories', 'من كل فئاتك'],
  tierExhausted: ['No more {v} questions in this category', 'خلصت أسئلة {v} في هذي الفئة'],
  lockedTile: ['locked until the easier ones are played', 'مقفل لين تنلعب الأسهل'],
  reportExhausted: ['Ran out of questions for: {list}. Those tiles are empty. Pick other categories next time, or allow more categories.', 'خلصت الأسئلة في: {list}. هذي الخانات فاضية. اختاروا فئات ثانية المرة الجاية أو شغّلوا فئات أكثر.'],
  reportRepeats: ['{n} questions on this board were shown on this device recently (not enough unseen ones left).', '{n} أسئلة في هذي اللوحة ظهرت على الجهاز مؤخراً (ما بقى أسئلة جديدة كفاية).'],
  reportNiche: ['Not enough extra-niche questions for every tile: {n} regular ones were used.', 'ما فيه أسئلة نادرة كفاية لكل الخانات: استُخدم {n} أسئلة عادية.'],
  alsoAccept: ['Also accept:', 'يُقبل أيضاً:'],
  asOf: ['Correct as of {d}', 'صحيح حتى {d}'],
  hintForHost: ['Hint:', 'تلميح:'],
  qbank: ['Question bank', 'بنك الأسئلة'],
  qbankSub: ['{q} questions in {c} categories.', '{q} سؤال في {c} فئة.'],
  historySub: ['This device has shown {n} different questions over {g} games. Recently shown questions are avoided in new games.', 'هذا الجهاز عرض {n} سؤال مختلف خلال {g} لعبة. الأسئلة اللي ظهرت مؤخراً نتجنبها في الألعاب الجديدة.'],
  resetHistory: ['Reset question history', 'مسح سجل الأسئلة'],
  resetHistoryQ: ['Reset question history?', 'تمسح سجل الأسئلة؟'],
  resetHistoryBody: ['Questions you’ve already seen can come up again straight away. Games and scores aren’t affected.', 'الأسئلة اللي شفتوها ممكن ترجع على طول. الألعاب والنتائج ما تتأثر.'],
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
  howBody: [['Split into two teams. Each team picks categories; they all go on the board.', 'Teams take turns choosing a question. Harder questions are worth more.', 'The host reads it out and starts the clock. Answer right to win the points.', 'Wrong or out of time? The other team gets a short chance to snatch it — a Khatfa!', 'When the board is empty, the team with the most points wins.'], ['انقسموا لفريقين. كل فريق يختار فئات، وكلها تنحط على اللوحة.', 'الفرق تتناوب على اختيار الأسئلة. كل ما صعب السؤال زادت نقاطه.', 'المقدّم يقرأ السؤال ويشغّل الوقت. جاوب صح وخذ النقاط.', 'غلطتوا أو خلص الوقت؟ الفريق الثاني عنده فرصة قصيرة يخطف السؤال… خطفة!', 'إذا خلصت اللوحة، الفريق صاحب أعلى نقاط يفوز.']],
  thisIsWrong: ['This is wrong', 'السؤال غلط'],
  wrongTitle: ['Something wrong with this question?', 'فيه مشكلة بالسؤال؟'],
  wrongSub: ['It will be removed from this game and replaced with another {v}-point question. Only the points this question changed are reversed.', 'بينشال من هاللعبة ويتبدّل بسؤال ثاني بـ{v} نقطة. ونرجّع بس النقاط اللي غيّرها هالسؤال.'],
  whyWrong: ['What’s wrong? (optional)', 'وش المشكلة؟ (اختياري)'],
  reason_answer: ['Wrong answer', 'الإجابة غلط'],
  reason_unclear: ['Unclear or misleading', 'غير واضح أو مضلّل'],
  reason_media: ['Picture, sound or clip broken', 'الصورة أو الصوت أو المقطع خربان'],
  reason_duplicate: ['Repeat / gave itself away', 'مكرر أو يكشف نفسه'],
  reason_other: ['Something else', 'شي ثاني'],
  wrongNote: ['Note for later (optional)', 'ملاحظة للمراجعة (اختياري)'],
  noRefund: ['No points were given or taken for this question yet, so nothing needs refunding.', 'ما انحسبت ولا انخصمت نقاط على هالسؤال، فما فيه شي يرجع.'],
  willRefund: ['These score changes will be reversed:', 'بنرجّع تغييرات النقاط هذي:'],
  refundLine: ['{team}: {d}', '{team}: {d}'],
  repSame: ['Replacement: another {v} from {cat}.', 'البديل: سؤال {v} ثاني من {cat}.'],
  repSameNow: ['The same team answers the replacement now, with a fresh clock.', 'نفس الفريق يجاوب على البديل الحين، والوقت يبدأ من جديد.'],
  repSameBoard: ['It goes back on the board as an open tile.', 'يرجع على اللوحة كمربع مفتوح.'],
  repNone: ['{cat} has no unused {v}-point questions left. Choose what to do:', '{cat} ما بقى فيها أسئلة {v} ما انلعبت. اختار:'],
  repRelated: ['Use a {v} from {cat} (similar topic)', 'سؤال {v} من {cat} (موضوع قريب)'],
  repBoard: ['Use a {v} from {cat} (on this board)', 'سؤال {v} من {cat} (من اللوحة)'],
  repEmpty: ['Leave the tile empty (no question, no points)', 'خلّ المربع فاضي (بدون سؤال ولا نقاط)'],
  repEmptyNow: ['The same team picks another tile.', 'نفس الفريق يختار مربع ثاني.'],
  replaceIt: ['Remove and replace', 'شيله وبدّله'],
  reverseAndReplace: ['Reverse points and replace', 'رجّع النقاط وبدّله'],
  reverseAndEmpty: ['Reverse points and remove', 'رجّع النقاط وشيله'],
  removeIt: ['Remove it', 'شيله'],
  wrongDone: ['Question removed.', 'انشال السؤال.'],
  wrongDoneRefund: ['Question removed and points reversed.', 'انشال السؤال ورجعت النقاط.'],
  flashInvalid: ['Question replaced', 'تبدّل السؤال'],
  flagPlayed: ['A played question was wrong', 'سؤال انلعب وطلع غلط'],
  flagPlayedSub: ['Pick the question. Its points are reversed and the tile reopens with a replacement.', 'اختار السؤال. نرجّع نقاطه ويفتح المربع ببديل.'],
  noPlayed: ['No questions have been played yet.', 'ما انلعب أي سؤال للحين.'],
  logInvalid: ['Question removed as wrong', 'انشال سؤال لأنه غلط'],
  logInvalidRep: ['Question removed as wrong · replaced', 'انشال سؤال لأنه غلط · وتبدّل'],
  logVoid: ['(cancelled)', '(ملغي)'],
  tileInvalid: ['Removed: the question was wrong', 'انشال: السؤال كان غلط'],
  issues: ['Reported questions', 'الأسئلة المبلّغ عنها'],
  issuesSub: ['Questions flagged with “This is wrong”, to fix later.', 'الأسئلة اللي انضغط عليها «السؤال غلط»، عشان تتصلّح.'],
  issuesN: ['{n} reported', '{n} مبلّغ عنها'],
  issuesNone: ['Nothing reported yet.', 'ما فيه بلاغات للحين.'],
  skipReported: ['Skip reported questions in new games', 'تجاهل الأسئلة المبلّغ عنها في الألعاب الجديدة'],
  exportIssues: ['Export list', 'صدّر القائمة'],
  clearIssues: ['Clear list', 'امسح القائمة'],
  clearIssuesQ: ['Clear the reported list?', 'تمسح قائمة البلاغات؟'],
  clearIssuesBody: ['Reported questions can appear in games again.', 'الأسئلة المبلّغ عنها ممكن ترجع تطلع في الألعاب.']
};
let LANG = 'en';
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
const POINTS = [200, 400, 600];
const STRICT_WINDOW = 50;
const MIX_ID = 'mix';
function indexBank(raw) {
  const B = raw || typeof window !== 'undefined' && window.KH_BANK || {
    groups: [],
    cats: [],
    questions: []
  };
  const byCat = {};
  B.cats.forEach(c => {
    byCat[c.id] = [];
  });
  B.questions.forEach(q => {
    if (q.tier && byCat[q.cat]) byCat[q.cat].push(q);
  });
  return {
    groups: B.groups,
    cats: B.cats,
    byCat,
    total: B.questions.filter(q => q.tier).length,
    errors: B.errors || []
  };
}
const tierCounts = qs => [1, 2, 3].map(t => qs.filter(q => q.tier === t).length);
const nicheCounts = qs => [1, 2, 3].map(t => qs.filter(q => q.tier === t && q.x).length);
function rowTiers(rules) {
  const lo = clamp(rules.minTier || 1, 1, 3),
    hi = clamp(Math.max(rules.maxTier || 3, lo), 1, 3);
  return [1, 2, 3].map(t => clamp(t, lo, hi));
}
function tiersNeeded(rules) {
  const need = [0, 0, 0];
  rowTiers(rules).forEach(t => {
    need[t - 1] += rules.perValue;
  });
  return need;
}
function categoryShortfall(qs, rules) {
  const have = tierCounts(rules.nicheOnly ? qs.filter(q => q.x) : qs);
  const need = tiersNeeded(rules);
  return need.map((n, i) => Math.max(0, n - have[i]));
}
function weightOf(q, tier, rules, recent, gameNo) {
  let w = 1;
  const curve = rules.curve || 'standard';
  if (curve === 'steep' && tier >= 2) w *= q.x ? 4 : 0.5;
  if (curve === 'brutal') w *= q.x ? tier >= 2 ? 8 : 3 : tier >= 2 ? 0.25 : 0.6;
  if (rules.niche) w *= q.x ? 3 : 1;
  const seen = recent && recent[q.id];
  if (seen != null && gameNo != null) {
    const age = Math.max(1, gameNo - seen);
    w *= age <= 1 ? 0.01 : age <= 3 ? 0.05 : age <= 10 ? 0.2 : 0.6;
  }
  return w;
}
function weightedPick(items, weights, rand) {
  const total = weights.reduce((a, b) => a + b, 0);
  if (total <= 0) return items[Math.floor(rand() * items.length)];
  let r = rand() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}
function selectQuestions(pool, tier, count, rules, ctx) {
  const rand = ctx.rand || Math.random;
  const keys = q => q.facts && q.facts.length ? q.facts : [q.id];
  const clash = q => keys(q).some(k => ctx.facts.has(k));
  const free = q => q.tier === tier && !ctx.used.has(q.id) && !clash(q);
  let cands = pool.filter(free);
  let nicheShort = 0;
  if (rules.nicheOnly) {
    const n = cands.filter(q => q.x);
    if (n.length >= count) cands = n;else {
      nicheShort = count - n.length;
    }
  }
  const picked = [];
  let repeats = 0;
  for (let k = 0; k < count; k++) {
    const left = cands.filter(q => !ctx.used.has(q.id) && !clash(q));
    if (!left.length) break;
    let choose = left;
    const recentOf = q => ctx.recent && ctx.recent[q.id] != null && ctx.gameNo != null && ctx.gameNo - ctx.recent[q.id] <= STRICT_WINDOW;
    if (rules.strict) {
      const fresh = left.filter(q => !recentOf(q));
      if (fresh.length) choose = fresh;else {
        const oldest = Math.min(...left.map(q => ctx.recent[q.id]));
        choose = left.filter(q => ctx.recent[q.id] === oldest);
      }
    }
    const q = weightedPick(choose, choose.map(x => weightOf(x, tier, rules, ctx.recent, ctx.gameNo)), rand);
    if (recentOf(q)) repeats++;
    picked.push(q);
    ctx.used.add(q.id);
    keys(q).forEach(k => ctx.facts.add(k));
  }
  return {
    picked,
    repeats,
    nicheShort
  };
}
function selectMix(bank, allowed, tier, count, rules, c) {
  const out = {
    picked: [],
    repeats: 0,
    nicheShort: 0
  };
  const usedGroups = new Set();
  const usedCats = new Set();
  for (let k = 0; k < count; k++) {
    const cats = allowed.map(id => bank.cats.find(x => x.id === id)).filter(Boolean);
    const groups = [...new Set(cats.map(x => x.group))];
    const freshGroups = groups.filter(g => !usedGroups.has(g));
    const tryGroups = shuffleWith(freshGroups.length ? freshGroups : groups, c.rand);
    let done = false;
    for (const g of tryGroups) {
      const inGroup = shuffleWith(cats.filter(x => x.group === g && !usedCats.has(x.id)), c.rand);
      for (const cat of inGroup) {
        const r = selectQuestions(bank.byCat[cat.id] || [], tier, 1, rules, c);
        if (r.picked.length) {
          out.picked.push(r.picked[0]);
          out.repeats += r.repeats;
          out.nicheShort += r.nicheShort;
          usedGroups.add(g);
          usedCats.add(cat.id);
          done = true;
          break;
        }
      }
      if (done) break;
    }
    if (!done) break;
  }
  return out;
}
function shuffleWith(arr, rand) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function selectBoard(cats, bank, rules, ctx) {
  const c = {
    used: new Set(ctx.used || []),
    facts: new Set(ctx.facts || []),
    recent: ctx.recent || {},
    gameNo: ctx.gameNo,
    rand: ctx.rand || Math.random
  };
  const report = {
    exhausted: [],
    repeats: 0,
    nicheShort: 0
  };
  const cells = [];
  const rows = rowTiers(rules);
  const order = [...cats].sort((a, b) => (a.id === MIX_ID) - (b.id === MIX_ID));
  const byCatCells = {};
  order.forEach(cat => {
    const isMix = cat.id === MIX_ID;
    const pool = isMix ? null : bank.byCat[cat.id] || [];
    const out = [];
    const need = {};
    rows.forEach(tier => {
      need[tier] = (need[tier] || 0) + rules.perValue;
    });
    const got = {};
    Object.keys(need).forEach(tier => {
      const r = isMix ? selectMix(bank, ctx.allowed || Object.keys(bank.byCat), +tier, need[tier], rules, c) : selectQuestions(pool, +tier, need[tier], rules, c);
      got[tier] = r.picked;
      report.repeats += r.repeats;
      report.nicheShort += r.nicheShort;
      if (r.picked.length < need[tier]) report.exhausted.push({
        cat: cat.id,
        tier: +tier,
        missing: need[tier] - r.picked.length
      });
    });
    rows.forEach((tier, row) => {
      for (let k = 0; k < rules.perValue; k++) {
        const q = got[tier].shift() || null;
        out.push({
          id: cat.id + ':' + (row + 1) + ':' + k,
          cat: cat.id,
          tier,
          value: POINTS[tier - 1],
          q,
          status: q ? 'open' : 'empty',
          why: q ? undefined : 'exhausted'
        });
      }
    });
    byCatCells[cat.id] = out;
  });
  cats.forEach(cat => cells.push(...byCatCells[cat.id]));
  return {
    cells,
    report
  };
}
const emptyHistory = () => ({
  n: 0,
  seen: {}
});
function markSeen(history, qid, gameNo) {
  const h = history || emptyHistory();
  return {
    ...h,
    seen: {
      ...h.seen,
      [qid]: gameNo
    }
  };
}
function startGameNo(history) {
  return (history && history.n || 0) + 1;
}
function trimHistory(h, keepGames = 200) {
  if (!h) return emptyHistory();
  const seen = {};
  Object.keys(h.seen || {}).forEach(id => {
    if (h.n - h.seen[id] < keepGames) seen[id] = h.seen[id];
  });
  return {
    n: h.n || 0,
    seen
  };
}
const DEFAULT_RULES = {
  values: [200, 400, 600],
  perValue: 2,
  catsPerTeam: 3,
  answerTime: 45,
  stealTime: 15,
  steals: true,
  exclude: [],
  curve: 'standard',
  minTier: 1,
  maxTier: 3,
  niche: false,
  nicheOnly: false,
  strict: false,
  mixed: false,
  randomCats: false,
  progressive: false,
  wrongPenalty: false
};
const TIME_CHOICES = [20, 30, 45, 60, 90];
const STEAL_CHOICES = [10, 15, 20, 30];
const CURVES = ['standard', 'steep', 'brutal'];
const HISTORY_MAX = 40;
function cleanRules(r) {
  const x = {
    ...DEFAULT_RULES,
    ...(r || {})
  };
  x.values = [200, 400, 600];
  x.perValue = x.perValue === 1 ? 1 : 2;
  x.catsPerTeam = clamp(Math.round(x.catsPerTeam) || 3, 1, 6);
  x.answerTime = clamp(Math.round(x.answerTime) || 45, 5, 300);
  x.stealTime = clamp(Math.round(x.stealTime) || 15, 5, 120);
  x.steals = x.steals !== false;
  x.exclude = Array.isArray(x.exclude) ? x.exclude.filter(id => typeof id === 'string') : [];
  x.curve = CURVES.includes(x.curve) ? x.curve : 'standard';
  x.minTier = clamp(Math.round(x.minTier) || 1, 1, 3);
  x.maxTier = clamp(Math.round(x.maxTier) || 3, x.minTier, 3);
  ['niche', 'nicheOnly', 'strict', 'mixed', 'randomCats', 'progressive', 'wrongPenalty'].forEach(k => {
    x[k] = !!x[k];
  });
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
function gamePool(bank, rules) {
  const pool = bank.cats.filter(c => !rules.exclude.includes(c.id) && (bank.byCat[c.id] || []).length).map(c => ({
    id: c.id,
    emoji: c.emoji,
    name: c.name,
    group: c.group,
    popular: c.popular,
    nicheTopic: c.nicheTopic,
    count: tierCounts(bank.byCat[c.id]),
    short: categoryShortfall(bank.byCat[c.id], rules)
  }));
  if (rules.mixed && pool.length) pool.push({
    id: MIX_ID,
    emoji: '🎲',
    name: {
      en: 'Random Mix',
      ar: 'خلطة عشوائية'
    },
    group: 'mix',
    count: null,
    short: [0, 0, 0]
  });
  return pool;
}
function createGame(bank, teams, rules, now = Date.now(), opts = {}) {
  const r = cleanRules(rules);
  return {
    v: 2,
    id: uid(),
    createdAt: now,
    gameNo: opts.gameNo || 1,
    rules: r,
    teams: teams.map((tm, i) => ({
      id: 't' + i,
      name: (tm.name || '').trim(),
      color: tm.color || COLORS[i],
      emoji: tm.emoji || EMOJIS[i],
      score: 0
    })),
    pool: gamePool(bank, r),
    cats: [],
    cells: [],
    log: [],
    report: null,
    phase: 'pick',
    turn: 0,
    current: null,
    history: []
  };
}
const picksNeeded = g => g.rules.catsPerTeam * g.teams.length;
const pickingTeam = g => g.teams[g.cats.length % g.teams.length];
const canPick = (g, c) => !!c && !g.cats.some(x => x.id === c.id) && (c.short || [0, 0, 0]).every(n => n === 0);
function pickCategory(g, catId, ctx) {
  if (g.phase !== 'pick') return g;
  const c = g.pool.find(x => x.id === catId);
  if (!canPick(g, c)) return g;
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
  if (n.cats.length >= picksNeeded(n)) n = buildBoard(n, ctx);
  return n;
}
function randomPick(g, ctx) {
  const left = g.pool.filter(c => canPick(g, c));
  if (!left.length) return g;
  const rand = ctx && ctx.rand || Math.random;
  const usedGroups = new Set(g.cats.map(c => (g.pool.find(p => p.id === c.id) || {}).group));
  const freshGroups = [...new Set(left.map(c => c.group))].filter(x => !usedGroups.has(x));
  const groups = freshGroups.length ? freshGroups : [...new Set(left.map(c => c.group))];
  const grp = groups[Math.floor(rand() * groups.length)];
  const inGroup = left.filter(c => c.group === grp);
  return pickCategory(g, inGroup[Math.floor(rand() * inGroup.length)].id, ctx);
}
function autoPick(g, ctx) {
  let n = g;
  let guard = 0;
  while (n.phase === 'pick' && guard++ < 50) {
    const next = randomPick(n, ctx);
    if (next === n) break;
    n = next;
  }
  return {
    ...n,
    history: []
  };
}
const pickable = g => g.pool.filter(c => canPick(g, c)).length;
function buildBoard(g, ctx) {
  if (!ctx || !ctx.bank) return g;
  const allowed = g.pool.filter(c => c.id !== MIX_ID).map(c => c.id);
  const {
    cells,
    report
  } = selectBoard(g.cats, ctx.bank, g.rules, {
    recent: ctx.recent,
    gameNo: g.gameNo,
    rand: ctx.rand,
    allowed,
    used: ctx.exclude || []
  });
  return {
    ...g,
    cells,
    report,
    phase: 'board',
    turn: 0,
    pool: g.pool
  };
}
function isLocked(g, c) {
  if (!g.rules.progressive || c.status !== 'open') return false;
  return g.cells.some(x => x.cat === c.cat && x.status === 'open' && x.tier < c.tier);
}
function openCell(g, cellId, now = Date.now()) {
  const c = cellById(g, cellId);
  if (g.phase !== 'board' || !c || c.status !== 'open' || isLocked(g, c)) return g;
  const n = withHistory(g, 'open');
  return {
    ...n,
    phase: 'question',
    current: {
      cell: c.id,
      stage: 'answer',
      team: turnTeam(g).id,
      opener: turnTeam(g).id,
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
    qid: c.q && c.q.id,
    cat: c.cat,
    tier: c.tier,
    value: c.value,
    turnTeam: turnTeam(n).id,
    kind: r.kind,
    team: r.team,
    points: r.points || 0,
    penalty: r.penalty || 0,
    answeredBy: r.answeredBy || null,
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
    if (e.kind === 'adjust' || e.kind === 'skipped' || e.void) return;
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
function rematch(g, bank, now = Date.now(), opts = {}) {
  return createGame(bank, g.teams.map(({
    name,
    color,
    emoji
  }) => ({
    name,
    color,
    emoji
  })), g.rules, now, opts);
}
const pastEntry = g => ({
  id: g.id,
  createdAt: g.createdAt,
  endedAt: g.endedAt,
  gameNo: g.gameNo,
  rules: g.rules,
  teams: g.teams,
  cats: g.cats,
  cells: g.cells.map(({
    q,
    ...rest
  }) => rest),
  log: g.log,
  invalid: g.invalid || [],
  phase: 'done'
});
const INVALID_REASONS = ['answer', 'unclear', 'media', 'duplicate', 'other'];
const isInvalidated = (g, qid) => (g.invalid || []).some(x => x.qid === qid);
function invalidRefunds(g, cellId) {
  const c = cellById(g, cellId);
  if (!c || !c.q) return [];
  const out = [];
  const add = (team, delta) => {
    if (team && delta) out.push({
      team,
      delta
    });
  };
  const cur = g.current && g.current.cell === cellId ? g.current : null;
  if (cur) {
    if (cur.stage === 'steal') add(cur.answeredBy, cur.penalty || 0);
    if (cur.stage === 'reveal' && cur.result) {
      add(cur.result.team, -(cur.result.points || 0));
      add(cur.result.answeredBy, cur.result.penalty || 0);
    }
  } else if (c.status === 'done') {
    const e = [...g.log].reverse().find(x => x.cell === cellId && !x.void && x.kind !== 'adjust');
    if (e) {
      add(e.team, -(e.points || 0));
      add(e.answeredBy || e.turnTeam, e.penalty || 0);
    }
  }
  return out;
}
function gameUsed(g) {
  const used = new Set();
  const facts = new Set();
  g.cells.forEach(c => {
    if (c.q) {
      used.add(c.q.id);
      (c.q.facts && c.q.facts.length ? c.q.facts : [c.q.id]).forEach(k => facts.add(k));
    }
  });
  (g.invalid || []).forEach(x => {
    used.add(x.qid);
    (x.facts || []).forEach(k => facts.add(k));
  });
  return {
    used,
    facts
  };
}
function findReplacement(g, cell, ctx) {
  if (!ctx || !ctx.bank) return null;
  const {
    used,
    facts
  } = gameUsed(g);
  (ctx.exclude || []).forEach(id => used.add(id));
  const base = {
    used,
    facts,
    recent: ctx.recent || {},
    gameNo: g.gameNo,
    rand: ctx.rand || Math.random
  };
  const rules = {
    ...g.rules,
    nicheOnly: false
  };
  const realCat = cell.q ? cell.q.cat : cell.cat;
  const try1 = pool => selectQuestions(pool, cell.tier, 1, rules, {
    ...base,
    used: new Set(base.used),
    facts: new Set(base.facts)
  }).picked[0] || null;
  if (cell.cat === MIX_ID) {
    const allowed = g.pool.filter(p => p.id !== MIX_ID).map(p => p.id);
    const r = selectMix(ctx.bank, allowed, cell.tier, 1, rules, {
      ...base,
      used: new Set(base.used),
      facts: new Set(base.facts)
    });
    return r.picked[0] ? {
      q: r.picked[0],
      how: 'same'
    } : null;
  }
  const pool = ctx.bank.byCat[realCat] || [];
  const sub = cell.q && cell.q.sub;
  const q = sub && try1(pool.filter(x => x.sub === sub)) || try1(pool);
  return q ? {
    q,
    how: 'same'
  } : null;
}
function replacementOptions(g, cell, ctx) {
  if (!ctx || !ctx.bank) return [];
  const {
    used,
    facts
  } = gameUsed(g);
  (ctx.exclude || []).forEach(id => used.add(id));
  const rules = {
    ...g.rules,
    nicheOnly: false
  };
  const realCat = cell.q ? cell.q.cat : cell.cat;
  const meta = ctx.bank.cats.find(x => x.id === realCat);
  const group = meta ? meta.group : null;
  const inGame = g.cats.map(c => c.id).filter(id => id !== MIX_ID && id !== realCat);
  const related = ctx.bank.cats.filter(x => x.group === group && x.id !== realCat).map(x => x.id);
  const out = [];
  const tryCats = (ids, how) => {
    for (const id of shuffleWith(ids, ctx.rand || Math.random)) {
      const q = selectQuestions(ctx.bank.byCat[id] || [], cell.tier, 1, rules, {
        used: new Set(used),
        facts: new Set(facts),
        recent: ctx.recent || {},
        gameNo: g.gameNo,
        rand: ctx.rand || Math.random
      }).picked[0];
      if (q) {
        out.push({
          q,
          how
        });
        used.add(q.id);
        return;
      }
    }
  };
  tryCats(related, 'related');
  tryCats(inGame, 'board');
  return out;
}
function invalidateQuestion(g, cellId, opts) {
  const o = opts || {};
  const c = cellById(g, cellId);
  if (!c || !c.q || c.q.id !== o.qid || isInvalidated(g, o.qid) || g.phase === 'pick') return g;
  const isCur = !!(g.current && g.current.cell === cellId);
  if (!isCur && c.status !== 'done') return g;
  const now = o.now || Date.now();
  const refunds = invalidRefunds(g, cellId);
  const stage = isCur ? g.current.stage : 'done';
  const opener = isCur ? g.current.opener || g.current.answeredBy || g.current.result && g.current.result.answeredBy || g.current.team : null;
  let n = withHistory(g, 'invalid');
  refunds.forEach(r => {
    n = addScore(n, r.team, r.delta);
  });
  const rep = o.replacement && o.replacement !== 'empty' && o.replacement.q ? o.replacement : null;
  const record = {
    qid: c.q.id,
    cell: cellId,
    cat: c.cat,
    tier: c.tier,
    value: c.value,
    facts: c.q.facts || [],
    stage,
    reason: INVALID_REASONS.includes(o.reason) ? o.reason : 'other',
    note: o.note ? String(o.note).slice(0, 300) : '',
    refunds,
    replacement: rep ? rep.q.id : null,
    how: rep ? rep.how : 'empty',
    at: now,
    q: {
      q: c.q.q,
      a: c.q.a
    }
  };
  const log = n.log.map(e => !isCur && e.cell === cellId && !e.void && e.kind !== 'adjust' ? {
    ...e,
    void: true
  } : e);
  log.push({
    kind: 'invalid',
    cell: cellId,
    cat: c.cat,
    tier: c.tier,
    value: c.value,
    refunds,
    replaced: !!rep,
    at: now
  });
  const cells = n.cells.map(x => {
    if (x.id !== cellId) return x;
    const {
      result,
      ...rest
    } = x;
    return rep ? {
      ...rest,
      q: rep.q,
      status: 'open',
      replaced: (x.replaced || 0) + 1,
      why: undefined
    } : {
      ...rest,
      q: null,
      status: 'empty',
      why: 'invalid'
    };
  });
  n = {
    ...n,
    cells,
    log,
    invalid: [...(n.invalid || []), record]
  };
  if (isCur) {
    if (rep) n = {
      ...n,
      phase: 'question',
      current: {
        cell: cellId,
        stage: 'answer',
        team: opener,
        opener,
        endsAt: now + ms(n.rules.answerTime * 1000),
        pausedLeft: null,
        result: null
      }
    };else n = {
      ...n,
      phase: 'board',
      current: null
    };
  }
  if (n.phase === 'done' && !n.endedEarly && openCells(n).length) n = {
    ...n,
    phase: 'board',
    endedAt: undefined
  };
  if (n.phase === 'board' && isBoardDone(n)) n = {
    ...n,
    phase: 'done',
    endedAt: now
  };
  return n;
}
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
    timeup: t('timeUp'),
    invalid: '⚠ ' + t('flashInvalid')
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
  }, t('bankNote', {
    q: BANK.total,
    c: BANK.cats.length
  })), past.length > 0 && React.createElement("section", {
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
function Section({
  icon,
  title,
  sub,
  children,
  startOpen
}) {
  const [open, setOpen] = useState(!!startOpen);
  return React.createElement("section", {
    className: "rsec"
  }, React.createElement("button", {
    className: "rtitle",
    "aria-expanded": open,
    onClick: () => setOpen(!open)
  }, React.createElement("span", {
    className: "re"
  }, icon), React.createElement("span", {
    className: "grow"
  }, React.createElement("b", null, title), sub && React.createElement("span", {
    className: "small muted rsum"
  }, sub)), React.createElement("span", {
    className: "chev"
  }, open ? '▲' : '▼')), open && React.createElement("div", {
    className: "rbody stack"
  }, children));
}
const tierLabel = tier => POINTS[tier - 1] + ' · ' + t(['tierEasy', 'tierHard', 'tierBrutal'][tier - 1]);
function difficultySummary(r) {
  const parts = [t('curve_' + r.curve)];
  if (r.minTier > 1 || r.maxTier < 3) parts.push(POINTS[r.minTier - 1] + '–' + POINTS[r.maxTier - 1]);
  if (r.niche) parts.push(t('nicheMode'));
  if (r.nicheOnly) parts.push(t('nicheOnly'));
  if (r.strict) parts.push(t('strictRepeats'));
  if (r.progressive) parts.push(t('progressive'));
  return parts.join(' · ');
}
function Setup({
  initial,
  bank,
  onBack,
  onStart
}) {
  const [teams, setTeams] = useState(() => initial && initial.teams || freshTeams());
  const [rules, setRules] = useState(() => cleanRules(initial && initial.rules));
  const [browse, setBrowse] = useState(false);
  const set = (k, v) => setRules(cleanRules({
    ...rules,
    [k]: v
  }));
  const pool = useMemo(() => gamePool(bank, rules), [bank, rules]);
  const real = pool.filter(c => c.id !== MIX_ID);
  const playable = pool.filter(c => (c.short || [0, 0, 0]).every(n => n === 0));
  const shortCats = real.filter(c => c.short.some(n => n > 0));
  const need = rules.catsPerTeam * teams.length;
  const included = bank.cats.length - rules.exclude.filter(id => bank.byCat[id]).length;
  const qIncluded = real.reduce((n, c) => n + c.count[0] + c.count[1] + c.count[2], 0);
  const problems = [];
  if (teams.some(tm => !tm.name.trim())) problems.push(t('needNames'));
  if (playable.length < need) problems.push(t('needCats', {
    have: playable.length,
    need
  }));
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
  }, t('categories')), React.createElement("div", {
    className: "row"
  }, React.createElement("span", {
    className: "packem"
  }, "\uD83D\uDCDA"), React.createElement("b", {
    className: "grow"
  }, t('catsOn', {
    n: included,
    of: bank.cats.length
  })), React.createElement("span", {
    className: "small muted num"
  }, t('questionsN', {
    n: qIncluded
  }))), shortCats.length > 0 && React.createElement("p", {
    className: "hint"
  }, "\u26A0 ", t('catsShort', {
    n: shortCats.length
  })), React.createElement("button", {
    className: "btn btn-sm",
    style: {
      width: '100%'
    },
    onClick: () => setBrowse(true)
  }, t('chooseCats')), React.createElement(Toggle, {
    on: rules.randomCats,
    onChange: v => set('randomCats', v),
    title: t('randomCats'),
    sub: t('randomCatsSub')
  }), React.createElement(Toggle, {
    on: rules.mixed,
    onChange: v => set('mixed', v),
    title: t('mixedCats'),
    sub: t('mixedCatsSub')
  })), React.createElement(Section, {
    icon: "\u2699\uFE0F",
    title: t('houseRules'),
    sub: t('rulesSummary', {
      per: rules.perValue,
      cats: rules.catsPerTeam,
      a: rules.answerTime,
      s: rules.stealTime
    })
  }, React.createElement("p", {
    className: "hint"
  }, t('valuesFixed')), React.createElement("div", {
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
    options: [1, 2, 3, 4].map(n => [n, String(n)]),
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
  }))), React.createElement(Section, {
    icon: "\uD83C\uDF36\uFE0F",
    title: t('difficulty'),
    sub: difficultySummary(rules)
  }, React.createElement("div", {
    className: "field"
  }, React.createElement("span", {
    className: "label"
  }, t('curve')), React.createElement(Seg, {
    value: rules.curve,
    options: CURVES.map(c => [c, t('curve_' + c)]),
    onChange: v => set('curve', v),
    label: t('curve')
  }), React.createElement("p", {
    className: "hint"
  }, t('curveSub_' + rules.curve))), React.createElement("div", {
    className: "field"
  }, React.createElement("span", {
    className: "label"
  }, t('minDiff')), React.createElement(Seg, {
    value: rules.minTier,
    options: [1, 2, 3].map(n => [n, String(POINTS[n - 1])]),
    onChange: v => setRules(cleanRules({
      ...rules,
      minTier: v,
      maxTier: Math.max(v, rules.maxTier)
    })),
    label: t('minDiff')
  })), React.createElement("div", {
    className: "field"
  }, React.createElement("span", {
    className: "label"
  }, t('maxDiff')), React.createElement(Seg, {
    value: rules.maxTier,
    options: [1, 2, 3].map(n => [n, String(POINTS[n - 1])]),
    onChange: v => setRules(cleanRules({
      ...rules,
      maxTier: v,
      minTier: Math.min(v, rules.minTier)
    })),
    label: t('maxDiff')
  }), (rules.minTier > 1 || rules.maxTier < 3) && React.createElement("p", {
    className: "hint"
  }, t('minMaxSub', {
    rows: rowTiers(rules).map(x => POINTS[x - 1]).join(' / ')
  }))), React.createElement(Toggle, {
    on: rules.niche,
    onChange: v => set('niche', v),
    title: t('nicheMode'),
    sub: t('nicheModeSub')
  }), React.createElement(Toggle, {
    on: rules.nicheOnly,
    onChange: v => set('nicheOnly', v),
    title: t('nicheOnly'),
    sub: t('nicheOnlySub')
  }), React.createElement(Toggle, {
    on: rules.strict,
    onChange: v => set('strict', v),
    title: t('strictRepeats'),
    sub: t('strictRepeatsSub')
  }), React.createElement(Toggle, {
    on: rules.progressive,
    onChange: v => set('progressive', v),
    title: t('progressive'),
    sub: t('progressiveSub')
  })), React.createElement(Section, {
    icon: "\uD83E\uDDE9",
    title: t('modifiers'),
    sub: t('modifiersSub')
  }, React.createElement(Toggle, {
    on: rules.wrongPenalty,
    onChange: v => set('wrongPenalty', v),
    title: t('wrongPenalty'),
    sub: t('wrongPenaltySub')
  })), problems.map(p => React.createElement("p", {
    key: p,
    className: "warn"
  }, p)), React.createElement("button", {
    className: "btn btn-gold",
    disabled: problems.length > 0,
    onClick: () => onStart(teams.map(tm => ({
      ...tm,
      name: tm.name.trim()
    })), rules)
  }, rules.randomCats ? t('startGame') : t('pickCategories')), browse && React.createElement(CategoryBrowser, {
    bank: bank,
    rules: rules,
    onChange: exclude => setRules(cleanRules({
      ...rules,
      exclude
    })),
    onClose: () => setBrowse(false)
  }));
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
  cats,
  onPick,
  big
}) {
  const pickedBy = id => {
    const c = g.cats.find(x => x.id === id);
    return c ? teamById(g, c.by) : null;
  };
  return React.createElement("div", {
    className: 'catgrid' + (big ? ' big' : '')
  }, (cats || g.pool || []).map(c => {
    const by = pickedBy(c.id);
    const short = (c.short || [0, 0, 0]).some(n => n > 0);
    const off = !!by || short;
    return React.createElement("button", {
      key: c.id,
      className: 'catcard' + (by ? ' taken' : '') + (short ? ' short' : ''),
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
    })) : short ? React.createElement("span", {
      className: "cc-n small"
    }, "\u26A0 ", t('notEnough')) : c.id === MIX_ID ? React.createElement("span", {
      className: "cc-n small muted"
    }, t('mixSub')) : React.createElement(TierCounts, {
      count: c.count
    }), !by && !short && c.id !== MIX_ID && (c.popular || c.nicheTopic || c.count && c.count[0] + c.count[1] + c.count[2] >= BIG_BANK) && React.createElement("span", {
      className: "cbadges"
    }, React.createElement(CatBadges, {
      c: c,
      total: c.count ? c.count[0] + c.count[1] + c.count[2] : 0
    })));
  }));
}
function CategoryPick({
  g,
  act,
  ctx,
  bank,
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
  }))), g.cats.length > 0 && React.createElement("div", {
    className: "chips picked"
  }, g.cats.map(c => {
    const by = teamById(g, c.by);
    return React.createElement("span", {
      key: c.id,
      className: "pchip",
      style: tStyle(by)
    }, c.emoji, " ", React.createElement(Txt, {
      v: c.name
    }));
  })), React.createElement("div", {
    className: "row"
  }, React.createElement("button", {
    className: "btn btn-ghost btn-sm grow",
    disabled: !g.cats.length,
    onClick: () => act(undo)
  }, "\u21B6 ", t('undoPick')), React.createElement("button", {
    className: "btn btn-ghost btn-sm grow",
    onClick: () => act(x => randomPick(x, ctx()))
  }, "\uD83C\uDFB2 ", t('randomPick'))), React.createElement(CategoryPicker, {
    g: g,
    bank: bank,
    onPick: id => act(x => pickCategory(x, id, ctx()))
  }));
}
function Tile({
  g,
  cell,
  onOpen
}) {
  if (cell.status === 'empty') {
    const why = cell.why === 'invalid' ? t('tileInvalid') : t('tierExhausted', {
      v: cell.value
    });
    return React.createElement("span", {
      className: 'tile empty' + (cell.why === 'invalid' ? ' invalid' : ''),
      title: why,
      "aria-label": cell.value + ' · ' + why
    }, React.createElement("span", {
      className: "num"
    }, cell.value), React.createElement("i", null, cell.why === 'invalid' ? '⚠' : '∅'));
  }
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
  const locked = isLocked(g, cell);
  return React.createElement("button", {
    className: 'tile open' + (active ? ' active' : '') + (locked ? ' locked' : ''),
    disabled: !onOpen || locked,
    "aria-label": locked ? cell.value + ' · ' + t('lockedTile') : undefined,
    onClick: () => onOpen && onOpen(cell.id)
  }, React.createElement("span", {
    className: "num"
  }, cell.value), locked && React.createElement("i", null, "\uD83D\uDD12"));
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
  })), React.createElement(BoardReport, {
    g: g
  }), React.createElement(BoardGrid, {
    g: g,
    onOpen: id => act(x => openCell(x, id, Date.now()))
  }));
}
function BoardReport({
  g
}) {
  const [hide, setHide] = useState(false);
  const r = g.report;
  if (hide || !r || !r.exhausted.length && !r.repeats && !r.nicheShort) return null;
  return React.createElement("div", {
    className: "card boardnote",
    role: "status"
  }, r.exhausted.length > 0 && React.createElement("p", null, "\u26A0 ", t('reportExhausted', {
    list: r.exhausted.map(e => {
      const c = catById(g, e.cat);
      return (c ? pick(c.name) : e.cat) + ' ' + POINTS[e.tier - 1];
    }).join(', ')
  })), r.repeats > 0 && React.createElement("p", null, "\u21BA ", t('reportRepeats', {
    n: r.repeats
  })), r.nicheShort > 0 && React.createElement("p", null, "\uD83C\uDF36\uFE0F ", t('reportNiche', {
    n: r.nicheShort
  })), React.createElement("button", {
    className: "btn btn-sm btn-ghost",
    onClick: () => setHide(true)
  }, t('dismiss')));
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
const altList = q => q.alt ? [...(q.alt[LANG] || []), ...(q.alt[LANG === 'ar' ? 'en' : 'ar'] || [])] : [];
function QuestionCard({
  cell,
  big,
  showAnswer,
  host
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
  }), host && altList(q).length > 0 && React.createElement("p", {
    className: "aalt"
  }, React.createElement("b", null, t('alsoAccept')), " ", React.createElement("bdi", {
    dir: "auto"
  }, altList(q).join(' · '))), q.note && React.createElement(Txt, {
    v: q.note,
    as: "p",
    className: "anote"
  }), host && q.asOf && React.createElement("p", {
    className: "aalt"
  }, t('asOf', {
    d: q.asOf
  })), host && q.hint && React.createElement("p", {
    className: "aalt"
  }, "\uD83D\uDCA1 ", React.createElement("b", null, t('hintForHost')), " ", React.createElement(Txt, {
    v: q.hint
  }))));
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
  onTv,
  onWrong
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
    showAnswer: reveal || peek,
    host: true
  }), cell.q.check && React.createElement("p", {
    className: "checkbadge"
  }, t('needsCheck')), reveal && React.createElement(ResultBanner, {
    g: g
  }), onWrong && React.createElement("button", {
    className: "btn btn-sm btn-flag wrongbtn",
    onClick: () => onWrong(cell.id)
  }, "\u26A0 ", t('thisIsWrong')), !reveal && React.createElement("button", {
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
    if (e.kind === 'invalid') return React.createElement("li", {
      key: i,
      className: "lg-invalid"
    }, c && React.createElement("span", {
      className: "muted"
    }, c.emoji, " ", pick(c.name), " ", e.value, " \xB7 "), React.createElement("span", null, "\u26A0 ", e.replaced ? t('logInvalidRep') : t('logInvalid')), (e.refunds || []).map((r, k) => {
      const rt = teamById(g, r.team);
      return React.createElement("span", {
        key: k,
        className: "muted"
      }, " \xB7 ", teamName(rt), " ", fmtDelta(r.delta));
    }));
    const what = e.kind === 'adjust' ? t('logAdjust', {
      team: teamName(tm),
      d: (e.points > 0 ? '+' : '') + e.points
    }) : e.kind === 'correct' ? t('logCorrect', {
      team: teamName(tm)
    }) : e.kind === 'stolen' ? t('logStolen', {
      team: teamName(tm)
    }) : e.kind === 'skipped' ? t('logSkipped') : t('logMissed');
    return React.createElement("li", {
      key: i,
      className: e.void ? 'lg-void' : undefined
    }, c && React.createElement("span", {
      className: "muted"
    }, c.emoji, " ", pick(c.name), " ", e.value, " \xB7 "), React.createElement("span", {
      dir: "auto"
    }, what), e.penalty ? React.createElement("span", {
      className: "muted"
    }, " (\u2212", e.penalty, ")") : null, e.void ? React.createElement("span", {
      className: "muted"
    }, " ", t('logVoid')) : null);
  })));
}
function Results({
  g,
  act,
  onHome,
  onAgain,
  onFlagPlayed
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
  }), onFlagPlayed && React.createElement("button", {
    className: "btn btn-sm btn-flag",
    onClick: onFlagPlayed
  }, "\u26A0 ", t('flagPlayed')), React.createElement("button", {
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
  onHome,
  onFlagPlayed
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
  }, "\xB1 ", t('fixScores')), g.phase !== 'pick' && onFlagPlayed && React.createElement("button", {
    className: "btn btn-flag",
    onClick: () => {
      onClose();
      onFlagPlayed();
    }
  }, "\u26A0 ", t('flagPlayed')), g.phase !== 'pick' && React.createElement("button", {
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
const normSearch = s => String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ًͯ-ْ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي');
function catMatches(c, q, bank) {
  if (!q) return true;
  const g = bank && bank.groups.find(x => x.id === c.group);
  const subs = c.subs ? Object.values(c.subs) : [];
  const hay = [c.name.en, c.name.ar, g && g.name.en, g && g.name.ar, ...subs.map(s => s.en + ' ' + s.ar)].map(normSearch).join(' | ');
  return normSearch(q).split(/\s+/).filter(Boolean).every(w => hay.includes(w));
}
function TierCounts({
  count,
  short
}) {
  if (!count) return null;
  return React.createElement("span", {
    className: "tiercounts num",
    dir: "ltr"
  }, count.map((n, i) => React.createElement("span", {
    key: i,
    className: 'tc t' + (i + 1) + (short && short[i] > 0 ? ' short' : ''),
    title: POINTS[i] + ': ' + n
  }, n)));
}
const BIG_BANK = 30;
const catTotal = (bank, id) => (bank.byCat[id] || []).length;
function CatBadges({
  c,
  total
}) {
  return React.createElement(React.Fragment, null, c.popular ? React.createElement("span", {
    className: "cbadge pop"
  }, "\u2605 ", t('popular')) : null, c.nicheTopic ? React.createElement("span", {
    className: "cbadge niche"
  }, "\uD83C\uDF36\uFE0F ", t('nicheTopics')) : null, total >= BIG_BANK ? React.createElement("span", {
    className: "cbadge big"
  }, "\uD83D\uDCDA ", t('bigBank')) : null);
}
function FilterChips({
  value,
  onChange,
  groups
}) {
  return React.createElement("div", {
    className: "fchips",
    role: "tablist"
  }, React.createElement("button", {
    className: 'fchip' + (value === 'all' ? ' on' : ''),
    role: "tab",
    "aria-selected": value === 'all',
    onClick: () => onChange('all')
  }, t('all')), React.createElement("button", {
    className: 'fchip' + (value === 'popular' ? ' on' : ''),
    role: "tab",
    "aria-selected": value === 'popular',
    onClick: () => onChange('popular')
  }, "\u2605 ", t('popular')), React.createElement("button", {
    className: 'fchip' + (value === 'niche' ? ' on' : ''),
    role: "tab",
    "aria-selected": value === 'niche',
    onClick: () => onChange('niche')
  }, "\uD83C\uDF36\uFE0F ", t('nicheTopics')), groups.map(x => React.createElement("button", {
    key: x.id,
    className: 'fchip' + (value === x.id ? ' on' : ''),
    role: "tab",
    "aria-selected": value === x.id,
    onClick: () => onChange(x.id)
  }, x.emoji, " ", React.createElement(Txt, {
    v: x.name
  }))));
}
const filterMatch = (c, f) => f === 'all' || f === 'popular' && c.popular || f === 'niche' && c.nicheTopic || c.group === f;
function CategoryBrowser({
  bank,
  rules,
  onChange,
  onClose
}) {
  const [q, setQ] = useState('');
  const [flt, setFlt] = useState('all');
  const [open, setOpen] = useState({});
  const [subsOpen, setSubsOpen] = useState(null);
  const off = new Set(rules.exclude);
  const toggle = id => {
    const n = new Set(off);
    if (n.has(id)) n.delete(id);else n.add(id);
    onChange([...n]);
  };
  const setMany = (ids, on) => {
    const n = new Set(off);
    ids.forEach(id => on ? n.delete(id) : n.add(id));
    onChange([...n]);
  };
  const searching = q.trim().length > 0;
  const visible = bank.cats.filter(c => filterMatch(c, flt) && catMatches(c, q, bank)).map(c => c.id);
  return React.createElement(Sheet, {
    onClose: onClose
  }, React.createElement("div", {
    className: "stack catbrowser"
  }, React.createElement("div", {
    className: "row"
  }, React.createElement("h2", {
    className: "display grow"
  }, t('chooseCats')), React.createElement("button", {
    className: "btn btn-sm btn-gold",
    onClick: onClose
  }, t('done'))), React.createElement("input", {
    className: "input",
    type: "search",
    dir: "auto",
    value: q,
    placeholder: t('searchCats'),
    "aria-label": t('searchCats'),
    onChange: e => setQ(e.target.value)
  }), React.createElement("div", {
    className: "row"
  }, React.createElement("button", {
    className: "btn btn-sm grow",
    onClick: () => setMany(visible, true)
  }, t(searching || flt !== 'all' ? 'shownOn' : 'allOn')), React.createElement("button", {
    className: "btn btn-sm btn-ghost grow",
    onClick: () => setMany(visible, false)
  }, t(searching || flt !== 'all' ? 'shownOff' : 'allOff'))), React.createElement(FilterChips, {
    value: flt,
    onChange: setFlt,
    groups: bank.groups
  }), React.createElement("p", {
    className: "hint"
  }, t('countsKey')), bank.groups.map(g => {
    const cats = bank.cats.filter(c => c.group === g.id && filterMatch(c, flt) && catMatches(c, q, bank));
    if (!cats.length) return null;
    const onN = cats.filter(c => !off.has(c.id)).length;
    const expanded = searching || flt !== 'all' || open[g.id];
    return React.createElement("section", {
      key: g.id,
      className: "cgroup"
    }, React.createElement("div", {
      className: "cg-head"
    }, React.createElement("button", {
      className: "cg-title",
      "aria-expanded": !!expanded,
      onClick: () => setOpen({
        ...open,
        [g.id]: !open[g.id]
      })
    }, React.createElement("span", {
      className: "cg-em"
    }, g.emoji), React.createElement("b", {
      className: "grow"
    }, React.createElement(Txt, {
      v: g.name
    })), React.createElement("span", {
      className: "small muted num"
    }, onN, "/", cats.length), React.createElement("span", {
      className: "chev"
    }, expanded ? '▲' : '▼')), React.createElement("button", {
      className: "mini-sw",
      role: "switch",
      "aria-checked": onN === cats.length,
      "aria-label": t('allInGroup', {
        g: pick(g.name)
      }),
      onClick: () => setMany(cats.map(c => c.id), onN !== cats.length)
    }, React.createElement("span", null))), expanded && React.createElement("div", {
      className: "stack-sm cg-body"
    }, cats.map(c => {
      const qs = bank.byCat[c.id] || [];
      const count = tierCounts(qs);
      const short = categoryShortfall(qs, rules);
      const subs = Object.keys(c.subs || {});
      return React.createElement("div", {
        key: c.id,
        className: 'crow' + (off.has(c.id) ? ' off' : '')
      }, React.createElement("button", {
        className: "crow-main",
        role: "switch",
        "aria-checked": !off.has(c.id),
        onClick: () => toggle(c.id)
      }, React.createElement("span", {
        className: "cr-em"
      }, c.emoji), React.createElement("span", {
        className: "grow cr-txt"
      }, React.createElement(Txt, {
        v: c.name,
        className: "cr-name"
      }), React.createElement("span", {
        className: "cbadges"
      }, React.createElement(CatBadges, {
        c: c,
        total: qs.length
      })), React.createElement("span", {
        className: "small muted"
      }, t('questionsN', {
        n: qs.length
      }), short.some(n => n) ? ' · ⚠ ' + t('shortFor', {
        tiers: short.map((n, i) => n ? POINTS[i] : null).filter(Boolean).join('/')
      }) : '')), React.createElement(TierCounts, {
        count: count,
        short: short
      }), React.createElement("span", {
        className: 'cr-check' + (off.has(c.id) ? '' : ' on'),
        "aria-hidden": "true"
      }, off.has(c.id) ? '' : '✓')), subs.length > 0 && React.createElement("button", {
        className: "cr-subbtn",
        "aria-expanded": subsOpen === c.id,
        onClick: () => setSubsOpen(subsOpen === c.id ? null : c.id)
      }, t('subcats', {
        n: subs.length
      }), " ", subsOpen === c.id ? '▲' : '▼'), subsOpen === c.id && React.createElement("ul", {
        className: "sublist"
      }, subs.map(k => {
        const n = qs.filter(x => x.sub === k);
        return React.createElement("li", {
          key: k
        }, React.createElement(Txt, {
          v: c.subs[k]
        }), " ", React.createElement(TierCounts, {
          count: tierCounts(n)
        }));
      })));
    })));
  })));
}
function CategoryPicker({
  g,
  bank,
  onPick
}) {
  const [q, setQ] = useState('');
  const [grp, setGrp] = useState('all');
  const groups = bank.groups.filter(x => g.pool.some(c => c.group === x.id));
  const meta = c => bank.cats.find(x => x.id === c.id) || c;
  const list = g.pool.filter(c => (c.id === MIX_ID ? grp === 'all' : filterMatch(c, grp)) && (c.id === MIX_ID ? !q : catMatches(meta(c), q, bank)));
  return React.createElement("div", {
    className: "stack-sm"
  }, React.createElement("input", {
    className: "input",
    type: "search",
    dir: "auto",
    value: q,
    placeholder: t('searchCats'),
    "aria-label": t('searchCats'),
    onChange: e => setQ(e.target.value)
  }), React.createElement(FilterChips, {
    value: grp,
    onChange: setGrp,
    groups: groups
  }), list.length ? React.createElement(CategoryGrid, {
    g: g,
    cats: list,
    onPick: onPick
  }) : React.createElement("p", {
    className: "hint center"
  }, t('noMatch')));
}
const fmtDelta = d => (d > 0 ? '+' : '−') + Math.abs(d);
const catName = (g, bank, id) => {
  const c = catById(g, id) || bank && bank.cats.find(x => x.id === id);
  return c ? pick(c.name) : id;
};
function WrongSheet({
  g,
  cellId,
  ctx,
  act,
  onClose,
  onDone
}) {
  const cell = cellById(g, cellId);
  const qid = cell && cell.q && cell.q.id;
  const [reason, setReason] = useState(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const plan = useMemo(() => {
    if (!cell || !cell.q) return null;
    const c = ctx();
    const same = findReplacement(g, cell, c);
    return {
      refunds: invalidRefunds(g, cellId),
      same,
      options: same ? [] : replacementOptions(g, cell, c)
    };
  }, [cellId, qid]);
  const [choice, setChoice] = useState(0);
  if (!cell || !plan) return null;
  const isCur = !!(g.current && g.current.cell === cellId);
  const realCat = cell.q.cat;
  const choices = plan.same ? [plan.same] : [...plan.options, 'empty'];
  const chosen = choices[Math.min(choice, choices.length - 1)];
  const refunding = plan.refunds.length > 0;
  const go = () => {
    if (busy) return;
    setBusy(true);
    const rec = {
      qid,
      reason: reason || 'other',
      note,
      replacement: chosen,
      now: Date.now()
    };
    act(x => invalidateQuestion(x, cellId, rec));
    onDone && onDone({
      refunded: refunding,
      cell,
      rec,
      refunds: plan.refunds,
      replacement: chosen
    });
    onClose();
  };
  const yes = refunding ? chosen === 'empty' ? t('reverseAndEmpty') : t('reverseAndReplace') : chosen === 'empty' ? t('removeIt') : t('replaceIt');
  return React.createElement(Sheet, {
    onClose: onClose
  }, React.createElement("div", {
    className: "stack wrongsheet"
  }, React.createElement("h2", {
    className: "display",
    style: {
      fontSize: 28
    }
  }, "\u26A0 ", t('wrongTitle')), React.createElement("div", {
    className: "card wq"
  }, React.createElement("span", {
    className: "small muted"
  }, catName(g, null, cell.cat), " \xB7 ", cell.value), React.createElement(Txt, {
    v: cell.q.q,
    as: "p",
    className: "wq-q"
  })), React.createElement("p", {
    className: "hint",
    style: {
      margin: 0
    }
  }, t('wrongSub', {
    v: cell.value
  })), React.createElement("span", {
    className: "label"
  }, t('whyWrong')), React.createElement("div", {
    className: "chips"
  }, INVALID_REASONS.map(r => React.createElement("button", {
    key: r,
    className: 'chip' + (reason === r ? ' on' : ''),
    "aria-pressed": reason === r,
    onClick: () => setReason(reason === r ? null : r)
  }, t('reason_' + r)))), React.createElement("input", {
    className: "input",
    dir: "auto",
    maxLength: 300,
    value: note,
    placeholder: t('wrongNote'),
    "aria-label": t('wrongNote'),
    onChange: e => setNote(e.target.value)
  }), React.createElement("div", {
    className: 'card refundbox' + (refunding ? ' on' : '')
  }, refunding ? React.createElement(React.Fragment, null, React.createElement("b", null, t('willRefund')), React.createElement("ul", null, plan.refunds.map((r, i) => {
    const tm = teamById(g, r.team);
    return React.createElement("li", {
      key: i,
      style: tStyle(tm)
    }, React.createElement("span", {
      className: "dot"
    }), " ", React.createElement("span", {
      dir: "auto"
    }, t('refundLine', {
      team: teamName(tm),
      d: fmtDelta(r.delta)
    })), " ", React.createElement("span", {
      className: "muted num"
    }, "(", tm.score, " \u2192 ", tm.score + r.delta, ")"));
  }))) : React.createElement("span", null, t('noRefund'))), plan.same ? React.createElement("p", {
    className: "repline"
  }, "\uD83D\uDD01 ", t('repSame', {
    v: cell.value,
    cat: cell.cat === MIX_ID ? catName(g, null, MIX_ID) : catName(g, ctx().bank, realCat)
  }), " ", isCur ? t('repSameNow') : t('repSameBoard')) : React.createElement("div", {
    className: "stack-sm",
    role: "radiogroup"
  }, React.createElement("p", {
    className: "warn",
    style: {
      margin: 0
    }
  }, t('repNone', {
    cat: catName(g, ctx().bank, realCat),
    v: cell.value
  })), choices.map((c, i) => React.createElement("button", {
    key: i,
    role: "radio",
    "aria-checked": choice === i,
    className: 'optrow' + (choice === i ? ' on' : ''),
    onClick: () => setChoice(i)
  }, React.createElement("span", {
    className: "radio",
    "aria-hidden": "true"
  }), React.createElement("span", {
    className: "grow"
  }, c === 'empty' ? React.createElement(React.Fragment, null, t('repEmpty'), isCur ? React.createElement("small", {
    className: "muted"
  }, " \xB7 ", t('repEmptyNow')) : null) : t(c.how === 'related' ? 'repRelated' : 'repBoard', {
    v: cell.value,
    cat: catName(g, ctx().bank, c.q.cat)
  }))))), React.createElement("div", {
    className: "row"
  }, React.createElement("button", {
    className: "btn btn-ghost grow",
    onClick: onClose
  }, t('cancel')), React.createElement("button", {
    className: "btn btn-flag solid grow",
    disabled: busy,
    onClick: go
  }, yes))));
}
function PlayedList({
  g,
  onPick,
  onClose
}) {
  const order = {};
  g.log.forEach((e, i) => {
    if (e.cell && !e.void && e.kind !== 'invalid') order[e.cell] = i;
  });
  const played = g.cells.filter(c => c.status === 'done' && c.q && !isInvalidated(g, c.q.id)).sort((a, b) => (order[b.id] || 0) - (order[a.id] || 0));
  return React.createElement(Sheet, {
    onClose: onClose
  }, React.createElement("div", {
    className: "stack-sm"
  }, React.createElement("h2", {
    className: "display",
    style: {
      fontSize: 28
    }
  }, "\u26A0 ", t('flagPlayed')), React.createElement("p", {
    className: "hint",
    style: {
      margin: 0
    }
  }, t('flagPlayedSub')), !played.length && React.createElement("p", {
    className: "hint center"
  }, t('noPlayed')), played.map(c => {
    const tm = c.result && c.result.team ? teamById(g, c.result.team) : null;
    return React.createElement("button", {
      key: c.id,
      className: "optrow played",
      onClick: () => onPick(c.id)
    }, React.createElement("span", {
      className: "pl-v num"
    }, c.value), React.createElement("span", {
      className: "grow"
    }, React.createElement("span", {
      className: "small muted"
    }, catName(g, null, c.cat), tm ? ' · ' + teamName(tm) : ''), React.createElement(Txt, {
      v: c.q.q,
      as: "span",
      className: "pl-q"
    })));
  }), React.createElement("button", {
    className: "btn btn-ghost",
    onClick: onClose
  }, t('close'))));
}
const ISSUES_MAX = 500;
function issueEntry(g, info) {
  const c = info.cell;
  const q = c.q;
  return {
    id: uid(),
    at: info.rec.now,
    gameId: g.id,
    qid: q.id,
    cat: q.cat,
    tier: c.tier,
    value: c.value,
    type: q.type || 'text',
    q: q.q,
    a: q.a,
    ref: q.ref || null,
    pack: q.pack || null,
    reason: info.rec.reason,
    note: info.rec.note || '',
    refunds: info.refunds,
    replacement: info.replacement && info.replacement !== 'empty' ? info.replacement.q.id : null
  };
}
function addIssue(list, entry) {
  if ((list || []).some(x => x.gameId === entry.gameId && x.qid === entry.qid)) return list;
  return [entry, ...(list || [])].slice(0, ISSUES_MAX);
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
        alt: null,
        note: null,
        hint: null,
        ref: null
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
    })), React.createElement("span", null, t('picksLeft', {
      n: picksNeeded(g) - g.cats.length
    })))), g.cats.length > 0 && React.createElement(CategoryGrid, {
      g: g,
      cats: g.cats.map(c => g.pool.find(p => p.id === c.id) || c),
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
  onBack,
  bank,
  qhist,
  onResetHistory,
  issues,
  onClearIssues,
  extra
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
  }))), bank && React.createElement("section", {
    className: "card stack"
  }, React.createElement("h3", null, t('qbank')), React.createElement("p", {
    className: "hint"
  }, t('qbankSub', {
    q: bank.total,
    c: bank.cats.length
  })), React.createElement("p", {
    className: "hint"
  }, t('historySub', {
    n: Object.keys(qhist && qhist.seen || {}).length,
    g: qhist && qhist.n || 0
  })), React.createElement("button", {
    className: "btn",
    disabled: !qhist || !Object.keys(qhist.seen || {}).length,
    onClick: () => setAsk({
      kind: 'hist'
    })
  }, t('resetHistory'))), issues && React.createElement("section", {
    className: "card stack"
  }, React.createElement("h3", null, "\u26A0 ", t('issues')), React.createElement("p", {
    className: "hint"
  }, t('issuesSub'), " ", React.createElement("b", null, t('issuesN', {
    n: issues.length
  }))), React.createElement(Toggle, {
    on: settings.skipReported !== false,
    onChange: v => set('skipReported', v),
    title: t('skipReported')
  }), issues.length > 0 ? React.createElement("details", {
    className: "issuelist"
  }, React.createElement("summary", {
    className: "label"
  }, t('issuesN', {
    n: issues.length
  })), React.createElement("ol", null, issues.slice(0, 100).map(x => {
    const c = bank && bank.cats.find(k => k.id === x.cat);
    return React.createElement("li", {
      key: x.id
    }, React.createElement("span", {
      className: "muted small"
    }, c ? c.emoji + ' ' + pick(c.name) : x.cat, " \xB7 ", x.value, " \xB7 ", t('reason_' + (x.reason || 'other')), x.note ? ' · ' : ''), x.note ? React.createElement("bdi", {
      dir: "auto",
      className: "small"
    }, x.note) : null, React.createElement(Txt, {
      v: x.q,
      as: "span",
      className: "iq"
    }), React.createElement("span", {
      className: "small muted"
    }, " \u2192 ", React.createElement(Txt, {
      v: x.a
    })));
  }))) : React.createElement("p", {
    className: "hint"
  }, t('issuesNone')), React.createElement("div", {
    className: "row"
  }, React.createElement("button", {
    className: "btn grow",
    disabled: !issues.length,
    onClick: () => downloadBlob(new Blob([JSON.stringify({
      app: 'khatfa',
      kind: 'reported-questions',
      exportedAt: new Date().toISOString(),
      issues
    }, null, 1)], {
      type: 'application/json'
    }), 'khatfa-reported-' + todayStamp() + '.json')
  }, "\u2B07 ", t('exportIssues')), React.createElement("button", {
    className: "btn btn-ghost grow",
    disabled: !issues.length,
    onClick: () => setAsk({
      kind: 'issues'
    })
  }, t('clearIssues')))), extra, React.createElement("section", {
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
  }), ask && ask.kind === 'hist' && React.createElement(Confirm, {
    title: t('resetHistoryQ'),
    body: t('resetHistoryBody'),
    yes: t('resetHistory'),
    onYes: onResetHistory,
    onClose: () => setAsk(null)
  }), ask && ask.kind === 'issues' && React.createElement(Confirm, {
    title: t('clearIssuesQ'),
    body: t('clearIssuesBody'),
    yes: t('clearIssues'),
    onYes: onClearIssues,
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
const deviceLang = () => {
  try {
    return /^ar\b/i.test(navigator.languages && navigator.languages[0] || navigator.language || '') ? 'ar' : 'en';
  } catch (e) {
    return 'en';
  }
};
const DEFAULT_SETTINGS = {
  lang: deviceLang(),
  qLang: 'auto',
  motion: 'system',
  tvZoom: 1,
  rules: null,
  lastTeams: null,
  skipReported: true
};
function applyDocLang(lang) {
  const el = document.documentElement;
  el.setAttribute('lang', lang === 'en' ? 'en' : 'ar');
  el.setAttribute('dir', lang === 'en' ? 'ltr' : 'rtl');
}
const BANK = indexBank();
function App() {
  const [ready, setReady] = useState(false);
  const [settings, setSettingsRaw] = useState(DEFAULT_SETTINGS);
  const [game, setGameRaw] = useState(null);
  const [past, setPast] = useState([]);
  const [qhist, setQhistRaw] = useState(emptyHistory());
  const histRef = useRef(qhist);
  histRef.current = qhist;
  const setQhist = h => {
    histRef.current = h;
    setQhistRaw(h);
    store.set(K.history, h);
  };
  const [screen, setScreen] = useState('home');
  const [flash, setFlash] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [tvHere, setTvHere] = useState(false);
  const [toast, setToast] = useState(null);
  const [wrongCell, setWrongCell] = useState(null);
  const [playedList, setPlayedList] = useState(false);
  const [issues, setIssuesRaw] = useState([]);
  const issuesRef = useRef(issues);
  issuesRef.current = issues;
  const setIssues = l => {
    issuesRef.current = l;
    setIssuesRaw(l);
    store.set(K.issues, l);
  };
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
      const h = store.get(K.history, null);
      if (h && h.seen) {
        histRef.current = h;
        setQhistRaw(h);
      }
      const iss = store.get(K.issues, []);
      if (Array.isArray(iss)) {
        issuesRef.current = iss;
        setIssuesRaw(iss);
      }
      setReady(true);
    });
  }, []);
  useEffect(() => {
    setLang(settings.lang);
    applyDocLang(settings.lang);
    document.documentElement.setAttribute('data-motion', settings.motion || 'system');
    document.documentElement.style.setProperty('--tvzoom', String(settings.tvZoom || 1));
  }, [settings.lang, settings.motion, settings.tvZoom]);
  const latestSettings = useRef(settings);
  latestSettings.current = settings;
  const setSettings = s => {
    setLang(s.lang);
    setSettingsRaw(s);
    store.set(K.settings, s);
  };
  const setGame = next => {
    setGameRaw(prev => {
      const g = typeof next === 'function' ? next(prev) : next;
      if (g) store.set(K.current, g);else store.del(K.current);
      if (g && prev && prev.id === g.id && prev.phase === 'pick' && g.phase === 'board' && histRef.current.n < g.gameNo) setQhist({
        ...histRef.current,
        n: g.gameNo
      });
      if (g && g.current && (!prev || !prev.current || prev.current.cell !== g.current.cell)) {
        const c = cellById(g, g.current.cell);
        if (c && c.q) setQhist(trimHistory(markSeen(histRef.current, c.q.id, g.gameNo)));
      }
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
  const reportedIds = () => latestSettings.current.skipReported !== false ? issuesRef.current.map(x => x.qid) : [];
  const ctx = () => ({
    bank: BANK,
    recent: histRef.current.seen,
    rand: Math.random,
    exclude: reportedIds()
  });
  const begin = g => {
    if (g.rules.randomCats) {
      const b = autoPick(g, ctx());
      if (histRef.current.n < b.gameNo && b.phase === 'board') setQhist({
        ...histRef.current,
        n: b.gameNo
      });
      return b;
    }
    return g;
  };
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
  const startNew = (teams, rules) => {
    setSettings({
      ...settings,
      rules,
      lastTeams: teams
    });
    setGame(begin(createGame(BANK, teams, rules, Date.now(), {
      gameNo: startGameNo(histRef.current)
    })));
    setScreen('game');
  };
  const goHome = () => {
    setTvHere(false);
    setScreen('home');
  };
  const playAgain = () => {
    setGame(begin(rematch(game, BANK, Date.now(), {
      gameNo: startGameNo(histRef.current)
    })));
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
    setIssues(Array.isArray(d.issues) ? d.issues : []);
    if (d.history) setQhist(d.history);
  };
  const clearAll = () => {
    Object.values(K).forEach(k => store.del(k));
    setSettingsRaw(DEFAULT_SETTINGS);
    setLang(DEFAULT_SETTINGS.lang);
    setGameRaw(null);
    setPast([]);
    issuesRef.current = [];
    setIssuesRaw([]);
    histRef.current = emptyHistory();
    setQhistRaw(emptyHistory());
    setScreen('home');
  };
  const onWrongDone = info => {
    setIssues(addIssue(issuesRef.current, issueEntry(game, info)));
    setToast({
      text: info.refunded ? t('wrongDoneRefund') : t('wrongDone'),
      ok: true
    });
    sendTv({
      kind: 'invalid'
    });
  };
  let view;
  if (screen === 'settings') view = React.createElement(SettingsScreen, {
    settings: settings,
    setSettings: setSettings,
    state: {
      settings,
      game,
      past,
      packs: store.get(K.packs, []),
      history: qhist,
      issues
    },
    issues: issues,
    onClearIssues: () => setIssues([]),
    onRestore: restore,
    onClearAll: clearAll,
    bank: BANK,
    qhist: qhist,
    onResetHistory: () => setQhist({
      n: histRef.current.n,
      seen: {}
    }),
    onBack: () => setScreen('home')
  });else if (screen === 'setup') view = React.createElement(Setup, {
    bank: BANK,
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
      ctx,
      bank: BANK,
      onMenu: () => setSheet('menu'),
      onTv: () => setSheet('tv'),
      onWrong: id => setWrongCell(id)
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
      onAgain: playAgain,
      onFlagPlayed: () => setPlayedList(true)
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
    onHome: goHome,
    onFlagPlayed: () => setPlayedList(true)
  }), playedList && game && React.createElement(PlayedList, {
    g: game,
    onClose: () => setPlayedList(false),
    onPick: id => {
      setPlayedList(false);
      setWrongCell(id);
    }
  }), wrongCell && game && React.createElement(WrongSheet, {
    g: game,
    cellId: wrongCell,
    ctx: ctx,
    act: act,
    onClose: () => setWrongCell(null),
    onDone: onWrongDone
  }), sheet === 'tv' && React.createElement(TvSheet, {
    onClose: () => setSheet(null),
    onHere: () => setTvHere(true)
  }), sheet === 'how' && React.createElement(HowTo, {
    onClose: () => setSheet(null)
  }), toast && React.createElement(Toast, {
    msg: toast.text,
    ok: toast.ok,
    onClose: () => setToast(null)
  })));
}
if (window.__KH_TEST__) window.__KH = {
  store,
  K,
  BANK,
  indexBank,
  selectBoard,
  selectQuestions,
  rowTiers,
  tiersNeeded,
  categoryShortfall,
  gamePool,
  autoPick,
  isLocked,
  markSeen,
  trimHistory,
  emptyHistory,
  startGameNo,
  tierCounts,
  POINTS,
  MIX_ID,
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
  invalidateQuestion,
  invalidRefunds,
  findReplacement,
  replacementOptions,
  isInvalidated,
  addIssue,
  issueEntry,
  gameUsed,
  makeBackup,
  validateBackup,
  t,
  setLang,
  pick,
  S
};
ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(Boundary, null, React.createElement(App, null)));
})();
