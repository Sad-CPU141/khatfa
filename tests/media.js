// Media questions in real Chromium (Playwright): pictures, sounds, clips, the TV window, "This is wrong".
// YouTube can't be reached from the test machine, so clips run against a stand-in for YouTube's
// IFrame API (same method names and events). Real YouTube playback still needs checking on a device.
// Run: node tests/media.js
const path = require('path');
const fs = require('fs');
const http = require('http');
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');

const root = path.join(__dirname, '..');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.png': 'image/png', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.webmanifest': 'application/manifest+json' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(root, p);
  if (!f.startsWith(root) || !fs.existsSync(f)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
});
let fails = 0;
const ok = (c, m) => { if (c) console.log('  ✓ ' + m); else { fails++; console.log('  ✗ ' + m); } };
const sleep = (n) => new Promise((r) => setTimeout(r, n));

// A stand-in for https://www.youtube.com/iframe_api
const FAKE_YT = `
window.__yt = { calls: [], t: 0, state: -1 };
window.YT = { Player: function (el, o) {
  var self = this, Y = window.__yt; Y.opts = o; Y.t = (o.playerVars && o.playerVars.start) || 0;
  var box = document.createElement('div'); box.className = 'fake-yt'; box.textContent = 'YouTube player: ' + o.videoId; el.replaceWith(box);
  var timer = null;
  function setState(s) { Y.state = s; o.events.onStateChange && o.events.onStateChange({ data: s }); }
  this.playVideo = function () { Y.calls.push('play'); clearInterval(timer); timer = setInterval(function () { Y.t += 0.25; }, 250); setState(1); };
  this.pauseVideo = function () { Y.calls.push('pause'); clearInterval(timer); setState(2); };
  this.seekTo = function (s) { Y.calls.push('seek:' + s); Y.t = s; };
  this.getCurrentTime = function () { return Y.t; };
  this.getPlayerState = function () { return Y.state; };
  this.setVolume = function (v) { Y.calls.push('vol:' + v); };
  this.getVideoData = function () { return { title: o.videoId === 'SPOILERxxxx' ? 'Finding Nemo official clip' : 'Official clip' }; };
  this.destroy = function () { clearInterval(timer); };
  setTimeout(function () {
    if (o.videoId === 'BLOCKEDxxxx') o.events.onError && o.events.onError({ data: 150 });
    else o.events.onReady && o.events.onReady({ target: self });
  }, 50);
} };
if (window.onYouTubeIframeAPIReady) window.onYouTubeIframeAPIReady();
`;

