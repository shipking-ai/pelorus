// SPDX-License-Identifier: GPL-3.0-or-later
// Copies site/ to _site/ (the folder that gets published) and writes sitemap.xml with absolute URLs.
// Usage: node scripts/build-site.js [--base https://pelorus.js.org/] [--cname pelorus.js.org]
// Default base is the GitHub Pages project URL. A CNAME file is written only when --cname is given, because a CNAME
// for a domain whose DNS does not exist yet makes GitHub redirect the github.io address to a dead name.
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : d; };
const base = arg('base', 'https://shipking-ai.github.io/pelorus/').replace(/\/?$/, '/');
const cname = arg('cname', '');
const out = path.join(ROOT, '_site');
fs.rmSync(out, { recursive: true, force: true });
fs.cpSync(path.join(ROOT, 'site'), out, { recursive: true });
const today = new Date().toISOString().slice(0, 10);
const urls = ['', 'toolbox/'];
fs.writeFileSync(path.join(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${base}${u}</loc><lastmod>${today}</lastmod></url>`).join('\n')}\n</urlset>\n`);
fs.writeFileSync(path.join(out, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${base}sitemap.xml\n`);
if (cname) fs.writeFileSync(path.join(out, 'CNAME'), cname + '\n');
const files = []; (function walk(d) { for (const f of fs.readdirSync(d, { withFileTypes: true })) f.isDirectory() ? walk(path.join(d, f.name)) : files.push(path.join(d, f.name)); })(out);
console.log(`built ${files.length} files, ${(files.reduce((s, f) => s + fs.statSync(f).size, 0) / 1048576).toFixed(2)} MB -> ${out}${cname ? ` (CNAME ${cname})` : ''}`);
