/* ============================================================
   SOUND: one central sound manager for game events.
   Where a sound comes from (first one found wins):
     1. Your own recording for that event (Settings → Sound), saved in this browser (IndexedDB).
     2. A file in the site's sounds/ folder named after the event (e.g. sounds/steal.mp3);
        build.js lists them in SOUND_FILES.
     3. A simple built-in sound, generated in the browser (no files, nothing copyrighted).
        Can be switched off.
     4. Nothing: the game works the same with no sound at all.
   Only ONE device plays: the TV window if one is open (unless the host chose "play here"),
   otherwise this device. Every event has a unique id, so a repeated message, a re-render or
   an undo never plays it twice. Muted = nothing plays (and nothing is queued for later).
   ============================================================ */
const SFX = [
  { id: 'countdown-tick', en: 'Clock ticks (last 5 s)', ar: 'تكتكة الساعة (آخر ٥ ثواني)' },
  { id: 'correct', en: 'Correct answer', ar: 'جواب صح', voice: 1 },
  { id: 'wrong', en: 'Wrong answer', ar: 'جواب غلط', voice: 1 },
  { id: 'steal', en: 'Steal (Khatfa!)', ar: 'خطفة!', voice: 1 },
  { id: 'category-reveal', en: 'Category picked', ar: 'اختيار فئة', voice: 1 },
  { id: 'game-intro', en: 'Game intro', ar: 'بداية اللعبة', voice: 1 },
  { id: 'winner-fanfare', en: 'Winner', ar: 'الفائز', voice: 1 },
  { id: 'help-start', en: 'Call for Help starts', ar: 'بداية الفزعة' },
  { id: 'help-end', en: 'Call for Help ends', ar: 'نهاية الفزعة' },
  { id: 'double-it', en: 'Double It', ar: 'ضاعفها' },
  { id: 'shield', en: 'Shield', ar: 'درع' },
  { id: 'swap', en: 'Swap', ar: 'بدّل' },
  { id: 'extra-time', en: 'Extra Time', ar: 'تمديد' },
];
const DEFAULT_SOUND = { volume: 0.8, muted: false, builtin: true, files: {} };
const cleanSound = (s) => {
  const x = { ...DEFAULT_SOUND, ...(s || {}) };
  x.volume = clamp(+x.volume || 0, 0, 1); x.muted = !!x.muted; x.builtin = x.builtin !== false;
  x.files = x.files && typeof x.files === 'object' ? x.files : {};
  return x;
};
const SOUND_MAX_BYTES = 3 * 1024 * 1024, SOUND_MAX_SECONDS = 20;
const LL_SOUND = { double: 'double-it', help: 'help-start', shield: 'shield', swap: 'swap', extra: 'extra-time' };
const REPO_SOUNDS = (typeof SOUND_FILES !== 'undefined' && SOUND_FILES) || {};

