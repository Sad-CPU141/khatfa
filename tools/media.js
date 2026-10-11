// Builds the built-in pictures and sounds into media/ (run: node tools/media.js [path-to-cc0-sounds]).
// · Flags: flag-icons (MIT; the flag designs themselves are public domain / not copyrightable)
// · Maps: Natural Earth 1:50m country shapes (public domain) via world-atlas (ISC), drawn with d3-geo
// · Sounds: CC0 packs by Kenney (kenney.nl) and Ben Burnes / Abstraction (abstractionmusic.com),
//   from github.com/lavenderdotpet/CC0-Public-Domain-Sounds (each pack's own CC0 notice is kept in media/licenses/)
//   plus tones generated here (no source material).
// Files get neutral content-hash names so a file name never gives an answer away.
// Writes src/bank/02-media.js: KH_BANK.media = { key: 'media/…' }. Questions use m.src = '@key'.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const root = path.join(__dirname, '..');
const out = path.join(root, 'media');
const CC0 = process.argv[2] || '/tmp/cc0s';
const map = {};
const sha = (buf) => crypto.createHash('sha1').update(buf).digest('hex').slice(0, 12);
function save(key, dir, ext, buf) {
  const name = sha(buf) + ext;
  fs.mkdirSync(path.join(out, dir), { recursive: true });
  fs.writeFileSync(path.join(out, dir, name), buf);
  map[key] = 'media/' + dir + '/' + name;
}

/* ---------------- flags ---------------- */
const FLAGS = ['br', 'in', 'de', 'it', 'gb', 'cn', 'fr', 'ar', 'se', 'gr', 'ke', 'jm', 'pt', 'za', 'vn', 'ng', 'ki', 'sc', 'sz', 'lk', 'bn', 'kz', 'bz', 'kg', 'om', 'mn', 'np'];
function flags() {
  const dir = path.join(root, 'node_modules/flag-icons/flags/4x3');
  FLAGS.forEach((cc) => {
    let svg = fs.readFileSync(path.join(dir, cc + '.svg'), 'utf8');
    svg = svg.replace(/\s+id="flag-icons-[a-z-]+"/, ''); // the id names the country
    save('flag-' + cc, 'i', '.svg', Buffer.from(svg));
  });
}

/* ---------------- logos (Simple Icons) ----------------
   Only plain symbols with no brand name in them (checked by eye on a contact sheet).
   The <title> is removed (it names the brand). Drawn in the brand's colour. */
const LOGOS = ('audi toyota volkswagen mitsubishi honda tesla chevrolet hyundai renault citroen subaru mazda suzuki maserati rollsroyce seat infiniti '
  + 'opel skoda acura polestar dacia smart tata cadillac '
  + 'nike mcdonalds apple youtube whatsapp instagram spotify netflix mastercard snapchat twitch airbnb telegram playstation android tiktok adidas dropbox underarmour steam paypal pinterest').split(' ');
function logos() {
  const dir = path.join(root, 'node_modules/simple-icons');
  const data = JSON.parse(fs.readFileSync(path.join(dir, 'data/simple-icons.json'), 'utf8'));
  const list = Array.isArray(data) ? data : data.icons;
  const slugOf = (t) => t.toLowerCase().replace(/\+/g, 'plus').replace(/\./g, 'dot').replace(/&/g, 'and').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
  LOGOS.forEach((slug) => {
    const info = list.find((x) => (x.slug || slugOf(x.title)) === slug);
    const svg = fs.readFileSync(path.join(dir, 'icons', slug + '.svg'), 'utf8');
    const d = (svg.match(/ d="([^"]+)"/) || [])[1];
    if (!info || !d) throw new Error('logo missing: ' + slug);
    const out = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-3 -3 30 30"><path fill="#' + info.hex + '" d="' + d + '"/></svg>';
    save('logo-' + slug, 'i', '.svg', Buffer.from(out));
  });
}

