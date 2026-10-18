// SPDX-License-Identifier: GPL-3.0-or-later
// Builds site/assets/data/toolbox.json for the Pelorus website's "Toolbox" page.
//
//   1. CURATED: every owner/repo in docs/toolbox/seed.txt is verified against the GitHub API (exists, stars, licence,
//      last push, archived). Names that do not resolve are listed in docs/toolbox/not-found.txt and dropped.
//   2. SWEEP: GitHub topic searches (one per topic below, stars >= MIN_STARS, top 100 per topic, `gh search repos`)
//      add tools the curated list does not name. Sweep entries are marked unreviewed.
//   3. Every entry is classified by licence: "OSI-approved" only for SPDX ids on the OSI list below; everything else
//      (other, NOASSERTION, none, source-available, Creative Commons for code, ...) is shown as "check the licence".
//
// Usage: node scripts/build-toolbox.js [--no-sweep] [--no-verify] [--merge]      (needs an authenticated `gh`)
//   --merge  start from the existing toolbox.json, skip the sweep, and only verify seed names that are not in it yet
//            (fast way to add or correct a few seed entries without repeating the 15-minute sweep)
// Honest limits are written into the JSON ("method") and shown on the page: this is a wide net, not "every" tool.
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'site', 'assets', 'data', 'toolbox.json');
const SEED = path.join(ROOT, 'docs', 'toolbox', 'seed.txt');
const MIN_STARS = 2000;
const SLEEP = (ms) => new Promise((r) => setTimeout(r, ms));
const argv = new Set(process.argv.slice(2));

const CATEGORIES = [
  { id: 'ui', title: 'UI components & design systems', blurb: 'Buttons to data grids: ready-made, accessible building blocks.' },
  { id: 'css', title: 'CSS frameworks & tooling', blurb: 'Utility-first, classless, CSS-in-JS and the plumbing around them.' },
  { id: 'motion', title: 'Animation, motion & scroll', blurb: 'Transitions, scroll effects, Lottie, spring physics.' },
  { id: 'creative', title: '3D, WebGL & creative coding', blurb: 'Three.js and friends: scenes, shaders, physics, canvas, audio.' },
  { id: 'dataviz', title: 'Charts, maps & diagrams', blurb: 'From a sparkline to a graph of a million nodes.' },
  { id: 'icons', title: 'Icons, illustrations & fonts', blurb: 'Open icon sets and typefaces you can ship without a licence headache.' },
  { id: 'frameworks', title: 'Frameworks, generators & build tools', blurb: 'The engines under a site: SSGs, meta-frameworks, bundlers.' },
  { id: 'landing', title: 'Landing pages, templates & page builders', blurb: 'Starters, section kits, visual editors and email/forms tooling.' },
  { id: 'cms', title: 'CMS, content & backends', blurb: 'Headless and traditional content systems, auth and databases.' },
  { id: 'design', title: 'Design tools, tokens & docs', blurb: 'Design in the open: Penpot, Storybook, colour science, tokens.' },
  { id: 'quality', title: 'Accessibility, performance & testing', blurb: 'Audit it, test it, lint it, measure it, make it fast.' },
  { id: 'analytics', title: 'Privacy-first analytics & uptime', blurb: 'Know your traffic without surveilling your visitors.' },
  { id: 'hosting', title: 'Hosting & deployment', blurb: 'Self-hostable platforms and deploy tooling.' },
  { id: 'devtools', title: 'Editors, devtools & browsers', blurb: 'Where you write it and the engines it runs in.' },
  { id: 'learning', title: 'Learning, references & lists', blurb: 'Docs, roadmaps and the awesome-lists worth bookmarking.' },
];