(async () => {
  await new Promise((r) => server.listen(0, r));
  const base = 'http://127.0.0.1:' + server.address().port + '/';
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });

  // 1. Build games inside the real app (test hooks on), then start fresh contexts from saved state.
  const make = async (fn) => {
    const ctx = await browser.newContext(); const page = await ctx.newPage();
    await page.addInitScript(() => { window.__KH_TEST__ = true; });
    await page.goto(base); await page.waitForSelector('.hero');
    const json = await page.evaluate(fn);
    await ctx.close(); return json;
  };
  const gameWith = (pick) => make(new Function('return (' + function (pickSrc) {
    const K = window.__KH; const B = K.BANK;
    let g = K.createGame(B, [{ name: 'Falcons' }, { name: 'Leopards' }], { steals: true }, Date.now(), { gameNo: 1 });
    ['flags', 'music-world', 'maps', 'animated', 'body', 'inventions'].forEach((id) => { g = K.pickCategory(g, id, { bank: B, recent: {}, rand: Math.random }); });
    const chooser = new Function('q', 'return (' + pickSrc + ')(q)');
    // Always test a matching question: use one on the board, or put one from the bank on a tile of the same value.
    let cell = g.cells.find((c) => c.q && chooser(c.q));
    if (!cell) {
      const all = Object.values(B.byCat).flat().filter((q) => chooser(q));
      const q = all[Math.floor(Math.random() * all.length)];
      cell = g.cells.find((c) => c.q && c.tier === q.tier);
      cell.q = q;
    }
    return JSON.stringify({ g, cell: cell.id });
  }.toString() + ')(' + JSON.stringify(pick.toString()) + ')'));
  const openGame = async (state, { patch, lang = 'en', tvWindow = false } = {}) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const { g, cell } = JSON.parse(state);
    if (patch) patch(g.cells.find((c) => c.id === cell));
    await ctx.addInitScript(({ g, lang }) => {
      if (!sessionStorage.getItem('seeded') && !location.hash) { sessionStorage.setItem('seeded', '1'); localStorage.setItem('kh_current_v1', JSON.stringify(g)); localStorage.setItem('kh_settings_v1', JSON.stringify({ lang, motion: 'reduce' })); }
    }, { g, lang });
    await ctx.route('https://www.youtube.com/iframe_api', (r) => r.fulfill({ contentType: 'text/javascript', body: FAKE_YT }));
    const page = await ctx.newPage();
    const errors = []; page.on('pageerror', (e) => errors.push(e.message));
    let tv = null;
    if (tvWindow) { tv = await ctx.newPage(); await tv.goto(base + '#tv'); }
    await page.goto(base);
    await page.click('text=Continue game');
    return { ctx, page, tv, errors, cell };
  };
  const openTile = async (page, g, cellId) => {
    const idx = g.cells.filter((c) => c.status === 'open').findIndex((c) => c.id === cellId);
    // tiles are rendered per category in board order
    const order = g.cats.flatMap((cat) => g.cells.filter((c) => c.cat === cat.id)).filter((c) => c.status === 'open');
    const k = order.findIndex((c) => c.id === cellId);
    await page.locator('.tile.open').nth(k).click();
    await page.waitForSelector('.qcard');
  };

  console.log('Pictures');
  {
    const st = await gameWith((q) => q.media && q.media.type === 'image' && q.media.reveal === 'zoom');
    const { ctx, page, errors, cell } = await openGame(st);
    await openTile(page, JSON.parse(st).g, cell);
    await page.waitForSelector('.qimg img');
    await page.waitForFunction(() => document.querySelector('.qimg img').complete);
    const w = await page.evaluate(() => document.querySelector('.qimg img').naturalWidth);
    ok(w > 0, 'a built-in flag picture loads and displays');
    const box = await page.evaluate(() => { const r = document.querySelector('.qimg').getBoundingClientRect(); return { w: r.width, h: r.height }; });
    ok(Math.abs(box.w / box.h - 4 / 3) < 0.05 && box.w <= 390, 'it keeps its proportions and fits a phone screen (' + Math.round(box.w) + '×' + Math.round(box.h) + ')');
    const tf1 = await page.evaluate(() => document.querySelector('.qimg img').style.transform);
    await page.click('text=Show more of the picture');
    const tf2 = await page.evaluate(() => document.querySelector('.qimg img').style.transform);
    ok(/scale\(3\.2\)/.test(tf1) && /scale\(2\.2\)/.test(tf2), 'progressive reveal: starts zoomed in, the host zooms out a step');
    ok(/200|400|600/.test(await page.textContent('.qh-val')) && (await page.textContent('.qh-val')) === (await page.textContent('.qh-val')), 'the value shown doesn’t change when more is revealed');
    const alt = await page.getAttribute('.qimg img', 'alt');
    const ans = JSON.parse(st).g.cells.find((c) => c.id === cell).q.a.en;
    ok(alt && !alt.toLowerCase().includes(ans.toLowerCase()), 'the picture has a description that doesn’t give the answer away (“' + alt + '”)');
    const src = await page.getAttribute('.qimg img', 'src');
    ok(/media\/i\/[0-9a-f]{12}\.svg$/.test(src), 'the file name is neutral (' + src + ')');
    ok(!errors.length, 'no page errors' + (errors.length ? ': ' + errors[0] : ''));
    await page.screenshot({ path: path.join(root, 'shots', 'media-phone-picture.png'), fullPage: true });
    await ctx.close();
  }
  {
    const st = await gameWith((q) => q.media && q.media.type === 'image' && !q.media.emoji);
    const { ctx, page, cell } = await openGame(st, { patch: (c) => { c.q.media = { ...c.q.media, src: 'media/i/doesnotexist.svg' }; } });
    await openTile(page, JSON.parse(st).g, cell);
    await page.waitForSelector('.qimg.broken');
    ok(/didn’t load/.test(await page.textContent('.qimg.broken')), 'a picture that fails to load shows a clear message instead of a broken image');
    ok(await page.isVisible('text=This is wrong'), '…and “This is wrong” is right there to replace the question');
    await ctx.close();
  }
  {
    const st = await gameWith((q) => q.media && q.media.emoji);
    const { ctx, page, cell } = await openGame(st);
    await openTile(page, JSON.parse(st).g, cell);
    ok(await page.isVisible('.qemoji'), 'an emoji puzzle shows big emoji');
    await page.screenshot({ path: path.join(root, 'shots', 'media-phone-emoji.png'), fullPage: true });
    await ctx.close();
  }

  console.log('Sounds');
  {
    const st = await gameWith((q) => q.media && q.media.type === 'audio');
    const { ctx, page, errors, cell } = await openGame(st);
    await openTile(page, JSON.parse(st).g, cell);
    await page.waitForSelector('.mctl');
    await sleep(300);
    const before = await page.evaluate(() => { const a = document.querySelector('audio'); return a ? { paused: a.paused, t: a.currentTime } : null; });
    ok(before && before.paused && before.t === 0, 'nothing plays when the question opens');
    ok(/Nothing plays until you press Play/.test(await page.textContent('.mstatus')), 'the host is told the sound waits for Play');
    await page.click('.mctl button:has-text("Play")');
    await sleep(900);
    const playing = await page.evaluate(() => { const a = document.querySelector('audio'); return { paused: a.paused, t: a.currentTime }; });
    ok(!playing.paused && playing.t > 0.3, 'Play starts the sound (' + playing.t.toFixed(2) + 's in)');
    ok(/Playing/.test(await page.textContent('.mstatus')), 'status says it’s playing');
    await page.click('.mctl button:has-text("Pause")');
    await sleep(200);
    const paused = await page.evaluate(() => { const a = document.querySelector('audio'); return { paused: a.paused, t: a.currentTime }; });
    ok(paused.paused, 'Pause pauses it');
    await page.click('.mctl button[aria-label="Replay"]');
    await sleep(250);
    const rep = await page.evaluate(() => { const a = document.querySelector('audio'); return { paused: a.paused, t: a.currentTime }; });
    ok(!rep.paused && rep.t < 0.6, 'Replay starts again from the beginning');
    await page.fill('.vol input', '0.3').catch(async () => { await page.evaluate(() => { const i = document.querySelector('.vol input'); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(i, '0.3'); i.dispatchEvent(new Event('input', { bubbles: true })); }); });
    await page.evaluate(() => { const i = document.querySelector('.vol input'); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(i, '0.3'); i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new Event('change', { bubbles: true })); });
    await sleep(150);
    ok(Math.abs(await page.evaluate(() => document.querySelector('audio').volume) - 0.3) < 0.01, 'the volume slider sets the volume');
    const src = await page.getAttribute('audio', 'src');
    ok(/media\/a\/[0-9a-f]{12}\.mp3$/.test(src), 'the sound file name is neutral (' + src + ')');
    ok(!errors.length, 'no page errors' + (errors.length ? ': ' + errors[0] : ''));
    await page.screenshot({ path: path.join(root, 'shots', 'media-phone-sound.png'), fullPage: true });
    // reload: nothing starts by itself
    await page.click('.mctl button:has-text("Play")'); await sleep(200);
    await page.reload(); await page.click('text=Continue game').catch(() => {});
    await page.waitForSelector('.mctl'); await sleep(500);
    ok(await page.evaluate(() => { const a = document.querySelector('audio'); return !a || a.paused; }), 'after a reload the sound doesn’t start by itself');
    await ctx.close();
  }
  {
    const st = await gameWith((q) => q.media && q.media.type === 'audio');
    const { ctx, page, cell } = await openGame(st, { patch: (c) => { c.q.media = { ...c.q.media, src: 'media/a/doesnotexist.mp3' }; } });
    await openTile(page, JSON.parse(st).g, cell);
    await page.click('.mctl button:has-text("Play")');
    await page.waitForSelector('.mstatus.bad', { timeout: 5000 }).catch(() => {});
    ok(await page.isVisible('.mstatus.bad'), 'a sound that can’t load shows a problem message');
    ok(await page.isVisible('text=Broken? Replace this question'), '…with a button to replace the question');
    await page.click('text=Broken? Replace this question');
    await page.click('text=Picture, sound or clip broken');
    await page.click('.wrongsheet .btn-flag.solid');
    await sleep(200);
    const q2 = await page.evaluate(() => document.querySelector('.qtext').textContent);
    ok(!!q2 && await page.isVisible('.qcard'), 'the broken question is replaced and the game carries on');
    const issues = await page.evaluate(() => JSON.parse(localStorage.getItem('kh_issues_v1') || 'null'));
    await ctx.close();
  }

  console.log('Clips (stand-in YouTube player)');
  {
    const st = await gameWith((q) => q.media && q.media.emoji && q.cat === 'animated');
    const patch = (id, end) => (c) => { c.q.media = { type: 'video', yt: id, start: 10, end }; };
    // normal clip
    let { ctx, page, cell } = await openGame(st, { patch: patch('OKVIDEOxxxx', 11.5) });
    await openTile(page, JSON.parse(st).g, cell);
    await page.waitForSelector('.fake-yt');
    ok((await page.evaluate(() => window.__yt.opts.host)) === 'https://www.youtube-nocookie.com' && (await page.evaluate(() => window.__yt.opts.playerVars.start)) === 10 && (await page.evaluate(() => window.__yt.opts.playerVars.end)) === 12, 'the clip is embedded with YouTube’s player (no-cookie), start and end set');
    ok(/Needs internet/.test(await page.textContent('.mctl')) && /0:10–0:12/.test(await page.textContent('.mctl')), 'the host sees “needs internet” and the clip range');
    ok(!(await page.evaluate(() => window.__yt.calls.includes('play'))), 'the clip doesn’t start until the host presses Play');
    await page.click('.mctl button:has-text("Play")');
    await sleep(400);
    ok(await page.evaluate(() => window.__yt.calls.includes('play')), 'Play plays the clip');
    await sleep(2200);
    ok(await page.evaluate(() => window.__yt.state === 2 && window.__yt.t >= 11.5 && window.__yt.t < 12.5), 'it is paused at the end time (' + (await page.evaluate(() => window.__yt.t)) + 's)');
    ok(/Finished/.test(await page.textContent('.mstatus')), 'status says finished');
    await page.click('.mctl button[aria-label="Replay"]');
    await sleep(200);
    ok(await page.evaluate(() => window.__yt.calls.filter((c) => c === 'seek:10').length >= 1 && window.__yt.state === 1), 'Replay jumps back to the start time and plays');
    ok(!(await page.isVisible('.qans')), 'the answer isn’t shown while the clip plays');
    await page.screenshot({ path: path.join(root, 'shots', 'media-phone-clip.png'), fullPage: true });
    await ctx.close();
    // title spoiler
    ({ ctx, page, cell } = await openGame(st, { patch: (c) => { patch('SPOILERxxxx', 20)(c); c.q.a = { en: 'Finding Nemo', ar: 'البحث عن نيمو' }; } }));
    await openTile(page, JSON.parse(st).g, cell);
    await page.waitForSelector('.mctl .warn', { timeout: 5000 }).catch(() => {});
    ok(await page.isVisible('.mctl .warn') && /may give the answer away/.test(await page.textContent('.mctl .warn')), 'the host is warned when the video title gives the answer away');
    await ctx.close();
    // embedding disabled
    ({ ctx, page, cell } = await openGame(st, { patch: patch('BLOCKEDxxxx', 20) }));
    await openTile(page, JSON.parse(st).g, cell);
    await page.waitForSelector('.mstatus.bad', { timeout: 5000 }).catch(() => {});
    ok(/doesn’t allow this video to play inside other sites/.test(await page.textContent('.mstatus')), 'a video that can’t be embedded says so');
    ok(await page.isVisible('text=Broken? Replace this question'), '…and offers to replace the question');
    await ctx.close();
    // offline
    ({ ctx, page, cell } = await openGame(st, { patch: patch('OKVIDEOxxxx', 20) }));
    await ctx.unroute('https://www.youtube.com/iframe_api');
    await ctx.route('https://www.youtube.com/**', (r) => r.abort());
    await openTile(page, JSON.parse(st).g, cell);
    await page.waitForSelector('.mstatus.bad', { timeout: 20000 }).catch(() => {});
    ok(/can’t be reached/.test(await page.textContent('.mstatus')), 'with no internet the clip says it can’t be reached (the rest of the game keeps working)');
    ok(await page.isVisible('.btn-right'), '…and the host can still mark or replace the question');
    await ctx.close();
  }

  console.log('TV window');
  {
    const st = await gameWith((q) => q.media && q.media.type === 'audio');
    const { ctx, page, tv, cell } = await openGame(st, { tvWindow: true });
    await sleep(600);
    await openTile(page, JSON.parse(st).g, cell);
    await sleep(400);
    ok(/Plays on the TV window/.test(await page.textContent('.mctl')), 'with a TV window open, the host is told the sound plays there');
    ok(await page.evaluate(() => !document.querySelector('audio')), 'the host device doesn’t play it too');
    if (await tv.isVisible('.soundunlock')) await tv.click('.soundunlock');
    await page.click('.mctl button:has-text("Play")');
    await sleep(1000);
    const tvAudio = await tv.evaluate(() => { const a = document.querySelector('audio'); return a ? { paused: a.paused, t: a.currentTime } : null; });
    ok(tvAudio && !tvAudio.paused && tvAudio.t > 0.3, 'pressing Play on the host plays it on the TV window');
    ok(/Playing/.test(await page.textContent('.mstatus')), 'the TV reports back: the host sees “Playing”');
    await page.click('.mctl button:has-text("Pause")'); await sleep(300);
    ok(await tv.evaluate(() => document.querySelector('audio').paused), 'Pause on the host pauses the TV');
    await page.click('text=Play on this device instead'); await sleep(300);
    ok(await page.evaluate(() => !!document.querySelector('audio')), '“Play on this device instead” moves playback to the host');
    ok(!(await tv.isVisible('.qans')), 'the TV never shows the answer before marking');
    await tv.screenshot({ path: path.join(root, 'shots', 'media-tv-sound.png') });
    // "This is wrong" reaches the TV
    const before = await tv.textContent('.qtext');
    await page.click('text=This is wrong');
    await page.click('.wrongsheet .btn-flag.solid');
    await sleep(500);
    ok((await tv.textContent('.qtext')) !== before, 'after “This is wrong”, the TV shows the replacement');
    await ctx.close();
  }
  {
    // TV-sized picture
    const st = await gameWith((q) => q.media && q.media.type === 'image' && !q.media.emoji && q.cat === 'maps');
    const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const { g, cell } = JSON.parse(st);
    await ctx.addInitScript(({ g }) => { if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.setItem('kh_current_v1', JSON.stringify(g)); localStorage.setItem('kh_settings_v1', JSON.stringify({ lang: 'ar', motion: 'reduce' })); } }, { g });
    const page = await ctx.newPage(); await page.goto(base);
    await page.click('text=كمّل اللعبة');
    const order = g.cats.flatMap((cat) => g.cells.filter((c) => c.cat === cat.id)).filter((c) => c.status === 'open');
    await page.locator('.tile.open').nth(order.findIndex((c) => c.id === cell)).click();
    await page.click('.tvbtn'); await page.click('.modal .btn-gold');
    await page.waitForSelector('.tvmode .qimg img'); await sleep(400);
    const fits = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth && document.querySelector('.tvmode .qimg').getBoundingClientRect().bottom > 0);
    ok(fits, 'on a TV-sized screen the map shows large, with no sideways scroll');
    await page.screenshot({ path: path.join(root, 'shots', 'media-tv-map-ar.png') });
    await ctx.close();
  }

  await browser.close(); server.close();
  console.log(fails ? fails + ' FAILED' : 'All media checks passed');
  process.exit(fails ? 1 : 0);
})();