/* ---------------- maps ---------------- */
async function maps() {
  const d3 = await import('d3-geo');
  const topo = await import('topojson-client');
  const world = JSON.parse(fs.readFileSync(path.join(root, 'node_modules/world-atlas/countries-50m.json'), 'utf8'));
  const all = topo.feature(world, world.objects.countries).features;
  // Highlight maps use the coarser 1:110m shapes for the surrounding countries (much smaller files).
  const world110 = JSON.parse(fs.readFileSync(path.join(root, 'node_modules/world-atlas/countries-110m.json'), 'utf8'));
  const all110 = topo.feature(world110, world110.objects.countries).features;
  const byName = (n) => { const f = all.find((x) => x.properties.name === n); if (!f) throw new Error('No country named ' + n); return f; };
  const W = 800, H = 600;
  // A country's outline on its own (no labels, no neighbours).
  const shape = (key, name, rotate, maxLat) => {
    let f = byName(name);
    // Leave out far-off islands (e.g. Svalbard for Norway) so the outline is the familiar one.
    if (maxLat && f.geometry.type === 'MultiPolygon') f = { ...f, geometry: { type: 'MultiPolygon', coordinates: f.geometry.coordinates.filter((poly) => Math.max(...poly[0].map((c) => c[1])) < maxLat) } };
    const proj = d3.geoMercator(); if (rotate) proj.rotate(rotate);
    proj.fitExtent([[40, 40], [W - 40, H - 40]], f);
    const p = d3.geoPath(proj).digits(1);
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '"><path d="' + p(f) + '" fill="#f3e7c3" stroke="#ffc83d" stroke-width="3" stroke-linejoin="round"/></svg>';
    save(key, 'i', '.svg', Buffer.from(svg));
  };
  // A country highlighted among its neighbours. zoom: how much of the frame the country fills.
  const highlight = (key, name, zoom = 0.28) => {
    const f = all110.find((x) => x.properties.name === name) || byName(name);
    const proj = d3.geoMercator();
    const iw = W * zoom, ih = H * zoom;
    proj.fitExtent([[(W - iw) / 2, (H - ih) / 2], [(W + iw) / 2, (H + ih) / 2]], f);
    const p = d3.geoPath(proj).digits(1);
    const inView = (g) => { const b = p.bounds(g); return b[1][0] > -50 && b[0][0] < W + 50 && b[1][1] > -50 && b[0][1] < H + 50 && (b[1][0] - b[0][0]) < W * 8; };
    const others = all110.filter((g) => g.properties.name !== name && inView(g)).map((g) => '<path d="' + p(g) + '"/>').join('');
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '"><rect width="' + W + '" height="' + H + '" fill="#26457a"/>'
      + '<g fill="#8f88b8" stroke="#2c2659" stroke-width="1.2" stroke-linejoin="round">' + others + '</g>'
      + '<path d="' + p(f) + '" fill="#ffc83d" stroke="#291c00" stroke-width="2" stroke-linejoin="round"/></svg>';
    save(key, 'i', '.svg', Buffer.from(svg));
  };
  [['shape-it', 'Italy'], ['shape-au', 'Australia'], ['shape-in', 'India'], ['shape-mg', 'Madagascar'], ['shape-cl', 'Chile'], ['shape-no', 'Norway'], ['shape-is', 'Iceland'],
    ['shape-cu', 'Cuba'], ['shape-eg', 'Egypt'], ['shape-mn', 'Mongolia'], ['shape-la', 'Laos'], ['shape-mw', 'Malawi'], ['shape-bo', 'Bolivia'], ['shape-cy', 'Cyprus'],
    ['shape-gb', 'United Kingdom'], ['shape-jp', 'Japan']].forEach(([k, n]) => shape(k, n));
  shape('shape-no', 'Norway', null, 72);
  [['hl-es', 'Spain', 0.3], ['hl-pe', 'Peru', 0.28], ['hl-th', 'Thailand', 0.3], ['hl-et', 'Ethiopia', 0.28], ['hl-ua', 'Ukraine', 0.3], ['hl-bf', 'Burkina Faso', 0.22],
    ['hl-tm', 'Turkmenistan', 0.26], ['hl-py', 'Paraguay', 0.24], ['hl-om', 'Oman', 0.28], ['hl-ca', 'Canada', 0.55], ['hl-ng', 'Nigeria', 0.28], ['hl-pl', 'Poland', 0.26]].forEach(([k, n, z]) => highlight(k, n, z));
}