const TOPICS = {
  ui: ['ui-components', 'component-library', 'design-system', 'react-components', 'vue-components', 'svelte-components', 'web-components', 'headless-ui', 'ui-kit', 'tailwind-components', 'ui-library'],
  css: ['css-framework', 'tailwindcss', 'sass', 'postcss', 'css-in-js', 'utility-css', 'css-library', 'css-animations'],
  motion: ['animation', 'animation-library', 'motion', 'scroll-animation', 'parallax', 'lottie', 'page-transitions', 'smooth-scroll', 'gsap', 'framer-motion', 'transitions'],
  creative: ['threejs', 'webgl', 'creative-coding', 'canvas', 'shaders', 'generative-art', 'particles', 'p5js', 'game-engine', 'svg-animation', 'webgpu', 'physics-engine'],
  dataviz: ['data-visualization', 'charts', 'chart-library', 'dataviz', 'd3', 'graph-visualization', 'diagrams', 'maps', 'visualization'],
  icons: ['icons', 'icon-library', 'svg-icons', 'icon-font', 'fonts', 'typeface', 'open-source-fonts', 'illustrations', 'icon-pack'],
  frameworks: ['static-site-generator', 'jamstack', 'javascript-framework', 'meta-framework', 'frontend-framework', 'bundler', 'build-tool', 'vite', 'documentation-generator', 'ssg', 'web-framework', 'markdown'],
  landing: ['landing-page', 'landing-page-template', 'website-template', 'saas-template', 'saas-starter', 'page-builder', 'website-builder', 'drag-and-drop', 'visual-editor', 'no-code', 'email-template', 'html-template', 'nextjs-template', 'astro-template', 'tailwind-template', 'startup-template', 'portfolio-template'],
  cms: ['headless-cms', 'cms', 'content-management-system', 'backend-as-a-service', 'ecommerce'],
  design: ['storybook', 'design-tokens', 'figma', 'color-palette', 'design-tools', 'prototyping', 'typography', 'color-picker'],
  quality: ['accessibility', 'a11y', 'web-performance', 'lighthouse', 'seo', 'core-web-vitals', 'linter', 'formatter', 'e2e-testing', 'visual-regression-testing', 'image-optimization'],
  analytics: ['web-analytics', 'privacy-analytics', 'ab-testing', 'feature-flags', 'uptime-monitoring', 'cookie-consent'],
  hosting: ['self-hosted-paas', 'deployment', 'paas', 'static-hosting', 'reverse-proxy', 'github-pages'],
  devtools: ['code-editor', 'web-editor', 'devtools', 'browser-devtools', 'online-ide', 'code-playground', 'browser-engine'],
  learning: ['awesome', 'web-development', 'html5', 'web-design', 'frontend-development', 'roadmap', 'css-tricks'],
};

// SPDX keys as GitHub reports them (lower case) for licences the Open Source Initiative has approved.
const OSI = new Set(['mit', 'apache-2.0', 'bsd-2-clause', 'bsd-3-clause', 'isc', 'mpl-2.0', 'gpl-2.0', 'gpl-3.0', 'lgpl-2.1', 'lgpl-3.0', 'agpl-3.0', '0bsd', 'zlib', 'unlicense', 'epl-1.0', 'epl-2.0', 'cddl-1.0', 'artistic-2.0', 'bsl-1.0', 'ofl-1.1', 'ms-pl', 'ms-rl', 'eupl-1.2', 'postgresql', 'ncsa', 'afl-3.0', 'osl-3.0', 'ecl-2.0', 'upl-1.0', 'apache-1.1', 'bsd-3-clause-lbnl']);

const gh = (args) => JSON.parse(execFileSync('gh', args, { encoding: 'utf8', maxBuffer: 128 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] }));
const clean = (s) => String(s || '').replace(/[\t\r\n]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 140);
const ym = (iso) => String(iso || '').slice(0, 7);

