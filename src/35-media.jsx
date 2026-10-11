/* ============================================================
   MEDIA QUESTIONS: pictures, sounds and video clips.
   · Built-in pictures and sounds ship with the app (media/), so they work offline.
   · Your own pictures and sounds (question packs) are saved in this browser's
     IndexedDB ('khatfa-media'), referenced as 'idb:<id>'.
   · Clips are official YouTube uploads embedded with YouTube's own player
     (youtube-nocookie.com). Nothing is downloaded or stored, and we never cover or
     change the player. Clips need internet.
   Playback is driven by the game state (current.play), so the host's buttons
   control whichever screen is the "output": a TV window if one is open, the TV
   view on this screen, or this device.
   ============================================================ */

/* ---------- local media files (IndexedDB blobs) ---------- */
const mediaStore = (() => {
  let dbp = null; const mem = new Map();
  const open = () => {
    if (dbp) return dbp;
    dbp = new Promise((resolve) => {
      try {
        if (!('indexedDB' in window)) return resolve(null);
        const req = indexedDB.open('khatfa-media', 1);
        req.onupgradeneeded = () => { if (!req.result.objectStoreNames.contains('files')) req.result.createObjectStore('files'); };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
        req.onblocked = () => resolve(null);
        setTimeout(() => resolve(null), 5000);
      } catch (e) { resolve(null); }
    });
    return dbp;
  };
  const tx = (mode, fn) => open().then((db) => new Promise((resolve, reject) => {
    if (!db) return resolve(undefined);
    const t = db.transaction('files', mode); const st = t.objectStore('files'); const r = fn(st);
    t.oncomplete = () => resolve(r && r.result); t.onerror = () => reject(t.error); t.onabort = () => reject(t.error || new Error('aborted'));
  }));
  return {
    // rec: { blob, type, name, size, at }
    async put(rec) {
      const id = 'm' + uid();
      try { const db = await open(); if (db) { await tx('readwrite', (st) => st.put(rec, id)); return id; } } catch (e) { if (e && /quota/i.test(e.name + e.message)) throw new Error('quota'); throw e; }
      mem.set(id, rec); return id; // no IndexedDB: kept until the page closes
    },
    async get(id) { if (mem.has(id)) return mem.get(id); try { return await tx('readonly', (st) => st.get(id)); } catch (e) { return undefined; } },
    async del(id) { mem.delete(id); try { await tx('readwrite', (st) => st.delete(id)); } catch (e) {} },
    async keys() { try { return (await tx('readonly', (st) => st.getAllKeys())) || [...mem.keys()]; } catch (e) { return [...mem.keys()]; } },
    get persistent() { return open().then((db) => !!db); },
  };
})();
const isLocalMedia = (src) => typeof src === 'string' && src.startsWith('idb:');
// Turns a media src into a URL the browser can play. Local files become object URLs.
function useMediaUrl(src) {
  const [state, setState] = useState({ url: isLocalMedia(src) ? null : src || null, missing: false });
  useEffect(() => {
    if (!isLocalMedia(src)) { setState({ url: src || null, missing: !src }); return undefined; }
    let url = null; let live = true;
    mediaStore.get(src.slice(4)).then((rec) => {
      if (!live) return;
      if (rec && rec.blob) { url = URL.createObjectURL(rec.blob); setState({ url, missing: false }); } else setState({ url: null, missing: true });
    });
    return () => { live = false; if (url) URL.revokeObjectURL(url); };
  }, [src]);
  return state;
}
const mText = (v) => (!v ? null : Array.isArray(v) ? { en: v[0] || '', ar: v[1] || v[0] || '' } : typeof v === 'string' ? { en: v, ar: v } : v);
const MEDIA_ICON = { image: '🖼️', audio: '🔊', video: '🎬' };

