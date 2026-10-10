// Renders the app icons from the logo mark (SVG) with Playwright. Run: node tools/icons.js
const path = require('path');
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const tiles = [[10, 14], [26, 14], [10, 34], [26, 34], [42, 34]].map(([x, y]) => `<rect x="${x}" y="${y}" width="13" height="16" rx="3" fill="#ffc83d"/>`).join('');
const mark = (pad) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="100%" height="100%">
<defs><radialGradient id="g" cx="50%" cy="0%" r="90%"><stop offset="0" stop-color="#3a2f78"/><stop offset="1" stop-color="#0f0c21"/></radialGradient></defs>
<rect width="64" height="64" fill="url(#g)"/>
<g transform="translate(${pad} ${pad}) scale(${(64 - 2 * pad) / 64})">${tiles}
<g transform="rotate(-18 50 18)"><rect x="43" y="8" width="13" height="16" rx="3" fill="#22cfd6"/></g>
<path d="M41 30 L47 22" stroke="#22cfd6" stroke-width="3" stroke-linecap="round"/></g></svg>`;
(async () => {
  const b = await chromium.launch();
  const out = [['icon-192.png', 192, 4], ['icon-512.png', 512, 4], ['apple-touch-icon.png', 180, 6], ['icon-maskable-512.png', 512, 13], ['favicon.png', 64, 1]];
  for (const [f, s, pad] of out) {
    const p = await b.newPage({ viewport: { width: s, height: s } });
    await p.setContent(`<html><body style="margin:0">${mark(pad)}</body></html>`);
    await p.screenshot({ path: path.join(__dirname, '..', 'icons', f) });
    await p.close();
  }
  await b.close(); console.log('icons done');
})();
