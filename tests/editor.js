// The question editor and packs in real Chromium (Playwright): create, upload, preview, validate,
// verify, export/import, preview on the TV window. Clips use a stand-in for YouTube's API.
// Run: node tests/editor.js
const path = require('path');
const fs = require('fs');
const os = require('os');
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
const FAKE_YT = fs.readFileSync(path.join(__dirname, 'media.js'), 'utf8').match(/const FAKE_YT = `([\s\S]*?)`;/)[1];
const mediaMap = (() => { const s = {}; require('vm').runInNewContext(fs.readFileSync(path.join(root, 'src/bank/02-media.js'), 'utf8').replace('KH_BANK', 'this.K={}; this.K'), s); return s.K.media; })();

(async () => {
  await new Promise((r) => server.listen(0, r));
  const base = 'http://127.0.0.1:' + server.address().port + '/';
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kh-ed-'));
  // Test files with names that give answers away: the editor must not keep them.
  const pic = path.join(tmp, 'flag-of-brazil.svg'); fs.copyFileSync(path.join(root, mediaMap['flag-br']), pic);
  const snd = path.join(tmp, 'cat-meow.mp3'); fs.copyFileSync(path.join(root, mediaMap['snd-cat']), snd);
  const notSound = path.join(tmp, 'notes.mp3'); fs.writeFileSync(notSound, 'this is not audio');

  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
  await ctx.addInitScript(() => { if (!sessionStorage.getItem('s')) { sessionStorage.setItem('s', '1'); localStorage.setItem('kh_settings_v1', JSON.stringify({ lang: 'en', motion: 'reduce' })); } });
  await ctx.route('https://www.youtube.com/iframe_api', (r) => r.fulfill({ contentType: 'text/javascript', body: FAKE_YT }));
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(base); await page.waitForSelector('.hero');

  console.log('Question editor');
  await page.click('text=My questions');
  await page.click('text=New pack');
  ok(await page.isVisible('text=Your categories'), 'a new pack opens');
  await page.fill('input[maxlength="60"]', 'Family Night');
  await page.click('text=Add category');
  await page.fill('.sheet input[dir="ltr"]', 'Our Pets');
  await page.fill('.sheet input[dir="rtl"]', 'حيواناتنا');
  await page.click('.sheet >> text=Save');
  ok(await page.isVisible('.chip >> text=Our Pets'), 'a pack category can be added');

  // Picture question
  await page.click('text=Add a question'); await page.click('.typegrid >> text=Picture');
  await page.selectOption('select.input', { label: '🐾 Our Pets' }).catch(async () => { const v = await page.$eval('select.input', (s) => [...s.options].find((o) => /Our Pets/.test(o.textContent)).value); await page.selectOption('select.input', v); });
  await page.click('.seg >> text=400');
  await page.click('text=Save');
  ok(await page.isVisible('.verrors') && /Add a picture/.test(await page.textContent('.verrors')) && /Write the question/.test(await page.textContent('.verrors')), 'saving an incomplete question shows clear errors');
  await page.setInputFiles('input[type=file][accept^="image"]', pic);
  await page.waitForSelector('.preview .qimg img');
  await page.waitForFunction(() => document.querySelector('.preview .qimg img').naturalWidth > 0);
  ok(true, 'an uploaded picture shows in the preview');
  const src = await page.getAttribute('.preview .qimg img', 'src');
  ok(/^blob:/.test(src), 'the picture is stored in the browser (blob), not under its original file name');
  await page.locator('.bifield').nth(0).locator('input').first().fill('A green and yellow flag');
  await page.click('.seg >> text=Zoomed in');
  await page.locator('.preview .qimg').click({ position: { x: 50, y: 40 } });
  ok(/scale\(3\.2\)/.test(await page.getAttribute('.preview .qimg img', 'style')), 'zoomed reveal: the preview starts zoomed in where the host tapped');
  await page.locator('textarea.input').nth(0).fill('Whose flag is this?');
  await page.locator('.bifield').nth(2).locator('input').first().fill('Brazil');
  ok(await page.isDisabled('text=Save as verified'), '“Save as verified” stays off until a source is given');
  await page.click('.qf-actions >> text=Save');
  ok(await page.isVisible('.qrow >> text=Whose flag is this?'), 'the picture question is saved to the pack');

  // Sound question: a non-audio file is refused, a real one previews and plays
  await page.click('text=Add a question'); await page.click('.typegrid >> text=Sound');
  await page.setInputFiles('input[type=file][accept^="audio"]', notSound);
  await page.waitForSelector('.warn', { timeout: 10000 }).catch(() => {});
  ok(/can’t open that file|isn’t a sound/.test(await page.textContent('.qform')), 'a file that isn’t playable sound is refused with a clear message');
  await page.setInputFiles('input[type=file][accept^="audio"]', snd);
  await page.waitForSelector('text=seconds long');
  ok(/6 seconds long/.test(await page.textContent('.qform')), 'a sound file is checked and its length shown');
  await page.click('.preview button:has-text("Play")'); await sleep(800);
  ok(await page.evaluate(() => { const a = document.querySelector('.preview audio'); return a && !a.paused && a.currentTime > 0.2; }), 'the sound plays in the preview');
  await page.click('.preview button:has-text("Pause")');
  await page.locator('textarea.input').nth(0).fill('Which pet is this?');
  await page.locator('.bifield').nth(1).locator('input').first().fill('Our cat');
  await page.selectOption('select.input', await page.$eval('select.input', (s) => [...s.options].find((o) => /Our Pets/.test(o.textContent)).value));
  await page.click('.qf-actions >> text=Save');
  ok(await page.isVisible('.qrow >> text=Which pet is this?'), 'the sound question is saved');

  // Clip question
  await page.click('text=Add a question'); await page.click('.typegrid >> text=Clip');
  await page.selectOption('select.input', 'animated');
  await page.fill('input[inputmode=url]', 'https://vimeo.com/12345');
  await page.locator('textarea.input').nth(0).fill('Which film is this scene from?');
  await page.locator('.bifield').nth(1).locator('input').first().fill('Example Film');
  await page.click('.qf-actions >> text=Save');
  ok(/isn’t a YouTube link/.test(await page.textContent('.verrors')), 'a non-YouTube link is refused');
  await page.fill('input[inputmode=url]', 'https://youtu.be/OKVIDEOxxxx?t=70');
  ok((await page.inputValue('input[placeholder="1:05"]')) === '1:10', 'a link with ?t= fills in the start time');
  await page.fill('input[placeholder="1:20"]', '1:05');
  await page.click('.qf-actions >> text=Save');
  ok(/end time must be a time after the start/.test(await page.textContent('.verrors')), 'an end time before the start is refused');
  await page.fill('input[placeholder="1:20"]', '1:12');
  await page.waitForSelector('.preview .fake-yt');
  ok(await page.evaluate(() => window.__yt.opts.playerVars.start === 70 && window.__yt.opts.playerVars.end === 72), 'the preview embeds the clip with the chosen start and end');
  await page.click('.preview button:has-text("Play")'); await sleep(2600);
  ok(await page.evaluate(() => window.__yt.state === 2 && window.__yt.t >= 72 && window.__yt.t < 73), 'the preview stops at the end time');
  await page.fill('textarea[maxlength="500"]', 'Official studio channel upload; checked the scene');
  ok(!(await page.isDisabled('text=Save as verified')), '“Save as verified” is available once everything is filled in');

  // Preview on a TV window
  const tv = await ctx.newPage(); await tv.goto(base + '#tv'); await sleep(800);
  await page.click('text=Preview on the TV window');
  await tv.waitForSelector('.fake-yt', { timeout: 5000 }).catch(() => {});
  ok(await tv.isVisible('.fake-yt') && /Preview/.test(await tv.textContent('.tvmode')), '“Preview on the TV window” shows the clip on the TV');
  ok(!(await tv.isVisible('.qans')), 'the TV preview doesn’t show the answer');
  await page.click('.preview button:has-text("Play")'); await sleep(500);
  ok(await tv.evaluate(() => window.__yt.calls.includes('play')), 'the host’s Play button plays it on the TV');
  await page.click('text=Save as verified');
  ok(await page.isVisible('.qrow >> text=verified'), 'the clip question is saved and marked verified');
  await sleep(300);
  ok(!(await tv.isVisible('.fake-yt')), 'leaving the question closes the TV preview');

  // Export, delete, import
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('text=Export pack')]);
  const file = path.join(tmp, 'pack.json'); await dl.saveAs(file);
  const exp = JSON.parse(fs.readFileSync(file, 'utf8'));
  ok(exp.kind === 'pack' && exp.pack.questions.length === 3 && Object.keys(exp.media).length === 2, 'export: one file with the 3 questions and both media files inside');
  ok(!JSON.stringify(exp).includes('flag-of-brazil') && !JSON.stringify(exp).includes('cat-meow'), 'original file names (which could give answers away) aren’t kept');
  await page.click('text=Delete pack'); await page.click('.modal .btn-danger');
  ok(!(await page.isVisible('text=Family Night')), 'the pack can be deleted');
  await sleep(300);
  ok((await page.evaluate(() => new Promise((res) => { const r = indexedDB.open('khatfa-media'); r.onsuccess = () => { const t = r.result.transaction('files').objectStore('files').count(); t.onsuccess = () => res(t.result); }; }))) === 0, 'its picture and sound files are removed from the browser too');
  await page.setInputFiles('input[type=file][accept^="application/json"]', file);
  await page.waitForSelector('.modal');
  ok(/3 questions, 1 categories, 2 picture\/sound files/.test(await page.textContent('.modal')), 'import shows what’s in the file before adding it');
  await page.click('.modal .btn-gold');
  await page.waitForSelector('text=Family Night');
  await page.click('text=Family Night');
  await page.click('.qrow >> text=Whose flag is this?');
  await page.waitForSelector('.preview .qimg img');
  await page.waitForFunction(() => document.querySelector('.preview .qimg img').naturalWidth > 0);
  ok(true, 'after import the picture still shows (files restored into this browser)');
  await page.click('text=Cancel');

  // Settings / home show the pack questions in the bank
  await page.click('.topbar .iconbtn'); await page.click('.topbar .iconbtn').catch(() => {});
  await page.goto(base); await page.waitForSelector('.hero');
  const note = await page.textContent('.hero ~ * .hint, .hint.center').catch(() => '');
  ok(!errors.length, 'no page errors' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await page.click('text=My questions'); await page.click('text=Family Night');
  await page.screenshot({ path: path.join(root, 'shots', 'editor-phone-pack.png'), fullPage: true });
  await page.click('.qrow >> text=Which film is this scene from?');
  await page.screenshot({ path: path.join(root, 'shots', 'editor-phone-clip.png'), fullPage: true });
  await ctx.close();
  await browser.close(); server.close();
  console.log(fails ? fails + ' FAILED' : 'All editor checks passed');
  process.exit(fails ? 1 : 0);
})();
