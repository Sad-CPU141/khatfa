// Layout check: plays a short game in real Chromium (Playwright) and takes screenshots
// at phone (360×780) and TV (1920×1080) sizes, in Arabic and English.
// Also fails if any screen scrolls sideways or the page logs an error.
// Run: npm run shots   (needs Playwright installed globally; serves the site on a local port)
const path = require('path');
const fs = require('fs');
const http = require('http');
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');

const root = path.join(__dirname, '..');
const outDir = path.join(root, 'shots');
fs.mkdirSync(outDir, { recursive: true });
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(root, p);
  if (!f.startsWith(root) || !fs.existsSync(f)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
});

let problems = 0;
const fail = (m) => { problems++; console.log('  ✗ ' + m); };
const pass = (m) => console.log('  ✓ ' + m);

async function run(browser, base, { lang, w, h, tag }) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(base);
  await page.evaluate((l) => { localStorage.setItem('kh_settings_v1', JSON.stringify({ lang: l, motion: 'reduce' })); }, lang);
  await page.reload();
  await page.waitForSelector('.hero');
  await page.evaluate(() => document.fonts.ready);
  const shot = async (name) => {
    await page.waitForTimeout(150);
    const wide = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (wide > 1) fail(tag + ' ' + name + ': scrolls sideways by ' + wide + 'px');
    await page.screenshot({ path: path.join(outDir, tag + '-' + name + '.png'), fullPage: w < 900 });
  };
  const click = async (sel) => { await page.locator(sel).first().click(); await page.waitForTimeout(80); };
  await shot('1-home');
  await click('.btn-gold'); // new game
  await page.waitForSelector('.teamedit');
  await click('.rtitle');
  await shot('2-setup');
  await click('.app > .btn-gold'); // pick categories
  await page.waitForSelector('.catgrid');
  for (let i = 0; i < 3; i++) await click('.catcard:not([disabled])');
  await shot('3-pick');
  for (let i = 0; i < 3; i++) await click('.catcard:not([disabled])');
  await page.waitForSelector('.board');
  await shot('4-board');
  await click('.tile.open');
  await page.waitForSelector('.qcard');
  await shot('5-question');
  await click('.btn-wrong'); // → steal
  await page.waitForSelector('.stage.s-steal');
  await page.waitForTimeout(300);
  await page.evaluate(() => { const f = document.querySelector('.flash'); if (f) f.click(); });
  await shot('6-steal');
  await click('.btn-steal');
  await page.evaluate(() => { const f = document.querySelector('.flash'); if (f) f.click(); });
  await page.waitForSelector('.result');
  await shot('7-reveal');
  await click('.actions .btn-gold');
  // play a few more so the board shows results, then end the game
  for (let i = 0; i < 4; i++) {
    await click('.tile.open'); await click(i % 2 ? '.btn-right' : '.btn-wrong');
    await page.evaluate(() => { const f = document.querySelector('.flash'); if (f) f.click(); });
    if (await page.locator('.btn-wrong').count()) { await click('.btn-wrong'); await page.evaluate(() => { const f = document.querySelector('.flash'); if (f) f.click(); }); }
    await click('.actions .btn-gold');
  }
  await shot('8-board-played');
  // TV view on this screen
  await click('.tvbtn'); await click('.modal .btn-gold');
  await page.waitForSelector('.tvmode');
  await shot('9-tv-board');
  await click('.tvbar .pillbtn:last-child');
  await click('.tile.open');
  await click('.tvbtn'); await click('.modal .btn-gold');
  await page.waitForSelector('.tvmode .qcard');
  if (await page.locator('.tvmode .qans').count()) fail(tag + ' TV shows the answer before it is marked'); else pass(tag + ' TV hides the answer while the question is open');
  await shot('10-tv-question');
  await click('.tvbar .pillbtn:last-child');
  await click('.btn-right'); await page.evaluate(() => { const f = document.querySelector('.flash'); if (f) f.click(); });
  await click('.actions .btn-gold');
  // end the game from the menu
  await click('.topbar .iconbtn'); await click('.sheet .btn-danger'); await click('.modal .btn-danger');
  await page.waitForSelector('.winner');
  await shot('11-results');
  if (errors.length) fail(tag + ' page errors: ' + errors.slice(0, 3).join(' | ')); else pass(tag + ' no page errors');
  await ctx.close();
}

(async () => {
  await new Promise((r) => server.listen(0, r));
  const base = 'http://127.0.0.1:' + server.address().port + '/';
  const browser = await chromium.launch();
  console.log('Screenshots → shots/');
  for (const cfg of [
    { lang: 'ar', w: 360, h: 780, tag: 'phone-ar' },
    { lang: 'en', w: 360, h: 780, tag: 'phone-en' },
    { lang: 'ar', w: 1920, h: 1080, tag: 'tv-ar' },
    { lang: 'en', w: 1920, h: 1080, tag: 'tv-en' },
  ]) {
    try { await run(browser, base, cfg); } catch (e) { fail(cfg.tag + ' crashed: ' + e.message.split('\n')[0]); }
  }
  await browser.close(); server.close();
  console.log(problems ? problems + ' problem(s)' : 'All layout checks passed');
  process.exit(problems ? 1 : 0);
})();
