/* Khatfa service worker (same approach as Draft Night).
   App files: network first, so new versions always win when online; cached copy when offline.
   Libraries, icons, fonts: cache first. */
const VERSION = 'b073f1541a';
const CACHE = 'khatfa-' + VERSION;
const FONTS = ['anton-latin-400', 'barlow-latin-400', 'barlow-latin-500', 'barlow-latin-600', 'barlow-latin-700',
  'barlow-semi-condensed-latin-500', 'barlow-semi-condensed-latin-600', 'barlow-semi-condensed-latin-700', 'barlow-semi-condensed-latin-800',
  'cairo-arabic-400', 'cairo-arabic-600', 'cairo-arabic-700', 'cairo-arabic-800', 'cairo-arabic-900'].map((f) => './fonts/' + f + '-normal.woff2');
const CORE = ['./', './index.html', './app.js?v=' + VERSION, './bank.js?v=' + VERSION, './styles.css?v=' + VERSION, './manifest.webmanifest',
  './vendor/react.production.min.js', './vendor/react-dom.production.min.js',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png', ...FONTS];
// Built-in pictures and sounds (file names are content hashes, so a cached copy never goes stale).
const MEDIA = ["./media/i/0005213e8a31.svg","./media/i/03ce67294111.svg","./media/i/067d7c4d86e0.svg","./media/i/08a75f34cf24.svg","./media/i/096016dcd9ae.svg","./media/i/1066d88ae68a.svg","./media/i/13bdb8604a36.svg","./media/i/1858f8da9717.svg","./media/i/1a87dbc7ae3e.svg","./media/i/21f51b1bef06.svg","./media/i/2351c1b04235.svg","./media/i/247a011dcba6.svg","./media/i/25e7eb04c40c.svg","./media/i/2722bd2cd9db.svg","./media/i/27ad56c67755.svg","./media/i/28d0bf97e9fc.svg","./media/i/2bb144c8ffab.svg","./media/i/310e4bc0ef47.svg","./media/i/33f61ea551a8.svg","./media/i/3aa15f93c741.svg","./media/i/3b1326de5a40.svg","./media/i/40763ff32b30.svg","./media/i/41449d35ff61.svg","./media/i/4fd8a3345c5e.svg","./media/i/519f09953a30.svg","./media/i/59212f5e7539.svg","./media/i/5d7c8b15a1de.svg","./media/i/612fa9417e36.svg","./media/i/6c7881a74d0c.svg","./media/i/75b18c098737.svg","./media/i/79c15381898d.svg","./media/i/81c070113407.svg","./media/i/8890bfeb2822.svg","./media/i/8b9102f43929.svg","./media/i/8be5e89d699a.svg","./media/i/93a481a86c64.svg","./media/i/9632b496a0ac.svg","./media/i/9c002e7189a3.svg","./media/i/a4a6df1eb3c5.svg","./media/i/a575c4d0cbcf.svg","./media/i/a924da2ea821.svg","./media/i/ba9af8de9057.svg","./media/i/be012ab5e7b9.svg","./media/i/c15abf93f35d.svg","./media/i/ca2de427aa73.svg","./media/i/cd1d7f0a3cc1.svg","./media/i/ce096efd452c.svg","./media/i/d2f00c96f76e.svg","./media/i/d313a9bd65da.svg","./media/i/d78f3b6d37af.svg","./media/i/e11f07adbe04.svg","./media/i/e1a48ef9374f.svg","./media/i/e59c17ae357b.svg","./media/i/e62cbf4ceac3.svg","./media/i/f8d712f984f0.svg","./media/i/fe13ea2d451c.svg","./media/a/075c378e122f.mp3","./media/a/0d82de22913f.mp3","./media/a/13a9d78f7887.mp3","./media/a/1b4f9d854aa5.mp3","./media/a/2f6bd9c1e46a.mp3","./media/a/3c2eab98fb3a.mp3","./media/a/454d41213dd5.mp3","./media/a/5f7bcf290230.mp3","./media/a/7b648a2713f5.mp3","./media/a/7d00723c0015.mp3","./media/a/7d8fe7dc209a.mp3","./media/a/a509ab732bd1.mp3","./media/a/b0773dc07af3.mp3","./media/a/ba67a6c05adf.mp3","./media/a/c2d235703f3b.mp3","./media/a/cca047031ff9.mp3","./media/a/ceac912f4d5f.mp3","./media/a/d1d4df6bc126.mp3","./media/a/d339215c1eaa.mp3","./media/a/db99731fc53d.mp3","./media/a/f9b0bfae3c2a.mp3"];

self.addEventListener('install', (e) => {
  // Core first; media is added separately so one missing file can't stop the app installing.
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE).then(() => Promise.all(MEDIA.map((u) => c.add(u).catch(() => {}))))).catch(() => {}));
});
self.addEventListener('message', (e) => { if (e.data === 'skipWaiting') self.skipWaiting(); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('khatfa-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
  // (old caches go; media is re-added from the new install, mostly from the HTTP cache)
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  const isShell = (req.mode === 'navigate' || /\/(index\.html)?$/.test(url.pathname) || /\.(js|css|webmanifest)$/.test(url.pathname)) && !url.pathname.includes('/vendor/');
  if (isShell) {
    e.respondWith(fetch(req).then((res) => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); } return res; })
      .catch(() => caches.match(req, { ignoreSearch: req.mode === 'navigate' }).then((r) => r || caches.match('./index.html'))));
    return;
  }
  // Audio: Safari asks for byte ranges; answer them from the cached file (offline too).
  const range = req.headers.get('range');
  if (range && url.pathname.includes('/media/')) {
    e.respondWith(caches.match(req.url, { ignoreSearch: true }).then((hit) => {
      if (!hit) return fetch(req);
      return hit.arrayBuffer().then((buf) => {
        const m = /bytes=(\d*)-(\d*)/.exec(range) || [];
        const size = buf.byteLength; const start = m[1] ? +m[1] : 0; const end = m[2] ? Math.min(+m[2], size - 1) : size - 1;
        return new Response(buf.slice(start, end + 1), { status: 206, statusText: 'Partial Content', headers: {
          'Content-Type': hit.headers.get('Content-Type') || 'audio/mpeg', 'Content-Range': 'bytes ' + start + '-' + end + '/' + size, 'Content-Length': String(end - start + 1), 'Accept-Ranges': 'bytes' } });
      });
    }));
    return;
  }
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
    return res;
  })));
});