/* ---------- YouTube (official embed + IFrame API) ---------- */
// Accepts a full URL (watch, youtu.be, shorts, embed) or an 11-character id.
function parseYouTube(input) {
  const s = String(input || '').trim();
  if (/^[\w-]{11}$/.test(s)) return { id: s };
  let u; try { u = new URL(s); } catch (e) { return null; }
  const host = u.hostname.replace(/^www\.|^m\./, '');
  let id = null; let t = null;
  if (host === 'youtu.be') id = u.pathname.slice(1, 12);
  else if (/(^|\.)youtube(-nocookie)?\.com$/.test(host)) {
    if (u.pathname === '/watch') id = u.searchParams.get('v');
    else { const m = u.pathname.match(/^\/(embed|shorts|live|v)\/([\w-]{11})/); if (m) id = m[2]; }
  }
  const tt = u.searchParams.get('t') || u.searchParams.get('start');
  if (tt) { const m = String(tt).match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/); if (m) t = (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0); }
  return id && /^[\w-]{11}$/.test(id) ? { id, t } : null;
}
// "1:23", "83", "1:02:03" → seconds. Returns null if it isn't a time.
function parseTime(v) {
  if (v == null || v === '') return null;
  if (typeof v === 'number') return v >= 0 ? v : null;
  const s = String(v).trim();
  if (!/^\d+(:\d{1,2}){0,2}(\.\d+)?$/.test(s)) return null;
  return s.split(':').reduce((a, p) => a * 60 + parseFloat(p), 0);
}
const fmtTime = (sec) => { if (sec == null) return ''; const s = Math.round(sec); const m = Math.floor(s / 60); return m + ':' + String(s % 60).padStart(2, '0'); };
// Does the video's title give the answer away? (simple word check; the host decides)
function titleSpoils(title, answer) {
  if (!title || !answer) return false;
  const norm = (x) => normSearch(x).replace(/[^\p{L}\p{N}\s]/gu, ' ');
  const T = ' ' + norm(title) + ' ';
  const words = [answer.en, answer.ar].filter(Boolean).flatMap((a) => norm(a).split(/\s+/)).filter((w) => w.length >= 4 && !['the', 'and', 'with'].includes(w));
  return words.some((w) => T.includes(' ' + w + ' ') || T.includes(w));
}
let ytApi = null;
function loadYouTubeApi() {
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (ytApi) return ytApi;
  ytApi = new Promise((resolve, reject) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { if (prev) try { prev(); } catch (e) {} resolve(window.YT); };
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api'; s.async = true;
    s.onerror = () => { ytApi = null; reject(new Error('offline')); };
    document.head.appendChild(s);
    setTimeout(() => { if (!(window.YT && window.YT.Player)) { ytApi = null; reject(new Error('timeout')); } }, 15000);
  });
  return ytApi;
}
const YT_ERRORS = { 2: 'ytBadId', 5: 'ytPlayer', 100: 'ytGone', 101: 'ytNoEmbed', 150: 'ytNoEmbed', 153: 'ytNoEmbed' };

