// Step 1 in real Chromium (Playwright): lifelines + sound, phone / laptop / TV, settings, voice lines, TV window.
// Run: node tests/step1.js   (screenshots → shots/step1-*.png)
const path = require('path'); const fs = require('fs'); const http = require('http');
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const root = path.join(__dirname, '..');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.png': 'image/png', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.webmanifest': 'application/manifest+json' };
const server = http.createServer((req, res) => { let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f)) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res); });
let fails = 0; const ok = (c, m) => { if (c) console.log('  ✓ ' + m); else { fails++; console.log('  ✗ ' + m); } };
const sleep = (n) => new Promise((r) => setTimeout(r, n));
const out = path.join(root, 'shots'); fs.mkdirSync(out, { recursive: true });
const SPY = () => { window.__KH_TEST__ = true; window.__audio = { osc: 0, buf: 0 }; const A = window.AudioContext; if (A) { const o = A.prototype.createOscillator, b = A.prototype.createBufferSource; A.prototype.createOscillator = function () { window.__audio.osc++; return o.call(this); }; A.prototype.createBufferSource = function () { window.__audio.buf++; return b.call(this); }; } };
const mediaMap = (() => { const s = {}; require('vm').runInNewContext(fs.readFileSync(path.join(root, 'src/bank/02-media.js'), 'utf8').replace('KH_BANK', 'this.K={}; this.K'), s); return s.K.media; })();