/* ---------------- sounds ---------------- */
const RATE = 44100;
function wav(samples) {
  const n = samples.length; const buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write('WAVE', 8); buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22); buf.writeUInt32LE(RATE, 24); buf.writeUInt32LE(RATE * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(n * 2, 40);
  let peak = 0; for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(samples[i]));
  const g = peak > 0 ? 0.85 / peak : 1;
  for (let i = 0; i < n; i++) buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, samples[i] * g)) * 32767), 44 + i * 2);
  return buf;
}
const tmp = path.join(require('os').tmpdir(), 'khatfa-media'); fs.mkdirSync(tmp, { recursive: true });
// Encode to MP3 (mono, 96 kbps; plays everywhere, including iPhone Safari).
function mp3From(input, opts = []) {
  const o = path.join(tmp, 'o.mp3');
  execFileSync('ffmpeg', ['-v', 'error', '-y', ...input, ...opts, '-ac', '1', '-ar', '44100', '-c:a', 'libmp3lame', '-b:a', '96k', '-map_metadata', '-1', o]);
  return fs.readFileSync(o);
}
function fromSamples(key, samples) { const w = path.join(tmp, 'w.wav'); fs.writeFileSync(w, wav(samples)); save(key, 'a', '.mp3', mp3From(['-i', w])); }
// Several short files joined with a gap (for very short jingles / clicks).
function joinFiles(key, files, gap = 0.45, extra = []) {
  const ins = []; files.forEach((f) => ins.push('-i', f));
  const parts = files.map((_, i) => '[' + i + ':a]aformat=sample_rates=44100:channel_layouts=mono,apad=pad_dur=' + gap + '[a' + i + ']').join(';');
  const filter = parts + ';' + files.map((_, i) => '[a' + i + ']').join('') + 'concat=n=' + files.length + ':v=0:a=1,loudnorm=I=-16:TP=-1.5[out]';
  save(key, 'a', '.mp3', mp3From([...ins], ['-filter_complex', filter, '-map', '[out]', ...extra]));
}
function clip(key, file, start, dur) {
  save(key, 'a', '.mp3', mp3From(['-ss', String(start), '-t', String(dur), '-i', file], ['-af', 'afade=t=in:d=0.05,afade=t=out:st=' + Math.max(0, dur - 0.4) + ':d=0.4,loudnorm=I=-16:TP=-1.5']));
}
const secs = (s) => new Float32Array(Math.round(s * RATE));
const sine = (f, t) => Math.sin(2 * Math.PI * f * t);
function synth() {
  // Morse code: S O S (… --- …), 700 Hz, 20 wpm-ish, twice.
  {
    const unit = 0.09; const seq = '... --- ...'; const b = [];
    const tone = (u) => { for (let i = 0; i < u * unit * RATE; i++) { const t = i / RATE; const env = Math.min(1, i / 200, (u * unit * RATE - i) / 200); b.push(sine(700, t) * env); } };
    const gap = (u) => { for (let i = 0; i < u * unit * RATE; i++) b.push(0); };
    for (let rep = 0; rep < 2; rep++) { seq.split('').forEach((ch) => { if (ch === ' ') gap(2); else { tone(ch === '.' ? 1 : 3); gap(1); } }); gap(7); }
    fromSamples('snd-morse-sos', Float32Array.from(b));
  }
  // North American dial tone: 350 Hz + 440 Hz, continuous.
  { const s = secs(4); for (let i = 0; i < s.length; i++) { const t = i / RATE; s[i] = (sine(350, t) + sine(440, t)) * Math.min(1, i / 400, (s.length - i) / 2000); } fromSamples('snd-dialtone', s); }
  // Doppler: a two-tone siren driving past (pitch and loudness change as it passes).
  {
    const s = secs(7); const c = 343, v = 30, d0 = 12; let ph = 0;
    for (let i = 0; i < s.length; i++) {
      const t = i / RATE; const x = v * (t - 3.5); const r = Math.sqrt(x * x + d0 * d0);
      const vr = v * x / r; // positive = moving away
      const base = Math.floor(t / 0.45) % 2 ? 960 : 720; // "hi-lo" siren
      const f = base * c / (c + vr);
      ph += 2 * Math.PI * f / RATE;
      s[i] = (Math.sin(ph) + 0.3 * Math.sin(2 * ph)) / (1 + r / 8);
    }
    fromSamples('snd-doppler', s);
  }
  // Beats: 440 Hz and 444 Hz together → a 4-per-second wobble.
  { const s = secs(5); for (let i = 0; i < s.length; i++) { const t = i / RATE; s[i] = (sine(440, t) + sine(444, t)) * Math.min(1, i / 800, (s.length - i) / 4000); } fromSamples('snd-beats', s); }
  // Concert A: 440 Hz.
  { const s = secs(4); for (let i = 0; i < s.length; i++) { const t = i / RATE; s[i] = sine(440, t) * Math.min(1, i / 800, (s.length - i) / 4000); } fromSamples('snd-a440', s); }
  // Heartbeat: "lub-dub" at about 70 beats a minute. Pitched around 90–180 Hz so phone and laptop
  // speakers can play it (a real heartbeat is lower), with soft onsets (no clicks).
  {
    const s = secs(6);
    const thump = (t0, f, amp, len) => { for (let i = 0; i < len * RATE; i++) { const k = Math.round(t0 * RATE) + i; if (k >= s.length) break; const t = i / RATE;
      const env = Math.sin(Math.min(1, t / 0.012) * Math.PI / 2) * Math.exp(-t / (len / 3.5)) * (1 - Math.pow(t / len, 4));
      s[k] += amp * env * (Math.sin(2 * Math.PI * f * t) + 0.5 * Math.sin(2 * Math.PI * f * 2 * t) + 0.25 * Math.sin(2 * Math.PI * f * 3 * t)); } };
    for (let b = 0.3; b < 5.8; b += 60 / 70) { thump(b, 85, 1, 0.16); thump(b + 0.3, 105, 0.7, 0.12); }
    fromSamples('snd-heart', s);
  }
  // Clock: tick … tock, once a second.
  {
    const s = secs(6); let seed = 7; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff - 0.5; };
    for (let k = 0; k < 6; k++) { const f = k % 2 ? 1800 : 2400; const t0 = Math.round((0.2 + k) * RATE); for (let i = 0; i < 0.025 * RATE; i++) { const t = i / RATE; s[t0 + i] += (Math.sin(2 * Math.PI * f * t) + rnd()) * Math.exp(-t / 0.004); } }
    fromSamples('snd-clock', s);
  }
  // Mosquito: a thin whine around 600 Hz that wanders, getting nearer and further.
  {
    const s = secs(5); let ph = 0;
    for (let i = 0; i < s.length; i++) { const t = i / RATE; const f = 600 + 40 * Math.sin(2 * Math.PI * 0.7 * t) + 15 * Math.sin(2 * Math.PI * 3.1 * t); ph += 2 * Math.PI * f / RATE;
      const saw = (ph / Math.PI) % 2 - 1; const amp = 0.25 + 0.75 * Math.pow(Math.sin(Math.PI * t / 5), 2); s[i] = (0.6 * Math.sin(ph) + 0.4 * saw) * amp * (1 + 0.2 * Math.sin(2 * Math.PI * 9 * t)); }
    fromSamples('snd-mosquito', s);
  }
  // Sonar: a "ping" with a fainter echo, repeated.
  {
    const s = secs(7); const ping = (t0, a) => { for (let i = 0; i < 1.6 * RATE; i++) { const k = Math.round(t0 * RATE) + i; if (k >= s.length) break; const t = i / RATE; s[k] += a * Math.sin(2 * Math.PI * 1400 * t) * Math.exp(-t / 0.35) * Math.min(1, i / 100); } };
    [0.2, 3.4].forEach((t0) => { ping(t0, 1); ping(t0 + 1.1, 0.25); });
    fromSamples('snd-sonar', s);
  }
  // Shepard tone: octave-spaced tones under a fixed bell-shaped loudness curve, sliding up forever.
  {
    const s = secs(9); const ph = new Array(9).fill(0); const fmin = 27.5, oct = 9;
    for (let i = 0; i < s.length; i++) { const t = i / RATE; let v = 0;
      for (let k = 0; k < oct; k++) { const pos = ((k + t / 3) % oct) / oct; const f = fmin * Math.pow(2, pos * oct); ph[k] += 2 * Math.PI * f / RATE; const w = Math.exp(-Math.pow((pos - 0.5) / 0.18, 2)); v += w * Math.sin(ph[k]); }
      s[i] = v * Math.min(1, i / 2000, (s.length - i) / 8000); }
    fromSamples('snd-shepard', s);
  }
}
function cc0() {
  if (!fs.existsSync(CC0)) { console.log('  (CC0 sound folder not found at ' + CC0 + ': skipping recorded sounds)'); return false; }
  const P = (...p) => path.join(CC0, ...p);
  const jingles = (dir, pre) => fs.readdirSync(P('kenney_musicjingles/Audio', dir)).filter((f) => f.startsWith(pre)).sort().map((f) => P('kenney_musicjingles/Audio', dir, f));
  clip('snd-cat', P('Micro Pack - Cat Meows', 'Cat Meows - Feeding Frenzy.wav'), 0, 6);
  clip('snd-typing', P('bb - Keyboard Sounds (Mar 2021)', 'Keyboard - Typing Slower.wav'), 0, 5);
  joinFiles('snd-dice', ['diceThrow1.ogg', 'diceThrow2.ogg', 'diceThrow3.ogg'].map((f) => P('kenney_casinoaudio/Audio', f)), 0.6);
  joinFiles('snd-sax', jingles('Sax jingles', 'jingles_SAX').slice(0, 6), 0.35);
  joinFiles('snd-steelpan', jingles('Steel jingles', 'jingles_STEEL').slice(0, 5), 0.35);
  joinFiles('snd-chiptune', jingles('8-Bit jingles', 'jingles_NES').slice(0, 4), 0.35);
  joinFiles('snd-pizzicato', jingles('Pizzicato jingles', 'jingles_PIZZI').slice(0, 6), 0.35);
  clip('snd-cello', P('bb - Novice Cello (Nov 2021)', 'C2 - Sustain 1.wav'), 0.2, 6);
  joinFiles('snd-slidewhistle', ['Fast Rise Fall.wav', 'Fast Rise.wav', 'Fast Drop.wav'].map((f) => P('bb - Slide Whistle (Aug 2021)', f)), 0.4);
  clip('snd-vinyl', P('Micro Pack - Record Fuzzies', 'Classic Record Fuzz.wav'), 2, 6);
  joinFiles('snd-rubik', ['Big Cube - Twist 1.wav', 'Big Cube - Twist 2.wav', 'Big Cube - Twist 3.wav', 'Big Cube - Twist 4.wav', 'Big Cube - Twist 5.wav', 'Big Cube - Twist 6.wav'].map((f) => P("bb - Rubik's Cube (Feb 2021)", f)), 0.15);
  // keep each pack's own licence notice
  const lic = path.join(out, 'licenses'); fs.mkdirSync(lic, { recursive: true });
  fs.copyFileSync(P('kenney_musicjingles/License.txt'), path.join(lic, 'kenney-music-jingles.txt'));
  fs.copyFileSync(P('kenney_casinoaudio/License.txt'), path.join(lic, 'kenney-casino-audio.txt'));
  fs.copyFileSync(P('Micro Pack - Cat Meows/_README.txt'), path.join(lic, 'ben-burnes-cc0-packs.txt'));
  return true;
}

