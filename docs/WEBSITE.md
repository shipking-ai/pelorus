# The Pelorus website

Source: [`site/`](../site) (plain HTML, CSS and JavaScript, no framework, no build step, no third-party requests). It has two parts:

| Page | What it is |
|---|---|
| `/` | The Pelorus project page: what the browser does, how to verify a download, an honest status list, and a teaser for the Toolbox. Includes a live "pelorus dial" in the hero (a sighting vane that follows your pointer; static under reduced motion). |
| `/toolbox/` | **The Pelorus Toolbox**: a searchable directory of open-source tools for building beautiful websites and landing pages (UI kits, CSS, animation, 3D/WebGL, charts, icons and fonts, frameworks and generators, landing-page templates and page builders, CMSs, design tools, accessibility/performance/testing, privacy-first analytics, hosting, editors, learning lists). Filter by category, licence class, language, stars, activity; export the current results as CSV; share a filtered view by URL. |

## What "every open-source tool" means here (and does not)
Nobody can list *every* open-source tool. The Toolbox is a wide, checkable net:
- **Hand-picked** entries: [`docs/toolbox/seed.txt`](toolbox/seed.txt), a list of well-known tools per category. Each is checked against the GitHub API when the data is built; names that do not exist are dropped and written to [`docs/toolbox/not-found.txt`](toolbox/not-found.txt).
- **Topic sweep**: GitHub topic searches (about 130, stars >= 2,000, top 100 per topic) add tools the hand-picked list does not name. These are **not reviewed by a person**; their category is a guess from the topic that found them.
- **Licence labels** use GitHub's detection. Only SPDX ids on the OSI-approved list are shown as *OSI-approved*; everything else says *check licence*, because "other", "no licence" and licences such as BSL/SSPL/Elastic are source-available, not open source.
- Stars are popularity, not quality or safety. GitHub-only, English topics, star floor: say so on the page (it does).
- Rebuild: `npm run toolbox` (needs an authenticated `gh`; takes about 15 minutes because of GitHub's search rate limit). Output: `site/assets/data/toolbox.json`.

## Work on it locally
```bash
npm ci
node scripts/build-site.js        # copies site/ to _site/ and writes sitemap.xml
npx --yes http-server site        # or any static server; open http://127.0.0.1:8080
npm run site:test                 # axe, responsive layout, filters, link and CSP checks, in real Chrome (CHROME_PATH=... if Chrome is not installed)
```

## Publishing (GitHub Pages)
`.github/workflows/pages.yml` runs the site tests on Ubuntu and, if they pass, force-pushes the built `_site/` to the **`gh-pages`** branch, which GitHub Pages serves. The address is controlled by two **repository variables**, so switching to a custom domain needs no code change:

| Variable | Meaning | Default |
|---|---|---|
| `SITE_BASE` | absolute URL written into `sitemap.xml` / `robots.txt` | `https://shipking-ai.github.io/pelorus/` |
| `SITE_CNAME` | custom domain written to the `CNAME` file | empty (none) |

## Getting `pelorus.js.org` (JS.ORG)
JS.ORG gives free `*.js.org` addresses to **GitHub Pages sites whose content is directly about the JavaScript ecosystem**. Its README (read 2026-10-18) is stricter than most summaries: "websites that merely use JavaScript... are not eligible", and the pull-request text must explain why the site *content* (not its code) is relevant to JavaScript developers. A browser project page alone would be a weak fit; the **Toolbox is what makes this request honest**: its content is the JavaScript and web-building ecosystem itself.

Steps (the order matters because a `CNAME` for a domain that does not resolve yet makes GitHub redirect the `github.io` address to a dead name):
1. The site is live at <https://shipking-ai.github.io/pelorus/> (this repository's `pages.yml`).
2. Open the pull request to [`js-org/js.org`](https://github.com/js-org/js.org) that adds **one line** to `cnames_active.js`, in alphabetical order: `"pelorus": "shipking-ai.github.io/pelorus",`. Use the description below (their bot checks its format and fails if either box is unticked, the URL line is missing, or the explanation is not in the required shape).
3. Right after opening the PR, set the repository variables `SITE_BASE=https://pelorus.js.org/` and `SITE_CNAME=pelorus.js.org` and re-run the "Website" workflow, so the `gh-pages` branch contains the `CNAME` file JS.ORG checks. Then, in the repository's **Settings → Pages**, the custom domain shows as `pelorus.js.org` (DNS check pending until the PR is merged; GitHub enforces HTTPS afterwards).
4. When the PR is merged, the domain goes live within about a day. If it is declined, revert the two variables; the site keeps working at the `github.io` address. JS.ORG's own fallback advice, if the content is judged not JavaScript-related, is another free developer domain service.

Terms worth knowing (js.org/terms.html): you are responsible for the content and for checking that the name does not infringe third-party rights, including trade marks (see [TRADEMARK.md](TRADEMARK.md)); no file or image hosting; they can remove the domain at any time with 7 days' notice.

### Status (2026-10-18)
- The site is **live** at <https://shipking-ai.github.io/pelorus/>; checked over the real URL: no console errors, no third-party requests, no serious/critical axe violations, 2,802 tools loaded.
- `pelorus` is **not restricted**, **not already requested** (searched JS.ORG pull requests) and **not in** `ns_active.js`/`records_restricted.js`.
- The one-line change was inserted in alphabetical order (between `pekanbaru` and `pencil`) into a copy of the current `cnames_active.js` and **JS.ORG's own validator** (`js-org/js.org-cleanup --validate`, run with `npm ci --ignore-scripts` in an isolated folder) reports "Validation completed" for both the original and the changed file.
- **Not done yet: opening the pull request.** It publishes a request in the owner's name and means accepting JS.ORG's terms, so it waits for an explicit "yes" (see OWNER-STEPS.md).

### Pull request description (copy exactly; the bot parses it)
```
- [x] There is reasonable content on the page (see: [No Content](https://github.com/js-org/js.org/wiki/No-Content))
- [x] I have read and accepted the [Terms and Conditions](http://js.org/terms.html)
- The site content can be seen at https://shipking-ai.github.io/pelorus/

> The site content is the Pelorus Toolbox, a searchable directory of open-source JavaScript, CSS and web-building libraries, frameworks, templates and page builders with licences and activity checked against GitHub, plus the project page of Pelorus, an open-source browser written in JavaScript on Electron. It is relevant to JavaScript developers specifically because the directory's content is the JavaScript ecosystem itself (UI libraries, bundlers, animation and 3D libraries, frameworks, test and accessibility tools), and its data is built by a Node.js script that readers can run to verify every entry.
```
