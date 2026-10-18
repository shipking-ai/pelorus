# Pelorus — handoff

**Written:** 2026-10-13 (updated later the same day) · **Covers work from:** 2026-10-11 to 2026-10-13 · **Version:** 0.3.0 (pre-release, Windows primary, unsigned)

This file is for anyone picking the project up: what exists, how to run and verify it, what was learned the hard way, and exactly what is left. It states what was **measured** and what was only **reasoned**. When this file and a deeper document disagree, trust the deeper document and fix this one. Every claim here points at a file that holds the evidence.

---

## 1. TL;DR

* **Pelorus** is an open-source, privacy-focused desktop browser built on **Electron 44.7.0 (Chromium 152.0.7977.130, Node 24.21.0)**, with workspaces, vertical tabs, a command palette, local-only suggestions, tracker blocking, HTTPS-first, a permission broker, safe downloads, sleeping tabs, split view and lazy session restore. Licence: **GPL-3.0-or-later**.
* **It works and is tested:** 73 unit tests (including seeded fuzzing of the input-handling code) and 55 end-to-end tests (53 pass; 2 are informational "todo" quit-timing tests, see DECISIONS.md bug 14) run on Windows in CI and locally. On **Ubuntu** (xvfb) and **macOS (arm64)** the same 73 + 55 passed in the most recent full CI run (Ubuntu and macOS are an informational CI job, not a required check). One macOS oddity remains: after `a11y.test.js` the app did not exit when asked (20 s timeout in the test helper); no other test file shows it. `npm audit` shows 0 vulnerabilities; the packaged build and the installer build and launch.
* **It is not releasable yet.** Missing, in order of importance: a code-signing certificate, a public repository, an installer and auto-update, a screen-reader pass, a real third-party security review, and anything other than Windows verification. See §9.
* **Nothing about it is "completely secure" or "completely private"**, and no document claims that. Known gaps are in [docs/SECURITY.md](docs/SECURITY.md).
* **A catalog of 772 open-source browser-related projects** was built and classified, with its blind spots written down ([docs/research/CATALOG.md](docs/research/CATALOG.md), [SWEEP.md](docs/research/SWEEP.md)). "Every possible project" is not achievable and is not claimed.
* **The biggest trap found:** Playwright-driven runs make background tabs look visible, which inflated the first memory benchmark by about 30%. **Never take memory, CPU or timing numbers from Playwright runs** (§8).

---

## Name history