(async () => {
  await new Promise((r) => server.listen(0, r));
  const base = 'http://127.0.0.1:' + server.address().port + '/';
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  // A game on the board (built by the real app), started from saved state.
  const mk = await browser.newContext(); const mp = await mk.newPage(); await mp.addInitScript(SPY); await mp.goto(base); await mp.waitForSelector('.hero');
  const state = await mp.evaluate(() => { const K = window.__KH; let g = K.createGame(K.BANK, [{ name: 'Falcons', emoji: '🦅' }, { name: 'Leopards', emoji: '🐆' }], { answerTime: 45 }, Date.now(), { gameNo: 1 }); ['capitals', 'space', 'movies', 'fb-clubs', 'mammals', 'cars'].forEach((id) => { g = K.pickCategory(g, id, { bank: K.BANK, recent: {}, rand: Math.random }); }); return JSON.stringify(g); });
  await mk.close();
  const start = async ({ w = 390, h = 844, lang = 'en', tv = false } = {}) => {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    await ctx.addInitScript(SPY);
    await ctx.addInitScript(({ g, lang }) => { if (!sessionStorage.getItem('seeded') && !location.hash) { sessionStorage.setItem('seeded', '1'); localStorage.setItem('kh_current_v1', g); localStorage.setItem('kh_settings_v1', JSON.stringify({ lang, motion: 'reduce' })); } }, { g: state, lang });
    const page = await ctx.newPage(); const errors = []; page.on('pageerror', (e) => errors.push(e.message));
    let tvp = null; if (tv) { tvp = await ctx.newPage(); await tvp.addInitScript(SPY); await tvp.goto(base + '#tv'); }
    await page.goto(base); await page.locator('.resume, .btn-gold').first().click();
    await page.waitForSelector('.board');
    return { ctx, page, errors, tvp };
  };
  const noFlash = async (page) => { await page.evaluate(() => { const f = document.querySelector('.flash'); if (f) f.click(); }); await sleep(120); };
  const shot = async (page, name, full = true) => { await sleep(150); const wide = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); ok(wide <= 1, name + ': no sideways scroll'); await page.screenshot({ path: path.join(out, 'step1-' + name + '.png'), fullPage: full }); };

  console.log('Phone: lifelines');
  {
    const { ctx, page, errors } = await start();
    await page.locator('.tile.open').first().click(); await page.waitForSelector('.llbar');
    await shot(page, '01-phone-lifelines-available');
    ok(await page.locator('.llbtn.s-ready').count() === 3, '3 lifelines ready for the answering team');
    await page.click('.llbtn:has-text("ضاعفها")'); await noFlash(page);
    ok(await page.evaluate(() => window.__audio.osc > 0), 'Double It made a sound with real Web Audio (built-in sound)');
    ok(/400/.test(await page.textContent('.qh-val')), 'the value shows 400 (doubled from 200)');
    await shot(page, '02-phone-double-it');
    await page.click('.llbtn:has-text("فزعة")'); await noFlash(page);
    ok(await page.isVisible('.helpclock') && /3\d|2\d/.test(await page.textContent('.helpclock .hc-n')), 'Call for Help: a 30-second countdown');
    await shot(page, '03-phone-call-for-help');
    await page.click('text=Done asking'); await sleep(100);
    await page.click('.llbtn:has-text("درع")'); await noFlash(page);
    ok(/no steal/.test(await page.textContent('.fxbadges')), 'Shield: “no steal” badge');
    await shot(page, '04-phone-shield');
    ok(!errors.length, 'no page errors' + (errors.length ? ': ' + errors[0] : ''));
    await ctx.close();
  }
  console.log('Laptop');
  {
    const { ctx, page } = await start({ w: 1366, h: 768 });
    await page.locator('.tile.open').nth(3).click(); await page.waitForSelector('.llbar');
    await page.click('.llbtn:has-text("ضاعفها")'); await noFlash(page);
    await shot(page, '05-laptop-question', false);
    await ctx.close();
  }
  console.log('TV view (1920×1080, Arabic)');
  {
    const { ctx, page } = await start({ w: 1920, h: 1080, lang: 'ar' });
    await page.locator('.tile.open').first().click(); await page.waitForSelector('.llbar');
    await page.click('.tvbtn'); await page.click('.modal .btn-gold'); await page.waitForSelector('.tvmode .qcard');
    await shot(page, '06-tv-question', false);
    ok(await page.locator('.tvmode .scard .lldots').count() === 2, 'TV shows each team’s lifelines on the score cards');
    await page.click('.tvbar .pillbtn:last-child');
    await page.click('.llbtn:has-text("ضاعفها")'); await page.click('.llbtn:has-text("فزعة")'); await noFlash(page);
    await page.click('.tvbtn'); await page.click('.modal .btn-gold'); await page.waitForSelector('.tvmode .helpclock');
    ok(await page.isVisible('.tvmode .helpclock.big') && await page.isVisible('.tvmode .fx-double'), 'TV: big help countdown and the Double It badge');
    ok(!(await page.isVisible('.tvmode .qans')), 'TV: no answer shown');
    await shot(page, '07-tv-countdown-double', false);
    await page.click('.tvbar .pillbtn:last-child');
    await page.click('.helpclock .btn'); // done asking
    await page.click('.btn-right'); await noFlash(page);
    await page.click('.topbar .iconbtn'); await page.click('.sheet .btn-danger'); await page.click('.modal .btn-danger');
    await page.waitForSelector('.winner');
    ok(await page.evaluate(() => window.__KH.sound.log.some((x) => x.name === 'winner-fanfare')), 'the winner fanfare played at the end');
    await page.click('.tvbtn').catch(() => {});
    await ctx.close();
  }
  console.log('TV window: sound plays on the TV only');
  {
    const { ctx, page, tvp } = await start({ tv: true });
    await tvp.setViewportSize({ width: 1920, height: 1080 });
    await sleep(600);
    if (await tvp.isVisible('.soundunlock')) await tvp.click('.soundunlock');
    await page.locator('.tile.open').first().click(); await page.waitForSelector('.llbar');
    await page.click('.llbtn:has-text("ضاعفها")'); await noFlash(page);
    await page.click('.btn-right'); await noFlash(page); await sleep(300);
    const host = await page.evaluate(() => window.__KH.sound.log.map((x) => x.name));
    const tvl = await tvp.evaluate(() => window.__KH.sound.log.map((x) => x.name));
    ok(!host.includes('correct') && tvl.filter((x) => x === 'correct').length === 1 && tvl.includes('double-it'), 'the TV window played the sounds once; the host stayed quiet (no double playback)');
    await tvp.screenshot({ path: path.join(out, 'step1-08-tvwindow-doubled.png') });
    await page.click('.btn-gold.span2'); // back to board
    await page.click('.topbar .iconbtn'); await page.click('.sheet .btn-danger'); await page.click('.modal .btn-danger');
    await tvp.waitForSelector('.tvmode .winner'); await sleep(2200);
    ok(await tvp.evaluate(() => window.__KH.sound.log.filter((x) => x.name === 'winner-fanfare').length === 1), 'the TV window plays the winner fanfare once');
    await tvp.screenshot({ path: path.join(out, 'step1-11-tv-winner.png') });
    await ctx.close();
  }
  console.log('Settings: sound and voice lines');
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); await ctx.addInitScript(SPY);
    await ctx.addInitScript(({ g }) => { if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.setItem('kh_settings_v1', JSON.stringify({ lang: 'en', motion: 'reduce' })); localStorage.setItem('kh_current_v1', g); } }, { g: state });
    const page = await ctx.newPage(); const errors = []; page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(base); await page.click('.app .btn:has-text("Settings")');
    await page.waitForSelector('.soundset');
    await shot(page, '09-settings-sound');
    await page.locator('.sndrow:has-text("Steal") button:has-text("Upload")').click().catch(() => {});
    const voice = path.join(require('os').tmpdir(), 'khatfa-voice.mp3'); fs.copyFileSync(path.join(root, mediaMap['snd-cat']), voice);
    await page.setInputFiles('.soundset input[type=file]', voice);
    await page.waitForSelector('.sndrow:has-text("Steal") .src-custom', { timeout: 8000 }).catch(() => {});
    ok(await page.isVisible('.sndrow:has-text("Steal") .src-custom'), 'a voice line uploaded for the steal shows “Your recording”');
    await page.locator('.sndrow:has-text("Steal") .mini').click(); await sleep(600);
    ok(await page.evaluate(() => window.__KH.sound.log.some((x) => x.name === 'steal' && x.result === 'custom') && window.__audio.buf > 0), 'preview plays the uploaded recording (decoded and played with Web Audio)');
    await shot(page, '10-settings-voice-line');
    // volume + mute
    await page.evaluate(() => { const i = document.querySelector('.soundset .vol input'); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(i, '0.4'); i.dispatchEvent(new Event('input', { bubbles: true })); });
    await sleep(100);
    ok(Math.abs(await page.evaluate(() => window.__KH.sound.gain) - 0.4) < 0.01, 'the volume slider sets the real output volume');
    await page.click('.soundset .btn:has-text("Sounds are on")');
    const before = await page.evaluate(() => window.__audio.osc + window.__audio.buf);
    await page.locator('.sndrow:has-text("Correct") .mini').click().catch(() => {}); await sleep(200);
    ok(await page.evaluate(() => window.__audio.osc + window.__audio.buf) === before, 'muted: previews and game sounds are silent');
    // a game steal uses the voice line
    await page.click('.app .btn:has-text("Sounds are off")');
    await page.click('.topbar .iconbtn'); await page.locator('.resume').click(); await page.waitForSelector('.board');
    await page.locator('.tile.open').first().click(); await page.click('.btn-wrong'); await noFlash(page); await page.click('.btn-steal'); await noFlash(page); await sleep(500);
    ok(await page.evaluate(() => window.__KH.sound.log.filter((x) => x.name === 'steal').slice(-1)[0].result === 'custom'), 'in the game, the steal plays your recording');
    await page.reload(); await page.waitForSelector('.hero'); await page.click('.app .btn:has-text("Settings")'); await page.waitForSelector('.soundset');
    ok(await page.isVisible('.sndrow:has-text("Steal") .src-custom') && Math.abs(await page.evaluate(() => window.__KH.sound.config.volume) - 0.4) < 0.01, 'after a reload: the recording and the volume are still there');
    await page.locator('.sndrow:has-text("Steal") button:has-text("Remove")').click(); await sleep(200);
    ok(!(await page.isVisible('.sndrow:has-text("Steal") .src-custom')), 'a recording can be removed (back to the built-in sound)');
    ok(!errors.length, 'no page errors' + (errors.length ? ': ' + errors[0] : ''));
    await ctx.close();
  }
  await browser.close(); server.close();
  console.log(fails ? fails + ' FAILED' : 'All Step 1 browser checks passed');
  process.exit(fails ? 1 : 0);
})();
