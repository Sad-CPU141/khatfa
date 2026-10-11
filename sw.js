/* Khatfa service worker (same approach as Draft Night).
   App files: network first, so new versions always win when online; cached copy when offline.
   Libraries, icons, fonts: cache first. */
const VERSION = 'ab18c4c789';
const CACHE = 'khatfa-' + VERSION;
const FONTS = ['anton-latin-400', 'barlow-latin-400', 'barlow-latin-500', 'barlow-latin-600', 'barlow-latin-700',
  'barlow-semi-condensed-latin-500', 'barlow-semi-condensed-latin-600', 'barlow-semi-condensed-latin-700', 'barlow-semi-condensed-latin-800',
  'cairo-arabic-400', 'cairo-arabic-600', 'cairo-arabic-700', 'cairo-arabic-800', 'cairo-arabic-900'].map((f) => './fonts/' + f + '-normal.woff2');
const CORE = ['./', './index.html', './app.js?v=' + VERSION, './bank.js?v=' + VERSION, './styles.css?v=' + VERSION, './manifest.webmanifest',
  './vendor/react.production.min.js', './vendor/react-dom.production.min.js',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png', ...FONTS];
// Built-in pictures and sounds (file names are content hashes, so a cached copy never goes stale).
const MEDIA = ["./media/i/0005213e8a31.svg","./media/i/03c805cb4786.svg","./media/i/03ce67294111.svg","./media/i/049c4c06322f.svg","./media/i/067d7c4d86e0.svg","./media/i/08140c36eb7d.svg","./media/i/08a75f34cf24.svg","./media/i/096016dcd9ae.svg","./media/i/0fdd590bfdb6.svg","./media/i/1066d88ae68a.svg","./media/i/13bdb8604a36.svg","./media/i/16a00c1549be.svg","./media/i/1858f8da9717.svg","./media/i/19f306e33d0a.svg","./media/i/1a87dbc7ae3e.svg","./media/i/1b3a3be88d24.svg","./media/i/21f51b1bef06.svg","./media/i/2351c1b04235.svg","./media/i/2376345561c4.svg","./media/i/247a011dcba6.svg","./media/i/255e6880ae0a.svg","./media/i/25e7eb04c40c.svg","./media/i/2722bd2cd9db.svg","./media/i/27ad56c67755.svg","./media/i/28d0bf97e9fc.svg","./media/i/2a7b2c680917.svg","./media/i/2a7cf4183370.svg","./media/i/2b07780b62e7.svg","./media/i/2bb144c8ffab.svg","./media/i/310e4bc0ef47.svg","./media/i/33f61ea551a8.svg","./media/i/3aa15f93c741.svg","./media/i/3b1326de5a40.svg","./media/i/40763ff32b30.svg","./media/i/41449d35ff61.svg","./media/i/47426e986599.svg","./media/i/48be5e17707e.svg","./media/i/4fbfd9d7e33b.svg","./media/i/4fd8a3345c5e.svg","./media/i/519f09953a30.svg","./media/i/573fce8e2284.svg","./media/i/59212f5e7539.svg","./media/i/5d7c8b15a1de.svg","./media/i/612fa9417e36.svg","./media/i/698a81062155.svg","./media/i/69d286bf4f65.svg","./media/i/6c7881a74d0c.svg","./media/i/7417e8ff3f85.svg","./media/i/7539247d7cbd.svg","./media/i/75b18c098737.svg","./media/i/762ff8ea6e5f.svg","./media/i/791f74cabea7.svg","./media/i/79c15381898d.svg","./media/i/7a4b9580787f.svg","./media/i/7b73909f9d18.svg","./media/i/7c4a147a1cf9.svg","./media/i/7d29165d96ec.svg","./media/i/81c070113407.svg","./media/i/83ccd44f2a3f.svg","./media/i/86681f0e7a97.svg","./media/i/8890bfeb2822.svg","./media/i/8b9102f43929.svg","./media/i/8be5e89d699a.svg","./media/i/8cd457e0c037.svg","./media/i/907518c997ad.svg","./media/i/93a481a86c64.svg","./media/i/9632b496a0ac.svg","./media/i/97eb7fb3ac54.svg","./media/i/9c002e7189a3.svg","./media/i/a4a6df1eb3c5.svg","./media/i/a575c4d0cbcf.svg","./media/i/a6b572eaf2f2.svg","./media/i/a924da2ea821.svg","./media/i/aa7270a773a2.svg","./media/i/ad428f13bbc2.svg","./media/i/b6654a60cbfb.svg","./media/i/ba9af8de9057.svg","./media/i/be012ab5e7b9.svg","./media/i/c15abf93f35d.svg","./media/i/c2132ea6b9a0.svg","./media/i/c55ff5c345e3.svg","./media/i/ca2de427aa73.svg","./media/i/cd1d7f0a3cc1.svg","./media/i/ce096efd452c.svg","./media/i/cf4e4f0b34e8.svg","./media/i/d18360d443f4.svg","./media/i/d2f00c96f76e.svg","./media/i/d313a9bd65da.svg","./media/i/d78f3b6d37af.svg","./media/i/e11f07adbe04.svg","./media/i/e1a48ef9374f.svg","./media/i/e59c17ae357b.svg","./media/i/e62cbf4ceac3.svg","./media/i/e98c21334a08.svg","./media/i/eadd987b343f.svg","./media/i/eb5d377a039f.svg","./media/i/f8d712f984f0.svg","./media/i/f9233e09ee6e.svg","./media/i/fa37a02629d1.svg","./media/i/fb61fa74c82c.svg","./media/i/fe13ea2d451c.svg","./media/i/fe870f9e4d53.svg","./media/i/ff5234f3c962.svg","./media/a/0161846b310e.mp3","./media/a/06184e1e5717.mp3","./media/a/075c378e122f.mp3","./media/a/0d82de22913f.mp3","./media/a/0f9bc0568502.mp3","./media/a/13a9d78f7887.mp3","./media/a/1b4f9d854aa5.mp3","./media/a/2b1e2ae89f63.mp3","./media/a/2f6bd9c1e46a.mp3","./media/a/31d05a68a029.mp3","./media/a/3710cba6ee88.mp3","./media/a/3b42ef6d0915.mp3","./media/a/3c2eab98fb3a.mp3","./media/a/4477ce11fbd2.mp3","./media/a/44fe29cd3151.mp3","./media/a/454d41213dd5.mp3","./media/a/550d3582aa78.mp3","./media/a/573e0fee0518.mp3","./media/a/5f7bcf290230.mp3","./media/a/75a4ebde6351.mp3","./media/a/7a319aa5f37d.mp3","./media/a/7b648a2713f5.mp3","./media/a/7d00723c0015.mp3","./media/a/7d8fe7dc209a.mp3","./media/a/8ad4f5903073.mp3","./media/a/9013de8c38d2.mp3","./media/a/a096c5c580de.mp3","./media/a/a509ab732bd1.mp3","./media/a/b0773dc07af3.mp3","./media/a/ba67a6c05adf.mp3","./media/a/c2d235703f3b.mp3","./media/a/cca047031ff9.mp3","./media/a/ceac912f4d5f.mp3","./media/a/d1d4df6bc126.mp3","./media/a/d339215c1eaa.mp3","./media/a/d8f67ed7d60d.mp3","./media/a/db99731fc53d.mp3","./media/a/dc7b5b5c6a70.mp3","./media/a/e0656698e17e.mp3","./media/a/e49386e9cd89.mp3","./media/a/f2dc0e0c3b66.mp3","./media/a/f643d7c04ad6.mp3","./media/a/f9b0bfae3c2a.mp3","./media/a/ff2d195fc422.mp3"];

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