const sound = (() => {
  let ctx = null; let master = null;
  let cfg = cleanSound();
  const seen = new Set(); const seenOrder = [];
  const buffers = new Map(); // src → Promise<AudioBuffer|null>
  const log = []; // what was played (for tests and the settings screen)
  const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
  function ensure() {
    if (!AC) return null;
    if (!ctx) { try { ctx = new AC(); master = ctx.createGain(); master.connect(ctx.destination); } catch (e) { ctx = null; return null; } }
    master.gain.value = cfg.volume;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }
  const remember = (id) => { if (!id) return false; if (seen.has(id)) return true; seen.add(id); seenOrder.push(id); if (seenOrder.length > 400) seen.delete(seenOrder.shift()); return false; };
  async function bufferFor(src) {
    if (!buffers.has(src)) {
      buffers.set(src, (async () => {
        const c = ensure(); if (!c) return null;
        try {
          let ab;
          if (isLocalMedia(src)) { const rec = await mediaStore.get(src.slice(4)); if (!rec || !rec.blob) return null; ab = await rec.blob.arrayBuffer(); }
          else { const r = await fetch(src); if (!r.ok) return null; ab = await r.arrayBuffer(); }
          return await new Promise((res) => { try { const p = c.decodeAudioData(ab, res, () => res(null)); if (p && p.catch) p.catch(() => res(null)); } catch (e) { res(null); } });
        } catch (e) { return null; }
      })());
    }
    return buffers.get(src);
  }
  // Where a sound would come from right now.
  const sourceOf = (name) => (cfg.files[name] ? 'custom' : REPO_SOUNDS[name] ? 'file' : cfg.builtin ? 'builtin' : 'none');
  async function playFile(src) {
    const c = ensure(); if (!c) return false;
    const b = await bufferFor(src); if (!b) return false;
    const n = c.createBufferSource(); n.buffer = b; n.connect(master); n.start();
    return true;
  }
  async function playNow(name) {
    const via = sourceOf(name);
    const entry = { name, via, at: Date.now(), result: 'pending' };
    log.push(entry); if (log.length > 200) log.shift();
    let res = 'none';
    try {
      if (via === 'custom' && await playFile(cfg.files[name])) res = 'custom';
      else if ((via === 'custom' || via === 'file') && REPO_SOUNDS[name] && await playFile(REPO_SOUNDS[name])) res = 'file';
      else if (cfg.builtin) { const c = ensure(); if (c) { synth(c, master, name); res = 'builtin'; } }
    } catch (e) { res = 'error'; }
    entry.result = res; // a missing/broken file falls back to the built-in sound (or silence)
    return res;
  }
  return {
    // A game event. id: unique per event, so the same event never plays twice.
    play(name, id) {
      if (remember(id)) return false;
      if (cfg.muted || !SFX.some((x) => x.id === name)) return false;
      playNow(name);
      return true;
    },
    preview(name) { if (!cfg.muted) playNow(name); },
    unlock() { ensure(); },
    setConfig(c) { const next = cleanSound(c); Object.keys(cfg.files).forEach((k) => { if (cfg.files[k] !== next.files[k]) buffers.delete(cfg.files[k]); }); cfg = next; if (master) master.gain.value = cfg.volume; },
    get config() { return cfg; },
    get unlocked() { return !!ctx && ctx.state === 'running'; },
    get gain() { return master ? master.gain.value : null; },
    sourceOf, log,
    reset() { seen.clear(); seenOrder.length = 0; log.length = 0; },
  };
})();

/* ---------- built-in sounds (generated; short and simple) ---------- */
function synth(c, out, name) {
  const t0 = c.currentTime + 0.01;
  const tone = (f, at, dur, { type = 'sine', vol = 0.35, f2 = null, attack = 0.01 } = {}) => {
    const o = c.createOscillator(); const g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, at); if (f2) o.frequency.exponentialRampToValueAtTime(f2, at + dur);
    g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(vol, at + attack); g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(g); g.connect(out); o.start(at); o.stop(at + dur + 0.05);
  };
  const noise = (at, dur, { from = 400, to = 4000, vol = 0.25 } = {}) => {
    const len = Math.floor(c.sampleRate * dur); const b = c.createBuffer(1, len, c.sampleRate); const d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const s = c.createBufferSource(); s.buffer = b; const f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.2;
    f.frequency.setValueAtTime(from, at); f.frequency.exponentialRampToValueAtTime(to, at + dur);
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(vol, at + dur * 0.3); g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    s.connect(f); f.connect(g); g.connect(out); s.start(at); s.stop(at + dur + 0.05);
  };
  const seq = (notes, step, opts) => notes.forEach((f, i) => tone(f, t0 + i * step, opts && opts.dur ? opts.dur : step * 1.6, opts));
  switch (name) {
    case 'countdown-tick': tone(1600, t0, 0.05, { type: 'square', vol: 0.18, attack: 0.002 }); tone(800, t0, 0.07, { vol: 0.15, attack: 0.002 }); break;
    case 'correct': seq([784, 988, 1319], 0.09, { type: 'triangle', vol: 0.35, dur: 0.35 }); break;
    case 'wrong': tone(300, t0, 0.22, { type: 'sawtooth', vol: 0.18, f2: 220 }); tone(200, t0 + 0.2, 0.35, { type: 'sawtooth', vol: 0.18, f2: 140 }); break;
    case 'steal': noise(t0, 0.35, { from: 300, to: 6000, vol: 0.3 }); seq([880, 1175, 1568, 2093], 0.07, { type: 'triangle', vol: 0.3, dur: 0.3 }); break;
    case 'category-reveal': noise(t0, 0.25, { from: 600, to: 5000, vol: 0.18 }); tone(1047, t0 + 0.2, 0.4, { type: 'triangle', vol: 0.25 }); break;
    case 'game-intro': [[392, 0], [523, 0.16], [659, 0.32], [784, 0.48]].forEach(([f, d], i) => tone(f, t0 + d, i === 3 ? 0.9 : 0.18, { type: 'sawtooth', vol: 0.16 })); tone(523, t0 + 0.48, 0.9, { type: 'triangle', vol: 0.18 }); break;
    case 'winner-fanfare': [[523, 0], [659, 0.15], [784, 0.3], [1047, 0.45], [784, 0.75], [1047, 0.9]].forEach(([f, d], i) => tone(f, t0 + d, i === 5 ? 1.3 : 0.22, { type: 'sawtooth', vol: 0.15 })); tone(523, t0 + 0.9, 1.3, { type: 'triangle', vol: 0.18 }); tone(659, t0 + 0.9, 1.3, { type: 'triangle', vol: 0.15 }); break;
    case 'help-start': for (let i = 0; i < 2; i++) { tone(440, t0 + i * 0.5, 0.35, { vol: 0.2 }); tone(480, t0 + i * 0.5, 0.35, { vol: 0.2 }); } break;
    case 'help-end': tone(220, t0, 1.0, { type: 'triangle', vol: 0.3 }); tone(330, t0, 1.0, { vol: 0.2 }); break;
    case 'double-it': tone(400, t0, 0.35, { type: 'sawtooth', vol: 0.12, f2: 1200 }); seq([1319, 1319], 0.12, { type: 'triangle', vol: 0.3, dur: 0.18 }); break;
    case 'shield': [1568, 2093, 2637].forEach((f) => tone(f, t0, 0.7, { vol: 0.08 })); tone(523, t0, 0.5, { type: 'triangle', vol: 0.2 }); break;
    case 'swap': tone(900, t0, 0.15, { vol: 0.2, f2: 500 }); tone(500, t0 + 0.15, 0.2, { vol: 0.2, f2: 1000 }); break;
    case 'extra-time': seq([660, 880, 1100], 0.11, { type: 'square', vol: 0.12, dur: 0.12 }); break;
    default: break;
  }
}