/* ---------- the players (used on the "output" screen) ---------- */
// status: { s: 'loading'|'ready'|'playing'|'paused'|'ended'|'error'|'blocked', msg?, title?, at? }
function AudioPlayer({ media, play, output, onStatus }) {
  const ref = useRef(null);
  const { url, missing } = useMediaUrl(media.src);
  const st = (s) => onStatus && onStatus(s);
  useEffect(() => { if (missing) st({ s: 'error', msg: 'mediaMissing' }); }, [missing]);
  useEffect(() => { const a = ref.current; if (a) a.volume = play ? play.vol : 0.9; }, [play && play.vol, url]);
  const lastSeq = useRef(play ? play.seq : 0);
  useEffect(() => {
    const a = ref.current; if (!a || !output || !play) return;
    if (play.seq !== lastSeq.current) { lastSeq.current = play.seq; try { a.currentTime = 0; } catch (e) {} }
    if (play.state === 'playing') {
      const p = a.play();
      if (p && p.catch) p.catch((e) => st(e && e.name === 'NotAllowedError' ? { s: 'blocked' } : { s: 'error', msg: 'mediaFailed' }));
    } else if (play.state === 'paused' || play.state === 'idle') { a.pause(); if (play.state === 'idle') try { a.currentTime = 0; } catch (e) {} }
  }, [play && play.state, play && play.seq, output, url]);
  if (!output) return null;
  return url ? <audio ref={ref} src={url} preload="auto" onPlaying={() => st({ s: 'playing' })} onPause={() => st({ s: 'paused' })} onEnded={() => st({ s: 'ended' })}
    onCanPlay={() => st({ s: 'ready' })} onError={() => st({ s: 'error', msg: 'mediaFailed' })} /> : null;
}
function SoundBadge({ play, status, big }) {
  const playing = status && status.s === 'playing';
  return (
    <div className={'soundbadge' + (playing ? ' on' : '') + (big ? ' big' : '')} aria-hidden="true">
      <span className="sb-ic">🔊</span>
      <span className="eq">{[0, 1, 2, 3, 4].map((i) => <i key={i} style={{ animationDelay: i * 0.12 + 's' }} />)}</span>
    </div>
  );
}
function VideoPlayer({ media, play, output, onStatus, big }) {
  const box = useRef(null); const player = useRef(null); const ready = useRef(false); const timer = useRef(null);
  const [rdy, setRdy] = useState(0);
  const title = useRef('');
  // Every status carries the video title, so the host's spoiler warning stays up.
  const st = (s) => onStatus && onStatus({ ...s, title: s.title || title.current });
  const start = media.start || 0; const end = media.end || null;
  useEffect(() => {
    if (!output) return undefined;
    let dead = false;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) { st({ s: 'error', msg: 'ytOffline' }); return undefined; }
    st({ s: 'loading' });
    loadYouTubeApi().then((YT) => {
      if (dead || !box.current) return;
      const el = document.createElement('div'); box.current.innerHTML = ''; box.current.appendChild(el);
      player.current = new YT.Player(el, {
        host: 'https://www.youtube-nocookie.com', videoId: media.yt, width: '100%', height: '100%',
        playerVars: { start: Math.floor(start), ...(end ? { end: Math.ceil(end) } : {}), controls: 1, rel: 0, playsinline: 1, modestbranding: 1, origin: location.origin },
        events: {
          onReady: () => {
            ready.current = true; setRdy((x) => x + 1);
            try { title.current = (player.current.getVideoData() || {}).title || ''; } catch (e) {}
            st({ s: 'ready' });
            try { player.current.setVolume(Math.round((play ? play.vol : 0.9) * 100)); } catch (e) {}
          },
          onStateChange: (e) => {
            if (e.data === 1) st({ s: 'playing' }); else if (e.data === 2) st({ s: 'paused' }); else if (e.data === 0) st({ s: 'ended' });
          },
          onError: (e) => st({ s: 'error', msg: YT_ERRORS[e.data] || 'ytPlayer', code: e.data }),
        },
      });
    }).catch(() => st({ s: 'error', msg: 'ytOffline' }));
    return () => { dead = true; clearInterval(timer.current); try { player.current && player.current.destroy(); } catch (e) {} player.current = null; ready.current = false; };
  }, [media.yt, start, end, output]);
  // Commands from the host.
  const lastSeq = useRef(play ? play.seq : 0);
  useEffect(() => {
    const p = player.current; if (!output || !play || !p || !ready.current) return;
    try {
      if (play.seq !== lastSeq.current) { lastSeq.current = play.seq; p.seekTo(start, true); }
      if (play.state === 'playing') {
        if (p.getCurrentTime && end && p.getCurrentTime() >= end - 0.25) p.seekTo(start, true);
        p.playVideo();
      } else if (play.state === 'paused') p.pauseVideo();
      else if (play.state === 'idle' && p.getPlayerState && p.getPlayerState() === 1) { p.pauseVideo(); p.seekTo(start, true); }
    } catch (e) {}
  }, [play && play.state, play && play.seq, output, rdy]);
  useEffect(() => { try { if (player.current && ready.current) player.current.setVolume(Math.round(play.vol * 100)); } catch (e) {} }, [play && play.vol]);
  // Stop at the end time ourselves too (YouTube's own `end` isn't always honoured after seeking).
  useEffect(() => {
    clearInterval(timer.current);
    if (!output || !end) return undefined;
    timer.current = setInterval(() => {
      const p = player.current; if (!p || !ready.current || !p.getCurrentTime) return;
      try { if (p.getPlayerState && p.getPlayerState() === 1 && p.getCurrentTime() >= end) { p.pauseVideo(); st({ s: 'ended' }); } } catch (e) {}
    }, 250);
    return () => clearInterval(timer.current);
  }, [output, end, media.yt]);
  if (!output) return <div className={'qvideo off' + (big ? ' big' : '')}><span>🎬</span></div>;
  return <div className={'qvideo' + (big ? ' big' : '')}><div ref={box} className="yt" /></div>;
}
function ImageView({ media, reveal, full, big, onStatus }) {
  const { url, missing } = useMediaUrl(media.src);
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [url]);
  const alt = mText(media.alt);
  const altText = alt ? pick(alt) : t('pictureAlt');
  if (media.emoji) return <div className={'qemoji' + (big ? ' big' : '')} role="img" aria-label={altText}>{media.emoji}</div>;
  if (missing || failed) return <div className={'qimg broken' + (big ? ' big' : '')} role="img" aria-label={altText}><span>🖼️</span><b>{t('mediaFailedShort')}</b>{alt && <small dir="auto">{altText}</small>}</div>;
  const steps = [3.2, 2.2, 1.5, 1];
  const level = full || !media.reveal ? 3 : clamp(reveal || 0, 0, 3);
  const f = media.focus || [0.5, 0.5];
  const style = media.reveal === 'zoom' ? { transform: 'scale(' + steps[level] + ')', transformOrigin: (f[0] * 100) + '% ' + (f[1] * 100) + '%' }
    : media.reveal === 'blur' ? { filter: 'blur(' + [18, 10, 4, 0][level] + 'px)' } : undefined;
  return (
    <div className={'qimg' + (big ? ' big' : '') + (media.reveal ? ' rv' : '') + (media.frame === 'light' ? ' light' : '')}>
      {url && <img src={url} alt={altText} style={style} draggable={false} onError={() => { setFailed(true); onStatus && onStatus({ s: 'error', msg: 'mediaFailed' }); }} />}
    </div>
  );
}
// What every screen shows for a question's media. `output`: this screen plays sound/video.
function MediaView({ q, cur, big, output, onStatus, status, full }) {
  const m = q && q.media; if (!m) return null;
  const play = (cur && cur.play) || freshPlay();
  if (m.type === 'image') return <ImageView media={m} reveal={cur ? cur.reveal : 3} full={full} big={big} onStatus={onStatus} />;
  if (m.type === 'audio') return <><SoundBadge play={play} status={status} big={big} /><AudioPlayer media={m} play={play} output={output} onStatus={onStatus} /></>;
  if (m.type === 'video') return <VideoPlayer media={m} play={play} output={output} onStatus={onStatus} big={big} />;
  return null;
}