(async () => {
  fs.rmSync(path.join(out, 'i'), { recursive: true, force: true });
  fs.rmSync(path.join(out, 'a'), { recursive: true, force: true });
  flags(); logos(); await maps(); synth(); const rec = cc0();
  fs.mkdirSync(path.join(out, 'licenses'), { recursive: true });
  fs.copyFileSync(path.join(root, 'node_modules/flag-icons/LICENSE'), path.join(out, 'licenses', 'flag-icons-MIT.txt'));
  fs.copyFileSync(path.join(root, 'node_modules/world-atlas/LICENSE'), path.join(out, 'licenses', 'world-atlas-ISC.txt'));
  fs.copyFileSync(path.join(root, 'node_modules/simple-icons/LICENSE.md'), path.join(out, 'licenses', 'simple-icons-CC0.md'));
  fs.copyFileSync(path.join(root, 'node_modules/simple-icons/DISCLAIMER.md'), path.join(out, 'licenses', 'simple-icons-DISCLAIMER.md'));
  const keys = Object.keys(map).sort();
  const js = '/* Built-in media files, generated by tools/media.js — do not edit by hand.\n   Questions refer to them as m.src = \'@key\'. File names are content hashes. */\nKH_BANK.media = ' + JSON.stringify(Object.fromEntries(keys.map((k) => [k, map[k]])), null, 1) + ';\n';
  fs.writeFileSync(path.join(root, 'src/bank/02-media.js'), js);
  let bytes = 0; keys.forEach((k) => { bytes += fs.statSync(path.join(root, map[k])).size; });
  console.log('Media: ' + keys.length + ' files, ' + Math.round(bytes / 1024) + ' KB' + (rec ? '' : ' (no recorded sounds)'));
})();