function readSeed() {
  const items = []; let cat = null;
  for (const raw of fs.readFileSync(SEED, 'utf8').split(/\r?\n/)) {
    const t = raw.trim(); if (!t) continue;
    const m = t.match(/^# --- ([a-z]+) \|/); if (m) { cat = m[1]; continue; }
    if (t.startsWith('#')) continue;
    if (!/^[\w.-]+\/[\w.-]+$/.test(t)) continue;
    items.push({ repo: t, cat });
  }
  return items;
}

async function main() {
  const entries = new Map(); // lower-case full name -> record
  const notFound = [];
  const merging = argv.has('--merge') && fs.existsSync(OUT);
  if (merging) {
    for (const r of JSON.parse(fs.readFileSync(OUT, 'utf8')).items) entries.set(r[0].toLowerCase(), { n: r[0], s: r[1], l: r[2], p: r[3], g: r[4], a: r[5], c: r[6], k: r[7], d: r[8] });
    argv.add('--no-sweep');
  }

  // ---- 1. curated, verified one by one ---------------------------------------------------------------------
  const seed = readSeed();
  const seen = new Set();
  let n = 0;
  if (!argv.has('--no-verify')) {
    for (const { repo, cat } of seed) {
      const key = repo.toLowerCase(); if (seen.has(key)) continue; seen.add(key);
      if (merging && entries.has(key)) { const e = entries.get(key); e.k = 1; e.c = cat; continue; }
      n++;
      try {
        const j = gh(['api', `repos/${repo}`, '--jq', '{full_name,stargazers_count,description,pushed_at,archived,language,license:(.license.key // ""),fork}']);
        entries.set(j.full_name.toLowerCase(), { n: j.full_name, s: j.stargazers_count, l: j.license || '', p: ym(j.pushed_at), g: j.language || '', a: j.archived ? 1 : 0, c: cat, k: 1, d: clean(j.description) });
      } catch (e) {
        const msg = String(e.stderr || e.message);
        if (/404|Not Found/.test(msg)) notFound.push(repo); else notFound.push(`${repo}  (error: ${msg.split('\n')[0].slice(0, 80)})`);
      }
      if (n % 50 === 0) console.log(`verified ${n}/${seed.length}`);
    }
  }

  // ---- 2. topic sweep ------------------------------------------------------------------------------------------
  const hits = new Map(); // key -> Map(category -> count)
  let queries = merging ? (JSON.parse(fs.readFileSync(OUT, 'utf8')).meta.sweepQueries || 0) : 0; // merge mode keeps the earlier sweep's count
  if (!argv.has('--no-sweep')) {
    for (const [cat, topics] of Object.entries(TOPICS)) {
      for (const topic of topics) {
        queries++;
        let rows = [];
        try { rows = gh(['search', 'repos', '--topic', topic, `--stars=>=${MIN_STARS}`, '--limit', '100', '--sort', 'stars', '--json', 'fullName,description,stargazersCount,license,pushedAt,isArchived,language']); }
        catch (e) { console.log(`sweep ${topic}: ${String(e.stderr || e.message).split('\n')[0].slice(0, 90)}`); await SLEEP(8000); }
        for (const r of rows) {
          const key = r.fullName.toLowerCase();
          const h = hits.get(key) || new Map(); h.set(cat, (h.get(cat) || 0) + 1); hits.set(key, h);
          if (!entries.has(key)) entries.set(key, { n: r.fullName, s: r.stargazersCount, l: (r.license && r.license.key) || '', p: ym(r.pushedAt), g: r.language || '', a: r.isArchived ? 1 : 0, c: null, k: 0, d: clean(r.description) });
        }
        await SLEEP(2300);
      }
      console.log(`swept ${cat} (queries so far ${queries}, unique repos ${entries.size})`);
    }
    for (const [key, rec] of entries) {
      if (rec.c) continue;
      const h = hits.get(key); if (!h) continue;
      rec.c = [...h.entries()].sort((a, b) => b[1] - a[1] || Object.keys(TOPICS).indexOf(a[0]) - Object.keys(TOPICS).indexOf(b[0]))[0][0];
    }
  }

  const items = [...entries.values()].filter((r) => r.c).sort((a, b) => b.k - a.k || b.s - a.s);
  const count = (f) => items.filter(f).length;
  const meta = {
    generated: new Date().toISOString().slice(0, 10),
    curatedSeed: seed.length, curatedVerified: count((r) => r.k), curatedNotFound: notFound.length,
    sweepQueries: queries, sweepMinStars: MIN_STARS, total: items.length,
    osi: count((r) => OSI.has(r.l)), notOsiOrUnknown: count((r) => !OSI.has(r.l)), archived: count((r) => r.a),
    method: `Curated entries (${count((r) => r.k)}) are tools I chose as well known for their category; each was checked against the GitHub API on ${new Date().toISOString().slice(0, 10)}. Sweep entries come from ${queries} GitHub topic searches (stars >= ${MIN_STARS}, top 100 per topic) and were NOT reviewed by a person. Categories for sweep entries are guessed from the topic that found them. Licence labels use GitHub's detection: only SPDX ids on the OSI-approved list are shown as OSI-approved; "other", "no licence" and anything else means: read the licence yourself (some are source-available, not open source). Stars are a popularity signal, not quality or safety. This is a wide net, not every tool: GitHub-only, English topics, a star floor, and 100 results per topic.`,
  };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  const compact = { meta, categories: CATEGORIES, osi: [...OSI], items: items.map((r) => [r.n, r.s, r.l, r.p, r.g, r.a, r.c, r.k, r.d]) };
  fs.writeFileSync(OUT, JSON.stringify(compact));
  fs.writeFileSync(path.join(ROOT, 'docs', 'toolbox', 'not-found.txt'), notFound.join('\n') + '\n');
  console.log(`wrote ${OUT}: ${items.length} entries (${meta.curatedVerified} curated, ${meta.osi} OSI-approved), ${notFound.length} seed names not found`);
}
main().catch((e) => { console.error(e); process.exit(1); });