/* ---------- the host's controls ---------- */
const STATUS_TXT = { loading: 'mLoading', ready: 'mReady', playing: 'mPlaying', paused: 'mPaused', ended: 'mEnded', blocked: 'mBlocked', error: 'mError' };
function MediaControls({ g, act, status, where, onWrong, answer, swap }) {
  const cur = g.current; const cell = curCell(g); const m = cell && cell.q && cell.q.media;
  if (!m || (m.type !== 'audio' && m.type !== 'video' && !(m.type === 'image' && m.reveal))) return null;
  if (m.type === 'image') {
    const r = cur.reveal || 0; const done = r >= REVEAL_STEPS || cur.stage === 'reveal';
    return (
      <div className="mctl">
        <button className="btn btn-sm" disabled={done} onClick={() => act(revealMore)}>🔍 {t('revealMore')} <span className="num muted">({Math.min(r, REVEAL_STEPS)}/{REVEAL_STEPS})</span></button>
        <p className="hint" style={{ margin: 0 }}>{t('revealMoreSub')}</p>
      </div>
    );
  }
  const play = cur.play || freshPlay();
  const s = status || {};
  const playing = play.state === 'playing' && s.s !== 'ended' && s.s !== 'error';
  return (
    <div className="mctl">
      <div className="row mbtns">
        {playing
          ? <button className="btn btn-sm grow" onClick={() => act((x) => mediaCmd(x, 'pause'))}>⏸ {t('mPause')}</button>
          : <button className="btn btn-sm btn-gold grow" onClick={() => act((x) => mediaCmd(x, s.s === 'ended' ? 'replay' : 'play'))}>▶ {play.state === 'idle' ? t('mPlay') : s.s === 'ended' ? t('mReplay') : t('mResume')}</button>}
        <button className="btn btn-sm" onClick={() => act((x) => mediaCmd(x, 'replay'))} aria-label={t('mReplay')}>↺ {t('mReplay')}</button>
      </div>
      <label className="vol"><span aria-hidden="true">🔈</span><input type="range" min="0" max="1" step="0.05" value={play.vol} aria-label={t('mVolume')} onChange={(e) => act((x) => mediaCmd(x, 'vol', +e.target.value))} /><span aria-hidden="true">🔊</span></label>
      <p className={'mstatus' + (s.s === 'error' || s.s === 'blocked' ? ' bad' : '')} role="status">
        {where && <span className="muted">{where} · </span>}
        {play.state === 'idle' && (!s.s || s.s === 'ready' || s.s === 'loading') ? (s.s === 'loading' ? t('mLoading') + ' ' : '') + t('mIdle') : s.s ? t(STATUS_TXT[s.s] || 'mReady') : ''}
        {s.msg ? ' ' + t(s.msg) : ''}
      </p>
      {m.type === 'video' && <p className="hint" style={{ margin: 0 }}>🌐 {t('clipOnline')} {m.end ? t('clipRange', { a: fmtTime(m.start || 0), b: fmtTime(m.end) }) : ''} {t('clipEndNote')}</p>}
      {m.type === 'video' && s.title && titleSpoils(s.title, answer) && <p className="warn">⚠ {t('titleSpoils', { title: s.title })}</p>}
      {swap && <button className="btn btn-sm btn-ghost" onClick={swap.fn}>{swap.label}</button>}
      {(s.s === 'error') && onWrong && <button className="btn btn-sm btn-flag" onClick={onWrong}>⚠ {t('mediaBrokenReplace')}</button>}
    </div>
  );
}