The project was called **Nadir** until 2026-10-13 and is now **Pelorus** (a pelorus is the sighting instrument that gives the bearing of an object relative to a ship's heading). The rename was forced by a trademark search (see [docs/TRADEMARK.md](docs/TRADEMARK.md)). What changed: product and window title, the internal page scheme `nadir://` -> `pelorus://`, the preload API `window.nadir` -> `window.pelorus`, the IPC prefix, the `NADIR_*` environment variables -> `PELORUS_*`, the npm package (`pelorus-browser`), the installer and exe names, and the GitHub repository (`shipking-ai/nadir` -> `shipking-ai/pelorus`; GitHub redirects the old address). Not changed: the git history, [DECISIONS.md](docs/DECISIONS.md) entries written before the rename, the trademark records, the research data files, `docs/screenshots/` (they still show the old name) and the two published releases v0.1.0/v0.2.0 (files named `Nadir-*`, verified with the old repository name, see [RELEASE.md](docs/RELEASE.md)). **Profiles created by Nadir builds are not migrated** (pre-release, no known users). The first release under the new name is [v0.3.0](https://github.com/shipking-ai/pelorus/releases/tag/v0.3.0) (pre-release, unsigned).

---

> **Next actions for the owner are in [docs/OWNER-STEPS.md](docs/OWNER-STEPS.md)** (exact, ordered steps).

## 2. Quick start

Prerequisites: Windows 11, Node.js (the project was developed on v26.8.2), Git Bash or PowerShell. For some scripts also: Google Chrome installed at `C:\Program Files\Google\Chrome\Application\chrome.exe` (benchmark comparison), and the GitHub CLI `gh` logged in (research scripts only; GitHub search is limited to 30 requests per minute).

```bash
npm install
npm start                 # run the browser from source
npm test                  # 73 unit tests incl. fuzzing, about 10 s
npm run test:e2e          # 55 end-to-end tests, about two minutes; tls.test.js needs internet and skips offline
npm run audit             # npm audit --omit=dev
npm run package           # builds out/Pelorus-win32-x64/
node scripts/verify-package.js      # launches the packaged build like a user would
node scripts/bench.js --tabs 10 --runs 3   # Pelorus vs installed Chrome (takes several minutes, writes docs/benchmarks/)
node scripts/license-inventory.js   # regenerates docs/LICENSE-INVENTORY.md
node scripts/build-catalog.js       # regenerates docs/research/CATALOG.md from the research data
npm run package:signed    # package + Authenticode sign; fails with exit code 2 until a certificate is configured (docs/RELEASE.md)
```

Environment variables the app reads (all are for tests/benchmarks; none is needed by a normal user):

| Variable | Effect |
|---|---|
| `PELORUS_USER_DATA` | profile directory (tests use temp dirs) |
| `PELORUS_TEST=1` | exposes `global.__pelorus` (the controller) to the test harness. **Absent in packaged builds and benchmarks.** |
| `PELORUS_OFFLINE=1` | skip the filter-list network refresh |
| `PELORUS_HEADLESS=1` | keep the window hidden |
| `PELORUS_DOWNLOAD_DIR` | fixed download folder (honoured only with the test hook) |

---

## 3. Repository map

```
LICENSE                      GPL-3.0 text (canonical, from gnu.org; SHA-256 3972dc97…6986)
README.md                    entry point, honest status
HANDOFF.md                   this file
package.json                 scripts; deps: @ghostery/adblocker-electron(+preload) 2.20.1 only
src/
  main/                      the privileged process
    main.js                  app bootstrap: privileged pelorus:// scheme, sandbox, single instance, test hook
    controller.js            window, overlay view, layout, palette/find/prompts, native menus, settings side effects
    tab-manager.js           tabs, workspaces, sleeping, split view, session save/restore (lazy)
    tab-host.js              THE ONLY module that touches WebContents (engine seam, see ADR-0001)
    ipc.js                   every IPC handler; each re-validates event.sender and senderFrame
    store.js                 node:sqlite (FTS5) history, bookmarks, settings, permissions, block stats
    blocker.js               Ghostery engine wrapped by our own webRequest handler; HTTPS-first; param stripping; GPC
    permissions.js           pure policy function (deny by default)
    downloads.js             safe filenames, risk classes, never launches executables
    sessions.js              per-workspace partitions, UA cleanup, secure-DNS config
    protocol.js              pelorus:// file server (host allowlist, traversal-safe, strict CSP)
    suggest.js, error-page.js
    updates.js               user-initiated "is there a newer release?" check (semver compare, fixed URL, no download)
  shared/                    pure code, unit-tested: urls.js, shortcuts.js, fuzzy.js, filenames.js
  ui/                        shell/ (tabs+toolbar), overlay/ (omnibox dropdown, palette, find, prompts), newtab/, app/ (history, bookmarks, downloads, privacy, settings, about); assets/ has CSS, JS and the two preloads
test/
  unit/                      plain node:test, 5 files
  e2e/                       Playwright-driven real-app tests (helpers.js), plus:
    plain.js                 un-attached launcher (CDP to the shell page only). USE THIS FOR ANY MEASUREMENT.
    a11y.test.js             axe-core scan of every pelorus:// page and the browser chrome
    tls.test.js              badssl.com certificate-error tests (internet; skips offline)
    background.test.js       background tabs are hidden and render 0 frames
    favicon.test.js          favicons are fetched by the main process via the tab session; UI CSP blocks http(s) images
    quit.test.js             app exits promptly, also after accessibility mode was used
    (test/site/site.test.js: 18 tests for the website in real Chrome: axe in both themes, no third-party requests, 360 px layout, Toolbox filters, links, CSP)
    updates.test.js          update-check button: no request until pressed, newer/up-to-date/error paths
scripts/                     make-installer.js (Squirrel installer), launch-probe.js (can the app start here?), bench.js, proctree.ps1, sign.ps1, verify-package.js, smoke.js, live-demo.js, capture-window.ps1,
                             license-inventory.js, mem-breakdown.js, and the research pipeline (discover*.js, verify-repos.js,
                             triage-discovery.js, build-catalog.js, catalog-classification.js, catalog-additions.js)
site/                        the public website (index.html, toolbox/, assets/) and the Toolbox data (assets/data/toolbox.json); docs/WEBSITE.md
.github/                     workflows/ci.yml, workflows/release.yml (tag-triggered; builds, tests, attests, publishes), dependabot.yml
docs/                        TRADEMARK, ACCESSIBILITY, CODE-SIGNING-POLICY, ARCHITECTURE, SECURITY, DESIGN, PERFORMANCE, ROADMAP, FEATURE-MATRIX, SIGNATURE-FEATURES, LICENSES,
                             LICENSE-INVENTORY, DECISIONS, RELEASE, adr/0001-architecture.md, research/, benchmarks/, screenshots/
out/                         build output (git-ignored, about 374 MB)
```

The project is **not** a git repository in this checkout (`Is a git repository: false`). Initialise one before publishing; `.gitignore` already lists `node_modules/`, `out/`, `.smoke/`, `*.log`.

---

## 4. Architecture in one page (full version: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/adr/0001-architecture.md](docs/adr/0001-architecture.md))

* **Foundation:** Chromium through Electron, chosen after comparing four options (Chromium fork, alternative engine, OS-webview framework, Electron). Building Chromium or Gecko from source was infeasible here (no cmake/ninja, 100+ GB, hours per build, permanent rebase burden). The ADR lists *revisit triggers* (for example Ladybird shipping a Windows alpha, or Electron falling too far behind Chromium).
* **Engine seam:** only `tab-host.js` touches `WebContents`. Keep it that way; it is what makes a future engine swap possible.
* **Each tab** is a `WebContentsView`; each **workspace** is its own Chromium partition (`persist:ws-<id>`); **private tabs** use a memory-only partition; internal pages use `persist:pelorus-internal`.
* **Internal pages** are served from a privileged `pelorus://` scheme (hosts `shell`, `overlay`, `newtab`, `app`, `assets`) with a strict CSP (no inline script or style, `connect-src 'none'`). Navigating between an internal and a web page **swaps the renderer** so web content never inherits an internal preload.
* **Renderers** are sandboxed and context-isolated. Web tabs have **no preload and no IPC**. The two privileged preloads expose an allowlisted API; `ipc.js` re-checks the sender and that the call came from the main frame, per channel.
* **Data:** `node:sqlite` with FTS5 (Electron's built-in Node 24.21.0; stability tier "release candidate", re-check on Electron upgrades). All SQL is parameterised; full-text queries are tokenised and quoted.
* **Privacy features:** Ghostery adblocker (MPL-2.0) for network and cosmetic filtering, wrapped in our own `webRequest` handler (HTTPS-first upgrade with an explicit HTTP fallback page, tracking-parameter stripping, per-tab block counters), Global Privacy Control header, user agent without Electron/app tokens, deny-by-default permission broker (prompt per workspace + origin + permission; cross-origin subframes never prompt). Filter lists are downloaded at runtime from Ghostery's CDN, not bundled.

### Invariants — do not break these without a deliberate decision

1. Web tab renderers get **no** preload, **no** IPC and **no** Node.
2. Every IPC handler validates `event.sender` and `senderFrame === mainFrame` for its own channel group.
3. Page-derived text (titles, URLs) reaches the UI via `textContent`, never `innerHTML`.
4. Certificate errors have **no** "proceed anyway".
5. Nothing launches a downloaded executable.
6. Suggestions never leave the machine.
7. Settings go through per-key validators using `Object.hasOwn`.
8. `tab-host.js` stays the only `WebContents` consumer.

---

## 5. What was done (chronological summary)

| Stage | Result | Evidence |
|---|---|---|
| Research | Primary-source ledger of engines, shells, blockers and tools, with confidence levels (V = verified that day, S = secondary, M = from memory) | [docs/research/LEDGER.md](docs/research/LEDGER.md) |
| Architecture | Four options scored; Electron chosen behind a replaceable seam | [ADR-0001](docs/adr/0001-architecture.md), [DECISIONS.md](docs/DECISIONS.md) |
| Implementation | 0.1.0 as described in §1 | `src/`, [FEATURE-MATRIX.md](docs/FEATURE-MATRIX.md) |
| Tests | 73 unit + 55 e2e, see section 7 | `test/` |
| Security review | Threat model T1–T13, each mapped to a test; Electron linter run (1 real finding fixed, dead code removed) | [SECURITY.md](docs/SECURITY.md) |
| Design system | Name, logo, tokens, light/dark themes | [DESIGN.md](docs/DESIGN.md), `docs/screenshots/` |
| Benchmarks | Pelorus vs Chrome 154, two runs, corrected method | [PERFORMANCE.md](docs/PERFORMANCE.md) |
| Packaging | Windows x64 build, smoke-verified, licences shipped | `npm run package`, `verify-package.js` |
| Wide discovery sweep | 772 classified projects; method and blind spots | [CATALOG.md](docs/research/CATALOG.md), [SWEEP.md](docs/research/SWEEP.md) |
| Licence | GPL-3.0 text added, shipped in packages | [LICENSES.md](docs/LICENSES.md) |
| Accessibility | axe-core scan wired into e2e; 3 serious/critical issues in the browser chrome fixed | `test/e2e/a11y.test.js`, `docs/benchmarks/a11y-axe-latest.json` |
| TLS | badssl.com tests for 4 bad-certificate cases and 1 valid | `test/e2e/tls.test.js` |
| Benchmark correction | Found that Playwright inflated memory; rewrote method; added a regression test | PERFORMANCE.md "Correction", `test/e2e/background.test.js` |
| Signing pipeline | Script written and tested with a throwaway certificate on a copy | [RELEASE.md](docs/RELEASE.md), `scripts/sign.ps1` |

The original request was a 10-phase brief (research, scored catalog, architecture comparison, design system, signature features, security/licensing, performance targets, build and test, QA matrix, final deliverables). All ten have a document or artefact; the honest gaps are listed in §9.

---

## 6. Measured results and their limits

Machine: Intel i9-10980HK, 31.9 GB, Windows 11 (10.0.26300). One machine, noisy desktop. Details and raw JSON in [PERFORMANCE.md](docs/PERFORMANCE.md).

| Metric | Result | Target | Status |
|---|---|---|---|
| Private memory, 1 tab | 313–322 MB (one outlier 414 MB) vs Chrome 321–351 MB | within ±10% of Chrome | parity |
| Private memory, 11 same-origin tabs | 695 MB / 710 MB vs Chrome 628 MB / 766 MB (ratios 1.11 and 0.93) | ≤ 1.2× | met in 2 runs; not a general claim |
| Memory after sleeping 10 tabs | 446 MB / 409 MB (1.4× / 1.27× the 1-tab figure) | ≤ 1.3× | missed in run 1, met in run 2 |
| Tab switch p95 | 16.3 ms / 6.1 ms | < 16 ms | missed by 0.3 ms in run 1, met in run 2 |
| Suggestions over 5,000 history rows, p95 | 2.9 / 3.4 ms | < 20 ms | met |
| Session restore, 11 tabs | 644 / 737 ms, 1 tab loaded | ≤ 1.0 s | met |
| Start to first tab | 614–791 ms | ≤ 1.0 s | met, but **not the same milestone as Chrome's** 680–750 ms (debug port answering) |
| Idle CPU, 11 tabs | 4.19% / 0.27% vs Chrome 4.57% / 47.95% | ≤ Chrome | **unusable**: too noisy |
| Codecs | H.264, AAC, VP9, AV1, Opus, MP3 yes; **Widevine absent** | | measured by an e2e probe |

The numbers above are single runs on one machine without confidence intervals. The earlier "1.45× Chrome, target missed" was wrong (see §8).

---

## 7. Tests: how they work and how to extend them

* **Unit** (`test/unit`): plain `node:test`; covers URL resolution, store (FTS5), shortcuts, error page, filenames, fuzzy matching, the `pelorus://` server, CSP and traversal.
* **E2E** (`test/e2e`): `helpers.js` launches the real app via Playwright against an isolated profile, with the `PELORUS_TEST` hook and a local server that has routes for cookies, headers, codecs, downloads and so on. Run with `--test-concurrency=1`; each file starts its own app.
* **Conventions that cost real time to learn:**
  * Send keyboard shortcuts with `webContents.sendInputEvent`, **not** Playwright keys (CDP-synthesised keys bypass Electron's `before-input-event`).
  * Launch with `colorScheme: null`; otherwise Playwright emulates a colour scheme and focus and gives false observations.
  * `page.evaluate` runs with no `require`; to test raw IPC rejection, use a throwaway `BrowserWindow` with a raw `ipcRenderer` (see the "IPC trust boundaries" test).
  * Use `noWaitAfter` on clicks that start navigation, or a 30 s timeout fires.
  * To eval strings against the controller use `b.ctl('<single expression>')`; statements with `;` fail because it wraps the code in `return (…)`.
  * A test that passes in 10 ms probably tested nothing. `tls.test.js` first passed vacuously because the previous test's error page was still showing; each test now waits for its own host.
* **Do not use Playwright for measurements.** Use `test/e2e/plain.js` (`launchPlain`): it starts Pelorus without the test hook and talks CDP to the shell page only.
* **Screenshots:** capture per window by HWND with `scripts/capture-window.ps1`. Never capture the whole desktop (an early capture included unrelated windows and was deleted).
* **Not covered by tests** (from [FEATURE-MATRIX.md](docs/FEATURE-MATRIX.md)): secure-DNS encryption, find-in-page matching, native menus and dialogs, OAuth popups, fullscreen video, the timer-driven auto-sleep path, clear-on-exit, light/dark by assertion, screen-reader behaviour, any non-Windows platform.

---

## 8. Lessons and traps (read before touching benchmarks or the test harness)

1. **Playwright makes background tabs "visible".** It attaches to every tab renderer; while attached, `document.visibilityState` is `visible`, `requestAnimationFrame` runs at 60 Hz and timers are unthrottled in tabs that are not on screen, and the GPU process grows by roughly 31 MB per tab. The first benchmark therefore reported 912 MB vs Chrome's 629 MB. Without it, the same build used 695–710 MB. I had even written an untested "root cause" (per-tab renderer processes) into the docs; it was wrong and has been corrected in [PERFORMANCE.md](docs/PERFORMANCE.md) and the ADR. Rule: *measure only through `plain.js`; treat any number from a Playwright run as functional evidence only.*
2. **The benchmark compares unlike milestones for startup.** Say so whenever quoting it.
3. **`scripts/mem-breakdown.js` is Playwright-driven**, so use it to see *which process type* grows (it shows the GPU process dominating), never for absolute numbers.
4. **GitHub search returns at most 1,000 results per query**, and the main discovery sweep used a 150-star floor. Both limits are recorded in [SWEEP.md](docs/research/SWEEP.md).
5. **Do not trust remembered repository names.** 89 of my 539 seed entries returned 404; 29 of the 30 I retried were just misspelled. The catalog lists every miss.
6. **Line endings:** several source files use CRLF; scripted edits that match multi-line strings must normalise `\r\n` first.
7. **Windows PowerShell 5.1 specifics:** `Get-PfxCertificate` has no `-Password`; use the .NET `X509Certificate2` constructor (done in `sign.ps1`). `New-Item`/`Remove-Item` on `Cert:` and `Env:` paths can be blocked by the sandbox; use the .NET store API and `$env:X = $null`.
8. **`rm -rf` of a sibling directory was blocked by the safety check.** A leftover folder `C:\.dl-gpl` (holds a duplicate of the licence text from the download step) still exists; it is safe to delete by hand.
9. **Electron's packaged `Pelorus.exe` is unsigned** (re-branding invalidates Electron's own signature), and the packaged root `LICENSE` is Electron's, which is why the GPL text is shipped as `resources/LICENSE`.

---

## 9. What still needs to be done

Ordered by how much each item blocks a public release. "Exit" is what must be demonstrably true before the item counts as done.

### P0 — release blockers (mostly need a human or an account)

| # | Item | Why it is not done | Exit |
|---|---|---|---|
| 1 | **Code-signing certificate** | Owner decision (2026-10-13): apply to the free SignPath Foundation programme. All application material and the policy/privacy pages are prepared ([docs/SIGNPATH-APPLICATION.md](docs/SIGNPATH-APPLICATION.md), [docs/PRIVACY.md](docs/PRIVACY.md), README sections); the form must be submitted by the owner (reCAPTCHA, consent). SignPath requires a "verifiable reputation", so a rejection or "come back later" is likely. Paid fallbacks are in OWNER-STEPS.md. | `npm run package:signed` or the SignPath-based release workflow yields `Get-AuthenticodeSignature` status `Valid` on a clean machine |
| 2 | ~~Code-signing policy page, tagged releases, CI build~~ **Done 2026-10-13** | Public repo <https://github.com/shipking-ai/pelorus>; private vulnerability reporting enabled; CI and release workflows in `.github/workflows/`; [CODE-SIGNING-POLICY.md](docs/CODE-SIGNING-POLICY.md); pre-releases [v0.1.0](https://github.com/shipking-ai/pelorus/releases/tag/v0.1.0) , [v0.2.0](https://github.com/shipking-ai/pelorus/releases/tag/v0.2.0) and [v0.3.0](https://github.com/shipking-ai/pelorus/releases/tag/v0.3.0) (zip + installer, checksums, SBOM, verified provenance attestations). Still unsigned. | (met) |
| 3 | **Installer: done. Auto-update: deliberately NOT built.** | A per-user Squirrel installer is built by `npm run installer` and attached to releases; install, first launch and uninstall were exercised on Windows (uninstall left 3 files under LocalAppData that I deleted by hand). Instead of silent auto-update, the About page has a user-initiated "Check for updates" that reads the public release list. Reason: an automatic installer for an UNSIGNED browser is a channel for pushing unsigned code to users; build it only after code signing exists and the update integrity story (signature verification, not just TLS) is designed. | signed releases first, then an update design review |
| 4 | **Trademark: the former name Nadir was NOT clear; renamed to Pelorus** | USPTO search on 2026-10-13 found two live pending applications near the old name's field (standard-character NADIR, class 042, Notice of Allowance issued 2026-06-02; NADIRROC, classes 009/042). The project was renamed to Pelorus; a search for the new name found no LIVE mark in classes 009 or 042 (only dead ones), but did find live marks for Pelorus in wine, medical services, building materials, consulting, finance and shipping. Details in [docs/TRADEMARK.md](docs/TRADEMARK.md). US register only; not legal advice; no attorney has reviewed either name. | an attorney opinion for Pelorus before a wide launch; check EUIPO/WIPO/UK if shipping there |
| 5 | **Third-party security review** | Cannot be done by the project itself. Seeded fuzzing of URL resolution, filenames, the pelorus:// resolver, history search, permission policy and error-page escaping was added and found 5 real bugs (fixed). That is the project testing itself, not an independent review. | an external review before any claim of security assurance |
| 6 | **Chromium patch lag** | Electron 44.7 ships Chromium 152 while upstream builds at 155/156 exist. Largest structural risk of the approach. | a documented update cadence (follow Electron's ~8-week majors) and the Chromium version visible in About (already shown) |

### P1 — quality and verification gaps

* **Screen-reader pass** with NVDA and Narrator: **not done** (no screen reader could be run or observed from here). What exists instead: axe scans of every page and overlay surface in both themes, assertions on the accessibility tree, a Tab-order check ([docs/ACCESSIBILITY.md](docs/ACCESSIBILITY.md)), and an 11-task manual test plan for a person to run.
* **Secure DNS:** verify with a packet capture that lookups are actually encrypted (only the API call is verified). Not done: it needs an elevated capture on the machine.
* **OAuth popups:** test `window.open` flows against at least three real providers. Not done (needs real provider accounts).
* **Benchmarks:** repeat on a quiet machine with at least 5 samples and confidence intervals; add a mixed-origin workload (different sites, a video, a heavy SPA) for both browsers; add Speedometer/JetStream/MotionMark from the WebKit org (catalogued as High-value); add a `bench.js --assert` regression check; measure shutdown time, background network and keyboard-to-paint latency.
* ~~CI gating~~ Done: `ci.yml` runs on every push. Windows (required check on `main`): unit + e2e (including `a11y`, `tls`, `updates`, `background`), `npm audit`, the licence gate, packaging, the installer build, the packaged-app smoke test and an SBOM. Ubuntu and macOS run unit + e2e as an **informational** job (it cannot fail the build; read its log). Branch protection on `main` requires the Windows check, blocks force-push and deletion, and does not apply to the admin. Still to add: a scheduled run so dependency or runner changes are noticed.
* **Cross-platform:** evidence from CI. Ubuntu and macOS (arm64): 73 unit + 55 e2e pass. Earlier macOS failures were a Ctrl-vs-Cmd test bug (fixed) and a one-off session-restore timeout. The "app did not exit" observation turned out **not** to be macOS- or accessibility-specific: it is a narrow race on every OS, quitting right after switching the theme back to "System" (exit delayed up to ~53 s, idle); see DECISIONS.md bug 14 for the experiments and what was ruled out. Not done: macOS/Linux packaging, installers, signing/notarisation, hands-on testing on real hardware (see OWNER-STEPS.md 4c), Linux/macOS CI as a required check.
* ~~Per-tab favicon fetch~~ **Fixed 2026-10-13:** fetched by the main process through the tab's session, shown as `data:` URLs; the UI CSP forbids http(s) images (`favicon.test.js`).
* **Untested features:** find-in-page counting, zoom, native menus, pinning, drag-reorder, workspace rename/delete, auto-sleep timer path, clear-on-exit.
* **Replace the hard-coded tracking-parameter list with ClearURLs rules** (LGPL-3.0; check the data licence before bundling). Not started.
* **Widevine/DRM:** absent. Decide whether to evaluate castlabs ECS and the cost of production signing before promising streaming-service support.

### P2 — features (see [ROADMAP.md](docs/ROADMAP.md) and [SIGNATURE-FEATURES.md](docs/SIGNATURE-FEATURES.md))

| Version | Scope | Exit criterion |
|---|---|---|
| 0.3 "Read and find" | Reader mode (Mozilla Readability), extracted-text API, local semantic history (Transformers.js in a utility process), tab groups, horizontal-tab option, import from Chrome/Firefox with per-item consent | semantic search evaluated on ≥200 labelled queries with p95 latency recorded |
| 0.4 "Assist" (opt-in) | AI panel: local Ollama first, cloud providers behind per-provider consent; citations tied to extracted passages; prompt-injection corpus in CI | ≥50 injection pages show no unapproved action; every answer links to source text |
| 0.5 "Everywhere" | Linux/macOS, encrypted file-based sync, multi-window | per-platform test matrix green |
| Later | Fingerprint **uniformity** (not spoofing), authorised automation endpoint (highest risk, after the consent UX exists), mobile investigation, alternative engine host when Ladybird/Servo mature, extension compatibility when Electron's extension work matures | see ROADMAP |

Passwords, sync and AI are **not implemented**; their design constraints (OS keychain via `safeStorage`; end-to-end encrypted blob; local-first AI, page text as data never instructions, a click for any model-requested navigation) are written down in SECURITY.md so they are not reinvented under pressure.

### P3 — research follow-ups

* Re-run the discovery sweep in star bands of 10–149 for the 30 most on-target topics, and add Codeberg, GitLab, SourceHut, Flathub, F-Droid and distribution package lists ([SWEEP.md](docs/research/SWEEP.md) "What would raise coverage").
* Read the README of the 16 **Experimental** catalog entries and try the ones that build on Windows: Zervo (workspace browser on Servo), Fen, Starling, Gosub, Orinium, Retsurf, a Rust engine by lucid-softworks, and others.
* About 5,000 low-signal sweep candidates and 1,406 small on-topic repos were never read individually; they are in the TSV files.
* The classifications in `scripts/catalog-classification.js` and `scripts/catalog-additions.js` come from one-line descriptions and activity, not code review; treat them as triage, not endorsement.

---

## 10. Decisions that need a human

1. **Which signing route** (free open-source programme vs paid certificate) and **who is the publisher name** on the certificate.
2. **Project governance:** where the repository lives, who handles security reports, what the code-signing policy says.
3. **Process-sharing trade-off (only if memory ever matters again):** letting same-site tabs share renderer processes would save memory but weakens isolation. It is not needed for the current target, so it was *not* done.
4. **Extensions:** stay on a native "module" API (planned) or invest in Chrome-extension compatibility (Electron's subset is partial; the helper library is GPL-3.0). This reshapes the whole roadmap.
5. **Engine strategy:** stay on Electron (cheap, lags upstream Chromium) or move to a Chromium fork (best security cadence, very expensive). The ADR's revisit triggers say when to ask again.
6. **Licence boundary for reused code:** AGPL projects (for example BrowserOS, SingleFile) must not be mixed into this GPL code without adopting their network clause; "other" and no-licence projects are not reusable at all.

---

## 11. Honest limits of what is claimed

* Tests prove the listed behaviours on one operating system. They do not prove the absence of vulnerabilities.
* Performance figures are from two runs on one machine with a simple same-origin workload.
* The catalog is a wide net, not a census. The sweep is GitHub-centric and English-only; its classifications are my judgement.
* Signing was tested with a throwaway self-signed certificate; real signing, timestamping and SmartScreen behaviour are untested.
* The accessibility result is automated scans plus accessibility-tree assertions; no screen reader was run.
* The trademark search covered the US federal register only, on one date, and is not legal advice; it found nearby marks (see docs/TRADEMARK.md).

## 12. Where to look first

| If you want to… | Read |
|---|---|
| understand why Electron | [docs/adr/0001-architecture.md](docs/adr/0001-architecture.md) |
| see every decision and bug found | [docs/DECISIONS.md](docs/DECISIONS.md) |
| know what is tested vs not | [docs/FEATURE-MATRIX.md](docs/FEATURE-MATRIX.md) |
| judge security | [docs/SECURITY.md](docs/SECURITY.md) |
| see numbers and the benchmark correction | [docs/PERFORMANCE.md](docs/PERFORMANCE.md) |
| ship a release | [docs/RELEASE.md](docs/RELEASE.md), [docs/LICENSES.md](docs/LICENSES.md) |
| plan next work | [docs/ROADMAP.md](docs/ROADMAP.md) |
| find prior art for a feature | [docs/research/CATALOG.md](docs/research/CATALOG.md), [docs/SIGNATURE-FEATURES.md](docs/SIGNATURE-FEATURES.md) |
