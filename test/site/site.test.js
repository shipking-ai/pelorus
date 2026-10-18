// SPDX-License-Identifier: GPL-3.0-or-later
// Tests for the public website in site/: static integrity (no browser needed) and behaviour in a real Chrome
// (accessibility with axe, no third-party requests, responsive layout, the Toolbox filters).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');

const ROOT = path.resolve(__dirname, '..', '..');
const SITE = path.join(ROOT, 'site');
const pkg = require(path.join(ROOT, 'package.json'));
const AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const PAGES = [{ name: 'home', url: '/' }, { name: 'toolbox', url: '/toolbox/' }];
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.txt': 'text/plain' };

// ---------------------------------------------------------------- static checks (no browser)
const read = (f) => fs.readFileSync(path.join(SITE, f), 'utf8');
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));

test('every local link, script, stylesheet and image in the HTML resolves to a file', () => {
  for (const page of ['index.html', 'toolbox/index.html']) {
    const html = read(page);
    const dir = path.dirname(path.join(SITE, page));
    for (const m of html.matchAll(/(?:href|src)="([^"#?]+)(?:[#?][^"]*)?"/g)) {
      const u = m[1];
      if (/^(https?:|mailto:|data:)/.test(u)) continue;
      let target = path.resolve(dir, u);
      if (u.endsWith('/') || u === '.' || u === './') target = path.join(target, 'index.html');
      assert.ok(fs.existsSync(target), `${page}: "${u}" does not exist`);
    }
  }
});

test('pages obey their own Content-Security-Policy: no inline scripts, styles or handlers', () => {
  for (const page of ['index.html', 'toolbox/index.html']) {
    const html = read(page);
    assert.match(html, /http-equiv="Content-Security-Policy"/);
    assert.ok(!/<script(?![^>]*\bsrc=)[^>]*>/i.test(html), `${page}: inline <script>`);
    assert.ok(!/<style[\s>]/i.test(html), `${page}: inline <style>`);
    assert.ok(!/\son[a-z]+\s*=/i.test(html.replace(/content="[^"]*"/g, '')), `${page}: inline event handler`);
    // style="" attributes are blocked by style-src 'self' (no 'unsafe-inline'), so they would silently not apply
    assert.ok(!/sstyle="/i.test(html), `${page}: inline style attribute (use a class in site.css)`);
  }
});

test('external links open safely and nothing third-party is loaded', () => {
  for (const page of ['index.html', 'toolbox/index.html']) {
    const html = read(page);
    for (const m of html.matchAll(/<(?:script|link|img)[^>]+(?:src|href)="(https?:\/\/[^"]+)"/g)) {
      if (/rel="(?:preload|stylesheet|icon)"/.test(m[0]) || /<script|<img/.test(m[0])) assert.fail(`${page} loads a third-party resource: ${m[1]}`);
    }
    for (const m of html.matchAll(/<a [^>]*href="https?:\/\/[^"]+"[^>]*>/g)) assert.match(m[0], /rel="[^"]*noopener/, `${page}: external link without noopener: ${m[0].slice(0, 90)}`);
  }
});

test('the page advertises the version that package.json has', () => {
  assert.ok(read('index.html').includes(`Pre-release ${pkg.version}`), `index.html should say "Pre-release ${pkg.version}"`);
  assert.ok(read('index.html').includes(`Pelorus-Setup-${pkg.version}.exe`), 'the verify command should name the current installer');
});

test('every image has alt text and explicit dimensions (no layout shift)', () => {
  for (const page of ['index.html', 'toolbox/index.html']) {
    for (const m of read(page).matchAll(/<img\b[^>]*>/g)) {
      assert.match(m[0], /\balt="/, `${page}: image without alt: ${m[0].slice(0, 80)}`);
      assert.match(m[0], /\bwidth="\d+"/, `${page}: image without width`);
      assert.match(m[0], /\bheight="\d+"/, `${page}: image without height`);
    }
  }
});

test('size budget: shell pages stay small (data and screenshots are separate)', () => {
  const kb = (f) => fs.statSync(path.join(SITE, f)).size / 1024;
  assert.ok(kb('index.html') < 40, `index.html is ${kb('index.html').toFixed(0)} KB`);
  assert.ok(kb('assets/css/site.css') < 40, 'site.css too big');
  for (const f of walk(path.join(SITE, 'assets', 'js'))) assert.ok(fs.statSync(f).size < 30 * 1024, `${f} too big`);
  const fonts = walk(path.join(SITE, 'assets', 'fonts')).filter((f) => f.endsWith('.woff2')).reduce((s, f) => s + fs.statSync(f).size, 0);
  assert.ok(fonts < 260 * 1024, `fonts total ${(fonts / 1024).toFixed(0)} KB`);
});

test('font licence texts ship with the fonts', () => {
  assert.match(fs.readFileSync(path.join(SITE, 'assets', 'fonts', 'LICENSES.txt'), 'utf8'), /SIL OPEN FONT LICENSE Version 1\.1/i);
});

const DATA_FILE = path.join(SITE, 'assets', 'data', 'toolbox.json');
test('toolbox data: shape, uniqueness and honesty fields', { skip: !fs.existsSync(DATA_FILE) && 'toolbox.json not built (node scripts/build-toolbox.js)' }, () => {
  const d = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  assert.equal(d.meta.total, d.items.length);
  assert.ok(d.items.length >= 1000, `only ${d.items.length} entries`);
  assert.ok(d.meta.curatedVerified >= 350, `only ${d.meta.curatedVerified} curated entries verified`);
  assert.ok(d.categories.length >= 12);
  const ids = new Set(d.categories.map((c) => c.id));
  const names = new Set();
  for (const it of d.items) {
    assert.equal(it.length, 9, `bad tuple ${it[0]}`);
    const [n, stars, lic, pushed, lang, arch, cat, cur, desc] = it;
    assert.match(n, /^[\w.-]+\/[\w.-]+$/); assert.ok(!names.has(n.toLowerCase()), `duplicate ${n}`); names.add(n.toLowerCase());
    assert.ok(Number.isInteger(stars) && stars >= 0); assert.equal(typeof lic, 'string'); assert.match(pushed, /^\d{4}-\d{2}$/);
    assert.ok(arch === 0 || arch === 1); assert.ok(ids.has(cat), `unknown category ${cat} for ${n}`); assert.ok(cur === 0 || cur === 1);
    assert.ok(desc.length <= 140);
  }
  assert.match(d.meta.method, /not every tool|wide net/i, 'the method text must admit the limits');
  assert.ok(Array.isArray(d.osi) && d.osi.includes('mit'));
});

// ---------------------------------------------------------------- browser checks
let playwright; try { playwright = require('playwright-core'); } catch { /* optional */ }
let server; let origin; let browser;
const chromeOpts = () => (process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' });

test.before(async () => {
  server = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    const f = path.join(SITE, p);
    if (!f.startsWith(SITE) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('nope'); }
    res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(res);
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  origin = `http://127.0.0.1:${server.address().port}`;
  if (playwright) { try { browser = await playwright.chromium.launch(chromeOpts()); } catch (e) { console.error('Chrome not available:', e.message.split('\n')[0]); } }
});
test.after(async () => { await browser?.close(); await new Promise((r) => server.close(r)); });

async function open(url, { width = 1280, height = 900, scheme = 'dark', reduced = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, colorScheme: scheme, reducedMotion: reduced ? 'reduce' : 'no-preference', acceptDownloads: true });
  const page = await ctx.newPage();
  const problems = []; const external = [];
  page.on('console', (m) => { if (m.type() === 'error') problems.push(`console: ${m.text()}`); });
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  page.on('request', (r) => { if (!r.url().startsWith(origin) && !r.url().startsWith('data:')) external.push(r.url()); });
  await page.goto(origin + url, { waitUntil: 'networkidle' });
  return { ctx, page, problems, external };
}
// `skip` options are evaluated when a test is declared, before test.before() has started Chrome, so skipping is decided inside the test.
const withBrowser = (fn) => async (t) => { if (!browser) return t.skip('no Chrome available (set CHROME_PATH)'); return fn(t); };
const noData = () => !fs.existsSync(DATA_FILE) && 'no toolbox data (node scripts/build-toolbox.js)';

for (const p of PAGES) {
  for (const scheme of ['dark', 'light']) {
    test(`${p.name} (${scheme}): no serious or critical accessibility violations, no console errors, nothing third-party`, withBrowser(async () => {
      const { ctx, page, problems, external } = await open(p.url, { scheme });
      try {
        if (p.name === 'toolbox') await page.waitForSelector('.tool');
        await page.evaluate(() => document.querySelectorAll('.reveal').forEach((e) => e.classList.add('in')));
        await page.waitForTimeout(900);
        await page.evaluate(AXE);
        const violations = await page.evaluate(async () => (await window.axe.run(document, { resultTypes: ['violations'] })).violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.slice(0, 3).map((n) => n.target.join(' ')) })));
        const bad = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
        assert.deepEqual(bad, [], JSON.stringify(bad, null, 1));
        assert.deepEqual(problems, []);
        assert.deepEqual(external, [], 'requests to other origins');
      } finally { await ctx.close(); }
    }));
  }
  test(`${p.name}: no horizontal scrolling at 360 px wide`, withBrowser(async () => {
    const { ctx, page } = await open(p.url, { width: 360, height: 740 });
    try {
      if (p.name === 'toolbox') await page.waitForSelector('.tool');
      const w = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
      assert.ok(w.sw <= w.iw + 1, `page is ${w.sw}px wide in a ${w.iw}px viewport`);
    } finally { await ctx.close(); }
  }));
}

test('home: the dial honours reduced motion (static) and the toolbox teaser fills in', withBrowser(async (t) => {
  if (noData()) return t.skip(noData());
  const { ctx, page } = await open('/', { reduced: true });
  try {
    const a = await page.textContent('#bearing'); await page.mouse.move(100, 100); await page.waitForTimeout(500);
    assert.equal(await page.textContent('#bearing'), a, 'the dial must not move when reduced motion is requested');
    await page.waitForFunction(() => /\d/.test(document.querySelector('#stats [data-k="total"]').textContent));
    assert.ok((await page.locator('#cat-chips a').count()) >= 8);
  } finally { await ctx.close(); }
}));

test('home: the pointer turns the sighting vane', withBrowser(async () => {
  const { ctx, page } = await open('/');
  try {
    const before = await page.textContent('#bearing');
    await page.mouse.move(5, 300); await page.waitForTimeout(900);
    const left = await page.textContent('#bearing');
    await page.mouse.move(1270, 300); await page.waitForTimeout(900);
    const right = await page.textContent('#bearing');
    assert.notEqual(left, right, `bearing should differ when the pointer moves (before ${before}, left ${left}, right ${right})`);
  } finally { await ctx.close(); }
}));

test('toolbox: search, category, licence filter, hash state, show-more and CSV export work', withBrowser(async (t) => {
  if (noData()) return t.skip(noData());
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  const { ctx, page } = await open('/toolbox/');
  try {
    await page.waitForSelector('.tool');
    const total = data.items.filter((r) => !r[5]).length;
    assert.match(await page.textContent('#count'), new RegExp(`${total.toLocaleString('en-US')} of ${data.items.length.toLocaleString('en-US')}`), 'count text');
    // search
    await page.fill('#q', 'tailwind'); await page.waitForTimeout(400);
    const n = await page.locator('.tool').count();
    assert.ok(n > 0, 'tailwind should match something');
    for (const t of await page.locator('.tool').allTextContents()) assert.match(t.toLowerCase(), /tailwind/);
    // category via button + URL hash
    await page.fill('#q', ''); await page.waitForTimeout(300);
    await page.click('#cats button[data-c="landing"]');
    assert.match(page.url(), /#.*c=landing/);
    const expected = data.items.filter((r) => !r[5] && r[6] === 'landing').length;
    assert.match(await page.textContent('#count'), new RegExp(`^${expected.toLocaleString('en-US')} of`));
    // OSI-only
    await page.click('#lic button[data-v="osi"]'); await page.waitForTimeout(200);
    for (const t of await page.locator('.tool .meta').first().allTextContents()) assert.ok(!/check licence/.test(t));
    assert.equal(await page.locator('.tool .tag.chk').count(), 0, 'no "check licence" entries when OSI-only');
    // show more
    await page.click('#lic button[data-v=""]'); await page.click('#cats button[data-c=""]'); await page.waitForTimeout(200);
    const first = await page.locator('.tool').count(); assert.equal(first, 48);
    await page.click('#more'); assert.equal(await page.locator('.tool').count(), 96);
    // CSV
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#csv')]);
    const csv = fs.readFileSync(await dl.path(), 'utf8');
    assert.match(csv.split('\r\n')[0], /^repository,url,stars,licence,osi_approved/);
    // deep link
    await page.goto(origin + '/toolbox/#c=motion&osi=1&q=anim'); await page.waitForSelector('.tool');
    assert.ok(await page.locator('#cats button[data-c="motion"][aria-pressed="true"]').count(), 'category from the URL is selected');
    assert.equal(await page.inputValue('#q'), 'anim');
  } finally { await ctx.close(); }
}));

test('toolbox: descriptions are rendered as text, never as HTML', withBrowser(async (t) => {
  if (noData()) return t.skip(noData());
  const { ctx, page } = await open('/toolbox/');
  try {
    await page.waitForSelector('.tool');
    assert.equal(await page.locator('.tool img, .tool script, .tool iframe, .tool svg').count(), 0);
  } finally { await ctx.close(); }
}));