/* ---------- which events happened (from one game state to the next) ----------
   Called once per change. Undo (history got shorter) and loading a saved game play nothing. */
function soundEvents(prev, next) {
  if (!next) return [];
  if (!prev || prev.id !== next.id) return next.log.length === 0 && next.phase !== 'done' ? ['game-intro'] : [];
  if ((next.history || []).length < (prev.history || []).length) return [];
  const out = [];
  if (next.cats.length > prev.cats.length) out.push('category-reveal');
  const pc = prev.current, nc = next.current;
  if (nc && pc && pc.cell === nc.cell) {
    if (pc.stage === 'answer' && nc.stage === 'steal') out.push('wrong');
    if ((pc.stage === 'answer' || pc.stage === 'steal') && nc.stage === 'reveal' && nc.result) {
      if (nc.result.kind === 'correct') out.push('correct');
      else if (nc.result.kind === 'stolen') out.push('steal');
      else if (nc.result.kind === 'missed') out.push('wrong');
    }
  }
  next.log.slice(prev.log.length).forEach((e) => {
    if (e.kind === 'lifeline' && LL_SOUND[e.ll]) out.push(LL_SOUND[e.ll]);
    if (e.kind === 'help-end') out.push('help-end');
  });
  if (next.phase === 'done' && prev.phase !== 'done') out.push('winner-fanfare');
  return out;
}

/* ---------- clock ticks in the last 5 seconds (on the device that plays sound) ----------
   Driven by the deadlines in the game state (the answer/steal clock, or Call for Help),
   one tick per second at most, and only while that clock is actually running. */
function tickKey(g, now) {
  const cur = g && g.current;
  if (!cur || g.phase !== 'question' || cur.stage === 'reveal') return null;
  let endsAt = null;
  if (helpRunning(cur)) endsAt = cur.fx.help.endsAt;
  else if (cur.pausedLeft == null) endsAt = cur.endsAt;
  if (!endsAt) return null;
  const left = endsAt - now;
  const sec = Math.ceil(left / ms(1000));
  if (left <= 0 || sec > 5 || sec < 1) return null;
  return cur.cell + ':' + cur.stage + ':' + endsAt + ':' + sec;
}
function useTicks(g, enabled, play) {
  const last = useRef(null); const latest = useRef(g); latest.current = g;
  useEffect(() => {
    if (!enabled) return undefined;
    const id = setInterval(() => {
      const k = tickKey(latest.current, Date.now());
      if (k && k !== last.current) { last.current = k; play('countdown-tick', 'tick:' + k); }
    }, ms(100));
    return () => clearInterval(id);
  }, [enabled]);
}
